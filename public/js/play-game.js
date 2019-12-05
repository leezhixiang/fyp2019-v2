window.onload = () => {


    const token = JSON.parse(localStorage.getItem('auth_token'));

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
                document.querySelector("#joinGame").classList.add("d-none");
                document.querySelector("#playGame").classList.remove("d-none");

                if (joinGameData.gameLive === true) {
                    document.querySelector("#waitingNext").classList.remove("d-none");
                } else if (joinGameData.gameLive === false) {
                    document.querySelector("#waitingStart").classList.remove("d-none");
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

        const { questionIndex, questionLength, choiceIds } = data

        if (questionIndex > 1) {
            // player who joined after game starts
            document.querySelector("#waitingNext").classList.add("d-none");
        } else {
            // player who joined before game starts
            document.querySelector("#waitingStart").classList.add("d-none");
        }

        if (lastResult === true) {
            document.querySelector('#correctResults').innerHTML = "";
            // player who answered correct
            document.querySelector("#correct").classList.add("d-none");
        } else if (lastResult === false) {
            document.querySelector('#wrongResults').innerHTML = "";
            // player who answered wrong
            document.querySelector("#wrong").classList.add("d-none");
        } else {
            document.querySelector('#correctResults').innerHTML = "";
            document.querySelector('#wrongResults').innerHTML = "";
            // player who did not attempt
            document.querySelector("#wrong").classList.add("d-none");
        }
        document.querySelector("#choices").classList.remove("d-none");

        document.querySelectorAll(".choice").forEach((choice) => {
            choice.disabled = false
        })

        document.querySelector("#questionIndex").textContent = questionIndex;
        document.querySelector("#totalQuestion").textContent = questionLength;

        document.querySelectorAll(".choice").forEach((choice, index) => {
            choice.setAttribute("data-id", choiceIds[index])
        })

        console.log(`[received] received question`);
    });

    document.querySelectorAll(".btn-choice").forEach((choice, index) => {
        choice.addEventListener("click", () => {

            document.querySelector("#choices").classList.add("d-none");
            document.querySelector("#waitingOthers").classList.remove("d-none");

            choice.firstElementChild.disabled = true;

            const choiceId = choice.firstElementChild.getAttribute("data-id");

            // send answer to server
            socket.emit('player-answer', choiceId)
        })
    })

    socket.on('get-question-results', () => {
        console.log('1')
        socket.emit('question-results', (data) => {
            console.log('2')
                // get results from server, either true or false
            const { answerResult, didAnswer, isLostStreak, streak, bonus, currentPoints, points, rank, previousScorerName, differencePts } = data;
            console.table(data);

            if (answerResult === true && didAnswer === true) {
                document.querySelector("#waitingOthers").classList.add("d-none");
                document.querySelector("#correct").classList.remove("d-none");

                document.querySelector("#totalPts").textContent = points;

                let html = "";

                if (streak === 0) {

                    html = `<div class="mt-2 px-4 py-2" style="background-color: white; color:#212529">
                                <h5 class="m-0 text-center" id="currentPts">+${currentPoints}</h5>
                            </div>

                            <h5 class="mt-3 text-center">You're in rank <span id="rank">${rank}</span></h5>`

                    if (rank > 1) {
                        html += `<h5 class="text-center">
                                    <span id="dPts">${differencePts}</span> points behind
                                    <span id="behindName">${previousScorerName}</span>
                                </h5>`
                    }

                    document.querySelector('#correctResults').innerHTML = html;

                } else if (streak === 1) {

                    html = `<h5 class="mt-4 text-center">Answer Streak
                                <strong><span id="streak">x${streak}</span></strong>
                            </h5>

                            <div class="mt-2 px-4 py-2" style="background-color: white; color:#212529">
                                <h5 class="m-0 text-center" id="currentPts">+${currentPoints}</h5>
                            </div>

                            <h5 class="mt-3 text-center">You're in rank <span id="rank">${rank}</span></h5>`

                    if (rank > 1) {
                        html += `<h5 class="text-center">
                                    <span id="dPts">${differencePts}</span> points behind
                                    <span id="behindName">${previousScorerName}</span>
                                </h5>`
                    }

                    document.querySelector('#correctResults').innerHTML = html;

                } else if (streak > 1) {

                    html = `<h5 class="mt-4 text-center">Answer Streak
                                <strong><span id="streak">x${streak}</span></strong>
                            </h5>

                            <p class="text-center"><strong><span id="bonus">+${bonus}</span></strong> Bonus points
                            </p>

                            <div class="mt-2 px-4 py-2" style="background-color: white; color:#212529">
                                <h5 class="m-0 text-center" id="currentPts">+${currentPoints}</h5>
                            </div>

                            <h5 class="mt-3 text-center">You're in rank <span id="rank">${rank}</span></h5>`

                    if (rank > 1) {
                        html += `<h5 class="text-center">
                                    <span id="dPts">${differencePts}</span> points behind
                                    <span id="behindName">${previousScorerName}</span>
                                </h5>`
                    }

                    document.querySelector('#correctResults').innerHTML = html;
                }

            } else if (answerResult === false && didAnswer === true) {
                document.querySelector("#waitingOthers").classList.add("d-none");
                document.querySelector("#wrong").classList.remove("d-none");


                if (isLostStreak === false) {

                    html = `<div class="mt-2 px-4 py-2" style="background-color: white; color:#212529">
                                <h5 class="m-0 text-center" id="currentPts">Don't worry, nobody's perfect</h5>
                            </div>                        
                            <h5 class="mt-3 text-center">You're in rank <span id="rank">${rank}</span></h5>`

                    if (rank > 1) {
                        html += `<h5 class="text-center">
                                    <span id="dPts">${differencePts}</span> points behind
                                    <span id="behindName">${previousScorerName}</span>
                                </h5>`
                    }

                    document.querySelector('#wrongResults').innerHTML = html;

                } else if (isLostStreak === true) {

                    html = `<h5 class="mt-4 text-center">Answer Streak Lost</h5>                          
                            <div class="mt-2 px-4 py-2" style="background-color: white; color:#212529">
                                <h5 class="m-0 text-center" id="currentPts">Don't worry, nobody's perfect</h5>
                            </div>                        
                            <h5 class="mt-3 text-center">You're in rank <span id="rank">${rank}</span></h5>`

                    if (rank > 1) {
                        html += `<h5 class="text-center">
                                    <span id="dPts">${differencePts}</span> points behind
                                    <span id="behindName">${previousScorerName}</span>
                                </h5>`
                    }

                    document.querySelector('#wrongResults').innerHTML = html;
                }

            } else if (didAnswer === false) {

                html = `<div class="mt-2 px-4 py-2" style="background-color: white; color:#212529">
                                <h5 class="m-0 text-center" id="currentPts">Don't worry, nobody's perfect</h5>
                            </div>                        
                            <h5 class="mt-3 text-center">You're in rank <span id="rank">${rank}</span></h5>`

                if (rank > 1) {
                    html += `<h5 class="text-center">
                                    <span id="dPts">${differencePts}</span> points behind
                                    <span id="behindName">${previousScorerName}</span>
                                </h5>`
                }

                document.querySelector('#wrongResults').innerHTML = html;

                // player who did not attempt
                document.querySelector("#choices").classList.add("d-none");
                document.querySelector("#wrong").classList.remove("d-none");
            };
            // save for next question reference
            lastResult = answerResult;
        });
    })

    socket.on('player-game-over', () => {
        socket.emit('get-overall-results', function(data) {
            const { points, rank, correct, incorrect, unattempted } = data

            document.querySelector("#playGame").remove();
            document.querySelector("#gameOver").classList.remove("d-none");

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