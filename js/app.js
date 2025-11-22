/**
 * SimLibrary - Tiny Tower Style UI
 * Handles UI rendering and user interactions
 */

// Game state instance
let game;
let currentFloorId = null;
let towerRenderer = null;
let confirmCallback = null;

/**
 * Show confirmation modal
 */
function showConfirm(title, message) {
    return new Promise((resolve) => {
        document.getElementById('confirm-title').textContent = title;
        document.getElementById('confirm-message').textContent = message;
        document.getElementById('confirm-modal').classList.add('active');

        confirmCallback = resolve;
    });
}

/**
 * Close confirmation modal
 */
function closeConfirmModal(result) {
    document.getElementById('confirm-modal').classList.remove('active');
    if (confirmCallback) {
        confirmCallback(result);
        confirmCallback = null;
    }
}

/**
 * Initialize the application
 */
function init() {
    game = new GameState();

    // Expose functions for tower renderer to call BEFORE creating renderer
    window.openFloorDetail = openFloorDetail;
    window.openBuildModal = openBuildModal;

    // Initialize tower renderer
    towerRenderer = new TowerRenderer('tower-canvas', game);

    // Set up event listeners
    setupEventListeners();

    // Render initial state
    renderTowerScreen();
    updateGlobalStats();

    // Show offline earnings notification if any
    if (game._offlineEarningsMessage) {
        const msg = game._offlineEarningsMessage;
        const cappedText = msg.capped ? ' (capped at 3 hours)' : '';
        alert(`💰 While you were away for ${msg.time}${cappedText}, you earned ${msg.stars} stars!`);
        delete game._offlineEarningsMessage;
    }

    // Check daily login bonus
    const dailyReward = game.checkDailyLogin();
    if (dailyReward) {
        const bucksText = dailyReward.bucks > 0 ? ` + ${dailyReward.bucks} 💎` : '';
        alert(`🎁 Day ${dailyReward.day} Login Bonus!\n+${dailyReward.stars} ⭐${bucksText}`);
    }

    // Start game tick (every 1 second for responsive feel)
    setInterval(() => {
        game.tick();
        updateGlobalStats();
        updateTowerScreen();
        renderMissionBanner();

        // Trigger particle effects for recent checkouts
        if (game._recentCheckouts && game._recentCheckouts.length > 0) {
            game._recentCheckouts.forEach(checkout => {
                // Find character position to spawn particles
                const floor = game.getFloor(checkout.floorId);
                if (floor && floor._renderBounds) {
                    const bounds = floor._renderBounds;
                    const x = bounds.x + bounds.width / 2;
                    const y = bounds.y + bounds.height / 2;

                    // Spawn star particles
                    towerRenderer.spawnStarParticles(x, y, checkout.stars);

                    // Spawn floating text
                    towerRenderer.spawnTextParticle(x, y - 20, `+${checkout.stars} ⭐`, '#FFD700');

                    // Extra sparkles for VIPs
                    if (checkout.isVIP) {
                        towerRenderer.spawnSparkle(x, y);
                    }
                }
            });
            game._recentCheckouts = [];
        }

        // Trigger sparkles for elevator arrivals
        if (game._recentArrivals && game._recentArrivals.length > 0) {
            game._recentArrivals.forEach(arrival => {
                const floor = game.getFloor(arrival.floorId);
                if (floor && floor._renderBounds) {
                    const bounds = floor._renderBounds;
                    const x = bounds.x - 40; // Elevator position
                    const y = bounds.y + bounds.height / 2;
                    towerRenderer.spawnSparkle(x, y);
                }
            });
            game._recentArrivals = [];
        }

        // Show rush hour notification
        if (game._rushHourNotification) {
            alert(`🎉 ${game._rushHourNotification.message}\n\nReaders will arrive 4x faster for the next 3 minutes!`);
            game._rushHourNotification = null;
        }

        // Check for new achievements
        if (game._newAchievements && game._newAchievements.length > 0) {
            game._newAchievements.forEach(achievement => {
                const bucksText = achievement.rewardBucks > 0 ? ` + ${achievement.rewardBucks} 💎` : '';
                alert(`🏆 Achievement Unlocked!\n${achievement.name}\n${achievement.description}\n\nReward: ${achievement.reward} ⭐${bucksText}`);
            });
            delete game._newAchievements;
        }

        // If viewing floor detail modal, refresh it
        if (currentFloorId) {
            const floor = game.getFloor(currentFloorId);
            if (floor) {
                updateFloorDetail(floor);
            }
        }
    }, 1000);

    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then((registration) => {
                console.log('[PWA] Service worker registered:', registration.scope);

                // Force update check
                registration.update();

                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New version available - reload to activate
                            console.log('[PWA] New version available! Reloading...');
                            newWorker.postMessage({ type: 'SKIP_WAITING' });
                            window.location.reload();
                        }
                    });
                });
            })
            .catch((error) => {
                console.log('[PWA] Service worker registration failed:', error);
            });
    }

    console.log('SimLibrary v2.2 (PWA Support!) initialized!');
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // Add Floor button - opens build modal
    document.getElementById('add-floor-btn').addEventListener('click', () => {
        openBuildModal();
    });

    // Detail modal close button
    document.getElementById('close-detail-modal').addEventListener('click', () => {
        closeDetailModal();
    });

    // Close detail modal when clicking outside
    document.getElementById('detail-modal').addEventListener('click', (e) => {
        if (e.target.id === 'detail-modal') {
            closeDetailModal();
        }
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

    // Stats button - opens stats modal
    document.getElementById('open-stats-btn').addEventListener('click', () => {
        openStatsModal();
    });

    // Stats modal close button
    document.getElementById('close-stats-modal').addEventListener('click', () => {
        closeStatsModal();
    });

    // Close stats modal when clicking outside
    document.getElementById('stats-modal').addEventListener('click', (e) => {
        if (e.target.id === 'stats-modal') {
            closeStatsModal();
        }
    });

    // Achievements button - opens achievements modal
    document.getElementById('open-achievements-btn').addEventListener('click', () => {
        openAchievementsModal();
    });

    // Achievements modal close button
    document.getElementById('close-achievements-modal').addEventListener('click', () => {
        closeAchievementsModal();
    });

    // Close achievements modal when clicking outside
    document.getElementById('achievements-modal').addEventListener('click', (e) => {
        if (e.target.id === 'achievements-modal') {
            closeAchievementsModal();
        }
    });

    // Reader collection button - opens collection modal
    document.getElementById('open-collection-btn').addEventListener('click', () => {
        openCollectionModal();
    });

    // Collection modal close button
    document.getElementById('close-collection-modal').addEventListener('click', () => {
        closeCollectionModal();
    });

    // Close collection modal when clicking outside
    document.getElementById('collection-modal').addEventListener('click', (e) => {
        if (e.target.id === 'collection-modal') {
            closeCollectionModal();
        }
    });

    // Upgrades button - opens upgrades modal
    document.getElementById('open-upgrades-btn').addEventListener('click', () => {
        openUpgradesModal();
    });

    // Upgrades modal close button
    document.getElementById('close-upgrades-modal').addEventListener('click', () => {
        closeUpgradesModal();
    });

    // Close upgrades modal when clicking outside
    document.getElementById('upgrades-modal').addEventListener('click', (e) => {
        if (e.target.id === 'upgrades-modal') {
            closeUpgradesModal();
        }
    });

    // Tab buttons for upgrades modal
    document.querySelectorAll('.upgrades-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.upgrades-tabs .tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderUpgradesTab(btn.dataset.tab);
        });
    });

    // Confirmation modal buttons
    document.getElementById('close-confirm-modal').addEventListener('click', () => {
        closeConfirmModal(false);
    });

    document.getElementById('confirm-cancel').addEventListener('click', () => {
        closeConfirmModal(false);
    });

    document.getElementById('confirm-ok').addEventListener('click', () => {
        closeConfirmModal(true);
    });

    // Close confirm modal when clicking outside
    document.getElementById('confirm-modal').addEventListener('click', (e) => {
        if (e.target.id === 'confirm-modal') {
            closeConfirmModal(false);
        }
    });

    // Reset game button
    document.getElementById('reset-game-btn').addEventListener('click', async () => {
        const confirmed = await showConfirm(
            'Restart Tower',
            'This will delete ALL your progress and start fresh. Are you sure?'
        );

        if (confirmed) {
            game.reset();
            closeStatsModal();
            renderTowerScreen();
            updateGlobalStats();
            window.location.reload();
        }
    });
}

