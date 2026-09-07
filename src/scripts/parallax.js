import { gsap } from "gsap";
import { isMobile } from "./../utils";

// Variáveis para armazenar a posição do mouse e o movimento do parallax
let mouseX = 0;
let mouseY = 0;
let targetCameraX = 0;
let targetCameraY = 0;
const parallaxCameraAmount = 0.001; // Ajuste a quantidade de parallax

// Função para atualizar o parallax com base na posição do mouse
export function updateParallax(camera) {
  if (!isMobile) {
    // Atualiza o alvo da câmera com base no movimento do mouse
    targetCameraX = (mouseX - window.innerWidth / 2) * parallaxCameraAmount;
    targetCameraY = camera.position.y + ((mouseY - window.innerHeight / 2) * parallaxCameraAmount);
    targetCameraY = Math.min(Math.max(targetCameraY, 6.25), 6.75); // Clamp between 4 and 8

    // Usa gsap para mover a câmera suavemente para a nova posição
    gsap.to(camera.position, {
      x: targetCameraX,
      y: targetCameraY,
      duration: 1, // Duração da transição para suavidade
      ease: "power2.out", // Efeito de suavização
    });
  }
}

// Listener para capturar o movimento do mouse
window.addEventListener("mousemove", (event) => {
  mouseX = event.clientX;
  mouseY = event.clientY;
});
