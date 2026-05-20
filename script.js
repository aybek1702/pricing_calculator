const MODE = { SINGLE: "single", MULTI: "multi" };

const INDUSTRIES = {
  cafe: 4,
  barber: 5,
  premium: 3,
  b2b: 6,
  basics: 20,
  electronics: 12,
  "clothing-mass": 10,
  "clothing-premium": 4,
  other: 5,
};

const SCENARIOS = {
  pessimistic: 1.5,
  realistic: 1,
  optimistic: 0.5,
};

const appState = {
  mode: MODE.SINGLE,
  metrics: null,
  products: [],
  simulator: null,
  conclusionText: "",
  conclusionClass: "",
};

const inputs = {
  price: document.getElementById("price"),
  cost: document.getElementById("cost"),
  fixedCosts: document.getElementById("fixedCosts"),
  quantity: document.getElementById("quantity"),
};

const industrySelect = document.getElementById("industry");
const simConclusion = document.getElementById("simConclusion");
const lossWarning = document.getElementById("lossWarning");
const comparisonTable = document.getElementById("comparisonTable");
const productsBody = document.getElementById("productsBody");
const productAnalysisBody = document.getElementById("productAnalysisBody");
const productAnalysisBlock = document.getElementById("productAnalysisBlock");
const singleProductInputs = document.getElementById("singleProductInputs");
const multiProductInputs = document.getElementById("multiProductInputs");
const addProductBtn = document.getElementById("addProductBtn");
const modeTabs = document.querySelectorAll(".mode-tab");
const simPriceRowLabel = document.getElementById("simPriceRowLabel");

const sliders = {
  priceChange: document.getElementById("priceChange"),
  demandDrop: document.getElementById("demandDrop"),
};

const outputs = {
  grossProfit: document.getElementById("grossProfit"),
  grossMargin: document.getElementById("grossMargin"),
  contributionMargin: document.getElementById("contributionMargin"),
  breakEven: document.getElementById("breakEven"),
  netProfit: document.getElementById("netProfit"),
  netMargin: document.getElementById("netMargin"),
};

const labels = {
  grossProfit: document.getElementById("grossProfitLabel"),
  grossMargin: document.getElementById("grossMarginLabel"),
  breakEven: document.getElementById("breakEvenLabel"),
  breakEvenUnit: document.getElementById("breakEvenUnit"),
  grossProfitUnit: document.getElementById("grossProfitUnit"),
};

const simOutputs = {
  priceChangeValue: document.getElementById("priceChangeValue"),
  demandDropValue: document.getElementById("demandDropValue"),
  priceWas: document.getElementById("simPriceWas"),
  qtyWas: document.getElementById("simQtyWas"),
  revenueWas: document.getElementById("simRevenueWas"),
  profitWas: document.getElementById("simProfitWas"),
  marginWas: document.getElementById("simMarginWas"),
};

let productIdCounter = 0;

function parseValue(input) {
  const value = parseFloat(input.value);
  return Number.isFinite(value) ? value : 0;
}

function formatNumber(value, decimals = 0) {
  return value.toLocaleString("ru-RU", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatPercent(value) {
  return formatNumber(value, 1) + " %";
}

function setResult(element, text, tone) {
  element.textContent = text;
  element.classList.remove("positive", "negative", "neutral");
  element.classList.add(tone);
}

function sentiment(value) {
  if (value > 0) return "positive";
  if (value < 0) return "negative";
  return "neutral";
}

function formatSignedPercent(value) {
  if (value === 0) return "0%";
  const sign = value > 0 ? "+" : "";
  return sign + value + "%";
}

function createProductRow(data = {}) {
  const id = ++productIdCounter;
  const tr = document.createElement("tr");
  tr.dataset.productId = String(id);
  tr.innerHTML = `
    <td><input type="text" class="product-name" value="${data.name || "Товар " + id}" placeholder="Название"></td>
    <td><input type="number" class="product-price" min="0" step="1" value="${data.price ?? 3000}"></td>
    <td><input type="number" class="product-cost" min="0" step="1" value="${data.cost ?? 1500}"></td>
    <td><input type="number" class="product-qty" min="0" step="1" value="${data.quantity ?? 100}"></td>
    <td><button type="button" class="btn-remove" title="Удалить">&times;</button></td>
  `;
  return tr;
}

function getProductsFromDOM() {
  return Array.from(productsBody.querySelectorAll("tr")).map((row) => ({
    id: row.dataset.productId,
    name: row.querySelector(".product-name").value.trim() || "Без названия",
    price: parseValue(row.querySelector(".product-price")),
    cost: parseValue(row.querySelector(".product-cost")),
    quantity: parseValue(row.querySelector(".product-qty")),
  }));
}

function updateRemoveButtons() {
  const rows = productsBody.querySelectorAll("tr");
  rows.forEach((row) => {
    row.querySelector(".btn-remove").disabled = rows.length <= 1;
  });
}

function addProduct(data) {
  const row = createProductRow(data);
  productsBody.appendChild(row);
  row.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", calculate);
  });
  row.querySelector(".btn-remove").addEventListener("click", () => {
    if (productsBody.querySelectorAll("tr").length <= 1) return;
    row.remove();
    updateRemoveButtons();
    calculate();
  });
  updateRemoveButtons();
}

