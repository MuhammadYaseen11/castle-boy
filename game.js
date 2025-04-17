const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let gameState = {
    currentLevel: 1,
    coins: 0,
    stamina: 100,
    eliasX: 100,
    eliasY: 690,
    dialogueIndex: 0,
    choicesMade: [],
    forestCollected: false,
    mineWorkProgress: 0,
    maxMineProgress: 5,
    inMine: false,
    swordEquipped: false,
};

let keys = {};

document.addEventListener("keydown", (e) => { keys[e.key] = true; });
document.addEventListener("keyup", (e) => { keys[e.key] = false; });

const levels = {
    1: {
        dialogues: [
            "Elias: My mother... I have to help her.",
            "Villager: Get out of here, boy!",
            "Elias: Please... just a drop of water...",
            "Old Woman: Here, child. Take some water.",
            "Elias: Thank you... I hope I'm not too late...",
            "Elias: Mother? ... No... no... not now.",
            "Elias: I swear, one day I’ll live in a castle, and never feel helpless again."
        ],
        next: 2
    },
    2: {
        dialogues: [
            "Elias: I remember... Father said something about a box in the forest.",
            "Narrator: The woods are dark and full of danger...",
            "Elias: I must find that box. I have nothing else to lose.",
            "Elias: There it is! A box buried under the roots!",
            "Elias: A letter... and a few coins. It's not much, but it’s hope."
        ],
        next: 3
    },
    3: {
        dialogues: [
            "Elias: The city... it's nothing like my village.",
            "Overseer: You! New boy! Grab a pickaxe. You work now!",
            "Elias: I can do this. For my dream... for her.",
            "Elias: I won’t die in the dirt. I’ll rise."
        ],
        next: 4
    },
    4: {
        dialogues: [
            "Elias: The mine is deeper than I thought...",
            "Elias: I’ve been working day and night... but it’s not enough.",
            "Old Miner: You'll need to dig faster, boy, or they’ll throw you out.",
            "Elias: I won't let them beat me. I’ll find a way out of this.",
            "Elias: But I need more tools... better tools to survive this place."
        ],
        next: 5
    },
    5: {
        dialogues: [
            "Elias: A weapon... finally, something to defend myself.",
            "Mysterious Figure: You think you’re ready? To fight the real battle?",
            "Elias: I have no choice. I’ll fight if it means I can have a better life.",
            "Elias: I need to get out of this hellhole. I can’t keep working in the mines.",
            "Mysterious Figure: Then follow me, boy. The world’s bigger than this city."
        ],
        next: 6
    },
    6: {
        dialogues: [
            "Elias: We’ve escaped the city... but now what?",
            "Mysterious Figure: Now, we go to the mountains. The real treasure lies there.",
            "Elias: Mountains? What’s out there that can change my life?",
            "Mysterious Figure: The castle. The place you've always dreamed of.",
            "Elias: A castle? Can I really reach that high? It feels impossible.",
            "Mysterious Figure: Nothing’s impossible, boy. Not for someone who fights."
        ],
        next: 7
    },
    7: {
        dialogues: [
            "Elias: We’ve arrived... this is it. The castle of my dreams.",
            "Mysterious Figure: Welcome to your new life. This is where you’ll rise.",
            "Elias: I’ll show them all. They’ll know who I am. Elias, the one who overcame everything.",
            "Elias: I’ll rule this land, and nothing will ever stop me again.",
            "Narrator: And so, Elias’ journey continued, a journey of power, strength, and destiny.",
            "Narrator: But will it be enough? The future remains uncertain..."
        ],
        next: null // End of game
    }
};

// --- Game functions below (update, draw, etc.) ---

function drawElias() {
    ctx.fillStyle = "#FFD700";
    ctx.fillRect(gameState.eliasX, gameState.eliasY, 40, 60);
}

function drawStaminaBar() {
    ctx.fillStyle = "white";
    ctx.fillRect(20, 20, 100, 10);
    ctx.fillStyle = "limegreen";
    ctx.fillRect(20, 20, gameState.stamina, 10);
}

function drawCoinCount() {
    ctx.fillStyle = "yellow";
    ctx.font = "16px sans-serif";
    ctx.fillText("Coins: " + gameState.coins, 650, 30);
}

function drawDialogueBox(text) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(50, 650, 900, 120);
    ctx.fillStyle = "white";
    ctx.font = "18px sans-serif";
    ctx.fillText(text, 70, 680);
}

function updatePlayer() {
    if (keys["ArrowRight"]) gameState.eliasX += 2;
    if (keys["ArrowLeft"]) gameState.eliasX -= 2;
    gameState.eliasX = Math.max(0, Math.min(canvas.width - 40, gameState.eliasX));
}

function nextDialogue() {
    const currentDialogues = levels[gameState.currentLevel].dialogues;
    if (gameState.dialogueIndex < currentDialogues.length - 1) {
        gameState.dialogueIndex++;
    } else {
        switchLevel(levels[gameState.currentLevel].next);
    }
}

function switchLevel(newLevel) {
    gameState.currentLevel = newLevel;
    gameState.dialogueIndex = 0;
    gameState.eliasX = 100;
    gameState.stamina = 100;
}

canvas.addEventListener("click", () => {
    nextDialogue();
});
// --- Interaction functions ---
function interactWithBox() {
    if (!gameState.forestCollected && gameState.eliasX > 580 && gameState.eliasX < 630) {
        gameState.forestCollected = true;
        gameState.coins += 10;
        alert("You found your father's box! +10 coins!");
        nextDialogue();
    }
}

