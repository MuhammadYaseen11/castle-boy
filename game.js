const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ===== AUDIO =====
let audioCtx = null;
function getAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
}
function playSound(type) {
    try {
        const ac = getAudio();
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.connect(g); g.connect(ac.destination);
        switch (type) {
            case 'click':
                o.frequency.value = 480;
                g.gain.setValueAtTime(0.08, ac.currentTime);
                g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.12);
                o.start(); o.stop(ac.currentTime + 0.12);
                break;
            case 'mine':
                o.type = 'sawtooth';
                o.frequency.setValueAtTime(140, ac.currentTime);
                o.frequency.exponentialRampToValueAtTime(70, ac.currentTime + 0.18);
                g.gain.setValueAtTime(0.18, ac.currentTime);
                g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.18);
                o.start(); o.stop(ac.currentTime + 0.18);
                break;
            case 'coin':
                [523, 659, 784].forEach((f, i) => {
                    const oc = ac.createOscillator(), gc = ac.createGain();
                    oc.connect(gc); gc.connect(ac.destination);
                    oc.frequency.value = f;
                    gc.gain.setValueAtTime(0.12, ac.currentTime + i * 0.1);
                    gc.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + i * 0.1 + 0.25);
                    oc.start(ac.currentTime + i * 0.1);
                    oc.stop(ac.currentTime + i * 0.1 + 0.25);
                });
                break;
            case 'fanfare':
                [523, 659, 784, 1047].forEach((f, i) => {
                    const oc = ac.createOscillator(), gc = ac.createGain();
                    oc.connect(gc); gc.connect(ac.destination);
                    oc.frequency.value = f;
                    gc.gain.setValueAtTime(0.12, ac.currentTime + i * 0.12);
                    gc.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + i * 0.12 + 0.3);
                    oc.start(ac.currentTime + i * 0.12);
                    oc.stop(ac.currentTime + i * 0.12 + 0.3);
                });
                break;
        }
    } catch(e) {}
}

// ===== STATE =====
let phase = 'title'; // 'title' | 'playing' | 'fading' | 'end'
let fadeAlpha = 0, fadeDir = 1, pendingLevel = null;

let gs = {
    level: 1, coins: 0, stamina: 100,
    px: 150, py: 545,
    dlgIdx: 0,
    forestDone: false,
    mineProgress: 0, maxMine: 8,
    swordDone: false,
    walkFrame: 0, walkTimer: 0,
    facing: 1,
    notifText: '', notifTimer: 0,
};

let tw = { full: '', shown: '', idx: 0, timer: 0, speed: 32, done: false };
let keys = {};
let lastTime = 0;
let lastMineHit = 0;

// ===== INPUT =====
document.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onAction();
    }
});
document.addEventListener('keyup', e => { keys[e.key] = false; });
canvas.addEventListener('click', () => onAction());

function onAction() {
    getAudio(); // unlock audio context on first interaction
    if (phase === 'title') { phase = 'playing'; setDlg(levels[1].lines[0]); return; }
    if (phase === 'end') { resetGame(); return; }
    if (phase !== 'playing') return;
    if (!tw.done) { tw.shown = tw.full; tw.done = true; return; }
    if (gs.level === 2 && !gs.forestDone) return; // must walk to box
    if ((gs.level === 3 || gs.level === 4) && gs.mineProgress < gs.maxMine) return; // must mine first
    if (gs.level === 5 && !gs.swordDone) return;   // must walk to sword
    playSound('click');
    advanceDlg();
}

// ===== LEVELS =====
const levels = {
    1: { bgType: 'village', next: 2, lines: [
        "Elias: My mother... I have to help her.",
        "Villager: Get out of here, boy!",
        "Elias: Please... just a drop of water...",
        "Old Woman: Here, child. Take some water.",
        "Elias: Thank you... I hope I'm not too late...",
        "Elias: Mother? ... No... no... not now.",
        "Elias: I swear, one day I'll live in a castle, and never feel helpless again."
    ]},
    2: { bgType: 'forest', next: 3, lines: [
        "Elias: I remember... Father said something about a box in the forest.",
        "Narrator: The woods are dark and full of danger...",
        "Elias: I must find that box. I have nothing else to lose.",
        "Elias: There it is! A box buried under the roots!",
        "Elias: A letter... and a few coins. It's not much, but it's hope."
    ]},
    3: { bgType: 'mine', next: 4, lines: [
        "Elias: The city... and now this mine. Nothing like my village.",
        "Overseer: You! New boy! Grab a pickaxe. You work now!",
        "Elias: I can do this. For my dream... for her.",
        "Elias: I won't die in the dirt. I'll rise."
    ]},
    4: { bgType: 'mine', next: 5, lines: [
        "Elias: The mine is deeper than I thought...",
        "Elias: I've been working day and night... but it's not enough.",
        "Old Miner: You'll need to dig faster, boy, or they'll throw you out.",
        "Elias: I won't let them beat me. I'll find a way out of this.",
        "Elias: But I need more tools... better tools to survive this place."
    ]},
    5: { bgType: 'mine', next: 6, lines: [
        "Elias: A weapon... finally, something to defend myself.",
        "Mysterious Figure: You think you're ready? To fight the real battle?",
        "Elias: I have no choice. I'll fight if it means I can have a better life.",
        "Elias: I need to get out of this hellhole. I can't keep working in the mines.",
        "Mysterious Figure: Then follow me, boy. The world's bigger than this city."
    ]},
    6: { bgType: 'mountains', next: 7, lines: [
        "Elias: We've escaped the city... but now what?",
        "Mysterious Figure: Now, we go to the mountains. The real treasure lies there.",
        "Elias: Mountains? What's out there that can change my life?",
        "Mysterious Figure: The castle. The place you've always dreamed of.",
        "Elias: A castle? Can I really reach that high? It feels impossible.",
        "Mysterious Figure: Nothing's impossible, boy. Not for someone who fights."
    ]},
    7: { bgType: 'castle', next: null, lines: [
        "Elias: We've arrived... this is it. The castle of my dreams.",
        "Mysterious Figure: Welcome to your new life. This is where you'll rise.",
        "Elias: I'll show them all. They'll know who I am.",
        "Elias: I'll rule this land, and nothing will ever stop me again.",
        "Narrator: And so, Elias' journey continued — a journey of power, strength, and destiny.",
        "Narrator: But will it be enough? The future remains uncertain..."
    ]},
};

