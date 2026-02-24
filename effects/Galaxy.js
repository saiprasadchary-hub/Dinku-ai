import { ctx, canvas, mouse } from './CanvasState.js';

/**
 * STAR CLASS - Deep space background stars with speed variation
 */
export class Star {
    constructor() {
        this.reset(true);
    }
    reset(initial = false) {
        this.x = (Math.random() - 0.5) * canvas.width * 2.5;
        this.y = (Math.random() - 0.5) * canvas.height * 2.5;
        this.z = initial ? Math.random() * 2000 : 2000;
        this.size = Math.random() * 1.2;
        this.twinkle = Math.random() * 0.05;
        this.colorHue = Math.random() > 0.9 ? 200 : 0;
    }
    update(warp = 1) {
        this.z -= (2 * warp);
        if (this.z <= 0) this.reset();

        let fov = 400;
        let scale = fov / (fov + this.z);
        let x2d = (this.x * scale) + canvas.width / 2;
        let y2d = (this.y * scale) + canvas.height / 2;

        if (x2d < 0 || x2d > canvas.width || y2d < 0 || y2d > canvas.height) return;

        this.draw(x2d, y2d, scale, warp);
    }
    draw(x, y, scale, warp) {
        ctx.beginPath();
        const flicker = 0.8 + Math.sin(Date.now() * 0.01 * this.twinkle) * 0.2;
        const length = warp > 1.2 ? (warp - 1) * 20 * scale : 0;

        if (length > 1) {
            ctx.lineWidth = this.size * scale;
            ctx.lineCap = 'round';
            ctx.strokeStyle = `hsla(${this.colorHue}, 100%, 100%, ${scale * flicker})`;
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + length);
            ctx.stroke();
        } else {
            ctx.arc(x, y, this.size * scale, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${this.colorHue}, 100%, 100%, ${scale * flicker})`;
            ctx.fill();
        }
    }
}

/**
 * GALACTIC PARTICLE - Individual stars within the spiral structure
 */
class GalacticParticle {
    constructor(galaxy) {
        this.galaxy = galaxy;
        this.init();
    }

    init() {
        // Logarithmic Spiral: r = a * e^(b * theta)
        const armIndex = Math.floor(Math.random() * this.galaxy.arms);
        const distance = Math.pow(Math.random(), 0.7) * this.galaxy.radius; // Denser towards core

        // Logarithmic spiral math
        const a = 1;
        const b = 0.5; // tightness
        const theta = Math.log(distance / a) / b;
        const angle = theta + (armIndex * (Math.PI * 2 / this.galaxy.arms));

        // Add random variation to form arms rather than lines
        const dispersion = (0.1 + (distance / this.galaxy.radius) * 0.25) * this.galaxy.radius;
        const randAngle = Math.random() * Math.PI * 2;
        const randDist = Math.random() * dispersion;

        this.x = Math.cos(angle) * distance + Math.cos(randAngle) * randDist;
        this.y = Math.sin(angle) * distance + Math.sin(randAngle) * randDist;
        this.z = (Math.random() - 0.5) * (this.galaxy.radius * 0.15) * (1 - distance / this.galaxy.radius);

        this.distance = Math.sqrt(this.x * this.x + this.y * this.y);
        this.angle = Math.atan2(this.y, this.x);

        // Particle Properties
        this.size = Math.random() * 1.4 + 0.4;
        this.speed = (0.002 + Math.random() * 0.003) * (1 / (this.distance / 100 + 1));
        this.pulse = Math.random() * 0.1;

        // Color based on temperature/distance
        const relDist = this.distance / this.galaxy.radius;
        if (relDist < 0.15) {
            this.color = { h: 30 + Math.random() * 20, s: 100, l: 85 }; // Core: Yellow/White
        } else if (relDist < 0.5) {
            this.color = { h: 200 + Math.random() * 20, s: 90, l: 75 }; // Arms: Blue
        } else {
            this.color = { h: 280 + Math.random() * 40, s: 80, l: 70 }; // Edge: Magenta/Purple
        }

        // Special types
        this.isPulsar = Math.random() > 0.98;
        if (this.isPulsar) {
            this.size *= 1.5;
            this.color.l = 95;
        }
    }

    update(warp, tiltX, tiltY) {
        this.angle += this.speed * warp;

        let rx = Math.cos(this.angle) * this.distance;
        let ry = Math.sin(this.angle) * this.distance;
        let rz = this.z;

        // 3D Tilt transformation
        let cosX = Math.cos(tiltX);
        let sinX = Math.sin(tiltX);
        let cosY = Math.cos(tiltY);
        let sinY = Math.sin(tiltY);

        let x1 = rx * cosY - rz * sinY;
        let z1 = rx * sinY + rz * cosY;
        let y2 = ry * cosX - z1 * sinX;
        let z2 = ry * sinX + z1 * cosX;

        let fov = 700;
        let scale = fov / (fov + z2);

        this.screenX = canvas.width / 2 + x1 * scale;
        this.screenY = canvas.height / 2 + y2 * scale;
        this.currScale = scale;

        this.draw();
    }

    draw() {
        if (this.currScale <= 0) return;

        let opacity = this.currScale * 0.8;
        if (this.isPulsar) {
            opacity *= (0.5 + Math.sin(Date.now() * 0.01) * 0.5);
        }

        ctx.beginPath();
        ctx.arc(this.screenX, this.screenY, this.size * this.currScale, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.color.h}, ${this.color.s}%, ${this.color.l}%, ${opacity})`;
        ctx.fill();

        if (this.isPulsar && opacity > 0.5) {
            // Pulsar diffraction spike
            ctx.beginPath();
            ctx.lineWidth = 0.5 * this.currScale;
            ctx.strokeStyle = `hsla(${this.color.h}, 100%, 100%, ${opacity * 0.5})`;
            ctx.moveTo(this.screenX - 4 * this.currScale, this.screenY);
            ctx.lineTo(this.screenX + 4 * this.currScale, this.screenY);
            ctx.moveTo(this.screenX, this.screenY - 4 * this.currScale);
            ctx.lineTo(this.screenX, this.screenY + 4 * this.currScale);
            ctx.stroke();
        }
    }
}

