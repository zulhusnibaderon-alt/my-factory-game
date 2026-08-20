const setupScreen = document.getElementById("setup-screen");
const gameScreen = document.getElementById("game-screen");
const startBtn = document.getElementById("start-btn");
const usernameInput = document.getElementById("username-input");
const colorInput = document.getElementById("color-input");
const genderInput = document.getElementById("gender-input");
const difficultyInput = document.getElementById("difficulty-input");
const displayName = document.getElementById("display-name");
const scoreDisplay = document.getElementById("score");
const healthBar = document.getElementById("health-bar");
const lotCountDisplay = document.getElementById("lot-count");

const questionModal = document.getElementById("question-modal");
const interrogatorName = document.getElementById("interrogator-name");
const answerInput = document.getElementById("answer-input");
const submitAnswerBtn = document.getElementById("submit-answer-btn");

const mrTeeModal = document.getElementById("mr-tee-modal");
const mrTeeDialogue = document.getElementById("mr-tee-dialogue");
const deliverLotsBtn = document.getElementById("deliver-lots-btn");
const closeTeeBtn = document.getElementById("close-tee-btn");

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let player = {
    x: 520,
    y: 550, 
    size: 14,
    speed: 3.5,
    name: "",
    color: "#ffeb3b",
    gender: "male",
    health: 100,
    lots: 0
};

let walls = [
    { x: 0, y: 0, width: 800, height: 15 },
    { x: 0, y: 0, width: 15, height: 600 },
    { x: 785, y: 0, width: 15, height: 600 },
    { x: 0, y: 585, width: 800, height: 15 },
    
    // Building 3
    { x: 220, y: 50, width: 340, height: 50 },
    
    // Building 2 
    { x: 80, y: 180, width: 160, height: 180 },
    
    // Warehouse
    { x: 300, y: 180, width: 90, height: 110 },
    
    // Building 1 Office
    { x: 250, y: 460, width: 300, height: 50 },
    
    // Building 4
    { x: 550, y: 180, width: 150, height: 180 },
    
    // Building 5
    { x: 730, y: 50, width: 30, height: 500 }
];

let safeZone = { x: 420, y: 330, width: 110, height: 75 };

let mrTee = { x: 140, y: 390 };
let canInteractWithTee = true;

let items = [];

let ghosts = [
    { name: "Mr. Wong", x: 100, y: 80, color: "#d9534f", baseSpeed: 0.6, type: "wong" },
    { name: "Akak GL", x: 400, y: 130, color: "#f0ad4e", baseSpeed: 0.7, type: "gl" },
    { name: "Kak Nisa", x: 700, y: 100, color: "#5bc0de", baseSpeed: 0.65, type: "nisa" }, 
    { name: "Kak Ira", x: 700, y: 400, color: "#f7f7f7", baseSpeed: 0.65, type: "ira" },   
    { name: "Akak Jaga", x: 100, y: 500, color: "#5cb85c", baseSpeed: 0.8, type: "jaga" }
];

let keys = {};
let score = 0;
let isGameOver = false;
let isPausedForModal = false;
let animationFrameId = null;
let speedMultiplier = 1;

startBtn.addEventListener("click", () => {
    player.name = usernameInput.value || "Player";
    player.color = colorInput.value;
    player.gender = genderInput.value;

    let diff = difficultyInput.value;
    if (diff === "easy") speedMultiplier = 0.5;   
    if (diff === "normal") speedMultiplier = 0.9; 
    if (diff === "hard") speedMultiplier = 1.4;   

    displayName.textContent = player.name;
    setupScreen.style.display = "none";
    gameScreen.style.display = "block";

    startGame();
});

window.addEventListener("keydown", (e) => keys[e.key] = true);
window.addEventListener("keyup", (e) => keys[e.key] = false);

// Mobile On-Screen Button Event Bindings
function bindTouchButton(id, keyName) {
    const btn = document.getElementById(id);
    if (!btn) return;

    btn.addEventListener("touchstart", (e) => { e.preventDefault(); keys[keyName] = true; });
    btn.addEventListener("touchend", (e) => { e.preventDefault(); keys[keyName] = false; });
    btn.addEventListener("mousedown", () => keys[keyName] = true);
    btn.addEventListener("mouseup", () => keys[keyName] = false);
    btn.addEventListener("mouseleave", () => keys[keyName] = false);
}

bindTouchButton("up-btn", "ArrowUp");
bindTouchButton("down-btn", "ArrowDown");
bindTouchButton("left-btn", "ArrowLeft");
bindTouchButton("right-btn", "ArrowRight");

function startGame() {
    isGameOver = false;
    isPausedForModal = false;
    score = 0;
    player.health = 100;
    player.lots = 0;
    player.x = 520;
    player.y = 550;
    
    spawnItems();

    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    loop();
}

function isInsideWall(x, y) {
    for (let wall of walls) {
        if (
            x > wall.x &&
            x < wall.x + wall.width &&
            y > wall.y &&
            y < wall.y + wall.height
        ) {
            return true;
        }
    }
    return false;
}

