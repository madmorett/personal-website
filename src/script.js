import "./style.css";
import "./sound";
import './scripts/close-modals-listener'

import * as THREE from "three";

import { createAboutMePanel, showAboutMe } from "./scripts/about-me";
import { createRocket, updateRocketParticles } from "./scripts/rocket";

import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { GUI } from "lil-gui";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { createSignpost, openProjects } from "./scripts/projects";
import { createWisdomTablet, openTablet } from "./scripts/wisdom-tablet";
import { initRouter } from "./scripts/router";
import { initReadingMode } from "./scripts/reading-mode";
import { initStars } from "./scripts/interactive-stars";
import { isMobile } from "./utils";
import { updateParallax } from "./scripts/parallax";

const gui = new GUI();

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

/**
 * Canvas
 */
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();
scene.background = null;
scene.fog = new THREE.Fog(0xffffff, 0, 750);


// Criar o grupo para o planeta e os objetos
const planetGroup = new THREE.Group();

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader();
const flagTexture = textureLoader.load("/textures/flag/brasil.jpeg");


/**
 * Fonts
 */
let groupText
const fontLoader = new FontLoader();
fontLoader.load("/fonts/Comic Neue_Bold.json", (font) => {
  const material = new THREE.MeshNormalMaterial();
  const fontSize = 0.5;
  const fontStyle = {
    font: font,
    size: fontSize,
    height: 0.2,
    curveSegments: 12,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.02,
    bevelOffset: 0,
    bevelSegments: 5,
  };

  const nameGeometry = new TextGeometry("Matheus Morett", fontStyle);
  nameGeometry.center();
  const nameMesh = new THREE.Mesh(nameGeometry, material);
  nameMesh.position.y = 3.5; // Ajustar a altura do nome acima do planeta

  const occupationGeometry = new TextGeometry("CTO @ Monest", fontStyle);
  occupationGeometry.center();
  const occupationMesh = new THREE.Mesh(occupationGeometry, material);
  occupationMesh.position.y = 2.5; // Ajustar a altura do nome acima do planeta

  groupText = new THREE.Group();
  groupText.add(nameMesh);
  groupText.add(occupationMesh);
  groupText.position.z = 3

  const folder = gui.addFolder("Text Position");
  folder.add(groupText.position, "x", -10, 10).name("Position X");
  folder.add(groupText.position, "y", -10, 10).name("Position Y");
  folder.add(groupText.position, "z", -10, 10).name("Position Z");
  folder.open();

  // Adiciona o texto ao grupo do planeta
  planetGroup.add(groupText);
});

/**
 * Planeta com texturas
 */
const platRadius = 120 / 2;
const normalMap = textureLoader.load("/textures/planets/Substance_graph_Normal.png");
const heightMap = textureLoader.load("/textures/planets/Substance_graph_Height.png");
const roughnessMap = textureLoader.load("/textures/planets/Substance_graph_Roughness.png");
const metallicMap = textureLoader.load("/textures/planets/Substance_graph_Metallic.png");
const aoMap = textureLoader.load("/textures/planets/Substance_graph_Ambient_Occlusion.png");

const planetMaterial = new THREE.MeshStandardMaterial({
  normalMap: normalMap,        // Usa apenas o normal map para criar relevos e detalhes de luz
  displacementMap: heightMap,  // Usar o displacement para criar o relevo
  displacementScale: 0.1,      // Escala do displacement
  roughnessMap: roughnessMap,  // Controle de rugosidade para reflexos
  roughness: 0.8,              // Ajustar rugosidade geral
  metalnessMap: metallicMap,   // Controle de efeito metálico
  metalness: 0.5,              // Ajustar efeito metálico
  aoMap: aoMap,                // Ambient Occlusion para sombras suaves
  aoMapIntensity: 1.0,         // Intensidade do ambient occlusion
  displacementScale: 1
});


const planetFolder = gui.addFolder('Planet Controls');
planetFolder.addColor(planetMaterial, 'color').name('Planet Color'); // Cor do planeta
planetFolder.add(planetMaterial, 'metalness', 0, 1).name('Metalness'); // Efeito metálico
planetFolder.add(planetMaterial, 'roughness', 0, 1).name('Roughness'); // Rugosidade
planetFolder.add(planetMaterial, 'displacementScale', 0, 1).name('Displacement Scale'); // Escala do displacement (altura)
planetFolder.add(planetMaterial, 'aoMapIntensity', 0, 3).name('AO Intensity'); // Intensidade da Ambient Occlusion
planetFolder.addColor(planetMaterial, 'emissive').name('Emissive Color'); // Cor de emissão
planetFolder.add(planetMaterial, 'emissiveIntensity', 0, 1).name('Emissive Intensity'); // Intensidade da emissão
planetFolder.open();

