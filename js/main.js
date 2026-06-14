/* ============================================================
   FOODCOST AI — Core JavaScript
   Shared utilities, theme, navigation, animations
   ============================================================ */

'use strict';

// ============================================================
// THEME MANAGEMENT
// ============================================================
const ThemeManager = {
  STORAGE_KEY: 'foodcost-theme',

  init() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved ? saved === 'dark' : prefersDark;
    this.apply(isDark);
    this.bindToggle();
  },

  apply(isDark) {
    document.getElementById('body').classList.toggle('dark-mode', isDark);
    document.getElementById('body').classList.toggle('light-mode', !isDark);
    const icon = document.querySelector('.theme-icon');
    if (icon) icon.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem(this.STORAGE_KEY, isDark ? 'dark' : 'light');
  },

  toggle() {
    const isDark = document.getElementById('body').classList.contains('dark-mode');
    this.apply(!isDark);
  },

  bindToggle() {
    const btn = document.getElementById('themeToggle');
    if (btn) btn.addEventListener('click', () => this.toggle());
  }
};

// ============================================================
// NAVIGATION
// ============================================================
const Navigation = {
  init() {
    this.bindScroll();
    this.bindMobile();
    this.setActive();
  },

  bindScroll() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          navbar.classList.toggle('scrolled', window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    });
  },

  bindMobile() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    if (!hamburger || !navLinks) return;
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      hamburger.classList.toggle('active');
    });
    // Close on link click
    navLinks.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        hamburger.classList.remove('active');
      });
    });
  },

  setActive() {
    const current = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(link => {
      const href = link.getAttribute('href');
      if (href === current || (current === '' && href === 'index.html')) {
        link.classList.add('active');
      }
    });
  }
};

// ============================================================
// SCROLL ANIMATIONS
// ============================================================
const ScrollAnimations = {
  init() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, i * 80);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('[data-animate]').forEach(el => {
      observer.observe(el);
    });
  }
};

