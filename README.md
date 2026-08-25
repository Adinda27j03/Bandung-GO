
# Bandung—GO

**Explore Bandung City and Find Your Favorite Place**

WebGIS interaktif untuk menjelajahi Kota Bandung — cafe, coffee shop, kuliner, hotel, penginapan, dan destinasi wisata — dalam satu peta.

> Proyek portfolio WebGIS • 2026 • By Adinda Dwi Yulianto

---

## Overview

**Bandung—GO** adalah situs web statis (HTML/CSS/JavaScript) dengan dua halaman utama:

| Halaman | File | Fungsi |
|---------|------|--------|
| Landing page | `index.html` | Presentasi visual, gallery, CTA ke peta |
| Peta interaktif | `map.html` | WebGIS dengan marker, filter, dan analisis spasial |

Pengguna dapat menemukan tempat baru, melihat pilihan di sekitar suatu area, dan menentukan tujuan berikutnya secara visual.

### Key Features

- Peta interaktif Kota Bandung (Leaflet + marker cluster)
- **5 kategori tempat:** wisata, cafe/coffee shop, kuliner, hotel/penginapan, hub transportasi
- Filter kategori hierarkis (pariwisata, cafe & coffee, kuliner)
- Pencarian lokasi berdasarkan nama
- Toggle layer: wisata, hotel, transport, batas administrasi kecamatan
- 3 basemap: Street, Satellite, Light
- **Analisis Buffer** — cari hotel terdekat dalam radius tertentu
- **Analisis Isochrone** — area jangkauan dari hub transportasi
- Popup detail tempat + link Google Maps
- Batas kecamatan Bandung dari data MAPID

---

## Architecture

```
Browser (Static HTML/CSS/JS)
       │
       ├── index.html          → Landing / portfolio
       │
       └── map.html            → WebGIS utama
              │
              ├── js/config.js     → Konfigurasi API (MAPID + ORS)
              ├── js/map.js        → Logika peta & analisis
              │
              ▼
┌──────────────────────────────────────┐
│  External Data & Services            │
│  • MAPID GeoServer Open API          │
│  • OpenRouteService (isochrone)      │
│  • OpenStreetMap / Esri / CARTO tiles│
└──────────────────────────────────────┘
```

Alur data:

```
config.js
    ↓
MAPID Open API / GeoJSON
    ↓
normalizePlace()
    ↓
marker layers → popup / filter / search
    ↓
Turf.js buffer
    ↓
OpenRouteService isochrone
```

Tidak ada backend sendiri — semua berjalan di browser (client-side only).

---

## Data Sources

| Sumber | Endpoint / Asset | Kegunaan |
|--------|------------------|----------|
| **MAPID GeoServer** | `geoserver.mapid.io/layers_new/get_layer` | POI wisata, coffee, kuliner, hotel, transport, batas kecamatan |
| **OpenStreetMap** | `tile.openstreetmap.org` | Basemap street |
| **Esri World Imagery** | `server.arcgisonline.com` | Basemap satellite |
| **CARTO Dark** | `basemaps.cartocdn.com/dark_all` | Basemap alternatif |
| **OpenRouteService** | `api.openrouteservice.org/v2/isochrones` | Analisis isochrone |
| **Turf.js** (CDN) | `@turf/turf@7` | Buffer polygon & spatial query |

Layer MAPID dikonfigurasi di `js/config.js`:

| Layer | Kategori |
|-------|----------|
| `tourism` | Destinasi wisata |
| `coffee`, `coffee2` | Cafe & coffee shop |
| `culinary` | Restaurant, bakery, food court, dll. |
| `hotel` | Hotel & penginapan |
| `transport` | Hub transportasi |
| `admin` | Batas administrasi kecamatan |

Field yang dikenali otomatis saat normalisasi data:

- `nama` / `name` / `title`
- `kategori` / `category` / `type`
- `rating`, `reviews` / `ulasan`
- `popularity` / `popularitas`
- `alamat` / `address`, `wilayah` / `region`
- `deskripsi` / `description`, `foto` / `photo` / `image`
- Koordinat: `geometry Point [lng, lat]` atau field `lat`/`lng`

---

## Analisis Spasial

Proyek ini tidak memiliki REST API backend. Analisis dijalankan langsung di browser.

### Buffer — Cari Hotel Terdekat

**Cara pakai:**

1. Buka tab **Stay** di panel kiri
2. Pilih titik sumber (cari nama / klik peta / klik marker)
3. Atur radius (200 m – 10 km)
4. Klik **Cari Hotel Terdekat**

**Proses:**

```
Titik sumber + radius
       ↓
turf.buffer() → polygon lingkaran
       ↓
turf.pointsWithinPolygon() → filter hotel dalam radius
       ↓
Sort by jarak → tampil di panel + visualisasi di peta
```

**Output (panel `#bufferResult`):**

