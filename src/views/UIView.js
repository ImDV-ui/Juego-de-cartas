export class UIView {
    constructor() {
        this.money = 300;
        this.multiplier = 1;

        this.createUI();
    }

    createUI() {

        this.container = document.createElement('div');
        this.container.style.position = 'absolute';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.pointerEvents = 'none';
        this.container.style.fontFamily = "'Press Start 2P', 'Courier New', monospace";
        this.container.style.fontWeight = 'bold';
        this.container.style.textShadow = '2px 2px 0 #000';
        document.body.appendChild(this.container);


        this.moneyElement = document.createElement('div');
        this.moneyElement.style.position = 'absolute';
        this.moneyElement.style.top = '20px';
        this.moneyElement.style.right = '40px';
        this.moneyElement.style.fontSize = '32px';
        this.moneyElement.style.color = '#ffffff'; // White color
        this.moneyElement.innerText = `MONEY: ${this.money}`;
        this.container.appendChild(this.moneyElement);

        this.createJackpotDisplay();
    }

    createJackpotDisplay() {

    }

    render() {

    }


    updateMoney(amount) {
        if (amount > 0) {
            amount *= this.multiplier;
        }
        this.money += amount;
        this.moneyElement.innerText = `MONEY: ${this.money}`;





        this.moneyElement.style.transform = 'scale(1.2)';
        // Removed color change to prevent red blink. Keeping it white.

        setTimeout(() => {
            this.moneyElement.style.transform = 'scale(1)';
        }, 100);
    }
}
