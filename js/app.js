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
 * Sound Effects Manager using Web Audio API
 */
const SoundManager = {
    audioContext: null,
    enabled: true,
    volume: 0.3,

    init() {
        this.enabled = localStorage.getItem('soundEnabled') !== 'false';
        // AudioContext is created on first user interaction
    },

    ensureContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    },

    toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem('soundEnabled', this.enabled);
        return this.enabled;
    },

    playTone(frequency, duration, type = 'sine', volumeMult = 1) {
        if (!this.enabled) return;
        this.ensureContext();

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;
        gainNode.gain.setValueAtTime(this.volume * volumeMult, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    },

    // Coin/star collection sound - cheerful ding
    coin() {
        this.playTone(880, 0.1, 'sine', 0.5);
        setTimeout(() => this.playTone(1100, 0.15, 'sine', 0.4), 50);
    },

    // Button click sound
    click() {
        this.playTone(600, 0.05, 'square', 0.2);
    },

    // Success sound (achievement, mission complete)
    success() {
        this.playTone(523, 0.1, 'sine', 0.4);
        setTimeout(() => this.playTone(659, 0.1, 'sine', 0.4), 100);
        setTimeout(() => this.playTone(784, 0.2, 'sine', 0.4), 200);
    },

    // Error/denied sound
    error() {
        this.playTone(200, 0.15, 'sawtooth', 0.3);
        setTimeout(() => this.playTone(150, 0.2, 'sawtooth', 0.3), 100);
    },

    // Restock start sound
    restock() {
        this.playTone(400, 0.08, 'triangle', 0.3);
        setTimeout(() => this.playTone(500, 0.08, 'triangle', 0.3), 60);
    },

    // Build complete sound
    build() {
        this.playTone(440, 0.1, 'sine', 0.3);
        setTimeout(() => this.playTone(554, 0.1, 'sine', 0.3), 80);
        setTimeout(() => this.playTone(659, 0.15, 'sine', 0.3), 160);
    },

    // Visitor arrival (subtle)
    visitor() {
        this.playTone(700, 0.05, 'sine', 0.15);
    },

    // Level up fanfare
    levelUp() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.15, 'sine', 0.4), i * 100);
        });
    },

    // Cash register / purchase sound
    purchase() {
        this.playTone(800, 0.05, 'square', 0.2);
        setTimeout(() => this.playTone(1000, 0.1, 'square', 0.2), 50);
    }
};

/**
 * Show confirmation modal
 */
function showConfirm(title, message) {
    return new Promise((resolve) => {
        document.getElementById('confirm-title').textContent = title;
        document.getElementById('confirm-message').textContent = message;
        // Reset button text (may have been changed by other modals)
        document.getElementById('confirm-ok').textContent = 'Confirm';
        document.getElementById('confirm-cancel').textContent = 'Cancel';
        // Clear any old onclick handlers from other modals (e.g., applicant modal)
        document.getElementById('confirm-ok').onclick = null;
        document.getElementById('confirm-cancel').onclick = null;
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
    window.game = game; // Expose for console debugging

    // Initialize sound system
    SoundManager.init();

    // Expose functions for tower renderer to call BEFORE creating renderer
    window.openFloorDetail = openFloorDetail;
    window.openBuildModal = openBuildModal;
    window.showApplicantModal = showApplicantModal;
    window.showVIPEscortUI = showVIPEscortUI;
    window.hideVIPEscortUI = hideVIPEscortUI;
    window.showReassignStaffModal = showReassignStaffModal;

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

    // Show onboarding tutorial on first launch
    if (!localStorage.getItem('simlibrary_onboarding_complete')) {
        setTimeout(() => {
            startOnboarding();
        }, 500);
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
            SoundManager.success();
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
                // Force update check
                registration.update();

                // Check for updates periodically
                setInterval(() => registration.update(), 60000); // Check every minute

                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New version available - notify and reload
                            newWorker.postMessage({ type: 'SKIP_WAITING' });

                            // Show brief notification then reload
                            showToast('Updating to new version...');
                            setTimeout(() => window.location.reload(), 1000);
                        }
                    });
                });
            })
            .catch(() => {
                // Service worker registration failed silently
            });
    }

}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // Add Floor button - opens build modal
    document.getElementById('add-floor-btn').addEventListener('click', () => {
        haptic('medium');
        openBuildModal();
    });

    // Detail modal close button
    document.getElementById('close-detail-modal').addEventListener('click', () => {
        haptic('light');
        closeDetailModal();
    });

    // Delete floor button
    document.getElementById('delete-floor-btn').addEventListener('click', () => {
        if (!currentFloorId) return;

        const floor = game.getFloor(currentFloorId);
        if (!floor) return;

        const floorType = game.floorTypes.find(t => t.id === floor.typeId);
        const refundAmount = floorType ? Math.floor(floorType.buildCost * 0.5) : 0;

        if (confirm(`Are you sure you want to delete "${floor.name}"?\n\nYou will receive ${refundAmount} ⭐ as a refund (50% of build cost).`)) {
            haptic('heavy');
            try {
                const result = game.deleteFloor(currentFloorId);
                if (result && result.success) {
                    closeDetailModal();
                    showToast(`Deleted ${result.floorName}! Refunded ${result.refund} ⭐`);
                } else {
                    showToast((result && result.error) || 'Could not delete floor');
                }
            } catch (err) {
                console.error('Delete floor error:', err);
                showToast('Error deleting floor: ' + err.message);
            }
        }
    });

    // Close detail modal when clicking outside
    document.getElementById('detail-modal').addEventListener('click', (e) => {
        if (e.target.id === 'detail-modal') {
            closeDetailModal();
        }
    });

    // Build modal close button
    document.getElementById('close-build-modal').addEventListener('click', () => {
        haptic('light');
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
        haptic('medium');
        openStatsModal();
    });

    // Stats modal close button
    document.getElementById('close-stats-modal').addEventListener('click', () => {
        haptic('light');
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
        haptic('medium');
        openAchievementsModal();
    });

    // Achievements modal close button
    document.getElementById('close-achievements-modal').addEventListener('click', () => {
        haptic('light');
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
        haptic('medium');
        openCollectionModal();
    });

    // Collection modal close button
    document.getElementById('close-collection-modal').addEventListener('click', () => {
        haptic('light');
        closeCollectionModal();
    });

    // Close collection modal when clicking outside
    document.getElementById('collection-modal').addEventListener('click', (e) => {
        if (e.target.id === 'collection-modal') {
            closeCollectionModal();
        }
    });

    // Upgrades button - opens upgrades modal (if button exists)
    const upgradesBtn = document.getElementById('open-upgrades-btn');
    if (upgradesBtn) {
        upgradesBtn.addEventListener('click', () => {
            haptic('medium');
            openUpgradesModal();
        });
    }

    // Upgrades modal close button
    document.getElementById('close-upgrades-modal').addEventListener('click', () => {
        haptic('light');
        closeUpgradesModal();
    });

    // Close upgrades modal when clicking outside
    document.getElementById('upgrades-modal').addEventListener('click', (e) => {
        if (e.target.id === 'upgrades-modal') {
            closeUpgradesModal();
        }
    });

    // Sound toggle button
    const soundBtn = document.getElementById('toggle-sound-btn');
    // Update initial state
    soundBtn.textContent = SoundManager.enabled ? '🔔' : '🔕';
    soundBtn.addEventListener('click', () => {
        const enabled = SoundManager.toggle();
        soundBtn.textContent = enabled ? '🔔' : '🔕';
        if (enabled) {
            SoundManager.click(); // Play a click sound to confirm sound is on
        }
    });

    // Restock All button
    const restockBtn = document.getElementById('restock-all-btn');
    const handleRestockAll = async () => {
        haptic('medium');
        const neededCount = game.getRestockNeededCount();
        if (neededCount === 0) {
            SoundManager.error();
            showToast('All categories are fully stocked!');
            return;
        }
        const cost = Math.max(1, Math.ceil(neededCount / 3));
        const confirmed = await showConfirm(
            'Restock All',
            `Instantly restock ${neededCount} ${neededCount === 1 ? 'category' : 'categories'}?\n\nCost: ${cost} 💎`
        );
        if (confirmed) {
            const result = game.restockAll();
            if (result.success) {
                SoundManager.restock();
                updateDisplay();
                showToast(`📦 ${result.count} ${result.count === 1 ? 'category' : 'categories'} restocked!`);
            } else {
                SoundManager.error();
                showToast(result.error || 'Cannot restock');
            }
        }
    };
    restockBtn.addEventListener('click', handleRestockAll);
    restockBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        handleRestockAll();
    });

    // Help button - opens help modal
    const helpBtn = document.getElementById('open-help-btn');
    helpBtn.addEventListener('click', () => {
        haptic('medium');
        openHelpModal();
    });
    helpBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        haptic('medium');
        openHelpModal();
    });

    // Help modal close button
    document.getElementById('close-help-modal').addEventListener('click', () => {
        haptic('light');
        closeHelpModal();
    });

    // Close help modal when clicking outside
    document.getElementById('help-modal').addEventListener('click', (e) => {
        if (e.target.id === 'help-modal') {
            closeHelpModal();
        }
    });

    // Tab buttons for upgrades modal
    document.querySelectorAll('.upgrades-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            haptic('light');
            document.querySelectorAll('.upgrades-tabs .tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderUpgradesTab(btn.dataset.tab);
        });
    });

    // Confirmation modal buttons
    document.getElementById('close-confirm-modal').addEventListener('click', () => {
        haptic('light');
        closeConfirmModal(false);
    });

    document.getElementById('confirm-cancel').addEventListener('click', () => {
        haptic('light');
        closeConfirmModal(false);
    });

    document.getElementById('confirm-ok').addEventListener('click', () => {
        haptic('medium');
        closeConfirmModal(true);
    });

    // Close confirm modal when clicking outside
    document.getElementById('confirm-modal').addEventListener('click', (e) => {
        if (e.target.id === 'confirm-modal') {
            closeConfirmModal(false);
        }
    });

    // Export game button
    document.getElementById('export-game-btn').addEventListener('click', () => {
        haptic('medium');
        exportGameSave();
    });

    // Import game button
    document.getElementById('import-game-btn').addEventListener('click', () => {
        haptic('medium');
        document.getElementById('import-file-input').click();
    });

    // Import file input
    document.getElementById('import-file-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            importGameSave(file);
        }
        // Reset file input so same file can be selected again
        e.target.value = '';
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

    // Save modal button
    document.getElementById('open-save-btn').addEventListener('click', () => {
        haptic('medium');
        document.getElementById('save-modal').classList.add('active');
    });

    // Save modal close
    document.getElementById('close-save-modal').addEventListener('click', () => {
        haptic('light');
        document.getElementById('save-modal').classList.remove('active');
    });

    // Save modal - close on background click
    document.getElementById('save-modal').addEventListener('click', (e) => {
        if (e.target.id === 'save-modal') {
            document.getElementById('save-modal').classList.remove('active');
        }
    });

    // Save modal - Export
    document.getElementById('save-export-btn').addEventListener('click', () => {
        haptic('medium');
        exportGameSave();
        document.getElementById('save-modal').classList.remove('active');
    });

    // Save modal - Import
    document.getElementById('save-import-btn').addEventListener('click', () => {
        haptic('medium');
        document.getElementById('save-import-file').click();
    });

    // Save modal - Import file handler
    document.getElementById('save-import-file').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            importGameSave(file);
            document.getElementById('save-modal').classList.remove('active');
        }
        e.target.value = '';
    });

    // Save modal - Restart
    document.getElementById('save-restart-btn').addEventListener('click', async () => {
        document.getElementById('save-modal').classList.remove('active');
        const confirmed = await showConfirm(
            'Restart Tower',
            'This will delete ALL your progress and start fresh. Are you sure?'
        );

        if (confirmed) {
            game.reset();
            renderTowerScreen();
            updateGlobalStats();
            window.location.reload();
        }
    });

    // Mood breakdown click
    document.querySelector('.mood-stat').addEventListener('click', () => {
        haptic('light');
        showMoodBreakdown();
    });

    // Tower Bucks click - show usage options
    document.querySelector('.bucks-stat').addEventListener('click', () => {
        haptic('light');
        openUpgradesModal();
        // Switch to perks tab where trade option is
        document.querySelectorAll('.upgrades-tabs .tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.upgrades-tabs .tab-btn[data-tab="perks"]').classList.add('active');
        renderUpgradesTab('perks');
    });
}

