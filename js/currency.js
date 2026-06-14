/* ─────────────────────────────────────────────────────────────
   FOODCOST AI — currency.js
   Global Currency & Tax Engine
   Provides: CurrencySettings, Fmt.money(), Tax object,
   first-visit setup modal, navbar settings button.
───────────────────────────────────────────────────────────── */
'use strict';

/* ══════════════ CURRENCY PRESETS ══════════════ */
const CURRENCY_PRESETS = [
  {
    code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN',
    taxLabel: 'GST', taxRates: [0, 5, 12, 18, 28], defaultTaxRate: 5
  },
  {
    code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US',
    taxLabel: 'Sales Tax', taxRates: [0, 6, 8, 10], defaultTaxRate: 8
  },
  {
    code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE',
    taxLabel: 'VAT', taxRates: [0, 7, 19], defaultTaxRate: 19
  },
  {
    code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB',
    taxLabel: 'VAT', taxRates: [0, 5, 20], defaultTaxRate: 20
  },
  {
    code: 'AED', symbol: 'AED', name: 'UAE Dirham', locale: 'en-AE',
    taxLabel: 'VAT', taxRates: [0, 5], defaultTaxRate: 5
  },
  {
    code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG',
    taxLabel: 'GST', taxRates: [0, 9], defaultTaxRate: 9
  },
  {
    code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU',
    taxLabel: 'GST', taxRates: [0, 10], defaultTaxRate: 10
  },
  {
    code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA',
    taxLabel: 'HST/GST', taxRates: [0, 5, 13, 15], defaultTaxRate: 5
  },
  {
    code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal', locale: 'en-SA',
    taxLabel: 'VAT', taxRates: [0, 15], defaultTaxRate: 15
  },
  {
    code: 'CUSTOM', symbol: '', name: 'Custom Currency', locale: 'en-US',
    taxLabel: 'Tax', taxRates: [0, 10], defaultTaxRate: 10
  }
];

/* ══════════════ CURRENCY SETTINGS ══════════════ */
const CurrencySettings = (() => {
  const KEY = 'fc-locale';
  const SETUP_DONE_KEY = 'fc-setup-done';

  let current = null;

  function getDefaults() {
    return {
      code: 'INR',
      symbol: '₹',
      name: 'Indian Rupee',
      locale: 'en-IN',
      taxLabel: 'GST',
      taxRates: [0, 5, 12, 18, 28],
      defaultTaxRate: 5
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        current = JSON.parse(raw);
      } else {
        current = getDefaults();
      }
    } catch (e) {
      current = getDefaults();
    }
    return current;
  }

  function save(settings) {
    current = settings;
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
      localStorage.setItem(SETUP_DONE_KEY, '1');
    } catch (e) {}
  }

  function get() {
    if (!current) load();
    return current;
  }

  function isFirstVisit() {
    return !localStorage.getItem(SETUP_DONE_KEY);
  }

  function markSetupDone() {
    localStorage.setItem(SETUP_DONE_KEY, '1');
  }

  return { load, save, get, getDefaults, isFirstVisit, markSetupDone };
})();

/* ══════════════ MONEY FORMATTER ══════════════ */
const Fmt = (() => {
  function money(n, dp = 2) {
    if (!isFinite(n)) return CurrencySettings.get().symbol + '0';
    const s = CurrencySettings.get();
    const abs = Math.abs(n);
    let formatted;
    try {
      formatted = abs.toLocaleString(s.locale, {
        minimumFractionDigits: dp,
        maximumFractionDigits: dp
      });
    } catch (e) {
      formatted = abs.toFixed(dp);
    }
    return s.symbol + formatted;
  }

  function num(n, dp = 2) {
    if (!isFinite(n)) return '0';
    const s = CurrencySettings.get();
    try {
      return n.toLocaleString(s.locale, {
        minimumFractionDigits: dp,
        maximumFractionDigits: dp
      });
    } catch (e) {
      return n.toFixed(dp);
    }
  }

  function pct(n, dp = 1) {
    return isFinite(n) ? n.toFixed(dp) + '%' : '0%';
  }

  function symbol() {
    return CurrencySettings.get().symbol;
  }

  return { money, num, pct, symbol };
})();

