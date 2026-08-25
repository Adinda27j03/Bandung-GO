BANDUNG—GO | WEBGIS VERSION
==============================

VERSI INI TIDAK MENGUBAH DESAIN ATAU LAYOUT UTAMA.
Perubahan difokuskan pada cara kerja WebGIS agar lebih mirip arsitektur
Trips-DIY: data API -> normalisasi GeoJSON -> marker/popup -> analisis.

STRUKTUR
--------
index.html
    Landing page.

map.html
    Halaman peta. Menambahkan Turf.js untuk analisis spasial.

js/config.js
    SATU TEMPAT UNTUK KONFIGURASI API.
    Isi MAPID Open API URL di sini.
    Isi header/token jika endpoint kamu membutuhkannya.
    Isi OpenRouteService API key untuk isochrone jaringan jalan.

js/map.js
    Memuat API, membaca GeoJSON/FeatureCollection, membuat marker,
    popup detail, filter, buffer, dan isochrone.

CARA MEMASUKKAN MAPID OPEN API
------------------------------
1. Di GEO MAPID, buka project dan layer kamu.
2. Masuk ke Edit Layer.
3. Salin URL pada bagian OPEN API.
4. Buka js/config.js.
5. Ubah:

   enabled: false
   menjadi
   enabled: true

6. Paste URL:

   url: "PASTE_URL_OPEN_API_MAPID_DI_SINI"

7. Jika API membutuhkan autentikasi, isi object headers.

MAPID DATA FORMAT
-----------------
Kode menerima GeoJSON FeatureCollection, array features, atau respons
yang memiliki data/features/results.

Field yang dikenali otomatis:
- nama/name/title
- kategori/category/type
- rating
- reviews/ulasan
- popularity/popularitas
- alamat/address
- wilayah/region
- deskripsi/description
- foto/photo/image
- geometry Point [longitude, latitude]
  atau lat/lng/latitude/longitude.

POPUP
-----
Klik marker untuk menampilkan:
- kategori
- nama
- rating dan ulasan
- popularitas jika tersedia
- alamat/wilayah
- deskripsi
- foto jika URL foto tersedia dari API
- tombol Google Maps
- tombol Analisis Buffer

BUFFER
------
Menggunakan Turf.js:
1. Pilih titik dari marker/pencarian/klik peta.
2. Atur radius.
3. Polygon buffer dihitung secara spasial.
4. Hotel/penginapan diuji dengan pointsWithinPolygon.

ISOCHRONE
---------
Menggunakan OpenRouteService:
1. Isi orsApiKey di js/config.js.
2. Pilih titik sumber.
3. Pilih moda Jalan/Sepeda/Motor-Mobil.
4. Pilih durasi.
5. API mengembalikan GeoJSON area jangkauan.
6. Turf.js menghitung destinasi yang berada di dalam area.

CATATAN PENTING
---------------
Jika MAPID Open API belum diisi, peta otomatis memakai data demo supaya
semua fungsi marker, popup, filter, dan buffer tetap dapat diuji.

Jika ORS API key belum diisi, isochrone tidak memakai radius dummy.
Aplikasi akan meminta key agar analisis benar-benar berdasarkan jaringan
jalan.

Untuk deployment production, jangan menyimpan secret backend di frontend.
Batasi API key berdasarkan domain atau gunakan backend/proxy.

REFERENSI ARSITEKTUR
--------------------
config.js
   ↓
MAPID Open API / GeoJSON
   ↓
normalizePlace()
   ↓
marker layers
   ↓
popup / filter / search
   ↓
Turf buffer
   ↓
OpenRouteService isochrone
