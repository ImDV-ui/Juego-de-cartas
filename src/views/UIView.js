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
        this.container.style.fontFamily = "'Courier New', Courier, monospace";
        this.container.style.fontWeight = 'bold';
        this.container.style.textShadow = '2px 2px 0 #000';
        document.body.appendChild(this.container);


        this.moneyElement = document.createElement('div');
        this.moneyElement.style.position = 'absolute';
        this.moneyElement.style.top = '20px';
        this.moneyElement.style.right = '40px';
        this.moneyElement.style.fontSize = '32px';
        this.moneyElement.style.color = '#00ff00';
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
        this.moneyElement.style.color = amount > 0 ? '#00ff00' : '#ff0000';

        setTimeout(() => {
            this.moneyElement.style.transform = 'scale(1)';
            this.moneyElement.style.color = '#00ff00';
        }, 100);
    }
}
