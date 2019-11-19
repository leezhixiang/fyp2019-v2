window.onload = () => {
    const token = JSON.parse(localStorage.getItem('auth_token'));
    if (token) {
        document.querySelector('#guest-nav').classList.add("hidden");
    } else {
        document.querySelector('#user-nav').classList.add("hidden");
    }

    document.querySelector("#logout").addEventListener("click", function(e) {
        localStorage.removeItem('auth_token');
        window.location.href = "http://localhost:3000/";
    })

    fetch(`http://localhost:3000/api/quizzes`)
        .then(function(res) {
            return res.json()
        })
        .then(function(quizzes) {
            let html = "";
            console.log(quizzes);

            quizzes.forEach(quiz => {
                html += `<div class="quiz-card">
                            <a href="/quizzes/${quiz._id}">
                                <div>
                                    <p><span>${quiz.questions.length}</span> Question</span></p> 
                                    <p>${quiz.title}</p>
                                    <p><span>${quiz.creator.name}</span> • <span>${quiz.plays}</span> plays</p>
                                </div>
                            </a>
                        </div>`
            })

            document.querySelector('#quizList').innerHTML = html;
        })
        .catch(function(err) {
            console.log(err)
        })
}