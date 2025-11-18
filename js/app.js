/**
 * SimLibrary - Tiny Tower Style UI
 * Handles UI rendering and user interactions
 */

// Game state instance
let game;
let currentFloorId = null;
let towerRenderer = null;

/**
 * Initialize the application
 */
function init() {
    game = new GameState();

    // Initialize tower renderer
    towerRenderer = new TowerRenderer('tower-canvas', game);

    // Set up event listeners
    setupEventListeners();

    // Render initial state
    renderTowerScreen();
    updateGlobalStats();

    // Expose functions for tower renderer to call
    window.openFloorDetail = openFloorDetail;
    window.openBuildModal = openBuildModal;

    // Start game tick (every 1 second for responsive feel)
    setInterval(() => {
        game.tick();
        updateGlobalStats();
        updateTowerScreen();

        // If viewing floor details, refresh it
        if (currentFloorId) {
            const floor = game.getFloor(currentFloorId);
            if (floor) {
                updateFloorDetail(floor);
            }
        }
    }, 1000);

    console.log('SimLibrary v2.1 (Visual Tower!) initialized!');
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // Add Floor button - opens build modal
    document.getElementById('add-floor-btn').addEventListener('click', () => {
        openBuildModal();
    });

    // Detail screen back button
    document.getElementById('detail-back-btn').addEventListener('click', () => {
        closeDetailScreen();
    });

    // Build modal close button
    document.getElementById('close-build-modal').addEventListener('click', () => {
        closeBuildModal();
    });

    // Close modal when clicking outside
    document.getElementById('build-modal').addEventListener('click', (e) => {
        if (e.target.id === 'build-modal') {
            closeBuildModal();
        }
    });
}

/**
 * Update global stats display (stars, bucks, level)
 */
function updateGlobalStats() {
    document.getElementById('total-stars').textContent = Math.floor(game.stars);
    document.getElementById('total-bucks').textContent = game.towerBucks;
    document.getElementById('player-level').textContent = game.level;
}

/**
 * Render the Library Tower Screen
 */
function renderTowerScreen() {
    const floorsList = document.getElementById('floors-list');
    floorsList.innerHTML = '';

    if (game.floors.length === 0) {
        floorsList.innerHTML = `
            <div class="empty-tower">
                <p>🏗️ Your library tower is empty!</p>
                <p>Click "Build New Floor" to get started.</p>
            </div>
        `;
        return;
    }

    // Render floors in reverse order (top to bottom)
    [...game.floors].reverse().forEach(floor => {
        const floorCard = createFloorCard(floor);
        floorsList.appendChild(floorCard);
    });
}

/**
 * Update tower screen (refresh timers, stock levels)
 */
function updateTowerScreen() {
    game.floors.forEach(floor => {
        updateFloorCard(floor);
    });
}

/**
 * Create a floor card element
 */
function createFloorCard(floor) {
    const card = document.createElement('div');
    card.className = `floor-card ${floor.color}`;
    card.id = `floor-card-${floor.id}`;

    if (floor.status === 'building') {
        const remaining = Math.max(0, Math.ceil((floor.buildEndTime - Date.now()) / 1000));
        card.innerHTML = `
            <div class="floor-icon">${floor.emoji}</div>
            <div class="floor-info">
                <div class="floor-name">${floor.name}</div>
                <div class="floor-status">🏗️ Building... ${remaining}s</div>
            </div>
            <button class="rush-btn" data-floor-id="${floor.id}" data-action="rush-build">
                💎 Rush
            </button>
        `;
    } else {
        const totalStock = floor.bookStock.reduce((sum, cat) => sum + cat.currentStock, 0);
        const maxStock = floor.bookStock.reduce((sum, cat) => sum + cat.maxStock, 0);
        const stockPercent = maxStock > 0 ? Math.floor((totalStock / maxStock) * 100) : 0;

        card.innerHTML = `
            <div class="floor-icon">${floor.emoji}</div>
            <div class="floor-info">
                <div class="floor-name">${floor.name}</div>
                <div class="floor-meta">
                    <span class="floor-stock">📚 ${totalStock}/${maxStock} (${stockPercent}%)</span>
                </div>
            </div>
        `;
    }

    // Click to view details
    card.addEventListener('click', (e) => {
        // Don't open if clicking rush button
        if (e.target.classList.contains('rush-btn') || e.target.closest('.rush-btn')) {
            const floorId = e.target.dataset.floorId || e.target.closest('.rush-btn').dataset.floorId;
            handleRushConstruction(floorId);
            return;
        }
        openFloorDetail(floor.id);
    });

    return card;
}

