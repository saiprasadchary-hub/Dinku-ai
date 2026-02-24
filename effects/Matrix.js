import { ctx, canvas, mouse } from './CanvasState.js';

export class Matrix {
    constructor() {
        this.fontSize = 16;
        this.columns = Math.floor(canvas.width / this.fontSize);
        this.drops = [];
        this.characters = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ234567890ABCDEFHIJKLMNOPQRSTUVWXYZ';

        for (let i = 0; i < this.columns; i++) {
            this.drops[i] = Math.random() * -100; // Random start offsets
        }
    }

    update() {
        // Dynamic re-column on resize (if needed, though CanvasState handles canvas size)
        const newCols = Math.floor(canvas.width / this.fontSize);
        if (newCols !== this.columns) {
            this.columns = newCols;
            this.drops = [];
            for (let i = 0; i < this.columns; i++) this.drops[i] = Math.random() * -100;
        }

        this.draw();
    }

    draw() {
        const isLightMode = document.body.classList.contains('light-mode');

        // Matrix Fade Effect: Draw a semi-transparent black (or white) rectangle over the whole canvas
        // This creates the "trail" effect
        ctx.fillStyle = isLightMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = isLightMode ? '#008020' : '#0F0'; // Dark Green for Light Mode, Classic Matrix Green for Dark
        ctx.font = `${this.fontSize}px monospace`;

        for (let i = 0; i < this.drops.length; i++) {
            const char = this.characters[Math.floor(Math.random() * this.characters.length)];
            const x = i * this.fontSize;
            const y = this.drops[i] * this.fontSize;

            // Highlight the leading character (the "head" of the drop)
            if (Math.random() > 0.98) {
                ctx.fillStyle = isLightMode ? '#000000' : '#FFF'; // Occasional flash
            } else if (this.drops[i] === 0) {
                ctx.fillStyle = isLightMode ? '#004010' : '#EFFFFF'; // Leading edge
            } else {
                ctx.fillStyle = isLightMode ? '#008020' : '#00FF41'; // Base Green
            }

            // Mouse Interaction: Distort if near mouse
            let drawX = x;
            let drawY = y;
            if (mouse.x !== null) {
                const dy = mouse.y - y;
                const dx = mouse.x - x;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) {
                    const force = (150 - dist) / 150;
                    drawX += (Math.random() - 0.5) * 20 * force;
                    ctx.fillStyle = isLightMode ? '#00A030' : '#00FF8C'; // Shift color when repulsed
                }
            }

            ctx.fillText(char, drawX, drawY);

            // Reset drop to top if it goes off screen or randomly
            if (y > canvas.height && Math.random() > 0.975) {
                this.drops[i] = 0;
            }

            // Move drop down
            this.drops[i]++;
        }
    }
}
