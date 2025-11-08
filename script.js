const TOTAL_DOORS = 24;
const doorLayer = document.getElementById("doorLayer");

if (!doorLayer) {
  throw new Error("Element mit id=\"doorLayer\" wurde nicht gefunden.");
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
  button.addEventListener("click", () => {
    button.classList.add("door-button--active");
    setTimeout(() => button.classList.remove("door-button--active"), 500);
  });

  doorLayer.appendChild(button);
}

doorLayer.replaceChildren();
for (let day = 1; day <= TOTAL_DOORS; day += 1) {
  createDoor(day);
}
