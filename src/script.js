import "./style.css";
import "./scripts/navigation";

// Three.js — lazy loaded for smaller initial bundle
const canvas = document.querySelector("canvas.webgl");
import(/* webpackChunkName: "particles" */ "./scripts/particles").then(({ initParticles }) => {
  initParticles(canvas);
});

// ============================================
// Reveal hero elements when Three.js is ready
// ============================================
window.addEventListener("three-ready", () => {
  revealHeroElements();
  startTypedText();
});

// Fallback: if Three.js takes too long, reveal anyway
setTimeout(() => {
  revealHeroElements();
  startTypedText();
}, 3000);

// ============================================
// Reveal animations (IntersectionObserver)
// ============================================
let heroRevealed = false;

function revealHeroElements() {
  if (heroRevealed) return;
  heroRevealed = true;
  document.querySelectorAll(".hero__content [data-reveal]").forEach((el) => {
    el.classList.add("revealed");
  });
}

// Sections below hero — reveal on scroll
const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("revealed");
        sectionObserver.unobserve(entry.target);

        // Trigger scramble on stats when About section reveals
        if (entry.target.id === "about") {
          entry.target.querySelectorAll("[data-scramble]").forEach((el) => {
            scrambleText(el);
          });
        }
      }
    });
  },
  { threshold: 0.15 }
);

document.querySelectorAll(".section[data-reveal]").forEach((section) => {
  sectionObserver.observe(section);
});

// ============================================
// Typed text effect
// ============================================
let typedStarted = false;

function startTypedText() {
  if (typedStarted) return;
  typedStarted = true;

  const el = document.querySelector("[data-typed]");
  if (!el) return;

  const text = el.getAttribute("data-typed");
  const cursor = document.createElement("span");
  cursor.className = "typed-cursor";
  el.appendChild(cursor);

  let i = 0;
  const speed = 45; // ms per character

  function type() {
    if (i < text.length) {
      el.insertBefore(document.createTextNode(text.charAt(i)), cursor);
      i++;
      setTimeout(type, speed);
    } else {
      // Remove cursor after a pause
      setTimeout(() => {
        cursor.style.animation = "none";
        cursor.style.opacity = "0";
        cursor.style.transition = "opacity 0.5s";
      }, 2000);
    }
  }

  type();
}

// ============================================
// Scramble text effect (terminal-style decode)
// ============================================
const SCRAMBLE_CHARS = "0123456789!@#$%&*";

function scrambleText(el) {
  const finalText = el.getAttribute("data-scramble");
  const duration = 600; // ms
  const fps = 30;
  const totalFrames = Math.round((duration / 1000) * fps);
  let frame = 0;

  function update() {
    let output = "";
    for (let i = 0; i < finalText.length; i++) {
      // Characters resolve left-to-right
      const charProgress = frame / totalFrames;
      const charThreshold = i / finalText.length;

      if (charProgress > charThreshold) {
        output += finalText[i];
      } else {
        output += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
      }
    }
    el.textContent = output;
    frame++;

    if (frame <= totalFrames) {
      requestAnimationFrame(update);
    } else {
      el.textContent = finalText;
    }
  }

  // Start with scrambled
  el.textContent = Array.from(finalText)
    .map(() => SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)])
    .join("");
  requestAnimationFrame(update);
}

// ============================================
// Magnetic 3D card tilt (desktop only)
// ============================================
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

if (!isMobile) {
  document.querySelectorAll(".article-card").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Rotation: max ±8 degrees
      const rotateX = ((y - centerY) / centerY) * -8;
      const rotateY = ((x - centerX) / centerX) * 8;

      // Light position (percentage for radial gradient)
      const lightX = (x / rect.width) * 100;
      const lightY = (y / rect.height) * 100;

      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
      card.style.setProperty("--light-x", `${lightX}%`);
      card.style.setProperty("--light-y", `${lightY}%`);
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
      card.style.setProperty("--light-x", "50%");
      card.style.setProperty("--light-y", "50%");
    });
  });
}

// ============================================
// Console Easter Egg
// ============================================
console.log(
  `%c
  ███╗   ███╗ ██████╗ ██████╗ ███████╗████████╗████████╗
  ████╗ ████║██╔═══██╗██╔══██╗██╔════╝╚══██╔══╝╚══██╔══╝
  ██╔████╔██║██║   ██║██████╔╝█████╗     ██║      ██║
  ██║╚██╔╝██║██║   ██║██╔══██╗██╔══╝     ██║      ██║
  ██║ ╚═╝ ██║╚██████╔╝██║  ██║███████╗   ██║      ██║
  ╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝   ╚═╝      ╚═╝
`,
  "color: #6366F1; font-family: monospace;"
);
console.log(
  "%cYou check the console. I like that.\n%cLet's talk → linkedin.com/in/matheusmorett",
  "color: #E8E8EC; font-size: 14px; font-weight: bold;",
  "color: #818CF8; font-size: 13px;"
);
