// shared-utils.js - Utilidades compartidas reutilizables en todo el sitio
(function () {
  'use strict';

  // --- Text Normalization (search) ---
  function normalizeText(s) {
    return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  // --- RegExp Escaping ---
  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // --- DOM Visibility Helpers ---
  function showElement(el) {
    if (el) el.classList.remove('d-none');
  }

  function hideElement(el) {
    if (el) el.classList.add('d-none');
  }

  // --- Search Highlighting ---

  function clearHighlights(root) {
    if (!root) return;
    root.querySelectorAll('mark.search-hit').forEach(function (mark) {
      var parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent), mark);
        parent.normalize();
      }
    });
  }

  function highlightInElement(el, rawTerm) {
    if (!el || !rawTerm) return;
    var term = rawTerm.trim();
    if (!term) return;
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    var texts = [];
    var node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue && normalizeText(node.nodeValue).includes(normalizeText(term))) {
        texts.push(node);
      }
    }
    var re = new RegExp(escapeRegExp(term), 'gi');
    texts.forEach(function (textNode) {
      var parent = textNode.parentNode;
      if (parent) {
        var span = document.createElement('span');
        span.innerHTML = textNode.nodeValue.replace(re, function (m) {
          return '<mark class="search-hit">' + m + '</mark>';
        });
        parent.replaceChild(span, textNode);
      }
    });
  }

  // --- Button Loading Spinner ---

  function setButtonLoading(btn, loadingText) {
    if (!btn) return '';
    var original = btn.innerHTML;
    btn.dataset.originalContent = original;
    btn.innerHTML =
      '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> ' +
      (loadingText || 'Enviando...');
    btn.disabled = true;
    return original;
  }

  function restoreButton(btn, fallbackContent) {
    if (!btn) return;
    btn.innerHTML = btn.dataset.originalContent || fallbackContent || btn.innerHTML;
    btn.disabled = false;
    delete btn.dataset.originalContent;
  }

  // --- Date Formatting ---

  function formatDateES(date, options) {
    var d = date instanceof Date ? date : new Date(date);
    var defaults = { year: 'numeric', month: 'long', day: 'numeric' };
    return d.toLocaleDateString('es-CO', Object.assign(defaults, options));
  }

  // --- Chart Factories (for Chart.js) ---

  var chartBaseGrid = { color: 'rgba(0,0,0,0.06)' };

  function createDoughnutChart(ctx, labels, data, colors, total) {
    return new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderWidth: 0,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 11 } } },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                return ctx.label + ': ' + ctx.raw + ' (' + ((ctx.raw / total) * 100).toFixed(1) + '%)';
              }
            }
          }
        }
      }
    });
  }

  function createBarChart(ctx, labels, data, colors, total, opts) {
    var extra = opts || {};
    return new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: extra.datasetLabel || 'Respuestas',
          data: data,
          backgroundColor: colors,
          borderRadius: extra.borderRadius !== undefined ? extra.borderRadius : 6,
          borderSkipped: false,
          barPercentage: extra.barPercentage || 0.6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                return ctx.raw + ' respuestas (' + ((ctx.raw / total) * 100).toFixed(1) + '%)';
              }
            }
          }
        },
        scales: {
          y: { beginAtZero: true, grid: chartBaseGrid, ticks: { stepSize: extra.stepSize || 5 } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  // --- Expose globally ---
  window.SharedUtils = {
    normalizeText: normalizeText,
    escapeRegExp: escapeRegExp,
    showElement: showElement,
    hideElement: hideElement,
    clearHighlights: clearHighlights,
    highlightInElement: highlightInElement,
    setButtonLoading: setButtonLoading,
    restoreButton: restoreButton,
    formatDateES: formatDateES,
    createDoughnutChart: createDoughnutChart,
    createBarChart: createBarChart
  };
})();
