// Game Configuration
const TILE_SIZE = 50;
const COLORS = {
    wall: '#1a1a2e',        // Dark Navy
    walkable: '#16213e',    // Slightly lighter dark blue
    player: '#00f2ff',      // Cyan
    collectible: '#ff0055', // Pink
    exit: '#7000ff',        // Purple
    collected: '#16213e'    // Same as walkable
};

// Level Data
const LEVELS = {
    1: [
        "11111111111",
        "10000P1C001",
        "11111011101",
        "10001000001",
        "10101111101",
        "1C100000001",
        "11101110101",
        "10001C00101",
        "10111111101",
        "10000E10001",
        "11111111111"
    ],
    2: [
        "111111111111111",
        "1000001P0000001",
        "101110101011101",
        "10001C001010001",
        "111011101010111",
        "10000C10101C001",
        "101110101111101",
        "101000101000101",
        "101010111010101",
        "101010100C10101",
        "101011101110101",
        "101000001000101",
        "101111111011101",
        "1C00001E001C001",
        "111111111111111"
    ],
    3: [
        "1111111111111111111",
        "1P000000000000000C1",
        "1011111111111111101",
        "10C0000000000000101",
        "11101111111111101C1",
        "10001000000000101011",
        "101110111111101010C1",
        "101000100000101010101",
        "10111010111010101001",
        "100C0010100C101010E1",
        "11101110101110101011",
        "10001000100000001001",
        "101111101111111110C1",
        "10000000C00000000001",
        "1111111111111111111"
    ],
    4: [
        "11111111111111111111111",
        "1P00000000000C000000001",
        "101111111111111111110C1",
        "101000000000000000010C1",
        "10101111111111111101001",
        "10101C00000000000101011",
        "10101011111111110101001",
        "1010101C00000C010101011",
        "10101011111110110101001",
        "10101010000010010101011",
        "10101010111010010101001",
        "1010101010C0100101010C1",
        "10101010111110010101011",
        "10101000000000000101001",
        "10101111111111111101011",
        "1010C00000000000000C001",
        "10111111111111111111101",
        "10000000000000000000001",
        "1011111111111111111111E1",
        "10C00000000000000000001",
        "11111111111111111111111"
    ]
};

