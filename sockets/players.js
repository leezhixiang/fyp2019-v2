// controllers
const playersController = require('../controllers/players');

const playerRoutes = (socket, hasToken) => {

    playersController.disconnect(socket, hasToken);

    playersController.joinGame(socket, hasToken);

    playersController.getReceivedQuestion(socket, hasToken);

    playersController.getPlayerAnswer(socket, hasToken);

    playersController.getQuestionResults(socket, hasToken);

    playersController.getOverallResults(socket, hasToken);
};

module.exports = playerRoutes;