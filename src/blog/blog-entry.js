import "./blog.css";

// Add copy buttons to code blocks
document.querySelectorAll("pre code").forEach((block) => {
  const button = document.createElement("button");
  button.textContent = "Copy";
  button.className = "copy-code-btn";
  button.addEventListener("click", () => {
    navigator.clipboard.writeText(block.textContent);
    button.textContent = "Copied!";
    setTimeout(() => {
      button.textContent = "Copy";
    }, 2000);
  });
  block.parentElement.style.position = "relative";
  block.parentElement.appendChild(button);
});
