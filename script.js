const TOTAL_DOORS = 24;
const JUMP_GAME_DOORS = new Set([1, 7, 13, 19]);
const CLEANUP_GAME_DOORS = new Set([3, 9, 14, 20]);
const GIFT_GAME_DOORS = new Set([6, 12, 18, 24]);

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

const giftModal = document.getElementById("giftModal");
const closeGiftButton = document.getElementById("closeGift");
const startGiftButton = document.getElementById("startGiftGame");
const giftCanvas = document.getElementById("giftCanvas");
const giftTimerLabel = document.getElementById("giftTimer");
const giftDeliveredLabel = document.getElementById("giftDelivered");
const giftStackLabel = document.getElementById("giftStack");
const giftStatusLabel = document.getElementById("giftStatus");
const jumpTouchBtn = document.getElementById("jumpTouch");
const giftLeftBtn = document.getElementById("giftLeft");
const giftRightBtn = document.getElementById("giftRight");

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
  !cleanupPlayerElem ||
  !giftModal ||
  !closeGiftButton ||
  !startGiftButton ||
  !giftCanvas ||
  !giftTimerLabel ||
  !giftDeliveredLabel ||
  !giftStackLabel ||
  !giftStatusLabel ||
  !jumpTouchBtn ||
  !giftLeftBtn ||
  !giftRightBtn
) {
  throw new Error("Benötigte Adventskalender-Elemente wurden nicht gefunden.");
}

