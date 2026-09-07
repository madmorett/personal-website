import * as THREE from "three";

import { gsap } from "gsap";
import { isMobile } from "../utils";

/**
 * Artigos como satélites orbitando o planeta.
 * Cada artigo é um pequeno monolito brilhante em órbita.
 * Clicar abre um modal com o resumo + link para o artigo completo.
 */

let satellites = [];
let raycaster;
let camera;
let mouse = new THREE.Vector2();
let hovered = null;

// Injetado no build pelo webpack (DefinePlugin)
const ARTICLES = typeof __ARTICLES__ !== "undefined" ? __ARTICLES__ : [];

const ORBIT_RADIUS = isMobile ? 7 : 6;
const ORBIT_SPEED = 0.00035;

// Altura da órbita: alta o bastante para os satélites cruzarem o céu
// acima do texto, sem atravessar a superfície do planeta.
const ORBIT_HEIGHT = isMobile ? 5.6 : 4.5;

export function initArticleSatellites(scene, cameraRef) {
  camera = cameraRef;
  raycaster = new THREE.Raycaster();

  if (!ARTICLES.length) return satellites;

  const geometry = new THREE.OctahedronGeometry(0.32, 0);

  ARTICLES.forEach((article, i) => {
    const material = new THREE.MeshStandardMaterial({
      color: 0x80eebd,
      emissive: 0x2f8f6a,
      emissiveIntensity: 0.6,
      metalness: 0.6,
      roughness: 0.3,
      flatShading: true,
    });

    const satellite = new THREE.Mesh(geometry, material);

    // Distribui os satélites em órbitas levemente diferentes
    const angle = (i / ARTICLES.length) * Math.PI * 2;
    const tilt = (i % 3) - 1; // -1, 0, 1 -> três planos de órbita

    satellite.userData = {
      article,
      angle,
      tilt: tilt * 0.6,
      radius: ORBIT_RADIUS + (i % 2) * 0.9,
    };

    satellite.position.set(
      Math.cos(angle) * satellite.userData.radius,
      ORBIT_HEIGHT + satellite.userData.tilt,
      Math.sin(angle) * satellite.userData.radius
    );

    scene.add(satellite);
    satellites.push(satellite);

    // Pulso sutil para chamar atenção
    gsap.to(material, {
      emissiveIntensity: 1.1,
      duration: 1.6,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: i * 0.2,
    });
  });

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("click", onClick);

  // Projeta as posições dos satélites em coordenadas de tela.
  // Usado para posicionar rótulos e para inspeção durante o desenvolvimento.
  window.__satelliteScreenPositions = () =>
    satellites.map((s) => {
      const v = new THREE.Vector3();
      s.getWorldPosition(v);
      v.project(camera);
      return {
        title: s.userData.article.title,
        x: Math.round(((v.x + 1) / 2) * window.innerWidth),
        y: Math.round(((-v.y + 1) / 2) * window.innerHeight),
        z: Number(v.z.toFixed(3)),
      };
    });

  return satellites;
}

function onMouseMove(event) {
  if (!satellites.length) return;

  // Com um modal aberto a cena está atrás do overlay: nada a destacar
  if (window.starModalIsOpened || window.aboutMeShown) {
    const tooltip = document.getElementById("satellite-tooltip");
    if (tooltip) tooltip.style.opacity = 0;
    return;
  }

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(satellites, true);

  const tooltip = document.getElementById("satellite-tooltip");

  if (intersects.length > 0) {
    const satellite = intersects[0].object;
    document.body.style.cursor = "pointer";

    if (hovered !== satellite) {
      hovered = satellite;
      gsap.to(satellite.scale, { x: 1.4, y: 1.4, z: 1.4, duration: 0.3 });
    }

    if (tooltip) {
      tooltip.textContent = satellite.userData.article.title;
      tooltip.style.opacity = 1;
      tooltip.style.left = `${event.clientX + 16}px`;
      tooltip.style.top = `${event.clientY + 16}px`;
    }
  } else {
    if (hovered) {
      gsap.to(hovered.scale, { x: 1, y: 1, z: 1, duration: 0.3 });
      hovered = null;
    }
    if (tooltip) tooltip.style.opacity = 0;
  }
}

function onClick(event) {
  if (!satellites.length) return;
  if (window.starModalIsOpened || window.aboutMeShown) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(satellites, true);

  if (intersects.length > 0) {
    openArticleModal(intersects[0].object.userData.article);
  }
}

function openArticleModal(article) {
  const existing = document.getElementById("articleModal");
  if (existing) existing.remove();

  // O tooltip não deve ficar flutuando sobre o modal
  const tooltip = document.getElementById("satellite-tooltip");
  if (tooltip) tooltip.style.opacity = 0;

  const modal = document.createElement("div");
  modal.id = "articleModal";
  modal.classList.add("modal");

  const closeButton = document.createElement("button");
  closeButton.classList.add("close-btn");
  closeButton.innerHTML = `<i class="fas fa-times"></i>`;
  closeButton.onclick = () => {
    modal.remove();
    window.starModalIsOpened = false;
  };

  const content = document.createElement("div");
  content.classList.add("article-content");
  content.innerHTML = `
    <span class="article-content__date">${article.date}</span>
    <h1>${article.title}</h1>
    <p>${article.description}</p>
    ${
      article.tags && article.tags.length
        ? `<div class="article-content__tags">${article.tags
            .map((t) => `<span>${t}</span>`)
            .join("")}</div>`
        : ""
    }
    <a class="article-content__cta" href="/articles/${article.slug}/">
      Read the full article &rarr;
    </a>
    <a class="article-content__all" href="/articles/">See all articles</a>
  `;

  modal.appendChild(closeButton);
  modal.appendChild(content);
  modal.style.display = "flex";
  window.starModalIsOpened = true;
  document.body.appendChild(modal);
}

export function updateArticleSatellites() {
  satellites.forEach((satellite) => {
    const data = satellite.userData;
    data.angle += ORBIT_SPEED;

    satellite.position.x = Math.cos(data.angle) * data.radius;
    satellite.position.z = Math.sin(data.angle) * data.radius;
    satellite.position.y =
      ORBIT_HEIGHT + data.tilt + Math.sin(data.angle * 2) * 0.6;

    satellite.rotation.x += 0.004;
    satellite.rotation.y += 0.006;
  });
}
