# SIM-KAMTIB | SISTEM KEAMANAN SANTRI PONPES SALAF AL-MALIKI

Aplikasi Pusat Komando & Pengawasan Keamanan Santri Pondok Pesantren Salaf Al-Maliki berbasis web modern berkinerja tinggi, dilengkapi Progressive Web App (PWA) standalone, visualisasi radar taktis militer, sistem perizinan digital berjenjang, rekapitulasi sanksi edukatif dengan pencetakan surat otomatis, serta pusat koordinasi dua arah antara Admin Pusat dan Dewan Keamanan.

---

## 🌟 FITUR UTAMA SISTEM

### 1. Pusat Kendali Komando (Command Overview)
* **3D Security Grid & Interpol Cybernetic Aesthetic**: Tampilan dark luxury command center dengan kartu kaca metalik (*metallic-glass-card*), animasi *rainbow active border*, dan waktu presisi WIB.
* **Telemetry & Quick Counter**: Pemantauan langsung status santri di luar asrama, santri melewati batas waktu (*overdue alert*), antrian persetujuan perizinan, dan notifikasi komando.
* **Advanced Data Visualization**: 4 panel grafik terpisah (Statistik Pelanggaran - Bar Chart, Tren Perizinan - Line Chart, Tingkat Kedisiplinan - Donut/Pie Chart, dan Laporan Bulanan Rekapitulasi).
* **Tabel Rekapitulasi Cepat**: Tabel perizinan aktif dan tabel takzir dengan filter santri, kelas, dan status.

### 2. Radar Monitoring Perizinan Real-Time
* Radar kontrol visual 360° dengan jarum sapuan radar (*radar-sweep beam*).
* Menampilkan posisi santri di luar kampus pondok.
* Santri yang melanggar batas waktu (terlambat) otomatis terdeteksi dengan titik merah berkedip (*blinking red alert*) ala sistem deteksi pertahanan militer.

### 3. Sentry Gate Terminal (Scan QR Code)
* Terminal pos gerbang keamanan untuk proses **Check-Out** (keluar) dan **Check-In** (kembali masuk).
* Integrasi pembacaan QR Code surat izin digital santri.
* Pencatatan otomatis waktu aktual keluar/masuk, verifikasi penjemput, serta dokumentasi visual petugas gerbang.

### 4. Permohonan Izin Santri Berjenjang
* Pengurus mengajukan izin santri secara manual atau sistematis.
* Data izin terkirim langsung secara instan ke panel Admin Pusat.
* Status persetujuan (*Pending*, *Disetujui*, *Ditolak*) dengan catatan otoritas.
* **Surat Izin Digital**: Setelah disetujui, surat izin resmi langsung dapat dibuka, dicetak, diunduh PDF, dan dikirim via WhatsApp dengan stempel digital serta QR Code verifikasi.

### 5. Sanksi Edukatif & Pembinaan
* **Tabel 9 Kolom Standar Rekapitulasi**:
  1. Nomor (dengan nomor surat registrasi sanksi)
  2. Nama Santri
  3. Kelas
  4. Jenis Pelanggaran
  5. Tanggal Pelanggaran
  6. Jenis Sanksi / Hukuman Edukatif
  7. Petugas Pencatat
  8. Status Pelaksanaan Sanksi (*Belum Mulai*, *Sedang Berjalan*, *Tuntas/Selesai*, *Ditinjau*)
  9. Aksi Detail & Cetak Surat
* **Surat Pelanggaran dan Sanksi Edukatif Otomatis**: Dokumen resmi ber-kop Ponpes Salaf Al-Maliki, memuat identitas santri, kronologi pelanggaran, klausul takzir edukatif, batas maksimal penyelesaian, tanda tangan 2/3 pejabat keamanan, serta mode edit redaksi *on-the-fly* sebelum cetak / simpan PDF.

### 6. Pusat Koordinasi Admin & Dewan Keamanan
* Komunikasi resmi dua arah:
  * **Admin ke Dewan Keamanan**: Perintah kedisiplinan, instruksi patroli, dan maklumat komando berprioritas (*Normal*, *Penting*, *Mendesak*).
  * **Dewan Keamanan ke Admin**: Laporan insiden darurat, kendala keamanan pos, dan pengajuan logistik pos gerbang.
