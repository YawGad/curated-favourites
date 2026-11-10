# Curated Favourites

Laman showcase Shopee affiliate yang ringkas dan moden. Pengguna boleh menjelajah koleksi produk pilihan, menapis ikut kategori, mencari, menyusun ikut harga atau rating, dan terus ke halaman produk di Shopee melalui pautan affiliate anda.

Laman ini ialah **laman statik**: tiada pelayan, tiada pangkalan data dan tiada langkah build.

## Ciri-ciri

- Carian, tapisan kategori dan susunan (harga, rating)
- Modal butiran produk dengan nota kurator
- Borang "Tambah Produk" (disimpan dalam `localStorage` pelayar sahaja)
- Pendedahan afiliasi, `rel="sponsored"` pada pautan keluar
- Responsif, boleh diakses (label, `aria`, navigasi papan kekunci, `prefers-reduced-motion`)
- Input pengguna di-escape dan URL disahkan sebelum dipaparkan

## Struktur projek

```
curated-favourites/
├── index.html                  # Struktur halaman
├── assets/
│   ├── css/styles.css          # Gaya tambahan (scrollbar, animasi, fokus)
│   ├── js/
│   │   ├── tailwind-config.js  # Warna, fon dan bayang tema
│   │   └── app.js              # Logik aplikasi (render, tapis, modal)
│   └── img/favicon.svg
├── data/products.js            # Senarai produk, edit fail ini
├── .github/workflows/pages.yml # Deploy automatik ke GitHub Pages
├── netlify.toml                # Konfigurasi Netlify
├── vercel.json                 # Konfigurasi Vercel
├── package.json
└── LICENSE
```

## Mula pantas

Buka `index.html` terus dalam pelayar, atau jalankan pelayan setempat:

```bash
npm run dev
# atau
python3 -m http.server 8080
```

Kemudian layari `http://localhost:8080`.

## Menambah atau mengubah produk

Edit `data/products.js`. Setiap produk berbentuk:

```js
{
  id: 7,                              // nombor unik
  name: "Nama Produk",
  category: "Home & Aesthetic",       // mesti salah satu kategori dalam CATEGORIES
  price: 49.90,
  rating: 4.8,
  badge: "Terlaris",
  link: "https://shope.ee/xxxxxxx",   // pautan affiliate anda
  image: "https://...",               // URL gambar
  note: "Kenapa anda cadangkan produk ini."
}
```

Untuk menukar senarai kategori, ubah `CATEGORIES` di bahagian atas `assets/js/app.js`.

> **Penting:** semua produk contoh menggunakan `https://shopee.com.my` dan gambar Unsplash. Gantikan dengan pautan affiliate dan gambar sebenar anda sebelum laman diterbitkan.

## Menukar tema

Warna, fon dan bayang ditetapkan dalam `assets/js/tailwind-config.js` (`matcha`, `berry`, `ink`, `paper`). Ubah nilai di situ dan seluruh laman akan mengikut.

## Deploy

**GitHub Pages**
1. Push projek ke GitHub (cabang `main`).
2. Di *Settings → Pages*, pilih sumber **GitHub Actions**.
3. Workflow `.github/workflows/pages.yml` akan menerbitkan laman pada setiap push.

**Netlify / Vercel**
Import repositori. Tiada arahan build diperlukan dan direktori terbit ialah akar projek.

## Nota

- Tailwind dimuatkan melalui CDN supaya projek kekal tanpa build. Ini sesuai untuk laman kecil. Untuk trafik tinggi, pertimbangkan menukar kepada Tailwind CLI supaya CSS dioptimumkan.
- Produk yang ditambah melalui borang hanya disimpan dalam pelayar pengguna itu. Untuk produk kekal, tambahkan ke `data/products.js`.
- Pastikan anda mematuhi syarat Program Affiliate Shopee, termasuk pendedahan afiliasi yang jelas (sudah disediakan di dalam laman).

## Lesen

MIT. Lihat [LICENSE](LICENSE).
