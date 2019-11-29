const PlayerReport = require('../models/mongoose/player_report');

exports.deletePlayerReports = (hoster) => {
    if (hoster && hoster.isGameOver === false) {
        PlayerReport.deleteMany({ game_id: hoster.gameId })
            .then(() => {
                // console.log(`[@player mongoDB] player reports was deleted.`);
            }).catch(err => {
                console.log(err);
            });
    };
};

exports.setGameOverData = (hoster, scoreBoard) => {
    PlayerReport.updateMany({ "game_id": hoster.gameId }, {
            $set: { "scoreboard": scoreBoard }
        }, { upsert: true })
        .then(() => {
            // console.log(`[@player next-question] mongoDB responses success`);
        })
        .catch(err => {
            console.log(err);
        });
}

exports.setQuestionResults = (hoster, choicesAccuracy) => {
    PlayerReport.updateMany({ "game_id": hoster.gameId }, {
            $set: {
                "questions.$[question].choices.$[choice1].accuracy": choicesAccuracy.choice1,
                "questions.$[question].choices.$[choice2].accuracy": choicesAccuracy.choice2,
                "questions.$[question].choices.$[choice3].accuracy": choicesAccuracy.choice3,
                "questions.$[question].choices.$[choice4].accuracy": choicesAccuracy.choice4
            }
        }, {
            arrayFilters: [
                { "question._id": hoster.question._id },
                { "choice1._id": hoster.question.choices[0]._id },
                { "choice2._id": hoster.question.choices[1]._id },
                { "choice3._id": hoster.question.choices[2]._id },
                { "choice4._id": hoster.question.choices[3]._id }
            ],
            upsert: true
        })
        .then(() => {
            // console.log(`[@player next-question] mongoDB responses success`);
        })
        .catch(err => {
            console.log(err);
        });
}