function initProducts() {
  addProduct({ name: "Капучино", price: 2500, cost: 800, quantity: 300 });
  addProduct({ name: "Круассан", price: 1200, cost: 450, quantity: 150 });
}

function computeProductMetrics(product) {
  const grossProfit = product.price - product.cost;
  const revenue = product.price * product.quantity;
  const contribution = grossProfit * product.quantity;
  const grossMargin = product.price > 0 ? (grossProfit / product.price) * 100 : 0;
  return { ...product, grossProfit, revenue, contribution, grossMargin };
}

function aggregateProducts(products, fixedCosts) {
  const items = products.map(computeProductMetrics);
  const totalRevenue = items.reduce((s, p) => s + p.revenue, 0);
  const totalQuantity = items.reduce((s, p) => s + p.quantity, 0);
  const totalContribution = items.reduce((s, p) => s + p.contribution, 0);
  const totalGrossProfit = items.reduce((s, p) => s + p.grossProfit * p.quantity, 0);
  const netProfit = totalContribution - fixedCosts;
  const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const avgGrossMargin =
    totalRevenue > 0
      ? items.reduce((s, p) => s + p.grossMargin * p.revenue, 0) / totalRevenue
      : 0;
  const avgPrice = totalQuantity > 0 ? totalRevenue / totalQuantity : 0;
  const avgCost = totalQuantity > 0 ? (totalRevenue - totalGrossProfit) / totalQuantity : 0;

  return {
    mode: MODE.MULTI,
    products: items,
    fixedCosts,
    totalRevenue,
    totalQuantity,
    totalContribution,
    totalGrossProfit,
    netProfit,
    netMargin,
    avgGrossMargin,
    avgPrice,
    avgCost,
    grossProfitPerUnit: totalQuantity > 0 ? totalGrossProfit / totalQuantity : 0,
    grossMargin: avgGrossMargin,
  };
}

function computeSingleMetrics(price, cost, fixedCosts, quantity) {
  const grossProfit = price - cost;
  const revenue = price * quantity;
  const grossMargin = price > 0 ? (grossProfit / price) * 100 : 0;
  const contributionMargin = grossProfit * quantity;
  const breakEven = grossProfit > 0 ? fixedCosts / grossProfit : null;
  const netProfit = contributionMargin - fixedCosts;
  const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  return {
    mode: MODE.SINGLE,
    price,
    cost,
    quantity,
    fixedCosts,
    grossProfit,
    grossMargin,
    revenue,
    contributionMargin,
    breakEven,
    netProfit,
    netMargin,
    totalRevenue: revenue,
    totalQuantity: quantity,
    totalContribution: contributionMargin,
    avgPrice: price,
    avgCost: cost,
  };
}

function aggregateAfterChange(products, fixedCosts, priceChange, demandDropPercent) {
  const adjusted = products.map((p) => {
    const newPrice = p.price * (1 + priceChange / 100);
    const effectiveDrop = priceChange > 0 ? Math.min(demandDropPercent, 100) : 0;
    const newQty =
      priceChange > 0 ? p.quantity * (1 - effectiveDrop / 100) : p.quantity;
    return { ...p, price: newPrice, quantity: newQty };
  });
  return aggregateProducts(adjusted, fixedCosts);
}

function toSimulatorSnapshot(metrics) {
  return {
    price: metrics.avgPrice,
    cost: metrics.avgCost,
    quantity: metrics.totalQuantity,
    fixedCosts: metrics.fixedCosts,
    revenue: metrics.totalRevenue,
    netProfit: metrics.netProfit,
    netMargin: metrics.netMargin,
  };
}