/**
 * Show weather forecast popup
 */
function showWeatherForecast() {
    const forecast = game.getWeatherForecast();

    let forecastHtml = forecast.map((item, index) => {
        const effects = [];
        if (item.weather.moodEffect !== 0) {
            effects.push(`Mood ${item.weather.moodEffect >= 0 ? '+' : ''}${item.weather.moodEffect}`);
        }
        if (item.weather.spawnEffect !== 1) {
            effects.push(`Visitors ${Math.round(item.weather.spawnEffect * 100)}%`);
        }
        const effectText = effects.length > 0 ? effects.join(', ') : 'Normal';

        return `
            <div style="display: flex; align-items: center; gap: 10px; padding: 8px 0; ${index === 0 ? 'font-weight: bold;' : 'opacity: 0.8;'}">
                <span style="font-size: 24px;">${item.weather.emoji}</span>
                <div>
                    <div>${item.weather.name}</div>
                    <div style="font-size: 12px; color: #666;">${item.timeLabel}</div>
                    <div style="font-size: 11px; color: #666;">${effectText}</div>
                </div>
            </div>
        `;
    }).join('');

    showToast(''); // Clear any existing toast

    // Create a custom forecast popup
    const popup = document.createElement('div');
    popup.id = 'weather-forecast-popup';
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #ffffff;
        color: #333;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 10000;
        min-width: 250px;
    `;
    popup.innerHTML = `
        <h3 style="margin: 0 0 15px 0; text-align: center; color: #333;">Weather Forecast</h3>
        ${forecastHtml}
        <button onclick="this.parentElement.remove()" style="
            width: 100%;
            margin-top: 15px;
            padding: 10px;
            border: none;
            border-radius: 8px;
            background: #4a90d9;
            color: white;
            font-weight: bold;
            cursor: pointer;
        ">Close</button>
    `;

    // Remove any existing popup
    const existing = document.getElementById('weather-forecast-popup');
    if (existing) existing.remove();

    document.body.appendChild(popup);
}

/**
 * Show mood problems popup
 */
function showMoodBreakdown() {
    const problems = game.getMoodProblems();
    const moodDesc = game.getMoodDescription();
    const breakdown = game.getMoodBreakdown();

    // Build breakdown HTML
    let breakdownHtml = breakdown.factors.map(factor => {
        const valueColor = factor.value > 0 ? '#2e7d32' : factor.value < 0 ? '#c62828' : '#666';
        const valueText = factor.value > 0 ? `+${factor.value}` : factor.value.toString();
        return `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 4px 0;">
                <span>${factor.emoji} ${factor.name}</span>
                <span style="color: ${valueColor}; font-weight: bold;">${valueText}</span>
            </div>
        `;
    }).join('');

    let problemsHtml = problems.length > 0 ? problems.map(item => {
        return `
            <div style="display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid rgba(0,0,0,0.1);">
                <span style="font-size: 20px;">${item.emoji}</span>
                <div style="flex: 1;">
                    <div style="font-weight: 500;">${item.text}</div>
                    <div style="font-size: 11px; color: #666;">${item.detail}</div>
                </div>
            </div>
        `;
    }).join('') : '<div style="color: #666; text-align: center; padding: 10px;">No major issues!</div>';

    // Create popup
    const popup = document.createElement('div');
    popup.id = 'mood-breakdown-popup';
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #ffffff;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 10000;
        min-width: 280px;
        max-width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        color: #333;
    `;
    popup.innerHTML = `
        <h3 style="margin: 0 0 5px 0; text-align: center;">${moodDesc.emoji} Mood: ${Math.floor(game.mood)}</h3>
        <div style="text-align: center; margin-bottom: 15px; color: #666;">${moodDesc.text}</div>
        <div style="font-weight: bold; margin-bottom: 8px; color: #333;">Mood Factors:</div>
        <div style="background: #f5f5f5; padding: 10px; border-radius: 8px; margin-bottom: 15px; font-size: 13px;">
            ${breakdownHtml}
            <div style="border-top: 2px solid #ddd; margin-top: 8px; padding-top: 8px; display: flex; justify-content: space-between; font-weight: bold;">
                <span>Target Mood</span>
                <span>${breakdown.total}</span>
            </div>
        </div>
        <div style="font-weight: bold; margin-bottom: 8px; color: #333;">Issues:</div>
        ${problemsHtml}
        <button onclick="this.parentElement.remove()" style="
            width: 100%;
            margin-top: 15px;
            padding: 10px;
            border: none;
            border-radius: 8px;
            background: #4A90A4;
            color: white;
            font-weight: bold;
            cursor: pointer;
        ">Close</button>
    `;

    // Remove any existing popup
    const existing = document.getElementById('mood-breakdown-popup');
    if (existing) existing.remove();

    document.body.appendChild(popup);
}

/**
 * Update modal balance display (stars and bucks shown in modal headers and floating indicator)
 */
function updateModalBalance() {
    const stars = Math.floor(game.stars);
    const bucks = game.towerBucks;

    // Update floor detail modal balance
    const modalStars = document.getElementById('modal-stars');
    const modalBucks = document.getElementById('modal-bucks');
    if (modalStars) modalStars.textContent = stars;
    if (modalBucks) modalBucks.textContent = bucks;

    // Update build modal balance
    const buildModalStars = document.getElementById('build-modal-stars');
    const buildModalBucks = document.getElementById('build-modal-bucks');
    if (buildModalStars) buildModalStars.textContent = stars;
    if (buildModalBucks) buildModalBucks.textContent = bucks;

    // Update floating balance indicator
    const floatingStars = document.getElementById('floating-stars');
    const floatingBucks = document.getElementById('floating-bucks');
    if (floatingStars) floatingStars.textContent = stars;
    if (floatingBucks) floatingBucks.textContent = bucks;
}

