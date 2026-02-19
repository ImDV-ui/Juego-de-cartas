export class UIView {
    constructor() {
        this.score = 0;
        this.coins = 50; // Initial coins available to drop (future feature)

        this.createUI();
    }

    createUI() {
        // Main UI Container
        this.container = document.createElement('div');
        this.container.style.position = 'absolute';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.pointerEvents = 'none'; // click-through
        this.container.style.fontFamily = "'Courier New', Courier, monospace";
        this.container.style.fontWeight = 'bold';
        this.container.style.textShadow = '2px 2px 0 #000';
        document.body.appendChild(this.container);

        // Score Board
        this.scoreElement = document.createElement('div');
        this.scoreElement.style.position = 'absolute';
        this.scoreElement.style.top = '20px';
        this.scoreElement.style.right = '40px';
        this.scoreElement.style.fontSize = '32px';
        this.scoreElement.style.color = '#ffcc00';
        this.scoreElement.innerText = 'SCORE: 0';
        this.container.appendChild(this.scoreElement);

        // Coin Count (Optional, for gameplay loop)
        this.coinCountElement = document.createElement('div');
        this.coinCountElement.style.position = 'absolute';
        this.coinCountElement.style.top = '60px';
        this.coinCountElement.style.right = '40px';
        this.coinCountElement.style.fontSize = '24px';
        this.coinCountElement.style.color = '#ffffff';
        this.coinCountElement.innerText = 'COINS: 50';
        this.container.appendChild(this.coinCountElement);

        // Jackpot/Bonus display placeholders (Visuals from image)
        this.createJackpotDisplay();
    }

    createJackpotDisplay() {
        // Placeholder for the "JACKPOT" and "MEGA PRIZE" LED texts
        // In a real app these might be texture planes in 3D, but HTML overlay works too
    }

    render() {
        // Update DOM elements if needed
    }

    updateScore(amount) {
        this.score += amount;
        this.scoreElement.innerText = `SCORE: ${this.score}`;

        // Simple animation affect
        this.scoreElement.style.transform = 'scale(1.2)';
        setTimeout(() => this.scoreElement.style.transform = 'scale(1)', 100);
    }
}
