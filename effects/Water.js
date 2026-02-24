import { ctx, canvas, mouse } from './CanvasState.js';

export class WaterSimulation {
    constructor(cols, rows) {
        this.cols = cols;
        this.rows = rows;
        this.buffer1 = new Float32Array(cols * rows);
        this.buffer2 = new Float32Array(cols * rows);
        this.damping = 0.95; // More visible wave propagation

        // Offscreen renderer
        this.renderCanvas = document.createElement('canvas');
        this.renderCanvas.width = this.cols;
        this.renderCanvas.height = this.rows;
        this.renderCtx = this.renderCanvas.getContext('2d');
        this.imgData = this.renderCtx.createImageData(this.cols, this.rows);

        // Mouse tracking for velocity
        this.prevMouse = { x: null, y: null };
        this.mouseTrail = [];
        this.maxTrailLength = 5;

        // Continuous wave motion
        this.time = 0;

        // Click interaction
        this.setupClickListener();
    }

    setupClickListener() {
        const handleClick = (x, y) => {
            const gridPos = this.screenToGrid(x, y);
            // Explosive circular ripple
            const clickRadius = 5;
            for (let ox = -clickRadius; ox <= clickRadius; ox++) {
                for (let oy = -clickRadius; oy <= clickRadius; oy++) {
                    const dist = Math.sqrt(ox * ox + oy * oy);
                    if (dist <= clickRadius) {
                        const falloff = 1 - (dist / clickRadius);
                        const strength = 800 * falloff;
                        this.disturbGrid(gridPos.i + ox, gridPos.j + oy, strength);
                    }
                }
            }
        };

        canvas.addEventListener('click', (e) => {
            handleClick(e.clientX, e.clientY);
        });

        canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                handleClick(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: true });
    }

    disturbGrid(i, j, strength) {
        if (i > 1 && i < this.cols - 2 && j > 1 && j < this.rows - 2) {
            this.buffer1[i + j * this.cols] += strength;
        }
    }

    screenToGrid(sx, sy) {
        let i = Math.floor((sx / canvas.width) * this.cols);
        let j = Math.floor((sy / canvas.height) * this.rows);
        return { i, j };
    }

    update() {
        // Enhanced Mouse Interaction with Velocity
        if (mouse.x !== null && mouse.y !== null) {
            const gridPos = this.screenToGrid(mouse.x, mouse.y);

            // Calculate velocity
            let velocity = 0;
            if (this.prevMouse.x !== null && this.prevMouse.y !== null) {
                const dx = mouse.x - this.prevMouse.x;
                const dy = mouse.y - this.prevMouse.y;
                velocity = Math.sqrt(dx * dx + dy * dy);
            }

            // Update trail
            this.mouseTrail.push({ ...gridPos, velocity });
            if (this.mouseTrail.length > this.maxTrailLength) {
                this.mouseTrail.shift();
            }

            // Dynamic ripple based on velocity
            const baseStrength = 300;
            const velocityMultiplier = Math.min(velocity * 3, 400);
            const totalStrength = baseStrength + velocityMultiplier;

            // Larger interaction radius based on velocity (3x3 to 7x7) - FIXED
            const radius = Math.min(3 + Math.floor(velocity / 5), 7);

            // Gaussian-style falloff for natural ripples
            for (let ox = -radius; ox <= radius; ox++) {
                for (let oy = -radius; oy <= radius; oy++) {
                    const dist = Math.sqrt(ox * ox + oy * oy);
                    const falloff = Math.exp(-(dist * dist) / (radius * radius));
                    const strength = totalStrength * falloff;
                    this.disturbGrid(gridPos.i + ox, gridPos.j + oy, strength);
                }
            }

            // Trail effect - create ripples along the path
            this.mouseTrail.forEach((pos, idx) => {
                const trailFade = (idx + 1) / this.mouseTrail.length;
                const trailStrength = (100 + pos.velocity) * trailFade;
                for (let ox = -1; ox <= 1; ox++) {
                    for (let oy = -1; oy <= 1; oy++) {
                        this.disturbGrid(pos.i + ox, pos.j + oy, trailStrength);
                    }
                }
            });

            this.prevMouse = { x: mouse.x, y: mouse.y };
        } else {
            this.prevMouse = { x: null, y: null };
            this.mouseTrail = [];
        }

        // Ambient Rain (gentle for atmosphere)
        if (Math.random() < 0.03) {
            const i = Math.floor(2 + Math.random() * (this.cols - 4));
            const j = Math.floor(2 + Math.random() * (this.rows - 4));
            const randomStrength = 200 + Math.random() * 150;
            this.disturbGrid(i, j, randomStrength);
        }

        // Continuous gentle swell for realism
        this.time += 0.02;
        if (Math.floor(this.time * 10) % 40 === 0) {
            const swellX = Math.floor(this.cols / 2 + Math.sin(this.time) * this.cols / 4);
            const swellY = Math.floor(this.rows / 2 + Math.cos(this.time * 0.7) * this.rows / 4);
            this.disturbGrid(swellX, swellY, 150);
        }

        // Ripple Physics Loop
        for (let i = 1; i < this.cols - 1; i++) {
            for (let j = 1; j < this.rows - 1; j++) {
                const idx = i + j * this.cols;
                this.buffer2[idx] = (
                    this.buffer1[idx - 1] +
                    this.buffer1[idx + 1] +
                    this.buffer1[idx - this.cols] +
                    this.buffer1[idx + this.cols]
                ) * 0.48 - this.buffer2[idx]; // Increased from 0.5 for more visible persistence
                this.buffer2[idx] *= this.damping;
            }
        }

        let temp = this.buffer1;
        this.buffer1 = this.buffer2;
        this.buffer2 = temp;

        this.draw();
    }

    draw() {
        const isLight = document.body.classList.contains('light-mode');
        let data = this.imgData.data;
        let index = 0;

        for (let j = 0; j < this.rows; j++) {
            const yRatio = j / this.rows;
            for (let i = 0; i < this.cols; i++) {
                const xRatio = i / this.cols;
                const bufferIdx = i + j * this.cols;
                const h = this.buffer1[bufferIdx];

                // --- Calculate Slopes (Normal) ---
                const hLeft = (i > 0) ? this.buffer1[bufferIdx - 1] : h;
                const hRight = (i < this.cols - 1) ? this.buffer1[bufferIdx + 1] : h;
                const dX = hRight - hLeft;

                const hUp = (j > 0) ? this.buffer1[bufferIdx - this.cols] : h;
                const hDown = (j < this.rows - 1) ? this.buffer1[bufferIdx + this.cols] : h;
                const dY = hDown - hUp;

                // --- Refraction Simulation ---
                // We use the slope to "look" at a slightly different part of a virtual background
                const refAlpha = 0.5; // Refraction strength
                const rx = xRatio + dX * 0.005;
                const ry = yRatio + dY * 0.005;

                // --- Rendering Colors ---
                let r, g, b, a = 255;

                if (isLight) {
                    // Soft Pool style (smooth mid-tones)
                    const baseR = 60, baseG = 190, baseB = 230; // Lighter, softer base
                    const shift = (dX + dY) * 2; // Very gentle shift

                    r = Math.max(50, Math.min(240, baseR + shift)); // Clamp to mid-range
                    g = Math.max(180, Math.min(250, baseG + shift));
                    b = Math.max(220, Math.min(255, baseB + shift));
                    a = 200; // Consistent alpha

                    // No harsh highlights - only very subtle brightening
                    if (h > 40) {
                        const brightness = Math.min((h - 40) * 3, 30);
                        r = Math.min(245, r + brightness);
                        g = Math.min(250, g + brightness);
                        b = Math.min(255, b + brightness);
                    }
                } else {
                    // Smooth Deep Water (elegant mid-tones, no black/white)
                    const rDeep = 25, gDeep = 45, bDeep = 80; // Softer dark (not black)
                    const rMid = 40, gMid = 140, bMid = 200; // Brighter mid-tone

                    // Very gentle mix for smooth gradients
                    const mix = Math.max(0, Math.min(1, 0.5 + (dX + dY) * 0.01));
                    r = rDeep + (rMid - rDeep) * mix;
                    g = gDeep + (gMid - gDeep) * mix;
                    b = bDeep + (bMid - bDeep) * mix;

                    // Extremely subtle highlights (no white)
                    if (h > 35) {
                        const brightness = Math.min((h - 35) * 1.5, 25); // Very subtle
                        r = Math.min(200, r + brightness);
                        g = Math.min(220, g + brightness);
                        b = Math.min(235, b + brightness);
                    }

                    // Gentle glow (no harsh reflection)
                    if (dY < -5 && dX > 5) {
                        r = Math.min(180, r + 15);
                        g = Math.min(200, g + 20);
                        b = Math.min(220, b + 25);
                    }
                }

                data[index + 0] = r;
                data[index + 1] = g;
                data[index + 2] = b;
                data[index + 3] = Math.min(255, a);

                index += 4;
            }
        }

        this.renderCtx.putImageData(this.imgData, 0, 0);

        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Final presentation with ultra-smooth rendering
        ctx.filter = 'blur(3px)'; // Increased for maximum smoothness
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1.0;
        ctx.drawImage(this.renderCanvas, 0, 0, canvas.width, canvas.height);

        ctx.restore();
    }
}

