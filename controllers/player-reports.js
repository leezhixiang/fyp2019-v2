const Quiz = require('../models/mongoose/quiz');
const PlayerReport = require('../models/mongoose/player_report');
const HosterReport = require('../models/mongoose/hoster_report');

exports.deleteAllPlayerReports = (hoster) => {
    PlayerReport.deleteMany({ game_id: hoster.gameId })
        .then(() => {
            // console.log(`[@player mongoDB] player reports was deleted.`);
        }).catch(err => {
            console.log(err);
        });
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
};

exports.addPlayerReport = (socket, hoster) => {
    Quiz.findOne({ _id: hoster.quizId })
        .then((quiz) => {
            HosterReport.findOne({ game_id: hoster.gameId })
                .select('_id')
                .then(hosterReport => {
                    const playerReport = new PlayerReport({
                        socket_id: socket.id,
                        game_id: hoster.gameId,
                        player: socket.request.user._id,
                        game_name: quiz.title,
                        hoster_name: hoster.name,
                        hoster_report_id: hosterReport._id,
                        questions: quiz.questions
                    });

                    playerReport.save()
                        // console.log(`[@player join-game] mongoDB responses success`);
                })
                .catch(err => {
                    console.log(err);
                })
        })
        .catch(err => {
            console.log(err);
        });
};

exports.deletePlayerReport = (socket) => {
    PlayerReport.deleteOne({ socket_id: socket.id })
        .then(() => {
            // console.log(`[@player disconnect] mongoDB responses success`);
        })
        .catch(err => {
            console.log(err);
        });
};

exports.setOverallResults = (player, unattempted) => {
    PlayerReport.updateOne({ "socket_id": player.socketId }, {
            $set: { "rank": player.rank, "correct": player.correct, "incorrect": player.incorrect, "unattempted": unattempted }
        }, { upsert: true })
        .then(() => {
            // console.log(`[@player get-overall-results] mongoDB responses success`);
        })
        .catch(err => {
            console.log(err);
        });
}

exports.setAnswerResults = (player, hoster, choiceId) => {
    PlayerReport.updateOne({ "socket_id": player.socketId }, {
            $set: {
                "questions.$[i].choices.$[j].is_answer": true,
                "questions.$[i].choices.$[j].response_time": player.responseTime
            }
        }, { arrayFilters: [{ "i._id": hoster.question._id }, { "j._id": choiceId }], upsert: true })
        .then(() => {
            // console.log(`[@player player-answer] mongoDB responses success`);
        })
        .catch(err => {
            console.log(err);
        });
}