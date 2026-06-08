'use strict';

// ── STATE ────────────────────────────────────────────────────────────────────
const G = {
  screen: 'title',
  scene: null,
  lineIndex: 0,
  device: { level: 1, battery: 100, fragments: 0, upgrades: [] },
  choices: {},
  rep: { survivor: 0, corporate: 0, rebel: 0 },
  visited: new Set(),
  unlockedLocations: ['courier_hq', 'market_district'],
  mapPhase: 1,
};

// ── BACKGROUNDS ──────────────────────────────────────────────────────────────
const BG = {
  hq:      'linear-gradient(180deg,#1a0f0a 0%,#0d0a08 100%)',
  streets: 'linear-gradient(180deg,#070d1f 0%,#0a0a14 100%)',
  blackout:'linear-gradient(180deg,#000000 0%,#050508 100%)',
  market:  'linear-gradient(180deg,#1a0f05 0%,#100a00 100%)',
  tech:    'linear-gradient(180deg,#050e1a 0%,#030810 100%)',
  library: 'linear-gradient(180deg,#0f0a05 0%,#080500 100%)',
  lab:     'linear-gradient(180deg,#001a0a 0%,#000d05 100%)',
  tower:   'linear-gradient(180deg,#0a0520 0%,#050010 100%)',
};

// ── CHARACTER SVGs ────────────────────────────────────────────────────────────
const CHARS = {
  you: `<svg class="char-svg" viewBox="0 0 120 180" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="60" cy="32" rx="18" ry="20" fill="#c4956a"/>
    <rect x="42" y="52" width="36" height="50" rx="4" fill="#2a3a5c"/>
    <rect x="38" y="54" width="12" height="38" rx="3" fill="#1e2d47"/>
    <rect x="70" y="54" width="12" height="38" rx="3" fill="#1e2d47"/>
    <rect x="46" y="100" width="12" height="50" rx="3" fill="#1a2438"/>
    <rect x="62" y="100" width="12" height="50" rx="3" fill="#1a2438"/>
    <rect x="44" y="148" width="14" height="10" rx="2" fill="#111"/>
    <rect x="62" y="148" width="14" height="10" rx="2" fill="#111"/>
    <rect x="68" y="80" width="18" height="12" rx="3" fill="#00ffa3" opacity="0.8"/>
    <rect x="70" y="82" width="14" height="8" rx="2" fill="#003322"/>
  </svg>`,
  scientist: `<svg class="char-svg" viewBox="0 0 120 180" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="60" cy="32" rx="18" ry="20" fill="#d4b896"/>
    <rect x="42" y="52" width="36" height="50" rx="4" fill="#e8e8e8"/>
    <rect x="38" y="54" width="12" height="38" rx="3" fill="#d0d0d0"/>
    <rect x="70" y="54" width="12" height="38" rx="3" fill="#d0d0d0"/>
    <rect x="46" y="100" width="12" height="50" rx="3" fill="#c0c0c0"/>
    <rect x="62" y="100" width="12" height="50" rx="3" fill="#c0c0c0"/>
    <rect x="44" y="148" width="14" height="10" rx="2" fill="#333"/>
    <rect x="62" y="148" width="14" height="10" rx="2" fill="#333"/>
    <rect x="50" y="22" width="20" height="4" rx="1" fill="#333"/>
    <rect x="52" y="26" width="8" height="8" rx="1" fill="#87ceeb" opacity="0.8"/>
    <rect x="62" y="26" width="8" height="8" rx="1" fill="#87ceeb" opacity="0.8"/>
  </svg>`,
  survivor: `<svg class="char-svg" viewBox="0 0 120 180" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="60" cy="32" rx="18" ry="20" fill="#b8926a"/>
    <rect x="42" y="52" width="36" height="50" rx="4" fill="#5c3a1e"/>
    <rect x="38" y="54" width="12" height="38" rx="3" fill="#4a2e18"/>
    <rect x="70" y="54" width="12" height="38" rx="3" fill="#4a2e18"/>
    <rect x="46" y="100" width="12" height="50" rx="3" fill="#3d2510"/>
    <rect x="62" y="100" width="12" height="50" rx="3" fill="#3d2510"/>
    <rect x="44" y="148" width="14" height="10" rx="2" fill="#222"/>
    <rect x="62" y="148" width="14" height="10" rx="2" fill="#222"/>
    <path d="M46 52 Q60 44 74 52" stroke="#8b6340" stroke-width="3" fill="none"/>
  </svg>`,
  dispatcher: `<svg class="char-svg" viewBox="0 0 120 180" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="60" cy="32" rx="18" ry="20" fill="#a07850"/>
    <rect x="42" y="52" width="36" height="50" rx="4" fill="#1a1a2e"/>
    <rect x="38" y="54" width="12" height="38" rx="3" fill="#12122a"/>
    <rect x="70" y="54" width="12" height="38" rx="3" fill="#12122a"/>
    <rect x="46" y="100" width="12" height="50" rx="3" fill="#0d0d20"/>
    <rect x="62" y="100" width="12" height="50" rx="3" fill="#0d0d20"/>
    <rect x="44" y="148" width="14" height="10" rx="2" fill="#111"/>
    <rect x="62" y="148" width="14" height="10" rx="2" fill="#111"/>
    <circle cx="60" cy="26" r="8" fill="none" stroke="#7b5cff" stroke-width="1.5"/>
    <line x1="60" y1="18" x2="60" y2="12" stroke="#7b5cff" stroke-width="1.5"/>
  </svg>`,
  none: '',
};

