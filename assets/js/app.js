/* AQUAVEIL — single page storefront. Vanilla JS, no dependencies. */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const money = n => '$' + n.toFixed(2).replace(/\.00$/, '');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } }
};
const SUB_DISCOUNT = 0.15;
const icon = n => `<svg><use href="#i-${n}"/></svg>`;

/* ---------------- DATA ---------------- */
const PRODUCTS = [
  { id: 'dewdrop', a: '#7fd6d6', b: '#1b7f86', name: 'Dewdrop Gel Cream', type: 'Gel cream · 50 ml', ml: 50, price: 38, skin: ['oily', 'combo'], img: 'product-dewdrop-gel-cream', rating: 4.8, reviews: 412, badge: 'Bestseller', tags: ['Oil-free feel', 'Hyaluronic', 'Niacinamide'], desc: 'A cooling water-gel that floods skin with moisture and leaves zero shine.' },
  { id: 'cloud', a: '#f5d7c8', b: '#d9a58f', name: 'Cloud Barrier Cream', type: 'Rich cream · 50 ml', ml: 50, price: 44, skin: ['dry', 'sensitive'], img: 'product-cloud-barrier-cream', rating: 4.9, reviews: 538, badge: 'Barrier repair', tags: ['Ceramide NP', 'Squalane', 'Panthenol'], desc: 'A whipped, cushiony cream that rebuilds the barrier and holds water for 48 hours.' },
  { id: 'veil', a: '#a9b8f5', b: '#4f5fc4', name: 'Veil Hyaluron Serum-Cream', type: 'Pump · 40 ml', ml: 40, price: 52, skin: ['dry', 'oily', 'combo', 'sensitive'], img: 'product-hyaluron-veil-serum', rating: 4.8, reviews: 301, badge: 'Layer-friendly', tags: ['3-weight HA', 'Lightweight', 'Vegan'], desc: 'Three molecular weights of hyaluronic acid in a silky serum-cream hybrid.' },
  { id: 'midnight', a: '#7a5a35', b: '#1d120a', name: 'Midnight Recovery Balm', type: 'Night balm · 50 ml', ml: 50, price: 58, skin: ['dry'], img: 'product-midnight-recovery-balm', rating: 4.7, reviews: 187, badge: 'Overnight', tags: ['Squalane', 'Peptides', 'Shea'], desc: 'A melting overnight balm that works while you sleep and wakes up plump.' },
  { id: 'shield', a: '#ffd9a8', b: '#f08a5d', name: 'Mineral SPF 50 Fluid', type: 'Tinted-free tube · 40 ml', ml: 40, price: 41, skin: ['dry', 'oily', 'combo', 'sensitive'], img: 'product-mineral-spf-fluid', rating: 4.6, reviews: 264, badge: 'Daily shield', tags: ['Zinc oxide', 'No white cast', 'Hydrating'], desc: 'A hydrating mineral sunscreen-moisturizer that melts in with no chalk.' },
  { id: 'calm', a: '#f4bfd2', b: '#b4668a', name: 'Ceramide Calm Lotion', type: 'Pump · 60 ml', ml: 60, price: 46, skin: ['sensitive', 'combo'], img: 'product-ceramide-calm-lotion', rating: 4.9, reviews: 356, badge: 'Sensitive-safe', tags: ['3 Ceramides', 'Allantoin', 'Fragrance-free'], desc: 'A soothing lotion for reactive, redness-prone skin. Calm in every drop.' }
];
const P = id => PRODUCTS.find(p => p.id === id);
const imgSrc = p => `assets/images/${p.img}.webp`;
const sw = p => `<span class="sw" style="--a:${p.a};--b:${p.b}" role="img" aria-label="${esc(p.name)}">${icon('drop')}</span>`;

const DERMS = [
  { name: 'Dr. Anaya Rao', role: 'Board-certified dermatologist · Barrier science', img: 'derm-dr-anaya-rao', rate: 5, quote: 'The ceramide-to-cholesterol balance in Cloud is what I look for. It supports the barrier instead of just sitting on top of it.', pills: ['Barrier repair', 'Fragrance-free'] },
  { name: 'Dr. Lucas Meyer', role: 'Cosmetic dermatologist · Hydration research', img: 'derm-dr-lucas-meyer', rate: 5, quote: 'Layering three weights of hyaluronic acid in Veil gives hydration at different skin depths. It is elegant and genuinely effective.', pills: ['Multi-depth hydration', 'Lightweight'] },
  { name: 'Dr. Amara Okafor', role: 'Dermatologist · Sensitive & reactive skin', img: 'derm-dr-amara-okafor', rate: 5, quote: 'My reactive patients tolerate Ceramide Calm beautifully. No fragrance, no fuss, and visibly less redness within two weeks.', pills: ['Sensitive-safe', 'Redness-calming'] }
];

