import type { en } from './en';

export const de: typeof en = {
  status: {
    resolving:   'Wird aufgelöst...',
    pending:     'Wartend...',
    downloading: 'Wird heruntergeladen...',
    done:        'Abgeschlossen',
  },

  search: {
    placeholder:  'Elemente suchen...',
    clearTitle:   'Suche leeren',
    minLength:    'Mindestens {n} Zeichen zum Suchen eingeben.',
    loadMore:     'Mehr laden',
    loading:      'Lädt...',
    error:        'Suchfehler. Verbindung prüfen.',
    noResultsFor: 'Keine Ergebnisse für',
    withVersion:  'mit',
  },

  fallback: {
    banner: 'Keine {type} für {version}. Zeige Ergebnisse aus {fallback}.',
  },

  queue: {
    title:       'Download-Warteschlange',
    clear:       'Leeren',
    empty:       'Warteschlange leer.',
    emptyHint:   'Elemente aus der Suche hinzufügen.',
    addToQueue:  'Zur Warteschlange hinzufügen',
    inQueue:     'In der Warteschlange',
    dep:         'Abh.',
    retryTitle:  'Erneut versuchen',
    removeTitle: 'Entfernen',
  },

  errors: {
    noCompatibleVersion: 'Keine kompatible Version',
    batchLimitExceeded:  'Batch-Download-Limit überschritten',
    networkError:        'Netzwerkfehler',
  },

  footer: {
    export:           'Exportieren',
    exportTitle:      'Mod-Liste als JSON exportieren',
    import:           'Importieren',
    importTitle:      'Mod-Liste aus JSON importieren',
    restoring:        'Wird wiederhergestellt...',
    share:            'Teilen',
    shareTitle:       'Teilbaren Link kopieren',
    copied:           'Kopiert!',
    downloadFile:     'Datei herunterladen',
    downloadFiles:    '{n} Dateien herunterladen',
    toggleFormat:     'Archivformat wechseln',
    failedMods:       '{n} Mod konnte nicht geladen werden',
    failedModsPlural: '{n} Mods konnten nicht geladen werden',
    downloading:      'Wird heruntergeladen...',
    creatingArchive:  '{format} wird erstellt...',
  },

  summary: {
    resolving:   'wird aufgelöst',
    ready:       'bereit',
    downloaded:  'heruntergeladen',
    error:       'Fehler',
    errors:      'Fehler',
  },

  snackbar: {
    added:        'Zur Warteschlange hinzugefügt',
    datapacks:    'Verwende stattdessen CurseForge; Modrinth-Datenpakete sind unzuverlässig (können Mods herunterladen)',
    listTooLarge: 'Liste zu groß für eine URL — stattdessen Exportieren verwenden.',
  },

  nav: {
    search: 'Suche',
    queue:  'Warteschlange',
  },

  mobileSuggestion: {
    text:   'Auf Mobilgeräten funktioniert Bedrock meist besser. Jetzt wechseln?',
    keep:   'Behalten',
    switch: 'Wechseln',
  },
};