// ── STORY SCENES ──────────────────────────────────────────────────────────────
const SCENES = {
  intro_1: {
    bg: 'hq', char: 'dispatcher',
    lines: [
      { speaker: 'DISPATCH', text: 'Morning, courier. Another day, another package. Sector 7 drop-off. The client is... unusual.' },
      { speaker: 'DISPATCH', text: 'Paid triple rate, cash. No questions. Wants delivery before 9 AM.' },
      { speaker: 'YOU', text: "Triple rate? What's in the package?" },
      { speaker: 'DISPATCH', text: "Do I look like someone who checks? Just go. Oh — your comms might be spotty in the old district." },
    ],
    next: 'intro_2',
  },
  intro_2: {
    bg: 'streets', char: 'you',
    lines: [
      { speaker: 'YOU', text: 'Standard ride through Nova City. Towers humming, ads flickering, everyone staring at their screens.' },
      { speaker: 'YOU', text: "The package feels wrong. Too light for its size. Something rattles inside — not like hardware. Like pieces." },
      { speaker: 'YOU', text: "I'm two blocks from the drop when it happens." },
    ],
    next: 'blackout',
  },
  blackout: {
    bg: 'blackout', char: 'none',
    lines: [
      { speaker: 'SYSTEM', text: '— SIGNAL LOST —' },
      { speaker: 'SYSTEM', text: '— ALL NETWORKS OFFLINE —' },
      { speaker: 'SYSTEM', text: '— REBOOT FAILED —' },
      { speaker: 'YOU', text: 'My phone died. Every screen went black. The entire city just... stopped.' },
      { speaker: 'YOU', text: 'I dropped the package. When it hit the ground, it cracked open.' },
    ],
    next: 'find_device',
  },
  find_device: {
    bg: 'streets', char: 'you',
    lines: [
      { speaker: 'YOU', text: 'Inside the broken package: a small rectangular device. Matte black. No markings except a single symbol — a radio tower with a crack through it.' },
      { speaker: 'YOU', text: 'Then it lights up. Green. In a city where everything else is dead.' },
      { speaker: 'DEVICE', text: '...receiving... ...fragments detected... ...scan complete. 3 signal sources located.' },
      { speaker: 'YOU', text: 'It can hear things no one else can. And it wants me to find them.' },
    ],
    next: 'map_intro',
    onEnter: () => { notify('Signal Harvester obtained!'); updateHUD(); },
  },
  map_intro: {
    bg: 'streets', char: 'you',
    lines: [
      { speaker: 'YOU', text: 'The device is showing three signal sources across the city. Three clues to understand what just happened.' },
      { speaker: 'YOU', text: "I need to move fast. The city is confused right now, but it won't stay that way." },
    ],
    next: 'map',
  },

  // Market District
  market_arrive: {
    bg: 'market', char: 'survivor',
    lines: [
      { speaker: 'SURVIVOR', text: "Hey! You got a working device? We've been trying to signal for help for three hours." },
      { speaker: 'SURVIVOR', text: "There are forty people in a shelter two blocks over. Kids, elderly. No food signals, no emergency services." },
      { speaker: 'YOU', text: "The device shows a signal fragment near here. I need it to understand the blackout." },
    ],
    choices: [
      { text: 'Help them first — use the device to coordinate their rescue.', next: 'market_help', tag: 'helped_market', rep: { survivor: 2 } },
      { text: 'Take the signal fragment and move on. The truth matters more right now.', next: 'market_skip', tag: 'skipped_market', rep: { rebel: 1 } },
    ],
  },
  market_help: {
    bg: 'market', char: 'survivor',
    lines: [
      { speaker: 'YOU', text: 'I use the device to broadcast their location on emergency frequencies still carrying noise.' },
      { speaker: 'SURVIVOR', text: "It's working — I can see response lights on the ridge!" },
      { speaker: 'SURVIVOR', text: 'Here — we found this in the rubble. Some kind of data chip. Take it.' },
      { speaker: 'DEVICE', text: '...signal fragment acquired... battery +15%... new frequency unlocked.' },
    ],
    next: 'map',
    onEnter: () => {
      G.device.fragments++;
      G.device.battery = Math.min(100, G.device.battery + 15);
      G.visited.add('market_district');
      notify('Signal Fragment 1/3 acquired!');
      unlockLocation('tech_quarter');
      updateHUD();
    },
  },
  market_skip: {
    bg: 'market', char: 'you',
    lines: [
      { speaker: 'YOU', text: 'I grab the fragment from a cracked terminal and keep moving.' },
      { speaker: 'YOU', text: "I tell myself someone else will help them. I'm not sure I believe it." },
      { speaker: 'DEVICE', text: '...signal fragment acquired...' },
    ],
    next: 'map',
    onEnter: () => {
      G.device.fragments++;
      G.visited.add('market_district');
      notify('Signal Fragment 1/3 acquired.');
      unlockLocation('tech_quarter');
      updateHUD();
    },
  },

  // Tech Quarter
  tech_arrive: {
    bg: 'tech', char: 'none',
    lines: [
      { speaker: 'YOU', text: 'The Tech Quarter is locked down. NovaCorp security drones still operational — they have their own power.' },
      { speaker: 'YOU', text: 'The signal fragment is inside a sealed server building. Two ways in.' },
    ],
    choices: [
      { text: 'Hack past security using the device signal spoofing.', next: 'tech_hack', tag: 'hacked_tech', rep: { rebel: 2 } },
      { text: 'Find the corporate contact and negotiate access.', next: 'tech_negotiate', tag: 'negotiated_tech', rep: { corporate: 2 } },
    ],
  },
  tech_hack: {
    bg: 'tech', char: 'you',
    lines: [
      { speaker: 'YOU', text: 'The device buzzes, mimicking a NovaCorp security handshake. The door clicks open.' },
      { speaker: 'YOU', text: 'Inside the server room: the fragment — and internal communications dated two weeks ago.' },
      { speaker: 'DEVICE', text: '...intercepted data... "SILENCE PROTOCOL: Phase 2 begins Friday. All civilian signals terminate at 06:00." Signed: Director Chen, NovaCorp R&D.' },
      { speaker: 'YOU', text: "This wasn't an accident. This was planned." },
    ],
    next: 'map',
    onEnter: () => {
      G.device.fragments++;
      G.choices.knows_truth = true;
      G.visited.add('tech_quarter');
      notify('Fragment 2/3 + Evidence obtained!');
      unlockLocation('old_library');
      updateHUD();
    },
  },
  tech_negotiate: {
    bg: 'tech', char: 'scientist',
    lines: [
      { speaker: 'NOVA CONTACT', text: "You have a working device? That's... remarkable." },
      { speaker: 'NOVA CONTACT', text: "I can get you the fragment. In exchange, you bring that device to our lab. Director Chen wants it analyzed." },
      { speaker: 'YOU', text: "I take the fragment and agree to nothing. But the name sticks: Director Chen." },
      { speaker: 'DEVICE', text: '...signal fragment acquired... warning: signal trace initiated by external party.' },
    ],
    next: 'map',
    onEnter: () => {
      G.device.fragments++;
      G.choices.nova_knows_me = true;
      G.visited.add('tech_quarter');
      notify("Fragment 2/3 acquired. You've been noticed.");
      unlockLocation('old_library');
      updateHUD();
    },
  },

  // Old Library
  library_arrive: {
    bg: 'library', char: 'scientist',
    lines: [
      { speaker: 'SCIENTIST', text: "Oh! Someone else is still moving. You have one of the receivers — fascinating." },
      { speaker: 'YOU', text: 'You know what this is?' },
      { speaker: 'SCIENTIST', text: "I built it. Well — I helped build it. NovaCorp's Silence Protocol. It was supposed to be a controlled test." },
      { speaker: 'SCIENTIST', text: "Director Chen escalated it. Full deployment. I quit two days ago but I couldn't warn anyone — my own comms were cut." },
      { speaker: 'SCIENTIST', text: "The last fragment is in this building. I've been protecting it. It has the lab coordinates and the kill-switch frequency." },
    ],
    next: 'puzzle_intro',
  },
  puzzle_intro: {
    bg: 'library', char: 'scientist',
    lines: [
      { speaker: 'SCIENTIST', text: "The fragment is encrypted. I can walk you through decryption but it requires manual tuning on your device." },
      { speaker: 'YOU', text: 'Show me.' },
    ],
    next: 'puzzle',
  },
  post_puzzle: {
    bg: 'library', char: 'scientist',
    lines: [
      { speaker: 'DEVICE', text: '...final fragment integrated... lab location: Sector 9 Underground Complex... kill-switch frequency: 477.3 MHz...' },
      { speaker: 'SCIENTIST', text: "That's it. The underground lab is where Chen is operating. The kill-switch could restore all signals. But you have other options." },
      { speaker: 'SCIENTIST', text: "NovaCorp would pay enormously for that device. Or you could help people rebuild locally. Or broadcast everything. Let the world decide." },
    ],
    next: 'final_choice',
    onEnter: () => {
      G.device.fragments = Math.max(G.device.fragments, 3);
      G.visited.add('old_library');
      unlockLocation('underground_lab');
      notify('Signal fully reconstructed!');
      updateHUD();
    },
  },

  // Underground Lab (optional)
  underground_lab_scene: {
    bg: 'lab', char: 'scientist',
    lines: [
      { speaker: 'YOU', text: "The lab is enormous. Servers the size of buildings, all humming. Thousands of signal suppressors in perfect grids." },
      { speaker: 'SCIENTIST', text: "Chen's life work. Proof that NovaCorp can silence any city, any time. The ultimate leverage." },
      { speaker: 'YOU', text: "The device is vibrating. It knows we're at the source." },
    ],
    next: 'final_choice',
  },

  // Final Choice
  final_choice: {
    bg: 'lab', char: 'you',
    lines: [
      { speaker: 'YOU', text: "Standing at the entrance to the underground lab, the device pulses with the complete signal. I have everything." },
      { speaker: 'YOU', text: 'Three paths. One choice.' },
    ],
    choices: [
      { text: 'Use the kill-switch. Restore communications. Help survivors rebuild.', next: 'ending_rebuilder', tag: 'final_rebuild', rep: { survivor: 3 } },
      { text: 'Sell the device and kill-switch frequency to NovaCorp.', next: 'ending_opportunist', tag: 'final_sell', rep: { corporate: 3 } },
      { text: 'Broadcast the truth — evidence and kill-switch — to every receiver in the city.', next: 'ending_truth', tag: 'final_expose', rep: { rebel: 3 } },
    ],
  },

  // Endings (narration before final screen)
  ending_rebuilder: {
    bg: 'tower', char: 'none',
    lines: [
      { speaker: 'YOU', text: 'I activate the kill-switch at 477.3 MHz. The suppressors shut down in sequence — floor by floor, block by block.' },
      { speaker: 'DEVICE', text: '...signal restored... ...all frequencies open... ...transmission complete.' },
      { speaker: 'YOU', text: 'The city comes back online. Phones light up. People cry in the streets.' },
    ],
    next: 'end_rebuilder',
  },
  ending_opportunist: {
    bg: 'tech', char: 'none',
    lines: [
      { speaker: 'YOU', text: "I call Director Chen on the device's private frequency. We meet in thirty minutes." },
      { speaker: 'NOVA CONTACT', text: "You're smarter than I expected, courier. Name your price." },
      { speaker: 'YOU', text: "I walk away richer than I ever imagined. The city stays dark for another six months." },
    ],
    next: 'end_opportunist',
  },
  ending_truth: {
    bg: 'tower', char: 'you',
    lines: [
      { speaker: 'YOU', text: "I find the city's highest transmission point — the old broadcast tower." },
      { speaker: 'DEVICE', text: '...broadcast initiated... ...evidence packet transmitting... ...reach: 2.3 million receivers.' },
      { speaker: 'YOU', text: 'Chaos follows. Then questions. Then answers. Then something that might be justice.' },
    ],
    next: 'end_truth',
  },
};

