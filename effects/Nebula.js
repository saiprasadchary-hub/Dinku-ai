import { ctx, canvas, mouse } from './CanvasState.js';

export class Nebula {
    constructor() {
        this.particles = [];
        this.clouds = [];
        this.stars = [];
        this.time = 0;
        this.prevMouse = { x: null, y: null };

        // Create swirling particle clouds (optimized for performance)
        for (let i = 0; i < 150; i++) {
            this.particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                baseX: Math.random() * canvas.width,
                baseY: Math.random() * canvas.height,
                size: Math.random() * 3 + 0.5,
                speed: Math.random() * 0.3 + 0.1,
                angle: Math.random() * Math.PI * 2,
                orbitRadius: Math.random() * 100 + 20, // Increased from 80
                opacity: Math.random() * 0.6 + 0.2,
                color: this.getNebulaColor(),
                pulseSpeed: Math.random() * 0.02 + 0.01,
                pulsePhase: Math.random() * Math.PI * 2,
                trailLength: Math.random() * 3 + 2 // For particle trails
            });
        }

        // Create nebula clouds with enhanced properties (optimized)
        for (let i = 0; i < 6; i++) {
            this.clouds.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 250 + 150, // Larger clouds
                vx: (Math.random() - 0.5) * 0.15, // Slower drift
                vy: (Math.random() - 0.5) * 0.15,
                color: this.getNebulaColor(),
                secondaryColor: this.getNebulaColor(), // For gradient variety
                opacity: Math.random() * 0.2 + 0.08, // More visible
                pulseSpeed: Math.random() * 0.008 + 0.004, // Slower pulse
                pulsePhase: Math.random() * Math.PI * 2,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.002
            });
        }

        // Add background star field (optimized)
        for (let i = 0; i < 80; i++) {
            this.stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 1.5 + 0.3,
                opacity: Math.random() * 0.5 + 0.2,
                twinkleSpeed: Math.random() * 0.03 + 0.01,
                twinklePhase: Math.random() * Math.PI * 2
            });
        }
    }

    getNebulaColor() {
        const colors = [
            { r: 138, g: 43, b: 226 },   // Blue-violet
            { r: 255, g: 20, b: 147 },   // Deep pink
            { r: 0, g: 191, b: 255 },    // Deep sky blue
            { r: 186, g: 85, b: 211 },   // Medium orchid
            { r: 72, g: 61, b: 139 },    // Dark slate blue
            { r: 147, g: 112, b: 219 },  // Medium purple
            { r: 255, g: 105, b: 180 },  // Hot pink
            { r: 65, g: 105, b: 225 },   // Royal blue
            { r: 199, g: 21, b: 133 },   // Medium violet red
            { r: 138, g: 43, b: 226 },   // Electric purple
            { r: 0, g: 206, b: 209 },    // Dark turquoise
            { r: 255, g: 69, b: 0 }      // Orange-red (for variety)
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
        this.time += 1;

        // Calculate mouse velocity
        let velocity = 0;
        if (mouse.x !== null && this.prevMouse.x !== null) {
            const dx = mouse.x - this.prevMouse.x;
            const dy = mouse.y - this.prevMouse.y;
            velocity = Math.sqrt(dx * dx + dy * dy);
        }
        this.prevMouse = { x: mouse.x, y: mouse.y };

        // Update background stars
        this.stars.forEach(star => {
            star.twinklePhase += star.twinkleSpeed;
            star.opacity = 0.2 + Math.sin(star.twinklePhase) * 0.3;
        });

        // Update clouds with rotation
        this.clouds.forEach(cloud => {
            cloud.x += cloud.vx;
            cloud.y += cloud.vy;
            cloud.pulsePhase += cloud.pulseSpeed;
            cloud.rotation += cloud.rotationSpeed;
            cloud.opacity = (0.08 + Math.sin(cloud.pulsePhase) * 0.1);

            // Wrap around
            if (cloud.x < -cloud.radius) cloud.x = canvas.width + cloud.radius;
            if (cloud.x > canvas.width + cloud.radius) cloud.x = -cloud.radius;
            if (cloud.y < -cloud.radius) cloud.y = canvas.height + cloud.radius;
            if (cloud.y > canvas.height + cloud.radius) cloud.y = -cloud.radius;
        });

        // Update particles with enhanced motion
        this.particles.forEach(p => {
            p.angle += p.speed * 0.01;
            p.pulsePhase += p.pulseSpeed;

            // Orbital motion with slight drift
            const drift = Math.sin(this.time * 0.001 + p.pulsePhase) * 0.5;
            p.x = p.baseX + Math.cos(p.angle) * p.orbitRadius + drift;
            p.y = p.baseY + Math.sin(p.angle) * p.orbitRadius + drift;

            // Enhanced pulsing opacity
            p.opacity = 0.3 + Math.sin(p.pulsePhase) * 0.5;

            // Mouse interaction - attract and energize
            if (mouse.x !== null) {
                const dx = mouse.x - p.x;
                const dy = mouse.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 250) {
                    const force = (250 - dist) * 0.002;
                    const velocityBoost = Math.min(velocity * 0.01, 1);
                    p.x += (dx / dist) * force * (1 + velocityBoost);
                    p.y += (dy / dist) * force * (1 + velocityBoost);
                    p.opacity = Math.min(1, p.opacity + 0.3);
                    p.size = Math.min(5, p.size * 1.05);
                } else {
                    // Return to original size
                    p.size = Math.max(0.5, p.size * 0.99);
                }
            }

            // Wrap particles
            if (p.x < 0) p.baseX += canvas.width;
            if (p.x > canvas.width) p.baseX -= canvas.width;
            if (p.y < 0) p.baseY += canvas.height;
            if (p.y > canvas.height) p.baseY -= canvas.height;
        });

        this.draw();
    }

    draw() {
        // Draw background stars first
        this.stars.forEach(star => {
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
            ctx.fill();
        });

        // Draw nebula clouds with enhanced gradients
        this.clouds.forEach(cloud => {
            const gradient = ctx.createRadialGradient(
                cloud.x, cloud.y, 0,
                cloud.x, cloud.y, cloud.radius
            );

            // Multi-stop gradient for richer colors
            gradient.addColorStop(0, `rgba(${cloud.color.r}, ${cloud.color.g}, ${cloud.color.b}, ${cloud.opacity})`);
            gradient.addColorStop(0.5, `rgba(${cloud.secondaryColor.r}, ${cloud.secondaryColor.g}, ${cloud.secondaryColor.b}, ${cloud.opacity * 0.5})`);
            gradient.addColorStop(1, `rgba(${cloud.color.r}, ${cloud.color.g}, ${cloud.color.b}, 0)`);

            ctx.fillStyle = gradient;
            ctx.fillRect(
                cloud.x - cloud.radius,
                cloud.y - cloud.radius,
                cloud.radius * 2,
                cloud.radius * 2
            );
        });

        // Draw particles with optimized glow (no trails for performance)
        ctx.globalCompositeOperation = 'lighter';
        this.particles.forEach(p => {
            // Draw main particle with glow
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.opacity})`;
            ctx.fill();
        });
        ctx.globalCompositeOperation = 'source-over';
    }
}
