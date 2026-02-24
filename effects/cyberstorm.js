import { ctx, canvas, mouse } from './CanvasState.js';

class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.size = Math.random() * 2 + 1;
        this.life = Math.random() * 0.5 + 0.5;
        this.hue = 180 + Math.random() * 60; // Cyan to Blue
    }

    update(centerX, centerY, strength) {
        const dx = centerX - this.x;
        const dy = centerY - this.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);

        // Vortex Force
        const force = strength / (distSq + 1000);
        this.vx += (dx / dist) * force * 0.5;
        this.vy += (dy / dist) * force * 0.5;

        // Swirl
        this.vx += (-dy / dist) * force * 2;
        this.vy += (dx / dist) * force * 2;

        this.vx *= 0.98;
        this.vy *= 0.98;

        this.x += this.vx;
        this.y += this.vy;

        if (this.x < -100 || this.x > canvas.width + 100 || this.y < -100 || this.y > canvas.height + 100) {
            this.reset();
        }
    }

    draw() {
        const isLightMode = document.body.classList.contains('light-mode');
        const color = isLightMode ? `hsla(210, 80%, 40%, ${this.life * 0.6})` : `hsla(${this.hue}, 100%, 70%, ${this.life * 0.5})`;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Shard {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 8 + 4;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.1;
        this.speed = Math.random() * 0.5 + 0.2;
    }

    update() {
        this.rotation += this.rotSpeed;
        this.y -= this.speed;
        if (this.y < -50) this.y = canvas.height + 50;
    }

    draw() {
        const isLightMode = document.body.classList.contains('light-mode');
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.strokeStyle = isLightMode ? 'rgba(0, 50, 150, 0.4)' : 'rgba(0, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.rect(-this.size / 2, -this.size / 2, this.size, this.size);
        ctx.stroke();
        ctx.restore();
    }
}

export class CyberStorm {
    constructor() {
        this.particles = [];
        this.shards = [];
        this.lightning = [];
        this.init();
    }

    init() {
        for (let i = 0; i < 200; i++) this.particles.push(new Particle());
        for (let i = 0; i < 15; i++) this.shards.push(new Shard());
    }

    update() {
        const centerX = mouse.x !== null ? mouse.x : canvas.width / 2;
        const centerY = mouse.y !== null ? mouse.y : canvas.height / 2;
        const strength = mouse.x !== null ? 5000 : 2000;

        this.particles.forEach(p => p.update(centerX, centerY, strength));
        this.shards.forEach(s => s.update());

        if (Math.random() < 0.05) this.createLightning();

        this.draw(centerX, centerY);
    }

    createLightning() {
        if (this.particles.length < 2) return;
        const p1 = this.particles[Math.floor(Math.random() * this.particles.length)];
        const p2 = this.particles[Math.floor(Math.random() * this.particles.length)];
        // Use squared distance to avoid Math.sqrt
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < 22500) { // 150 * 150
            this.lightning.push({
                x1: p1.x, y1: p1.y,
                x2: p2.x, y2: p2.y,
                life: 1.0
            });
        }
    }

    draw(centerX, centerY) {
        const isLightMode = document.body.classList.contains('light-mode');

        // Deep Obsidian Background or Light Theme Base
        ctx.fillStyle = isLightMode ? 'rgba(240, 245, 255, 0.25)' : 'rgba(2, 4, 8, 0.25)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        this.shards.forEach(s => s.draw());
        this.particles.forEach(p => p.draw());

        // Draw Lightning
        ctx.globalCompositeOperation = 'lighter';
        this.lightning = this.lightning.filter(l => {
            l.life -= 0.1;
            if (l.life <= 0) return false;

            ctx.strokeStyle = isLightMode ? `rgba(0, 50, 150, ${l.life * 0.8})` : `rgba(180, 255, 255, ${l.life * 0.8})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(l.x1, l.y1);

            // Jagged line
            const midX = (l.x1 + l.x2) / 2 + (Math.random() - 0.5) * 20;
            const midY = (l.y1 + l.y2) / 2 + (Math.random() - 0.5) * 20;
            ctx.lineTo(midX, midY);
            ctx.lineTo(l.x2, l.y2);
            ctx.stroke();
            return true;
        });

        // Core Atmosphere
        const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 200);
        if (isLightMode) {
            grad.addColorStop(0, 'rgba(0, 100, 200, 0.05)');
            grad.addColorStop(1, 'transparent');
        } else {
            grad.addColorStop(0, 'rgba(0, 200, 255, 0.15)');
            grad.addColorStop(1, 'transparent');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.globalCompositeOperation = 'source-over';
    }
}
