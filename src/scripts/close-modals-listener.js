window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    // Find all modals with class 'modal'
    const openModals = document.querySelectorAll(".modal");

    openModals.forEach((modal) => {
      // Check if the modal is displayed (i.e., its display is 'flex')
      if (window.getComputedStyle(modal).display === "flex") {
        // Find the close button inside the modal
        const closeButton = modal.querySelector(".close-btn");
        if (closeButton) {
          closeButton.click(); // Trigger the click event on the close button
        }
      }
    });
  }
});