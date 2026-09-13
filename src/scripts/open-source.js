import * as THREE from "three";

import { checkQuests } from "./gamification";
import { gsap } from "gsap";
import { setRoute } from "./router";

/**
 * O Touro de Bronze: estátua num pedestal de mármore, à moda grega.
 * É touro porque tudo que eu mantenho em open source gira em torno do
 * BullMQ. Clicar nele abre a lista de projetos.
 */

// Injetado no build pelo webpack (DefinePlugin)
const PROJECTS = typeof __OPEN_SOURCE__ !== "undefined" ? __OPEN_SOURCE__ : [];

const BRONZE = 0xb87333; // cobre claro: bronze escuro sumia nessa luz
const IVORY = 0xf1e8d8;
const MARBLE = 0xefe9dd;
const SCALE = 0.85;

let bullGroup;
let camera;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hovered = false;

export function createBullStatue(planetGroup, cameraRef, planetRadius) {
  camera = cameraRef;
  bullGroup = new THREE.Group();

  const bronze = new THREE.MeshStandardMaterial({
    color: BRONZE,
    metalness: 0.55,
    roughness: 0.5,
  });
  const marble = new THREE.MeshStandardMaterial({ color: MARBLE, roughness: 0.85 });
  const ivory = new THREE.MeshStandardMaterial({ color: IVORY, roughness: 0.6 });

  const add = (geometry, material, x, y, z, rotation) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    if (rotation) mesh.rotation.set(rotation.x || 0, rotation.y || 0, rotation.z || 0);
    mesh.castShadow = true;
    bullGroup.add(mesh);
    return mesh;
  };

  // Pedestal
  add(new THREE.BoxGeometry(1.7, 0.14, 0.9), marble, 0, 0.07, 0);
  add(new THREE.BoxGeometry(1.5, 0.22, 0.75), marble, 0, 0.25, 0);
  const top = 0.36;

  // Pernas
  const leg = new THREE.CylinderGeometry(0.06, 0.055, 0.45, 10);
  [
    [-0.36, 0.14],
    [-0.36, -0.14],
    [0.34, 0.14],
    [0.34, -0.14],
  ].forEach(([x, z]) => add(leg, bronze, x, top + 0.225, z));

  // Corpo, pescoço e cabeça
  const bodyY = top + 0.45 + 0.24;
  add(new THREE.BoxGeometry(1.0, 0.48, 0.44), bronze, 0, bodyY, 0);
  add(new THREE.BoxGeometry(0.3, 0.36, 0.34), bronze, 0.56, bodyY + 0.08, 0, { z: -0.2 });
  add(new THREE.BoxGeometry(0.36, 0.32, 0.34), bronze, 0.78, bodyY + 0.12, 0);
  add(new THREE.BoxGeometry(0.18, 0.18, 0.26), bronze, 0.98, bodyY + 0.02, 0);

  // Chifres de marfim, abertos pra fora e apontando pra cima
  const horn = new THREE.ConeGeometry(0.06, 0.42, 8);
  add(horn, ivory, 0.82, bodyY + 0.34, 0.16, { x: 0.85, z: -0.25 });
  add(horn, ivory, 0.82, bodyY + 0.34, -0.16, { x: -0.85, z: -0.25 });

  // Orelhas e rabo
  add(new THREE.BoxGeometry(0.08, 0.05, 0.12), bronze, 0.7, bodyY + 0.26, 0.2);
  add(new THREE.BoxGeometry(0.08, 0.05, 0.12), bronze, 0.7, bodyY + 0.26, -0.2);
  add(new THREE.CylinderGeometry(0.025, 0.02, 0.42, 8), bronze, -0.54, bodyY - 0.08, 0, { z: 0.35 });

  // Na superfície, à esquerda do templo, de perfil pra câmera
  const x = -2.9;
  const z = 4.6;
  const surfaceY =
    Math.sqrt(planetRadius * planetRadius - x * x - z * z) - planetRadius;
  bullGroup.position.set(x, surfaceY + 0.42, z);
  bullGroup.rotation.y = 0.55;
  bullGroup.scale.setScalar(SCALE);

  planetGroup.add(bullGroup);

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("click", onClick);

  const footerLink = document.getElementById("open-source-link");
  if (footerLink) {
    footerLink.addEventListener("click", (event) => {
      event.preventDefault();
      openOpenSource();
    });
  }

  return bullGroup;
}

function intersectsBull(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  return raycaster.intersectObject(bullGroup, true).length > 0;
}

function onMouseMove(event) {
  if (!bullGroup) return;
  if (window.starModalIsOpened || window.aboutMeShown) return;

  const over = intersectsBull(event);
  if (over) document.body.style.cursor = "pointer";

  if (over && !hovered) {
    hovered = true;
    gsap.to(bullGroup.scale, { x: SCALE * 1.06, y: SCALE * 1.06, z: SCALE * 1.06, duration: 0.3 });
  } else if (!over && hovered) {
    hovered = false;
    gsap.to(bullGroup.scale, { x: SCALE, y: SCALE, z: SCALE, duration: 0.3 });
  }
}

function onClick(event) {
  if (!bullGroup) return;
  if (window.starModalIsOpened || window.aboutMeShown) return;
  if (intersectsBull(event)) openOpenSource();
}

/**
 * Modal: projetos open source
 */
export function openOpenSource() {
  const existing = document.getElementById("openSourceModal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "openSourceModal";
  modal.classList.add("modal", "modal--reader");

  const closeButton = document.createElement("button");
  closeButton.classList.add("close-btn");
  closeButton.innerHTML = `<i class="fas fa-times"></i>`;
  closeButton.onclick = () => {
    modal.remove();
    window.starModalIsOpened = false;
    window.questTracker.bull = true;
    checkQuests();
    setRoute(null);
  };

  const panel = document.createElement("div");
  panel.classList.add("tablet");
  panel.innerHTML = `
    <header class="tablet__header">
      <span class="tablet__eyebrow">Ταῦρος · Open Source</span>
      <h1>Open Source</h1>
      <p>Tools I maintain for BullMQ — built at Monest because we needed them in production, and released because you probably do too.</p>
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
  setRoute("/open-source");
}
