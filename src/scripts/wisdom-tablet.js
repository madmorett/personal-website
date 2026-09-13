import * as THREE from "three";
import "highlight.js/styles/github-dark.css";

import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { checkQuests } from "./gamification";
import { gsap } from "gsap";
import { setRoute } from "./router";

/**
 * O Templo dos Artigos: um pequeno templo grego (degraus, colunas,
 * entablamento, frontão) com a tábua de pedra guardada dentro.
 * Clicar nele abre a lista de artigos; clicar num artigo abre o texto
 * completo num leitor dentro do próprio mundinho — nada de sair da cena.
 */

// Injetado no build pelo webpack (DefinePlugin)
const ARTICLES = typeof __ARTICLES__ !== "undefined" ? __ARTICLES__ : [];

const MARBLE = 0xefe9dd;
const MARBLE_DARK = 0xd3cbbd;
const CARVE = 0x4a4238;

const SCALE = 0.7;

let templeGroup;
let camera;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hovered = false;

export function createWisdomTablet(planetGroup, cameraRef, planetRadius) {
  camera = cameraRef;
  templeGroup = new THREE.Group();

  const marble = new THREE.MeshStandardMaterial({ color: MARBLE, roughness: 0.85 });
  const marbleDark = new THREE.MeshStandardMaterial({ color: MARBLE_DARK, roughness: 0.9 });
  const carve = new THREE.MeshStandardMaterial({ color: CARVE, roughness: 1 });

  const add = (geometry, material, x, y, z) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    templeGroup.add(mesh);
    return mesh;
  };

  // Base em três degraus
  add(new THREE.BoxGeometry(2.6, 0.12, 1.3), marbleDark, 0, 0.06, 0);
  add(new THREE.BoxGeometry(2.35, 0.12, 1.1), marble, 0, 0.18, 0);
  add(new THREE.BoxGeometry(2.1, 0.12, 0.9), marble, 0, 0.3, 0);
  const floor = 0.36;

  // Quatro colunas na frente, com base e capitel
  const columnHeight = 1.25;
  const columnGeometry = new THREE.CylinderGeometry(0.085, 0.1, columnHeight, 18);
  [-0.8, -0.27, 0.27, 0.8].forEach((x) => {
    add(new THREE.BoxGeometry(0.24, 0.05, 0.24), marble, x, floor + 0.025, 0.3);
    add(columnGeometry, marble, x, floor + columnHeight / 2, 0.3);
    add(new THREE.BoxGeometry(0.26, 0.07, 0.26), marble, x, floor + columnHeight + 0.035, 0.3);
  });

  // Entablamento (a faixa onde vai o título) e frontão
  const entablatureY = floor + columnHeight + 0.07 + 0.12;
  add(new THREE.BoxGeometry(2.1, 0.24, 0.9), marble, 0, entablatureY, 0);

  const pediment = new THREE.Shape();
  pediment.moveTo(-1.1, 0);
  pediment.lineTo(1.1, 0);
  pediment.lineTo(0, 0.5);
  pediment.lineTo(-1.1, 0);
  const pedimentGeometry = new THREE.ExtrudeGeometry(pediment, {
    depth: 0.95,
    bevelEnabled: false,
  });
  add(pedimentGeometry, marble, 0, entablatureY + 0.12, -0.475);

  // A tábua, guardada no fundo do templo, com as linhas "escritas"
  add(new THREE.BoxGeometry(1.7, columnHeight, 0.1), marbleDark, 0, floor + columnHeight / 2, -0.3);
  const lineCount = Math.min(ARTICLES.length, 7);
  const lineTop = floor + columnHeight - 0.18;
  for (let i = 0; i < lineCount; i++) {
    const width = i % 3 === 2 ? 0.7 : 1.05;
    add(
      new THREE.BoxGeometry(width, 0.035, 0.012),
      carve,
      (1.05 - width) / -2,
      lineTop - i * 0.14,
      -0.243
    );
  }

  // Título gravado no entablamento
  const fontLoader = new FontLoader();
  fontLoader.load("/fonts/Comic Neue_Bold.json", (font) => {
    const geometry = new TextGeometry("ARTICLES", {
      font,
      size: 0.13,
      height: 0.012,
      curveSegments: 6,
    });
    geometry.center();
    add(geometry, carve, 0, entablatureY, 0.45 + 0.012);
  });

  // Fincado na superfície, virado levemente para a câmera
  const x = 1.0;
  const z = 4.3;
  const surfaceY =
    Math.sqrt(planetRadius * planetRadius - x * x - z * z) - planetRadius;
  templeGroup.position.set(x, surfaceY + 0.42, z);
  templeGroup.rotation.y = -0.15;
  templeGroup.scale.setScalar(SCALE);

  planetGroup.add(templeGroup);

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("click", onClick);

  // O link "Articles" do rodapé abre o templo em vez de navegar
  const footerLink = document.getElementById("open-tablet");
  if (footerLink) {
    footerLink.addEventListener("click", (event) => {
      event.preventDefault();
      openTablet();
    });
  }

  return templeGroup;
}

