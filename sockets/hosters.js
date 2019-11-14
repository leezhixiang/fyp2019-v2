const io = require('../models/socket').getIO()

// data model
const Hoster = require('../models/hoster')
const Quiz = require('../models/mongoose/quiz')
const HosterReport = require('../models/mongoose/hoster_report')

const hosterRoutes = (socket) => {

    // socket.on('disconnect', (callback) => {
    //     const hoster = Hoster.getHosterById(socket.id)

    //     if (hoster) {
    //         Hoster.removeHoster(socket.id)

    //         if (hoster.isGameLive === false) {
    //             HosterReport.findOneAndRemove({ socket_id: socket.id }, (err, data) => {
    //                 if (!err) {
    //                     console.log(`[disconenct] deleted hoster report`);
    //                 }
    //             });
    //         }

    //         console.log(`[disconenct] ${socket.id} has left from room ${hoster.gameId}`);
    //         // console.log(`[disconenct]`)
    //         // console.log(Hoster.getHosters())
    //     }
    // });

    // socket.on('host-game', (quizId, callback) => {
    //     Quiz.findById(quizId)
    //         .then(quiz => {
    //             if (!quiz) {
    //                 // callback(isHosted, message, gameId)
    //                 return callback({
    //                     isHosted: false,
    //                     message: 'failed to host game as quiz doest not exist'
    //                 })
    //             }

    //             const gameId = Hoster.generateRandomPIN()
    //             const hoster = new Hoster(socket.request.user._id, socket.id, quizId, gameId);

    //             hoster.addHoster();

    //             // save to mongoDB
    //             const hosterReport = new HosterReport({
    //                 socket_id: socket.id,
    //                 game_id: gameId,
    //                 hoster: socket.request.user._id,
    //                 game_name: quiz.title,
    //                 questions: quiz.questions
    //             });

    //             hosterReport.save()

    //             socket.join(hoster.gameId);
    //             console.log(`[host-game] ${hoster.socketId} ${socket.request.user.name} hoster created new room ${hoster.gameId}`);
    //             // console.log('[host-game]');
    //             // console.log(Hoster.getHosters());
    //             // callback(isHosted, message, gameId)
    //             callback({
    //                 isHosted: true,
    //                 message: 'succeed to host game',
    //                 gameId: hoster.gameId
    //             })
    //         })
    //         .catch(err => {
    //             console.log(`[host-game] ${err.message}`);
    //             // callback(isHosted, message, gameId)
    //             callback({
    //                 isHosted: false,
    //                 message: err.message
    //             })
    //         });
    // });

    // socket.on('next-question', (btnState, callback) => {
    //     const hoster = Hoster.getHosterById(socket.id)

    //     if (btnState == true) {
    //         Quiz.findOne({ _id: hoster.quizId })
    //             .then(quiz => {
    //                 hoster.isGameLive = true;
    //                 hoster.isQuestionLive = true;
    //                 hoster.questionIndex += 1;
    //                 hoster.answeredPlayers = [];
    //                 hoster.receivedPlayers = [];
    //                 hoster.summary = {}
    //                 Hoster.updateHoster(hoster)

    //                 if (questionIndex === quiz.questions.length) {
    //                     console.log('Game Over')
    //                 }

    //                 console.log(`Current Question ${questionIndex + 1} | Total Question: ${quiz.questions.length}`)

    //                 const question = quiz.questions[currentIndex];
    //                 callback({ isStarted: true, question, gameId: hoster.gameId })
    //             })
    //             .catch((err) => {
    //                 console.log(err)
    //             })

    //     } else if (btnState == false) {

    //         hoster.setQuestionLive(existingHoster.pin, false);
    //         console.log(hoster.summary)

    //         // callback(false, data);
    //         // socket.to(hoster.gameId).emit('open');
    //     }






    // })
};

module.exports = hosterRoutes;