/* ---------------- STATE ---------------- */
let cart = store.get('av_cart', []);
let session = store.get('av_session', null); // email
const userKey = e => 'av_data_' + e;
const getData = () => session ? store.get(userKey(session), { orders: [], subs: [], routine: null, hydration: null }) : null;
const setData = d => session && store.set(userKey(session), d);

/* ---------------- UI HELPERS ---------------- */
const toastEl = $('#toast'); let toastT;
function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('on'), 2800); }
const overlay = $('#overlay');
function lock() { document.body.style.overflow = ($$('.modal.on,.drawer.on,.dashboard.on').length ? 'hidden' : ''); }
function openEl(el) { el.classList.add('on'); el.setAttribute('aria-hidden', 'false'); if (!el.classList.contains('modal') && !el.classList.contains('dashboard')) overlay.classList.add('on'); lock(); const f = el.querySelector('input,button'); if (f && el.classList.contains('modal')) setTimeout(() => f.focus(), 350); }
function closeEl(el) { el.classList.remove('on'); el.setAttribute('aria-hidden', 'true'); if (!$('.drawer.on')) overlay.classList.remove('on'); lock(); }
function closeAll() { $$('.modal.on,.drawer.on').forEach(closeEl); }
overlay.addEventListener('click', closeAll);
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeAll(); closeEl($('#dashboard')); } });
$$('[data-close]').forEach(b => b.addEventListener('click', () => closeEl(b.closest('.modal,.drawer'))));
$$('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m) closeEl(m); }));
$$('[data-open="privacy"]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); openEl($('#privacyModal')); }));

/* ---------------- NAV, PROGRESS, REVEAL ---------------- */
const nav = $('#nav'), prog = $('#progress');
const navAnchors = $$('#navLinks a[href^="#"]');
const sectionMap = navAnchors.map(a => {
  const hash = a.getAttribute('href');
  return { a, el: hash && hash !== '#' ? $(hash) : null };
}).filter(x => x.el);

function updateActiveNav() {
  const scrollPos = window.scrollY + 180;
  let current = null;
  for (const { a, el } of sectionMap) {
    const top = el.offsetTop;
    const height = el.offsetHeight;
    if (scrollPos >= top && scrollPos < top + height) {
      current = a;
    }
  }
  navAnchors.forEach(a => a.classList.toggle('active', a === current));
}

addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', scrollY > 30);
  const h = document.documentElement; prog.style.width = (scrollY / (h.scrollHeight - h.clientHeight) * 100) + '%';
  updateActiveNav();
}, { passive: true });
updateActiveNav();

const burger = $('#burger'), links = $('#navLinks');
burger.addEventListener('click', () => { const o = links.classList.toggle('open'); burger.setAttribute('aria-expanded', o); });
links.addEventListener('click', e => {
  if (e.target.tagName === 'A' || e.target.closest('.btn-icon')) {
    links.classList.remove('open');
    burger.setAttribute('aria-expanded', false);
    if (e.target.tagName === 'A') updateActiveNav();
  }
});
$('#year').textContent = new Date().getFullYear();

const scrollTopBtn = $('#scrollTopBtn');
if (scrollTopBtn) {
  addEventListener('scroll', () => { scrollTopBtn.classList.toggle('on', scrollY > 300); }, { passive: true });
  scrollTopBtn.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); });
}

const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
$$('.reveal').forEach((el, i) => { el.style.transitionDelay = (i % 4) * 80 + 'ms'; io.observe(el); });

// count up
const cio = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return; cio.unobserve(e.target);
  const to = +e.target.dataset.count; let t0;
  const step = t => { t0 ??= t; const k = Math.min((t - t0) / 1400, 1); e.target.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}));
$$('[data-count]').forEach(el => cio.observe(el));

// hero droplets
(() => {
  const w = $('.droplets'); if (!w) return;
  for (let i = 0; i < 16; i++) {
    const d = document.createElement('i'), s = 6 + Math.random() * 16;
    d.style.cssText = `left:${Math.random() * 100}%;width:${s}px;height:${s}px;animation-duration:${9 + Math.random() * 12}s;animation-delay:${-Math.random() * 18}s`;
    w.appendChild(d);
  }
})();

// cursor glow
if (matchMedia('(pointer:fine)').matches) {
  const g = $('.cursor-glow');
  addEventListener('pointermove', e => { g.style.left = e.clientX + 'px'; g.style.top = e.clientY + 'px'; }, { passive: true });
}

