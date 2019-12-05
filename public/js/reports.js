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

    document.querySelector("#playedTab").addEventListener("click", function(e) {
        document.querySelector('#playedTab').classList.add("active");
        document.querySelector('#playedReports').classList.remove("d-none");
        document.querySelector('#hostedTab').classList.remove("active");
        document.querySelector('#hostedReports').classList.add("d-none");
        // get player reports
        fetch(`http://localhost:3000/api/reports/player`, {
                headers: {
                    'authorization': `Bearer ${token}`,
                }
            })
            .then((res) => {
                return res.json();
            })
            .then((reports) => {
                console.log(reports);

                let html = "";

                reports.forEach((report) => {
                    html += `<div class="col-md-6">
                    <div class="report__wrap p-3 mb-3">
                        <div class="report-header__wrap d-flex align-items-center">
                            <img class="mr-2" src="/img/logo.png" height="18px" width="18px" alt="">
                            <div class="report-time-stamp text-truncate"><small>${report.played_date}</small></div>
                        </div>
                        <a href="/reports/played/${report._id}" class="report-title mt-1">${report.game_name}</a>
                        <div class="report-hosted text-muted text-truncate"><small>Hosted by
                                <span id="creator">${report.hoster_name}</span></small></div>
                    </div>
                </div>`;
                    document.querySelector('#playedReportsList').innerHTML = html;
                })
            });
    });

    document.querySelector("#playedTab").click();

    document.querySelector("#hostedTab").addEventListener("click", function(e) {

        document.querySelector('#hostedTab').classList.add("active");
        document.querySelector('#hostedReports').classList.remove("d-none");
        document.querySelector('#playedTab').classList.remove("active");
        document.querySelector('#playedReports').classList.add("d-none");
        // get hoster reports
        fetch(`http://localhost:3000/api/reports/hoster`, {
                headers: {
                    'authorization': `Bearer ${token}`,
                }
            })
            .then((res) => {
                return res.json();
            })
            .then((reports) => {
                console.log(reports);
                let html = "";

                reports.forEach((report) => {
                    html += `<div class="col-md-6">
                                <div class="report__wrap p-3 mb-3">
                                    <div class="report-header__wrap d-flex align-items-center">
                                        <img class="mr-2" src="/img/logo.png" height="18px" width="18px" alt="">
                                        <div class="report-time-stamp text-truncate"><small>${report.hosted_date}</small></div>
                                    </div>
                                    <a href="/reports/hosted/${report._id}" class="report-title mt-1">${report.game_name}</a>
                                </div>
                            </div>`;
                    document.querySelector('#hostedReportsList').innerHTML = html;
                })
            });
    })


}