/**
 * Update global stats display (stars, bucks, level, mood)
 */
function updateGlobalStats() {
    document.getElementById('total-stars').textContent = Math.floor(game.stars);
    document.getElementById('total-bucks').textContent = game.towerBucks;
    document.getElementById('player-level').textContent = game.level;

    // Also update modal balance if visible
    updateModalBalance();

    // Update mood meter
    if (game.mood !== undefined) {
        const moodDesc = game.getMoodDescription();
        document.getElementById('mood-emoji').textContent = moodDesc.emoji;
        document.getElementById('mood-value').textContent = Math.floor(game.mood);
    }

    // Update day counter with clock
    document.getElementById('day-counter').textContent = `Day ${game.getGameDay()} • ${game.getGameClock()}`;

    // Update weather indicator
    const currentWeather = game.getCurrentWeather();
    if (currentWeather) {
        document.getElementById('weather-emoji').textContent = currentWeather.emoji;
        document.getElementById('weather-emoji').title = `${currentWeather.name} - Mood: ${currentWeather.moodEffect >= 0 ? '+' : ''}${currentWeather.moodEffect}, Visitors: ${Math.round(currentWeather.spawnEffect * 100)}%`;
    }

    // Check for special visitor notifications
    if (game._newSpecialVisitor) {
        haptic('success');
        showToast(`${game._newSpecialVisitor.emoji} ${game._newSpecialVisitor.name} arrived! ${game._newSpecialVisitor.description}`);
        delete game._newSpecialVisitor;
    }

    // Check for departing visitors
    if (game._departingVisitor) {
        haptic('light');
        showToast(`${game._departingVisitor.emoji} ${game._departingVisitor.name} left the library.`);
        delete game._departingVisitor;
    }

    // Check for mood tips
    if (game._moodTip) {
        haptic('collect');
        showToast(`💎 Happy patron left a tip!`);
        delete game._moodTip;
    }

    // Check for new synergies
    if (game._newSynergy) {
        haptic('success');
        showToast(`${game._newSynergy.emoji} ${game._newSynergy.name} activated! ${game._newSynergy.description}`);
        delete game._newSynergy;
    }

    // Check for cozy events
    if (game._cozyEvent) {
        haptic('medium');
        showToast(`${game._cozyEvent.emoji} ${game._cozyEvent.name}! ${game._cozyEvent.description}`);
        delete game._cozyEvent;
    }

    // Check for Event Hall events
    if (game._newHallEvent) {
        haptic('success');
        showToast(`🎭 Event Hall: ${game._newHallEvent.emoji} ${game._newHallEvent.name}! ${game._newHallEvent.description}`);
        delete game._newHallEvent;
    }

    // Check for ended Event Hall events
    if (game._hallEventEnded) {
        haptic('collect');
        showToast(`🎭 ${game._hallEventEnded.emoji} ${game._hallEventEnded.name} ended! +${game._hallEventEnded.reward} ⭐`);
        delete game._hallEventEnded;
    }

    // Check for weather changes
    if (game._weatherChanged) {
        const weather = game._weatherChanged;
        haptic('light');
        let effectText = '';
        if (weather.moodEffect > 0) effectText = `Mood +${weather.moodEffect}`;
        else if (weather.moodEffect < 0) effectText = `Mood ${weather.moodEffect}`;
        if (weather.spawnEffect < 1) effectText += effectText ? ', fewer visitors' : 'Fewer visitors';
        else if (weather.spawnEffect > 1) effectText += effectText ? ', more visitors' : 'More visitors';
        showToast(`${weather.emoji} Weather: ${weather.name}${effectText ? ' - ' + effectText : ''}`);
        delete game._weatherChanged;
    }

    // Check for holiday notifications
    if (game._holidayStarted) {
        const holiday = game._holidayStarted;
        haptic('success');
        showToast(`${holiday.emoji} ${holiday.name} has begun! Special bonuses active for ${holiday.duration} day(s).`);
        delete game._holidayStarted;
    }
    if (game._holidayEnded) {
        const holiday = game._holidayEnded;
        haptic('light');
        showToast(`${holiday.emoji} ${holiday.name} has ended. See you next year!`);
        delete game._holidayEnded;
    }

    // Check for incidents
    if (game._newIncident) {
        haptic('error');
        showToast(`${game._newIncident.emoji} ${game._newIncident.type} at ${game._newIncident.floor}!`);
        delete game._newIncident;
    }
    if (game._incidentFixed) {
        haptic('success');
        showToast(`${game._incidentFixed.emoji} ${game._incidentFixed.type} at ${game._incidentFixed.floor}`);
        delete game._incidentFixed;
    }

    // Check for book donations
    if (game._bookDonation) {
        const donation = game._bookDonation;
        haptic('collect');
        const sourceEmoji = donation.source?.emoji || '📚';
        const sourceName = donation.source?.name || 'Donation';
        const catEmoji = donation.categoryEmoji || '📖';
        const catName = donation.categoryName || 'books';
        showToast(`${sourceEmoji} ${sourceName}: +${donation.booksAdded} ${catEmoji} ${catName} at ${donation.floorName}!`);
        delete game._bookDonation;
    }

    // Check for library card notifications
    if (game._newLibraryCard) {
        const card = game._newLibraryCard;
        haptic('success');
        showToast(`📇 New library card member: ${card.emoji} ${card.name}!`);
        delete game._newLibraryCard;
    }
    if (game._returningPatron) {
        const patron = game._returningPatron;
        haptic('light');
        showToast(`📇 Welcome back ${patron.emoji} ${patron.name}! (${patron.visits} visits)`);
        delete game._returningPatron;
    }
    if (game._cardMilestone) {
        const milestone = game._cardMilestone;
        haptic('success');
        showToast(`🎉 ${milestone.cardHolder.emoji} ${milestone.cardHolder.name} reached ${milestone.cardHolder.visits} visits! ${milestone.benefit.description}`);
        delete game._cardMilestone;
    }

    // Check for night cleaning
    if (game._nightCleaningOccurred) {
        if (game._cleanedAmount > 0) {
            haptic('light');
            showToast(`🧹 Night cleaning complete! Cleaned ${game._cleanedAmount} trash.`);
        }
        delete game._nightCleaningOccurred;
        delete game._cleanedAmount;
    }

    // Check for inspector bonus
    if (game._inspectorBonus !== undefined) {
        haptic('collect');
        showToast(`🔍 Library Inspector awarded ${game._inspectorBonus} ⭐ for tidiness!`);
        delete game._inspectorBonus;
    }

    // Check for completed mini-quest
    if (game._completedMiniQuest) {
        haptic('success');
        const bucks = game._completedMiniQuest.rewardBucks > 0 ? ` + ${game._completedMiniQuest.rewardBucks} 💎` : '';
        showToast(`✅ ${game._completedMiniQuest.name} complete! +${game._completedMiniQuest.reward} ⭐${bucks}`);
        delete game._completedMiniQuest;
    }
}

/**
 * Haptic feedback utility
 * Patterns: 'light' (tap), 'medium' (action), 'heavy' (success), 'error' (double), 'success' (celebration)
 */
function haptic(pattern = 'light') {
    if (!navigator.vibrate) return;

    const patterns = {
        light: [10],           // Quick tap
        medium: [20],          // Button press
        heavy: [30],           // Building/upgrade complete
        error: [50, 50, 50],   // Error feedback
        success: [30, 50, 30, 50, 50], // Achievement/reward
        collect: [15, 30, 15], // Collecting stars
    };

    navigator.vibrate(patterns[pattern] || patterns.light);
}