* **Thread Balasan & Tindak Lanjut**: Dialog interaktif dan penandaan status *Ditindaklanjuti* dengan catatan solusi.
* **Notifikasi Mendesak**: Banner radar darurat berkedip (*siren pulse alert*) di dashboard utama saat ada disposisi berkategori Mendesak.

### 7. Central Option Panel (Khusus Admin)
* Tata kelola personil dewan keamanan & akun login (RBAC: Super Admin, Kepala Kamtib, Petugas Jaga, Komandan Pos).
* Kustomisasi layout Surat Izin dan Surat Sanksi (Kop surat, logo, nomor surat, kolom identitas, susunan tanda tangan 2/3 orang, nama pejabat, dan stempel).
* **Snapshot Layout Isolation**: Setiap surat menyimpan salinan konfigurasi saat dibuat, memastikan surat lama tidak rusak ketika admin mengubah template surat baru.

### 8. Progressive Web App (PWA) Standalone
* Dapat diinstal secara instan di **Android**, **iOS (iPhone/iPad)**, serta **Komputer/Laptop (Windows, Mac, Linux)**.
* Berjalan di jendela aplikasi terpisah tanpa bilah alamat browser (*standalone display mode*).
* Dilengkapi *Offline Indicator* dan mekanisme sinkronisasi data lokal yang aman tanpa risiko duplikasi.

### 9. Kotak Gulir Jalur / Track 3D Dark Glass
* Menggantikan kotak gulir putih bawaan browser dengan panel dark charcoal glassmorphism (`.track-scroll-box`).
* Desain scrollbar minimalis dengan border emas halus (*subtle gold border*), bayangan kedalaman 3D (*inner shadow & depth*), serta *highlight* cyan saat disentuh atau diarahkan kursor.

---

## 🛠️ TEKNOLOGI & DEPENDENSI

* **Framework**: React 19 + TypeScript (Vite 8)
* **Styling**: Tailwind CSS 4 dengan kustom varian metallic-glass & dark theme
* **PWA Engine**: `vite-plugin-pwa` dengan Workbox Runtime Caching
* **Visualisasi & Radar**: D3.js, Lucide React Icons, Canvas Radar Sweeper
* **QR Code & Dokumen**: `qrcode`, Canvas Print Engine
* **Penyimpanan Data**: Singleton Reactive Storage Service (Persisten, Enkripsi Sesi, & Safe Rehydration)

---

## 🚀 PANDUAN INSTALASI & PENGEMBANGAN LOKAL

### Prasyarat
* **Node.js**: Versi 18.0.0 atau lebih baru (direkomendasikan Node.js 20 LTS / 22 LTS).
* **npm**: Versi 9.0.0+ (atau yarn / pnpm).

### Langkah Menjalankan
1. **Clone repository ini**:
   ```bash
   git clone https://github.com/username-anda/keamanan-santri-almaliki.git
   cd keamanan-santri-almaliki
   ```

2. **Pasang dependensi**:
   ```bash
   npm install
   ```

3. **Jalankan development server**:
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di: `http://localhost:3000`

4. **Uji kompilasi build produksi**:
   ```bash
   npm run build
   ```
   Hasil build akan dibuat di folder `dist/`.

5. **Pratinjau build produksi**:
   ```bash
   npm run preview
   ```

---

## 📦 PANDUAN PUBLIKASI KE GITHUB

Proyek ini telah dikonfigurasi dengan struktur folder bersih dan file `.gitignore` lengkap sehingga aman untuk diunggah ke repository publik maupun privat:

1. Inisialisasi Git (jika belum):
   ```bash
   git init
   git add .
   git commit -m "feat: inisialisasi sistem keamanan santri al-maliki pwa & vercel ready"
   ```

2. Hubungkan ke repository GitHub Anda:
   ```bash
   git remote add origin https://github.com/USERNAME_ANDA/NAMA_REPO_ANDA.git
   git branch -M main
   git push -u origin main
   ```

3. **Keamanan Kredensial**:
   * File `.env`, `.env.local`, folder `node_modules`, dan berkas sementara diabaikan oleh `.gitignore`.
   * Template environment variable disediakan di `.env.example`.