// ── UPGRADES ─────────────────────────────────────────────────────────────────
const UPGRADES = [
  { id: 'range_boost',   icon: '📶', name: 'Range Amplifier',   desc: 'Double signal detection radius', cost: '1 Fragment', req: 1 },
  { id: 'battery_cell',  icon: '🔋', name: 'Power Cell Mk.II',  desc: '+30% battery capacity',          cost: '1 Fragment', req: 1 },
  { id: 'decrypt_chip',  icon: '💾', name: 'Decrypt Module',    desc: 'Shows puzzle hints',             cost: '2 Fragments', req: 2 },
  { id: 'broadcast_mod', icon: '📡', name: 'Broadcast Emitter', desc: 'Extend transmission range 10x',  cost: '3 Fragments', req: 3 },
];

// ── LOCATIONS ─────────────────────────────────────────────────────────────────
const LOCATIONS = {
  courier_hq:      { icon: '🏢', name: 'Courier HQ',        desc: 'Your starting point',         signal: '▁▂', scene: 'intro_1' },
  market_district: { icon: '🛒', name: 'Market District',   desc: 'Survivors need help here',    signal: '▁▂▃', scene: 'market_arrive' },
  tech_quarter:    { icon: '🔒', name: 'Tech Quarter',      desc: 'NovaCorp security active',    signal: '▁▂▃▄', scene: 'tech_arrive' },
  old_library:     { icon: '📚', name: 'Old Library',       desc: 'A scientist is hiding here',  signal: '▁▂▃▄▅', scene: 'library_arrive' },
  underground_lab: { icon: '⚗️',  name: 'Underground Lab',  desc: 'The source of the blackout',  signal: '▁▂▃▄▅', scene: 'underground_lab_scene' },
};