const planetGeometry = new THREE.SphereGeometry(platRadius, 64, 64);
const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
planetMesh.position.set(0, -platRadius, 0);
planetMesh.receiveShadow = true;
planetMesh.rotation.x = Math.PI / 2; // Ajuste no eixo X
planetMesh.rotation.y = Math.PI; // Ajuste no eixo Y
planetGroup.add(planetMesh);

/**
 * Flag
 */
const poleGeometry = new THREE.CylinderGeometry(0.12, 0.12, 3, 32);
const poleMaterial = new THREE.MeshPhongMaterial({
  color: "#ffcc99",
  specular: "#999999",
  shininess: 30,
});
const poleMesh = new THREE.Mesh(poleGeometry, poleMaterial);
poleMesh.castShadow = true;
poleMesh.position.set(-5, 0.4, 3);

const [sizeW, sizeH, segW, segH] = [1.5, 1, 10, 10];
const flagGeometry = new THREE.PlaneGeometry(sizeW, sizeH, segW, segH);
const flagMaterial = new THREE.MeshLambertMaterial({
  map: flagTexture,
  side: THREE.DoubleSide,
});
const flagMesh = new THREE.Mesh(flagGeometry, flagMaterial);
flagMesh.position.set(-4.2, 1.3, 2.95);
flagMesh.castShadow = true;

const flagGroup = new THREE.Group();
flagGroup.add(poleMesh);
flagGroup.add(flagMesh);
planetGroup.add(flagGroup); // Adicionar a bandeira ao grupo do planeta

// Adicionar o grupo à cena
scene.add(planetGroup);

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight("#FFFFFF", 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight("#FFFFFF", 0.85);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.position.set(0, 15, 15);
scene.add(directionalLight);
const blueLight = new THREE.PointLight(0x0000ff, 0.5); // Luz azul
blueLight.position.set(0, 15, 15);
scene.add(blueLight);

/**
 * GUI for Lights
 */
const lightFolder = gui.addFolder("Lights");

// Ambient Light controls
lightFolder.addColor(ambientLight, 'color').name('Ambient Light Color');
lightFolder.add(ambientLight, 'intensity', 0, 2).name('Ambient Intensity');

// Directional Light controls
lightFolder.addColor(directionalLight, 'color').name('Directional Light Color');
lightFolder.add(directionalLight, 'intensity', 0, 2).name('Directional Intensity');
lightFolder.add(directionalLight.position, 'x', -50, 50).name('Directional X');
lightFolder.add(directionalLight.position, 'y', -50, 50).name('Directional Y');
lightFolder.add(directionalLight.position, 'z', -50, 50).name('Directional Z');

// Blue Point Light controls
lightFolder.addColor(blueLight, 'color').name('Blue Light Color');
lightFolder.add(blueLight, 'intensity', 0, 2).name('Blue Light Intensity');
lightFolder.add(blueLight.position, 'x', -50, 50).name('Blue Light X');
lightFolder.add(blueLight.position, 'y', -50, 50).name('Blue Light Y');
lightFolder.add(blueLight.position, 'z', -50, 50).name('Blue Light Z');

lightFolder.open();

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100);
camera.position.y = isMobile ? 14.5 : 6.5;
camera.position.z = isMobile ? 30 : 12;
camera.rotation.x = -Math.PI / 7;
planetGroup.add(camera); // A câmera agora segue a rotação do planeta
initReadingMode(camera);

const cameraFolder = gui.addFolder("Camera Controls");
cameraFolder.add(camera.position, "x", -50, 50).name("Position X");
cameraFolder.add(camera.position, "y", -50, 50).name("Position Y");
cameraFolder.add(camera.position, "z", -50, 50).name("Position Z");
cameraFolder.add(camera.rotation, "x", -Math.PI, Math.PI).name("Rotation X");
cameraFolder.add(camera.rotation, "y", -Math.PI, Math.PI).name("Rotation Y");
cameraFolder.add(camera.rotation, "z", -Math.PI, Math.PI).name("Rotation Z");
cameraFolder.open();

/**
 * Models
 */
createRocket(planetGroup, camera, scene);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;

// Call the interactive stars module
initStars(scene, camera, renderer);

// A Tábua da Sabedoria (lista + leitor de artigos). Depois de initStars
// porque o listener de mousemove das estrelas reseta o cursor.
createWisdomTablet(planetGroup, camera, platRadius);

// A placa de projetos (coisas que eu mantenho)
createSignpost(planetGroup, camera, platRadius);

// Deep links: /#/articles/<slug> e /#/projects abrem direto na cena
initRouter({ articles: openTablet, projects: openProjects });

/**
 * Tamanho
 */
window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Create the About Me panel when the page loads
createAboutMePanel();

/**
 * Zoom no scroll com movimento leve de X e Y
 */