- Jumlah hotel/penginapan dalam radius
- Daftar hotel terurut jarak terdekat
- Link Google Maps per hotel

### Isochrone — Area Jangkauan

**Cara pakai:**

1. Buka tab **Explore** di panel kiri
2. Pilih hub transportasi (bandara / stasiun)
3. Pilih moda: Jalan / Sepeda / Motor-Mobil
4. Atur durasi (10–90 menit)
5. Klik **Tampilkan Area Jangkauan**

**Request ke OpenRouteService:**

```http
POST https://api.openrouteservice.org/v2/isochrones/{profile}
Authorization: {orsApiKey}
Content-Type: application/json

{
  "locations": [[107.67, -6.908]],
  "range": [1800],
  "range_type": "time"
}
```

**Output (panel `#isoResult`):**

- Polygon area jangkauan di peta
- Jumlah destinasi yang dapat dijangkau
- Daftar destinasi terurut jarak terdekat

---

## Alur Kerja Aplikasi

```
1. User buka map.html
       ↓
2. loadPlaces() — fetch paralel dari MAPID API
       ↓
3. normalizePlace() → render marker + category tree
       ↓
4. User interaksi:
   • Filter kategori  → applyTourismFilter()
   • Buffer           → runBuffer() (Turf.js, instant)
   • Isochrone        → runIsochrone() → fetch ORS → tampilkan area
```

---

## Project Structure

```
Bandung-GO/
├── index.html              # Landing page portfolio
├── map.html                # Halaman WebGIS interaktif
├── README.md
├── css/
│   ├── style.css           # Style landing page + shared navbar
│   └── map.css             # Style halaman peta, panel, marker, popup
├── js/
│   ├── config.js           # Konfigurasi MAPID URLs + ORS API key
│   ├── map.js              # Core WebGIS (load data, marker, analisis)
│   └── script.js           # Smooth scroll + mobile menu landing
└── assets/
    ├── README.txt          # Catatan arsitektur WebGIS
    └── img/                # Gambar landing page
```

---

## Requirements

| Kebutuhan | Detail |
|-----------|--------|
| Browser modern | Chrome, Firefox, Edge (ES6+) |
| Web server statis | Live Server, Python HTTP server, atau hosting statis |
| Akun MAPID | API key & layer IDs (sudah di `js/config.js`) |
| OpenRouteService API key | Untuk fitur isochrone (sudah di `js/config.js`) |
| Koneksi internet | Wajib — data & library dari CDN/API eksternal |

---

## Installation

```bash
# Clone repository
git clone https://github.com/<username>/Bandung-GO.git
cd Bandung-GO

# Jalankan web server statis (pilih salah satu)

# Python
python -m http.server 8080

# Node.js (npx)
npx serve .

# VS Code / Cursor — Live Server extension
# Klik "Go Live" di status bar
```

Buka di browser:

- Landing page: `http://localhost:8080/index.html`
- Peta: `http://localhost:8080/map.html`

---

## Configuration

Semua konfigurasi API ada di **`js/config.js`**.

### MAPID Open API

1. Buka project & layer di GEO MAPID
2. Masuk ke **Edit Layer** → salin URL **Open API**
3. Paste ke `js/config.js`:

```javascript
window.MAPID_CONFIG = {
  layers: {
    tourism: {
      enabled: true,
      url: "PASTE_URL_OPEN_API_MAPID_DI_SINI"
    },
    // ... layer lainnya
  }
};
```

### OpenRouteService (Isochrone)

```javascript
isochrone: {
  provider: "ors",
  orsApiKey: "YOUR_ORS_API_KEY",
  orsUrl: "https://api.openrouteservice.org/v2/isochrones"
}
```

> **Catatan keamanan:** Untuk deployment production, jangan expose API key di frontend. Gunakan backend proxy atau batasi key berdasarkan domain.

---

## Hasil / Output

| Aspek | Output |
|-------|--------|
| Landing page | Halaman presentasi dengan hero, deskripsi, gallery, CTA ke peta |
| Peta | POI Bandung sebagai marker berikon & berwarna per kategori |
| Buffer | Daftar hotel terdekat + visualisasi lingkaran di peta |
| Isochrone | Area jangkauan + daftar destinasi dari hub transportasi |
| Popup | Detail tempat, link Google Maps, shortcut analisis buffer |
| Batas admin | Polygon kecamatan Bandung dengan tooltip hover |

---

## License

Proyek portfolio pribadi — **WEBGIS Portfolio Project • 2026**.

---

## Kontak

- Instagram: [@advl06](https://www.instagram.com/advl06/)
- LinkedIn: [Adinda Dwi Yulianto](https://www.linkedin.com/in/adinda-dwi-yulianto-27j03)
- Email: adindady27@gmail.com
- WhatsApp: [+62 812-2154-3368](https://wa.me/6281221543368)
