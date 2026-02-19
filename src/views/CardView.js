export class CardView {
    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'card-container';
        this.container.style.position = 'absolute';
        this.container.style.left = '30px';
        this.container.style.top = '50%';
        this.container.style.transform = 'translateY(-50%)';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.gap = '25px';
        this.container.style.pointerEvents = 'none';
        document.body.appendChild(this.container);
    }

    createCardElement(cardData) {
        // 1. El Hueco (Slot)
        const slot = document.createElement('div');
        slot.className = 'card-slot';
        slot.style.width = '130px';
        slot.style.height = '182px';
        slot.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        slot.style.border = '2px dashed rgba(255, 255, 255, 0.2)';
        slot.style.borderRadius = '12px';
        slot.style.boxShadow = 'inset 0 4px 8px rgba(0,0,0,0.6)';
        slot.style.position = 'relative';
        slot.style.pointerEvents = 'auto';

        // 2. La Carta Física
        const card = document.createElement('div');
        card.className = 'game-card';
        card.style.width = '100%';
        card.style.height = '100%';
        card.style.position = 'absolute';
        card.style.top = '0';
        card.style.left = '0';

        // --- CAMBIOS CLAVE PARA QUITAR MÁRGENES ---
        card.style.backgroundColor = 'transparent'; // Fondo transparente
        card.style.border = 'none'; // Sin borde
        card.style.borderRadius = '12px'; // Mantenemos las esquinas redondeadas
        card.style.cursor = 'grab';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.alignItems = 'center';
        card.style.justifyContent = 'center';
        card.style.userSelect = 'none';
        card.style.boxShadow = '2px 6px 15px rgba(0,0,0,0.5)';
        // Importante: overflow hidden para que la imagen no se salga de las esquinas redondeadas
        card.style.overflow = 'hidden';

        if (cardData.image) {
            card.style.backgroundImage = `url('${cardData.image}')`;
            // 'cover' hace que la imagen llene TODO el espacio, recortando si es necesario
            card.style.backgroundSize = 'cover';
            card.style.backgroundPosition = 'center';
            card.style.backgroundRepeat = 'no-repeat';
            card.innerHTML = '';
        } else {
            // Fallback elegante si no hay imagen
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
        // Deprecated/Compatibility: If passed a card, try to find its slot
        if (cardElement && cardElement.parentNode && cardElement.parentNode.classList.contains('card-slot')) {
            this.removeSlot(cardElement.parentNode);
        } else if (cardElement && cardElement.parentNode) {
            cardElement.parentNode.removeChild(cardElement);
        }
    }

    render(cards) {
    }
}