/**
 * Update global stats display (stars, bucks, level, mood)
 */
function updateGlobalStats() {
    document.getElementById('total-stars').textContent = Math.floor(game.stars);
    document.getElementById('total-bucks').textContent = game.towerBucks;
    document.getElementById('player-level').textContent = game.level;

    // Update mood meter
    if (game.mood !== undefined) {
        const moodDesc = game.getMoodDescription();
        document.getElementById('mood-emoji').textContent = moodDesc.emoji;
        document.getElementById('mood-value').textContent = Math.floor(game.mood);
    }

    // Update day counter
    document.getElementById('day-counter').textContent = `Day ${game.getGameDay()}`;

    // Check for special visitor notifications
    if (game._newSpecialVisitor) {
        showToast(`${game._newSpecialVisitor.emoji} ${game._newSpecialVisitor.name} arrived! ${game._newSpecialVisitor.description}`);
        delete game._newSpecialVisitor;
    }

    // Check for departing visitors
    if (game._departingVisitor) {
        showToast(`${game._departingVisitor.emoji} ${game._departingVisitor.name} left the library.`);
        delete game._departingVisitor;
    }

    // Check for mood tips
    if (game._moodTip) {
        showToast(`💎 Happy patron left a tip!`);
        delete game._moodTip;
    }

    // Check for new synergies
    if (game._newSynergy) {
        showToast(`${game._newSynergy.emoji} ${game._newSynergy.name} activated! ${game._newSynergy.description}`);
        delete game._newSynergy;
    }

    // Check for cozy events
    if (game._cozyEvent) {
        showToast(`${game._cozyEvent.emoji} ${game._cozyEvent.name}! ${game._cozyEvent.description}`);
        delete game._cozyEvent;
    }

    // Check for new mini-quest
    if (game._newMiniQuest) {
        showToast(`${game._newMiniQuest.emoji} ${game._newMiniQuest.description} Tap to help!`);
        delete game._newMiniQuest;
    }

    // Check for completed mini-quest
    if (game._completedMiniQuest) {
        const bucks = game._completedMiniQuest.rewardBucks > 0 ? ` + ${game._completedMiniQuest.rewardBucks} 💎` : '';
        showToast(`✅ ${game._completedMiniQuest.name} complete! +${game._completedMiniQuest.reward} ⭐${bucks}`);
        delete game._completedMiniQuest;
    }
}

