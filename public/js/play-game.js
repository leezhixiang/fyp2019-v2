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

    let result = false;

    socket.on('player-next-question', (data) => {

        socket.emit('receive-question');

        const { questionIndex, questionLength, choicesId } = data

        if (questionIndex > 1) {
            document.querySelector("#waitingNext").classList.add("hidden");
        } else {
            document.querySelector("#waitingStart").classList.add("hidden");
        }

        if (result === true) {
            document.querySelector("#correct").classList.add("hidden");
        } else if (result === false) {
            document.querySelector("#wrong").classList.add("hidden");
        } else {
            document.querySelector("#wrong").classList.add("hidden");
        }

        document.querySelector("#choices").classList.remove("hidden");

        // reset to false
        result = 0;

        document.querySelectorAll(".choice").forEach((choice) => {
            choice.disabled = false
        })

        document.querySelector("#questionIndex").textContent = questionIndex;
        document.querySelector("#totalQuestion").textContent = questionLength;

        document.querySelectorAll(".choice").forEach((choice, index) => {
            choice.setAttribute("data-id", choicesId[index])
        })

        console.log(`[next] next question`);
    });

    document.querySelectorAll(".choice").forEach((choice, index) => {
        choice.addEventListener("click", () => {

            document.querySelector("#choices").classList.add("hidden");
            document.querySelector("#waitingOthers").classList.remove("hidden");

            choice.disabled = true;

            const choiceId = choice.getAttribute("data-id");

            socket.emit('player-answer', choiceId, (data) => {
                // get results from server, either true or false
                result = data
                console.log(`[player-answer] answer is ${result}`)
            })
        })
    })

    socket.on('open-results', () => {
        if (result === true) {
            document.querySelector("#waitingOthers").classList.add("hidden");
            document.querySelector("#correct").classList.remove("hidden");

        } else if (result === false) {
            document.querySelector("#waitingOthers").classList.add("hidden");
            document.querySelector("#wrong").classList.remove("hidden");
        } else {
            document.querySelector("#choices").classList.add("hidden");
            document.querySelector("#wrong").classList.remove("hidden");
        }
    })

    socket.on('player-game-over', () => {

        document.querySelector("#playGame").remove();
        document.querySelector("#gameOver").classList.remove("hidden");

        console.log(`[next] game over`);
    })

    socket.on('hoster-disconnect', () => {
        window.location.reload();
    });

    document.querySelectorAll(".exit").forEach((exitBtn, index) => {
        exitBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to leave?")) {
                window.location.replace("http://localhost:3000");
            }
        })
    })
}