/* ─────────────────────────────────────────────────────────────
   FOODCOST AI — currency.js  (rewritten for reliability)
   Global Currency & Tax Engine
───────────────────────────────────────────────────────────── */

/* ══════════════ CURRENCY PRESETS ══════════════ */
var CURRENCY_PRESETS = [
  { code:'INR',  symbol:'₹',   name:'Indian Rupee',        locale:'en-IN', taxLabel:'GST',     taxRates:[0,5,12,18,28], defaultTaxRate:5  },
  { code:'USD',  symbol:'$',   name:'US Dollar',           locale:'en-US', taxLabel:'Sales Tax',taxRates:[0,6,8,10],     defaultTaxRate:8  },
  { code:'EUR',  symbol:'€',   name:'Euro',                locale:'de-DE', taxLabel:'VAT',      taxRates:[0,7,19],       defaultTaxRate:19 },
  { code:'GBP',  symbol:'£',   name:'British Pound',       locale:'en-GB', taxLabel:'VAT',      taxRates:[0,5,20],       defaultTaxRate:20 },
  { code:'CNY',  symbol:'¥',   name:'Chinese Yuan',        locale:'zh-CN', taxLabel:'VAT',      taxRates:[0,9,13],       defaultTaxRate:13 },
  { code:'AED',  symbol:'AED', name:'UAE Dirham',          locale:'en-AE', taxLabel:'VAT',      taxRates:[0,5],          defaultTaxRate:5  },
  { code:'SGD',  symbol:'S$',  name:'Singapore Dollar',    locale:'en-SG', taxLabel:'GST',      taxRates:[0,9],          defaultTaxRate:9  },
  { code:'AUD',  symbol:'A$',  name:'Australian Dollar',   locale:'en-AU', taxLabel:'GST',      taxRates:[0,10],         defaultTaxRate:10 },
  { code:'CAD',  symbol:'C$',  name:'Canadian Dollar',     locale:'en-CA', taxLabel:'HST/GST',  taxRates:[0,5,13,15],   defaultTaxRate:5  },
  { code:'SAR',  symbol:'SAR', name:'Saudi Riyal',         locale:'en-SA', taxLabel:'VAT',      taxRates:[0,15],         defaultTaxRate:15 },
  { code:'CUSTOM',symbol:'',   name:'Custom Currency',     locale:'en-US', taxLabel:'Tax',      taxRates:[0,10],         defaultTaxRate:10 }
];

/* ══════════════ STORAGE ══════════════ */
var FC_KEY       = 'fc-locale';
var FC_DONE_KEY  = 'fc-setup-done';

function fcGetSettings() {
  try {
    var raw = localStorage.getItem(FC_KEY);
    if (raw) return JSON.parse(raw);
  } catch(e){}
  return { code:'INR', symbol:'₹', name:'Indian Rupee', locale:'en-IN', taxLabel:'GST', taxRates:[0,5,12,18,28], defaultTaxRate:5 };
}

function fcSaveSettings(s) {
  try {
    localStorage.setItem(FC_KEY, JSON.stringify(s));
    localStorage.setItem(FC_DONE_KEY, '1');
  } catch(e){}
}

function fcIsFirstVisit() {
  return !localStorage.getItem(FC_DONE_KEY);
}

/* ══════════════ MONEY FORMATTER ══════════════ */
var FcFmt = {
  money: function(n, dp) {
    dp = dp !== undefined ? dp : 2;
    var s = fcGetSettings();
    if (!isFinite(n)) return s.symbol + '0';
    try { return s.symbol + Math.abs(n).toLocaleString(s.locale, {minimumFractionDigits:dp, maximumFractionDigits:dp}); }
    catch(e) { return s.symbol + Math.abs(n).toFixed(dp); }
  },
  num: function(n, dp) {
    dp = dp !== undefined ? dp : 2;
    var s = fcGetSettings();
    if (!isFinite(n)) return '0';
    try { return n.toLocaleString(s.locale, {minimumFractionDigits:dp, maximumFractionDigits:dp}); }
    catch(e) { return n.toFixed(dp); }
  },
  pct: function(n, dp) { dp = dp !== undefined ? dp : 1; return isFinite(n) ? n.toFixed(dp)+'%' : '0%'; },
  symbol: function() { return fcGetSettings().symbol; },
  inr: function(n, dp) { return this.money(n, dp); }
};

