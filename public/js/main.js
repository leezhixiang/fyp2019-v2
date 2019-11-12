window.onload = function() {
    const socket = io.connect('http://localhost:3000');

    socket.emit('host-game', (data) => {
        console.log(data);
    });
}