// Make haptic globally accessible for tower-renderer
window.haptic = haptic;

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
            haptic('medium');
            const floorId = e.target.dataset.floorId || e.target.closest('.rush-btn').dataset.floorId;
            handleRushConstruction(floorId);
            return;
        }
        haptic('light');
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

    // Update modal balance display
    updateModalBalance();

    // Update bonus description for utility rooms
    const bonusEl = document.getElementById('detail-bonus');
    const floorType = game.floorTypes.find(ft => ft.id === floor.typeId);
    if (floorType && floorType.bonus && floorType.bonus.description) {
        bonusEl.textContent = floorType.bonus.description;
        bonusEl.style.display = 'block';
    } else {
        bonusEl.textContent = '';
        bonusEl.style.display = 'none';
    }

    // Update floor preview image
    const previewSection = document.getElementById('floor-preview-section');
    const previewImg = document.getElementById('floor-preview-img');
    const floorBgMap = {
        'board_books': 'floor-boardbooks.png',
        'picture_books': 'floor-picture-books.png',
        'scifi': 'floor-scifi.png',
        'music_audio': 'floor-music.png',
        'technology': 'floor-technology.png',
        'science': 'floor-science.png',
        'juvenile_series': 'floor-juvenile_series.png',
        'maps_travel': 'floor-maps_travel.png',
        'teen': 'floor-teen.png',
        'movies': 'floor-movies.png',
        'cookbooks': 'floor-cookbooks.png',
        'romance': 'floor-romance.png',
        'true_crime': 'floor-true_crime.png',
        'fantasy': 'floor-fantasy.png',
        'early_readers': 'floor-early_readers.png',
        'fiction': 'floor-fiction.png',
        'mystery': 'floor-mystery.png',
        'graphic_novels': 'floor-graphic_novels.png',
        'biography': 'floor-biography.png',
        'bathroom': 'floor-bathroom-1.png',
        'lobby': 'floor-lobby.png',
        'sports': 'floor-sports.png',
        'maker_space': 'floor-makerspace.png',
        'study_room': 'floor-study_room.png',
        'coffee_shop': 'floor-coffee_shop.png',
        'computer_lab': 'floor-computer_lab.png',
        'history': 'floor-history.png',
        'newspapers': 'floor-newspapers.png',
        'gaming_lounge': 'floor-gaming_lounge.png',
        'language_lab': 'floor-language_lab.png',
        'tool_library': 'floor-tool_library.png',
        'seed_library': 'floor-seed_library.png',
        'basement': 'floor-basement.png',
        'snack_bar': 'floor-snack_bar.png',
        'event_hall': 'floor-event_hall.png',
        'library_of_things': 'floor-library_of_things.png',
        'bakery': 'floor-bakery.png',
        'hot_drinks_cafe': 'floor-hot_drinks_cafe.png',
        'genealogy': 'floor-genealogy.png',
        'local_history': 'floor-local_history.png',
        'music_practice': 'floor-music_practice.png',
        'podcast_studio': 'floor-podcast_studio.png',
        'art_gallery': 'floor-art_gallery.png'
    };
    let bgFilename = floorBgMap[floor.typeId];
    // Bathroom has 3 variants based on floor number
    if (floor.typeId === 'bathroom') {
        const variantIndex = (floor.floorNumber % 3) + 1;
        bgFilename = `floor-bathroom-${variantIndex}.png`;
    }
    if (bgFilename) {
        const themePath = `assets/themes/${game.activeTheme || 'classic'}`;
        previewImg.src = `${themePath}/${bgFilename}`;
        previewSection.style.display = 'block';
    } else {
        previewSection.style.display = 'none';
    }

    // Update status
    const statusEl = document.getElementById('detail-status');
    if (floor.status === 'building') {
        const remaining = Math.max(0, Math.ceil((floor.buildEndTime - Date.now()) / 1000));
        statusEl.textContent = `🏗️ Building... ${remaining}s`;
        statusEl.className = 'floor-status building';
    } else {
        // Show trash level in status
        let trashText = '';
        if (floor.trash !== undefined && floor.trash > 0) {
            const trashPercent = Math.floor(floor.trash);
            if (floor.trash >= 80) {
                trashText = ` | 🗑️ ${trashPercent}% (Critical!)`;
            } else if (floor.trash >= 50) {
                trashText = ` | 🗑️ ${trashPercent}% (Dirty)`;
            } else if (floor.trash >= 20) {
                trashText = ` | 🗑️ ${trashPercent}%`;
            }
        }
        statusEl.textContent = `✅ Ready${trashText}`;
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
    } else if (floor.incidents && Object.keys(floor.incidents).length > 0) {
        // Show incident status
        let incidentText = '🚫 CLOSED - ';
        if (floor.incidents.powerOut) incidentText += '⚡ Power Outage (needs Electrician)';
        else if (floor.incidents.flooded) incidentText += '🌊 Flooded (needs Plumber)';
        else if (floor.incidents.brokenWindow) incidentText += '🪟 Broken Window (needs Custodian)';
        else if (floor.incidents.messySpill) incidentText += '🤮 Messy Spill (needs Custodian)';
        else if (floor.incidents.bugInfestation) incidentText += '🐜 Bug Infestation (needs Custodian)';
        else if (floor.incidents.fireAlarm) incidentText += '🚨 Fire Alarm (waiting to reset)';
        statusEl.textContent = incidentText;
    } else {
        // Show trash level in status
        let trashText = '';
        if (floor.trash !== undefined && floor.trash > 0) {
            const trashPercent = Math.floor(floor.trash);
            if (floor.trash >= 80) {
                trashText = ` | 🗑️ ${trashPercent}% (Critical!)`;
            } else if (floor.trash >= 50) {
                trashText = ` | 🗑️ ${trashPercent}% (Dirty)`;
            } else if (floor.trash >= 20) {
                trashText = ` | 🗑️ ${trashPercent}%`;
            }
        }
        statusEl.textContent = `✅ Ready${trashText}`;
    }

    // Update upgrade section
    renderUpgradeSection(floor);

    // Update staff slots (skip if reassign modal is open to avoid event listener conflicts)
    if (!document.getElementById('reassign-modal')) {
        renderStaffSlots(floor);
    }

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
        haptic('heavy');
        renderUpgradeSection(floor);
        renderBookCategories(floor);
        updateGlobalStats();
    } else {
        haptic('error');
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

    // Check if this floor type has custom staff slots (like basement)
    const floorType = game.floorTypes.find(ft => ft.id === floor.typeId);
    const hasCustomStaff = floorType && floorType.staffSlots;

    // Create 3 staff slots
    for (let i = 0; i < 3; i++) {
        const staff = floor.staff[i];
        const categoryName = floor.bookStock[i]?.name || '';

        const slot = document.createElement('div');
        slot.className = 'staff-slot';

        if (hasCustomStaff) {
            // Utility staff for bathroom/basement - now hired from lobby
            const customStaff = floorType.staffSlots[i];
            const hiredStaff = floor.staff[i];
            // Support both old string format and new object format
            const isHired = hiredStaff === customStaff.name ||
                (hiredStaff && typeof hiredStaff === 'object' && hiredStaff.typeId);

            if (isHired && typeof hiredStaff === 'object') {
                // New format: staff object with details
                slot.innerHTML = `
                    <div class="staff-icon" style="background-color: ${hiredStaff.color}">${hiredStaff.emoji}</div>
                    <div class="staff-info">
                        <div class="staff-name">${hiredStaff.name} (${hiredStaff.typeName})</div>
                        <div class="staff-unlock">✅ ${hiredStaff.effect || customStaff.effect}</div>
                    </div>
                    <button class="fire-staff-btn" data-floor-id="${floor.id}" data-staff-id="${hiredStaff.id}">
                        Fire
                    </button>
                `;
            } else if (isHired) {
                // Old format: just the name string (backwards compatibility)
                slot.innerHTML = `
                    <div class="staff-icon" style="background-color: ${customStaff.color}">${customStaff.emoji}</div>
                    <div class="staff-info">
                        <div class="staff-name">${customStaff.name}</div>
                        <div class="staff-unlock">✅ ${customStaff.effect}</div>
                    </div>
                `;
            } else {
                // Empty slot - prompt to check lobby for utility applicants
                const utilityApplicants = game.lobbyApplicants ?
                    game.lobbyApplicants.filter(a => a.isUtilityStaff && a.utilityFloorType === floor.typeId && a.utilitySlotIndex === i) : [];
                const hasApplicant = utilityApplicants.length > 0;
                slot.innerHTML = `
                    <div class="staff-icon empty">?</div>
                    <div class="staff-info">
                        <div class="staff-name">${customStaff.name} Needed</div>
                        <div class="staff-description">${customStaff.effect}</div>
                        <div class="lobby-hint">${hasApplicant ? `${utilityApplicants[0].name} is waiting in lobby!` : 'Check lobby for applicants'}</div>
                    </div>
                `;
            }
        } else {
            // Standard staff for regular floors - must hire from lobby applicants
            const staffType = game.staffTypes[i];

            if (staff) {
                // Filled slot - show dream match indicator if applicable
                const isDreamMatch = staff.dreamGenre === floor.typeId;
                const dreamFloorType = game.floorTypes.find(ft => ft.id === staff.dreamGenre);
                const dreamFloorName = dreamFloorType ? dreamFloorType.name : 'Unknown';
                slot.innerHTML = `
                    <div class="staff-icon" style="background-color: ${staff.color}">${staff.emoji}</div>
                    <div class="staff-info">
                        <div class="staff-name">${staff.name}</div>
                        <div class="staff-unlock">✅ "${categoryName}" unlocked</div>
                        ${isDreamMatch ? '<div class="dream-match-badge">💫 Dream Job!</div>' : `<div class="dream-hint">Dreams of: ${dreamFloorName}</div>`}
                    </div>
                    <div class="staff-actions">
                        <button class="reassign-staff-btn" data-floor-id="${floor.id}" data-staff-id="${staff.id}">
                            Move
                        </button>
                        <button class="fire-staff-btn" data-floor-id="${floor.id}" data-staff-id="${staff.id}">
                            Fire
                        </button>
                    </div>
                `;
            } else {
                // Empty slot - prompt to visit lobby
                const applicantCount = game.lobbyApplicants ? game.lobbyApplicants.length : 0;
                slot.innerHTML = `
                    <div class="staff-icon empty">?</div>
                    <div class="staff-info">
                        <div class="staff-name">Empty Slot ${i + 1}</div>
                        <div class="staff-description">${staffType.description}</div>
                        <div class="lobby-hint">${applicantCount > 0 ? `${applicantCount} applicant${applicantCount > 1 ? 's' : ''} waiting in lobby!` : 'Check lobby for applicants'}</div>
                    </div>
                `;
            }
        }

        container.appendChild(slot);
    }

    // Add event listeners for hire buttons
    container.querySelectorAll('.hire-staff-btn:not(.disabled)').forEach(btn => {
        btn.addEventListener('click', () => {
            const floorId = btn.dataset.floorId;
            const staffIndex = parseInt(btn.dataset.staffIndex);
            handleHireStaff(floorId, staffIndex);
        });
    });

    // Add event listeners for reassign buttons
    container.querySelectorAll('.reassign-staff-btn').forEach(btn => {
        let handled = false;
        const handleReassign = (e) => {
            if (handled) return;
            handled = true;
            e.preventDefault();
            e.stopPropagation();
            const floorId = btn.dataset.floorId;
            const staffId = btn.dataset.staffId;
            showReassignStaffModal(floorId, staffId);
            setTimeout(() => { handled = false; }, 500);
        };
        btn.addEventListener('click', handleReassign);
        btn.addEventListener('touchend', handleReassign);
    });

    // Add event listeners for fire buttons
    container.querySelectorAll('.fire-staff-btn').forEach(btn => {
        let handled = false;
        const handleFire = (e) => {
            if (handled) return;
            handled = true;
            e.preventDefault();
            e.stopPropagation();
            const floorId = btn.dataset.floorId;
            const staffId = btn.dataset.staffId;
            handleFireStaff(floorId, staffId);
            setTimeout(() => { handled = false; }, 500);
        };
        btn.addEventListener('click', handleFire);
        btn.addEventListener('touchend', handleFire);
    });
}

