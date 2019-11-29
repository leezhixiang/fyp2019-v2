const Player = require('../models/player');

exports.calcScoreboard = (hoster) => {
    const players = Player.getPlayersByGameId(hoster.gameId);
    const scoreBoard = players.map((player) => {
        return {
            socketId: player.socketId,
            name: player.name,
            points: player.points
        };
    }).sort((a, b) => b.points - a.points).splice(0, 5);
    return scoreBoard;
};

exports.calcGameAccuracy = (hoster) => {
    const players = Player.getPlayersByGameId(hoster.gameId);

    const totalCorrect = players.map((player) => player.correct)
        .reduce((accumulator, currentValue) => accumulator + currentValue);
    const totalIncorrect = players.map((player) => player.incorrect)
        .reduce((accumulator, currentValue) => accumulator + currentValue);
    const totalUnattempted = players.map((player) => hoster.questionLength - player.correct - player.incorrect)
        .reduce((accumulator, currentValue) => accumulator + currentValue);
    return Math.floor((totalCorrect / (totalCorrect + totalIncorrect + totalUnattempted) * 100));
};

exports.calcPlayerResults = (hoster) => {
    const players = Player.getPlayersByGameId(hoster.gameId);

    return players.map((player) => {
        const results = {}
        results.name = player.name;
        results.correct = player.correct;
        results.incorrect = player.incorrect;
        results.unattempted = hoster.questionLength - player.correct - player.incorrect;
        results.accuracy = Math.floor((player.correct / (player.correct + player.incorrect + results.unattempted) * 100));
        return results
    });
};

exports.calcQuestionResultsAccuracy = (hoster) => {
    const choiceResults = [];
    const keys = Object.keys(hoster.questionResults);
    hoster.question.choices.forEach((choice, index) => {
        if (choice.is_correct === true) {
            choiceResults.push(hoster.questionResults[keys[index]]);
        };
    });

    const totalChoiceResults = choiceResults.reduce((accumulator, currentValue) => accumulator + currentValue);
    return Math.floor((totalChoiceResults / hoster.receivedPlayers.length) * 100);
};

exports.calcChoicesAccuracy = (hoster) => {
    // calculate choice accuracy
    calcChoiceAccuracy = (totalChoices, totalPlayers) => {
        return Math.floor((totalChoices / totalPlayers) * 100);
    };

    const choicesAccuracy = {};
    choicesAccuracy.choice1 = calcChoiceAccuracy(hoster.questionResults.choice1, hoster.receivedPlayers.length);
    choicesAccuracy.choice2 = calcChoiceAccuracy(hoster.questionResults.choice2, hoster.receivedPlayers.length);
    choicesAccuracy.choice3 = calcChoiceAccuracy(hoster.questionResults.choice3, hoster.receivedPlayers.length);
    choicesAccuracy.choice4 = calcChoiceAccuracy(hoster.questionResults.choice4, hoster.receivedPlayers.length);
    const noAnsAccuracy = Math.floor(((hoster.receivedPlayers.length - hoster.answeredPlayers.length) / hoster.receivedPlayers.length) * 100);

    return { choicesAccuracy, noAnsAccuracy };
};

exports.calcBonus = (hoster, player) => {
    const timeScore = Math.floor(((hoster.question.timer - player.responseTime) / hoster.question.timer) * 1000);
    return (player.currentPoints - timeScore);
};