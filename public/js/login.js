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
            window.location.href = "http://localhost:3000/reports";
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

    document.querySelector("#loginForm").addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.querySelector('#email').value
        const password = document.querySelector('#password').value

        fetch(`http://localhost:3000/api/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            })
            .then(res => res.json())
            .then(res => {
                if (res.isLogged === true) {
                    localStorage.setItem('auth_token', JSON.stringify(res.token))
                    window.location.href = "http://localhost:3000/";
                } else {
                    const html = `<div class="alert alert-warning alert-dismissible fade show" role="alert">${res.message} ${res.err}
                                    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                                        <span aria-hidden="true">&times;</span>
                                    </button>
                                </div>`
                    document.querySelector('#login-alert').innerHTML = html;
                }
            })
            .catch((err) => {
                console.log(err);
            });
    })
}