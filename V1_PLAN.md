# SimLibrary v1 Plan

## Core Features (v1)

### Core Loop
| Feature | Description |
|---------|-------------|
| Floors & building | Build different floor types for your library tower |
| Stars (currency) | Main currency earned from readers |
| Book stocking | Stock books on floors, restock when depleted |
| Readers visiting | Readers arrive, browse, and earn you stars |
| Staff system | Hire and assign staff to floors |
| Missions | Tasks that give players direction and rewards |
| XP/Levels | Progression system that unlocks new floor types |
| Basic stats | Track total stars, readers served, books checked out |

### Polish Features (Keep)
| Feature | Description |
|---------|-------------|
| Book donations | Random free stock events - nice surprise moments |
| Cleaning system | Simple overnight maintenance |
| Mood system | Feedback on overall library health |

---

## Future Updates Roadmap

### Update 1.1 - Weather
- Weather system (sunny, cloudy, rainy, stormy, snowy)
- Affects visitor spawn rates (bad weather = more visitors)
- Better UI showing current weather and forecast
- Needs refinement from original implementation

### Update 1.2 - Events
- Rush hour system (transit arrivals)
- Book Sale events (bonus earnings periods)
- Gives players exciting moments to anticipate

### Update 1.3 - Seasons & Holidays
- Seasonal content tied to real calendar
- Holiday events (Summer Reading, Halloween, Winter Holidays, etc.)
- Timely updates keep players coming back

### Update 1.4 - Special Visitors
- VIPs and famous authors
- Special visitor types with unique bonuses
- Adds surprise/delight moments

### Update 1.5 - Library Cards
- Regular patron system
- Returning customers who visit frequently
- Loyalty bonuses for repeat visitors

### Update 1.6 - Reader Collection
- Collectible reader types
- Track which reader types you've served
- Completionist content

### Update 1.7 - Achievements
- Achievement system with milestones
- Rewards for hitting goals
- Classic retention feature

### Update 1.8 - Floor Synergies
- Bonuses for building certain floor combinations
- Strategic depth for engaged players
- Needs proper UI showing active/available synergies

### Update 1.9 - Customization
- Decorations (floor and lobby)
- Themes/skins for floors
- Requires visual implementation work

### Update 2.0 - Prestige
- Endgame prestige system
- Reset with bonuses for dedicated players
- Late-game content

---

## Cut from v1 (Code to Remove)

- [ ] Floor synergies (`floorSynergies`, `activeSynergies`, `checkFloorSynergies()`)
- [ ] Decorations (`decorations`, `ownedDecorations`, `lobbyDecorations`, `floorDecorations`)
- [ ] Themes (`floorThemes`, `unlockedThemes`, `activeTheme`)
- [ ] Weather system (`weather`, `updateWeather()`, `getCurrentWeather()`)
- [ ] Rush hour / Transit (`transitSchedule`)
- [ ] Book Sale events (`bookSale`)
- [ ] Seasons & holidays (`seasons`)
- [ ] Library cards (`libraryCards`, `cardBenefits`)
- [ ] Event Hall (`hallEventTypes`, `currentHallEvent`)
- [ ] Special visitors (`specialVisitors`, `specialVisitorTypes`)
- [ ] VIPs (`vipTypes`, `arrivingVIPs`)
- [ ] Reader collection (`readerCollection`)
- [ ] Achievements (`achievements`)
- [ ] Mini quests (`miniQuestTypes`, `currentMiniQuest`)
- [ ] Find missions (`currentFindMission`, `findMissionItems`)
- [ ] Cozy events (`cozyEvents`)
- [ ] Prestige (`prestigeLevels`, `currentPrestige`)
- [ ] Reader perks (`readerPerks`, `unlockedPerks`)
- [ ] towerBucks (premium currency) - unless monetizing
- [ ] Staff upgrades (`staffUpgrades`, `purchasedUpgrades`)
- [ ] Offline time bonus (`offlineTimeBonus`)

---

## v1 Summary

**What players do:**
1. Build floors for their library tower
2. Stock books on each floor
3. Hire staff and assign them to floors
4. Watch readers arrive and earn stars
5. Complete missions for bonus rewards
6. Level up to unlock new floor types
7. Repeat and grow their tower

**What makes it feel good:**
- Satisfying core loop of build → stock → earn → expand
- Staff with dream floor matching adds light strategy
- Missions give direction and goals
- Book donations add surprise moments
- Mood system provides feedback
- Sound effects for actions (already implemented)
