window.onload = () => {
    document.querySelector('#divider').classList.add("d-none");
    document.querySelectorAll('.guest').forEach(guest => {
        guest.classList.add("d-none");
    })
    document.querySelector('.logged').classList.add("d-none");

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