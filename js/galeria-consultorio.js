document.addEventListener('DOMContentLoaded', function() {
    // Inicializar el carrusel de imágenes
    const glide = new Glide('.glide', {
        type: 'carousel',
        startAt: 0,
        perView: 3,
        focusAt: 'center',
        gap: 10,
        autoplay: 3000, // Cambia de imagen cada 3 segundos
        hoverpause: true, // Pausa al pasar el ratón
        keyboard: true, // Permite navegación con teclado
        animationDuration: 600, // Duración de la animación en ms
        animationTimingFunc: 'cubic-bezier(0.165, 0.840, 0.440, 1.000)',
        breakpoints: {
            1200: {
                perView: 3
            },
            992: {
                perView: 2,
                gap: 8
            },
            768: {
                perView: 1,
                gap: 5
            }
        }
    });

    // Iniciar el carrusel
    glide.mount();

    // Asegurarse de que el autoplay funcione correctamente
    if (glide.settings.autoplay) {
        glide.on('run.after', function() {
            // Reiniciar el autoplay después de la navegación manual
            if (glide.settings.autoplay) {
                glide.pause();
                glide.play();
            }
        });
    }

    // Lazy loading para imágenes
    if ('IntersectionObserver' in window) {
        const lazyImages = document.querySelectorAll('img[loading="lazy"]');
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.getAttribute('data-src') || img.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            });
        });

        lazyImages.forEach(img => {
            if (img.complete || img.hasAttribute('data-src')) {
                return;
            }
            img.setAttribute('data-src', img.src);
            img.removeAttribute('src');
            imageObserver.observe(img);
        });
    }
});
