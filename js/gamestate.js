/**
 * SimLibrary - Tiny Tower Style Game State
 * Build floors, stock books, serve readers, earn stars
 */

class GameState {
    constructor() {
        // Player resources
        this.stars = 1000; // Starting currency
        this.towerBucks = 5; // Premium currency (for rushing)
        this.level = 1;
        this.xp = 0;
        this.xpToNextLevel = 100;

        // Floors and construction
        this.floors = [];
        this.maxFloors = 20; // Can expand later
        this.nextFloorSlot = 1; // Next available slot to build

        // Characters
        this.readers = []; // Active readers visiting

        // Missions/orders
        this.currentMission = null;

        // Staff types catalog
        this.staffTypes = [
            {
                id: 'page',
                name: 'Page',
                emoji: '👤',
                color: '#4CAF50',
                hireCost: 50,
                description: 'Entry-level staff, stocks basic books'
            },
            {
                id: 'clerk',
                name: 'Clerk',
                emoji: '👔',
                color: '#2196F3',
                hireCost: 100,
                description: 'Experienced staff, stocks intermediate books'
            },
            {
                id: 'librarian',
                name: 'Librarian',
                emoji: '👓',
                color: '#9C27B0',
                hireCost: 150,
                description: 'Expert staff, stocks advanced books'
            }
        ];

        // Floor type catalog
        this.floorTypes = [
            {
                id: 'picture_books',
                name: 'Picture Book Meadow',
                emoji: '📖',
                color: 'peach',
                description: 'Cozy stories for little readers',
                buildCost: 100,
                buildTime: 30, // seconds
                unlockLevel: 1,
                bookCategories: [
                    { name: 'Board Books', stockCost: 10, stockTime: 15, stockAmount: 100, earningRate: 2 },
                    { name: 'Picture Stories', stockCost: 20, stockTime: 30, stockAmount: 100, earningRate: 4 },
                    { name: 'Early Readers', stockCost: 40, stockTime: 60, stockAmount: 100, earningRate: 8 }
                ]
            },
            {
                id: 'animals_nature',
                name: 'Animals & Nature Wing',
                emoji: '🦋',
                color: 'mint',
                description: 'Discover the natural world',
                buildCost: 200,
                buildTime: 60,
                unlockLevel: 2,
                bookCategories: [
                    { name: 'Animal Tales', stockCost: 15, stockTime: 20, stockAmount: 100, earningRate: 3 },
                    { name: 'Nature Guides', stockCost: 25, stockTime: 40, stockAmount: 100, earningRate: 5 },
                    { name: 'Wildlife Encyclopedia', stockCost: 50, stockTime: 80, stockAmount: 100, earningRate: 10 }
                ]
            },
            {
                id: 'space_science',
                name: 'Space & Science Zone',
                emoji: '🚀',
                color: 'sky',
                description: 'Explore the cosmos and beyond',
                buildCost: 400,
                buildTime: 120,
                unlockLevel: 3,
                bookCategories: [
                    { name: 'Space Adventures', stockCost: 20, stockTime: 25, stockAmount: 100, earningRate: 4 },
                    { name: 'Science Experiments', stockCost: 30, stockTime: 50, stockAmount: 100, earningRate: 6 },
                    { name: 'Astronomy Books', stockCost: 60, stockTime: 100, stockAmount: 100, earningRate: 12 }
                ]
            },
            {
                id: 'mystery',
                name: 'Mystery Corner',
                emoji: '🔍',
                color: 'lavender',
                description: 'Unravel thrilling mysteries',
                buildCost: 800,
                buildTime: 180,
                unlockLevel: 4,
                bookCategories: [
                    { name: 'Easy Mysteries', stockCost: 25, stockTime: 30, stockAmount: 100, earningRate: 5 },
                    { name: 'Detective Stories', stockCost: 40, stockTime: 60, stockAmount: 100, earningRate: 8 },
                    { name: 'Advanced Thrillers', stockCost: 80, stockTime: 120, stockAmount: 100, earningRate: 15 }
                ]
            }
        ];

        this.load();
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get available floor types (all types available, just need stars)
     */
    getAvailableFloorTypes() {
        return this.floorTypes; // All floors unlocked, just need money
    }

    /**
     * Start building a new floor
     */
    buildFloor(floorTypeId) {
        const floorType = this.floorTypes.find(t => t.id === floorTypeId);
        if (!floorType) return { success: false, error: 'Invalid floor type' };

        // Check cost
        if (this.stars < floorType.buildCost) {
            return { success: false, error: 'Not enough stars' };
        }

        // Check if we have space
        if (this.floors.length >= this.maxFloors) {
            return { success: false, error: 'Tower is full' };
        }

        // Deduct cost
        this.stars -= floorType.buildCost;

        // Create new floor
        const newFloor = {
            id: this.generateId(),
            floorNumber: this.nextFloorSlot++,
            typeId: floorTypeId,
            name: floorType.name,
            emoji: floorType.emoji,
            color: floorType.color,
            status: 'building', // building, ready
            buildStartTime: Date.now(),
            buildEndTime: Date.now() + (floorType.buildTime * 1000),
            staff: [], // Hired staff (max 3, unlocks book categories)
            bookStock: floorType.bookCategories.map(cat => ({
                name: cat.name,
                currentStock: 0,
                maxStock: cat.stockAmount,
                stockCost: cat.stockCost,
                stockTime: cat.stockTime,
                earningRate: cat.earningRate,
                restocking: false,
                restockStartTime: null,
                restockEndTime: null
            }))
        };

        this.floors.push(newFloor);
        this.save();
        return { success: true, floor: newFloor };
    }

    /**
     * Rush floor construction with tower bucks
     */
    rushConstruction(floorId) {
        const floor = this.getFloor(floorId);
        if (!floor || floor.status !== 'building') return false;

        if (this.towerBucks < 1) return false;

        this.towerBucks -= 1;
        floor.status = 'ready';
        floor.buildEndTime = Date.now();
        this.save();
        return true;
    }

    /**
     * Hire staff for a floor
     * 1st hire (Page) unlocks category 0
     * 2nd hire (Clerk) unlocks category 1
     * 3rd hire (Librarian) unlocks category 2
     */
    hireStaff(floorId) {
        const floor = this.getFloor(floorId);
        if (!floor || floor.status !== 'ready') {
            return { success: false, error: 'Floor not ready' };
        }

        // Check if floor already has 3 staff
        if (floor.staff.length >= 3) {
            return { success: false, error: 'Floor is fully staffed' };
        }

        // Determine which staff type to hire (in order: Page, Clerk, Librarian)
        const staffType = this.staffTypes[floor.staff.length];

        // Check cost
        if (this.stars < staffType.hireCost) {
            return { success: false, error: 'Not enough stars' };
        }

        // Deduct cost
        this.stars -= staffType.hireCost;

        // Create staff member
        const newStaff = {
            id: this.generateId(),
            typeId: staffType.id,
            name: staffType.name,
            emoji: staffType.emoji,
            color: staffType.color,
            hiredAt: Date.now()
        };

        floor.staff.push(newStaff);
        this.save();

        return { success: true, staff: newStaff, categoryUnlocked: floor.staff.length - 1 };
    }

    /**
     * Start restocking a book category
     * Requires staff to unlock categories:
     * - Category 0: Need 1+ staff (Page)
     * - Category 1: Need 2+ staff (Clerk)
     * - Category 2: Need 3+ staff (Librarian)
     */
    restockBooks(floorId, categoryIndex) {
        const floor = this.getFloor(floorId);
        if (!floor || floor.status !== 'ready') return { success: false, error: 'Floor not ready' };

        const category = floor.bookStock[categoryIndex];
        if (!category) return { success: false, error: 'Invalid category' };

        // Check if category is unlocked by staff
        const requiredStaff = categoryIndex + 1;
        if (floor.staff.length < requiredStaff) {
            const staffTypeName = this.staffTypes[categoryIndex]?.name || 'staff member';
            return { success: false, error: `Hire a ${staffTypeName} to unlock this category` };
        }

        if (category.restocking) return { success: false, error: 'Already restocking' };

        if (category.currentStock >= category.maxStock) {
            return { success: false, error: 'Already full' };
        }

        if (this.stars < category.stockCost) {
            return { success: false, error: 'Not enough stars' };
        }

        // Deduct cost
        this.stars -= category.stockCost;

        // Start restocking
        category.restocking = true;
        category.restockStartTime = Date.now();
        category.restockEndTime = Date.now() + (category.stockTime * 1000);

        this.save();
        return { success: true };
    }

    /**
     * Rush restocking with tower bucks
     */
    rushRestocking(floorId, categoryIndex) {
        const floor = this.getFloor(floorId);
        if (!floor) return false;

        const category = floor.bookStock[categoryIndex];
        if (!category || !category.restocking) return false;

        if (this.towerBucks < 1) return false;

        this.towerBucks -= 1;
        category.currentStock = category.maxStock;
        category.restocking = false;
        category.restockEndTime = Date.now();
        this.save();
        return true;
    }

    /**
     * Get floor by ID
     */
    getFloor(id) {
        return this.floors.find(f => f.id === id);
    }

    /**
     * Spawn a reader to visit a random ready floor
     */
    spawnReader() {
        const readyFloors = this.floors.filter(f => f.status === 'ready');
        if (readyFloors.length === 0) return null;

        // Pick a random floor
        const floor = readyFloors[Math.floor(Math.random() * readyFloors.length)];

        // Pick a category with stock
        const stockedCategories = floor.bookStock
            .map((cat, idx) => ({ cat, idx }))
            .filter(({ cat }) => cat.currentStock > 0);

        if (stockedCategories.length === 0) return null;

        const { cat, idx } = stockedCategories[Math.floor(Math.random() * stockedCategories.length)];

        // Create reader
        const reader = {
            id: this.generateId(),
            floorId: floor.id,
            categoryIndex: idx,
            emoji: ['👤', '👧', '👦', '🧑', '👩', '👨'][Math.floor(Math.random() * 6)],
            checkoutTime: Date.now() + 3000, // 3 seconds to checkout
            earningAmount: cat.earningRate
        };

        this.readers.push(reader);
        return reader;
    }

    /**
     * Game tick - called frequently to update timers, readers, etc.
     */
    tick() {
        const now = Date.now();

        // Check floor construction completion
        this.floors.forEach(floor => {
            if (floor.status === 'building' && now >= floor.buildEndTime) {
                floor.status = 'ready';
            }
        });

        // Check restocking completion
        this.floors.forEach(floor => {
            floor.bookStock.forEach(category => {
                if (category.restocking && now >= category.restockEndTime) {
                    category.currentStock = category.maxStock;
                    category.restocking = false;
                }
            });
        });

        // Process readers checking out
        this.readers = this.readers.filter(reader => {
            if (now >= reader.checkoutTime) {
                const floor = this.getFloor(reader.floorId);
                if (floor && floor.bookStock[reader.categoryIndex]) {
                    // Consume a book
                    floor.bookStock[reader.categoryIndex].currentStock -= 1;

                    // Earn stars
                    this.stars += reader.earningAmount;

                    // Earn XP
                    this.xp += reader.earningAmount;
                }

                // Remove reader (they checked out)
                return false;
            }
            return true;
        });

        // Level up check
        while (this.xp >= this.xpToNextLevel) {
            this.xp -= this.xpToNextLevel;
            this.level += 1;
            this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.5);
            // Award tower bucks on level up
            this.towerBucks += 1;
        }

        // Spawn new readers periodically (25% chance each tick)
        if (Math.random() < 0.25) {
            this.spawnReader();
        }

        this.save();
    }

