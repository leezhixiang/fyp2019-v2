let players = [];

module.exports = class Player {
    constructor(
        socketId,
        name,
        gameId,
        points = 0,
        rank = 0,
        correct = 0,
        incorrect = 0,
        answerResult = undefined,
        didAnswer = undefined
    ) {
        this.socketId = socketId;
        this.name = name;
        this.gameId = gameId;
        this.points = points;
        this.rank = rank;
        this.correct = correct;
        this.incorrect = incorrect;
        this.answerResult = answerResult;
        this.didAnswer = didAnswer
    }

    addPlayer() {
        players.push(this);
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

    static getPlayers() {
        return players;
    }

    static getPlayersByGameId(gameId) {
        return players.filter((player) => player.gameId === gameId)
    }

    static getOnlinePlayersByGameId(gameId) {
        return players.filter((player) => player.gameId === gameId)
    }

    static getPlayerById(socketId) {
        return players.find((player) => player.socketId === socketId)
    }

    static getPlayerByName(name) {
        return players.find((player) => player.name === name)
    }

    static getPlayerByGameId(gameId) {
        return players.find((player) => player.gameId === gameId)
    }
}