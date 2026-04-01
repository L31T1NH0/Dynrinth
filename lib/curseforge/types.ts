// ─── Raw CurseForge API response shapes ───────────────────────────────────────

export interface CfModLogo {
  thumbnailUrl: string;
}

export interface CfCategory {
  name: string;
}

export interface CfFileIndex {
  gameVersion: string;
  fileId:      number;
  modLoader:   number | null;
}

export interface CfFileDependency {
  modId:        number;
  relationType: number; // 3 = RequiredDependency
}

export interface CfFile {
  id:           number;
  fileName:     string;
  downloadUrl:  string | null; // null when distribution is restricted
  fileLength:   number;
  gameVersions: string[];
  dependencies: CfFileDependency[];
}

export interface CfMod {
  id:                 number;
  name:               string;
  summary:            string;
  downloadCount:      number;
  logo:               CfModLogo | null;
  categories:         CfCategory[];
  latestFilesIndexes: CfFileIndex[];
  latestFiles:        CfFile[];
}

export interface CfSearchResponse {
  data:       CfMod[];
  pagination: {
    index:       number;
    pageSize:    number;
    resultCount: number;
    totalCount:  number;
  };
}

export interface CfMinecraftVersion {
  versionString:         string;
  gameVersionTypeId:     number;
  gameVersionStatus:     number;
  gameVersionTypeStatus: number;
  approved:              boolean;
}

export interface CfVersionsResponse {
  data: CfMinecraftVersion[];
}

export interface CfModResponse {
  data: CfMod;
}

export interface CfFilesResponse {
  data: CfFile[];
}
