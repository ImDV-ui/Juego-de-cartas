export class GameData {
    constructor() {
        this.saveData = {
            upgrades: {
                autoDropper: 0,
                pusherSpeed: 0,
                luckyCards: 0,
                coinMultiplier: 0
            }
        };
    }

    load() {

        const data = localStorage.getItem('coinPusherData');
        if (data) {
            const parsedData = JSON.parse(data);
            this.saveData = {
                ...this.saveData,
                ...parsedData,
                upgrades: {
                    ...this.saveData.upgrades,
                    ...(parsedData.upgrades || {})
                }
            };
        }
    }

    save() {

        localStorage.setItem('coinPusherData', JSON.stringify(this.saveData));
    }
}
