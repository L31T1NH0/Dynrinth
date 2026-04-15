import type { en } from './en';

export const tr: typeof en = {
  status: {
    resolving:   'Çözümleniyor...',
    pending:     'Bekliyor...',
    downloading: 'İndiriliyor...',
    done:        'Tamamlandı',
  },

  search: {
    placeholder:  'Öğe ara...',
    clearTitle:   'Aramayı temizle',
    minLength:    'Aramak için en az {n} karakter girin.',
    loadMore:     'Daha fazla yükle',
    loading:      'Yükleniyor...',
    error:        'Arama hatası. Bağlantınızı kontrol edin.',
    noResultsFor: 'Sonuç bulunamadı:',
    withVersion:  'sürümü için',
  },

  fallback: {
    banner: '{version} için {type} bulunamadı. Bunun yerine {fallback} sonuçları gösteriliyor.',
  },

  queue: {
    title:       'İndirme kuyruğu',
    clear:       'Temizle',
    empty:       'Kuyruk boş.',
    emptyHint:   'Aramadan öğe ekleyin.',
    addToQueue:  'Kuyruğa ekle',
    inQueue:     'Kuyrukta',
    dep:         'bağ.',
    retryTitle:  'Tekrar dene',
    removeTitle: 'Kaldır',
  },

  errors: {
    noCompatibleVersion: 'Uyumlu sürüm yok',
    batchLimitExceeded:  'Toplu indirme sınırı aşıldı',
    networkError:        'Ağ hatası',
  },

  footer: {
    export:           'Dışa aktar',
    exportTitle:      'Mod listesini JSON olarak dışa aktar',
    import:           'İçe aktar',
    importTitle:      'Mod listesini JSON\'dan içe aktar',
    restoring:        'Geri yükleniyor...',
    share:            'Paylaş',
    shareTitle:       'Paylaşılabilir URL\'yi kopyala',
    copied:           'Kopyalandı!',
    downloadFile:     'Dosyayı indir',
    downloadFiles:    '{n} dosyayı indir',
    toggleFormat:     'Arşiv formatını değiştir',
    failedMods:       '{n} mod yüklenemedi',
    failedModsPlural: '{n} mod yüklenemedi',
    downloading:      'İndiriliyor...',
    creatingArchive:  '{format} oluşturuluyor...',
  },

  summary: {
    resolving:   'çözümleniyor',
    ready:       'hazır',
    downloaded:  'indirildi',
    error:       'hata',
    errors:      'hata',
  },

  snackbar: {
    added:        'Kuyruğa eklendi',
    datapacks:    'Modrinth veri paketleri güvenilmez (mod indirebilir). Bunun yerine CurseForge kullanın.',
    listTooLarge: 'Liste URL için çok büyük — bunun yerine Dışa Aktar kullanın.',
  },

  nav: {
    search: 'Ara',
    queue:  'Kuyruk',
  },

  mobileSuggestion: {
    text:   'Mobilde Bedrock genellikle daha iyi çalışır. Şimdi geçelim mi?',
    keep:   'Kalsın',
    switch: 'Geç',
  },
};