/* ══════════════ TAX ENGINE ══════════════ */
var Tax = {
  add:    function(base, rate) { return base * (1 + rate/100); },
  remove: function(total, rate){ return total / (1 + rate/100); },
  amount: function(base, rate) { return base * rate/100; },
  get RATES()        { return fcGetSettings().taxRates; },
  get LABEL()        { return fcGetSettings().taxLabel; },
  get DEFAULT_RATE() { return fcGetSettings().defaultTaxRate; },
  buildOptions: function(selectEl, selectedRate) {
    if (!selectEl) return;
    var s = fcGetSettings();
    var chosen = selectedRate !== undefined ? selectedRate : s.defaultTaxRate;
    selectEl.innerHTML = s.taxRates.map(function(r){
      return '<option value="'+r+'"'+(r===chosen?' selected':'')+'>'
        + r+'% '+(r===0?'— Exempt':'— '+s.taxLabel)+'</option>';
    }).join('');
  }
};

/* ══════════════ APPLY TO PAGE ══════════════ */
function fcApplyLocale() {
  var s = fcGetSettings();
  document.querySelectorAll('[data-currency-symbol]').forEach(function(el){ el.textContent = s.symbol; });
  document.querySelectorAll('[data-tax-label]').forEach(function(el){ el.textContent = s.taxLabel; });
  document.querySelectorAll('[data-tax-select]').forEach(function(sel){
    var cur = parseFloat(sel.value) || s.defaultTaxRate;
    Tax.buildOptions(sel, cur);
  });
  document.querySelectorAll('[data-currency-label]').forEach(function(el){
    var tmpl = el.getAttribute('data-currency-label');
    el.textContent = tmpl.replace('{sym}', s.symbol).replace('{tax}', s.taxLabel);
  });
  try { document.dispatchEvent(new CustomEvent('fc:locale-changed', {detail: s})); } catch(e){}
}

/* ══════════════ MODAL ══════════════ */
function fcBuildModalHTML() {
  var s = fcGetSettings();
  var opts = CURRENCY_PRESETS.map(function(p){
    return '<option value="'+p.code+'"'+(p.code===s.code?' selected':'')+' style="background:#1a2235;color:#e2e8f0;">'+(p.symbol?p.symbol+' — ':'')+p.name+' ('+p.code+')</option>';
  }).join('');
  return '<div id="fc-modal" style="display:none;position:fixed;inset:0;z-index:99999;align-items:center;justify-content:center;padding:16px;">'
    +'<div id="fc-backdrop" style="position:absolute;inset:0;background:rgba(0,0,0,0.65);backdrop-filter:blur(5px);"></div>'
    +'<div id="fc-box" style="position:relative;z-index:1;background:#1a2235;border:1px solid rgba(255,255,255,0.1);border-radius:20px;width:100%;max-width:500px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,0.5);">'
      +'<div style="padding:24px 28px 18px;background:linear-gradient(135deg,rgba(0,200,150,0.07),rgba(99,102,241,0.07));border-bottom:1px solid rgba(255,255,255,0.07);display:flex;align-items:center;gap:14px;">'
        +'<div style="font-size:30px;width:50px;height:50px;border-radius:12px;background:linear-gradient(135deg,#00c896,#6366f1);display:flex;align-items:center;justify-content:center;flex-shrink:0;">🌍</div>'
        +'<div><h2 style="font-family:Outfit,sans-serif;font-size:1.2rem;font-weight:800;color:#e2e8f0;margin:0 0 4px;">Currency &amp; Tax Settings</h2>'
        +'<p style="font-size:13px;color:#94a3b8;margin:0;">Customize for your market. Changes apply instantly.</p></div>'
      +'</div>'
      +'<div style="padding:22px 28px;display:flex;flex-direction:column;gap:16px;">'
        +'<div><label style="display:block;font-size:12px;font-weight:600;color:#cbd5e1;text-transform:uppercase;letter-spacing:.04em;margin-bottom:7px;">Currency</label>'
        +'<select id="fc-currency-sel" style="width:100%;padding:10px 14px;background:#0e1826;border:1.5px solid rgba(255,255,255,0.18);border-radius:10px;color:#e2e8f0;font-size:14px;outline:none;box-sizing:border-box;">'+opts+'</select></div>'
        +'<div style="display:flex;gap:12px;">'
          +'<div style="flex:1;"><label style="display:block;font-size:12px;font-weight:600;color:#cbd5e1;text-transform:uppercase;letter-spacing:.04em;margin-bottom:7px;">Tax Label</label>'
          +'<input id="fc-tax-label" type="text" maxlength="20" value="'+s.taxLabel+'" placeholder="GST / VAT / Sales Tax" style="width:100%;padding:10px 14px;background:rgba(255,255,255,0.05);border:1.5px solid rgba(255,255,255,0.12);border-radius:10px;color:#e2e8f0;font-size:14px;outline:none;box-sizing:border-box;"/></div>'
          +'<div style="flex:1;"><label style="display:block;font-size:12px;font-weight:600;color:#cbd5e1;text-transform:uppercase;letter-spacing:.04em;margin-bottom:7px;">Default Rate</label>'
          +'<select id="fc-default-rate" style="width:100%;padding:10px 14px;background:#0e1826;border:1.5px solid rgba(255,255,255,0.18);border-radius:10px;color:#e2e8f0;font-size:14px;outline:none;box-sizing:border-box;"></select></div>'
        +'</div>'
        +'<div><label style="display:block;font-size:12px;font-weight:600;color:#cbd5e1;text-transform:uppercase;letter-spacing:.04em;margin-bottom:7px;">Tax Rates (%) <span style="font-weight:400;text-transform:none;font-size:11px;color:#64748b;">comma-separated</span></label>'
        +'<input id="fc-tax-rates" type="text" value="'+s.taxRates.join(', ')+'" placeholder="0, 5, 12, 18, 28" style="width:100%;padding:10px 14px;background:rgba(255,255,255,0.05);border:1.5px solid rgba(255,255,255,0.12);border-radius:10px;color:#e2e8f0;font-size:14px;outline:none;box-sizing:border-box;"/></div>'
        +'<div id="fc-preview" style="background:rgba(0,200,150,0.08);border:1px solid rgba(0,200,150,0.2);border-radius:10px;padding:11px 16px;display:flex;justify-content:space-between;align-items:center;">'
          +'<span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;">Preview</span>'
          +'<span id="fc-preview-val" style="font-size:15px;font-weight:700;color:#00c896;font-family:Outfit,sans-serif;"></span>'
        +'</div>'
      +'</div>'
      +'<div style="padding:14px 28px 22px;border-top:1px solid rgba(255,255,255,0.07);display:flex;justify-content:flex-end;gap:10px;">'
        +'<button id="fc-cancel-btn" style="padding:10px 18px;background:transparent;color:#94a3b8;border:1.5px solid rgba(255,255,255,0.1);border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;">Cancel</button>'
        +'<button id="fc-save-btn" style="padding:10px 22px;background:linear-gradient(135deg,#00c896,#059669);color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;">Save &amp; Apply</button>'
      +'</div>'
    +'</div>'
  +'</div>';
}

