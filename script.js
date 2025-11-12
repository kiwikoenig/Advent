const TOTAL_DOORS = 24;
const JUMP_GAME_DOORS = new Set([1, 7, 13, 19]);
const CLEANUP_GAME_DOORS = new Set([3, 9, 14, 20]);

const doorLayer = document.getElementById("doorLayer");
const modal = document.getElementById("imageModal");
const modalTitle = document.getElementById("modalTitle");
const modalImage = document.getElementById("modalImage");
const closeModalButton = document.getElementById("closeModal");

const gameModal = document.getElementById("gameModal");
const closeGameButton = document.getElementById("closeGame");
const startGameButton = document.getElementById("startGame");
const gameCanvas = document.getElementById("gameCanvas");
const gameProgress = document.getElementById("gameProgress");
const gameMessage = document.getElementById("gameMessage");

const cleanupModal = document.getElementById("cleanupModal");
const closeCleanupButton = document.getElementById("closeCleanup");
const startCleanupButton = document.getElementById("startCleanupGame");
const cleanupStage = document.getElementById("cleanupStage");
const cleanupTimerLabel = document.getElementById("cleanupTimer");
const cleanupCountLabel = document.getElementById("cleanupCount");
const cleanupStatusLabel = document.getElementById("cleanupStatus");
const cleanupHorseElem = document.getElementById("cleanupHorse");
const cleanupPlayerElem = document.getElementById("cleanupPlayer");

if (
  !doorLayer ||
  !modal ||
  !modalTitle ||
  !modalImage ||
  !closeModalButton ||
  !gameModal ||
  !closeGameButton ||
  !startGameButton ||
  !gameCanvas ||
  !gameProgress ||
  !gameMessage ||
  !cleanupModal ||
  !closeCleanupButton ||
  !startCleanupButton ||
  !cleanupStage ||
  !cleanupTimerLabel ||
  !cleanupCountLabel ||
  !cleanupStatusLabel ||
  !cleanupHorseElem ||
  !cleanupPlayerElem
) {
  throw new Error("Benötigte Adventskalender-Elemente wurden nicht gefunden.");
}

const modalBackdrop = modal.querySelector(".modal-backdrop");
const gameBackdrop = gameModal.querySelector(".modal-backdrop");
const cleanupBackdrop = cleanupModal.querySelector(".modal-backdrop");

// ---------------------------------------------------------------------------
// Advent doors
// ---------------------------------------------------------------------------

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
  if (JUMP_GAME_DOORS.has(day)) {
    pendingJumpDoor = day;
    openJumpGameModal(day);
  } else if (CLEANUP_GAME_DOORS.has(day)) {
    pendingCleanupDoor = day;
    openCleanupModal(day);
  } else {
    openImageModal(day);
  }
}

// ---------------------------------------------------------------------------
// Image modal
// ---------------------------------------------------------------------------

