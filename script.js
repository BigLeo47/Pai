// Pac-Man simples (canvas). Grid-based, pellets, score, sem fantasmas.
// Ajuste o mapa para ficar mais complexo se quiser.

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const TILE = 16;                 // tamanho do tile em px
const ROWS = 31;                 // padrão clássico aproximado
const COLS = 28;
const WIDTH = COLS * TILE;
const HEIGHT = ROWS * TILE;
canvas.width = WIDTH;
canvas.height = HEIGHT;

// mapa: 0 = empty, 1 = wall, 2 = pellet
// mapa simples: rodeado por paredes e algumas paredes internas (pequeno layout)
const rawMap = [
  "1111111111111111111111111111",
  "1000000000000000000000000001",
  "1011110111110111110111110101",
  "1020000100000100000100000201",
  "1011110111110111110111110101",
  "1000000000000000000000000001",
  "1011110110111111011011110101",
  "1000000100000000010000000001",
  "1111100111110111110011110111",
  "0000100000100000100000100000",
  "1111101110111111011110111111",
  "1000000000000000000000000001",
  "1011110111110111110111110101",
  "1020000100000100000100000201",
  "1011110111110111110111110101",
  "1000000000000000000000000001",
  "1111111111111111111111111111",
  // fill to ROWS (31) with empty rows if needed
];

while(rawMap.length < ROWS) rawMap.push("1".repeat(COLS));

const map = rawMap.map(row => row.split('').map(ch => {
  if(ch === '1') return 1;
  if(ch === '2') return 2;
  return 0;
}));

// player
const player = {
  r: 3, c: 13,      // row/col start (ajuste se ficar numa parede)
  dir: null,
  nextDir: null,
  px: 0, py: 0,
  speed: 4,         // pixels por frame
  mouth: 0,
  mouthDir: 1
};

player.px = player.c * TILE + TILE/2;
player.py = player.r * TILE + TILE/2;

// score
let score = 0;

// input
window.addEventListener('keydown', e => {
  if(e.key.includes('Arrow')) {
    e.preventDefault();
    const k = e.key;
    if(k === 'ArrowLeft') player.nextDir = 'L';
    if(k === 'ArrowRight') player.nextDir = 'R';
    if(k === 'ArrowUp') player.nextDir = 'U';
    if(k === 'ArrowDown') player.nextDir = 'D';
  }
});

// helpers
function tileAt(px, py){ // retorna valor do tile baseado em pixels
  const c = Math.floor(px / TILE);
  const r = Math.floor(py / TILE);
  if(r < 0 || r >= ROWS || c < 0 || c >= COLS) return 1;
  return map[r][c];
}

function canMoveTo(r, c){
  if(r < 0 || r >= ROWS || c < 0 || c >= COLS) return false;
  return map[r][c] !== 1;
}

function dirToDelta(d){
  if(d === 'L') return {dr:0, dc:-1};
  if(d === 'R') return {dr:0, dc:1};
  if(d === 'U') return {dr:-1, dc:0};
  if(d === 'D') return {dr:1, dc:0};
  return {dr:0, dc:0};
}

// update loop
function update(){
  // try change direction at tile center
  const centerX = Math.round(player.px - TILE/2) % TILE === 0;
  const centerY = Math.round(player.py - TILE/2) % TILE === 0;
  if(centerX && centerY && player.nextDir){
    const delta = dirToDelta(player.nextDir);
    const targetR = Math.floor(player.py / TILE) + delta.dr;
    const targetC = Math.floor(player.px / TILE) + delta.dc;
    if(canMoveTo(targetR, targetC)) {
      player.dir = player.nextDir;
      player.nextDir = null;
    }
  }

  // move
  if(player.dir){
    const d = dirToDelta(player.dir);
    const nx = player.px + d.dc * player.speed;
    const ny = player.py + d.dr * player.speed;

    // check collision with walls using next position center tile
    const corners = [
      {x:nx - TILE/2 + 1, y: ny - TILE/2 + 1},
      {x:nx + TILE/2 - 1, y: ny - TILE/2 + 1},
      {x:nx - TILE/2 + 1, y: ny + TILE/2 - 1},
      {x:nx + TILE/2 - 1, y: ny + TILE/2 - 1},
    ];
    let blocked = false;
    for(const pt of corners){
      if(tileAt(pt.x, pt.y) === 1) { blocked = true; break; }
    }
    if(!blocked){
      player.px = nx; player.py = ny;
    } else {
      // stop at wall: snap to tile grid
      player.dir = null;
    }
  }

  // pellet collection
  const pr = Math.floor(player.py / TILE);
  const pc = Math.floor(player.px / TILE);
  if(map[pr][pc] === 2){
    map[pr][pc] = 0;
    score += 10;
    document.getElementById('score').textContent = 'Score: ' + score;
  }

  // mouth animation
  player.mouth += 0.2 * player.mouthDir;
  if(player.mouth > 0.9 || player.mouth < 0) player.mouthDir *= -1;

  // win check
  let pelletsLeft = 0;
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) if(map[r][c] === 2) pelletsLeft++;
  if(pelletsLeft === 0){
    // ganhou
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0,0,WIDTH,HEIGHT);
    ctx.fillStyle = 'white';
    ctx.font = '24px system-ui';
    ctx.fillText('Você ganhou! Score: ' + score, 40, HEIGHT/2);
    running = false;
  }
}

function draw(){
  // clear
  ctx.clearRect(0,0,WIDTH,HEIGHT);

  // draw map
  for(let r=0;r<ROWS;r++){
    for(let c=0;c<COLS;c++){
      const x = c * TILE;
      const y = r * TILE;
      if(map[r][c] === 1){
        ctx.fillStyle = '#001f7a';
        ctx.fillRect(x, y, TILE, TILE);
      } else if(map[r][c] === 2){
        // pellet center
        ctx.fillStyle = '#ffd27f';
        ctx.beginPath();
        ctx.arc(x + TILE/2, y + TILE/2, 3, 0, Math.PI*2);
        ctx.fill();
      }
    }
  }

  // draw pacman
  const ang = player.mouth * Math.PI / 3;
  let dirAngle = 0;
  if(player.dir === 'L') dirAngle = Math.PI;
  if(player.dir === 'U') dirAngle = -Math.PI/2;
  if(player.dir === 'D') dirAngle = Math.PI/2;

  ctx.save();
  ctx.translate(player.px, player.py);
  ctx.rotate(dirAngle);
  ctx.fillStyle = '#ffd500';
  ctx.beginPath();
  ctx.moveTo(0,0);
  ctx.arc(0, 0, TILE/2 - 1, ang, Math.PI*2 - ang);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

let running = true;
function loop(){
  if(running){
    update();
    draw();
    requestAnimationFrame(loop);
  }
}

document.getElementById('restart').addEventListener('click', ()=>{
  location.reload();
});

// inicializa score e inicia
document.getElementById('score').textContent = 'Score: ' + score;
loop();
