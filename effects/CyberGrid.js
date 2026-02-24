import { ctx, canvas, mouse } from './CanvasState.js';

export class CyberGrid {
    constructor() {
        this.time = 0;
        this.gridSize = 60;
        this.speed = 2;
        this.horizon = canvas.height * 0.45;
    }

    update() {
        this.time += this.speed;
        this.draw();
    }

    draw() {
        // Dark background fade
        ctx.fillStyle = 'rgba(10, 5, 20, 0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const centerX = canvas.width / 2;
        const totalLines = 20;

        // Draw Horizontal Lines (Moving towards viewer)
        for (let i = 0; i < totalLines; i++) {
            const z = ((i * this.gridSize + (this.time % this.gridSize)) / (this.gridSize * totalLines));
            const y = this.horizon + z * (canvas.height - this.horizon);

            const opacity = z * 0.8;
            ctx.strokeStyle = `rgba(255, 0, 255, ${opacity})`;
            ctx.lineWidth = 1 + z * 2;

            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }

        // Draw Perspective Lines (Vanishing point at horizon)
        const perspectiveCount = 16;
        for (let i = -perspectiveCount; i <= perspectiveCount; i++) {
            const xOffset = i * this.gridSize * 4;

            ctx.strokeStyle = `rgba(0, 255, 255, 0.4)`;
            ctx.lineWidth = 1;

            ctx.beginPath();
            ctx.moveTo(centerX, this.horizon);

            // Mouse distortion on perspective lines
            let targetX = centerX + xOffset;
            if (mouse.x !== null) {
                const dx = mouse.x - centerX;
                targetX += dx * 0.2;
            }

            ctx.lineTo(targetX * 2 - centerX, canvas.height);
            ctx.stroke();
        }

        // Horizon Glow
        const grad = ctx.createLinearGradient(0, this.horizon - 100, 0, this.horizon + 50);
        grad.addColorStop(0, 'rgba(255, 0, 255, 0)');
        grad.addColorStop(0.5, 'rgba(255, 0, 255, 0.3)');
        grad.addColorStop(1, 'rgba(0, 255, 255, 0)');

        ctx.fillStyle = grad;
        ctx.fillRect(0, this.horizon - 100, canvas.width, 200);
    }
}
