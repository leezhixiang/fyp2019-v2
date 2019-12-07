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
            window.location.href = "http://localhost:3000/users/login";
        }
    });

    // classes
    document.querySelector('#classes').addEventListener('click', (e) => {
        e.preventDefault();
        if (token) {
            window.location.href = "http://localhost:3000/classes";
        } else {
            window.location.href = "http://localhost:3000/users/login";
        }
    });

    // notification
    document.querySelector('#jewelButton').addEventListener('click', (e) => {
        if (!token) {
            return window.location.href = "http://localhost:3000/users/login";
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
        window.location.href = "http://localhost:3000/";
    });

    // quiz details
    const pathName = window.location.pathname.split('/');
    const quizId = pathName[2];

    document.querySelector("#printBtn").addEventListener("click", function(e) {
        window.location.href = `http://localhost:3000/print/quizzes/${quizId}`;
    });

    passHeader = (token) => {
        if (token) {
            return {
                'authorization': `Bearer ${token}`
            }
        }
    }

    fetch(`http://localhost:3000/api/quizzes/${quizId}`, {
            method: 'GET',
            headers: passHeader(token)
        })
        .then(res => res.json())
        .then(res => {
            const { quiz, isFavorited } = res;

            console.log(quiz)

            document.querySelector("#tQuestionBadge").textContent = `${quiz.questions.length} Questions`;
            document.querySelector("#title").textContent = quiz.title;
            document.querySelector("#creator").textContent = quiz.creator.name;
            document.querySelector("#tPlays").textContent = `${quiz.plays} Plays`;
            document.querySelector("#tQuestion").textContent = quiz.questions.length;

            if (isFavorited) {
                document.querySelector("#favIcon").classList.remove('fa-star-o')
                document.querySelector("#favIcon").classList.add('fa-star')
            }

            let html = "";

            quiz.questions.forEach((question, index) => {
                html += `<div class="col-md-8 mt-3">
                            <div class="card">
                                <div class="card-body" id="headingOne" style="height: 6.375rem;">
                                    <button class="btn btn-question" type="button" data-toggle="collapse" data-parent="#accordionQuizzes" data-target="#collapse${index +1}"
                                        aria-expanded="true" aria-controls="collapseOne">
                                        <span class="ellipsis text-left">Q${index +1}. <span
                                                class="font-weight-bold">${question.question}</span></span>
                                    </button>
                                </div>
                                <div id="collapse${index +1}" class="collapse" aria-labelledby="headingOne" >
                                    <ul class="list-group list-group-flush">
                                        <li class="list-group-item border-top">
                                            <div class="d-flex flex-row ">
                                                <div class="mr-3">
                                                    <span id="icon-choice1" class="align-middle"></span>
                                                </div>
                                                <div class="align-middle text-truncate mr-3">
                                                    ${question.choices[0].choice}
                                                </div>
                                                <div class="ml-auto">
                                                    <span class="align-middle ${question.choices[0].is_correct}"></span>
                                                </div>
                                            </div>
                                        </li>
                                        <li class="list-group-item">
                                            <div class="d-flex flex-row ">
                                                <div class="mr-3">
                                                    <span id="icon-choice2" class="align-middle"></span>
                                                </div>
                                                <div class="align-middle text-truncate mr-3">
                                                    ${question.choices[1].choice}
                                                </div>
                                                <div class="ml-auto">
                                                    <span class="align-middle ${question.choices[1].is_correct}"></span>
                                                </div>
                                            </div>
                                        </li>
                                        <li class="list-group-item">
                                            <div class="d-flex flex-row ">
                                                <div class="mr-3">
                                                    <span id="icon-choice3" class="align-middle"></span>
                                                </div>
                                                <div class="align-middle text-truncate mr-3">
                                                    ${question.choices[2].choice}
                                                </div>
                                                <div class="ml-auto">
                                                    <span class="align-middle ${question.choices[2].is_correct}"></span>
                                                </div>
                                            </div>
                                        </li>
                                        <li class="list-group-item">
                                            <div class="d-flex flex-row ">
                                                <div class="mr-3">
                                                    <span id="icon-choice4" class="align-middle"></span>
                                                </div>
                                                <div class="align-middle text-truncate mr-3">
                                                    ${question.choices[3].choice}
                                                </div>
                                                <div class="ml-auto">
                                                    <span class="align-middle ${question.choices[3].is_correct}"></span>
                                                </div>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>`
            });

            document.querySelector('#accordionQuizzes').innerHTML = html;
        })
        .catch(err => console.log(err));

    // show/hide answers
    $("#collapseToggle").click((e) => {
        e.preventDefault();
        if ((document.querySelector("#collapseToggle").textContent).includes("HIDE ANSWERS")) {
            document.querySelector('#collapseToggle').textContent = "SHOW ANSWERS";
            $(".collapse").collapse('hide');
        } else {
            document.querySelector('#collapseToggle').textContent = "HIDE ANSWERS";
            $(".collapse").collapse('show');
        }
    });

    $('#accordionQuizzes').on('shown.bs.collapse', () => {
        let hasOneCollapsed = false;
        document.querySelectorAll(".collapse").forEach((collapse) => {
            if (!collapse.classList.contains("show")) {
                hasOneCollapsed = true;
            }
        })
        if (!hasOneCollapsed) {
            document.querySelector('#collapseToggle').textContent = "HIDE ANSWERS";
        }
    })

    $('#accordionQuizzes').on('hidden.bs.collapse', () => {
        let hasOneCollapsed = false;
        document.querySelectorAll(".collapse").forEach((collapse) => {
            if (collapse.classList.contains("show")) {
                hasOneCollapsed = true;
            }
        })
        if (!hasOneCollapsed) {
            document.querySelector('#collapseToggle').textContent = "SHOW ANSWERS";
        }
    })

    // host game
    document.querySelector("#hostBtn").addEventListener("click", (e) => {
        window.location.href = `http://localhost:3000/games/host-game?quizId=${quizId}`;
    })

    // favorite
    document.querySelector("#favBtn").addEventListener("click", (e) => {
        if (!token) {
            return window.location.href = "http://localhost:3000/users/login";
        }
        // unfavorite
        if (document.querySelector("#favIcon").classList.contains("fa-star")) {
            setTimeout(() => {
                document.querySelector("#favIcon").classList.remove('fa-star')
                document.querySelector("#favIcon").classList.add('fa-star-o')
            }, 15)

            fetch(`http://localhost:3000/api/library/favorites/${quizId}`, {
                    method: 'DELETE',
                    headers: {
                        'authorization': `Bearer ${token}`
                    }
                })
                .then(res => res.json())
                .then(res => console.log(res))
                .catch(err => console.log(err));

        } else {
            setTimeout(() => {
                document.querySelector("#favIcon").classList.remove('fa-star-o')
                document.querySelector("#favIcon").classList.add('fa-star')
            }, 15)

            fetch(`http://localhost:3000/api/library/favorites/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ quizId })
                })
                .then(res => res.json())
                .then(res => console.log(res))
                .catch(err => console.log(err));
        };
    });

    // share
    document.querySelector("#shareBtn").addEventListener("click", (e) => {
        console.log(token)
        if (!token) {
            return window.location.href = "http://localhost:3000/users/login";
        }
        $('#exampleModalCenter').modal('toggle')
    });

    document.querySelector("#shareBtn2").addEventListener("click", (e) => {
        e.preventDefault();
        const email = document.querySelector('#email').value

        fetch(`http://localhost:3000/api/library/shared`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email, quizId })
            })
            .then(res => res.json())
            .then(res => {
                if (res.isShared === true) {
                    const html = `<div class="alert alert-success alert-dismissible fade show mt-4" role="alert">${res.message}
                                    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                                        <span aria-hidden="true">&times;</span>
                                    </button>
                                </div>`
                    document.querySelector('#share-alert').innerHTML = html;
                } else {
                    const html = `<div class="alert alert-warning alert-dismissible fade show" role="alert">${res.message} ${res.err}
                                    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                                        <span aria-hidden="true">&times;</span>
                                    </button>
                                </div>`
                    document.querySelector('#share-alert').innerHTML = html;
                }
            })
            .catch(err => console.log(err));
    })
}