const musicCredit = document.getElementById("music-by");
const music = document.getElementById("music");
music.volume = 0.5;
const volumeOnButton = document.getElementById("volume-on");
const volumeOffButton = document.getElementById("volume-off");
volumeOffButton.addEventListener("click", () => {
  volumeOffButton.style.display = "none";
  volumeOnButton.style.display = "block";
  musicCredit.style.opacity = 0.7;
  music.play();
});
volumeOnButton.addEventListener("click", () => {
  volumeOnButton.style.display = "none";
  volumeOffButton.style.display = "block";
  musicCredit.style.opacity = 0;
  music.pause();
});
