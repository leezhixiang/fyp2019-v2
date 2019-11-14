window.onload = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get('quizId');

    const token = JSON.parse(localStorage.getItem('auth_token'));

    const passToken = (token) => {
        if (token) {
            return { query: `auth_token=${token}` }
        }
    }

    const socket = io.connect('http://localhost:3000', passToken(token));

    // Connection failed
    socket.on('error', (err) => {
        throw new Error(err.message);
    });
    // Connection succeeded
    socket.on('success', (data) => {
        console.log(data.message);
    })

}