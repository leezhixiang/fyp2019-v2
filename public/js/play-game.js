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
        console.log(`[socket-conn] token: ${data.hasToken}`);
    })

    document.querySelector("#joinGameForm").addEventListener("submit", function(e) {
        e.preventDefault();
        const name = document.querySelector("#name").value
        const gameId = document.querySelector("#gameId").value

        socket.emit('join-game', { name, gameId }, (data) => {
            const { error, message, isJoined, joinGameData } = data

            if (isJoined === true) {
                console.log(`[join-game] ${message}`);

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

    let lastResult;

    socket.on('player-next-question', (data) => {

        socket.emit('receive-question');

        const { questionIndex, questionLength, choicesId } = data

        if (questionIndex > 1) {
            // player who joined after game starts
            document.querySelector("#waitingNext").classList.add("hidden");
        } else {
            // player who joined before game starts
            document.querySelector("#waitingStart").classList.add("hidden");
        }

        if (lastResult === true) {
            // player who answered correct
            document.querySelector("#correct").classList.add("hidden");
        } else if (lastResult === false) {
            // player who answered wrong
            document.querySelector("#wrong").classList.add("hidden");
        } else {
            // player who did not attempt
            document.querySelector("#wrong").classList.add("hidden");
        }
        document.querySelector("#choices").classList.remove("hidden");

        document.querySelectorAll(".choice").forEach((choice) => {
            choice.disabled = false
        })

        document.querySelector("#questionIndex").textContent = questionIndex;
        document.querySelector("#totalQuestion").textContent = questionLength;

        document.querySelectorAll(".choice").forEach((choice, index) => {
            choice.setAttribute("data-id", choicesId[index])
        })

        console.log(`[received] received question`);
    });

    document.querySelectorAll(".choice").forEach((choice, index) => {
        choice.addEventListener("click", () => {

            document.querySelector("#choices").classList.add("hidden");
            document.querySelector("#waitingOthers").classList.remove("hidden");

            choice.disabled = true;

            const choiceId = choice.getAttribute("data-id");

            // send answer to server
            socket.emit('player-answer', choiceId)
        })
    })

    socket.on('get-question-results', () => {

        socket.emit('question-results', (data) => {
            // get results from server, either true or false
            const { answerResult, didAnswer, isLostStreak, streak, currentPoints, rank, nextScorer, differencePts } = data;
            console.table(data);

            if (answerResult === true && didAnswer === true) {
                document.querySelector("#waitingOthers").classList.add("hidden");
                document.querySelector("#correct").classList.remove("hidden");

            } else if (answerResult === false && didAnswer === true) {
                document.querySelector("#waitingOthers").classList.add("hidden");
                document.querySelector("#wrong").classList.remove("hidden");

            } else if (didAnswer === false) {
                // player who did not attempt
                document.querySelector("#choices").classList.add("hidden");
                document.querySelector("#wrong").classList.remove("hidden");
            };
            // save for next question reference
            lastResult = answerResult;
        });
    })

    socket.on('player-game-over', () => {
        socket.emit('get-overall-results', function(data) {
            const { points, rank, correct, incorrect, unattempted } = data

            document.querySelector("#playGame").remove();
            document.querySelector("#gameOver").classList.remove("hidden");

            console.log(`[game-over] game has over`);
            console.log(`[game-over]`);
            console.table(data);
        });
    });

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