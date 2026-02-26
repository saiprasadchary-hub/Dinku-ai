import { ctx, canvas, mouse } from './CanvasState.js';

export class WaterSimulation {
    constructor(cols, rows) {
        // Zoomed Out: High Density Grid
        // Increasing rows/cols beyond screen size creates a "condensed" or "distant" view
        this.scale = 1.0;
        this.cols = Math.floor(cols / this.scale);
        this.rows = Math.floor(rows / this.scale);

        const size = this.cols * this.rows;
        this.buffer1 = new Float32Array(size);
        this.buffer2 = new Float32Array(size);
        this.damping = 0.96; // Higher damping for longer-lasting distant ripples

        this.renderCanvas = document.createElement('canvas');
        this.renderCanvas.width = this.cols;
        this.renderCanvas.height = this.rows;
        this.renderCtx = this.renderCanvas.getContext('2d');
        this.imgData = this.renderCtx.createImageData(this.cols, this.rows);

        this.prevMouse = { x: null, y: null };
        this.setupEventListeners();
    }

    setupEventListeners() {
        const triggerRipple = (x, y, strength = 400) => {
            const i = Math.floor((x / canvas.width) * this.cols);
            const j = Math.floor((y / canvas.height) * this.rows);
            this.ripple(i, j, strength);
        };

        canvas.addEventListener('mousedown', (e) => triggerRipple(e.clientX, e.clientY, 600));
        canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) triggerRipple(e.touches[0].clientX, e.touches[0].clientY, 600);
        }, { passive: true });
    }

    ripple(i, j, strength) {
        // Distant feel: very small interaction radius
        const radius = 1;
        for (let ox = -radius; ox <= radius; ox++) {
            for (let oy = -radius; oy <= radius; oy++) {
                const ni = i + ox;
                const nj = j + oy;
                if (ni > 0 && ni < this.cols - 1 && nj > 0 && nj < this.rows - 1) {
                    this.buffer1[ni + nj * this.cols] += strength;
                }
            }
        }
    }

    update() {
        if (mouse.x !== null && mouse.y !== null) {
            const i = Math.floor((mouse.x / canvas.width) * this.cols);
            const j = Math.floor((mouse.y / canvas.height) * this.rows);

            if (this.prevMouse.x !== null) {
                const dx = mouse.x - this.prevMouse.x;
                const dy = mouse.y - this.prevMouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 1) {
                    this.ripple(i, j, Math.min(dist * 10, 150));
                }
            }
            this.prevMouse = { x: mouse.x, y: mouse.y };
        } else {
            this.prevMouse = { x: null, y: null };
        }

        // Distant Rain
        if (Math.random() < 0.04) { // More frequent but smaller
            const ri = Math.floor(Math.random() * (this.cols - 2)) + 1;
            const rj = Math.floor(Math.random() * (this.rows - 2)) + 1;
            this.ripple(ri, rj, 100 + Math.random() * 100);
        }

        const c = this.cols;
        const b1 = this.buffer1;
        const b2 = this.buffer2;
        const d = this.damping;

        for (let i = c; i < b1.length - c; i++) {
            b2[i] = ((b1[i - 1] + b1[i + 1] + b1[i - c] + b1[i + c]) >> 1) - b2[i];
            b2[i] *= d;
        }

        this.buffer1 = b2;
        this.buffer2 = b1;

        this.draw();
    }

    draw() {
        const isLight = document.body.classList.contains('light-mode');
        const data = this.imgData.data;
        const b1 = this.buffer1;
        const c = this.cols;

        for (let i = 0; i < b1.length; i++) {
            const val = b1[i];
            const dx = b1[i + 1] - b1[i - 1];
            const dy = b1[i + c] - b1[i - c];
            const specular = Math.max(0, dx + dy) * 1.5;

            const idx = i * 4;
            if (isLight) {
                data[idx] = 120 + val + specular;
                data[idx + 1] = 210 + val + specular;
                data[idx + 2] = 255;
                data[idx + 3] = 100 + Math.min(val, 50);
            } else {
                data[idx] = 5 + specular;
                data[idx + 1] = 30 + val * 0.4 + specular;
                data[idx + 2] = 80 + val * 0.8 + specular;
                data[idx + 3] = 160 + Math.min(val, 60);
            }
        }

        this.renderCtx.putImageData(this.imgData, 0, 0);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();

        // --- LONG DISTANCE PERSPECTIVE EFFECT ---
        // We skew the rendering to simulate a distant horizon
        // We stretch the bottom and squeeze the top slightly
        ctx.translate(canvas.width / 2, canvas.height / 2);

        // This tilt creates the "wide lake" or "ocean" look from a distance
        // 1.0 on X, slightly smaller on Y to compress vertically
        ctx.scale(1.0, 0.8);

        ctx.translate(-canvas.width / 2, -canvas.height / 2);

        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = 0.9;
        ctx.drawImage(this.renderCanvas, 0, 0, canvas.width, canvas.height);

        ctx.restore();
    }
}
