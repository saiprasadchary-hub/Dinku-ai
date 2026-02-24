import { ctx, canvas, mouse } from './CanvasState.js';

export class Wave {
    constructor(index, total, isRainbow) {
        this.index = index;
        this.total = total;
        this.isRainbow = isRainbow;
        this.angle = 0;
        this.speed = 0.005 + (Math.random() * 0.005);
        this.phi = Math.random() * Math.PI * 2;
    }
    draw() {
        ctx.beginPath();
        ctx.lineWidth = 1.5;
        if (this.isRainbow) {
            const baseHue = (this.index * 30) + (Date.now() / 20);

            // Create a multi-stop gradient for maximum color
            const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
            grad.addColorStop(0, `hsla(${baseHue}, 90%, 60%, 0.4)`);
            grad.addColorStop(0.33, `hsla(${baseHue + 60}, 90%, 60%, 0.4)`);
            grad.addColorStop(0.66, `hsla(${baseHue + 120}, 90%, 60%, 0.4)`);
            grad.addColorStop(1, `hsla(${baseHue + 180}, 90%, 60%, 0.4)`);

            ctx.strokeStyle = grad;
            ctx.shadowBlur = 10; // Still glowing
            ctx.shadowColor = `hsla(${baseHue}, 90%, 60%, 0.2)`;
            ctx.lineWidth = 3;
        } else {
            ctx.strokeStyle = `rgba(168, 199, 250, 0.15)`;
            ctx.shadowBlur = 0;
            ctx.lineWidth = 1.5;
        }

        // Mouse factors
        let mouseYFactor = mouse.y !== null ? (mouse.y / canvas.height) : 0.5;

        // Wave parameters
        const baseFrequency = 0.001 + (this.index * 0.0003);
        const baseAmplitude = (40 + (this.index * 15)) * (0.5 + mouseYFactor);
        const yOffset = (canvas.height / (this.total + 1)) * (this.index + 1);

        for (let x = 0; x <= canvas.width; x += 5) {
            // Layered sine waves for organic feel
            let sin1 = Math.sin(x * baseFrequency + this.angle + this.phi);
            let sin2 = Math.sin(x * baseFrequency * 2.5 - this.angle * 0.5 + this.phi) * 0.3;
            let sin3 = Math.sin(x * baseFrequency * 0.5 + this.angle * 1.5 + this.phi) * 0.2;

            // Repulsion Effect (Water Parting)
            let dx = x - (mouse.x || 0);
            let dy = yOffset - (mouse.y || 0);
            let distance = Math.sqrt(dx * dx + dy * dy);
            let repulsion = 0;

            if (mouse.x !== null && distance < 250) {
                // Strength falls off with distance
                // The closer the mouse, the stronger the push
                let force = (1 - distance / 250);
                // Push vertically based on where the mouse is relative to the wave line
                repulsion = (yOffset - (mouse.y || 0)) * force * 1.5;

                // Add a small ripple effect to the repulsion for extra flair
                repulsion += Math.sin(this.angle * 10 + distance * 0.05) * force * 15;
            }

            const y = yOffset + (sin1 + sin2 + sin3) * baseAmplitude + repulsion;

            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
    update() {
        // Speed influenced by Mouse X
        let mouseXFactor = mouse.x !== null ? (mouse.x / canvas.width) + 0.5 : 1;
        this.angle += this.speed * mouseXFactor;
        this.draw();
    }
}
