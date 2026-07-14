use std::{
    env, fs,
    io::{self, IsTerminal},
    path::{Path, PathBuf},
    process::Command as ProcessCommand,
    time::Duration,
};

use anyhow::{anyhow, Context, Result};
use clap::{Parser, Subcommand, ValueEnum};
use crossterm::{
    event::{self, Event, KeyCode},
    execute,
    terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},
};
use futures_util::StreamExt;
use ratatui::{
    backend::CrosstermBackend,
    layout::{Constraint, Direction, Layout, Rect},
    style::{Color, Modifier, Style},
    text::{Line, Span},
    widgets::{Block, Borders, List, ListItem, ListState, Paragraph},
    Terminal,
};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use tokio::{fs::File, io::AsyncWriteExt};
use url::Url;

const CF_BASE: &str = "https://api.curseforge.com/v1";
const MODRINTH_BASE: &str = "https://api.modrinth.com/v2";
const MINECRAFT_GAME_ID: u32 = 432;
const BEDROCK_GAME_ID: u32 = 78022;
const HYTALE_GAME_ID: u32 = 70216;

#[derive(Parser)]
#[command(
    name = "dynrinth",
    version,
    about = "Search and download Dynrinth-supported content from the terminal"
)]
struct Cli {
    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand)]
enum Command {
    /// Search or browse projects.
    Search {
        query: Option<String>,
        #[arg(short, long, default_value = "modrinth")]
        source: Source,
        #[arg(short, long)]
        content: Option<ContentType>,
        #[arg(short, long)]
        version: Option<String>,
        #[arg(long, default_value_t = 20)]
        limit: u32,
        #[arg(long, default_value_t = 0)]
        offset: u32,
        #[arg(long)]
        json: bool,
    },
    /// List available game versions for a source.
    Versions {
        #[arg(short, long, default_value = "modrinth")]
        source: Source,
        #[arg(long)]
        json: bool,
    },
    /// Resolve the downloadable file for a project.
    Resolve {
        project_id: String,
        #[arg(short, long, default_value = "modrinth")]
        source: Source,
        #[arg(short, long)]
        content: Option<ContentType>,
        #[arg(short, long)]
        version: Option<String>,
        #[arg(long)]
        loader: Option<Loader>,
        #[arg(long)]
        json: bool,
    },
    /// Resolve and download a project file.
    Download {
        project_id: String,
        #[arg(short, long, default_value = "modrinth")]
        source: Source,
        #[arg(short, long)]
        content: Option<ContentType>,
        #[arg(short, long)]
        version: Option<String>,
        #[arg(long)]
        loader: Option<Loader>,
        #[arg(short, long, default_value = ".")]
        out: PathBuf,
    },
    /// Interactive terminal UI.
    Tui {
        #[arg(short, long, default_value = "modrinth")]
        source: Source,
    },
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, ValueEnum, Serialize)]
#[serde(rename_all = "kebab-case")]
enum Source {
    Modrinth,
    Curseforge,
    Bedrock,
    Hytale,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, ValueEnum, Serialize)]
#[serde(rename_all = "kebab-case")]
enum ContentType {
    Mod,
    Plugin,
    Datapack,
    Resourcepack,
    Shader,
    Addon,
    Map,
    TexturePack,
    Script,
    Skin,
    Prefab,
    World,
    Bootstrap,
    Translation,
}

#[derive(Clone, Copy, Debug, ValueEnum)]
enum Loader {
    Fabric,
    Forge,
    Neoforge,
    Quilt,
}

#[derive(Debug, Serialize)]
struct SearchResult {
    id: String,
    title: String,
    description: String,
    downloads: u64,
    categories: Vec<String>,
    url: Option<String>,
}

#[derive(Debug, Serialize)]
struct SearchPage {
    total: u64,
    results: Vec<SearchResult>,
}

#[derive(Debug, Serialize)]
struct ResolvedFile {
    project_id: String,
    file_id: String,
    filename: String,
    download_url: String,
    size_bytes: u64,
    version: Option<String>,
}

#[derive(Debug, Deserialize)]
struct CfSearchResponse {
    data: Vec<CfMod>,
    pagination: CfPagination,
}

#[derive(Debug, Deserialize)]
struct CfPagination {
    #[serde(rename = "totalCount")]
    total_count: u64,
}

