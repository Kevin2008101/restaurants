/* ============================================================
   ITÁN — main.js · no dependencies
   ============================================================ */
(() => {
'use strict';

document.documentElement.classList.add('js');

const $  = (s, c) => (c || document).querySelector(s);
const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
const clampNum = (v, a, b) => Math.min(b, Math.max(a, v));

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer  = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const NGN = n => '₦' + n.toLocaleString('en-NG');

/* ------------------------------------------------------------
   Storage helpers (front-end persistence — swap for an API later)
------------------------------------------------------------ */
const store = {
  get(k, fb) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } },
  set(k, v)  { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};

/* ------------------------------------------------------------
   Toasts
------------------------------------------------------------ */
const toastBox = $('#toasts');
function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = '<span class="t-dot"></span>' + msg;
  toastBox.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 450); }, 2600);
}

/* ------------------------------------------------------------
   Loader → hero choreography
------------------------------------------------------------ */
const body = document.body;
let loaderDone = false;
function finishLoader() {
  if (loaderDone) return;
  loaderDone = true;
  body.classList.remove('is-loading');
  body.classList.add('is-loaded');
  setTimeout(() => { const l = $('#loader'); if (l) l.style.display = 'none'; }, 1200);
}
if (reduceMotion) {
  finishLoader();
} else {
  const t0 = Date.now();
  if (document.readyState === 'complete') setTimeout(finishLoader, Math.max(0, 1250 - (Date.now() - t0)));
  else window.addEventListener('load', () => setTimeout(finishLoader, Math.max(0, 1250 - (Date.now() - t0))), { once: true });
  setTimeout(finishLoader, 3200); // failsafe
}

/* ------------------------------------------------------------
   Custom cursor (desktop only)
------------------------------------------------------------ */
if (finePointer && !reduceMotion) {
  const dot = $('.cursor-dot'), ring = $('.cursor-ring');
  let mx = -100, my = -100, rx = -100, ry = -100, started = false;
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    if (!started) { started = true; rx = mx; ry = my; body.classList.add('cursor-on'); }
    dot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
  }, { passive: true });
  (function loop() {
    rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
    ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
    requestAnimationFrame(loop);
  })();
  const HOVER = 'a, button, .g-item, summary, input, select, textarea, [data-hover]';
  document.addEventListener('mouseover', e => {
    if (e.target.closest(HOVER)) body.classList.add('cursor-hover');
  }, { passive: true });
  document.addEventListener('mouseout', e => {
    if (e.target.closest(HOVER)) body.classList.remove('cursor-hover');
  }, { passive: true });
  document.documentElement.addEventListener('mouseleave', () => body.classList.remove('cursor-on'));
  document.documentElement.addEventListener('mouseenter', () => { if (started) body.classList.add('cursor-on'); });
}

/* ------------------------------------------------------------
   Router (hash-based pages)
------------------------------------------------------------ */
const ROUTES = ['home', 'menu', 'about', 'gallery', 'reservations', 'contact'];
let transitioning = false, pendingRoute = null;

function currentRoute() {
  const m = location.hash.match(/^#\/([a-z]+)/);
  return (m && ROUTES.includes(m[1])) ? m[1] : 'home';
}
function setActiveNav(route) {
  $$('[data-route]').forEach(a => a.classList.toggle('active', a.dataset.route === route));
}
function show(route, first) {
  const next = $('#page-' + route);
  const cur = $('.page.active');
  if (!next) return;
  if (cur === next && !first) { window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); return; }
  if (first || reduceMotion || !cur) {
    if (cur) cur.classList.remove('active');
    next.classList.add('active');
    window.scrollTo(0, 0);
    setActiveNav(route);
    document.title = next.dataset.title || 'Itán — Lagos';
    return;
  }
  if (transitioning) { pendingRoute = route; return; }
  transitioning = true;
  cur.classList.add('page-exit');
  setTimeout(() => {
    cur.classList.remove('active', 'page-exit');
    next.classList.add('active');
    window.scrollTo(0, 0);
    setActiveNav(route);
    document.title = next.dataset.title || 'Itán — Lagos';
    transitioning = false;
    if (pendingRoute && pendingRoute !== route) { const p = pendingRoute; pendingRoute = null; show(p, false); }
    pendingRoute = null;
  }, 260);
}
window.addEventListener('hashchange', () => {
  closeMobileMenu();
  show(currentRoute(), false);
});

