// js/estadisticas.js — Página de estadísticas del sitio web.
// Los datos vienen de Google Analytics 4 a través de Apps Script (apps-script/estadisticas.gs, caché de 1 hora).
// "Visitantes" = usuarios distintos (totalUsers); "vistas" = páginas abiertas (screenPageViews).

(function () {
  'use strict';

  const URL_DATOS = 'https://script.google.com/macros/s/AKfycbxK2Bgu71NZzvbPVX2kg7mOUvthLBV3trEh54sXtjdw7sSN2kcCmhsOTTXqJCIzFY_MVw/exec';
  const COLOR_DATO = '#069681';
  const COLOR_DATO_SUAVE = '#cdebe5';
  const COLOR_REJILLA = '#eef2f1';
  const COLOR_TEXTO_EJE = '#5c6b6a';

  const $ = (id) => document.getElementById(id);
  const esc = (v) => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const num = (v) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? Math.round(n) : 0; };
  const fmt = (n) => num(n).toLocaleString('es-CO');
  const pct = (parte, total) => total > 0 ? Math.round((parte / total) * 100) : 0;
  // Porcentaje para mostrar: "<1 %" cuando hay datos pero no alcanzan al 1 %
  const pctTexto = (parte, total) => (parte > 0 && pct(parte, total) === 0 ? '&lt;1' : pct(parte, total)) + ' %';
  const graficos = {};

  // ---------------------------------------------------------------- fechas
  function aFecha(texto) {
    const t = String(texto || '').replace(/-/g, '');
    if (!/^\d{8}$/.test(t)) return null;
    return new Date(Number(t.slice(0, 4)), Number(t.slice(4, 6)) - 1, Number(t.slice(6, 8)));
  }
  const mismoDia = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const diaCorto = (d) => d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  const diaLargo = (d) => d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
  const mayuscula = (t) => t.charAt(0).toUpperCase() + t.slice(1);

  // ---------------------------------------------------------------- nombres legibles
  const NOMBRES_PAGINA = {
    '/': 'Inicio', '/noticias': 'Noticias', '/laboratorio': 'Laboratorio', '/buscar': 'Buscador del sitio',
    '/login-institucional': 'Acceso al Portal Institucional', '/portal-institucional': 'Portal Institucional',
    '/pqrs': 'PQRSD', '/citas-medicas-online': 'Citas médicas en línea', '/citasmedicas': 'Citas médicas',
    '/transparencia-acceso-informacion-publica': 'Transparencia', '/urgencias': 'Urgencias',
    '/consulta-externa': 'Consulta externa', '/hospitalizacion': 'Hospitalización', '/participa': 'Participa',
    '/Normatividad': 'Normatividad', '/directorio-institucional': 'Directorio institucional', '/estadisticas': 'Estadísticas'
  };
  const SUFIJO_HOSPITAL = /\s*[-|–]\s*Hospital Departamental San Antonio.*$/i;

  function rutaLimpia(ruta) {
    let r = String(ruta || '/').split(/[?#]/)[0].replace(/\/index(\.html)?$/, '/').replace(/\.html$/, '');
    if (r.length > 1) r = r.replace(/\/$/, '');
    return r || '/';
  }
  function nombrePagina(p) {
    const ruta = rutaLimpia(p.path);
    if (NOMBRES_PAGINA[ruta]) return NOMBRES_PAGINA[ruta];
    const titulo = String(p.title || '').replace(SUFIJO_HOSPITAL, '').trim();
    if (titulo && !/^Hospital Departamental San Antonio$/i.test(titulo) && titulo !== '(not set)') return titulo;
    const ultimo = ruta.split('/').filter(Boolean).pop() || 'Inicio';
    return mayuscula(decodeURIComponent(ultimo).replace(/[-_]/g, ' '));
  }

  const DISPOSITIVOS = {
    mobile: { nombre: 'Celular', icono: 'bi-phone' },
    desktop: { nombre: 'Computador', icono: 'bi-laptop' },
    tablet: { nombre: 'Tableta', icono: 'bi-tablet' },
    'smart tv': { nombre: 'Televisor', icono: 'bi-tv' }
  };
  const NAVEGADORES = {
    'Safari (in-app)': 'Dentro de apps (iPhone)',
    'Android Webview': 'Dentro de apps (Android)',
    'Samsung Internet': 'Samsung Internet'
  };

  // ---------------------------------------------------------------- datos
  async function traerDatos() {
    let ultimoError;
    for (let intento = 1; intento <= 3; intento++) {
      const control = new AbortController();
      const espera = setTimeout(() => control.abort(), 15000);
      try {
        const resp = await fetch(URL_DATOS, { headers: { Accept: 'application/json' }, credentials: 'omit', signal: control.signal });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const datos = await resp.json();
        if (datos && datos.error) throw new Error(datos.error);
        return datos && datos.data ? datos.data : datos;
      } catch (err) {
        ultimoError = err;
        if (intento < 3) await new Promise(r => setTimeout(r, 1200 * intento));
      } finally {
        clearTimeout(espera);
      }
    }
    throw ultimoError;
  }

  function preparar(d) {
    const hoy = new Date();
    const dias = (Array.isArray(d.dailyVisits) ? d.dailyVisits : [])
      .map(x => ({ fecha: aFecha(x.date), valor: num(x.visits) }))
      .filter(x => x.fecha)
      .sort((a, b) => a.fecha - b.fecha);
    const completos = dias.filter(x => !mismoDia(x.fecha, hoy));   // hoy aún está en curso

    const meses = (Array.isArray(d.monthlyTrend) ? d.monthlyTrend : [])
      .map(x => { const [a, m] = String(x.date || '').split('-').map(Number); return { anio: a, mes: m, valor: num(x.visits) }; })
      .filter(x => x.anio && x.mes)
      .sort((a, b) => (a.anio - b.anio) || (a.mes - b.mes));

    const dispositivos = Object.entries(d.devices || {}).map(([k, v]) => ({ clave: String(k).toLowerCase(), valor: num(v) })).filter(x => x.valor).sort((a, b) => b.valor - a.valor);
    const totalDisp = dispositivos.reduce((s, x) => s + x.valor, 0);
    const navegadores = Object.entries(d.browsers || {}).map(([k, v]) => ({ nombre: String(k), valor: num(v) })).filter(x => x.valor).sort((a, b) => b.valor - a.valor);
    const paginas = (Array.isArray(d.topPages) ? d.topPages : [])
      .map(p => ({ ruta: rutaLimpia(p.path), nombre: nombrePagina(p), valor: num(p.views || p.visits) }))
      .filter(p => p.valor);
    // Unir páginas que quedan con el mismo nombre (p. ej. /noticias y /noticias.html)
    const unidas = [];
    paginas.forEach(p => { const e = unidas.find(u => u.nombre === p.nombre); if (e) e.valor += p.valor; else unidas.push(p); });
    unidas.sort((a, b) => b.valor - a.valor);

    const [anioDesde, mesDesde] = String(d.since || '').split('-').map(Number);
    const desde = anioDesde && mesDesde ? new Date(anioDesde, mesDesde - 1, 1) : null;

    return { total: num(d.totalVisits), desde, mes: num(d.monthlyVisits), completos, meses, dispositivos, totalDisp, navegadores, paginas: unidas.slice(0, 6), actualizado: d.lastUpdate };
  }

  // ---------------------------------------------------------------- indicadores
  function pintarIndicadores(x) {
    const hoy = new Date();
    $('kpi-total').textContent = fmt(x.total);
    if (x.desde) {
      $('kpi-total-nombre').textContent = 'Visitantes desde ' + x.desde.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
      $('kpi-total-nota').textContent = 'Personas distintas desde que se mide el sitio';
    }
    $('kpi-mes').textContent = fmt(x.mes);
    const nombreMes = hoy.toLocaleDateString('es-CO', { month: 'long' });
    $('kpi-mes-nota').textContent = hoy.getDate() === 1 ? `Hoy, 1 de ${nombreMes}` : `Del 1 al ${hoy.getDate()} de ${nombreMes}`;

    if (x.completos.length) {
      const promedio = x.completos.reduce((s, d) => s + d.valor, 0) / x.completos.length;
      const maximo = x.completos.reduce((m, d) => d.valor > m.valor ? d : m, x.completos[0]);
      $('kpi-promedio').textContent = fmt(promedio);
      $('kpi-promedio-nota').textContent = `Día con más: ${fmt(maximo.valor)} (${diaCorto(maximo.fecha)})`;
    }
    const celular = x.dispositivos.find(d => d.clave === 'mobile');
    $('kpi-celular').textContent = x.totalDisp ? pct(celular ? celular.valor : 0, x.totalDisp) + ' %' : '—';
  }

  // ---------------------------------------------------------------- barras HTML
  function barras(lista, filas, vacio) {
    if (!filas.length) { lista.innerHTML = `<li class="est-vacio">${esc(vacio)}</li>`; return; }
    const max = Math.max(...filas.map(f => f.valor));
    lista.innerHTML = filas.map(f => `
      <li>
        <span class="est-barra-nombre" title="${esc(f.nombre)}">${f.icono ? `<i class="bi ${esc(f.icono)}" aria-hidden="true"></i>` : ''}${f.enlace ? `<a href="${esc(f.enlace)}">${esc(f.nombre)}</a>` : esc(f.nombre)}</span>
        <span class="est-barra-valor">${f.texto}</span>
        <span class="est-barra-pista" aria-hidden="true"><span class="est-barra-relleno" data-ancho="${Math.max(2, (f.valor / max) * 100).toFixed(1)}"></span></span>
      </li>`).join('');
    lista.querySelectorAll('.est-barra-relleno[data-ancho]').forEach(b => { b.style.width = b.dataset.ancho + '%'; });
  }

  function pintarListas(x) {
    barras($('lista-paginas'), x.paginas.map(p => ({
      nombre: p.nombre, valor: p.valor, enlace: /^\/[^/]/.test(p.ruta) || p.ruta === '/' ? p.ruta : '',
      texto: `<strong>${fmt(p.valor)}</strong> vistas`
    })), 'Todavía no hay datos de páginas.');

    barras($('lista-dispositivos'), x.dispositivos.map(d => {
      const info = DISPOSITIVOS[d.clave] || { nombre: mayuscula(d.clave), icono: 'bi-display' };
      return { nombre: info.nombre, icono: info.icono, valor: d.valor, texto: `<strong>${pctTexto(d.valor, x.totalDisp)}</strong> · ${fmt(d.valor)}` };
    }), 'Todavía no hay datos de dispositivos.');

    const filasNav = x.navegadores.map(n => ({ nombre: NAVEGADORES[n.nombre] || n.nombre, valor: n.valor }));
    const otros = x.totalDisp - x.navegadores.reduce((s, n) => s + n.valor, 0);
    if (x.navegadores.length && otros > 0) filasNav.push({ nombre: 'Otros', valor: otros });
    const baseNav = Math.max(x.totalDisp, filasNav.reduce((s, n) => s + n.valor, 0));
    barras($('lista-navegadores'), filasNav.map(n => ({ ...n, texto: `<strong>${pctTexto(n.valor, baseNav)}</strong>` })), 'Todavía no hay datos de navegadores.');
    // Aclaración para los navegadores dentro de apps
    if (x.navegadores.some(n => /in-app|Webview/i.test(n.nombre)) && !$('nota-apps')) {
      $('lista-navegadores').insertAdjacentHTML('afterend', '<p class="est-tarjeta-sub mt-3 mb-0" id="nota-apps">"Dentro de apps": cuando abren el enlace desde Facebook, Instagram, WhatsApp u otra aplicación.</p>');
    }
  }

  // ---------------------------------------------------------------- gráficos (Chart.js)
  // Línea vertical que sigue al cursor en el gráfico diario
  const lineaGuia = {
    id: 'lineaGuia',
    afterDatasetsDraw(chart) {
      const activo = chart.tooltip && chart.tooltip.getActiveElements()[0];
      if (!activo) return;
      const { ctx, chartArea } = chart;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(activo.element.x, chartArea.top);
      ctx.lineTo(activo.element.x, chartArea.bottom);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(31, 45, 45, .25)';
      ctx.stroke();
      ctx.restore();
    }
  };

  function opcionesBase() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? false : { duration: 500 },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1f2d2d', padding: 10, cornerRadius: 8, displayColors: false,
          titleFont: { family: 'Poppins', weight: '600' }, bodyFont: { family: 'Poppins' }
        }
      },
      scales: {
        x: { grid: { display: false }, border: { color: COLOR_REJILLA }, ticks: { color: COLOR_TEXTO_EJE, font: { family: 'Poppins', size: 11 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 } },
        y: { beginAtZero: true, grid: { color: COLOR_REJILLA }, border: { display: false }, ticks: { color: COLOR_TEXTO_EJE, font: { family: 'Poppins', size: 11 }, maxTicksLimit: 5, callback: (v) => Number(v).toLocaleString('es-CO') } }
      }
    };
  }

  function pintarDiario(x) {
    const filas = x.completos;
    $('tabla-diario').innerHTML = filas.map(d => `<tr><td>${esc(mayuscula(diaLargo(d.fecha)))}</td><td class="text-end">${fmt(d.valor)}</td></tr>`).join('');
    if (!filas.length || !window.Chart) return;
    const opciones = opcionesBase();
    if (window.innerWidth < 576) opciones.scales.x.ticks.maxTicksLimit = 4;
    opciones.plugins.tooltip.callbacks = {
      title: (items) => mayuscula(diaLargo(filas[items[0].dataIndex].fecha)),
      label: (item) => `${fmt(item.raw)} visitantes`
    };
    graficos.diario?.destroy();
    graficos.diario = new Chart($('grafico-diario'), {
      type: 'line',
      data: {
        labels: filas.map(d => diaCorto(d.fecha)),
        datasets: [{
          data: filas.map(d => d.valor),
          borderColor: COLOR_DATO, borderWidth: 2, tension: 0.3, fill: true,
          backgroundColor: (c) => {
            const { ctx, chartArea } = c.chart;
            if (!chartArea) return 'rgba(6,150,129,.08)';
            const g = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            g.addColorStop(0, 'rgba(6,150,129,.18)'); g.addColorStop(1, 'rgba(6,150,129,0)');
            return g;
          },
          pointRadius: 0, pointHoverRadius: 5, pointHoverBackgroundColor: COLOR_DATO, pointHoverBorderColor: '#fff', pointHoverBorderWidth: 2, pointHitRadius: 12
        }]
      },
      options: opciones,
      plugins: [lineaGuia]
    });
    const total = filas.reduce((s, d) => s + d.valor, 0);
    $('grafico-diario').setAttribute('aria-label', `Visitantes por día del ${diaCorto(filas[0].fecha)} al ${diaCorto(filas[filas.length - 1].fecha)}: ${fmt(total)} en total. Los datos están en la tabla de abajo.`);
  }

  function pintarMensual(x) {
    const hoy = new Date();
    const filas = x.meses.map(m => {
      const enCurso = m.anio === hoy.getFullYear() && m.mes === hoy.getMonth() + 1;
      const nombre = new Date(m.anio, m.mes - 1, 1).toLocaleDateString('es-CO', { month: 'short', year: 'numeric' }).replace('.', '');
      return { ...m, enCurso, nombre: mayuscula(nombre), largo: mayuscula(new Date(m.anio, m.mes - 1, 1).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })) };
    });
    $('tabla-mensual').innerHTML = filas.map(m => `<tr><td>${esc(m.largo)}${m.enCurso ? ' (en curso)' : ''}</td><td class="text-end">${fmt(m.valor)}</td></tr>`).join('');
    if (filas.some(m => m.enCurso)) $('sub-mensual').textContent = 'Últimos meses. El mes actual va en curso (barra más clara).';
    if (!filas.length || !window.Chart) return;
    const opciones = opcionesBase();
    opciones.interaction = { mode: 'nearest', intersect: true };
    opciones.plugins.tooltip.callbacks = {
      title: (items) => filas[items[0].dataIndex].largo + (filas[items[0].dataIndex].enCurso ? ' (en curso)' : ''),
      label: (item) => `${fmt(item.raw)} visitantes`
    };
    opciones.scales.x.ticks.maxTicksLimit = 12;
    graficos.mensual?.destroy();
    graficos.mensual = new Chart($('grafico-mensual'), {
      type: 'bar',
      data: {
        labels: filas.map(m => m.enCurso ? [m.nombre, '(en curso)'] : m.nombre),
        datasets: [{
          data: filas.map(m => m.valor),
          backgroundColor: filas.map(m => m.enCurso ? COLOR_DATO_SUAVE : COLOR_DATO),
          hoverBackgroundColor: filas.map(m => m.enCurso ? '#b5e0d8' : '#047a67'),
          borderColor: filas.map(m => m.enCurso ? COLOR_DATO : 'transparent'),
          borderWidth: filas.map(m => m.enCurso ? { top: 2, left: 2, right: 2, bottom: 0 } : 0),
          borderRadius: 4, borderSkipped: 'start', maxBarThickness: 56, categoryPercentage: 0.8, barPercentage: 0.9
        }]
      },
      options: opciones
    });
    $('grafico-mensual').setAttribute('aria-label', 'Visitantes por mes: ' + filas.map(m => `${m.largo}${m.enCurso ? ' (en curso)' : ''}, ${fmt(m.valor)}`).join('; ') + '.');
  }

  // ---------------------------------------------------------------- inicio
  async function cargar() {
    const estado = $('estado');
    $('est-error').classList.add('d-none');
    estado.innerHTML = '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Cargando datos de Google Analytics…';
    try {
      const x = preparar(await traerDatos());
      pintarIndicadores(x);
      pintarListas(x);
      pintarDiario(x);
      pintarMensual(x);
      const f = x.actualizado ? new Date(x.actualizado) : new Date();
      const cuando = isNaN(f) ? new Date() : f;
      estado.innerHTML = `<i class="bi bi-arrow-repeat me-2" aria-hidden="true"></i>Datos consultados el ${esc(cuando.toLocaleString('es-CO', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' }))}`;
    } catch (err) {
      console.error('Estadísticas: no se pudieron cargar los datos', err);
      estado.textContent = 'No disponible en este momento.';
      $('est-error').classList.remove('d-none');
      ['lista-paginas', 'lista-dispositivos', 'lista-navegadores'].forEach(id => { $(id).innerHTML = '<li class="est-vacio">Sin datos.</li>'; });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    $('btn-reintentar').addEventListener('click', cargar);
    cargar();
  });
})();
