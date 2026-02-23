export class CardView {
    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'card-container';
        this.container.style.position = 'absolute';
        this.container.style.left = '30px';
        this.container.style.top = '50%';
        this.container.style.transform = 'translateY(-50%)';
        this.container.style.display = 'grid';
        
        this.container.style.gridTemplateRows = 'repeat(5, 130px)';
        this.container.style.gridAutoFlow = 'column';
        this.container.style.gap = '10px';
        this.container.style.pointerEvents = 'none';
        document.body.appendChild(this.container);
    }

    createCardElement(cardData) {
        
        const slot = document.createElement('div');
        slot.className = 'card-slot';

        
        slot.style.width = '120px';
        slot.style.height = '130px';

        slot.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        slot.style.border = '2px dashed rgba(255, 255, 255, 0.2)';
        slot.style.borderRadius = '12px';
        slot.style.boxShadow = 'inset 0 4px 8px rgba(0,0,0,0.6)';
        slot.style.position = 'relative';
        slot.style.pointerEvents = 'auto';

        
        const card = document.createElement('div');
        card.className = 'game-card';
        card.style.width = '100%';
        card.style.height = '100%';
        card.style.position = 'absolute';
        card.style.top = '0';
        card.style.left = '0';

        
        card.style.backgroundColor = 'transparent'; 
        card.style.border = 'none'; 
        card.style.borderRadius = '12px'; 
        card.style.cursor = 'grab';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.alignItems = 'center';
        card.style.justifyContent = 'center';
        card.style.userSelect = 'none';

        
        card.style.boxShadow = '4px 6px 0px rgba(0,0,0,0.6), 2px 6px 15px rgba(0,0,0,0.4)';

        
        card.style.overflow = 'hidden';

        if (cardData.image) {
            card.style.backgroundImage = `url('${cardData.image}')`;

            
            card.style.backgroundSize = 'contain';

            card.style.backgroundPosition = 'center';
            card.style.backgroundRepeat = 'no-repeat';
            card.innerHTML = '';
        } else {
            
            card.style.backgroundColor = '#ecf0f1';
            card.style.border = '2px solid #bdc3c7';
            card.innerHTML = `
                <div style="font-size: 30px;">✨</div>
                <div style="font-weight: bold; margin-top: 10px; font-size: 16px;">${cardData.name}</div>
            `;
        }

        slot.appendChild(card);
        this.container.appendChild(slot);

        return card;
    }

    removeSlot(slotElement) {
        if (slotElement && slotElement.parentNode) {
            slotElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            slotElement.style.opacity = '0';
            slotElement.style.transform = 'scale(0.8)';
            setTimeout(() => {
                if (slotElement.parentNode) slotElement.parentNode.removeChild(slotElement);
            }, 300);
        }
    }

    removeCard(cardElement) {
        
        if (cardElement && cardElement.parentNode && cardElement.parentNode.classList.contains('card-slot')) {
            this.removeSlot(cardElement.parentNode);
        } else if (cardElement && cardElement.parentNode) {
            cardElement.parentNode.removeChild(cardElement);
        }
    }

    render(cards) {
    }
}