#[derive(Debug, Deserialize)]
struct CfMod {
    id: u64,
    name: String,
    summary: String,
    #[serde(rename = "downloadCount")]
    download_count: u64,
    categories: Vec<CfCategory>,
    links: Option<CfLinks>,
}

#[derive(Debug, Deserialize)]
struct CfCategory {
    name: String,
}

#[derive(Debug, Deserialize)]
struct CfLinks {
    #[serde(rename = "websiteUrl")]
    website_url: Option<String>,
}

#[derive(Debug, Deserialize)]
struct CfVersionGroup {
    versions: Vec<String>,
}

#[derive(Debug, Deserialize)]
struct CfVersionsResponse {
    data: Vec<CfVersionGroup>,
}

#[derive(Debug, Deserialize)]
struct CfFilesResponse {
    data: Vec<CfFile>,
}

#[derive(Debug, Deserialize)]
struct CfFile {
    id: u64,
    #[serde(rename = "fileName")]
    file_name: String,
    #[serde(rename = "downloadUrl")]
    download_url: Option<String>,
    #[serde(rename = "fileLength")]
    file_length: u64,
    #[serde(rename = "gameVersions")]
    game_versions: Vec<String>,
}

#[derive(Debug, Deserialize)]
struct MrSearchResponse {
    hits: Vec<MrHit>,
    #[serde(rename = "total_hits")]
    total_hits: u64,
}

#[derive(Debug, Deserialize)]
struct MrHit {
    #[serde(rename = "project_id")]
    project_id: String,
    title: String,
    description: String,
    downloads: u64,
    categories: Vec<String>,
    slug: String,
    #[serde(rename = "project_type")]
    project_type: String,
}

#[derive(Debug, Deserialize)]
struct MrVersion {
    #[serde(rename = "version_number")]
    version_number: String,
    files: Vec<MrFile>,
}

#[derive(Debug, Deserialize)]
struct MrFile {
    url: String,
    filename: String,
    primary: bool,
    size: u64,
}

#[tokio::main]
async fn main() -> Result<()> {
    load_dotenv_local();
    let cli = Cli::parse();
    let client = Client::builder().user_agent("curl/8.20.0").build()?;

    match cli.command {
        Command::Search {
            query,
            source,
            content,
            version,
            limit,
            offset,
            json,
        } => {
            let query = query.unwrap_or_default();
            let page = search(
                &client,
                source,
                content.unwrap_or(default_content(source)),
                &query,
                version.as_deref(),
                limit,
                offset,
            )
            .await?;
            if json {
                println!("{}", serde_json::to_string_pretty(&page)?);
            } else {
                print_search_page(&page);
            }
        }
        Command::Versions { source, json } => {
            let versions = versions(&client, source).await?;
            if json {
                println!("{}", serde_json::to_string_pretty(&versions)?);
            } else {
                for version in versions {
                    println!("{version}");
                }
            }
        }
        Command::Resolve {
            project_id,
            source,
            content,
            version,
            loader,
            json,
        } => {
            let resolved = resolve(
                &client,
                source,
                content.unwrap_or(default_content(source)),
                &project_id,
                version.as_deref(),
                loader,
            )
            .await?;
            if json {
                println!("{}", serde_json::to_string_pretty(&resolved)?);
            } else {
                println!("{} -> {}", resolved.filename, resolved.download_url);
            }
        }
        Command::Download {
            project_id,
            source,
            content,
            version,
            loader,
            out,
        } => {
            let resolved = resolve(
                &client,
                source,
                content.unwrap_or(default_content(source)),
                &project_id,
                version.as_deref(),
                loader,
            )
            .await?;
            download_file(&client, &resolved, &out).await?;
        }
        Command::Tui { source } => run_tui(&client, source).await?,
    }

    Ok(())
}

fn load_dotenv_local() {
    let mut dir = env::current_dir().ok();
    while let Some(current) = dir {
        let candidate = current.join(".env.local");
        if let Ok(text) = fs::read_to_string(&candidate) {
            for line in text.lines() {
                let trimmed = line.trim();
                if trimmed.is_empty() || trimmed.starts_with('#') {
                    continue;
                }
                let Some((key, value)) = trimmed.split_once('=') else {
                    continue;
                };
                let key = key.trim();
                if env::var_os(key).is_none() {
                    let trimmed = value.trim();
                    let parsed = if key == "CURSEFORGE_API_KEY"
                        && trimmed.contains('$')
                        && !trimmed.starts_with(['"', '\''])
                    {
                        shell_source_var(&candidate, key)
                            .unwrap_or_else(|| trimmed.trim_matches(['"', '\'']).to_string())
                    } else {
                        trimmed.trim_matches(['"', '\'']).to_string()
                    };
                    env::set_var(key, parsed);
                }
            }
            break;
        }
        dir = current.parent().map(Path::to_path_buf);
    }
}