    /**
     * Get total number of ready floors
     */
    getReadyFloorCount() {
        return this.floors.filter(f => f.status === 'ready').length;
    }

    /**
     * Save to localStorage
     */
    save() {
        const saveData = {
            stars: this.stars,
            towerBucks: this.towerBucks,
            level: this.level,
            xp: this.xp,
            xpToNextLevel: this.xpToNextLevel,
            floors: this.floors,
            nextFloorSlot: this.nextFloorSlot,
            readers: this.readers,
            timestamp: Date.now()
        };
        localStorage.setItem('simlibrary_save_v2', JSON.stringify(saveData));
    }

    /**
     * Load from localStorage
     */
    load() {
        const saved = localStorage.getItem('simlibrary_save_v2');

        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.stars = data.stars || 1000;
                this.towerBucks = data.towerBucks || 5;
                this.level = data.level || 1;
                this.xp = data.xp || 0;
                this.xpToNextLevel = data.xpToNextLevel || 100;
                this.floors = data.floors || [];
                this.nextFloorSlot = data.nextFloorSlot || 1;
                this.readers = data.readers || [];

                // Process any time-based events that happened while offline
                this.processOfflineProgress(data.timestamp);
            } catch (e) {
                console.error('Failed to load save:', e);
                this.initializeNewGame();
            }
        } else {
            this.initializeNewGame();
        }
    }

    /**
     * Process offline progress
     */
    processOfflineProgress(lastSaveTime) {
        if (!lastSaveTime) return;

        const now = Date.now();
        const offlineTime = now - lastSaveTime;

        if (offlineTime < 1000) return; // Less than 1 second offline

        // Complete any constructions that finished while offline
        this.floors.forEach(floor => {
            if (floor.status === 'building' && floor.buildEndTime <= now) {
                floor.status = 'ready';
            }
        });

        // Complete any restocking that finished while offline
        this.floors.forEach(floor => {
            floor.bookStock.forEach(category => {
                if (category.restocking && category.restockEndTime <= now) {
                    category.currentStock = category.maxStock;
                    category.restocking = false;
                }
            });
        });

        // Clear any stale readers
        this.readers = [];

        this.save();
    }

    /**
     * Initialize new game
     */
    initializeNewGame() {
        this.stars = 1000;
        this.towerBucks = 5;
        this.level = 1;
        this.xp = 0;
        this.xpToNextLevel = 100;
        this.floors = [];
        this.nextFloorSlot = 1;
        this.readers = [];

        // Build starter floor
        this.buildFloor('picture_books');
        // Instantly complete it for tutorial
        this.floors[0].status = 'ready';
        this.floors[0].buildEndTime = Date.now();

        this.save();
    }

    /**
     * Reset game (debug)
     */
    reset() {
        localStorage.removeItem('simlibrary_save_v2');
        this.initializeNewGame();
    }
}