/**
 * Show a toast notification
 */
function showToast(message) {
    // Check if toast container exists, create if not
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = 'position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 9999;';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.style.cssText = `
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        margin-top: 8px;
        font-size: 14px;
        animation: fadeInUp 0.3s ease;
    `;
    toast.textContent = message;
    container.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
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
 * Open floor detail modal
 */
function openFloorDetail(floorId) {
    const floor = game.getFloor(floorId);
    if (!floor) return;

    currentFloorId = floorId;

    // Update header
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

    // Render upgrade section
    renderUpgradeSection(floor);

    // Render staff slots
    renderStaffSlots(floor);

    // Render book categories
    renderBookCategories(floor);

    // Render active readers
    renderActiveReaders(floor);

    // Show detail modal
    document.getElementById('detail-modal').classList.add('active');
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

    // Update upgrade section
    renderUpgradeSection(floor);

    // Update staff slots
    renderStaffSlots(floor);

    // Update book categories
    renderBookCategories(floor);

    // Update active readers
    renderActiveReaders(floor);
}

/**
 * Render upgrade section for a floor
 */
function renderUpgradeSection(floor) {
    const container = document.getElementById('upgrade-section');

    if (floor.status !== 'ready') {
        container.innerHTML = '';
        return;
    }

    const level = floor.upgradeLevel || 1;
    const upgradeCosts = [0, 200, 500];
    const nextCost = upgradeCosts[level];

    if (level >= 3) {
        container.innerHTML = `
            <div class="upgrade-maxed">
                ⭐⭐⭐ Floor at Maximum Level! ⭐⭐⭐
            </div>
        `;
        return;
    }

    const multipliers = [1.0, 1.25, 1.5];
    const nextMultiplier = multipliers[level];
    const bonusText = level === 1 ? '+25%' : '+50%';

    container.innerHTML = `
        <div class="upgrade-info">
            <div class="current-level">
                <strong>Floor Level:</strong> ${level} / 3
                ${level === 2 ? ' <span class="upgrade-badge">+25% Boosted</span>' : ''}
                ${level === 3 ? ' <span class="upgrade-badge gold">+50% Boosted MAX</span>' : ''}
            </div>
            ${level < 3 ? `
                <button class="upgrade-floor-btn" data-floor-id="${floor.id}">
                    ⬆️ Upgrade to Level ${level + 1} (${nextCost} ⭐)
                    <br><span class="upgrade-bonus">${bonusText} capacity & earning rate</span>
                </button>
            ` : ''}
        </div>
    `;

    // Add event listener for upgrade button
    const upgradeBtn = container.querySelector('.upgrade-floor-btn');
    if (upgradeBtn) {
        upgradeBtn.addEventListener('click', () => {
            handleUpgradeFloor(floor.id);
        });
    }
}

/**
 * Handle floor upgrade
 */
async function handleUpgradeFloor(floorId) {
    const floor = game.getFloor(floorId);
    if (!floor) return;

    const upgradeCosts = [0, 200, 500];
    const cost = upgradeCosts[floor.upgradeLevel];

    const confirmed = await showConfirm(
        'Upgrade Floor',
        `Upgrade to Level ${floor.upgradeLevel + 1} for ${cost} ⭐?`
    );

    if (!confirmed) return;

    const result = game.upgradeFloor(floorId);
    if (result.success) {
        renderUpgradeSection(floor);
        renderBookCategories(floor);
        updateGlobalStats();
    } else {
        alert(result.error || 'Cannot upgrade floor');
    }
}

/**
 * Render staff slots for a floor
 */
function renderStaffSlots(floor) {
    const container = document.getElementById('staff-slots');
    container.innerHTML = '';

    if (floor.status !== 'ready') {
        container.innerHTML = '<p class="empty-state">Complete construction to hire staff</p>';
        return;
    }

    // Create 3 staff slots
    for (let i = 0; i < 3; i++) {
        const staff = floor.staff[i];
        const staffType = game.staffTypes[i];
        const categoryName = floor.bookStock[i]?.name || '';

        const slot = document.createElement('div');
        slot.className = 'staff-slot';

        if (staff) {
            // Filled slot
            slot.innerHTML = `
                <div class="staff-icon" style="background-color: ${staff.color}">${staff.emoji}</div>
                <div class="staff-info">
                    <div class="staff-name">${staff.name}</div>
                    <div class="staff-unlock">✅ "${categoryName}" unlocked</div>
                </div>
            `;
        } else {
            // Empty slot with hire button
            const canAfford = game.stars >= staffType.hireCost;
            slot.innerHTML = `
                <div class="staff-icon empty">?</div>
                <div class="staff-info">
                    <div class="staff-name">Empty Slot ${i + 1}</div>
                    <div class="staff-description">${staffType.description}</div>
                </div>
                <button class="hire-staff-btn ${!canAfford ? 'disabled' : ''}"
                        data-floor-id="${floor.id}"
                        ${!canAfford ? 'disabled' : ''}>
                    Hire ${staffType.name} (${staffType.hireCost} ⭐)
                </button>
            `;
        }

        container.appendChild(slot);
    }

    // Add event listeners for hire buttons
    container.querySelectorAll('.hire-staff-btn:not(.disabled)').forEach(btn => {
        btn.addEventListener('click', () => {
            const floorId = btn.dataset.floorId;
            handleHireStaff(floorId);
        });
    });
}

/**
 * Handle hiring staff
 */
async function handleHireStaff(floorId) {
    const floor = game.getFloor(floorId);
    if (!floor) return;

    const staffType = game.staffTypes[floor.staff.length];
    if (!staffType) return;

    const confirmed = await showConfirm(
        'Hire Staff',
        `Hire ${staffType.name} for ${staffType.hireCost} ⭐?`
    );

    if (!confirmed) return;

    const result = game.hireStaff(floorId);
    if (result.success) {
        renderStaffSlots(floor);
        renderBookCategories(floor);
        updateGlobalStats();
    } else {
        alert(result.error || 'Cannot hire staff');
    }
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
        const requiredStaff = index + 1;
        const isLocked = floor.staff.length < requiredStaff;

        card.className = `book-category-card ${isLocked ? 'locked' : ''}`;

        if (isLocked) {
            // Locked category
            const staffType = game.staffTypes[index];
            card.innerHTML = `
                <div class="category-header">
                    <h5>🔒 ${category.name}</h5>
                    <span class="earning-rate">+${category.earningRate} ⭐/book</span>
                </div>
                <div class="locked-message">
                    <p>Hire a ${staffType.name} to unlock this category</p>
                </div>
            `;
        } else {
            // Unlocked category
            const stockPercent = (category.currentStock / category.maxStock) * 100;
            const isRestocking = category.restocking;
            const isFull = category.currentStock >= category.maxStock;

            let statusText = '';
            let actionButton = '';

            // Calculate actual cost based on books needed
            const booksNeeded = category.maxStock - category.currentStock;
            const costPerBook = category.stockCost / category.maxStock;
            const actualCost = Math.ceil(booksNeeded * costPerBook);

            if (isRestocking) {
                const remaining = Math.max(0, Math.ceil((category.restockEndTime - Date.now()) / 1000));
                statusText = `📦 Restocking... ${remaining}s`;
                actionButton = `<button class="rush-restock-btn" data-floor-id="${floor.id}" data-category="${index}">💎 Rush</button>`;
            } else if (isFull) {
                statusText = '✅ Fully Stocked';
                actionButton = `<button class="restock-btn disabled" disabled>Restock (0 ⭐)</button>`;
            } else {
                statusText = `${category.currentStock}/${category.maxStock} books`;
                actionButton = `<button class="restock-btn" data-floor-id="${floor.id}" data-category="${index}">Restock (${actualCost} ⭐)</button>`;
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
        }

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
        const isVIP = reader.type === 'vip';
        const readerEl = document.createElement('div');
        readerEl.className = `reader-item${isVIP ? ' vip-reader' : ''}`;

        let abilityText = '';
        if (isVIP && reader.vipAbility) {
            const vipType = game.vipTypes.find(v => v.id === reader.vipType);
            if (vipType) {
                abilityText = ` <span class="vip-tag" title="${vipType.description}">${vipType.name}</span>`;
            }
        }

        readerEl.innerHTML = `
            <span class="reader-emoji">${reader.emoji}</span>
            <span class="reader-info">
                <strong>${reader.name}</strong>${abilityText}<br>
                Checking out... ${remaining}s
            </span>
            <span class="reader-earning">+${reader.earningAmount} ⭐</span>
        `;
        container.appendChild(readerEl);
    });
}