/* ---------------- 3D TILT ---------------- */
function initTilt(root = document) {
  $$('[data-tilt]', root).forEach(el => {
    if (el._tilt) return; el._tilt = true;
    const max = +el.dataset.tiltMax || 12;
    el.addEventListener('pointermove', e => {
      if (e.pointerType === 'touch' && !e.isPrimary) return;
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.style.transition = 'transform .08s linear';
      el.style.transform = `perspective(900px) rotateX(${(.5 - y) * max}deg) rotateY(${(x - .5) * max * 1.2}deg) translateZ(8px)`;
      el.style.setProperty('--mx', x * 100 + '%'); el.style.setProperty('--my', y * 100 + '%');
    });
    const reset = () => { el.style.transition = 'transform .6s cubic-bezier(.2,.8,.2,1)'; el.style.transform = ''; };
    el.addEventListener('pointerleave', reset); el.addEventListener('pointercancel', reset); el.addEventListener('pointerup', e => { if (e.pointerType === 'touch') reset(); });
  });
}

/* ---------------- CART ---------------- */
const cartCount = $('#cartCount');
function saveCart() { store.set('av_cart', cart); renderCart(); }
function addToCart(id, opts = {}) {
  const ex = cart.find(i => i.id === id && !!i.sub === !!opts.sub);
  if (ex) ex.qty += opts.qty || 1; else cart.push({ id, qty: opts.qty || 1, sub: !!opts.sub, freq: opts.freq || 4 });
  saveCart(); cartCount.classList.add('bump'); setTimeout(() => cartCount.classList.remove('bump'), 300);
  toast(`${P(id).name} added to your bag`);
}
const linePrice = i => P(i.id).price * (i.sub ? 1 - SUB_DISCOUNT : 1);
function totals() {
  let sub = 0, save = 0;
  cart.forEach(i => { const full = P(i.id).price * i.qty; sub += linePrice(i) * i.qty; save += full - linePrice(i) * i.qty; });
  return { sub, save, ship: sub >= 60 || cart.every(i => i.sub) ? 0 : (sub ? 5 : 0), count: cart.reduce((a, i) => a + i.qty, 0) };
}
function renderCart() {
  const t = totals(); cartCount.textContent = t.count;
  const body = $('#cartBody'), foot = $('#cartFoot');
  if (!cart.length) {
    body.innerHTML = `<div class="empty"><span class="ico">${icon('bag')}</span><h3>Your bag is empty</h3><p>Build a routine or browse the collection.</p><a class="btn btn-primary" href="#shop" data-close-drawer>Shop moisturizers</a></div>`;
    foot.innerHTML = ''; return;
  }
  body.innerHTML = cart.map((i, idx) => { const p = P(i.id); return `<div class="ci">${sw(p)}<div><b>${esc(p.name)}</b>
    <div class="row"><span>${money(linePrice(i))}${i.sub ? ` <s style="opacity:.5">${money(p.price)}</s>` : ''}</span>
    <div class="qty"><button data-q="${idx}" data-d="-1" aria-label="Decrease">−</button><span>${i.qty}</span><button data-q="${idx}" data-d="1" aria-label="Increase">+</button></div></div>
    <label class="sub-toggle"><input type="checkbox" data-s="${idx}" ${i.sub ? 'checked' : ''}> Auto-reorder −15%
    ${i.sub ? `<select data-f="${idx}" aria-label="Frequency">${[3, 4, 6, 8].map(w => `<option value="${w}" ${w === i.freq ? 'selected' : ''}>every ${w} wks</option>`).join('')}</select>` : ''}</label></div></div>`; }).join('');
  foot.innerHTML = `<div class="tot"><span>Subtotal</span><span>${money(t.sub)}</span></div>
    ${t.save ? `<div class="tot"><span>Auto-reorder savings</span><span class="sv">−${money(t.save)}</span></div>` : ''}
    <div class="tot"><span>Shipping</span><span>${t.ship ? money(t.ship) : 'Free'}</span></div>
    <div class="tot big"><span>Total</span><span>${money(t.sub + t.ship)}</span></div>
    <button class="btn btn-primary full" id="checkoutBtn">Checkout ${icon('arrow')}</button>
    <p class="fine" style="color:var(--muted);text-align:center">Demo checkout — no payment is taken.</p>`;
}
$('#cartBody').addEventListener('click', e => {
  const q = e.target.closest('[data-q]');
  if (q) { const i = cart[+q.dataset.q]; i.qty += +q.dataset.d; if (i.qty < 1) cart.splice(+q.dataset.q, 1); saveCart(); }
  if (e.target.closest('[data-close-drawer]')) closeEl($('#cartDrawer'));
});
$('#cartBody').addEventListener('change', e => {
  const s = e.target.dataset.s, f = e.target.dataset.f;
  if (s !== undefined) { cart[+s].sub = e.target.checked; saveCart(); }
  if (f !== undefined) { cart[+f].freq = +e.target.value; saveCart(); }
});
$('#cartFoot').addEventListener('click', e => { if (e.target.closest('#checkoutBtn')) checkout(); });
$('#cartBtn').addEventListener('click', () => openEl($('#cartDrawer')));