function fcParseRates(str) {
  return str.split(',').map(function(s){ return parseFloat(s.trim()); })
    .filter(function(n){ return isFinite(n) && n>=0 && n<=100; })
    .sort(function(a,b){ return a-b; })
    .filter(function(v,i,arr){ return arr.indexOf(v)===i; });
}

function fcBuildDefaultRateSelect() {
  var sel = document.getElementById('fc-default-rate');
  if (!sel) return;
  var ratesInput = document.getElementById('fc-tax-rates');
  var rates = ratesInput ? fcParseRates(ratesInput.value) : fcGetSettings().taxRates;
  var current = fcGetSettings().defaultTaxRate;
  sel.innerHTML = rates.map(function(r){
    return '<option value="'+r+'"'+(r===current?' selected':'')+' style="background:#0e1826;color:#e2e8f0;">'+r+'%</option>';
  }).join('');
}

function fcUpdatePreview() {
  var codeSel = document.getElementById('fc-currency-sel');
  var labelEl = document.getElementById('fc-tax-label');
  var prevEl  = document.getElementById('fc-preview-val');
  if (!prevEl) return;
  var code    = codeSel ? codeSel.value : 'INR';
  var preset  = CURRENCY_PRESETS.filter(function(p){ return p.code===code; })[0];
  var sym     = preset ? preset.symbol : '';
  var label   = labelEl ? labelEl.value : 'Tax';
  try {
    var n = (1234.5).toLocaleString(preset ? preset.locale : 'en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
    prevEl.textContent = sym + n + ' · ' + label;
  } catch(e) { prevEl.textContent = sym + '1,234.50 · ' + label; }
}

function fcOpenModal() {
  var modal = document.getElementById('fc-modal');
  if (!modal) return;
  // Refresh values from current settings
  var s = fcGetSettings();
  var codeSel = document.getElementById('fc-currency-sel');
  if (codeSel) codeSel.value = s.code;
  var labelEl = document.getElementById('fc-tax-label');
  if (labelEl) labelEl.value = s.taxLabel;
  var ratesEl = document.getElementById('fc-tax-rates');
  if (ratesEl) ratesEl.value = s.taxRates.join(', ');
  fcBuildDefaultRateSelect();
  fcUpdatePreview();
  modal.style.display = 'flex';
}

function fcCloseModal() {
  var modal = document.getElementById('fc-modal');
  if (modal) modal.style.display = 'none';
}

function fcSaveModal() {
  var codeSel  = document.getElementById('fc-currency-sel');
  var labelEl  = document.getElementById('fc-tax-label');
  var ratesEl  = document.getElementById('fc-tax-rates');
  var defRateEl= document.getElementById('fc-default-rate');

  var code    = codeSel  ? codeSel.value  : 'INR';
  var preset  = CURRENCY_PRESETS.filter(function(p){ return p.code===code; })[0] || CURRENCY_PRESETS[0];
  var taxLabel= (labelEl && labelEl.value.trim()) ? labelEl.value.trim() : preset.taxLabel;
  var rates   = ratesEl ? fcParseRates(ratesEl.value) : preset.taxRates;
  if (!rates.length) rates = preset.taxRates;
  var defRate = defRateEl ? parseFloat(defRateEl.value) : rates[0] || 0;

  var sym = preset.symbol;
  if (code === 'CUSTOM') { sym = prompt('Enter your currency symbol (e.g. ฿, ₩, Rp):') || '$'; }

  var settings = { code:code, symbol:sym, name:preset.name, locale:preset.locale, taxLabel:taxLabel, taxRates:rates, defaultTaxRate:defRate };
  fcSaveSettings(settings);
  fcCloseModal();
  fcApplyLocale();
}

function fcWireModal() {
  // Settings button (all pages have id="localeSettingsBtn")
  var btn = document.getElementById('localeSettingsBtn');
  if (btn) { btn.onclick = function(){ fcOpenModal(); }; }

  // Modal controls
  var saveBtn   = document.getElementById('fc-save-btn');
  var cancelBtn = document.getElementById('fc-cancel-btn');
  var backdrop  = document.getElementById('fc-backdrop');
  var codeSel   = document.getElementById('fc-currency-sel');
  var labelEl   = document.getElementById('fc-tax-label');
  var ratesEl   = document.getElementById('fc-tax-rates');

  if (saveBtn)   saveBtn.onclick   = fcSaveModal;
  if (cancelBtn) cancelBtn.onclick = fcCloseModal;
  if (backdrop)  backdrop.onclick  = fcCloseModal;

  if (codeSel) codeSel.onchange = function() {
    var preset = CURRENCY_PRESETS.filter(function(p){ return p.code===codeSel.value; })[0];
    if (preset && preset.code !== 'CUSTOM') {
      if (labelEl) labelEl.value = preset.taxLabel;
      if (ratesEl) ratesEl.value = preset.taxRates.join(', ');
      fcBuildDefaultRateSelect();
    }
    fcUpdatePreview();
  };
  if (labelEl) labelEl.oninput = fcUpdatePreview;
  if (ratesEl) ratesEl.oninput = function(){ fcBuildDefaultRateSelect(); fcUpdatePreview(); };
}

/* ══════════════ BOOT — runs immediately ══════════════ */
(function() {
  // 1. Load settings from storage
  fcGetSettings();

  // 2. Inject modal HTML into body
  var div = document.createElement('div');
  div.innerHTML = fcBuildModalHTML();
  document.body.appendChild(div.firstChild);

  // 3. Wire all click handlers
  fcWireModal();

  // 4. Apply currency symbols to page
  fcApplyLocale();

  // 5. Show on first visit (after short delay so page is visible)
  if (fcIsFirstVisit()) {
    setTimeout(fcOpenModal, 600);
  }

  // 6. Export globals
  window.FC = window.FC || {};
  window.FC.CurrencySettings = {
    get: fcGetSettings,
    load: fcGetSettings,
    save: fcSaveSettings,
    isFirstVisit: fcIsFirstVisit,
    getDefaults: function(){ return {code:'INR',symbol:'₹',name:'Indian Rupee',locale:'en-IN',taxLabel:'GST',taxRates:[0,5,12,18,28],defaultTaxRate:5}; }
  };
  window.FC.Fmt = FcFmt;
  window.FC.Tax = Tax;
  window.FC.GST = Tax;
  window.FC.SetupModal = { open: fcOpenModal, close: fcCloseModal };
  window.FC.applyLocaleToPage = fcApplyLocale;
  window.FC.CURRENCY_PRESETS = CURRENCY_PRESETS;

  // 7. Re-run on locale change (e.g. for chart labels)
  document.addEventListener('fc:locale-changed', function(){
    var sym = fcGetSettings().symbol;
    document.querySelectorAll('.demo-sym').forEach(function(el){ el.textContent = sym; });
  });
})();
