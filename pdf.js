const TH =
  'style="padding:8px 10px;border:1px solid #e8e4dc;background:#0F4C3A;color:#fff;font-weight:600;text-align:left;font-size:12px;"';
const TD =
  'style="padding:8px 10px;border:1px solid #e8e4dc;font-size:12px;background:#fff;"';

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
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

function getRecommendation(metrics) {
  if (metrics.netProfit > 0 && metrics.netMargin > 30) {
    return "Бизнес здоровый. Можно рассмотреть подъём цены для увеличения прибыли.";
  }
  if (metrics.netProfit > 0) {
    return "Бизнес работает, но маржа уязвимая. Рекомендуется анализ структуры затрат.";
  }
  return "Бизнес убыточный. Подъём цены не решит проблему — нужен пересмотр модели и затрат.";
}

function buildInputTableRows(state) {
  const m = state.metrics;
  if (m.mode === "multi") {
    let rows = `<tr><th ${TH}>Название</th><th ${TH}>Цена</th><th ${TH}>Себестоимость</th><th ${TH}>Продажи/мес</th></tr>`;
    m.products.forEach((p) => {
      rows += `<tr>
        <td ${TD}>${escapeHtml(p.name)}</td>
        <td ${TD}>${formatNumber(p.price)} ₸</td>
        <td ${TD}>${formatNumber(p.cost)} ₸</td>
        <td ${TD}>${formatNumber(p.quantity)}</td>
      </tr>`;
    });
    rows += `<tr>
      <td ${TD} colspan="3"><strong>Постоянные затраты</strong></td>
      <td ${TD}>${formatNumber(m.fixedCosts)} ₸</td>
    </tr>`;
    return rows;
  }
  return `
    <tr><th ${TH}>Показатель</th><th ${TH}>Значение</th></tr>
    <tr><td ${TD}>Цена продажи</td><td ${TD}>${formatNumber(m.price)} ₸</td></tr>
    <tr><td ${TD}>Себестоимость</td><td ${TD}>${formatNumber(m.cost)} ₸</td></tr>
    <tr><td ${TD}>Продажи в месяц</td><td ${TD}>${formatNumber(m.quantity)} шт.</td></tr>
    <tr><td ${TD}>Постоянные затраты</td><td ${TD}>${formatNumber(m.fixedCosts)} ₸</td></tr>
  `;
}

function buildMetricsBlock(keyMetricLabel, keyMetricValue, m) {
  const metricStyle =
    'style="background:#fff;border-radius:8px;padding:14px 16px;border-left:4px solid #C9A961;margin-bottom:10px;"';
  const labelStyle =
    'style="font-size:11px;text-transform:uppercase;color:#6B6B6B;letter-spacing:0.04em;margin-bottom:4px;"';
  const valueStyle = 'style="font-size:22px;font-weight:bold;color:#0F4C3A;"';

  function metric(label, value) {
    return `<div ${metricStyle}><div ${labelStyle}>${label}</div><div ${valueStyle}>${value}</div></div>`;
  }

  return (
    metric("Чистая прибыль в месяц", formatNumber(m.netProfit) + " ₸") +
    metric("Чистая маржа", formatPercent(m.netMargin)) +
    metric(keyMetricLabel, keyMetricValue) +
    metric("Выручка в месяц", formatNumber(m.totalRevenue) + " ₸")
  );
}

