document.addEventListener('DOMContentLoaded', () => {
  const data = surveyData;
  const total = data.length;

  // Utility: count occurrences
  function countBy(field) {
    const counts = {};
    data.forEach(d => {
      const val = (d[field] || '').toLowerCase().trim();
      if (val && val !== '' && val !== '-' && val !== 'n/a') {
        counts[val] = (counts[val] || 0) + 1;
      }
    });
    return counts;
  }

  function pct(count, t) {
    return ((count / t) * 100).toFixed(1);
  }

  // ─── KPI Cards ───
  const satisfechos = data.filter(d => d.p15 === 'muy_satisfecho').length;
  const satisfechoTotal = data.filter(d => d.p15 === 'muy_satisfecho' || d.p15 === 'satisfecho').length;
  const residentesSi = data.filter(d => d.p3 === 'si').length;
  const recomendaria = data.filter(d => d.p16 === 'si').length;
  const orgExcelente = data.filter(d => d.p4 === 'excelente').length;

  document.getElementById('kpi-total').textContent = total;
  document.getElementById('kpi-total-detail').textContent = `Abril 2026`;

  document.getElementById('kpi-satisfaccion').textContent = pct(satisfechos, total) + '%';
  document.getElementById('kpi-satisfaccion-detail').textContent = `${satisfechos} de ${total} muy satisfechos`;

  document.getElementById('kpi-residentes').textContent = pct(residentesSi, total) + '%';
  document.getElementById('kpi-residentes-detail').textContent = `${residentesSi} residen en Roldanillo`;

  document.getElementById('kpi-recomienda').textContent = pct(recomendaria, total) + '%';
  document.getElementById('kpi-recomienda-detail').textContent = `${recomendaria} de ${total} recomiendan`;

  document.getElementById('kpi-org').textContent = pct(orgExcelente, total) + '%';
  document.getElementById('kpi-org-detail').textContent = `${orgExcelente} califican excelente`;

  // ─── Color Palettes ───
  const palette1 = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
  const palette2 = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6'];
  const paletteGreen = ['#16a34a', '#2563eb', '#06b6d4'];
  const paletteSatisfaction = ['#16a34a', '#2563eb', '#f59e0b', '#ef4444'];

  // ─── Chart Defaults ───
  Chart.defaults.color = '#495057';
  Chart.defaults.font.family = "'Inter', 'Segoe UI', sans-serif";
  Chart.defaults.plugins.legend.labels.padding = 12;
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
  Chart.defaults.plugins.legend.labels.pointStyle = 'circle';

  // ─── 1. Medio de Convocatoria (Donut) ───
  const medioData = countBy('p1');
  const medioLabels = { web: 'Página web institucional', invitacion: 'Invitación directa', radio: 'Radio / medio masivo' };
  SharedUtils.createDoughnutChart(
    document.getElementById('chart-medio'),
    Object.keys(medioData).map(k => medioLabels[k] || k),
    Object.values(medioData),
    palette1,
    total
  );

  // ─── 2. Tipo de Participante (Donut) ───
  const tipoData = countBy('p2');
  const tipoLabels = { funcionario: 'Funcionario institución', usuario: 'Usuario del servicio', organizacion: 'Rep. organización social', otro: 'Otro', familiar: 'Familiar de usuario' };
  SharedUtils.createDoughnutChart(
    document.getElementById('chart-tipo'),
    Object.keys(tipoData).map(k => tipoLabels[k] || k),
    Object.values(tipoData),
    palette2,
    total
  );

  // ─── 3. Residencia en Roldanillo (Donut) ───
  const resData = countBy('p3');
  const resLabels = { si: 'Sí', no: 'No' };
  SharedUtils.createDoughnutChart(
    document.getElementById('chart-residencia'),
    Object.keys(resData).map(k => resLabels[k] || k),
    Object.values(resData),
    ['#16a34a', '#ef4444'],
    total
  );

  // ─── 4. Calificación Organización (Bar) ───
  const orgData = countBy('p4');
  const orgLabelsMap = { excelente: 'Excelente', buena: 'Buena', regular: 'Regular', deficiente: 'Deficiente' };
  const orgKeys = ['excelente', 'buena', 'regular', 'deficiente'].filter(k => orgData[k]);
  SharedUtils.createBarChart(
    document.getElementById('chart-organizacion'),
    orgKeys.map(k => orgLabelsMap[k]),
    orgKeys.map(k => orgData[k]),
    orgKeys.map((_, i) => palette1[i]),
    total
  );

  // ─── 5. Prestación de Servicios (Bar) ───
  const servData = countBy('p9');
  const servLabelsMap = { excelente: 'Excelente', buena: 'Buena', regular: 'Regular', deficiente: 'Deficiente' };
  const servKeys = ['excelente', 'buena', 'regular', 'deficiente'].filter(k => servData[k]);
  SharedUtils.createBarChart(
    document.getElementById('chart-servicios'),
    servKeys.map(k => servLabelsMap[k]),
    servKeys.map(k => servData[k]),
    servKeys.map((_, i) => paletteGreen[i] || palette1[i]),
    total
  );

  // ─── 6. Nivel de Satisfacción General (Bar) ───
  const satData = countBy('p15');
  const satLabelsMap = { muy_satisfecho: 'Muy satisfecho', satisfecho: 'Satisfecho', poco_satisfecho: 'Poco satisfecho', insatisfecho: 'Insatisfecho' };
  const satOrder = ['muy_satisfecho', 'satisfecho', 'poco_satisfecho', 'insatisfecho'].filter(k => satData[k]);
  SharedUtils.createBarChart(
    document.getElementById('chart-satisfaccion'),
    satOrder.map(k => satLabelsMap[k]),
    satOrder.map(k => satData[k]),
    paletteSatisfaction.slice(0, satOrder.length),
    total
  );

  // ─── 7. Binary Questions (Sí/No) ───
  const binaryQuestions = [
    { field: 'p5', label: 'P5. ¿Información clara y comprensible?' },
    { field: 'p6', label: 'P6. ¿Temas relevantes para la comunidad?' },
    { field: 'p7', label: 'P7. ¿Tiempo de audiencia adecuado?' },
    { field: 'p8', label: 'P8. ¿Gestión financiera suficiente y clara?' },
    { field: 'p10', label: 'P10. ¿Avances en calidad del servicio?' },
    { field: 'p11', label: 'P11. ¿Info. participación ciudadana adecuada?' },
    { field: 'p12', label: 'P12. ¿Espacios adecuados de participación?' },
    { field: 'p13', label: 'P13. ¿Inquietudes escuchadas y atendidas?' },
    { field: 'p14', label: 'P14. ¿Fortalece la transparencia institucional?' },
    { field: 'p16', label: 'P16. ¿Recomendaría participar en futuras rendiciones?' }
  ];

  const binaryGrid = document.getElementById('binary-grid');
  binaryQuestions.forEach(q => {
    const counts = countBy(q.field);
    const siCount = counts['si'] || 0;
    const totalValid = Object.values(counts).reduce((a, b) => a + b, 0);
    const percentage = totalValid > 0 ? ((siCount / totalValid) * 100).toFixed(1) : 0;

    const item = document.createElement('div');
    item.className = 'binary-item';
    item.innerHTML = `
      <span class="binary-label">${q.label}</span>
      <div class="binary-bar-wrapper">
        <span class="binary-percent">${percentage}%</span>
        <div class="binary-bar">
          <div class="binary-bar-fill" style="width: ${percentage}%"></div>
        </div>
      </div>
    `;
    binaryGrid.appendChild(item);
  });

  // ─── 8. Medio x Satisfacción (Stacked Bar) ───
  const medios = [...new Set(data.map(d => d.p1))];
  const satLevels = ['muy_satisfecho', 'satisfecho', 'poco_satisfecho', 'insatisfecho'].filter(l => data.some(d => d.p15 === l));
  const satColors = { muy_satisfecho: '#16a34a', satisfecho: '#2563eb', poco_satisfecho: '#f59e0b', insatisfecho: '#ef4444' };
  const satNames = { muy_satisfecho: 'Muy satisfecho', satisfecho: 'Satisfecho', poco_satisfecho: 'Poco satisfecho', insatisfecho: 'Insatisfecho' };

  const medioSatDatasets = satLevels.map(level => ({
    label: satNames[level],
    data: medios.map(m => data.filter(d => d.p1 === m && d.p15 === level).length),
    backgroundColor: satColors[level],
    borderRadius: 4,
    borderSkipped: false
  }));

  const medioLabelsFull = { web: 'Página web', invitacion: 'Invitación directa', radio: 'Radio' };
  new Chart(document.getElementById('chart-medio-satisfaccion'), {
    type: 'bar',
    data: {
      labels: medios.map(m => medioLabelsFull[m] || m),
      datasets: medioSatDatasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 11 } } },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${ctx.raw}`
          }
        }
      },
      scales: {
        x: { stacked: true, grid: { display: false } },
        y: { stacked: true, beginAtZero: true, grid: { color: 'rgba(0,0,0,0.06)' } }
      }
    }
  });

  // ─── 9. Participante x Satisfacción (Stacked Bar) ───
  const tipos = [...new Set(data.map(d => d.p2))];
  const tipoSatDatasets = satLevels.map(level => ({
    label: satNames[level],
    data: tipos.map(t => data.filter(d => d.p2 === t && d.p15 === level).length),
    backgroundColor: satColors[level],
    borderRadius: 4,
    borderSkipped: false
  }));

  const tipoLabelsFull = { funcionario: 'Funcionario', usuario: 'Usuario', organizacion: 'Organización', otro: 'Otro', familiar: 'Familiar' };
  new Chart(document.getElementById('chart-tipo-satisfaccion'), {
    type: 'bar',
    data: {
      labels: tipos.map(t => tipoLabelsFull[t] || t),
      datasets: tipoSatDatasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 11 } } },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${ctx.raw}`
          }
        }
      },
      scales: {
        x: { stacked: true, grid: { display: false } },
        y: { stacked: true, beginAtZero: true, grid: { color: 'rgba(0,0,0,0.06)' } }
      }
    }
  });

  // ─── 10. Open Responses Table + Mobile Cards ───
  const tbody = document.getElementById('responses-body');
  const mobileContainer = document.getElementById('responses-mobile');
  const isValid = (text) => text && text !== '-' && text !== 'N/A' && text.toLowerCase() !== 'prueba' && text.toLowerCase() !== 'ninguno' && text.toLowerCase() !== 'ninguna' && text.toLowerCase() !== 'ninguna en el momento';

  data.forEach(d => {
    const p17 = (d.p17 || '').trim();
    const p18 = (d.p18 || '').trim();
    const p19 = (d.p19 || '').trim();

    if ((p17 || p18 || p19) && (isValid(p17) || isValid(p18) || isValid(p19))) {
      // Desktop table row
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${d.fecha}</td>
        <td>${p17 || '—'}</td>
        <td>${p18 || '—'}</td>
        <td>${p19 || '—'}</td>
      `;
      tbody.appendChild(row);

      // Mobile card
      const card = document.createElement('div');
      card.className = 'response-card';
      let cardHTML = `<div class="response-card-date">${d.fecha}</div>`;
      if (isValid(p17)) {
        cardHTML += `<div class="response-card-field">
          <div class="response-card-label">Aspectos positivos</div>
          <div class="response-card-text">${p17}</div>
        </div>`;
      }
      if (isValid(p18)) {
        cardHTML += `<div class="response-card-field">
          <div class="response-card-label">Aspectos a mejorar</div>
          <div class="response-card-text">${p18}</div>
        </div>`;
      }
      if (isValid(p19)) {
        cardHTML += `<div class="response-card-field">
          <div class="response-card-label">Temas a profundizar</div>
          <div class="response-card-text">${p19}</div>
        </div>`;
      }
      card.innerHTML = cardHTML;
      mobileContainer.appendChild(card);
    }
  });
});