/* ══════════════ TAX ENGINE (replaces GST) ══════════════ */
const Tax = {
  add(base, rate) { return base * (1 + rate / 100); },
  remove(total, rate) { return total / (1 + rate / 100); },
  amount(base, rate) { return base * rate / 100; },
  get RATES() { return CurrencySettings.get().taxRates; },
  get LABEL() { return CurrencySettings.get().taxLabel; },
  get DEFAULT_RATE() { return CurrencySettings.get().defaultTaxRate; },

  /* Build <option> elements for any tax rate select */
  buildOptions(selectEl, selectedRate) {
    if (!selectEl) return;
    const rates = this.RATES;
    const label = this.LABEL;
    const chosen = selectedRate !== undefined ? selectedRate : this.DEFAULT_RATE;
    selectEl.innerHTML = rates.map(r => {
      const sel = r === chosen ? ' selected' : '';
      return `<option value="${r}"${sel}>${r}% ${r === 0 ? '— Exempt' : '— ' + label}</option>`;
    }).join('');
  }
};

/* ══════════════ APPLY SETTINGS SITE-WIDE ══════════════ */
function applyLocaleToPage() {
  const s = CurrencySettings.get();
  // Update any static currency symbol spans
  document.querySelectorAll('[data-currency-symbol]').forEach(el => {
    el.textContent = s.symbol;
  });
  // Update tax label spans
  document.querySelectorAll('[data-tax-label]').forEach(el => {
    el.textContent = s.taxLabel;
  });
  // Rebuild tax rate selects
  document.querySelectorAll('[data-tax-select]').forEach(sel => {
    const currentVal = parseFloat(sel.value) || s.defaultTaxRate;
    Tax.buildOptions(sel, currentVal);
  });
  // Update any labels that contain the old rupee symbol in placeholder text
  document.querySelectorAll('[data-currency-label]').forEach(el => {
    const template = el.getAttribute('data-currency-label');
    el.textContent = template.replace('{sym}', s.symbol).replace('{tax}', s.taxLabel);
  });
  // Dispatch event so calculators can re-render
  document.dispatchEvent(new CustomEvent('fc:locale-changed', { detail: s }));
}