// ===== TYPEWRITER =====
function setDlg(text) {
    tw.full = text; tw.shown = ''; tw.idx = 0; tw.timer = 0; tw.done = false;
}
function tickTypewriter(dt) {
    if (tw.done) return;
    tw.timer += dt;
    while (tw.timer >= tw.speed && tw.idx < tw.full.length) {
        tw.timer -= tw.speed;
        tw.shown += tw.full[tw.idx++];
    }
    if (tw.idx >= tw.full.length) tw.done = true;
}

function advanceDlg() {
    const lines = levels[gs.level].lines;
    if (gs.dlgIdx < lines.length - 1) {
        gs.dlgIdx++;
        setDlg(lines[gs.dlgIdx]);
    } else {
        const next = levels[gs.level].next;
        if (next) beginFade(next);
        else { phase = 'end'; }
    }
}

// ===== FADE TRANSITION =====
function switchLevel(lvl) {
    gs.level = lvl; gs.dlgIdx = 0; gs.px = 150; gs.stamina = 100;
    gs.mineProgress = 0; gs.swordDone = false;
    setDlg(levels[lvl].lines[0]);
}

function beginFade(toLevel) {
    phase = 'fading'; fadeAlpha = 0; fadeDir = 1; pendingLevel = toLevel;
    playSound('fanfare');
}
function tickFade(dt) {
    fadeAlpha += fadeDir * dt * 0.0025;
    if (fadeDir === 1 && fadeAlpha >= 1) {
        fadeAlpha = 1;
        gs.level = pendingLevel; gs.dlgIdx = 0; gs.px = 150; gs.stamina = 100;
        gs.mineProgress = 0; gs.swordDone = false;
        setDlg(levels[pendingLevel].lines[0]);
        fadeDir = -1;
    } else if (fadeDir === -1 && fadeAlpha <= 0) {
        fadeAlpha = 0; phase = 'playing';
    }
}

function resetGame() {
    gs = { level:1, coins:0, stamina:100, px:150, py:545, dlgIdx:0,
           forestDone:false, mineProgress:0, maxMine:8, swordDone:false,
           walkFrame:0, walkTimer:0, facing:1, notifText:'', notifTimer:0 };
    phase = 'title';
}

function notify(text) { gs.notifText = text; gs.notifTimer = 2800; }

// ===== BACKGROUNDS =====

function stars(n) {
    ctx.fillStyle = '#fff';
    for (let i = 0; i < n; i++) {
        const x = (i * 139.7 + 40) % canvas.width;
        const y = (i * 91.3 + 15) % 280;
        const s = (i % 3) === 0 ? 2 : 1;
        ctx.globalAlpha = 0.4 + (i % 5) * 0.12;
        ctx.fillRect(x, y, s, s);
    }
    ctx.globalAlpha = 1;
}

function drawVillage() {
    const sky = ctx.createLinearGradient(0, 0, 0, 560);
    sky.addColorStop(0, '#0e0520'); sky.addColorStop(0.55, '#5a1f5a'); sky.addColorStop(1, '#b84030');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, canvas.width, 560);
    stars(40);
    // moon
    ctx.fillStyle = '#fafae0';
    ctx.beginPath(); ctx.arc(880, 75, 44, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#e8e4b8';
    ctx.beginPath(); ctx.arc(896, 68, 36, 0, Math.PI*2); ctx.fill();
    // hills
    ctx.fillStyle = '#2a1650';
    ctx.beginPath(); ctx.moveTo(0,430); ctx.quadraticCurveTo(200,330,400,400);
    ctx.quadraticCurveTo(600,320,800,390); ctx.quadraticCurveTo(1000,340,1100,410);
    ctx.lineTo(1100,560); ctx.lineTo(0,560); ctx.fill();
    // ground
    const gr = ctx.createLinearGradient(0,560,0,800);
    gr.addColorStop(0,'#3a2810'); gr.addColorStop(1,'#1e1408');
    ctx.fillStyle = gr; ctx.fillRect(0,560,canvas.width,240);
    // houses
    house(90,  385, 110, 130, '#4a2810', '#7a3a15');
    house(680, 365, 130, 155, '#3e2210', '#613010');
    house(880, 390,  95, 115, '#4a2810', '#7a3a15');
    house(240, 370, 150, 160, '#6a3818', '#9a4820');
    // well
    well(560, 490);
    // dirt path
    ctx.fillStyle = '#5a3e20';
    ctx.beginPath(); ctx.moveTo(280,660); ctx.bezierCurveTo(420,620,540,600,720,660);
    ctx.lineTo(670,690); ctx.bezierCurveTo(520,650,390,660,230,700); ctx.fill();
}