function computeAfterSingle(base, priceChange, demandDropPercent) {
  const newPrice = base.price * (1 + priceChange / 100);
  const effectiveDrop = priceChange > 0 ? Math.min(demandDropPercent, 100) : 0;
  const newQuantity =
    priceChange > 0 ? base.quantity * (1 - effectiveDrop / 100) : base.quantity;
  const grossProfit = newPrice - base.cost;
  const revenue = newPrice * newQuantity;
  const netProfit = grossProfit * newQuantity - base.fixedCosts;
  const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  return {
    price: newPrice,
    quantity: newQuantity,
    revenue,
    netProfit,
    netMargin,
  };
}

function profitDeltaPercent(oldProfit, newProfit) {
  if (oldProfit === 0) return null;
  return ((newProfit - oldProfit) / Math.abs(oldProfit)) * 100;
}

function setChange(element, text, value) {
  element.textContent = text;
  element.classList.remove("positive", "negative", "neutral");
  element.classList.add(sentiment(value));
}

function getCell(scenario, metric) {
  return document.querySelector(`[data-scenario="${scenario}"][data-metric="${metric}"]`);
}

function getSimpleCell(metric) {
  return document.querySelector(`[data-simple="${metric}"]`);
}

function fillResultCells(cells, was, result, isMulti) {
  const profitDelta = result.netProfit - was.netProfit;
  const deltaPct = profitDeltaPercent(was.netProfit, result.netProfit);

  cells.price.textContent = isMulti
    ? formatNumber(Math.round(result.price)) + " ₸ (ср.)"
    : formatNumber(Math.round(result.price)) + " ₸";
  cells.qty.textContent = formatNumber(Math.round(result.quantity));
  cells.revenue.textContent = formatNumber(Math.round(result.revenue)) + " ₸";
  cells.profit.textContent = formatNumber(Math.round(result.netProfit)) + " ₸";
  cells.margin.textContent = formatPercent(result.netMargin);

  const tengeSign = profitDelta > 0 ? "+" : "";
  setChange(
    cells.deltaTenge,
    tengeSign + formatNumber(Math.round(profitDelta)) + " ₸",
    profitDelta
  );

  if (deltaPct === null) {
    setChange(cells.deltaPercent, "—", "neutral");
  } else {
    const percentSign = deltaPct > 0 ? "+" : "";
    setChange(
      cells.deltaPercent,
      percentSign + formatNumber(deltaPct, 1) + " %",
      profitDelta
    );
  }

  return { profitDelta, deltaPct };
}

function fillScenarioCells(scenario, was, result, isMulti) {
  return fillResultCells(
    {
      price: getCell(scenario, "price"),
      qty: getCell(scenario, "qty"),
      revenue: getCell(scenario, "revenue"),
      profit: getCell(scenario, "profit"),
      margin: getCell(scenario, "margin"),
      deltaTenge: getCell(scenario, "deltaTenge"),
      deltaPercent: getCell(scenario, "deltaPercent"),
    },
    was,
    result,
    isMulti
  );
}

function fillSimpleCells(was, result, isMulti) {
  return fillResultCells(
    {
      price: getSimpleCell("price"),
      qty: getSimpleCell("qty"),
      revenue: getSimpleCell("revenue"),
      profit: getSimpleCell("profit"),
      margin: getSimpleCell("margin"),
      deltaTenge: getSimpleCell("deltaTenge"),
      deltaPercent: getSimpleCell("deltaPercent"),
    },
    was,
    result,
    isMulti
  );
}

function updateConclusion(realisticDeltaTenge, realisticDeltaPct, pessimisticDeltaPct) {
  simConclusion.classList.remove("positive", "moderate", "negative", "hidden");
  appState.conclusionText = "";
  appState.conclusionClass = "";

  if (realisticDeltaTenge > 0 && realisticDeltaPct !== null && realisticDeltaPct >= 10) {
    const x =
      pessimisticDeltaPct !== null
        ? formatNumber(Math.abs(pessimisticDeltaPct), 1)
        : formatNumber(realisticDeltaPct, 1);
    appState.conclusionText =
      "Поднять цену безопасно: даже при пессимистичном сценарии прибыль вырастет на " + x + "%";
    appState.conclusionClass = "positive";
    simConclusion.textContent = appState.conclusionText;
    simConclusion.classList.add("positive");
  } else if (realisticDeltaTenge > 0) {
    const x = realisticDeltaPct !== null ? formatNumber(realisticDeltaPct, 1) : "0";
    appState.conclusionText =
      "Подъём цены даст умеренный эффект: +" + x + "% прибыли при реалистичном сценарии";
    appState.conclusionClass = "moderate";
    simConclusion.textContent = appState.conclusionText;
    simConclusion.classList.add("moderate");
  } else if (realisticDeltaTenge < 0) {
    const x =
      realisticDeltaPct !== null ? formatNumber(Math.abs(realisticDeltaPct), 1) : "—";
    appState.conclusionText =
      "Подъём цены не рекомендуется: прибыль упадёт на " +
      x +
      "% даже при реалистичном сценарии";
    appState.conclusionClass = "negative";
    simConclusion.textContent = appState.conclusionText;
    simConclusion.classList.add("negative");
  } else {
    simConclusion.classList.add("hidden");
  }
}

