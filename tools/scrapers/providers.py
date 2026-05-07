#!/usr/bin/env python3
"""Experimental Scrapling providers for PVPRP and OptiFine.

The Next.js API route shells out to this script and reads JSON from stdout.
Keep the output contract small and aligned with lib/modrinth/types.ts.
"""

from __future__ import annotations

import argparse
import contextlib
import json
import re
import sys
from dataclasses import asdict, dataclass
from html import unescape
from pathlib import PurePosixPath
from typing import Any
from urllib.parse import parse_qs, quote, unquote, urljoin, urlparse

from scrapling.fetchers import Fetcher


PVPRP_BASE = "https://pvprp.com"
OPTIFINE_BASE = "https://optifine.net"

PVPRP_VERSIONS = [
    "1.21",
    "1.20",
    "1.19",
    "1.18",
    "1.17",
    "1.16",
    "1.15",
    "1.14",
    "1.13",
    "1.12",
    "1.11",
    "1.10",
    "1.9",
    "1.8.9",
    "1.8",
    "1.7",
]


@dataclass
class SearchHit:
    project_id: str
    title: str
    description: str
    icon_url: str | None
    downloads: int
    categories: list[str]
    page_url: str


def fetch_html(url: str) -> str:
    with contextlib.redirect_stdout(sys.stderr):
        page = Fetcher.get(
            url,
            timeout=20,
            headers={"Accept-Language": "en-US,en;q=0.9"},
        )
    status = getattr(page, "status", 200)
    if status and int(status) >= 400:
        raise RuntimeError(f"HTTP {status}")
    content = getattr(page, "html_content", None)
    if content:
        return str(content)
    body = getattr(page, "body", b"")
    if isinstance(body, bytes):
        return body.decode(getattr(page, "encoding", None) or "utf-8", errors="replace")
    return str(body)


def clean_text(value: str | None) -> str:
    if not value:
        return ""
    value = re.sub(r"<[^>]+>", " ", value)
    return re.sub(r"\s+", " ", unescape(value)).strip()


def parse_count(value: str | None) -> int:
    text = clean_text(value).replace(",", ".")
    match = re.search(r"([\d.]+)\s*([KMB])?", text, re.I)
    if not match:
        return 0
    number = float(match.group(1))
    suffix = (match.group(2) or "").upper()
    multiplier = {"K": 1_000, "M": 1_000_000, "B": 1_000_000_000}.get(suffix, 1)
    return int(number * multiplier)


def proxied_download(source: str, url: str) -> str:
    return f"/api/scrapers/download?source={quote(source)}&url={quote(url, safe='')}"


def file_name_from_url(url: str, fallback: str) -> str:
    parsed = urlparse(url)
    if parsed.netloc.endswith("optifine.net") and parsed.path.endswith("/adloadx"):
        filename = parse_qs(parsed.query).get("f", [fallback])[0]
    else:
        filename = PurePosixPath(unquote(parsed.path)).name or fallback
    filename = filename.split("?")[0].strip()
    return filename or fallback


def pvprp_versions() -> list[str]:
    return PVPRP_VERSIONS


PVPRP_SORT = {
    "relevance": "newol",
    "newest": "newol",
    "updated": "newol",
    "oldest": "olnew",
    "name_az": "az",
    "name_za": "za",
    "downloads": "dd",
    "follows": "dd",
    "least_downloads": "da",
}