function spawnItems() {
    items = [];
    while (items.length < 7) {
        let rx = Math.random() * 700 + 50;
        let ry = Math.random() * 500 + 50;

        if (!isInsideWall(rx, ry)) {
            items.push({
                x: rx,
                y: ry,
                type: Math.random() > 0.3 ? "lot" : "abl"
            });
        }
    }
}

function checkWallCollision(nx, ny, size) {
    for (let wall of walls) {
        if (
            nx + size > wall.x &&
            nx - size < wall.x + wall.width &&
            ny + size > wall.y &&
            ny - size < wall.y + wall.height
        ) {
            return true;
        }
    }
    return false;
}

function update() {
    if (isGameOver || isPausedForModal) return;

    let nextX = player.x;
    let nextY = player.y;

    if (keys["ArrowLeft"] || keys["a"]) nextX -= player.speed;
    if (keys["ArrowRight"] || keys["d"]) nextX += player.speed;
    if (keys["ArrowUp"] || keys["w"]) nextY -= player.speed;
    if (keys["ArrowDown"] || keys["s"]) nextY += player.speed;

    if (!checkWallCollision(nextX, player.y, player.size)) player.x = nextX;
    if (!checkWallCollision(player.x, nextY, player.size)) player.y = nextY;

    items.forEach((item, index) => {
        let dist = Math.hypot(player.x - item.x, player.y - item.y);
        if (dist < player.size + 10) {
            if (item.type === "lot") {
                player.lots++;
                score += 50;
            } else {
                player.health -= 25;
                if (player.health <= 0) {
                    player.health = 0;
                    isGameOver = true;
                }
            }
            items.splice(index, 1);
            
            let rx, ry;
            do {
                rx = Math.random() * 700 + 50;
                ry = Math.random() * 500 + 50;
            } while (isInsideWall(rx, ry));

            items.push({
                x: rx,
                y: ry,
                type: Math.random() > 0.35 ? "lot" : "abl"
            });
        }
    });

    let teeDist = Math.hypot(player.x - mrTee.x, player.y - mrTee.y);
    if (teeDist < 30) {
        if (canInteractWithTee) {
            triggerMrTeeModal();
        }
    } else {
        canInteractWithTee = true;
    }

    let inSafeZone = (
        player.x > safeZone.x &&
        player.x < safeZone.x + safeZone.width &&
        player.y > safeZone.y &&
        player.y < safeZone.y + safeZone.height
    );

    ghosts.forEach(ghost => {
        let currentSpeed = ghost.baseSpeed * speedMultiplier;

        if (!inSafeZone) {
            let dx = player.x - ghost.x;
            let dy = player.y - ghost.y;
            let angle = Math.atan2(dy, dx);
            
            let gNextX = ghost.x + Math.cos(angle) * currentSpeed;
            let gNextY = ghost.y + Math.sin(angle) * currentSpeed;

            if (!checkWallCollision(gNextX, ghost.y, 12)) ghost.x = gNextX;
            if (!checkWallCollision(ghost.x, gNextY, 12)) ghost.y = gNextY;
        }

        let dist = Math.hypot(player.x - ghost.x, player.y - ghost.y);
        if (dist < player.size + 12) {
            if (ghost.type === "nisa" || ghost.type === "ira") {
                triggerSecondChance(ghost.name);
            } else {
                isGameOver = true;
            }
        }
    });

    healthBar.value = player.health;
    lotCountDisplay.textContent = player.lots;
    score++;
    scoreDisplay.textContent = Math.floor(score / 10);
}

function triggerMrTeeModal() {
    isPausedForModal = true;
    canInteractWithTee = false; 
    mrTeeDialogue.textContent = `Want to pass Lots to increase health? You have ${player.lots} Lots.`;
    mrTeeModal.style.display = "flex";
}

deliverLotsBtn.addEventListener("click", () => {
    if (player.lots > 0) {
        let lotsGiven = player.lots;
        player.lots = 0; 
        player.health = Math.min(100, player.health + (lotsGiven * 25)); 
        score += lotsGiven * 100;
        alert(`Mr. Tee accepted ${lotsGiven} Lot(s)! Health increased!`);
    } else {
        alert("You don't have any Lots to pass to Mr. Tee!");
    }
    mrTeeModal.style.display = "none";
    isPausedForModal = false;
});

closeTeeBtn.addEventListener("click", () => {
    mrTeeModal.style.display = "none";
    isPausedForModal = false;
});

function triggerSecondChance(name) {
    isPausedForModal = true;
    interrogatorName.textContent = name + " caught you!";
    answerInput.value = "";
    questionModal.style.display = "flex";
    answerInput.focus();
}

submitAnswerBtn.addEventListener("click", checkAnswer);
answerInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") checkAnswer();
});

function checkAnswer() {
    let ans = answerInput.value.trim().toLowerCase();
    questionModal.style.display = "none";

    if (ans === "office" || ans === "opis") {
        player.x = 520;
        player.y = 550;
        isPausedForModal = false;
    } else {
        isGameOver = true;
        isPausedForModal = false;
    }
}