function buildSimulatorBlock(state) {
  const sim = state.simulator;
  if (!sim) {
    return `<div style="font-size:13px;color:#6B6B6B;margin-bottom:20px;">Симулятор не активен</div>`;
  }

  const was = sim.was;
  const priceChangeText = document.getElementById("priceChangeValue").textContent;
  const demandDropText = document.getElementById("demandDropValue").textContent;

  let html = `<div style="font-size:12px;color:#6B6B6B;margin-bottom:12px;">Изменение цены: ${priceChangeText} · Падение спроса: ${demandDropText}</div>`;

  html += `<table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
    <tr><th ${TH}>Показатель</th><th ${TH}>Было</th></tr>
    <tr><td ${TD}>Выручка в месяц</td><td ${TD}>${formatNumber(was.revenue)} ₸</td></tr>
    <tr><td ${TD}>Чистая прибыль</td><td ${TD}>${formatNumber(was.netProfit)} ₸</td></tr>
    <tr><td ${TD}>Чистая маржа</td><td ${TD}>${formatPercent(was.netMargin)}</td></tr>
  </table>`;

  if (sim.showScenarios && sim.scenarios) {
    html += `<table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
      <tr><th ${TH}>Сценарий</th><th ${TH}>Чистая прибыль</th><th ${TH}>Δ прибыли</th><th ${TH}>Δ %</th></tr>`;

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
      const deltaP = document.querySelector(
        `[data-scenario="${key}"][data-metric="deltaPercent"]`
      );
      html += `<tr>
        <td ${TD}>${labels[key]}</td>
        <td ${TD}>${profitCell ? profitCell.textContent : "—"}</td>
        <td ${TD}>${deltaT ? deltaT.textContent : "—"}</td>
        <td ${TD}>${deltaP ? deltaP.textContent : "—"}</td>
      </tr>`;
    });
    html += "</table>";
  } else {
    const profitCell = document.querySelector('[data-simple="profit"]');
    const deltaT = document.querySelector('[data-simple="deltaTenge"]');
    const deltaP = document.querySelector('[data-simple="deltaPercent"]');
    html += `<table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
      <tr><th ${TH}>Сценарий</th><th ${TH}>Чистая прибыль</th><th ${TH}>Δ прибыли</th><th ${TH}>Δ %</th></tr>
      <tr>
        <td ${TD}>Стало</td>
        <td ${TD}>${profitCell ? profitCell.textContent : "—"}</td>
        <td ${TD}>${deltaT ? deltaT.textContent : "—"}</td>
        <td ${TD}>${deltaP ? deltaP.textContent : "—"}</td>
      </tr>
    </table>`;
  }

  if (state.conclusionText) {
    const bg = state.conclusionClass === "negative" ? "#fdecea" : "#e8f5ef";
    const color = state.conclusionClass === "negative" ? "#b83227" : "#0F4C3A";
    html += `<div style="background:${bg};color:${color};padding:12px 14px;border-radius:8px;font-weight:600;font-size:13px;margin-bottom:16px;">${escapeHtml(state.conclusionText)}</div>`;
  }

  return html;
}

function fillPDFContent(pdfDiv, businessName) {
  const state = window.getAppState();
  if (!state || !state.metrics) {
    console.error("fillPDFContent: нет данных getAppState()");
    return false;
  }

  const m = state.metrics;
  const dateStr = new Date().toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const keyMetricLabel =
    m.mode === "multi" ? "Средняя валовая маржа" : "Точка безубыточности";
  const keyMetricValue =
    m.mode === "multi"
      ? formatPercent(m.avgGrossMargin)
      : m.breakEven !== null
        ? formatNumber(Math.ceil(m.breakEven)) + " шт."
        : "—";

  const recommendation = getRecommendation(m);

  pdfDiv.innerHTML = `
    <div style="font-family:'Inter',Arial,sans-serif;padding:30px;background:#FAF8F3;color:#1A1A1A;width:800px;box-sizing:border-box;">

      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #0F4C3A;padding-bottom:15px;margin-bottom:25px;">
        <div>
          <div style="font-size:24px;font-weight:bold;color:#0F4C3A;">Aibek & Co</div>
          <div style="font-size:11px;color:#6B6B6B;">Pricing Consulting · Almaty</div>
        </div>
        <div style="font-size:12px;color:#6B6B6B;">${dateStr}</div>
      </div>

      <div style="font-size:20px;font-weight:bold;margin-bottom:5px;">Отчёт: ${escapeHtml(businessName)}</div>
      <div style="font-size:13px;color:#6B6B6B;margin-bottom:25px;">Анализ юнит-экономики и сценариев изменения цены</div>

      <div style="font-size:16px;font-weight:bold;color:#0F4C3A;margin-bottom:10px;">Исходные данные</div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        ${buildInputTableRows(state)}
      </table>

      <div style="font-size:16px;font-weight:bold;color:#0F4C3A;margin-bottom:10px;">Ключевые показатели</div>
      ${buildMetricsBlock(keyMetricLabel, keyMetricValue, m)}

      <div style="font-size:16px;font-weight:bold;color:#0F4C3A;margin-bottom:10px;margin-top:20px;">Сценарии изменения цены</div>
      ${buildSimulatorBlock(state)}

      <div style="background:#FFF;border-left:4px solid #C9A961;padding:15px;margin-top:20px;">
        <div style="font-size:14px;font-weight:bold;margin-bottom:5px;">Рекомендация</div>
        <div style="font-size:13px;color:#1A1A1A;">${escapeHtml(recommendation)}</div>
      </div>

      <div style="margin-top:40px;padding-top:15px;border-top:1px solid #C9A961;font-size:10px;color:#6B6B6B;text-align:center;">
        © Aibek & Co · Pricing Consulting · Almaty, Kazakhstan
      </div>

    </div>
  `;

  return true;
}