/* ------------------------------------------------------------
   Header: scrolled state + hide on scroll down
------------------------------------------------------------ */
const header = $('#siteHeader');
const toTop = $('#toTop');
let lastY = 0, menuOpen = false;

function onScrollFrame() {
  const y = window.scrollY;
  header.classList.toggle('scrolled', y > 30);
  if (!menuOpen) {
    if (y > 140 && y > lastY + 6) header.classList.add('hidden');
    else if (y < lastY - 6 || y < 140) header.classList.remove('hidden');
  }
  toTop.classList.toggle('show', y > 620);
  lastY = y;
  parallaxFrame();
}

/* ------------------------------------------------------------
   Parallax (desktop only)
------------------------------------------------------------ */
const plxEls = reduceMotion || !finePointer ? [] : $$('[data-plx]');
function parallaxFrame() {
  if (!plxEls.length) return;
  const vh = window.innerHeight;
  for (const el of plxEls) {
    if (!el.isConnected) continue;
    const r = el.getBoundingClientRect();
    if (r.bottom < -80 || r.top > vh + 80) continue;
    const delta = (r.top + r.height / 2) - vh / 2;
    const max = r.height * 0.12;
    const off = clampNum(-delta * parseFloat(el.dataset.plx), -max, max);
    el.style.transform = `translate3d(0,${off.toFixed(1)}px,0)`;
  }
}
let ticking = false;
window.addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { onScrollFrame(); ticking = false; });
}, { passive: true });

/* ------------------------------------------------------------
   Mobile menu
------------------------------------------------------------ */
const navToggle = $('#navToggle');
const mobileMenu = $('#mobileMenu');
$$('.mm-link').forEach((l, i) => l.style.setProperty('--i', i));

function openMobileMenu() {
  menuOpen = true;
  mobileMenu.classList.add('open');
  mobileMenu.setAttribute('aria-hidden', 'false');
  navToggle.setAttribute('aria-expanded', 'true');
  navToggle.setAttribute('aria-label', 'Close menu');
  body.classList.add('no-scroll');
}
function closeMobileMenu() {
  if (!menuOpen) return;
  menuOpen = false;
  mobileMenu.classList.remove('open');
  mobileMenu.setAttribute('aria-hidden', 'true');
  navToggle.setAttribute('aria-expanded', 'false');
  navToggle.setAttribute('aria-label', 'Open menu');
  body.classList.remove('no-scroll');
}
navToggle.addEventListener('click', () => (menuOpen ? closeMobileMenu() : openMobileMenu()));
$$('.mm-link').forEach(l => l.addEventListener('click', e => {
  closeMobileMenu();
  const r = l.dataset.route;
  if (r === currentRoute()) { e.preventDefault(); window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); }
}));

/* ------------------------------------------------------------
   Reveal engine (IntersectionObserver)
------------------------------------------------------------ */
$$('[data-reveal-stagger]').forEach(box => {
  Array.from(box.children).forEach((c, i) => c.style.transitionDelay = Math.min(i * 0.1, 0.5).toFixed(2) + 's');
});
function countUp(el) {
  const target = parseInt(el.dataset.count, 10) || 0;
  if (reduceMotion) { el.textContent = target; return; }
  const t0 = performance.now(), dur = 1400;
  (function step(t) {
    const p = Math.min(1, (t - t0) / dur);
    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  })(t0);
}
const io = new IntersectionObserver(entries => {
  for (const en of entries) {
    if (!en.isIntersecting) continue;
    en.target.classList.add('in');
    $$('[data-count]', en.target).forEach(countUp);
    if (en.target.hasAttribute('data-count')) countUp(en.target);
    io.unobserve(en.target);
  }
}, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });
$$('[data-reveal], [data-reveal-line], [data-reveal-stagger]').forEach(el => io.observe(el));