function checkout() {
  if (!session) { closeEl($('#cartDrawer')); pending = checkout; openLogin('Sign in to complete your order and manage auto-reorders.'); return; }
  const d = getData(), t = totals(), now = new Date();
  d.orders.unshift({ id: 'AV' + String(Date.now()).slice(-6), date: now.toISOString(), items: cart.map(i => ({ id: i.id, qty: i.qty, sub: i.sub })), total: +(t.sub + t.ship).toFixed(2) });
  cart.filter(i => i.sub).forEach(i => {
    const ex = d.subs.find(s => s.id === i.id && !s.cancelled);
    if (ex) { ex.every = i.freq; ex.qty = i.qty; } else d.subs.push({ uid: 's' + Date.now() + i.id, id: i.id, qty: i.qty, every: i.freq, next: addDays(now, i.freq * 7).toISOString(), paused: false, cancelled: false });
  });
  setData(d); cart = []; saveCart(); closeEl($('#cartDrawer'));
  toast('Order placed — thank you! ✨'); openDash();
}
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const fmtDate = d => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

/* ---------------- SHOP ---------------- */
function renderShop(filter = 'all') {
  const g = $('#productGrid');
  g.innerHTML = PRODUCTS.filter(p => filter === 'all' || p.skin.includes(filter)).map((p, i) => `
    <article class="card product tilt" data-tilt style="animation-delay:${i * 80}ms">
      <div class="pimg"><img src="${imgSrc(p)}" alt="${esc(p.name)} moisturizer" loading="lazy" width="900" height="1100"><span class="badge">${esc(p.badge)}</span></div>
      <h3>${esc(p.name)}</h3>
      <div class="stars">${'<svg><use href="#i-star"/></svg>'.repeat(5)}<em>${p.rating} (${p.reviews})</em></div>
      <p>${esc(p.desc)}</p>
      <div class="tags">${p.tags.map(t => `<span>${esc(t)}</span>`).join('')}</div>
      <div class="buy"><span class="pr">${money(p.price)}</span><button class="add" data-add="${p.id}">${icon('bag')} Add to bag</button></div>
    </article>`).join('');
  initTilt(g);
}
$('#shopTabs').addEventListener('click', e => { const b = e.target.closest('.tab'); if (!b) return; $$('.tab').forEach(t => t.classList.toggle('active', t === b)); renderShop(b.dataset.f); });
document.addEventListener('click', e => { const a = e.target.closest('[data-add]'); if (a) addToCart(a.dataset.add); });

