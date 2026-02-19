import { CardView } from '../views/CardView.js';

export class CardController {
    constructor(gameController) {
        this.gameController = gameController;
        this.view = new CardView();
        this.cards = [];

        // Add initial test card
        this.addCard({
            id: 'bonus_100',
            name: '100 COINS',
            description: 'Drops 100 coins!',
            type: 'COIN_SHOWER'
        });
    }

    addCard(cardData) {
        const cardElement = this.view.createCardElement(cardData);
        const cardObj = { data: cardData, element: cardElement };
        this.cards.push(cardObj);

        // Bind Drag Events
        cardElement.addEventListener('mousedown', (e) => this.onDragStart(e, cardObj));
        cardElement.addEventListener('touchstart', (e) => this.onDragStart(e, cardObj), { passive: false });
    }

    onDragStart(e, cardObj) {
        e.stopPropagation(); // Prevent clicking the board under the card
        if (e.type === 'touchstart') e.preventDefault(); // Prevent scroll

        this.draggedCard = cardObj;
        this.draggedCard.element.style.position = 'fixed';
        this.draggedCard.element.style.zIndex = '1000';
        this.draggedCard.element.style.cursor = 'grabbing';
        this.draggedCard.element.style.transform = 'scale(1.1)';

        // Initial position sync
        this.moveCardToInput(e);

        // Global listeners for drag/drop
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
        // Remove bottom alignment from CSS
        this.draggedCard.element.style.bottom = 'auto';
    }

    onDragEnd(e) {
        if (!this.draggedCard) return;

        // Cleanup listeners
        window.removeEventListener('mousemove', this.boundMove);
        window.removeEventListener('touchmove', this.boundMove);
        window.removeEventListener('mouseup', this.boundUp);
        window.removeEventListener('touchend', this.boundUp);

        // Check Drop Zone (Top half of screen roughly means "Play Area")
        const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;

        if (clientY < window.innerHeight * 0.7) {
            // Valid Drop!
            this.playCardEffect(this.draggedCard.data);
            this.view.removeCard(this.draggedCard.element);
            this.cards = this.cards.filter(c => c !== this.draggedCard);
        } else {
            // Return to hand (Reset styles)
            this.draggedCard.element.style.position = '';
            this.draggedCard.element.style.left = '';
            this.draggedCard.element.style.top = '';
            this.draggedCard.element.style.bottom = '20px';
            this.draggedCard.element.style.transform = 'translateX(-50%)';
            this.draggedCard.element.style.cursor = 'grab';
            // Re-append to container to reset flex layout flow if needed
            this.view.container.appendChild(this.draggedCard.element);
        }

        this.draggedCard = null;
    }

    playCardEffect(cardData) {
        console.log("Playing Card:", cardData.name);

        if (cardData.type === 'COIN_SHOWER') {
            // Trigger 100 coins
            // Access GameController -> CoinController
            if (this.gameController && this.gameController.coinController) {
                for (let i = 0; i < 100; i++) {
                    setTimeout(() => {
                        this.gameController.coinController.spawnCoin(
                            (Math.random() - 0.5) * 8,
                            4 + Math.random() * 5,
                            1 + Math.random() * 3
                        );
                    }, i * 50); // Stagger 100 coins over 5 seconds
                }
            }
        }
    }

    update(deltaTime) {
        // Logic for card effects, movement, interactions
    }

    render() {
        // this.view.render(this.cards);
    }
}