fn shell_source_var(env_file: &Path, key: &str) -> Option<String> {
    let output = ProcessCommand::new("bash")
        .arg("-lc")
        .arg(format!("set -a; . \"$ENV_FILE\"; printf %s \"${key}\""))
        .env("ENV_FILE", env_file)
        .output()
        .ok()?;
    if !output.status.success() {
        return None;
    }
    Some(String::from_utf8_lossy(&output.stdout).to_string())
}

fn default_content(source: Source) -> ContentType {
    match source {
        Source::Bedrock => ContentType::Addon,
        _ => ContentType::Mod,
    }
}

async fn search(
    client: &Client,
    source: Source,
    content: ContentType,
    query: &str,
    version: Option<&str>,
    limit: u32,
    offset: u32,
) -> Result<SearchPage> {
    match source {
        Source::Modrinth => modrinth_search(client, content, query, version, limit, offset).await,
        Source::Curseforge | Source::Bedrock | Source::Hytale => {
            curseforge_search(client, source, content, query, version, limit, offset).await
        }
    }
}

async fn versions(client: &Client, source: Source) -> Result<Vec<String>> {
    match source {
        Source::Modrinth => {
            #[derive(Deserialize)]
            struct GameVersion {
                version: String,
                #[serde(rename = "version_type")]
                version_type: String,
            }
            let data: Vec<GameVersion> = client
                .get(format!("{MODRINTH_BASE}/tag/game_version"))
                .send()
                .await?
                .error_for_status()?
                .json()
                .await?;
            Ok(data
                .into_iter()
                .filter(|v| v.version_type == "release")
                .map(|v| v.version)
                .collect())
        }
        Source::Curseforge => {
            #[derive(Deserialize)]
            struct MinecraftVersion {
                #[serde(rename = "versionString")]
                version_string: String,
            }
            #[derive(Deserialize)]
            struct Resp {
                data: Vec<MinecraftVersion>,
            }
            let data: Resp = cf_get(client, "/minecraft/version").await?;
            Ok(data.data.into_iter().map(|v| v.version_string).collect())
        }
        Source::Bedrock | Source::Hytale => {
            let game_id = game_id(source);
            let data: CfVersionsResponse =
                cf_get(client, &format!("/games/{game_id}/versions")).await?;
            let mut versions = data
                .data
                .into_iter()
                .flat_map(|g| g.versions)
                .collect::<Vec<_>>();
            versions.sort_by(|a, b| b.cmp(a));
            versions.dedup();
            Ok(versions)
        }
    }
}

async fn resolve(
    client: &Client,
    source: Source,
    content: ContentType,
    project_id: &str,
    version: Option<&str>,
    loader: Option<Loader>,
) -> Result<ResolvedFile> {
    match source {
        Source::Modrinth => modrinth_resolve(client, content, project_id, version, loader).await,
        Source::Curseforge | Source::Bedrock | Source::Hytale => {
            curseforge_resolve(client, source, content, project_id, version, loader).await
        }
    }
}

async fn curseforge_search(
    client: &Client,
    source: Source,
    content: ContentType,
    query: &str,
    version: Option<&str>,
    limit: u32,
    offset: u32,
) -> Result<SearchPage> {
    let mut params = vec![
        ("gameId".to_string(), game_id(source).to_string()),
        ("index".to_string(), offset.to_string()),
        ("pageSize".to_string(), limit.to_string()),
        ("sortField".to_string(), "2".to_string()),
        ("sortOrder".to_string(), "desc".to_string()),
    ];
    if let Some(class_id) = class_id(source, content) {
        params.push(("classId".to_string(), class_id.to_string()));
    }
    if !query.is_empty() {
        params.push(("searchFilter".to_string(), query.to_string()));
    }
    if let Some(version) = version {
        params.push(("gameVersion".to_string(), version.to_string()));
    }

    let data: CfSearchResponse = cf_get_with_params(client, "/mods/search", &params).await?;
    Ok(SearchPage {
        total: data.pagination.total_count,
        results: data
            .data
            .into_iter()
            .map(|m| SearchResult {
                id: m.id.to_string(),
                title: m.name,
                description: m.summary,
                downloads: m.download_count,
                categories: m.categories.into_iter().map(|c| c.name).collect(),
                url: m.links.and_then(|l| l.website_url),
            })
            .collect(),
    })
}