function intersectsTemple(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  return raycaster.intersectObject(templeGroup, true).length > 0;
}

function onMouseMove(event) {
  if (!templeGroup) return;
  if (window.starModalIsOpened || window.aboutMeShown) return;

  const over = intersectsTemple(event);
  if (over) document.body.style.cursor = "pointer";

  if (over && !hovered) {
    hovered = true;
    gsap.to(templeGroup.scale, { x: SCALE * 1.05, y: SCALE * 1.05, z: SCALE * 1.05, duration: 0.3 });
  } else if (!over && hovered) {
    hovered = false;
    gsap.to(templeGroup.scale, { x: SCALE, y: SCALE, z: SCALE, duration: 0.3 });
  }
}

function onClick(event) {
  if (!templeGroup) return;
  if (window.starModalIsOpened || window.aboutMeShown) return;
  if (intersectsTemple(event)) openTablet();
}

/**
 * Modal: lista de artigos (e, opcionalmente, já abre um artigo)
 */
export function openTablet(slug) {
  const existing = document.getElementById("tabletModal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "tabletModal";
  modal.classList.add("modal", "modal--reader");

  const closeButton = document.createElement("button");
  closeButton.classList.add("close-btn");
  closeButton.innerHTML = `<i class="fas fa-times"></i>`;
  closeButton.onclick = () => {
    modal.remove();
    window.starModalIsOpened = false;
    window.questTracker.tablet = true;
    checkQuests();
    setRoute(null);
  };

  const panel = document.createElement("div");
  panel.classList.add("tablet");
  modal.appendChild(closeButton);
  modal.appendChild(panel);

  modal.style.display = "flex";
  window.starModalIsOpened = true;
  document.body.appendChild(modal);

  if (slug && ARTICLES.some((a) => a.slug === slug)) {
    openArticle(panel, slug);
  } else {
    renderList(panel);
  }
}

function renderList(panel) {
  panel.parentElement.scrollTop = 0; // quem rola é o modal
  setRoute("/articles");
  panel.innerHTML = `
    <header class="tablet__header">
      <span class="tablet__eyebrow">Σ · The Temple of Articles</span>
      <h1>Articles</h1>
      <p>Lessons carved from scaling an engineering org — mostly from getting it wrong first.</p>
    </header>
    <ul class="tablet__list">
      ${ARTICLES.map(
        (a) => `
        <li>
          <button class="tablet__item" data-slug="${a.slug}">
            <span class="tablet__date">${a.date}</span>
            <span class="tablet__title">${a.title}</span>
            <span class="tablet__desc">${a.description}</span>
          </button>
        </li>`
      ).join("")}
    </ul>
  `;

  panel.querySelectorAll(".tablet__item").forEach((button) => {
    button.addEventListener("click", () => openArticle(panel, button.dataset.slug));
  });
}

/**
 * Leitor: artigo completo, carregado sob demanda
 */
const cache = {};

async function fetchArticle(slug) {
  if (cache[slug]) return cache[slug];
  const response = await fetch(`/articles/${slug}.json`);
  if (!response.ok) throw new Error(`article ${slug}: ${response.status}`);
  cache[slug] = await response.json();
  return cache[slug];
}

async function openArticle(panel, slug) {
  panel.innerHTML = `<p class="tablet__loading">Carving…</p>`;
  setRoute(`/articles/${slug}`);

  let article;
  try {
    article = await fetchArticle(slug);
  } catch (error) {
    panel.innerHTML = `<p class="tablet__loading">Couldn't load this one. <a href="/articles/${slug}/">Open it as a page</a>.</p>`;
    return;
  }

  panel.parentElement.scrollTop = 0; // quem rola é o modal
  panel.innerHTML = `
    <button class="tablet__back">&larr; Back to the temple</button>
    <header class="tablet__header">
      <span class="tablet__date">${article.date}</span>
      <h1>${article.title}</h1>
      ${
        article.tags && article.tags.length
          ? `<div class="tablet__tags">${article.tags
              .map((t) => `<span>${t}</span>`)
              .join("")}</div>`
          : ""
      }
    </header>
    <article class="tablet__content">${article.htmlContent}</article>
    <p class="tablet__original">
      <a href="/articles/${slug}/">Permalink</a>
      ${
        article.originalUrl
          ? ` · <a href="${article.originalUrl}" target="_blank" rel="noreferrer">Originally published on dev.to &rarr;</a>`
          : ""
      }
    </p>
    <button class="tablet__back tablet__back--bottom">&larr; Back to the temple</button>
  `;

  panel.querySelectorAll(".tablet__back").forEach((button) => {
    button.addEventListener("click", () => renderList(panel));
  });

  addCopyButtons(panel);
}

function addCopyButtons(panel) {
  panel.querySelectorAll("pre code").forEach((block) => {
    const button = document.createElement("button");
    button.textContent = "Copy";
    button.className = "copy-code-btn";
    button.addEventListener("click", () => {
      navigator.clipboard.writeText(block.textContent);
      button.textContent = "Copied!";
      setTimeout(() => (button.textContent = "Copy"), 2000);
    });
    block.parentElement.appendChild(button);
  });
}
