"use strict";

/* ===========================================================
   Panel admin: mengurus data/products.js melalui GitHub API.
   Keselamatan: hanya pemegang token GitHub yang sah (kebenaran
   Contents: write pada repositori ini) boleh menyimpan perubahan.
   =========================================================== */

const API = 'https://api.github.com';
const FILE = 'data/products.js';
const CFG_KEY = 'cf_admin_cfg_v1';
const FALLBACK_IMG = 'https://placehold.co/200x200/E4EDDD/1F433A?text=No+Image';

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeUrl = u => { try { const x = new URL(u); return (x.protocol === 'http:' || x.protocol === 'https:') ? x.href : ''; } catch (e) { return ''; } };
const rm = n => 'RM ' + Number(n).toFixed(2);

const state = {
    token: '', owner: '', repo: '', branch: 'main',
    sha: null, products: [], categories: [],
    dirty: false, editingId: null, search: ''
};

/* ---------- Storan konfigurasi ---------- */
function loadCfg() {
    for (const store of [sessionStorage, localStorage]) {
        try { const v = JSON.parse(store.getItem(CFG_KEY)); if (v && v.token) return { ...v, remember: store === localStorage }; } catch (e) {}
    }
    return null;
}
function saveCfg(remember) {
    const data = JSON.stringify({ token: state.token, owner: state.owner, repo: state.repo, branch: state.branch });
    try { localStorage.removeItem(CFG_KEY); sessionStorage.removeItem(CFG_KEY); } catch (e) {}
    try { (remember ? localStorage : sessionStorage).setItem(CFG_KEY, data); } catch (e) {}
}
function clearCfg() {
    try { localStorage.removeItem(CFG_KEY); sessionStorage.removeItem(CFG_KEY); } catch (e) {}
}

/* ---------- Pembantu GitHub API ---------- */
async function gh(path, opts = {}) {
    const res = await fetch(API + path, {
        cache: 'no-store',
        ...opts,
        headers: {
            'Accept': 'application/vnd.github+json',
            'Authorization': 'Bearer ' + state.token,
            'X-GitHub-Api-Version': '2022-11-28',
            ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
            ...(opts.headers || {})
        }
    });
    let data = null;
    try { data = await res.json(); } catch (e) {}
    if (!res.ok) {
        const err = new Error((data && data.message) || ('HTTP ' + res.status));
        err.status = res.status;
        throw err;
    }
    return data;
}
function explain(err) {
    if (err.status === 401) return 'Token tidak sah atau sudah luput.';
    if (err.status === 403) return 'Akses ditolak atau had kadar dicapai. Semak kebenaran token.';
    if (err.status === 404) return 'Repositori atau fail tidak ditemui, atau token tiada akses ke repositori ini.';
    if (err.status === 409 || err.status === 422) return 'Konflik versi. Fail telah berubah di GitHub. Muat semula data dahulu.';
    if (err instanceof TypeError) return 'Tiada sambungan internet atau permintaan disekat.';
    return err.message || 'Ralat tidak diketahui.';
}
function b64decode(b64) {
    const bin = atob(b64.replace(/\s/g, ''));
    const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
}
function b64encode(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
}
const contentsPath = () => `/repos/${encodeURIComponent(state.owner)}/${encodeURIComponent(state.repo)}/contents/${FILE}`;

/* ---------- Format data ---------- */
function parseData(text) {
    const p = text.match(/window\.DEFAULT_PRODUCTS\s*=\s*(\[\]|\[[\s\S]*\n\])\s*;/);
    if (!p) throw new Error('Format data/products.js tidak dikenali.');
    const products = JSON.parse(p[1]);
    const c = text.match(/window\.CATEGORIES\s*=\s*(\[\]|\[[\s\S]*?\n\])\s*;/);
    const categories = c ? JSON.parse(c[1]) : [...new Set(products.map(x => x.category))];
    return { products, categories };
}
function serializeData() {
    return '// Senarai produk dan kategori. Dikemas kini melalui admin.html (boleh juga diedit manual).\n'
        + '// Medan produk: id, name, category, price, rating, badge, link, image, note\n'
        + 'window.CATEGORIES = ' + JSON.stringify(state.categories, null, 2) + ';\n\n'
        + 'window.DEFAULT_PRODUCTS = ' + JSON.stringify(state.products, null, 2) + ';\n';
}

async function loadData() {
    const file = await gh(`${contentsPath()}?ref=${encodeURIComponent(state.branch)}`);
    state.sha = file.sha;
    const { products, categories } = parseData(b64decode(file.content));
    state.products = products;
    state.categories = categories;
    state.dirty = false;
}