// ── PUZZLE ────────────────────────────────────────────────────────────────────
const PUZZLE = {
  desc: 'The signal is scrambled across 4 frequency bands. Tap the correct 4-tile sequence to decrypt it.',
  target: ['A', '7', '3', 'F'],
  tiles: ['A','7','3','F','B','2','9','E','C','1','D','5','4','G','H','6'],
  hint: 'Match the target sequence shown above exactly.',
};

// ── HELPERS ───────────────────────────────────────────────────────────────────
function unlockLocation(id) {
  if (!G.unlockedLocations.includes(id)) G.unlockedLocations.push(id);
}

function notify(msg) {
  const el = document.getElementById('notification');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2800);
}

function fadeTransition(fn) {
  const overlay = document.getElementById('fade-overlay');
  overlay.classList.add('active');
  setTimeout(() => { fn(); setTimeout(() => overlay.classList.remove('active'), 80); }, 280);
}

function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('screen-' + name);
  if (el) el.classList.add('active');
  const hud = document.getElementById('hud');
  hud.classList.toggle('visible', name !== 'title' && name !== 'ending');
  G.screen = name;
}

function updateHUD() {
  const bars = document.querySelectorAll('#hud-signal .hud-bar');
  const strength = Math.min(5, G.device.fragments + 1);
  bars.forEach((b, i) => { b.style.opacity = i < strength ? '1' : '0.15'; });
  document.getElementById('hud-signal-txt').textContent = G.device.fragments + '/3 FRAGS';
  document.getElementById('hud-level').textContent = 'LV.' + G.device.level;
  const pct = G.device.battery;
  const fill = document.getElementById('hud-battery-fill');
  fill.style.width = pct + '%';
  fill.style.background = pct < 25 ? '#ff4e6a' : pct < 50 ? '#ffd700' : '#00ffa3';
  document.getElementById('hud-battery-txt').textContent = pct + '%';
}

