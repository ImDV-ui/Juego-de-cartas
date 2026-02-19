import { CardView } from '../views/CardView.js';

export class CardController {
    constructor(gameController) {
        this.gameController = gameController;
        this.view = new CardView();
        this.cards = [];

        this.addCard({
            id: 'bonus_100',
            name: 'MEGA SHOWER',
            description: 'Drops 30 BIG coins!',
            type: 'COIN_SHOWER',
            image: 'assets/images/lluvia de monedas.png'
        });

        this.addCard({
            id: 'double_money',
            name: 'DOUBLE MONEY',
            description: 'x2 Money for 2 mins!',
            type: 'DOUBLE_MONEY',
            image: 'assets/images/x2 de dinero.png'
        });


    }

    addCard(cardData) {
        const cardElement = this.view.createCardElement(cardData);
        const cardObj = { data: cardData, element: cardElement };
        this.cards.push(cardObj);

        cardElement.addEventListener('mousedown', (e) => this.onDragStart(e, cardObj));
        cardElement.addEventListener('touchstart', (e) => this.onDragStart(e, cardObj), { passive: false });
    }

    onDragStart(e, cardObj) {
        e.stopPropagation();
        if (e.type === 'touchstart') e.preventDefault();

        this.draggedCard = cardObj;
        this.draggedCard.element.style.position = 'fixed';
        this.draggedCard.element.style.zIndex = '1000';
        this.draggedCard.element.style.cursor = 'grabbing';
        this.draggedCard.element.style.transform = 'scale(1.1)';

        this.moveCardToInput(e);

        this.boundMove = (ev) => this.onDragMove(ev);
        this.boundUp = (ev) => this.onDragEnd(ev);

        window.addEventListener('mousemove', this.boundMove);
        window.addEventListener('touchmove', this.boundMove, { passive: false });
        window.addEventListener('mouseup', this.boundUp);
        window.addEventListener('touchend', this.boundUp);
    }

    onDragMove(e) {
        if (!this.draggedCard) return;
        if (e.type === 'touchmove') e.preventDefault();
        this.moveCardToInput(e);
    }

    moveCardToInput(e) {
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        this.draggedCard.element.style.left = `${clientX}px`;
        this.draggedCard.element.style.top = `${clientY}px`;
        this.draggedCard.element.style.bottom = 'auto';
    }

    onDragEnd(e) {
        if (!this.draggedCard) return;

        window.removeEventListener('mousemove', this.boundMove);
        window.removeEventListener('touchmove', this.boundMove);
        window.removeEventListener('mouseup', this.boundUp);
        window.removeEventListener('touchend', this.boundUp);

        const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;

        if (clientY < window.innerHeight * 0.7) {
            this.playCardEffect(this.draggedCard.data);
            this.view.removeCard(this.draggedCard.element);
            this.cards = this.cards.filter(c => c !== this.draggedCard);
        } else {
            this.draggedCard.element.style.position = '';
            this.draggedCard.element.style.left = '';
            this.draggedCard.element.style.top = '';
            this.draggedCard.element.style.bottom = '20px';
            this.draggedCard.element.style.transform = 'translateX(-50%)';
            this.draggedCard.element.style.cursor = 'grab';
            this.view.container.appendChild(this.draggedCard.element);
        }

        this.draggedCard = null;
    }

    playCardEffect(cardData) {
        console.log("Playing Card:", cardData.name);

        if (cardData.type === 'COIN_SHOWER') {
            if (this.gameController && this.gameController.coinController) {

                for (let i = 0; i < 30; i++) {
                    setTimeout(() => {
                        this.gameController.coinController.spawnCoin(
                            (Math.random() - 0.5) * 8,
                            4 + Math.random() * 5,
                            1 + Math.random() * 3
                        );
                    }, i * 100);
                }
            }
        } else if (cardData.type === 'DOUBLE_MONEY') {
            if (this.gameController && this.gameController.view && this.gameController.view.ui) {
                this.gameController.view.ui.multiplier = 2;
                console.log("Multiplier set to x2");

                // Visual feedback
                this.gameController.view.ui.moneyElement.style.color = '#ffff00'; // Yellow for multiplier

                setTimeout(() => {
                    this.gameController.view.ui.multiplier = 1;
                    this.gameController.view.ui.moneyElement.style.color = '#00ff00'; // Revert to green
                    console.log("Multiplier reset to x1");
                }, 120000); // 2 minutes
            }
        }
    }

    update(deltaTime) {
    }

    render() {
    }
}