function house(x, y, w, h, wall, roof) {
    ctx.fillStyle = wall; ctx.fillRect(x, y+h*0.36, w, h*0.64);
    ctx.fillStyle = roof;
    ctx.beginPath(); ctx.moveTo(x-10,y+h*0.4); ctx.lineTo(x+w/2,y); ctx.lineTo(x+w+10,y+h*0.4); ctx.fill();
    ctx.fillStyle = '#ffcc66';
    ctx.fillRect(x+w*0.18, y+h*0.5, w*0.24, h*0.24);
    ctx.fillRect(x+w*0.58, y+h*0.5, w*0.24, h*0.24);
    ctx.fillStyle = '#2a1005'; ctx.fillRect(x+w*0.38, y+h*0.72, w*0.24, h*0.28);
}

function well(x, y) {
    ctx.fillStyle = '#777'; ctx.fillRect(x-22,y,44,26);
    ctx.fillStyle = '#444'; ctx.fillRect(x-3,y-28,6,28); ctx.fillRect(x-22,y-34,44,6);
    ctx.fillStyle = '#1a5580';
    ctx.beginPath(); ctx.ellipse(x,y+5,20,8,0,0,Math.PI*2); ctx.fill();
}

function drawForest() {
    const sky = ctx.createLinearGradient(0,0,0,560);
    sky.addColorStop(0,'#010610'); sky.addColorStop(0.6,'#081020'); sky.addColorStop(1,'#101e10');
    ctx.fillStyle = sky; ctx.fillRect(0,0,canvas.width,560);
    stars(80);
    // crescent
    ctx.fillStyle = '#d8d4a0';
    ctx.beginPath(); ctx.arc(180,80,38,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#081020';
    ctx.beginPath(); ctx.arc(196,72,32,0,Math.PI*2); ctx.fill();
    // bg trees
    for (let i=0;i<16;i++) tree(i*72+10, 560-(160+(i*41)%90), 160+(i*41)%90, '#0a150a','#080e08');
    // ground
    ctx.fillStyle = '#0a140a'; ctx.fillRect(0,560,canvas.width,240);
    ctx.fillStyle = 'rgba(80,120,80,0.05)'; ctx.fillRect(0,530,canvas.width,80);
    // fg trees
    tree(40,  200, 320, '#183018','#0f1f0f');
    tree(180, 250, 270, '#143014','#0c1c0c');
    tree(860, 210, 300, '#183018','#0f1f0f');
    tree(960, 260, 260, '#143014','#0c1c0c');
    // roots
    ctx.strokeStyle='#3a1e0a'; ctx.lineWidth=5;
    ctx.beginPath(); ctx.moveTo(625,490); ctx.quadraticCurveTo(605,515,588,508); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(625,490); ctx.quadraticCurveTo(648,518,664,510); ctx.stroke();
    // treasure box
    if (!gs.forestDone) treasureBox(610,455);
    // fireflies
    const t = Date.now()*0.001;
    for (let i=0;i<8;i++) {
        const fx=200+Math.sin(t+i*2.1)*280+i*85, fy=430+Math.cos(t*0.7+i*1.4)*35;
        const a=0.25+Math.sin(t*2+i)*0.25;
        ctx.fillStyle=`rgba(160,255,80,${a})`; ctx.beginPath(); ctx.arc(fx,fy,3,0,Math.PI*2); ctx.fill();
        ctx.fillStyle=`rgba(160,255,80,${a*0.25})`; ctx.beginPath(); ctx.arc(fx,fy,9,0,Math.PI*2); ctx.fill();
    }
}

function tree(x, y, h, trunk, leaf) {
    const w = h*0.18;
    ctx.fillStyle=trunk; ctx.fillRect(x-w/4, y+h*0.6, w/2, h*0.4);
    ctx.fillStyle=leaf;
    [[0,0,0.8,0.4],[0.2,0.6,1,0.6],[0.35,0.75,1.1,0.75]].forEach(([dy,h2,sw,sh]) => {
        ctx.beginPath(); ctx.moveTo(x,y+h*dy); ctx.lineTo(x-w*sw,y+h*(dy+sh));
        ctx.lineTo(x+w*sw,y+h*(dy+sh)); ctx.fill();
    });
}

function treasureBox(x, y) {
    const p = 0.7 + Math.sin(Date.now()*0.003)*0.3;
    ctx.shadowColor='#ffd700'; ctx.shadowBlur=18*p;
    ctx.fillStyle='#5a3015'; ctx.fillRect(x,y,36,28);
    ctx.fillStyle='#7a4520'; ctx.fillRect(x-2,y-8,40,12);
    ctx.strokeStyle='#9a7820'; ctx.lineWidth=2; ctx.strokeRect(x,y,36,28); ctx.strokeRect(x-2,y-8,40,12);
    ctx.fillStyle='#daa520'; ctx.fillRect(x+14,y+9,8,8);
    ctx.shadowBlur=0;
    ctx.fillStyle=`rgba(255,220,50,${p*0.85})`; ctx.font='bold 12px monospace';
    ctx.textAlign='center'; ctx.fillText("Father's Box",x+18,y-14); ctx.textAlign='left';
}

function drawMine() {
    const bg=ctx.createRadialGradient(450,300,40,450,300,520);
    bg.addColorStop(0,'#2a1a08'); bg.addColorStop(0.5,'#180e04'); bg.addColorStop(1,'#060402');
    ctx.fillStyle=bg; ctx.fillRect(0,0,canvas.width,canvas.height);
    // ceiling stalactites
    ctx.fillStyle='#1a1006';
    for (let rx=0;rx<canvas.width;rx+=55) {
        const rh=28+(rx*7)%45;
        ctx.beginPath(); ctx.moveTo(rx,0); ctx.lineTo(rx+27,rh); ctx.lineTo(rx+55,0); ctx.fill();
    }
    // side walls
    ctx.fillStyle='#180e04'; ctx.fillRect(0,0,60,canvas.height); ctx.fillRect(canvas.width-60,0,60,canvas.height);
    // ore veins
    ctx.strokeStyle='#b87a10'; ctx.lineWidth=3;
    [[90,180,170,270],[180,140,210,240],[810,170,860,290],[920,210,880,310]].forEach(([x1,y1,x2,y2])=>{
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
        ctx.fillStyle='#ffd700'; ctx.beginPath(); ctx.arc((x1+x2)/2,(y1+y2)/2,5,0,Math.PI*2); ctx.fill();
    });
    // ground
    const gr=ctx.createLinearGradient(0,560,0,800);
    gr.addColorStop(0,'#281604'); gr.addColorStop(1,'#140c02');
    ctx.fillStyle=gr; ctx.fillRect(0,560,canvas.width,240);
    // torches
    torch(110,310); torch(420,290); torch(680,300); torch(960,315);
    // mine rock (levels 3 & 4)
    if (gs.level===3||gs.level===4) {
        mineRock(380,470);
        pickaxe(450,450);
        // progress bar
        if (gs.mineProgress>0) {
            const pct=gs.mineProgress/gs.maxMine;
            ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(335,442,148,15);
            ctx.fillStyle='#ff8800'; ctx.fillRect(336,443,146*pct,13);
            ctx.strokeStyle='#ffaa00'; ctx.lineWidth=1; ctx.strokeRect(335,442,148,15);
            ctx.fillStyle='#fff'; ctx.font='10px monospace'; ctx.textAlign='center';
            ctx.fillText('MINING',409,453); ctx.textAlign='left';
        }
    }
    // sword (level 5)
    if (gs.level===5 && !gs.swordDone) {
        drawSwordPickup(390,420);
    }
}

function mineRock(x,y) {
    ctx.fillStyle='#4a4a4a'; ctx.fillRect(x,y,58,52);
    ctx.fillStyle='#5e5e5e'; ctx.fillRect(x+5,y+5,48,18);
    ctx.strokeStyle='#2a2a2a'; ctx.lineWidth=2; ctx.strokeRect(x,y,58,52);
    ctx.fillStyle='#ffd700'; ctx.fillRect(x+14,y+22,8,7); ctx.fillRect(x+34,y+30,6,5);
}

function pickaxe(x,y) {
    ctx.save(); ctx.translate(x,y); ctx.rotate(-0.4);
    ctx.fillStyle='#7a3e10'; ctx.fillRect(-4,0,7,42);
    ctx.fillStyle='#999';
    ctx.beginPath(); ctx.moveTo(-11,-4); ctx.lineTo(0,-18); ctx.lineTo(11,-4); ctx.lineTo(7,5); ctx.lineTo(-7,5); ctx.fill();
    ctx.restore();
}

function drawSwordPickup(x,y) {
    const p=0.7+Math.sin(Date.now()*0.004)*0.3;
    ctx.shadowColor='#4488ff'; ctx.shadowBlur=20*p;
    ctx.fillStyle='#aaa'; ctx.fillRect(x,y,5,50);
    ctx.fillStyle='#daa520'; ctx.fillRect(x-10,y+48,25,6);
    ctx.fillStyle='#8B4513'; ctx.fillRect(x,y+52,5,14);
    ctx.shadowBlur=0;
    ctx.fillStyle=`rgba(150,200,255,${p*0.85})`; ctx.font='bold 13px monospace';
    ctx.textAlign='center'; ctx.fillText('Pick up sword',x+2,y-10); ctx.textAlign='left';
}

function torch(x,y) {
    ctx.fillStyle='#7a3e10'; ctx.fillRect(x-3,y,6,18);
    const t=Date.now()*0.005, fl=Math.sin(t+x)*3;
    const grd=ctx.createRadialGradient(x+fl,y-10,2,x,y,20);
    grd.addColorStop(0,'rgba(255,255,100,0.9)'); grd.addColorStop(0.4,'rgba(255,140,0,0.6)'); grd.addColorStop(1,'rgba(255,50,0,0)');
    ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(x+fl,y-10,13,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(255,140,40,0.06)'; ctx.beginPath(); ctx.arc(x,y,65,0,Math.PI*2); ctx.fill();
}

function drawMountains() {
    const sky=ctx.createLinearGradient(0,0,0,560);
    sky.addColorStop(0,'#06031a'); sky.addColorStop(0.4,'#150e50'); sky.addColorStop(0.7,'#381440'); sky.addColorStop(1,'#601828');
    ctx.fillStyle=sky; ctx.fillRect(0,0,canvas.width,560);
    stars(65);
    // sun glow
    const sg=ctx.createRadialGradient(540,500,0,540,500,180);
    sg.addColorStop(0,'rgba(255,210,80,0.6)'); sg.addColorStop(0.4,'rgba(255,130,40,0.3)'); sg.addColorStop(1,'rgba(255,80,0,0)');
    ctx.fillStyle=sg; ctx.fillRect(0,0,canvas.width,canvas.height);
    // far mountains
    ctx.fillStyle='#18103a';
    ctx.beginPath(); ctx.moveTo(0,560); ctx.lineTo(120,300); ctx.lineTo(260,430); ctx.lineTo(420,220);
    ctx.lineTo(560,380); ctx.lineTo(700,240); ctx.lineTo(860,400); ctx.lineTo(1000,280); ctx.lineTo(1100,360); ctx.lineTo(1100,560); ctx.fill();
    // mid mountains
    ctx.fillStyle='#241850';
    ctx.beginPath(); ctx.moveTo(0,560); ctx.lineTo(90,380); ctx.lineTo(220,470); ctx.lineTo(360,320);
    ctx.lineTo(490,440); ctx.lineTo(620,330); ctx.lineTo(760,450); ctx.lineTo(900,340); ctx.lineTo(1050,460); ctx.lineTo(1100,380); ctx.lineTo(1100,560); ctx.fill();
    // snow caps
    ctx.fillStyle='rgba(255,255,255,0.65)';
    [[420,220],[700,240],[360,320],[620,330]].forEach(([mx,my])=>{
        ctx.beginPath(); ctx.moveTo(mx,my); ctx.lineTo(mx-22,my+38); ctx.lineTo(mx+22,my+38); ctx.fill();
    });
    // ground
    const gr=ctx.createLinearGradient(0,560,0,800);
    gr.addColorStop(0,'#362014'); gr.addColorStop(1,'#180c08');
    ctx.fillStyle=gr; ctx.fillRect(0,560,canvas.width,240);
    // path
    ctx.fillStyle='#503018';
    ctx.beginPath(); ctx.moveTo(150,700); ctx.bezierCurveTo(320,650,500,600,720,560);
    ctx.lineTo(740,590); ctx.bezierCurveTo(515,625,340,668,170,730); ctx.fill();
}

function drawCastleScene() {
    const sky=ctx.createLinearGradient(0,0,0,560);
    sky.addColorStop(0,'#0a1838'); sky.addColorStop(0.35,'#183860'); sky.addColorStop(0.7,'#3a5a20'); sky.addColorStop(1,'#5a7a20');
    ctx.fillStyle=sky; ctx.fillRect(0,0,canvas.width,560);
    cloud(140,110,100); cloud(780,95,125); cloud(490,75,85);
    castle(310,100);
    const gr=ctx.createLinearGradient(0,560,0,800);
    gr.addColorStop(0,'#285018'); gr.addColorStop(1,'#162e0c');
    ctx.fillStyle=gr; ctx.fillRect(0,560,canvas.width,240);
    // grass tufts
    ctx.fillStyle='#366020';
    for (let gx=0;gx<canvas.width;gx+=14) { ctx.fillRect(gx,559,3,7); ctx.fillRect(gx+7,557,3,10); }
    // flowers
    ['#ff7070','#ffd700','#a0d8ee','#ff9fee'].forEach((c,i)=>{
        for (let f=0;f<9;f++) {
            ctx.fillStyle=c; ctx.beginPath();
            ctx.arc((i*190+f*110+60)%(canvas.width-20), 568+(f%3)*4, 4, 0, Math.PI*2); ctx.fill();
        }
    });
}

function cloud(x,y,s) {
    ctx.fillStyle='rgba(255,255,255,0.55)';
    [0,s*0.35,-s*0.35,s*0.6].forEach((ox,i) => {
        const r=[s*0.38,s*0.28,s*0.23,s*0.23][i], dy=[0,-s*0.08,s*0.05,s*0.05][i];
        ctx.beginPath(); ctx.arc(x+ox,y+dy,r,0,Math.PI*2); ctx.fill();
    });
}

function castle(x,y) {
    const W=480,H=320;
    // main keep
    ctx.fillStyle='#8888a0'; ctx.fillRect(x+110,y+90,W-220,H-90);
    // towers
    tower(x,     y+40,  80, H-40);
    tower(x+W-80,y+40,  80, H-40);
    tower(x+130, y,     68, H+10);
    tower(x+W-200,y,    68, H+10);
    tower(x+W/2-35,y-20,70, H+30);
    // gate arch
    ctx.fillStyle='#181828';
    ctx.beginPath(); ctx.arc(x+W/2,y+H-35,48,Math.PI,0);
    ctx.lineTo(x+W/2+48,y+H+5); ctx.lineTo(x+W/2-48,y+H+5); ctx.fill();
    // portcullis
    ctx.strokeStyle='#2a2a3a'; ctx.lineWidth=3;
    for (let px=x+W/2-44;px<x+W/2+44;px+=14) {
        ctx.beginPath(); ctx.moveTo(px,y+H-78); ctx.lineTo(px,y+H+5); ctx.stroke();
    }
    for (let py=y+H-78;py<y+H+5;py+=18) {
        ctx.beginPath(); ctx.moveTo(x+W/2-46,py); ctx.lineTo(x+W/2+46,py); ctx.stroke();
    }
    // flag
    const ft=Date.now()*0.002;
    ctx.strokeStyle='#7a3a10'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(x+W/2-35,y-40); ctx.lineTo(x+W/2-35,y+12); ctx.stroke();
    ctx.fillStyle='#cc1111';
    ctx.beginPath(); ctx.moveTo(x+W/2-35,y-38); ctx.lineTo(x+W/2-35+28+Math.sin(ft)*5,y-26);
    ctx.lineTo(x+W/2-35,y-14); ctx.fill();
    // windows
    ctx.fillStyle='#ffe080';
    [[x+155,y+110],[x+195,y+110],[x+240,y+110],[x+155,y+150],[x+195,y+150],[x+240,y+150]].forEach(([wx,wy])=>{
        ctx.fillRect(wx,wy,14,18);
    });
    // stone lines
    ctx.strokeStyle='rgba(0,0,0,0.18)'; ctx.lineWidth=1;
    for (let sy=y+90;sy<y+H;sy+=18) {
        ctx.beginPath(); ctx.moveTo(x+110,sy); ctx.lineTo(x+W-110,sy); ctx.stroke();
    }
}

function tower(x,y,w,h) {
    ctx.fillStyle='#787890'; ctx.fillRect(x,y,w,h);
    ctx.fillStyle='#8888a0';
    for (let b=x;b<x+w;b+=15) ctx.fillRect(b,y-18,10,18);
    ctx.fillStyle='#ffe080'; ctx.fillRect(x+w/2-6,y+35,13,17);
    ctx.strokeStyle='rgba(0,0,0,0.14)'; ctx.lineWidth=1;
    for (let sy=y;sy<y+h;sy+=18) {
        ctx.beginPath(); ctx.moveTo(x,sy); ctx.lineTo(x+w,sy); ctx.stroke();
    }
}

// ===== ELIAS (PIXEL CHARACTER) =====
function drawElias(dt) {
    const x=gs.px, y=gs.py;
    const moving=keys['ArrowLeft']||keys['ArrowRight'];
    if (keys['ArrowRight']) gs.facing=1;
    if (keys['ArrowLeft']) gs.facing=-1;
    if (moving) { gs.walkTimer+=dt; if(gs.walkTimer>180){gs.walkFrame=(gs.walkFrame+1)%4;gs.walkTimer=0;} }
    else gs.walkFrame=0;
    const leg=[0,9,0,-9][gs.walkFrame], arm=[7,0,-7,0][gs.walkFrame];
    ctx.save(); ctx.translate(x+20,y);
    // shadow
    ctx.fillStyle='rgba(0,0,0,0.28)';
    ctx.beginPath(); ctx.ellipse(0,66,16,5,0,0,Math.PI*2); ctx.fill();
    // cape if sword
    if (gs.swordDone) {
        ctx.fillStyle='#8a0010';
        ctx.beginPath(); ctx.moveTo(-8,20); ctx.quadraticCurveTo(-22,40,-16,66); ctx.lineTo(-4,66); ctx.lineTo(0,38); ctx.fill();
    }
    // legs
    ctx.fillStyle='#3e2808'; ctx.fillRect(-5+leg,43,10,21); ctx.fillRect(5-leg,43,10,21);
    ctx.fillStyle='#241405'; ctx.fillRect(-6+leg,59,12,7); ctx.fillRect(4-leg,59,12,7);
    // body
    ctx.fillStyle='#5a3818'; ctx.fillRect(-10,20,20,24);
    ctx.fillStyle='#361e0a'; ctx.fillRect(-10,39,20,4);
    ctx.fillStyle='#c8921a'; ctx.fillRect(-3,39,6,4);
    // arms
    ctx.fillStyle='#5a3818'; ctx.fillRect(-16,22+arm,8,17); ctx.fillRect(8,22-arm,8,17);
    ctx.fillStyle='#c09050';
    ctx.beginPath(); ctx.arc(-12,39+arm,5,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(12,39-arm,5,0,Math.PI*2); ctx.fill();
    // sword on back
    if (gs.swordDone) {
        ctx.save(); ctx.translate(14,28); ctx.rotate(0.25);
        ctx.fillStyle='#aaa'; ctx.fillRect(-2,-24,4,24);
        ctx.fillStyle='#daa520'; ctx.fillRect(-5,-2,10,4);
        ctx.fillStyle='#7a3a10'; ctx.fillRect(-2,-2,4,10);
        ctx.restore();
    }
    // head
    ctx.fillStyle='#c09050'; ctx.fillRect(-10,0,20,20);
    ctx.fillStyle='#2e1608'; ctx.fillRect(-10,0,20,7);
    if(gs.facing>0) ctx.fillRect(8,7,4,5); else ctx.fillRect(-12,7,4,5);
    ctx.fillStyle='#111';
    if(gs.facing>0){ctx.fillRect(2,9,4,4);ctx.fillStyle='#fff';ctx.fillRect(4,9,2,2);}
    else{ctx.fillRect(-6,9,4,4);ctx.fillStyle='#fff';ctx.fillRect(-6,9,2,2);}
    ctx.restore();
}

// ===== HUD =====
function drawHUD() {
    // stamina
    ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(18,18,104,14);
    const sc=gs.stamina>50?'#44dd44':gs.stamina>25?'#ddaa11':'#dd3333';
    ctx.fillStyle=sc; ctx.fillRect(20,20,gs.stamina,10);
    ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.lineWidth=1; ctx.strokeRect(20,20,100,10);
    ctx.fillStyle='rgba(255,255,255,0.6)'; ctx.font='10px monospace'; ctx.fillText('STAMINA',22,16);
    // coins
    ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(canvas.width-122,14,108,24);
    ctx.fillStyle='#FFD700'; ctx.font='bold 16px monospace';
    ctx.textAlign='right'; ctx.fillText('⬡ '+gs.coins,canvas.width-18,32); ctx.textAlign='left';
    // chapter
    ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(canvas.width/2-60,14,120,22);
    ctx.fillStyle='rgba(255,255,255,0.65)'; ctx.font='12px monospace';
    ctx.textAlign='center'; ctx.fillText('CHAPTER '+gs.level+' / 7',canvas.width/2,30); ctx.textAlign='left';
}

// ===== DIALOGUE BOX =====
function drawDialogueBox(text) {
    const bx=50,by=628,bw=1000,bh=140;
    ctx.fillStyle='rgba(4,4,18,0.9)'; ctx.fillRect(bx,by,bw,bh);
    ctx.strokeStyle='#8B6914'; ctx.lineWidth=2; ctx.strokeRect(bx,by,bw,bh);
    ctx.strokeStyle='rgba(200,160,30,0.28)'; ctx.lineWidth=1; ctx.strokeRect(bx+4,by+4,bw-8,bh-8);
    // parse speaker
    let speaker='', msg=text;
    const ci=text.indexOf(':');
    if(ci>0&&ci<22){speaker=text.slice(0,ci).trim(); msg=text.slice(ci+1).trim();}
    if(speaker){
        ctx.fillStyle='#DAA520'; ctx.font='bold 14px monospace'; ctx.fillText(speaker,bx+20,by+22);
        const nw=ctx.measureText(speaker).width;
        ctx.strokeStyle='#DAA520'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(bx+20,by+25); ctx.lineTo(bx+20+nw,by+25); ctx.stroke();
    }
    ctx.fillStyle='#ddd8cc'; ctx.font='17px monospace';
    wrapText(msg,bw-60).forEach((line,i)=>ctx.fillText(line,bx+20,by+50+i*27));
    if(tw.done){
        const p=0.4+Math.sin(Date.now()*0.004)*0.3;
        ctx.fillStyle=`rgba(160,150,110,${p})`; ctx.font='12px monospace';
        ctx.textAlign='right'; ctx.fillText('[ Click or ENTER ]',bx+bw-14,by+bh-12); ctx.textAlign='left';
    }
}

function wrapText(text,maxW) {
    const words=text.split(' '), lines=[];
    let cur='';
    words.forEach(w=>{
        const test=cur?cur+' '+w:w;
        if(ctx.measureText(test).width>maxW&&cur){lines.push(cur);cur=w;}
        else cur=test;
    });
    if(cur)lines.push(cur);
    return lines;
}

// ===== NOTIFICATION =====
function drawNotification() {
    if(!gs.notifText||gs.notifTimer<=0) return;
    const a=Math.min(1,gs.notifTimer/600);
    const tw_=ctx.measureText(gs.notifText).width+44;
    ctx.save(); ctx.globalAlpha=a;
    ctx.fillStyle='rgba(0,0,0,0.78)'; ctx.fillRect(canvas.width/2-tw_/2,190,tw_,42);
    ctx.strokeStyle='#ffd700'; ctx.lineWidth=1; ctx.strokeRect(canvas.width/2-tw_/2,190,tw_,42);
    ctx.fillStyle='#ffd700'; ctx.font='bold 18px monospace';
    ctx.textAlign='center'; ctx.fillText(gs.notifText,canvas.width/2,217);
    ctx.textAlign='left'; ctx.restore();
}

// ===== TITLE SCREEN =====
function drawTitle() {
    const bg=ctx.createLinearGradient(0,0,0,canvas.height);
    bg.addColorStop(0,'#010610'); bg.addColorStop(0.5,'#0c1428'); bg.addColorStop(1,'#180810');
    ctx.fillStyle=bg; ctx.fillRect(0,0,canvas.width,canvas.height);
    stars(110);
    // castle silhouette
    ctx.fillStyle='rgba(14,10,28,0.92)';
    ctx.fillRect(0,600,canvas.width,200);
    ctx.fillRect(260,460,520,160);
    [[260,370,75],[440,310,65],[635,310,65],[520,270,70],[480,640,canvas.height]].forEach(([tx,ty,tw])=>{
        ctx.fillRect(tx,ty,tw,600-ty+10);
        for(let b=tx;b<tx+tw;b+=15) ctx.fillRect(b,ty-16,10,16);
    });
    const t=Date.now()*0.001;
    ctx.shadowColor='#DAA520'; ctx.shadowBlur=18*(0.8+Math.sin(t)*0.2);
    ctx.fillStyle='#DAA520'; ctx.font='bold 56px serif';
    ctx.textAlign='center';
    ctx.fillText('The Boy Who',canvas.width/2,210);
    ctx.fillText('Dreamed of a Castle',canvas.width/2,278);
    ctx.shadowBlur=0;
    ctx.fillStyle='rgba(210,185,115,0.78)'; ctx.font='italic 20px serif';
    ctx.fillText('A story of hope, struggle, and destiny',canvas.width/2,322);
    ctx.strokeStyle='rgba(218,165,32,0.35)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(canvas.width/2-210,345); ctx.lineTo(canvas.width/2+210,345); ctx.stroke();
    if(Math.sin(t*2.2)>0){
        ctx.fillStyle='rgba(255,250,200,0.9)'; ctx.font='21px monospace';
        ctx.fillText('Click or press ENTER to begin',canvas.width/2,415);
    }
    ctx.fillStyle='rgba(80,80,80,0.5)'; ctx.font='12px monospace';
    ctx.fillText('v2.0',canvas.width/2,canvas.height-18);
    ctx.textAlign='left'; ctx.shadowBlur=0;
}

// ===== END SCREEN =====
function drawEnd() {
    const bg=ctx.createLinearGradient(0,0,0,canvas.height);
    bg.addColorStop(0,'#0a1428'); bg.addColorStop(1,'#182a0c');
    ctx.fillStyle=bg; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.globalAlpha=0.25; drawCastleScene(); ctx.globalAlpha=1;
    ctx.fillStyle='rgba(0,0,0,0.62)'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.textAlign='center';
    ctx.shadowColor='#DAA520'; ctx.shadowBlur=28;
    ctx.fillStyle='#DAA520'; ctx.font='bold 72px serif'; ctx.fillText('THE END',canvas.width/2,270);
    ctx.shadowBlur=0;
    ctx.fillStyle='rgba(210,195,150,0.88)'; ctx.font='italic 22px serif';
    ctx.fillText('"Elias reached his castle — but the real journey was within."',canvas.width/2,330);
    ctx.fillStyle='rgba(255,255,255,0.12)'; ctx.fillRect(canvas.width/2-210,368,420,128);
    ctx.strokeStyle='rgba(218,165,32,0.38)'; ctx.lineWidth=1; ctx.strokeRect(canvas.width/2-210,368,420,128);
    ctx.fillStyle='#aaa'; ctx.font='15px monospace'; ctx.fillText('JOURNEY COMPLETE',canvas.width/2,398);
    ctx.fillStyle='#FFD700'; ctx.font='22px monospace'; ctx.fillText('Total Coins: '+gs.coins,canvas.width/2,440);
    ctx.fillStyle='#888'; ctx.font='14px monospace'; ctx.fillText('7 chapters completed',canvas.width/2,472);
    const p=0.5+Math.sin(Date.now()*0.003)*0.3;
    ctx.fillStyle=`rgba(200,200,180,${p})`; ctx.font='17px monospace';
    ctx.fillText('Click to play again',canvas.width/2,555);
    ctx.textAlign='left'; ctx.shadowBlur=0;
}

// ===== HINTS =====
function drawHint(text) {
    ctx.fillStyle='rgba(255,255,255,0.42)'; ctx.font='13px monospace';
    ctx.textAlign='center'; ctx.fillText(text,canvas.width/2,610); ctx.textAlign='left';
}

// ===== UPDATE =====
function updatePlayer() {
    if(keys['ArrowRight']) gs.px+=3;
    if(keys['ArrowLeft'])  gs.px-=3;
    gs.px=Math.max(0,Math.min(canvas.width-40,gs.px));
}

function updateInteractions() {
    // Level 2: walk to treasure box
    if(gs.level===2&&!gs.forestDone&&gs.px>570&&gs.px<660) {
        gs.forestDone=true; gs.coins+=10;
        playSound('coin'); notify('+10 Coins! Found Father\'s box!');
        setTimeout(()=>advanceDlg(),900);
    }
    // Level 3 & 4: mining
    if((gs.level===3||gs.level===4)&&gs.mineProgress<gs.maxMine) {
        const now=Date.now();
        if(keys[' ']&&gs.px>320&&gs.px<460&&gs.stamina>0&&now-lastMineHit>380) {
            lastMineHit=now;
            gs.mineProgress++; gs.stamina=Math.max(0,gs.stamina-8);
            playSound('mine');
            if(gs.mineProgress>=gs.maxMine){
                gs.coins+=15; playSound('coin'); notify('+15 Coins! Mining complete!');
                setTimeout(()=>advanceDlg(),900);
            }
        }
    }
    // Level 5: pick up sword
    if(gs.level===5&&!gs.swordDone&&gs.px>350&&gs.px<450) {
        gs.swordDone=true; playSound('fanfare'); notify('Sword equipped!');
        setTimeout(()=>advanceDlg(),1000);
    }
}

// ===== MAIN LOOP =====
function loop(ts) {
    const dt=lastTime?ts-lastTime:0; lastTime=ts;
    ctx.clearRect(0,0,canvas.width,canvas.height);

    if(phase==='title') {
        drawTitle();
    } else if(phase==='end') {
        drawEnd();
    } else {
        // draw bg
        switch(levels[gs.level].bgType){
            case 'village':   drawVillage();      break;
            case 'forest':    drawForest();       break;
            case 'mine':      drawMine();         break;
            case 'mountains': drawMountains();    break;
            case 'castle':    drawCastleScene();  break;
        }
        drawElias(dt);
        drawHUD();
        drawNotification();
        // hints
        if(gs.level===2&&!gs.forestDone) drawHint('[ Walk right to find the box ]');
        if((gs.level===3||gs.level===4)&&gs.mineProgress<gs.maxMine&&tw.done) drawHint('[ SPACE to mine near the rock ]');
        if(gs.level===5&&!gs.swordDone&&tw.done) drawHint('[ Walk right to pick up the sword ]');
        drawDialogueBox(tw.shown);
        // fade overlay
        if(phase==='fading'){
            ctx.fillStyle=`rgba(0,0,0,${fadeAlpha})`; ctx.fillRect(0,0,canvas.width,canvas.height);
        }
        // updates
        tickTypewriter(dt);
        updatePlayer();
        updateInteractions();
        if(gs.notifTimer>0) gs.notifTimer-=dt;
        if(phase==='fading') tickFade(dt);
    }

    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

// Debug bridge for automated testing / screenshots
window._game = {
    jumpTo: (lvl) => { phase = 'playing'; switchLevel(lvl); },
    setState: (patch) => Object.assign(gs, patch),
    endGame: () => { phase = 'end'; },
};
