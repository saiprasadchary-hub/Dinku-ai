export const canvas = document.getElementById('bg-canvas');
export const ctx = canvas.getContext('2d');

export const colors = ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#E3E3E3', '#5f6368'];

// Set canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Mouse Object
export const mouse = {
    x: null,
    y: null,
    radius: 150
}

export const prevMouse = {
    x: null,
    y: null
}

// Event Listeners for Basic State
window.addEventListener('mousemove', (event) => {
    mouse.x = event.x;
    mouse.y = event.y;
});

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Mobile Touch Support (Basic tracking)
window.addEventListener('touchstart', (event) => {
    const touch = event.touches[0];
    mouse.x = touch.clientX;
    mouse.y = touch.clientY;
}, { passive: true });

window.addEventListener('touchmove', (event) => {
    const touch = event.touches[0];
    mouse.x = touch.clientX;
    mouse.y = touch.clientY;
}, { passive: true });
