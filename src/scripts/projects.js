import * as THREE from "three";

import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { checkQuests } from "./gamification";
import { gsap } from "gsap";
import { setRoute } from "./router";

/**
 * A placa de projetos: um poste de madeira com duas tabuletas, discreto,
 * fincado do lado direito do planeta. Clicar abre a lista de coisas que
 * eu mantenho (hoje libs de BullMQ; a lista vem de content/projects.json).
 */

// Injetado no build pelo webpack (DefinePlugin)
const PROJECTS = typeof __PROJECTS__ !== "undefined" ? __PROJECTS__ : [];

const WOOD = 0xa5744a;
const WOOD_DARK = 0x7a5233;
const CARVE = 0x3b2a1a;
const SCALE = 0.65;

let signGroup;
let camera;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hovered = false;

export function createSignpost(planetGroup, cameraRef, planetRadius) {
  camera = cameraRef;
  signGroup = new THREE.Group();

  const wood = new THREE.MeshStandardMaterial({ color: WOOD, roughness: 0.9 });
  const woodDark = new THREE.MeshStandardMaterial({ color: WOOD_DARK, roughness: 0.9 });
  const carve = new THREE.MeshStandardMaterial({ color: CARVE, roughness: 1 });

  const add = (geometry, material, x, y, z, rotationY = 0) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.rotation.y = rotationY;
    mesh.castShadow = true;
    signGroup.add(mesh);
    return mesh;
  };

  // Poste
  add(new THREE.CylinderGeometry(0.05, 0.065, 1.6, 10), woodDark, 0, 0.8, 0);

  // Duas tabuletas, levemente desencontradas
  const boardGeometry = new THREE.BoxGeometry(1.0, 0.24, 0.05);
  const topBoard = add(boardGeometry, wood, 0.12, 1.28, 0.05, 0.12);
  add(boardGeometry, wood, -0.1, 0.94, 0.05, -0.18);

  // "PROJECTS" gravado na tabuleta de cima
  const fontLoader = new FontLoader();
  fontLoader.load("/fonts/Comic Neue_Bold.json", (font) => {
    const geometry = new TextGeometry("PROJECTS", {
      font,
      size: 0.12,
      height: 0.01,
      curveSegments: 6,
    });
    geometry.center();
    const text = new THREE.Mesh(geometry, carve);
    text.position.set(0, 0, 0.03);
    topBoard.add(text);
  });

  // Na superfície, à direita do texto, longe da estela
  const x = 2.6;
  const z = 5.3;
  const surfaceY =
    Math.sqrt(planetRadius * planetRadius - x * x - z * z) - planetRadius;
  signGroup.position.set(x, surfaceY + 0.42, z);
  signGroup.rotation.y = -0.2;
  signGroup.scale.setScalar(SCALE);

  planetGroup.add(signGroup);

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("click", onClick);

  const footerLink = document.getElementById("projects-link");
  if (footerLink) {
    footerLink.addEventListener("click", (event) => {
      event.preventDefault();
      openProjects();
    });
  }

  return signGroup;
}

function intersectsSign(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  return raycaster.intersectObject(signGroup, true).length > 0;
}

function onMouseMove(event) {
  if (!signGroup) return;
  if (window.starModalIsOpened || window.aboutMeShown) return;

  const over = intersectsSign(event);
  if (over) document.body.style.cursor = "pointer";

  if (over && !hovered) {
    hovered = true;
    gsap.to(signGroup.scale, { x: SCALE * 1.08, y: SCALE * 1.08, z: SCALE * 1.08, duration: 0.3 });
  } else if (!over && hovered) {
    hovered = false;
    gsap.to(signGroup.scale, { x: SCALE, y: SCALE, z: SCALE, duration: 0.3 });
  }
}

function onClick(event) {
  if (!signGroup) return;
  if (window.starModalIsOpened || window.aboutMeShown) return;
  if (intersectsSign(event)) openProjects();
}

/**
 * Modal: projetos que eu mantenho
 */
export function openProjects() {
  const existing = document.getElementById("projectsModal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "projectsModal";
  modal.classList.add("modal", "modal--reader");

  const closeButton = document.createElement("button");
  closeButton.classList.add("close-btn");
  closeButton.innerHTML = `<i class="fas fa-times"></i>`;
  closeButton.onclick = () => {
    modal.remove();
    window.starModalIsOpened = false;
    window.questTracker.projects = true;
    checkQuests();
    setRoute(null);
  };

  const panel = document.createElement("div");
  panel.classList.add("tablet");
  panel.innerHTML = `
    <header class="tablet__header">
      <span class="tablet__eyebrow">Projects</span>
      <h1>Things I maintain</h1>
      <p>Built because I needed them in production. Released because you probably do too.</p>
    </header>
    <ul class="oss">
      ${PROJECTS.map(
        (p) => `
        <li class="oss__card">
          <h2 class="oss__name">${p.name}</h2>
          <p class="oss__tagline">${p.tagline}</p>
          <p class="oss__desc">${p.description}</p>
          <div class="tablet__tags">${p.tags.map((t) => `<span>${t}</span>`).join("")}</div>
          <div class="oss__links">
            ${p.links
              .map((l) => `<a href="${l.url}" target="_blank" rel="noreferrer">${l.label} &rarr;</a>`)
              .join("")}
          </div>
        </li>`
      ).join("")}
    </ul>
    <p class="tablet__original">
      More on <a href="https://github.com/madmorett" target="_blank" rel="noreferrer">github.com/madmorett &rarr;</a>
    </p>
  `;

  modal.appendChild(closeButton);
  modal.appendChild(panel);
  modal.style.display = "flex";
  window.starModalIsOpened = true;
  document.body.appendChild(modal);
  setRoute("/projects");
}
