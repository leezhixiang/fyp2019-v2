window.onload = () => {
    document.querySelector('#user-nav').classList.add("hidden");
    document.querySelector('#guest-nav').classList.add("hidden");

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
                    throw new Error(res.message)
                }
            })
            .catch((err) => {
                console.log(err);
            });
    })
}