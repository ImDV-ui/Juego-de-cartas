export class GameData {
    constructor() {
        this.saveData = {};
    }

    load() {
        // Load data from LocalStorage or API
        const data = localStorage.getItem('coinPusherData');
        if (data) {
            this.saveData = JSON.parse(data);
        }
    }

    save() {
        // Save data to LocalStorage
        localStorage.setItem('coinPusherData', JSON.stringify(this.saveData));
    }
}
