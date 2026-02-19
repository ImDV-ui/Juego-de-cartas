import { CardView } from '../views/CardView.js';

export class CardController {
    constructor() {
        this.cards = [];
        this.view = new CardView();
        this.draggedCard = null;
    }

    update(deltaTime) {
        // Logic for card effects, movement, interactions
    }

    render() {
        this.view.render(this.cards);
    }

    onDragStart(x, y) {
        // Handle drag start
    }

    onDragMove(x, y) {
        // Handle drag move
    }

    onDragEnd() {
        // Handle drag end
    }
}