// Game State
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentLevel = 1;
        this.reset();
        this.setupControls();
        this.loadLevel(this.currentLevel);
    }

    reset() {
        this.map = [];
        this.player = { x: 0, y: 0 };
        this.exit = { x: 0, y: 0 };
        this.collectibles = [];
        this.collectedItems = new Set();
        this.moves = 0;
        this.gameWon = false;
    }

    loadLevel(levelNum) {
        this.reset();
        this.currentLevel = levelNum;
        const levelData = LEVELS[levelNum];
        
        if (!levelData) {
            console.error('Level not found');
            return;
        }

        this.map = levelData.map(row => row.split(''));
        this.mapWidth = this.map[0].length;
        this.mapHeight = this.map.length;

        // Set canvas size
        this.canvas.width = this.mapWidth * TILE_SIZE;
        this.canvas.height = this.mapHeight * TILE_SIZE;

        // Find player, exit, and collectibles
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                const tile = this.map[y][x];
                if (tile === 'P') {
                    this.player = { x, y };
                    this.map[y][x] = '0'; // Replace with walkable
                } else if (tile === 'E') {
                    this.exit = { x, y };
                } else if (tile === 'C') {
                    this.collectibles.push({ x, y, id: `${x}-${y}` });
                }
            }
        }

        this.updateUI();
        this.render();
    }

    setupControls() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (this.gameWon) return;
            
            const key = e.key.toLowerCase();
            let moved = false;

            if (key === 'w' || key === 'arrowup') {
                moved = this.movePlayer(0, -1);
            } else if (key === 's' || key === 'arrowdown') {
                moved = this.movePlayer(0, 1);
            } else if (key === 'a' || key === 'arrowleft') {
                moved = this.movePlayer(-1, 0);
            } else if (key === 'd' || key === 'arrowright') {
                moved = this.movePlayer(1, 0);
            }

            if (moved) {
                e.preventDefault();
            }
        });

        // Mobile touch controls
        const mobileControls = document.getElementById('mobile-controls');
        const buttons = mobileControls.querySelectorAll('.dpad-btn');
        
        buttons.forEach(btn => {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const key = btn.dataset.key;
                this.handleMobileInput(key);
            });
            
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const key = btn.dataset.key;
                this.handleMobileInput(key);
            });
        });

        // Swipe gestures
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.canvas.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            if (this.gameWon) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            const minSwipeDistance = 30;
            
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
                // Horizontal swipe
                if (deltaX > 0) {
                    this.movePlayer(1, 0);
                } else {
                    this.movePlayer(-1, 0);
                }
            } else if (Math.abs(deltaY) > minSwipeDistance) {
                // Vertical swipe
                if (deltaY > 0) {
                    this.movePlayer(0, 1);
                } else {
                    this.movePlayer(0, -1);
                }
            }
        });

        // Reset button
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.loadLevel(this.currentLevel);
        });

        // Level selector
        document.getElementById('level-select').addEventListener('change', (e) => {
            this.loadLevel(parseInt(e.target.value));
        });

        // Win screen buttons
        document.getElementById('next-level-btn').addEventListener('click', () => {
            const nextLevel = this.currentLevel + 1;
            if (LEVELS[nextLevel]) {
                document.getElementById('level-select').value = nextLevel;
                this.loadLevel(nextLevel);
                this.hideWinScreen();
            } else {
                alert('Congratulations! You completed all levels!');
            }
        });

        document.getElementById('replay-btn').addEventListener('click', () => {
            this.loadLevel(this.currentLevel);
            this.hideWinScreen();
        });
    }

    handleMobileInput(key) {
        if (this.gameWon) return;
        
        switch(key) {
            case 'w':
                this.movePlayer(0, -1);
                break;
            case 's':
                this.movePlayer(0, 1);
                break;
            case 'a':
                this.movePlayer(-1, 0);
                break;
            case 'd':
                this.movePlayer(1, 0);
                break;
        }
    }

    movePlayer(dx, dy) {
        const newX = this.player.x + dx;
        const newY = this.player.y + dy;

        // Check boundaries
        if (newX < 0 || newX >= this.mapWidth || newY < 0 || newY >= this.mapHeight) {
            return false;
        }

        // Check collision with walls
        if (this.map[newY][newX] === '1') {
            return false;
        }

        // Check exit (only accessible if all collectibles collected)
        if (this.map[newY][newX] === 'E') {
            if (this.collectedItems.size === this.collectibles.length) {
                this.player.x = newX;
                this.player.y = newY;
                this.moves++;
                this.updateUI();
                this.render();
                this.winGame();
                return true;
            } else {
                // Can't enter exit yet
                return false;
            }
        }

        // Valid move
        this.player.x = newX;
        this.player.y = newY;
        this.moves++;

        // Check for collectible
        const collectibleId = `${newX}-${newY}`;
        if (this.map[newY][newX] === 'C' && !this.collectedItems.has(collectibleId)) {
            this.collectedItems.add(collectibleId);
        }

        this.updateUI();
        this.render();
        return true;
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw map
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                const tile = this.map[y][x];
                this.drawTile(x, y, tile);
            }
        }

        // Draw player
        this.drawPlayer(this.player.x, this.player.y);
    }

    drawTile(x, y, tile) {
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        // Draw base
        if (tile === '1') {
            // Wall - Dark Navy with Neon Border
            this.ctx.fillStyle = COLORS.wall;
            this.ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            
            // Neon Border
            this.ctx.strokeStyle = '#00f2ff'; // Cyan
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
            
            // Inner glow
            this.ctx.fillStyle = 'rgba(0, 242, 255, 0.1)';
            this.ctx.fillRect(px + 5, py + 5, TILE_SIZE - 10, TILE_SIZE - 10);
        } else {
            // Walkable - Darker Blue
            this.ctx.fillStyle = COLORS.walkable;
            this.ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            
            // Faint Grid lines
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
        }

        // Draw exit
        if (tile === 'E') {
            const allCollected = this.collectedItems.size === this.collectibles.length;
            this.ctx.fillStyle = allCollected ? COLORS.exit : '#333';
            
            // Draw portal shape
            this.ctx.beginPath();
            this.ctx.arc(px + TILE_SIZE/2, py + TILE_SIZE/2, TILE_SIZE/2 - 5, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Portal swirl
            if (allCollected) {
                this.ctx.strokeStyle = '#fff';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(px + TILE_SIZE/2, py + TILE_SIZE/2, TILE_SIZE/3, 0, Math.PI * 2);
                this.ctx.stroke();
            }
        }

        // Draw collectible
        if (tile === 'C') {
            const collectibleId = `${x}-${y}`;
            if (!this.collectedItems.has(collectibleId)) {
                // Glowing Orb
                const centerX = px + TILE_SIZE / 2;
                const centerY = py + TILE_SIZE / 2;
                
                // Glow
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = COLORS.collectible;
                
                this.ctx.fillStyle = COLORS.collectible;
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Reset shadow
                this.ctx.shadowBlur = 0;
            }
        }
    }

    drawPlayer(x, y) {
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;
        
        // Glow
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = COLORS.player;

        // Draw player
        this.ctx.fillStyle = COLORS.player;
        this.ctx.beginPath();
        this.ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 15, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
        
        // Inner detail
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 5, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    updateUI() {
        document.getElementById('move-count').textContent = this.moves;
        document.getElementById('collectible-count').textContent = 
            `${this.collectedItems.size}/${this.collectibles.length}`;
    }

    winGame() {
        this.gameWon = true;
        const score = Math.max(0, 200 - this.moves);
        document.getElementById('final-moves').textContent = this.moves;
        document.getElementById('final-score').textContent = score;
        
        const winScreen = document.getElementById('win-screen');
        winScreen.style.display = 'flex';
        // Trigger reflow
        winScreen.offsetHeight;
        winScreen.classList.add('active');
    }

    hideWinScreen() {
        const winScreen = document.getElementById('win-screen');
        winScreen.classList.remove('active');
        setTimeout(() => {
            winScreen.style.display = 'none';
        }, 300);
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
});
