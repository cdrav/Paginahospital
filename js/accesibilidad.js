document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const increaseTextBtn = document.querySelector('button[title="Aumentar texto"]');
    const decreaseTextBtn = document.querySelector('button[title="Reducir texto"]');
    const contrastToggleBtn = document.getElementById('cambiarcontraste');

    let currentFontSize = 16; 
    const FONT_SIZE_STEP = 2; 

    if (increaseTextBtn) {
        increaseTextBtn.addEventListener('click', () => {
            currentFontSize += FONT_SIZE_STEP;
            body.style.fontSize = `${currentFontSize}px`;
        });
    }

    if (decreaseTextBtn) {
        decreaseTextBtn.addEventListener('click', () => {
            currentFontSize -= FONT_SIZE_STEP;
           
            if (currentFontSize < 10) currentFontSize = 10;
            body.style.fontSize = `${currentFontSize}px`;
        });
    }

   
    if (contrastToggleBtn) {
        contrastToggleBtn.addEventListener('click', () => {
            body.classList.toggle('high-contrast'); 
        });
    }
});