function mine() {
    if (keys[" "] && gameState.eliasX > 380 && gameState.eliasX < 450 && gameState.stamina > 0) {
        if (gameState.mineWorkProgress < gameState.maxMineProgress) {
            gameState.mineWorkProgress++;
            gameState.stamina -= 5;
            ctx.fillStyle = "orange";
            ctx.font = "18px sans-serif";
            ctx.fillText("Mining...", 380, 350);
        }
        if (gameState.mineWorkProgress >= gameState.maxMineProgress) {
            gameState.coins += 15;
            alert("You earned 15 coins from mining!");
            nextDialogue();
        }
    }
}

function equipSword() {
    if (gameState.swordEquipped) {
        ctx.fillStyle = "red";
        ctx.font = "20px sans-serif";
        ctx.fillText("Sword Equipped", 380, 250);
    }
}

function updateLevel2() {
    ctx.fillStyle = "brown";
    ctx.fillRect(600, 400, 30, 30); // Treasure box

    ctx.strokeStyle = "gold";
    ctx.lineWidth = 5;
    ctx.strokeRect(600, 400, 30, 30); // Box border
    ctx.shadowColor = "yellow";
    ctx.shadowBlur = 10;

    interactWithBox();

    //   if (!gameState.forestCollected && gameState.eliasX > 580) {
    //     gameState.forestCollected = true;
    //     gameState.coins += 10;
    //     alert("You found your father's box! +10 coins!");
    //     nextDialogue();
    //   }

    ctx.fillStyle = "yellow";
    ctx.font = "20px sans-serif";
    ctx.fillText("Shiny Box!", 600, 380);
    ctx.shadowColor = "transparent"; // Remove the shadow effect after drawing
}

function updateLevel3() {
    ctx.fillStyle = "gray";
    ctx.fillRect(400, 400, 50, 50); // Mine stone
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.strokeRect(400, 400, 50, 50); // Border for stone

    ctx.fillStyle = "saddlebrown";
    ctx.fillRect(380, 380, 15, 20); // Pickaxe handle
    ctx.fillStyle = "gray";
    ctx.fillRect(390, 370, 20, 10); // Pickaxe head

    mine();

    //   if (keys[" "] && gameState.eliasX > 380 && gameState.eliasX < 450) {
    //     if (gameState.stamina > 0) {
    //       gameState.mineWorkProgress++;
    //       gameState.stamina -= 5;
    //       ctx.fillStyle = "orange";
    //       ctx.font = "18px sans-serif";
    //       ctx.fillText("Mining...", 380, 350);

    //       if (gameState.mineWorkProgress >= gameState.maxMineProgress) {
    //         gameState.coins += 15;
    //         alert("You earned 15 coins from mine labor!");
    //         nextDialogue();
    //       }
    //     }
    //   }
    ctx.fillStyle = "orange";
    ctx.font = "18px sans-serif";
    ctx.fillText("Mining...", 380, 350);
}

function updateLevel4() {
    ctx.fillStyle = "dimgray";
    ctx.fillRect(350, 300, 100, 150); // Mine entrance

    ctx.fillStyle = "orange";
    ctx.beginPath();
    ctx.arc(400, 340, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255, 69, 0, 0.5)";
    ctx.fillRect(350, 250, 100, 100); // Light source

    ctx.fillStyle = "white";
    ctx.font = "20px sans-serif";
    ctx.fillText("Elias: This work... it never ends.", 400, 300);
}

function updateLevel5() {
    ctx.fillStyle = "silver";
    ctx.fillRect(380, 320, 10, 40); // Sword handle
    ctx.fillStyle = "gold";
    ctx.fillRect(380, 310, 10, 10); // Sword hilt
    ctx.fillStyle = "gray";
    ctx.fillRect(380, 270, 10, 50); // Sword blade

    ctx.fillStyle = "red";
    ctx.font = "20px sans-serif";
    ctx.fillText("Equip Sword", 360, 250);
    equipSword();
}

function updateLevel6() {
    ctx.fillStyle = "green";
    ctx.fillRect(600, 200, 30, 30); // Mountain base

    ctx.strokeStyle = "gray";
    ctx.lineWidth = 5;
    ctx.strokeRect(600, 200, 30, 30); // Mountain border

    ctx.fillStyle = "white";
    ctx.font = "18px sans-serif";
    ctx.fillText("The Mountains...", 600, 180);
}

function updateLevel7() {
    ctx.fillStyle = "silver";
    ctx.fillRect(350, 250, 200, 150); // Castle

    ctx.strokeStyle = "gold";
    ctx.lineWidth = 10;
    ctx.strokeRect(350, 250, 200, 150); // Castle border

    ctx.fillStyle = "gold";
    ctx.font = "24px sans-serif";
    ctx.fillText("Elias: I've made it... this is my new home.", 400, 270);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    //updatePlayer();

    if (gameState.currentLevel === 1) {
        drawDialogueBox(levels[gameState.currentLevel].dialogues[gameState.dialogueIndex]);
    } else if (gameState.currentLevel === 2) {
        updateLevel2();
    } else if (gameState.currentLevel === 3) {
        updateLevel3();
    } else if (gameState.currentLevel === 4) {
        updateLevel4();
    } else if (gameState.currentLevel === 5) {
        updateLevel5();
    } else if (gameState.currentLevel === 6) {
        updateLevel6();
    } else if (gameState.currentLevel === 7) {
        updateLevel7();
    }

    // Update player state
    updatePlayer();

    // Draw dialogue
    const currentDialogues = levels[gameState.currentLevel].dialogues;
    const dialogueText = currentDialogues[gameState.dialogueIndex];
    drawDialogueBox(dialogueText);

    drawElias();
    drawStaminaBar();
    drawCoinCount();

    requestAnimationFrame(draw);
}

draw();
