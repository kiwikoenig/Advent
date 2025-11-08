const TOTAL_DOORS = 24;
const doorLayer = document.getElementById("doorLayer");
const modal = document.getElementById("imageModal");
const modalTitle = document.getElementById("modalTitle");
const modalImage = document.getElementById("modalImage");
const closeModalButton = document.getElementById("closeModal");
const modalBackdrop = document.querySelector(".modal-backdrop");

if (!doorLayer || !modal || !modalTitle || !modalImage || !closeModalButton || !modalBackdrop) {
  throw new Error("Benötigte Adventskalender-Elemente wurden nicht gefunden.");
}

function jitter(range) {
  return Math.random() * range * 2 - range;
}

function createDoor(day) {
  const rows = 4;
  const cols = 6;
  const index = day - 1;
  const row = Math.floor(index / cols);
  const col = index % cols;

  const topBase = 14 + (row / (rows - 1)) * 72;
  const leftBase = 10 + (col / (cols - 1)) * 80;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "door-button";
  button.style.top = `${topBase + jitter(2)}%`;
  button.style.left = `${leftBase + jitter(2.5)}%`;
  button.textContent = day.toString().padStart(2, "0");
  button.setAttribute("aria-label", `Türchen ${day}`);
  button.addEventListener("click", () => openModal(day));

  doorLayer.appendChild(button);
}

doorLayer.replaceChildren();
for (let day = 1; day <= TOTAL_DOORS; day += 1) {
  createDoor(day);
}

function openModal(day) {
  modalTitle.textContent = `Türchen ${day.toString().padStart(2, "0")}`;
  modalImage.src = `Bilder/${day}.png`;
  modalImage.alt = `Bild ${day}`;
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modal.classList.add("hidden");
  document.body.style.overflow = "";
  modalImage.removeAttribute("src");
  modalImage.removeAttribute("alt");
}

closeModalButton.addEventListener("click", closeModal);
modal.addEventListener("click", (event) => {
  if (event.target.dataset.close !== undefined || event.target === modal || event.target === modalBackdrop) {
    closeModal();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal.classList.contains("hidden")) {
    closeModal();
  }
});