// ── SCENE ENGINE ──────────────────────────────────────────────────────────────
function gotoScene(sceneId) {
  const scene = SCENES[sceneId];
  if (!scene) { console.warn('Missing scene:', sceneId); return; }
  G.scene = sceneId;
  G.lineIndex = 0;
  fadeTransition(() => {
    showScreen('scene');
    renderSceneLine(scene, 0);
    if (scene.onEnter) scene.onEnter();
  });
}

function renderSceneLine(scene, idx) {
  document.getElementById('scene-bg').style.background = BG[scene.bg] || BG.streets;
  const art = document.getElementById('scene-art');
  art.innerHTML = scene.char && CHARS[scene.char] ? `<div class="char-portrait">${CHARS[scene.char]}</div>` : '';

  const line = scene.lines[Math.min(idx, scene.lines.length - 1)];
  document.getElementById('dialogue-speaker').textContent = line.speaker;
  const textEl = document.getElementById('dialogue-text');
  typeText(textEl, line.text);

  const choicesEl = document.getElementById('dialogue-choices');
  choicesEl.innerHTML = '';
  const tapEl = document.getElementById('tap-continue');
  const isLast = idx >= scene.lines.length - 1;

  if (isLast && scene.choices) {
    tapEl.style.display = 'none';
    scene.choices.forEach(c => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = c.text;
      btn.addEventListener('click', () => {
        if (c.tag) G.choices[c.tag] = true;
        if (c.rep) Object.keys(c.rep).forEach(k => { G.rep[k] = (G.rep[k] || 0) + c.rep[k]; });
        handleNext(c.next);
      });
      choicesEl.appendChild(btn);
    });
  } else {
    tapEl.style.display = 'block';
  }
}

