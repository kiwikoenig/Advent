const TOTAL_DOORS = 24;
const SPECIAL_GAME_DOORS = new Set([1, 7, 13, 19]);

const doorLayer = document.getElementById("doorLayer");
const modal = document.getElementById("imageModal");
const modalTitle = document.getElementById("modalTitle");
const modalImage = document.getElementById("modalImage");
const closeModalButton = document.getElementById("closeModal");
const modalBackdrop = modal?.querySelector(".modal-backdrop");

const gameModal = document.getElementById("gameModal");
const closeGameButton = document.getElementById("closeGame");
const startGameButton = document.getElementById("startGame");
const gameCanvas = document.getElementById("gameCanvas");
const gameProgress = document.getElementById("gameProgress");
const gameMessage = document.getElementById("gameMessage");
const gameBackdrop = gameModal?.querySelector(".modal-backdrop");

if (
  !doorLayer ||
  !modal ||
  !modalTitle ||
  !modalImage ||
  !closeModalButton ||
  !modalBackdrop ||
  !gameModal ||
  !closeGameButton ||
  !startGameButton ||
  !gameCanvas ||
  !gameProgress ||
  !gameMessage ||
  !gameBackdrop
) {
  throw new Error("Benötigte Adventskalender-Elemente wurden nicht gefunden.");
}

let pendingDoor = null;

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
  button.addEventListener("click", () => handleDoorSelection(day));

  doorLayer.appendChild(button);
}

doorLayer.replaceChildren();
for (let day = 1; day <= TOTAL_DOORS; day += 1) {
  createDoor(day);
}

