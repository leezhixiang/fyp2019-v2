// controllers
const hostersController = require('../controllers/hosters');

const hosterRoutes = (socket, hasToken) => {

    hostersController.disconnect(socket, hasToken);

    hostersController.hostGame(socket, hasToken);

    hostersController.nextQuestion(socket, hasToken);

    hostersController.timerCountdown(socket, hasToken);
};

module.exports = hosterRoutes;