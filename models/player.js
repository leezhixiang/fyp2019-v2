let players = [];

module.exports = class Player {
    constructor(
        socketId,
        name,
        gameId,
        correct = 0,
        incorrect = 0,
        score = 0
    ) {
        this.socketId = socketId;
        this.name = name;
        this.gameId = gameId;
        this.correct = correct;
        this.incorrect = incorrect;
        this.score = score;
    }

    addPlayer() {
        players.push(this);
    }

    static getPlayers() {
        return players;
        // .map((hoster) => hoster.socketId);
    }

    static getPlayersByGameId(gameId) {
        return players.filter((player) => player.gameId === gameId)
    }

    static getPlayerByName(name) {
        return players.find((player) => player.name === name)
    }

    static getPlayerById(socketId) {
        return players.find((player) => player.socketId === socketId)
    }

    static getPlayerByGameId(gameId) {
        return players.find((player) => player.gameId === gameId)
    }

    static removePlayer(socketId) {
        players = players.filter((player) => {
            return player.socketId != socketId;
        });
    }

    static updatePlayer(newPlayer) {
        // replacing caring about position
        const indexOldPlayer = players.findIndex(player => player.socketId === newPlayer.socketId)
        players = [...players.slice(0, indexOldPlayer), newPlayer, ...players.slice(indexOldPlayer + 1)]
    }
}