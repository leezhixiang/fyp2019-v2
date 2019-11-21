let hosters = [];

module.exports = class Hoster {
    constructor(
        socketId,
        quizId,
        gameId,
        settings = {
            suffleQuestions: false,
            suffleAnswerOptions: false
        },
        name = undefined,
        isGameLive = false,
        isGameOver = false,
        isQuestionLive = false,
        questionIndex = -1,
        shuffledQuestionIds = [],
        question = {},
        questionLength = 0,
        answeredPlayers = [],
        receivedPlayers = [],
        timeLeft = 0,
        questionResults = { choice1: 0, choice2: 0, choice3: 0, choice4: 0 }
    ) {
        this.socketId = socketId;
        this.quizId = quizId;
        this.gameId = gameId;
        this.settings = settings;
        this.name = name;
        this.isGameLive = isGameLive;
        this.isGameOver = isGameOver;
        this.isQuestionLive = isQuestionLive;
        this.questionIndex = questionIndex;
        this.shuffledQuestionIds = shuffledQuestionIds;
        this.question = question;
        this.questionLength = questionLength;
        this.answeredPlayers = answeredPlayers;
        this.receivedPlayers = receivedPlayers;
        this.timeLeft = timeLeft;
        this.questionResults = questionResults;
    }

    addHoster() {
        hosters.push(this);
    }

    static removeHoster(socketId) {
        hosters = hosters.filter((hoster) => {
            return hoster.socketId != socketId;
        });
    }

    static updateHoster(newHoster) {
        // replacing caring about position
        const indexOldHoster = hosters.findIndex(hoster => hoster.socketId === newHoster.socketId)
        hosters = [...hosters.slice(0, indexOldHoster), newHoster, ...hosters.slice(indexOldHoster + 1)]
    }

    static getHosters() {
        return hosters;
    }

    static getHosterById(socketId) {
        return hosters.find((hoster) => hoster.socketId === socketId)
    }

    static getHosterByGameId(gameId) {
        return hosters.find((hoster) => hoster.gameId === gameId)
    }

    static generateGameId() {
        let gameId = String(Math.floor(Math.random() * 90000) + 10000);
        const existingGameId = hosters.find((hoster) => {
            return hoster.gameId === gameId;
        })
        if (existingGameId) {
            generateGameId();
        } else {
            return gameId;
        }
    }


    // static removeHoster(socketId) {
    //     const index = hosters.findIndex(hoster => hoster.socketId === socketId)
    //     hosters = [...hosters.slice(0, index), ...hosters.slice(index + 1)]
    // }
}