const modalBackdrop = modal.querySelector(".modal-backdrop");
const gameBackdrop = gameModal.querySelector(".modal-backdrop");
const cleanupBackdrop = cleanupModal.querySelector(".modal-backdrop");
const giftBackdrop = giftModal.querySelector(".modal-backdrop");

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
  } else if (GIFT_GAME_DOORS.has(day)) {
    giftState.pendingDoor = day;
    openGiftModal(day);
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
  horse: { x: gameCanvas.width - 320, y: 0, width: 200, height: 140, velocity: 0 },
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
  jumpState.backgroundOffset = 0;
  jumpState.horse.x = gameCanvas.width - 320;
  jumpState.horse.y = jumpState.groundLevel - jumpState.horse.height;
  jumpState.horse.velocity = 0;
  jumpState.obstacles = [];
  jumpState.cleared = 0;
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
  // Parallax: zoom und langsamer scrollender Hintergrund
  jumpState.backgroundOffset -= JUMP_SPEED * 0.35;
  const bgWidth = gameCanvas.width * 1.2;
  const bgHeight = gameCanvas.height * 1.2;
  const bgY = -(bgHeight - gameCanvas.height) / 2;
  if (jumpBackgroundImage.complete && jumpBackgroundImage.naturalWidth > 0) {
    const offsetWrapped = ((jumpState.backgroundOffset % bgWidth) + bgWidth) % bgWidth;
    jumpCtx.drawImage(jumpBackgroundImage, -offsetWrapped, bgY, bgWidth, bgHeight);
    jumpCtx.drawImage(jumpBackgroundImage, -offsetWrapped + bgWidth, bgY, bgWidth, bgHeight);
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

// Touch fallback für Sprungspiel
jumpTouchBtn.addEventListener("click", () => {
  if (!jumpState.active) return;
  const { horse } = jumpState;
  if (horse.y >= jumpState.groundLevel - horse.height) {
    horse.velocity = JUMP_FORCE;
  }
});

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
  playerFacing: "right",
  playerMoving: false,
};

function applyCleanupPlayerFacing() {
  cleanupPlayerElem.style.transform =
    cleanupState.playerFacing === "left" ? "scaleX(-1)" : "scaleX(1)";
}

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
  cleanupState.playerFacing = "right";
  cleanupPlayerElem.classList.remove("moving");
  cleanupPlayerElem.style.left = `${cleanupState.playerX}px`;
  cleanupPlayerElem.style.top = `${cleanupState.playerY}px`;
  applyCleanupPlayerFacing();
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
  applyCleanupPlayerFacing();
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
  const currentX = cleanupState.playerX;
  const targetX = Math.max(0, Math.min(stageWidth - playerWidth - 10, poopLeft - playerWidth / 2));
  cleanupState.playerFacing = targetX < currentX ? 'left' : 'right';
  cleanupState.playerX = targetX;
  cleanupState.playerY = Math.max(30, Math.min(stageHeight - playerHeight - 20, poopTop - 10));
  cleanupPlayerElem.style.left = `${cleanupState.playerX}px`;
  cleanupPlayerElem.style.top = `${cleanupState.playerY}px`;
  applyCleanupPlayerFacing();
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

// ---------------------------------------------------------------------------
// Gift game helpers
// ---------------------------------------------------------------------------

function openGiftModal(day) {
  resetGiftGame();
  giftState.pendingDoor = day;
  giftStatusLabel.textContent = `Status: Fange Geschenke für Türchen ${day.toString().padStart(2, "0")}`;
  giftModal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeGiftModal() {
  stopGiftLoops();
  giftModal.classList.add("hidden");
  document.body.style.overflow = "";
  resetGiftGame();
  giftState.pendingDoor = null;
}

function resetGiftGame() {
  stopGiftLoops();
  giftState.active = false;
  giftState.timeLeft = GIFT_DURATION;
  giftState.delivered = 0;
  giftState.gifts = [];
  giftState.effects = [];
  giftState.stack = [];
  giftState.player.x = giftCanvas.width / 2 - giftState.player.width / 2;
  giftState.player.y = giftCanvas.height - giftState.player.height - 20;
  updateGiftLabels();
  giftStatusLabel.textContent = "Status: Bereit";
  startGiftButton.disabled = false;
  startGiftButton.textContent = "Spiel starten";
}

function startGiftGame() {
  if (giftState.active) return;
  resetGiftGame();
  giftState.active = true;
  startGiftButton.disabled = true;
  startGiftButton.textContent = "Läuft...";
  giftStatusLabel.textContent = "Status: Fange und liefere!";
  scheduleGiftSpawn();
  giftState.timerInterval = setInterval(() => {
    giftState.timeLeft -= 1;
    updateGiftLabels();
    if (giftState.timeLeft <= 0) {
      handleGiftEnd();
    }
  }, 1000);
  giftState.animationId = requestAnimationFrame(updateGiftGame);
}

function stopGiftLoops() {
  giftState.active = false;
  if (giftState.spawnTimeout) {
    clearTimeout(giftState.spawnTimeout);
    giftState.spawnTimeout = null;
  }
  if (giftState.timerInterval) {
    clearInterval(giftState.timerInterval);
    giftState.timerInterval = null;
  }
  if (giftState.animationId) {
    cancelAnimationFrame(giftState.animationId);
    giftState.animationId = null;
  }
}

function scheduleGiftSpawn() {
  const delay = GIFT_SPAWN_MIN + Math.random() * (GIFT_SPAWN_MAX - GIFT_SPAWN_MIN);
  giftState.spawnTimeout = setTimeout(() => {
    if (!giftState.active) return;
    spawnGift();
    scheduleGiftSpawn();
  }, delay);
}

function spawnGift() {
  const size = 32 + Math.random() * 10;
  const x = Math.random() * (giftCanvas.width - size - 20) + 10;
  giftState.gifts.push({ x, y: -40, size, vy: 0, caught: false, weight: 1 + Math.random() * 0.5 });
}

function updateGiftGame() {
  giftState.animationId = requestAnimationFrame(updateGiftGame);
  giftCtx.clearRect(0, 0, giftCanvas.width, giftCanvas.height);
  if (giftBackgroundImg.complete && giftBackgroundImg.naturalWidth > 0) {
    giftCtx.drawImage(giftBackgroundImg, 0, 0, giftCanvas.width, giftCanvas.height);
  }

  updateGiftPlayer();
  updateGiftObjects();
  drawGiftObjects();
  updateGiftLabels();
}

function updateGiftPlayer() {
  const p = giftState.player;
  // Steuerung aus Tastatur/Touch
  p.vx = giftMoveDir * GIFT_PLAYER_SPEED;

  // Richtung des Spielers anhand der Geschwindigkeit drehen
  if (p.vx < 0) {
    p.facing = 'left';
  } else if (p.vx > 0) {
    p.facing = 'right';
  }
  p.x = Math.max(0, Math.min(giftCanvas.width - p.width, p.x + p.vx));
}

function updateGiftObjects() {
  const p = giftState.player;
  // Spieler anwenden
  p.x = Math.max(0, Math.min(giftCanvas.width - p.width, p.x + p.vx));

  // Geschenke
  for (const gift of giftState.gifts) {
    if (!gift.caught) {
      gift.vy += GIFT_GRAVITY * gift.weight;
      gift.y += gift.vy;
      if (
        gift.y + gift.size >= p.y &&
        gift.x + gift.size > p.x &&
        gift.x < p.x + p.width
      ) {
        gift.caught = true;
        gift.vy = 0;
        gift.y = p.y - gift.size - giftState.stack.length * GIFT_STACK_OFFSET;
        gift.x = p.x + p.width / 2 - gift.size / 2 + (Math.random() * 10 - 5);
        giftState.stack.push(gift);
      }
      if (gift.y > giftCanvas.height) {
        gift.dead = true;
        giftState.effects.push({ x: gift.x, y: giftCanvas.height - 10, type: "smoke", life: 20 });
      }
    } else {
      // Auf dem Stapel bleiben
      const idx = giftState.stack.indexOf(gift);
      gift.x = p.x + p.width / 2 - gift.size / 2 + (Math.random() * 6 - 3);
      gift.y = p.y - gift.size - idx * GIFT_STACK_OFFSET;
      // Instabilität
      const dropChance = GIFT_STACK_DROP_CHANCE_BASE * (1 + idx * 0.6);
      if (Math.random() < dropChance) {
        gift.caught = false;
        gift.vy = 0;
        giftState.stack.splice(idx, 1);
      }
    }
  }

  // Abliefern am rechten Rand – nur gefangene Geschenke zählen und verschwinden lassen
  if (p.x + p.width > giftCanvas.width - 40 && giftState.stack.length) {
    giftState.effects.push({ x: giftCanvas.width - 30, y: p.y - 20, type: "stars", life: 25 });
    giftState.delivered += giftState.stack.length;
    // Entferne abgegebene Geschenke endgültig
    giftState.gifts = giftState.gifts.filter((g) => !g.caught);
    giftState.stack.length = 0;
  } else {
    // Entferne nur verlorene/nach unten gefallene Geschenke; gefangene bleiben im Stack
    giftState.gifts = giftState.gifts.filter((g) => !g.dead && (g.caught || g.y <= giftCanvas.height + 40));
  }
  giftState.effects = giftState.effects.filter((e) => e.life-- > 0);
}

function drawGiftObjects() {
  const p = giftState.player;
  // Spieler
  if (giftPlayerImg.complete && giftPlayerImg.naturalWidth > 0) {
    giftCtx.save();
    if (p.facing === 'left') {
      giftCtx.translate(p.x + p.width, p.y);
      giftCtx.scale(-1, 1);
      giftCtx.drawImage(giftPlayerImg, 0, 0, p.width, p.height);
    } else {
      giftCtx.drawImage(giftPlayerImg, p.x, p.y, p.width, p.height);
    }
    giftCtx.restore();
  } else {
    giftCtx.fillStyle = "rgba(120,180,255,0.7)";
    giftCtx.fillRect(p.x, p.y, p.width, p.height);
  }

  // Geschenke
  giftCtx.font = "32px serif";
  for (const gift of giftState.gifts) {
    giftCtx.fillText("🎁", gift.x, gift.y + gift.size);
  }

  // Effekte
  for (const effect of giftState.effects) {
    if (effect.type === "smoke") {
      giftCtx.fillText("💨", effect.x, effect.y);
    } else if (effect.type === "stars") {
      giftCtx.fillText("✨", effect.x, effect.y);
    }
  }
}

function updateGiftLabels() {
  giftTimerLabel.textContent = `Zeit: ${Math.max(0, giftState.timeLeft)}s`;
  giftDeliveredLabel.textContent = `Abgegeben: ${giftState.delivered}`;
  giftStackLabel.textContent = `Stapel: ${giftState.stack.length}`;
}

function handleGiftEnd() {
  stopGiftLoops();
  const won = giftState.delivered >= GIFT_TARGET;
  giftStatusLabel.textContent = won
    ? `Status: Geschafft (${giftState.delivered} abgegeben)`
    : `Status: Nur ${giftState.delivered} geschafft`;
  startGiftButton.disabled = false;
  startGiftButton.textContent = "Erneut versuchen";
  if (won) {
    setTimeout(() => {
      const door = giftState.pendingDoor;
      giftState.pendingDoor = null;
      closeGiftModal();
      if (door) {
        openImageModal(door);
      }
    }, 600);
  }
}

function handleGiftKey(event) {
  if (!giftState.active) return;
  if (event.key === "ArrowLeft") {
    giftMoveDir = -1;
  } else if (event.key === "ArrowRight") {
    giftMoveDir = 1;
  }
}

function handleGiftKeyUp(event) {
  if (!giftState.active) return;
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    giftMoveDir = 0;
  }
}

startGiftButton.addEventListener("click", startGiftGame);
closeGiftButton.addEventListener("click", closeGiftModal);

giftModal.addEventListener("click", (event) => {
  if (event.target.dataset.close !== undefined || event.target === giftModal || event.target === giftBackdrop) {
    closeGiftModal();
  }
});

window.addEventListener("keydown", handleGiftKey);
window.addEventListener("keyup", handleGiftKeyUp);

// Touch-Steuerung für Geschenkspiel
function setGiftDir(dir) {
  if (!giftState.active) return;
  giftMoveDir = dir;
}

const touchOpts = { passive: false };

["pointerdown", "touchstart", "mousedown", "click"].forEach((ev) => {
  giftLeftBtn.addEventListener(
    ev,
    (e) => {
      e.preventDefault();
      setGiftDir(-1);
    },
    touchOpts,
  );
  giftRightBtn.addEventListener(
    ev,
    (e) => {
      e.preventDefault();
      setGiftDir(1);
    },
    touchOpts,
  );
});

["pointerup", "pointercancel", "touchend", "touchcancel", "mouseup", "mouseleave", "mouseout"].forEach((ev) => {
  window.addEventListener(
    ev,
    () => {
      if (!giftState.active) return;
      giftMoveDir = 0;
    },
    touchOpts,
  );
});

// ---------------------------------------------------------------------------
// Gift game (doors 6,12,18,24)
// ---------------------------------------------------------------------------

const giftCtx = giftCanvas.getContext("2d");
const giftBackgroundImg = new Image();
giftBackgroundImg.src = "Bilder/Hintergrund3.png";
const giftPlayerImg = new Image();
giftPlayerImg.src = "Bilder/Spiel3.png";

const GIFT_DURATION = 60;
const GIFT_TARGET = 20;
const GIFT_GRAVITY = 0.25;
const GIFT_SPAWN_MIN = 500;
const GIFT_SPAWN_MAX = 1200;
const GIFT_STACK_OFFSET = 22;
const GIFT_STACK_DROP_CHANCE_BASE = 0.01;
const GIFT_PLAYER_SPEED = 6;
let giftMoveDir = 0;

const giftState = {
  pendingDoor: null,
  active: false,
  timeLeft: GIFT_DURATION,
  delivered: 0,
  spawnTimeout: null,
  timerInterval: null,
  animationId: null,
  gifts: [],
  effects: [],
  player: { x: giftCanvas.width / 2 - 60, y: giftCanvas.height - 120, width: 140, height: 100, vx: 0, facing: 'right' },
  stack: [],
};
