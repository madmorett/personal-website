import * as THREE from "three";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { checkQuests } from "./gamification";
import { gsap } from "gsap";

let rocketMesh;
let particles = [];

// Função para criar as partículas de fogo
function createFireParticles(scene) {
  const particleCount = 5; // Número de partículas para criar de uma vez
  const spread = 0.3; // Distância de espalhamento ao redor da base do foguete

  for (let i = 0; i < particleCount; i++) {
    const particleGeometry = new THREE.SphereGeometry(0.05, 6, 6); // Pequeninas esferas
    const particleMaterial = new THREE.MeshBasicMaterial({ color: 0xff4500 }); // Cor laranja de fogo

    const particle = new THREE.Mesh(particleGeometry, particleMaterial);

    // Posicionar a partícula na posição do foguete
    particle.position.copy(rocketMesh.position);

    // Ajustar a posição da partícula para que se espalhe ao redor do foguete
    particle.position.x += (Math.random() - 0.5) * spread; // Espalha no eixo X
    particle.position.y -= 0.5; // Ajustar para ficar abaixo do foguete
    particle.position.z += (Math.random() - 0.5) * spread; // Espalha no eixo Z

    scene.add(particle);

    // Adiciona a partícula à lista para animar depois
    particles.push(particle);

    // Remover partícula após um tempo para não sobrecarregar a cena
    setTimeout(() => {
      scene.remove(particle);
      particles = particles.filter(p => p !== particle); // Remove da lista
    }, 500); // Partícula "vive" por 500ms
  }
}


// Atualizar as partículas para simular movimento para baixo
export function updateRocketParticles() {
  particles.forEach(particle => {
    particle.position.y -= 0.05; // Faz a partícula cair
    particle.scale.multiplyScalar(0.95); // Diminui o tamanho para simular dissipação
  });
}

// Função para criar partículas de explosão
function createExplosion(scene) {
  const explosionCount = 20; // Número de partículas na explosão
  const explosionSpread = 1.5; // O quanto a explosão se espalha

  for (let i = 0; i < explosionCount; i++) {
    const particleGeometry = new THREE.SphereGeometry(0.05, 8, 8); // Esferas pequenas
    const particleMaterial = new THREE.MeshBasicMaterial({ color: 0xffa500 }); // Laranja para simular explosão

    const particle = new THREE.Mesh(particleGeometry, particleMaterial);

    // Posicionar partícula na posição do foguete (abaixo dele)
    particle.position.copy(rocketMesh.position);
    particle.position.y -= 0.5;

    // Velocidade inicial aleatória para as partículas da explosão
    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * explosionSpread,
      (Math.random() - 0.5) * explosionSpread,
      (Math.random() - 0.5) * explosionSpread
    );

    particle.velocity = velocity; // Atribuir a velocidade à partícula

    scene.add(particle);

    // Animação da partícula de explosão
    gsap.to(particle.position, {
      x: particle.position.x + velocity.x * explosionSpread,
      y: particle.position.y + velocity.y * explosionSpread,
      z: particle.position.z + velocity.z * explosionSpread,
      duration: 1.5, // Duração da explosão
      ease: "power2.out", // Efeito de desaceleração
      onComplete: () => {
        // Remover a partícula da cena após a animação
        scene.remove(particle);
      },
    });

    // Adicionar uma leve dissipação nas partículas (diminuir ao longo do tempo)
    gsap.to(particle.scale, {
      x: 0.1,
      y: 0.1,
      z: 0.1,
      duration: 1.5,
      ease: "power2.out",
    });
  }
}

// Função para animar o foguete subindo com partículas de fogo
function animateRocket(scene) {
  createExplosion(scene); // Criar a explosão antes de o foguete subir

  gsap.to(rocketMesh.position, {
    y: 30, // Faz o foguete subir para a posição Y = 30
    duration: 2, // A duração da animação (em segundos)
    ease: "power2.inOut",  // Efeito de aceleração
    onUpdate: () => createFireParticles(scene), // Criar partículas durante a animação
  });

  setTimeout(() => {
    window.questTracker.rocket = true;
    checkQuests(); // Call after the rocket animation finishes
  }, 200)

  // Animação de contração no eixo Y
  gsap.to(rocketMesh.scale, {
    y: 0.015, // Simular contração no eixo Y enquanto sobe
    duration: 0.5,
    repeat: false, // Repetir indefinidamente
  });
}


// GFLT - Carregar o foguete
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(); // Para armazenar as coordenadas do mouse

export function createRocket(planetGroup, camera, scene) {
  // Carregar o foguete com o GLTFLoader
  const gltfLoader = new GLTFLoader();
  gltfLoader.load("/models/rocket.gltf", (gltf) => {
    rocketMesh = gltf.scene;
    rocketMesh.traverse(function (node) {
      if (node.isMesh) {
        node.castShadow = true;
      }
    });
    rocketMesh.scale.set(0.012, 0.012, 0.012);
    rocketMesh.position.y = 0.85;
    rocketMesh.position.z = 3.2;
    rocketMesh.position.x = 4.23;
    rocketMesh.castShadow = true;

    // Adiciona o foguete ao grupo do planeta
    planetGroup.add(rocketMesh);

    window.addEventListener("mousemove", (event) => {
      // Update mouse position based on movement
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
      // Update the raycaster with the mouse position
      raycaster.setFromCamera(mouse, camera);
    
      // Check intersections for stars and rocket
      const intersectsWithRocketMesh = raycaster.intersectObject(rocketMesh, true);
    
      // Change the cursor style based on the intersection
      if (intersectsWithRocketMesh.length > 0) {
        document.body.style.cursor = "pointer";
      }
    });
  });

  // Detectar clique no foguete
  const audioRocket = new Audio("/sound/rocket.mp3"); // Carregar o som do foguete
  window.addEventListener("click", (event) => {
    // Atualiza a posição do mouse com base no clique
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Atualiza o raycaster com a posição do mouse
    raycaster.setFromCamera(mouse, camera);

    // Detecta as interseções
    const intersects = raycaster.intersectObject(rocketMesh, true);

    if (intersects.length > 0) {
      // Se houver interseção, anima o foguete
      audioRocket.volume = 0.3
      audioRocket.play();
      animateRocket(scene);
    }
  });

  return rocketMesh
}