/* image load fade-in */
$$('.dish-media img, .g-frame img, .img-clip img').forEach(img => {
  if (img.complete && img.naturalWidth) return;
  img.style.opacity = '0';
  img.addEventListener('load', () => { img.style.transition = 'opacity .7s ease'; img.style.opacity = '1'; }, { once: true });
  img.addEventListener('error', () => { img.style.opacity = '1'; }, { once: true });
});

/* ------------------------------------------------------------
   Menu filtering
------------------------------------------------------------ */
const filterBtns = $$('.filter-btn');
const menuCards = $$('#menuGrid .dish-card');
filterBtns.forEach(btn => btn.addEventListener('click', () => {
  const f = btn.dataset.filter;
  filterBtns.forEach(b => { b.classList.toggle('is-active', b === btn); b.setAttribute('aria-pressed', b === btn); });
  let vi = 0;
  menuCards.forEach(card => {
    const show = f === 'all' || card.dataset.cat === f;
    if (show) {
      card.style.display = '';
      requestAnimationFrame(() => requestAnimationFrame(() => card.classList.remove('filter-out')));
      card.style.transitionDelay = Math.min(vi * 0.05, 0.35) + 's';
      vi++;
    } else {
      card.style.transitionDelay = '0s';
      card.classList.add('filter-out');
      setTimeout(() => { if (card.classList.contains('filter-out')) card.style.display = 'none'; }, 330);
    }
  });
}));

/* ------------------------------------------------------------
   Cart / Order (localStorage + WhatsApp checkout)
------------------------------------------------------------ */
const CART_KEY = 'itan_cart_v1';
let cart = store.get(CART_KEY, {});
const cartPill = $('#cartPill'), cartCount = $('#cartCount');
const cartDrawer = $('#cartDrawer'), cartScrim = $('#cartScrim'), cartItemsBox = $('#cartItems');
const cartTotal = $('#cartTotal'), waOrder = $('#waOrder');

function cartQty() { return Object.values(cart).reduce((s, i) => s + i.qty, 0); }
function cartSum() { return Object.values(cart).reduce((s, i) => s + i.qty * i.price, 0); }

function saveCart() { store.set(CART_KEY, cart); }
function renderCart() {
  const n = cartQty();
  cartPill.hidden = n === 0;
  cartCount.textContent = n;
  if (!n) {
    cartItemsBox.innerHTML = '<p class="cart-empty">Your order is empty.<br>Add something delicious from the menu.</p>';
    cartTotal.textContent = NGN(0);
    waOrder.removeAttribute('href');
    return;
  }
  cartItemsBox.innerHTML = Object.values(cart).map(i => `
    <div class="cart-item" data-id="${i.id}">
      <img src="img/${i.img}.jpg" alt="" width="58" height="58" loading="lazy">
      <div class="ci-info">
        <h4>${i.name}</h4>
        <span class="price">${NGN(i.price)}</span>
        <div class="ci-qty">
          <button type="button" class="ci-dec" aria-label="Remove one ${i.name}">−</button>
          <b>${i.qty}</b>
          <button type="button" class="ci-inc" aria-label="Add one ${i.name}">+</button>
        </div>
      </div>
      <button type="button" class="ci-remove" aria-label="Remove ${i.name}">Remove</button>
    </div>`).join('');
  cartTotal.textContent = NGN(cartSum());
  const lines = Object.values(cart).map(i => `${i.qty}× ${i.name} — ${NGN(i.qty * i.price)}`).join('\n');
  const msg = `Hello Itán! I'd like to place an order:\n\n${lines}\n\nTotal: ${NGN(cartSum())}\n\nName:\nPickup or delivery:`;
  waOrder.href = 'https://wa.me/2349012345678?text=' + encodeURIComponent(msg);
}
document.addEventListener('click', e => {
  const btn = e.target.closest('.add-order');
  if (!btn) return;
  const { id, name, price } = btn.dataset;
  if (!cart[id]) {
    const media = btn.closest('article')?.querySelector('img');
    const img = media ? media.src.split('/').pop().replace('.jpg', '') : '';
    cart[id] = { id, name, price: +price, qty: 0, img };
  }
  cart[id].qty++;
  saveCart(); renderCart();
  cartPill.classList.remove('pillIn'); void cartPill.offsetWidth; cartPill.classList.add('pillIn');
  toast(`${name} added to your order`);
  const label = btn.querySelector('span');
  if (label) {
    const old = label.textContent;
    btn.classList.add('is-busy');
    label.textContent = 'Added ✓';
    setTimeout(() => { label.textContent = old; btn.classList.remove('is-busy'); }, 1100);
  }
});
cartItemsBox.addEventListener('click', e => {
  const row = e.target.closest('.cart-item');
  if (!row) return;
  const id = row.dataset.id;
  if (e.target.closest('.ci-inc')) cart[id].qty++;
  else if (e.target.closest('.ci-dec')) { cart[id].qty--; if (cart[id].qty <= 0) delete cart[id]; }
  else if (e.target.closest('.ci-remove')) delete cart[id];
  else return;
  saveCart(); renderCart();
});
$('#cartClear').addEventListener('click', () => { cart = {}; saveCart(); renderCart(); toast('Order cleared'); });
function openCart() { cartDrawer.classList.add('open'); cartScrim.hidden = false; requestAnimationFrame(() => cartScrim.classList.add('open')); cartDrawer.setAttribute('aria-hidden', 'false'); body.classList.add('no-scroll'); }
function closeCart() { cartDrawer.classList.remove('open'); cartScrim.classList.remove('open'); setTimeout(() => cartScrim.hidden = true, 400); cartDrawer.setAttribute('aria-hidden', 'true'); body.classList.remove('no-scroll'); }
cartPill.addEventListener('click', openCart);
$('#cartClose').addEventListener('click', closeCart);
cartScrim.addEventListener('click', closeCart);

