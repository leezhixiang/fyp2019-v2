window.onload = () => {
  const token = JSON.parse(localStorage.getItem("auth_token"));

  let quiz = {};
  document.querySelector("#saveBtn").addEventListener("click", () => {
    quiz.title = document.querySelector("#quizTitle").value;

    quiz.questions = [];

    const questions = document.querySelectorAll(".question__wrap");
    console.log(questions);

    questions.forEach((ques, index) => {
      let insert = {};

      insert.question = document.querySelector(
        `#question${index + 1} .question-title`
      ).value;

      insert.choices = [];

      let choice1 = {};
      choice1.choice = document.querySelector(
        `#question${index + 1} .opt1 .answerOpt`
      ).value;
      choice1.is_correct = document.querySelector(
        `#question${index + 1} .opt1 .answer`
      ).checked;

      let choice2 = {};
      choice2.choice = document.querySelector(
        `#question${index + 1} .opt2 .answerOpt`
      ).value;
      choice2.is_correct = document.querySelector(
        `#question${index + 1} .opt2 .answer`
      ).checked;

      let choice3 = {};
      choice3.choice = document.querySelector(
        `#question${index + 1} .opt3 .answerOpt`
      ).value;
      choice3.is_correct = document.querySelector(
        `#question${index + 1} .opt3 .answer`
      ).checked;

      let choice4 = {};
      choice4.choice = document.querySelector(
        `#question${index + 1} .opt4 .answerOpt`
      ).value;
      choice4.is_correct = document.querySelector(
        `#question${index + 1} .opt4 .answer`
      ).checked;

      insert.choices.push(choice1);
      insert.choices.push(choice2);
      insert.choices.push(choice3);
      insert.choices.push(choice4);

      const t = document.querySelector(`#question${index + 1} .timer`);
      insert.timer = parseInt(t.options[t.selectedIndex].value.split(" ")[0]);

      quiz.questions.push(insert);
    });

    console.log(quiz.questions);
  });

  document.querySelector("#cancelBtn").addEventListener("click", () => {
    console.log("hi");
  });

  document.querySelector("#addBtn").addEventListener("click", () => {
    const totalQuestion = document.querySelectorAll(".question__wrap").length;
    console.log(totalQuestion);

    let html = `<div class="card question__wrap mb-4" id="question${totalQuestion +
      1}">
                    <h5 class="card-header" style="background-color:#6769f0; color:white">Question ${totalQuestion +
                      1}</h5>
                    <div class="card-body">
                        <div>
                            <input type="text" class="form-control form-control-lg question-title" id="quizTitle"
                                placeholder="Write your question">
                        </div>
                        <div class="row mt-3">
                            <div class="col-md-6 mb-2">
                                <div class="d-flex align-items-center opt1">
                                    <div class="flex-grow-1 mr-2">
                                        <input type="text" class="form-control answerOpt" placeholder="Answer option 1">
                                    </div>
                                    <div>
                                        <input type="checkbox" class="opt1 answer" name="">
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6 mb-2">
                                <div class="d-flex align-items-center opt2">
                                    <div class="flex-grow-1 mr-2">
                                        <input type="text" class="form-control answerOpt" placeholder="Answer option 2">
                                    </div>
                                    <div>
                                        <input type="checkbox" class="opt3 answer" name="opt2">
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6 mb-2">
                                <div class="d-flex align-items-center opt3">
                                    <div class="flex-grow-1 mr-2">
                                        <input type="text" class="form-control answerOpt" placeholder="Answer option 3">
                                    </div>
                                    <div>
                                        <input type="checkbox" class="opt4 answer" name="opt3">
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6 mb-2">
                                <div class="d-flex align-items-center opt4">
                                    <div class="flex-grow-1 mr-2">
                                        <input type="text" class="form-control answerOpt" placeholder="Answer option 4">
                                    </div>
                                    <div>
                                        <input type="checkbox" class="opt4 answer" name="opt4">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="border-top">
                        <div class="mx-3 mt-3" style="width: 140px;">
                            <div class="form-group">
                                <select class="form-control form-control-sm timer">
                                    <option>5 Seconds</option>
                                    <option selected="selected">10 Seconds</option>
                                    <option>20 Seconds</option>
                                    <option>30 Seconds</option>
                                    <option>40 Seconds</option>
                                    <option>50 Seconds</option>
                                    <option>60 Seconds</option>
                                </select>
                            </div>
                        </div>
                    </div>

                </div>`;
    document
      .querySelector(".questions-list__wrap")
      .insertAdjacentHTML("beforeend", html);
  });
};