/**
 * NEBULA CLOUD - Dense gas and dust particles
 */
class NebulaCloud {
    constructor(galaxy) {
        this.galaxy = galaxy;
        this.init();
    }
    init() {
        this.distance = Math.random() * this.galaxy.radius;
        this.angle = Math.random() * Math.PI * 2;
        this.size = Math.random() * 80 + 120;
        this.z = (Math.random() - 0.5) * 60;
        this.hue = Math.random() > 0.6 ? 210 : 300; // Blue or Magenta
        this.opacity = 0.04 + Math.random() * 0.03;
        this.speed = 0.0005 + Math.random() * 0.0005;
    }
    update(warp, tiltX, tiltY) {
        this.angle += this.speed * warp;
        let rx = Math.cos(this.angle) * this.distance;
        let ry = Math.sin(this.angle) * this.distance;
        let rz = this.z;

        let cosX = Math.cos(tiltX);
        let sinX = Math.sin(tiltX);
        let cosY = Math.cos(tiltY);
        let sinY = Math.sin(tiltY);

        let x1 = rx * cosY - rz * sinY;
        let z1 = rx * sinY + rz * cosY;
        let y2 = ry * cosX - z1 * sinX;
        let z2 = ry * sinX + z1 * cosX;

        let fov = 700;
        let scale = fov / (fov + z2);

        const sx = canvas.width / 2 + x1 * scale;
        const sy = canvas.height / 2 + y2 * scale;

        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, this.size * scale);
        grad.addColorStop(0, `hsla(${this.hue}, 100%, 50%, ${this.opacity})`);
        grad.addColorStop(1, `hsla(${this.hue}, 100%, 50%, 0)`);

        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(sx, sy, this.size * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
    }
}

/**
 * SPIRAL GALAXY - The main system coordinator
 */
export class SpiralGalaxy {
    constructor() {
        this.radius = Math.min(canvas.width, canvas.height) * 0.9;
        this.arms = 4;
        this.particles = [];
        this.nebulae = [];
        this.tiltX = 0.85;
        this.tiltY = 0;
        this.warp = 1;
        this.backgroundStars = [];

        // Deep background stars
        for (let i = 0; i < 200; i++) {
            this.backgroundStars.push(new Star());
        }

        // Initialize structures
        for (let i = 0; i < 3000; i++) this.particles.push(new GalacticParticle(this));
        for (let i = 0; i < 60; i++) this.nebulae.push(new NebulaCloud(this));
    }

    update() {
        // Compute "Warp" based on mouse distance from center
        let targetWarp = 1;
        if (mouse.x !== null) {
            const dx = (mouse.x / canvas.width - 0.5) * 2;
            const dy = (mouse.y / canvas.height - 0.5) * 2;
            const dist = Math.sqrt(dx * dx + dy * dy);
            targetWarp = 1 + dist * 2.5;
        }
        this.warp += (targetWarp - this.warp) * 0.1;

        // Compute Tilt
        let targetTiltX = 0.85;
        let targetTiltY = 0;
        if (mouse.x !== null) {
            targetTiltX = 0.85 + (mouse.y / canvas.height - 0.5) * 0.4;
            targetTiltY = (mouse.x / canvas.width - 0.5) * 0.4;
        }
        this.tiltX += (targetTiltX - this.tiltX) * 0.04;
        this.tiltY += (targetTiltY - this.tiltY) * 0.04;

        // Update layers (order matters for depth/blending)
        this.backgroundStars.forEach(s => s.update(this.warp));
        this.drawBlackHole();
        this.nebulae.forEach(n => n.update(this.warp, this.tiltX, this.tiltY));
        this.particles.forEach(p => p.update(this.warp, this.tiltX, this.tiltY));
    }

    drawBlackHole() {
        const sx = canvas.width / 2;
        const sy = canvas.height / 2;

        // Accretion Disk Glow
        const diskSize = this.radius * 0.12;
        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, diskSize);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        grad.addColorStop(0.2, 'rgba(255, 240, 150, 0.6)');
        grad.addColorStop(0.6, 'rgba(255, 120, 0, 0.2)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(sx, sy, diskSize, 0, Math.PI * 2);
        ctx.fill();

        // The Event Horizon (Singularity)
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(sx, sy, diskSize * 0.25, 0, Math.PI * 2);
        ctx.fill();

        // Event Horizon Edge Glow
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}

// Ensure Star handles warp in chat.js loop if updated, or just maintain interface
export class SolarSystem {
    constructor() {
        this.galaxy = new SpiralGalaxy();
    }
    update() {
        this.galaxy.update();
    }
}