function drawHumanSprite(x, y, shirtColor, gender, hairColor) {
    ctx.fillStyle = shirtColor;
    ctx.beginPath();
    ctx.arc(x, y + 6, 12, Math.PI, 0, false);
    ctx.fill();

    ctx.fillStyle = "#ffdbac";
    ctx.beginPath();
    ctx.arc(x, y - 4, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = hairColor || "#331a00";
    if (gender === "female-hijab") {
        ctx.beginPath();
        ctx.arc(x, y - 4, 10, Math.PI, 0, false);
        ctx.lineTo(x + 11, y + 8);
        ctx.lineTo(x - 11, y + 8);
        ctx.closePath();
        ctx.fill();
    } else if (gender === "female") {
        ctx.beginPath();
        ctx.arc(x, y - 5, 9, Math.PI, Math.PI * 2);
        ctx.lineTo(x + 8, y + 4);
        ctx.lineTo(x - 8, y + 4);
        ctx.fill();
    } else {
        ctx.beginPath();
        ctx.arc(x, y - 5, 9, Math.PI * 0.8, Math.PI * 2.2, false);
        ctx.fill();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(0, 255, 120, 0.2)";
    ctx.fillRect(safeZone.x, safeZone.y, safeZone.width, safeZone.height);
    ctx.strokeStyle = "#00ff78";
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(safeZone.x, safeZone.y, safeZone.width, safeZone.height);
    ctx.setLineDash([]);
    ctx.fillStyle = "#00ff78";
    ctx.font = "10px 'Segoe UI'";
    ctx.fillText("CAFETERIA (SAFE)", safeZone.x + 10, safeZone.y + 40);

    ctx.fillStyle = "#2c3e50";
    walls.forEach(wall => {
        ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
        ctx.strokeStyle = "#34495e";
        ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
    });

    ctx.fillStyle = "#95a5a6";
    ctx.font = "10px 'Segoe UI'";
    ctx.fillText("Bldg 3", 370, 40);
    ctx.fillText("Bldg 2", 140, 170);
    ctx.fillText("Warehouse", 315, 170);
    ctx.fillText("Bldg 1 (Office)", 360, 450);
    ctx.fillText("Bldg 4 (OGI)", 590, 170);
    ctx.fillText("Bldg 5", 730, 40);

    drawHumanSprite(mrTee.x, mrTee.y, "#9b59b6", "male", "#ffffff");
    ctx.fillStyle = "#d2b4de";
    ctx.font = "10px 'Segoe UI'";
    ctx.fillText("Mr. Tee", mrTee.x, mrTee.y - 18);

    items.forEach(item => {
        if (item.type === "lot") {
            ctx.fillStyle = "#f1c40f";
            ctx.fillRect(item.x - 6, item.y - 6, 12, 12);
            ctx.fillStyle = "#000";
            ctx.font = "9px Arial";
            ctx.fillText("Lot", item.x, item.y + 3);
        } else {
            ctx.fillStyle = "#e74c3c";
            ctx.beginPath();
            ctx.arc(item.x, item.y, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#fff";
            ctx.font = "8px Arial";
            ctx.fillText("ABL", item.x, item.y + 3);
        }
    });

    let userGenderStyle = player.gender === "female" ? "female" : "male";
    drawHumanSprite(player.x, player.y, player.color, userGenderStyle, "#222");
    ctx.fillStyle = "white";
    ctx.font = "12px 'Segoe UI'";
    ctx.textAlign = "center";
    ctx.fillText(player.name, player.x, player.y - 18);

    ghosts.forEach(ghost => {
        let hairCol = "#222";
        let outfitCol = ghost.color;
        let gGender = "female-hijab";

        if (ghost.type === "wong") {
            gGender = "male";
            hairCol = "#b0b0b0";
        } else if (ghost.type === "ira" || ghost.type === "nisa") {
            hairCol = "#111";
        } else if (ghost.type === "gl") {
            hairCol = "#4a3b32";
        } else if (ghost.type === "jaga") {
            hairCol = "#2e2e2e";
        }

        drawHumanSprite(ghost.x, ghost.y, outfitCol, gGender, hairCol);
        ctx.fillStyle = "#ffcccc";
        ctx.font = "10px 'Segoe UI'";
        ctx.fillText(ghost.name, ghost.x, ghost.y - 18);
    });

    if (isGameOver) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ff4d4d";
        ctx.font = "28px 'Segoe UI'";
        ctx.textAlign = "center";
        ctx.fillText("Game Over! Health depleted or caught.", canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillStyle = "white";
        ctx.font = "16px 'Segoe UI'";
        ctx.fillText("Refresh the page to try again", canvas.width / 2, canvas.height / 2 + 25);
    }
}

function loop() {
    update();
    draw();
    if (!isGameOver) {
        animationFrameId = requestAnimationFrame(loop);
    }
}