/**
 * Handle hiring staff
 */
async function handleHireStaff(floorId, staffIndex) {
    const floor = game.getFloor(floorId);
    if (!floor) return;

    // Check if this floor type has custom staff
    const floorType = game.floorTypes.find(ft => ft.id === floor.typeId);
    const hasCustomStaff = floorType && floorType.staffSlots;

    let staffName, staffCost;

    if (hasCustomStaff) {
        const customStaff = floorType.staffSlots[staffIndex];
        staffName = customStaff.name;
        staffCost = customStaff.cost;
    } else {
        const staffType = game.staffTypes[floor.staff.length];
        if (!staffType) return;
        staffName = staffType.name;
        staffCost = staffType.hireCost;
    }

    const confirmed = await showConfirm(
        'Hire Staff',
        `Hire ${staffName} for ${staffCost} ⭐?`
    );

    if (!confirmed) return;

    const result = game.hireStaff(floorId, hasCustomStaff ? staffIndex : undefined);
    if (result.success) {
        haptic('heavy');
        SoundManager.purchase();
        renderStaffSlots(floor);
        renderBookCategories(floor);
        updateGlobalStats();
    } else {
        haptic('error');
        SoundManager.error();
        alert(result.error || 'Cannot hire staff');
    }
}

/**
 * Handle firing staff from a floor
 */
async function handleFireStaff(floorId, staffId) {
    const floor = game.getFloor(floorId);
    if (!floor) return;

    const staff = floor.staff.find(s => s && s.id === staffId);
    if (!staff) return;

    const confirmed = await showConfirm(
        'Fire Staff',
        `Are you sure you want to fire ${staff.name}? This cannot be undone.`
    );

    if (!confirmed) return;

    const result = game.fireStaff(staffId, floorId);
    if (result.success) {
        haptic('medium');
        SoundManager.purchase();
        renderStaffSlots(floor);
        renderBookCategories(floor);
        updateGlobalStats();
    } else {
        haptic('error');
        SoundManager.error();
        alert(result.error || 'Cannot fire staff');
    }
}

/**
 * Show modal to reassign staff to a different floor
 */