/* ------------------------------------------------------------
   Gallery lightbox
------------------------------------------------------------ */
const gItems = $$('.g-item');
const lb = $('#lightbox'), lbImg = $('#lbImg'), lbCap = $('#lbCap'), lbCounter = $('#lbCounter');
let lbIdx = 0, lbOpen = false, lastFocus = null;

function lbRender(dir) {
  const item = gItems[lbIdx];
  const src = item.dataset.full, cap = item.dataset.cap;
  lbImg.classList.remove('show');
  const pre = new Image();
  pre.onload = () => {
    if (!lbOpen || gItems[lbIdx] !== item) return;
    lbImg.src = src; lbImg.alt = cap;
    lbCap.textContent = cap;
    lbCounter.textContent = String(lbIdx + 1).padStart(2, '0') + ' / ' + String(gItems.length).padStart(2, '0');
    requestAnimationFrame(() => lbImg.classList.add('show'));
  };
  pre.onerror = () => { lbImg.src = src; lbCap.textContent = cap; };
  pre.src = src;
  if (gItems[lbIdx + 1]) new Image().src = gItems[lbIdx + 1].dataset.full;
  if (gItems[lbIdx - 1]) new Image().src = gItems[lbIdx - 1].dataset.full;
}
function openLb(idx) {
  lbOpen = true; lbIdx = idx;
  lastFocus = document.activeElement;
  lb.classList.add('open');
  lb.setAttribute('aria-hidden', 'false');
  body.classList.add('no-scroll');
  lbRender();
  $('#lbClose').focus({ preventScroll: true });
}
function closeLb() {
  if (!lbOpen) return;
  lbOpen = false;
  lb.classList.remove('open');
  lb.setAttribute('aria-hidden', 'true');
  body.classList.remove('no-scroll');
  if (lastFocus) lastFocus.focus({ preventScroll: true });
}
function navLb(d) { lbIdx = (lbIdx + d + gItems.length) % gItems.length; lbRender(); }

gItems.forEach((it, i) => {
  it.addEventListener('click', () => openLb(i));
  it.setAttribute('tabindex', '0');
  it.setAttribute('role', 'button');
  it.setAttribute('aria-label', 'View image: ' + it.dataset.cap);
  it.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLb(i); } });
});
$('#lbClose').addEventListener('click', closeLb);
$('#lbPrev').addEventListener('click', () => navLb(-1));
$('#lbNext').addEventListener('click', () => navLb(1));
lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
let tsX = 0, tsY = 0;
lb.addEventListener('touchstart', e => { tsX = e.touches[0].clientX; tsY = e.touches[0].clientY; }, { passive: true });
lb.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - tsX, dy = e.changedTouches[0].clientY - tsY;
  if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) navLb(dx < 0 ? 1 : -1);
}, { passive: true });

