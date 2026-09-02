/* 
© 2026 Not Found Pages · 404-particle-reassembly-classic
Released under the MIT License

Repository → https://github.com/notfoundpages/404-particle-reassembly-classic
Live Preview → https://notfoundpages.github.io/404-particle-reassembly-classic

Discover the full collection → https://notfoundpages.github.io
*/

const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');

let particleArray = [];
let adjustX = 0;
let adjustY = 0;

// Mouse / touch
const mouse = { x: undefined, y: undefined, radius: 120 };

function updateMouseFromEvent(e) {
  // prefer clientX for consistent coords
  const cx = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
  const cy = (e.touches && e.touches[0]) ? e.touches[0].clientY : e.clientY;
  mouse.x = cx;
  mouse.y = cy;
}

window.addEventListener('mousemove', updateMouseFromEvent, { passive: true });
window.addEventListener('touchmove', updateMouseFromEvent, { passive: true });
window.addEventListener('mouseleave', () => { mouse.x = undefined; mouse.y = undefined; });
window.addEventListener('touchend', () => { mouse.x = undefined; mouse.y = undefined; });

// --- THE PARTICLE CLASS ---
class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 2; // CSS pixels
    this.baseX = x;
    this.baseY = y;
    this.density = (Math.random() * 25) + 5;
    // maximum distance this particle may stray from its base (keeps shape precise)
    this.maxOffset = 6 + Math.random() * 6; // px
    this.color = 'rgba(255,215,0,0.85)';
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  }

  update() {
    if (typeof mouse.x === 'number' && typeof mouse.y === 'number') {
      let dx = mouse.x - this.x;
      let dy = mouse.y - this.y;
      let distance = Math.sqrt(dx * dx + dy * dy);
      if (distance === 0) distance = 0.001;
      if (distance < mouse.radius) {
        const force = (mouse.radius - distance) / mouse.radius;
        const directionX = (dx / distance) * force * this.density;
        const directionY = (dy / distance) * force * this.density;
        // push away but limit displacement so particle remains within glyph
        this.x -= directionX * 3;
        this.y -= directionY * 3;
        // clamp to maxOffset from base to keep the number precise
        const fromBaseX = this.x - this.baseX;
        const fromBaseY = this.y - this.baseY;
        const distFromBase = Math.sqrt(fromBaseX * fromBaseX + fromBaseY * fromBaseY) || 0.0001;
        if (distFromBase > this.maxOffset) {
          const k = this.maxOffset / distFromBase;
          this.x = this.baseX + fromBaseX * k;
          this.y = this.baseY + fromBaseY * k;
        }
        this.color = '#ffffff';
        return;
      }
    }

    // ease back to base (with a small snap if very close)
    this.x += (this.baseX - this.x) * 0.08;
    this.y += (this.baseY - this.y) * 0.08;
    // ensure we don't slowly drift outside the allowed radius
    const bx = this.x - this.baseX;
    const by = this.y - this.baseY;
    const dbb = Math.sqrt(bx * bx + by * by) || 0.0001;
    if (dbb > this.maxOffset) {
      const k2 = this.maxOffset / dbb;
      this.x = this.baseX + bx * k2;
      this.y = this.baseY + by * k2;
    }
    this.color = 'rgba(255,215,0,0.85)';
  }
}

// --- SCANNING TEXT TO CREATE PARTICLES ---
function init() {
  particleArray = [];

  // DPR aware setup: scale canvas internal pixels, but use CSS pixels for coordinates
  const DPR = Math.max(window.devicePixelRatio || 1, 1);
  canvas.width = Math.floor(window.innerWidth * DPR);
  canvas.height = Math.floor(window.innerHeight * DPR);
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

  // Font scaled by viewport (CSS px). Use heavy weight for dense points
  const fontSize = Math.min(window.innerWidth / 4, 300);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'white';
  ctx.font = '900 ' + Math.floor(fontSize) + 'px Arial';
  ctx.textBaseline = 'middle';

  // measure text using CSS-space coordinates
  const metrics = ctx.measureText('404');
  const textWidth = metrics.width;

  adjustX = (window.innerWidth / 2) - (textWidth / 2);
  adjustY = (window.innerHeight / 2);

  // draw text (this will be rendered to device pixels by the transform)
  ctx.fillText('404', adjustX, adjustY);

  // read pixel data from full canvas (device pixels) but step based on DPR
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const densityCSS = 7;
  const step = Math.max(1, Math.floor(densityCSS * DPR));

  for (let y = 0; y < imgData.height; y += step) {
    for (let x = 0; x < imgData.width; x += step) {
      const alpha = imgData.data[(y * imgData.width + x) * 4 + 3];
      if (alpha > 128) {
        // convert device pixel coords back to CSS pixels for particle positions
        const posX = x / DPR;
        const posY = y / DPR;
        particleArray.push(new Particle(posX, posY));
      }
    }
  }
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // draw particles
  for (let i = 0; i < particleArray.length; i++) {
    particleArray[i].draw();
    particleArray[i].update();
  }
  requestAnimationFrame(animate);
}

// initial run
init();
animate();

// Resize handling (debounced)
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    init();
  }, 120);
});

// Reassemble button behavior
const reassembleBtn = document.getElementById('reassembleBtn');
if (reassembleBtn) {
  reassembleBtn.addEventListener('click', () => {
    // navigate back if possible, otherwise home
    if (window.history.length > 1) window.history.back();
    else window.location.href = '/';
  });
  reassembleBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') reassembleBtn.click();
  });
}

// keyboard: Escape to reassemble
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && reassembleBtn) reassembleBtn.click();
});
