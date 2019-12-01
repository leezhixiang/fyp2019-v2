window.onload = () => {
    document.querySelector('#divider').classList.add("d-none");
    document.querySelectorAll('.guest').forEach(guest => {
        guest.classList.add("d-none");
    })
    document.querySelector('.logged').classList.add("d-none");

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