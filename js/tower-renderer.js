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

        // Particle effects
        this.particles = []; // Star particles, sparkles, etc.

        // Clouds for weather effect
        this.clouds = [];
        this.initClouds();

        // Scrolling
        this.scrollY = 0; // Current scroll offset
        this.maxScrollY = 0; // Maximum scroll (calculated based on tower height)
        this.isDragging = false;
        this.dragStartY = 0;
        this.dragStartScrollY = 0;

        // Animation frame
        this.animationFrame = null;

        // Colors for floor types
        this.floorColors = {
            peach: { bg: '#FFD4B2', border: '#FFAB91', accent: '#FF8A65' },
            mint: { bg: '#C8E6C9', border: '#A5D6A7', accent: '#81C784' },
            sky: { bg: '#B3E5FC', border: '#81D4FA', accent: '#4FC3F7' },
            lavender: { bg: '#E1BEE7', border: '#CE93D8', accent: '#BA68C8' },
            brown: { bg: '#D7CCC8', border: '#BCAAA4', accent: '#A1887F' },
            rainbow: { bg: '#FFE5B4', border: '#FFD700', accent: '#FFA500' },
            pink: { bg: '#F8BBD0', border: '#F48FB1', accent: '#F06292' },
            purple: { bg: '#D1C4E9', border: '#B39DDB', accent: '#9575CD' },
            red: { bg: '#FFCDD2', border: '#EF9A9A', accent: '#E57373' },
            orange: { bg: '#FFE0B2', border: '#FFCC80', accent: '#FFB74D' },
            tan: { bg: '#F5DEB3', border: '#DEB887', accent: '#D2B48C' },
            green: { bg: '#C5E1A5', border: '#AED581', accent: '#9CCC65' },
            blue: { bg: '#BBDEFB', border: '#90CAF9', accent: '#64B5F6' },
            yellow: { bg: '#FFF59D', border: '#FFF176', accent: '#FFEE58' }
        };

        this.init();
    }

    init() {
        // Resize canvas to fit container
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Set up canvas click handling
        this.canvas.addEventListener('click', (e) => this.handleClick(e));

        // Set up scrolling with mouse wheel
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });

        // Set up drag-to-scroll
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleMouseUp(e));

        // Touch support for mobile - passive: true allows browser to scroll
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: true });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));

        // Set cursor style
        this.canvas.style.cursor = 'grab';

        // Start render loop
        this.render();
    }

    resizeCanvas() {
        // Get the actual display size
        const rect = this.canvas.getBoundingClientRect();
        const displayWidth = rect.width;
        const displayHeight = rect.height;

        // Set canvas internal size to match display size for crisp rendering
        if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
            this.canvas.width = displayWidth;
            this.canvas.height = displayHeight;
            this.width = displayWidth;
            this.height = displayHeight;

            // Scale floor dimensions proportionally
            this.scale = displayWidth / 600;
            this.floorWidth = 500 * this.scale;
            this.floorX = 50 * this.scale;
            this.floorHeight = 120 * this.scale;
            this.elevatorWidth = 40 * this.scale;
            this.elevatorX = 5 * this.scale;
            this.elevatorCarHeight = 80 * this.scale;
        }
    }

    /**
     * Get scale factor (default 1 if not set)
     */
    getScale() {
        return this.scale || 1;
    }

    /**
     * Get sky colors based on time of day
     */
    getSkyColors() {
        const hour = new Date().getHours();

        // Define time periods and their colors
        if (hour >= 6 && hour < 8) {
            // Sunrise
            return { top: '#FF9966', bottom: '#FFE4B5', timeOfDay: 'sunrise' };
        } else if (hour >= 8 && hour < 17) {
            // Day
            return { top: '#87CEEB', bottom: '#E0F6FF', timeOfDay: 'day' };
        } else if (hour >= 17 && hour < 19) {
            // Sunset
            return { top: '#FF6B6B', bottom: '#FFD93D', timeOfDay: 'sunset' };
        } else if (hour >= 19 && hour < 21) {
            // Dusk
            return { top: '#4A4E69', bottom: '#9A8C98', timeOfDay: 'dusk' };
        } else {
            // Night
            return { top: '#1a1a2e', bottom: '#16213e', timeOfDay: 'night' };
        }
    }

    /**
     * Draw sun or moon based on time of day
     */
    drawCelestialBody(timeOfDay) {
        const x = this.width - 60;
        const y = 50;

        if (timeOfDay === 'night' || timeOfDay === 'dusk') {
            // Draw moon
            this.ctx.fillStyle = '#F5F5DC';
            this.ctx.beginPath();
            this.ctx.arc(x, y, 20, 0, Math.PI * 2);
            this.ctx.fill();

            // Moon craters
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            this.ctx.beginPath();
            this.ctx.arc(x - 5, y - 5, 4, 0, Math.PI * 2);
            this.ctx.arc(x + 8, y + 3, 3, 0, Math.PI * 2);
            this.ctx.arc(x - 2, y + 8, 2, 0, Math.PI * 2);
            this.ctx.fill();

            // Stars
            this.ctx.fillStyle = '#FFF';
            for (let i = 0; i < 15; i++) {
                const starX = (i * 37 + 20) % this.width;
                const starY = (i * 23 + 10) % 80;
                const size = 1 + (i % 2);
                this.ctx.fillRect(starX, starY, size, size);
            }
        } else {
            // Draw sun
            this.ctx.fillStyle = timeOfDay === 'sunrise' || timeOfDay === 'sunset' ? '#FF6B35' : '#FFD700';
            this.ctx.beginPath();
            this.ctx.arc(x, y, 25, 0, Math.PI * 2);
            this.ctx.fill();

            // Sun glow
            this.ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(x, y, 35, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    /**
     * Initialize clouds
     */
    initClouds() {
        for (let i = 0; i < 5; i++) {
            this.clouds.push({
                x: Math.random() * 600,
                y: 20 + Math.random() * 60,
                width: 40 + Math.random() * 40,
                speed: 0.1 + Math.random() * 0.2,
                opacity: 0.3 + Math.random() * 0.4
            });
        }
    }

    /**
     * Draw and update clouds
     */
    drawClouds() {
        this.clouds.forEach(cloud => {
            // Update position
            cloud.x += cloud.speed;
            if (cloud.x > this.width + cloud.width) {
                cloud.x = -cloud.width;
            }

            // Draw cloud (simple puffy shape)
            this.ctx.fillStyle = `rgba(255, 255, 255, ${cloud.opacity})`;
            this.ctx.beginPath();
            this.ctx.arc(cloud.x, cloud.y, cloud.width * 0.3, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + cloud.width * 0.3, cloud.y - 5, cloud.width * 0.25, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + cloud.width * 0.5, cloud.y, cloud.width * 0.3, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    /**
     * Main render loop
     */
    render() {
        // Calculate max scroll based on tower height
        const floors = [...this.game.floors];
        const towerHeight = (floors.length + 1) * this.floorHeight + 40; // +1 for build slot, +40 for ground
        const maxScrollY = Math.max(0, towerHeight - this.height);

        // Auto-scroll to show top floors by default if tower is taller than canvas
        if (maxScrollY > 0 && this.scrollY === 0 && !this._hasScrolled) {
            this.scrollY = maxScrollY; // Start scrolled to show top
        }

        this.maxScrollY = maxScrollY;

        // Clamp scroll position
        this.scrollY = Math.max(0, Math.min(this.scrollY, this.maxScrollY));

        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw background (sky with day/night cycle)
        const skyColors = this.getSkyColors();
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, skyColors.top);
        gradient.addColorStop(1, skyColors.bottom);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw sun or moon
        this.drawCelestialBody(skyColors.timeOfDay);

        // Draw clouds
        this.drawClouds();

        // Save context and apply scroll offset
        // When scrollY is positive, we translate UP (positive Y) to bring negative Y values into view
        this.ctx.save();
        this.ctx.translate(0, this.scrollY);

        // Draw ground
        this.ctx.fillStyle = '#8BC34A';
        this.ctx.fillRect(0, this.height - 40, this.width, 40);

        // Draw elevator shaft
        this.drawElevatorShaft();

        // Draw floors (bottom to top) - reuse floors variable from above
        const floorsReversed = floors.reverse();
        floorsReversed.forEach((floor, index) => {
            const y = this.height - 40 - (index + 1) * this.floorHeight;
            this.drawFloor(floor, this.floorX, y, index);
        });

        // Draw elevator car(s) with readers
        this.drawElevators();

        // Draw "Build Floor" button at top
        if (this.game.floors.length < this.game.maxFloors) {
            const buildY = this.height - 40 - (floorsReversed.length + 1) * this.floorHeight;
            this.drawBuildSlot(this.floorX, buildY);
        }

        // Update and draw characters
        this.updateCharacters();

        // Update and draw particles
        this.updateParticles();

        // Restore context (end scrollable area)
        this.ctx.restore();

        // Draw scroll indicator if scrollable
        if (this.maxScrollY > 0) {
            this.drawScrollIndicator();
        }

        // Continue loop
        this.animationFrame = requestAnimationFrame(() => this.render());
    }

    /**
     * Draw a single floor
     */
    drawFloor(floor, x, y, floorIndex) {
        const colors = this.floorColors[floor.color] || this.floorColors.peach;

        // Drop shadow below floor for depth
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(x, y + this.floorHeight, this.floorWidth, 8);

        // Gradient for floor depth
        const gradient = this.ctx.createLinearGradient(x, y, x, y + this.floorHeight);
        gradient.addColorStop(0, this.lightenColor(colors.bg, 10));
        gradient.addColorStop(1, colors.bg);

        // Floor background with gradient
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, y, this.floorWidth, this.floorHeight);

        // Top highlight for lighting effect
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.fillRect(x, y, this.floorWidth, 3);

        // Side shadow for depth
        const sideGradient = this.ctx.createLinearGradient(x, y, x + 20, y);
        sideGradient.addColorStop(0, 'rgba(0, 0, 0, 0.2)');
        sideGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        this.ctx.fillStyle = sideGradient;
        this.ctx.fillRect(x, y, 20, this.floorHeight);

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

        // Shaft should only extend to actual built floors, not the build slot
        // Top floor is at: height - 40 - (1) * floorHeight
        // Bottom floor is at: height - 40 - (numFloors) * floorHeight
        // Shaft goes from ground (height - 40) to top of highest floor
        const topFloorBottom = this.height - 40 - (1) * this.floorHeight;
        const shaftHeight = (this.height - 40) - topFloorBottom;
        const shaftY = topFloorBottom;

        // Shaft background with gradient for depth
        const shaftGradient = this.ctx.createLinearGradient(
            this.elevatorX, shaftY,
            this.elevatorX + this.elevatorWidth, shaftY
        );
        shaftGradient.addColorStop(0, '#5a5a5a');
        shaftGradient.addColorStop(0.5, '#757575');
        shaftGradient.addColorStop(1, '#5a5a5a');
        this.ctx.fillStyle = shaftGradient;
        this.ctx.fillRect(this.elevatorX, shaftY, this.elevatorWidth, shaftHeight);

        // Inner shadow on left side
        const leftShadow = this.ctx.createLinearGradient(
            this.elevatorX, shaftY,
            this.elevatorX + 8, shaftY
        );
        leftShadow.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
        leftShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        this.ctx.fillStyle = leftShadow;
        this.ctx.fillRect(this.elevatorX, shaftY, 8, shaftHeight);

        // Shaft border
        this.ctx.strokeStyle = '#424242';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.elevatorX, shaftY, this.elevatorWidth, shaftHeight);

        // Floor markers (horizontal lines)
        this.ctx.strokeStyle = '#616161';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < numFloors; i++) {
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

        // Check if this is a special room
        const floorType = this.game.floorTypes.find(ft => ft.id === floor.typeId);
        if (floorType && floorType.isSpecialRoom) {
            // Draw special room content
            this.drawSpecialRoom(floor, x, y, colors, floorType);
        } else {
            // Draw book shelves (3 categories) - scale with floor size
            const scale = this.getScale();
            const shelfY = y + 40 * scale;
            const shelfWidth = 120 * scale;
            const shelfHeight = 60 * scale;
            const shelfSpacing = (this.floorWidth - 60 * scale - shelfWidth * 3) / 2;

            floor.bookStock.forEach((category, index) => {
                const shelfX = x + 30 * scale + index * (shelfWidth + shelfSpacing);
                this.drawBookshelf(category, shelfX, shelfY, shelfWidth, shelfHeight, colors, floor.typeId, scale);
            });
        }

        // Store floor bounds for click detection
        floor._renderBounds = { x, y, width: this.floorWidth, height: this.floorHeight, floorIndex };

        // Draw characters on this floor
        this.drawFloorCharacters(floor, x, y);
    }

    /**
     * Draw a bookshelf with stock indicator
     */
    drawBookshelf(category, x, y, width, height, colors, floorType, scale = 1) {
        // Determine shelf style and book colors based on floor type
        const shelfStyles = this.getShelfStyle(floorType);

        // Draw shelf with custom shape based on style
        this.ctx.fillStyle = shelfStyles.shelfColor;
        this.ctx.strokeStyle = shelfStyles.borderColor;
        this.ctx.lineWidth = 2 * scale;

        // Draw different shelf shapes based on floor type
        this.ctx.beginPath();

        const r = 10 * scale; // Corner radius scaled
        const r5 = 5 * scale;
        const r15 = 15 * scale;

        switch(shelfStyles.shape) {
            case 'rounded':
                // Rounded top corners
                this.ctx.moveTo(x, y + r);
                this.ctx.arcTo(x, y, x + r, y, r);
                this.ctx.lineTo(x + width - r, y);
                this.ctx.arcTo(x + width, y, x + width, y + r, r);
                this.ctx.lineTo(x + width, y + height);
                this.ctx.lineTo(x, y + height);
                this.ctx.closePath();
                break;

            case 'scalloped':
                // Scalloped top edge
                this.ctx.moveTo(x, y + r);
                for (let i = 0; i < 4; i++) {
                    const scallop_x = x + (width / 4) * i + (width / 8);
                    const scallop_y = y;
                    this.ctx.quadraticCurveTo(
                        x + (width / 4) * i, y + r,
                        scallop_x, scallop_y
                    );
                    this.ctx.quadraticCurveTo(
                        x + (width / 4) * (i + 1), y + r,
                        x + (width / 4) * (i + 1), y + r
                    );
                }
                this.ctx.lineTo(x + width, y + height);
                this.ctx.lineTo(x, y + height);
                this.ctx.closePath();
                break;

            case 'arched':
                // Arched top
                this.ctx.moveTo(x, y + height);
                this.ctx.lineTo(x, y + r15);
                this.ctx.quadraticCurveTo(x + width / 2, y - r5, x + width, y + r15);
                this.ctx.lineTo(x + width, y + height);
                this.ctx.closePath();
                break;

            case 'peaked':
                // Peaked/triangle top
                this.ctx.moveTo(x, y + r15);
                this.ctx.lineTo(x + width / 2, y);
                this.ctx.lineTo(x + width, y + r15);
                this.ctx.lineTo(x + width, y + height);
                this.ctx.lineTo(x, y + height);
                this.ctx.closePath();
                break;

            case 'ornate':
                // Ornate with decorative corners
                this.ctx.moveTo(x + r5, y + r5);
                this.ctx.lineTo(x, y + r);
                this.ctx.lineTo(x, y + height);
                this.ctx.lineTo(x + width, y + height);
                this.ctx.lineTo(x + width, y + r);
                this.ctx.lineTo(x + width - r5, y + r5);
                this.ctx.lineTo(x + width - r5, y);
                this.ctx.lineTo(x + r5, y);
                this.ctx.closePath();
                break;

            default: // 'rectangular'
                // Standard rectangle
                this.ctx.rect(x, y, width, height);
                break;
        }

        this.ctx.fill();
        this.ctx.stroke();

        // Inner shadow for depth
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        this.ctx.fillRect(x + 2 * scale, y + 2 * scale, width - 4 * scale, 8 * scale);

        // Books (as colored rectangles with shadows)
        const stockPercent = category.currentStock / category.maxStock;
        const bookCount = Math.ceil(stockPercent * 10);

        const bookWidth = 18 * scale;
        const bookHeight = 20 * scale;
        const bookSpacingX = 22 * scale;
        const bookSpacingY = 25 * scale;

        for (let i = 0; i < bookCount; i++) {
            const bookX = x + 5 * scale + (i % 5) * bookSpacingX;
            const bookY = y + 5 * scale + Math.floor(i / 5) * bookSpacingY;

            // Book shadow
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.fillRect(bookX + 1 * scale, bookY + 1 * scale, bookWidth, bookHeight);

            // Book
            this.ctx.fillStyle = shelfStyles.bookColors[i % shelfStyles.bookColors.length];
            this.ctx.fillRect(bookX, bookY, bookWidth, bookHeight);

            // Book highlight
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.fillRect(bookX, bookY, 2 * scale, bookHeight);
        }

        // Stock text
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = `bold ${Math.round(11 * scale)}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${category.currentStock}/${category.maxStock}`, x + width / 2, y + height - 5 * scale);

        // Restocking indicator
        if (category.restocking) {
            this.ctx.fillStyle = 'rgba(255, 152, 0, 0.7)';
            this.ctx.fillRect(x, y, width, height);

            this.ctx.fillStyle = '#FFF';
            this.ctx.font = `bold ${Math.round(12 * scale)}px Arial`;
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

        const scale = this.getScale();

        floorReaders.forEach(reader => {
            // Find or create character sprite for this reader
            let char = this.characters.find(c => c.readerId === reader.id);

            if (!char) {
                // Create new character animation - scale positions to floor size
                const startOffset = 30 * scale + Math.random() * (100 * scale);
                const targetOffset = 150 * scale + Math.random() * (this.floorWidth - 200 * scale);

                char = {
                    readerId: reader.id,
                    readerType: reader.type,
                    readerEmoji: reader.emoji,
                    floorX: floorX,
                    floorY: floorY,
                    x: floorX + startOffset, // Start position (scaled)
                    targetX: floorX + targetOffset, // Walking to bookshelf (scaled)
                    direction: 1, // 1 = right, -1 = left
                    walkSpeed: (0.5 + Math.random() * 0.5) * scale,
                    state: 'walking', // walking, reading
                    animationFrame: 0
                };
                this.characters.push(char);
            }

            // Draw character
            this.drawCharacter(char, floorY, reader);
        });
    }

    /**
     * Draw a single character sprite
     */
    drawCharacter(char, floorY, reader) {
        const baseY = floorY + this.floorHeight - 10; // Bottom of floor (with small padding)
        const charHeight = 40;

        // Get character style based on reader type
        const style = this.getCharacterStyle(reader);

        // Walking animation offset
        const legOffset = Math.sin(char.animationFrame * 0.2) * 2;
        const armSwing = Math.sin(char.animationFrame * 0.2) * 4;
        const bobbing = Math.abs(Math.sin(char.animationFrame * 0.2)) * 1;

        const headY = baseY - charHeight + 8 - bobbing;
        const bodyY = baseY - charHeight + 16 - bobbing;
        const legY = baseY - 6 - bobbing;

        // Shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.beginPath();
        this.ctx.ellipse(char.x, baseY, 8, 3, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Legs (animated walking)
        this.ctx.fillStyle = style.pantsColor;
        // Left leg
        this.ctx.fillRect(char.x - 5, legY - legOffset, 4, 8 + legOffset);
        // Right leg
        this.ctx.fillRect(char.x + 1, legY + legOffset, 4, 8 - legOffset);

        // Body/Torso
        this.ctx.fillStyle = style.shirtColor;
        this.ctx.fillRect(char.x - 7, bodyY, 14, 20);

        // Add body details/pattern based on type
        if (style.hasPattern) {
            this.ctx.fillStyle = style.patternColor;
            // Simple stripe or dot pattern
            this.ctx.fillRect(char.x - 5, bodyY + 5, 10, 2);
            this.ctx.fillRect(char.x - 5, bodyY + 10, 10, 2);
        }

        // Arms (animated swinging)
        this.ctx.strokeStyle = style.skinColor;
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';

        // Left arm
        this.ctx.beginPath();
        this.ctx.moveTo(char.x - 7, bodyY + 2);
        this.ctx.lineTo(char.x - 10, bodyY + 10 - armSwing);
        this.ctx.stroke();

        // Right arm
        this.ctx.beginPath();
        this.ctx.moveTo(char.x + 7, bodyY + 2);
        this.ctx.lineTo(char.x + 10, bodyY + 10 + armSwing);
        this.ctx.stroke();

        // Neck
        this.ctx.fillStyle = style.skinColor;
        this.ctx.fillRect(char.x - 2, bodyY - 2, 4, 4);

        // Head
        this.ctx.fillStyle = style.skinColor;
        this.ctx.beginPath();
        this.ctx.arc(char.x, headY, 9, 0, Math.PI * 2);
        this.ctx.fill();

        // Hair
        this.ctx.fillStyle = style.hairColor;
        if (style.hairStyle === 'short') {
            this.ctx.beginPath();
            this.ctx.arc(char.x, headY - 2, 9, Math.PI, Math.PI * 2);
            this.ctx.fill();
        } else if (style.hairStyle === 'long') {
            this.ctx.beginPath();
            this.ctx.arc(char.x, headY - 2, 9, Math.PI, Math.PI * 2);
            this.ctx.fill();
            // Long hair sides
            this.ctx.fillRect(char.x - 9, headY - 2, 3, 10);
            this.ctx.fillRect(char.x + 6, headY - 2, 3, 10);
        } else if (style.hairStyle === 'curly') {
            // Curly/puffy hair
            this.ctx.beginPath();
            this.ctx.arc(char.x - 5, headY - 4, 5, 0, Math.PI * 2);
            this.ctx.arc(char.x, headY - 6, 6, 0, Math.PI * 2);
            this.ctx.arc(char.x + 5, headY - 4, 5, 0, Math.PI * 2);
            this.ctx.fill();
        } else if (style.hairStyle === 'bald') {
            // Just the top of head, no extra hair
        }

        // Facial features
        // Eyes
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(char.x - 3, headY - 1, 2, 2);
        this.ctx.fillRect(char.x + 1, headY - 1, 2, 2);

        // Accessories
        if (style.hasGlasses) {
            this.ctx.strokeStyle = '#333';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(char.x - 3, headY, 3, 0, Math.PI * 2);
            this.ctx.arc(char.x + 3, headY, 3, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(char.x - 0, headY);
            this.ctx.lineTo(char.x + 0, headY);
            this.ctx.stroke();
        }

        // VIP indicator (sparkle effect)
        if (reader.type === 'vip') {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('✨', char.x - 12, headY - 8);
        }

        // Regular customer indicator (heart)
        if (reader.isRegular) {
            this.ctx.fillStyle = '#FF69B4';
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('💖', char.x + 12, headY - 8);
        }
    }

    /**
     * Get character visual style based on reader type
     */
    getCharacterStyle(reader) {
        const styles = {
            kid: {
                skinColor: '#FDBCB4',
                hairColor: '#8B4513',
                hairStyle: 'short',
                shirtColor: '#FF6B6B',
                pantsColor: '#4ECDC4',
                hasPattern: true,
                patternColor: '#FFF',
                hasGlasses: false
            },
            teen: {
                skinColor: '#F4C2A6',
                hairColor: '#2C1810',
                hairStyle: 'long',
                shirtColor: '#9370DB',
                pantsColor: '#2C3E50',
                hasPattern: false,
                patternColor: '#FFF',
                hasGlasses: false
            },
            adult: {
                skinColor: '#E8B89A',
                hairColor: '#4A3728',
                hairStyle: 'short',
                shirtColor: '#4A90E2',
                pantsColor: '#2C3E50',
                hasPattern: false,
                patternColor: '#FFF',
                hasGlasses: Math.random() > 0.5
            },
            senior: {
                skinColor: '#F5D5C3',
                hairColor: '#CCCCCC',
                hairStyle: Math.random() > 0.5 ? 'short' : 'bald',
                shirtColor: '#8B7355',
                pantsColor: '#5C4033',
                hasPattern: false,
                patternColor: '#FFF',
                hasGlasses: true
            },
            student: {
                skinColor: '#F4C2A6',
                hairColor: '#654321',
                hairStyle: 'curly',
                shirtColor: '#2ECC71',
                pantsColor: '#34495E',
                hasPattern: false,
                patternColor: '#FFF',
                hasGlasses: true
            }
        };

        // VIP readers get special fancy clothes
        if (reader.type === 'vip') {
            return {
                skinColor: '#F4C2A6',
                hairColor: '#FFD700',
                hairStyle: 'curly',
                shirtColor: '#FFD700',
                pantsColor: '#9370DB',
                hasPattern: true,
                patternColor: '#FFF',
                hasGlasses: true
            };
        }

        return styles[reader.type] || styles.adult;
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
        // Don't process clicks if we were dragging
        if (this.isDragging) return;

        const rect = this.canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = (e.clientY - rect.top) - this.scrollY; // Account for scroll offset

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
     * Get shelf style based on floor type
     */
    getShelfStyle(floorType) {
        const styles = {
            // Children's floors - light woods with rounded/playful shapes
            board_books: {
                shelfColor: '#DEB887',
                borderColor: '#D2691E',
                shape: 'rounded',
                bookColors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#95E1D3', '#FFA07A']
            },
            picture_books: {
                shelfColor: '#F4A460',
                borderColor: '#D2691E',
                shape: 'scalloped',
                bookColors: ['#FF6347', '#FFD700', '#98D8C8', '#87CEEB', '#DDA0DD']
            },
            early_readers: {
                shelfColor: '#D2B48C',
                borderColor: '#BC9B7D',
                shape: 'rounded',
                bookColors: ['#90EE90', '#FFB6C1', '#FFD700', '#87CEEB', '#DDA0DD']
            },
            juvenile_series: {
                shelfColor: '#CD853F',
                borderColor: '#8B4513',
                shape: 'peaked',
                bookColors: ['#4169E1', '#FF4500', '#FFD700', '#32CD32', '#FF69B4']
            },
            teen: {
                shelfColor: '#A0826D',
                borderColor: '#6D5843',
                shape: 'rectangular',
                bookColors: ['#8A2BE2', '#FF1493', '#00CED1', '#FFD700', '#FF6347']
            },

            // Fiction floors - classic wood tones with traditional shapes
            fiction: {
                shelfColor: '#8D6E63',
                borderColor: '#5D4037',
                shape: 'rectangular',
                bookColors: ['#8B4513', '#A0522D', '#CD853F', '#DEB887', '#D2691E']
            },
            mystery: {
                shelfColor: '#6D5843',
                borderColor: '#5C4033',
                shape: 'ornate',
                bookColors: ['#2F4F4F', '#696969', '#708090', '#778899', '#B0C4DE']
            },
            romance: {
                shelfColor: '#BC9B7D',
                borderColor: '#A0826D',
                shape: 'arched',
                bookColors: ['#FF69B4', '#FFB6C1', '#FFC0CB', '#DB7093', '#C71585']
            },
            scifi: {
                shelfColor: '#8B7355',
                borderColor: '#5C4033',
                shape: 'rectangular',
                bookColors: ['#00CED1', '#4169E1', '#6A5ACD', '#7B68EE', '#9370DB']
            },
            fantasy: {
                shelfColor: '#A0826D',
                borderColor: '#6D5843',
                shape: 'arched',
                bookColors: ['#8A2BE2', '#9370DB', '#BA55D3', '#DA70D6', '#EE82EE']
            },
            true_crime: {
                shelfColor: '#5C4033',
                borderColor: '#3E2723',
                shape: 'rectangular',
                bookColors: ['#DC143C', '#B22222', '#8B0000', '#A52A2A', '#CD5C5C']
            },
            graphic_novels: {
                shelfColor: '#D2691E',
                borderColor: '#8B4513',
                shape: 'rectangular',
                bookColors: ['#FF4500', '#FF6347', '#FFD700', '#FFA500', '#FF8C00']
            },

            // Non-fiction floors - scholarly browns
            biography: {
                shelfColor: '#A0826D',
                borderColor: '#6D5843',
                shape: 'ornate',
                bookColors: ['#8B7355', '#A0826D', '#BC9B7D', '#D2B48C', '#DEB887']
            },
            history: {
                shelfColor: '#8B7355',
                borderColor: '#5C4033',
                shape: 'ornate',
                bookColors: ['#704214', '#8B5A3C', '#A0826D', '#BC9B7D', '#8B7355']
            },
            local_history: {
                shelfColor: '#D2B48C',
                borderColor: '#A0826D',
                shape: 'peaked',
                bookColors: ['#CD853F', '#DAA520', '#B8860B', '#D2691E', '#8B4513']
            },
            science: {
                shelfColor: '#8B6F47',
                borderColor: '#654321',
                shape: 'rectangular',
                bookColors: ['#228B22', '#32CD32', '#3CB371', '#2E8B57', '#008B8B']
            },
            technology: {
                shelfColor: '#7A6A4F',
                borderColor: '#5C4033',
                shape: 'rectangular',
                bookColors: ['#4682B4', '#5F9EA0', '#708090', '#778899', '#B0C4DE']
            },
            sports: {
                shelfColor: '#CD853F',
                borderColor: '#8B4513',
                shape: 'rectangular',
                bookColors: ['#FF8C00', '#FFD700', '#FFA500', '#FF4500', '#DC143C']
            },
            cookbooks: {
                shelfColor: '#D2691E',
                borderColor: '#A0522D',
                shape: 'rounded',
                bookColors: ['#FF6347', '#FF7F50', '#FFA07A', '#FA8072', '#E9967A']
            },
            library_of_things: {
                shelfColor: '#BC9B7D',
                borderColor: '#8B7355',
                shape: 'rounded',
                bookColors: ['#FF69B4', '#FFD700', '#00CED1', '#FF6347', '#32CD32']
            },

            // Food service floors - warm browns
            coffee_shop: {
                shelfColor: '#6F4E37',
                borderColor: '#3E2723',
                shape: 'rounded',
                bookColors: ['#795548', '#8D6E63', '#A1887F', '#BCAAA4', '#D7CCC8']
            },
            bakery: {
                shelfColor: '#DEB887',
                borderColor: '#D2691E',
                shape: 'scalloped',
                bookColors: ['#FFE4B5', '#FFDEAD', '#F5DEB3', '#DEB887', '#D2B48C']
            },
            hot_drinks_cafe: {
                shelfColor: '#8B4513',
                borderColor: '#654321',
                shape: 'rounded',
                bookColors: ['#A0522D', '#8B4513', '#D2691E', '#CD853F', '#F4A460']
            },
            snack_bar: {
                shelfColor: '#D2B48C',
                borderColor: '#BC9B7D',
                shape: 'rounded',
                bookColors: ['#FFD700', '#F0E68C', '#EEE8AA', '#FAFAD2', '#FFE4B5']
            }
        };

        return styles[floorType] || styles.fiction; // Default to fiction style
    }

    /**
     * Spawn star particles when earning stars
     */
    spawnStarParticles(x, y, amount) {
        const particleCount = Math.min(amount, 10); // Max 10 particles
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: -2 - Math.random() * 3,
                life: 1.0,
                decay: 0.015,
                size: 8 + Math.random() * 8,
                type: 'star',
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2
            });
        }
    }

    /**
     * Spawn text popup for notifications
     */
    spawnTextParticle(x, y, text, color = '#FFD700') {
        this.particles.push({
            x: x,
            y: y,
            vx: 0,
            vy: -1.5,
            life: 1.0,
            decay: 0.01,
            text: text,
            color: color,
            type: 'text',
            size: 16
        });
    }

    /**
     * Spawn sparkle effect
     */
    spawnSparkle(x, y) {
        for (let i = 0; i < 3; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                life: 1.0,
                decay: 0.02,
                size: 4 + Math.random() * 4,
                type: 'sparkle',
                rotation: Math.random() * Math.PI * 2
            });
        }
    }

    /**
     * Update and draw all particles
     */
    updateParticles() {
        // Update particles
        this.particles = this.particles.filter(p => {
            // Update position
            p.x += p.vx;
            p.y += p.vy;

            // Apply gravity for stars
            if (p.type === 'star') {
                p.vy += 0.15;
                p.rotation += p.rotationSpeed;
            }

            // Fade out
            p.life -= p.decay;

            return p.life > 0;
        });

        // Draw particles
        this.particles.forEach(p => {
            this.ctx.save();
            this.ctx.globalAlpha = p.life;

            if (p.type === 'star') {
                // Draw star
                this.ctx.translate(p.x, p.y);
                this.ctx.rotate(p.rotation);
                this.ctx.fillStyle = '#FFD700';
                this.ctx.font = `${p.size}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('⭐', 0, 0);
            } else if (p.type === 'text') {
                // Draw floating text
                this.ctx.fillStyle = p.color;
                this.ctx.strokeStyle = '#000';
                this.ctx.lineWidth = 3;
                this.ctx.font = `bold ${p.size}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.strokeText(p.text, p.x, p.y);
                this.ctx.fillText(p.text, p.x, p.y);
            } else if (p.type === 'sparkle') {
                // Draw sparkle
                this.ctx.fillStyle = '#FFD700';
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();
            }

            this.ctx.restore();
        });
    }

    /**
     * Handle mouse wheel scrolling
     */
    handleWheel(e) {
        e.preventDefault();
        this._hasScrolled = true;
        const scrollSpeed = 30;
        this.scrollY += e.deltaY > 0 ? scrollSpeed : -scrollSpeed;
    }

    /**
     * Handle mouse down for drag scrolling
     */
    handleMouseDown(e) {
        this.isDragging = true;
        this.dragStartY = e.clientY;
        this.dragStartScrollY = this.scrollY;
        this.canvas.style.cursor = 'grabbing';
    }

    /**
     * Handle mouse move for drag scrolling
     */
    handleMouseMove(e) {
        if (!this.isDragging) return;
        this._hasScrolled = true;
        const deltaY = e.clientY - this.dragStartY;
        this.scrollY = this.dragStartScrollY - deltaY;
    }

    /**
     * Handle mouse up for drag scrolling
     */
    handleMouseUp(e) {
        this.isDragging = false;
        this.canvas.style.cursor = 'grab';
    }

    /**
     * Handle touch start for mobile
     */
    handleTouchStart(e) {
        if (e.touches.length === 1) {
            this.isDragging = true;
            this.dragStartY = e.touches[0].clientY;
            this.dragStartX = e.touches[0].clientX;
            this.dragStartScrollY = this.scrollY;
            this._touchMoved = false;
        }
    }

    /**
     * Handle touch move for mobile
     */
    handleTouchMove(e) {
        if (!this.isDragging || e.touches.length !== 1) return;

        const deltaX = Math.abs(e.touches[0].clientX - this.dragStartX);
        const deltaY = Math.abs(e.touches[0].clientY - this.dragStartY);

        // Only consider it a scroll if moved more than 10px
        if (deltaX > 10 || deltaY > 10) {
            this._touchMoved = true;
        }

        // Don't scroll tower internally on mobile - let page scroll handle it
        // const scrollDeltaY = e.touches[0].clientY - this.dragStartY;
        // this.scrollY = this.dragStartScrollY - scrollDeltaY;
    }

    /**
     * Handle touch end for mobile
     */
    handleTouchEnd(e) {
        // If we didn't move much, treat it as a tap/click
        if (!this._touchMoved && this.isDragging) {
            // Create a synthetic click event at the touch position
            const rect = this.canvas.getBoundingClientRect();
            const clickX = this.dragStartX - rect.left;
            const clickY = (this.dragStartY - rect.top) - this.scrollY;

            console.log('Touch tap at:', clickX, clickY);

            // Check build slot click first
            if (this._buildSlotBounds) {
                const b = this._buildSlotBounds;
                if (clickX >= b.x && clickX <= b.x + b.width &&
                    clickY >= b.y && clickY <= b.y + b.height) {
                    console.log('Build slot tapped!');
                    if (window.openBuildModal) {
                        window.openBuildModal();
                    }
                    this.isDragging = false;
                    return;
                }
            }

            // Check floor clicks
            const floors = [...this.game.floors].reverse();
            for (const floor of floors) {
                if (floor._renderBounds) {
                    const b = floor._renderBounds;
                    if (clickX >= b.x && clickX <= b.x + b.width &&
                        clickY >= b.y && clickY <= b.y + b.height) {
                        console.log('Floor tapped:', floor.name);
                        if (window.openFloorDetail) {
                            window.openFloorDetail(floor.id);
                        }
                        this.isDragging = false;
                        return;
                    }
                }
            }
        }

        this.isDragging = false;
    }

    /**
     * Draw scroll indicator
     */
    drawScrollIndicator() {
        const indicatorHeight = 100;
        const indicatorWidth = 8;
        const x = this.width - 15;
        const y = 10;

        // Background track
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.fillRect(x, y, indicatorWidth, indicatorHeight);

        // Scrollbar thumb
        const thumbHeight = Math.max(20, (this.height / (this.height + this.maxScrollY)) * indicatorHeight);
        const thumbY = y + (this.scrollY / this.maxScrollY) * (indicatorHeight - thumbHeight);

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(x, thumbY, indicatorWidth, thumbHeight);
    }

    /**
     * Draw special room (no bookshelves, just visual theme)
     */
    drawSpecialRoom(floor, x, y, colors, floorType) {
        const centerX = x + this.floorWidth / 2;
        const centerY = y + this.floorHeight / 2;

        // Draw bonus description
        this.ctx.fillStyle = '#666';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(floorType.bonus.description, centerX, y + 35);

        // Draw themed elements based on room type
        switch(floorType.id) {
            case 'study_room':
                // Draw desks with lamps
                for (let i = 0; i < 3; i++) {
                    const deskX = x + 80 + i * 150;
                    const deskY = y + 50;

                    // Desk
                    this.ctx.fillStyle = '#8D6E63';
                    this.ctx.fillRect(deskX, deskY, 80, 40);

                    // Lamp
                    this.ctx.fillStyle = '#FFD54F';
                    this.ctx.beginPath();
                    this.ctx.arc(deskX + 40, deskY + 10, 8, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                break;

            case 'maker_space':
                // Draw tools and equipment
                this.ctx.fillStyle = '#78909C';
                this.ctx.fillRect(x + 100, y + 50, 100, 60);
                this.ctx.fillRect(x + 300, y + 50, 100, 60);

                // 3D printer emoji
                this.ctx.fillStyle = '#000';
                this.ctx.font = '40px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('🖨️', x + 150, y + 90);
                this.ctx.fillText('🔧', x + 350, y + 90);
                break;

            case 'event_hall':
                // Draw stage
                this.ctx.fillStyle = '#D32F2F';
                this.ctx.fillRect(x + 150, y + 40, 200, 60);

                // Curtains
                this.ctx.fillStyle = 'rgba(139, 0, 0, 0.7)';
                this.ctx.fillRect(x + 140, y + 35, 15, 70);
                this.ctx.fillRect(x + 345, y + 35, 15, 70);

                // Podium
                this.ctx.fillStyle = '#6D4C41';
                this.ctx.fillRect(x + 235, y + 60, 30, 40);
                break;
        }

        // Bonus indicator
        this.ctx.fillStyle = 'rgba(76, 175, 80, 0.3)';
        this.ctx.fillRect(x + 10, y + this.floorHeight - 25, this.floorWidth - 20, 15);

        this.ctx.fillStyle = '#4CAF50';
        this.ctx.font = 'bold 11px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`✨ ACTIVE BONUS: ${floorType.bonus.type.toUpperCase().replace('_', ' ')}`, centerX, y + this.floorHeight - 13);
    }

    /**
     * Lighten a hex color by a percentage
     */
    lightenColor(color, percent) {
        const num = parseInt(color.replace("#",""), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
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
