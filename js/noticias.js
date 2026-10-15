// js/noticias.js - Muestra las noticias a partir de data/noticias.json
//
// - Inicio (index.html): las marcadas con "inicio": true, de la más reciente a la más antigua
//   (máximo data-limite). Las demás solo aparecen en noticias.html.
// - noticias.html: noticia destacada, todas las demás con filtros por categoría y paginación.
//
// Para publicar una noticia basta con agregarla en data/noticias.json (ver data/LEEME-noticias.md).

(function () {
  const URL_DATOS = '/data/noticias.json';
  const POR_PAGINA = 9;

  const CATEGORIAS = {
    convocatoria: { texto: 'Convocatoria', clase: 'bg-warning text-dark', icono: 'bi-megaphone-fill' },
    evento: { texto: 'Evento', clase: 'bg-primary', icono: 'bi-calendar-event' },
    comunicado: { texto: 'Comunicado', clase: 'bg-info text-dark', icono: 'bi-info-circle' },
    video: { texto: 'Video', clase: 'bg-danger', icono: 'bi-play-btn-fill' }
  };

  let noticiasPorId = {};

  function esc(texto) {
    return String(texto ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function formatearFecha(iso) {
    const [a, m, d] = String(iso).split('-').map(Number);
    if (!a || !m || !d) return '';
    return new Date(a, m - 1, d).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function esExterno(url) {
    return /^https?:\/\//i.test(url) || /\.pdf$/i.test(url);
  }

  async function cargarNoticias() {
    const res = await fetch(URL_DATOS, { cache: 'no-cache' });
    if (!res.ok) throw new Error('No se pudo cargar ' + URL_DATOS);
    const lista = await res.json();
    lista.sort((x, y) => String(y.fecha).localeCompare(String(x.fecha)));
    noticiasPorId = {};
    lista.forEach(n => { noticiasPorId[n.id] = n; });
    return lista;
  }

  // ---------- Plantillas ----------

  function badge(n, claro) {
    const cat = CATEGORIAS[n.categoria] || CATEGORIAS.comunicado;
    const clase = claro ? 'bg-light text-dark' : cat.clase;
    return `<span class="badge ${clase} news-tag">${esc(n.etiqueta || cat.texto)}</span>`;
  }

  function fecha(n, claseExtra) {
    return n.fecha ? `<time class="small ${claseExtra}" datetime="${esc(n.fecha)}">${esc(formatearFecha(n.fecha))}</time>` : '';
  }

  function acciones(n, claseBoton) {
    const botones = (n.enlaces || []).map(e => {
      const destino = esExterno(e.url) ? ' target="_blank" rel="noopener"' : '';
      const icono = e.icono ? `<i class="bi ${esc(e.icono)} me-1"></i>` : '';
      return `<a href="${esc(e.url)}"${destino} class="btn ${claseBoton} btn-sm rounded-pill px-3">${icono}${esc(e.texto)}</a>`;
    });
    if (n.galeria && n.galeria.length) {
      botones.push(`<button type="button" class="btn ${claseBoton} btn-sm rounded-pill px-3" data-noticia-galeria="${esc(n.id)}"><i class="bi bi-images me-1"></i>Ver galería</button>`);
    }
    if (n.detalle) {
      botones.push(`<button type="button" class="btn ${claseBoton} btn-sm rounded-pill px-3" data-noticia-detalle="${esc(n.id)}"><i class="bi bi-file-earmark-text me-1"></i>Ver detalles</button>`);
    }
    return botones.length ? `<div class="d-flex flex-wrap gap-2 mt-auto">${botones.join('')}</div>` : '';
  }

  function media(n) {
    if (n.video) {
      return `<button type="button" class="noticia-video" data-youtube-id="${esc(n.video)}" aria-label="Reproducir video: ${esc(n.titulo)}">
          <img src="https://i.ytimg.com/vi/${esc(n.video)}/hqdefault.jpg" alt="" loading="lazy">
          <i class="bi bi-play-circle-fill" aria-hidden="true"></i>
        </button>`;
    }
    if (n.imagen) {
      return `<img src="${esc(n.imagen)}" class="card-img-top" alt="${esc(n.titulo)}" loading="lazy" decoding="async">`;
    }
    const cat = CATEGORIAS[n.categoria] || CATEGORIAS.comunicado;
    return `<div class="noticia-icono" aria-hidden="true"><i class="bi ${esc(n.icono || cat.icono)}"></i></div>`;
  }

  function tarjeta(n) {
    return `<div class="col-md-6 col-lg-4">
      <article class="card news-card h-100 shadow-sm border-0">
        ${media(n)}
        <div class="card-body d-flex flex-column">
          <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
            ${badge(n)}
            ${fecha(n, 'text-muted')}
          </div>
          <h3 class="h6 card-title fw-bold">${esc(n.titulo)}</h3>
          <p class="card-text text-muted small flex-grow-1">${esc(n.resumen)}</p>
          ${acciones(n, 'btn-outline-primary')}
        </div>
      </article>
    </div>`;
  }

  // Tarjeta horizontal para el inicio cuando hay pocas noticias marcadas
  function tarjetaAncha(n) {
    const imagen = n.imagen && !n.video
      ? `<img src="${esc(n.imagen)}" class="noticia-ancha-img" alt="${esc(n.titulo)}" loading="lazy" decoding="async">`
      : media(n);
    return `<div class="col-12">
      <article class="card news-card news-card-ancha shadow-sm border-0 overflow-hidden">
        <div class="row g-0 align-items-stretch">
          <div class="col-md-5">${imagen}</div>
          <div class="col-md-7">
            <div class="card-body d-flex flex-column h-100 p-4 p-lg-5">
              <div class="d-flex flex-wrap align-items-center gap-2 mb-2">${badge(n)} ${fecha(n, 'text-muted')}</div>
              <h3 class="h4 card-title fw-bold">${esc(n.titulo)}</h3>
              <p class="card-text text-muted mb-4">${esc(n.resumen)}</p>
              ${acciones(n, 'btn-outline-primary')}
            </div>
          </div>
        </div>
      </article>
    </div>`;
  }

  // Foto a un lado y texto en un panel de color: se lee bien con cualquier foto
  function destacada(n) {
    return `<article class="card noticia-destacada shadow-lg border-0 overflow-hidden">
        <div class="row g-0">
          <div class="col-lg-7 noticia-destacada-media">
            <img src="${esc(n.imagen)}" class="noticia-destacada-img" alt="${esc(n.titulo)}">
          </div>
          <div class="col-lg-5">
            <div class="noticia-destacada-texto">
              <span class="small text-uppercase fw-bold mb-3 noticia-destacada-rotulo"><i class="bi bi-star-fill me-1"></i>Noticia destacada</span>
              <div class="d-flex flex-wrap align-items-center gap-2 mb-3">${badge(n, true)} ${fecha(n, 'text-white-50')}</div>
              <h2 class="h3 fw-bold mb-3">${esc(n.titulo)}</h2>
              <p class="mb-4">${esc(n.resumen)}</p>
              ${acciones(n, 'btn-light')}
            </div>
          </div>
        </div>
      </article>`;
  }

  function mensajeError(contenedor) {
    contenedor.innerHTML = `<div class="col-12"><div class="alert alert-warning text-center mb-0">
      No fue posible cargar las noticias en este momento. Intenta recargar la página.</div></div>`;
  }

  // ---------- Modal compartido (galería y detalles) ----------

  function obtenerModal() {
    let modal = document.getElementById('noticiaModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'modal fade';
      modal.id = 'noticiaModal';
      modal.tabIndex = -1;
      modal.setAttribute('aria-labelledby', 'noticiaModalLabel');
      modal.setAttribute('aria-hidden', 'true');
      modal.innerHTML = `<div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="noticiaModalLabel"></h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
            </div>
            <div class="modal-body"></div>
          </div>
        </div>`;
      document.body.appendChild(modal);
      // Al cerrar, se detiene el carrusel y se vacía el contenido
      modal.addEventListener('hidden.bs.modal', function () {
        const carrusel = modal.querySelector('.carousel');
        if (carrusel) bootstrap.Carousel.getInstance(carrusel)?.dispose();
        modal.querySelector('.modal-body').innerHTML = '';
      });
    }
    return modal;
  }

  function abrirModal(titulo, cuerpoHtml, sinRelleno) {
    const modal = obtenerModal();
    modal.querySelector('.modal-title').textContent = titulo;
    const cuerpo = modal.querySelector('.modal-body');
    cuerpo.classList.toggle('p-0', !!sinRelleno);
    cuerpo.innerHTML = cuerpoHtml;
    bootstrap.Modal.getOrCreateInstance(modal).show();
  }

  function abrirGaleria(n) {
    const items = n.galeria.map((src, i) => `<div class="carousel-item${i === 0 ? ' active' : ''}">
        <img src="${esc(src)}" class="d-block w-100 noticia-galeria-img" alt="${esc(n.titulo)} – foto ${i + 1} de ${n.galeria.length}">
      </div>`).join('');
    abrirModal('Galería: ' + n.titulo, `<div id="noticiaGaleria" class="carousel slide">
        <div class="carousel-inner">${items}</div>
        <button class="carousel-control-prev" type="button" data-bs-target="#noticiaGaleria" data-bs-slide="prev"><span class="carousel-control-prev-icon" aria-hidden="true"></span><span class="visually-hidden">Anterior</span></button>
        <button class="carousel-control-next" type="button" data-bs-target="#noticiaGaleria" data-bs-slide="next"><span class="carousel-control-next-icon" aria-hidden="true"></span><span class="visually-hidden">Siguiente</span></button>
      </div>`, true);
    // El carrusel se crea después de cargar la página, así que el avance automático se activa aquí
    bootstrap.Carousel.getOrCreateInstance(document.getElementById('noticiaGaleria'), {
      interval: 4000,
      ride: 'carousel',
      pause: 'hover'
    }).cycle();
  }

  function abrirDetalle(n) {
    const imagenes = (n.detalle.imagenes || []).map(src =>
      `<img src="${esc(src)}" class="img-fluid rounded shadow mb-3" alt="${esc(n.titulo)}" style="max-height: 500px;">`).join('');
    // detalle.texto es HTML escrito por el equipo del hospital en data/noticias.json
    abrirModal(n.titulo, `${imagenes ? `<div class="text-center">${imagenes}</div>` : ''}
      <div class="px-2">${n.detalle.texto || ''}</div>`);
  }

  function reproducirVideo(boton) {
    const id = encodeURIComponent(boton.dataset.youtubeId);
    const marco = document.createElement('div');
    marco.className = 'ratio ratio-16x9';
    marco.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1" title="${esc(boton.getAttribute('aria-label'))}"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    boton.replaceWith(marco);
  }

  document.addEventListener('click', function (e) {
    const galeria = e.target.closest('[data-noticia-galeria]');
    if (galeria) return abrirGaleria(noticiasPorId[galeria.dataset.noticiaGaleria]);
    const detalle = e.target.closest('[data-noticia-detalle]');
    if (detalle) return abrirDetalle(noticiasPorId[detalle.dataset.noticiaDetalle]);
    const video = e.target.closest('.noticia-video');
    if (video) reproducirVideo(video);
  });

  // ---------- Inicio: noticias marcadas con "inicio": true ----------

  async function iniciarRecientes(contenedor) {
    try {
      const limite = parseInt(contenedor.dataset.limite, 10) || 6;
      const noticias = (await cargarNoticias()).filter(n => n.inicio).slice(0, limite);
      if (!noticias.length) {
        contenedor.remove();
        return;
      }
      contenedor.innerHTML = noticias.map(noticias.length <= 2 ? tarjetaAncha : tarjeta).join('');
    } catch (err) {
      console.error(err);
      mensajeError(contenedor);
    }
  }

  // ---------- Página de noticias: destacada, filtros y paginación ----------

  async function iniciarArchivo(lista) {
    const zonaDestacada = document.getElementById('noticia-destacada');
    const paginacion = document.getElementById('noticias-paginacion');
    const botonesFiltro = document.querySelectorAll('.filter-btn-group [data-filter]');
    let todas;
    try {
      todas = await cargarNoticias();
    } catch (err) {
      console.error(err);
      mensajeError(lista);
      return;
    }

    const principal = todas.find(n => n.destacada && n.imagen);
    if (principal && zonaDestacada) {
      zonaDestacada.innerHTML = destacada(principal);
      todas = todas.filter(n => n !== principal);
    }

    let filtro = 'all';
    let pagina = 1;

    function mostrar(desplazar) {
      const filtradas = filtro === 'all' ? todas : todas.filter(n => n.categoria === filtro);
      const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
      pagina = Math.min(pagina, totalPaginas);
      const inicio = (pagina - 1) * POR_PAGINA;

      lista.innerHTML = filtradas.length
        ? filtradas.slice(inicio, inicio + POR_PAGINA).map(tarjeta).join('')
        : '<div class="col-12"><p class="text-center text-muted my-4">No hay noticias en esta categoría.</p></div>';

      if (paginacion) {
        if (totalPaginas <= 1) {
          paginacion.innerHTML = '';
        } else {
          const item = (num, texto, deshabilitado, activo) =>
            `<li class="page-item${deshabilitado ? ' disabled' : ''}${activo ? ' active' : ''}">
              <button type="button" class="page-link" data-pagina="${num}"${activo ? ' aria-current="page"' : ''}${deshabilitado ? ' disabled' : ''}>${texto}</button>
            </li>`;
          let html = item(pagina - 1, 'Anterior', pagina === 1, false);
          for (let i = 1; i <= totalPaginas; i++) html += item(i, i, false, i === pagina);
          html += item(pagina + 1, 'Siguiente', pagina === totalPaginas, false);
          paginacion.innerHTML = `<ul class="pagination shadow-sm">${html}</ul>`;
        }
      }

      if (desplazar) lista.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    botonesFiltro.forEach(boton => {
      boton.addEventListener('click', function () {
        botonesFiltro.forEach(b => {
          b.classList.remove('btn-primary');
          b.classList.add('btn-outline-primary');
          b.setAttribute('aria-pressed', 'false');
        });
        this.classList.remove('btn-outline-primary');
        this.classList.add('btn-primary');
        this.setAttribute('aria-pressed', 'true');
        filtro = this.dataset.filter;
        pagina = 1;
        mostrar(false);
      });
    });

    if (paginacion) {
      paginacion.addEventListener('click', function (e) {
        const boton = e.target.closest('[data-pagina]');
        if (!boton || boton.disabled) return;
        pagina = parseInt(boton.dataset.pagina, 10);
        mostrar(true);
      });
    }

    mostrar(false);
  }

  document.addEventListener('DOMContentLoaded', function () {
    const recientes = document.getElementById('noticias-recientes');
    if (recientes) iniciarRecientes(recientes);
    const lista = document.getElementById('noticias-lista');
    if (lista) iniciarArchivo(lista);
  });
})();
