import { ctx, canvas, mouse } from './CanvasState.js';

export class Firefly {
    constructor() {
        this.reset();
        // Override initial position to be random across screen
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
    }

    reset() {
        // Spawn near mouse if active, else random
        if (mouse.x !== null && mouse.y !== null) {
            this.x = mouse.x + (Math.random() - 0.5) * 100;
            this.y = mouse.y + (Math.random() - 0.5) * 100;
        } else {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
        }

        this.size = Math.random() * 2 + 1;
        this.angle = Math.random() * Math.PI * 2;
        this.speed = Math.random() * 1 + 0.5;
        this.hue = 60 + Math.random() * 40; // Yellow-Green range
        this.lifespan = 1.0;
        this.decay = Math.random() * 0.005 + 0.003;
    }

    update() {
        // Active Mouse Swarming
        if (mouse.x !== null) {
            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 250) {
                // Steer toward mouse
                let angleToMouse = Math.atan2(dy, dx);
                let diff = angleToMouse - this.angle;
                // Keep angle in range
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                this.angle += diff * 0.05; // Gentle steering
                this.speed = Math.random() * 2 + 1; // Speed up when excited
            } else {
                this.speed = Math.max(0.5, this.speed * 0.99); // Slow down
                this.angle += (Math.random() - 0.5) * 0.1; // Random wander
            }
        } else {
            this.angle += (Math.random() - 0.5) * 0.1; // Random wander
        }

        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        this.lifespan -= this.decay;

        if (this.lifespan <= 0) {
            this.reset();
        }

        this.draw();
    }

    draw() {
        const isLightMode = document.body.classList.contains('light-mode');
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);

        const alpha = Math.max(0, this.lifespan);

        if (isLightMode) {
            // Deep Amber / Orange for light mode
            ctx.fillStyle = `hsla(30, 90%, 45%, ${alpha})`;
            ctx.shadowBlur = 4;
            ctx.shadowColor = `hsla(30, 90%, 45%, ${alpha * 0.3})`;
        } else {
            ctx.fillStyle = `hsla(${this.hue}, 100%, 70%, ${alpha})`;
            ctx.shadowBlur = 10;
            ctx.shadowColor = `hsla(${this.hue}, 100%, 70%, ${alpha * 0.5})`; // Softer glow
        }

        ctx.fill();
        ctx.shadowBlur = 0;
    }
}
