/* Homepage Interactive Demo */
'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const rawCostEl = document.getElementById('demoRawCost');
  const batchEl = document.getElementById('demoBatch');
  const mrpEl = document.getElementById('demoMRP');
  const yieldEl = document.getElementById('demoYield');
  const yieldValEl = document.getElementById('demoYieldVal');

  const finishedEl = document.getElementById('demoFinished');
  const costPerKgEl = document.getElementById('demoCostPerKg');
  const revenueEl = document.getElementById('demoRevenue');
  const profitEl = document.getElementById('demoProfit');

  function calculate() {
    const rawCost = parseFloat(rawCostEl?.value) || 40;
    const batchKg = parseFloat(batchEl?.value) || 100;
    const mrpPer100g = parseFloat(mrpEl?.value) || 40;
    const yieldPct = parseFloat(yieldEl?.value) || 32;

    if (yieldValEl) yieldValEl.textContent = yieldPct + '%';

    // Finished product
    const finishedKg = (batchKg * yieldPct) / 100;

    // Raw material cost per kg of chips
    const rawMatCostPerKg = (rawCost * batchKg) / finishedKg;

    // Add rough overheads (oil ~15% of raw mat, packaging ~₹20/kg, labor ~₹10/kg)
    const oilCostPerKg = rawMatCostPerKg * 0.15;
    const packagingCostPerKg = 20;
    const laborCostPerKg = 10;
    const totalCostPerKg = rawMatCostPerKg + oilCostPerKg + packagingCostPerKg + laborCostPerKg;

    // Revenue at MRP (₹40 per 100g pack = ₹400/kg)
    const mrpPerKg = mrpPer100g * 10;
    // After distributor (10%) + retailer (20%) + GST (5%), factory gets ~60%
    const factoryRealizationPerKg = mrpPerKg * 0.60;
    const totalRevenue = factoryRealizationPerKg * finishedKg;
    const profitMargin = ((factoryRealizationPerKg - totalCostPerKg) / factoryRealizationPerKg) * 100;

    // Update UI
    if (finishedEl) {
      finishedEl.textContent = finishedKg.toFixed(1) + ' kg';
      animateValue(finishedEl);
    }
    if (costPerKgEl) {
      costPerKgEl.textContent = '₹' + rawMatCostPerKg.toFixed(0) + ' (raw mat only)';
      animateValue(costPerKgEl);
    }
    if (revenueEl) {
      revenueEl.textContent = '₹' + totalRevenue.toLocaleString('en-IN', {maximumFractionDigits: 0});
      animateValue(revenueEl);
    }
    if (profitEl) {
      const pct = Math.max(-99, Math.min(99, profitMargin));
      profitEl.textContent = (pct > 0 ? '~' : '') + pct.toFixed(0) + '%';
      profitEl.style.color = pct > 20 ? '#10b981' : pct > 0 ? '#f59e0b' : '#f43f5e';
      animateValue(profitEl);
    }
  }

  function animateValue(el) {
    el.classList.remove('success-pop');
    void el.offsetWidth; // reflow
    el.classList.add('success-pop');
  }

  // Bind inputs
  [rawCostEl, batchEl, mrpEl].forEach(el => {
    if (el) el.addEventListener('input', calculate);
  });

  if (yieldEl) {
    yieldEl.addEventListener('input', () => {
      const val = yieldEl.value;
      if (yieldValEl) yieldValEl.textContent = val + '%';
      // Update track fill
      const min = yieldEl.min || 10, max = yieldEl.max || 80;
      const pct = ((val - min) / (max - min)) * 100;
      yieldEl.style.background = `linear-gradient(to right, #10b981 0%, #10b981 ${pct}%, #e2e8f0 ${pct}%)`;
      calculate();
    });
    // Initial track fill
    const val = yieldEl.value;
    const min = yieldEl.min || 10, max = yieldEl.max || 80;
    const pct = ((val - min) / (max - min)) * 100;
    yieldEl.style.background = `linear-gradient(to right, #10b981 0%, #10b981 ${pct}%, #e2e8f0 ${pct}%)`;
  }

  // Initial calculation
  calculate();
});
