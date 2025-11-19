# Simulasi Kapal Mengapung

Simulasi 3D kapal mengapung di laut dengan efek fisika gaya apung menggunakan Three.js.

## 👥 Kelompok

- **Felda Ega Fadhila** - 5025231199
- **Naswan Nashir Ramadhan** - 5025231246

## 🚀 Cara Menjalankan

### 1. Install Dependencies

```bash
npm install
```

### 2. Jalankan Development Server

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:5173` (atau port lain yang ditampilkan di terminal)

### 3. Build untuk Production

```bash
npm run build
```

File hasil build akan ada di folder `dist/`

### 4. Preview Build Production

```bash
npm run preview
```

## 🎮 Kontrol

- **W** - Gerakkan kapal maju
- **S** - Gerakkan kapal mundur
- **A** - Belok kiri
- **D** - Belok kanan
- **Mouse** - Rotasi kamera (drag)
- **Scroll** - Zoom in/out
- **Slider** - Ubah massa jenis kapal (mempengaruhi kedalaman tenggelam)

## ✨ Fitur

- 🌊 Efek air realistis dengan animasi ombak
- 🚢 Model kapal 3D dengan animasi mengapung
- 🏗️ Dermaga kayu dengan tangga
- 📊 Simulasi fisika gaya apung (Hukum Archimedes)
- 🎛️ Kontrol interaktif massa jenis kapal
- 📈 Informasi real-time: massa jenis, volume tercelup, gaya apung
- 🕹️ Kontrol gerakan kapal dengan keyboard

## 🛠️ Teknologi

- **Three.js** - Library 3D WebGL
- **Vite** - Build tool dan dev server
- **JavaScript** - ES6 Modules

## 📁 Struktur Project

```
.
├── index.html          # File HTML utama
├── main.js             # Kode simulasi Three.js
├── package.json        # Dependencies dan scripts
├── public/
│   └── boat.glb        # Model 3D kapal
└── README.md           # Dokumentasi ini
```

## 📝 Catatan

- Pastikan Anda memiliki Node.js terinstall (versi 14 atau lebih baru)
- Browser harus support WebGL untuk menjalankan aplikasi ini
- Model kapal (`boat.glb`) harus ada di folder `public/`
