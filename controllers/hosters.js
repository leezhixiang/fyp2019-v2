const mongoose = require('mongoose');

const Hoster = require('../models/hoster');
const Quiz = require('../models/mongoose/quiz');

exports.addHoster = (socket, data) => {
    const hasToken = socket.request.user.logged_in;
    const { quizId, suffleQuestions, suffleAnswerOptions, assignClassIds } = data;

    passName = () => {
        if (hasToken === true) { return socket.request.user.name };
    };

    const gameId = Hoster.generateGameId();

    const hoster = new Hoster(socket.id, quizId, gameId, { suffleQuestions, suffleAnswerOptions }, passName());
    hoster.addHoster();

    // save shuffled question ids
    if (hoster.settings.suffleQuestions === true) {
        Quiz.findOne({ _id: hoster.quizId })
            .then((quiz) => {
                hoster.shuffledQuestionIds = quiz.questions.sort(() => Math.random() - .5).map((q) => q._id);
                Hoster.updateHoster(hoster);
            })
            .catch(err => {
                console.log(err);
            });
    };

    return hoster;
};

exports.removeHoster = (socket) => {
    Hoster.removeHoster(socket.id);
}

exports.addCurrentTimeLeft = (hoster, timeLeft) => {
    hoster.timeLeft = timeLeft;
    Hoster.updateHoster(hoster);

    if (timeLeft === 0) {
        hoster.isQuestionLive = false;
        Hoster.updateHoster(hoster);
    };
};

exports.setQuestionData = (hoster, quiz) => {
    hoster.isGameLive = true;
    hoster.isQuestionLive = true;
    hoster.questionIndex += 1;
    hoster.answeredPlayers = [];
    hoster.receivedPlayers = [];
    hoster.questionResults = { choice1: 0, choice2: 0, choice3: 0, choice4: 0 };

    // shuffle questions
    if (hoster.settings.suffleQuestions === true) {
        quiz.questions.sort((a, b) => {
            return hoster.shuffledQuestionIds.indexOf(a._id) - hoster.shuffledQuestionIds.indexOf(b._id);
        });
        console.log('[@player next-question] shuffled questions')
    };

    hoster.question = (quiz.questions[hoster.questionIndex]);

    // shuffle choices
    if (hoster.settings.suffleAnswerOptions === true) {
        hoster.question.choices.sort(() => Math.random() - .5);

        console.log('[@player next-question] shuffled answer options')
    };

    hoster.questionLength = quiz.questions.length;
    Hoster.updateHoster(hoster);
};

exports.setGameOverData = (hoster) => {
    hoster.isGameOver = true;
    Hoster.updateHoster(hoster);
};

exports.removeAnsweredPlayer = (hoster, socket) => {
    hoster.answeredPlayers = hoster.answeredPlayers.filter((answeredPlayer) => answeredPlayer != socket.id)
    Hoster.updateHoster(hoster);
}

exports.removeReceivedPlayer = (hoster, socket) => {
    hoster.receivedPlayers = hoster.receivedPlayers.filter((receivedPlayer) => receivedPlayer != socket.id)
    Hoster.updateHoster(hoster);
}

exports.addReceivedPlayer = (hoster, socket) => {
    hoster.receivedPlayers.push(socket.id);
    Hoster.updateHoster(hoster);
}

exports.addAnsweredPlayer = (hoster, socket) => {
    hoster.answeredPlayers.push(socket.id);
    Hoster.updateHoster(hoster);
}

exports.setLastQuestionData = (hoster) => {
    hoster.isQuestionLive = false;
    Hoster.updateHoster(hoster);
}

exports.addQuestionResults = (hoster, choiceId) => {
    hoster.question.choices.forEach((choice, index) => {
        if (mongoose.Types.ObjectId(choiceId).equals(choice._id)) {
            hoster.questionResults[Object.keys(hoster.questionResults)[index]] += 1;
            Hoster.updateHoster(hoster);
        };
    });
}