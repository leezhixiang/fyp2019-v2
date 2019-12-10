window.onload = () => {
    const token = JSON.parse(localStorage.getItem('auth_token'));

    // account
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
            window.location.href = "/quizzes";
        } else {
            window.location.href = "/users/login";
        }
    });

    // reports
    document.querySelector('#reports').addEventListener('click', (e) => {
        e.preventDefault();
        if (token) {
            window.location.href = "/reports";
        } else {
            window.location.href = "/users/login";
        }
    });

    // classes
    document.querySelector('#classes').addEventListener('click', (e) => {
        e.preventDefault();
        if (token) {
            window.location.href = "/classes";
        } else {
            window.location.href = "/users/login";
        }
    });

    // notification
    document.querySelector('#jewelButton').addEventListener('click', (e) => {
        if (!token) {
            return window.location.href = "/users/login";
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

    $('#dropdownNotification').on('show.bs.dropdown', () => {
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
        window.location.href = "/";
    });

    const pathName = window.location.pathname.split('/');
    const played_reportId = pathName[3];

    fetch(`/api/reports/player/${played_reportId}`, {
            headers: {
                'authorization': `Bearer ${token}`,
            }
        })
        .then((res) => {
            return res.json();
        })
        .then((report) => {
            console.log(report);
            const accuracy = Math.floor((report.correct / report.questions.length) * 100);
            document.querySelector('#reportTimeStamp').textContent = report.played_date;
            document.querySelector('#gameName').textContent = report.game_name;
            document.querySelector('#creator').textContent = report.hoster_name;
            document.querySelector('#totalPoints').textContent = `${report.points}`;
            document.querySelector('#totalAccuracy').textContent = `${accuracy}%`;
            document.querySelector('#rank').textContent = `${report.unattempted}`;
            document.querySelector('#totalCorrects').textContent = `${report.correct}`;
            document.querySelector('#totalIncorrects').textContent = `${report.incorrect}`;
            document.querySelector('#totalUnattempted').textContent = `${report.unattempted}`;

            report.scoreboard.forEach((scorer, index) => {
                const scorerNames = document.querySelectorAll(".scorer-name");
                const scorerPoints = document.querySelectorAll(".scorer-points");
                scorerNames[index].textContent = scorer.name;
                scorerPoints[index].textContent = scorer.points;
            })
        })

    document.querySelector("#overallTab").addEventListener("click", function(e) {
        document.querySelector('#overallTab').classList.add("active");
        document.querySelector('#questionTab').classList.remove("active");

        document.querySelector('#questionReport').classList.add("d-none");
        document.querySelector('#overallReport').classList.remove("d-none");
    })

    document.querySelector("#questionTab").addEventListener("click", function(e) {
        document.querySelector('#questionTab').classList.add("active");
        document.querySelector('#overallTab').classList.remove("active");

        document.querySelector('#overallReport').classList.add("d-none");
        document.querySelector('#questionReport').classList.remove("d-none");

        fetch(`/api/reports/player/${played_reportId}`, {
                headers: {
                    'authorization': `Bearer ${token}`,
                }
            })
            .then((res) => {
                return res.json();
            })
            .then((report) => {
                console.log(report);
                const { questions } = report;

                let html = "";

                questions.forEach((question, index) => {
                    let correctChoice = {
                        choice: `You did't answer`,
                        is_answer: true
                    };

                    question.choices.forEach(choice => {
                        // console.log(typeof choice.is_answer)
                        if (typeof choice.is_answer !== 'undefined') {
                            correctChoice.choice = choice.choice;
                            correctChoice.is_answer = choice.is_answer;
                        }
                    })

                    html += `<div class="col-md-8 mb-3">
                                <div class="question-list__wrap p-3">

                                    <div class="question-list__body">
                                        <div><small>Question <span id="questionIndex">${index+1}</span></small></div>
                                        <div id="questionTitle" class"">${question.question}</div>
                                    </div>

                                    <div class="mt-2 mb-1"><small><strong>You answered</strong></small></div>
                                    <ul class="question-list question-list--player">
                                        <li class="question-item question-item--correct d-flex px-3 py-2 align-items-center flex-wrap">
                                            <div class="question-choice flex-grow-1 mr-2 my-1" id="choice">${correctChoice.choice}</div>
                                            <div class="d-flex align-items-center flex-wrap my-1 ml-auto">
                                                <div class="choice-result choice-result--${correctChoice.is_answer}"></div>
                                            </div>
                                            
                                        </li>
                                        <li class="question-item d-flex px-3 py-2 align-items-center flex-wrap">
                                            <div class="question-choice flex-grow-1 mr-2 my-1" id="choice">${question.choices[0].choice}</div>
                                            <div class="d-flex align-items-center flex-wrap ml-auto">
                                                <div class="choice-accuracy mr-1" id="choiceAccuracy">${question.choices[0].accuracy}%</div>
                                                <div class="choice-result choice-result--${question.choices[0].is_correct}"></div>
                                            </div>
                                        </li>
                                        <li class="question-item d-flex px-3 py-2 align-items-center flex-wrap">
                                            <div class="question-choice flex-grow-1 mr-2 my-1" id="choice">${question.choices[1].choice}</div>
                                            <div class="d-flex align-items-center flex-wrap ml-auto">
                                                <div class="choice-accuracy mr-1" id="choiceAccuracy">${question.choices[1].accuracy}%</div>
                                                <div class="choice-result choice-result--${question.choices[1].is_correct}"></div>
                                            </div>
                                        </li>
                                        <li class="question-item d-flex px-3 py-2 align-items-center flex-wrap">
                                            <div class="question-choice flex-grow-1 mr-2 my-1" id="choice">${question.choices[2].choice}</div>
                                            <div class="d-flex align-items-center flex-wrap ml-auto">
                                                <div class="choice-accuracy mr-1" id="choiceAccuracy">${question.choices[2].accuracy}%</div>
                                                <div class="choice-result choice-result--${question.choices[2].is_correct}"></div>
                                            </div>
                                        </li>
                                        <li class="question-item d-flex px-3 py-2 align-items-center flex-wrap">
                                            <div class="question-choice flex-grow-1 mr-2 my-1" id="choice">${question.choices[3].choice}</div>
                                            <div class="d-flex align-items-center flex-wrap ml-auto">
                                                <div class="choice-accuracy mr-1" id="choiceAccuracy">${question.choices[3].accuracy}%</div>
                                                <div class="choice-result choice-result--${question.choices[3].is_correct}"></div>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            </div>`;

                    document.querySelector('#questionReportList').innerHTML = html;
                })
            })
    })
};