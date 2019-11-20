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

    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get("quizId");

    socket.emit('host-game', { quizId }, (data) => {
        const { error, message, isHosted, gameId } = data;

        if (isHosted === true) {
            document.querySelector("#gameId").textContent = gameId;
            console.log(`[host-game] ${message}`);

        } else if (isHosted === false) {
            console.log(`[host-game] ${message}`);
            console.log(`[host-game] ${error}`);
        }
    });

    socket.on('display-name', (names) => {
        let html = "";

        names.forEach((name) => {
            html += `<li>${name}</li>`
        })

        document.querySelector("#nameList").innerHTML = html;
        document.querySelector("#totalPlayers").textContent = names.length;
    });

    let counter = 0;
    let interval = 0;

    document.querySelector("#startBtn").addEventListener("click", () => {
        const btnState = true;

        socket.emit('next-question', btnState, (data) => {
            const { nextQuestion, nextQuestionData } = data;

            if (nextQuestion === true) {
                const { question, gameId } = nextQuestionData;

                // change to next question
                document.querySelector("#lobby").remove();
                document.querySelector("#hostGame").classList.remove("hidden");

                document.querySelector("#question").textContent = question.question;

                const choices = document.querySelectorAll(".choice");

                Array.prototype.forEach.call(choices, (choice, index) => {
                    choice.textContent = question.choices[index].choice;
                    choice.setAttribute("data-correct", question.choices[index].is_correct);
                });

                document.querySelector("#gameId").textContent = gameId;

                displayTimer(question.timer, counter, interval);

                document.querySelector('#nextBtn').setAttribute('data-state', false)

                console.log(`[start-button] next question`);
            }
        })
    })

    document.querySelector("#nextBtn").addEventListener("click", function() {
        const btnState = ((document.querySelector('#nextBtn').getAttribute("data-state")) == 'true')

        socket.emit('next-question', btnState, (data) => {
            const { nextQuestion, isGameOver, nextQuestionData } = data;

            if (nextQuestion === true && isGameOver === false) {
                const { question, gameId } = nextQuestionData;

                // change to next question
                document.querySelector("#summary").classList.add("hidden");
                document.querySelector("#displayQuestion").classList.remove("hidden");

                document.querySelector("#question").textContent = question.question;

                document.querySelectorAll(".choice").forEach((choice, index) => {
                    choice.textContent = question.choices[index].choice;
                    choice.setAttribute("data-correct", question.choices[index].is_correct);
                });

                document.querySelector("#gameId").textContent = gameId;

                displayTimer(question.timer, counter, interval);

                document.querySelector('#nextBtn').setAttribute('data-state', false)

                console.log(`[next-button] next question`);

            } else if (nextQuestion === false && isGameOver === false) {
                const { summary } = nextQuestionData;

                document.querySelector("#displayQuestion").classList.add("hidden");
                document.querySelector("#summary").classList.remove("hidden");

                document.querySelectorAll(".total-chooses").forEach((totalChooses, index) => {
                    totalChooses.textContent = summary[Object.keys(summary)[index]];
                })

                document.querySelector('#nextBtn').setAttribute('data-state', true)

                console.log(`[next-button] show summary`);

            } else if (nextQuestion === false && isGameOver === true) {
                const { scoreBoard } = nextQuestionData;

                document.querySelector("#hostGame").remove();
                document.querySelector("#gameOver").classList.remove("hidden");

                console.log(`[next-button] game over`);
                console.log(`[next]`);
                console.table(scoreBoard);
            }
        })
    })

    socket.on('display-summary', function() {
        document.querySelector("#nextBtn").click()
    })

    displayTimer = (timer, counter, interval) => {
        convertSeconds = (s) => {
            const min = Math.floor(s / 60);
            const sec = s % 60;
            return ("00" + min).substr(-2) + ': ' + ("00" + sec).substr(-2);
        }

        timeIt = () => {
            counter++;
            socket.emit('time-left', (timer - counter));
            document.querySelector('#timer').textContent = convertSeconds((timer - counter));

            if (counter == timer) {
                clearInterval(interval);
                counter = 0;
                document.querySelector("#nextBtn").click();
            }
        }

        // initiation timer
        socket.emit('time-left', timer);
        document.querySelector('#timer').textContent = convertSeconds((timer - counter));

        interval = setInterval(timeIt, 1000);

        document.querySelector("#nextBtn").addEventListener("click", () => {
            clearInterval(interval);
            counter = 0;
            document.querySelector('#timer').textContent = convertSeconds((timer - timer));
        })
    }

    document.querySelectorAll(".exit").forEach((exitBtn, index) => {
        exitBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to leave?")) {
                window.location.replace("http://localhost:3000");
            }
        })
    })
}













// socket.emit('next-question', btnState, (data) => {
//     const { nextQuestion, nextQuestionData } = data;

//     if (nextQuestion === true) {
//         // change to next question
//         document.querySelector('#lobby').classList.add("hidden");
//         document.querySelector('#hostGame').classList.remove("hidden");

//     } else if (nextQuestion === false) {
//         // change to statistic
//         document.querySelector('#lobby').classList.add("hidden");
//         document.querySelector('#hostGame').classList.remove("hidden");

//     } else {
//         // change to game over
//         document.querySelector('#lobby').classList.add("hidden");
//         document.querySelector('#hostGame').classList.remove("hidden");
//     }
// })