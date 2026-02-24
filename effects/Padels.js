import { ctx, canvas, mouse, colors } from './CanvasState.js';

export class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.directionX = (Math.random() * 0.4) - 0.2;
        this.directionY = (Math.random() * 0.4) - 0.2;
        this.size = Math.random() * 3 + 1;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.shape = Math.floor(Math.random() * 24);
    }
    draw() {
        ctx.beginPath();
        if (this.shape === 0) {
            // Circle
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
            ctx.fillStyle = this.color;
            ctx.fill();
        } else if (this.shape === 1) {
            // Square
            ctx.rect(this.x, this.y, this.size * 2, this.size * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        } else if (this.shape === 2) {
            // Triangle
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + this.size, this.y + this.size * 2);
            ctx.lineTo(this.x - this.size, this.y + this.size * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        } else if (this.shape === 3) {
            // Cross (X)
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(Math.PI / 4);
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.size, -this.size / 4, this.size * 2, this.size / 2);
            ctx.fillRect(-this.size / 4, -this.size, this.size / 2, this.size * 2);
            ctx.restore();
        } else if (this.shape === 4) {
            // Diamond
            ctx.moveTo(this.x, this.y - this.size * 1.5);
            ctx.lineTo(this.x + this.size * 1.5, this.y);
            ctx.lineTo(this.x, this.y + this.size * 1.5);
            ctx.lineTo(this.x - this.size * 1.5, this.y);
            ctx.fillStyle = this.color;
            ctx.fill();
        } else if (this.shape === 5) {
            // Ring (Donut)
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.stroke();
        } else if (this.shape === 6) {
            // Star
            let spikes = 5;
            let outerRadius = this.size * 2;
            let innerRadius = this.size;
            let cx = this.x;
            let cy = this.y;
            let rot = Math.PI / 2 * 3;
            let x = cx;
            let y = cy;
            let step = Math.PI / spikes;

            ctx.moveTo(cx, cy - outerRadius);
            for (let i = 0; i < spikes; i++) {
                x = cx + Math.cos(rot) * outerRadius;
                y = cy + Math.sin(rot) * outerRadius;
                ctx.lineTo(x, y);
                rot += step;

                x = cx + Math.cos(rot) * innerRadius;
                y = cy + Math.sin(rot) * innerRadius;
                ctx.lineTo(x, y);
                rot += step;
            }
            ctx.lineTo(cx, cy - outerRadius);
            ctx.fillStyle = this.color;
            ctx.fill();
        } else if (this.shape === 7) {
            // Hexagon
            let numberOfSides = 6;
            ctx.moveTo(this.x + this.size * Math.cos(0), this.y + this.size * Math.sin(0));
            for (let i = 1; i <= numberOfSides; i += 1) {
                ctx.lineTo(this.x + this.size * Math.cos(i * 2 * Math.PI / numberOfSides), this.y + this.size * Math.sin(i * 2 * Math.PI / numberOfSides));
            }
            ctx.fillStyle = this.color;
            ctx.fill();
        } else if (this.shape === 8) {
            // Pentagon
            let numberOfSides = 5;
            // Rotate to point up
            let rotation = -Math.PI / 2;
            ctx.moveTo(this.x + this.size * Math.cos(rotation), this.y + this.size * Math.sin(rotation));
            for (let i = 1; i <= numberOfSides; i += 1) {
                ctx.lineTo(this.x + this.size * Math.cos(rotation + i * 2 * Math.PI / numberOfSides), this.y + this.size * Math.sin(rotation + i * 2 * Math.PI / numberOfSides));
            }
            ctx.fillStyle = this.color;
            ctx.fill();
        } else if (this.shape === 9) {
            // Double Circle (Target)
            ctx.arc(this.x, this.y, this.size * 1.5, 0, Math.PI * 2, false);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2, false);
            ctx.fillStyle = this.color;
            ctx.fill();
        } else if (this.shape === 10) {
            // Triangle Outline
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + this.size, this.y + this.size * 2);
            ctx.lineTo(this.x - this.size, this.y + this.size * 2);
            ctx.closePath();
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.stroke();
        } else if (this.shape === 11) {
            // Pulsing Plus
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x - this.size, this.y - this.size / 3, this.size * 2, this.size / 1.5);
            ctx.fillRect(this.x - this.size / 3, this.y - this.size, this.size / 1.5, this.size * 2);
        } else if (this.shape === 12) {
            // Heart
            ctx.fillStyle = this.color;
            let d = this.size * 2;
            ctx.moveTo(this.x, this.y + d / 4);
            ctx.bezierCurveTo(this.x, this.y, this.x - d / 2, this.y, this.x - d / 2, this.y + d / 4);
            ctx.bezierCurveTo(this.x - d / 2, this.y + d / 2, this.x, this.y + d * 0.75, this.x, this.y + d);
            ctx.bezierCurveTo(this.x, this.y + d * 0.75, this.x + d / 2, this.y + d / 2, this.x + d / 2, this.y + d / 4);
            ctx.bezierCurveTo(this.x + d / 2, this.y, this.x, this.y, this.x, this.y + d / 4);
            ctx.fill();
        } else if (this.shape === 13) {
            // Crescent Moon
            ctx.fillStyle = this.color;
            ctx.arc(this.x, this.y, this.size * 1.5, 0.2 * Math.PI, 1.8 * Math.PI);
            ctx.arc(this.x + this.size * 0.8, this.y, this.size * 1.2, 1.6 * Math.PI, 0.4 * Math.PI, true);
            ctx.fill();
        } else if (this.shape === 14) {
            // Octagon
            let numberOfSides = 8;
            ctx.moveTo(this.x + this.size * Math.cos(0), this.y + this.size * Math.sin(0));
            for (let i = 1; i <= numberOfSides; i += 1) {
                ctx.lineTo(this.x + this.size * Math.cos(i * 2 * Math.PI / numberOfSides), this.y + this.size * Math.sin(i * 2 * Math.PI / numberOfSides));
            }
            ctx.fillStyle = this.color;
            ctx.fill();
        } else if (this.shape === 15) {
            // Capsule
            ctx.fillStyle = this.color;
            ctx.roundRect(this.x - this.size, this.y - this.size / 2, this.size * 2, this.size, this.size / 2);
            ctx.fill();
        } else if (this.shape === 16) {
            // Simple Lightning Bolt
            ctx.fillStyle = this.color;
            ctx.moveTo(this.x, this.y - this.size * 2);
            ctx.lineTo(this.x - this.size, this.y);
            ctx.lineTo(this.x, this.y);
            ctx.lineTo(this.x - this.size / 2, this.y + this.size * 2);
            ctx.lineTo(this.x + this.size, this.y);
            ctx.lineTo(this.x, this.y);
            ctx.closePath();
            ctx.fill();
        } else if (this.shape === 17) {
            // Asterisk
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            for (let i = 0; i < 3; i++) {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate((i * Math.PI) / 3);
                ctx.beginPath();
                ctx.moveTo(-this.size, 0);
                ctx.lineTo(this.size, 0);
                ctx.stroke();
                ctx.restore();
            }
        } else if (this.shape === 18) {
            // Arrow
            ctx.fillStyle = this.color;
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(Math.PI / 4); // Pointing direction
            ctx.beginPath();
            ctx.moveTo(-this.size, -this.size / 2);
            ctx.lineTo(this.size, 0);
            ctx.lineTo(-this.size, this.size / 2);
            ctx.lineTo(-this.size / 2, 0);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        } else if (this.shape === 19) {
            // Shield
            ctx.fillStyle = this.color;
            let w = this.size * 2;
            let h = this.size * 2.5;
            ctx.moveTo(this.x - w / 2, this.y - h / 2);
            ctx.lineTo(this.x + w / 2, this.y - h / 2);
            ctx.lineTo(this.x + w / 2, this.y + h / 6);
            ctx.quadraticCurveTo(this.x + w / 2, this.y + h / 2, this.x, this.y + h / 2);
            ctx.quadraticCurveTo(this.x - w / 2, this.y + h / 2, this.x - w / 2, this.y + h / 6);
            ctx.closePath();
            ctx.fill();
        } else if (this.shape === 20) {
            // Trefoil (Biohazard-lite)
            ctx.fillStyle = this.color;
            for (let i = 0; i < 3; i++) {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(i * 2 * Math.PI / 3);
                ctx.beginPath();
                ctx.arc(0, -this.size, this.size * 0.8, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        } else if (this.shape === 21) {
            // Cog (Gear)
            ctx.fillStyle = this.color;
            ctx.save();
            ctx.translate(this.x, this.y);
            let spikes = 8;
            let outer = this.size * 1.8;
            let inner = this.size * 1.2;
            ctx.beginPath();
            for (let i = 0; i < spikes * 2; i++) {
                let r = (i % 2 === 0) ? outer : inner;
                let a = i * Math.PI / spikes;
                ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
            }
            ctx.closePath();
            ctx.fill();
            // Hole in the middle
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        } else if (this.shape === 22) {
            // Zig-zag (S)
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(this.x - this.size, this.y - this.size);
            ctx.lineTo(this.x + this.size, this.y - this.size / 2);
            ctx.lineTo(this.x - this.size, this.y + this.size / 2);
            ctx.lineTo(this.x + this.size, this.y + this.size);
            ctx.stroke();
        } else if (this.shape === 23) {
            // Mini Wave (Sine segment)
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = -10; i <= 10; i++) {
                let px = this.x + (i * this.size / 5);
                let py = this.y + Math.sin(i * 0.5) * this.size;
                if (i === -10) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.stroke();
        }
    }
    update() {
        if (this.x > canvas.width || this.x < 0) this.directionX = -this.directionX;
        if (this.y > canvas.height || this.y < 0) this.directionY = -this.directionY;
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < mouse.radius) {
            if (mouse.x < this.x && this.x < canvas.width - this.size * 10) this.x += 2;
            if (mouse.x > this.x && this.x > this.size * 10) this.x -= 2;
            if (mouse.y < this.y && this.y < canvas.height - this.size * 10) this.y += 2;
            if (mouse.y > this.y && this.y > this.size * 10) this.y -= 2;
        }
        this.x += this.directionX;
        this.y += this.directionY;
        this.draw();
    }
}