/* ------------------------------------------------------------
   Forms
------------------------------------------------------------ */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[\d\s().-]{7,18}$/;

function setErr(input, msg) {
  const field = input.closest('.field');
  field.classList.toggle('err', !!msg);
  field.classList.toggle('ok', !msg && !!input.value.trim());
  const err = field.querySelector('.field-err');
  if (err) err.textContent = msg || '';
  input.setAttribute('aria-invalid', msg ? 'true' : 'false');
}
function clearErr(input) {
  const field = input.closest('.field');
  field.classList.remove('err');
  const err = field.querySelector('.field-err');
  if (err) err.textContent = '';
}
function busy(btn, on, busyText) {
  const label = btn.querySelector('.btn-label');
  if (on) {
    btn.classList.add('is-busy'); btn.disabled = true;
    btn.dataset.old = label.textContent;
    label.innerHTML = busyText + ' <span class="spinner"></span>';
  } else {
    btn.classList.remove('is-busy'); btn.disabled = false;
    label.textContent = btn.dataset.old;
  }
}

/* --- reservations --- */
const resForm = $('#resForm');
if (resForm) {
  const rDate = $('#rDate');
  rDate.min = new Date().toISOString().split('T')[0];
  const fields = {
    name:  i => i.value.trim().length >= 2 || 'Please enter your full name.',
    email: i => EMAIL_RE.test(i.value.trim()) || 'That email doesn’t look right.',
    phone: i => PHONE_RE.test(i.value.trim()) && (i.value.match(/\d/g) || []).length >= 7 || 'Enter a valid phone number.',
    date:  i => {
      if (!i.value) return 'Choose a date.';
      return i.value >= rDate.min || 'Please pick today or a future date.';
    },
    time:  i => !!i.value || 'Choose a time.',
    guests:i => !!i.value || 'How many guests?'
  };
  const inputs = ['name', 'email', 'phone', 'date', 'time', 'guests'].map(k => $('#r' + k[0].toUpperCase() + k.slice(1)));

  inputs.forEach(inp => {
    inp.addEventListener('input', () => clearErr(inp));
    inp.addEventListener('blur', () => {
      if (!inp.value.trim()) return;
      const r = fields[inp.name](inp);
      if (r !== true) setErr(inp, r); else setErr(inp, '');
    });
  });

  resForm.addEventListener('submit', e => {
    e.preventDefault();
    let firstBad = null;
    inputs.forEach(inp => {
      const r = fields[inp.name](inp);
      if (r !== true) { setErr(inp, r); firstBad = firstBad || inp; }
      else setErr(inp, '');
    });
    if (firstBad) {
      firstBad.focus({ preventScroll: false });
      firstBad.closest('.field').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      toast('Please review the highlighted fields');
      return;
    }
    const submit = $('#resSubmit');
    busy(submit, true, 'Securing your table');
    setTimeout(() => {
      const data = {
        id: 'ITN-' + Math.random().toString(36).slice(2, 7).toUpperCase(),
        name: $('#rName').value.trim(),
        email: $('#rEmail').value.trim(),
        phone: $('#rPhone').value.trim(),
        date: $('#rDate').value,
        time: $('#rTime').value,
        guests: $('#rGuests').value,
        requests: $('#rRequests').value.trim(),
        createdAt: new Date().toISOString()
      };
      const all = store.get('itan_reservations', []);
      all.push(data);
      store.set('itan_reservations', all);

      const d = new Date(data.date + 'T12:00:00');
      const when = d.toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' });
      $('#resSummary').innerHTML =
        `Thank you, <strong>${data.name}</strong> — a table for <strong>${data.guests}</strong> on ` +
        `<strong>${when}</strong> at <strong>${data.time}</strong> has been requested.`;
      $('#resCode').textContent = data.id;

      resForm.hidden = true;
      const ok = $('#resSuccess');
      ok.hidden = false;
      ok.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      renderResList();
      toast('Reservation saved · ' + data.id);
      busy(submit, false);
    }, 950);
  });

  $('#resAgain').addEventListener('click', () => {
    resForm.reset();
    $$('.field', resForm).forEach(f => f.classList.remove('err', 'ok'));
    $('#resSuccess').hidden = true;
    resForm.hidden = false;
    resForm.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  });

  function renderResList() {
    const all = store.get('itan_reservations', []);
    const block = $('#resListBlock'), list = $('#resList');
    if (!all.length) { block.hidden = true; return; }
    block.hidden = false;
    list.innerHTML = all.slice().reverse().map(r => {
      const d = new Date(r.date + 'T12:00:00');
      const when = d.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' });
      return `<li><span class="res-when"><b>${r.name}</b> · ${when}, ${r.time} · ${r.guests} guest${r.guests === '1' ? '' : 's'}</span>
        <button type="button" class="res-cancel" data-id="${r.id}">Cancel</button></li>`;
    }).join('');
  }
  $('#resList').addEventListener('click', e => {
    const btn = e.target.closest('.res-cancel');
    if (!btn) return;
    const all = store.get('itan_reservations', []).filter(r => r.id !== btn.dataset.id);
    store.set('itan_reservations', all);
    renderResList();
    toast('Reservation cancelled');
  });
  renderResList();
}