async fn curseforge_resolve(
    client: &Client,
    source: Source,
    content: ContentType,
    project_id: &str,
    version: Option<&str>,
    loader: Option<Loader>,
) -> Result<ResolvedFile> {
    let mut params = vec![
        ("pageSize".to_string(), "1".to_string()),
        ("index".to_string(), "0".to_string()),
    ];
    if let Some(version) = version {
        params.push(("gameVersion".to_string(), version.to_string()));
    }
    if matches!(source, Source::Curseforge) && matches!(content, ContentType::Mod) {
        if let Some(loader) = loader {
            params.push(("modLoaderType".to_string(), loader_type(loader).to_string()));
        }
    }

    let data: CfFilesResponse =
        cf_get_with_params(client, &format!("/mods/{project_id}/files"), &params).await?;
    let file = data
        .data
        .into_iter()
        .next()
        .ok_or_else(|| anyhow!("no compatible file found"))?;
    let download_url = file
        .download_url
        .ok_or_else(|| anyhow!("distribution disabled by author"))?;
    Ok(ResolvedFile {
        project_id: project_id.to_string(),
        file_id: file.id.to_string(),
        filename: file.file_name,
        download_url,
        size_bytes: file.file_length,
        version: file.game_versions.into_iter().next(),
    })
}

async fn modrinth_search(
    client: &Client,
    content: ContentType,
    query: &str,
    version: Option<&str>,
    limit: u32,
    offset: u32,
) -> Result<SearchPage> {
    let project_type = modrinth_project_type(content)?;
    let mut facets = vec![vec![format!("project_type:{project_type}")]];
    if let Some(version) = version {
        facets.push(vec![format!("versions:{version}")]);
    }
    let mut url = Url::parse(&format!("{MODRINTH_BASE}/search"))?;
    url.query_pairs_mut()
        .append_pair("facets", &serde_json::to_string(&facets)?)
        .append_pair("limit", &limit.to_string())
        .append_pair("offset", &offset.to_string())
        .append_pair("index", "relevance");
    if !query.is_empty() {
        url.query_pairs_mut().append_pair("query", query);
    }
    let data: MrSearchResponse = client
        .get(url)
        .send()
        .await?
        .error_for_status()?
        .json()
        .await?;
    Ok(SearchPage {
        total: data.total_hits,
        results: data
            .hits
            .into_iter()
            .map(|h| SearchResult {
                id: h.project_id,
                title: h.title,
                description: h.description,
                downloads: h.downloads,
                categories: h.categories,
                url: Some(format!(
                    "https://modrinth.com/{}/{}",
                    h.project_type, h.slug
                )),
            })
            .collect(),
    })
}

async fn modrinth_resolve(
    client: &Client,
    content: ContentType,
    project_id: &str,
    version: Option<&str>,
    loader: Option<Loader>,
) -> Result<ResolvedFile> {
    let _ = modrinth_project_type(content)?;
    let mut url = Url::parse(&format!("{MODRINTH_BASE}/project/{project_id}/version"))?;
    if let Some(version) = version {
        url.query_pairs_mut()
            .append_pair("game_versions", &serde_json::to_string(&[version])?);
    }
    if matches!(content, ContentType::Mod) {
        if let Some(loader) = loader {
            url.query_pairs_mut()
                .append_pair("loaders", &serde_json::to_string(&[loader_slug(loader)])?);
        }
    }
    let versions: Vec<MrVersion> = client
        .get(url)
        .send()
        .await?
        .error_for_status()?
        .json()
        .await?;
    let version = versions
        .into_iter()
        .next()
        .ok_or_else(|| anyhow!("no compatible version found"))?;
    let file = version
        .files
        .into_iter()
        .find(|f| f.primary)
        .ok_or_else(|| anyhow!("version has no primary file"))?;
    Ok(ResolvedFile {
        project_id: project_id.to_string(),
        file_id: version.version_number.clone(),
        filename: file.filename,
        download_url: file.url,
        size_bytes: file.size,
        version: Some(version.version_number),
    })
}

async fn cf_get<T: for<'de> Deserialize<'de>>(client: &Client, path: &str) -> Result<T> {
    cf_get_with_params(client, path, &[]).await
}

