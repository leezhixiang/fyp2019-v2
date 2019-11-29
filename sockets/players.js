// controllers
const playersController = require('../controllers/player-games');

const playerRoutes = (socket, hasToken) => {

    playersController.disconnect(socket);

    playersController.joinGame(socket);

    playersController.getReceivedQuestion(socket);

    playersController.getPlayerAnswer(socket);

    playersController.getQuestionResults(socket);

    playersController.getOverallResults(socket);
};

module.exports = playerRoutes;