function calculateSimulator(metrics) {
  const priceChange = parseInt(sliders.priceChange.value, 10);
  const demandDrop = parseInt(sliders.demandDrop.value, 10);
  const isMulti = metrics.mode === MODE.MULTI;

  simOutputs.priceChangeValue.textContent = formatSignedPercent(priceChange);
  simOutputs.demandDropValue.textContent = demandDrop + "%";
  simPriceRowLabel.textContent = isMulti ? "Средняя цена" : "Цена за единицу";

  const was = toSimulatorSnapshot(metrics);

  simOutputs.priceWas.textContent = isMulti
    ? formatNumber(Math.round(was.price)) + " ₸ (ср.)"
    : formatNumber(was.price) + " ₸";
  simOutputs.qtyWas.textContent = formatNumber(was.quantity);
  simOutputs.revenueWas.textContent = formatNumber(was.revenue) + " ₸";
  simOutputs.profitWas.textContent = formatNumber(was.netProfit) + " ₸";
  simOutputs.marginWas.textContent = formatPercent(was.netMargin);

  lossWarning.classList.toggle("hidden", was.netProfit >= 0);

  const showScenarios = priceChange > 0;
  comparisonTable.classList.toggle("scenarios-mode", showScenarios);
  comparisonTable.classList.toggle("simple-mode", !showScenarios);

  const simState = { was, scenarios: {}, showScenarios, priceChange, demandDrop };

  if (showScenarios) {
    Object.entries(SCENARIOS).forEach(([name, multiplier]) => {
      const scenarioDrop = demandDrop * multiplier;
      let result;
      if (isMulti) {
        const rawProducts = metrics.products.map((p) => ({
          name: p.name,
          price: p.price,
          cost: p.cost,
          quantity: p.quantity,
        }));
        result = toSimulatorSnapshot(
          aggregateAfterChange(rawProducts, metrics.fixedCosts, priceChange, scenarioDrop)
        );
      } else {
        result = computeAfterSingle(
          {
            price: metrics.price,
            cost: metrics.cost,
            quantity: metrics.quantity,
            fixedCosts: metrics.fixedCosts,
          },
          priceChange,
          scenarioDrop
        );
      }
      simState.scenarios[name] = fillScenarioCells(name, was, result, isMulti);
    });

    updateConclusion(
      simState.scenarios.realistic.profitDelta,
      simState.scenarios.realistic.deltaPct,
      simState.scenarios.pessimistic.deltaPct
    );
  } else {
    let result;
    if (isMulti) {
      const rawProducts = metrics.products.map((p) => ({
        name: p.name,
        price: p.price,
        cost: p.cost,
        quantity: p.quantity,
      }));
      result = toSimulatorSnapshot(
        aggregateAfterChange(rawProducts, metrics.fixedCosts, priceChange, 0)
      );
    } else {
      result = computeAfterSingle(
        {
          price: metrics.price,
          cost: metrics.cost,
          quantity: metrics.quantity,
          fixedCosts: metrics.fixedCosts,
        },
        priceChange,
        0
      );
    }
    fillSimpleCells(was, result, isMulti);
    simConclusion.classList.add("hidden");
    appState.conclusionText = "";
  }

  appState.simulator = simState;
}

function renderProductAnalysis(metrics) {
  productAnalysisBody.innerHTML = "";
  const totalRevenue = metrics.totalRevenue;
  const totalGrossProfit = metrics.products.reduce(
    (s, p) => s + p.grossProfit * p.quantity,
    0
  );

  metrics.products.forEach((p) => {
    const grossProfitTotal = p.grossProfit * p.quantity;
    const revenueShare = totalRevenue > 0 ? (p.revenue / totalRevenue) * 100 : 0;
    const profitShare =
      totalGrossProfit > 0 ? (grossProfitTotal / totalGrossProfit) * 100 : 0;

    const tr = document.createElement("tr");
    if (p.grossMargin < 20) tr.classList.add("analysis-row-low");
    else if (p.grossMargin <= 40) tr.classList.add("analysis-row-mid");
    else tr.classList.add("analysis-row-high");

    tr.innerHTML = `
      <td>${p.name}</td>
      <td>${formatNumber(revenueShare, 1)} %</td>
      <td>${formatNumber(profitShare, 1)} %</td>
      <td>${formatNumber(p.grossMargin, 1)} %</td>
    `;
    productAnalysisBody.appendChild(tr);
  });
}

