import * as THREE from "three";

import { GUI } from "lil-gui";
import { checkQuests } from "./gamification";
import { gsap } from "gsap";

let stars = [];
const starCount = 3;
let raycaster, camera, scene, renderer;
const gui = new GUI();
const starFolders = [];
let mouse = new THREE.Vector2(); // For storing the mouse coordinates

// Exported function to initialize the stars
export function initStars(sceneRef, cameraRef, rendererRef) {
  scene = sceneRef;
  camera = cameraRef;
  renderer = rendererRef;

  raycaster = new THREE.Raycaster();

  // Listen for clicks and mouse movement on stars
  window.addEventListener("click", onClick);

  return createInteractiveStars();
}

function createInteractiveStars() {
  const starGeometry = new THREE.SphereGeometry(0.05, 32, 32); // Smaller size for stars
  const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 }); // Yellow color

  for (let i = 0; i < starCount; i++) {
    const star = new THREE.Mesh(starGeometry, starMaterial);

    if (i === 0) {
      star.position.set(-6.2, 3.8, 1.13);
    }

    if (i === 1) {
      star.position.set(0.64, 5, 1.13);
    }

    if (i === 2) {
      star.position.set(6.24, 3.4, 1.13);
    }

    scene.add(star);
    stars.push(star);

    gsap.to(star.material.color, {
      r: 1,
      g: 1,
      b: 0.5, // Make the yellow glow
      duration: 0.5,
      repeat: -1,
      yoyo: true, // Create a pulsating effect
      ease: "power1.inOut",
    });

    star.userData = { index: i };
    star.interactive = true;

    // Create a folder in the GUI for each star
    const folder = gui.addFolder(`Star ${i + 1}`);
    folder.add(star.scale, 'x', 0.1, 1).name('Scale X');
    folder.add(star.scale, 'y', 0.1, 1).name('Scale Y');
    folder.add(star.scale, 'z', 0.1, 1).name('Scale Z');
    folder.add(star.position, 'x', -20, 20).name('Position X');
    folder.add(star.position, 'y', -10, 10).name('Position Y');
    folder.add(star.position, 'z', -10, 10).name('Position Z');
    folder.open();

    starFolders.push(folder);
  }

  window.addEventListener("mousemove", (event) => {
    // Update mouse position based on movement
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the raycaster with the mouse position
    raycaster.setFromCamera(mouse, camera);

    // Check intersections for stars and rocket
    const intersectsWithStar1 = raycaster.intersectObject(stars[0], true);
    const intersectsWithStar2 = raycaster.intersectObject(stars[1], true);
    const intersectsWithStar3 = raycaster.intersectObject(stars[2], true);

    // Change the cursor style based on the intersection
    if (intersectsWithStar1.length > 0 || intersectsWithStar2.length > 0 ||
      intersectsWithStar3.length > 0) {
      document.body.style.cursor = "pointer";
    } else {
      document.body.style.cursor = "default";
    }
  });

  return stars;
}

// Handle star click
function onClick(event) {
  updateMousePosition(event);
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(stars, true);

  if (intersects.length > 0) {
    const star = intersects[0].object;
    if (star.interactive) {
      createStarClickModal(star.userData.index);
    }
  }
}


// Update mouse position based on the event
function updateMousePosition(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

const CONTENT_0 = `
  My favorite music genre is Metal, my favorite band is Angra. <br><br>
  <img src="/images/angra.jpeg" width="350' alt="Me with my friend at Angra concert" />
`

const CONTENT_1 = `
  I root for a club called A.A. Iguaçu. <br><br>
  <img src="/images/iguacu.jpeg" width="350' alt="Me with A.A. Iguaçu jersey" />
`

const CONTENT_2 = `
  I lived in Europe as a Digital Nomad for a year, my favorite country was Bosnia and Herzegovina.<br><br>
  <img src="/images/bosnia.jpeg" width="350' alt="Me at Bosnia and Herzegovina" />
`

window.starModalIsOpened = false

// Create a modal on star click
function createStarClickModal(index) {
  const modal = document.createElement("div");
  modal.id = `starModal-${index}`;
  modal.classList.add("modal");
  const closeButton = document.createElement("button");
  closeButton.classList.add('close-btn')
  closeButton.innerHTML = `<i class="fas fa-times"></i>`;
  closeButton.onclick = () => {
    document.body.removeChild(modal);

    // Mark the quest complete when modal is closed
    if (index === 0) {
      window.questTracker.star1 = true;
    } else if (index === 1) {
      window.questTracker.star2 = true;
    } else if (index === 2) {
      window.questTracker.star3 = true;
    }

    window.starModalIsOpened = false;

    checkQuests(); // Update progress when a star quest is completed
  };

  const paragraph = document.createElement("p");
  paragraph.classList.add("stars-content")

  if (index === 0) {
    paragraph.innerHTML = CONTENT_0;
  }

  if (index === 1) {
    paragraph.innerHTML = CONTENT_1;
  }

  if (index === 2) {
    paragraph.innerHTML = CONTENT_2;
  }

  modal.appendChild(closeButton);
  modal.appendChild(paragraph);
  modal.style.display = "flex";
  window.starModalIsOpened = true;
  document.body.appendChild(modal);
}

gui.hide()