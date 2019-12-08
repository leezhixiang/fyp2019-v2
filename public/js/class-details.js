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
    const classId = pathName[2];

    let memberId;
    let classCode;

    getClassDetails = () => {


        fetch(`http://localhost:3000/api/classes/${classId}`, {
                headers: {
                    'authorization': `Bearer ${token}`,
                }
            })
            .then((res) => {
                return res.json();
            })
            .then((result) => {
                console.log(result)
                const { isAdmin, myClass } = result;
                const classDetails = myClass;

                classCode = classDetails.class_id;

                checkExist = () => {
                    if (myClass.section !== undefined || myClass.tutorial_group !== undefined) {
                        return `<div class="class-section text-truncate">${myClass.section}</div>
                        <div class="class-group">Group ${myClass.tutorial_group}</div>`
                    } else {
                        return ""
                    }

                }

                if (myClass.isAdmin === true) {
                    document.querySelector('.class-card__wrap').classList.add('class-card__wrap--admin')
                } else {
                    document.querySelector('.class-card__wrap').classList.add('class-card__wrap--member')
                }



                `
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
                </div>`

                let html1 = `<div class="d-flex flex-column justify-content-between h-100">
                                <div class="body mb-3 mr-3 flex-grow-1">
                                    <div class="class-name ellipsis" style="font-size:1.25rem">${classDetails.name}<span
                                                id="classCode"> (Class code: <strong>${classCode}</strong>)</span>
                                    </div>
                                    <div class="class-batch d-flex text-truncate">
                                     ${checkExist()}
                                    </div>
                                </div>
                                <div class="footer">
                                    <div class="class-creator">${classDetails.admins[0].name}</div>
                                </div>
                            </div>`

                document.querySelector(".class-card").insertAdjacentHTML('afterbegin', html1)
                    // document.querySelector("#className").textContent = classDetails.name;
                    // document.querySelector("#section").textContent = classDetails.section;
                    // document.querySelector("#group").textContent = classDetails.group;
                    // document.querySelector("#admin").textContent = classDetails.admins[0].name;
                    // document.querySelector("#classCode").textContent = classDetails.class_id;

                let html = "";

                if (isAdmin) {
                    classDetails.members.forEach((member) => {
                        html += `<div class="col-md-8 member-card__wrap">
                                <div class="d-flex align-items-center border-bottom">
                                    <div class="flex-grow-1 mr-2">${member.name}</div>
                                    <div class="btn-remove" id="removeBtn" data-id="${member._id}">&times;</div>
                                </div>
                            </div>`
                        document.querySelector('.member-list').innerHTML = html;
                    })

                    document.querySelector("#dropdownMenu").innerHTML = `
                    <div class="dropdown-item delete-class-item">Delete Class</div>`

                    document.querySelector(".delete-class-item").addEventListener('click', () => {
                        $('#deleteClassModal').modal('show');
                    })

                    document.querySelector("#deleteClassbtn").addEventListener('click', () => {
                        fetch(`/api/classes/${classId}`, {
                                method: 'DELETE',
                                headers: {
                                    'authorization': `Bearer ${token}`
                                },
                            })
                            .then(res => res.json())
                            .then(res => {
                                console.log(res)
                                if (res.isDeleted) {
                                    $('#deleteClassModal').modal('hide')
                                    window.location.href = "/classes";
                                }
                            })
                            .catch(err => console.log(err));
                    })

                } else {
                    classDetails.members.forEach((member) => {
                        html += `<div class="col-md-8 member-card__wrap">
                                <div class="d-flex align-items-center border-bottom">
                                    <div class="flex-grow-1 mr-2 my-2">${member.name}</div>
                                </div>
                            </div>`
                        document.querySelector('.member-list').innerHTML = html;
                    })

                    document.querySelector("#dropdownMenu").innerHTML = `
                    <div class="dropdown-item exit-class-item">Exit Class</div>`

                    document.querySelector(".exit-class-item").addEventListener('click', () => {
                        $('#exitClassModal').modal('show');
                    })

                    document.querySelector("#exitBtn").addEventListener('click', () => {
                        fetch(`/api/members/`, {
                                method: 'DELETE',
                                headers: {
                                    'authorization': `Bearer ${token}`,
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify({ class_id: classCode })
                            })
                            .then(res => res.json())
                            .then(res => {
                                console.log(res)
                                if (res.isUpdated) {
                                    $('#exitClassModal').modal('hide')
                                    window.location.href = "/classes";
                                }
                            })
                            .catch(err => console.log(err));
                    })
                }

                // remove icon button
                document.querySelectorAll(".btn-remove").forEach((btn) => {
                    btn.addEventListener("click", (e) => {
                        memberId = e.target.getAttribute("data-id");
                        $('#deleteModal').modal('show');
                    })
                });

                // remove button
                document.querySelector("#deleteBtn").addEventListener("click", (e) => {

                    fetch(`/api/members/remove/${memberId}`, {
                            method: 'DELETE',
                            headers: {
                                'authorization': `Bearer ${token}`,
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({ class_id: classCode })
                        })
                        .then(res => res.json())
                        .then(res => {
                            console.log(res)
                            if (res.isUpdated) {
                                $('#deleteModal').modal('hide')
                                window.location.reload();
                            }
                        })
                        .catch(err => console.log(err));
                });


            })
            .catch(err => console.log(err))
    }

    getClassDetails();





}