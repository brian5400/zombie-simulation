let gameOverMessage = null;
let gameOverTimeout = null;

// Constants and Entity Types
const MOVEMENT_SPEED = 0.008;
const TURN_CHANCE = 0.95;
let ENTITY_RADIUS = 0.02;  // Default radius
const MIN_RADIUS = 0.01;
const MAX_RADIUS = 0.05;

const EntityTypes = {
    NONZOMBIE: 0,
    ZOMBIE: 1,
    DOCTOR: 2,
    HUNTER: 3,
    DEAD_ZOMBIE: 4,
    ZOMBIE_KING: 5
};

// Load Images
const EntityImages = {
    [EntityTypes.ZOMBIE]: new Image(),
    [EntityTypes.NONZOMBIE]: new Image(),
    [EntityTypes.DOCTOR]: new Image(),
    [EntityTypes.HUNTER]: new Image(),
    [EntityTypes.ZOMBIE_KING]: new Image()
};

EntityImages[EntityTypes.ZOMBIE].src = 'zombie.png';
EntityImages[EntityTypes.NONZOMBIE].src = 'human.png';
EntityImages[EntityTypes.DOCTOR].src = 'doctor.png';
EntityImages[EntityTypes.HUNTER].src = 'hunter.png';
EntityImages[EntityTypes.ZOMBIE_KING].src = 'king.png';

// Global variables
let entities = { 
    types: [], 
    positions: [],
    directions: []
};
let animationId = null;
let isRunning = false;

// Get DOM elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const sizeSlider = document.getElementById('entitySize');
const sizeValue = document.querySelector('.size-value');

function drawGameOver(message, isVictory) {
    const gradient = ctx.createLinearGradient(0, canvas.height/2 - 50, 0, canvas.height/2 + 50);
    
    if (isVictory) {
        // Green gradient for victory
        gradient.addColorStop(0, 'rgba(0, 255, 0, 0.9)');
        gradient.addColorStop(1, 'rgba(0, 200, 0, 0.9)');
    } else {
        // Red gradient for defeat
        gradient.addColorStop(0, 'rgba(255, 0, 0, 0.9)');
        gradient.addColorStop(1, 'rgba(200, 0, 0, 0.9)');
    }

    // Draw semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw main message background
    const messageY = canvas.height/2 - 30;
    ctx.fillStyle = gradient;
    ctx.fillRect(0, messageY, canvas.width, 60);

    // Add glow effect
    ctx.shadowColor = isVictory ? '#00ff00' : '#ff0000';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Draw main message
    ctx.font = 'bold 24px Orbitron';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(message, canvas.width/2, canvas.height/2);

    // Reset shadow
    ctx.shadowBlur = 0;

    // Draw additional message
    ctx.font = '14px Poppins';
    ctx.fillStyle = '#CCCCCC';
    ctx.fillText('Click "Start Simulation" to play again', canvas.width/2, canvas.height/2 + 40);
}

// Size slider initialization
function radiusToSliderValue(radius) {
    return ((radius - MIN_RADIUS) / (MAX_RADIUS - MIN_RADIUS)) * 100;
}

function sliderValueToRadius(value) {
    return MIN_RADIUS + (value / 100) * (MAX_RADIUS - MIN_RADIUS);
}

sizeSlider.min = 0;
sizeSlider.max = 100;
sizeSlider.value = radiusToSliderValue(ENTITY_RADIUS);
sizeValue.textContent = ENTITY_RADIUS.toFixed(3);

sizeSlider.addEventListener('input', function() {
    ENTITY_RADIUS = sliderValueToRadius(parseInt(this.value));
    sizeValue.textContent = ENTITY_RADIUS.toFixed(3);
});

function generateRandomDirection() {
    return {
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2
    };
}

function normalizeDirection(dir) {
    const length = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
    return {
        x: dir.x / length,
        y: dir.y / length
    };
}

function generateRandomPosition() {
    return {
        x: Math.random(),
        y: Math.random()
    };
}

function initializeEntities() {
    const types = [];
    const positions = [];
    const directions = [];
    
    const counts = {
        zombies: parseInt(document.getElementById('zombies').value) || 0,
        humans: parseInt(document.getElementById('humans').value) || 0,
        doctors: parseInt(document.getElementById('doctors').value) || 0,
        hunters: parseInt(document.getElementById('hunters').value) || 0,
        kings: parseInt(document.getElementById('kings').value) || 0
    };

    function addEntities(count, type) {
        for (let i = 0; i < count; i++) {
            types.push(type);
            positions.push(generateRandomPosition());
            directions.push(normalizeDirection(generateRandomDirection()));
        }
    }

    addEntities(counts.zombies, EntityTypes.ZOMBIE);
    addEntities(counts.humans, EntityTypes.NONZOMBIE);
    addEntities(counts.doctors, EntityTypes.DOCTOR);
    addEntities(counts.hunters, EntityTypes.HUNTER);
    addEntities(counts.kings, EntityTypes.ZOMBIE_KING);

    return { types, positions, directions };
}

function isTouching(pos1, pos2) {
    const distance = Math.sqrt(
        Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2)
    );
    return distance <= 2 * ENTITY_RADIUS;
}

