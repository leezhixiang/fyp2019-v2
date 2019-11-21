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

    let settings = {};

    // click host game button
    document.querySelector("#hostBtn").addEventListener("click", () => {
        document.querySelectorAll("input[name='settings']").forEach((setting, index) => {
            switch (index) {
                case 0:
                    settings.suffleQuestions = setting.checked;
                    break;
                case 1:
                    settings.suffleAnswerOptions = setting.checked;
                    break;
                case 2:
                    settings.questionTimer = setting.checked;
                    break;
                case 3:
                    settings.autoMoveThroughQuestions = setting.checked;
                    break;
                default:
                    // code block
            };
        });

        document.querySelector("#launch").remove();
        document.querySelector("#lobby").classList.remove("hidden");

        const urlParams = new URLSearchParams(window.location.search);
        const quizId = urlParams.get("quizId");

        socket.emit('host-game', {
            quizId,
            suffleQuestions: settings.suffleQuestions,
            suffleAnswerOptions: settings.suffleAnswerOptions
        }, (data) => {
            const { error, message, isHosted, gameId } = data;

            if (isHosted === true) {
                document.querySelector("#gameId").textContent = gameId;
                console.log(`[host-game] ${message}`);

            } else if (isHosted === false) {
                console.log(`[host-game] ${message}`);
                console.log(`[host-game] ${error}`);
            };
        });
    });

    let autoStartTimer = 0;

    socket.on('display-name', (names) => {
        // setting: auto move through questions
        if (settings.autoMoveThroughQuestions === true) {
            // countdown timer
            clearTimeout(autoStartTimer);
            autoStartTimer = setTimeout(() => {
                document.querySelector("#startBtn").click();
            }, 15000);
        };

        let html = "";
        names.forEach((name) => {
            html += `<li>${name}</li>`;
        });
        document.querySelector("#nameList").innerHTML = html;
        document.querySelector("#totalPlayers").textContent = names.length;
    });

    let counter = 0;
    let questionTimer = 0;

    // start game to get 1st question
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

                // setting: question timer
                if (settings.questionTimer === true) {
                    displayTimer(question.timer, counter, questionTimer);
                };

                document.querySelector('#nextBtn').setAttribute('data-state', false)

                console.log(`[start-button] next question`);
            }
        })
    })

    // next question to get next events
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

                // setting: question timer
                if (settings.questionTimer === true) {
                    displayTimer(question.timer, counter, questionTimer);
                };

                document.querySelector('#nextBtn').setAttribute('data-state', false)

                console.log(`[next-button] next question`);

            } else if (nextQuestion === false && isGameOver === false) {
                const { questionResults, scoreBoard } = nextQuestionData;

                document.querySelector("#displayQuestion").classList.add("hidden");
                document.querySelector("#summary").classList.remove("hidden");

                document.querySelectorAll(".total-chooses").forEach((totalChooses, index) => {
                    totalChooses.textContent = questionResults[Object.keys(questionResults)[index]];
                })

                document.querySelector('#nextBtn').setAttribute('data-state', true)
                console.log(questionResults);
                console.log(scoreBoard);

                // setting: auto move through questions
                if (settings.autoMoveThroughQuestions === true) {
                    // countdown timer
                    setTimeout(() => {
                        document.querySelector("#nextBtn").click();
                    }, 5000);
                };

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

    // when all players have answered the question
    socket.on('display-summary', function() {
        document.querySelector("#nextBtn").click()
    })

    displayTimer = (timer, counter, questionTimer) => {
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
                clearInterval(questionTimer);
                counter = 0;
                document.querySelector("#nextBtn").click();
            }
        }

        // initiation timer
        socket.emit('time-left', timer);
        document.querySelector('#timer').textContent = convertSeconds((timer - counter));

        questionTimer = setInterval(timeIt, 1000);

        document.querySelector("#nextBtn").addEventListener("click", () => {
            clearInterval(questionTimer);
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