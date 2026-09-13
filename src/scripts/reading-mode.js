import { gsap } from "gsap";

/**
 * A "outra dimensão" de leitura.
 *
 * Ler em cima do planeta girando não funciona. Então, ao abrir um leitor,
 * a câmera mergulha em direção ao planeta enquanto a cena escurece, e o
 * usuário aterrissa num espaço próprio: fundo opaco, céu estrelado bem
 * discreto, tipografia de leitura. Ao fechar, a câmera volta ao lugar.
 *
 * Enquanto `window.readingMode` está ligado, o loop principal não renderiza
 * a cena — não há nada dela visível mesmo, e a bateria agradece.
 */

let camera;
let restingZ = null;

const DIVE_DURATION = 0.9;
const FADE_MS = 500;

export function initReadingMode(cameraRef) {
  camera = cameraRef;
  window.readingMode = false;
}

export function openReader(modal) {
  // Céu e botão de saída são iguais para todos os leitores
  const sky = document.createElement("div");
  sky.className = "reader-sky";
  modal.prepend(sky);

  const progress = document.createElement("div");
  progress.className = "reader-progress";
  modal.prepend(progress);

  const exit = document.createElement("button");
  exit.className = "reader-exit";
  exit.innerHTML = "&larr; Back to the planet";
  exit.onclick = () => modal.querySelector(".close-btn")?.click();
  modal.appendChild(exit);

  modal.addEventListener("scroll", () => {
    const max = modal.scrollHeight - modal.clientHeight;
    progress.style.width = max > 0 ? `${(modal.scrollTop / max) * 100}%` : "0%";
  });

  modal.style.display = "flex";
  window.starModalIsOpened = true;
  document.body.appendChild(modal);

  // Mergulho: a cena vem de encontro ao usuário enquanto o leitor aparece
  if (camera && restingZ === null) {
    restingZ = camera.position.z;
    gsap.to(camera.position, {
      z: Math.max(restingZ - 7, 3),
      duration: DIVE_DURATION,
      ease: "power2.in",
    });
  }

  requestAnimationFrame(() => {
    setTimeout(() => modal.classList.add("is-visible"), 120);
  });

  setTimeout(() => {
    window.readingMode = true;
  }, DIVE_DURATION * 1000);
}

export function closeReader(modal, onClosed) {
  window.readingMode = false;
  modal.classList.remove("is-visible");

  if (camera && restingZ !== null) {
    gsap.to(camera.position, {
      z: restingZ,
      duration: 0.8,
      ease: "power2.out",
    });
    restingZ = null;
  }

  setTimeout(() => {
    modal.remove();
    window.starModalIsOpened = false;
    if (onClosed) onClosed();
  }, FADE_MS);
}
