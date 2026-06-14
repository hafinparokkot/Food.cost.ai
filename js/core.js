/* ─────────────────────────────────────────
   FOODCOST AI — core.js
   Shared utilities + init for all pages
───────────────────────────────────────── */
'use strict';

/* ══════════════ THEME ══════════════ */
const Theme = (() => {
  const KEY = 'fc-theme';
  function apply(dark) {
    document.body.classList.toggle('dark', dark);
    const ic = document.getElementById('themeIcon');
    if (ic) ic.textContent = dark ? '☀️' : '🌙';
    localStorage.setItem(KEY, dark ? 'dark' : 'light');
  }
  function init() {
    const saved = localStorage.getItem(KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    apply(saved ? saved === 'dark' : prefersDark);
    document.getElementById('themeBtn')?.addEventListener('click', toggle);
  }
  function toggle() { apply(!document.body.classList.contains('dark')); }
  return { init, apply, toggle };
})();

/* ══════════════ NAV ══════════════ */
const Nav = (() => {
  function init() {
    // Scroll shadow
    const nav = document.querySelector('.nav');
    if (nav) {
      window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 20), { passive: true });
    }
    // Mobile burger
    const burger = document.getElementById('navBurger');
    const links = document.getElementById('navLinks');
    if (burger && links) {
      burger.addEventListener('click', () => links.classList.toggle('open'));
      links.querySelectorAll('.nav__link').forEach(l => l.addEventListener('click', () => links.classList.remove('open')));
    }
    // Active link
    const page = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav__link').forEach(l => {
      if (l.getAttribute('href') === page) l.classList.add('active');
    });
  }
  return { init };
})();

/* ══════════════ REVEAL ANIMATIONS ══════════════ */
const Reveal = (() => {
  function init() {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          setTimeout(() => e.target.classList.add('in'), i * 70);
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });
    document.querySelectorAll('[data-reveal]').forEach(el => obs.observe(el));
  }
  return { init };
})();

/* ══════════════ FAQ ══════════════ */
const FAQ = (() => {
  function init() {
    document.querySelectorAll('.faq-q').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.faq-item');
        const open = item.classList.contains('open');
        document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
        document.querySelectorAll('.faq-q').forEach(b => b.setAttribute('aria-expanded', 'false'));
        if (!open) { item.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
      });
    });
  }
  return { init };
})();

/* ══════════════ TOAST ══════════════ */
const Toast = {
  show(msg, type = 'success', ms = 3200) {
    let t = document.getElementById('fc-toast');
    if (t) t.remove();
    t = document.createElement('div');
    t.id = 'fc-toast';
    const bg = { success: '#00c896', error: '#f43f5e', warn: '#f59e0b', info: '#6366f1' };
    t.style.background = bg[type] || bg.success;
    t.style.color = '#fff';
    t.innerHTML = `<span style="font-size:16px">${{ success:'✅', error:'❌', warn:'⚠️', info:'ℹ️' }[type]}</span><span>${msg}</span>`;
    document.body.appendChild(t);
    setTimeout(() => {
      t.style.transition = 'opacity .3s,transform .3s';
      t.style.opacity = '0'; t.style.transform = 'translateY(10px)';
      setTimeout(() => t.remove(), 320);
    }, ms);
  }
};

/* ══════════════ UNIT CONVERSION ══════════════ */
const Units = {
  // Convert qty in `unit` to base (kg or L or piece)
  toBase(qty, unit) {
    const map = {
      kg: 1, g: 0.001, lb: 0.4536, oz: 0.02835,
      L: 1, ml: 0.001, cup: 0.24, tbsp: 0.01479, tsp: 0.00493,
      piece: 1, dozen: 12, packet: 1, box: 1
    };
    return qty * (map[unit] ?? 1);
  },
  UNITS: ['kg','g','L','ml','piece','dozen','lb','oz','cup','tbsp','tsp','packet'],
  options(sel = 'kg') {
    return this.UNITS.map(u => `<option value="${u}"${u===sel?' selected':''}>${u}</option>`).join('');
  }
};

/* ══════════════ FORMAT (fallback — overridden by currency.js) ══════════════ */
// currency.js sets window.FC.Fmt; this is a fallback if currency.js isn't loaded.
const Fmt = {
  money(n, dp = 2) {
    if (!isFinite(n)) return '₹0';
    return '₹' + Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: dp, maximumFractionDigits: dp });
  },
  inr(n, dp = 2) { return this.money(n, dp); },
  num(n, dp = 2) {
    if (!isFinite(n)) return '0';
    return n.toLocaleString('en-IN', { minimumFractionDigits: dp, maximumFractionDigits: dp });
  },
  pct(n, dp = 1) { return isFinite(n) ? n.toFixed(dp) + '%' : '0%'; },
  symbol() { return '₹'; }
};