async fn cf_get_with_params<T: for<'de> Deserialize<'de>>(
    client: &Client,
    path: &str,
    params: &[(String, String)],
) -> Result<T> {
    let _ = client;
    let key = env::var("CURSEFORGE_API_KEY")
        .context("CURSEFORGE_API_KEY is required for CurseForge sources")?;
    let mut url = Url::parse(&format!("{CF_BASE}{path}"))?;
    if !params.is_empty() {
        url.query_pairs_mut()
            .extend_pairs(params.iter().map(|(k, v)| (&**k, &**v)));
    }

    let output = ProcessCommand::new("curl")
        .arg("-fsSL")
        .arg("-H")
        .arg("Accept: application/json")
        .arg("-H")
        .arg(format!("x-api-key: {key}"))
        .arg(url.as_str())
        .output()
        .context("failed to execute curl for CurseForge API request")?;

    if !output.status.success() {
        return Err(anyhow!(
            "CurseForge API request failed for {}: {}",
            url,
            String::from_utf8_lossy(&output.stderr).trim()
        ));
    }

    Ok(serde_json::from_slice(&output.stdout)?)
}

fn game_id(source: Source) -> u32 {
    match source {
        Source::Curseforge => MINECRAFT_GAME_ID,
        Source::Bedrock => BEDROCK_GAME_ID,
        Source::Hytale => HYTALE_GAME_ID,
        Source::Modrinth => MINECRAFT_GAME_ID,
    }
}

fn class_id(source: Source, content: ContentType) -> Option<u32> {
    match source {
        Source::Curseforge => match content {
            ContentType::Mod => Some(6),
            ContentType::Plugin => Some(5),
            ContentType::Datapack => Some(6945),
            ContentType::Resourcepack => Some(12),
            ContentType::Shader => Some(6552),
            _ => None,
        },
        Source::Bedrock => match content {
            ContentType::Addon => Some(4984),
            ContentType::Map => Some(6913),
            ContentType::TexturePack => Some(6929),
            ContentType::Script => Some(6940),
            ContentType::Skin => Some(6925),
            _ => None,
        },
        Source::Hytale => match content {
            ContentType::Mod => Some(9137),
            ContentType::Prefab => Some(9185),
            ContentType::World => Some(9184),
            ContentType::Bootstrap => Some(9281),
            ContentType::Translation => Some(10350),
            _ => None,
        },
        Source::Modrinth => None,
    }
}

fn loader_type(loader: Loader) -> u32 {
    match loader {
        Loader::Forge => 1,
        Loader::Fabric => 4,
        Loader::Quilt => 5,
        Loader::Neoforge => 6,
    }
}

fn loader_slug(loader: Loader) -> &'static str {
    match loader {
        Loader::Fabric => "fabric",
        Loader::Forge => "forge",
        Loader::Neoforge => "neoforge",
        Loader::Quilt => "quilt",
    }
}

fn modrinth_project_type(content: ContentType) -> Result<&'static str> {
    match content {
        ContentType::Mod => Ok("mod"),
        ContentType::Plugin => Ok("plugin"),
        ContentType::Datapack => Ok("datapack"),
        ContentType::Resourcepack => Ok("resourcepack"),
        ContentType::Shader => Ok("shader"),
        _ => Err(anyhow!("content type is not supported by Modrinth")),
    }
}

fn print_search_page(page: &SearchPage) {
    println!("{} result(s)", page.total);
    for result in &page.results {
        let cats = if result.categories.is_empty() {
            String::new()
        } else {
            format!(" [{}]", result.categories.join(", "))
        };
        println!(
            "{}  {}  {} downloads{}",
            result.id, result.title, result.downloads, cats
        );
        if let Some(url) = &result.url {
            println!("  {url}");
        }
        println!("  {}", result.description);
    }
}

async fn download_file(client: &Client, resolved: &ResolvedFile, out: &Path) -> Result<()> {
    let destination = if out.is_dir() || out.extension().is_none() {
        fs::create_dir_all(out)?;
        out.join(&resolved.filename)
    } else {
        out.to_path_buf()
    };
    let response = client
        .get(&resolved.download_url)
        .send()
        .await?
        .error_for_status()?;
    let mut stream = response.bytes_stream();
    let mut file = File::create(&destination).await?;
    while let Some(chunk) = stream.next().await {
        file.write_all(&chunk?).await?;
    }
    println!("{}", destination.display());
    Ok(())
}

