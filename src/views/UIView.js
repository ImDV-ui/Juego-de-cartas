export class UIView {
    constructor() {
        this.money = 300; // Single currency system: Money (x3 de 100)

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

        // Money Display (Replaces Score/Coins)
        this.moneyElement = document.createElement('div');
        this.moneyElement.style.position = 'absolute';
        this.moneyElement.style.top = '20px';
        this.moneyElement.style.right = '40px';
        this.moneyElement.style.fontSize = '32px';
        this.moneyElement.style.color = '#00ff00'; // Green for money
        this.moneyElement.innerText = `MONEY: ${this.money}`;
        this.container.appendChild(this.moneyElement);

        this.createJackpotDisplay();
    }

    createJackpotDisplay() {
        // Placeholder for the "JACKPOT" display
    }

    render() {
        // Update DOM elements if needed
    }

    // New method for Money Logic
    updateMoney(amount) {
        this.money += amount;
        this.moneyElement.innerText = `MONEY: ${this.money}`;

        // Animation
        this.moneyElement.style.transform = 'scale(1.2)';
        this.moneyElement.style.color = amount > 0 ? '#00ff00' : '#ff0000'; // Green text for gain, Red for spend

        setTimeout(() => {
            this.moneyElement.style.transform = 'scale(1)';
            this.moneyElement.style.color = '#00ff00'; // Revert to green
        }, 100);
    }
}
