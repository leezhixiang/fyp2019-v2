window.onload = () => {
    const token = JSON.parse(localStorage.getItem('auth_token'));
    if (token) {
        document.querySelector('#guest-nav').classList.add("hidden");
    } else {
        document.querySelector('#user-nav').classList.add("hidden");
    }

    document.querySelector("#logout").addEventListener("click", (e) => {
        localStorage.removeItem('auth_token');
        window.location.href = "http://localhost:3000/";
    })

    const pathName = window.location.pathname.split('/');
    const quizId = pathName[2];

    fetch(`http://localhost:3000/api/quizzes/${quizId}`)
        .then((res) => {
            return res.json()
        })
        .then((quiz) => {
            console.log(quiz)

            let html = "";

            html = `<div>
                        <p><span>${quiz.questions.length}</span> Question</span></p> 
                        <p>${quiz.title}</p>
                        <p><span>${quiz.creator.name}</span> • <span>${quiz.plays}</span> plays</p>
                    </div>
                    <div> 
                        <button onclick="window.location.href='http://localhost:3000/games/host-game?quizId=${quizId}'">Multiple Choice</button>
                    <div class="icon">
                    	<i class="fa fa-star-o" id="favBtn"></i>
                    </div>
                    <div class="icon">
                        <i class="fa fa-share" id="shareBtn"></i>
                    </div>
                    </div>
                    <p>Sample Questions</p>`

            quiz.questions.forEach((question, index) => {
                html += `<div>
                            <div>
                                <p>Q${index +1}. ${question.question}</p>
                            </div>
                            <ul>
                                <li>${question.choices[0].choice}</li>
                                <li>${question.choices[1].choice}</li>
                                <li>${question.choices[2].choice}</li>
                                <li>${question.choices[3].choice}</li>
                            </ul>
                        </div>`
            })

            document.querySelector('#quizDetails').innerHTML = html;

            document.querySelector("#favBtn").addEventListener("click", () => {
                if (document.querySelector("#favBtn").classList.contains("fa-star")) {
                    setTimeout(() => {
                        document.querySelector("#favBtn").classList.remove("active");
                        document.querySelector("#favBtn").classList.remove('fa-star')
                        document.querySelector("#favBtn").classList.add('fa-star-o')
                    }, 15)
                } else {
                    setTimeout(() => {
                        document.querySelector("#favBtn").classList.add('active')
                        document.querySelector("#favBtn").classList.remove('fa-star-o')
                        document.querySelector("#favBtn").classList.add('fa-star')
                    }, 150)
                };
            });

            document.querySelector("#shareBtn").addEventListener("click", () => {

            });
        })
        .catch((err) => {
            console.log(err)
        })



}