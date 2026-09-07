import confetti from 'canvas-confetti'; // You'll need a confetti library
import { isMobile } from '../utils';

window.questTracker = {
  rocket: false,
  aboutMe: false,
  star1: false,
  star2: false,
  star3: false,
};

window.totalQuests = 5

if (window.alreadyShowConfetti === undefined) {
  window.alreadyShowConfetti = false
}


function showConfetti() {
  // Create a confetti canvas
  const confettiCanvas = document.createElement("canvas");
  confettiCanvas.id = "confettiCanvas";
  confettiCanvas.style.position = "fixed";
  confettiCanvas.style.top = 0;
  confettiCanvas.style.left = 0;
  confettiCanvas.style.width = "100vw";
  confettiCanvas.style.height = "100vh";
  confettiCanvas.style.pointerEvents = "none"; // Ensures confetti doesn’t interfere with user interaction
  confettiCanvas.style.zIndex = 2000; // High enough to appear over modals
  document.body.appendChild(confettiCanvas);

  const myConfetti = confetti.create(confettiCanvas, {
    resize: true,
    useWorker: true
  });

  // Fire the confetti
  myConfetti({
    particleCount: 500,
    spread: 150,
    origin: { y: 0.6 },
  });

  // Remove the canvas after a few seconds
  setTimeout(() => {
    document.body.removeChild(confettiCanvas);
  }, 5000); // Confetti lasts for 5 seconds
}


function showCompletionMessage() {
  const modal = document.createElement("div");
  modal.id = "completionModal";
  modal.classList.add("modal");

  const closeButton = document.createElement("button");
  closeButton.classList.add("close-btn");
  closeButton.innerHTML = `<i class="fas fa-times"></i>`;
  closeButton.onclick = () => {
    window.starModalIsOpened = false;
    document.body.removeChild(modal);
  };

  const content = document.createElement("div");
  content.classList.add("stars-content")

  content.innerHTML = `
    <h1>Congratulations!</h1>
    <p>You've completed all hidden quests.</p>
    <br>
    <img width="350px" alt="Me and my dad very happy" src="https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExaGNuMDFoeGpqdTNsMTRsendueTVpZzk4eTdlZmc4bnZwcGY5ZWNxZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/0v1SjDrCSzf5BAov0Y/giphy.webp" />
    <p>Now you know me very well, don't hesitate to contact so we can crush some projects. =)</p>
  `;
  window.starModalIsOpened = true;

  modal.appendChild(closeButton);
  modal.appendChild(content);

  modal.style.display = "flex";
  document.body.appendChild(modal);
}


export function checkQuests() {
  // Count completed quests
  window.completedQuests = Object.values(window.questTracker).filter(Boolean).length;

  updateCompletionTracker()

  if (window.completedQuests === window.totalQuests && window.alreadyShowConfetti === false) {
    window.alreadyShowConfetti = true
    showConfetti();
    showCompletionMessage();
  }
}


// Show tracker position
function createCompletionTracker() {
  const tracker = document.createElement("div");
  tracker.id = "completionTracker";
  tracker.innerHTML = "0/5 hidden quests completed"; // Initial state
  document.body.appendChild(tracker);
  return tracker;
}

function updateCompletionTracker() {
  const tracker = document.getElementById("completionTracker");

  // Update the text
  tracker.innerHTML = `${window.completedQuests}/${totalQuests} hidden quests completed`;

  // Trigger the pop animation
  tracker.classList.add("completed");

  // Remove the animation class after a brief delay
  setTimeout(() => {
    tracker.classList.remove("completed");
  }, 250); // 0.5s duration for the pop effect

  // Check if all quests are completed
  if (window.completedQuests === totalQuests) {
    tracker.innerHTML = `Well done!`;
  }
}

if (!isMobile) {
  createCompletionTracker()
}
