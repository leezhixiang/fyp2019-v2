window.onload = () => {
    const token = JSON.parse(localStorage.getItem('auth_token'));

    if (token) {
        document.querySelectorAll('.guest').forEach(guest => {
            guest.classList.add("d-none");
        });
    } else {
        document.querySelector('.logged').classList.add("d-none");
        document.querySelector('#jewelButton').setAttribute('data-toggle', '')
    };

    // socket.io connection
    const passToken = (token) => {
        if (token) { return { query: `auth_token=${token}` } };
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

    // quizzes
    document.querySelector('#quizzes').addEventListener('click', (e) => {
        e.preventDefault();
        if (token) {
            window.location.href = "http://localhost:3000/quizzes";
        } else {
            window.location.href = "http://localhost:3000/users/login";
        }
    });

    // reports
    document.querySelector('#reports').addEventListener('click', (e) => {
        e.preventDefault();
        if (token) {
            window.location.href = "http://localhost:3000/reports";
        } else {
            window.location.href = "http://localhost:3000/reports";
        }
    });

    // classes
    document.querySelector('#reports').addEventListener('click', (e) => {
        e.preventDefault();
        if (token) {
            window.location.href = "http://localhost:3000/reports";
        } else {
            window.location.href = "http://localhost:3000/reports";
        }
    });

    //notification
    document.querySelector('#jewelButton').addEventListener('click', (e) => {
        if (!token) {
            window.location.href = "http://localhost:3000/users/login";
        }
    });

    notificationSocket.on('total-notifications', (number) => {
        document.querySelector('#jewelCount').textContent += 1;
        if (number !== 0) {
            document.querySelector('#jewelCount').textContent = number;
        }
    });

    notificationSocket.on('new-notification', (content) => {
        document.querySelector('#jewelCount').classList.remove("d-none");
        document.querySelector('#jewelCount').textContent += 1;
    });

    $('.dropdown').on('show.bs.dropdown', function() {
        document.querySelector('#jewelCount').textContent = 0;
        document.querySelector('#jewelCount').classList.add("d-none");

        notificationSocket.emit('read-notification', (notifications) => {
            console.log(notifications);
            if (notifications.length === 0) {
                document.querySelector('#notificationsFlyout').innerHTML = `<a class="dropdown-item" href="#">No notifications.</a>`
            } else {
                let html = "";
                notifications.forEach(notification => {
                    html += `<div class="notification-box">
                                <div class="media">
                                    <img src="/img/avatar.jpg" width="46" height="46" alt="123" class="mr-3 rounded-circle">
                                    <div class="media-body">
                                        <div>${notification.content}</div>
                                        <small class="text-warning">${notification.time_stamp}</small>
                                    </div>
                                </div>
                            </div>`;
                });
                document.querySelector('#notificationsFlyout').innerHTML = html;
            }
        });
    });

    // logout button
    document.querySelector("#logout").addEventListener("click", function(e) {
        localStorage.removeItem('auth_token');
        window.location.href = "http://localhost:3000/";
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
                html += `<div class="col-6">
                            <div class="card shadow-sm">
                                <div class="row no-gutters">
                                    <div class="col-3 border-right p-2">
                                        <img src="/img/logo.png" class="card-img-top" style="opacity: 0.2" alt="...">
                                    </div>
                                    <div class="col-9">
                                        <div class="d-flex flex-column h-100 justify-content-between">
                                            <div class="p-2">
                                                <h6 class="badge badge-primary px-2 py-1">${quiz.questions.length}<span> Questions</span></h6>
                                                <a href="/quizzes/${quiz._id}" class="ellipsis stretched-link font-weight-bold title">${quiz.title}</a>
                                            </div>
                                            <div class="d-flex flex-row justify-content-between px-2 py-1 border-top"
                                                style="background: #f0f0f0;">
                                                <div class="flex-grow-1 font-weight-normal text-muted text-truncate">${quiz.creator.name}</div>
                                                <div class="flex-grow-1 text-right font-weight-bold text-truncate"><span>${quiz.plays}</span> plays</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>`
            });

            document.querySelector('#quizList').innerHTML = html;
        })
        .catch(function(err) {
            console.log(err)
        })
}