function openImageModal(day) {
  modalTitle.textContent = `Türchen ${day.toString().padStart(2, "0")}`;
  modalImage.src = `Bilder/${day}.png`;
  modalImage.alt = `Bild ${day}`;
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeImageModal() {
  modal.classList.add("hidden");
  document.body.style.overflow = "";
  modalImage.removeAttribute("src");
  modalImage.removeAttribute("alt");
}

closeModalButton.addEventListener("click", closeImageModal);
modal.addEventListener("click", (event) => {
  if (event.target.dataset.close !== undefined || event.target === modal || event.target === modalBackdrop) {
    closeImageModal();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal.classList.contains("hidden")) {
    closeImageModal();
  }
});

// ---------------------------------------------------------------------------
// Jump game (doors 1,7,13,19)
// ---------------------------------------------------------------------------

const jumpCtx = gameCanvas.getContext("2d");
const jumpHorseImage = new Image();
jumpHorseImage.src = "Bilder/Spiel1.png";
const jumpFenceImage = new Image();
jumpFenceImage.src = "Bilder/Zaun.png";
const jumpBackgroundImage = new Image();
jumpBackgroundImage.src = "Bilder/Spiel1Backround.png";

const jumpState = {
  pendingDoor: null,
  groundLevel: gameCanvas.height - 40,
  backgroundOffset: 0,
  obstacles: [],
  cleared: 0,
  animationId: null,
  active: false,
  horse: { x: gameCanvas.width - 350, y: 0, width: 200, height: 140, velocity: 0 },
};

const JUMP_GRAVITY = 0.48;
const JUMP_FORCE = -22;
const JUMP_SPEED = 4.2;
const JUMP_TARGET = 5;

function openJumpGameModal(day) {
  resetJumpGame();
  jumpState.pendingDoor = day;
  gameMessage.textContent = `Türchen ${day.toString().padStart(2, "0")}: Schaffe ${JUMP_TARGET} Sprünge!`;
  gameModal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeJumpGameModal() {
  stopJumpLoop();
  jumpState.pendingDoor = null;
  gameModal.classList.add("hidden");
  document.body.style.overflow = "";
  resetJumpGame();
}

function resetJumpGame() {
  jumpState.horse.x = gameCanvas.width - 350;
  jumpState.horse.y = jumpState.groundLevel - jumpState.horse.height;
  jumpState.horse.velocity = 0;
  jumpState.obstacles = [];
  jumpState.cleared = 0;
  jumpState.backgroundOffset = 0;
  updateJumpProgress();
  gameMessage.textContent = "Bereit?";
  startGameButton.disabled = false;
  startGameButton.textContent = "Spiel starten";
}

function updateJumpProgress() {
  gameProgress.textContent = `Fortschritt: ${jumpState.cleared} / ${JUMP_TARGET}`;
}

function spawnJumpObstacle(initialX) {
  const width = 52;
  const height = 70;
  const gap = 900 + Math.random() * 260;
  const x =
    initialX !== undefined
      ? initialX
      : jumpState.obstacles.length
      ? jumpState.obstacles[jumpState.obstacles.length - 1].x - gap
      : -80;
  jumpState.obstacles.push({ x, width, height, counted: false });
}

function startJumpGame() {
  if (jumpState.active) return;
  resetJumpGame();
  jumpState.active = true;
  startGameButton.disabled = true;
  startGameButton.textContent = "Läuft...";
  gameMessage.textContent = "Springe!";
  spawnJumpObstacle(-40);
  spawnJumpObstacle(-980);
  jumpState.animationId = requestAnimationFrame(updateJumpGame);
}

function stopJumpLoop() {
  if (jumpState.animationId) {
    cancelAnimationFrame(jumpState.animationId);
    jumpState.animationId = null;
  }
  jumpState.active = false;
  startGameButton.disabled = false;
  startGameButton.textContent = "Erneut versuchen";
}

function updateJumpGame() {
  jumpState.animationId = requestAnimationFrame(updateJumpGame);
  jumpCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
  if (jumpBackgroundImage.complete && jumpBackgroundImage.naturalWidth > 0) {
    jumpCtx.drawImage(jumpBackgroundImage, 0, 0, gameCanvas.width, gameCanvas.height);
  }

  jumpCtx.fillStyle = "rgba(255,255,255,0.08)";
  jumpCtx.fillRect(0, jumpState.groundLevel, gameCanvas.width, 4);

  const { horse } = jumpState;
  for (const obstacle of jumpState.obstacles) {
    obstacle.x += JUMP_SPEED;
    if (jumpFenceImage.complete && jumpFenceImage.naturalWidth > 0) {
      jumpCtx.drawImage(
        jumpFenceImage,
        obstacle.x,
        jumpState.groundLevel - obstacle.height,
        obstacle.width,
        obstacle.height,
      );
    } else {
      jumpCtx.fillStyle = "rgba(255, 214, 153, 0.7)";
      jumpCtx.fillRect(obstacle.x, jumpState.groundLevel - obstacle.height, obstacle.width, obstacle.height);
    }

    if (!obstacle.counted && obstacle.x > horse.x + horse.width) {
      obstacle.counted = true;
      jumpState.cleared += 1;
      updateJumpProgress();
      if (jumpState.cleared >= JUMP_TARGET) {
        return handleJumpWin();
      }
    }

    if (
      horse.x < obstacle.x + obstacle.width &&
      horse.x + horse.width > obstacle.x &&
      horse.y + horse.height > jumpState.groundLevel - obstacle.height
    ) {
      return handleJumpFail();
    }
  }

  if (jumpState.obstacles.length && jumpState.obstacles[jumpState.obstacles.length - 1].x > 220) {
    spawnJumpObstacle();
  }
  jumpState.obstacles = jumpState.obstacles.filter((ob) => ob.x < gameCanvas.width + 60);

  horse.velocity += JUMP_GRAVITY;
  horse.y += horse.velocity;
  if (horse.y >= jumpState.groundLevel - horse.height) {
    horse.y = jumpState.groundLevel - horse.height;
    horse.velocity = 0;
  }

  if (jumpHorseImage.complete && jumpHorseImage.naturalWidth > 0) {
    jumpCtx.drawImage(jumpHorseImage, horse.x, horse.y, horse.width, horse.height);
  } else {
    jumpCtx.fillStyle = "rgba(255,255,255,0.6)";
    jumpCtx.fillRect(horse.x, horse.y, horse.width, horse.height);
  }
}

function handleJumpWin() {
  stopJumpLoop();
  gameMessage.textContent = "Geschafft! Türchen öffnet sich.";
  startGameButton.disabled = true;
  setTimeout(() => {
    const door = jumpState.pendingDoor;
    jumpState.pendingDoor = null;
    closeJumpGameModal();
    if (door) {
      openImageModal(door);
    }
  }, 700);
}

function handleJumpFail() {
  stopJumpLoop();
  gameMessage.textContent = "Oh nein! Versuch es nochmal.";
}

function handleJumpKey(event) {
  if (event.code !== "Space" || !jumpState.active) return;
  event.preventDefault();
  const { horse } = jumpState;
  if (horse.y >= jumpState.groundLevel - horse.height) {
    horse.velocity = JUMP_FORCE;
  }
}

startGameButton.addEventListener("click", startJumpGame);
window.addEventListener("keydown", handleJumpKey);
closeGameButton.addEventListener("click", closeJumpGameModal);

gameModal.addEventListener("click", (event) => {
  if (event.target.dataset.close !== undefined || event.target === gameModal || event.target === gameBackdrop) {
    closeJumpGameModal();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !gameModal.classList.contains("hidden")) {
    closeJumpGameModal();
  }
});

// ---------------------------------------------------------------------------
// Cleanup game (doors 3,9,14,20)
// ---------------------------------------------------------------------------

const cleanupState = {
  pendingDoor: null,
  active: false,
  failed: false,
  remainingSeconds: 60,
  spawnTimeout: null,
  timerInterval: null,
  animationId: null,
  poops: new Set(),
  horseX: cleanupStage.clientWidth - 180,
  horseY: cleanupStage.clientHeight / 2,
  horseDirX: -1,
  horseDirY: -1,
  playerX: 40,
  playerY: cleanupStage.clientHeight - 140,
  playerMoving: false,
};

const CLEANUP_MAX_POOPS = 3;
const CLEANUP_GAME_DURATION = 60;
const CLEANUP_HORSE_SPEED = 2.3;
const CLEANUP_HORSE_VERTICAL_SPEED = 1.2;

function openCleanupModal(day) {
  resetCleanupGame();
  cleanupState.pendingDoor = day;
  cleanupStatusLabel.textContent = `Status: Türchen ${day.toString().padStart(2, "0")} säubern`;
  cleanupModal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  requestAnimationFrame(() => alignCleanupStage());
}

function closeCleanupModal() {
  stopCleanupLoops();
  cleanupState.pendingDoor = null;
  cleanupModal.classList.add("hidden");
  document.body.style.overflow = "";
  resetCleanupGame();
}

function resetCleanupGame() {
  stopCleanupLoops();
  cleanupState.active = false;
  cleanupState.failed = false;
  cleanupState.remainingSeconds = CLEANUP_GAME_DURATION;
  cleanupState.playerMoving = false;
  cleanupState.playerX = 40;
  cleanupState.playerY = cleanupStage.clientHeight - 140;
  cleanupPlayerElem.classList.remove("moving");
  cleanupPlayerElem.style.left = `${cleanupState.playerX}px`;
  cleanupPlayerElem.style.top = `${cleanupState.playerY}px`;
  cleanupState.poops.forEach((poop) => poop.remove());
  cleanupState.poops.clear();
  cleanupStage.querySelectorAll(".cleanup-poop").forEach((node) => node.remove());
  cleanupState.horseX = cleanupStage.clientWidth - (cleanupHorseElem.offsetWidth || 140) - 40;
  cleanupState.horseY = Math.max(40, cleanupStage.clientHeight / 2 - (cleanupHorseElem.offsetHeight || 90) / 2);
  cleanupState.horseDirX = -1;
  cleanupState.horseDirY = -1;
  cleanupHorseElem.style.left = `${cleanupState.horseX}px`;
  cleanupHorseElem.style.top = `${cleanupState.horseY}px`;
  updateCleanupTimer();
  updateCleanupCount();
  cleanupStatusLabel.textContent = "Status: Bereit";
  startCleanupButton.disabled = false;
  startCleanupButton.textContent = "Spiel starten";
}

function alignCleanupStage() {
  const width = cleanupStage.clientWidth;
  const height = cleanupStage.clientHeight;
  if (!width || !height) return;
  cleanupState.horseX = Math.max(20, Math.min(width - (cleanupHorseElem.offsetWidth || 140) - 20, cleanupState.horseX));
  cleanupState.horseY = Math.max(20, Math.min(height - (cleanupHorseElem.offsetHeight || 90) - 40, cleanupState.horseY));
  cleanupHorseElem.style.left = `${cleanupState.horseX}px`;
  cleanupHorseElem.style.top = `${cleanupState.horseY}px`;
  cleanupState.playerX = Math.max(0, Math.min(width - (cleanupPlayerElem.offsetWidth || 80) - 10, cleanupState.playerX));
  cleanupState.playerY = Math.max(30, Math.min(height - (cleanupPlayerElem.offsetHeight || 100) - 20, cleanupState.playerY));
  cleanupPlayerElem.style.left = `${cleanupState.playerX}px`;
  cleanupPlayerElem.style.top = `${cleanupState.playerY}px`;
}

function startCleanupGame() {
  if (cleanupState.active) return;
  cleanupState.failed = false;
  cleanupState.active = true;
  cleanupState.remainingSeconds = CLEANUP_GAME_DURATION;
  cleanupStatusLabel.textContent = "Status: Sammeln!";
  startCleanupButton.disabled = true;
  startCleanupButton.textContent = "Läuft...";
  updateCleanupTimer();
  scheduleCleanupPoop();
  cleanupState.timerInterval = setInterval(() => {
    cleanupState.remainingSeconds -= 1;
    updateCleanupTimer();
    if (cleanupState.remainingSeconds <= 0) {
      handleCleanupWin();
    }
  }, 1000);
  cleanupState.animationId = requestAnimationFrame(cleanupHorseLoop);
}

function stopCleanupLoops() {
  cleanupState.active = false;
  if (cleanupState.spawnTimeout) {
    clearTimeout(cleanupState.spawnTimeout);
    cleanupState.spawnTimeout = null;
  }
  if (cleanupState.timerInterval) {
    clearInterval(cleanupState.timerInterval);
    cleanupState.timerInterval = null;
  }
  if (cleanupState.animationId) {
    cancelAnimationFrame(cleanupState.animationId);
    cleanupState.animationId = null;
  }
}

function scheduleCleanupPoop() {
  if (!cleanupState.active) return;
  const delay = 900 + Math.random() * 1500;
  cleanupState.spawnTimeout = setTimeout(() => {
    if (!cleanupState.active) return;
    spawnCleanupPoop();
    scheduleCleanupPoop();
  }, delay);
}

function spawnCleanupPoop() {
  const poop = document.createElement("button");
  poop.type = "button";
  poop.className = "cleanup-poop";
  poop.textContent = "💩";
  const horseWidth = cleanupHorseElem.offsetWidth || 140;
  const horseHeight = cleanupHorseElem.offsetHeight || 90;
  const stageWidth = cleanupStage.clientWidth;
  const stageHeight = cleanupStage.clientHeight;
  let left = cleanupState.horseX + horseWidth / 2 - 15 + Math.random() * 50 - 25;
  left = Math.max(10, Math.min(stageWidth - 40, left));
  let top = cleanupState.horseY + horseHeight / 2 + Math.random() * 80 - 40;
  top = Math.max(30, Math.min(stageHeight - 60, top));
  poop.style.left = `${left}px`;
  poop.style.top = `${top}px`;
  cleanupStage.appendChild(poop);
  cleanupState.poops.add(poop);
  poop.addEventListener("click", () => handleCleanupPoopClick(poop));
  updateCleanupCount();
  if (cleanupState.poops.size > CLEANUP_MAX_POOPS) {
    handleCleanupFail("Zu viele Haufen!");
  }
}

function handleCleanupPoopClick(poop) {
  if (!cleanupState.active || cleanupState.playerMoving || !cleanupState.poops.has(poop)) return;
  cleanupState.playerMoving = true;
  cleanupPlayerElem.classList.add("moving");
  const stageWidth = cleanupStage.clientWidth;
  const stageHeight = cleanupStage.clientHeight;
  const playerWidth = cleanupPlayerElem.offsetWidth || 80;
  const playerHeight = cleanupPlayerElem.offsetHeight || 100;
  const poopLeft = parseFloat(poop.style.left) || 0;
  const poopTop = parseFloat(poop.style.top) || stageHeight - 60;
  cleanupState.playerX = Math.max(0, Math.min(stageWidth - playerWidth - 10, poopLeft - playerWidth / 2));
  cleanupState.playerY = Math.max(30, Math.min(stageHeight - playerHeight - 20, poopTop - 10));
  cleanupPlayerElem.style.left = `${cleanupState.playerX}px`;
  cleanupPlayerElem.style.top = `${cleanupState.playerY}px`;
  setTimeout(() => {
    removeCleanupPoop(poop);
    cleanupState.playerMoving = false;
    cleanupPlayerElem.classList.remove("moving");
  }, 1200);
}

function removeCleanupPoop(poop) {
  if (!cleanupState.poops.has(poop)) return;
  cleanupState.poops.delete(poop);
  poop.remove();
  updateCleanupCount();
}

function updateCleanupCount() {
  cleanupCountLabel.textContent = `Haufen: ${cleanupState.poops.size} / ${CLEANUP_MAX_POOPS}`;
}

function updateCleanupTimer() {
  cleanupTimerLabel.textContent = `Zeit: ${Math.max(0, cleanupState.remainingSeconds)}s`;
}

function handleCleanupWin() {
  if (!cleanupState.active) return;
  stopCleanupLoops();
  cleanupStatusLabel.textContent = "Status: Geschafft!";
  startCleanupButton.disabled = true;
  startCleanupButton.textContent = "Gewonnen";
  setTimeout(() => {
    const door = cleanupState.pendingDoor;
    cleanupState.pendingDoor = null;
    closeCleanupModal();
    if (door) {
      openImageModal(door);
    }
  }, 700);
}

function handleCleanupFail(message) {
  if (cleanupState.failed) return;
  cleanupState.failed = true;
  stopCleanupLoops();
  cleanupStatusLabel.textContent = `Status: ${message}`;
  startCleanupButton.disabled = false;
  startCleanupButton.textContent = "Erneut versuchen";
}

function cleanupHorseLoop() {
  if (!cleanupState.active) {
    cleanupState.animationId = null;
    return;
  }
  const stageWidth = cleanupStage.clientWidth;
  const stageHeight = cleanupStage.clientHeight;
  const horseWidth = cleanupHorseElem.offsetWidth || 140;
  const horseHeight = cleanupHorseElem.offsetHeight || 90;

  cleanupState.horseX += cleanupState.horseDirX * CLEANUP_HORSE_SPEED;
  cleanupState.horseY += cleanupState.horseDirY * CLEANUP_HORSE_VERTICAL_SPEED;

  const minX = 20;
  const maxX = stageWidth - horseWidth - 20;
  const minY = 20;
  const maxY = stageHeight - horseHeight - 40;

  if (cleanupState.horseX <= minX) {
    cleanupState.horseX = minX;
    cleanupState.horseDirX = 1;
  } else if (cleanupState.horseX >= maxX) {
    cleanupState.horseX = maxX;
    cleanupState.horseDirX = -1;
  }
  if (cleanupState.horseY <= minY) {
    cleanupState.horseY = minY;
    cleanupState.horseDirY = 1;
  } else if (cleanupState.horseY >= maxY) {
    cleanupState.horseY = maxY;
    cleanupState.horseDirY = -1;
  }

  cleanupHorseElem.style.left = `${cleanupState.horseX}px`;
  cleanupHorseElem.style.top = `${cleanupState.horseY}px`;
  cleanupHorseElem.style.transform = cleanupState.horseDirX > 0 ? "scaleX(-1)" : "scaleX(1)";

  cleanupState.animationId = requestAnimationFrame(cleanupHorseLoop);
}

startCleanupButton.addEventListener("click", startCleanupGame);
closeCleanupButton.addEventListener("click", closeCleanupModal);

cleanupModal.addEventListener("click", (event) => {
  if (event.target.dataset.close !== undefined || event.target === cleanupModal || event.target === cleanupBackdrop) {
    closeCleanupModal();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !cleanupModal.classList.contains("hidden")) {
    closeCleanupModal();
  }
});

window.addEventListener("resize", alignCleanupStage);

let pendingJumpDoor = null;
let pendingCleanupDoor = null;
