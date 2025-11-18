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
        this.maxFloors = 25; // Enough for all floor types plus extras
        this.nextFloorSlot = 1; // Next available slot to build

        // Characters
        this.readers = []; // Active readers visiting

        // Reader name pools
        this.readerNames = {
            first: ['Alex', 'Jamie', 'Sam', 'Taylor', 'Morgan', 'Casey', 'Jordan', 'Riley', 'Avery', 'Quinn',
                    'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason', 'Isabella', 'Lucas',
                    'Mia', 'Oliver', 'Charlotte', 'Elijah', 'Amelia', 'James', 'Harper', 'Benjamin', 'Evelyn', 'William'],
            last: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
                   'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin']
        };

        // Reader personality types
        this.readerTypes = [
            { id: 'kid', emoji: '👧', name: 'Kid', weight: 25 },
            { id: 'teen', emoji: '🧑', name: 'Teen', weight: 20 },
            { id: 'adult', emoji: '👔', name: 'Adult', weight: 30 },
            { id: 'senior', emoji: '👴', name: 'Senior', weight: 15 },
            { id: 'student', emoji: '🎓', name: 'Student', weight: 10 }
        ];

        // VIP reader types (rare, special abilities)
        this.vipTypes = [
            {
                id: 'speed_reader',
                name: 'Speed Reader',
                emoji: '⚡',
                ability: 'instant_checkout',
                description: 'Checks out instantly!',
                spawnChance: 0.05 // 5% of VIP spawns
            },
            {
                id: 'big_spender',
                name: 'Big Spender',
                emoji: '💰',
                ability: 'double_stars',
                description: 'Pays 2x stars!',
                spawnChance: 0.06
            },
            {
                id: 'book_deliverer',
                name: 'Book Deliverer',
                emoji: '📦',
                ability: 'instant_restock',
                description: 'Restocks a random category!',
                spawnChance: 0.04
            },
            {
                id: 'celebrity',
                name: 'Celebrity Reader',
                emoji: '🌟',
                ability: 'attract_readers',
                description: 'Attracts 3 more readers!',
                spawnChance: 0.03
            },
            {
                id: 'tower_buck_tipper',
                name: 'Generous Patron',
                emoji: '💎',
                ability: 'tower_bucks',
                description: 'Tips 1 Tower Buck!',
                spawnChance: 0.02
            }
        ];

        // Missions/requests
        this.currentMission = null;
        this.missionHistory = []; // Completed missions
        this.nextMissionTime = Date.now() + 60000; // First mission in 60s

        // Stats tracking (all-time)
        this.stats = {
            totalBooksCheckedOut: 0,
            totalStarsEarned: 0,
            totalReadersServed: 0,
            totalVIPsServed: 0,
            totalMissionsCompleted: 0,
            totalTowerBucksEarned: 0,
            totalFloorsBuilt: 0,
            totalStaffHired: 0,
            timePlayed: 0, // in seconds
            gameStartTime: Date.now()
        };

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

        // Floor type catalog - ALL 20 LIBRARY FLOOR TYPES!
        this.floorTypes = [
            // Children's Section
            {
                id: 'board_books',
                name: 'Board Books',
                emoji: '👶',
                color: 'peach',
                description: 'Books for the tiniest readers',
                buildCost: 100,
                buildTime: 30,
                bookCategories: [
                    { name: 'Oversize', stockCost: 10, stockTime: 15, stockAmount: 100, earningRate: 2 },
                    { name: 'Chubby', stockCost: 15, stockTime: 20, stockAmount: 100, earningRate: 3 },
                    { name: 'Moveable Parts', stockCost: 25, stockTime: 30, stockAmount: 100, earningRate: 5 }
                ]
            },
            {
                id: 'picture_books',
                name: 'Picture Books',
                emoji: '📖',
                color: 'peach',
                description: 'Colorful stories for young minds',
                buildCost: 150,
                buildTime: 35,
                bookCategories: [
                    { name: 'Animals', stockCost: 12, stockTime: 18, stockAmount: 100, earningRate: 3 },
                    { name: 'Cars', stockCost: 18, stockTime: 25, stockAmount: 100, earningRate: 4 },
                    { name: 'Planets', stockCost: 30, stockTime: 40, stockAmount: 100, earningRate: 6 }
                ]
            },
            {
                id: 'early_readers',
                name: 'Early Readers',
                emoji: '📚',
                color: 'mint',
                description: 'Building reading skills step by step',
                buildCost: 200,
                buildTime: 40,
                bookCategories: [
                    { name: 'Level 1', stockCost: 15, stockTime: 20, stockAmount: 100, earningRate: 3 },
                    { name: 'Level 2', stockCost: 22, stockTime: 30, stockAmount: 100, earningRate: 5 },
                    { name: 'Level 3', stockCost: 35, stockTime: 45, stockAmount: 100, earningRate: 7 }
                ]
            },
            {
                id: 'juvenile_series',
                name: 'Juvenile Series',
                emoji: '⚔️',
                color: 'sky',
                description: 'Popular series for young readers',
                buildCost: 250,
                buildTime: 50,
                bookCategories: [
                    { name: 'Warriors', stockCost: 20, stockTime: 25, stockAmount: 100, earningRate: 4 },
                    { name: 'Superheroes', stockCost: 28, stockTime: 35, stockAmount: 100, earningRate: 6 },
                    { name: 'Baby-Sitters', stockCost: 40, stockTime: 50, stockAmount: 100, earningRate: 8 }
                ]
            },
            {
                id: 'teen',
                name: 'Teen',
                emoji: '🎓',
                color: 'lavender',
                description: 'Stories for young adults',
                buildCost: 300,
                buildTime: 60,
                bookCategories: [
                    { name: 'Romance', stockCost: 25, stockTime: 30, stockAmount: 100, earningRate: 5 },
                    { name: 'Sports', stockCost: 32, stockTime: 40, stockAmount: 100, earningRate: 6 },
                    { name: 'Dystopian', stockCost: 45, stockTime: 55, stockAmount: 100, earningRate: 9 }
                ]
            },

            // Fiction Section
            {
                id: 'fiction',
                name: 'Fiction',
                emoji: '📕',
                color: 'peach',
                description: 'Timeless stories and modern tales',
                buildCost: 350,
                buildTime: 70,
                bookCategories: [
                    { name: 'Classic', stockCost: 30, stockTime: 35, stockAmount: 100, earningRate: 6 },
                    { name: 'Contemporary', stockCost: 40, stockTime: 45, stockAmount: 100, earningRate: 8 },
                    { name: 'Literary', stockCost: 55, stockTime: 60, stockAmount: 100, earningRate: 11 }
                ]
            },
            {
                id: 'mystery',
                name: 'Mystery',
                emoji: '🔍',
                color: 'lavender',
                description: 'Suspenseful stories and whodunits',
                buildCost: 400,
                buildTime: 80,
                bookCategories: [
                    { name: 'Suspense', stockCost: 32, stockTime: 40, stockAmount: 100, earningRate: 6 },
                    { name: 'Thriller', stockCost: 45, stockTime: 50, stockAmount: 100, earningRate: 9 },
                    { name: 'Detective', stockCost: 60, stockTime: 65, stockAmount: 100, earningRate: 12 }
                ]
            },
            {
                id: 'romance',
                name: 'Romance',
                emoji: '💕',
                color: 'pink',
                description: 'Love stories for every taste',
                buildCost: 450,
                buildTime: 90,
                bookCategories: [
                    { name: 'Historical', stockCost: 35, stockTime: 42, stockAmount: 100, earningRate: 7 },
                    { name: 'Fantasy', stockCost: 48, stockTime: 55, stockAmount: 100, earningRate: 10 },
                    { name: 'Bodice Ripper', stockCost: 65, stockTime: 70, stockAmount: 100, earningRate: 13 }
                ]
            },
            {
                id: 'scifi',
                name: 'Science Fiction',
                emoji: '🚀',
                color: 'sky',
                description: 'Explore the future and beyond',
                buildCost: 500,
                buildTime: 100,
                bookCategories: [
                    { name: 'Planetary', stockCost: 38, stockTime: 45, stockAmount: 100, earningRate: 8 },
                    { name: 'Robotic', stockCost: 50, stockTime: 58, stockAmount: 100, earningRate: 10 },
                    { name: 'Alternate Universe', stockCost: 70, stockTime: 75, stockAmount: 100, earningRate: 14 }
                ]
            },
            {
                id: 'fantasy',
                name: 'Fantasy',
                emoji: '🐉',
                color: 'purple',
                description: 'Magical worlds await',
                buildCost: 550,
                buildTime: 110,
                bookCategories: [
                    { name: 'Dragons', stockCost: 40, stockTime: 48, stockAmount: 100, earningRate: 8 },
                    { name: 'Witches', stockCost: 52, stockTime: 60, stockAmount: 100, earningRate: 11 },
                    { name: 'Monsters', stockCost: 72, stockTime: 78, stockAmount: 100, earningRate: 15 }
                ]
            },
            {
                id: 'true_crime',
                name: 'True Crime',
                emoji: '🚨',
                color: 'red',
                description: 'Real stories, dark deeds',
                buildCost: 600,
                buildTime: 120,
                bookCategories: [
                    { name: 'Families', stockCost: 42, stockTime: 50, stockAmount: 100, earningRate: 9 },
                    { name: 'Business', stockCost: 55, stockTime: 62, stockAmount: 100, earningRate: 11 },
                    { name: 'The Mob', stockCost: 75, stockTime: 80, stockAmount: 100, earningRate: 15 }
                ]
            },
            {
                id: 'graphic_novels',
                name: 'Graphic Novels',
                emoji: '💥',
                color: 'orange',
                description: 'Visual storytelling at its best',
                buildCost: 650,
                buildTime: 130,
                bookCategories: [
                    { name: 'Manga', stockCost: 45, stockTime: 52, stockAmount: 100, earningRate: 9 },
                    { name: 'Anime', stockCost: 58, stockTime: 65, stockAmount: 100, earningRate: 12 },
                    { name: 'Superheroes', stockCost: 78, stockTime: 85, stockAmount: 100, earningRate: 16 }
                ]
            },

            // Non-Fiction Section
            {
                id: 'biography',
                name: 'Biography',
                emoji: '👤',
                color: 'mint',
                description: 'Lives worth reading about',
                buildCost: 700,
                buildTime: 140,
                bookCategories: [
                    { name: 'Historical Figures', stockCost: 48, stockTime: 55, stockAmount: 100, earningRate: 10 },
                    { name: 'Sports Figures', stockCost: 60, stockTime: 68, stockAmount: 100, earningRate: 12 },
                    { name: 'Pop Culture', stockCost: 80, stockTime: 88, stockAmount: 100, earningRate: 16 }
                ]
            },
            {
                id: 'history',
                name: 'History',
                emoji: '📜',
                color: 'brown',
                description: 'Stories from the past',
                buildCost: 750,
                buildTime: 150,
                bookCategories: [
                    { name: 'Battles', stockCost: 50, stockTime: 58, stockAmount: 100, earningRate: 10 },
                    { name: 'Explorers', stockCost: 62, stockTime: 70, stockAmount: 100, earningRate: 13 },
                    { name: 'Medieval', stockCost: 82, stockTime: 90, stockAmount: 100, earningRate: 17 }
                ]
            },
            {
                id: 'local_history',
                name: 'Local History',
                emoji: '🏛️',
                color: 'tan',
                description: 'Your community\'s stories',
                buildCost: 800,
                buildTime: 160,
                bookCategories: [
                    { name: 'Cemeteries', stockCost: 52, stockTime: 60, stockAmount: 100, earningRate: 11 },
                    { name: 'Founders', stockCost: 65, stockTime: 72, stockAmount: 100, earningRate: 13 },
                    { name: 'Sports', stockCost: 85, stockTime: 92, stockAmount: 100, earningRate: 17 }
                ]
            },
            {
                id: 'science',
                name: 'Science',
                emoji: '🔬',
                color: 'green',
                description: 'Discover how the world works',
                buildCost: 850,
                buildTime: 170,
                bookCategories: [
                    { name: 'Biology', stockCost: 55, stockTime: 62, stockAmount: 100, earningRate: 11 },
                    { name: 'Chemistry', stockCost: 68, stockTime: 75, stockAmount: 100, earningRate: 14 },
                    { name: 'Astronomy', stockCost: 88, stockTime: 95, stockAmount: 100, earningRate: 18 }
                ]
            },
            {
                id: 'technology',
                name: 'Technology',
                emoji: '💻',
                color: 'blue',
                description: 'Innovation and invention',
                buildCost: 900,
                buildTime: 180,
                bookCategories: [
                    { name: 'Programming', stockCost: 58, stockTime: 65, stockAmount: 100, earningRate: 12 },
                    { name: 'Inventions', stockCost: 70, stockTime: 78, stockAmount: 100, earningRate: 14 },
                    { name: 'Discoveries', stockCost: 90, stockTime: 98, stockAmount: 100, earningRate: 18 }
                ]
            },
            {
                id: 'sports',
                name: 'Sports',
                emoji: '⚽',
                color: 'yellow',
                description: 'Athletic achievements and stats',
                buildCost: 950,
                buildTime: 190,
                bookCategories: [
                    { name: 'Baseball', stockCost: 60, stockTime: 68, stockAmount: 100, earningRate: 12 },
                    { name: 'Football', stockCost: 72, stockTime: 80, stockAmount: 100, earningRate: 15 },
                    { name: 'Soccer', stockCost: 92, stockTime: 100, stockAmount: 100, earningRate: 19 }
                ]
            },
            {
                id: 'cookbooks',
                name: 'Cookbooks',
                emoji: '🍳',
                color: 'orange',
                description: 'Delicious recipes from around the world',
                buildCost: 1000,
                buildTime: 200,
                bookCategories: [
                    { name: 'International', stockCost: 62, stockTime: 70, stockAmount: 100, earningRate: 13 },
                    { name: 'Home Cooking', stockCost: 75, stockTime: 82, stockAmount: 100, earningRate: 15 },
                    { name: 'Haute Cuisine', stockCost: 95, stockTime: 102, stockAmount: 100, earningRate: 19 }
                ]
            },
            {
                id: 'library_of_things',
                name: 'Library of Things',
                emoji: '🎮',
                color: 'rainbow',
                description: 'More than just books!',
                buildCost: 1200,
                buildTime: 220,
                bookCategories: [
                    { name: 'Board Games', stockCost: 70, stockTime: 75, stockAmount: 100, earningRate: 14 },
                    { name: 'Yard Games', stockCost: 85, stockTime: 88, stockAmount: 100, earningRate: 17 },
                    { name: 'DVDs', stockCost: 100, stockTime: 110, stockAmount: 100, earningRate: 20 }
                ]
            },

            // === CAFE & FOOD SERVICE ===
            {
                id: 'coffee_shop',
                name: 'Coffee Shop',
                emoji: '☕',
                color: 'brown',
                description: 'Fuel for readers and researchers',
                buildCost: 250,
                buildTime: 45,
                bookCategories: [
                    { name: 'Drip Coffee', stockCost: 18, stockTime: 22, stockAmount: 100, earningRate: 4 },
                    { name: 'Espresso Drinks', stockCost: 28, stockTime: 35, stockAmount: 100, earningRate: 6 },
                    { name: 'Cold Brew', stockCost: 40, stockTime: 50, stockAmount: 100, earningRate: 8 }
                ]
            },
            {
                id: 'bakery',
                name: 'Bakery Corner',
                emoji: '🥐',
                color: 'peach',
                description: 'Fresh pastries and treats',
                buildCost: 300,
                buildTime: 50,
                bookCategories: [
                    { name: 'Danish Pastries', stockCost: 20, stockTime: 25, stockAmount: 100, earningRate: 4 },
                    { name: 'Muffins & Scones', stockCost: 32, stockTime: 38, stockAmount: 100, earningRate: 6 },
                    { name: 'Specialty Cakes', stockCost: 48, stockTime: 55, stockAmount: 100, earningRate: 9 }
                ]
            },
            {
                id: 'hot_drinks_cafe',
                name: 'Hot Drinks Café',
                emoji: '🍫',
                color: 'brown',
                description: 'Cozy drinks for cozy reading',
                buildCost: 280,
                buildTime: 48,
                bookCategories: [
                    { name: 'Hot Chocolate', stockCost: 22, stockTime: 28, stockAmount: 100, earningRate: 5 },
                    { name: 'Tea Selection', stockCost: 16, stockTime: 20, stockAmount: 100, earningRate: 3 },
                    { name: 'Specialty Lattes', stockCost: 35, stockTime: 42, stockAmount: 100, earningRate: 7 }
                ]
            },
            {
                id: 'snack_bar',
                name: 'Snack Bar',
                emoji: '🍿',
                color: 'mint',
                description: 'Quick bites for busy patrons',
                buildCost: 220,
                buildTime: 40,
                bookCategories: [
                    { name: 'Popcorn & Chips', stockCost: 12, stockTime: 15, stockAmount: 100, earningRate: 3 },
                    { name: 'Cookies & Bars', stockCost: 25, stockTime: 30, stockAmount: 100, earningRate: 5 },
                    { name: 'Fruit & Yogurt', stockCost: 38, stockTime: 45, stockAmount: 100, earningRate: 8 }
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

        // Update stats
        this.stats.totalFloorsBuilt += 1;

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

        // Update stats
        this.stats.totalStaffHired += 1;

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

        // Generate random name
        const firstName = this.readerNames.first[Math.floor(Math.random() * this.readerNames.first.length)];
        const lastName = this.readerNames.last[Math.floor(Math.random() * this.readerNames.last.length)];
        const fullName = `${firstName} ${lastName}`;

        // Determine if VIP (10% chance)
        const isVIP = Math.random() < 0.10;
        let readerType, vipType = null;

        if (isVIP) {
            // Pick random VIP type (weighted)
            const rand = Math.random();
            let cumulative = 0;
            for (const vip of this.vipTypes) {
                cumulative += vip.spawnChance;
                if (rand <= cumulative) {
                    vipType = vip;
                    break;
                }
            }
            // Fallback to first VIP if none selected
            if (!vipType) vipType = this.vipTypes[0];
        } else {
            // Pick regular reader type (weighted)
            const totalWeight = this.readerTypes.reduce((sum, type) => sum + type.weight, 0);
            const rand = Math.random() * totalWeight;
            let cumulative = 0;
            for (const type of this.readerTypes) {
                cumulative += type.weight;
                if (rand <= cumulative) {
                    readerType = type;
                    break;
                }
            }
            // Fallback to first type if none selected
            if (!readerType) readerType = this.readerTypes[0];
        }

        // Calculate checkout time and earnings based on VIP ability
        let checkoutTime = Date.now() + 3000; // Default 3 seconds
        let earningAmount = cat.earningRate;

        if (vipType) {
            switch (vipType.ability) {
                case 'instant_checkout':
                    checkoutTime = Date.now() + 100; // Almost instant
                    break;
                case 'double_stars':
                    earningAmount *= 2;
                    break;
                // Other abilities handled when reader checks out
            }
        }

        // Create reader
        const reader = {
            id: this.generateId(),
            floorId: floor.id,
            floorNumber: floor.floorNumber, // For elevator to know which floor to go to
            categoryIndex: idx,
            name: fullName,
            emoji: isVIP ? vipType.emoji : readerType.emoji,
            type: isVIP ? 'vip' : readerType.id,
            vipType: vipType ? vipType.id : null,
            vipAbility: vipType ? vipType.ability : null,
            checkoutTime: checkoutTime,
            earningAmount: earningAmount,
            elevatorState: 'waiting', // waiting, riding, arrived
            elevatorArrivalTime: Date.now() + 2000 + (floor.floorNumber * 500) // 2s + 0.5s per floor
        };

        this.readers.push(reader);
        return reader;
    }

    /**
     * Generate a new random mission
     */
    generateMission() {
        const readyFloors = this.floors.filter(f => f.status === 'ready');
        if (readyFloors.length === 0) {
            // No ready floors, try again later
            this.nextMissionTime = Date.now() + 60000;
            return;
        }

        // Pick a random floor
        const floor = readyFloors[Math.floor(Math.random() * readyFloors.length)];

        // Pick a random unlocked category
        const unlockedCategories = floor.bookStock
            .map((cat, idx) => ({ cat, idx }))
            .filter((_, idx) => floor.staff.length > idx);

        if (unlockedCategories.length === 0) {
            // No unlocked categories, try again later
            this.nextMissionTime = Date.now() + 60000;
            return;
        }

        const { cat, idx } = unlockedCategories[Math.floor(Math.random() * unlockedCategories.length)];

        // Generate mission details
        const requestCount = Math.ceil(Math.random() * 3) + 1; // 2-4 books
        const timeLimit = 60 + Math.floor(Math.random() * 60); // 60-120 seconds
        const reward = Math.ceil(requestCount * cat.earningRate * 2); // 2x normal earnings

        this.currentMission = {
            id: this.generateId(),
            floorId: floor.id,
            floorName: floor.name,
            categoryIndex: idx,
            categoryName: cat.name,
            requesterName: this.readerNames.first[Math.floor(Math.random() * this.readerNames.first.length)],
            requestCount: requestCount,
            progress: 0,
            timeLimit: timeLimit,
            reward: reward,
            rewardBucks: Math.random() < 0.3 ? 1 : 0, // 30% chance for Tower Buck bonus
            status: 'active', // active, completed, expired
            startTime: Date.now(),
            expiryTime: Date.now() + (timeLimit * 1000)
        };
    }

    /**
     * Check if a reader checkout contributes to current mission
     */
    checkMissionProgress(reader) {
        if (!this.currentMission || this.currentMission.status !== 'active') return;

        // Check if this reader matches the mission criteria
        if (reader.floorId === this.currentMission.floorId &&
            reader.categoryIndex === this.currentMission.categoryIndex) {

            this.currentMission.progress += 1;

            // Check if mission is complete
            if (this.currentMission.progress >= this.currentMission.requestCount) {
                this.completeMission();
            }
        }
    }

    /**
     * Complete current mission and award rewards
     */
    completeMission() {
        if (!this.currentMission) return;

        this.currentMission.status = 'completed';

        // Award stars
        this.stars += this.currentMission.reward;
        this.stats.totalStarsEarned += this.currentMission.reward;

        // Award Tower Bucks if applicable
        if (this.currentMission.rewardBucks > 0) {
            this.towerBucks += this.currentMission.rewardBucks;
            this.stats.totalTowerBucksEarned += this.currentMission.rewardBucks;
        }

        // Update stats
        this.stats.totalMissionsCompleted += 1;

        // Store in history
        this.missionHistory.push({
            ...this.currentMission,
            completedAt: Date.now()
        });

        // Keep only last 10 missions in history
        if (this.missionHistory.length > 10) {
            this.missionHistory = this.missionHistory.slice(-10);
        }

        // Clear current mission
        this.currentMission = null;

        // Next mission in 2-5 minutes
        this.nextMissionTime = Date.now() + (120000 + Math.random() * 180000);
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

        // Update elevator states
        this.readers.forEach(reader => {
            if (reader.elevatorState === 'waiting' && now >= reader.elevatorArrivalTime) {
                reader.elevatorState = 'arrived';
            }
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

                    // Update stats
                    this.stats.totalBooksCheckedOut += 1;
                    this.stats.totalStarsEarned += reader.earningAmount;
                    this.stats.totalReadersServed += 1;

                    // Handle VIP abilities
                    if (reader.type === 'vip') {
                        this.stats.totalVIPsServed += 1;

                        switch (reader.vipAbility) {
                            case 'instant_restock':
                                // Restock a random category on this floor
                                const emptyCategories = floor.bookStock
                                    .map((cat, idx) => ({ cat, idx }))
                                    .filter(({ cat }) => cat.currentStock < cat.maxStock && !cat.restocking);
                                if (emptyCategories.length > 0) {
                                    const { idx } = emptyCategories[Math.floor(Math.random() * emptyCategories.length)];
                                    floor.bookStock[idx].currentStock = floor.bookStock[idx].maxStock;
                                }
                                break;

                            case 'attract_readers':
                                // Spawn 3 more readers immediately
                                for (let i = 0; i < 3; i++) {
                                    this.spawnReader();
                                }
                                break;

                            case 'tower_bucks':
                                // Tip 1 Tower Buck
                                this.towerBucks += 1;
                                this.stats.totalTowerBucksEarned += 1;
                                break;
                        }
                    }

                    // Check if this completes current mission
                    if (this.currentMission && this.currentMission.status === 'active') {
                        this.checkMissionProgress(reader);
                    }
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

        // Spawn new readers periodically (20% chance each tick = more active gameplay)
        if (Math.random() < 0.20) {
            this.spawnReader();
        }

        // Generate new mission if it's time and no active mission
        if (!this.currentMission && now >= this.nextMissionTime) {
            this.generateMission();
        }

        // Check mission expiry
        if (this.currentMission && this.currentMission.status === 'active' && now >= this.currentMission.expiryTime) {
            this.currentMission.status = 'expired';
            this.currentMission = null;
            // Next mission in 2-5 minutes
            this.nextMissionTime = now + (120000 + Math.random() * 180000);
        }

        // Update time played stat (every tick = 1 second)
        this.stats.timePlayed += 1;

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
            currentMission: this.currentMission,
            missionHistory: this.missionHistory,
            nextMissionTime: this.nextMissionTime,
            stats: this.stats,
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
                this.currentMission = data.currentMission || null;
                this.missionHistory = data.missionHistory || [];
                this.nextMissionTime = data.nextMissionTime || (Date.now() + 60000);

                // Load stats with defaults for new stat types
                if (data.stats) {
                    this.stats = {
                        totalBooksCheckedOut: data.stats.totalBooksCheckedOut || 0,
                        totalStarsEarned: data.stats.totalStarsEarned || 0,
                        totalReadersServed: data.stats.totalReadersServed || 0,
                        totalVIPsServed: data.stats.totalVIPsServed || 0,
                        totalMissionsCompleted: data.stats.totalMissionsCompleted || 0,
                        totalTowerBucksEarned: data.stats.totalTowerBucksEarned || 0,
                        totalFloorsBuilt: data.stats.totalFloorsBuilt || 0,
                        totalStaffHired: data.stats.totalStaffHired || 0,
                        timePlayed: data.stats.timePlayed || 0,
                        gameStartTime: data.stats.gameStartTime || Date.now()
                    };
                }

                // Migrate old floors to have staff array if missing
                this.floors.forEach(floor => {
                    if (!floor.staff) {
                        floor.staff = [];
                    }
                });

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
     * Process offline progress (with cap like Tiny Tower!)
     * Max 3 hours of offline earnings to encourage active play
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

        // CAP offline earnings at 3 hours (like Tiny Tower!)
        const MAX_OFFLINE_TIME = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
        const cappedOfflineTime = Math.min(offlineTime, MAX_OFFLINE_TIME);

        // Calculate offline earnings (very conservative)
        // Assume 1 reader every 30 seconds while offline (much slower than active play)
        const offlineSeconds = Math.floor(cappedOfflineTime / 1000);
        const offlineReaderCount = Math.floor(offlineSeconds / 30);

        // Get average earning rate across all stocked categories
        let totalEarningRate = 0;
        let stockedCategoryCount = 0;

        this.floors.forEach(floor => {
            if (floor.status === 'ready') {
                floor.bookStock.forEach(category => {
                    if (category.currentStock > 0) {
                        totalEarningRate += category.earningRate;
                        stockedCategoryCount++;
                    }
                });
            }
        });

        if (stockedCategoryCount > 0) {
            const avgEarningRate = totalEarningRate / stockedCategoryCount;
            const offlineEarnings = Math.floor(offlineReaderCount * avgEarningRate * 0.5); // 50% of active earning rate

            this.stars += offlineEarnings;

            // Show notification on next load if significant time passed
            if (offlineTime > 60000 && offlineEarnings > 0) { // More than 1 minute
                const hours = Math.floor(cappedOfflineTime / 3600000);
                const minutes = Math.floor((cappedOfflineTime % 3600000) / 60000);
                let timeString = '';
                if (hours > 0) timeString += `${hours}h `;
                if (minutes > 0) timeString += `${minutes}m`;

                // Store offline earnings message to show on next UI render
                this._offlineEarningsMessage = {
                    time: timeString,
                    stars: offlineEarnings,
                    capped: offlineTime > MAX_OFFLINE_TIME
                };
            }
        }

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

        // Build starter floor (Board Books - cheapest!)
        this.buildFloor('board_books');
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
