import type { ComponentType, SVGProps } from 'react';
import type { ContentType, Filters, Loader, PluginLoader, ShaderLoader, SortIndex, Source } from '@/lib/modrinth/types';
import {
  CogIcon, ServerStackIcon, CircleStackIcon, PhotoIcon, SparklesIcon,
} from '@heroicons/react/24/outline';

export const LOADERS: { id: Loader; label: string }[] = [
  { id: 'fabric',   label: 'Fabric'   },
  { id: 'forge',    label: 'Forge'    },
  { id: 'neoforge', label: 'NeoForge' },
  { id: 'quilt',    label: 'Quilt'    },
];

export const SHADER_LOADERS: { id: ShaderLoader; label: string }[] = [
  { id: 'iris',     label: 'Iris'     },
  { id: 'optifine', label: 'OptiFine' },
];

export const PLUGIN_LOADERS: { id: PluginLoader; label: string }[] = [
  // primary (shown by default)
  { id: 'paper',      label: 'Paper'      },
  { id: 'spigot',     label: 'Spigot'     },
  { id: 'bukkit',     label: 'Bukkit'     },
  // secondary (shown on expand)
  { id: 'purpur',     label: 'Purpur'     },
  { id: 'folia',      label: 'Folia'      },
  { id: 'velocity',   label: 'Velocity'   },
  { id: 'bungeecord', label: 'BungeeCord' },
  { id: 'sponge',     label: 'Sponge'     },
];

export const LOADER_PRIMARY_COUNT        = 2; // fabric, forge
export const PLUGIN_LOADER_PRIMARY_COUNT = 3; // paper, spigot, bukkit

export const CONTENT_TYPES: { id: ContentType; usesLoader: boolean; sources: Source[] }[] = [
  { id: 'mod',          usesLoader: true,  sources: ['modrinth', 'curseforge']   },
  { id: 'plugin',       usesLoader: false, sources: ['modrinth', 'curseforge']   },
  { id: 'datapack',     usesLoader: false, sources: ['modrinth', 'curseforge']   },
  { id: 'resourcepack', usesLoader: false, sources: ['modrinth', 'curseforge']   },
  { id: 'shader',       usesLoader: false, sources: ['modrinth', 'curseforge']   },
  { id: 'addon',        usesLoader: false, sources: ['curseforge-bedrock']       },
  { id: 'map',          usesLoader: false, sources: ['curseforge-bedrock']       },
  { id: 'texture-pack', usesLoader: false, sources: ['curseforge-bedrock']       },
  { id: 'script',       usesLoader: false, sources: ['curseforge-bedrock']       },
  { id: 'skin',         usesLoader: false, sources: ['curseforge-bedrock']       },
];

export const BEDROCK_CONTENT_TYPES = new Set<ContentType>([
  'addon', 'map', 'texture-pack', 'script', 'skin',
]);

export const CONTENT_TYPE_ICONS: Partial<Record<ContentType, ComponentType<SVGProps<SVGSVGElement>>>> = {
  mod:          CogIcon,
  plugin:       ServerStackIcon,
  datapack:     CircleStackIcon,
  resourcepack: PhotoIcon,
  shader:       SparklesIcon,
};

export const SORT_OPTIONS: { id: SortIndex; label: string }[] = [
  { id: 'relevance', label: 'Relevance' },
  { id: 'downloads', label: 'Downloads' },
  { id: 'updated',   label: 'Updated'   },
  { id: 'newest',    label: 'Newest'    },
  { id: 'follows',   label: 'Follows'   },
];

export const DEFAULT_FILTERS: Filters = {
  source:       'modrinth',
  version:      '',
  contentType:  'mod',
  loader:       'fabric',
  shaderLoader: null,
  pluginLoader: null,
  sortIndex:    'relevance',
  clientSide:   false,
  serverSide:   false,
};
