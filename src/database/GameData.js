export class GameData {
    constructor() {
        this.saveData = {};
    }

    load() {

        const data = localStorage.getItem('coinPusherData');
        if (data) {
            this.saveData = JSON.parse(data);
        }
    }

    save() {

        localStorage.setItem('coinPusherData', JSON.stringify(this.saveData));
    }
}
