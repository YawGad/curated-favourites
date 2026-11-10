"use strict";

const CATEGORIES = ['Skincare & Hijab', 'Gadget & Tech', 'Home & Aesthetic', 'Fashion'];
const STORAGE_KEY = 'curated_favourites_custom_products';

const defaultProducts = window.DEFAULT_PRODUCTS || [];

function loadCustom() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch (e) { return []; }
}
function saveCustom(list) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch (e) {}
}

let customProducts = loadCustom();
let products = [...customProducts, ...defaultProducts];
let currentCategory = 'All';
let currentSearch = '';
let currentSort = 'default';
let activeModalProduct = null;

const FALLBACK_IMG = 'https://placehold.co/600x600/E4EDDD/1F433A?text=Curated+Favourites';

// Escape HTML to prevent injection from user-added content
function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function safeUrl(u) {
    try { const x = new URL(u); return (x.protocol === 'http:' || x.protocol === 'https:') ? x.href : '#'; } catch (e) { return '#'; }
}
const rm = n => 'RM ' + Number(n).toFixed(2);

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('new-category').innerHTML = CATEGORIES.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
    renderCategories();
    renderProducts();
    lucide.createIcons();
});

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeProductModal(); closeAdminModal(); }
});

function renderCategories() {
    const bar = document.getElementById('category-bar');
    const items = ['All', ...CATEGORIES];
    bar.innerHTML = items.map(c => {
        const active = c === currentCategory;
        const label = c === 'All' ? 'Semua' : c;
        return `<button role="tab" aria-selected="${active}" onclick="filterCategory('${esc(c)}')" class="whitespace-nowrap h-10 px-4 rounded-full text-sm font-semibold border transition ${active ? 'bg-matcha-800 text-white border-matcha-800' : 'bg-white text-ink-soft border-line hover:border-matcha-700 hover:text-ink'}">${esc(label)}</button>`;
    }).join('');
}

function updateStats() {
    document.getElementById('stat-count').textContent = products.length;
    document.getElementById('stat-cats').textContent = CATEGORIES.length;
    const avg = products.reduce((a, p) => a + p.rating, 0) / (products.length || 1);
    document.getElementById('stat-rating').textContent = avg.toFixed(1);
}

function renderProducts() {
    const grid = document.getElementById('product-grid');
    const emptyState = document.getElementById('empty-state');
    const q = currentSearch.trim().toLowerCase();

    let filtered = products.filter(p => {
        const okCat = currentCategory === 'All' || p.category === currentCategory;
        const okSearch = !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.note.toLowerCase().includes(q);
        return okCat && okSearch;
    });

    if (currentSort === 'low-high') filtered.sort((a, b) => a.price - b.price);
    else if (currentSort === 'high-low') filtered.sort((a, b) => b.price - a.price);
    else if (currentSort === 'rating') filtered.sort((a, b) => b.rating - a.rating);

    document.getElementById('product-count').textContent = `Menunjukkan ${filtered.length} daripada ${products.length} produk`;
    updateStats();

    if (!filtered.length) {
        grid.innerHTML = '';
        emptyState.classList.remove('hidden');
        lucide.createIcons();
        return;
    }
    emptyState.classList.add('hidden');

    grid.innerHTML = filtered.map((p, i) => `
        <article class="group bg-white rounded-2xl border border-line shadow-card hover:shadow-lift hover:-translate-y-0.5 transition-all duration-300 flex flex-col overflow-hidden fade-up" style="animation-delay:${Math.min(i, 8) * 40}ms">
            <button onclick="openProductModal(${p.id})" class="relative block aspect-square bg-matcha-50 overflow-hidden text-left" aria-label="Lihat butiran ${esc(p.name)}">
                <img src="${esc(safeUrl(p.image))}" alt="${esc(p.name)}" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK_IMG}'" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                <span class="absolute top-3 left-3 bg-white/95 text-ink text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-sm">${esc(p.badge || 'Pilihan Shopee')}</span>
            </button>
            <div class="p-4 sm:p-5 flex flex-col flex-1">
                <p class="text-[11px] font-semibold uppercase tracking-wider text-matcha-600">${esc(p.category)}</p>
                <h3 class="mt-1.5 font-display font-bold text-[15px] leading-snug line-clamp-2 min-h-[2.6rem]">
                    <button onclick="openProductModal(${p.id})" class="text-left hover:text-matcha-700 transition">${esc(p.name)}</button>
                </h3>
                <div class="mt-2 flex items-center gap-1.5 text-xs">
                    <i data-lucide="star" class="w-3.5 h-3.5 fill-amber-400 text-amber-400"></i>
                    <span class="font-semibold">${p.rating.toFixed(1)}</span>
                </div>
                <p class="mt-3 text-xs text-ink-soft leading-relaxed line-clamp-2">${esc(p.note)}</p>
                <div class="mt-auto pt-4 flex items-center justify-between gap-3">
                    <span class="font-display font-extrabold text-lg text-matcha-800">${rm(p.price)}</span>
                    <a href="${esc(safeUrl(p.link))}" target="_blank" rel="noopener noreferrer sponsored" onclick="showToast('Membawa anda ke Shopee...')" class="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-matcha-800 hover:bg-matcha-900 text-white text-xs font-semibold transition">
                        Beli <i data-lucide="arrow-up-right" class="w-3.5 h-3.5"></i>
                    </a>
                </div>
            </div>
        </article>
    `).join('');

    lucide.createIcons();
}

