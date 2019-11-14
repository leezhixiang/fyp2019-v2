window.onload = () => {
    document.querySelector("#userForm").addEventListener("submit", function(e) {
        e.preventDefault();
        const name = document.querySelector('#name').value
        const gameId = document.querySelector('#gameId').value
        console.log(name);
        console.log(gameId);

        // window.location.href = `/games/play-game?name=${name}&gameId=${gameId}`;

        // fetch(`http://localhost:3000/api/users/join-game`, {
        //         method: 'POST',
        //         headers: {
        //             'Content-Type': 'application/json'
        //         },
        //         body: JSON.stringify({ name, gameId })
        //     })
        //     .then(res => res.json())
        //     .then(res => {
        //         if (res.isLogged === true) {
        //             localStorage.setItem('auth_token', JSON.stringify(res.token))
        //             window.location.href = "http://localhost:3000/";
        //         } else {
        //             throw new Error(res.message)
        //         }
        //     })
        //     .catch((err) => {
        //         console.log(err);
        //     });
    })
}