/* ---------------- ROUTINE BUILDER ---------------- */
const sel = { skin: 'combo', concern: 'dehydration', time: 'both' };
let lastRoutine = null;
function buildRoutine() {
  const { skin, concern, time } = sel;
  const moist = { dry: 'cloud', oily: 'dewdrop', combo: 'dewdrop', sensitive: 'calm' }[skin];
  let night = { dry: 'midnight', oily: 'veil', combo: 'cloud', sensitive: 'calm' }[skin];
  if (concern === 'aging' && skin !== 'oily') night = 'midnight';
  if (concern === 'barrier') night = skin === 'oily' ? 'calm' : 'cloud';
  const am = [], pm = [];
  const hydrate = ['dehydration', 'aging'].includes(concern);
  if (hydrate) am.push({ p: 'veil', why: 'Layers hyaluronic acid for instant plumpness' });
  am.push({ p: concern === 'barrier' && skin !== 'sensitive' ? 'cloud' : moist, why: 'Seals in hydration through the day' });
  am.push({ p: 'shield', why: 'Daily mineral SPF protects your moisture barrier' });
  if (hydrate && concern === 'dehydration') pm.push({ p: 'veil', why: 'Replenishes water lost during the day' });
  pm.push({ p: night, why: 'Overnight repair while your skin renews' });
  const uniq = arr => arr.filter((s, i) => arr.findIndex(x => x.p === s.p) === i);
  lastRoutine = { sel: { ...sel }, am: time === 'pm' ? [] : uniq(am).map(s => s.p), pm: time === 'am' ? [] : uniq(pm).map(s => s.p) };
  const block = (title, ic, steps) => steps.length ? `<div class="rt-head"><h4>${icon(ic)} ${title}</h4></div><div class="steps">${steps.map((s, i) => { const p = P(s.p); return `<div class="step" style="animation-delay:${i * 90}ms">${sw(p)}<div><small>Step ${i + 1}</small><b>${esc(p.name)}</b><span>${esc(s.why)}</span></div><span class="price">${money(p.price)}</span></div>`; }).join('')}</div>` : '';
  const amS = time === 'pm' ? [] : uniq(am), pmS = time === 'am' ? [] : uniq(pm);
  const ids = [...new Set([...lastRoutine.am, ...lastRoutine.pm])];
  const total = ids.reduce((a, id) => a + P(id).price, 0);
  $('#routineResult').innerHTML = block('Morning ritual', 'sun', amS) + block('Night ritual', 'moon', pmS) +
    `<div class="rt-foot"><div><span class="fine" style="color:var(--muted)">${ids.length} products · ${money(total * (1 - SUB_DISCOUNT))} with auto-reorder</span><br><b>${money(total)}</b></div>
    <div class="acts"><button class="btn out sm" id="saveRoutine">Save routine</button><button class="btn btn-primary sm" id="addRoutine">Add all to bag</button></div></div>`;
}
$('#routineForm').addEventListener('click', e => {
  const c = e.target.closest('.chip'); if (!c) return; const grp = c.parentElement;
  $$('.chip', grp).forEach(x => x.classList.toggle('active', x === c)); sel[grp.dataset.name] = c.dataset.v; buildRoutine();
});
$('#routineResult').addEventListener('click', e => {
  if (e.target.closest('#addRoutine')) { [...new Set([...lastRoutine.am, ...lastRoutine.pm])].forEach(id => addToCart(id)); openEl($('#cartDrawer')); }
  if (e.target.closest('#saveRoutine')) {
    const save = () => { const d = getData(); d.routine = lastRoutine; setData(d); toast('Routine saved to your dashboard'); };
    if (session) save(); else { pending = save; openLogin('Sign in to save your routine.'); }
  }
});

/* ---------------- HYDRATION CALCULATOR ---------------- */
const circ = 2 * Math.PI * 86; let lastScore = 0;
function calcHydration() {
  const v = id => $(id).value, water = +v('#c-water'), sleep = +v('#c-sleep'), ac = +v('#c-ac');
  $('#o-water').textContent = water + (water === 1 ? ' glass' : ' glasses'); $('#o-sleep').textContent = sleep + ' h'; $('#o-ac').textContent = ac + ' h';
  const skin = v('#c-skin'), age = +v('#c-age');
  let s = 62 + Math.max(-12, Math.min(14, (water - 6) * 3)) + Math.max(-10, Math.min(8, (sleep - 7) * 2.5)) - ac * 1.1
    + { humid: 8, temperate: 0, dry: -10, cold: -8 }[v('#c-climate')] + { 20: 4, 35: 0, 50: -5, 65: -9 }[age]
    + { dry: -6, oily: 4, combo: 0, sensitive: -3 }[skin] - ($('#c-cleanse').checked ? 8 : 0);
  s = Math.round(Math.max(8, Math.min(98, s)));
  const label = s >= 80 ? 'Dewy' : s >= 60 ? 'Balanced' : s >= 40 ? 'Thirsty' : 'Parched';
  const msg = { Dewy: 'Your skin is glowing. Keep your ritual consistent.', Balanced: 'Solid foundation. A little more moisture will elevate it.', Thirsty: 'Your skin is asking for help. Time to layer hydration.', Parched: 'Your barrier needs urgent support. Start gentle and rich.' }[label];
  const tips = [];
  if (water < 7) tips.push('Aim for 7–8 glasses of water daily.');
  if (ac > 6) tips.push('Long AC / screen time dries skin — use a humidifier if you can.');
  if (sleep < 7) tips.push('Sleep is when skin repairs: try for 7+ hours.');
  if ($('#c-cleanse').checked) tips.push('Switch to a gentle, non-foaming cleanser.');
  if (['dry', 'cold'].includes(v('#c-climate'))) tips.push('Seal moisture in with a barrier cream while skin is still damp.');
  if (!tips.length) tips.push('Great habits! Re-test whenever the season changes.');
  $('#gVal').style.strokeDasharray = circ; $('#gVal').style.strokeDashoffset = circ * (1 - s / 100);
  animateNum($('#gScore'), lastScore, s); lastScore = s; $('#gLabel').textContent = label;
  $('#calcMsg').textContent = msg;
  $('#calcTips').innerHTML = tips.slice(0, 3).map(t => `<li>${icon('check')}<span>${esc(t)}</span></li>`).join('');
  const rid = s < 60 ? { dry: 'midnight', oily: 'veil', combo: 'veil', sensitive: 'calm' }[skin] : { dry: 'cloud', oily: 'dewdrop', combo: 'dewdrop', sensitive: 'calm' }[skin];
  const rp = P(rid);
  $('#calcRec').innerHTML = `<div class="rec">${sw(rp)}<div><small>Recommended for you</small><b>${esc(rp.name)}</b><span style="font-size:.8rem;color:var(--muted)">${money(rp.price)}</span></div><button class="add" data-add="${rp.id}">${icon('bag')} Add</button></div>`;
  return { score: s, label, date: new Date().toISOString() };
}
function animateNum(el, a, b) { let t0; const st = t => { t0 ??= t; const k = Math.min((t - t0) / 900, 1); el.textContent = Math.round(a + (b - a) * k); if (k < 1) requestAnimationFrame(st); }; requestAnimationFrame(st); }
let calcT;
$('#calcForm').addEventListener('input', () => { const r = calcHydration(); clearTimeout(calcT); calcT = setTimeout(() => { if (session) { const d = getData(); d.hydration = r; setData(d); } }, 600); });