function handleDoorSelection(day) {
  if (SPECIAL_GAME_DOORS.has(day)) {
    pendingDoor = day;
    openGameModal(day);
  } else {
    openModal(day);
  }
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

// Mini-Spiel Logik
const ctx = gameCanvas.getContext("2d");
const horseImage = new Image();
horseImage.src = "Bilder/Spiel1.png";

const HORSE = { x: gameCanvas.width - 350, y: 0, width: 200, height: 140, velocity: 0 };
const GRAVITY = 0.48;
const JUMP = -22;
const SPEED = 4.2;
const REQUIRED_JUMPS = 5;

const backgroundImage = new Image();
backgroundImage.src = "Bilder/Spiel1Backround.png";
const fenceImage = new Image();
fenceImage.src = "Bilder/Zaun.png";

let groundLevel = gameCanvas.height - 40;
let obstacles = [];
let cleared = 0;
let gameActive = false;
let animationFrameId = null;

function openGameModal(day) {
  resetGameState();
  gameMessage.textContent = `Türchen ${day.toString().padStart(2, "0")}: Schaffe 10 Sprünge!`;
  gameModal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeGameModal() {
  stopGameLoop();
  gameModal.classList.add("hidden");
  document.body.style.overflow = "";
  resetGameState();
  pendingDoor = null;
}

function resetGameState() {
  HORSE.x = gameCanvas.width - 350;
  HORSE.y = groundLevel - HORSE.height;
  HORSE.velocity = 0;
  obstacles = [];
  cleared = 0;
  updateGameProgress();
  gameMessage.textContent = "Bereit?";
  startGameButton.disabled = false;
  startGameButton.textContent = "Spiel starten";
}

function updateGameProgress() {
  gameProgress.textContent = `Fortschritt: ${cleared} / ${REQUIRED_JUMPS}`;
}

function spawnObstacle(initialX) {
  const width = 52;
  const height = 70;
  const gap = 900 + Math.random() * 260;
  const x = initialX ?? (obstacles.length ? obstacles[obstacles.length - 1].x - gap : -80);
  obstacles.push({ x, width, height, counted: false });
}

function startGameLoop() {
  if (gameActive) return;
  resetGameState();
  gameActive = true;
  startGameButton.disabled = true;
  startGameButton.textContent = "Läuft...";
  gameMessage.textContent = "Springe!";
  obstacles = [];
  spawnObstacle(-40);
  spawnObstacle(-980);
  animationFrameId = requestAnimationFrame(updateGame);
}

function stopGameLoop() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  gameActive = false;
  startGameButton.disabled = false;
  startGameButton.textContent = "Erneut versuchen";
}

function updateGame() {
  animationFrameId = requestAnimationFrame(updateGame);
  ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
  if (backgroundImage.complete && backgroundImage.naturalWidth > 0) {
    ctx.drawImage(backgroundImage, 0, 0, gameCanvas.width, gameCanvas.height);
  }

  // Boden
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(0, groundLevel, gameCanvas.width, 4);

  // Hindernisse
  for (const obstacle of obstacles) {
    obstacle.x += SPEED;
    if (fenceImage.complete && fenceImage.naturalWidth > 0) {
      ctx.drawImage(
        fenceImage,
        obstacle.x,
        groundLevel - obstacle.height,
        obstacle.width,
        obstacle.height
      );
    } else {
      ctx.fillStyle = "rgba(255, 214, 153, 0.7)";
      ctx.fillRect(obstacle.x, groundLevel - obstacle.height, obstacle.width, obstacle.height);
    }

    if (!obstacle.counted && obstacle.x > HORSE.x + HORSE.width) {
      obstacle.counted = true;
      cleared += 1;
      updateGameProgress();
      if (cleared >= REQUIRED_JUMPS) {
        return handleGameWin();
      }
    }

    if (isColliding(obstacle)) {
      return handleGameFail();
    }
  }

  if (obstacles.length && obstacles[obstacles.length - 1].x > 220) {
    spawnObstacle();
  }

  obstacles = obstacles.filter((obstacle) => obstacle.x < gameCanvas.width + 60);

  // Physik Pferd
  HORSE.velocity += GRAVITY;
  HORSE.y += HORSE.velocity;
  if (HORSE.y >= groundLevel - HORSE.height) {
    HORSE.y = groundLevel - HORSE.height;
    HORSE.velocity = 0;
  }

  // Pferd zeichnen
  if (horseImage.complete && horseImage.naturalWidth > 0) {
    ctx.drawImage(horseImage, HORSE.x, HORSE.y, HORSE.width, HORSE.height);
  } else {
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillRect(HORSE.x, HORSE.y, HORSE.width, HORSE.height);
  }
}

function isColliding(obstacle) {
  return (
    HORSE.x < obstacle.x + obstacle.width &&
    HORSE.x + HORSE.width > obstacle.x &&
    HORSE.y + HORSE.height > groundLevel - obstacle.height
  );
}

function handleGameWin() {
  stopGameLoop();
  gameMessage.textContent = "Geschafft! Türchen öffnet sich.";
  startGameButton.disabled = true;
  setTimeout(() => {
    const wonDoor = pendingDoor;
    pendingDoor = null;
    if (wonDoor) {
      gameModal.classList.add("hidden");
      document.body.style.overflow = "";
      resetGameState();
      openModal(wonDoor);
    }
  }, 800);
}

function handleGameFail() {
  stopGameLoop();
  gameMessage.textContent = "Oh nein! Versuch es nochmal.";
}

function handleJump(event) {
  if (!gameActive) return;
  if (event.code === "Space") {
    event.preventDefault();
    if (HORSE.y >= groundLevel - HORSE.height) {
      HORSE.velocity = JUMP;
    }
  }
}

startGameButton.addEventListener("click", startGameLoop);
window.addEventListener("keydown", handleJump);

closeGameButton.addEventListener("click", closeGameModal);

gameModal.addEventListener("click", (event) => {
  if (event.target.dataset.close !== undefined || event.target === gameModal || event.target === gameBackdrop) {
    closeGameModal();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !gameModal.classList.contains("hidden")) {
    closeGameModal();
  }
});

window.addEventListener("resize", () => {
  groundLevel = gameCanvas.height - 40;
  HORSE.y = groundLevel - HORSE.height;
  HORSE.x = gameCanvas.width - 350;
});
