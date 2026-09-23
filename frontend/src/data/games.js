export const GAMES = [
  {
    id: 'cyber-pong',
    title: 'CYBER PONG',
    slug: 'cyber-pong',
    tagline: 'High-octane neon cyber table tennis with powerups & kinetic physics.',
    description: 'Face off in a duel of light and velocity. Defend your goal line, angle your returns, and collect glowing powerups like Multi-Ball, Hyper Paddle, and Shield Barriers to dominate your opponent.',
    category: 'arcade',
    multiplayer: true,
    playerCount: '1 - 2 Players',
    multiplayerMode: 'Real-Time 1v1 Online & Solo vs AI',
    difficulty: 'Medium',
    rating: 4.9,
    featured: true,
    imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80',
    controls: 'Desktop: [W/S] or [Arrow Up/Down] | Mobile: Touch & Drag paddle vertically',
    rules: [
      'First player to reach 7 points wins the match.',
      'Hit the ball with paddle edges for fast angular returns.',
      'Intercept floating capsules to activate Multi-Ball, Laser Paddle, or Speed surges.'
    ]
  },
  {
    id: 'neon-drift',
    title: 'NEON DRIFT',
    slug: 'neon-drift',
    tagline: 'High-speed arcade cyber circuit racing with hyper-drift physics.',
    description: 'Burn synthetic rubber across a neon-lit cyberpunk racetrack. Master the art of the drift around hairpin turns, trigger boost pads, and cross the finish line first across 3 laps.',
    category: 'racing',
    multiplayer: true,
    playerCount: '1 - 4 Players',
    multiplayerMode: 'Real-Time Multiplayer & Solo Time Trial',
    difficulty: 'Hard',
    rating: 4.8,
    featured: true,
    imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
    controls: 'Desktop: [Arrow Keys / WASD] to steer & accelerate | Mobile: On-screen touch pads',
    rules: [
      'Race through all 4 checkpoints in sequence across 3 laps.',
      'Drive over glowing yellow boost pads for hyper-speed bursts.',
      'Fastest driver across the finish line takes the podium.'
    ]
  },
  {
    id: 'battle-grid',
    title: 'BATTLE GRID',
    slug: 'battle-grid',
    tagline: 'Tactical arena bomb battles with destructible cyber crates.',
    description: 'Navigate a grid matrix, deploy timed pulse charges to blast through barriers, collect firepower and speed upgrades, and trap your rivals to be the last survivor standing.',
    category: 'strategy',
    multiplayer: true,
    playerCount: '1 - 4 Players',
    multiplayerMode: 'Battle Royale & Local Survival',
    difficulty: 'Medium',
    rating: 4.9,
    featured: true,
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80',
    controls: 'Desktop: [WASD / Arrows] Move + [Spacebar] Deploy Bomb | Mobile: Virtual D-Pad + Bomb button',
    rules: [
      'Drop bombs to destroy crates and reveal powerups.',
      'Blast wave travels in 4 directions. Keep clear of the blast wave!',
      'Collect Fire upgrades for larger explosions and Bomb upgrades for multiple charges.'
    ]
  },
  {
    id: 'space-raiders',
    title: 'SPACE RAIDERS',
    slug: 'space-raiders',
    tagline: 'Co-op bullet-hell alien invasion defender.',
    description: 'Pilot your neon interceptor starships. Shoot down descending alien formations, dodge enemy plasma fire, and clear increasingly chaotic waves.',
    category: 'action',
    multiplayer: true,
    playerCount: '1 - 2 Players Co-Op',
    multiplayerMode: 'Real-Time Co-Op & Solo Campaign',
    difficulty: 'Medium',
    rating: 4.7,
    featured: false,
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    controls: 'Desktop: [A/D or Arrows] Move + [Spacebar] Shoot | Mobile: Touch Slider + Fire button',
    rules: [
      'Shoot down alien swarms before they reach the bottom defense line.',
      'Each player has 3 lives. Cooperate to achieve the highest combined score.',
      'Top-tier alien command ships require multiple precision hits.'
    ]
  },
  {
    id: 'color-clash',
    title: 'COLOR CLASH',
    slug: 'color-clash',
    tagline: 'Fast-paced territory painting frenzy in a neon arena.',
    description: 'Glide across the battle floor painting tiles in your signature neon hue. Use power dashes to capture territory and overwrite opponent zones before the 45-second timer runs out.',
    category: 'action',
    multiplayer: true,
    playerCount: '1 - 4 Players',
    multiplayerMode: 'Real-Time Territory War',
    difficulty: 'Easy',
    rating: 4.8,
    featured: false,
    imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80',
    controls: 'Desktop: [WASD / Arrows] Move + [Space] Power Dash | Mobile: Joystick + Dash button',
    rules: [
      'Every tile you glide over is claimed by your color.',
      'Press Dash to double your speed and paint surrounding tiles for a brief burst.',
      'When the round concludes, the player with the most tiles wins.'
    ]
  },
  {
    id: 'word-blitz',
    title: 'WORD BLITZ',
    slug: 'word-blitz',
    tagline: 'Fast-paced cyber anagram word unscrambler challenge.',
    description: 'Form valid words from glowing holographic letter matrices under time pressure. Chain consecutive words for massive combo streak multipliers.',
    category: 'strategy',
    multiplayer: true,
    playerCount: '1 - 4 Players',
    multiplayerMode: 'Speed Word Battle',
    difficulty: 'Medium',
    rating: 4.6,
    imageUrl: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&w=600&q=80',
    controls: 'Click / Tap letter tiles to form words + [Enter / Submit]',
    rules: [
      'Click or type letters from your available rack to spell words (3-7 letters).',
      'Earn points based on word length and speed multiplier.',
      'Score as many points as possible before the 60-second timer expires.'
    ]
  },
  {
    id: 'mini-golf-chaos',
    title: 'MINI GOLF CHAOS',
    slug: 'mini-golf-chaos',
    tagline: 'Physics-based neon mini golf with dynamic hazards.',
    description: 'Putt your glowing orb across floating cyber greens, banking shots off neon bumpers to sink the ball in the fewest strokes.',
    category: 'arcade',
    multiplayer: true,
    playerCount: '1 - 4 Players',
    multiplayerMode: 'Stroke Play Challenge',
    difficulty: 'Easy',
    rating: 4.5,
    imageUrl: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=600&q=80',
    controls: 'Click/Touch & Drag back from ball to aim angle & power, release to shoot!',
    rules: [
      'Drag and release to aim direction and stroke power.',
      'Bank off walls to avoid hazard gaps.',
      'Sink the ball into the glowing cup in the fewest strokes.'
    ]
  },
  {
    id: 'tank-arena',
    title: 'TANK ARENA 2099',
    slug: 'tank-arena',
    tagline: 'Ricochet laser tanks in a tight tactical maze.',
    description: 'Armored hover-tanks firing bouncing particle shells in a high-tech labyrinth. Use ricochets around corners to eliminate enemy tanks.',
    category: 'action',
    multiplayer: true,
    playerCount: '1 - 4 Players',
    multiplayerMode: 'Deathmatch Duel',
    difficulty: 'Medium',
    rating: 4.7,
    imageUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=600&q=80',
    controls: 'Desktop: [WASD / Arrows] to Drive + [Space / Click] to Shoot | Mobile: Virtual D-Pad + Fire button',
    rules: [
      'Drive around metal barriers and aim at enemy tanks.',
      'Laser shells bounce up to 2 times off walls.',
      'Deplete the opponent tank’s health armor to win the match.'
    ]
  },
  {
    id: 'pixel-soccer',
    title: 'PIXEL SOCCER',
    slug: 'pixel-soccer',
    tagline: 'Chaotic 1v1 physics soccer with rocket shots & goal explosions.',
    description: 'Fast-paced miniature cyber stadium soccer with oversized bouncy physics. Score spectacular bicycle kicks and curved shots into the goal net.',
    category: 'arcade',
    multiplayer: true,
    playerCount: '1 - 2 Players',
    multiplayerMode: '1v1 Soccer Duel',
    difficulty: 'Easy',
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80',
    controls: 'Desktop: [WASD / Arrows] Move & Jump + [Space] Power Kick | Mobile: Touch buttons',
    rules: [
      'Maneuver your cyber player to tackle and strike the bouncy soccer ball.',
      'First player to score 5 goals wins the match.',
      'Perform jumping headers to lob the ball over the goalkeeper.'
    ]
  },
  {
    id: 'treasure-rush',
    title: 'TREASURE RUSH',
    slug: 'treasure-rush',
    tagline: 'Gold collection frenzy in collapsing cyber dungeons.',
    description: 'Collect rubies, gold coins, and legendary power diamonds while outrunning patrol sentinels in an ancient high-tech temple.',
    category: 'arcade',
    multiplayer: true,
    playerCount: '1 - 4 Players',
    multiplayerMode: 'Gem Scramble',
    difficulty: 'Medium',
    rating: 4.5,
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    controls: 'Desktop: [WASD / Arrow Keys] Move | Mobile: On-screen D-Pad',
    rules: [
      'Collect all glowing gems and gold relics scattered across the dungeon.',
      'Avoid patrolling laser skull guardians.',
      'Gather the highest wealth total before time runs out.'
    ]
  },
  {
    id: 'memory-wars',
    title: 'MEMORY WARS',
    slug: 'memory-wars',
    tagline: 'Competitive speed tile-matching matrix duel.',
    description: 'Flip holographic glyphs and claim matching pairs in real time. Memorize tile placements to trigger instant combos and outscore your opponent.',
    category: 'strategy',
    multiplayer: true,
    playerCount: '1 - 4 Players',
    multiplayerMode: 'Memory Matrix Showdown',
    difficulty: 'Easy',
    rating: 4.4,
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    controls: 'Click or Tap cards to reveal matching holographic glyphs',
    rules: [
      'Click two cards to flip and check if their cyber glyphs match.',
      'Matching pairs award 100 points + combo multipliers.',
      'Clear the entire board with the highest score to claim victory.'
    ]
  },
  {
    id: 'tower-defenders',
    title: 'TOWER DEFENDERS',
    slug: 'tower-defenders',
    tagline: 'Cooperative lane defense with upgradeable plasma turrets.',
    description: 'Deploy and upgrade automated plasma turrets, laser cannons, and tesla coils along the convoy route to stop incoming waves of cyber drones.',
    category: 'strategy',
    multiplayer: true,
    playerCount: '1 - 3 Players',
    multiplayerMode: 'Lane Defense Survival',
    difficulty: 'Hard',
    rating: 4.9,
    imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80',
    controls: 'Click on green nodes to build / upgrade Plasma Turrets and Laser Cannons',
    rules: [
      'Build defense turrets along the path using starting credits.',
      'Defeat invading drones to earn upgrade energy.',
      'Prevent enemy forces from breaching the central power reactor.'
    ]
  },
  {
    id: 'survival-arena',
    title: 'SURVIVAL ARENA',
    slug: 'survival-arena',
    tagline: 'Last-person-standing laser elimination ring.',
    description: 'Dodge sweeping laser sweepers, hazard projectiles, and shrinking plasma rings in a high-intensity survival reflex test.',
    category: 'action',
    multiplayer: true,
    playerCount: '1 - 4 Players',
    multiplayerMode: 'Laser Survival Battle',
    difficulty: 'Hard',
    rating: 4.7,
    imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
    controls: 'Desktop: [WASD / Arrows] Move & Dodge | Mobile: Touch Joystick',
    rules: [
      'Dodge rotating laser beams and hazard energy orbs.',
      'Stay inside the safe zone as the outer perimeter shrinks.',
      'Survive the longest to become the Arena Champion.'
    ]
  },
  {
    id: 'quick-draw',
    title: 'QUICK DRAW 2099',
    slug: 'quick-draw',
    tagline: 'Sub-millisecond reflex duel of cyber gunslingers.',
    description: 'Stare down your cybernetic rival. Wait for the randomized DRAW signal and tap within milliseconds to fire your pulse blaster.',
    category: 'arcade',
    multiplayer: true,
    playerCount: '1 - 2 Players',
    multiplayerMode: '1v1 Reflex Showdown',
    difficulty: 'Hard',
    rating: 4.6,
    imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
    controls: 'Press [Spacebar] or [TAP FIRE BUTTON] immediately when DRAW appears!',
    rules: [
      'Keep your finger ready on the trigger.',
      'When "DRAW!" flashes on screen, fire immediately.',
      'Firing before the signal results in a foul penalty.'
    ]
  },
  {
    id: 'maze-hunters',
    title: 'MAZE HUNTERS',
    slug: 'maze-hunters',
    tagline: 'Asymmetrical stealth hunt in shifting labyrinths.',
    description: 'Navigate a dark cyber labyrinth to gather 5 glowing power batteries while avoiding the Hunter AI sentinel patrol.',
    category: 'strategy',
    multiplayer: true,
    playerCount: '1 - 4 Players',
    multiplayerMode: 'Stealth Labyrinth Hunt',
    difficulty: 'Medium',
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80',
    controls: 'Desktop: [WASD / Arrows] Move | Mobile: On-screen D-Pad',
    rules: [
      'Navigate the maze to collect all 5 power batteries.',
      'Keep your distance from the hunter sentinel.',
      'Collect all batteries and reach the exit portal to escape.'
    ]
  }
];