struct TuiState {
    source: Source,
    content: ContentType,
    query: String,
    results: Vec<SearchResult>,
    selected: usize,
    total: u64,
    offset: u32,
    limit: u32,
    status: String,
    resolved: Option<ResolvedFile>,
}

async fn run_tui(client: &Client, source: Source) -> Result<()> {
    if !io::stdout().is_terminal() {
        return Err(anyhow!("tui requires an interactive terminal"));
    }

    enable_raw_mode()?;
    let mut stdout = io::stdout();
    execute!(stdout, EnterAlternateScreen)?;
    let backend = CrosstermBackend::new(stdout);
    let mut terminal = Terminal::new(backend)?;

    let mut state = TuiState {
        source,
        content: default_content(source),
        query: String::new(),
        results: Vec::new(),
        selected: 0,
        total: 0,
        offset: 0,
        limit: 20,
        status: "Loading...".to_string(),
        resolved: None,
    };
    refresh_tui(client, &mut state).await;

    let result = loop {
        terminal.draw(|frame| {
            let root = Layout::default()
                .direction(Direction::Vertical)
                .constraints([
                    Constraint::Length(3),
                    Constraint::Length(3),
                    Constraint::Min(8),
                    Constraint::Length(5),
                ])
                .split(frame.area());

            let title = Paragraph::new(Line::from(vec![
                Span::styled(
                    "Dynrinth CLI",
                    Style::default()
                        .fg(Color::Green)
                        .add_modifier(Modifier::BOLD),
                ),
                Span::raw(format!(
                    "  source: {}  content: {}  page: {}-{} / {}",
                    source_label(state.source),
                    content_label(state.content),
                    state.offset + usize::from(!state.results.is_empty()) as u32,
                    state.offset + state.results.len() as u32,
                    state.total,
                )),
            ]))
            .block(Block::default().borders(Borders::ALL));
            frame.render_widget(title, root[0]);

            let search_box = Paragraph::new(state.query.as_str())
                .style(Style::default().fg(Color::White))
                .block(
                    Block::default()
                        .borders(Borders::ALL)
                        .title("Search filter"),
                );
            frame.render_widget(search_box, root[1]);

            let body = Layout::default()
                .direction(Direction::Horizontal)
                .constraints([Constraint::Percentage(52), Constraint::Percentage(48)])
                .split(root[2]);

            let items = if state.results.is_empty() {
                vec![ListItem::new("No results yet")]
            } else {
                state
                    .results
                    .iter()
                    .enumerate()
                    .map(|(idx, item)| {
                        let prefix = if idx == state.selected { ">" } else { " " };
                        let style = if idx == state.selected {
                            Style::default()
                                .fg(Color::Green)
                                .add_modifier(Modifier::BOLD)
                        } else {
                            Style::default()
                        };
                        ListItem::new(Line::from(vec![
                            Span::styled(prefix, style),
                            Span::raw(" "),
                            Span::styled(item.title.as_str(), style),
                            Span::raw(format!("  {}", format_downloads(item.downloads))),
                        ]))
                    })
                    .collect::<Vec<_>>()
            };
            let mut list_state = ListState::default().with_selected(if state.results.is_empty() {
                None
            } else {
                Some(state.selected)
            });
            frame.render_stateful_widget(
                List::new(items)
                    .highlight_style(
                        Style::default()
                            .fg(Color::Green)
                            .add_modifier(Modifier::BOLD),
                    )
                    .block(Block::default().borders(Borders::ALL).title("Browse")),
                body[0],
                &mut list_state,
            );

            let detail = selected_detail(&state);
            frame.render_widget(
                Paragraph::new(detail)
                    .wrap(ratatui::widgets::Wrap { trim: true })
                    .block(Block::default().borders(Borders::ALL).title("Details")),
                body[1],
            );

            let help = Paragraph::new(vec![
                Line::from("Enter refresh | Arrows select | F2 source | Tab type | PgUp/PgDn page"),
                Line::from("r resolve | d download | q/Esc quit"),
                Line::from(Span::styled(
                    state.status.as_str(),
                    Style::default().fg(Color::Yellow),
                )),
            ])
            .block(Block::default().borders(Borders::ALL));
            frame.render_widget(help, root[3]);
        })?;

        if event::poll(Duration::from_millis(250))? {
            if let Event::Key(key) = event::read()? {
                match key.code {
                    KeyCode::Esc | KeyCode::Char('q') => break Ok(()),
                    KeyCode::Backspace => {
                        state.query.pop();
                        state.status.clear();
                    }
                    KeyCode::Enter => {
                        state.offset = 0;
                        state.status = "Loading...".to_string();
                        terminal.draw(|frame| render_loading(frame.area(), frame, &state))?;
                        refresh_tui(client, &mut state).await;
                    }
                    KeyCode::Down => {
                        if !state.results.is_empty() {
                            state.selected = (state.selected + 1).min(state.results.len() - 1);
                            state.resolved = None;
                        }
                    }
                    KeyCode::Up => {
                        state.selected = state.selected.saturating_sub(1);
                        state.resolved = None;
                    }
                    KeyCode::PageDown => {
                        if state.offset + state.limit < state.total as u32 {
                            state.offset += state.limit;
                            state.status = "Loading next page...".to_string();
                            terminal.draw(|frame| render_loading(frame.area(), frame, &state))?;
                            refresh_tui(client, &mut state).await;
                        }
                    }
                    KeyCode::PageUp => {
                        if state.offset > 0 {
                            state.offset = state.offset.saturating_sub(state.limit);
                            state.status = "Loading previous page...".to_string();
                            terminal.draw(|frame| render_loading(frame.area(), frame, &state))?;
                            refresh_tui(client, &mut state).await;
                        }
                    }
                    KeyCode::Tab => {
                        state.content = next_content(state.source, state.content);
                        state.offset = 0;
                        state.status = format!("Loading {}...", content_label(state.content));
                        terminal.draw(|frame| render_loading(frame.area(), frame, &state))?;
                        refresh_tui(client, &mut state).await;
                    }
                    KeyCode::F(2) => {
                        state.source = next_source(state.source);
                        state.content = default_content(state.source);
                        state.offset = 0;
                        state.status = format!("Loading {}...", source_label(state.source));
                        terminal.draw(|frame| render_loading(frame.area(), frame, &state))?;
                        refresh_tui(client, &mut state).await;
                    }
                    KeyCode::Char('r') => {
                        if let Some(item) = state.results.get(state.selected) {
                            state.status = "Resolving...".to_string();
                            match resolve(client, state.source, state.content, &item.id, None, None)
                                .await
                            {
                                Ok(file) => {
                                    state.status = format!("Resolved {}", file.filename);
                                    state.resolved = Some(file);
                                }
                                Err(error) => state.status = format!("Resolve failed: {error}"),
                            }
                        }
                    }
                    KeyCode::Char('d') => {
                        if let Some(item) = state.results.get(state.selected) {
                            state.status = "Downloading...".to_string();
                            let resolved = match state.resolved.take() {
                                Some(file) => Ok(file),
                                None => {
                                    resolve(
                                        client,
                                        state.source,
                                        state.content,
                                        &item.id,
                                        None,
                                        None,
                                    )
                                    .await
                                }
                            };
                            match resolved {
                                Ok(file) => {
                                    let filename = file.filename.clone();
                                    match download_file(client, &file, Path::new("./mods")).await {
                                        Ok(()) => {
                                            state.status = format!("Downloaded ./mods/{filename}");
                                            state.resolved = Some(file);
                                        }
                                        Err(error) => {
                                            state.status = format!("Download failed: {error}")
                                        }
                                    }
                                }
                                Err(error) => state.status = format!("Resolve failed: {error}"),
                            }
                        }
                    }
                    KeyCode::Char(c) => {
                        state.query.push(c);
                        state.status = "Press Enter to apply filter.".to_string();
                    }
                    _ => {}
                }
            }
        }
    };

    disable_raw_mode()?;
    execute!(terminal.backend_mut(), LeaveAlternateScreen)?;
    terminal.show_cursor()?;
    result
}