let cameraOffsetX = 0;
let cameraOffsetY = 0;
const maxOffset = 0.5; // O quanto a câmera pode se mover para esquerda/direita e cima/baixo
const zoomFocusOffsetY = 1; // O quanto o foco do zoom está acima (ajustar conforme desejado)
const cammeraOutToShowAboutMe = isMobile ? 50 : 30

let lastCameraPositionZ = camera.position.z; // Store the initial camera position

window.addEventListener("wheel", (event) => {
  // Com um modal aberto o scroll é do modal (o leitor de artigos é longo),
  // não da câmera — por isso o preventDefault vem depois desta checagem.
  if (window.aboutMeShown || window.starModalIsOpened) {
    return;
  }
  event.preventDefault();

  // Track the previous camera position
  const previousCameraPositionZ = camera.position.z;

  // Zoom in/out
  camera.position.z += event.deltaY * 0.1;
  camera.position.z = Math.min(Math.max(camera.position.z, 10), cammeraOutToShowAboutMe);

  // Only process the zoom actions if the camera position has actually changed
  if (camera.position.z !== previousCameraPositionZ) {
    // Mover a câmera levemente nos eixos X e Y conforme o zoom
    cameraOffsetX += event.deltaX * 0.002; // Movimento suave no eixo X
    cameraOffsetY += event.deltaY * 0.002; // Movimento suave no eixo Y

    // Limitar o movimento nos eixos X e Y
    cameraOffsetX = Math.min(Math.max(cameraOffsetX, -maxOffset), maxOffset);
    cameraOffsetY = Math.min(Math.max(cameraOffsetY, -maxOffset), maxOffset);

    // Ajustar a posição da câmera com o foco acima
    camera.position.x = cameraOffsetX;
    camera.position.y = (camera.position.z / 10) * 4.5 + cameraOffsetY + zoomFocusOffsetY; // Ajustar a altura para o foco acima

    camera.updateProjectionMatrix();

    // If camera has zoomed out far enough, show "About Me"
    if (camera.position.z >= cammeraOutToShowAboutMe && lastCameraPositionZ !== camera.position.z) {
      showAboutMe();
      window.aboutMeShown = true;
    }
  }

  // Update the last known camera position
  lastCameraPositionZ = camera.position.z;
});



/**
 * Estrelas
 */
const starsList = [];
export function createStars() {
  const starGeometry = new THREE.SphereGeometry(0.05, 24, 24);
  const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

  const starCount = 2000;
  const radius = 125;

  for (let i = 0; i < starCount; i++) {
    const star = new THREE.Mesh(starGeometry, starMaterial);
    star.position.x = (Math.random() - 0.5) * radius;
    star.position.y = (Math.random() - 0.5) * radius;
    star.position.z = (Math.random() - 0.5) * radius;
    starsList.push(star);
    scene.add(star);
  }
}

/**
 * Mini gravidade
 */
let gravitySpeed = 1; // Velocidade de flutuação
let gravityAmplitude = 0.1; // Amplitude da flutuação


/**
 * Animação
 */
const clock = new THREE.Clock();
const tick = () => {
  // Rotacionar o grupo do planeta e seus objetos
  planetGroup.rotation.y += 0.0003;

  // Atualizar o parallax
  updateParallax(camera);

  // Clock
  const elapsedTime = clock.getElapsedTime();

  // Gravidade texto
  if (groupText) {
    groupText.position.y = Math.sin(elapsedTime * gravitySpeed) * gravityAmplitude;
  }


  // Mover estrelas para simular o movimento de esquerda para direita ao fundo
  for (const star of starsList) {
    star.position.x += 0.01; // Movimentação para a direita
    star.position.z += 0.01; // Movimentação ao fundo

    // Se a estrela passar de uma certa posição, ela volta ao ponto inicial
    if (star.position.x > 250) {
      star.position.x = -250;
    }
    if (star.position.z > 250) {
      star.position.z = -250;
    }
  }

  // Update flag
  for (
    var i = 2;
    i < flagMesh.geometry.attributes.position.array.length;
    i += 3
  ) {
    const x = flagMesh.geometry.attributes.position.array[i - 2];
    const y = flagMesh.geometry.attributes.position.array[i - 1];
    const waveX1 = 0.001 * Math.sin(x + elapsedTime);
    const waveX2 = 0.25 * Math.sin(x * 3 + elapsedTime * 2);
    const waveY1 = 0.1 * Math.sin(y * 5 + elapsedTime * 0.5);
    const multi = (x + 2.5) / 5;
    flagMesh.geometry.attributes.position.array[i] =
      (waveX1 + waveX2 + waveY1) * multi;
  }

  flagMesh.geometry.attributes.position.needsUpdate = true;

  updateRocketParticles(); // Atualiza a posição das partículas de fogo do foguete

  // Render (pausado enquanto o usuário está na dimensão de leitura)
  if (!window.readingMode) renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

gui.hide()

tick();
createStars();
