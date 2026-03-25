# Zimu 🎯

Görevler, takvim, spor takibi, projeler ve notlar — hepsi tek yerde. Telefona kurulabilir PWA uygulaması.

## Özellikler

- ✅ **Görev Yönetimi** — Öncelik, kategori, son tarih, gecikmiş görev uyarıları
- 📅 **Takvim** — Aylık görünüm, etkinlik ekleme, tekrarlayan etkinlikler (günlük/haftalık/aylık)
- 🏃 **Spor Takibi** — Antrenman kaydı, haftalık istatistikler (süre, kalori, mesafe)
- 📂 **Proje Yönetimi** — Alt görevler, ilerleme çubuğu, durum takibi
- 📝 **Notlar** — Aranabilir, renk kodlu, düzenlenebilir
- 🔔 **Bildirimler** — Etkinlik ve görev hatırlatmaları (PWA Push API)
- 💾 **Çevrimdışı Çalışma** — Tüm veriler telefonun hafızasında (IndexedDB)
- 📤 **Veri Aktarımı** — JSON import/export ile bilgisayardan veri yükleme ve yedek alma
- 📱 **Telefona Kurulabilir** — PWA olarak ana ekrana eklenebilir

## Kurulum

### 1. Depoyu klonla
```bash
git clone https://github.com/KULLANICI_ADINIZ/zimu.git
cd zimu
```

### 2. Bağımlılıkları yükle
```bash
npm install
```

### 3. Geliştirme sunucusunu başlat
```bash
npm run dev
```

### 4. Üretim derlemesi
```bash
npm run build
```

## Deploy (Vercel)

1. GitHub'a pushla
2. [vercel.com](https://vercel.com) → New Project → GitHub reposunu seç
3. Framework: **Vite** seçili olacak → Deploy
4. Birkaç saniye sonra `zimu.vercel.app` adresinden erişebilirsin

## Telefona Kurma

1. Telefonunuzdan deploy edilen siteyi açın
2. **Android**: Chrome menüsünden "Ana ekrana ekle" / "Add to Home Screen"
3. **iOS**: Safari'de paylaş butonuna bas → "Ana Ekrana Ekle"
4. Uygulama artık telefonunuzda bağımsız bir uygulama gibi açılır

## Bilgisayardan Veri Aktarma

1. Ayarlar sekmesinden "Yedek İndir" ile JSON dosyası alın
2. Başka cihazda "Dosyadan Aktar" ile JSON dosyasını yükleyin
3. Veya bilgisayarda bir JSON dosyası hazırlayıp telefona aktarın

### JSON Format Örneği:
```json
{
  "tasks": [
    { "id": "abc123", "title": "Görev adı", "priority": "high", "done": false, "dueDate": "2026-04-01" }
  ],
  "events": [
    { "id": "def456", "title": "Toplantı", "date": "2026-04-01", "time": "14:00", "color": "#3b82f6" }
  ],
  "sports": [],
  "projects": [],
  "notes": []
}
```

## Teknolojiler

- **React 18** + **Vite 5**
- **IndexedDB** (idb kütüphanesi) — kalıcı yerel depolama
- **Service Worker** (vite-plugin-pwa) — çevrimdışı çalışma + bildirimler
- **Web Notifications API** — hatırlatıcılar
- Sıfır backend — tüm veriler cihazda

## Lisans

MIT
