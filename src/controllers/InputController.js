export class InputController {
    constructor() {
        this.onDropCallbacks = []; // Lista de funciones a ejecutar al hacer clic
        this.initListeners();
    }

    initListeners() {
        // Escuchar clic del ratón
        window.addEventListener('mousedown', (e) => this.onMouseDown(e));
        
        // Escuchar toque en pantalla (para móviles)
        window.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                this.onMouseDown(e.touches[0]);
            }
        }, { passive: false });
    }

    onMouseDown(e) {
        // 1. Obtenemos la posición X del ratón en la pantalla (de 0 a ancho de pantalla)
        const screenX = e.clientX;
        
        // 2. Lo normalizamos para que vaya de -1 (izquierda) a 1 (derecha)
        const normalizedX = (screenX / window.innerWidth) * 2 - 1;
        
        // 3. Avisamos a los controladores que estén escuchando (el GameController)
        this.onDropCallbacks.forEach(callback => callback(normalizedX));
    }

    // Función para que otros archivos se suscriban a este evento
    onDrop(callback) {
        this.onDropCallbacks.push(callback);
    }

    onMouseMove(e) {
        // Se usará para las cartas más adelante
    }

    onMouseUp(e) {
        // Se usará para soltar las cartas más adelante
    }
}