/**
 * Update an existing floor card
 */
function updateFloorCard(floor) {
    const card = document.getElementById(`floor-card-${floor.id}`);
    if (!card) return;

    if (floor.status === 'building') {
        const remaining = Math.max(0, Math.ceil((floor.buildEndTime - Date.now()) / 1000));
        const statusEl = card.querySelector('.floor-status');
        if (statusEl) {
            statusEl.textContent = `🏗️ Building... ${remaining}s`;
        }
    } else {
        const totalStock = floor.bookStock.reduce((sum, cat) => sum + cat.currentStock, 0);
        const maxStock = floor.bookStock.reduce((sum, cat) => sum + cat.maxStock, 0);
        const stockPercent = maxStock > 0 ? Math.floor((totalStock / maxStock) * 100) : 0;

        const stockEl = card.querySelector('.floor-stock');
        if (stockEl) {
            stockEl.textContent = `📚 ${totalStock}/${maxStock} (${stockPercent}%)`;
        }
    }
}

/**
 * Handle rushing construction
 */
function handleRushConstruction(floorId) {
    const success = game.rushConstruction(floorId);
    if (success) {
        renderTowerScreen();
    } else {
        alert('Not enough Tower Bucks!');
    }
}

/**
 * Open floor detail screen
 */
function openFloorDetail(floorId) {
    const floor = game.getFloor(floorId);
    if (!floor) return;

    currentFloorId = floorId;

    // Update header
    document.getElementById('detail-title').textContent = floor.name;
    document.getElementById('detail-emoji').textContent = floor.emoji;
    document.getElementById('detail-name').textContent = floor.name;

    // Update status
    const statusEl = document.getElementById('detail-status');
    if (floor.status === 'building') {
        const remaining = Math.max(0, Math.ceil((floor.buildEndTime - Date.now()) / 1000));
        statusEl.textContent = `🏗️ Building... ${remaining}s`;
        statusEl.className = 'floor-status building';
    } else {
        statusEl.textContent = '✅ Ready';
        statusEl.className = 'floor-status ready';
    }

    // Render book categories
    renderBookCategories(floor);

    // Render active readers
    renderActiveReaders(floor);

    // Show detail screen
    document.getElementById('detail-screen').classList.add('active');
}

/**
 * Update floor detail (called on tick)
 */
function updateFloorDetail(floor) {
    // Update status
    const statusEl = document.getElementById('detail-status');
    if (floor.status === 'building') {
        const remaining = Math.max(0, Math.ceil((floor.buildEndTime - Date.now()) / 1000));
        statusEl.textContent = `🏗️ Building... ${remaining}s`;
    } else {
        statusEl.textContent = '✅ Ready';
    }

    // Update book categories
    renderBookCategories(floor);

    // Update active readers
    renderActiveReaders(floor);
}

/**
 * Render book categories for a floor
 */
function renderBookCategories(floor) {
    const container = document.getElementById('book-categories');
    container.innerHTML = '';

    if (floor.status !== 'ready') {
        container.innerHTML = '<p class="empty-state">Floor is under construction</p>';
        return;
    }

    floor.bookStock.forEach((category, index) => {
        const card = document.createElement('div');
        card.className = 'book-category-card';

        const stockPercent = (category.currentStock / category.maxStock) * 100;
        const isRestocking = category.restocking;
        const isFull = category.currentStock >= category.maxStock;

        let statusText = '';
        let actionButton = '';

        if (isRestocking) {
            const remaining = Math.max(0, Math.ceil((category.restockEndTime - Date.now()) / 1000));
            statusText = `📦 Restocking... ${remaining}s`;
            actionButton = `<button class="rush-restock-btn" data-floor-id="${floor.id}" data-category="${index}">💎 Rush</button>`;
        } else if (isFull) {
            statusText = '✅ Fully Stocked';
            actionButton = `<button class="restock-btn disabled" disabled>Restock (${category.stockCost} ⭐)</button>`;
        } else {
            statusText = `${category.currentStock}/${category.maxStock} books`;
            actionButton = `<button class="restock-btn" data-floor-id="${floor.id}" data-category="${index}">Restock (${category.stockCost} ⭐)</button>`;
        }

        card.innerHTML = `
            <div class="category-header">
                <h5>${category.name}</h5>
                <span class="earning-rate">+${category.earningRate} ⭐/book</span>
            </div>
            <div class="stock-bar">
                <div class="stock-fill" style="width: ${stockPercent}%"></div>
            </div>
            <div class="category-status">${statusText}</div>
            <div class="category-actions">
                ${actionButton}
            </div>
        `;

        container.appendChild(card);
    });

    // Add event listeners for restock buttons
    container.querySelectorAll('.restock-btn:not(.disabled)').forEach(btn => {
        btn.addEventListener('click', () => {
            const floorId = btn.dataset.floorId;
            const categoryIndex = parseInt(btn.dataset.category);
            handleRestock(floorId, categoryIndex);
        });
    });

    // Add event listeners for rush buttons
    container.querySelectorAll('.rush-restock-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const floorId = btn.dataset.floorId;
            const categoryIndex = parseInt(btn.dataset.category);
            handleRushRestock(floorId, categoryIndex);
        });
    });
}

