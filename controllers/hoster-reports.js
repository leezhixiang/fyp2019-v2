const calculationsContoller = require('../controllers/calculations');

const Quiz = require('../models/mongoose/quiz');
const HosterReport = require('../models/mongoose/hoster_report');

exports.addHosterReports = (socket, hoster) => {
    Quiz.findOne({ _id: hoster.quizId })
        .then((quiz) => {
            const hosterReport = new HosterReport({
                socket_id: socket.id,
                game_id: hoster.gameId,
                hoster: socket.request.user._id,
                game_name: quiz.title,
                questions: quiz.questions
            });

            hosterReport.save()
                .then(() => {
                    // console.log(`[@hoster mongoDB] hoster report was created.`);
                }).catch(err => {
                    console.log(err);
                });
        })
        .catch(err => {
            console.log(err);
        });
};

exports.deleteHosterReport = (socket, hoster) => {
    if (hoster && hoster.isGameOver === false) {
        HosterReport.deleteOne({ socket_id: socket.id })
            .then(() => {
                // console.log(`[@hoster mongoDB] hoster report was deleted.`);
            })
            .catch(err => {
                console.log(err);
            });
    };
};

exports.setGameOverData = (hoster, gameAccuracy, scoreBoard, playerResults) => {
    HosterReport.updateOne({ "socket_id": hoster.socketId }, {
            $set: { "accuracy": gameAccuracy, "scoreboard": scoreBoard, "player_results": playerResults }
        }, { upsert: true })
        .then(() => {
            // console.log(`[@hoster next-question] mongoDB responses success`);
        })
        .catch(err => {
            console.log(err);
        })
};

exports.setQuestionResults = (hoster, questionResultsAccuracy, choicesAccuracy, noAnsAccuracy) => {
    HosterReport.findOneAndUpdate({ "socket_id": hoster.socketId }, {
            $set: {
                "questions.$[question].accuracy": questionResultsAccuracy,

                "questions.$[question].choices.$[choice1].numPlayers": hoster.questionResults.choice1,
                "questions.$[question].choices.$[choice1].accuracy": choicesAccuracy.choice1,

                "questions.$[question].choices.$[choice2].numPlayers": hoster.questionResults.choice2,
                "questions.$[question].choices.$[choice2].accuracy": choicesAccuracy.choice2,

                "questions.$[question].choices.$[choice3].numPlayers": hoster.questionResults.choice3,
                "questions.$[question].choices.$[choice3].accuracy": choicesAccuracy.choice3,

                "questions.$[question].choices.$[choice4].numPlayers": hoster.questionResults.choice4,
                "questions.$[question].choices.$[choice4].accuracy": choicesAccuracy.choice4,

                "questions.$[question].numNoAnsPlayers": (hoster.receivedPlayers.length - hoster.answeredPlayers.length),
                "questions.$[question].noAnsAccuracy": noAnsAccuracy,
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