async fn refresh_tui(client: &Client, state: &mut TuiState) {
    match search(
        client,
        state.source,
        state.content,
        &state.query,
        None,
        state.limit,
        state.offset,
    )
    .await
    {
        Ok(page) => {
            state.total = page.total;
            state.results = page.results;
            state.selected = 0;
            state.resolved = None;
            let label = if state.query.is_empty() {
                "items"
            } else {
                "filtered items"
            };
            state.status = format!("{} {label}", state.total);
        }
        Err(error) => {
            state.results.clear();
            state.total = 0;
            state.selected = 0;
            state.resolved = None;
            state.status = format!("Load failed: {error}");
        }
    }
}

fn render_loading(frame_area: Rect, frame: &mut ratatui::Frame<'_>, state: &TuiState) {
    let query = if state.query.is_empty() {
        String::from("without filter")
    } else {
        format!("matching \"{}\"", state.query)
    };
    let block = Paragraph::new(format!(
        "Loading {} {} from {}...",
        content_label(state.content),
        query,
        source_label(state.source),
    ))
    .block(Block::default().borders(Borders::ALL).title("Dynrinth CLI"));
    frame.render_widget(block, frame_area);
}

fn selected_detail(state: &TuiState) -> String {
    let Some(item) = state.results.get(state.selected) else {
        return "No content loaded for this source/type/filter.".to_string();
    };
    let mut lines = vec![
        item.title.clone(),
        format!("ID: {}", item.id),
        format!("Downloads: {}", format_downloads(item.downloads)),
    ];
    if !item.categories.is_empty() {
        lines.push(format!("Categories: {}", item.categories.join(", ")));
    }
    if let Some(url) = &item.url {
        lines.push(format!("URL: {url}"));
    }
    lines.push(String::new());
    lines.push(item.description.clone());
    if let Some(file) = &state.resolved {
        lines.push(String::new());
        lines.push(format!("File: {}", file.filename));
        lines.push(format!("Size: {}", format_size(file.size_bytes)));
        if let Some(version) = &file.version {
            lines.push(format!("Version: {version}"));
        }
    }
    lines.join("\n")
}

