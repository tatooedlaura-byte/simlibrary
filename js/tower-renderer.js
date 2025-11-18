/**
 * SimLibrary - Visual Tower Renderer
 * Renders the tower with floors, characters, and animations
 */

class TowerRenderer {
    constructor(canvasId, game) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.game = game;

        // Canvas dimensions
        this.width = 600;
        this.height = 800;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // Floor dimensions
        this.floorHeight = 120;
        this.floorWidth = 500;
        this.floorX = 50;

        // Elevator dimensions
        this.elevatorWidth = 40;
        this.elevatorX = 5;
        this.elevatorCarHeight = 80;

        // Character sprites
        this.characters = []; // Active character animations

        // Animation frame
        this.animationFrame = null;

        // Colors for floor types
        this.floorColors = {
            peach: { bg: '#FFD4B2', border: '#FFAB91', accent: '#FF8A65' },
            mint: { bg: '#C8E6C9', border: '#A5D6A7', accent: '#81C784' },
            sky: { bg: '#B3E5FC', border: '#81D4FA', accent: '#4FC3F7' },
            lavender: { bg: '#E1BEE7', border: '#CE93D8', accent: '#BA68C8' },
            brown: { bg: '#D7CCC8', border: '#BCAAA4', accent: '#A1887F' },
            rainbow: { bg: '#FFE5B4', border: '#FFD700', accent: '#FFA500' }
        };