/* ---------------- DERMATOLOGISTS ---------------- */
let dermI = 0, dermTimer;
function renderDerm(i) {
  dermI = i; const d = DERMS[i];
  $('#dermGrid').innerHTML = `<div class="derm-photo"><img src="assets/images/${d.img}.webp" alt="Portrait of ${esc(d.name)}" loading="lazy"></div>
    <div class="derm-text"><div class="rate">${'<svg><use href="#i-star"/></svg>'.repeat(d.rate)}</div><blockquote>“${esc(d.quote)}”</blockquote>
    <div class="who"><b>${esc(d.name)}</b><span>${esc(d.role)}</span></div><div class="derm-pills">${d.pills.map(p => `<span>${esc(p)}</span>`).join('')}</div></div>`;
  $$('.dt').forEach((b, k) => { b.classList.toggle('active', k === i); b.setAttribute('aria-selected', k === i); });
}
$('#dermTabs').innerHTML = DERMS.map((d, i) => `<button class="dt" role="tab" data-i="${i}"><img src="assets/images/${d.img}.webp" alt="${esc(d.name)}"><span>${esc(d.name)}</span></button>`).join('');
$('#dermTabs').addEventListener('click', e => { const b = e.target.closest('.dt'); if (!b) return; renderDerm(+b.dataset.i); startDerm(); });
function startDerm() { clearInterval(dermTimer); if (!matchMedia('(prefers-reduced-motion:reduce)').matches) dermTimer = setInterval(() => renderDerm((dermI + 1) % DERMS.length), 9000); }

/* ---------------- AUTO REORDER ---------------- */
function reorderCalc() {
  const p = P($('#r-product').value), uses = +$('#r-uses').value, amt = +$('#r-amt').value;
  $('#o-uses').textContent = uses + '×';
  const days = p.ml / (uses * amt), weeks = Math.max(2, Math.round(days / 7)), every = Math.max(2, Math.floor(days / 7));
  $('#r-weeks').textContent = weeks + ' wks'; $('#r-every').textContent = every + ' wks'; $('#r-save').textContent = money(p.price * SUB_DISCOUNT) + '/jar';
  const labels = ['Today', 'Shipment 2', 'Shipment 3', 'Shipment 4'], now = new Date();
  $('#timeline').innerHTML = `<h3 style="margin-bottom:10px;font-size:1.4rem;text-align:center">${esc(p.name)} — your next 4 shipments</h3>` + labels.map((l, i) => `<div class="tl" style="animation-delay:${i * 100}ms"><div class="dot">${i + 1}</div><div><b>${i ? fmtDate(addDays(now, every * 7 * i)) : 'Ships today'}</b><span>${money(p.price * (1 - SUB_DISCOUNT))} · free shipping · skip anytime</span></div></div>`).join('');
  return { id: p.id, every };
}
$('#r-product').innerHTML = PRODUCTS.map(p => `<option value="${p.id}">${esc(p.name)} — ${money(p.price)}</option>`).join('');
$('#reorderForm').addEventListener('input', reorderCalc);
$('#r-add').addEventListener('click', () => { const r = reorderCalc(); addToCart(r.id, { sub: true, freq: r.every }); openEl($('#cartDrawer')); });

