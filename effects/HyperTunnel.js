import { ctx, canvas, mouse } from './CanvasState.js';

export class HyperTunnel {
    constructor() {
        this.rings = [];
        this.particles = [];
        this.time = 0;
        this.speed = 1;

        // Lerp targets for smooth motion
        this.lerpX = 0;
        this.lerpSpeed = 1;
        this.targetSpeed = 1;

        this.init();
    }

    init() {
        for (let i = 0; i < 25; i++) {
            this.rings.push({
                z: i * 40,
                rotation: Math.random() * Math.PI * 2,
                sides: Math.random() > 0.5 ? 6 : 8 // Varied geometric shapes
            });
        }
        for (let i = 0; i < 150; i++) {
            this.particles.push({
                x: (Math.random() - 0.5) * 3,
                y: (Math.random() - 0.5) * 3,
                z: Math.random() * 1000,
                len: Math.random() * 30 + 20
            });
        }
    }

    update() {
        // Smooth Lerping for Mouse Interaction
        const targetX = mouse.x !== null ? (mouse.x / canvas.width - 0.5) * 2 : 0;
        const targetSpeedBoost = mouse.y !== null ? (1 - mouse.y / canvas.height) * 3 + 1 : 1;

        this.lerpX += (targetX - this.lerpX) * 0.08;
        this.lerpSpeed += (targetSpeedBoost - this.lerpSpeed) * 0.1;

        this.time += 0.005 * this.lerpSpeed;
        this.draw();
    }

    draw() {
        // High-end obsidian background fade
        ctx.fillStyle = 'rgba(2, 5, 10, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const centerX = canvas.width / 2 + this.lerpX * 80;
        const centerY = canvas.height / 2;

        ctx.globalCompositeOperation = 'lighter';

        // Draw Rings with Multi-Pass Bloom
        this.rings.forEach(ring => {
            ring.z -= 1.5 * this.lerpSpeed;
            if (ring.z <= 0) {
                ring.z = 1000;
                ring.rotation = Math.random() * Math.PI * 2;
            }

            const scale = 500 / (500 + ring.z);
            const size = 350 * scale;
            const opacity = Math.pow(1 - ring.z / 1000, 1.5);

            // Professional Midnight Teal Palette
            const hue = 185; // Teal
            const ringColor = `hsla(${hue}, 100%, 65%, ${opacity * 0.6})`;

            // Bloom Pass 1: Broad Glow
            ctx.lineWidth = 4 * scale;
            ctx.strokeStyle = `hsla(${hue}, 100%, 50%, ${opacity * 0.2})`;
            this.drawPoly(centerX, centerY, size, ring.sides, ring.rotation, opacity);

            // Bloom Pass 2: Core Line
            ctx.lineWidth = 1 * scale;
            ctx.strokeStyle = ringColor;
            this.drawPoly(centerX, centerY, size, ring.sides, ring.rotation, opacity);

            // Inner Accent Ring
            ctx.beginPath();
            ctx.arc(centerX, centerY, size * 0.3, 0, Math.PI * 2);
            ctx.strokeStyle = `hsla(${hue + 40}, 100%, 70%, ${opacity * 0.1})`;
            ctx.stroke();
        });

        // Speed Streaks
        ctx.lineWidth = 1;
        this.particles.forEach(p => {
            p.z -= 6 * this.lerpSpeed;
            if (p.z <= 0) p.z = 1000;

            const scale = 500 / (500 + p.z);
            const px = centerX + p.x * canvas.width * scale;
            const py = centerY + p.y * canvas.height * scale;

            const pzNext = p.z + p.len * this.lerpSpeed;
            const scaleNext = 500 / (500 + pzNext);
            const pxNext = centerX + p.x * canvas.width * scaleNext;
            const pyNext = centerY + p.y * canvas.height * scaleNext;

            const opacity = (1 - p.z / 1000) * 0.4;
            ctx.strokeStyle = `rgba(180, 255, 255, ${opacity})`;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(pxNext, pyNext);
            ctx.stroke();
        });

        ctx.globalCompositeOperation = 'source-over';

        // Professional Focal Fog
        const fog = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 300);
        fog.addColorStop(0, 'rgba(0, 150, 200, 0.08)');
        fog.addColorStop(1, 'transparent');
        ctx.fillStyle = fog;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    drawPoly(x, y, radius, sides, rotation, opacity) {
        ctx.beginPath();
        for (let i = 0; i <= sides; i++) {
            const angle = (i / sides) * Math.PI * 2 + rotation + this.time;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke();
    }
}
