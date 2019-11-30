// controllers
const hosterGamesController = require('../controllers/hosters');

const hosterRoutes = (socket) => {

    hosterGamesController.disconnect(socket);

    hosterGamesController.hostGame(socket);

    hosterGamesController.nextQuestion(socket);

    hosterGamesController.timerCountdown(socket);
};

module.exports = hosterRoutes;