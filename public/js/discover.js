window.onload = () => {
    const token = JSON.parse(localStorage.getItem('auth_token'));
    if (token) {
        document.querySelector('#guest-nav').classList.add("hidden");
    } else {
        document.querySelector('#user-nav').classList.add("hidden");
    }

    document.querySelector("#logout").addEventListener("click", function(e) {
        localStorage.removeItem('auth_token');
        window.location.href = "http://localhost:3000/";
    });

    // socket.io connection
    const passToken = (token) => {
        if (token) {
            return { query: `auth_token=${token}` }
        };
    };

    const notificationSocket = io('/notification', passToken(token));

    // connection failed
    notificationSocket.on('error', (err) => {
        throw new Error(err.message);
    });

    // connection successful
    notificationSocket.on('socket-conn', (data) => {
        console.log(`[socket-conn] ${data.message}`);
        console.log(`[socket-conn] token: ${data.hasToken}`);
    })

    // get notification from server
    notificationSocket.on('notifications', function(data) {
        console.log(data);
    });

    // mark all as read
    document.querySelectorAll('.notification').forEach((notification, index) => {
        notification.addEventListener('click', () => {
            notificationSocket.emit('read-notification');
        });
    });

    // get quizzes from api
    fetch(`http://localhost:3000/api/quizzes`)
        .then(function(res) {
            return res.json()
        })
        .then(function(quizzes) {
            let html = "";
            console.log(quizzes);

            quizzes.forEach(quiz => {
                html += `<div class="quiz-card">
                            <a href="/quizzes/${quiz._id}">
                                <div>
                                    <p><span>${quiz.questions.length}</span> Question</span></p> 
                                    <p>${quiz.title}</p>
                                    <p><span>${quiz.creator.name}</span> • <span>${quiz.plays}</span> plays</p>
                                </div>
                            </a>
                        </div>`
            })

            document.querySelector('#quizList').innerHTML = html;
        })
        .catch(function(err) {
            console.log(err)
        })
}