        this.init();
    }

    init() {
        // Set up canvas click handling
        this.canvas.addEventListener('click', (e) => this.handleClick(e));

        // Start render loop
        this.render();
    }

    /**
     * Main render loop
     */
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw background (sky)
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#E0F6FF');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw ground
        this.ctx.fillStyle = '#8BC34A';
        this.ctx.fillRect(0, this.height - 40, this.width, 40);

        // Draw elevator shaft
        this.drawElevatorShaft();

        // Draw floors (bottom to top)
        const floors = [...this.game.floors].reverse();
        floors.forEach((floor, index) => {
            const y = this.height - 40 - (index + 1) * this.floorHeight;
            this.drawFloor(floor, this.floorX, y, index);
        });

        // Draw elevator car(s) with readers
        this.drawElevators();

        // Draw "Build Floor" button at top
        if (this.game.floors.length < this.game.maxFloors) {
            const buildY = this.height - 40 - (floors.length + 1) * this.floorHeight;
            this.drawBuildSlot(this.floorX, buildY);
        }

        // Update and draw characters
        this.updateCharacters();

        // Continue loop
        this.animationFrame = requestAnimationFrame(() => this.render());
    }

    /**
     * Draw a single floor
     */
    drawFloor(floor, x, y, floorIndex) {
        const colors = this.floorColors[floor.color] || this.floorColors.peach;

        // Floor background
        this.ctx.fillStyle = colors.bg;
        this.ctx.fillRect(x, y, this.floorWidth, this.floorHeight);

        // Floor border
        this.ctx.strokeStyle = colors.border;
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(x, y, this.floorWidth, this.floorHeight);

        if (floor.status === 'building') {
            this.drawConstructionFloor(floor, x, y, colors);
        } else {
            this.drawReadyFloor(floor, x, y, colors, floorIndex);
        }
    }

    /**
     * Draw elevator shaft
     */
    drawElevatorShaft() {
        const numFloors = this.game.floors.length;
        if (numFloors === 0) return;

        const shaftHeight = numFloors * this.floorHeight;
        const shaftY = this.height - 40 - shaftHeight;

        // Shaft background
        this.ctx.fillStyle = '#757575';
        this.ctx.fillRect(this.elevatorX, shaftY, this.elevatorWidth, shaftHeight);

        // Shaft border
        this.ctx.strokeStyle = '#424242';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.elevatorX, shaftY, this.elevatorWidth, shaftHeight);

        // Floor markers (horizontal lines)
        this.ctx.strokeStyle = '#616161';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= numFloors; i++) {
            const markerY = this.height - 40 - (i * this.floorHeight);
            this.ctx.beginPath();
            this.ctx.moveTo(this.elevatorX, markerY);
            this.ctx.lineTo(this.elevatorX + this.elevatorWidth, markerY);
            this.ctx.stroke();
        }
    }

    /**
     * Draw elevator car(s) with readers
     */
    drawElevators() {
        const now = Date.now();

        // Group readers by elevator (for now, one reader per elevator)
        const readersInElevator = this.game.readers.filter(r =>
            r.elevatorState === 'waiting' || r.elevatorState === 'riding'
        );

        readersInElevator.forEach(reader => {
            // Find the floor's visual position (floors are rendered in reverse order)
            const floor = this.game.getFloor(reader.floorId);
            if (!floor) return;

            const floors = [...this.game.floors].reverse();
            const visualIndex = floors.findIndex(f => f.id === floor.id);
            if (visualIndex === -1) return;

            // Use EXACT same calculation as floor drawing to ensure alignment
            const destFloorY = this.height - 40 - (visualIndex + 1) * this.floorHeight;

            // Calculate elevator timing based on visual floor position
            const floorsToTravel = visualIndex + 1;
            const totalTime = 2000 + (floorsToTravel * 500);
            const spawnTime = reader.elevatorArrivalTime - totalTime;
            const elapsed = now - spawnTime;
            const progress = Math.min(1, Math.max(0, elapsed / totalTime));

            // Calculate Y position (ground to destination floor)
            const groundY = this.height - 40;
            const elevatorY = groundY - (progress * (groundY - destFloorY)) - this.elevatorCarHeight;

            // Draw elevator car
            this.ctx.fillStyle = '#9E9E9E';
            this.ctx.fillRect(this.elevatorX + 2, elevatorY, this.elevatorWidth - 4, this.elevatorCarHeight);

            // Elevator car border
            this.ctx.strokeStyle = '#616161';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(this.elevatorX + 2, elevatorY, this.elevatorWidth - 4, this.elevatorCarHeight);

            // Draw reader inside elevator
            const readerX = this.elevatorX + this.elevatorWidth / 2;
            const readerY = elevatorY + this.elevatorCarHeight / 2;

            // Reader emoji
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(reader.emoji, readerX, readerY);
        });
    }

    /**
     * Draw a floor under construction
     */
    drawConstructionFloor(floor, x, y, colors) {
        const remaining = Math.max(0, Math.ceil((floor.buildEndTime - Date.now()) / 1000));
        const progress = 1 - (remaining / (floor.buildEndTime - floor.buildStartTime) * 1000);

        // Construction scaffolding (simple lines)
        this.ctx.strokeStyle = '#FF9800';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            const lineX = x + 50 + i * 100;
            this.ctx.beginPath();
            this.ctx.moveTo(lineX, y + 20);
            this.ctx.lineTo(lineX, y + this.floorHeight - 20);
            this.ctx.stroke();
        }

        // Progress bar
        this.ctx.fillStyle = 'rgba(0,0,0,0.1)';
        this.ctx.fillRect(x + 50, y + this.floorHeight / 2 - 15, this.floorWidth - 100, 30);

        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillRect(x + 50, y + this.floorHeight / 2 - 15, (this.floorWidth - 100) * progress, 30);

        // Text
        this.ctx.fillStyle = '#000';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`🏗️ Building ${floor.name}...`, x + this.floorWidth / 2, y + 30);
        this.ctx.fillText(`${remaining}s remaining`, x + this.floorWidth / 2, y + this.floorHeight / 2 + 5);
    }

    /**
     * Draw a ready floor with book shelves and readers
     */
    drawReadyFloor(floor, x, y, colors, floorIndex) {
        // Floor name/number
        this.ctx.fillStyle = '#000';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`${floor.emoji} ${floor.name}`, x + 10, y + 20);

        // Draw book shelves (3 categories)
        const shelfY = y + 40;
        const shelfWidth = 120;
        const shelfSpacing = (this.floorWidth - 60 - shelfWidth * 3) / 2;

        floor.bookStock.forEach((category, index) => {
            const shelfX = x + 30 + index * (shelfWidth + shelfSpacing);
            this.drawBookshelf(category, shelfX, shelfY, shelfWidth, 60, colors);
        });

        // Store floor bounds for click detection
        floor._renderBounds = { x, y, width: this.floorWidth, height: this.floorHeight, floorIndex };

        // Draw characters on this floor
        this.drawFloorCharacters(floor, x, y);
    }

    /**
     * Draw a bookshelf with stock indicator
     */
    drawBookshelf(category, x, y, width, height, colors) {
        // Shelf background
        this.ctx.fillStyle = '#8D6E63';
        this.ctx.fillRect(x, y, width, height);

        this.ctx.strokeStyle = '#5D4037';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);

        // Books (as colored rectangles)
        const stockPercent = category.currentStock / category.maxStock;
        const bookCount = Math.ceil(stockPercent * 10);

        for (let i = 0; i < bookCount; i++) {
            const bookX = x + 5 + (i % 5) * 22;
            const bookY = y + 5 + Math.floor(i / 5) * 25;
            const bookColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];

            this.ctx.fillStyle = bookColors[i % bookColors.length];
            this.ctx.fillRect(bookX, bookY, 18, 20);
        }

        // Stock text
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = 'bold 11px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${category.currentStock}/${category.maxStock}`, x + width / 2, y + height - 5);

        // Restocking indicator
        if (category.restocking) {
            this.ctx.fillStyle = 'rgba(255, 152, 0, 0.7)';
            this.ctx.fillRect(x, y, width, height);

            this.ctx.fillStyle = '#FFF';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.fillText('📦 Restocking', x + width / 2, y + height / 2);
        }
    }

    /**
     * Draw characters on a specific floor
     */
    drawFloorCharacters(floor, floorX, floorY) {
        const floorReaders = this.game.readers.filter(r =>
            r.floorId === floor.id && r.elevatorState === 'arrived'
        );

        floorReaders.forEach(reader => {
            // Find or create character sprite for this reader
            let char = this.characters.find(c => c.readerId === reader.id);

            if (!char) {
                // Create new character animation
                char = {
                    readerId: reader.id,
                    floorX: floorX,
                    floorY: floorY,
                    x: floorX + 30 + Math.random() * 200, // Start position
                    targetX: floorX + 250 + Math.random() * 150, // Walking to bookshelf
                    direction: 1, // 1 = right, -1 = left
                    walkSpeed: 0.5 + Math.random() * 0.5,
                    state: 'walking', // walking, reading
                    animationFrame: 0
                };
                this.characters.push(char);
            }

            // Draw character
            this.drawCharacter(char, floorY);
        });
    }

    /**
     * Draw a single character sprite
     */
    drawCharacter(char, floorY) {
        const baseY = floorY + 70; // Bottom of floor
        const charWidth = 20;
        const charHeight = 40;

        // Simple character representation (placeholder)
        // Head
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(char.x, baseY - charHeight + 8, 8, 0, Math.PI * 2);
        this.ctx.fill();

        // Body
        this.ctx.fillStyle = '#4A90E2';
        this.ctx.fillRect(char.x - 6, baseY - charHeight + 16, 12, 18);

        // Legs (animated walking)
        const legOffset = Math.sin(char.animationFrame * 0.2) * 3;
        this.ctx.fillStyle = '#2C3E50';
        this.ctx.fillRect(char.x - 5, baseY - 6, 3, 6); // Left leg
        this.ctx.fillRect(char.x + 2, baseY - 6 + legOffset, 3, 6 - legOffset); // Right leg (moving)

        // Arms
        this.ctx.strokeStyle = '#2C3E50';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(char.x - 6, baseY - charHeight + 20);
        this.ctx.lineTo(char.x - 10, baseY - charHeight + 28);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(char.x + 6, baseY - charHeight + 20);
        this.ctx.lineTo(char.x + 10, baseY - charHeight + 28);
        this.ctx.stroke();
    }

    /**
     * Update character positions and animations
     */
    updateCharacters() {
        // Remove characters for readers that checked out
        this.characters = this.characters.filter(char => {
            return this.game.readers.some(r => r.id === char.readerId);
        });

        // Update positions
        this.characters.forEach(char => {
            if (char.state === 'walking') {
                // Move towards target
                if (char.x < char.targetX) {
                    char.x += char.walkSpeed;
                    char.direction = 1;
                } else if (char.x > char.targetX) {
                    char.x -= char.walkSpeed;
                    char.direction = -1;
                }

                // Check if reached target
                if (Math.abs(char.x - char.targetX) < 2) {
                    char.state = 'reading';
                }
            }

            char.animationFrame++;
        });
    }

    /**
     * Draw empty build slot
     */
    drawBuildSlot(x, y) {
        // Dashed outline
        this.ctx.strokeStyle = '#9E9E9E';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([10, 5]);
        this.ctx.strokeRect(x, y, this.floorWidth, this.floorHeight);
        this.ctx.setLineDash([]);

        // Build button
        this.ctx.fillStyle = 'rgba(156, 39, 176, 0.2)';
        this.ctx.fillRect(x + this.floorWidth / 2 - 80, y + this.floorHeight / 2 - 25, 160, 50);

        this.ctx.fillStyle = '#9C27B0';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('➕ Build New Floor', x + this.floorWidth / 2, y + this.floorHeight / 2 + 5);

        // Store bounds for click
        this._buildSlotBounds = { x, y, width: this.floorWidth, height: this.floorHeight };
    }

    /**
     * Handle canvas clicks
     */
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        console.log('Canvas clicked at:', clickX, clickY);

        // Check build slot click first (top of tower)
        if (this._buildSlotBounds) {
            const b = this._buildSlotBounds;
            if (clickX >= b.x && clickX <= b.x + b.width &&
                clickY >= b.y && clickY <= b.y + b.height) {
                console.log('Build slot clicked!');
                if (window.openBuildModal) {
                    window.openBuildModal();
                }
                return; // Don't check floors if build slot was clicked
            }
        }

        // Check floor clicks (check all floors)
        const floors = [...this.game.floors].reverse(); // Top to bottom for click priority
        for (const floor of floors) {
            if (floor._renderBounds) {
                const b = floor._renderBounds;
                if (clickX >= b.x && clickX <= b.x + b.width &&
                    clickY >= b.y && clickY <= b.y + b.height) {
                    console.log('Floor clicked:', floor.name);
                    // Floor clicked - trigger detail view
                    if (window.openFloorDetail) {
                        window.openFloorDetail(floor.id);
                    }
                    return; // Stop checking after first match
                }
            }
        }

        console.log('No floor clicked');
    }

    /**
     * Clean up
     */
    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }
}