/* ══════════════ SETUP MODAL ══════════════ */
const SetupModal = (() => {
  let modalEl = null;

  function buildModal(isFirstVisit) {
    const s = CurrencySettings.get();
    const currencyOptions = CURRENCY_PRESETS.map(p =>
      `<option value="${p.code}" ${p.code === s.code ? 'selected' : ''}>${p.symbol ? p.symbol + ' — ' : ''}${p.name} (${p.code})</option>`
    ).join('');

    const modal = document.createElement('div');
    modal.id = 'fc-setup-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Currency and Tax Setup');
    modal.innerHTML = `
      <div class="fc-modal-backdrop"></div>
      <div class="fc-modal-box">
        <div class="fc-modal-header">
          <div class="fc-modal-icon">🌍</div>
          <div>
            <h2 class="fc-modal-title">Set Your Currency & Tax</h2>
            <p class="fc-modal-sub">Customize FoodCost AI for your market. You can change this anytime via the ⚙️ button.</p>
          </div>
        </div>

        <div class="fc-modal-body">
          <!-- Currency -->
          <div class="fc-field-group">
            <label class="fc-label" for="setup-currency">Currency</label>
            <select id="setup-currency" class="fc-select">
              ${currencyOptions}
            </select>
          </div>

          <div class="fc-field-row">
            <!-- Tax Label -->
            <div class="fc-field-group">
              <label class="fc-label" for="setup-tax-label">Tax / VAT Label</label>
              <input id="setup-tax-label" class="fc-input" type="text" value="${s.taxLabel}" placeholder="e.g. GST, VAT, Sales Tax" maxlength="20"/>
            </div>

            <!-- Default Tax Rate -->
            <div class="fc-field-group">
              <label class="fc-label" for="setup-default-rate">Default Rate</label>
              <select id="setup-default-rate" class="fc-select"></select>
            </div>
          </div>

          <!-- Tax Rates -->
          <div class="fc-field-group">
            <label class="fc-label" for="setup-tax-rates">
              Available Tax Rates (%)
              <span class="fc-label-hint">comma-separated, e.g. 0, 5, 12, 18</span>
            </label>
            <input id="setup-tax-rates" class="fc-input" type="text" value="${s.taxRates.join(', ')}" placeholder="0, 5, 12, 18, 28"/>
          </div>

          <!-- Preview -->
          <div class="fc-preview" id="setup-preview">
            <span class="fc-preview-label">Preview</span>
            <span class="fc-preview-val" id="setup-preview-val"></span>
          </div>
        </div>

        <div class="fc-modal-footer">
          ${!isFirstVisit ? `<button class="fc-btn-secondary" id="setup-cancel">Cancel</button>` : ''}
          <button class="fc-btn-primary" id="setup-save">
            Save & Continue
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    `;
    return modal;
  }

  function buildDefaultRateSelect(rates, defaultRate) {
    const sel = document.getElementById('setup-default-rate');
    if (!sel) return;
    sel.innerHTML = rates.map(r =>
      `<option value="${r}" ${r === defaultRate ? 'selected' : ''}>${r}%</option>`
    ).join('');
  }

  function updatePreview() {
    const sym = document.getElementById('setup-currency');
    const preset = CURRENCY_PRESETS.find(p => p.code === sym?.value);
    const symbol = preset ? preset.symbol : (sym?.value || '');
    const taxLabel = document.getElementById('setup-tax-label')?.value || 'Tax';
    const preview = document.getElementById('setup-preview-val');
    if (preview) {
      const sampleNum = (1234.5).toLocaleString(preset?.locale || 'en-US', {
        minimumFractionDigits: 2, maximumFractionDigits: 2
      });
      preview.textContent = `${symbol}${sampleNum} · ${taxLabel}`;
    }
  }

  function open(forceFirstVisit = false) {
    if (document.getElementById('fc-setup-modal')) return;

    const isFirst = forceFirstVisit || CurrencySettings.isFirstVisit();
    modalEl = buildModal(isFirst);
    document.body.appendChild(modalEl);
    injectModalStyles();

    const s = CurrencySettings.get();
    buildDefaultRateSelect(s.taxRates, s.defaultTaxRate);
    updatePreview();

    // Wire currency change → auto-fill tax fields
    document.getElementById('setup-currency')?.addEventListener('change', (e) => {
      const preset = CURRENCY_PRESETS.find(p => p.code === e.target.value);
      if (preset && preset.code !== 'CUSTOM') {
        document.getElementById('setup-tax-label').value = preset.taxLabel;
        document.getElementById('setup-tax-rates').value = preset.taxRates.join(', ');
        buildDefaultRateSelect(preset.taxRates, preset.defaultTaxRate);
      }
      updatePreview();
    });

    document.getElementById('setup-tax-label')?.addEventListener('input', updatePreview);

    document.getElementById('setup-tax-rates')?.addEventListener('input', () => {
      const rawRates = parseRates(document.getElementById('setup-tax-rates').value);
      const cur = parseFloat(document.getElementById('setup-default-rate')?.value) || rawRates[0] || 0;
      buildDefaultRateSelect(rawRates, cur);
      updatePreview();
    });

    document.getElementById('setup-save')?.addEventListener('click', saveAndClose);
    document.getElementById('setup-cancel')?.addEventListener('click', close);

    // Backdrop close only for non-first-visit
    if (!isFirst) {
      modalEl.querySelector('.fc-modal-backdrop')?.addEventListener('click', close);
    }

    requestAnimationFrame(() => {
      modalEl?.querySelector('.fc-modal-box')?.classList.add('fc-modal-visible');
    });
  }

  function saveAndClose() {
    const code = document.getElementById('setup-currency')?.value || 'INR';
    const preset = CURRENCY_PRESETS.find(p => p.code === code) || CURRENCY_PRESETS[0];
    const taxLabel = document.getElementById('setup-tax-label')?.value?.trim() || preset.taxLabel;
    const rawRates = parseRates(document.getElementById('setup-tax-rates')?.value);
    const taxRates = rawRates.length ? rawRates : preset.taxRates;
    const defaultTaxRate = parseFloat(document.getElementById('setup-default-rate')?.value) || taxRates[0] || 0;

    // Handle custom currency symbol
    let symbol = preset.symbol;
    if (code === 'CUSTOM') {
      symbol = prompt('Enter your currency symbol (e.g. ฿, ₩, Rp):') || '$';
    }

    const settings = {
      code,
      symbol,
      name: preset.name,
      locale: preset.locale,
      taxLabel,
      taxRates,
      defaultTaxRate
    };

    CurrencySettings.save(settings);
    close();
    applyLocaleToPage();

    // Show confirmation toast
    if (window.FC?.Toast) {
      window.FC.Toast.show(`Currency set to ${symbol} · ${taxLabel}`, 'success');
    }
  }

  function close() {
    if (!modalEl) return;
    const box = modalEl.querySelector('.fc-modal-box');
    if (box) {
      box.style.transform = 'scale(0.95)';
      box.style.opacity = '0';
    }
    setTimeout(() => {
      modalEl?.remove();
      modalEl = null;
    }, 220);
  }

  function parseRates(str) {
    return str
      .split(',')
      .map(s => parseFloat(s.trim()))
      .filter(n => isFinite(n) && n >= 0 && n <= 100)
      .sort((a, b) => a - b)
      .filter((v, i, arr) => arr.indexOf(v) === i); // dedupe
  }

  function injectModalStyles() {
    if (document.getElementById('fc-modal-styles')) return;
    const style = document.createElement('style');
    style.id = 'fc-modal-styles';
    style.textContent = `
      #fc-setup-modal {
        position: fixed; inset: 0; z-index: 99999;
        display: flex; align-items: center; justify-content: center;
        padding: 16px;
      }
      .fc-modal-backdrop {
        position: absolute; inset: 0;
        background: rgba(0,0,0,0.6);
        backdrop-filter: blur(6px);
      }
      .fc-modal-box {
        position: relative; z-index: 1;
        background: var(--bg-card, #1a2235);
        border: 1px solid var(--border-light, rgba(255,255,255,0.08));
        border-radius: 20px;
        padding: 0;
        width: 100%; max-width: 520px;
        box-shadow: 0 24px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.05);
        transform: scale(0.92); opacity: 0;
        transition: transform 0.25s cubic-bezier(.34,1.36,.64,1), opacity 0.2s ease;
        overflow: hidden;
      }
      .fc-modal-box.fc-modal-visible {
        transform: scale(1); opacity: 1;
      }
      .fc-modal-header {
        display: flex; align-items: flex-start; gap: 16px;
        padding: 28px 28px 20px;
        border-bottom: 1px solid var(--border-light, rgba(255,255,255,0.07));
        background: linear-gradient(135deg, rgba(0,200,150,0.06), rgba(99,102,241,0.06));
      }
      .fc-modal-icon {
        font-size: 36px; line-height: 1; flex-shrink: 0;
        background: linear-gradient(135deg,#00c896,#6366f1);
        border-radius: 12px; width: 52px; height: 52px;
        display: flex; align-items: center; justify-content: center;
      }
      .fc-modal-title {
        font-family: Outfit, sans-serif;
        font-size: 1.3rem; font-weight: 800;
        color: var(--tx-1, #e2e8f0); margin: 0 0 4px;
      }
      .fc-modal-sub {
        font-size: 13px; color: var(--tx-3, #94a3b8);
        margin: 0; line-height: 1.5;
      }
      .fc-modal-body {
        padding: 24px 28px;
        display: flex; flex-direction: column; gap: 18px;
      }
      .fc-field-group {
        display: flex; flex-direction: column; gap: 7px;
        flex: 1;
      }
      .fc-field-row {
        display: flex; gap: 14px;
      }
      .fc-label {
        font-size: 12.5px; font-weight: 600;
        color: var(--tx-2, #cbd5e1);
        letter-spacing: 0.03em;
        text-transform: uppercase;
        display: flex; align-items: center; gap: 8px;
      }
      .fc-label-hint {
        font-size: 11px; font-weight: 400; text-transform: none;
        color: var(--tx-4, #64748b); letter-spacing: 0;
      }
      .fc-select, .fc-input {
        width: 100%; padding: 11px 14px;
        background: var(--bg-input, rgba(255,255,255,0.04));
        border: 1.5px solid var(--border-light, rgba(255,255,255,0.1));
        border-radius: 10px;
        color: var(--tx-1, #e2e8f0);
        font-family: Inter, sans-serif; font-size: 14px;
        outline: none; transition: border-color 0.2s;
        box-sizing: border-box;
      }
      .fc-select:focus, .fc-input:focus {
        border-color: #00c896;
        box-shadow: 0 0 0 3px rgba(0,200,150,0.15);
      }
      .fc-select option { background: #1a2235; }
      .fc-preview {
        background: linear-gradient(135deg, rgba(0,200,150,0.08), rgba(99,102,241,0.08));
        border: 1px solid rgba(0,200,150,0.2);
        border-radius: 10px; padding: 12px 16px;
        display: flex; align-items: center; justify-content: space-between;
      }
      .fc-preview-label {
        font-size: 11px; font-weight: 700; text-transform: uppercase;
        letter-spacing: 0.06em; color: var(--tx-3, #94a3b8);
      }
      .fc-preview-val {
        font-size: 15px; font-weight: 700;
        color: #00c896; font-family: Outfit, sans-serif;
      }
      .fc-modal-footer {
        padding: 16px 28px 24px;
        display: flex; gap: 10px; justify-content: flex-end;
        border-top: 1px solid var(--border-light, rgba(255,255,255,0.07));
      }
      .fc-btn-primary {
        display: flex; align-items: center; gap: 8px;
        padding: 12px 24px;
        background: linear-gradient(135deg, #00c896, #059669);
        color: #fff; border: none; border-radius: 10px;
        font-family: Inter, sans-serif; font-size: 14px; font-weight: 700;
        cursor: pointer; transition: opacity 0.2s, transform 0.15s;
      }
      .fc-btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
      .fc-btn-secondary {
        padding: 12px 20px;
        background: transparent;
        color: var(--tx-3, #94a3b8);
        border: 1.5px solid var(--border-light, rgba(255,255,255,0.1));
        border-radius: 10px;
        font-family: Inter, sans-serif; font-size: 14px; font-weight: 600;
        cursor: pointer; transition: background 0.2s;
      }
      .fc-btn-secondary:hover { background: rgba(255,255,255,0.05); }

      /* Settings button in navbar */
      .nav__settings {
        background: none; border: none;
        cursor: pointer; font-size: 17px;
        padding: 6px; border-radius: 8px;
        color: var(--tx-2, #cbd5e1);
        transition: background 0.2s, transform 0.2s;
        display: flex; align-items: center; gap: 5px;
        position: relative;
      }
      .nav__settings:hover { background: rgba(255,255,255,0.07); transform: rotate(20deg); }
      .nav__settings-badge {
        position: absolute; top: 0; right: 0;
        width: 8px; height: 8px; border-radius: 50%;
        background: #00c896;
        font-size: 0; border: 2px solid var(--bg-nav, #0e1624);
      }

      @media (max-width: 520px) {
        .fc-modal-header { flex-direction: column; padding: 20px 20px 16px; }
        .fc-modal-body { padding: 18px 20px; }
        .fc-modal-footer { padding: 14px 20px 20px; }
        .fc-field-row { flex-direction: column; }
      }
    `;
    document.head.appendChild(style);
  }

  return { open, close };
})();