fn source_label(source: Source) -> &'static str {
    match source {
        Source::Modrinth => "Modrinth",
        Source::Curseforge => "CurseForge",
        Source::Bedrock => "Bedrock",
        Source::Hytale => "Hytale",
    }
}

fn next_source(source: Source) -> Source {
    match source {
        Source::Modrinth => Source::Curseforge,
        Source::Curseforge => Source::Bedrock,
        Source::Bedrock => Source::Hytale,
        Source::Hytale => Source::Modrinth,
    }
}

fn content_label(content: ContentType) -> &'static str {
    match content {
        ContentType::Mod => "Mods",
        ContentType::Plugin => "Plugins",
        ContentType::Datapack => "Datapacks",
        ContentType::Resourcepack => "Resourcepacks",
        ContentType::Shader => "Shaders",
        ContentType::Addon => "Addons",
        ContentType::Map => "Maps",
        ContentType::TexturePack => "Texture Packs",
        ContentType::Script => "Scripts",
        ContentType::Skin => "Skins",
        ContentType::Prefab => "Prefabs",
        ContentType::World => "Worlds",
        ContentType::Bootstrap => "Bootstrap",
        ContentType::Translation => "Translations",
    }
}

fn next_content(source: Source, current: ContentType) -> ContentType {
    let options: &[ContentType] = match source {
        Source::Modrinth => &[
            ContentType::Mod,
            ContentType::Plugin,
            ContentType::Datapack,
            ContentType::Resourcepack,
            ContentType::Shader,
        ],
        Source::Curseforge => &[
            ContentType::Mod,
            ContentType::Plugin,
            ContentType::Datapack,
            ContentType::Resourcepack,
            ContentType::Shader,
        ],
        Source::Bedrock => &[
            ContentType::Addon,
            ContentType::Map,
            ContentType::TexturePack,
            ContentType::Script,
            ContentType::Skin,
        ],
        Source::Hytale => &[
            ContentType::Mod,
            ContentType::Prefab,
            ContentType::World,
            ContentType::Bootstrap,
            ContentType::Translation,
        ],
    };
    let index = options
        .iter()
        .position(|item| *item == current)
        .unwrap_or(0);
    options[(index + 1) % options.len()]
}

fn format_downloads(downloads: u64) -> String {
    if downloads >= 1_000_000 {
        format!("{:.1}M", downloads as f64 / 1_000_000.0)
    } else if downloads >= 1_000 {
        format!("{:.1}K", downloads as f64 / 1_000.0)
    } else {
        downloads.to_string()
    }
}

fn format_size(bytes: u64) -> String {
    if bytes >= 1024 * 1024 {
        format!("{:.1} MB", bytes as f64 / 1024.0 / 1024.0)
    } else if bytes >= 1024 {
        format!("{:.1} KB", bytes as f64 / 1024.0)
    } else {
        format!("{bytes} B")
    }
}
