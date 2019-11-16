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
        console.log(`[socket-conn] hasToken: ${data.hasToken}`);
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

                document.querySelector('#nextBtn').setAttribute('data-state', false)

                console.log(`[next] next question`);
            }
        })
    })

    document.querySelector("#nextBtn").addEventListener("click", function() {
        const btnState = ((document.querySelector('#nextBtn').getAttribute("data-state")) == 'true')

        socket.emit('next-question', btnState, (data) => {
            const { nextQuestion, nextQuestionData } = data;

            if (nextQuestion === true) {
                const { question, gameId } = nextQuestionData;

                // change to next question
                document.querySelector("#statistic").classList.add("hidden");
                document.querySelector("#displayQuestion").classList.remove("hidden");

                document.querySelector("#question").textContent = question.question;

                const choices = document.querySelectorAll(".choice");

                Array.prototype.forEach.call(choices, (choice, index) => {
                    choice.textContent = question.choices[index].choice;
                    choice.setAttribute("data-correct", question.choices[index].is_correct);
                });

                document.querySelector("#gameId").textContent = gameId;

                document.querySelector('#nextBtn').setAttribute('data-state', false)

                console.log(`[next] next question`);

            } else if (nextQuestion === false) {
                document.querySelector("#displayQuestion").classList.add("hidden");
                document.querySelector("#statistic").classList.remove("hidden");

                document.querySelector('#nextBtn').setAttribute('data-state', true)

                console.log(`[next] show statistic`);

            } else {
                document.querySelector("#hostGame").remove();
                document.querySelector("#gameOver").classList.remove("hidden");

                console.log(`[next] game over`);
            }
        })
    })




















    const exitBtns = document.querySelectorAll(".exit")

    Array.prototype.forEach.call(exitBtns, (exitBtn, index) => {
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