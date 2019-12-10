window.onload = () => {
  let questions;

  document.body.style.width = "8.27in";
  document.body.style.margin = "auto";

  document.body.style.background = "#6c757d";

  document.querySelector("#printBtn").addEventListener("click", () => {
    window.print();
  });

  $("#fontSizeInput").bind("keyup mouseup", () => {
    const checkedValue = document.querySelector("#fontSizeInput").value;
    console.log(checkedValue);
    document.querySelector(
      ".content-body"
    ).style.fontSize = `${checkedValue}px`;
  });

  document
    .querySelector("#shuffleQuestionsCheckbox")
    .addEventListener("click", () => {
      const checkedValue = document.querySelector("#shuffleQuestionsCheckbox")
        .checked;

      questions = shuffle(questions);
      displayQuestions(questions);
    });

  document
    .querySelector("#shuffleAnswersCheckbox")
    .addEventListener("click", () => {
      const checkedValue = document.querySelector("#shuffleAnswersCheckbox")
        .checked;

      console.log(questions);

      questions.forEach(question => {
        question.choices = shuffle(question.choices);
      });
      displayQuestions(questions);
    });

  document
    .querySelector("#checkBoxesCheckbox")
    .addEventListener("click", () => {
      const checkedValue = document.querySelector("#checkBoxesCheckbox")
        .checked;
      if (checkedValue === true) {
        document.querySelectorAll(".checkbox").forEach(checkbox => {
          checkbox.classList.add("d-none");
        });
      } else {
        document.querySelectorAll(".checkbox").forEach(checkbox => {
          checkbox.classList.remove("d-none");
        });
      }
    });

  document.querySelector("#answerKeyCheckbox").addEventListener("click", () => {
    const checkedValue = document.querySelector("#answerKeyCheckbox").checked;
  });

  document
    .querySelector("#showAnsOptsCheckbox")
    .addEventListener("click", () => {
      const checkedValue = document.querySelector("#showAnsOptsCheckbox")
        .checked;

      if (checkedValue === true) {
        document.querySelectorAll(".answer").forEach(answer => {
          answer.classList.add("d-none");
        });
        document.querySelectorAll(".breakline").forEach(line => {
          line.classList.remove("d-none");
        });
      } else {
        document.querySelectorAll(".answer").forEach(answer => {
          answer.classList.remove("d-none");
        });
        document.querySelectorAll(".breakline").forEach(line => {
          line.classList.add("d-none");
        });
      }
    });

  // quiz details
  const pathName = window.location.pathname.split("/");
  const quizId = pathName[3];

  console.log(quizId);

  fetch(`http://localhost:3000/api/quizzes/${quizId}`)
    .then(res => res.json())
    .then(res => {
      quiz = res.quiz;
      questions = res.quiz.questions;

      document.querySelector("#quizName").textContent = quiz.title;
      document.querySelector(
        "#totalQuestion"
      ).textContent = `${quiz.questions.length} Questions`;

      displayQuestions(questions);
    })
    .catch(err => console.log(err));

  displayQuestions = questions => {
    let html = "";

    questions.forEach((question, index) => {
      html += `<div class="question__wrap mb-3">
                        <div class="question row">
                            <div class="col">
                                <div class="d-flex">
                                    <div class="index mr-3">${index + 1}.</div>
                                    <div>${question.question}</div>
                                </div>
                            </div>
                        </div>
                        <hr class="breakline d-none">
                        <div class="answer row mt-2">
                            <div class="col-6 mb-2">
                                <div class="d-flex align-items-center">
                                    <div class="checkbox border mr-3"></div>
                                    <div class="answer-options">
                                        ${question.choices[0].choice}
                                    </div>
                                </div>
                            </div>
                            <div class="col-6 mb-2">
                                <div class="d-flex align-items-center">
                                    <div class="checkbox border mr-3"></div>
                                    <div class="answer-options">
                                        ${question.choices[1].choice}
                                    </div>
                                </div>
                            </div>
                            <div class="col-6 mb-2">
                                <div class="d-flex align-items-center">
                                    <div class="checkbox border mr-3"></div>
                                    <div class="answer-options">
                                        ${question.choices[2].choice}
                                    </div>
                                </div>
                            </div>
                            <div class="col-6 mb-2">
                                <div class="d-flex align-items-center">
                                    <div class="checkbox border mr-3"></div>
                                    <div class="answer-options">
                                        ${question.choices[3].choice}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>`;
    });
    document.querySelector(".content-body").innerHTML = html;

    let answerKeys = [];
    questions.forEach(question => {
      let keys = [];
      question.choices.forEach((choice, index) => {
        if (choice.is_correct === true) {
          switch (index) {
            case 0:
              keys.push("a");
              break;
            case 1:
              keys.push("b");
              break;
            case 2:
              keys.push("c");
              break;
            case 3:
              keys.push("d");
              break;
          }
        }
      });
      answerKeys.push(keys.join(", "));
    });

    let html2 = "";
    answerKeys.forEach((keys, index) => {
      html2 += `<div class="col-3 mb-2">
                        <div class="key ml-3">${index + 1}. ${keys}</div>
                    </div>`;
      document.querySelector(".answer-key").innerHTML = html2;
    });
  };

  function shuffle(array) {
    let counter = array.length;

    // While there are elements in the array
    while (counter > 0) {
      // Pick a random index
      let index = Math.floor(Math.random() * counter);

      // Decrease counter by 1
      counter--;

      // And swap the last element with it
      let temp = array[counter];
      array[counter] = array[index];
      array[index] = temp;
    }

    return array;
  }

  // function shuffle(array) {
  //     var currentIndex = array.length,
  //         temporaryValue, randomIndex;

  //     // While there remain elements to shuffle...
  //     while (0 !== currentIndex) {

  //         // Pick a remaining element...
  //         randomIndex = Math.floor(Math.random() * currentIndex);
  //         currentIndex -= 1;

  //         // And swap it with the current element.
  //         temporaryValue = array[currentIndex];
  //         array[currentIndex] = array[randomIndex];
  //         array[randomIndex] = temporaryValue;
  //     }

  //     return array;
  // }
};
