let players = [];

module.exports = class Player {
    constructor(
        userId,
        socketId,
        gameId
    ) {
        this.userId = userId;
        this.socketId = socketId;
        this.gameId = gameId;
    }

    addPlayer() {
        hosters = [...hosters, this];
    }

    static getPlayers() {
        return hosters;
        // .map((hoster) => hoster.socketId);
    }

    static removePlayer(socketId) {
        const index = hosters.findIndex(hoster => hoster.socketId === socketId)
        hosters = [...hosters.slice(0, index), ...hosters.slice(index + 1)]
    }

    static updatePlayer(hoster) {
        const index = hosters.findIndex(hoster => hoster.socketId === hoster.socketId)
        hosters = [...hosters.slice(0, index), hoster, ...hosters.slice(index + 1)]
    }

    static getPlayerById(socketId) {
        return hosters.find((hoster) => hoster.socketId === socketId)
    }
}