/* ══════════════ TAX (fallback — overridden by currency.js) ══════════════ */
// currency.js sets window.FC.GST to its Tax object; this is a fallback.
const GST = {
  add(base, rate) { return base * (1 + rate / 100); },
  remove(total, rate) { return total / (1 + rate / 100); },
  amount(base, rate) { return base * rate / 100; },
  RATES: [0, 5, 12, 18, 28],
  LABEL: 'GST',
  DEFAULT_RATE: 5
};

/* ══════════════ DISTRIBUTION CHAIN ══════════════ */
const Chain = {
  fromFactory(fp, opts = {}) {
    const { cnf = 0, dist = 10, retail = 20, gst = 5 } = opts;
    const cnfP  = fp   * (1 + cnf   / 100);
    const distP = cnfP * (1 + dist  / 100);
    const retP  = distP* (1 + retail/ 100);
    const mrp   = GST.add(retP, gst);
    return { factory: fp, cnf: cnfP, dist: distP, retail: retP, mrp };
  },
  fromMRP(mrp, opts = {}) {
    const { cnf = 0, dist = 10, retail = 20, gst = 5 } = opts;
    const retP  = GST.remove(mrp, gst);
    const distP = retP  / (1 + retail/ 100);
    const cnfP  = distP / (1 + dist  / 100);
    const fp    = cnfP  / (1 + cnf   / 100);
    return { factory: fp, cnf: cnfP, dist: distP, retail: retP, mrp };
  }
};

/* ══════════════ CHART HELPERS ══════════════ */
const Charts = {
  PALETTE: ['#00c896','#f59e0b','#6366f1','#f43f5e','#8b5cf6','#0ea5e9','#14b8a6','#ec4899','#84cc16','#f97316'],
  dark() { return document.body.classList.contains('dark'); },
  tx() { return this.dark() ? '#7a8fa8' : '#64748b'; },
  grid() { return this.dark() ? '#1a2540' : '#f1f5f9'; },
  bg() { return this.dark() ? '#0e1624' : '#ffffff'; },

  doughnut(ctx, labels, data) {
    return new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data, backgroundColor: this.PALETTE.slice(0, data.length), borderWidth: 2, borderColor: this.bg(), hoverBorderWidth: 3 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '66%',
        plugins: {
          legend: { position: 'right', labels: { color: this.tx(), font: { family: 'Inter', size: 12 }, boxWidth: 11, padding: 14 } },
          tooltip: { callbacks: { label: c => { const t = c.dataset.data.reduce((a,b)=>a+b,0); return ` ${c.label}: ${Fmt.money(c.parsed)} (${t>0?((c.parsed/t)*100).toFixed(1):0}%)`; } } }
        }
      }
    });
  },

  bar(ctx, labels, datasets) {
    return new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: this.tx(), font: { family: 'Inter', size: 12 } } } },
        scales: {
          x: { grid: { display: false }, ticks: { color: this.tx(), font: { family: 'Inter', size: 11 } } },
          y: { grid: { color: this.grid() }, ticks: { color: this.tx(), font: { family: 'Inter', size: 11 }, callback: v => Fmt.money(v, 0) } }
        }
      }
    });
  },

  line(ctx, labels, datasets) {
    return new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: { legend: { labels: { color: this.tx(), font: { family: 'Inter', size: 12 } } } },
        scales: {
          x: { grid: { display: false }, ticks: { color: this.tx() } },
          y: { grid: { color: this.grid() }, ticks: { color: this.tx(), callback: v => Fmt.money(v, 0) } }
        }
      }
    });
  }
};

/* ══════════════ OVERHEAD TOGGLE ══════════════ */
function overheadToggle(panelId, btnId) {
  const panel = document.getElementById(panelId);
  const btn   = document.getElementById(btnId);
  if (!panel || !btn) return;
  let open = false;
  btn.addEventListener('click', () => {
    open = !open;
    panel.style.display = open ? 'grid' : 'none';
    btn.textContent = open ? '▲ Hide' : '▼ Show';
  });
}

/* ══════════════ BOOT ══════════════ */
document.addEventListener('DOMContentLoaded', () => {
  Theme.init();
  Nav.init();
  FAQ.init();
  // Stagger data-reveal elements
  document.querySelectorAll('.p-card,.feat-card,.uc-card,.step,.blog-card').forEach((el, i) => {
    if (!el.hasAttribute('data-reveal')) {
      el.setAttribute('data-reveal', '');
      el.style.transitionDelay = (i % 5) * 0.07 + 's';
    }
  });
  Reveal.init();
});

/* ── GLOBAL EXPORTS ── */
// Always export core utilities. Only set Fmt/GST if currency.js hasn't already
// installed its richer versions (detected by presence of CurrencySettings).
const _existingFC = window.FC || {};
window.FC = Object.assign(_existingFC, { Theme, Nav, Reveal, Toast, Units, Chain, Charts, FAQ, overheadToggle });
if (!_existingFC.CurrencySettings) {
  // currency.js not loaded — use our fallback Fmt and GST
  window.FC.Fmt = Fmt;
  window.FC.GST = GST;
}
