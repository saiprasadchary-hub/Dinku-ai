import { ctx, canvas, mouse } from './CanvasState.js';

export class Prism {
    constructor() {
        this.polygons = [];
        this.time = 0;
        this.init();
    }

    init() {
        for (let i = 0; i < 15; i++) {
            this.polygons.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 100 + 50,
                sides: Math.floor(Math.random() * 3) + 3, // 3 to 5 sides
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.02,
                vx: (Math.random() - 0.5) * 1,
                vy: (Math.random() - 0.5) * 1,
                hue: Math.random() * 360
            });
        }
    }

    update() {
        this.time += 0.01;
        this.polygons.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.rotation += p.rotSpeed;

            // Bounce off edges
            if (p.x < -p.radius) p.x = canvas.width + p.radius;
            if (p.x > canvas.width + p.radius) p.x = -p.radius;
            if (p.y < -p.radius) p.y = canvas.height + p.radius;
            if (p.y > canvas.height + p.radius) p.y = -p.radius;

            // Mouse interaction
            if (mouse.x !== null) {
                const dx = mouse.x - p.x;
                const dy = mouse.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 300) {
                    p.vx -= dx * 0.0001;
                    p.vy -= dy * 0.0001;
                }
            }
        });
        this.draw();
    }

    draw() {
        // Deep indigo/black background
        ctx.fillStyle = 'rgba(5, 5, 15, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.globalCompositeOperation = 'screen';

        this.polygons.forEach(p => {
            const opacity = 0.3;

            // Chromatic Aberration Effect - Draw 3 shifted versions
            this.drawPrismShape(p, 2, `hsla(${p.hue}, 100%, 50%, ${opacity})`); // Red/Cyan shift
            this.drawPrismShape(p, 0, `hsla(${(p.hue + 120) % 360}, 100%, 50%, ${opacity})`); // Green shift
            this.drawPrismShape(p, -2, `hsla(${(p.hue + 240) % 360}, 100%, 50%, ${opacity})`); // Blue shift
        });

        ctx.globalCompositeOperation = 'source-over';
    }

    drawPrismShape(p, offset, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < p.sides; i++) {
            const angle = (i / p.sides) * Math.PI * 2 + p.rotation;
            const px = p.x + Math.cos(angle) * p.radius + offset;
            const py = p.y + Math.sin(angle) * p.radius + offset;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();

        // Subtle glow fill
        ctx.fillStyle = color.replace(/[^,]+(?=\))/, '0.05');
        ctx.fill();
    }
}
