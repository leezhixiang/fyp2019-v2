window.onload = () => {
  const token = JSON.parse(localStorage.getItem("auth_token"));

  // account
  if (token) {
    document.querySelectorAll(".guest").forEach(guest => {
      guest.classList.add("d-none");
    });
  } else {
    document.querySelector(".logged").classList.add("d-none");
    document.querySelector("#jewelButton").setAttribute("data-toggle", "");
  }

  // socket.io connection
  const passToken = token => {
    if (token) {
      return { query: `auth_token=${token}` };
    }
  };

  const notificationSocket = io("/notification", passToken(token));

  // connection failed
  notificationSocket.on("error", err => {
    throw new Error(err.message);
  });

  // connection successful
  notificationSocket.on("socket-conn", data => {
    console.log(`[socket-conn] ${data.message}`);
    console.log(`[socket-conn] token: ${data.hasToken}`);
  });

  // quizzes
  document.querySelector("#quizzes").addEventListener("click", e => {
    e.preventDefault();
    if (token) {
      window.location.href = "/quizzes";
    } else {
      window.location.href = "/users/login";
    }
  });

  // reports
  document.querySelector("#reports").addEventListener("click", e => {
    e.preventDefault();
    if (token) {
      window.location.href = "/reports";
    } else {
      window.location.href = "/users/login";
    }
  });

  // classes
  document.querySelector("#classes").addEventListener("click", e => {
    e.preventDefault();
    if (token) {
      window.location.href = "/classes";
    } else {
      window.location.href = "/users/login";
    }
  });

  // notification
  document.querySelector("#jewelButton").addEventListener("click", e => {
    if (!token) {
      return (window.location.href = "http://localhost:3000/users/login");
    }
  });

  notificationSocket.on("total-notifications", number => {
    if (number !== 0) {
      document.querySelector("#jewelCount").textContent = number;
      document.querySelector("#jewelCount").classList.remove("d-none");
    }
  });

  notificationSocket.on("new-notification", content => {
    console.log(content);
    document.querySelector("#jewelCount").classList.remove("d-none");

    const totalNum = document.querySelector("#jewelCount").textContent;
    document.querySelector("#jewelCount").textContent = parseInt(totalNum) + 1;

    let html = `<div class="notification-box">
                    <div class="media">
                        <img src="/img/avatar.jpg" width="46" height="46" alt="123" class="mr-3 rounded-circle">
                        <div class="media-body">
                            <div>${content.content}</div>
                            <small class="text-warning">${content.time_stamp}</small>
                        </div>
                    </div>
                </div>`;
    document
      .querySelector("#notificationsFlyout")
      .insertAdjacentHTML("afterbegin", html);
  });

  $(".dropdown").on("hidden.bs.dropdown	", () => {
    document.querySelector("#jewelCount").textContent = 0;
    document.querySelector("#jewelCount").classList.add("d-none");
  });

  $(".dropdown").on("show.bs.dropdown", () => {
    document.querySelector("#jewelCount").textContent = 0;
    document.querySelector("#jewelCount").classList.add("d-none");

    notificationSocket.emit("read-notification", notifications => {
      console.log(notifications);
      if (notifications.length === 0) {
        document.querySelector(
          "#notificationsFlyout"
        ).innerHTML = `<a class="dropdown-item" href="#">No notifications.</a>`;
      } else {
        let html = "";
        notifications.reverse().forEach(notification => {
          html += `<div class="notification-box">
                        <div class="media">
                            <img src="/img/avatar.jpg" width="46" height="46" alt="123" class="mr-3 rounded-circle">
                            <div class="media-body">
                                <div>${notification.content}</div>
                                <small class="text-warning">${notification.time_stamp}</small>
                            </div>
                        </div>
                    </div>`;
        });
        document.querySelector("#notificationsFlyout").innerHTML = html;
      }
    });
  });

  // logout button
  document.querySelector("#logout").addEventListener("click", function(e) {
    localStorage.removeItem("auth_token");
    window.location.href = "/";
  });

  const pathName = window.location.pathname.split("/");
  const hoster_reportId = pathName[3];

  fetch(`/api/reports/hoster/${hoster_reportId}`, {
    headers: {
      authorization: `Bearer ${token}`
    }
  })
    .then(res => {
      return res.json();
    })
    .then(report => {
      console.log(report);
      const { hosterReport } = report;
      document.querySelector("#reportTimeStamp").textContent =
        hosterReport.hosted_date;
      document.querySelector("#gameName").textContent = hosterReport.game_name;
      document.querySelector("#creator").textContent = hosterReport.hoster.name;
      document.querySelector(
        "#gameAccuracy"
      ).textContent = `${hosterReport.accuracy}%`;
      document.querySelector("#totalQuestions").textContent =
        hosterReport.questions.length;
      document.querySelector("#totalPlayers").textContent =
        hosterReport.player_results.length;

      hosterReport.scoreboard.forEach((scorer, index) => {
        const scorerNames = document.querySelectorAll(".scorer-name");
        const scorerPoints = document.querySelectorAll(".scorer-points");
        scorerNames[index].textContent = scorer.name;
        scorerPoints[index].textContent = scorer.points;
      });
    });

  document.querySelector("#overallTab").addEventListener("click", function(e) {
    document.querySelector("#overallTab").classList.add("active");
    document.querySelector("#playersTab").classList.remove("active");
    document.querySelector("#questionTab").classList.remove("active");

    document.querySelector("#questionReport").classList.add("d-none");
    document.querySelector("#playersReport").classList.add("d-none");
    document.querySelector("#overallReport").classList.remove("d-none");
  });

  document.querySelector("#questionTab").addEventListener("click", function(e) {
    document.querySelector("#questionTab").classList.add("active");
    document.querySelector("#playersTab").classList.remove("active");
    document.querySelector("#overallTab").classList.remove("active");

    document.querySelector("#overallReport").classList.add("d-none");
    document.querySelector("#playersReport").classList.add("d-none");
    document.querySelector("#questionReport").classList.remove("d-none");

    fetch(`/api/reports/hoster/${hoster_reportId}`, {
      headers: {
        authorization: `Bearer ${token}`
      }
    })
      .then(res => {
        return res.json();
      })
      .then(report => {
        console.log(report);
        const { questions } = report.hosterReport;
        console.log(questions);

        let html = "";

        questions.forEach((question, index) => {
          html += `<div class="col-md-8 mb-3">
                                <div class="question-list__wrap p-3">

                                    <div class="question-list__body">
                                        <div><small>Question <span id="questionIndex">${index +
                                          1}</span></small></div>
                                        <p id="questionTitle">${
                                          question.question
                                        }</p>
                                    </div>

                                    <div class="question-list__header px-3 py-2 d-flex align-items-center">
                                        <div class="header-text mr-auto my-1">Answered correctly</div>
                                        <div class="mr-2">${
                                          question.accuracy
                                        }%</div>
                                        <div class="choice-result choice-result--"></div>
                                    </div>
                                    <ul class="question-list question-list--hoster">
                                        <li class="question-item d-flex px-3 py-2 align-items-center flex-wrap">
                                            <div class="question-choice flex-grow-1 mr-2" id="choice">${
                                              question.choices[0].choice
                                            }</div>
                                            <div class="d-flex align-items-center flex-wrap my-1 ml-auto">
                                                <div class="mr-4" id="choiceAccuracy">${
                                                  question.choices[0].numPlayers
                                                } Players</div>
                                                <div class="choice-accuracy mr-1" id="choiceAccuracy">${
                                                  question.choices[0].accuracy
                                                }%</div>
                                                <div class="choice-result choice-result--${
                                                  question.choices[0].is_correct
                                                }"></div>
                                            </div>
                                        </li>
                                        <li class="question-item d-flex px-3 py-2 align-items-center flex-wrap">
                                            <div class="question-choice flex-grow-1 mr-2" id="choice">${
                                              question.choices[1].choice
                                            }</div>
                                            <div class="d-flex align-items-center flex-wrap my-1 ml-auto">
                                                <div class="mr-4" id="choiceAccuracy">${
                                                  question.choices[1].numPlayers
                                                } Players</div>
                                                <div class="choice-accuracy mr-1" id="choiceAccuracy">${
                                                  question.choices[1].accuracy
                                                }%</div>
                                                <div class="choice-result choice-result--${
                                                  question.choices[1].is_correct
                                                }"></div>
                                            </div>
                                        </li>
                                        <li class="question-item d-flex px-3 py-2 align-items-center flex-wrap">
                                            <div class="question-choice flex-grow-1 mr-2" id="choice">${
                                              question.choices[2].choice
                                            }</div>
                                            <div class="d-flex align-items-center flex-wrap my-1 ml-auto">
                                                <div class="mr-4" id="choiceAccuracy">${
                                                  question.choices[2].numPlayers
                                                } Players</div>
                                                <div class="choice-accuracy mr-1" id="choiceAccuracy">${
                                                  question.choices[2].accuracy
                                                }%</div>
                                                <div class="choice-result choice-result--${
                                                  question.choices[2].is_correct
                                                }"></div>
                                            </div>
                                        </li>
                                        <li class="question-item d-flex px-3 py-2 align-items-center flex-wrap">
                                            <div class="question-choice flex-grow-1 mr-2" id="choice">${
                                              question.choices[3].choice
                                            }</div>
                                            <div class="d-flex align-items-center flex-wrap my-1 ml-auto">
                                                <div class="mr-4" id="choiceAccuracy">${
                                                  question.choices[3].numPlayers
                                                } Players</div>
                                                <div class="choice-accuracy mr-1" id="choiceAccuracy">${
                                                  question.choices[3].accuracy
                                                }%</div>
                                                <div class="choice-result choice-result--${
                                                  question.choices[3].is_correct
                                                }"></div>
                                            </div>
                                        </li>
                                        <li class="question-item question-item--last-child d-flex px-3 py-2 align-items-center flex-wrap">
                                            <div class="question-choice flex-grow-1 mr-2" id="choice">Unattempted</div>
                                            <div class="d-flex align-items-center flex-wrap my-1 ml-auto">
                                                <div class="mr-4" id="choiceAccuracy">${
                                                  question.numNoAnsPlayers
                                                } Players</div>
                                                <div class="choice-accuracy mr-1" id="choiceAccuracy">${
                                                  question.noAnsAccuracy
                                                }%</div>
                                                <div class="choice-result choice-result--unattempted"></div>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            </div>`;
          document.querySelector("#questionReportList").innerHTML = html;
        });
      });
  });

  document.querySelector("#playersTab").addEventListener("click", function(e) {
    document.querySelector("#playersTab").classList.add("active");
    document.querySelector("#questionTab").classList.remove("active");
    document.querySelector("#overallTab").classList.remove("active");

    document.querySelector("#questionReport").classList.add("d-none");
    document.querySelector("#overallReport").classList.add("d-none");
    document.querySelector("#playersReport").classList.remove("d-none");
  });

  fetch(`/api/reports/hoster/${hoster_reportId}`, {
    headers: {
      authorization: `Bearer ${token}`
    }
  })
    .then(res => {
      return res.json();
    })
    .then(report => {
      console.log(report);
      const { player_results } = report.hosterReport;

      let html = "";

      player_results.forEach((player, index) => {
        html += `<li class="result-item d-flex px-3 py-2 align-items-center flex-wrap">
                            <div class="name flex-grow-1 mr-2 text-truncate" id="name">${player.name}</div>

                            <div class="d-flex align-items-center flex-wrap my-1">
                                <div class="mr-4" id="playerAccuracy">${player.accuracy}%</div>
                                <div class="mr-1" id="correctAccuracy">${player.correct}</div>
                                <div class="circle-bullet circle-bullet--correct mr-4"></div>
                                <div class="mr-1" id="wrongAccuracy">${player.incorrect}</div>
                                <div class="circle-bullet circle-bullet--incorrect mr-4"></div>
                                <div class="mr-1" id="unattemptAccuracy">${player.unattempted}</div>
                                <div class="circle-bullet circle-bullet--unattempt"></div>
                            </div>
                        </li>`;
        document.querySelector("#playersReportList").innerHTML = html;
      });
    });
};