function hidePdfDiv(pdfDiv) {
  pdfDiv.style.display = "none";
  pdfDiv.style.position = "";
  pdfDiv.style.top = "";
  pdfDiv.style.left = "";
  pdfDiv.style.width = "";
  pdfDiv.style.background = "";
  pdfDiv.style.zIndex = "";
}

async function generatePDF() {
  console.log("Начинаю генерацию PDF");

  const businessName = prompt("Название бизнеса клиента:");
  if (!businessName) {
    console.log("Генерация отменена — не указано название бизнеса");
    return;
  }

  if (typeof html2pdf === "undefined") {
    alert("Библиотека html2pdf.js не загружена. Проверьте подключение к интернету.");
    return;
  }

  const pdfDiv = document.getElementById("pdfContent");
  const btn = document.getElementById("exportPdfBtn");

  const filled = fillPDFContent(pdfDiv, businessName);
  if (!filled) {
    alert("Не удалось получить данные калькулятора для отчёта.");
    return;
  }

  console.log("Div заполнен, длина:", pdfDiv.innerHTML.length);

  if (pdfDiv.innerHTML.length < 500) {
    console.warn(
      "fillPDFContent: innerHTML меньше 500 символов — возможно, контент не заполнен"
    );
    console.log("innerHTML:", pdfDiv.innerHTML);
  }

  btn.disabled = true;
  btn.textContent = "Генерация PDF…";

  pdfDiv.style.display = "block";
  pdfDiv.style.position = "fixed";
  pdfDiv.style.top = "0";
  pdfDiv.style.left = "0";
  pdfDiv.style.width = "800px";
  pdfDiv.style.background = "#FAF8F3";
  pdfDiv.style.zIndex = "99999";

  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  await new Promise((resolve) => setTimeout(resolve, 500));

  console.log("innerHTML перед html2pdf (первые 200 символов):", pdfDiv.innerHTML.substring(0, 200));
  console.log("Длина innerHTML перед html2pdf:", pdfDiv.innerHTML.length);
  console.log("Запускаю html2pdf");

  const opt = {
    margin: 10,
    filename: "Aibek_Co_" + businessName.replace(/\s/g, "_") + ".pdf",
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: true,
      backgroundColor: "#FAF8F3",
    },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  };

  try {
    await html2pdf().set(opt).from(pdfDiv).save();
    console.log("PDF сохранён успешно");
  } catch (error) {
    console.error("Ошибка генерации PDF:", error);
    alert("Ошибка при создании PDF. Подробности в консоли.");
  } finally {
    hidePdfDiv(pdfDiv);
    btn.disabled = false;
    btn.textContent = "Скачать отчёт PDF";
  }
}

document.getElementById("exportPdfBtn").addEventListener("click", generatePDF);