function setMode(mode) {
  appState.mode = mode;
  modeTabs.forEach((tab) => {
    const active = tab.dataset.mode === mode;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", active ? "true" : "false");
  });
  singleProductInputs.classList.toggle("hidden", mode !== MODE.SINGLE);
  multiProductInputs.classList.toggle("hidden", mode !== MODE.MULTI);
  productAnalysisBlock.classList.toggle("hidden", mode !== MODE.MULTI);

  if (mode === MODE.SINGLE) {
    labels.grossProfit.textContent = "Валовая прибыль с единицы";
    labels.grossMargin.textContent = "Валовая маржа";
    labels.breakEven.textContent = "Точка безубыточности";
    labels.breakEvenUnit.textContent = "шт.";
    labels.grossProfitUnit.textContent = "₸";
  } else {
    labels.grossProfit.textContent = "Общая валовая прибыль";
    labels.grossMargin.textContent = "Средняя валовая маржа";
    labels.breakEven.textContent = "Средняя валовая маржа по ассортименту";
    labels.breakEvenUnit.textContent = "";
    labels.grossProfitUnit.textContent = "₸";
  }

  calculate();
}

function calculate() {
  const fixedCosts = parseValue(inputs.fixedCosts);
  let metrics;

  if (appState.mode === MODE.MULTI) {
    const products = getProductsFromDOM();
    metrics = aggregateProducts(products, fixedCosts);
    appState.products = products;

    setResult(
      outputs.grossProfit,
      formatNumber(metrics.totalGrossProfit),
      sentiment(metrics.totalGrossProfit)
    );
    setResult(outputs.grossMargin, formatPercent(metrics.avgGrossMargin), sentiment(metrics.avgGrossMargin));
    setResult(
      outputs.contributionMargin,
      formatNumber(metrics.totalContribution),
      sentiment(metrics.totalContribution)
    );
    setResult(
      outputs.breakEven,
      formatPercent(metrics.avgGrossMargin),
      sentiment(metrics.avgGrossMargin)
    );
    setResult(outputs.netProfit, formatNumber(metrics.netProfit), sentiment(metrics.netProfit));
    setResult(outputs.netMargin, formatPercent(metrics.netMargin), sentiment(metrics.netMargin));

    renderProductAnalysis(metrics);
  } else {
    const price = parseValue(inputs.price);
    const cost = parseValue(inputs.cost);
    const quantity = parseValue(inputs.quantity);
    metrics = computeSingleMetrics(price, cost, fixedCosts, quantity);

    setResult(outputs.grossProfit, formatNumber(metrics.grossProfit), sentiment(metrics.grossProfit));
    setResult(outputs.grossMargin, formatPercent(metrics.grossMargin), sentiment(metrics.grossMargin));
    setResult(
      outputs.contributionMargin,
      formatNumber(metrics.contributionMargin),
      sentiment(metrics.contributionMargin)
    );

    if (metrics.breakEven === null) {
      setResult(outputs.breakEven, "—", "neutral");
    } else {
      setResult(
        outputs.breakEven,
        formatNumber(Math.ceil(metrics.breakEven)),
        quantity >= Math.ceil(metrics.breakEven) ? "positive" : "negative"
      );
    }

    setResult(outputs.netProfit, formatNumber(metrics.netProfit), sentiment(metrics.netProfit));
    setResult(outputs.netMargin, formatPercent(metrics.netMargin), sentiment(metrics.netMargin));
  }

  appState.metrics = metrics;
  calculateSimulator(metrics);
}

modeTabs.forEach((tab) => {
  tab.addEventListener("click", () => setMode(tab.dataset.mode));
});

Object.values(inputs).forEach((input) => {
  input.addEventListener("input", calculate);
});

Object.values(sliders).forEach((slider) => {
  slider.addEventListener("input", calculate);
});

industrySelect.addEventListener("change", () => {
  const elasticity = INDUSTRIES[industrySelect.value];
  if (elasticity !== undefined) {
    sliders.demandDrop.value = elasticity;
  }
  calculate();
});

addProductBtn.addEventListener("click", () => {
  addProduct({});
  calculate();
});

initProducts();
setMode(MODE.SINGLE);

window.getAppState = () => appState;