function updateEntities() {
    if (!isRunning) return;

    const newDirections = entities.directions.map(dir => {
        if (Math.random() < TURN_CHANCE) {
            const change = generateRandomDirection();
            return normalizeDirection({
                x: dir.x + change.x * 0.3,
                y: dir.y + change.y * 0.3
            });
        }
        return dir;
    });

    const newPositions = entities.positions.map((pos, i) => {
        const dir = newDirections[i];
        const speed = MOVEMENT_SPEED * (0.8 + Math.random() * 0.4);

        let newX = pos.x + dir.x * speed;
        let newY = pos.y + dir.y * speed;

        if (newX < 0 || newX > 1) {
            newDirections[i] = normalizeDirection(generateRandomDirection());
            newX = Math.max(0, Math.min(1, newX));
        }
        if (newY < 0 || newY > 1) {
            newDirections[i] = normalizeDirection(generateRandomDirection());
            newY = Math.max(0, Math.min(1, newY));
        }

        return { x: newX, y: newY };
    });

    const newTypes = [...entities.types];
    let livingKings = newTypes.filter(type => type === EntityTypes.ZOMBIE_KING).length;

    // Check for king deaths
    entities.types.forEach((type, i) => {
        if (type === EntityTypes.ZOMBIE_KING) {
            for (let j = 0; j < entities.types.length; j++) {
                if (entities.types[j] === EntityTypes.HUNTER && isTouching(newPositions[i], newPositions[j])) {
                    newTypes[i] = EntityTypes.DEAD_ZOMBIE;
                    livingKings--;
                    break;
                }
            }
        }
    });

    // Only kill all zombies if ALL kings are dead
    if (livingKings === 0) {
        newTypes.forEach((type, i) => {
            if (type === EntityTypes.ZOMBIE) {
                newTypes[i] = EntityTypes.DEAD_ZOMBIE;
            }
        });
    }

    // Process other interactions
    entities.types.forEach((type, i) => {
        if (type === EntityTypes.NONZOMBIE) {
            for (let j = 0; j < entities.types.length; j++) {
                if ((entities.types[j] === EntityTypes.ZOMBIE || entities.types[j] === EntityTypes.ZOMBIE_KING) 
                    && isTouching(newPositions[i], newPositions[j])) {
                    newTypes[i] = EntityTypes.ZOMBIE;
                    break;
                }
            }
        } else if (type === EntityTypes.ZOMBIE) {
            for (let j = 0; j < entities.types.length; j++) {
                if (entities.types[j] === EntityTypes.HUNTER && isTouching(newPositions[i], newPositions[j])) {
                    newTypes[i] = EntityTypes.DEAD_ZOMBIE;
                    break;
                } else if (entities.types[j] === EntityTypes.DOCTOR && isTouching(newPositions[i], newPositions[j])) {
                    newTypes[i] = EntityTypes.NONZOMBIE;
                    break;
                }
            }
        } else if (type === EntityTypes.DOCTOR) {
            for (let j = 0; j < entities.types.length; j++) {
                if (entities.types[j] === EntityTypes.ZOMBIE_KING && isTouching(newPositions[i], newPositions[j])) {
                    newTypes[i] = EntityTypes.ZOMBIE;
                    break;
                }
            }
        }
    });

    entities = { 
        types: newTypes, 
        positions: newPositions, 
        directions: newDirections 
    };

    // Check win/lose conditions
    const livingHumans = newTypes.filter(t => t === EntityTypes.NONZOMBIE || t === EntityTypes.DOCTOR).length;
    const livingZombies = newTypes.filter(t => t === EntityTypes.ZOMBIE || t === EntityTypes.ZOMBIE_KING).length;
    
    if (livingHumans === 0 || livingZombies === 0) {
        stopSimulation();
        if (livingHumans === 0) {
            gameOverMessage = {
                text: "ZOMBIES HAVE WON",
                isVictory: false
            };
        } else {
            gameOverMessage = {
                text: "HUMANITY SURVIVED",
                isVictory: true
            };
        }
    }
}

function drawEntities() {
    const scale = canvas.width;
    const iconSize = ENTITY_RADIUS * scale * 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw entities
    entities.types.forEach((type, i) => {
        if (type !== EntityTypes.DEAD_ZOMBIE) {
            const x = entities.positions[i].x * scale;
            const y = entities.positions[i].y * scale;
            
            const img = EntityImages[type];
            ctx.drawImage(
                img,
                x - iconSize/2,
                y - iconSize/2,
                iconSize,
                iconSize
            );
        }
    });

    // Draw stats
    ctx.font = '10px Arial';
    let yPos = 6;
    const spacing = 16;
    const statIconSize = 12;

    function drawStat(type, label) {
        ctx.drawImage(EntityImages[type], 6, yPos, statIconSize, statIconSize);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(`${label}: ${entities.types.filter(t => t === type).length}`, 22, yPos + 8);
        yPos += spacing;
    }

    drawStat(EntityTypes.ZOMBIE, 'Zombies');
    drawStat(EntityTypes.ZOMBIE_KING, 'Kings');
    drawStat(EntityTypes.DOCTOR, 'Doctors');
    drawStat(EntityTypes.HUNTER, 'Hunters');
    drawStat(EntityTypes.NONZOMBIE, 'Humans');

    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`Dead: ${entities.types.filter(t => t === EntityTypes.DEAD_ZOMBIE).length}`, 6, yPos + 8);

    // Draw game over message if exists
    if (gameOverMessage) {
        drawGameOver(gameOverMessage.text, gameOverMessage.isVictory);
    }
}

function animate() {
    if (isRunning) {
        updateEntities();
        drawEntities();
        requestAnimationFrame(animate);
    }
}

function startSimulation() {
    if (!isRunning) {
        gameOverMessage = null;
        if (gameOverTimeout) {
            clearTimeout(gameOverTimeout);
            gameOverTimeout = null;
        }
        entities = initializeEntities();
        isRunning = true;
        startButton.textContent = 'Stop Simulation';
        animate();
    } else {
        stopSimulation();
    }
}

function stopSimulation() {
    isRunning = false;
    startButton.textContent = 'Start Simulation';
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
}

startButton.addEventListener('click', startSimulation);