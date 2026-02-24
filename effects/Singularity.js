import { ctx, canvas, mouse } from './CanvasState.js';

export class SingularityParticle {
    constructor() {
        this.reset();
    }

    reset() {
        const angle = Math.random() * Math.PI * 2;
        const dist = 300 + Math.random() * 600;
        this.x = (canvas.width / 2) + Math.cos(angle) * dist;
        this.y = (canvas.height / 2) + Math.sin(angle) * dist;

        this.vx = 0;
        this.vy = 0;
        this.maxSpeed = 2 + Math.random() * 3;
        this.accel = 0.2 + Math.random() * 0.3;
        this.size = Math.random() * 1.5 + 0.5;

        // Initial color (Cool)
        this.hue = 200 + Math.random() * 60; // Cyan/Blue
        this.alpha = 0;
        this.history = [];
        this.historyLimit = 15 + Math.floor(Math.random() * 20);
    }

    update() {
        const targetX = mouse.x !== null ? mouse.x : canvas.width / 2;
        const targetY = mouse.y !== null ? mouse.y : canvas.height / 2;

        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);

        if (dist < 20) {
            this.reset();
            return;
        }

        // Store history for trails
        this.history.push({ x: this.x, y: this.y });
        if (this.history.length > this.historyLimit) this.history.shift();

        // Gravitational Pull (Inverse Square Law simulation)
        const gravityForce = 4000 / (distSq + 1000);
        this.vx += (dx / dist) * gravityForce * this.accel;
        this.vy += (dy / dist) * gravityForce * this.accel;

        // Swirl Force (Angular velocity)
        const swirlStrength = 3.0; // Higher makes it more "disk-like"
        this.vx += (-dy / dist) * gravityForce * swirlStrength;
        this.vy += (dx / dist) * gravityForce * swirlStrength;

        // Friction / Drag
        this.vx *= 0.96;
        this.vy *= 0.96;

        this.x += this.vx;
        this.y += this.vy;

        // Fade in
        if (this.alpha < 0.6) this.alpha += 0.01;

        // Kinetic Color Shift: Turn white/hot near center
        const heat = Math.min(1, 300 / dist);
        this.currentHue = this.hue - (heat * 100); // Shift toward violet/white
        this.currentAlpha = this.alpha * (0.5 + heat * 0.5);

        const isLightMode = document.body.classList.contains('light-mode');
        this.draw(targetX, targetY, isLightMode);
    }

    draw(targetX, targetY, isLightMode) {
        if (this.history.length < 2) return;

        // Draw Trail
        ctx.beginPath();
        ctx.moveTo(this.history[0].x, this.history[0].y);
        for (let i = 1; i < this.history.length; i++) {
            ctx.lineTo(this.history[i].x, this.history[i].y);
        }

        const heat = Math.min(1, 300 / Math.sqrt((this.x - targetX) ** 2 + (this.y - targetY) ** 2));

        let color;
        if (isLightMode) {
            // Deep indigo / violet for light mode
            color = `hsla(${240 + heat * 40}, 80%, ${30 + heat * 20}%, ${this.currentAlpha})`;
        } else {
            color = `hsla(${this.currentHue}, 100%, ${70 + heat * 30}%, ${this.currentAlpha})`;
        }

        ctx.strokeStyle = color;
        ctx.lineWidth = this.size;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Drawing the Event Horizon / Core is handled by a special class or common logic in chat.js
        // But for better standalone logic, we'll draw a "glow aura" for the closest particles
    }
}

// Special class to draw the central "Black Hole" core
export class SingularityCore {
    constructor() {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.baseRadius = 25; // Professional, compact core
        this.angle = 0;
    }
    update() {
        this.x = mouse.x !== null ? mouse.x : canvas.width / 2;
        this.y = mouse.y !== null ? mouse.y : canvas.height / 2;
        this.angle += 0.05;

        const isLightMode = document.body.classList.contains('light-mode');
        this.draw(isLightMode);
    }
    draw(isLightMode) {
        // 1. Accretion Disk (Outer Glow)
        const grad = ctx.createRadialGradient(this.x, this.y, this.baseRadius, this.x, this.y, this.baseRadius * 3);
        if (isLightMode) {
            grad.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
            grad.addColorStop(0.2, 'rgba(50, 0, 150, 0.2)');
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        } else {
            grad.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
            grad.addColorStop(0.2, 'rgba(100, 200, 255, 0.1)');
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.baseRadius * 3, 0, Math.PI * 2);
        ctx.fill();

        // 2. Event Horizon (The Black Void)
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.baseRadius, 0, Math.PI * 2);
        ctx.fillStyle = isLightMode ? '#ffffff' : '#000000'; // Actually, a black core looks better in both modes, but for visibility on white, crisp black is perfect. Let's use black always for the true void.
        ctx.fillStyle = '#000000';
        ctx.fill();

        // 3. Photon Sphere (Bright Thin Ring)
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.baseRadius, 0, Math.PI * 2);
        ctx.strokeStyle = isLightMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        if (!isLightMode) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#fff';
        } else {
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#000';
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
}