/* ---------------- AUTH ---------------- */
let signup = false, pending = null;
async function hash(s) {
  try { if (crypto?.subtle) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('av:' + s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); } } catch { /* fallthrough */ }
  let h = 5381; for (const c of 'av:' + s) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0; return 'f' + h;
}
function setMode(su) {
  signup = su; $('#nameRow').classList.toggle('hide', !su); $('#loginTitle').textContent = su ? 'Create your account' : 'Welcome back';
  $('#loginBtn').textContent = su ? 'Create account' : 'Sign in'; $('#switchMode').textContent = su ? 'Sign in instead' : 'Create an account';
  $('#l-pass').autocomplete = su ? 'new-password' : 'current-password'; $('#loginMsg').textContent = '';
}
function openLogin(sub) { setMode(false); $('#loginSub').textContent = sub || 'Sign in to manage your routine and auto-reorders.'; openEl($('#loginModal')); }
$('#switchMode').addEventListener('click', () => setMode(!signup));
$('#loginForm').addEventListener('submit', async e => {
  e.preventDefault(); const msg = $('#loginMsg'); msg.className = 'form-msg err';
  const email = $('#l-email').value.trim().toLowerCase(), pass = $('#l-pass').value, name = $('#l-name').value.trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return void (msg.textContent = 'Please enter a valid email.');
  if (pass.length < 6) return void (msg.textContent = 'Password must be at least 6 characters.');
  const users = store.get('av_users', {}), h = await hash(pass);
  if (signup) {
    if (users[email]) return void (msg.textContent = 'An account with this email already exists.');
    if (!name) return void (msg.textContent = 'Please tell us your name.');
    users[email] = { name, h }; store.set('av_users', users);
  } else if (!users[email] || users[email].h !== h) return void (msg.textContent = 'Incorrect email or password.');
  session = email; store.set('av_session', email); $('#loginForm').reset(); msg.textContent = '';
  closeEl($('#loginModal')); updateAccount(); toast(`Welcome${signup ? '' : ' back'}, ${users[email].name.split(' ')[0]}!`);
  const fn = pending; pending = null; if (fn) fn();
});
function updateAccount() { const u = session && store.get('av_users', {})[session]; $('#accountLabel').textContent = u ? u.name.split(' ')[0] : 'Sign in'; }
$('#accountBtn').addEventListener('click', () => session ? openDash() : openLogin());
$('#logoutBtn').addEventListener('click', () => { session = null; store.set('av_session', null); updateAccount(); closeEl($('#dashboard')); toast('Signed out'); });
$$('[data-close-dash]').forEach(b => b.addEventListener('click', e => { if (b.tagName === 'A') e.preventDefault(); closeEl($('#dashboard')); }));

