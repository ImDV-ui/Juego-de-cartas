export class AudioController {
    constructor() {
        this.bgMusic = new Audio('assets/audio/ringtones-super-mario-bros.mp3');
        this.bgMusic.loop = true;
        this.bgMusic.volume = 0.5;

        this.coinSound = new Audio('assets/audio/mario-coin.mp3');
        this.coinSound.volume = 0.8;

        this.starSound = new Audio('assets/audio/mario-star.mp3');
        this.starSound.volume = 0.8;

        this.bgMusicStarted = false;
        this.isMuted = false;

        // Intentar iniciar la música automáticamente
        this.playBgMusic();

        // Los navegadores a menudo bloquean el autoplay, así que también
        // escuchamos el primer clic en la pantalla por si acaso.
        document.addEventListener('click', () => {
            this.playBgMusic();
        }, { once: true });
    }

    playBgMusic() {
        if (!this.bgMusicStarted) {
            this.bgMusicStarted = true;
            this.bgMusic.play().catch(e => {
                console.warn("Autoplay bloqueado (requiere interacción del usuario):", e);
                this.bgMusicStarted = false;
            });
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        this.bgMusic.muted = this.isMuted;
        return this.isMuted;
    }

    playCoinSound() {
        if (this.isMuted) return;
        const sound = this.coinSound.cloneNode();
        sound.volume = this.coinSound.volume;
        sound.play().catch(e => console.warn("Sonido de moneda bloqueado:", e));
    }

    playStarSound() {
        if (this.isMuted) return;
        this.bgMusic.muted = true;
        const sound = this.starSound.cloneNode();
        sound.volume = this.starSound.volume;
        sound.addEventListener('ended', () => {
            if (!this.isMuted) this.bgMusic.muted = false;
        });
        sound.play().catch(e => {
            console.warn("Sonido de estrella bloqueado:", e);
            if (!this.isMuted) this.bgMusic.muted = false;
        });
    }
}