/**
 * Close floor detail modal
 */
function closeDetailModal() {
    document.getElementById('detail-modal').classList.remove('active');
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

        // Count how many of this type already exist
        const existingCount = game.floors.filter(f => f.typeId === floorType.id).length;
        const ownedText = existingCount > 0 ? ` <span class="owned-count">(You have ${existingCount})</span>` : '';

        const card = document.createElement('div');
        card.className = `floor-type-card ${floorType.color} ${!canAfford ? 'disabled' : ''}`;
        card.innerHTML = `
            <div class="floor-type-icon">${floorType.emoji}</div>
            <div class="floor-type-info">
                <h5>${floorType.name}${ownedText}</h5>
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
async function handleBuildFloor(floorTypeId) {
    const floorType = game.floorTypes.find(t => t.id === floorTypeId);
    if (!floorType) return;

    const confirmed = await showConfirm(
        'Build Floor',
        `Build ${floorType.name} for ${floorType.buildCost} ⭐?`
    );

    if (!confirmed) return;

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

/**
 * Open stats modal and render stats
 */
function openStatsModal() {
    const stats = game.stats;

    // Format time played
    const hours = Math.floor(stats.timePlayed / 3600);
    const minutes = Math.floor((stats.timePlayed % 3600) / 60);

    // Update all stats
    document.getElementById('stat-books').textContent = stats.totalBooksCheckedOut.toLocaleString();
    document.getElementById('stat-stars').textContent = stats.totalStarsEarned.toLocaleString();
    document.getElementById('stat-readers').textContent = stats.totalReadersServed.toLocaleString();
    document.getElementById('stat-vips').textContent = stats.totalVIPsServed.toLocaleString();
    document.getElementById('stat-missions').textContent = stats.totalMissionsCompleted.toLocaleString();
    document.getElementById('stat-bucks-earned').textContent = stats.totalTowerBucksEarned.toLocaleString();
    document.getElementById('stat-floors').textContent = stats.totalFloorsBuilt.toLocaleString();
    document.getElementById('stat-staff').textContent = stats.totalStaffHired.toLocaleString();
    document.getElementById('stat-time').textContent = `${hours}h ${minutes}m`;

    // Show modal
    document.getElementById('stats-modal').classList.add('active');
}

/**
 * Close stats modal
 */
function closeStatsModal() {
    document.getElementById('stats-modal').classList.remove('active');
}

/**
 * Open achievements modal
 */
function openAchievementsModal() {
    const achievements = game.achievements;
    const unlockedCount = achievements.filter(a => a.unlocked).length;

    // Update summary counts
    document.getElementById('achievements-unlocked-count').textContent = unlockedCount;
    document.getElementById('achievements-total-count').textContent = achievements.length;

    // Render achievements list
    const listEl = document.getElementById('achievements-list');
    listEl.innerHTML = '';

    achievements.forEach(achievement => {
        const card = document.createElement('div');
        card.className = `achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`;

        // Get current progress
        const currentStat = game.stats[achievement.stat] || 0;
        const progress = Math.min(currentStat, achievement.requirement);
        const progressPercent = Math.floor((progress / achievement.requirement) * 100);

        // Format unlocked date if available
        let unlockedDateStr = '';
        if (achievement.unlocked && achievement.unlockedAt) {
            const date = new Date(achievement.unlockedAt);
            unlockedDateStr = `<div class="achievement-unlocked-date">Unlocked: ${date.toLocaleDateString()}</div>`;
        }

        // Build reward text
        let rewardText = `${achievement.reward} ⭐`;
        if (achievement.rewardBucks > 0) {
            rewardText += ` + ${achievement.rewardBucks} 💎`;
        }

        card.innerHTML = `
            <div class="achievement-icon">${achievement.unlocked ? '🏆' : '🔒'}</div>
            <div class="achievement-name">${achievement.name}</div>
            <div class="achievement-description">${achievement.description}</div>
            <div class="achievement-progress">${progress} / ${achievement.requirement} (${progressPercent}%)</div>
            <div class="achievement-reward">${rewardText}</div>
            ${unlockedDateStr}
        `;

        listEl.appendChild(card);
    });

    // Show modal
    document.getElementById('achievements-modal').classList.add('active');
}

/**
 * Close achievements modal
 */
function closeAchievementsModal() {
    document.getElementById('achievements-modal').classList.remove('active');
}

/**
 * Open reader collection modal
 */
function openCollectionModal() {
    const collection = game.readerCollection;
    const regularReaders = game.readerTypes;
    const vipReaders = game.vipTypes;

    const totalReaders = regularReaders.length + vipReaders.length;
    const discoveredCount = Object.keys(collection).length;

    // Update summary counts
    document.getElementById('collection-seen-count').textContent = discoveredCount;
    document.getElementById('collection-total-count').textContent = totalReaders;

    // Render regular readers
    const regularListEl = document.getElementById('regular-readers-list');
    regularListEl.innerHTML = '';
    regularReaders.forEach(readerType => {
        const collectionData = collection[readerType.id];
        const discovered = !!collectionData;

        const card = document.createElement('div');
        card.className = `reader-card ${discovered ? 'discovered' : 'undiscovered'}`;

        let statsHtml = '';
        if (discovered) {
            const firstSeen = new Date(collectionData.firstSeen).toLocaleDateString();
            statsHtml = `
                <div class="reader-stats">
                    <div class="reader-stat-line">Served: ${collectionData.count} times</div>
                    <div class="reader-stat-line">First seen: ${firstSeen}</div>
                </div>
            `;
        } else {
            statsHtml = `
                <div class="reader-stats">
                    <div class="reader-stat-line">Not yet discovered</div>
                </div>
            `;
        }

        card.innerHTML = `
            <div class="reader-emoji">${discovered ? readerType.emoji : '❓'}</div>
            <div class="reader-name">${discovered ? readerType.name : '???'}</div>
            <div class="reader-type-label">Regular Reader</div>
            ${statsHtml}
        `;

        regularListEl.appendChild(card);
    });

    // Render VIP readers
    const vipListEl = document.getElementById('vip-readers-list');
    vipListEl.innerHTML = '';
    vipReaders.forEach(vipType => {
        const collectionData = collection[vipType.id];
        const discovered = !!collectionData;

        const card = document.createElement('div');
        card.className = `reader-card ${discovered ? 'discovered' : 'undiscovered'}`;

        let statsHtml = '';
        if (discovered) {
            const firstSeen = new Date(collectionData.firstSeen).toLocaleDateString();
            statsHtml = `
                <div class="reader-stats">
                    <div class="reader-stat-line">Served: ${collectionData.count} times</div>
                    <div class="reader-stat-line">First seen: ${firstSeen}</div>
                </div>
                <div class="reader-ability">${vipType.description}</div>
            `;
        } else {
            statsHtml = `
                <div class="reader-stats">
                    <div class="reader-stat-line">Not yet discovered</div>
                </div>
            `;
        }

        card.innerHTML = `
            <div class="reader-emoji">${discovered ? vipType.emoji : '❓'}</div>
            <div class="reader-name">${discovered ? vipType.name : '???'}</div>
            <div class="reader-type-label">VIP Reader</div>
            ${statsHtml}
        `;

        vipListEl.appendChild(card);
    });

    // Show modal
    document.getElementById('collection-modal').classList.add('active');
}

/**
 * Close collection modal
 */
function closeCollectionModal() {
    document.getElementById('collection-modal').classList.remove('active');
}

/**
 * Open upgrades modal
 */
function openUpgradesModal() {
    // Render prestige banner
    renderPrestigeBanner();

    // Default to decorations tab
    document.querySelectorAll('.upgrades-tabs .tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.upgrades-tabs .tab-btn[data-tab="decorations"]').classList.add('active');
    renderUpgradesTab('decorations');

    // Show modal
    document.getElementById('upgrades-modal').classList.add('active');
}

/**
 * Close upgrades modal
 */
function closeUpgradesModal() {
    document.getElementById('upgrades-modal').classList.remove('active');
}

/**
 * Render prestige banner
 */
function renderPrestigeBanner() {
    const banner = document.getElementById('prestige-banner');
    const info = game.getPrestigeInfo();

    let progressHtml = '';
    if (info.next) {
        const currentFloors = game.floors.length;
        const currentStars = game.totalStarsEarned || 0;
        const starsProgress = Math.min(currentStars / info.next.minStarsEarned * 100, 100);
        const floorsProgress = Math.min(currentFloors / info.next.minFloors * 100, 100);
        const overallProgress = Math.min(starsProgress, floorsProgress);

        progressHtml = `
            <div class="prestige-progress">
                Next: ${info.next.emoji} ${info.next.name}
                <br>${currentFloors}/${info.next.minFloors} floors | ${currentStars.toLocaleString()}/${info.next.minStarsEarned.toLocaleString()} stars
            </div>
            <div class="prestige-progress-bar">
                <div class="prestige-progress-fill" style="width: ${overallProgress}%"></div>
            </div>
        `;
    } else {
        progressHtml = `<div class="prestige-progress">Maximum prestige reached!</div>`;
    }

    banner.innerHTML = `
        <div class="prestige-current">${info.current.emoji} ${info.current.name}</div>
        ${progressHtml}
    `;
}

/**
 * Render upgrades tab content
 */
function renderUpgradesTab(tab) {
    const container = document.getElementById('upgrades-content');
    container.innerHTML = '';

    if (tab === 'decorations') {
        renderDecorationsTab(container);
    } else if (tab === 'perks') {
        renderPerksTab(container);
    } else if (tab === 'staff') {
        renderStaffUpgradesTab(container);
    }
}

/**
 * Render decorations tab
 */
function renderDecorationsTab(container) {
    const prestigeOrder = ['community', 'town', 'city', 'regional', 'national', 'world'];
    const currentPrestigeIndex = prestigeOrder.indexOf(game.currentPrestige);

    // Get placed decorations
    const placedInLobby = new Set(game.lobbyDecorations);
    const placedOnFloors = new Set(Object.values(game.floorDecorations).flat());

    game.decorations.forEach(decoration => {
        const owned = game.ownedDecorations.includes(decoration.id);
        const prestigeIndex = prestigeOrder.indexOf(decoration.unlockPrestige);
        const unlocked = prestigeIndex <= currentPrestigeIndex;
        const canAfford = game.stars >= decoration.cost;
        const isPlaced = placedInLobby.has(decoration.id) || placedOnFloors.has(decoration.id);

        const item = document.createElement('div');
        item.className = `upgrade-item ${owned ? 'owned' : ''} ${!unlocked ? 'locked' : ''}`;

        let actionHtml = '';
        let typeLabel = decoration.type === 'lobby' ? '(Lobby)' : '(Floor)';

        if (owned) {
            if (isPlaced) {
                const location = placedInLobby.has(decoration.id) ? 'Lobby' : 'Floor';
                actionHtml = `<span class="owned-badge">In ${location}</span>`;
            } else {
                // Show place button
                if (decoration.type === 'lobby') {
                    actionHtml = `<button class="buy-upgrade-btn" data-action="place-lobby" data-id="${decoration.id}">Place</button>`;
                } else {
                    actionHtml = `<button class="buy-upgrade-btn" data-action="place-floor" data-id="${decoration.id}">Place</button>`;
                }
            }
        } else if (!unlocked) {
            const requiredPrestige = game.prestigeLevels.find(p => p.id === decoration.unlockPrestige);
            actionHtml = `<span class="locked-badge">${requiredPrestige.emoji} Required</span>`;
        } else {
            actionHtml = `<button class="buy-upgrade-btn" data-type="decoration" data-id="${decoration.id}" ${!canAfford ? 'disabled' : ''}>
                ${decoration.cost} ⭐
            </button>`;
        }

        // Build description with unlock info
        let descText = `${typeLabel}`;
        if (owned) {
            descText += ' - Owned';
        } else if (!unlocked) {
            const requiredPrestige = game.prestigeLevels.find(p => p.id === decoration.unlockPrestige);
            descText += ` - Reach ${requiredPrestige.name}`;
        } else {
            descText += ` - ${decoration.cost}⭐ to buy`;
        }

        item.innerHTML = `
            <div class="upgrade-icon">${decoration.emoji}</div>
            <div class="upgrade-info">
                <div class="upgrade-name">${decoration.name}</div>
                <div class="upgrade-desc">${descText}</div>
            </div>
            ${actionHtml}
        `;

        container.appendChild(item);
    });

    // Add event listeners for buying
    container.querySelectorAll('.buy-upgrade-btn[data-type="decoration"]').forEach(btn => {
        btn.addEventListener('click', () => handlePurchaseDecoration(btn.dataset.id));
    });

    // Add event listeners for placing in lobby
    container.querySelectorAll('.buy-upgrade-btn[data-action="place-lobby"]').forEach(btn => {
        btn.addEventListener('click', () => handlePlaceLobbyDecoration(btn.dataset.id));
    });

    // Add event listeners for placing on floor
    container.querySelectorAll('.buy-upgrade-btn[data-action="place-floor"]').forEach(btn => {
        btn.addEventListener('click', () => handlePlaceFloorDecoration(btn.dataset.id));
    });
}

/**
 * Handle placing a decoration in the lobby
 */
function handlePlaceLobbyDecoration(decorationId) {
    const result = game.placeLobbyDecoration(decorationId);
    if (result.success) {
        const decoration = game.decorations.find(d => d.id === decorationId);
        showToast(`${decoration.emoji} placed in lobby!`);
        renderUpgradesTab('decorations');
    } else {
        alert(result.error || 'Cannot place decoration');
    }
}

/**
 * Handle placing a decoration on a floor
 */
async function handlePlaceFloorDecoration(decorationId) {
    const decoration = game.decorations.find(d => d.id === decorationId);
    if (!decoration) return;

    // Show floor selection
    if (game.floors.length === 0) {
        alert('Build a floor first to place decorations!');
        return;
    }

    // Create a simple floor picker
    const floorOptions = game.floors.map(f => `${f.emoji} ${f.name}`).join('\n');
    const floorIndex = prompt(`Choose a floor (1-${game.floors.length}):\n\n${game.floors.map((f, i) => `${i + 1}. ${f.emoji} ${f.name}`).join('\n')}`);

    if (!floorIndex) return;

    const index = parseInt(floorIndex) - 1;
    if (isNaN(index) || index < 0 || index >= game.floors.length) {
        alert('Invalid floor number');
        return;
    }

    const floor = game.floors[index];
    const result = game.placeFloorDecoration(floor.id, decorationId);

    if (result.success) {
        showToast(`${decoration.emoji} placed on ${floor.name}!`);
        renderUpgradesTab('decorations');
    } else {
        alert(result.error || 'Cannot place decoration');
    }
}

/**
 * Render perks tab
 */
function renderPerksTab(container) {
    game.readerPerks.forEach(perk => {
        const owned = game.unlockedPerks.includes(perk.id);
        const canAfford = game.stars >= perk.cost;

        const item = document.createElement('div');
        item.className = `upgrade-item ${owned ? 'owned' : ''}`;

        let actionHtml = '';
        if (owned) {
            actionHtml = `<span class="owned-badge">ACTIVE</span>`;
        } else {
            actionHtml = `<button class="buy-upgrade-btn" data-type="perk" data-id="${perk.id}" ${!canAfford ? 'disabled' : ''}>
                ${perk.cost} ⭐
            </button>`;
        }

        item.innerHTML = `
            <div class="upgrade-icon">${perk.emoji}</div>
            <div class="upgrade-info">
                <div class="upgrade-name">${perk.name}</div>
                <div class="upgrade-desc">${perk.description}</div>
            </div>
            ${actionHtml}
        `;

        container.appendChild(item);
    });

    // Add event listeners
    container.querySelectorAll('.buy-upgrade-btn[data-type="perk"]').forEach(btn => {
        btn.addEventListener('click', () => handlePurchasePerk(btn.dataset.id));
    });
}

/**
 * Render staff upgrades tab
 */
function renderStaffUpgradesTab(container) {
    // Group upgrades by level requirement
    const upgradesByLevel = {};
    game.staffUpgrades.forEach(upgrade => {
        const level = upgrade.level || 1;
        if (!upgradesByLevel[level]) upgradesByLevel[level] = [];
        upgradesByLevel[level].push(upgrade);
    });

    // Render in order
    Object.keys(upgradesByLevel).sort((a, b) => a - b).forEach(level => {
        upgradesByLevel[level].forEach(upgrade => {
            const owned = game.purchasedUpgrades.includes(upgrade.id);
            const canAfford = game.stars >= upgrade.cost;

            // Check if previous level is owned (for upgrades with levels)
            let canPurchase = true;
            if (upgrade.level > 1) {
                const prevLevelId = upgrade.id.replace(/_\d+$/, `_${upgrade.level - 1}`);
                if (!game.purchasedUpgrades.includes(prevLevelId)) {
                    canPurchase = false;
                }
            }

            const item = document.createElement('div');
            item.className = `upgrade-item ${owned ? 'owned' : ''} ${!canPurchase && !owned ? 'locked' : ''}`;

            let actionHtml = '';
            if (owned) {
                actionHtml = `<span class="owned-badge">ACTIVE</span>`;
            } else if (!canPurchase) {
                actionHtml = `<span class="locked-badge">Requires Level ${upgrade.level - 1}</span>`;
            } else {
                actionHtml = `<button class="buy-upgrade-btn" data-type="upgrade" data-id="${upgrade.id}" ${!canAfford ? 'disabled' : ''}>
                    ${upgrade.cost} ⭐
                </button>`;
            }

            item.innerHTML = `
                <div class="upgrade-icon">${upgrade.emoji}</div>
                <div class="upgrade-info">
                    <div class="upgrade-name">${upgrade.name}</div>
                    <div class="upgrade-desc">${upgrade.description}</div>
                </div>
                ${actionHtml}
            `;

            container.appendChild(item);
        });
    });

    // Add event listeners
    container.querySelectorAll('.buy-upgrade-btn[data-type="upgrade"]').forEach(btn => {
        btn.addEventListener('click', () => handlePurchaseUpgrade(btn.dataset.id));
    });
}

/**
 * Handle purchasing a decoration
 */
async function handlePurchaseDecoration(decorationId) {
    const decoration = game.decorations.find(d => d.id === decorationId);
    if (!decoration) return;

    const confirmed = await showConfirm(
        'Purchase Decoration',
        `Buy ${decoration.name} for ${decoration.cost} ⭐?`
    );

    if (!confirmed) return;

    const result = game.purchaseDecoration(decorationId);
    if (result.success) {
        renderUpgradesTab('decorations');
        updateGlobalStats();
        showToast(`${decoration.emoji} ${decoration.name} purchased!`);
    } else {
        alert(result.error || 'Cannot purchase decoration');
    }
}

/**
 * Handle purchasing a perk
 */
async function handlePurchasePerk(perkId) {
    const perk = game.readerPerks.find(p => p.id === perkId);
    if (!perk) return;

    const confirmed = await showConfirm(
        'Purchase Perk',
        `Buy ${perk.name} for ${perk.cost} ⭐?`
    );

    if (!confirmed) return;

    const result = game.purchasePerk(perkId);
    if (result.success) {
        renderUpgradesTab('perks');
        updateGlobalStats();
        showToast(`${perk.emoji} ${perk.name} activated!`);
    } else {
        alert(result.error || 'Cannot purchase perk');
    }
}

/**
 * Handle purchasing a staff upgrade
 */
async function handlePurchaseUpgrade(upgradeId) {
    const upgrade = game.staffUpgrades.find(u => u.id === upgradeId);
    if (!upgrade) return;

    const confirmed = await showConfirm(
        'Purchase Upgrade',
        `Buy ${upgrade.name} for ${upgrade.cost} ⭐?`
    );

    if (!confirmed) return;

    const result = game.purchaseUpgrade(upgradeId);
    if (result.success) {
        renderUpgradesTab('staff');
        updateGlobalStats();
        showToast(`${upgrade.emoji} ${upgrade.name} purchased!`);
    } else {
        alert(result.error || 'Cannot purchase upgrade');
    }
}

/**
 * Render mission banner
 */
function renderMissionBanner() {
    const banner = document.getElementById('mission-banner');
    const mission = game.currentMission;
    const event = game.currentEvent;

    // Show find mission if active (green banner)
    const findMission = game.currentFindMission;
    if (findMission && Date.now() < findMission.expiryTime) {
        const timeRemaining = Math.max(0, Math.ceil((findMission.expiryTime - Date.now()) / 1000));
        const seconds = timeRemaining;

        banner.innerHTML = `
            <div>🔍 Find ${findMission.itemType.emoji} ${findMission.itemType.name}</div>
            <div>${findMission.found}/${findMission.total} | ${findMission.reward}⭐ | ${seconds}s</div>
        `;

        banner.style.display = 'flex';
        banner.style.background = 'linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)';
        return;
    }

    // Show event if active (takes priority visually with different style)
    if (event && Date.now() < event.endTime) {
        const timeRemaining = Math.max(0, Math.ceil((event.endTime - Date.now()) / 1000));
        const seconds = timeRemaining % 60;

        banner.innerHTML = `
            <div>${event.emoji} ${event.name}</div>
            <div>${seconds}s</div>
        `;

        banner.style.display = 'flex';
        banner.style.background = 'linear-gradient(135deg, #9C27B0 0%, #E91E63 100%)';
        return;
    }

    // Show mission if active
    if (mission && mission.status === 'active') {
        // Calculate progress and time remaining
        const progressPercent = (mission.progress / mission.requestCount) * 100;
        const timeRemaining = Math.max(0, Math.ceil((mission.expiryTime - Date.now()) / 1000));
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;

        banner.innerHTML = `
            <div>📝 ${mission.categoryName} books</div>
            <div>${mission.progress}/${mission.requestCount} | ${mission.reward}⭐ | ${minutes}:${seconds.toString().padStart(2, '0')}</div>
        `;

        banner.style.display = 'flex';
        banner.style.background = 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)';
        return;
    }

    banner.style.display = 'none';
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
