import * as THREE from "three";
import "highlight.js/styles/github-dark.css";

import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { checkQuests } from "./gamification";
import { gsap } from "gsap";
import { setRoute } from "./router";
import { openReader, closeReader } from "./reading-mode";

/**
 * A Tábua da Sabedoria: uma estela de pedra pequena, fincada no planeta.
 * Clicar nela abre a lista de artigos; clicar num artigo abre o texto
 * completo num leitor dentro do próprio mundinho — nada de sair da cena.
 */

// Injetado no build pelo webpack (DefinePlugin)
const ARTICLES = typeof __ARTICLES__ !== "undefined" ? __ARTICLES__ : [];

const STONE = 0xd8d0c2;
const STONE_DARK = 0xb9ae9c;
const CARVE = 0x4a4238;

// Pequena de propósito: é um detalhe do planeta, não o centro dele
const SCALE = 0.55;

let templeGroup;
let camera;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hovered = false;

export function createWisdomTablet(planetGroup, cameraRef, planetRadius) {
  camera = cameraRef;
  templeGroup = new THREE.Group();

  // Estela: retângulo com frontão triangular no topo
  const w = 0.75;
  const straight = 1.6;
  const pediment = 0.42;
  const shape = new THREE.Shape();
  shape.moveTo(-w, 0);
  shape.lineTo(w, 0);
  shape.lineTo(w, straight);
  shape.lineTo(0, straight + pediment);
  shape.lineTo(-w, straight);
  shape.lineTo(-w, 0);

  const depth = 0.18;
  const slabGeometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 3,
  });
  const slab = new THREE.Mesh(
    slabGeometry,
    new THREE.MeshStandardMaterial({ color: STONE, roughness: 0.95 })
  );
  slab.castShadow = true;
  slab.position.y = 0.22;
  templeGroup.add(slab);

  // Pedestal
  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 0.24, 0.75),
    new THREE.MeshStandardMaterial({ color: STONE_DARK, roughness: 1 })
  );
  plinth.position.set(0, 0.12, depth / 2);
  plinth.castShadow = true;
  templeGroup.add(plinth);

  // Linhas "escritas" na pedra: uma por artigo, até caber
  const carveMaterial = new THREE.MeshStandardMaterial({ color: CARVE, roughness: 1 });
  const lineCount = Math.min(ARTICLES.length, 8);
  for (let i = 0; i < lineCount; i++) {
    const width = i % 3 === 2 ? 0.75 : 1.1;
    const line = new THREE.Mesh(new THREE.BoxGeometry(width, 0.035, 0.012), carveMaterial);
    line.position.set((1.1 - width) / -2, 1.18 - i * 0.13, depth + 0.036);
    templeGroup.add(line);
  }

  // Título gravado abaixo do frontão
  const fontLoader = new FontLoader();
  fontLoader.load("/fonts/Comic Neue_Bold.json", (font) => {
    const geometry = new TextGeometry("ARTICLES", {
      font,
      size: 0.17,
      height: 0.015,
      curveSegments: 6,
    });
    geometry.center();
    const title = new THREE.Mesh(geometry, carveMaterial);
    title.position.set(0, 1.5, depth + 0.036);
    templeGroup.add(title);
  });

  // Fincada na superfície, à esquerda do texto, virada levemente para a câmera
  const x = -1.6;
  const z = 5.0;
  const surfaceY =
    Math.sqrt(planetRadius * planetRadius - x * x - z * z) - planetRadius;
  templeGroup.position.set(x, surfaceY + 0.42, z);
  templeGroup.rotation.y = 0.12;
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
    closeReader(modal, () => {
      window.questTracker.tablet = true;
      checkQuests();
    });
    setRoute(null);
  };

  const panel = document.createElement("div");
  panel.classList.add("tablet");
  modal.appendChild(closeButton);
  modal.appendChild(panel);

  openReader(modal);

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
      <span class="tablet__eyebrow">Σ · The Tablet of Wisdom</span>
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
    <button class="tablet__back">&larr; Back to the tablet</button>
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
    <button class="tablet__back tablet__back--bottom">&larr; Back to the tablet</button>
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