function filterCategory(category) {
    currentCategory = category;
    renderCategories();
    renderProducts();
}

function filterProducts() {
    const input = document.getElementById('search-input');
    const clearBtn = document.getElementById('clear-search-btn');
    currentSearch = input.value;
    clearBtn.classList.toggle('hidden', !currentSearch.length);
    clearBtn.classList.toggle('flex', !!currentSearch.length);
    renderProducts();
}

function clearSearch() {
    document.getElementById('search-input').value = '';
    filterProducts();
}

function sortProducts() {
    currentSort = document.getElementById('sort-select').value;
    renderProducts();
}

function resetFilters() {
    currentCategory = 'All';
    currentSort = 'default';
    document.getElementById('sort-select').value = 'default';
    document.getElementById('search-input').value = '';
    filterProducts();
    renderCategories();
}

// Modals
function openProductModal(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    activeModalProduct = p;

    document.getElementById('modal-category').textContent = p.category;
    const img = document.getElementById('modal-img');
    img.onerror = () => { img.onerror = null; img.src = FALLBACK_IMG; };
    img.src = safeUrl(p.image);
    img.alt = p.name;
    document.getElementById('modal-price').textContent = rm(p.price);
    document.getElementById('modal-title').textContent = p.name;
    document.getElementById('modal-rating').textContent = p.rating.toFixed(1);
    document.getElementById('modal-desc').textContent = `Produk pilihan dalam kategori ${p.category} dengan penilaian tinggi daripada pembeli di Shopee. Semak harga dan baucar terkini terus di halaman Shopee sebelum membeli.`;
    document.getElementById('modal-note').textContent = p.note;
    document.getElementById('modal-buy-btn').href = safeUrl(p.link);

    const modal = document.getElementById('product-modal');
    const content = document.getElementById('modal-content');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
        modal.classList.remove('opacity-0');
        content.classList.remove('translate-y-4', 'sm:scale-95');
    });
    lucide.createIcons();
    const closeBtn = modal.querySelector('button[aria-label="Tutup"]');
    if (closeBtn) closeBtn.focus({ preventScroll: true });
}

function closeProductModal() {
    const modal = document.getElementById('product-modal');
    if (modal.classList.contains('hidden')) return;
    modal.classList.add('opacity-0');
    document.getElementById('modal-content').classList.add('translate-y-4', 'sm:scale-95');
    document.body.style.overflow = '';
    setTimeout(() => modal.classList.add('hidden'), 200);
}

function openAdminModal() {
    const modal = document.getElementById('admin-modal');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => modal.classList.remove('opacity-0'));
    lucide.createIcons();
}

function closeAdminModal() {
    const modal = document.getElementById('admin-modal');
    if (modal.classList.contains('hidden')) return;
    modal.classList.add('opacity-0');
    document.body.style.overflow = '';
    setTimeout(() => {
        modal.classList.add('hidden');
        document.getElementById('add-product-form').reset();
    }, 200);
}

function handleAddNewProduct(e) {
    e.preventDefault();
    const newProd = {
        id: Date.now(),
        name: document.getElementById('new-name').value.trim(),
        category: document.getElementById('new-category').value,
        price: parseFloat(document.getElementById('new-price').value),
        rating: 5.0,
        badge: "Baharu",
        link: document.getElementById('new-link').value.trim(),
        image: document.getElementById('new-image').value.trim(),
        note: document.getElementById('new-note').value.trim()
    };
    customProducts.unshift(newProd);
    saveCustom(customProducts);
    products = [...customProducts, ...defaultProducts];
    closeAdminModal();
    renderProducts();
    showToast('Produk baharu berjaya ditambah');
}

// Toast
let toastTimer;
function showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-message').textContent = msg;
    toast.classList.remove('translate-y-24', 'opacity-0');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.add('translate-y-24', 'opacity-0'), 3000);
}

async function copyCurrentLink() {
    if (!activeModalProduct) return;
    const text = activeModalProduct.link;
    try {
        await navigator.clipboard.writeText(text);
    } catch (err) {
        const t = document.createElement('input');
        t.value = text;
        document.body.appendChild(t);
        t.select();
        document.execCommand('copy');
        document.body.removeChild(t);
    }
    showToast('Pautan disalin ke papan keratan');
}