---

## ☁️ PANDUAN DEPLOYMENT KE VERCEL

Proyek ini telah dilengkapi file konfigurasi `vercel.json` yang secara otomatis mengatur routing SPA (mencegah error 404 saat halaman di-refresh) serta *headers* keamanan dan *cache* PWA.

### Cara 1: Menghubungkan Repository GitHub ke Vercel (Direkomendasikan)
1. Buka [https://vercel.com](https://vercel.com) dan login dengan akun GitHub Anda.
2. Klik tombol **"Add New..."** lalu pilih **"Project"**.
3. Cari dan pilih repository **keamanan-santri-almaliki** dari daftar GitHub Anda, lalu klik **"Import"**.
4. Pada panel **Configure Project**:
   * **Framework Preset**: Pilih `Vite` (Vercel biasanya mendeteksi secara otomatis).
   * **Root Directory**: `./` (biarkan default).
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
   * **Install Command**: `npm install`
5. Klik **"Deploy"**.
6. Dalam 1-2 menit, aplikasi akan aktif dengan URL HTTPS resmi dari Vercel (misal: `https://keamanan-santri-almaliki.vercel.app`).
7. Setiap kali Anda melakukan `git push` ke cabang `main`, Vercel akan otomatis melakukan build dan deploy versi terbaru.

### Cara 2: Deploy Menggunakan Vercel CLI
```bash
npm install -g vercel
vercel login
vercel
# Untuk produksi:
vercel --prod
```

---

## 📱 PANDUAN INSTALASI PWA (APLIKASI DESKTOP & MOBILE)

Aplikasi ini dapat langsung dipasang tanpa perlu mengunduh file APK dari pihak ketiga:

### 1. Di Perangkat Android (Google Chrome / Edge)
1. Buka alamat website di Chrome.
2. Ketuk tombol **"INSTALL APP"** di bagian atas kanan header, atau buka menu browser (titik tiga `⋮` di kanan atas).
3. Pilih opsi **"Tambahkan ke Layar Utama"** atau **"Install App"**.
4. Ikon **Al-Maliki Security** akan otomatis muncul di app drawer dan beroperasi seperti aplikasi native Android.

### 2. Di Perangkat iPhone / iPad (Safari)
1. Buka website menggunakan browser **Safari**.
2. Ketuk ikon **Bagikan (Share)** `[↑]` di toolbar bagian bawah layar.
3. Gulir ke bawah dan ketuk opsi **"Tambah ke Layar Utama" (Add to Home Screen)**.
4. Ketuk **"Tambah" (Add)** di pojok kanan atas.

### 3. Di Komputer / Laptop (Windows, macOS, Linux)
1. Buka website di Google Chrome, Microsoft Edge, atau Brave.
2. Klik ikon monitor / unduh di bilah alamat browser sebelah kanan, atau klik tombol **"Install App"** pada header.
3. Klik **"Install"**. Aplikasi akan membuka jendela mandiri tanpa address bar browser.

---

## 🔐 INFORMASI AKUN LOGIN STANDAR (DEMO & DEFAULT)

Sistem menggunakan kontrol akses berbasis peran (RBAC). Akun bawaan siap pakai:

| Peran | Username | Password | Otoritas |
|---|---|---|---|
| **Admin Pusat** | `admin` | `admin123` | Akses penuh seluruh sistem, Option Panel, Otorisasi perizinan & sanksi |
| **Kepala Kamtib** | `kamtib` | `kamtib123` | Akses operasional pengurus, perizinan, radar, gate scanner, sanksi |
| **Dewan Keamanan** | `pengurus` | `pengurus123` | Input izin santri, koordinasi laporan dewan, permohonan santri |

> **Catatan Pengamanan**: Akun, password, dan personil baru dapat ditambah atau diubah langsung melalui **Central Option Panel** oleh Admin.

---

## 🛡️ LISENSI & HAK CIPTA

Dikembangkan khusus untuk **Pondok Pesantren Salaf Al-Maliki**.
Hak Cipta Dilindungi & Dilengkapi Standar Integritas Keamanan Santri.
