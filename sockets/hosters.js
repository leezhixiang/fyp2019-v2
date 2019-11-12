const io = require('../models/socket').getIO()
const Hoster = require('../models/hoster')

const hosterRoutes = (socket) => {

    socket.on('disconnect', (callback) => {
        const hoster = Hoster.getHosterById(socket.id)

        if (hoster) {
            console.log(`[disconenct] ${socket.id} has left`)
            Hoster.removeHoster(socket.id)
            console.log(Hoster.getHosters())
        }
    });

    socket.on('host-game', (callback) => {
        const hoster = Hoster.getHosterById(socket.id)

        if (!hoster) {
            const hoster = new Hoster(socket.id, 'gweg3294156f', 778899);
            hoster.addHoster();
            console.log('[host-game]');
            console.log(Hoster.getHosters());
            callback(hoster)
        }
    });

};

module.exports = hosterRoutes;