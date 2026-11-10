# Curated Favourites

Laman showcase Shopee affiliate yang ringkas dan moden. Pengguna boleh menjelajah koleksi produk pilihan, menapis ikut kategori, mencari, menyusun ikut harga atau rating, dan terus ke halaman produk di Shopee melalui pautan affiliate anda.

Laman ini ialah **laman statik**: tiada pelayan, tiada pangkalan data dan tiada langkah build.

## Ciri-ciri

- Carian, tapisan kategori dan susunan (harga, rating)
- Modal butiran produk dengan nota kurator
- Panel admin (`admin.html`) untuk tambah, edit, padam dan susun produk. Pengguna biasa tidak perlu log masuk
- Pendedahan afiliasi, `rel="sponsored"` pada pautan keluar
- Responsif, boleh diakses (label, `aria`, navigasi papan kekunci, `prefers-reduced-motion`)
- Input pengguna di-escape dan URL disahkan sebelum dipaparkan

## Struktur projek

```
curated-favourites/
├── index.html                  # Laman awam (tanpa log masuk)
├── admin.html                  # Panel admin (perlu GitHub token)
├── assets/
│   ├── css/styles.css          # Gaya tambahan (scrollbar, animasi, fokus)
│   ├── js/
│   │   ├── tailwind-config.js  # Warna, fon dan bayang tema
│   │   ├── app.js              # Logik laman awam
│   │   └── admin.js            # Logik panel admin
│   └── img/favicon.svg
├── data/products.js            # Produk + kategori (dikemas kini oleh admin)
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

## Panel admin

Buka `admin.html` (cth. `https://<username>.github.io/curated-favourites/admin.html`). Panel ini membolehkan anda:

- tambah, edit, padam dan susun semula produk
- urus kategori
- pratonton gambar sebelum simpan
- muat turun sandaran `products.js`

Perubahan disimpan sebagai **draf** dahulu. Tekan **Terbitkan** untuk commit ke repositori. Workflow GitHub Pages akan menerbitkan semula laman dalam kira-kira 1 minit.

### Cara kerja dan keselamatan

Laman ini statik, jadi tiada pelayan untuk menyimpan kata laluan. Panel admin menulis terus ke repositori melalui GitHub API menggunakan **token anda sendiri**:

- Pengguna biasa tidak perlu log masuk dan tidak nampak apa-apa pautan admin.
- Sesiapa yang membuka `admin.html` hanya nampak borang log masuk. Tanpa token yang sah, mereka tidak boleh mengubah apa-apa. Kawalan akses sebenar dibuat oleh GitHub, bukan oleh halaman ini.
- Token disimpan dalam pelayar anda sahaja (sesi pelayar secara lalai, atau `localStorage` jika anda tanda "Ingat saya") dan hanya dihantar ke `api.github.com`.

### Mendapatkan token

1. GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
2. **Repository access**: *Only select repositories*, pilih repositori ini sahaja.
3. **Repository permissions → Contents**: *Read and write*.
4. Tetapkan tarikh luput yang munasabah, kemudian salin token dan tampal di halaman admin.

Jangan guna "Ingat saya" pada komputer awam dan jangan commit token ke repositori. Jika token terdedah, padam (revoke) di GitHub serta-merta.

### Edit manual (alternatif)

Anda juga boleh edit `data/products.js` terus. Format setiap produk:

```js
{
  "id": 7,                             // nombor unik
  "name": "Nama Produk",
  "category": "Home & Aesthetic",      // mesti ada dalam window.CATEGORIES
  "price": 49.9,
  "rating": 4.8,
  "badge": "Terlaris",
  "link": "https://shope.ee/xxxxxxx",  // pautan affiliate anda
  "image": "https://...",
  "note": "Kenapa anda cadangkan produk ini."
}
```

> **Penting:** produk contoh menggunakan `https://shopee.com.my` dan gambar Unsplash. Gantikan dengan pautan affiliate dan gambar sebenar anda sebelum laman diterbitkan.

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
- `admin.html` ada `noindex` supaya tidak disenaraikan enjin carian, tetapi ia tetap boleh dicapai oleh sesiapa yang tahu URL-nya. Ini selamat kerana tanpa token GitHub yang sah, tiada apa yang boleh diubah.
- Pastikan anda mematuhi syarat Program Affiliate Shopee, termasuk pendedahan afiliasi yang jelas (sudah disediakan di dalam laman).

## Lesen

MIT. Lihat [LICENSE](LICENSE).