let typingTimer = null;
function typeText(el, text) {
  if (typingTimer) { clearInterval(typingTimer); typingTimer = null; }
  let i = 0;
  el.textContent = '';
  typingTimer = setInterval(() => {
    el.textContent += text[i++];
    if (i >= text.length) { clearInterval(typingTimer); typingTimer = null; }
  }, 18);
}

function advanceScene() {
  const scene = SCENES[G.scene];
  if (!scene) return;
  if (scene.choices && G.lineIndex >= scene.lines.length - 1) return;
  if (typingTimer) {
    clearInterval(typingTimer); typingTimer = null;
    document.getElementById('dialogue-text').textContent = scene.lines[G.lineIndex].text;
    return;
  }
  G.lineIndex++;
  if (G.lineIndex >= scene.lines.length) { if (scene.next) handleNext(scene.next); return; }
  renderSceneLine(scene, G.lineIndex);
}

function handleNext(next) {
  if (next === 'map') { fadeTransition(showMap); }
  else if (next === 'puzzle') { fadeTransition(showPuzzle); }
  else if (next === 'end_rebuilder') showEnding('rebuilder');
  else if (next === 'end_opportunist') showEnding('opportunist');
  else if (next === 'end_truth') showEnding('truth');
  else gotoScene(next);
}

// ── MAP ───────────────────────────────────────────────────────────────────────
function showMap() {
  showScreen('map');
  renderMap();
  updateHUD();
  const frag = G.device.fragments;
  document.getElementById('device-status').textContent =
    frag >= 3 ? '📡 Signal: FULL — 3/3 fragments' : `📡 Signal: ${frag}/3 fragments`;
}

function renderMap() {
  const container = document.getElementById('map-locations');
  container.innerHTML = '';
  Object.entries(LOCATIONS).forEach(([id, loc]) => {
    const unlocked = G.unlockedLocations.includes(id);
    const visited = G.visited.has(id);
    const card = document.createElement('div');
    card.className = 'location-card' + (!unlocked ? ' locked' : '') + (visited ? ' visited' : '');
    card.innerHTML = `<div class="location-icon">${loc.icon}</div>
      <div class="location-name">${loc.name}</div>
      <div class="location-desc">${loc.desc}</div>
      <div class="location-signal">${loc.signal}</div>`;
    if (unlocked) {
      card.addEventListener('click', () => {
        if (id === 'courier_hq' && visited) return;
        G.visited.add(id);
        gotoScene(loc.scene);
      });
    }
    container.appendChild(card);
  });
}

