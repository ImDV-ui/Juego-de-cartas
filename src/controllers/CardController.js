import { CardView } from '../views/CardView.js';

export class CardController {
    constructor(gameController) {
        this.gameController = gameController;
        this.view = new CardView();
        this.cards = [];
        this.draggedCard = null;
        // Variables para guardar dónde hemos agarrado la carta exactamente
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;

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

        this.addCard({
            id: 'donkey_barrel',
            name: 'KONG BARREL',
            description: 'Summons a heavy barrel to crush coins!',
            type: 'DONKEY_BARREL',
            image: 'assets/images/carta barril.png'
        });
    }

    giveRandomCard() {
        const cardTypes = [
            {
                id: 'bonus_100',
                name: 'MEGA SHOWER',
                description: 'Drops 30 BIG coins!',
                type: 'COIN_SHOWER',
                image: 'assets/images/lluvia de monedas.png'
            },
            {
                id: 'double_money',
                name: 'DOUBLE MONEY',
                description: 'x2 Money for 2 mins!',
                type: 'DOUBLE_MONEY',
                image: 'assets/images/x2 de dinero.png'
            },
            {
                id: 'donkey_barrel',
                name: 'KONG BARREL',
                description: 'Summons a heavy barrel to crush coins!',
                type: 'DONKEY_BARREL',
                image: 'assets/images/carta barril.png'
            }
        ];

        const randomCard = cardTypes[Math.floor(Math.random() * cardTypes.length)];
        // Create a copy to ensure unique ID if needed, though simple logic works for now
        this.addCard({ ...randomCard, id: randomCard.id + '_' + Date.now() });
        console.log("Random card given:", randomCard.name);
    }

    addCard(cardData) {
        if (this.cards.length >= 10) {
            console.warn("Max cards (10) reached. Cannot add more.");
            return;
        }

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
        this.originalSlot = this.draggedCard.element.parentNode; // Guardamos el slot original

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        // 1. Obtener rect para calcular offset y guardar dimensiones
        const rect = this.draggedCard.element.getBoundingClientRect();
        this.dragOffsetX = clientX - rect.left;
        this.dragOffsetY = clientY - rect.top;

        // 2. Fijar dimensiones explícitas antes de mover al body para evitar resize
        this.draggedCard.element.style.width = `${rect.width}px`;
        this.draggedCard.element.style.height = `${rect.height}px`;

        // 3. Mover al body para romper el contexto de transform del contenedor
        document.body.appendChild(this.draggedCard.element);

        // 4. Estilos para el arrastre
        this.draggedCard.element.style.position = 'fixed';
        this.draggedCard.element.style.zIndex = '1000';
        this.draggedCard.element.style.cursor = 'grabbing';
        this.draggedCard.element.style.transform = 'scale(1.5)';
        this.draggedCard.element.style.boxShadow = '0 10px 20px rgba(0,0,0,0.5)';

        // 5. Posicionar inicialmente
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

        const newLeft = clientX - this.dragOffsetX;
        const newTop = clientY - this.dragOffsetY;

        this.draggedCard.element.style.left = `${newLeft}px`;
        this.draggedCard.element.style.top = `${newTop}px`;
    }

    onDragEnd(e) {
        if (!this.draggedCard) return;

        window.removeEventListener('mousemove', this.boundMove);
        window.removeEventListener('touchmove', this.boundMove);
        window.removeEventListener('mouseup', this.boundUp);
        window.removeEventListener('touchend', this.boundUp);

        const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;

        // Zona de drop: > 25% del ancho (lado derecho)
        if (clientX > window.innerWidth * 0.25) {
            this.playCardEffect(this.draggedCard.data);

            // Eliminar elemento arrastrado (que está en body)
            if (this.draggedCard.element.parentNode) {
                this.draggedCard.element.parentNode.removeChild(this.draggedCard.element);
            }
            // Eliminar el slot original usando la vista
            this.view.removeSlot(this.originalSlot);

            this.cards = this.cards.filter(c => c !== this.draggedCard);
        } else {
            // Cancelar: Devolver al slot original
            this.originalSlot.appendChild(this.draggedCard.element);

            // Resetear estilos
            this.draggedCard.element.style.position = 'absolute';
            this.draggedCard.element.style.left = '0';
            this.draggedCard.element.style.top = '0';
            this.draggedCard.element.style.width = '100%';
            this.draggedCard.element.style.height = '100%';
            this.draggedCard.element.style.zIndex = '';
            this.draggedCard.element.style.transform = '';
            this.draggedCard.element.style.boxShadow = '2px 6px 15px rgba(0,0,0,0.5)';
            this.draggedCard.element.style.cursor = 'grab';
        }

        this.draggedCard = null;
        this.originalSlot = null;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
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
                this.gameController.view.ui.moneyElement.style.color = '#ffff00';

                setTimeout(() => {
                    if (this.gameController.view.ui) {
                        this.gameController.view.ui.multiplier = 1;
                        this.gameController.view.ui.moneyElement.style.color = '#00ff00';
                        console.log("Multiplier reset to x1");
                    }
                }, 120000);
            }
        } else if (cardData.type === 'DONKEY_BARREL') {
            console.log("Kong Barrel dropped!");
            if (this.gameController) {
                this.gameController.spawnBarrel();
            }
        } else if (cardData.type === 'GIFT_CARD') {
            console.log("Gift Card Collected!");
            // Simple reward: Drop 10 coins
            if (this.gameController && this.gameController.coinController) {
                for (let i = 0; i < 10; i++) {
                    setTimeout(() => {
                        this.gameController.coinController.spawnCoin(
                            (Math.random() - 0.5) * 4,
                            4,
                            1 + Math.random() * 2
                        );
                    }, i * 200);
                }
            }
        }
    }

    update(deltaTime) {
    }

    render() {
    }
}