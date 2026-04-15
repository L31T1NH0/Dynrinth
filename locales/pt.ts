import type { en } from './en';

export const pt: typeof en = {
  status: {
    resolving:   'Resolvendo...',
    pending:     'Aguardando...',
    downloading: 'Baixando...',
    done:        'Concluído',
  },

  search: {
    placeholder:  'Pesquisar itens...',
    clearTitle:   'Limpar pesquisa',
    minLength:    'Digite pelo menos {n} caracteres para pesquisar.',
    loadMore:     'Carregar mais',
    loading:      'Carregando...',
    error:        'Erro na pesquisa. Verifique sua conexão.',
    noResultsFor: 'Sem resultados para',
    withVersion:  'com',
  },

  fallback: {
    banner: 'Sem {type} para {version}. Mostrando resultados de {fallback}.',
  },

  queue: {
    title:       'Fila de download',
    clear:       'Limpar',
    empty:       'Fila vazia.',
    emptyHint:   'Adicione itens da pesquisa.',
    addToQueue:  'Adicionar à fila',
    inQueue:     'Na fila',
    dep:         'dep',
    retryTitle:  'Tentar novamente',
    removeTitle: 'Remover',
  },

  errors: {
    noCompatibleVersion: 'Nenhuma versão compatível',
    batchLimitExceeded:  'Limite de download em lote excedido',
    networkError:        'Erro de rede',
  },

  footer: {
    export:           'Exportar',
    exportTitle:      'Exportar lista de mods como JSON',
    import:           'Importar',
    importTitle:      'Importar lista de mods do JSON',
    restoring:        'Restaurando...',
    share:            'Compartilhar',
    shareTitle:       'Copiar URL compartilhável',
    copied:           'Copiado!',
    downloadFile:     'Baixar arquivo',
    downloadFiles:    'Baixar {n} arquivos',
    toggleFormat:     'Alternar formato do arquivo',
    failedMods:       '{n} mod não pôde ser carregado',
    failedModsPlural: '{n} mods não puderam ser carregados',
    downloading:      'Baixando...',
    creatingArchive:  'Criando {format}...',
  },

  summary: {
    resolving:   'resolvendo',
    ready:       'pronto',
    downloaded:  'baixado',
    error:       'erro',
    errors:      'erros',
  },

  snackbar: {
    added:        'Adicionado à fila',
    datapacks:    'Use o CurseForge; datapacks do Modrinth são instáveis (podem baixar mods)',
    listTooLarge: 'Lista grande demais para uma URL — use Exportar.',
  },

  nav: {
    search: 'Pesquisar',
    queue:  'Fila',
  },

  mobileSuggestion: {
    text:   'No celular, Bedrock costuma funcionar melhor. Trocar agora?',
    keep:   'Manter',
    switch: 'Trocar',
  },
};
