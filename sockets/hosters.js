// controllers
const hosterGamesController = require('../controllers/hoster-games');

const hosterRoutes = (socket) => {

    hosterGamesController.disconnect(socket);

    hosterGamesController.hostGame(socket);

    hosterGamesController.nextQuestion(socket);

    hosterGamesController.timerCountdown(socket);
};

module.exports = hosterRoutes;