/* ══════════════ NAVBAR SETTINGS BUTTON ══════════════ */
function injectSettingsButton() {
  const actions = document.querySelector('.nav__actions');
  if (!actions || document.getElementById('localeSettingsBtn')) return;

  const btn = document.createElement('button');
  btn.id = 'localeSettingsBtn';
  btn.className = 'nav__settings';
  btn.setAttribute('aria-label', 'Currency & Tax Settings');
  btn.title = 'Currency & Tax Settings';
  btn.innerHTML = `⚙️<span class="nav__settings-badge"></span>`;
  btn.addEventListener('click', () => SetupModal.open(false));

  // Insert before the burger button
  const burger = actions.querySelector('.nav__burger');
  if (burger) {
    actions.insertBefore(btn, burger);
  } else {
    actions.appendChild(btn);
  }
}

/* ══════════════ BOOT ══════════════ */
document.addEventListener('DOMContentLoaded', () => {
  CurrencySettings.load();
  injectSettingsButton();
  applyLocaleToPage();

  // Show modal on first visit
  if (CurrencySettings.isFirstVisit()) {
    setTimeout(() => SetupModal.open(true), 400);
  }
});

/* ══════════════ GLOBAL EXPORTS ══════════════ */
window.FC = window.FC || {};
window.FC.CurrencySettings = CurrencySettings;
window.FC.Fmt = Fmt;          // override old Fmt
window.FC.Tax  = Tax;         // override old GST
window.FC.GST  = Tax;         // alias for backward compat
window.FC.SetupModal = SetupModal;
window.FC.applyLocaleToPage = applyLocaleToPage;
window.FC.CURRENCY_PRESETS = CURRENCY_PRESETS;
