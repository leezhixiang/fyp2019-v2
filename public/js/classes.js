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

    $('.dropdown').on('show.bs.dropdown', () => {
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

    getClasses = () => {

        fetch(`/api/classes/`, {
                headers: {
                    'authorization': `Bearer ${token}`,
                }
            })
            .then((res) => {
                return res.json();
            })
            .then((classes) => {
                console.log(classes)
                document.querySelector("#tClasses").textContent = classes.length;

                let html = "";
                classes.forEach((myClass) => {
                    checkExist = () => {
                        if (myClass.section !== undefined || myClass.tutorial_group !== undefined) {
                            return `<div class="class-section text-truncate">${myClass.section}</div>
                            <div class="class-group">Group ${myClass.tutorial_group}</div>`
                        } else {
                            return ""
                        }

                    }

                    checkAdmin = () => {
                        if (myClass.isAdmin === true) {
                            return `admin`
                        } else {
                            return `member`
                        }
                    }

                    html += `<div class="col-md-4 class-card__wrap class-card__wrap--${checkAdmin()} mb-3">
                                <div class="class-card p-3" style="height:126px">
                                    <a href="/classes/${myClass._id}" class="h-100">
                                        <div class="d-flex flex-column justify-content-between h-100">
                                            <div class="body hover-body mb-3 flex-grow-1">
                                                <div class="class-name ellipsis1" style="font-size:1.25rem">${myClass.name}</div>
                                                <div class="class-batch d-flex text-truncate">
                                                    ${checkExist()}
                                                </div>
                                            </div>
                                            <div class="footer">
                                                <div class="class-creator">${myClass.admins[0].name}</div>
                                            </div>
                                        </div>
                                    </a>
                                </div>
                            </div>`
                    document.querySelector('.class-list').innerHTML = html;
                })

            });
    }

    getClasses();

    document.querySelector("#createClassBtn").addEventListener("click", function(e) {
        $('#createClassModal').modal('show');
    });

    document.querySelector("#joinClassBtn").addEventListener("click", function(e) {
        $('#joinClassModal').modal('show');
    });

    document.querySelector('#saveClassBtn').addEventListener('click', (e) => {
        const className = document.querySelector('#className').value;
        const section = document.querySelector('#section').value;
        const group = document.querySelector('#group').value;
        console.log(className)
        console.log(section)
        console.log(group)
        if (className === "") {
            return document.querySelector('#createClassAlert').innerHTML = `
            <div class="alert alert-warning" role="alert">Class name is required.</div>
            `
        } else if (typeof group !== 'number') {
            return document.querySelector('#createClassAlert').innerHTML = `
            <div class="alert alert-warning" role="alert">Invalid tutorial group, please enter a number input.</div>
            `
        } else {
            fetch(`/api/classes/`, {
                    method: 'POST',
                    headers: {
                        'authorization': `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        name: className,
                        section,
                        tutorial_group: group
                    })
                })
                .then(res => res.json())
                .then(res => {
                    console.log(res)
                    if (res.isCreated) {
                        getClasses();
                        document.querySelector('#createClassAlert').innerHTML = `
                        <div class="alert alert-success" role="alert">Created successful.</div>
                        `
                    }
                })
                .catch(err => console.log(err));

        }
    });


    document.querySelector('#JoinBtn').addEventListener('click', (e) => {
        const classCode = document.querySelector('#classCode').value;

        if (classCode === "") {
            return document.querySelector('#joinClassAlert').innerHTML = `
            <div class="alert alert-warning" role="alert">Class code is required.</div>
            `
        } else {
            fetch(`/api/members/`, {
                    method: 'POST',
                    headers: {
                        'authorization': `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        class_id: classCode
                    })
                })
                .then(res => res.json())
                .then(res => {
                    console.log(res)
                    if (res.isUpdated === true) {
                        getClasses();
                        document.querySelector('#joinClassAlert').innerHTML = `
                        <div class="alert alert-success" role="alert">Join successful.</div>
                        `
                    } else {
                        document.querySelector('#joinClassAlert').innerHTML = `
            <div class="alert alert-warning" role="alert">${res.err}</div>
            `
                    }
                })
                .catch(err => console.log(err));

        }
    });


    $('#joinClassModal').on('hidden.bs.modal', function(e) {
        document.querySelector('#classCode').value = "";
    })

    $('#createClassModal').on('hidden.bs.modal', function(e) {
        document.querySelector('#className').value = "";
        document.querySelector('#section').value = "";
        document.querySelector('#group').value = "";
    })
}