def pvprp_search(query: str, version: str, sort: str, offset: int, limit: int) -> dict[str, Any]:
    page = max(1, offset // max(limit, 1) + 1)
    params = [
        ("a", "search"),
        ("search-page", str(page)),
        ("sort", PVPRP_SORT.get(sort, "newol")),
    ]
    if query:
        params.append(("search-main", query))
    if version:
        params.append(("version", version))

    qs = "&".join(f"{quote(k)}={quote(v)}" for k, v in params)
    html = fetch_html(f"{PVPRP_BASE}/actions/search-t.php?{qs}").replace('"', "'")
    total = parse_count(re.search(r"id=['\"]results-amount['\"]>([^<]+)", html, re.I).group(1) if "results-amount" in html else None)

    hits: list[SearchHit] = []
    cards = re.split(r"<div class='in-grid pack-hov'>", html)[1:]
    for card in cards[:limit]:
        href_match = re.search(r"href=['\"]([^'\"]*pack\?p=(\d+)[^'\"]*)['\"]", card)
        title_match = re.search(r"<h3 class='f-mc white pack-title'>(.*?)</h3>", card, re.S)
        image_match = re.search(r"<img class='grid-banner' src=['\"]([^'\"]+)['\"][^>]*alt=['\"]([^'\"]*)['\"]", card, re.S)
        downloads_match = re.search(r"dow-ico.*?</div><h5 class='gray inline'>(.*?)</h5>", card, re.S)
        res_match = re.search(r"<div class='res f-mc white shadow'>(.*?)</div>", card, re.S)
        creator_match = re.search(r"/profile/([^'\"]+)", card)
        if not href_match or not title_match:
            continue

        pack_id = href_match.group(2)
        title = clean_text(title_match.group(1))
        creator = unquote(creator_match.group(1)) if creator_match else ""
        resolution = clean_text(res_match.group(1)) if res_match else ""
        categories = [c for c in [resolution, "PvP", version] if c]
        alt = clean_text(image_match.group(2)) if image_match else title
        description = f"{alt}."
        if creator:
            description = f"Resource pack by {creator} on PVPRP."

        hits.append(SearchHit(
            project_id=pack_id,
            title=title,
            description=description,
            icon_url=urljoin(PVPRP_BASE, unescape(image_match.group(1))) if image_match else None,
            downloads=parse_count(downloads_match.group(1) if downloads_match else None),
            categories=categories[:3],
            page_url=urljoin(PVPRP_BASE, unescape(href_match.group(1))),
        ))

    return {"hits": [asdict(hit) for hit in hits], "totalHits": total or len(hits)}


def pvprp_resolve(pack_id: str) -> dict[str, Any]:
    html = fetch_html(f"{PVPRP_BASE}/pack?p={quote(pack_id)}").replace('"', "'")
    title = clean_text(re.search(r"<h1[^>]*class=['\"][^'\"]*p-nm[^'\"]*['\"][^>]*>(.*?)</h1>", html, re.S).group(1) if "p-nm" in html else f"PVPRP {pack_id}")
    href_match = re.search(r"id=['\"]update-download['\"][^>]*href=['\"]([^'\"]+)['\"]", html)
    if not href_match:
        href_match = re.search(r"href=['\"]([^'\"]+\.(?:zip|rar|mcpack)(?:\?[^'\"]*)?)['\"]", html, re.I)
    if not href_match:
        href_match = re.search(r"\.attr\(['\"]href['\"],\s*['\"]([^'\"]+\.(?:zip|rar|mcpack)(?:\?[^'\"]*)?)['\"]\)", html, re.I)
    if not href_match:
        return {"ok": False, "reason": "no_compatible_version"}

    url = urljoin(PVPRP_BASE, unescape(href_match.group(1)))
    filename = file_name_from_url(url, f"{title}.zip")
    return {
        "ok": True,
        "version": {
            "versionNumber": pack_id,
            "file": {
                "url": proxied_download("pvprp", url),
                "filename": filename,
                "primary": True,
                "size": 0,
            },
            "sizeKb": None,
            "dependencies": [],
        },
    }


def pvprp_info(pack_id: str) -> dict[str, Any]:
    html = fetch_html(f"{PVPRP_BASE}/pack?p={quote(pack_id)}").replace('"', "'")
    title = clean_text(re.search(r"<h1[^>]*class=['\"][^'\"]*p-nm[^'\"]*['\"][^>]*>(.*?)</h1>", html, re.S).group(1) if "p-nm" in html else f"PVPRP {pack_id}")
    image = re.search(r"<meta property=['\"]og:image['\"] content=['\"]([^'\"]+)['\"]", html)
    return {"title": title, "iconUrl": image.group(1) if image else None}


def optifine_rows() -> list[dict[str, str]]:
    html = fetch_html(f"{OPTIFINE_BASE}/downloads").replace('"', "'")
    rows: list[dict[str, str]] = []
    current_version = ""
    parts = re.split(r"(<h2>\s*Minecraft\s+[^<]+</h2>)", html)
    for idx in range(1, len(parts), 2):
        heading = clean_text(parts[idx])
        current_version = heading.replace("Minecraft ", "", 1).strip()
        section = parts[idx + 1]
        for row in re.findall(r"<tr class='downloadLine[^']*'>(.*?)</tr>", section, re.S):
            name = clean_text(re.search(r"<td class='colFile'>(.*?)</td>", row, re.S).group(1) if "colFile" in row else "")
            mirror = re.search(r"<td class='colMirror'><a href=['\"]([^'\"]+)['\"]", row, re.S)
            date = clean_text(re.search(r"<td class='colDate'>(.*?)</td>", row, re.S).group(1) if "colDate" in row else "")
            forge = clean_text(re.search(r"<td class='colForge'>(.*?)</td>", row, re.S).group(1) if "colForge" in row else "")
            if not name or not mirror:
                continue
            url = urljoin(OPTIFINE_BASE, mirror.group(1).replace("http://", "https://"))
            filename = file_name_from_url(url, f"OptiFine_{current_version}.jar")
            rows.append({
                "id": filename,
                "minecraft": current_version,
                "name": name,
                "url": url,
                "filename": filename,
                "date": date,
                "forge": forge,
            })
    return rows


def optifine_versions() -> list[str]:
    return list(dict.fromkeys(row["minecraft"] for row in optifine_rows()))


def optifine_search(query: str, version: str, sort: str, offset: int, limit: int) -> dict[str, Any]:
    query_lower = query.lower()
    rows = [
        row for row in optifine_rows()
        if (not version or row["minecraft"] == version)
        and (not query_lower or query_lower in row["name"].lower() or query_lower in row["filename"].lower())
    ]
    if sort == "oldest":
        rows.reverse()
    elif sort == "name_az":
        rows.sort(key=lambda row: row["name"].lower())
    elif sort == "name_za":
        rows.sort(key=lambda row: row["name"].lower(), reverse=True)
    hits = []
    for row in rows[offset:offset + limit]:
        categories = ["OptiFine", row["minecraft"]]
        if row["forge"]:
            categories.append(row["forge"])
        desc = f"OptiFine build for Minecraft {row['minecraft']}."
        if row["date"]:
            desc += f" Published {row['date']}."
        hits.append(SearchHit(
            project_id=row["id"],
            title=row["name"],
            description=desc,
            icon_url=None,
            downloads=0,
            categories=categories[:3],
            page_url=f"{OPTIFINE_BASE}/downloads",
        ))
    return {"hits": [asdict(hit) for hit in hits], "totalHits": len(rows)}


def optifine_direct_url(adload_url: str) -> str:
    html = fetch_html(adload_url).replace('"', "'")
    direct = re.search(r"href='([^']*downloadx\?f=[^']+)'", html)
    if not direct:
        return adload_url
    return urljoin(OPTIFINE_BASE, unescape(direct.group(1)).replace("http://", "https://"))


def optifine_resolve(file_id: str) -> dict[str, Any]:
    row = next((candidate for candidate in optifine_rows() if candidate["id"] == file_id), None)
    if not row:
        return {"ok": False, "reason": "not_found"}
    direct_url = optifine_direct_url(row["url"])
    return {
        "ok": True,
        "version": {
            "versionNumber": row["name"],
            "file": {
                "url": proxied_download("optifine", direct_url),
                "filename": row["filename"],
                "primary": True,
                "size": 0,
            },
            "sizeKb": None,
            "dependencies": [],
        },
    }


def optifine_info(file_id: str) -> dict[str, Any]:
    row = next((candidate for candidate in optifine_rows() if candidate["id"] == file_id), None)
    return {"title": row["name"] if row else file_id, "iconUrl": None}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("provider", choices=["pvprp", "optifine"])
    parser.add_argument("action", choices=["versions", "search", "resolve", "info"])
    parser.add_argument("--query", default="")
    parser.add_argument("--version", default="")
    parser.add_argument("--sort", default="newest")
    parser.add_argument("--offset", type=int, default=0)
    parser.add_argument("--limit", type=int, default=20)
    parser.add_argument("--id", default="")
    args = parser.parse_args()

    try:
        if args.provider == "pvprp":
            data = {
                "versions": pvprp_versions,
                "search": lambda: pvprp_search(args.query, args.version, args.sort, args.offset, args.limit),
                "resolve": lambda: pvprp_resolve(args.id),
                "info": lambda: pvprp_info(args.id),
            }[args.action]()
        else:
            data = {
                "versions": optifine_versions,
                "search": lambda: optifine_search(args.query, args.version, args.sort, args.offset, args.limit),
                "resolve": lambda: optifine_resolve(args.id),
                "info": lambda: optifine_info(args.id),
            }[args.action]()
        print(json.dumps(data, ensure_ascii=False))
        return 0
    except Exception as exc:
        print(json.dumps({"error": str(exc)}, ensure_ascii=False), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
