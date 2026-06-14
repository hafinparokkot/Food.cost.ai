'use strict';

// ============================================================
// RECIPE COST CALCULATOR
// ============================================================

const RecipeCalc = {
  ingredients: [],
  chart: null,
  nextId: 1,

  TEMPLATES: {
    'banana-chips': {
      name: 'Banana Chips',
      batchSize: 32,
      unitsPerBatch: 320,
      ingredients: [
        { name: 'Raw Banana', qty: 100, unit: 'kg', buyQty: 100, buyUnit: 'kg', buyCost: 4000 },
        { name: 'Coconut Oil', qty: 15, unit: 'L', buyQty: 15, buyUnit: 'L', buyCost: 2400 },
        { name: 'Salt', qty: 0.5, unit: 'kg', buyQty: 1, buyUnit: 'kg', buyCost: 25 },
        { name: 'Turmeric', qty: 0.1, unit: 'kg', buyQty: 0.5, buyUnit: 'kg', buyCost: 80 },
      ]
    },
    'bread': {
      name: 'White Bread Loaf',
      batchSize: 20,
      unitsPerBatch: 20,
      ingredients: [
        { name: 'Refined Flour (Maida)', qty: 20, unit: 'kg', buyQty: 50, buyUnit: 'kg', buyCost: 1200 },
        { name: 'Yeast', qty: 0.2, unit: 'kg', buyQty: 0.5, buyUnit: 'kg', buyCost: 120 },
        { name: 'Sugar', qty: 1, unit: 'kg', buyQty: 50, buyUnit: 'kg', buyCost: 2000 },
        { name: 'Salt', qty: 0.3, unit: 'kg', buyQty: 1, buyUnit: 'kg', buyCost: 25 },
        { name: 'Butter', qty: 1.5, unit: 'kg', buyQty: 5, buyUnit: 'kg', buyCost: 1200 },
      ]
    }
  },

  UNIT_OPTIONS: [
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
  ],

  COLORS: ['#10b981','#f59e0b','#6366f1','#f43f5e','#8b5cf6','#0ea5e9','#14b8a6','#ec4899','#84cc16','#f97316'],

  init() {
    this.bindEvents();
    this.loadTemplate('banana-chips');
  },

  bindEvents() {
    document.getElementById('addIngredient')?.addEventListener('click', () => this.addRow());
    document.getElementById('loadTemplate')?.addEventListener('click', () => this.showTemplateMenu());
    document.getElementById('recipeName')?.addEventListener('input', () => this.onInput());
    document.getElementById('batchSize')?.addEventListener('input', () => this.recalculate());
    document.getElementById('unitsPerBatch')?.addEventListener('input', () => this.recalculate());
    document.getElementById('sellingPrice')?.addEventListener('input', () => this.calcProfit());
    document.getElementById('toggleOverhead')?.addEventListener('click', () => this.toggleOverhead());

    // Overhead inputs
    ['oh_electricity','oh_packaging','oh_labor','oh_rent','oh_misc','oh_transport'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', () => this.recalculate());
    });
  },

  toggleOverhead() {
    const panel = document.getElementById('overheadPanel');
    const btn = document.getElementById('toggleOverhead');
    if (panel.style.display === 'none') {
      panel.style.display = 'grid';
      if (btn) btn.textContent = '▲ Hide';
    } else {
      panel.style.display = 'none';
      if (btn) btn.textContent = '▼ Show';
    }
  },

  showTemplateMenu() {
    const btn = document.getElementById('loadTemplate');
    const menu = document.getElementById('templateMenu');
    if (menu) { menu.remove(); return; }

    const m = document.createElement('div');
    m.id = 'templateMenu';
    m.style.cssText = `
      position:absolute; z-index:100; background:var(--bg-card);
      border:1px solid var(--border-light); border-radius:10px;
      box-shadow:0 8px 24px rgba(0,0,0,0.15); padding:8px;
      min-width:200px; margin-top:8px;
    `;
    const templates = [
      { key: 'banana-chips', label: '🍌 Banana Chips' },
      { key: 'bread', label: '🍞 White Bread Loaf' },
    ];
    templates.forEach(t => {
      const item = document.createElement('button');
      item.textContent = t.label;
      item.style.cssText = `
        display:block; width:100%; text-align:left; padding:10px 14px;
        font-size:14px; border-radius:6px; cursor:pointer;
        background:none; border:none; color:var(--text-primary);
        font-family:Inter,sans-serif; transition:background 0.15s;
      `;
      item.onmouseenter = () => item.style.background = 'var(--bg-secondary)';
      item.onmouseleave = () => item.style.background = 'none';
      item.addEventListener('click', () => {
        this.loadTemplate(t.key);
        m.remove();
        FoodCostAI.Notify.show('Template loaded: ' + t.label, 'success');
      });
      m.appendChild(item);
    });

    btn.style.position = 'relative';
    btn.appendChild(m);
    setTimeout(() => document.addEventListener('click', () => m.remove(), { once: true }), 0);
  },

  loadTemplate(key) {
    const t = this.TEMPLATES[key];
    if (!t) return;
    document.getElementById('recipeName').value = t.name;
    document.getElementById('batchSize').value = t.batchSize;
    document.getElementById('unitsPerBatch').value = t.unitsPerBatch;
    this.ingredients = [];
    this.nextId = 1;
    document.getElementById('ingredientBody').innerHTML = '';
    t.ingredients.forEach(ing => this.addRow(ing));
    this.recalculate();
  },

  addRow(data = {}) {
    const id = this.nextId++;
    const tbody = document.getElementById('ingredientBody');
    const unitOptions = this.UNIT_OPTIONS.map(u =>
      `<option value="${u.value}" ${u.value === (data.unit || 'kg') ? 'selected' : ''}>${u.label}</option>`
    ).join('');
    const buyUnitOptions = this.UNIT_OPTIONS.map(u =>
      `<option value="${u.value}" ${u.value === (data.buyUnit || 'kg') ? 'selected' : ''}>${u.label}</option>`
    ).join('');

    const tr = document.createElement('tr');
    tr.id = `ing-row-${id}`;
    tr.innerHTML = `
      <td class="td-input"><input type="text" value="${data.name || ''}" placeholder="Ingredient" data-id="${id}" data-field="name" /></td>
      <td class="td-input"><input type="number" value="${data.qty || ''}" min="0" step="0.01" placeholder="0" data-id="${id}" data-field="qty" /></td>
      <td class="td-input">
        <select data-id="${id}" data-field="unit">${unitOptions}</select>
      </td>
      <td class="td-input"><input type="number" value="${data.buyQty || ''}" min="0" step="0.01" placeholder="0" data-id="${id}" data-field="buyQty" /></td>
      <td class="td-input">
        <select data-id="${id}" data-field="buyUnit">${buyUnitOptions}</select>
      </td>
      <td class="td-input"><input type="number" value="${data.buyCost || ''}" min="0" step="0.01" placeholder="0" data-id="${id}" data-field="buyCost" /></td>
      <td class="td-cost" id="ing-cost-${id}">--</td>
      <td class="td-pct" id="ing-pct-${id}">0%</td>
      <td><button class="btn-row-delete" data-id="${id}" title="Remove">✕</button></td>
    `;
    tbody.appendChild(tr);

    // Bind
    tr.querySelectorAll('[data-id]').forEach(el => {
      el.addEventListener('input', () => this.recalculate());
      el.addEventListener('change', () => this.recalculate());
    });
    tr.querySelector('.btn-row-delete').addEventListener('click', (e) => {
      document.getElementById(`ing-row-${e.target.dataset.id}`).remove();
      this.recalculate();
    });

    this.recalculate();
  },

  getIngredients() {
    const rows = document.querySelectorAll('#ingredientBody tr');
    return Array.from(rows).map(row => {
      const get = (field) => row.querySelector(`[data-field="${field}"]`)?.value;
      const qty = parseFloat(get('qty')) || 0;
      const unit = get('unit') || 'kg';
      const buyQty = parseFloat(get('buyQty')) || 1;
      const buyUnit = get('buyUnit') || 'kg';
      const buyCost = parseFloat(get('buyCost')) || 0;
      const id = row.querySelector('[data-id]')?.dataset?.id;

      // Convert both to base unit
      const qtyBase = FoodCostAI.Units.toBase(qty, unit);
      const buyQtyBase = FoodCostAI.Units.toBase(buyQty, buyUnit);
      const costPerBase = buyQtyBase > 0 ? buyCost / buyQtyBase : 0;
      const lineCost = qtyBase * costPerBase;

      return { id, name: get('name') || 'Ingredient', qty, unit, buyQty, buyUnit, buyCost, cost: lineCost };
    });
  },

  getOverheads() {
    const ids = ['oh_electricity','oh_packaging','oh_labor','oh_rent','oh_misc','oh_transport'];
    return ids.reduce((sum, id) => sum + (parseFloat(document.getElementById(id)?.value) || 0), 0);
  },

  recalculate() {
    const ings = this.getIngredients();
    const totalIngCost = ings.reduce((s, i) => s + i.cost, 0);
    const overheads = this.getOverheads();
    const totalCost = totalIngCost + overheads;
    const batchKg = parseFloat(document.getElementById('batchSize')?.value) || 1;
    const units = parseFloat(document.getElementById('unitsPerBatch')?.value) || 1;
    const costPerKg = totalCost / batchKg;
    const costPerUnit = totalCost / units;
    const costPer100g = costPerKg * 0.1;

    // Update row costs
    ings.forEach(ing => {
      const costEl = document.getElementById(`ing-cost-${ing.id}`);
      const pctEl = document.getElementById(`ing-pct-${ing.id}`);
      const fmt = n => (window.FC && window.FC.Fmt) ? window.FC.Fmt.money(n) : ('\u20b9' + n.toFixed(2));
      if (costEl) costEl.textContent = fmt(ing.cost);
      if (pctEl) pctEl.textContent = totalIngCost > 0 ? ((ing.cost / totalIngCost) * 100).toFixed(1) + '%' : '0%';
    });

    // Update results
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    const fmt = n => (window.FC && window.FC.Fmt) ? window.FC.Fmt.money(n) : ('\u20b9' + n.toFixed(2));
    set('r_ingredient', fmt(totalIngCost));
    set('r_overhead', fmt(overheads));
    set('r_total', fmt(totalCost));
    set('r_perkg', fmt(costPerKg) + '/kg');
    set('r_perunit', fmt(costPerUnit) + '/unit');
    set('r_per100g', fmt(costPer100g));
    document.getElementById('recipeSummaryName').textContent = document.getElementById('recipeName').value || 'Recipe';

    // Insight
    const biggestIng = ings.reduce((a, b) => a.cost > b.cost ? a : b, { name: '–', cost: 0 });
    const insightEl = document.getElementById('insightText');
    if (insightEl && totalCost > 0) {
      const pct = ((biggestIng.cost / totalCost) * 100).toFixed(0);
      const fmt = n => (window.FC && window.FC.Fmt) ? window.FC.Fmt.money(n) : ('\u20b9' + n.toFixed(2));
      insightEl.textContent = `"${biggestIng.name}" is your biggest cost at ${fmt(biggestIng.cost)} (${pct}% of total batch cost).`;
    }

    this.updateChart(ings, overheads);
    this.updatePctBars(ings, totalIngCost);
    this.calcProfit();
    this.onInput();
  },

  calcProfit() {
    const sp = parseFloat(document.getElementById('sellingPrice')?.value);
    const units = parseFloat(document.getElementById('unitsPerBatch')?.value) || 1;
    const batchKg = parseFloat(document.getElementById('batchSize')?.value) || 1;
    const ings = this.getIngredients();
    const totalCost = ings.reduce((s,i) => s+i.cost, 0) + this.getOverheads();
    const costPerUnit = totalCost / units;

    const profitSection = document.getElementById('profitSection');
    if (!sp || isNaN(sp)) {
      if (profitSection) profitSection.style.display = 'none';
      return;
    }
    if (profitSection) profitSection.style.display = 'block';

    const profit = sp - costPerUnit;
    const profitPct = ((profit / sp) * 100);
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    const fmt = n => (window.FC && window.FC.Fmt) ? window.FC.Fmt.money(n) : ('\u20b9' + n.toFixed(2));
    set('r_profit', fmt(profit));
    set('r_profitpct', profitPct.toFixed(1) + '%');

    const meter = document.getElementById('profitMeter');
    if (meter) {
      const w = Math.max(0, Math.min(100, profitPct));
      meter.style.width = w + '%';
      meter.className = 'profit-meter-fill ' + (profitPct >= 25 ? 'profit-healthy' : profitPct >= 10 ? 'profit-warning' : 'profit-danger');
    }
  },

  updateChart(ings, overheads) {
    const ctx = document.getElementById('costChart')?.getContext('2d');
    if (!ctx) return;
    const labels = ings.filter(i => i.cost > 0).map(i => i.name);
    const data = ings.filter(i => i.cost > 0).map(i => i.cost);
    if (overheads > 0) { labels.push('Overheads'); data.push(overheads); }
    if (!labels.length) return;

    if (this.chart) { this.chart.destroy(); this.chart = null; }
    this.chart = FoodCostAI.ChartUtils.createDoughnut(ctx, labels, data, '');
  },

  updatePctBars(ings, totalCost) {
    const container = document.getElementById('pctBars');
    if (!container || !totalCost) return;
    const sorted = [...ings].filter(i => i.cost > 0).sort((a, b) => b.cost - a.cost);
    container.innerHTML = sorted.map((ing, i) => {
      const pct = ((ing.cost / totalCost) * 100).toFixed(1);
      const color = this.COLORS[i % this.COLORS.length];
      return `
        <div class="pct-bar-row">
          <span class="pct-bar-label" title="${ing.name}">${ing.name}</span>
          <div class="pct-bar-track">
            <div class="pct-bar-fill" style="width:${pct}%;background:${color}"></div>
          </div>
          <span class="pct-bar-value">${pct}%</span>
        </div>
      `;
    }).join('');
  },

  onInput() {
    // Could hook for auto-save or analytics
  }
};

document.addEventListener('DOMContentLoaded', () => {
  RecipeCalc.init();
});
