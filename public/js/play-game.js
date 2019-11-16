window.onload = () => {
    const token = JSON.parse(localStorage.getItem("auth_token"));

    const passToken = (token) => {
        if (token) {
            return { query: `auth_token=${token}` }
        }
    }

    const socket = io.connect('http://localhost:3000', passToken(token));

    // connection failed
    socket.on('error', (err) => {
        throw new Error(err.message);
    });

    // connection successful
    socket.on('socket-conn', (data) => {
        console.log(`[socket-conn] ${data.message}`);
        console.log(`[socket-conn] hasToken: ${data.hasToken}`);
    })

    document.querySelector("#joinGameForm").addEventListener("submit", function(e) {
        e.preventDefault();
        const name = document.querySelector("#name").value
        const gameId = document.querySelector("#gameId").value

        socket.emit('join-game', { name, gameId }, (data) => {
            const { error, message, isJoined, joinGameData } = data

            if (isJoined === true) {
                console.log(`[join-game] ${message}`);
                console.log(`[join-game]`);
                console.log(joinGameData);

                // change to next page
                document.querySelector("#joinGame").classList.add("hidden");
                document.querySelector("#playGame").classList.remove("hidden");

                if (joinGameData.gameLive === true) {
                    document.querySelector("#waitingNext").classList.remove("hidden");
                } else if (joinGameData.gameLive === false) {
                    document.querySelector("#waitingStart").classList.remove("hidden");
                }

                document.querySelector("#playerName").textContent = name;

            } else if (isJoined === false) {
                console.log(`[join-game] ${message}`);
                console.log(`[join-game] ${error}`);
            }
        })
    })

    socket.on('player-next-question', (data) => {
        // reset to false
        result = false;

        socket.emit('receive-question');

        const { questionIndex, questionLength, choicesId } = data

        if (questionIndex > 1) {
            document.querySelector("#waitingStart").classList.add("hidden");
        } else {
            document.querySelector("#waitingNext").classList.add("hidden");
        }

        document.querySelector("#choices").classList.remove("hidden");

        document.querySelector(".choice").disabled = false;

        document.querySelector("#questionIndex").textContent = questionIndex;
        document.querySelector("#totalQuestion").textContent = questionLength;

        const choices = document.querySelectorAll(".choice")

        Array.prototype.forEach.call(choices, (choice, index) => {
            choice.setAttribute("data-id", choicesId[index])
        });

        console.log(`[next] next question`);
    });









    socket.on('hoster-disconnect', () => {
        window.location.reload();
    });

    const exitBtns = document.querySelectorAll(".exit")

    Array.prototype.forEach.call(exitBtns, (exitBtn, index) => {
        exitBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to leave?")) {
                window.location.replace("http://localhost:3000");
            }
        })
    })
}