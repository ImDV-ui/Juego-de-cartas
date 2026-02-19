export class CardView {
    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'card-container';
        this.container.style.position = 'absolute';
        this.container.style.bottom = '20px';
        this.container.style.left = '50%';
        this.container.style.transform = 'translateX(-50%)';
        this.container.style.display = 'flex';
        this.container.style.gap = '20px';
        this.container.style.pointerEvents = 'none'; // Container through-click
        document.body.appendChild(this.container);
    }

    createCardElement(cardData) {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.style.width = '100px';
        card.style.height = '140px';
        card.style.backgroundColor = '#fff';
        card.style.border = '2px solid #000';
        card.style.borderRadius = '10px';
        card.style.cursor = 'grab';
        card.style.pointerEvents = 'auto'; // Enable clicks on cards
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.alignItems = 'center';
        card.style.justifyContent = 'center';
        card.style.userSelect = 'none';
        card.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';

        // Visuals
        card.innerHTML = `
            <div style="font-size: 24px;">💰</div>
            <div style="font-weight: bold; margin-top: 5px;">${cardData.name}</div>
            <div style="font-size: 12px; text-align: center; padding: 5px;">${cardData.description}</div>
        `;

        this.container.appendChild(card);
        return card;
    }

    removeCard(cardElement) {
        if (cardElement && cardElement.parentNode) {
            cardElement.parentNode.removeChild(cardElement);
        }
    }

    render(cards) {
        // Managing DOM updates via Controller is often cleaner for simple drag/drop
    }
}
