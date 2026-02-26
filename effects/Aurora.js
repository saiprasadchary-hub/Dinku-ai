import { ctx, canvas } from './CanvasState.js';

export class Aurora {
    constructor() {
        this.time = 0;
        this.layers = [
            { y: 0.2, amp: 80, len: 0.002, speed: 0.0005, color: '#00ffb4' },
            { y: 0.4, amp: 60, len: 0.003, speed: 0.001, color: '#32dcff' },
            { y: 0.6, amp: 50, len: 0.0025, speed: 0.0008, color: '#b464ff' }
        ];

        // Background glow setup
        this.glowCanvas = document.createElement('canvas');
        this.glowCtx = this.glowCanvas.getContext('2d');
    }

    update() {
        this.time += 1;
        this.draw();
    }

    draw() {
        // Use a much larger step size (20px) for pathing to save CPU
        const step = 20;

        ctx.save();
        // Massively efficient glow: use globalCompositeOperation instead of shadowBlur
        ctx.globalCompositeOperation = 'lighter';

        this.layers.forEach((layer, idx) => {
            const yBase = canvas.height * layer.y;
            const offset = this.time * layer.speed;

            ctx.beginPath();
            ctx.moveTo(0, canvas.height);

            for (let x = 0; x <= canvas.width + step; x += step) {
                // Simplified wave harmonics
                const y = yBase +
                    Math.sin(x * layer.len + offset) * layer.amp +
                    Math.sin(x * layer.len * 1.5 + offset * 1.5) * (layer.amp * 0.3);

                ctx.lineTo(x, y);
            }

            ctx.lineTo(canvas.width, canvas.height);
            ctx.closePath();

            // Use a single simple gradient per layer
            const gradient = ctx.createLinearGradient(0, yBase - layer.amp, 0, canvas.height);
            gradient.addColorStop(0, layer.color + '44'); // Low opacity hex
            gradient.addColorStop(1, 'transparent');

            ctx.fillStyle = gradient;
            ctx.fill();
        });

        // Ambient particles (reduced count for performance)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        for (let i = 0; i < 15; i++) {
            const x = (Math.sin(this.time * 0.001 + i) * 0.5 + 0.5) * canvas.width;
            const y = (Math.cos(this.time * 0.002 + i) * 0.5 + 0.5) * canvas.height;
            ctx.beginPath();
            ctx.arc(x, y, 1, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}
