// Script de accesibilidad

document.addEventListener("DOMContentLoaded", function () {
  const btnAumentar = document.querySelector('button[title="Aumentar texto"]');
  const btnNormal = document.querySelector('button[title="Tamaño normal"]');
  const btnContraste = document.querySelector('button[title="Modo alto contraste"]');

  let fuenteBase = 1;
  let altoContrasteActivo = false;

  btnAumentar.addEventListener("click", () => {
    fuenteBase += 0.1;
    document.body.style.fontSize = fuenteBase + "em";
  });

  btnNormal.addEventListener("click", () => {
    fuenteBase = 1;
    document.body.style.fontSize = "1em";
  });

  btnContraste.addEventListener("click", () => {
    altoContrasteActivo = !altoContrasteActivo;
    if (altoContrasteActivo) {
      document.body.classList.add("alto-contraste");
    } else {
      document.body.classList.remove("alto-contraste");
    }
  });
});