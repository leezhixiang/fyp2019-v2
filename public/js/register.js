window.onload = () => {
    const token = JSON.parse(localStorage.getItem('auth_token'));
    document.querySelector('#divider').classList.add("d-none");
    document.querySelectorAll('.guest').forEach(guest => {
        guest.classList.add("d-none");
    })
    document.querySelector('.logged').classList.add("d-none");
    document.querySelector('#jewelButton').setAttribute('data-toggle', '')

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

    //notification
    document.querySelector('#jewelButton').addEventListener('click', (e) => {
        if (!token) {
            return window.location.href = "http://localhost:3000/users/login";
        }
    });

    // logout button
    document.querySelector("#logout").addEventListener("click", function(e) {
        localStorage.removeItem('auth_token');
        window.location.href = "http://localhost:3000/";
    });


    document.querySelector("#registerForm").addEventListener("submit", (e) => {
        e.preventDefault();
        const first_name = document.querySelector('#firstName').value
        const last_name = document.querySelector('#lastName').value
        const email = document.querySelector('#email').value
        const password = document.querySelector('#password').value
        const password2 = document.querySelector('#password2').value

        console.log({ first_name, last_name, email, password, password2 });

        fetch(`http://localhost:3000/api/users/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ first_name, last_name, email, password, password2 })
            })
            .then(res => res.json())
            .then(res => {
                console.log(res)
                if (res.isRegistered === true) {
                    const html = `<div class="alert alert-success alert-dismissible fade show" role="alert">${res.message} You can log in now.
                                    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                                        <span aria-hidden="true">&times;</span>
                                    </button>
                                </div>`

                    document.querySelector('#register-alert').innerHTML = html;
                } else {
                    const html = `<div class="alert alert-warning alert-dismissible fade show" role="alert">${res.message} ${res.err}
                                    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                                        <span aria-hidden="true">&times;</span>
                                    </button>
                                </div>`

                    document.querySelector('#register-alert').innerHTML = html;
                }
            })
            .catch((err) => {
                console.log(err);
            });
    })
}