/* --- contact --- */
const contactForm = $('#contactForm');
if (contactForm) {
  const cInputs = [$('#cName'), $('#cEmail'), $('#cMsg')];
  const cRules = {
    name: i => i.value.trim().length >= 2 || 'Please tell us your name.',
    email: i => EMAIL_RE.test(i.value.trim()) || 'That email doesn’t look right.',
    message: i => i.value.trim().length >= 10 || 'A few more words, please (min 10 characters).'
  };
  cInputs.forEach(inp => {
    inp.addEventListener('input', () => clearErr(inp));
    inp.addEventListener('blur', () => {
      if (!inp.value.trim()) return;
      const r = cRules[inp.name](inp);
      if (r !== true) setErr(inp, r); else setErr(inp, '');
    });
  });
  contactForm.addEventListener('submit', e => {
    e.preventDefault();
    const banner = $('#contactBanner');
    let firstBad = null;
    cInputs.forEach(inp => {
      const r = cRules[inp.name](inp);
      if (r !== true) { setErr(inp, r); firstBad = firstBad || inp; }
      else setErr(inp, '');
    });
    if (firstBad) {
      banner.hidden = false;
      banner.className = 'form-banner is-error';
      banner.textContent = 'Please review the highlighted fields and try again.';
      firstBad.focus();
      return;
    }
    const submit = $('#contactSubmit');
    busy(submit, true, 'Sending');
    setTimeout(() => {
      const msgs = store.get('itan_messages', []);
      msgs.push({
        name: $('#cName').value.trim(),
        email: $('#cEmail').value.trim(),
        subject: $('#cSubject').value,
        message: $('#cMsg').value.trim(),
        createdAt: new Date().toISOString()
      });
      store.set('itan_messages', msgs);
      contactForm.reset();
      $$('.field', contactForm).forEach(f => f.classList.remove('err', 'ok'));
      banner.hidden = false;
      banner.className = 'form-banner';
      banner.textContent = 'Message sent — we reply within one business day. (Demo: saved on this device only.)';
      toast('Message sent · thank you');
      busy(submit, false);
    }, 950);
  });
}

/* ------------------------------------------------------------
   Back to top
------------------------------------------------------------ */
toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

/* ------------------------------------------------------------
   Global keys
------------------------------------------------------------ */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeLb(); closeCart(); closeMobileMenu(); }
  if (lbOpen && e.key === 'ArrowRight') navLb(1);
  if (lbOpen && e.key === 'ArrowLeft') navLb(-1);
});

/* ------------------------------------------------------------
   Boot
------------------------------------------------------------ */
show(currentRoute(), true);
renderCart();
onScrollFrame();

})();