/**
 * Handle restocking a category
 */
function handleRestock(floorId, categoryIndex) {
    const result = game.restockBooks(floorId, categoryIndex);
    if (result.success) {
        const floor = game.getFloor(floorId);
        renderBookCategories(floor);
        updateGlobalStats();
    } else {
        alert(result.error || 'Cannot restock');
    }
}

/**
 * Handle rushing restock
 */
function handleRushRestock(floorId, categoryIndex) {
    const success = game.rushRestocking(floorId, categoryIndex);
    if (success) {
        const floor = game.getFloor(floorId);
        renderBookCategories(floor);
        updateGlobalStats();
    } else {
        alert('Not enough Tower Bucks!');
    }
}

/**
 * Render active readers for a floor
 */
function renderActiveReaders(floor) {
    const container = document.getElementById('active-readers');
    const readersOnFloor = game.readers.filter(r => r.floorId === floor.id);

    if (readersOnFloor.length === 0) {
        container.innerHTML = '<p class="empty-state">No readers currently visiting</p>';
        return;
    }

    container.innerHTML = '';
    readersOnFloor.forEach(reader => {
        const remaining = Math.max(0, Math.ceil((reader.checkoutTime - Date.now()) / 1000));
        const readerEl = document.createElement('div');
        readerEl.className = 'reader-item';
        readerEl.innerHTML = `
            <span class="reader-emoji">${reader.emoji}</span>
            <span class="reader-info">Checking out... ${remaining}s</span>
            <span class="reader-earning">+${reader.earningAmount} ⭐</span>
        `;
        container.appendChild(readerEl);
    });
}

/**
 * Close floor detail screen
 */
function closeDetailScreen() {
    document.getElementById('detail-screen').classList.remove('active');
    currentFloorId = null;
}

/**
 * Open build floor modal
 */
function openBuildModal() {
    const availableTypes = game.getAvailableFloorTypes();
    const container = document.getElementById('floor-types-list');
    container.innerHTML = '';

    if (availableTypes.length === 0) {
        container.innerHTML = '<p class="empty-state">No floor types available</p>';
        document.getElementById('build-modal').classList.add('active');
        return;
    }

    availableTypes.forEach(floorType => {
        const canAfford = game.stars >= floorType.buildCost;
        const card = document.createElement('div');
        card.className = `floor-type-card ${floorType.color} ${!canAfford ? 'disabled' : ''}`;
        card.innerHTML = `
            <div class="floor-type-icon">${floorType.emoji}</div>
            <div class="floor-type-info">
                <h5>${floorType.name}</h5>
                <p>${floorType.description}</p>
                <div class="floor-type-meta">
                    <span>💰 ${floorType.buildCost} stars</span>
                    <span>⏱️ ${floorType.buildTime}s</span>
                </div>
            </div>
        `;

        if (canAfford) {
            card.addEventListener('click', () => {
                handleBuildFloor(floorType.id);
            });
        }

        container.appendChild(card);
    });

    // Show all floor types (including locked ones)
    game.floorTypes.forEach(floorType => {
        if (floorType.unlockLevel > game.level) {
            const card = document.createElement('div');
            card.className = `floor-type-card ${floorType.color} locked`;
            card.innerHTML = `
                <div class="floor-type-icon">${floorType.emoji}</div>
                <div class="floor-type-info">
                    <h5>${floorType.name}</h5>
                    <p>🔒 Unlock at level ${floorType.unlockLevel}</p>
                </div>
            `;
            container.appendChild(card);
        }
    });

    document.getElementById('build-modal').classList.add('active');
}

/**
 * Handle building a floor
 */
function handleBuildFloor(floorTypeId) {
    const result = game.buildFloor(floorTypeId);
    if (result.success) {
        closeBuildModal();
        renderTowerScreen();
        updateGlobalStats();
    } else {
        alert(result.error || 'Cannot build floor');
    }
}

/**
 * Close build modal
 */
function closeBuildModal() {
    document.getElementById('build-modal').classList.remove('active');
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
