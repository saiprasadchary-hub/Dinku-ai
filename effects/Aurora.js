import { ctx, canvas, mouse } from './CanvasState.js';

export class Aurora {
    constructor() {
        this.layers = [];
        this.particles = [];
        this.time = 0;

        // Enhanced layering with more depth (7 layers)
        this.layers.push({
            y: canvas.height * 0.15,
            amp: 140,
            len: 0.0018,
            speed: 0.0008,
            colors: ['rgba(0, 255, 180, 0.08)', 'rgba(100, 255, 200, 0.12)'],
            offset: Math.random() * 1000,
            baseAmp: 140
        });

        this.layers.push({
            y: canvas.height * 0.3,
            amp: 120,
            len: 0.0025,
            speed: 0.0015,
            colors: ['rgba(50, 220, 255, 0.1)', 'rgba(100, 150, 255, 0.14)'],
            offset: Math.random() * 1000,
            baseAmp: 120
        });

        this.layers.push({
            y: canvas.height * 0.45,
            amp: 100,
            len: 0.002,
            speed: 0.002,
            colors: ['rgba(180, 100, 255, 0.12)', 'rgba(200, 50, 255, 0.16)'],
            offset: Math.random() * 1000,
            baseAmp: 100
        });

        this.layers.push({
            y: canvas.height * 0.6,
            amp: 85,
            len: 0.0032,
            speed: 0.0012,
            colors: ['rgba(255, 80, 200, 0.1)', 'rgba(255, 120, 180, 0.14)'],
            offset: Math.random() * 1000,
            baseAmp: 85
        });

        this.layers.push({
            y: canvas.height * 0.73,
            amp: 70,
            len: 0.0028,
            speed: 0.0018,
            colors: ['rgba(100, 150, 255, 0.12)', 'rgba(80, 100, 255, 0.16)'],
            offset: Math.random() * 1000,
            baseAmp: 70
        });

        this.layers.push({
            y: canvas.height * 0.85,
            amp: 55,
            len: 0.004,
            speed: 0.001,
            colors: ['rgba(50, 100, 200, 0.1)', 'rgba(30, 80, 180, 0.14)'],
            offset: Math.random() * 1000,
            baseAmp: 55
        });

        // Initialize shimmer particles
        for (let i = 0; i < 80; i++) {
            this.particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.2,
                size: Math.random() * 2 + 1,
                opacity: Math.random() * 0.5,
                pulseSpeed: Math.random() * 0.02 + 0.01,
                pulsePhase: Math.random() * Math.PI * 2
            });
        }
    }

    update() {
        this.time += 1;

        // Update layers with dynamic amplitude variation
        this.layers.forEach((layer, idx) => {
            layer.offset += layer.speed;
            // Gentle breathing effect on amplitude
            layer.amp = layer.baseAmp + Math.sin(this.time * 0.01 + idx) * 15;
        });

        // Update particles (ambient only, no mouse interaction)
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.pulsePhase += p.pulseSpeed;
            p.opacity = 0.3 + Math.sin(p.pulsePhase) * 0.2;

            // Wrap around edges
            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;
        });

        this.draw();
    }

    draw() {
        this.layers.forEach((layer, layerIdx) => {
            ctx.beginPath();
            ctx.moveTo(0, canvas.height);

            for (let x = 0; x <= canvas.width; x += 5) { // Smoother with 5px steps
                // Complex wave with multiple harmonics
                let y = layer.y +
                    Math.sin(x * layer.len + layer.offset) * layer.amp +
                    Math.sin(x * layer.len * 2.5 + layer.offset * 1.2) * (layer.amp * 0.5) +
                    Math.sin(x * layer.len * 1.8 + layer.offset * 0.7) * (layer.amp * 0.3);

                // No mouse interaction - pure ambient movement

                ctx.lineTo(x, y);
            }

            ctx.lineTo(canvas.width, canvas.height);
            ctx.lineTo(0, canvas.height);
            ctx.closePath();

            // Create gradient fill for richer colors
            const gradient = ctx.createLinearGradient(0, layer.y - layer.amp, 0, canvas.height);
            gradient.addColorStop(0, layer.colors[0]);
            gradient.addColorStop(1, layer.colors[1]);

            ctx.fillStyle = gradient;
            ctx.shadowBlur = 40 + Math.sin(this.time * 0.02 + layerIdx) * 10; // Dynamic glow
            ctx.shadowColor = layer.colors[0];
            ctx.fill();
            ctx.shadowBlur = 0;
        });

        // Draw shimmer particles with additive blending
        ctx.globalCompositeOperation = 'lighter';
        this.particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(200, 220, 255, ${p.opacity})`;
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(150, 200, 255, 0.8)';
            ctx.fill();
        });
        ctx.shadowBlur = 0;
        ctx.globalCompositeOperation = 'source-over';
    }
}