// ── PUZZLE ────────────────────────────────────────────────────────────────────
let puzzleSelected = [];

function showPuzzle() {
  puzzleSelected = [];
  showScreen('puzzle');
  document.getElementById('puzzle-desc').textContent = PUZZLE.desc;

  const waveHTML = Array.from({ length: 12 }, (_, i) => {
    const h = 8 + Math.round(Math.sin(i * 0.8) * 7 + 5);
    return `<div class="wave-bar" style="height:${h}px;animation-delay:${(i * 0.08).toFixed(2)}s"></div>`;
  }).join('');
  document.getElementById('puzzle-display').innerHTML =
    `<div class="signal-waveform">${waveHTML}</div>
     <div style="font-size:1.1rem;letter-spacing:0.3em;margin-top:8px">TARGET: [ ${PUZZLE.target.join(' ')} ]</div>`;

  document.getElementById('puzzle-hint').textContent = PUZZLE.hint;

  const grid = document.getElementById('puzzle-grid');
  grid.innerHTML = '';
  const shuffled = [...PUZZLE.tiles].sort(() => Math.random() - 0.5);
  shuffled.forEach(char => {
    const tile = document.createElement('div');
    tile.className = 'puzzle-tile';
    tile.textContent = char;
    tile.addEventListener('click', () => onPuzzleTile(tile, char));
    grid.appendChild(tile);
  });
}

function onPuzzleTile(tile, char) {
  if (puzzleSelected.length >= 4 || tile.classList.contains('selected')) return;
  tile.classList.add('selected');
  puzzleSelected.push({ tile, char });
  if (puzzleSelected.length === 4) setTimeout(checkPuzzle, 350);
}

function checkPuzzle() {
  const correct = PUZZLE.target.every((c, i) => c === puzzleSelected[i].char);
  const cls = correct ? 'correct' : 'wrong';
  puzzleSelected.forEach(p => { p.tile.classList.remove('selected'); p.tile.classList.add(cls); });
  if (correct) {
    setTimeout(() => { notify('Signal decrypted!'); gotoScene('post_puzzle'); }, 700);
  } else {
    setTimeout(() => {
      puzzleSelected.forEach(p => p.tile.classList.remove('wrong'));
      puzzleSelected = [];
      notify('Wrong sequence — try again.');
    }, 700);
  }
}

// ── DEVICE SCREEN ─────────────────────────────────────────────────────────────
function showDevice() {
  showScreen('device');
  const names = ['BASIC', 'ENHANCED', 'ADVANCED', 'TACTICAL'];
  document.getElementById('device-lv-label').textContent = `LV.${G.device.level} — ${names[G.device.level - 1] || 'MAX'}`;
  renderUpgrades();
}

function renderUpgrades() {
  const list = document.getElementById('upgrade-list');
  list.innerHTML = '';
  UPGRADES.forEach(u => {
    const owned = G.device.upgrades.includes(u.id);
    const locked = G.device.fragments < u.req;
    const item = document.createElement('div');
    item.className = 'upgrade-item' + (owned ? ' owned' : '') + (!owned && locked ? ' locked' : '');
    item.innerHTML = `<div class="upgrade-icon">${u.icon}</div>
      <div class="upgrade-info">
        <div class="upgrade-name">${u.name}</div>
        <div class="upgrade-desc">${u.desc}</div>
      </div>
      <div class="upgrade-cost${owned ? ' owned' : ''}">${owned ? 'INSTALLED' : u.cost}</div>`;
    if (!owned && !locked) item.addEventListener('click', () => installUpgrade(u));
    list.appendChild(item);
  });
}

function installUpgrade(u) {
  if (G.device.upgrades.includes(u.id)) return;
  G.device.upgrades.push(u.id);
  G.device.level = Math.min(4, 1 + G.device.upgrades.length);
  if (u.id === 'battery_cell') G.device.battery = Math.min(100, G.device.battery + 30);
  notify(u.name + ' installed!');
  renderUpgrades();
  updateHUD();
  const names = ['BASIC', 'ENHANCED', 'ADVANCED', 'TACTICAL'];
  document.getElementById('device-lv-label').textContent = `LV.${G.device.level} — ${names[G.device.level - 1] || 'MAX'}`;
}