/* ---------- UI asas ---------- */
let toastTimer;
function toast(msg, isError = false) {
    $('toast-message').textContent = msg;
    $('toast-icon').className = 'w-6 h-6 rounded-full flex items-center justify-center shrink-0 ' + (isError ? 'bg-berry-500' : 'bg-matcha-500');
    $('toast').classList.remove('translate-y-24', 'opacity-0');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('toast').classList.add('translate-y-24', 'opacity-0'), isError ? 6000 : 3500);
}
function icons() { if (window.lucide) lucide.createIcons(); }
function setBusy(btn, busy, label) {
    btn.disabled = busy;
    btn.classList.toggle('opacity-60', busy);
    const span = btn.querySelector('span');
    if (span && label) span.textContent = label;
}
function openModal(id) { const m = $(id); m.classList.remove('hidden'); m.classList.add('flex'); document.body.style.overflow = 'hidden'; icons(); }
function closeModals() {
    document.querySelectorAll('[id^="modal-"]').forEach(m => { m.classList.add('hidden'); m.classList.remove('flex'); });
    document.body.style.overflow = '';
}
function markDirty() { state.dirty = true; $('dirty-bar').classList.remove('hidden'); renderAll(); }
function clearDirty() { state.dirty = false; $('dirty-bar').classList.add('hidden'); }

/* ---------- Paparan ---------- */
function showApp() {
    $('login-view').classList.add('hidden');
    $('app-view').classList.remove('hidden');
    $('btn-logout').classList.remove('hidden');
    $('btn-logout').classList.add('inline-flex');
    $('repo-label').textContent = `${state.owner}/${state.repo} · cabang ${state.branch}`;
    renderAll();
}
function renderAll() { renderStats(); renderList(); renderCats(); fillCategorySelect(); icons(); }

function renderStats() {
    $('st-products').textContent = state.products.length;
    $('st-cats').textContent = state.categories.length;
    const avg = state.products.reduce((a, p) => a + (Number(p.rating) || 0), 0) / (state.products.length || 1);
    $('st-rating').textContent = avg.toFixed(1);
}

