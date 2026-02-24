import { ctx, canvas, mouse } from './CanvasState.js';

/**
 * Zero Gravity Effect
 * Featuring premium floating objects (shoes, bikes, cars) with 3D-like physics.
 * Objects drift, rotate, and react to mouse-induced gravitational waves.
 */

const ITEMS = [
    { icon: 'directions_bike', label: 'Bike' },
    { icon: 'directions_car', label: 'Car' },
    { icon: 'snowmobile', label: 'Vehicle' },
    { icon: 'ice_skating', label: 'Shoes' },
    { icon: 'potted_plant', label: 'Plant' },
    { icon: 'headphones', label: 'Audio' },
    { icon: 'watch', label: 'Tech' },
    { icon: 'rocket_launch', label: 'Space' },
    { icon: 'laptop_mac', label: 'Laptop' },
    { icon: 'local_cafe', label: 'Coffee' }, // local_cafe is better supported than coffee
    { icon: 'keyboard', label: 'Keyboard' },
    { icon: 'sports_esports', label: 'Gaming' },
    { icon: 'terminal', label: 'Code' },
    { icon: 'memory', label: 'Chip' },
    { icon: 'smartphone', label: 'Phone' }, // smartphone is better supported than phone_iphone
    { icon: 'mouse', label: 'Mouse' }
];

export class ZeroGravityObject {
    constructor() {
        this.reset(true);
    }

    reset(initial = false) {
        // Random starting position
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;

        // Depth layer: 0 (background) to 1 (foreground)
        this.z = 0.2 + Math.random() * 0.8;

        // Randomly pick an item
        const item = ITEMS[Math.floor(Math.random() * ITEMS.length)];
        this.icon = item.icon;

        // Physics
        this.vx = (Math.random() - 0.5) * 1.5 * (1 - this.z);
        this.vy = (Math.random() - 0.5) * 1.5 * (1 - this.z);
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;

        // Size and Appearance
        this.baseSize = 40 + this.z * 60;
        this.opacity = 0;
        this.maxOpacity = 0.1 + this.z * 0.4;

        // Life cycle
        this.life = initial ? Math.random() * 2000 : 1500 + Math.random() * 500;
        this.maxLife = this.life;
    }

    update() {
        const isLightMode = document.body.classList.contains('light-mode');

        // 1. Zero-G Drift
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;

        // 2. Mouse Interaction (Subtle Repulsion)
        if (mouse.x !== null) {
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const radius = 300;

            if (dist < radius) {
                const force = (radius - dist) / radius;
                this.vx -= (dx / dist) * force * 0.1;
                this.vy -= (dy / dist) * force * 0.1;
                // Add a bit of spin when pushed
                this.rotationSpeed += (dx > 0 ? 0.001 : -0.001) * force;
            }
        }

        // Limit speed to keep it "floaty"
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        const maxAllowed = 2.5;
        if (speed > maxAllowed) {
            this.vx = (this.vx / speed) * maxAllowed;
            this.vy = (this.vy / speed) * maxAllowed;
        }

        // 3. Screen Wrap or Reset
        const margin = 150;
        if (this.x < -margin) this.x = canvas.width + margin;
        if (this.x > canvas.width + margin) this.x = -margin;
        if (this.y < -margin) this.y = canvas.height + margin;
        if (this.y > canvas.height + margin) this.y = -margin;

        // 4. Life & Fade logic
        this.life--;
        const lifeRatio = this.life / this.maxLife;
        this.opacity = Math.sin(lifeRatio * Math.PI) * this.maxOpacity;

        if (this.life <= 0) this.reset();

        this.draw(isLightMode);
    }

    draw(isLightMode) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Scale based on Z depth for 3D feel
        const scale = 0.8 + this.z * 0.4;
        ctx.scale(scale, scale);

        // Styling
        const h = isLightMode ? 210 : 215;
        const s = isLightMode ? 20 : 60;
        const l = isLightMode ? 30 : 70;
        const color = `hsla(${h}, ${s}%, ${l}%, ${this.opacity})`;

        ctx.fillStyle = color;
        ctx.font = `${this.baseSize}px "Material Symbols Outlined"`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw icon with subtle shadow for volume
        if (!isLightMode) {
            ctx.shadowBlur = 15 * this.z;
            ctx.shadowColor = `hsla(${h}, ${s}%, 50%, ${this.opacity * 0.5})`;
        }

        ctx.fillText(this.icon, 0, 0);

        ctx.restore();
    }
}

export class ZeroGravity {
    constructor(count = 40) {
        this.objects = [];
        for (let i = 0; i < count; i++) {
            this.objects.push(new ZeroGravityObject());
        }
    }

    update() {
        this.objects.forEach(obj => obj.update());
    }
}
