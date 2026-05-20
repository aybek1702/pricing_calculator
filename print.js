function printFormatNumber(value, decimals = 0) {
  return value.toLocaleString("ru-RU", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function printFormatPercent(value) {
  return printFormatNumber(value, 1) + " %";
}

function getPrintRecommendation(metrics) {
  if (metrics.netProfit > 0 && metrics.netMargin > 30) {
    return "Бизнес здоровый. Можно рассмотреть подъём цены для увеличения прибыли.";
  }
  if (metrics.netProfit > 0) {
    return "Бизнес работает, но маржа уязвимая. Рекомендуется анализ структуры затрат.";
  }
  return "Бизнес убыточный. Подъём цены не решит проблему — нужен пересмотр модели и затрат.";
}

function buildPrintInputRows(state) {
  const m = state.metrics;
  if (m.mode === "multi") {
    let html = `<tr><th>Название</th><th>Цена</th><th>Себестоимость</th><th class="value">Продажи/мес</th></tr>`;
    m.products.forEach((p) => {
      html += `<tr>
        <td>${p.name}</td>
        <td class="value">${printFormatNumber(p.price)} ₸</td>
        <td class="value">${printFormatNumber(p.cost)} ₸</td>
        <td class="value">${printFormatNumber(p.quantity)}</td>
      </tr>`;
    });
    html += `<tr><td colspan="3">Постоянные затраты в месяц</td><td class="value">${printFormatNumber(m.fixedCosts)} ₸</td></tr>`;
    return html;
  }
  return `
    <tr><td>Цена за единицу</td><td class="value">${printFormatNumber(m.price)} ₸</td></tr>
    <tr><td>Себестоимость</td><td class="value">${printFormatNumber(m.cost)} ₸</td></tr>
    <tr><td>Постоянные затраты в месяц</td><td class="value">${printFormatNumber(m.fixedCosts)} ₸</td></tr>
    <tr><td>Планируемое количество продаж</td><td class="value">${printFormatNumber(m.quantity)} шт.</td></tr>
  `;
}

function buildPrintKeyMetrics(state) {
  const m = state.metrics;
  const keyLabel =
    m.mode === "multi" ? "Средняя валовая маржа" : "Точка безубыточности";
  const keyValue =
    m.mode === "multi"
      ? printFormatPercent(m.avgGrossMargin)
      : m.breakEven !== null
        ? printFormatNumber(Math.ceil(m.breakEven)) + " шт."
        : "—";

  const contribution =
    m.mode === "multi" ? m.totalContribution : m.contributionMargin;

  return `
    <div class="metric-card">
      <div class="metric-label">Чистая прибыль в месяц</div>
      <div class="metric-value">${printFormatNumber(m.netProfit)} ₸</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Чистая маржа</div>
      <div class="metric-value">${printFormatPercent(m.netMargin)}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">${keyLabel}</div>
      <div class="metric-value">${keyValue}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Контрибуционная маржа</div>
      <div class="metric-value">${printFormatNumber(contribution)} ₸</div>
    </div>
  `;
}

function buildPrintScenariosTable(state) {
  const sim = state.simulator;
  if (!sim) return "";

  const was = sim.was;
  let html = `
    <tr><th>Показатель</th><th class="value">Было</th></tr>
    <tr><td>Выручка в месяц</td><td class="value">${printFormatNumber(was.revenue)} ₸</td></tr>
    <tr><td>Чистая прибыль</td><td class="value">${printFormatNumber(was.netProfit)} ₸</td></tr>
    <tr><td>Чистая маржа</td><td class="value">${printFormatPercent(was.netMargin)}</td></tr>
  `;

  if (sim.showScenarios && sim.scenarios) {
    html += `<tr><th colspan="2" style="padding-top:12px;">Сценарии</th></tr>`;
    html += `<tr><th>Сценарий</th><th class="value">Чистая прибыль · Δ</th></tr>`;

    const labels = {
      pessimistic: "Пессимистичный",
      realistic: "Реалистичный",
      optimistic: "Оптимистичный",
    };

    ["pessimistic", "realistic", "optimistic"].forEach((key) => {
      const profitCell = document.querySelector(
        `[data-scenario="${key}"][data-metric="profit"]`
      );
      const deltaT = document.querySelector(
        `[data-scenario="${key}"][data-metric="deltaTenge"]`
      );
      html += `<tr>
        <td>${labels[key]}</td>
        <td class="value">${profitCell ? profitCell.textContent : "—"} · ${deltaT ? deltaT.textContent : "—"}</td>
      </tr>`;
    });
  } else {
    const profitCell = document.querySelector('[data-simple="profit"]');
    const deltaT = document.querySelector('[data-simple="deltaTenge"]');
    html += `<tr><th>Сценарий</th><th class="value">Значение</th></tr>
    <tr><td>Стало</td><td class="value">${profitCell ? profitCell.textContent : "—"} · ${deltaT ? deltaT.textContent : "—"}</td></tr>`;
  }

  return html;
}

function preparePrintReport(businessName) {
  const state = window.getAppState();
  if (!state || !state.metrics) return false;

  document.getElementById("businessName").textContent = businessName;
  document.getElementById("reportDate").textContent = new Date().toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  document.getElementById("printInputData").innerHTML = buildPrintInputRows(state);
  document.getElementById("printKeyMetrics").innerHTML = buildPrintKeyMetrics(state);
  document.getElementById("printRecommendation").textContent = getPrintRecommendation(
    state.metrics
  );

  const sim = state.simulator;
  const scenariosSection = document.getElementById("printScenarios");
  const conclusionEl = document.getElementById("printConclusion");

  if (sim && sim.priceChange !== 0) {
    scenariosSection.style.display = "block";
    document.getElementById("printSimNote").textContent =
      "Изменение цены: " +
      document.getElementById("priceChangeValue").textContent +
      " · Падение спроса: " +
      document.getElementById("demandDropValue").textContent;
    document.getElementById("printScenariosTable").innerHTML = buildPrintScenariosTable(state);

    if (state.conclusionText) {
      conclusionEl.textContent = state.conclusionText;
      conclusionEl.classList.remove("hidden", "negative");
      if (state.conclusionClass === "negative") {
        conclusionEl.classList.add("negative");
      }
    } else {
      conclusionEl.classList.add("hidden");
      conclusionEl.textContent = "";
    }
  } else {
    scenariosSection.style.display = "none";
  }

  return true;
}

function exportReportPdf() {
  const businessName = prompt("Название бизнеса клиента:");
  if (!businessName) return;

  if (!preparePrintReport(businessName)) {
    alert("Не удалось подготовить отчёт. Проверьте данные калькулятора.");
    return;
  }

  window.print();
}

document.getElementById("exportPdfBtn").addEventListener("click", exportReportPdf);
