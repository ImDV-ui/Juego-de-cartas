export class UIView {
    constructor() {
        this.money = 300;
        this.multiplier = 1;

        this.onUpgradePurchased = null;
        this.upgradesData = null;

        this.upgradeDefs = {
            autoDropper: { name: 'AUTO-DROPPER', baseCost: 50, desc: 'Lanza monedas automáticamente.' },
            pusherSpeed: { name: 'PUSHER SPEED', baseCost: 100, desc: 'Aumenta la velocidad del empujador.' },
            luckyCards: { name: 'LUCKY CARDS', baseCost: 150, desc: 'Las cartas caen más rápido.' },
            coinMultiplier: { name: 'COIN MULTIPLIER', baseCost: 500, desc: 'Aumenta el valor de cada moneda.' }
        };

        this.createUI();
    }

    setUpgradeData(upgrades, onPurchaseCallback) {
        this.upgradesData = upgrades;
        this.onUpgradePurchased = onPurchaseCallback;
        if (this.shopModal && this.shopModal.style.display === 'flex') {
            this.renderShopItems();
        }
    }

    getUpgradeCost(upgradeKey) {
        if (!this.upgradesData) return 0;
        const level = this.upgradesData[upgradeKey];
        const base = this.upgradeDefs[upgradeKey].baseCost;
        return Math.floor(base * Math.pow(1.5, level));
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
        this.moneyElement.style.color = '#ffffff';
        this.moneyElement.innerText = `MONEY: ${this.money}`;
        this.container.appendChild(this.moneyElement);

        this.createShopButton();
        this.createShopModal();
    }

    createShopButton() {
        this.shopButton = document.createElement('button');
        this.shopButton.innerText = 'TIENDA';
        this.shopButton.style.position = 'absolute';
        this.shopButton.style.bottom = '20px';
        this.shopButton.style.right = '40px';
        this.shopButton.style.pointerEvents = 'auto';
        this.shopButton.style.padding = '15px 20px';
        this.shopButton.style.fontSize = '24px';
        this.shopButton.style.fontFamily = 'inherit';
        this.shopButton.style.fontWeight = 'bold';
        this.shopButton.style.color = '#fff';
        this.shopButton.style.backgroundColor = '#d32f2f';
        this.shopButton.style.border = '4px solid #fff';
        this.shopButton.style.borderRadius = '8px';
        this.shopButton.style.cursor = 'pointer';
        this.shopButton.style.textShadow = '2px 2px 0 #000';
        this.shopButton.style.boxShadow = '4px 4px 0 #000';

        this.shopButton.addEventListener('click', () => {
            this.shopModal.style.display = 'flex';
            this.renderShopItems();
        });

        this.container.appendChild(this.shopButton);
    }

    createShopModal() {
        this.shopModal = document.createElement('div');
        this.shopModal.style.display = 'none';
        this.shopModal.style.position = 'absolute';
        this.shopModal.style.top = '0';
        this.shopModal.style.left = '0';
        this.shopModal.style.width = '100%';
        this.shopModal.style.height = '100%';
        this.shopModal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.shopModal.style.pointerEvents = 'auto';
        this.shopModal.style.justifyContent = 'center';
        this.shopModal.style.alignItems = 'center';
        this.shopModal.style.zIndex = '1000';

        const modalContent = document.createElement('div');
        modalContent.style.position = 'relative';
        modalContent.style.backgroundColor = '#2c3e50';
        modalContent.style.border = '6px solid #f39c12';
        modalContent.style.borderRadius = '12px';
        modalContent.style.padding = '30px';
        modalContent.style.width = '90%';
        modalContent.style.maxWidth = '700px';
        modalContent.style.maxHeight = '80%';
        modalContent.style.overflowY = 'auto';
        modalContent.style.boxShadow = '0 0 20px #000';

        const title = document.createElement('h1');
        title.innerText = 'UPGRADE SHOP';
        title.style.color = '#f1c40f';
        title.style.textAlign = 'center';
        title.style.margin = '0 0 20px 0';
        title.style.fontSize = '32px';
        modalContent.appendChild(title);

        const closeBtn = document.createElement('button');
        closeBtn.innerText = 'X';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '10px';
        closeBtn.style.right = '15px';
        closeBtn.style.fontSize = '24px';
        closeBtn.style.color = '#fff';
        closeBtn.style.backgroundColor = 'transparent';
        closeBtn.style.border = 'none';
        closeBtn.style.cursor = 'pointer';
        closeBtn.addEventListener('click', () => {
            this.shopModal.style.display = 'none';
        });
        modalContent.appendChild(closeBtn);

        this.shopItemsContainer = document.createElement('div');
        modalContent.appendChild(this.shopItemsContainer);

        this.shopModal.appendChild(modalContent);
        this.container.appendChild(this.shopModal);
    }

    renderShopItems() {
        if (!this.upgradesData) return;

        this.shopItemsContainer.innerHTML = '';

        for (const [key, def] of Object.entries(this.upgradeDefs)) {
            const level = this.upgradesData[key];
            const cost = this.getUpgradeCost(key);

            const itemDiv = document.createElement('div');
            itemDiv.style.backgroundColor = '#34495e';
            itemDiv.style.border = '3px solid #7f8c8d';
            itemDiv.style.borderRadius = '8px';
            itemDiv.style.padding = '15px';
            itemDiv.style.marginBottom = '15px';
            itemDiv.style.display = 'flex';
            itemDiv.style.justifyContent = 'space-between';
            itemDiv.style.alignItems = 'center';

            const infoDiv = document.createElement('div');
            infoDiv.style.flex = '1';

            const nameEl = document.createElement('div');
            nameEl.innerText = `${def.name} (LVL ${level})`;
            nameEl.style.color = '#ecf0f1';
            nameEl.style.fontSize = '14px';
            nameEl.style.marginBottom = '8px';
            nameEl.style.lineHeight = '1.4';

            const descEl = document.createElement('div');
            descEl.innerText = def.desc;
            descEl.style.color = '#bdc3c7';
            descEl.style.fontSize = '10px';
            descEl.style.lineHeight = '1.4';

            infoDiv.appendChild(nameEl);
            infoDiv.appendChild(descEl);

            const buyDiv = document.createElement('div');
            buyDiv.style.marginLeft = '20px';
            buyDiv.style.textAlign = 'right';

            const costEl = document.createElement('div');
            costEl.innerText = `COST: $${cost}`;
            costEl.style.color = this.money >= cost ? '#2ecc71' : '#e74c3c';
            costEl.style.fontSize = '14px';
            costEl.style.marginBottom = '10px';

            const buyBtn = document.createElement('button');
            buyBtn.innerText = 'BUY';
            buyBtn.style.padding = '8px 16px';
            buyBtn.style.fontSize = '14px';
            buyBtn.style.fontFamily = 'inherit';
            buyBtn.style.fontWeight = 'bold';
            buyBtn.style.color = '#fff';
            buyBtn.style.backgroundColor = this.money >= cost ? '#27ae60' : '#7f8c8d';
            buyBtn.style.border = '3px solid #fff';
            buyBtn.style.borderRadius = '5px';
            buyBtn.style.cursor = this.money >= cost ? 'pointer' : 'not-allowed';

            if (this.money >= cost) {
                buyBtn.addEventListener('click', () => {
                    this.tryBuyUpgrade(key, cost);
                });
            }

            buyDiv.appendChild(costEl);
            buyDiv.appendChild(buyBtn);

            itemDiv.appendChild(infoDiv);
            itemDiv.appendChild(buyDiv);

            this.shopItemsContainer.appendChild(itemDiv);
        }
    }

    tryBuyUpgrade(upgradeKey, cost) {
        if (this.money >= cost) {
            this.money -= cost;
            this.moneyElement.innerText = `MONEY: ${this.money}`;

            if (this.onUpgradePurchased) {
                this.onUpgradePurchased(upgradeKey);
            }

            this.renderShopItems();
        }
    }

    updateMoney(amount) {
        if (amount > 0) {
            amount *= this.multiplier;
        }
        this.money += amount;
        this.moneyElement.innerText = `MONEY: ${this.money}`;

        this.moneyElement.style.transform = 'scale(1.2)';

        setTimeout(() => {
            this.moneyElement.style.transform = 'scale(1)';
        }, 100);
    }
}
