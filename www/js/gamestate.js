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
        this.maxFloors = Infinity; // Unlimited floors!
        this.nextFloorSlot = 1; // Next available slot to build

        // Characters
        this.readers = []; // Active readers visiting
        this.regularCustomers = []; // Returning customers who visit regularly
        this.customerIdCounter = 1;

        // Transit system
        this.transitSchedule = {
            lastRushHour: 0,
            nextRushHour: this.calculateNextRushHour(),
            isRushHour: false,
            rushHourDuration: 3 * 60 * 1000, // 3 minutes
            transitTypes: ['🚇 Subway', '🚌 Bus', '🚊 Tram']
        };

        // Cleaning system
        this.lastCleanedDay = 0; // Track last day cleaning occurred

        // Weather system
        this.weather = {
            current: 'rainy',
            nextChange: Date.now() + (5 * 60 * 1000), // Change every 5 minutes
            types: [
                { id: 'sunny', name: 'Sunny', emoji: '☀️', moodEffect: 10, spawnEffect: 0.7 },
                { id: 'cloudy', name: 'Cloudy', emoji: '☁️', moodEffect: 0, spawnEffect: 1.0 },
                { id: 'rainy', name: 'Rainy', emoji: '🌧️', moodEffect: -5, spawnEffect: 1.3 },
                { id: 'stormy', name: 'Stormy', emoji: '⛈️', moodEffect: -15, spawnEffect: 1.5 },
                { id: 'snowy', name: 'Snowy', emoji: '❄️', moodEffect: 5, spawnEffect: 1.2 }
            ]
        };

        // Seasons and holidays system
        this.seasons = {
            current: this.getCurrentSeason(),
            holidays: [
                { id: 'new_year', name: "New Year's Day", emoji: '🎆', month: 12, day: 29, bonus: 'double_stars', duration: 7,
                  decoration: '🎆' },
                { id: 'valentines', name: "Valentine's Day", emoji: '❤️', month: 2, day: 11, bonus: 'romance_boost', duration: 7,
                  decoration: '❤️' },
                { id: 'spring_break', name: 'Spring Break', emoji: '🌸', month: 3, day: 17, bonus: 'kid_spawn', duration: 10,
                  decoration: '🌸' },
                { id: 'easter', name: 'Easter', emoji: '🐰', month: 3, day: 29, bonus: 'mood_boost', duration: 7,
                  decoration: '🐰' },
                { id: 'summer_reading', name: 'Summer Reading', emoji: '☀️', month: 6, day: 1, bonus: 'spawn_boost', duration: 90,
                  decoration: '☀️' },
                { id: 'back_to_school', name: 'Back to School', emoji: '📚', month: 8, day: 25, bonus: 'student_spawn', duration: 14,
                  decoration: '🎒' },
                { id: 'halloween', name: 'Halloween', emoji: '🎃', month: 10, day: 25, bonus: 'mystery_boost', duration: 7,
                  decoration: '🎃' },
                { id: 'thanksgiving', name: 'Thanksgiving', emoji: '🦃', month: 11, day: 22, bonus: 'star_bonus', duration: 7,
                  decoration: '🦃' },
                { id: 'winter_holiday', name: 'Winter Holidays', emoji: '🎄', month: 12, day: 18, bonus: 'all_boost', duration: 14,
                  decoration: '🎄' }
            ],
            currentHoliday: null
        };

        // Book donation system - random free stock events
        this.nextDonationTime = Date.now() + (2 * 60 * 1000); // First donation after 2 minutes
        this.donationSources = [
            { id: 'estate_sale', name: 'Estate Sale', emoji: '🏠', amount: 3, description: 'Books from an estate sale!' },
            { id: 'library_friend', name: 'Friend of Library', emoji: '❤️', amount: 2, description: 'A kind donation!' },
            { id: 'publisher', name: 'Publisher Gift', emoji: '📦', amount: 4, description: 'Review copies from a publisher!' },
            { id: 'spring_cleaning', name: 'Spring Cleaning', emoji: '🧹', amount: 3, description: 'Donated during spring cleaning!' },
            { id: 'moving_family', name: 'Moving Family', emoji: '🏡', amount: 5, description: 'Family moving donated their books!' },
            { id: 'anonymous', name: 'Anonymous Donor', emoji: '🎁', amount: 2, description: 'A mystery benefactor!' }
        ];

        // Library card system - track regular patrons
        this.libraryCards = []; // List of card holders
        this.maxLibraryCards = 10;
        this.cardBenefits = [
            { visits: 3, bonus: 'fast_checkout', description: '10% faster checkout' },
            { visits: 5, bonus: 'extra_stars', description: '+20% stars' },
            { visits: 10, bonus: 'vip_spawn', description: 'May bring friends' }
        ];

        // Event Hall system
        this.lastEventHallDay = 0; // Track last day an event hall event occurred
        this.currentHallEvent = null; // Current event hall event
        this.hallEventTypes = [
            {
                id: 'book_sale',
                name: 'Book Sale',
                emoji: '📚',
                description: 'Community book sale! +50% stars from all floors.',
                duration: 120000, // 2 minutes
                effect: { type: 'star_bonus', value: 1.5 },
                reward: 100
            },
            {
                id: 'neighborhood_meeting',
                name: 'Neighborhood Meeting',
                emoji: '🏘️',
                description: 'Community gathering! +30 mood boost.',
                duration: 90000, // 1.5 minutes
                effect: { type: 'mood_boost', value: 30 },
                reward: 50
            },
            {
                id: 'story_time',
                name: 'Story Time Program',
                emoji: '📖',
                description: 'Kids program! 2x reader spawn rate.',
                duration: 120000,
                effect: { type: 'spawn_bonus', value: 2 },
                reward: 75
            },
            {
                id: 'author_signing',
                name: 'Author Signing',
                emoji: '✍️',
                description: 'Famous author visit! 2x stars from all floors.',
                duration: 90000,
                effect: { type: 'star_bonus', value: 2 },
                reward: 150
            },
            {
                id: 'movie_night',
                name: 'Movie Night',
                emoji: '🎬',
                description: 'Film screening! Attracts extra readers.',
                duration: 120000,
                effect: { type: 'spawn_bonus', value: 1.5 },
                reward: 60
            },
            {
                id: 'craft_workshop',
                name: 'Craft Workshop',
                emoji: '🎨',
                description: 'Creative fun! +25 mood and bonus stars.',
                duration: 90000,
                effect: { type: 'mood_boost', value: 25 },
                reward: 80
            }
        ];

        // Reader name pools
        this.readerNames = {
            first: ['Alex', 'Jamie', 'Sam', 'Taylor', 'Morgan', 'Casey', 'Jordan', 'Riley', 'Avery', 'Quinn',
                    'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason', 'Isabella', 'Lucas',
                    'Mia', 'Oliver', 'Charlotte', 'Elijah', 'Amelia', 'James', 'Harper', 'Benjamin', 'Evelyn', 'William',
                    'Zoe', 'Henry', 'Luna', 'Jack', 'Lily', 'Owen', 'Ella', 'Leo', 'Chloe', 'Daniel',
                    'Grace', 'Aiden', 'Aria', 'Matthew', 'Scarlett', 'Joseph', 'Victoria', 'David', 'Madison', 'Carter',
                    'Layla', 'Wyatt', 'Penelope', 'John', 'Nora', 'Gabriel', 'Camila', 'Julian', 'Hannah', 'Luke',
                    'Addison', 'Anthony', 'Eleanor', 'Isaac', 'Stella', 'Dylan', 'Violet', 'Levi', 'Aurora', 'Andrew',
                    'Hazel', 'Thomas', 'Audrey', 'Joshua', 'Brooklyn', 'Christopher', 'Bella', 'Jaxon', 'Claire', 'Sebastian',
                    'Skylar', 'Lincoln', 'Lucy', 'Mateo', 'Paisley', 'Ryan', 'Everly', 'Nathan', 'Anna', 'Aaron',
                    'Caroline', 'Isaiah', 'Nova', 'Charles', 'Genesis', 'Caleb', 'Emilia', 'Josiah', 'Kennedy', 'Christian',
                    'Maya', 'Hunter', 'Willow', 'Eli', 'Kinsley', 'Jonathan', 'Naomi', 'Connor', 'Aaliyah', 'Landon'],
            last: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
                   'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
                   'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
                   'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
                   'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
                   'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes',
                   'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper',
                   'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson']
        };

        // Reader personality types with floor preferences
        this.readerTypes = [
            { id: 'kid', emoji: '👧', name: 'Kid', weight: 25,
              preferredFloors: ['board_books', 'picture_books', 'early_readers', 'juvenile_series'] },
            { id: 'teen', emoji: '🧑', name: 'Teen', weight: 20,
              preferredFloors: ['teen', 'scifi', 'fantasy', 'graphic_novels', 'manga'] },
            { id: 'adult', emoji: '👔', name: 'Adult', weight: 30,
              preferredFloors: ['fiction', 'mystery', 'romance', 'biography', 'business'] },
            { id: 'senior', emoji: '👴', name: 'Senior', weight: 15,
              preferredFloors: ['fiction', 'mystery', 'history', 'biography', 'large_print'] },
            { id: 'student', emoji: '🎓', name: 'Student', weight: 10,
              preferredFloors: ['science', 'technology', 'history', 'reference', 'textbooks'] }
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

        // Find missions (Tiny Tower style)
        this.currentFindMission = null;
        this.nextFindMissionTime = Date.now() + 120000; // First find mission in 2 minutes
        this.findMissionItems = [
            { id: 'red_book', emoji: '📕', name: 'Red Book', color: '#FF6B6B' },
            { id: 'blue_book', emoji: '📘', name: 'Blue Book', color: '#4ECDC4' },
            { id: 'green_book', emoji: '📗', name: 'Green Book', color: '#95E1A3' },
            { id: 'coin', emoji: '🪙', name: 'Coin', color: '#FFD700' },
            { id: 'star', emoji: '⭐', name: 'Star', color: '#FFD700' },
            { id: 'heart', emoji: '❤️', name: 'Heart', color: '#FF69B4' },
            { id: 'diamond', emoji: '💎', name: 'Diamond', color: '#00CED1' },
            { id: 'key', emoji: '🔑', name: 'Key', color: '#DAA520' }
        ];

        // Special events
        this.currentEvent = null;
        this.nextEventTime = Date.now() + 300000; // First event in 5 minutes
        this.eventTypes = [
            {
                id: 'author_visit',
                name: 'Author Visit',
                emoji: '✍️',
                description: 'A famous author is visiting! 2x stars from all checkouts.',
                duration: 60000, // 1 minute
                effect: { type: 'star_multiplier', value: 2 }
            },
            {
                id: 'book_sale',
                name: 'Book Sale',
                emoji: '🏷️',
                description: 'Book sale event! Readers come 50% faster.',
                duration: 60000,
                effect: { type: 'spawn_rate', value: 1.5 }
            },
            {
                id: 'reading_challenge',
                name: 'Reading Challenge',
                emoji: '📚',
                description: 'Reading challenge! Earn bonus Tower Bucks.',
                duration: 60000,
                effect: { type: 'bonus_bucks', value: 1 }
            },
            {
                id: 'quiet_hours',
                name: 'Quiet Hours',
                emoji: '🤫',
                description: 'Quiet study time! Readers browse 50% longer.',
                duration: 60000,
                effect: { type: 'browse_time', value: 1.5 }
            }
        ];

        // Special wandering visitors (different from VIP readers)
        this.specialVisitors = [];
        this.nextSpecialVisitorTime = Date.now() + 180000; // First visitor in 3 minutes
        this.specialVisitorTypes = [
            {
                id: 'author',
                name: 'Famous Author',
                emoji: '✍️',
                description: 'Doubles income from all floors!',
                duration: 60000, // 1 minute
                effect: { type: 'income_multiplier', value: 2 },
                thoughts: ['📖 Signing!', '✍️ Write', '📚 Ideas', '🌟 Fans!']
            },
            {
                id: 'inspector',
                name: 'Library Inspector',
                emoji: '🔍',
                description: 'Grants bonus stars for tidy floors!',
                duration: 45000,
                effect: { type: 'inspection_bonus', value: 50 },
                thoughts: ['📋 Check', '✅ Good!', '🔍 Inspect', '⭐ Nice!']
            },
            {
                id: 'cat',
                name: 'Library Cat',
                emoji: '🐱',
                description: 'Boosts happiness! Readers stay longer.',
                duration: 90000, // 1.5 minutes
                effect: { type: 'happiness_boost', value: 1.5 },
                thoughts: ['😺 Meow', '💤 Zzz', '🐟 Fish?', '😸 Purr']
            },
            {
                id: 'booktuber',
                name: 'BookTuber',
                emoji: '📹',
                description: 'Attracts extra readers!',
                duration: 60000,
                effect: { type: 'reader_magnet', value: 2 },
                thoughts: ['📹 Live!', '📚 Review', '👍 Like!', '🌟 Sub!']
            },
            {
                id: 'contractor',
                name: 'Contractor',
                emoji: '🔨',
                description: 'Speeds up all construction!',
                duration: 60000,
                effect: { type: 'build_speed', value: 2 },
                thoughts: ['🔨 Build', '📐 Plan', '🏗️ Work', '💪 Done!']
            }
        ];

        // Mood/happiness meter (0-100)
        this.mood = 50;
        this.moodFactors = {
            readerServed: 2,      // +2 per reader
            missionComplete: 10,  // +10 per mission
            emptyStock: -5,       // -5 per empty floor
            vipServed: 5          // +5 per VIP
        };

        // Floor synergy bonuses
        this.floorSynergies = [
            {
                id: 'study_boost',
                name: 'Study Boost',
                emoji: '📚☕',
                description: '+30% stars from study floors',
                requires: ['reference', 'periodicals'], // Any reference + any periodicals
                effect: { type: 'star_bonus', floors: ['reference', 'periodicals', 'academic_journals', 'newspapers'], value: 1.3 }
            },
            {
                id: 'family_fun',
                name: 'Family Fun',
                emoji: '👨‍👩‍👧‍👦',
                description: '+25% stars from kids floors',
                requires: ['board_books', 'picture_books'],
                effect: { type: 'star_bonus', floors: ['board_books', 'picture_books', 'early_readers', 'chapter_books'], value: 1.25 }
            },
            {
                id: 'teen_hangout',
                name: 'Teen Hangout',
                emoji: '🎮📱',
                description: '+20% more teen visitors',
                requires: ['young_adult', 'graphic_novels'],
                effect: { type: 'spawn_bonus', readerType: 'teen', value: 1.2 }
            },
            {
                id: 'scholar_bonus',
                name: 'Scholar\'s Paradise',
                emoji: '🎓📖',
                description: '+35% stars from academic floors',
                requires: ['academic_journals', 'special_collections'],
                effect: { type: 'star_bonus', floors: ['academic_journals', 'special_collections', 'rare_books'], value: 1.35 }
            },
            {
                id: 'cozy_corner',
                name: 'Cozy Corner',
                emoji: '🛋️📚',
                description: 'Readers stay 20% longer',
                requires: ['fiction', 'mystery'],
                effect: { type: 'browse_time', value: 1.2 }
            },
            {
                id: 'knowledge_hub',
                name: 'Knowledge Hub',
                emoji: '🧠💡',
                description: '+25% stars from non-fiction',
                requires: ['science', 'history'],
                effect: { type: 'star_bonus', floors: ['science', 'history', 'biography', 'travel'], value: 1.25 }
            }
        ];
        this.activeSynergies = []; // Currently active synergies

        // Library Prestige Levels
        this.prestigeLevels = [
            { id: 'community', name: 'Community Library', emoji: '🏠', minFloors: 0, minStarsEarned: 0 },
            { id: 'town', name: 'Town Library', emoji: '🏘️', minFloors: 3, minStarsEarned: 5000 },
            { id: 'city', name: 'City Library', emoji: '🏙️', minFloors: 6, minStarsEarned: 20000 },
            { id: 'regional', name: 'Regional Library', emoji: '🌆', minFloors: 10, minStarsEarned: 50000 },
            { id: 'national', name: 'National Library', emoji: '🏛️', minFloors: 15, minStarsEarned: 150000 },
            { id: 'world', name: 'World Library', emoji: '🌍', minFloors: 20, minStarsEarned: 500000 }
        ];
        this.currentPrestige = 'community';

        // Unlockable decorations
        this.decorations = [
            // Floor decorations (can place 2 per floor)
            { id: 'plant', name: 'Potted Plant', emoji: '🪴', cost: 50, unlockPrestige: 'community', type: 'floor' },
            { id: 'globe', name: 'Globe', emoji: '🌐', cost: 100, unlockPrestige: 'community', type: 'floor' },
            { id: 'clock', name: 'Grandfather Clock', emoji: '🕰️', cost: 200, unlockPrestige: 'town', type: 'floor' },
            { id: 'art', name: 'Famous Painting', emoji: '🖼️', cost: 300, unlockPrestige: 'city', type: 'floor' },
            { id: 'lamp', name: 'Floor Lamp', emoji: '🏮', cost: 75, unlockPrestige: 'community', type: 'floor' },
            { id: 'vase', name: 'Flower Vase', emoji: '🌸', cost: 50, unlockPrestige: 'community', type: 'floor' },
            // Lobby decorations (placed in lobby)
            { id: 'fountain', name: 'Reading Fountain', emoji: '⛲', cost: 500, unlockPrestige: 'city', type: 'lobby' },
            { id: 'statue', name: 'Book Statue', emoji: '🗿', cost: 1000, unlockPrestige: 'city', type: 'lobby' },
            { id: 'chandelier', name: 'Crystal Chandelier', emoji: '💎', cost: 2500, unlockPrestige: 'regional', type: 'lobby' },
            { id: 'garden', name: 'Indoor Garden', emoji: '🌳', cost: 1500, unlockPrestige: 'regional', type: 'lobby' },
            { id: 'aquarium', name: 'Aquarium', emoji: '🐠', cost: 400, unlockPrestige: 'town', type: 'lobby' }
        ];
        this.ownedDecorations = [];

        // Decoration placements
        this.lobbyDecorations = []; // Array of decoration IDs placed in lobby
        this.floorDecorations = {}; // { floorId: [decorId1, decorId2] }

        // Floor themes/skins
        this.floorThemes = [
            { id: 'classic', name: 'Classic', emoji: '📚', cost: 0, unlockPrestige: 'community' },
            { id: 'modern', name: 'Modern', emoji: '🔲', cost: 2000, unlockPrestige: 'town' },
            { id: 'cozy', name: 'Cozy', emoji: '🛋️', cost: 5000, unlockPrestige: 'city' },
            { id: 'elegant', name: 'Elegant', emoji: '✨', cost: 15000, unlockPrestige: 'regional' },
            { id: 'futuristic', name: 'Futuristic', emoji: '🚀', cost: 50000, unlockPrestige: 'national' }
        ];
        this.unlockedThemes = ['classic'];
        this.activeTheme = 'classic';

        // Reader perks (permanent bonuses)
        this.readerPerks = [
            { id: 'kid_magnet', name: 'Kid Magnet', emoji: '🧸', description: '+20% kid visitors', cost: 3000, effect: { type: 'spawn_bonus', readerType: 'kid', value: 1.2 } },
            { id: 'student_discount', name: 'Student Friendly', emoji: '🎒', description: '+20% student visitors', cost: 3000, effect: { type: 'spawn_bonus', readerType: 'student', value: 1.2 } },
            { id: 'senior_comfort', name: 'Senior Comfort', emoji: '🪑', description: '+20% senior visitors', cost: 3000, effect: { type: 'spawn_bonus', readerType: 'senior', value: 1.2 } },
            { id: 'vip_lounge', name: 'VIP Lounge', emoji: '⭐', description: '+50% VIP spawn chance', cost: 10000, effect: { type: 'vip_bonus', value: 1.5 } },
            { id: 'speed_service', name: 'Speed Service', emoji: '⚡', description: '-20% checkout time', cost: 8000, effect: { type: 'checkout_speed', value: 0.8 } },
            { id: 'generous_tips', name: 'Tip Jar', emoji: '💰', description: '+15% star earnings', cost: 15000, effect: { type: 'earning_bonus', value: 1.15 } }
        ];
        this.unlockedPerks = [];

        // Offline earnings bonus (hours beyond the base 3 hours)
        this.offlineTimeBonus = 0; // Additional hours purchased with Tower Bucks

        // Staff upgrades
        this.staffUpgrades = [
            { id: 'training_1', name: 'Basic Training', emoji: '📋', description: 'Staff work 10% faster', cost: 2000, level: 1, effect: { type: 'staff_speed', value: 1.1 } },
            { id: 'training_2', name: 'Advanced Training', emoji: '📊', description: 'Staff work 20% faster', cost: 5000, level: 2, effect: { type: 'staff_speed', value: 1.2 } },
            { id: 'training_3', name: 'Expert Training', emoji: '🏆', description: 'Staff work 30% faster', cost: 15000, level: 3, effect: { type: 'staff_speed', value: 1.3 } },
            { id: 'morale_1', name: 'Break Room', emoji: '☕', description: '+5 mood per checkout', cost: 3000, level: 1, effect: { type: 'mood_bonus', value: 5 } },
            { id: 'morale_2', name: 'Staff Lounge', emoji: '🛋️', description: '+10 mood per checkout', cost: 8000, level: 2, effect: { type: 'mood_bonus', value: 10 } }
        ];
        this.purchasedUpgrades = [];

        // Total stars earned (for prestige tracking)
        this.totalStarsEarned = 0;

        // Cozy micro-events (quick, fun surprises)
        this.cozyEvents = [
            {
                id: 'storytime_rush',
                name: 'Storytime!',
                emoji: '📖👶',
                description: 'Kids flood in for story time!',
                effect: () => {
                    // Spawn 5 kid readers instantly
                    for (let i = 0; i < 5; i++) {
                        this.spawnReader('kid');
                    }
                }
            },
            {
                id: 'book_donation',
                name: 'Book Donation',
                emoji: '📦📚',
                description: 'Someone donated books! +100 stars',
                effect: () => {
                    this.stars += 100;
                    this.stats.totalStarsEarned += 100;
                }
            },
            {
                id: 'lost_and_found',
                name: 'Lost & Found',
                emoji: '🔍💎',
                description: 'Found a Tower Buck in lost & found!',
                effect: () => {
                    this.towerBucks += 1;
                    this.stats.totalTowerBucksEarned += 1;
                }
            },
            {
                id: 'coffee_spill',
                name: 'Coffee Break',
                emoji: '☕😊',
                description: 'Free coffee! Mood boost +15',
                effect: () => {
                    this.mood = Math.min(100, this.mood + 15);
                }
            },
            {
                id: 'school_visit',
                name: 'School Visit',
                emoji: '🏫📚',
                description: 'A class is visiting! Students incoming!',
                effect: () => {
                    for (let i = 0; i < 4; i++) {
                        this.spawnReader('student');
                    }
                }
            },
            {
                id: 'senior_club',
                name: 'Book Club',
                emoji: '👵📖',
                description: 'Senior book club meeting!',
                effect: () => {
                    for (let i = 0; i < 3; i++) {
                        this.spawnReader('senior');
                    }
                }
            }
        ];
        this.nextCozyEventTime = Date.now() + 120000; // First cozy event in 2 minutes

        // Mini-quests (tap to complete)
        this.miniQuestTypes = [
            {
                id: 'lost_teddy',
                name: 'Lost Teddy',
                emoji: '🧸',
                description: 'A child lost their teddy bear!',
                reward: 25,
                rewardBucks: 0
            },
            {
                id: 'shelve_books',
                name: 'Shelve Books',
                emoji: '📚',
                description: 'Help shelve some returned books!',
                reward: 30,
                rewardBucks: 0
            },
            {
                id: 'find_glasses',
                name: 'Lost Glasses',
                emoji: '👓',
                description: 'Someone left their glasses!',
                reward: 20,
                rewardBucks: 0
            },
            {
                id: 'water_plant',
                name: 'Thirsty Plant',
                emoji: '🪴',
                description: 'The plant needs watering!',
                reward: 15,
                rewardBucks: 0
            },
            {
                id: 'fix_lamp',
                name: 'Flickering Lamp',
                emoji: '💡',
                description: 'Fix the flickering lamp!',
                reward: 20,
                rewardBucks: 0
            },
            {
                id: 'coffee_delivery',
                name: 'Coffee Delivery',
                emoji: '☕',
                description: 'Deliver coffee to a patron!',
                reward: 35,
                rewardBucks: 1
            }
        ];
        this.currentMiniQuest = null;
        this.nextMiniQuestTime = Date.now() + 90000; // First mini-quest in 1.5 minutes

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

        // Achievements system
        this.achievements = [
            // Floors Built
            { id: 'first_floor', name: 'Getting Started', description: 'Build your first floor', requirement: 1, stat: 'totalFloorsBuilt', reward: 50, rewardBucks: 0, unlocked: false },
            { id: 'tower_rising', name: 'Tower Rising', description: 'Build 5 floors', requirement: 5, stat: 'totalFloorsBuilt', reward: 100, rewardBucks: 1, unlocked: false },
            { id: 'tower_tycoon', name: 'Tower Tycoon', description: 'Build 10 floors', requirement: 10, stat: 'totalFloorsBuilt', reward: 250, rewardBucks: 2, unlocked: false },
            { id: 'sky_high', name: 'Sky High', description: 'Build 20 floors', requirement: 20, stat: 'totalFloorsBuilt', reward: 500, rewardBucks: 3, unlocked: false },
            { id: 'cloud_piercer', name: 'Cloud Piercer', description: 'Build 35 floors', requirement: 35, stat: 'totalFloorsBuilt', reward: 1000, rewardBucks: 5, unlocked: false },
            { id: 'space_elevator', name: 'Space Elevator', description: 'Build 50 floors', requirement: 50, stat: 'totalFloorsBuilt', reward: 2000, rewardBucks: 10, unlocked: false },

            // Readers Served
            { id: 'bookworm', name: 'Bookworm', description: 'Serve 100 readers', requirement: 100, stat: 'totalReadersServed', reward: 100, rewardBucks: 1, unlocked: false },
            { id: 'library_legend', name: 'Library Legend', description: 'Serve 500 readers', requirement: 500, stat: 'totalReadersServed', reward: 300, rewardBucks: 2, unlocked: false },
            { id: 'crowd_pleaser', name: 'Crowd Pleaser', description: 'Serve 1,000 readers', requirement: 1000, stat: 'totalReadersServed', reward: 500, rewardBucks: 3, unlocked: false },
            { id: 'community_hub', name: 'Community Hub', description: 'Serve 2,500 readers', requirement: 2500, stat: 'totalReadersServed', reward: 1000, rewardBucks: 5, unlocked: false },
            { id: 'literary_landmark', name: 'Literary Landmark', description: 'Serve 5,000 readers', requirement: 5000, stat: 'totalReadersServed', reward: 2000, rewardBucks: 10, unlocked: false },

            // VIPs Served
            { id: 'vip_treatment', name: 'VIP Treatment', description: 'Serve 10 VIP readers', requirement: 10, stat: 'totalVIPsServed', reward: 150, rewardBucks: 1, unlocked: false },
            { id: 'celebrity_status', name: 'Celebrity Status', description: 'Serve 50 VIP readers', requirement: 50, stat: 'totalVIPsServed', reward: 400, rewardBucks: 3, unlocked: false },
            { id: 'red_carpet', name: 'Red Carpet', description: 'Serve 100 VIP readers', requirement: 100, stat: 'totalVIPsServed', reward: 800, rewardBucks: 5, unlocked: false },
            { id: 'a_list_venue', name: 'A-List Venue', description: 'Serve 250 VIP readers', requirement: 250, stat: 'totalVIPsServed', reward: 1500, rewardBucks: 8, unlocked: false },

            // Missions Completed
            { id: 'mission_starter', name: 'Mission Starter', description: 'Complete 5 missions', requirement: 5, stat: 'totalMissionsCompleted', reward: 75, rewardBucks: 1, unlocked: false },
            { id: 'mission_master', name: 'Mission Master', description: 'Complete 25 missions', requirement: 25, stat: 'totalMissionsCompleted', reward: 200, rewardBucks: 2, unlocked: false },
            { id: 'quest_champion', name: 'Quest Champion', description: 'Complete 50 missions', requirement: 50, stat: 'totalMissionsCompleted', reward: 500, rewardBucks: 4, unlocked: false },
            { id: 'legendary_librarian', name: 'Legendary Librarian', description: 'Complete 100 missions', requirement: 100, stat: 'totalMissionsCompleted', reward: 1000, rewardBucks: 8, unlocked: false },

            // Staff Hired
            { id: 'hiring_spree', name: 'Hiring Spree', description: 'Hire 10 staff members', requirement: 10, stat: 'totalStaffHired', reward: 100, rewardBucks: 1, unlocked: false },
            { id: 'well_staffed', name: 'Well Staffed', description: 'Hire 25 staff members', requirement: 25, stat: 'totalStaffHired', reward: 250, rewardBucks: 2, unlocked: false },
            { id: 'hr_department', name: 'HR Department', description: 'Hire 50 staff members', requirement: 50, stat: 'totalStaffHired', reward: 500, rewardBucks: 4, unlocked: false },
            { id: 'job_creator', name: 'Job Creator', description: 'Hire 100 staff members', requirement: 100, stat: 'totalStaffHired', reward: 1000, rewardBucks: 8, unlocked: false },

            // Books Checked Out
            { id: 'page_turner', name: 'Page Turner', description: 'Check out 500 books', requirement: 500, stat: 'totalBooksCheckedOut', reward: 150, rewardBucks: 1, unlocked: false },
            { id: 'library_hero', name: 'Library Hero', description: 'Check out 2,000 books', requirement: 2000, stat: 'totalBooksCheckedOut', reward: 500, rewardBucks: 3, unlocked: false },
            { id: 'book_distributor', name: 'Book Distributor', description: 'Check out 5,000 books', requirement: 5000, stat: 'totalBooksCheckedOut', reward: 1000, rewardBucks: 5, unlocked: false },
            { id: 'knowledge_spreader', name: 'Knowledge Spreader', description: 'Check out 10,000 books', requirement: 10000, stat: 'totalBooksCheckedOut', reward: 2000, rewardBucks: 8, unlocked: false },
            { id: 'literacy_champion', name: 'Literacy Champion', description: 'Check out 25,000 books', requirement: 25000, stat: 'totalBooksCheckedOut', reward: 5000, rewardBucks: 15, unlocked: false },

            // Stars Earned
            { id: 'star_collector', name: 'Star Collector', description: 'Earn 1,000 total stars', requirement: 1000, stat: 'totalStarsEarned', reward: 100, rewardBucks: 1, unlocked: false },
            { id: 'star_hoarder', name: 'Star Hoarder', description: 'Earn 10,000 total stars', requirement: 10000, stat: 'totalStarsEarned', reward: 500, rewardBucks: 3, unlocked: false },
            { id: 'star_millionaire', name: 'Star Millionaire', description: 'Earn 50,000 total stars', requirement: 50000, stat: 'totalStarsEarned', reward: 1500, rewardBucks: 8, unlocked: false },
            { id: 'star_billionaire', name: 'Star Billionaire', description: 'Earn 100,000 total stars', requirement: 100000, stat: 'totalStarsEarned', reward: 3000, rewardBucks: 15, unlocked: false },

            // Tower Bucks Earned
            { id: 'gem_finder', name: 'Gem Finder', description: 'Earn 10 Tower Bucks', requirement: 10, stat: 'totalTowerBucksEarned', reward: 200, rewardBucks: 2, unlocked: false },
            { id: 'gem_collector', name: 'Gem Collector', description: 'Earn 50 Tower Bucks', requirement: 50, stat: 'totalTowerBucksEarned', reward: 500, rewardBucks: 5, unlocked: false },
            { id: 'gem_tycoon', name: 'Gem Tycoon', description: 'Earn 100 Tower Bucks', requirement: 100, stat: 'totalTowerBucksEarned', reward: 1000, rewardBucks: 10, unlocked: false },

            // Time Played (in seconds)
            { id: 'getting_hooked', name: 'Getting Hooked', description: 'Play for 1 hour', requirement: 3600, stat: 'timePlayed', reward: 100, rewardBucks: 1, unlocked: false },
            { id: 'dedicated_reader', name: 'Dedicated Reader', description: 'Play for 5 hours', requirement: 18000, stat: 'timePlayed', reward: 300, rewardBucks: 3, unlocked: false },
            { id: 'library_addict', name: 'Library Addict', description: 'Play for 10 hours', requirement: 36000, stat: 'timePlayed', reward: 600, rewardBucks: 5, unlocked: false },
            { id: 'true_librarian', name: 'True Librarian', description: 'Play for 24 hours', requirement: 86400, stat: 'timePlayed', reward: 1500, rewardBucks: 10, unlocked: false }
        ];

        // Daily login tracking
        this.dailyLogin = {
            lastLoginDate: null,
            streak: 0,
            lastRewardClaimed: null
        };

        // Reader collection (Pokédex style)
        this.readerCollection = {
            // Maps reader type ID to {count: number, firstSeen: timestamp, lastSeen: timestamp}
            // e.g., 'kid': {count: 15, firstSeen: ..., lastSeen: ...}
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
            },
            // Media & Technology
            {
                id: 'newspapers',
                name: 'Newspapers & Periodicals',
                emoji: '📰',
                color: 'gray',
                description: 'Current events and magazines',
                buildCost: 400,
                buildTime: 70,
                bookCategories: [
                    { name: 'Daily Papers', stockCost: 25, stockTime: 30, stockAmount: 100, earningRate: 5 },
                    { name: 'Magazines', stockCost: 35, stockTime: 40, stockAmount: 100, earningRate: 7 },
                    { name: 'Journals', stockCost: 50, stockTime: 55, stockAmount: 100, earningRate: 10 }
                ]
            },
            {
                id: 'music_audio',
                name: 'Music & Audiobooks',
                emoji: '🎵',
                color: 'purple',
                description: 'Listen and learn',
                buildCost: 550,
                buildTime: 100,
                bookCategories: [
                    { name: 'Music CDs', stockCost: 40, stockTime: 45, stockAmount: 100, earningRate: 8 },
                    { name: 'Audiobooks', stockCost: 55, stockTime: 60, stockAmount: 100, earningRate: 11 },
                    { name: 'Vinyl Records', stockCost: 75, stockTime: 80, stockAmount: 100, earningRate: 15 }
                ]
            },
            {
                id: 'movies',
                name: 'Movies & DVDs',
                emoji: '🎬',
                color: 'red',
                description: 'Film collection for all ages',
                buildCost: 600,
                buildTime: 110,
                bookCategories: [
                    { name: 'Family Films', stockCost: 42, stockTime: 48, stockAmount: 100, earningRate: 9 },
                    { name: 'Documentaries', stockCost: 58, stockTime: 65, stockAmount: 100, earningRate: 12 },
                    { name: 'Classics', stockCost: 78, stockTime: 85, stockAmount: 100, earningRate: 16 }
                ]
            },
            {
                id: 'gaming_lounge',
                name: 'Gaming Lounge',
                emoji: '🎮',
                color: 'neon',
                description: 'Video games and esports',
                buildCost: 800,
                buildTime: 150,
                bookCategories: [
                    { name: 'Retro Games', stockCost: 50, stockTime: 55, stockAmount: 100, earningRate: 10 },
                    { name: 'Current Gen', stockCost: 70, stockTime: 75, stockAmount: 100, earningRate: 14 },
                    { name: 'VR Experiences', stockCost: 95, stockTime: 100, stockAmount: 100, earningRate: 19 }
                ]
            },
            {
                id: 'computer_lab',
                name: 'Computer Lab',
                emoji: '🖥️',
                color: 'blue',
                description: 'Public computers and internet',
                buildCost: 700,
                buildTime: 130,
                bookCategories: [
                    { name: 'Basic Access', stockCost: 45, stockTime: 50, stockAmount: 100, earningRate: 9 },
                    { name: 'Research Tools', stockCost: 62, stockTime: 68, stockAmount: 100, earningRate: 12 },
                    { name: 'Design Software', stockCost: 85, stockTime: 90, stockAmount: 100, earningRate: 17 }
                ]
            },
            {
                id: 'art_gallery',
                name: 'Art Gallery',
                emoji: '🎨',
                color: 'rainbow',
                description: 'Rotating exhibits and art books',
                buildCost: 750,
                buildTime: 140,
                bookCategories: [
                    { name: 'Local Artists', stockCost: 48, stockTime: 52, stockAmount: 100, earningRate: 10 },
                    { name: 'Art History', stockCost: 65, stockTime: 70, stockAmount: 100, earningRate: 13 },
                    { name: 'Special Exhibits', stockCost: 88, stockTime: 95, stockAmount: 100, earningRate: 18 }
                ]
            },
            {
                id: 'maps_travel',
                name: 'Maps & Travel',
                emoji: '🗺️',
                color: 'tan',
                description: 'Explore the world from here',
                buildCost: 500,
                buildTime: 90,
                bookCategories: [
                    { name: 'Travel Guides', stockCost: 38, stockTime: 42, stockAmount: 100, earningRate: 8 },
                    { name: 'Atlases', stockCost: 52, stockTime: 58, stockAmount: 100, earningRate: 10 },
                    { name: 'Rare Maps', stockCost: 72, stockTime: 78, stockAmount: 100, earningRate: 14 }
                ]
            },
            {
                id: 'genealogy',
                name: 'Genealogy Room',
                emoji: '🌳',
                color: 'brown',
                description: 'Discover your family history',
                buildCost: 650,
                buildTime: 120,
                bookCategories: [
                    { name: 'Family Records', stockCost: 45, stockTime: 50, stockAmount: 100, earningRate: 9 },
                    { name: 'Census Archives', stockCost: 60, stockTime: 65, stockAmount: 100, earningRate: 12 },
                    { name: 'DNA Research', stockCost: 80, stockTime: 85, stockAmount: 100, earningRate: 16 }
                ]
            },
            {
                id: 'language_lab',
                name: 'Language Learning',
                emoji: '🗣️',
                color: 'orange',
                description: 'Master new languages',
                buildCost: 700,
                buildTime: 130,
                bookCategories: [
                    { name: 'Phrasebooks', stockCost: 42, stockTime: 48, stockAmount: 100, earningRate: 8 },
                    { name: 'Audio Courses', stockCost: 58, stockTime: 62, stockAmount: 100, earningRate: 12 },
                    { name: 'Immersion Sets', stockCost: 78, stockTime: 82, stockAmount: 100, earningRate: 16 }
                ]
            },
            {
                id: 'podcast_studio',
                name: 'Podcast Studio',
                emoji: '🎙️',
                color: 'red',
                description: 'Record and create audio content',
                buildCost: 850,
                buildTime: 160,
                bookCategories: [] // No inventory needed
            },
            {
                id: 'seed_library',
                name: 'Seed Library',
                emoji: '🌱',
                color: 'green',
                description: 'Borrow seeds, grow gardens',
                buildCost: 450,
                buildTime: 80,
                bookCategories: [
                    { name: 'Vegetable Seeds', stockCost: 35, stockTime: 40, stockAmount: 100, earningRate: 7 },
                    { name: 'Flower Seeds', stockCost: 48, stockTime: 52, stockAmount: 100, earningRate: 10 },
                    { name: 'Heirloom Seeds', stockCost: 65, stockTime: 70, stockAmount: 100, earningRate: 13 }
                ]
            },
            {
                id: 'tool_library',
                name: 'Tool Library',
                emoji: '🔨',
                color: 'yellow',
                description: 'Borrow tools for any project',
                buildCost: 600,
                buildTime: 110,
                bookCategories: [
                    { name: 'Hand Tools', stockCost: 40, stockTime: 45, stockAmount: 100, earningRate: 8 },
                    { name: 'Power Tools', stockCost: 55, stockTime: 60, stockAmount: 100, earningRate: 11 },
                    { name: 'Kitchen Gadgets', stockCost: 72, stockTime: 78, stockAmount: 100, earningRate: 14 }
                ]
            },
            {
                id: 'music_practice',
                name: 'Music Practice Rooms',
                emoji: '🎹',
                color: 'purple',
                description: 'Soundproof rooms with instruments',
                buildCost: 750,
                buildTime: 140,
                bookCategories: [
                    { name: 'Piano Room', stockCost: 48, stockTime: 52, stockAmount: 100, earningRate: 10 },
                    { name: 'Guitar Room', stockCost: 62, stockTime: 68, stockAmount: 100, earningRate: 12 },
                    { name: 'Recording Booth', stockCost: 85, stockTime: 90, stockAmount: 100, earningRate: 17 }
                ]
            },

            // Special Rooms (provide bonuses instead of books)
            {
                id: 'study_room',
                name: 'Study Room',
                emoji: '📖',
                color: 'lavender',
                description: 'Quiet study spaces - readers stay 2x longer',
                buildCost: 350,
                buildTime: 60,
                isSpecialRoom: true,
                bonus: {
                    type: 'extended_visits',
                    multiplier: 2,
                    description: 'Readers browse 2x longer, earning more XP'
                },
                bookCategories: [] // No stock needed
            },
            {
                id: 'maker_space',
                name: 'Maker Space',
                emoji: '🔧',
                color: 'rainbow',
                description: '3D printers & tools - attracts 50% more readers',
                buildCost: 500,
                buildTime: 90,
                isSpecialRoom: true,
                bonus: {
                    type: 'reader_magnet',
                    multiplier: 1.5,
                    description: 'Increases reader spawn rate by 50%'
                },
                bookCategories: []
            },
            {
                id: 'event_hall',
                name: 'Event Hall',
                emoji: '🎭',
                color: 'peach',
                description: 'Host events - doubles stars from nearby floors',
                buildCost: 600,
                buildTime: 120,
                isSpecialRoom: true,
                bonus: {
                    type: 'nearby_boost',
                    multiplier: 2,
                    range: 1, // Affects floors within 1 position
                    description: 'Floors next to this earn 2x stars'
                },
                bookCategories: []
            },

            // Utility Rooms
            {
                id: 'bathroom',
                name: 'Restroom',
                emoji: '🚻',
                color: 'sky',
                description: 'Essential amenity - reduces trash and boosts mood',
                buildCost: 200,
                buildTime: 30,
                isUtilityRoom: true,
                bonus: {
                    type: 'trash_reduction',
                    multiplier: 0.7, // 30% less trash generated
                    moodBoost: 5,
                    description: 'Reduces trash generation by 30%'
                },
                bookCategories: [],
                staffSlots: [
                    { name: 'Attendant', cost: 100, emoji: '🧑‍💼', color: '#42A5F5', effect: 'Keeps supplies stocked' },
                    { name: 'Cleaner', cost: 150, emoji: '🧼', color: '#26A69A', effect: 'Maintains cleanliness' },
                    { name: 'Maintenance', cost: 200, emoji: '🔧', color: '#78909C', effect: 'Fixes issues' }
                ]
            },
            {
                id: 'basement',
                name: 'Basement',
                emoji: '🏚️',
                color: 'tan',
                description: 'Maintenance hub - hire cleaning crew here',
                buildCost: 300,
                buildTime: 45,
                isUtilityRoom: true,
                bonus: {
                    type: 'maintenance_hub',
                    description: 'Hire cleaning crew to keep library tidy'
                },
                bookCategories: [],
                staffSlots: [
                    { name: 'Custodian', cost: 100, emoji: '🧹', color: '#8D6E63', effect: 'Cleans 30 trash per night cycle' },
                    { name: 'Plumber', cost: 200, emoji: '🔧', color: '#5C6BC0', effect: 'Keeps bathrooms running smoothly' },
                    { name: 'Electrician', cost: 300, emoji: '⚡', color: '#FFA000', effect: 'Maintains lighting and power' }
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
        // Exclude basement - it's auto-created, sort by buildCost
        return this.floorTypes
            .filter(t => t.id !== 'basement')
            .sort((a, b) => a.buildCost - b.buildCost);
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

        // Basement is auto-created, not buildable
        if (floorTypeId === 'basement') {
            return { success: false, error: 'Basement is automatically provided' };
        }

        // Deduct cost
        this.stars -= floorType.buildCost;

        // Create new floor - basement gets floorNumber 0, others get next slot
        const floorNumber = floorTypeId === 'basement' ? 0 : this.nextFloorSlot++;

        // Apply construction VIP speed bonus if active
        let buildTime = floorType.buildTime * 1000;
        const buildSpeedMultiplier = this.getEventEffect('build_speed');
        if (buildSpeedMultiplier > 1) {
            buildTime = Math.floor(buildTime / buildSpeedMultiplier);
        }

        const newFloor = {
            id: this.generateId(),
            floorNumber: floorNumber,
            typeId: floorTypeId,
            name: floorType.name,
            emoji: floorType.emoji,
            color: floorType.color,
            status: 'building', // building, ready
            buildStartTime: Date.now(),
            buildEndTime: Date.now() + buildTime,
            upgradeLevel: 1, // Floor upgrade level (1, 2, or 3)
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
            })),
            trash: 0 // Trash level 0-100
        };

        // Add to beginning of array so new floors appear at top of tower
        this.floors.unshift(newFloor);

        // Update stats
        this.stats.totalFloorsBuilt += 1;

        this.save();
        return { success: true, floor: newFloor };
    }

    /**
     * Delete a floor from the tower
     * Returns partial refund of build cost
     */
    deleteFloor(floorId) {
        const floorIndex = this.floors.findIndex(f => f.id === floorId);
        if (floorIndex === -1) {
            return { success: false, error: 'Floor not found' };
        }

        const floor = this.floors[floorIndex];

        // Can't delete lobby (floorNumber 0 is lobby in display terms)
        // Actually lobby is separate, but let's prevent deleting the last floor
        if (this.floors.length <= 1) {
            return { success: false, error: 'Cannot delete last floor' };
        }

        // Get floor type for refund calculation
        const floorType = this.floorTypes.find(t => t.id === floor.typeId);
        const refundAmount = floorType ? Math.floor(floorType.buildCost * 0.5) : 0;

        // Remove any staff assigned to this floor back to available pool
        if (floor.staff && floor.staff.length > 0 && this.staff) {
            // Staff are already in the global staff array, just need to unassign
            floor.staff.forEach(staffId => {
                const staffMember = this.staff.find(s => s.id === staffId);
                if (staffMember) {
                    staffMember.assignedFloor = null;
                }
            });
        }

        // Remove the floor
        this.floors.splice(floorIndex, 1);

        // Refund partial cost
        this.stars += refundAmount;

        this.save();
        return { success: true, refund: refundAmount, floorName: floor.name };
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
    hireStaff(floorId, customStaffIndex) {
        const floor = this.getFloor(floorId);
        if (!floor || floor.status !== 'ready') {
            return { success: false, error: 'Floor not ready' };
        }

        // Check if this floor type has custom staff
        const floorType = this.floorTypes.find(ft => ft.id === floor.typeId);
        const hasCustomStaff = floorType && floorType.staffSlots;

        if (hasCustomStaff) {
            // Custom staff for utility rooms (basement)
            const customStaff = floorType.staffSlots[customStaffIndex];
            if (!customStaff) {
                return { success: false, error: 'Invalid staff slot' };
            }

            // Check if already hired
            if (floor.staff.includes(customStaff.name)) {
                return { success: false, error: 'Already hired' };
            }

            // Check cost
            if (this.stars < customStaff.cost) {
                return { success: false, error: 'Not enough stars' };
            }

            // Deduct cost
            this.stars -= customStaff.cost;

            // Add staff name to floor
            floor.staff.push(customStaff.name);

            // Update stats
            this.stats.totalStaffHired += 1;

            this.save();

            return { success: true, staff: customStaff };
        }

        // Standard staff for regular floors
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

        // Calculate cost based on how many books need restocking
        const booksNeeded = category.maxStock - category.currentStock;
        const costPerBook = category.stockCost / category.maxStock;
        const actualCost = Math.ceil(booksNeeded * costPerBook);

        if (this.stars < actualCost) {
            return { success: false, error: 'Not enough stars' };
        }

        // Deduct cost
        this.stars -= actualCost;

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
     * Get count of categories that need restocking
     */
    getRestockNeededCount() {
        let count = 0;
        this.floors.forEach(floor => {
            if (floor.status !== 'ready') return;
            floor.bookStock.forEach((category, idx) => {
                // Check if unlocked by staff
                if (floor.staff.length <= idx) return;
                // Check if needs restocking (not full, not already restocking)
                if (category.currentStock < category.maxStock && !category.restocking) {
                    count++;
                }
            });
        });
        return count;
    }

    /**
     * Restock all floors instantly with Tower Bucks
     * Cost: 1 Tower Buck per 3 categories (minimum 1)
     */
    restockAll() {
        const neededCount = this.getRestockNeededCount();
        if (neededCount === 0) {
            return { success: false, error: 'Nothing needs restocking' };
        }

        const cost = Math.max(1, Math.ceil(neededCount / 3));
        if (this.towerBucks < cost) {
            return { success: false, error: `Need ${cost} 💎 (you have ${this.towerBucks})` };
        }

        // Deduct cost
        this.towerBucks -= cost;

        // Restock all eligible categories instantly
        let restocked = 0;
        this.floors.forEach(floor => {
            if (floor.status !== 'ready') return;
            floor.bookStock.forEach((category, idx) => {
                // Check if unlocked by staff
                if (floor.staff.length <= idx) return;
                // Restock if needed
                if (category.currentStock < category.maxStock) {
                    // If currently restocking, complete it
                    if (category.restocking) {
                        category.restocking = false;
                    }
                    category.currentStock = category.maxStock;
                    restocked++;
                }
            });
        });

        this.save();
        return { success: true, restocked, cost };
    }

    /**
     * Get floor by ID
     */
    getFloor(id) {
        return this.floors.find(f => f.id === id);
    }

    /**
     * Move a floor up (swap with the floor above it)
     */
    moveFloorUp(floorId) {
        const index = this.floors.findIndex(f => f.id === floorId);
        if (index === -1 || index === this.floors.length - 1) {
            return { success: false, error: 'Cannot move up' };
        }

        // Swap with the floor above
        [this.floors[index], this.floors[index + 1]] = [this.floors[index + 1], this.floors[index]];

        // Update floor numbers
        this.floors.forEach((floor, i) => {
            floor.floorNumber = i + 1;
        });

        this.save();
        return { success: true };
    }

    /**
     * Move a floor down (swap with the floor below it)
     */
    moveFloorDown(floorId) {
        const index = this.floors.findIndex(f => f.id === floorId);
        if (index === -1 || index === 0) {
            return { success: false, error: 'Cannot move down' };
        }

        // Swap with the floor below
        [this.floors[index], this.floors[index - 1]] = [this.floors[index - 1], this.floors[index]];

        // Update floor numbers
        this.floors.forEach((floor, i) => {
            floor.floorNumber = i + 1;
        });

        this.save();
        return { success: true };
    }

    /**
     * Reorder a floor to a specific index (for drag-and-drop)
     */
    reorderFloor(floorId, targetIndex) {
        const currentIndex = this.floors.findIndex(f => f.id === floorId);
        if (currentIndex === -1 || targetIndex === currentIndex) {
            return { success: false, error: 'Invalid move' };
        }

        // Clamp target index
        targetIndex = Math.max(0, Math.min(targetIndex, this.floors.length - 1));

        // Remove floor from current position
        const [floor] = this.floors.splice(currentIndex, 1);

        // Insert at new position
        this.floors.splice(targetIndex, 0, floor);

        // Update floor numbers
        this.floors.forEach((f, i) => {
            f.floorNumber = i + 1;
        });

        this.save();
        return { success: true };
    }

    /**
     * Spawn a reader to visit a random ready floor
     */
    spawnReader() {
        // Filter out floors with max trash (100) or active incidents - readers won't visit
        const readyFloors = this.floors.filter(f =>
            f.status === 'ready' &&
            (f.trash === undefined || f.trash < 100) &&
            (!f.incidents || Object.keys(f.incidents).length === 0)
        );
        if (readyFloors.length === 0) return null;

        // Check bathroom requirement: need 1 bathroom per 10 regular floors
        const regularFloors = this.floors.filter(f =>
            f.status === 'ready' && !f.typeId?.includes('bathroom') && !f.typeId?.includes('basement')
        ).length;
        const bathroomCount = this.floors.filter(f =>
            f.typeId === 'bathroom' && f.status === 'ready'
        ).length;
        const neededBathrooms = Math.floor(regularFloors / 10);

        // If missing bathrooms, 30% chance readers refuse to come
        if (bathroomCount < neededBathrooms && Math.random() < 0.3) {
            return null;
        }

        let floor, cat, idx;

        // If there's an active mission, 60% chance to spawn reader for that mission
        if (this.currentMission && this.currentMission.status === 'active' && Math.random() < 0.60) {
            const missionFloor = this.getFloor(this.currentMission.floorId);
            if (missionFloor && missionFloor.status === 'ready') {
                const missionCategory = missionFloor.bookStock[this.currentMission.categoryIndex];
                // Check category is stocked AND unlocked by staff
                const categoryUnlocked = missionFloor.staff.length > this.currentMission.categoryIndex;
                if (missionCategory && missionCategory.currentStock > 0 && categoryUnlocked) {
                    // Send reader to mission floor/category
                    floor = missionFloor;
                    cat = missionCategory;
                    idx = this.currentMission.categoryIndex;
                }
            }
        }

        // If not directed to mission (or mission not available), pick based on preferences
        if (!floor) {
            // First, determine reader type to know their preferences
            const isVIP = Math.random() < 0.10;
            let tempReaderType = null;

            if (!isVIP) {
                // Pick reader type early to get preferences
                const totalWeight = this.readerTypes.reduce((sum, type) => sum + type.weight, 0);
                const rand = Math.random() * totalWeight;
                let cumulative = 0;
                for (const type of this.readerTypes) {
                    cumulative += type.weight;
                    if (rand <= cumulative) {
                        tempReaderType = type;
                        break;
                    }
                }
                if (!tempReaderType) tempReaderType = this.readerTypes[0];
            }

            // Filter floors by preference (70% chance to use preferred floor if available)
            let selectedFloors = readyFloors;
            if (tempReaderType && tempReaderType.preferredFloors && Math.random() < 0.70) {
                const preferredFloors = readyFloors.filter(f =>
                    tempReaderType.preferredFloors.includes(f.typeId)
                );
                if (preferredFloors.length > 0) {
                    selectedFloors = preferredFloors;
                }
            }

            // Pick a random floor from selection
            floor = selectedFloors[Math.floor(Math.random() * selectedFloors.length)];

            // Pick a category with stock AND unlocked by staff
            const stockedCategories = floor.bookStock
                .map((cat, idx) => ({ cat, idx }))
                .filter(({ cat, idx }) => cat.currentStock > 0 && floor.staff.length > idx);

            if (stockedCategories.length === 0) return null;

            const selected = stockedCategories[Math.floor(Math.random() * stockedCategories.length)];
            cat = selected.cat;
            idx = selected.idx;

            // Store the pre-determined reader type to use later
            this._pendingReaderType = isVIP ? null : tempReaderType;
            this._pendingIsVIP = isVIP;
        }

        // Generate random name
        const firstName = this.readerNames.first[Math.floor(Math.random() * this.readerNames.first.length)];
        const lastName = this.readerNames.last[Math.floor(Math.random() * this.readerNames.last.length)];
        const fullName = `${firstName} ${lastName}`;

        // Determine if VIP - use pre-determined value if available
        const isVIP = this._pendingIsVIP !== undefined ? this._pendingIsVIP : Math.random() < 0.10;
        let readerType = this._pendingReaderType || null;
        let vipType = null;

        // Clear pending values
        this._pendingReaderType = undefined;
        this._pendingIsVIP = undefined;

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
        } else if (!readerType) {
            // Pick regular reader type (weighted) if not already determined
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

        // Calculate browse time and earnings based on VIP ability
        // Base browse time varies between 4-12 seconds
        let browseTime = 4000 + Math.floor(Math.random() * 8000);

        // Apply event browse time multiplier
        browseTime = Math.floor(browseTime * this.getEventEffect('browse_time'));

        let earningAmount = Math.max(1, Math.floor(cat.earningRate * 0.3)); // 30% of category earning rate

        if (vipType) {
            switch (vipType.ability) {
                case 'instant_checkout':
                    browseTime = 100; // Almost instant
                    break;
                case 'double_stars':
                    earningAmount *= 2;
                    break;
                // Other abilities handled when reader checks out
            }
        }

        // Randomly choose elevator (60%) or stairs (40%)
        const usesElevator = Math.random() < 0.6;

        // Checkout time will be set when they arrive on the floor
        let checkoutTime;
        let elevatorState;
        let elevatorArrivalTime;

        if (usesElevator) {
            const elevatorTravelTime = 2000 + (floor.floorNumber * 500);
            checkoutTime = Date.now() + elevatorTravelTime + browseTime;
            elevatorState = 'waiting';
            elevatorArrivalTime = Date.now() + elevatorTravelTime;
        } else {
            // Stairs - arrive immediately
            checkoutTime = Date.now() + browseTime;
            elevatorState = 'arrived';
            elevatorArrivalTime = Date.now();
        }

        // Determine how many books to check out based on browse time
        // Base: 1 book per 1.5 seconds of browsing, minimum 1 book
        let booksToCheckout = Math.max(1, Math.floor(browseTime / 1500));

        // VIPs get a bonus book
        if (isVIP) {
            booksToCheckout += 1;
        }

        // Cap by available stock
        booksToCheckout = Math.min(booksToCheckout, cat.currentStock);

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
            booksToCheckout: booksToCheckout,
            elevatorState: elevatorState,
            elevatorArrivalTime: elevatorArrivalTime,
            usedStairs: !usesElevator
        };

        // Check if this should be a returning regular customer (30% chance if any exist)
        if (this.regularCustomers.length > 0 && Math.random() < 0.30) {
            const regularCustomer = this.getReturningCustomer();
            if (regularCustomer) {
                reader.name = regularCustomer.name;
                reader.customerId = regularCustomer.id;
                reader.isRegular = true;
                reader.visitCount = regularCustomer.visitCount + 1;
                reader.favoriteCategory = regularCustomer.favoriteCategory;
                reader.earningAmount = Math.floor(reader.earningAmount * (1 + regularCustomer.loyaltyBonus));
            }
        }

        // Register with library card system
        const cardHolder = this.registerLibraryCardVisit(reader.name, reader.emoji, reader.type);
        reader.hasLibraryCard = !!cardHolder;
        reader.cardVisits = cardHolder ? cardHolder.visits : 0;

        // Apply library card checkout bonus
        if (reader.hasLibraryCard) {
            const cardBonus = this.getLibraryCardBonus(reader.name);
            // Apply faster checkout time for card holders
            if (cardBonus.checkoutBonus < 1) {
                const timeRemaining = reader.checkoutTime - Date.now();
                reader.checkoutTime = Date.now() + Math.floor(timeRemaining * cardBonus.checkoutBonus);
            }
        }

        this.readers.push(reader);
        return reader;
    }

    /**
     * Get a returning regular customer
     */
    getReturningCustomer() {
        // Prefer customers who haven't visited recently
        const availableCustomers = this.regularCustomers.filter(c => {
            const timeSinceLastVisit = Date.now() - (c.lastVisit || 0);
            return timeSinceLastVisit > 60000; // At least 1 minute since last visit
        });

        if (availableCustomers.length === 0) return null;

        return availableCustomers[Math.floor(Math.random() * availableCustomers.length)];
    }

    /**
     * Register a new regular customer or update existing one
     */
    registerRegularCustomer(reader) {
        const existing = this.regularCustomers.find(c => c.id === reader.customerId);

        if (existing) {
            // Update existing customer
            existing.visitCount++;
            existing.lastVisit = Date.now();
            existing.totalSpent += reader.earningAmount;
            existing.loyaltyBonus = Math.min(0.5, existing.visitCount * 0.05); // Max 50% bonus at 10 visits
        } else {
            // Create new regular customer (10% chance for first-timers to become regulars)
            if (Math.random() < 0.10) {
                this.regularCustomers.push({
                    id: this.customerIdCounter++,
                    name: reader.name,
                    type: reader.type,
                    visitCount: 1,
                    lastVisit: Date.now(),
                    favoriteCategory: reader.categoryIndex,
                    totalSpent: reader.earningAmount,
                    loyaltyBonus: 0.05 // 5% bonus on next visit
                });

                // Limit to 20 regular customers max
                if (this.regularCustomers.length > 20) {
                    // Remove least valuable customer (lowest total spent)
                    this.regularCustomers.sort((a, b) => a.totalSpent - b.totalSpent);
                    this.regularCustomers.shift();
                }
            }
        }
    }

    /**
     * Calculate next rush hour time (every 15-30 minutes)
     */
    calculateNextRushHour() {
        const minDelay = 15 * 60 * 1000; // 15 minutes
        const maxDelay = 30 * 60 * 1000; // 30 minutes
        const delay = minDelay + Math.random() * (maxDelay - minDelay);
        return Date.now() + delay;
    }

    /**
     * Check and trigger rush hour
     */
    checkRushHour() {
        const now = Date.now();

        // Check if rush hour should start
        if (!this.transitSchedule.isRushHour && now >= this.transitSchedule.nextRushHour) {
            this.startRushHour();
        }

        // Check if rush hour should end
        if (this.transitSchedule.isRushHour &&
            now >= this.transitSchedule.lastRushHour + this.transitSchedule.rushHourDuration) {
            this.endRushHour();
        }
    }

    /**
     * Start rush hour - increase reader spawn rate
     */
    startRushHour() {
        this.transitSchedule.isRushHour = true;
        this.transitSchedule.lastRushHour = Date.now();
        this.transitSchedule.currentTransit = this.transitSchedule.transitTypes[
            Math.floor(Math.random() * this.transitSchedule.transitTypes.length)
        ];

        // Notification
        this._rushHourNotification = {
            message: `${this.transitSchedule.currentTransit} arrived! Rush hour started!`,
            timestamp: Date.now()
        };

        console.log('Rush hour started!', this.transitSchedule.currentTransit);
    }

    /**
     * End rush hour
     */
    endRushHour() {
        this.transitSchedule.isRushHour = false;
        this.transitSchedule.nextRushHour = this.calculateNextRushHour();
        this.transitSchedule.currentTransit = null;

        console.log('Rush hour ended. Next in', Math.round((this.transitSchedule.nextRushHour - Date.now()) / 60000), 'minutes');
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
        const timeLimit = 180 + Math.floor(Math.random() * 120); // 180-300 seconds (3-5 minutes)
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
     * Generate a random special event
     */
    generateEvent() {
        // Pick random event type
        const eventType = this.eventTypes[Math.floor(Math.random() * this.eventTypes.length)];

        this.currentEvent = {
            ...eventType,
            startTime: Date.now(),
            endTime: Date.now() + eventType.duration
        };
    }

    /**
     * Get active event effect multiplier for a specific type
     */
    getEventEffect(effectType) {
        if (!this.currentEvent || this.currentEvent.effect.type !== effectType) {
            return 1; // No effect
        }
        return this.currentEvent.effect.value;
    }

    /**
     * Check if bonus bucks should be awarded (for reading challenge event)
     */
    shouldAwardBonusBucks() {
        return this.currentEvent && this.currentEvent.effect.type === 'bonus_bucks';
    }

    /**
     * Generate a find mission
     */
    generateFindMission() {
        // Place items on random floors
        const readyFloors = this.floors.filter(f => f.status === 'ready');
        if (readyFloors.length < 1) return; // Need at least 1 floor

        // Pick random item type
        const itemType = this.findMissionItems[Math.floor(Math.random() * this.findMissionItems.length)];

        // Determine how many to find (3-5, but cap at number of floors)
        const maxCount = Math.min(5, readyFloors.length);
        const count = Math.min(3 + Math.floor(Math.random() * 3), maxCount);

        const items = [];
        const usedFloors = new Set();

        for (let i = 0; i < count; i++) {
            let floor;
            let attempts = 0;

            // Try to find unique floor, allow duplicates if necessary
            do {
                floor = readyFloors[Math.floor(Math.random() * readyFloors.length)];
                attempts++;
            } while (usedFloors.has(floor.id) && attempts < 20 && usedFloors.size < readyFloors.length);

            usedFloors.add(floor.id);

            // Random position on floor
            items.push({
                id: this.generateId(),
                floorId: floor.id,
                type: itemType.id,
                emoji: itemType.emoji,
                color: itemType.color,
                found: false,
                x: 0.2 + Math.random() * 0.6, // 20-80% across floor
                y: 0.3 + Math.random() * 0.4  // 30-70% down floor
            });
        }

        console.log('Generated find mission:', count, itemType.name, 'on floors:', items.map(i => i.floorId));

        // Calculate reward
        const reward = count * 10;
        const rewardBucks = Math.random() < 0.3 ? 1 : 0;

        this.currentFindMission = {
            id: this.generateId(),
            itemType: itemType,
            items: items,
            found: 0,
            total: count,
            reward: reward,
            rewardBucks: rewardBucks,
            startTime: Date.now(),
            expiryTime: Date.now() + 90000 // 90 seconds to find all
        };
    }

    /**
     * Check if a tap found a hidden item
     */
    checkFindMissionTap(floorId, relativeX, relativeY) {
        if (!this.currentFindMission) return null;

        const items = this.currentFindMission.items;
        for (const item of items) {
            if (item.floorId === floorId && !item.found) {
                // Check if tap is close to item (within 15% tolerance)
                const dx = Math.abs(item.x - relativeX);
                const dy = Math.abs(item.y - relativeY);

                if (dx < 0.15 && dy < 0.15) {
                    item.found = true;
                    this.currentFindMission.found++;

                    // Check if mission complete
                    if (this.currentFindMission.found >= this.currentFindMission.total) {
                        this.completeFindMission();
                    }

                    return item;
                }
            }
        }
        return null;
    }

    /**
     * Complete find mission
     */
    completeFindMission() {
        if (!this.currentFindMission) return;

        // Award rewards
        this.stars += this.currentFindMission.reward;
        this.stats.totalStarsEarned += this.currentFindMission.reward;

        if (this.currentFindMission.rewardBucks > 0) {
            this.towerBucks += this.currentFindMission.rewardBucks;
            this.stats.totalTowerBucksEarned += this.currentFindMission.rewardBucks;
        }

        // Clear mission
        this.currentFindMission = null;

        // Next find mission in 2-4 minutes
        this.nextFindMissionTime = Date.now() + (120000 + Math.random() * 120000);
    }

    /**
     * Spawn a special wandering visitor
     */
    spawnSpecialVisitor() {
        if (this.floors.length === 0) return;

        // Pick random visitor type
        const visitorType = this.specialVisitorTypes[Math.floor(Math.random() * this.specialVisitorTypes.length)];

        const now = Date.now();
        const visitor = {
            id: this.generateId(),
            type: visitorType.id,
            name: visitorType.name,
            emoji: visitorType.emoji,
            description: visitorType.description,
            effect: visitorType.effect,
            thoughts: visitorType.thoughts,
            startTime: now,
            endTime: now + visitorType.duration,
            currentFloorIndex: Math.floor(Math.random() * this.floors.length),
            nextMoveTime: now + 5000,
            x: 0.5 // Position on floor (0-1)
        };

        this.specialVisitors.push(visitor);

        // Store notification for UI
        this._newSpecialVisitor = visitor;

        // Next visitor in 3-6 minutes
        this.nextSpecialVisitorTime = now + (180000 + Math.random() * 180000);
    }

    /**
     * Get active special visitor effect
     */
    getSpecialVisitorEffect(effectType) {
        for (const visitor of this.specialVisitors) {
            if (visitor.effect.type === effectType) {
                return visitor.effect.value;
            }
        }
        return 1; // No effect
    }

    /**
     * Check if there's an active special visitor of a type
     */
    hasSpecialVisitor(visitorId) {
        return this.specialVisitors.some(v => v.type === visitorId);
    }

    /**
     * Get library tidiness score (0-100)
     */
    getTidiness() {
        const readyFloors = this.floors.filter(f => f.status === 'ready');
        if (readyFloors.length === 0) return 100;

        let totalTrash = 0;
        readyFloors.forEach(floor => {
            if (floor.trash !== undefined) {
                totalTrash += floor.trash;
            }
        });

        const avgTrash = totalTrash / readyFloors.length;
        return Math.max(0, 100 - avgTrash);
    }

    /**
     * Calculate inspector bonus based on actual tidiness
     */
    getInspectorBonus() {
        const tidiness = this.getTidiness();
        // Base bonus * tidiness multiplier (0-100%)
        // At 100% tidy: 100 stars, at 50% tidy: 50 stars, at 0% tidy: 0 stars
        return Math.floor(tidiness);
    }

    /**
     * Update mood meter based on library state
     */
    updateMood() {
        // Calculate target mood based on current state
        let targetMood = 50; // Base mood

        // Boost for readers present
        targetMood += this.readers.length * 2;

        // Boost for special visitors
        targetMood += this.specialVisitors.length * 10;

        // Penalty for empty stock
        let emptyCategories = 0;
        this.floors.forEach(floor => {
            if (floor.status === 'ready') {
                floor.bookStock.forEach(cat => {
                    if (cat.currentStock === 0) emptyCategories++;
                });
            }
        });
        targetMood -= emptyCategories * 2;

        // Penalty for trash
        let totalTrash = 0;
        let floorCount = 0;
        this.floors.forEach(floor => {
            if (floor.status === 'ready' && floor.trash !== undefined) {
                totalTrash += floor.trash;
                floorCount++;
            }
        });
        if (floorCount > 0) {
            const avgTrash = totalTrash / floorCount;
            targetMood -= Math.floor(avgTrash / 5); // -1 mood per 5 avg trash
        }

        // Boost from bathrooms
        const bathroomCount = this.floors.filter(f =>
            f.typeId === 'bathroom' && f.status === 'ready'
        ).length;
        targetMood += bathroomCount * 5;

        // Boost during events
        if (this.currentEvent) targetMood += 15;

        // Boost from Event Hall events
        if (this.currentHallEvent && this.currentHallEvent.effect.type === 'mood_boost') {
            targetMood += this.currentHallEvent.effect.value;
        }

        // Weather effect on mood
        targetMood += this.getWeatherMoodEffect();

        // Holiday mood bonus
        targetMood += this.getHolidayMoodBonus();

        // Boost during rush hour
        if (this.transitSchedule.isRushHour) targetMood += 10;

        // Clamp target
        targetMood = Math.max(0, Math.min(100, targetMood));

        // Smoothly move current mood toward target
        if (this.mood < targetMood) {
            this.mood = Math.min(targetMood, this.mood + 0.5);
        } else if (this.mood > targetMood) {
            this.mood = Math.max(targetMood, this.mood - 0.3);
        }
    }

    /**
     * Get mood description
     */
    getMoodDescription() {
        if (this.mood >= 80) return { emoji: '😄', text: 'Thriving!' };
        if (this.mood >= 60) return { emoji: '😊', text: 'Happy' };
        if (this.mood >= 40) return { emoji: '😐', text: 'Okay' };
        if (this.mood >= 20) return { emoji: '😕', text: 'Quiet' };
        return { emoji: '😟', text: 'Slow' };
    }

    /**
     * Get detailed breakdown of mood factors
     */
    getMoodBreakdown() {
        const factors = [];

        // Base mood
        factors.push({ name: 'Base', value: 50, emoji: '📊' });

        // Readers present
        const readerBonus = this.readers.length * 2;
        factors.push({ name: `Visitors (${this.readers.length})`, value: readerBonus, emoji: '👥' });

        // Special visitors
        const specialBonus = this.specialVisitors.length * 10;
        if (this.specialVisitors.length > 0) {
            factors.push({ name: `Special Visitors (${this.specialVisitors.length})`, value: specialBonus, emoji: '⭐' });
        }

        // Empty stock penalty
        let emptyCategories = 0;
        this.floors.forEach(floor => {
            if (floor.status === 'ready') {
                floor.bookStock.forEach(cat => {
                    if (cat.currentStock === 0) emptyCategories++;
                });
            }
        });
        if (emptyCategories > 0) {
            factors.push({ name: `Empty Stock (${emptyCategories})`, value: -emptyCategories * 2, emoji: '📚' });
        }

        // Trash penalty
        let totalTrash = 0;
        let floorCount = 0;
        this.floors.forEach(floor => {
            if (floor.status === 'ready' && floor.trash !== undefined) {
                totalTrash += floor.trash;
                floorCount++;
            }
        });
        if (floorCount > 0) {
            const avgTrash = totalTrash / floorCount;
            const trashPenalty = Math.floor(avgTrash / 5);
            if (trashPenalty > 0) {
                factors.push({ name: `Trash (${Math.round(avgTrash)}% avg)`, value: -trashPenalty, emoji: '🗑️' });
            }
        }

        // Bathroom boost
        const bathroomCount = this.floors.filter(f =>
            f.typeId === 'bathroom' && f.status === 'ready'
        ).length;
        if (bathroomCount > 0) {
            factors.push({ name: `Bathrooms (${bathroomCount})`, value: bathroomCount * 5, emoji: '🚻' });
        }

        // Event boost
        if (this.currentEvent) {
            factors.push({ name: 'Active Event', value: 15, emoji: '🎉' });
        }

        // Hall event boost
        if (this.currentHallEvent && this.currentHallEvent.effect.type === 'mood_boost') {
            factors.push({ name: this.currentHallEvent.name, value: this.currentHallEvent.effect.value, emoji: '🎭' });
        }

        // Weather effect
        const weather = this.getCurrentWeather();
        if (weather && weather.moodEffect !== 0) {
            factors.push({ name: `${weather.name} Weather`, value: weather.moodEffect, emoji: weather.emoji });
        }

        // Holiday bonus
        const holidayBonus = this.getHolidayMoodBonus();
        if (holidayBonus > 0) {
            factors.push({ name: 'Holiday', value: holidayBonus, emoji: '🎊' });
        }

        // Rush hour boost
        if (this.transitSchedule && this.transitSchedule.isRushHour) {
            factors.push({ name: 'Rush Hour', value: 10, emoji: '🚇' });
        }

        // Calculate total
        const total = factors.reduce((sum, f) => sum + f.value, 0);

        return { factors, total: Math.max(0, Math.min(100, total)) };
    }

    /**
     * Get list of problems affecting mood
     */
    getMoodProblems() {
        const problems = [];

        // Check for incidents (power outage, floods, etc.)
        this.floors.forEach(floor => {
            if (floor.incidents) {
                if (floor.incidents.powerOut) {
                    problems.push({
                        emoji: '⚡',
                        text: `${floor.name} has no power`,
                        detail: 'Needs Electrician',
                        floor: floor.name
                    });
                }
                if (floor.incidents.brokenWindow) {
                    problems.push({
                        emoji: '🪟',
                        text: `${floor.name} has broken window`,
                        detail: 'Needs Custodian',
                        floor: floor.name
                    });
                }
                if (floor.incidents.messySpill) {
                    problems.push({
                        emoji: '🤮',
                        text: `${floor.name} has messy spill`,
                        detail: 'Needs Custodian',
                        floor: floor.name
                    });
                }
                if (floor.incidents.flooded) {
                    problems.push({
                        emoji: '🌊',
                        text: `${floor.name} is flooded`,
                        detail: 'Needs Plumber',
                        floor: floor.name
                    });
                }
                if (floor.incidents.bugInfestation) {
                    problems.push({
                        emoji: '🐜',
                        text: `${floor.name} has bugs`,
                        detail: 'Needs Custodian',
                        floor: floor.name
                    });
                }
                if (floor.incidents.fireAlarm) {
                    problems.push({
                        emoji: '🚨',
                        text: `${floor.name} fire alarm`,
                        detail: 'Waiting to reset',
                        floor: floor.name
                    });
                }
            }
        });

        // Check for dirty floors
        this.floors.forEach(floor => {
            if (floor.status === 'ready' && floor.trash !== undefined && floor.trash > 30) {
                problems.push({
                    emoji: '🗑️',
                    text: `${floor.name} needs cleaning`,
                    detail: `${floor.trash}% trash`,
                    floor: floor.name
                });
            }
        });

        // Check for empty book categories (only unlocked ones)
        this.floors.forEach(floor => {
            if (floor.status === 'ready') {
                floor.bookStock.forEach((cat, idx) => {
                    // Only check unlocked categories
                    if (floor.staff.length > idx && cat.currentStock === 0 && !cat.restocking) {
                        problems.push({
                            emoji: '📚',
                            text: `${floor.name} out of ${cat.name}`,
                            detail: 'Needs restocking',
                            floor: floor.name
                        });
                    }
                });
            }
        });

        // Check for floors without staff
        this.floors.forEach(floor => {
            if (floor.status === 'ready' && !floor.typeId?.includes('bathroom') && !floor.typeId?.includes('basement')) {
                if (floor.staff.length === 0) {
                    problems.push({
                        emoji: '👤',
                        text: `${floor.name} has no staff`,
                        detail: 'Hire a Page',
                        floor: floor.name
                    });
                }
            }
        });

        // Check bathroom requirement (1 per 10 floors)
        const regularFloors = this.floors.filter(f =>
            f.status === 'ready' && !f.typeId?.includes('bathroom') && !f.typeId?.includes('basement')
        ).length;
        const bathroomCount = this.floors.filter(f =>
            f.typeId === 'bathroom' && f.status === 'ready'
        ).length;
        const neededBathrooms = Math.floor(regularFloors / 10);
        if (bathroomCount < neededBathrooms) {
            problems.push({
                emoji: '🚻',
                text: `Need more bathrooms`,
                detail: `${bathroomCount}/${neededBathrooms} required`,
                floor: null
            });
        }

        // Check for bad weather
        const weather = this.getCurrentWeather();
        if (weather && weather.moodEffect < 0) {
            problems.push({
                emoji: weather.emoji,
                text: `${weather.name} weather`,
                detail: `Mood ${weather.moodEffect}`,
                floor: null
            });
        }

        // If no problems, that's good!
        if (problems.length === 0) {
            problems.push({
                emoji: '✨',
                text: 'No problems!',
                detail: 'Library is running smoothly',
                floor: null
            });
        }

        return problems;
    }

    /**
     * Get current game day (1 day = 1 hour of real play time)
     */
    getGameDay() {
        const hoursPlayed = this.stats.timePlayed / 3600;
        return Math.floor(hoursPlayed) + 1;
    }

    /**
     * Get time remaining in current day (in seconds)
     */
    getTimeRemainingInDay() {
        const secondsInDay = 3600; // 1 hour = 1 day
        const secondsIntoCurrentDay = this.stats.timePlayed % secondsInDay;
        return secondsInDay - secondsIntoCurrentDay;
    }

    /**
     * Get current time of day as a clock (6:00 AM to 6:00 AM next day)
     */
    getGameClock() {
        const secondsInDay = 3600; // 1 hour real = 1 day game
        const secondsIntoDay = this.stats.timePlayed % secondsInDay;

        // Map 0-3600 seconds to 6:00 AM - 6:00 AM (24 hours)
        const gameMinutes = (secondsIntoDay / secondsInDay) * 1440; // 1440 minutes in a day
        const totalMinutes = (6 * 60) + gameMinutes; // Start at 6 AM

        const hours = Math.floor(totalMinutes / 60) % 24;
        const minutes = Math.floor(totalMinutes % 60);

        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;

        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    }

    /**
     * Run night cleaning cycle - cleans trash based on basement staff
     */
    runNightCleaning() {
        // Find basement floor
        const basement = this.floors.find(f => f.typeId === 'basement' && f.status === 'ready');
        if (!basement) return { cleaned: false, reason: 'No basement' };

        // Check cleaning staff
        const cleaningPower = this.getCleaningPower(basement);
        if (cleaningPower === 0) return { cleaned: false, reason: 'No cleaning staff' };

        // Clean all floors
        let totalCleaned = 0;
        this.floors.forEach(floor => {
            if (floor.trash !== undefined && floor.trash > 0) {
                const amountCleaned = Math.min(floor.trash, cleaningPower);
                floor.trash -= amountCleaned;
                totalCleaned += amountCleaned;
            }
        });

        this._nightCleaningOccurred = true;
        this._cleanedAmount = totalCleaned;

        return { cleaned: true, amount: totalCleaned };
    }

    /**
     * Get cleaning power from basement staff
     */
    getCleaningPower(basement) {
        if (!basement || !basement.staff) return 0;

        let power = 0;
        basement.staff.forEach(staffMember => {
            if (staffMember === 'Custodian') power += 30; // Each custodian adds cleaning power
        });
        return power > 0 ? power : 0;
    }

    /**
     * Run continuous cleaning during the day - custodians actively clean floors
     */
    runContinuousCleaning() {
        // Only clean every 5 ticks
        this._cleaningTickCounter = (this._cleaningTickCounter || 0) + 1;
        if (this._cleaningTickCounter < 5) return;
        this._cleaningTickCounter = 0;

        // Find basement floor
        const basement = this.floors.find(f => f.typeId === 'basement' && f.status === 'ready');
        if (!basement) return;

        // Count custodians
        const custodianCount = basement.staff.filter(s => s === 'Custodian').length;
        if (custodianCount === 0) return;

        // Find dirty floors (trash > 0), sorted by most dirty first
        const dirtyFloors = this.floors
            .filter(f => f.status === 'ready' && f.trash !== undefined && f.trash > 0)
            .sort((a, b) => b.trash - a.trash);

        if (dirtyFloors.length === 0) return;

        // Each custodian cleans 2 trash per cleaning cycle from the dirtiest floor they're assigned to
        // Distribute custodians across dirty floors
        for (let i = 0; i < custodianCount; i++) {
            const floorIndex = i % dirtyFloors.length;
            const floor = dirtyFloors[floorIndex];
            if (floor.trash > 0) {
                floor.trash = Math.max(0, floor.trash - 2);
            }
        }
    }

    /**
     * Check for random incidents and fix them with appropriate staff
     */
    checkIncidents() {
        // Find basement staff
        const basement = this.floors.find(f => f.typeId === 'basement' && f.status === 'ready');
        const hasElectrician = basement && basement.staff.includes('Electrician');
        const hasPlumber = basement && basement.staff.includes('Plumber');
        const hasCustodian = basement && basement.staff.includes('Custodian');

        // Check if there's already an active incident - only allow one at a time
        const hasActiveIncident = this.floors.some(floor =>
            floor.incidents && Object.keys(floor.incidents).length > 0
        );

        // Count regular floors (not basement/bathroom)
        const regularFloorCount = this.floors.filter(f =>
            f.status === 'ready' && f.typeId !== 'basement' && f.typeId !== 'bathroom'
        ).length;

        // No incidents until at least 4 floors are built
        const canSpawnNewIncidents = regularFloorCount >= 4;

        // Cooldown between incidents (2-3 minutes after last incident was fixed)
        if (!this._lastIncidentFixed) {
            this._lastIncidentFixed = 0;
        }
        const timeSinceLastIncident = Date.now() - this._lastIncidentFixed;
        const incidentCooldown = 120000 + Math.random() * 60000; // 2-3 minutes
        const canSpawnIncident = timeSinceLastIncident > incidentCooldown;

        // Incident types with their properties
        const incidentTypes = [
            { id: 'powerOut', emoji: '⚡', name: 'Power outage', fixer: 'Electrician', hasFixer: hasElectrician, baseChance: 0.005 },
            { id: 'brokenWindow', emoji: '🪟', name: 'Broken window', fixer: 'Custodian', hasFixer: hasCustodian, baseChance: 0.003 },
            { id: 'messySpill', emoji: '🤮', name: 'Messy spill', fixer: 'Custodian', hasFixer: hasCustodian, baseChance: 0.004 },
            { id: 'bugInfestation', emoji: '🐜', name: 'Bug infestation', fixer: 'Custodian', hasFixer: hasCustodian, baseChance: 0.002 },
            { id: 'fireAlarm', emoji: '🚨', name: 'Fire alarm pulled', fixer: null, hasFixer: true, baseChance: 0.002 }
        ];

        // Only spawn new incidents if none are active, cooldown has passed, and we have enough floors
        if (!hasActiveIncident && canSpawnIncident && canSpawnNewIncidents) {
            // Check regular floors for incidents
            this.floors.forEach(floor => {
                if (floor.status === 'ready' && floor.typeId !== 'basement' && floor.typeId !== 'bathroom') {
                    // Initialize incidents object if needed
                    if (!floor.incidents) floor.incidents = {};

                    // Check for each incident type
                    incidentTypes.forEach(incident => {
                        // Reduced chance if we have the fixer
                        const chance = incident.hasFixer ? incident.baseChance * 0.1 : incident.baseChance;

                        // Random chance of incident
                        if (!floor.incidents[incident.id] && Math.random() < chance) {
                            // Calculate fix time at creation so it's deterministic
                            let fixDuration;
                            switch(incident.id) {
                                case 'powerOut': fixDuration = 30000 + Math.random() * 30000; break;
                                case 'brokenWindow': fixDuration = 45000 + Math.random() * 45000; break;
                                case 'messySpill': fixDuration = 20000 + Math.random() * 20000; break;
                                case 'bugInfestation': fixDuration = 60000 + Math.random() * 30000; break;
                                case 'fireAlarm': fixDuration = 60000 + Math.random() * 60000; break;
                                default: fixDuration = 30000;
                            }
                            floor.incidents[incident.id] = {
                                startTime: Date.now(),
                                fixTime: Date.now() + fixDuration
                            };
                            this._newIncident = {
                                floor: floor.name,
                                emoji: incident.emoji,
                                type: incident.name
                            };
                        }
                    });
                }
            });

            // Check bathrooms for floods (plumber fixes)
            this.floors.forEach(floor => {
                if (floor.status === 'ready' && floor.typeId === 'bathroom') {
                    if (!floor.incidents) floor.incidents = {};

                    const floodChance = hasPlumber ? 0.001 : 0.005;
                    if (!floor.incidents.flooded && Math.random() < floodChance) {
                        const fixDuration = 45000 + Math.random() * 45000;
                        floor.incidents.flooded = {
                            startTime: Date.now(),
                            fixTime: Date.now() + fixDuration
                        };
                        this._newIncident = {
                            floor: floor.name,
                            emoji: '🌊',
                            type: 'Bathroom flooded'
                        };
                    }
                }
            });
        }

        // Staff fix incidents
        this.floors.forEach(floor => {
            if (!floor.incidents) return;

            // Electrician fixes power outages
            if (hasElectrician && floor.incidents.powerOut) {
                // Use fixTime if available, otherwise fall back to old calculation for existing incidents
                const fixTime = floor.incidents.powerOut.fixTime || (floor.incidents.powerOut.startTime + 45000);
                if (Date.now() > fixTime) {
                    delete floor.incidents.powerOut;
                    this._incidentFixed = { floor: floor.name, emoji: '⚡', type: 'Power restored' };
                    this._lastIncidentFixed = Date.now();
                }
            }

            // Custodian fixes broken windows, spills, and bug infestations
            if (hasCustodian) {
                if (floor.incidents.brokenWindow) {
                    const fixTime = floor.incidents.brokenWindow.fixTime || (floor.incidents.brokenWindow.startTime + 67500);
                    if (Date.now() > fixTime) {
                        delete floor.incidents.brokenWindow;
                        this._incidentFixed = { floor: floor.name, emoji: '🪟', type: 'Window fixed' };
                        this._lastIncidentFixed = Date.now();
                    }
                }
                if (floor.incidents.messySpill) {
                    const fixTime = floor.incidents.messySpill.fixTime || (floor.incidents.messySpill.startTime + 30000);
                    if (Date.now() > fixTime) {
                        delete floor.incidents.messySpill;
                        this._incidentFixed = { floor: floor.name, emoji: '🧹', type: 'Spill cleaned' };
                        this._lastIncidentFixed = Date.now();
                    }
                }
                if (floor.incidents.bugInfestation) {
                    const fixTime = floor.incidents.bugInfestation.fixTime || (floor.incidents.bugInfestation.startTime + 75000);
                    if (Date.now() > fixTime) {
                        delete floor.incidents.bugInfestation;
                        this._incidentFixed = { floor: floor.name, emoji: '🐜', type: 'Bugs exterminated' };
                        this._lastIncidentFixed = Date.now();
                    }
                }
            }

            // Fire alarm auto-resets
            if (floor.incidents.fireAlarm) {
                const fixTime = floor.incidents.fireAlarm.fixTime || (floor.incidents.fireAlarm.startTime + 90000);
                if (Date.now() > fixTime) {
                    delete floor.incidents.fireAlarm;
                    this._incidentFixed = { floor: floor.name, emoji: '🚨', type: 'Alarm reset' };
                    this._lastIncidentFixed = Date.now();
                }
            }

            // Plumber fixes floods
            if (hasPlumber && floor.incidents.flooded) {
                const fixTime = floor.incidents.flooded.fixTime || (floor.incidents.flooded.startTime + 67500);
                if (Date.now() > fixTime) {
                    delete floor.incidents.flooded;
                    this._incidentFixed = { floor: floor.name, emoji: '🔧', type: 'Flood fixed' };
                    this._lastIncidentFixed = Date.now();
                }
            }
        });
    }

    /**
     * Check if library needs bathrooms warning
     */
    getBathroomWarning() {
        const regularFloors = this.floors.filter(f =>
            f.status === 'ready' && f.typeId !== 'bathroom' && f.typeId !== 'basement'
        ).length;
        const bathroomCount = this.floors.filter(f =>
            f.typeId === 'bathroom' && f.status === 'ready'
        ).length;
        const neededBathrooms = Math.floor(regularFloors / 5);

        if (bathroomCount < neededBathrooms) {
            return {
                needed: true,
                have: bathroomCount,
                need: neededBathrooms,
                message: `Need ${neededBathrooms - bathroomCount} more restroom(s)!`
            };
        }
        return { needed: false };
    }

    /**
     * Update weather system
     */
    updateWeather() {
        const now = Date.now();
        if (now >= this.weather.nextChange) {
            // Change weather
            const oldWeather = this.weather.current;
            const weatherTypes = this.weather.types;

            // Weight towards rainy/cloudy - libraries are busier when people want to stay indoors
            const weights = [0.15, 0.25, 0.35, 0.15, 0.1]; // sunny, cloudy, rainy, stormy, snowy
            const random = Math.random();
            let cumulative = 0;
            let newWeatherIndex = 0;

            for (let i = 0; i < weights.length; i++) {
                cumulative += weights[i];
                if (random < cumulative) {
                    newWeatherIndex = i;
                    break;
                }
            }

            this.weather.current = weatherTypes[newWeatherIndex].id;
            this.weather.nextChange = now + (3 + Math.random() * 4) * 60 * 1000; // 3-7 minutes

            // Notify if weather changed
            if (this.weather.current !== oldWeather) {
                const newWeather = weatherTypes[newWeatherIndex];
                this._weatherChanged = newWeather;
            }
        }
    }

    /**
     * Get current weather data
     */
    getCurrentWeather() {
        return this.weather.types.find(w => w.id === this.weather.current) || this.weather.types[0];
    }

    /**
     * Get time until next weather change (in seconds)
     */
    getTimeUntilWeatherChange() {
        return Math.max(0, Math.ceil((this.weather.nextChange - Date.now()) / 1000));
    }

    /**
     * Get weather forecast (current + next few weather periods)
     */
    getWeatherForecast() {
        const forecast = [];
        const currentWeather = this.getCurrentWeather();
        const timeUntilChange = this.getTimeUntilWeatherChange();

        // Current weather
        forecast.push({
            weather: currentWeather,
            timeLabel: `Now (${Math.floor(timeUntilChange / 60)}m ${timeUntilChange % 60}s remaining)`
        });

        // Generate next 3 weather predictions based on simple pattern
        // Weather tends to follow patterns: sunny->cloudy->rainy->cloudy->sunny
        const weatherOrder = ['sunny', 'cloudy', 'rainy', 'cloudy', 'sunny', 'snowy'];
        let currentIndex = weatherOrder.indexOf(this.weather.current);
        if (currentIndex === -1) currentIndex = 0;

        for (let i = 1; i <= 3; i++) {
            const nextIndex = (currentIndex + i) % weatherOrder.length;
            const nextWeatherId = weatherOrder[nextIndex];
            const nextWeather = this.weather.types.find(w => w.id === nextWeatherId);

            forecast.push({
                weather: nextWeather,
                timeLabel: `+${i * 5} min`
            });
        }

        return forecast;
    }

    /**
     * Get weather effect on mood
     */
    getWeatherMoodEffect() {
        const weather = this.getCurrentWeather();
        return weather.moodEffect;
    }

    /**
     * Get weather effect on spawn rate
     */
    getWeatherSpawnEffect() {
        const weather = this.getCurrentWeather();
        return weather.spawnEffect;
    }

    /**
     * Get current season based on real date
     */
    getCurrentSeason() {
        const now = new Date();
        const month = now.getMonth() + 1; // 1-12

        if (month >= 3 && month <= 5) return 'spring';
        if (month >= 6 && month <= 8) return 'summer';
        if (month >= 9 && month <= 11) return 'fall';
        return 'winter';
    }

    /**
     * Check and update holidays based on real date
     */
    updateSeasonAndHoliday() {
        // Update current season
        this.seasons.current = this.getCurrentSeason();

        // Check for active holiday
        const now = new Date();
        const month = now.getMonth() + 1;
        const day = now.getDate();

        let activeHoliday = null;
        for (const holiday of this.seasons.holidays) {
            // Check if we're within the holiday period
            const startDate = new Date(now.getFullYear(), holiday.month - 1, holiday.day);
            const endDate = new Date(startDate.getTime() + (holiday.duration * 24 * 60 * 60 * 1000));

            if (now >= startDate && now < endDate) {
                activeHoliday = holiday;
                break;
            }
        }

        // Notify if holiday changed
        if (activeHoliday && (!this.seasons.currentHoliday || this.seasons.currentHoliday.id !== activeHoliday.id)) {
            this._holidayStarted = activeHoliday;
        } else if (!activeHoliday && this.seasons.currentHoliday) {
            this._holidayEnded = this.seasons.currentHoliday;
        }

        this.seasons.currentHoliday = activeHoliday;
    }

    /**
     * Get holiday bonus multiplier for stars
     */
    getHolidayStarBonus() {
        if (!this.seasons.currentHoliday) return 1;

        switch (this.seasons.currentHoliday.bonus) {
            case 'double_stars':
            case 'all_boost':
                return 2;
            case 'star_bonus':
                return 1.5;
            default:
                return 1;
        }
    }

    /**
     * Get holiday bonus for spawn rate
     */
    getHolidaySpawnBonus() {
        if (!this.seasons.currentHoliday) return 1;

        switch (this.seasons.currentHoliday.bonus) {
            case 'spawn_boost':
            case 'all_boost':
                return 1.5;
            case 'kid_spawn':
            case 'student_spawn':
                return 1.3;
            default:
                return 1;
        }
    }

    /**
     * Get holiday mood bonus
     */
    getHolidayMoodBonus() {
        if (!this.seasons.currentHoliday) return 0;

        switch (this.seasons.currentHoliday.bonus) {
            case 'mood_boost':
            case 'all_boost':
                return 15;
            default:
                return 5; // Small mood boost for any holiday
        }
    }

    /**
     * Get season effect on weather probability
     */
    getSeasonWeatherWeight() {
        // Adjust weather probabilities based on season
        switch (this.seasons.current) {
            case 'winter':
                return { sunny: 0.2, cloudy: 0.3, rainy: 0.15, stormy: 0.05, snowy: 0.3 };
            case 'spring':
                return { sunny: 0.3, cloudy: 0.25, rainy: 0.3, stormy: 0.1, snowy: 0.05 };
            case 'summer':
                return { sunny: 0.45, cloudy: 0.25, rainy: 0.15, stormy: 0.15, snowy: 0 };
            case 'fall':
                return { sunny: 0.25, cloudy: 0.35, rainy: 0.25, stormy: 0.1, snowy: 0.05 };
            default:
                return { sunny: 0.3, cloudy: 0.3, rainy: 0.2, stormy: 0.1, snowy: 0.1 };
        }
    }

    /**
     * Check and trigger book donations
     */
    checkBookDonation() {
        const now = Date.now();
        if (now < this.nextDonationTime) return;

        // Get floors that can receive donations (not full)
        const eligibleFloors = this.floors.filter(f =>
            f.status === 'ready' &&
            f.bookStock &&
            f.bookStock.some(cat => cat.currentStock < cat.maxStock)
        );

        if (eligibleFloors.length === 0) {
            this.nextDonationTime = now + (60 * 1000); // Check again in 1 minute
            return;
        }

        // Pick a random floor and category
        const floor = eligibleFloors[Math.floor(Math.random() * eligibleFloors.length)];
        const notFullCategories = floor.bookStock.filter(cat => cat.currentStock < cat.maxStock);
        const category = notFullCategories[Math.floor(Math.random() * notFullCategories.length)];

        // Pick a random donation source
        const source = this.donationSources[Math.floor(Math.random() * this.donationSources.length)];

        // Add books (up to max stock)
        const spaceAvailable = category.maxStock - category.currentStock;
        const booksAdded = Math.min(source.amount, spaceAvailable);
        category.currentStock += booksAdded;

        // Notify
        this._bookDonation = {
            source: source,
            floorName: floor.name,
            floorEmoji: floor.emoji,
            categoryName: category.name,
            categoryEmoji: category.emoji,
            booksAdded: booksAdded
        };

        // Schedule next donation (2-4 minutes)
        this.nextDonationTime = now + (120 * 1000 + Math.random() * 120 * 1000);
    }

    /**
     * Register a patron visit for library card system
     */
    registerLibraryCardVisit(readerName, readerEmoji, readerType) {
        // Find existing card holder or create new
        let cardHolder = this.libraryCards.find(c => c.name === readerName);
        let isNewCard = false;

        if (!cardHolder) {
            // Create new card if we have space
            if (this.libraryCards.length >= this.maxLibraryCards) {
                // Remove least active card holder
                this.libraryCards.sort((a, b) => a.visits - b.visits);
                this.libraryCards.shift();
            }

            cardHolder = {
                id: this.generateId(),
                name: readerName,
                emoji: readerEmoji,
                type: readerType,
                visits: 0,
                totalStars: 0,
                firstVisit: Date.now(),
                lastVisit: Date.now()
            };
            this.libraryCards.push(cardHolder);
            isNewCard = true;
        }

        // Only notify for returning patrons at milestones (every 5 visits)
        if (cardHolder.visits > 0 && cardHolder.visits % 5 === 0) {
            this._returningPatron = cardHolder;
        }

        // Increment visits
        const oldVisits = cardHolder.visits;
        cardHolder.visits += 1;
        cardHolder.lastVisit = Date.now();

        // Check for milestone
        for (const benefit of this.cardBenefits) {
            if (oldVisits < benefit.visits && cardHolder.visits >= benefit.visits) {
                this._cardMilestone = {
                    cardHolder: cardHolder,
                    benefit: benefit
                };
                break;
            }
        }

        return cardHolder;
    }

    /**
     * Get library card bonus for a patron
     */
    getLibraryCardBonus(readerName) {
        const cardHolder = this.libraryCards.find(c => c.name === readerName);
        if (!cardHolder) return { starBonus: 1, checkoutBonus: 1, canBringFriend: false };

        let starBonus = 1;
        let checkoutBonus = 1;
        let canBringFriend = false;

        for (const benefit of this.cardBenefits) {
            if (cardHolder.visits >= benefit.visits) {
                switch (benefit.bonus) {
                    case 'fast_checkout':
                        checkoutBonus = 0.9; // 10% faster
                        break;
                    case 'extra_stars':
                        starBonus = 1.2; // 20% more stars
                        break;
                    case 'vip_spawn':
                        canBringFriend = true;
                        break;
                }
            }
        }

        return { starBonus, checkoutBonus, canBringFriend };
    }

    /**
     * Update card holder's total stars earned
     */
    updateLibraryCardStars(readerName, stars) {
        const cardHolder = this.libraryCards.find(c => c.name === readerName);
        if (cardHolder) {
            cardHolder.totalStars += stars;
        }
    }

    /**
     * Check and trigger Event Hall events (every 2-3 days)
     */
    checkEventHallEvent() {
        // Check if we have an Event Hall
        const eventHall = this.floors.find(f => f.typeId === 'event_hall' && f.status === 'ready');
        if (!eventHall) return;

        const currentDay = this.getGameDay();
        const daysSinceLastEvent = currentDay - this.lastEventHallDay;

        // Trigger event every 2-3 days (random)
        const eventInterval = 2 + Math.floor(Math.random() * 2); // 2 or 3

        if (daysSinceLastEvent >= eventInterval && !this.currentHallEvent) {
            this.triggerHallEvent();
            this.lastEventHallDay = currentDay;
        }
    }

    /**
     * Trigger a random Event Hall event
     */
    triggerHallEvent() {
        const eventType = this.hallEventTypes[Math.floor(Math.random() * this.hallEventTypes.length)];
        const now = Date.now();

        this.currentHallEvent = {
            id: this.generateId(),
            type: eventType.id,
            name: eventType.name,
            emoji: eventType.emoji,
            description: eventType.description,
            effect: eventType.effect,
            reward: eventType.reward,
            startTime: now,
            endTime: now + eventType.duration
        };

        // Flag for UI notification
        this._newHallEvent = this.currentHallEvent;
    }

    /**
     * Get Event Hall event effect multiplier
     */
    getHallEventEffect(effectType) {
        if (!this.currentHallEvent || this.currentHallEvent.effect.type !== effectType) {
            return 1;
        }
        return this.currentHallEvent.effect.value;
    }

    /**
     * Check and end Event Hall events
     */
    updateHallEvent() {
        if (!this.currentHallEvent) return;

        const now = Date.now();
        if (now >= this.currentHallEvent.endTime) {
            // Award reward stars
            this.stars += this.currentHallEvent.reward;
            this.stats.totalStarsEarned += this.currentHallEvent.reward;

            // Flag for UI notification
            this._hallEventEnded = {
                name: this.currentHallEvent.name,
                emoji: this.currentHallEvent.emoji,
                reward: this.currentHallEvent.reward
            };

            this.currentHallEvent = null;
        }
    }

    /**
     * Check which floor synergies are active
     */
    checkFloorSynergies() {
        const floorTypes = this.floors
            .filter(f => f.status === 'ready')
            .map(f => f.type);

        const newSynergies = [];
        const previousIds = this.activeSynergies.map(s => s.id);

        this.floorSynergies.forEach(synergy => {
            // Check if all required floors are present
            const hasAll = synergy.requires.every(req => floorTypes.includes(req));
            if (hasAll) {
                newSynergies.push(synergy);

                // Notify if newly activated
                if (!previousIds.includes(synergy.id)) {
                    this._newSynergy = synergy;
                }
            }
        });

        this.activeSynergies = newSynergies;
    }

    /**
     * Get synergy bonus for a floor type
     */
    getSynergyBonus(floorType) {
        let bonus = 1;

        this.activeSynergies.forEach(synergy => {
            if (synergy.effect.type === 'star_bonus' &&
                synergy.effect.floors &&
                synergy.effect.floors.includes(floorType)) {
                bonus *= synergy.effect.value;
            }
        });

        return bonus;
    }

    /**
     * Get synergy browse time multiplier
     */
    getSynergyBrowseTime() {
        let multiplier = 1;

        this.activeSynergies.forEach(synergy => {
            if (synergy.effect.type === 'browse_time') {
                multiplier *= synergy.effect.value;
            }
        });

        return multiplier;
    }

    /**
     * Trigger a random cozy micro-event
     */
    triggerCozyEvent() {
        // Pick random event
        const event = this.cozyEvents[Math.floor(Math.random() * this.cozyEvents.length)];

        // Execute effect
        event.effect();

        // Store for notification
        this._cozyEvent = event;

        // Next cozy event in 2-5 minutes
        this.nextCozyEventTime = Date.now() + (120000 + Math.random() * 180000);
    }

    /**
     * Spawn a mini-quest on a random floor
     */
    spawnMiniQuest() {
        const readyFloors = this.floors.filter(f => f.status === 'ready');
        if (readyFloors.length === 0) return;

        // Pick random quest type
        const questType = this.miniQuestTypes[Math.floor(Math.random() * this.miniQuestTypes.length)];

        // Pick random floor
        const floor = readyFloors[Math.floor(Math.random() * readyFloors.length)];

        this.currentMiniQuest = {
            id: this.generateId(),
            type: questType.id,
            name: questType.name,
            emoji: questType.emoji,
            description: questType.description,
            reward: questType.reward,
            rewardBucks: questType.rewardBucks,
            floorId: floor.id,
            x: 0.2 + Math.random() * 0.6, // Position on floor
            y: 0.3 + Math.random() * 0.4,
            startTime: Date.now(),
            expiryTime: Date.now() + 60000 // 60 seconds to complete
        };
    }

    /**
     * Complete the current mini-quest
     */
    completeMiniQuest() {
        if (!this.currentMiniQuest) return;

        // Award rewards
        this.stars += this.currentMiniQuest.reward;
        this.stats.totalStarsEarned += this.currentMiniQuest.reward;

        if (this.currentMiniQuest.rewardBucks > 0) {
            this.towerBucks += this.currentMiniQuest.rewardBucks;
            this.stats.totalTowerBucksEarned += this.currentMiniQuest.rewardBucks;
        }

        // Store for notification
        this._completedMiniQuest = this.currentMiniQuest;

        // Clear quest
        this.currentMiniQuest = null;

        // Next mini-quest in 1-3 minutes
        this.nextMiniQuestTime = Date.now() + (60000 + Math.random() * 120000);
    }

    /**
     * Check and update prestige level
     */
    checkPrestige() {
        const floors = this.floors.length;
        const earned = this.totalStarsEarned;

        let newPrestige = 'community';
        for (const level of this.prestigeLevels) {
            if (floors >= level.minFloors && earned >= level.minStarsEarned) {
                newPrestige = level.id;
            }
        }

        if (newPrestige !== this.currentPrestige) {
            const oldLevel = this.prestigeLevels.find(l => l.id === this.currentPrestige);
            const newLevel = this.prestigeLevels.find(l => l.id === newPrestige);
            this.currentPrestige = newPrestige;
            this._prestigeUpgrade = { from: oldLevel, to: newLevel };
            this.save();
        }
    }

    /**
     * Get current prestige info
     */
    getPrestigeInfo() {
        const current = this.prestigeLevels.find(l => l.id === this.currentPrestige);
        const currentIndex = this.prestigeLevels.findIndex(l => l.id === this.currentPrestige);
        const next = this.prestigeLevels[currentIndex + 1] || null;

        return {
            current,
            next,
            floorsProgress: next ? this.floors.length / next.minFloors : 1,
            starsProgress: next ? this.totalStarsEarned / next.minStarsEarned : 1
        };
    }

    /**
     * Purchase a decoration
     */
    purchaseDecoration(decorationId) {
        const decoration = this.decorations.find(d => d.id === decorationId);
        if (!decoration) return { success: false, error: 'Invalid decoration' };

        if (this.ownedDecorations.includes(decorationId)) {
            return { success: false, error: 'Already owned' };
        }

        // Check prestige requirement
        const prestigeIndex = this.prestigeLevels.findIndex(l => l.id === decoration.unlockPrestige);
        const currentIndex = this.prestigeLevels.findIndex(l => l.id === this.currentPrestige);
        if (currentIndex < prestigeIndex) {
            return { success: false, error: 'Prestige too low' };
        }

        if (this.stars < decoration.cost) {
            return { success: false, error: 'Not enough stars' };
        }

        this.stars -= decoration.cost;
        this.ownedDecorations.push(decorationId);
        this.save();
        return { success: true };
    }

    /**
     * Place a decoration in the lobby
     */
    placeLobbyDecoration(decorationId) {
        const decoration = this.decorations.find(d => d.id === decorationId);
        if (!decoration) return { success: false, error: 'Invalid decoration' };
        if (!this.ownedDecorations.includes(decorationId)) {
            return { success: false, error: 'Decoration not owned' };
        }
        if (decoration.type !== 'lobby') {
            return { success: false, error: 'Not a lobby decoration' };
        }
        if (this.lobbyDecorations.includes(decorationId)) {
            return { success: false, error: 'Already placed in lobby' };
        }

        // Remove from any floor first
        for (const floorId in this.floorDecorations) {
            this.floorDecorations[floorId] = this.floorDecorations[floorId].filter(id => id !== decorationId);
        }

        this.lobbyDecorations.push(decorationId);
        this.save();
        return { success: true };
    }

    /**
     * Remove a decoration from the lobby
     */
    removeLobbyDecoration(decorationId) {
        const index = this.lobbyDecorations.indexOf(decorationId);
        if (index === -1) return { success: false, error: 'Not in lobby' };

        this.lobbyDecorations.splice(index, 1);
        this.save();
        return { success: true };
    }

    /**
     * Place a decoration on a floor
     */
    placeFloorDecoration(floorId, decorationId) {
        const decoration = this.decorations.find(d => d.id === decorationId);
        if (!decoration) return { success: false, error: 'Invalid decoration' };
        if (!this.ownedDecorations.includes(decorationId)) {
            return { success: false, error: 'Decoration not owned' };
        }
        if (decoration.type !== 'floor') {
            return { success: false, error: 'Not a floor decoration' };
        }

        const floor = this.getFloor(floorId);
        if (!floor) return { success: false, error: 'Invalid floor' };

        // Initialize floor decorations array if needed
        if (!this.floorDecorations[floorId]) {
            this.floorDecorations[floorId] = [];
        }

        // Check if already on this floor
        if (this.floorDecorations[floorId].includes(decorationId)) {
            return { success: false, error: 'Already on this floor' };
        }

        // Check limit (2 per floor)
        if (this.floorDecorations[floorId].length >= 2) {
            return { success: false, error: 'Floor is full (max 2)' };
        }

        // Remove from lobby and other floors first
        this.lobbyDecorations = this.lobbyDecorations.filter(id => id !== decorationId);
        for (const fId in this.floorDecorations) {
            if (fId !== floorId) {
                this.floorDecorations[fId] = this.floorDecorations[fId].filter(id => id !== decorationId);
            }
        }

        this.floorDecorations[floorId].push(decorationId);
        this.save();
        return { success: true };
    }

    /**
     * Remove a decoration from a floor
     */
    removeFloorDecoration(floorId, decorationId) {
        if (!this.floorDecorations[floorId]) {
            return { success: false, error: 'No decorations on floor' };
        }

        const index = this.floorDecorations[floorId].indexOf(decorationId);
        if (index === -1) return { success: false, error: 'Not on this floor' };

        this.floorDecorations[floorId].splice(index, 1);
        this.save();
        return { success: true };
    }

    /**
     * Get all unplaced decorations
     */
    getUnplacedDecorations() {
        const placedIds = new Set([
            ...this.lobbyDecorations,
            ...Object.values(this.floorDecorations).flat()
        ]);

        return this.ownedDecorations.filter(id => !placedIds.has(id));
    }

    /**
     * Purchase a floor theme
     */
    purchaseTheme(themeId) {
        const theme = this.floorThemes.find(t => t.id === themeId);
        if (!theme) return { success: false, error: 'Invalid theme' };

        if (this.unlockedThemes.includes(themeId)) {
            return { success: false, error: 'Already owned' };
        }

        // Check prestige requirement
        const prestigeIndex = this.prestigeLevels.findIndex(l => l.id === theme.unlockPrestige);
        const currentIndex = this.prestigeLevels.findIndex(l => l.id === this.currentPrestige);
        if (currentIndex < prestigeIndex) {
            return { success: false, error: 'Prestige too low' };
        }

        if (this.stars < theme.cost) {
            return { success: false, error: 'Not enough stars' };
        }

        this.stars -= theme.cost;
        this.unlockedThemes.push(themeId);
        this.save();
        return { success: true };
    }

    /**
     * Set active theme
     */
    setActiveTheme(themeId) {
        if (!this.unlockedThemes.includes(themeId)) {
            return { success: false, error: 'Theme not unlocked' };
        }
        this.activeTheme = themeId;
        this.save();
        return { success: true };
    }

    /**
     * Purchase a reader perk
     */
    purchasePerk(perkId) {
        const perk = this.readerPerks.find(p => p.id === perkId);
        if (!perk) return { success: false, error: 'Invalid perk' };

        if (this.unlockedPerks.includes(perkId)) {
            return { success: false, error: 'Already owned' };
        }

        if (this.stars < perk.cost) {
            return { success: false, error: 'Not enough stars' };
        }

        this.stars -= perk.cost;
        this.unlockedPerks.push(perkId);
        this.save();
        return { success: true };
    }

    /**
     * Trade Tower Bucks for stars
     */
    tradeBucksForStars(amount = 1) {
        if (this.towerBucks < amount) {
            return { success: false, error: 'Not enough Tower Bucks' };
        }

        const starsPerBuck = 100;
        const starsGained = amount * starsPerBuck;

        this.towerBucks -= amount;
        this.stars += starsGained;
        this.save();

        return { success: true, starsGained };
    }

    /**
     * Purchase additional offline earning time with Tower Bucks
     * Each purchase adds 1 hour to the offline cap (permanently)
     */
    purchaseOfflineTime(hours = 1) {
        const costPerHour = 25; // 25 Tower Bucks per hour
        const totalCost = hours * costPerHour;

        if (this.towerBucks < totalCost) {
            return { success: false, error: 'Not enough Tower Bucks' };
        }

        this.towerBucks -= totalCost;
        this.offlineTimeBonus = (this.offlineTimeBonus || 0) + hours;
        this.save();

        const totalHours = 3 + this.offlineTimeBonus;
        return { success: true, hoursAdded: hours, totalHours };
    }

    /**
     * Purchase a staff upgrade
     */
    purchaseUpgrade(upgradeId) {
        const upgrade = this.staffUpgrades.find(u => u.id === upgradeId);
        if (!upgrade) return { success: false, error: 'Invalid upgrade' };

        if (this.purchasedUpgrades.includes(upgradeId)) {
            return { success: false, error: 'Already purchased' };
        }

        // Check if previous level is purchased (for tiered upgrades)
        if (upgrade.level > 1) {
            const prevLevel = this.staffUpgrades.find(u =>
                u.effect.type === upgrade.effect.type && u.level === upgrade.level - 1
            );
            if (prevLevel && !this.purchasedUpgrades.includes(prevLevel.id)) {
                return { success: false, error: 'Need previous level first' };
            }
        }

        if (this.stars < upgrade.cost) {
            return { success: false, error: 'Not enough stars' };
        }

        this.stars -= upgrade.cost;
        this.purchasedUpgrades.push(upgradeId);
        this.save();
        return { success: true };
    }

    /**
     * Get active perk effects
     */
    getPerkEffect(effectType) {
        let totalEffect = 1;
        for (const perkId of this.unlockedPerks) {
            const perk = this.readerPerks.find(p => p.id === perkId);
            if (perk && perk.effect.type === effectType) {
                totalEffect *= perk.effect.value;
            }
        }
        return totalEffect;
    }

    /**
     * Get active upgrade effects
     */
    getUpgradeEffect(effectType) {
        let bestEffect = 1;
        for (const upgradeId of this.purchasedUpgrades) {
            const upgrade = this.staffUpgrades.find(u => u.id === upgradeId);
            if (upgrade && upgrade.effect.type === effectType) {
                bestEffect = Math.max(bestEffect, upgrade.effect.value);
            }
        }
        return bestEffect;
    }

    /**
     * Check and unlock achievements
     */
    checkAchievements() {
        const newlyUnlocked = [];

        this.achievements.forEach(achievement => {
            if (!achievement.unlocked && this.stats[achievement.stat] >= achievement.requirement) {
                achievement.unlocked = true;
                achievement.unlockedAt = Date.now();

                // Award rewards
                this.stars += achievement.reward;
                this.stats.totalStarsEarned += achievement.reward;

                if (achievement.rewardBucks > 0) {
                    this.towerBucks += achievement.rewardBucks;
                    this.stats.totalTowerBucksEarned += achievement.rewardBucks;
                }

                newlyUnlocked.push(achievement);
            }
        });

        return newlyUnlocked;
    }

    /**
     * Upgrade a floor (increases capacity and earning rate)
     */
    upgradeFloor(floorId) {
        const floor = this.getFloor(floorId);
        if (!floor || floor.status !== 'ready') {
            return { success: false, error: 'Floor not ready' };
        }

        if (floor.upgradeLevel >= 3) {
            return { success: false, error: 'Floor already at max level' };
        }

        // Calculate upgrade cost (exponential: 200, 500, 1000...)
        const upgradeCosts = [0, 200, 500];
        const cost = upgradeCosts[floor.upgradeLevel];

        if (this.stars < cost) {
            return { success: false, error: 'Not enough stars' };
        }

        // Deduct cost
        this.stars -= cost;

        // Upgrade floor
        floor.upgradeLevel += 1;

        // Increase stock capacity and earning rate
        const multiplier = floor.upgradeLevel === 2 ? 1.25 : 1.5; // +25% or +50%
        floor.bookStock.forEach(cat => {
            const floorType = this.floorTypes.find(t => t.id === floor.typeId);
            const originalCat = floorType.bookCategories.find(c => c.name === cat.name);

            cat.maxStock = Math.floor(originalCat.stockAmount * multiplier);
            cat.earningRate = Math.floor(originalCat.earningRate * multiplier);
        });

        this.save();
        return { success: true, level: floor.upgradeLevel };
    }

    /**
     * Check daily login and award streak bonus
     */
    checkDailyLogin() {
        const today = new Date().toDateString();

        if (this.dailyLogin.lastLoginDate === today) {
            // Already logged in today
            return null;
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        // Check streak
        if (this.dailyLogin.lastLoginDate === yesterdayStr) {
            // Consecutive day - increment streak
            this.dailyLogin.streak += 1;
        } else if (this.dailyLogin.lastLoginDate !== null) {
            // Streak broken - reset
            this.dailyLogin.streak = 1;
        } else {
            // First login ever
            this.dailyLogin.streak = 1;
        }

        this.dailyLogin.lastLoginDate = today;

        // Calculate reward based on streak
        const dayRewards = {
            1: { stars: 50, bucks: 0 },
            2: { stars: 75, bucks: 0 },
            3: { stars: 100, bucks: 0 },
            4: { stars: 125, bucks: 0 },
            5: { stars: 150, bucks: 0 },
            6: { stars: 200, bucks: 1 },
            7: { stars: 300, bucks: 2 }
        };

        const day = Math.min(this.dailyLogin.streak, 7);
        const reward = dayRewards[day];

        // Award reward
        this.stars += reward.stars;
        this.stats.totalStarsEarned += reward.stars;

        if (reward.bucks > 0) {
            this.towerBucks += reward.bucks;
            this.stats.totalTowerBucksEarned += reward.bucks;
        }

        this.dailyLogin.lastRewardClaimed = Date.now();
        this.save();

        return {
            day: this.dailyLogin.streak,
            stars: reward.stars,
            bucks: reward.bucks
        };
    }

    /**
     * Track reader in collection
     */
    trackReaderInCollection(reader) {
        const typeId = reader.type === 'vip' ? reader.vipType : reader.type;

        if (!this.readerCollection[typeId]) {
            this.readerCollection[typeId] = {
                count: 0,
                firstSeen: Date.now(),
                lastSeen: Date.now()
            };
        }

        this.readerCollection[typeId].count += 1;
        this.readerCollection[typeId].lastSeen = Date.now();
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
        if (!this._recentArrivals) this._recentArrivals = [];

        this.readers.forEach(reader => {
            if (reader.elevatorState === 'waiting' && now >= reader.elevatorArrivalTime) {
                reader.elevatorState = 'arrived';

                // Track arrival for sparkle effect
                this._recentArrivals.push({
                    floorId: reader.floorId
                });
            }
        });

        // Process readers checking out
        if (!this._recentCheckouts) this._recentCheckouts = [];

        this.readers = this.readers.filter(reader => {
            if (now >= reader.checkoutTime) {
                const floor = this.getFloor(reader.floorId);
                if (floor && floor.bookStock[reader.categoryIndex]) {
                    // Consume books (1-3)
                    const booksCheckedOut = reader.booksToCheckout || 1;
                    floor.bookStock[reader.categoryIndex].currentStock -= booksCheckedOut;

                    // Apply event star multiplier (multiply by books checked out)
                    const starMultiplier = this.getEventEffect('star_multiplier');
                    let finalEarnings = Math.floor(reader.earningAmount * booksCheckedOut * starMultiplier);

                    // Apply Event Hall star bonus
                    const hallBonus = this.getHallEventEffect('star_bonus');
                    finalEarnings = Math.floor(finalEarnings * hallBonus);

                    // Apply floor synergy bonus
                    const synergyBonus = this.getSynergyBonus(floor.type);
                    finalEarnings = Math.floor(finalEarnings * synergyBonus);

                    // Apply mood bonus (high mood = bonus stars)
                    if (this.mood >= 70) {
                        const moodBonus = Math.floor(finalEarnings * 0.25); // 25% bonus
                        finalEarnings += moodBonus;
                    } else if (this.mood < 30) {
                        // Low mood = reduced earnings
                        finalEarnings = Math.floor(finalEarnings * 0.75); // 25% penalty
                    }

                    // Apply trash penalty (high trash = reduced earnings)
                    if (floor.trash >= 50) {
                        const trashPenalty = 1 - (floor.trash - 50) / 100; // Up to 50% penalty at 100 trash
                        finalEarnings = Math.floor(finalEarnings * trashPenalty);
                    }

                    // Apply perk earning bonus
                    const perkBonus = this.getPerkEffect('earning_bonus');
                    finalEarnings = Math.floor(finalEarnings * perkBonus);

                    // Apply holiday star bonus
                    const holidayBonus = this.getHolidayStarBonus();
                    finalEarnings = Math.floor(finalEarnings * holidayBonus);

                    // Apply library card bonus
                    if (reader.hasLibraryCard) {
                        const cardBonus = this.getLibraryCardBonus(reader.name);
                        finalEarnings = Math.floor(finalEarnings * cardBonus.starBonus);
                        // Update card holder stats
                        this.updateLibraryCardStars(reader.name, finalEarnings);
                    }

                    // Earn stars
                    this.stars += finalEarnings;

                    // Earn XP
                    this.xp += finalEarnings;

                    // Award bonus Tower Bucks during reading challenge
                    if (this.shouldAwardBonusBucks() && Math.random() < 0.2) { // 20% chance
                        this.towerBucks += 1;
                        this.stats.totalTowerBucksEarned += 1;
                    }

                    // High mood can trigger tips
                    if (this.mood >= 80 && Math.random() < 0.05) { // 5% chance when very happy
                        this.towerBucks += 1;
                        this.stats.totalTowerBucksEarned += 1;
                        this._moodTip = true; // Flag for UI notification
                    }

                    // Track checkout for particle effects
                    this._recentCheckouts.push({
                        floorId: reader.floorId,
                        stars: finalEarnings,
                        isVIP: reader.type === 'vip'
                    });

                    // Update stats
                    this.stats.totalBooksCheckedOut += booksCheckedOut;
                    this.stats.totalStarsEarned += finalEarnings;
                    this.stats.totalReadersServed += 1;

                    // Track reader in collection
                    this.trackReaderInCollection(reader);

                    // Generate trash from reader visit
                    if (floor.trash !== undefined) {
                        let trashAmount = 1; // Base trash per checkout

                        // Bathrooms reduce trash generation
                        const bathroomCount = this.floors.filter(f =>
                            f.typeId === 'bathroom' && f.status === 'ready'
                        ).length;
                        if (bathroomCount > 0) {
                            trashAmount *= Math.pow(0.7, bathroomCount); // 30% reduction per bathroom
                        }

                        floor.trash = Math.min(100, floor.trash + trashAmount);
                    }

                    // Register or update regular customer
                    this.registerRegularCustomer(reader);

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

        // Check rush hour status
        this.checkRushHour();

        // Spawn new readers with increased rate during rush hour and events
        let spawnChance = 0.10; // Base 10% chance
        if (this.transitSchedule.isRushHour) {
            spawnChance = 0.40; // 40% during rush hour = 4x more readers!
        }

        // Apply event spawn rate multiplier
        spawnChance *= this.getEventEffect('spawn_rate');

        // Apply Event Hall spawn bonus
        spawnChance *= this.getHallEventEffect('spawn_bonus');

        // Apply mood effect on spawn rate
        if (this.mood >= 70) {
            spawnChance *= 1.25; // 25% more visitors when happy
        } else if (this.mood < 30) {
            spawnChance *= 0.5; // 50% fewer visitors when sad
        }

        // Apply weather effect on spawn rate
        spawnChance *= this.getWeatherSpawnEffect();

        // Apply holiday spawn bonus
        spawnChance *= this.getHolidaySpawnBonus();

        if (Math.random() < spawnChance) {
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

        // Generate new special event if it's time and no active event
        if (!this.currentEvent && now >= this.nextEventTime) {
            this.generateEvent();
        }

        // Check event expiry
        if (this.currentEvent && now >= this.currentEvent.endTime) {
            this.currentEvent = null;
            // Next event in 3-8 minutes
            this.nextEventTime = now + (180000 + Math.random() * 300000);
        }

        // Generate find mission if it's time
        if (!this.currentFindMission && now >= this.nextFindMissionTime) {
            this.generateFindMission();
        }

        // Check find mission expiry
        if (this.currentFindMission && now >= this.currentFindMission.expiryTime) {
            this.currentFindMission = null;
            // Next find mission in 2-4 minutes
            this.nextFindMissionTime = now + (120000 + Math.random() * 120000);
        }

        // Spawn special visitor if it's time
        if (this.specialVisitors.length === 0 && now >= this.nextSpecialVisitorTime) {
            this.spawnSpecialVisitor();
        }

        // Update special visitors
        this.specialVisitors = this.specialVisitors.filter(visitor => {
            if (now >= visitor.endTime) {
                // Visitor is leaving
                this._departingVisitor = visitor;

                // Apply inspector bonus based on actual tidiness
                if (visitor.type === 'inspector') {
                    const bonus = this.getInspectorBonus();
                    this.stars += bonus;
                    this.stats.totalStarsEarned += bonus;
                    this._inspectorBonus = bonus;
                }

                return false;
            }

            // Update visitor floor position occasionally
            if (now >= visitor.nextMoveTime) {
                visitor.currentFloorIndex = Math.floor(Math.random() * this.floors.length);
                visitor.nextMoveTime = now + 5000 + Math.random() * 10000; // Move every 5-15 seconds
            }

            return true;
        });

        // Update weather
        this.updateWeather();

        // Update seasons and holidays
        this.updateSeasonAndHoliday();

        // Update mood meter
        this.updateMood();

        // Run continuous cleaning (custodians clean throughout the day)
        this.runContinuousCleaning();

        // Check for random incidents (power outages, floods, etc.)
        this.checkIncidents();

        // Check for night cleaning (when day changes) - bonus deep clean
        const currentDay = this.getGameDay();
        if (currentDay > this.lastCleanedDay) {
            this.runNightCleaning();
            this.lastCleanedDay = currentDay;
        }

        // Check for Event Hall events
        this.checkEventHallEvent();
        this.updateHallEvent();

        // Check for book donations
        this.checkBookDonation();

        // Check floor synergies
        this.checkFloorSynergies();

        // Sync totalStarsEarned with stats and check prestige
        this.totalStarsEarned = this.stats.totalStarsEarned;
        this.checkPrestige();

        // Trigger cozy micro-events
        if (now >= this.nextCozyEventTime && this.floors.length > 0) {
            this.triggerCozyEvent();
        }

        // Spawn mini-quest if it's time
        if (!this.currentMiniQuest && now >= this.nextMiniQuestTime && this.floors.length > 0) {
            this.spawnMiniQuest();
        }

        // Check mini-quest expiry
        if (this.currentMiniQuest && now >= this.currentMiniQuest.expiryTime) {
            this.currentMiniQuest = null;
            this.nextMiniQuestTime = now + (60000 + Math.random() * 120000);
        }

        // Update time played stat (every tick = 1 second)
        this.stats.timePlayed += 1;

        // Check for newly unlocked achievements
        const newAchievements = this.checkAchievements();
        if (newAchievements.length > 0) {
            // Store for UI notification
            this._newAchievements = newAchievements;
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
            currentMission: this.currentMission,
            missionHistory: this.missionHistory,
            nextMissionTime: this.nextMissionTime,
            currentEvent: this.currentEvent,
            nextEventTime: this.nextEventTime,
            currentFindMission: this.currentFindMission,
            nextFindMissionTime: this.nextFindMissionTime,
            stats: this.stats,
            achievements: this.achievements,
            dailyLogin: this.dailyLogin,
            readerCollection: this.readerCollection,
            currentPrestige: this.currentPrestige,
            ownedDecorations: this.ownedDecorations,
            lobbyDecorations: this.lobbyDecorations,
            floorDecorations: this.floorDecorations,
            unlockedThemes: this.unlockedThemes,
            activeTheme: this.activeTheme,
            unlockedPerks: this.unlockedPerks,
            purchasedUpgrades: this.purchasedUpgrades,
            offlineTimeBonus: this.offlineTimeBonus,
            totalStarsEarned: this.totalStarsEarned,
            lastCleanedDay: this.lastCleanedDay,
            lastEventHallDay: this.lastEventHallDay,
            currentHallEvent: this.currentHallEvent,
            weather: this.weather,
            nextDonationTime: this.nextDonationTime,
            libraryCards: this.libraryCards,
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
                this.currentEvent = data.currentEvent || null;
                this.nextEventTime = data.nextEventTime || (Date.now() + 300000);
                this.currentFindMission = data.currentFindMission || null;
                this.nextFindMissionTime = data.nextFindMissionTime || (Date.now() + 120000);

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

                // Load achievements (merge with defaults to add new ones)
                if (data.achievements) {
                    this.achievements.forEach((defaultAchievement, index) => {
                        const savedAchievement = data.achievements.find(a => a.id === defaultAchievement.id);
                        if (savedAchievement) {
                            this.achievements[index] = { ...defaultAchievement, ...savedAchievement };
                        }
                    });
                }

                // Load daily login
                if (data.dailyLogin) {
                    this.dailyLogin = data.dailyLogin;
                }

                // Load reader collection
                if (data.readerCollection) {
                    this.readerCollection = data.readerCollection;
                }

                // Load progression system data
                this.currentPrestige = data.currentPrestige || 'community';
                this.ownedDecorations = data.ownedDecorations || [];
                this.lobbyDecorations = data.lobbyDecorations || [];
                this.floorDecorations = data.floorDecorations || {};
                this.unlockedThemes = data.unlockedThemes || ['classic'];
                this.activeTheme = data.activeTheme || 'classic';
                this.unlockedPerks = data.unlockedPerks || [];
                this.purchasedUpgrades = data.purchasedUpgrades || [];
                this.offlineTimeBonus = data.offlineTimeBonus || 0;
                this.totalStarsEarned = data.totalStarsEarned || this.stats.totalStarsEarned || 0;

                // Load cleaning system state
                this.lastCleanedDay = data.lastCleanedDay || 0;

                // Load Event Hall system state
                this.lastEventHallDay = data.lastEventHallDay || 0;
                this.currentHallEvent = data.currentHallEvent || null;

                // Load weather system state
                if (data.weather) {
                    this.weather.current = data.weather.current || 'sunny';
                    this.weather.nextChange = data.weather.nextChange || (Date.now() + (5 * 60 * 1000));
                }

                // Load donation time
                this.nextDonationTime = data.nextDonationTime || (Date.now() + (2 * 60 * 1000));

                // Load library cards
                this.libraryCards = data.libraryCards || [];

                // Migrate old floors to have staff array, upgradeLevel, and trash if missing
                this.floors.forEach(floor => {
                    if (!floor.staff) {
                        floor.staff = [];
                    }
                    if (!floor.upgradeLevel) {
                        floor.upgradeLevel = 1;
                    }
                    if (floor.trash === undefined) {
                        floor.trash = 0;
                    }
                });

                // Ensure basement exists (auto-create or migrate)
                this.ensureBasement();

                // Process any time-based events that happened while offline
                this.processOfflineProgress(data.timestamp);

                // Update season and holiday immediately on load
                this.updateSeasonAndHoliday();
            } catch (e) {
                console.error('Failed to load save:', e);
                this.initializeNewGame();
            }
        } else {
            this.initializeNewGame();
        }

        // Always update season/holiday on load (for new games too)
        this.updateSeasonAndHoliday();
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

        // CAP offline earnings at 3 hours base + any purchased bonus hours
        const baseOfflineHours = 3;
        const totalOfflineHours = baseOfflineHours + (this.offlineTimeBonus || 0);
        const MAX_OFFLINE_TIME = totalOfflineHours * 60 * 60 * 1000;
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
     * Ensure basement exists (auto-created, not buildable)
     */
    ensureBasement() {
        // Check if basement already exists
        if (this.floors.some(f => f.typeId === 'basement')) {
            // Migrate existing basement to position 0
            const basement = this.floors.find(f => f.typeId === 'basement');
            basement.floorNumber = 0;
            return;
        }

        // Create basement automatically
        const basementType = this.floorTypes.find(t => t.id === 'basement');
        if (!basementType) return;

        const basement = {
            id: this.generateId(),
            floorNumber: 0,
            typeId: 'basement',
            name: basementType.name,
            emoji: basementType.emoji,
            color: basementType.color,
            status: 'ready', // Basement starts ready
            buildStartTime: Date.now(),
            buildEndTime: Date.now(),
            upgradeLevel: 1,
            staff: [], // No staff initially - need to hire
            bookStock: [],
            trash: 0
        };

        this.floors.push(basement);
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

        // Auto-create basement
        this.ensureBasement();

        // Build starter floor (Board Books - cheapest!)
        this.buildFloor('board_books');
        // Instantly complete it for tutorial
        const starterFloor = this.floors.find(f => f.typeId === 'board_books');
        if (starterFloor) {
            starterFloor.status = 'ready';
            starterFloor.buildEndTime = Date.now();
        }
        // Give back the cost so player starts with 1000 stars + one free floor
        this.stars = 1000;

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