/* ---------------- DASHBOARD ---------------- */
function openDash() { renderDash(); openEl($('#dashboard')); $('#dashboard').scrollTop = 0; }
function renderDash() {
  const d = getData(), u = store.get('av_users', {})[session]; if (!d || !u) return;
  $('#dashHello').innerHTML = `Hello, <em>${esc(u.name.split(' ')[0])}</em>`;
  const active = d.subs.filter(s => !s.cancelled);
  $('#dashStats').innerHTML = [
    ['repeat', active.length, 'Active auto-reorders'], ['bag', d.orders.length, 'Orders placed'], ['drop', d.hydration ? d.hydration.score : '—', d.hydration ? 'Hydration score · ' + d.hydration.label : 'Hydration score (take the test)']
  ].map(([i, n, l]) => `<div class="card dstat"><span class="ico sm">${icon(i)}</span><b>${n}</b><span>${l}</span></div>`).join('');
  $('#dashSubs').innerHTML = active.length ? active.map(s => { const p = P(s.id); return `<div class="dsub">${sw(p)}<div><b>${esc(p.name)}</b>
    <small>${s.paused ? 'Paused' : 'Next shipment ' + fmtDate(s.next)} · every ${s.every} wks · qty ${s.qty}</small>
    <div class="acts"><select class="mini sel" data-freq="${s.uid}" aria-label="Frequency">${[3, 4, 6, 8].map(w => `<option value="${w}" ${w === s.every ? 'selected' : ''}>Every ${w} wks</option>`).join('')}</select>
    <button class="mini" data-skip="${s.uid}">Skip next</button><button class="mini" data-pause="${s.uid}">${s.paused ? 'Resume' : 'Pause'}</button><button class="mini danger" data-cancel="${s.uid}">Cancel</button></div></div></div>`; }).join('')
    : `<p class="dempty">No auto-reorders yet. Pick a moisturizer in the <a href="#reorder" data-close-dash-link style="color:var(--teal);font-weight:700">Auto-Reorder planner</a>.</p>`;
  const r = d.routine;
  $('#dashRoutine').innerHTML = r ? `<p class="dempty">${esc(r.sel.skin)} skin · ${esc(r.sel.concern)}</p>` +
    [['Morning', r.am], ['Night', r.pm]].filter(x => x[1].length).map(([t, a]) => `<p style="margin:8px 0"><b>${t}:</b> ${a.map(id => esc(P(id).name)).join(' → ')}</p>`).join('') +
    `<button class="btn btn-primary sm" id="reAddRoutine" style="margin-top:12px">Add routine to bag</button>` : `<p class="dempty">No saved routine yet. Build one in the Routine Builder.</p>`;
  $('#dashOrders').innerHTML = d.orders.length ? `<div style="overflow:auto"><table class="tbl"><thead><tr><th>Order</th><th>Date</th><th>Items</th><th>Total</th></tr></thead><tbody>${d.orders.map(o => `<tr><td>${o.id}</td><td>${fmtDate(o.date)}</td><td>${o.items.map(i => esc(P(i.id).name) + ' ×' + i.qty).join(', ')}</td><td>${money(o.total)}</td></tr>`).join('')}</tbody></table></div>` : `<p class="dempty">No orders yet.</p>`;
}
$('#dashboard').addEventListener('click', e => {
  const d = getData(); const find = id => d.subs.find(s => s.uid === id);
  const t = e.target;
  if (t.dataset.skip) { const s = find(t.dataset.skip); s.next = addDays(s.next, s.every * 7).toISOString(); toast('Next shipment skipped'); }
  else if (t.dataset.pause) { const s = find(t.dataset.pause); s.paused = !s.paused; if (!s.paused) s.next = addDays(new Date(), s.every * 7).toISOString(); toast(s.paused ? 'Auto-reorder paused' : 'Auto-reorder resumed'); }
  else if (t.dataset.cancel) { find(t.dataset.cancel).cancelled = true; toast('Auto-reorder cancelled'); }
  else if (t.id === 'reAddRoutine') { [...new Set([...d.routine.am, ...d.routine.pm])].forEach(id => addToCart(id)); closeEl($('#dashboard')); openEl($('#cartDrawer')); return; }
  else if (t.closest('[data-close-dash-link]')) { closeEl($('#dashboard')); return; }
  else return;
  setData(d); renderDash();
});
$('#dashboard').addEventListener('change', e => { if (e.target.dataset.freq) { const d = getData(), s = d.subs.find(x => x.uid === e.target.dataset.freq); s.every = +e.target.value; s.next = addDays(new Date(), s.every * 7).toISOString(); setData(d); renderDash(); toast('Frequency updated'); } });

/* ---------------- FORMS ---------------- */
$('#contactForm').addEventListener('submit', e => {
  e.preventDefault(); const f = e.target, m = $('#contactMsg'), v = n => f.elements[n].value.trim();
  if (!v('name') || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v('email')) || v('message').length < 5) { m.className = 'form-msg err'; m.textContent = 'Please complete all fields with a valid email.'; return; }
  m.className = 'form-msg ok'; m.textContent = `Thank you, ${v('name').split(' ')[0]} — we'll reply within one business day.`; f.reset();
});
$('#newsForm').addEventListener('submit', e => {
  e.preventDefault(); const i = e.target.querySelector('input'), m = $('#newsMsg');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(i.value.trim())) { m.textContent = 'Enter a valid email.'; return; }
  m.textContent = 'Subscribed. Welcome to the ritual!'; i.value = '';
});

/* ---------------- MARQUEE RUNNER ---------------- */
function initMarquee() {
  const container = document.querySelector('.marquee-banner');
  const content = document.querySelector('.marquee-content');
  if (!container || !content) return;

  let pos = 0;
  let isHovered = false;
  const speed = 0.8;

  container.addEventListener('mouseenter', () => isHovered = true);
  container.addEventListener('mouseleave', () => isHovered = false);

  function loop() {
    if (!isHovered) {
      pos -= speed;
      const firstGroup = content.firstElementChild;
      if (firstGroup) {
        const groupWidth = firstGroup.offsetWidth;
        if (groupWidth > 0 && Math.abs(pos) >= groupWidth) {
          pos += groupWidth;
        }
      }
      content.style.transform = `translate3d(${pos}px,0,0)`;
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

/* ---------------- INIT ---------------- */
renderShop(); buildRoutine(); calcHydration(); renderDerm(0); startDerm(); reorderCalc(); renderCart(); updateAccount(); initTilt(); initMarquee();
})();
