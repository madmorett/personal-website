import { checkQuests } from "./gamification";

export function createAboutMePanel() {
  const panel = document.createElement("div");
  panel.id = "aboutMePanel";
  panel.classList.add("modal");

  const closeButton = document.createElement("button");
  closeButton.classList.add("close-btn");
  closeButton.innerHTML = `<i class="fas fa-times"></i>`;
  closeButton.onclick = closeAboutMe;

  const aboutContent = document.createElement("div");
  aboutContent.classList.add("about-content");

  const heading = document.createElement("h1");
  heading.textContent = "About Me";

  const experienceYears = new Date().getFullYear() - 2016;

  const aboutMeText = `
    Hi, I'm Matheus Morett, CTO at Monest and an engineer with over ${experienceYears} years in the industry.
    I wrote my first line of code in January 2014 and never stopped shipping.
    <br><br>
    I've built products with early and late-stage startups, reaching millions of users.
    These days my job is less about writing every line and more about the system around it:
    how teams are structured, how decisions get made, and why organizations behave the way they do.
    <br><br>
    I grew an engineering org from 10 to 50+ people with 6 tech leads. Most of what I learned came
    from getting it wrong first — that's what I write about.
    <br><br>
    My roots are TypeScript, React, and Node. I still care deeply about scalable, testable,
    maintainable software: solutions that work today and still stand years from now.
    <br><br>
    The little temple on this planet holds my articles; the bronze bull, my open source work. Click them.
  `;


  const paragraph = document.createElement("p");
  paragraph.innerHTML = aboutMeText;

  aboutContent.appendChild(heading);
  aboutContent.appendChild(paragraph);
  panel.appendChild(closeButton);
  panel.appendChild(aboutContent);

  document.body.appendChild(panel);
}

export function showAboutMe() {
  const panel = document.getElementById("aboutMePanel");
  if (panel) {
    panel.style.display = "flex";
  }
}

function closeAboutMe() {
  const panel = document.getElementById("aboutMePanel");
  
  window.questTracker.aboutMe = true;
  checkQuests();
  
  if (panel) {
    panel.style.display = "none";
    setTimeout(() => {
      window.aboutMeShown = false;
    }, 100)
  }
}