function showReassignStaffModal(fromFloorId, staffId) {
    const fromFloor = game.getFloor(fromFloorId);
    if (!fromFloor) return;

    const staff = fromFloor.staff.find(s => s && s.id === staffId);
    if (!staff) return;

    // Get floors with empty slots (excluding current floor)
    const availableFloors = game.getFloorsWithEmptySlots().filter(f => f.id !== fromFloorId);

    if (availableFloors.length === 0) {
        alert('No other floors have empty staff slots!');
        return;
    }

    // Build floor options
    const dreamFloorType = game.floorTypes.find(ft => ft.id === staff.dreamGenre);
    const dreamFloorName = dreamFloorType ? dreamFloorType.name : 'Unknown';

    let floorOptions = availableFloors.map(floor => {
        const floorType = game.floorTypes.find(ft => ft.id === floor.typeId);
        const isDreamFloor = floor.typeId === staff.dreamGenre;
        return `
            <button class="floor-option ${isDreamFloor ? 'dream-floor' : ''}" data-floor-id="${floor.id}">
                <span class="floor-name">${floorType ? floorType.name : 'Floor'} (Floor ${floor.floorNumber})</span>
                ${isDreamFloor ? '<span class="dream-indicator">💫 Dream Job!</span>' : ''}
            </button>
        `;
    }).join('');

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'reassign-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Move ${staff.name}</h3>
            <p>Current dream: <strong>${dreamFloorName}</strong></p>
            <p>Select new floor:</p>
            <div class="floor-options">
                ${floorOptions}
            </div>
            <button class="btn-secondary" onclick="document.getElementById('reassign-modal').remove()">Cancel</button>
        </div>
    `;

    document.body.appendChild(modal);

    // Add click/touch handlers for floor options
    modal.querySelectorAll('.floor-option').forEach(btn => {
        const handleFloorSelect = async () => {
            const toFloorId = btn.dataset.floorId;
            const result = game.reassignStaff(staffId, fromFloorId, toFloorId);

            if (result.success) {
                haptic('heavy');
                SoundManager.purchase();

                if (result.isDreamMatch) {
                    alert(`${staff.name} is now working their dream job! 💫`);
                }

                modal.remove();

                // Refresh the floor modal
                const currentFloor = game.getFloor(fromFloorId);
                if (currentFloor) {
                    renderStaffSlots(currentFloor);
                    renderBookCategories(currentFloor);
                }
                updateGlobalStats();
            } else {
                haptic('error');
                alert(result.error || 'Cannot move staff');
            }
        };
        btn.addEventListener('click', handleFloorSelect);
        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            handleFloorSelect();
        });
    });
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
        let handled = false;
        const doRestock = (e) => {
            if (handled) return;
            handled = true;
            e.preventDefault();
            e.stopPropagation();
            const floorId = btn.dataset.floorId;
            const categoryIndex = parseInt(btn.dataset.category);
            handleRestock(floorId, categoryIndex);
            setTimeout(() => { handled = false; }, 300);
        };
        btn.addEventListener('click', doRestock);
        btn.addEventListener('touchend', doRestock);
    });

    // Add event listeners for rush buttons
    container.querySelectorAll('.rush-restock-btn').forEach(btn => {
        let handled = false;
        const doRush = (e) => {
            if (handled) return;
            handled = true;
            e.preventDefault();
            e.stopPropagation();
            const floorId = btn.dataset.floorId;
            const categoryIndex = parseInt(btn.dataset.category);
            handleRushRestock(floorId, categoryIndex);
            setTimeout(() => { handled = false; }, 300);
        };
        btn.addEventListener('click', doRush);
        btn.addEventListener('touchend', doRush);
    });
}

/**
 * Handle restocking a category
 */
function handleRestock(floorId, categoryIndex) {
    const result = game.restockBooks(floorId, categoryIndex);
    if (result.success) {
        haptic('medium');
        SoundManager.restock();
        const floor = game.getFloor(floorId);
        renderBookCategories(floor);
        updateGlobalStats();
    } else {
        haptic('error');
        SoundManager.error();
        alert(result.error || 'Cannot restock');
    }
}

/**
 * Handle rushing restock
 */
function handleRushRestock(floorId, categoryIndex) {
    const success = game.rushRestocking(floorId, categoryIndex);
    if (success) {
        haptic('medium');
        SoundManager.coin();
        const floor = game.getFloor(floorId);
        renderBookCategories(floor);
        updateGlobalStats();
    } else {
        haptic('error');
        SoundManager.error();
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
    // Update modal balance display
    updateModalBalance();

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
                haptic('medium');
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
        haptic('heavy');
        SoundManager.purchase();
        closeBuildModal();
        renderTowerScreen();
        updateGlobalStats();
    } else {
        haptic('error');
        SoundManager.error();
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
 * Open help modal
 */
function openHelpModal() {
    document.getElementById('help-modal').classList.add('active');
}

/**
 * Close help modal
 */
function closeHelpModal() {
    document.getElementById('help-modal').classList.remove('active');
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
        haptic('heavy');
        const decoration = game.decorations.find(d => d.id === decorationId);
        showToast(`${decoration.emoji} placed in lobby!`);
        renderUpgradesTab('decorations');
    } else {
        haptic('error');
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
        haptic('heavy');
        showToast(`${decoration.emoji} placed on ${floor.name}!`);
        renderUpgradesTab('decorations');
    } else {
        haptic('error');
        alert(result.error || 'Cannot place decoration');
    }
}

/**
 * Render perks tab
 */
function renderPerksTab(container) {
    // Trade section at top
    const tradeSection = document.createElement('div');
    tradeSection.className = 'trade-section';
    tradeSection.style.cssText = 'background: #f0f0f0; padding: 12px; border-radius: 8px; margin-bottom: 16px; text-align: center;';

    const canTrade = game.towerBucks >= 1;
    tradeSection.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 8px;">💎 Trade Tower Bucks</div>
        <div style="font-size: 12px; color: #666; margin-bottom: 8px;">1 💎 = 100 ⭐</div>
        <div style="display: flex; gap: 8px; justify-content: center;">
            <button class="buy-upgrade-btn trade-bucks-btn" data-amount="1" ${!canTrade ? 'disabled' : ''}>
                Trade 1 💎
            </button>
            <button class="buy-upgrade-btn trade-bucks-btn" data-amount="10" ${game.towerBucks < 10 ? 'disabled' : ''}>
                Trade 10 💎
            </button>
        </div>
        <div style="font-size: 11px; color: #888; margin-top: 6px;">You have ${game.towerBucks} 💎</div>
    `;
    container.appendChild(tradeSection);

    // Add trade event listeners
    tradeSection.querySelectorAll('.trade-bucks-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const amount = parseInt(btn.dataset.amount);
            const result = game.tradeBucksForStars(amount);
            if (result.success) {
                haptic('success');
                showToast(`Traded ${amount} 💎 for ${result.starsGained} ⭐`);
                updateUI();
                renderUpgradesTab('perks');
            } else {
                haptic('error');
                showToast(result.error);
            }
        });
    });

    // Offline time bonus section
    const currentOfflineHours = 3 + (game.offlineTimeBonus || 0);
    const offlineSection = document.createElement('div');
    offlineSection.className = 'offline-time-section';
    offlineSection.style.cssText = 'background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 12px; border-radius: 8px; margin-bottom: 16px; text-align: center; color: white;';
    offlineSection.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 8px;">🌙 Offline Earnings Time</div>
        <div style="font-size: 14px; margin-bottom: 8px;">Currently: <strong>${currentOfflineHours} hours</strong></div>
        <div style="font-size: 11px; color: #aaa; margin-bottom: 10px;">Earn stars while away! Buy more time with 💎</div>
        <div style="display: flex; gap: 8px; justify-content: center;">
            <button class="buy-upgrade-btn buy-offline-btn" data-hours="1" ${game.towerBucks < 25 ? 'disabled' : ''} style="background: #4a00e0; color: white;">
                +1 hr (25 💎)
            </button>
            <button class="buy-upgrade-btn buy-offline-btn" data-hours="3" ${game.towerBucks < 75 ? 'disabled' : ''} style="background: #4a00e0; color: white;">
                +3 hrs (75 💎)
            </button>
        </div>
    `;
    container.appendChild(offlineSection);

    // Add offline time purchase listeners
    offlineSection.querySelectorAll('.buy-offline-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const hours = parseInt(btn.dataset.hours);
            const result = game.purchaseOfflineTime(hours);
            if (result.success) {
                haptic('success');
                showToast(`Offline time extended to ${result.totalHours} hours!`);
                updateUI();
                renderUpgradesTab('perks');
            } else {
                haptic('error');
                showToast(result.error);
            }
        });
    });

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
        haptic('success');
        renderUpgradesTab('decorations');
        updateGlobalStats();
        showToast(`${decoration.emoji} ${decoration.name} purchased!`);
    } else {
        haptic('error');
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
        haptic('success');
        renderUpgradesTab('perks');
        updateGlobalStats();
        showToast(`${perk.emoji} ${perk.name} activated!`);
    } else {
        haptic('error');
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
        haptic('success');
        renderUpgradesTab('staff');
        updateGlobalStats();
        showToast(`${upgrade.emoji} ${upgrade.name} purchased!`);
    } else {
        haptic('error');
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

    // Show mini-quest if active (cyan banner, highest priority)
    const miniQuest = game.currentMiniQuest;
    if (miniQuest && Date.now() < miniQuest.expiryTime) {
        const timeRemaining = Math.max(0, Math.ceil((miniQuest.expiryTime - Date.now()) / 1000));
        const seconds = timeRemaining;

        banner.innerHTML = `
            <div>${miniQuest.emoji} ${miniQuest.description}</div>
            <div>${miniQuest.reward}⭐ | ${seconds}s</div>
        `;

        banner.style.display = 'flex';
        banner.style.background = 'linear-gradient(135deg, #00BCD4 0%, #00ACC1 100%)';
        banner.style.cursor = 'pointer';
        banner.onclick = () => scrollToMiniQuest();
        return;
    }

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
        banner.style.cursor = 'default';
        banner.onclick = null;
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
        banner.style.cursor = 'default';
        banner.onclick = null;
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
        banner.style.cursor = 'default';
        banner.onclick = null;
        return;
    }

    banner.style.display = 'none';
}

/**
 * Scroll to the floor with the active mini-quest
 */
function scrollToMiniQuest() {
    if (!game.currentMiniQuest) return;

    const miniQuest = game.currentMiniQuest;
    const floor = game.getFloor(miniQuest.floorId);
    if (!floor) return;

    // Find the floor's index in the rendered list
    const floorIndex = game.floors.indexOf(floor);
    if (floorIndex === -1) return;

    // Calculate the Y position of this floor
    const floorY = -(floorIndex * towerRenderer.floorHeight);

    // Scroll to center the floor in view
    const targetScrollY = -floorY + (towerRenderer.height / 2) - (towerRenderer.floorHeight / 2);

    // Clamp to valid scroll range
    towerRenderer.scrollY = Math.max(0, Math.min(targetScrollY, towerRenderer.maxScrollY));
}

/**
 * Export game save to file
 */
function exportGameSave() {
    try {
        // Get the saved data from localStorage
        const saveData = localStorage.getItem('simLibrarySave');

        if (!saveData) {
            alert('No save data found to export!');
            return;
        }

        // Create a Blob with the save data
        const blob = new Blob([saveData], { type: 'application/json' });

        // Create a download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
        a.download = `simlibrary-save-${timestamp}.json`;

        // Trigger download
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('💾 Save exported successfully!');
    } catch (error) {
        console.error('Export error:', error);
        alert('Failed to export save data. Please try again.');
    }
}

/**
 * Import game save from file
 */
async function importGameSave(file) {
    try {
        // Confirm before importing
        const confirmed = await showConfirm(
            'Import Save',
            'This will replace your current save. Export your current save first if you want to keep it. Continue?'
        );

        if (!confirmed) return;

        // Read the file
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const saveData = e.target.result;

                // Validate JSON
                JSON.parse(saveData);

                // Save to localStorage
                localStorage.setItem('simLibrarySave', saveData);

                showToast('📥 Save imported! Reloading...');

                // Reload the page to apply the imported save
                setTimeout(() => {
                    window.location.reload();
                }, 1000);

            } catch (error) {
                console.error('Import parse error:', error);
                alert('Invalid save file. Please select a valid SimLibrary save file.');
            }
        };

        reader.onerror = () => {
            alert('Failed to read file. Please try again.');
        };

        reader.readAsText(file);

    } catch (error) {
        console.error('Import error:', error);
        alert('Failed to import save data. Please try again.');
    }
}

// ===================================
// Onboarding Tutorial System
// ===================================

const onboardingSteps = [
    {
        id: 'welcome',
        title: '📚 Welcome to SimLibrary!',
        text: 'Build your dream library floor by floor, attract readers, and earn stars! Let me show you around.',
        target: null,
        position: 'center'
    },
    {
        id: 'stars',
        title: '⭐ Stars',
        text: 'This is your currency. Use stars to build new floors, hire staff, and restock books.',
        target: '.stats-bar',
        position: 'bottom'
    },
    {
        id: 'tower',
        title: '🏛️ Your Library Tower',
        text: 'This is your library! Tap on any floor to see details, manage staff, and restock books.',
        target: '#tower-canvas',
        position: 'top'
    },
    {
        id: 'lobby',
        title: '🚪 The Lobby',
        text: 'The ground floor is your lobby. Staff applicants and VIP visitors will appear here - tap them to interact!',
        target: null,
        position: 'center'
    },
    {
        id: 'applicants',
        title: '👔 Hiring Staff',
        text: 'When applicants appear in the lobby, tap them to see their info. Each has a "dream floor" - place them there for 2x restock speed!',
        target: null,
        position: 'center'
    },
    {
        id: 'vips',
        title: '⭐ VIP Visitors',
        text: 'Famous visitors arrive in the lobby too! Tap to pick them up, then tap a floor to drop them off for special bonuses.',
        target: null,
        position: 'center'
    },
    {
        id: 'build',
        title: '🏗️ Build New Floors',
        text: 'Tap the empty slot at the top to add new floors. Each floor type attracts different readers!',
        target: '#tower-canvas',
        position: 'top',
        customTarget: 'buildSlot'
    },
    {
        id: 'readers',
        title: '👥 Readers',
        text: 'Readers visit your floors and check out books. Keep books stocked to maximize earnings!',
        target: null,
        position: 'center'
    },
    {
        id: 'missions',
        title: '📋 Missions',
        text: 'Complete missions to earn bonus stars and Tower Bucks. Watch for the banner at the top!',
        target: null,
        position: 'center'
    },
    {
        id: 'ready',
        title: '🎉 You\'re Ready!',
        text: 'Build floors, hire staff from the lobby, escort VIPs, and grow your library empire!',
        target: null,
        position: 'center'
    }
];

let currentOnboardingStep = 0;
let onboardingActive = false;

function startOnboarding() {
    currentOnboardingStep = 0;
    onboardingActive = true;
    document.getElementById('onboarding-overlay').classList.add('active');
    showOnboardingStep(0);
}

function showOnboardingStep(stepIndex) {
    const step = onboardingSteps[stepIndex];
    if (!step) {
        endOnboarding();
        return;
    }

    const overlay = document.getElementById('onboarding-overlay');
    const spotlight = overlay.querySelector('.onboarding-spotlight');
    const tooltip = overlay.querySelector('.onboarding-tooltip');
    const title = tooltip.querySelector('.onboarding-title');
    const text = tooltip.querySelector('.onboarding-text');
    const indicator = tooltip.querySelector('.onboarding-step-indicator');
    const nextBtn = tooltip.querySelector('.onboarding-next');

    // Update step indicator dots
    indicator.innerHTML = onboardingSteps.map((_, i) => {
        let className = 'step-dot';
        if (i < stepIndex) className += ' completed';
        if (i === stepIndex) className += ' active';
        return `<span class="${className}"></span>`;
    }).join('');

    // Update content
    title.textContent = step.title;
    text.textContent = step.text;

    // Update button text for last step
    nextBtn.textContent = stepIndex === onboardingSteps.length - 1 ? 'Start Playing!' : 'Next';

    // Remove previous arrow classes
    tooltip.classList.remove('arrow-top', 'arrow-bottom', 'arrow-left', 'arrow-right');

    // Position tooltip and spotlight
    if (step.target && step.position !== 'center') {
        const targetEl = document.querySelector(step.target);
        if (targetEl) {
            const rect = targetEl.getBoundingClientRect();

            // Position spotlight
            spotlight.style.display = 'block';
            spotlight.style.left = (rect.left - 8) + 'px';
            spotlight.style.top = (rect.top - 8) + 'px';
            spotlight.style.width = (rect.width + 16) + 'px';
            spotlight.style.height = (rect.height + 16) + 'px';

            // Position tooltip based on position preference
            const tooltipRect = tooltip.getBoundingClientRect();
            let tooltipLeft, tooltipTop;

            switch (step.position) {
                case 'bottom':
                    tooltipLeft = rect.left + rect.width / 2 - 150;
                    tooltipTop = rect.bottom + 20;
                    tooltip.classList.add('arrow-top');
                    break;
                case 'top':
                    tooltipLeft = rect.left + rect.width / 2 - 150;
                    tooltipTop = rect.top - 200;
                    tooltip.classList.add('arrow-bottom');
                    break;
                case 'left':
                    tooltipLeft = rect.left - 320;
                    tooltipTop = rect.top + rect.height / 2 - 80;
                    tooltip.classList.add('arrow-right');
                    break;
                case 'right':
                    tooltipLeft = rect.right + 20;
                    tooltipTop = rect.top + rect.height / 2 - 80;
                    tooltip.classList.add('arrow-left');
                    break;
            }

            // Keep tooltip on screen
            tooltipLeft = Math.max(10, Math.min(tooltipLeft, window.innerWidth - 320));
            tooltipTop = Math.max(10, Math.min(tooltipTop, window.innerHeight - 220));

            tooltip.style.left = tooltipLeft + 'px';
            tooltip.style.top = tooltipTop + 'px';
        } else {
            // Target not found, center it
            centerTooltip(spotlight, tooltip);
        }
    } else {
        // Center position
        centerTooltip(spotlight, tooltip);
    }
}

function centerTooltip(spotlight, tooltip) {
    spotlight.style.display = 'none';
    tooltip.style.left = '50%';
    tooltip.style.top = '50%';
    tooltip.style.transform = 'translate(-50%, -50%)';
}

function nextOnboardingStep() {
    const tooltip = document.querySelector('.onboarding-tooltip');
    tooltip.style.transform = ''; // Reset transform for positioned tooltips

    currentOnboardingStep++;
    if (currentOnboardingStep >= onboardingSteps.length) {
        endOnboarding();
    } else {
        showOnboardingStep(currentOnboardingStep);
    }
}

function skipOnboarding() {
    endOnboarding();
}

function endOnboarding() {
    onboardingActive = false;
    document.getElementById('onboarding-overlay').classList.remove('active');
    localStorage.setItem('simlibrary_onboarding_complete', 'true');

    // Also mark old tutorial as seen for backwards compat
    localStorage.setItem('simlibrary_tutorial_seen', 'true');
}

// ========== STAFF APPLICANT MODAL ==========

/**
 * Show applicant detail modal - REBUILT
 * @param {string|object} applicantOrId - Either applicant ID or applicant object
 */
function showApplicantModal(applicantOrId) {
    // Accept either ID or object
    const applicant = typeof applicantOrId === 'string'
        ? game.lobbyApplicants.find(a => a.id === applicantOrId)
        : applicantOrId;
    if (!applicant) return;

    const applicantId = applicant.id;

    // Create modal content dynamically
    const modal = document.getElementById('confirm-modal');
    const title = document.getElementById('confirm-title');
    const message = document.getElementById('confirm-message');
    const confirmBtn = document.getElementById('confirm-ok');
    const cancelBtn = document.getElementById('confirm-cancel');

    // Show skill stars
    const skillStars = '⭐'.repeat(applicant.skill) + '☆'.repeat(5 - applicant.skill);

    title.textContent = `${applicant.name}`;

    // Different display for utility staff
    if (applicant.isUtilityStaff) {
        const floorTypeName = applicant.utilityFloorType === 'bathroom' ? 'Restroom' : 'Basement';
        message.innerHTML = `
            <div style="text-align: center; margin-bottom: 15px;">
                <div style="font-size: 48px; margin-bottom: 10px;">${applicant.emoji}</div>
                <div style="font-size: 18px; font-weight: bold; color: ${applicant.color};">${applicant.typeName}</div>
            </div>
            <div style="background: #f5f5f5; padding: 12px; border-radius: 8px; margin-bottom: 15px;">
                <div style="margin-bottom: 8px;">
                    <strong>Works in:</strong> <span style="color: #4A0080; font-weight: bold;">${floorTypeName}</span>
                </div>
                <div style="margin-bottom: 8px;">
                    <strong>Effect:</strong> ${applicant.effect}
                </div>
                <div style="margin-bottom: 8px;">
                    <strong>Skill:</strong> ${skillStars}
                </div>
                <div>
                    <strong>Hire Cost:</strong> ${applicant.hireCost} stars
                </div>
            </div>
        `;
    } else {
        message.innerHTML = `
            <div style="text-align: center; margin-bottom: 15px;">
                <div style="font-size: 48px; margin-bottom: 10px;">${applicant.emoji}</div>
                <div style="font-size: 18px; font-weight: bold; color: ${applicant.color};">${applicant.typeName}</div>
            </div>
            <div style="background: #f5f5f5; padding: 12px; border-radius: 8px; margin-bottom: 15px;">
                <div style="margin-bottom: 8px;">
                    <strong>Dream Floor:</strong> <span style="color: #4A0080; font-weight: bold;">${applicant.dreamGenreName}</span>
                </div>
                <div style="margin-bottom: 8px;">
                    <strong>Skill:</strong> ${skillStars}
                </div>
                <div>
                    <strong>Hire Cost:</strong> ${applicant.hireCost} stars
                </div>
            </div>
            <div style="font-size: 12px; color: #666; text-align: center;">
                <em>Place on ${applicant.dreamGenreName} floor for 2x restock speed!</em>
            </div>
        `;
    }

    confirmBtn.textContent = `Hire (${applicant.hireCost} ⭐)`;
    cancelBtn.textContent = 'Dismiss';

    // Store applicant ID for handlers
    modal.dataset.applicantId = applicantId;

    // Set up handlers
    confirmBtn.onclick = () => {
        modal.classList.remove('active');
        showFloorPickerForApplicant(applicantId);
    };

    cancelBtn.onclick = () => {
        haptic('light');
        game.dismissApplicant(applicantId);
        modal.classList.remove('active');
    };

    document.getElementById('close-confirm-modal').onclick = () => {
        modal.classList.remove('active');
    };

    modal.classList.add('active');
}

/**
 * Show VIP info modal - allows user to see VIP details before deciding to escort or dismiss
 */
function showVIPInfoModal(vip) {
    if (!vip) return;

    const modal = document.getElementById('confirm-modal');
    const title = document.getElementById('confirm-title');
    const message = document.getElementById('confirm-message');
    const confirmBtn = document.getElementById('confirm-ok');
    const cancelBtn = document.getElementById('confirm-cancel');

    // Calculate time remaining
    const timeRemaining = Math.max(0, Math.ceil((vip.expiresAt - Date.now()) / 1000));
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Determine target floor info
    let targetFloorText = '';
    if (vip.targetGenres && vip.targetGenres.length > 0) {
        const genreNames = vip.targetGenres.map(g => {
            const floorType = game.floorTypes.find(ft => ft.id === g);
            return floorType ? floorType.name : g;
        }).join(' or ');

        // Check if player has a matching floor
        const hasMatchingFloor = game.floors.some(f =>
            f.status === 'ready' && vip.targetGenres.includes(f.typeId)
        );

        targetFloorText = `
            <div style="margin-bottom: 8px;">
                <strong>Wants to visit:</strong> <span style="color: #4A0080; font-weight: bold;">${genreNames}</span>
            </div>
            <div style="margin-bottom: 8px; color: ${hasMatchingFloor ? 'green' : 'orange'};">
                ${hasMatchingFloor ? '✅ You have this floor!' : '⚠️ You don\'t have this floor yet'}
            </div>
        `;
    } else {
        targetFloorText = `
            <div style="margin-bottom: 8px;">
                <strong>Wants to visit:</strong> <span style="color: #4A0080; font-weight: bold;">Any floor</span>
            </div>
        `;
    }

    title.textContent = `${vip.emoji} ${vip.name}`;
    message.innerHTML = `
        <div style="text-align: center; margin-bottom: 15px;">
            <div style="font-size: 48px; margin-bottom: 10px;">${vip.emoji}</div>
            <div style="font-size: 14px; font-style: italic; color: #666;">"${vip.quote}"</div>
        </div>
        <div style="background: #f5f5f5; padding: 12px; border-radius: 8px; margin-bottom: 15px;">
            ${targetFloorText}
            <div style="margin-bottom: 8px;">
                <strong>Bonus:</strong> ${vip.bonus.description}
            </div>
            <div style="color: #888;">
                ⏱️ Time remaining: ${timeText}
            </div>
        </div>
    `;

    confirmBtn.textContent = 'Escort';
    cancelBtn.textContent = 'Dismiss';

    // Store VIP ID for handlers
    modal.dataset.vipId = vip.id;

    // Set up handlers
    confirmBtn.onclick = () => {
        haptic('medium');
        modal.classList.remove('active');

        // Pick up the VIP
        const result = game.pickUpVIP(vip.id);
        if (result.success) {
            if (window.showVIPEscortUI) {
                window.showVIPEscortUI(result.vip);
            }
        }
    };

    cancelBtn.onclick = () => {
        haptic('light');
        // Dismiss the VIP
        game.arrivingVIPs = game.arrivingVIPs.filter(v => v.id !== vip.id);
        game.save();
        modal.classList.remove('active');
    };

    // Close button - just closes modal without any action
    document.getElementById('close-confirm-modal').onclick = () => {
        modal.classList.remove('active');
    };

    modal.classList.add('active');
}

// Expose showVIPInfoModal globally for tower-renderer
window.showVIPInfoModal = showVIPInfoModal;

/**
 * Show floor picker to assign applicant
 */
function showFloorPickerForApplicant(applicantId) {
    const applicant = game.lobbyApplicants.find(a => a.id === applicantId);
    if (!applicant) return;

    let availableFloors;

    // Handle utility staff differently - they can only go to their designated floor type
    if (applicant.isUtilityStaff) {
        availableFloors = game.floors.filter(f => {
            if (f.status !== 'ready') return false;
            if (f.typeId !== applicant.utilityFloorType) return false;
            // Check if the specific slot for this utility staff is empty
            const slotIndex = applicant.utilitySlotIndex;
            return !f.staff[slotIndex];
        });

        if (availableFloors.length === 0) {
            const floorTypeName = applicant.utilityFloorType === 'bathroom' ? 'Restroom' : 'Basement';
            alert(`No ${floorTypeName} available or the position is already filled!`);
            return;
        }
    } else {
        // Regular staff - get floors that can accept staff (count non-null slots, not array length)
        availableFloors = game.floors.filter(f => {
            if (f.status !== 'ready') return false;
            const floorType = game.floorTypes.find(ft => ft.id === f.typeId);
            if (floorType?.staffSlots) return false; // Skip utility rooms
            const filledSlots = f.staff.filter(s => s !== null && s !== undefined).length;
            return filledSlots < 3;
        });

        if (availableFloors.length === 0) {
            alert('No floors available to hire staff! Build more floors or make room on existing ones.');
            return;
        }
    }

    // Use build modal for floor selection
    const container = document.getElementById('floor-types-list');
    container.innerHTML = '<h4 style="text-align: center; margin-bottom: 15px;">Choose a floor for ' + applicant.name + '</h4>';

    availableFloors.forEach(floor => {
        const floorType = game.floorTypes.find(ft => ft.id === floor.typeId);
        const isDreamMatch = !applicant.isUtilityStaff && floor.typeId === applicant.dreamGenre;
        const staffCount = floor.staff.filter(s => s !== null && s !== undefined).length;

        const card = document.createElement('div');
        card.className = `floor-type-card ${floorType.color} ${isDreamMatch ? 'dream-match' : ''}`;
        card.style.cursor = 'pointer';

        if (applicant.isUtilityStaff) {
            card.innerHTML = `
                <div class="floor-type-icon">${floorType.emoji}</div>
                <div class="floor-type-info">
                    <h5>${floorType.name}</h5>
                    <p>Position: ${applicant.typeName}</p>
                    <p style="color: #666;">${applicant.effect}</p>
                </div>
            `;
        } else {
            card.innerHTML = `
                <div class="floor-type-icon">${floorType.emoji}</div>
                <div class="floor-type-info">
                    <h5>${floorType.name} ${isDreamMatch ? '💫 DREAM JOB!' : ''}</h5>
                    <p>Staff: ${staffCount}/3</p>
                    ${isDreamMatch ? '<p style="color: green; font-weight: bold;">2x Speed Bonus!</p>' : ''}
                </div>
            `;
        }

        card.addEventListener('click', () => {
            haptic('medium');
            handleHireApplicant(applicantId, floor.id);
            closeBuildModal();
        });

        container.appendChild(card);
    });

    document.getElementById('build-modal').classList.add('active');
}

/**
 * Handle hiring an applicant to a floor
 */
function handleHireApplicant(applicantId, floorId) {
    const result = game.hireApplicant(applicantId, floorId);

    if (result.success) {
        haptic('success');
        SoundManager.purchase();

        if (result.staff.isUtilityStaff) {
            // Utility staff hired
            alert(`${result.staff.name} has been hired as ${result.staff.typeName}!`);
        } else if (result.isDreamMatch) {
            alert(`🎉 Perfect match! ${result.staff.name} is thrilled to work on their dream floor! 2x speed bonus activated!`);
        } else {
            alert(`${result.staff.name} has been hired! They unlock book category ${result.categoryUnlocked + 1}.`);
        }

        updateGlobalStats();
    } else {
        haptic('error');
        SoundManager.error();
        alert(result.error || 'Cannot hire staff');
    }
}

// ========== VIP ESCORT UI ==========

let vipEscortBanner = null;

/**
 * Show VIP escort UI
 */
function showVIPEscortUI(vip) {
    // Create or show escort banner
    if (!vipEscortBanner) {
        vipEscortBanner = document.createElement('div');
        vipEscortBanner.id = 'vip-escort-banner';
        vipEscortBanner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #FFD700, #FFA500);
            color: #333;
            padding: 15px;
            padding-top: 55px;
            text-align: center;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            font-weight: bold;
        `;
        document.body.appendChild(vipEscortBanner);
    }

    // Get floor NAME instead of emoji
    const targetText = vip.targetGenres
        ? `Take them to: ${vip.targetGenres.map(g => game.floorTypes.find(ft => ft.id === g)?.name || 'Unknown').join(' or ')}`
        : 'Drop them at any floor!';

    vipEscortBanner.innerHTML = `
        <div style="font-size: 20px; margin-bottom: 5px;">Escorting: ${vip.name}</div>
        <div style="font-size: 16px; font-weight: bold; color: #4A0080;">${targetText}</div>
        <div style="font-size: 12px; margin-top: 5px;">Tap a floor to drop them off!</div>
        <button id="cancel-escort-btn" style="margin-top: 10px; padding: 8px 16px; border: none; border-radius: 5px; background: #fff; cursor: pointer;">Cancel</button>
    `;

    vipEscortBanner.style.display = 'block';

    document.getElementById('cancel-escort-btn').onclick = () => {
        game.cancelElevatorRide();
        hideVIPEscortUI();
        if (towerRenderer) towerRenderer.isVIPEscortMode = false;
    };
}

/**
 * Hide VIP escort UI
 */
function hideVIPEscortUI() {
    if (vipEscortBanner) {
        vipEscortBanner.style.display = 'none';
    }
}

// Set up onboarding event listeners
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('onboarding-overlay');
    if (overlay) {
        overlay.querySelector('.onboarding-next').addEventListener('click', nextOnboardingStep);
        overlay.querySelector('.onboarding-skip').addEventListener('click', skipOnboarding);
    }
});

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
