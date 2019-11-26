const token = JSON.parse(localStorage.getItem('auth_token'));
if (!token) window.location.replace("http://localhost:3000/users/login");

window.onload = () => {
    const token = JSON.parse(localStorage.getItem('auth_token'));
    if (token) {
        document.querySelector('#guest-nav').classList.add("hidden");
    } else {
        document.querySelector('#user-nav').classList.add("hidden");
    }

    document.querySelector("#logout").addEventListener("click", () => {
        localStorage.removeItem('auth_token');
        window.location.href = "http://localhost:3000/";
    })

    // get favorite quizzes
    fetch(`http://localhost:3000/api/library/favorites`, {
            headers: {
                'authorization': `Bearer ${token}`,
            }
        })
        .then((res) => {
            return res.json();
        })
        .then((favorites) => {
            console.log(favorites);
        });

    // get shared quizzes
    fetch(`http://localhost:3000/api/library/shared`, {
            headers: {
                'authorization': `Bearer ${token}`,
            }
        })
        .then((res) => {
            return res.json();
        })
        .then((shared) => {
            console.log(shared);
        });
}