function renderList() {
    const q = state.search.trim().toLowerCase();
    const searching = q.length > 0;
    const rows = state.products
        .map((p, i) => ({ p, i }))
        .filter(({ p }) => !q || [p.name, p.category, p.note, p.badge].join(' ').toLowerCase().includes(q));

    if (!rows.length) {
        $('list').innerHTML = `<li class="bg-white border border-dashed border-line rounded-2xl py-14 text-center text-sm text-ink-soft">${state.products.length ? 'Tiada produk sepadan dengan carian.' : 'Belum ada produk. Tekan "Tambah produk" untuk mula.'}</li>`;
        return;
    }
    const last = state.products.length - 1;
    $('list').innerHTML = rows.map(({ p, i }) => `
        <li class="bg-white border border-line rounded-2xl shadow-card p-3 sm:p-4 flex gap-3 sm:gap-4 items-center">
            <img src="${esc(safeUrl(p.image) || FALLBACK_IMG)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK_IMG}'" class="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover bg-matcha-50 border border-line shrink-0">
            <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span class="text-[11px] font-semibold uppercase tracking-wider text-matcha-600">${esc(p.category)}</span>
                    ${p.badge ? `<span class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-berry-50 text-berry-600">${esc(p.badge)}</span>` : ''}
                </div>
                <p class="mt-0.5 font-display font-bold text-[15px] leading-snug truncate">${esc(p.name)}</p>
                <p class="mt-0.5 text-xs text-ink-soft"><span class="font-semibold text-matcha-800">${rm(p.price)}</span> · rating ${Number(p.rating).toFixed(1)}</p>
            </div>
            <div class="flex items-center gap-1 shrink-0">
                <button data-act="up" data-id="${p.id}" ${searching || i === 0 ? 'disabled' : ''} aria-label="Naik" class="w-9 h-9 rounded-lg hover:bg-matcha-50 text-ink-soft disabled:opacity-25 disabled:hover:bg-transparent flex items-center justify-center"><i data-lucide="arrow-up" class="w-4 h-4"></i></button>
                <button data-act="down" data-id="${p.id}" ${searching || i === last ? 'disabled' : ''} aria-label="Turun" class="w-9 h-9 rounded-lg hover:bg-matcha-50 text-ink-soft disabled:opacity-25 disabled:hover:bg-transparent flex items-center justify-center"><i data-lucide="arrow-down" class="w-4 h-4"></i></button>
                <button data-act="edit" data-id="${p.id}" aria-label="Edit" class="w-9 h-9 rounded-lg hover:bg-matcha-50 text-matcha-700 flex items-center justify-center"><i data-lucide="pencil" class="w-4 h-4"></i></button>
                <button data-act="del" data-id="${p.id}" aria-label="Padam" class="w-9 h-9 rounded-lg hover:bg-berry-50 text-berry-600 flex items-center justify-center"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </div>
        </li>`).join('');
}

function fillCategorySelect(selected) {
    const sel = $('f-category');
    const keep = selected ?? sel.value;
    sel.innerHTML = state.categories.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
    if (keep && state.categories.includes(keep)) sel.value = keep;
}

function renderCats() {
    const count = c => state.products.filter(p => p.category === c).length;
    $('cat-list').innerHTML = state.categories.length ? state.categories.map(c => {
        const n = count(c);
        return `<li class="flex items-center justify-between gap-3 bg-matcha-50 rounded-xl px-3.5 py-2.5 text-sm">
            <span class="font-medium">${esc(c)} <span class="text-ink-mute font-normal">· ${n} produk</span></span>
            <button data-cat="${esc(c)}" ${n ? 'disabled' : ''} aria-label="Padam kategori" class="w-8 h-8 rounded-lg text-berry-600 hover:bg-berry-50 disabled:opacity-25 disabled:hover:bg-transparent flex items-center justify-center"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
        </li>`;
    }).join('') : '<li class="text-sm text-ink-soft">Tiada kategori.</li>';
}

/* ---------- Borang produk ---------- */
function openProductForm(id) {
    state.editingId = id ?? null;
    const p = id != null ? state.products.find(x => x.id === id) : null;
    $('mp-title').textContent = p ? 'Edit produk' : 'Tambah produk';
    $('f-error').classList.add('hidden');
    fillCategorySelect(p ? p.category : state.categories[0]);
    $('f-name').value = p ? p.name : '';
    $('f-badge').value = p ? (p.badge || '') : '';
    $('f-price').value = p ? p.price : '';
    $('f-rating').value = p ? p.rating : 5;
    $('f-link').value = p ? p.link : '';
    $('f-image').value = p ? p.image : '';
    $('f-note').value = p ? p.note : '';
    updatePreview();
    openModal('modal-product');
    $('f-name').focus();
}
function updatePreview() { $('f-preview').src = safeUrl($('f-image').value) || FALLBACK_IMG; }

function submitProduct(e) {
    e.preventDefault();
    const fail = msg => { const el = $('f-error'); el.textContent = msg; el.classList.remove('hidden'); };
    const name = $('f-name').value.trim();
    const category = $('f-category').value;
    const price = parseFloat($('f-price').value);
    const rating = parseFloat($('f-rating').value);
    const link = safeUrl($('f-link').value.trim());
    const image = safeUrl($('f-image').value.trim());
    const note = $('f-note').value.trim();
    const badge = $('f-badge').value.trim();

    if (!name) return fail('Nama produk diperlukan.');
    if (!category) return fail('Pilih kategori. Tambah kategori dahulu jika belum ada.');
    if (!Number.isFinite(price) || price < 0) return fail('Masukkan harga yang sah.');
    if (!Number.isFinite(rating) || rating < 0 || rating > 5) return fail('Rating mesti antara 0 dan 5.');
    if (!link) return fail('Pautan Shopee mesti bermula dengan http:// atau https://');
    if (!image) return fail('Pautan gambar mesti bermula dengan http:// atau https://');
    if (!note) return fail('Nota kurator diperlukan.');

    const item = { name, category, price: Math.round(price * 100) / 100, rating: Math.round(rating * 10) / 10, badge, link, image, note };
    if (state.editingId != null) {
        const i = state.products.findIndex(x => x.id === state.editingId);
        state.products[i] = { id: state.editingId, ...item };
    } else {
        const id = state.products.reduce((m, p) => Math.max(m, Number(p.id) || 0), 0) + 1;
        state.products.unshift({ id, ...item });
    }
    closeModals();
    markDirty();
    toast('Draf disimpan. Tekan "Terbitkan" untuk kemas kini laman.');
}

/* ---------- Tindakan senarai ---------- */
function onListClick(e) {
    const btn = e.target.closest('button[data-act]');
    if (!btn || btn.disabled) return;
    const id = Number(btn.dataset.id);
    const i = state.products.findIndex(p => p.id === id);
    if (i < 0) return;
    const act = btn.dataset.act;
    if (act === 'edit') return openProductForm(id);
    if (act === 'del') {
        if (!confirm(`Padam "${state.products[i].name}"?`)) return;
        state.products.splice(i, 1);
        return markDirty();
    }
    const j = act === 'up' ? i - 1 : i + 1;
    if (j < 0 || j >= state.products.length) return;
    [state.products[i], state.products[j]] = [state.products[j], state.products[i]];
    markDirty();
}

function onCatSubmit(e) {
    e.preventDefault();
    const v = $('cat-new').value.trim();
    if (!v) return;
    if (state.categories.some(c => c.toLowerCase() === v.toLowerCase())) return toast('Kategori itu sudah wujud.', true);
    state.categories.push(v);
    $('cat-new').value = '';
    markDirty();
}
function onCatClick(e) {
    const btn = e.target.closest('button[data-cat]');
    if (!btn || btn.disabled) return;
    state.categories = state.categories.filter(c => c !== btn.dataset.cat);
    markDirty();
}

/* ---------- Terbit / buang / sandaran ---------- */
async function publish() {
    const btn = $('btn-publish');
    setBusy(btn, true, 'Menerbitkan...');
    try {
        const res = await gh(contentsPath(), {
            method: 'PUT',
            body: JSON.stringify({
                message: 'Kemas kini produk melalui panel admin',
                content: b64encode(serializeData()),
                sha: state.sha,
                branch: state.branch
            })
        });
        state.sha = res.content.sha;
        clearDirty();
        toast('Berjaya diterbitkan. Laman akan dikemas kini dalam kira-kira 1 minit.');
    } catch (err) {
        toast('Gagal menerbitkan: ' + explain(err), true);
    } finally {
        setBusy(btn, false, 'Terbitkan');
    }
}
async function discard() {
    if (!confirm('Buang semua perubahan yang belum diterbitkan dan muat semula data dari GitHub?')) return;
    try {
        await loadData();
        clearDirty();
        renderAll();
        toast('Perubahan dibuang. Data dimuat semula.');
    } catch (err) { toast('Gagal memuat semula: ' + explain(err), true); }
}
function downloadBackup() {
    const blob = new Blob([serializeData()], { type: 'text/javascript' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'products.js';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ---------- Log masuk / keluar ---------- */
async function login(e) {
    e.preventDefault();
    const err = $('login-error');
    err.classList.add('hidden');
    state.token = $('in-token').value.trim();
    state.owner = $('in-owner').value.trim();
    state.repo = $('in-repo').value.trim();
    state.branch = $('in-branch').value.trim() || 'main';
    const btn = $('btn-login');
    setBusy(btn, true, 'Menyemak...');
    try {
        const info = await gh(`/repos/${encodeURIComponent(state.owner)}/${encodeURIComponent(state.repo)}`);
        if (info.permissions && info.permissions.push === false) {
            throw Object.assign(new Error('Token ini tiada kebenaran menulis (Contents: Read and write) pada repositori ini.'), { status: 0 });
        }
        await loadData();
        saveCfg($('in-remember').checked);
        $('in-token').value = '';
        showApp();
    } catch (ex) {
        err.textContent = explain(ex);
        err.classList.remove('hidden');
    } finally {
        setBusy(btn, false, 'Log masuk');
    }
}
function logout() {
    if (state.dirty && !confirm('Ada perubahan belum diterbitkan. Keluar juga?')) return;
    state.dirty = false;
    clearCfg();
    location.reload();
}

/* ---------- Mula ---------- */
document.addEventListener('DOMContentLoaded', async () => {
    icons();
    $('login-form').addEventListener('submit', login);
    $('btn-logout').addEventListener('click', logout);
    $('btn-add').addEventListener('click', () => openProductForm());
    $('btn-cats').addEventListener('click', () => openModal('modal-cats'));
    $('btn-download').addEventListener('click', downloadBackup);
    $('btn-publish').addEventListener('click', publish);
    $('btn-discard').addEventListener('click', discard);
    $('form-product').addEventListener('submit', submitProduct);
    $('form-cat').addEventListener('submit', onCatSubmit);
    $('cat-list').addEventListener('click', onCatClick);
    $('list').addEventListener('click', onListClick);
    $('f-image').addEventListener('input', updatePreview);
    $('search').addEventListener('input', e => { state.search = e.target.value; renderList(); icons(); });

    document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeModals));
    document.querySelectorAll('[id^="modal-"]').forEach(m => m.addEventListener('click', e => { if (e.target === m) closeModals(); }));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModals(); });
    window.addEventListener('beforeunload', e => { if (state.dirty) { e.preventDefault(); e.returnValue = ''; } });

    // Log masuk automatik jika token telah diingati
    const cfg = loadCfg();
    if (cfg) {
        Object.assign(state, { token: cfg.token, owner: cfg.owner, repo: cfg.repo, branch: cfg.branch });
        $('in-owner').value = cfg.owner; $('in-repo').value = cfg.repo; $('in-branch').value = cfg.branch;
        try { await loadData(); showApp(); } catch (ex) { clearCfg(); const el = $('login-error'); el.textContent = 'Sesi lama tamat: ' + explain(ex); el.classList.remove('hidden'); }
    }
});