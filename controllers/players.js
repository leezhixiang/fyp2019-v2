const Player = require('../models/player');
const Quiz = require('../models/mongoose/quiz');

exports.addPlayer = (socket, data) => {
    const { name, gameId } = data;

    const player = new Player(socket.id, name, gameId);

    // save to memory
    player.addPlayer();

    return player;
};

exports.deletePlayer = (socket) => {
    Player.removePlayer(socket.id);
};

exports.setQuestionData = (player) => {
    // reset to false & 0 after receives new question, player did not answer will get these values
    player.didAnswer = false;
    player.responseTime = 0;
    player.currentPoints = 0;
    Player.updatePlayer(player);
}

exports.setStreakData = (player) => {
    // lost streak
    player.isLostStreak = true;
    player.streak = 0;
    Player.updatePlayer(player);
};

exports.setCurrentRank = (player, scoreBoard) => {
    const currentRank = scoreBoard.findIndex((scorer) => scorer.socketId === player.socketId);
    player.rank = currentRank + 1;
    Player.updatePlayer(player);

    return currentRank;
}

exports.setWrongAnswerData = (player, hoster) => {
    player.responseTime = hoster.question.timer - hoster.timeLeft;

    // having streak
    if (player.streak > 0) {
        // lost streak
        player.isLostStreak = true;
        player.streak = 0;
        Player.updatePlayer(player);
    };

    player.incorrect += 1;
    player.answerResult = false;
    player.didAnswer = true;
    Player.updatePlayer(player);

    // console.log(`[@player player-answer] answerResult: ${false}, streak ${player.streak}`)
};

exports.setCorrectAnswerData = (player, hoster) => {
    const timeScore = Math.floor((hoster.timeLeft / hoster.question.timer) * 1000);

    // previous answer result is true && toggled to 1000
    if (player.answerResult === true && player.points >= 1000) {

        player.responseTime = hoster.question.timer - hoster.timeLeft;

        // gain streak
        player.isLostStreak = false;

        // maximum streak is 6
        if (player.streak < 7) {
            //streak ++
            player.streak += 1;
        };

        // points (up to 1000 points) + bonus
        player.currentPoints = (timeScore + ((player.streak * 100) - 100));
        player.points += (timeScore + ((player.streak * 100) - 100));
        console.log(`bonus ${((player.streak * 100) - 100)}`);

        player.correct += 1;
        player.answerResult = true;
        player.didAnswer = true;
        Player.updatePlayer(player);

        // console.log(`[@player player-answer] answerResult: ${true}, streak ${player.streak}`)

    } else {
        player.responseTime = hoster.question.timer - hoster.timeLeft;

        // gain streak
        player.isLostStreak = false;

        player.currentPoints = timeScore;
        player.points += timeScore;

        player.correct += 1;
        player.answerResult = true;
        player.didAnswer = true;
        Player.updatePlayer(player);

        // console.log(`[@player player-answer] answerResult: ${true}, streak ${player.streak}`)
    };
}