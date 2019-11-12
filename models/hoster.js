let hosters = [];

module.exports = class Hoster {
    constructor(
        socketId,
        quizId,
        gameId,
        isGameLive = false,
        isQuestionLive = false,
        questionIndex = 0,
        answeredPlayers = [],
        receivedPlayers = [],
        timeLeft = 0,
        summary = {}
    ) {
        this.socketId = socketId;
        this.quizId = quizId;
        this.gameId = gameId;
        this.isGameLive = isGameLive;
        this.isQuestionLive = isQuestionLive;
        this.questionIndex = questionIndex;
        this.answeredPlayers = answeredPlayers;
        this.receivedPlayers = receivedPlayers;
        this.timeLeft = timeLeft;
        this.summary = summary;
    }

    addHoster() {
        hosters = [...hosters, this];
    }

    static getHosters() {
        return hosters;
        // .map((hoster) => hoster.socketId);
    }

    static removeHoster(socketId) {
        const index = hosters.findIndex(hoster => hoster.socketId === socketId)
        hosters = [...hosters.slice(0, index), ...hosters.slice(index + 1)]
    }

    static getHosterById(socketId) {
        return hosters.find((hoster) => hoster.socketId === socketId)
    }
}