// ── ENDINGS ───────────────────────────────────────────────────────────────────
const ENDING_DATA = {
  rebuilder: {
    extraCls: 'ending-rebuilder', icon: '🌐', tag: 'Ending A',
    title: 'The Rebuilder',
    text: "You restored Nova City's communications. Survivors rebuilt stronger. NovaCorp faced investigation. The device became the symbol of a new, open network — one no corporation could silence again.",
    color: '#00ffa3',
    stats: () => [
      { val: G.device.fragments, lbl: 'Fragments' },
      { val: G.rep.survivor, lbl: 'Survivor Rep' },
      { val: G.device.level, lbl: 'Device Lv.' },
    ],
  },
  opportunist: {
    extraCls: 'ending-opportunist', icon: '💰', tag: 'Ending B',
    title: 'The Opportunist',
    text: "You walked away wealthy. NovaCorp got their device back and silenced three more cities before anyone stopped them. You live well. You try not to think about the market district.",
    color: '#ffd700',
    stats: () => [
      { val: '∞', lbl: 'Credits' },
      { val: G.rep.corporate, lbl: 'Corporate Rep' },
      { val: 0, lbl: 'Signals Restored' },
    ],
  },
  truth: {
    extraCls: 'ending-truth', icon: '📻', tag: 'Ending C',
    title: 'The Truth-Teller',
    text: "You broadcast everything. The world heard. Director Chen was arrested within 48 hours. The blackout ended in a week. You became a ghost — and a legend.",
    color: '#7b5cff',
    stats: () => [
      { val: '2.3M', lbl: 'Reached' },
      { val: G.rep.rebel, lbl: 'Rebel Rep' },
      { val: G.device.fragments, lbl: 'Fragments' },
    ],
  },
};

function showEnding(type) {
  fadeTransition(() => {
    showScreen('ending');
    document.getElementById('hud').classList.remove('visible');
    const e = ENDING_DATA[type];
    const statsHTML = e.stats().map(s =>
      `<div class="stat"><div class="stat-val" style="color:${e.color}">${s.val}</div><div class="stat-lbl">${s.lbl}</div></div>`
    ).join('');
    document.getElementById('ending-content').innerHTML = `
      <div class="ending-icon">${e.icon}</div>
      <div class="ending-tag" style="color:${e.color}">${e.tag}</div>
      <div class="ending-title" style="color:${e.color}">${e.title}</div>
      <p class="ending-text">${e.text}</p>
      <div class="ending-stats">${statsHTML}</div>
      <button class="btn-primary" id="btn-restart" style="margin-top:16px;border-color:${e.color};color:${e.color}">PLAY AGAIN</button>
    `;
    const endingEl = document.getElementById('screen-ending');
    endingEl.className = 'screen active ' + e.extraCls;
    document.getElementById('btn-restart').addEventListener('click', resetGame);
  });
}

function resetGame() {
  G.screen = 'title'; G.scene = null; G.lineIndex = 0;
  G.device = { level: 1, battery: 100, fragments: 0, upgrades: [] };
  G.choices = {}; G.rep = { survivor: 0, corporate: 0, rebel: 0 };
  G.visited = new Set();
  G.unlockedLocations = ['courier_hq', 'market_district'];
  G.mapPhase = 1;
  puzzleSelected = [];
  if (typingTimer) { clearInterval(typingTimer); typingTimer = null; }
  fadeTransition(() => {
    document.getElementById('screen-ending').className = 'screen';
    showScreen('title');
    updateHUD();
  });
}

// ── INIT ──────────────────────────────────────────────────────────────────────
function init() {
  document.getElementById('btn-start').addEventListener('click', () => {
    G.visited.add('courier_hq');
    gotoScene('intro_1');
  });
  document.getElementById('screen-scene').addEventListener('click', e => {
    if (!e.target.closest('.choice-btn')) advanceScene();
  });
  document.getElementById('btn-open-device').addEventListener('click', showDevice);
  document.getElementById('btn-device-back').addEventListener('click', () => fadeTransition(showMap));
  updateHUD();
}

document.addEventListener('DOMContentLoaded', init);