// ============================================================
// FAQ ACCORDION
// ============================================================
const FAQ = {
  init() {
    document.querySelectorAll('.faq-q').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.faq-item');
        const isOpen = item.classList.contains('open');
        // Close all
        document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
        document.querySelectorAll('.faq-q').forEach(b => b.setAttribute('aria-expanded', 'false'));
        // Open clicked
        if (!isOpen) {
          item.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }
};

// ============================================================
// TOOLTIP SYSTEM
// ============================================================
const Tooltips = {
  init() {
    document.querySelectorAll('[data-tooltip]').forEach(el => {
      const text = el.getAttribute('data-tooltip');
      const wrap = document.createElement('span');
      wrap.className = 'tooltip-wrap';
      el.parentNode.insertBefore(wrap, el);
      wrap.appendChild(el);
      const tip = document.createElement('span');
      tip.className = 'tooltip-content';
      tip.textContent = text;
      wrap.appendChild(tip);
    });
  }
};

// ============================================================
// FORMATTING UTILITIES
// ============================================================
const Format = {
  currency(value, decimals = 2) {
    if (isNaN(value) || !isFinite(value)) return '₹0';
    return '₹' + Math.abs(value).toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  },

  number(value, decimals = 2) {
    if (isNaN(value) || !isFinite(value)) return '0';
    return value.toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  },

  percent(value, decimals = 1) {
    if (isNaN(value) || !isFinite(value)) return '0%';
    return value.toFixed(decimals) + '%';
  },

  weight(value) {
    if (value >= 1000) return (value / 1000).toFixed(2) + ' MT';
    return value.toFixed(2) + ' kg';
  }
};

// ============================================================
// UNIT CONVERSION
// ============================================================
const Units = {
  // Returns quantity in base unit (kg or L or piece)
  toBase(qty, unit) {
    const conversions = {
      'kg': 1, 'g': 0.001,
      'L': 1, 'ml': 0.001,
      'piece': 1, 'dozen': 12,
      'lb': 0.4536, 'oz': 0.02835,
      'tsp': 0.005, 'tbsp': 0.015, 'cup': 0.24
    };
    return qty * (conversions[unit] || 1);
  },

  // Cost per BASE unit given purchase qty and cost
  costPerBase(purchaseQty, purchaseUnit, purchaseCost) {
    const baseQty = this.toBase(purchaseQty, purchaseUnit);
    if (!baseQty) return 0;
    return purchaseCost / baseQty;
  },

  WEIGHT_UNITS: ['kg', 'g', 'lb', 'oz'],
  VOLUME_UNITS: ['L', 'ml', 'cup', 'tbsp', 'tsp'],
  PIECE_UNITS: ['piece', 'dozen'],

  ALL_UNITS: [
    { value: 'kg', label: 'kg' },
    { value: 'g', label: 'g' },
    { value: 'L', label: 'L' },
    { value: 'ml', label: 'ml' },
    { value: 'piece', label: 'piece' },
    { value: 'dozen', label: 'dozen' },
    { value: 'lb', label: 'lb' },
    { value: 'oz', label: 'oz' },
    { value: 'cup', label: 'cup' },
    { value: 'tbsp', label: 'tbsp' },
    { value: 'tsp', label: 'tsp' },
  ]
};

// ============================================================
// CHART UTILITIES
// ============================================================
const ChartUtils = {
  COLORS: [
    '#10b981', '#f59e0b', '#6366f1', '#f43f5e', '#8b5cf6',
    '#0ea5e9', '#14b8a6', '#ec4899', '#84cc16', '#f97316',
    '#06b6d4', '#a855f7', '#ef4444', '#22c55e', '#eab308'
  ],

  isDark() {
    return document.getElementById('body').classList.contains('dark-mode');
  },

  getDefaults() {
    const dark = this.isDark();
    return {
      textColor: dark ? '#94a3b8' : '#64748b',
      gridColor: dark ? '#1e293b' : '#f1f5f9',
      backgroundColor: dark ? '#1a2235' : '#ffffff'
    };
  },

  createDoughnut(ctx, labels, data, title = '') {
    const { textColor } = this.getDefaults();
    return new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: this.COLORS.slice(0, data.length),
          borderWidth: 2,
          borderColor: this.getDefaults().backgroundColor,
          hoverBorderWidth: 3,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: textColor,
              font: { family: 'Inter', size: 12 },
              boxWidth: 12,
              padding: 16
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
                return ` ${ctx.label}: ₹${ctx.parsed.toFixed(2)} (${pct}%)`;
              }
            }
          },
          title: {
            display: !!title,
            text: title,
            color: textColor,
            font: { size: 14, weight: '600', family: 'Outfit' }
          }
        }
      }
    });
  },

  createBar(ctx, labels, datasets, options = {}) {
    const { textColor, gridColor } = this.getDefaults();
    return new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: textColor, font: { family: 'Inter', size: 12 } }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ₹${ctx.parsed.y.toFixed(2)}`
            }
          },
          ...options.plugins
        },
        scales: {
          x: {
            grid: { color: gridColor, display: false },
            ticks: { color: textColor, font: { family: 'Inter', size: 11 } }
          },
          y: {
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              font: { family: 'Inter', size: 11 },
              callback: val => '₹' + val.toLocaleString('en-IN')
            }
          }
        },
        ...options
      }
    });
  },

  createLine(ctx, labels, datasets, options = {}) {
    const { textColor, gridColor } = this.getDefaults();
    return new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: {
            labels: { color: textColor, font: { family: 'Inter', size: 12 } }
          }
        },
        scales: {
          x: {
            grid: { color: gridColor, display: false },
            ticks: { color: textColor }
          },
          y: {
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              callback: val => '₹' + val.toLocaleString('en-IN')
            }
          }
        },
        ...options
      }
    });
  }
};

// ============================================================
// LOCAL STORAGE (Save/Load calculations)
// ============================================================
const Storage = {
  save(key, data) {
    try {
      localStorage.setItem('fc_' + key, JSON.stringify(data));
    } catch(e) { /* quota exceeded */ }
  },

  load(key) {
    try {
      const raw = localStorage.getItem('fc_' + key);
      return raw ? JSON.parse(raw) : null;
    } catch(e) { return null; }
  },

  clear(key) {
    localStorage.removeItem('fc_' + key);
  }
};

// ============================================================
// GST CALCULATIONS (India-specific)
// ============================================================
const GST = {
  RATES: [0, 5, 12, 18, 28],

  addGST(basePrice, rate) {
    return basePrice * (1 + rate / 100);
  },

  removeGST(priceWithGST, rate) {
    return priceWithGST / (1 + rate / 100);
  },

  gstAmount(basePrice, rate) {
    return basePrice * (rate / 100);
  }
};

// ============================================================
// DISTRIBUTION CHAIN CALCULATOR
// ============================================================
const Distribution = {
  // Given factory price, calculate full chain
  calculate(factoryPrice, {
    cAndFMargin = 0,    // C&F agent margin %
    distributorMargin = 10,
    retailerMargin = 20,
    gstRate = 5
  } = {}) {
    const cAndFPrice = factoryPrice * (1 + cAndFMargin / 100);
    const distributorPrice = cAndFPrice * (1 + distributorMargin / 100);
    const retailerPrice = distributorPrice * (1 + retailerMargin / 100);
    const mrp = GST.addGST(retailerPrice, gstRate);

    return {
      factoryPrice,
      cAndFPrice,
      distributorPrice,
      retailerPrice,
      mrp,
      totalMarkup: ((mrp / factoryPrice - 1) * 100).toFixed(1)
    };
  },

  // Reverse: given target MRP, find max factory price
  reverse(targetMRP, {
    cAndFMargin = 0,
    distributorMargin = 10,
    retailerMargin = 20,
    gstRate = 5
  } = {}) {
    const priceExGST = GST.removeGST(targetMRP, gstRate);
    const distributorPrice = priceExGST / (1 + retailerMargin / 100);
    const cAndFPrice = distributorPrice / (1 + distributorMargin / 100);
    const factoryPrice = cAndFPrice / (1 + cAndFMargin / 100);
    return {
      maxFactoryPrice: factoryPrice,
      distributorPrice,
      retailerPrice: priceExGST,
      mrp: targetMRP
    };
  }
};

// ============================================================
// NOTIFICATIONS
// ============================================================
const Notify = {
  show(message, type = 'success', duration = 3000) {
    const existing = document.getElementById('fc-notification');
    if (existing) existing.remove();

    const el = document.createElement('div');
    el.id = 'fc-notification';
    el.style.cssText = `
      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      padding: 14px 20px; border-radius: 10px; font-size: 14px;
      font-weight: 600; font-family: Inter, sans-serif;
      display: flex; align-items: center; gap: 10px;
      animation: slideInRight 0.3s ease; box-shadow: 0 8px 24px rgba(0,0,0,0.15);
      max-width: 360px;
    `;

    const styles = {
      success: 'background:#10b981; color:white;',
      error: 'background:#f43f5e; color:white;',
      warning: 'background:#f59e0b; color:white;',
      info: 'background:#6366f1; color:white;'
    };

    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };

    el.style.cssText += styles[type] || styles.success;
    el.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
    document.body.appendChild(el);

    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(100px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    setTimeout(() => {
      el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      el.style.opacity = '0';
      el.style.transform = 'translateX(10px)';
      setTimeout(() => el.remove(), 300);
    }, duration);
  }
};

// ============================================================
// PRINT / EXPORT (basic)
// ============================================================
const Export = {
  print(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    const printWin = window.open('', '_blank');
    printWin.document.write(`
      <html><head>
        <title>FoodCost AI - Export</title>
        <link rel="stylesheet" href="css/style.css" />
        <style>body{padding:24px;} .no-print{display:none}</style>
      </head>
      <body class="${document.getElementById('body').className}">
        ${section.outerHTML}
      </body></html>
    `);
    printWin.document.close();
    setTimeout(() => printWin.print(), 500);
  }
};

// ============================================================
// INITIALIZE
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  Navigation.init();
  ScrollAnimations.init();
  FAQ.init();
  Tooltips.init();

  // Add data-animate to key elements
  document.querySelectorAll('.problem-card, .feature-card, .step-card, .usecase-card, .blog-card').forEach((el, i) => {
    if (!el.hasAttribute('data-animate')) {
      el.setAttribute('data-animate', '');
      el.style.transitionDelay = (i % 4) * 0.08 + 's';
    }
  });

  // Re-trigger scroll animations
  ScrollAnimations.init();
});

// Expose globals for other scripts
window.FoodCostAI = {
  Format, Units, ChartUtils, Storage, GST, Distribution, Notify, Export, ThemeManager
};
