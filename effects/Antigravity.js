import { ctx, canvas, mouse } from './CanvasState.js';

/**
 * Antigravity Flow Effect
 * Inspired by antigravity.google
 * Featuring interactive 'chunks' that follow curved vector fields and react to mouse distortion.
 */

const SimplexNoise = (() => {
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) {
        const r = Math.floor(Math.random() * (i + 1));
        [p[i], p[r]] = [p[r], p[i]];
    }
    const perm = new Uint8Array(512);
    perm.set(p); perm.set(p, 256);
    const grad3 = [[1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0], [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1], [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]];
    return (x, y) => {
        let n0, n1, n2;
        const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
        const s = (x + y) * F2;
        const i = Math.floor(x + s); const j = Math.floor(y + s);
        const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
        const t = (i + j) * G2;
        const X0 = i - t; const Y0 = j - t;
        const x0 = x - X0; const y0 = y - Y0;
        let i1, j1;
        if (x0 > y0) { i1 = 1; j1 = 0; } else { i1 = 0; j1 = 1; }
        const x1 = x0 - i1 + G2; const y1 = y0 - j1 + G2;
        const x2 = x0 - 1.0 + 2.0 * G2; const y2 = y0 - 1.0 + 2.0 * G2;
        const ii = i & 255; const jj = j & 255;
        const t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 < 0) n0 = 0.0;
        else {
            const gi0 = perm[ii + perm[jj]] % 12;
            n0 = t0 * t0 * t0 * t0 * (grad3[gi0][0] * x0 + grad3[gi0][1] * y0);
        }
        const t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 < 0) n1 = 0.0;
        else {
            const gi1 = perm[ii + i1 + perm[jj + j1]] % 12;
            n1 = t1 * t1 * t1 * t1 * (grad3[gi1][0] * x1 + grad3[gi1][1] * y1);
        }
        const t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 < 0) n2 = 0.0;
        else {
            const gi2 = perm[ii + 1 + perm[jj + 1]] % 12;
            n2 = t2 * t2 * t2 * t2 * (grad3[gi2][0] * x2 + grad3[gi2][1] * y2);
        }
        return 70.0 * (n0 + n1 + n2);
    };
})();

export class AntigravityChunk {
    constructor() {
        this.reset(true);
    }

    reset(initial = false) {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.targetX = this.x;
        this.targetY = this.y;

        // Physical properties
        this.vx = 0;
        this.vy = 0;
        this.speed = 0.5 + Math.random() * 1.5;
        this.friction = 0.95;

        // Visual properties
        this.width = 2 + Math.random() * 4;
        this.height = 1 + Math.random() * 2;
        this.angle = 0;

        this.life = initial ? Math.random() * 1000 : 800 + Math.random() * 400;
        this.maxLife = this.life;
        this.opacity = 0;

        // Z-Depth for parallax / layering
        this.z = Math.random();
    }

    update(time = 0) {
        const isLightMode = document.body.classList.contains('light-mode');

        // 1. Base Vector Field (Curved Paths)
        const noiseScale = 0.0005;
        const angle = SimplexNoise(this.x * noiseScale, this.y * noiseScale + time * 0.01) * Math.PI * 4;

        const forceX = Math.cos(angle) * 0.05 * this.speed;
        const forceY = Math.sin(angle) * 0.05 * this.speed;

        this.vx += forceX;
        this.vy += forceY;

        // 2. Mouse Interaction (Antigravity Distortion)
        if (mouse.x !== null) {
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const radius = 250;

            if (dist < radius) {
                const power = (radius - dist) / radius;
                // Repulsion ripple
                const angleToMouse = Math.atan2(dy, dx);
                this.vx -= Math.cos(angleToMouse) * power * 0.5;
                this.vy -= Math.sin(angleToMouse) * power * 0.5;

                // Add jitter/turbulence near mouse
                this.vx += (Math.random() - 0.5) * power * 0.2;
                this.vy += (Math.random() - 0.5) * power * 0.2;
            }
        }

        this.vx *= this.friction;
        this.vy *= this.friction;

        this.x += this.vx;
        this.y += this.vy;

        // Update rotation angle to match velocity
        this.angle = Math.atan2(this.vy, this.vx);

        // Life and Opacity
        this.life--;
        const lifeRatio = this.life / this.maxLife;
        this.opacity = Math.sin(lifeRatio * Math.PI); // Smooth fade in/out

        if (this.x < -50 || this.x > canvas.width + 50 ||
            this.y < -50 || this.y > canvas.height + 50 ||
            this.life <= 0) {
            this.reset();
        }

        this.draw(isLightMode);
    }

    draw(isLightMode) {
        const alpha = this.opacity * (isLightMode ? 0.3 : 0.6) * (0.3 + this.z * 0.7);

        // Palette inspired by antigravity.google
        const color = isLightMode ?
            `rgba(0, 80, 200, ${alpha})` : // Deep Saturated Blue for light mode
            `rgba(0, 229, 255, ${alpha})`;  // Electric Cyan

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Draw the 'Chunk' (Elongated rectangle)
        ctx.fillStyle = color;

        // Add subtle glow
        if (!isLightMode) {
            ctx.shadowBlur = 8 * this.z;
            ctx.shadowColor = 'rgba(0, 229, 255, 0.8)';
        }

        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

        // Occasional highlight chunk (only in dark mode)
        if (!isLightMode && this.z > 0.9 && Math.random() > 0.99) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width * 1.5, this.height);
        }

        ctx.restore();
    }
}
