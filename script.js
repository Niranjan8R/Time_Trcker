// ==========================================
// ELEMENTS
// ==========================================

const timer =
    document.getElementById("timer");

const startBtn =
    document.getElementById("startBtn");

const stopBtn =
    document.getElementById("stopBtn");

const statusText =
    document.getElementById("status");

const sessionList =
    document.getElementById("sessionList");

const historyDiv =
    document.getElementById("history");


// Goal elements

const goalInput =
    document.getElementById("goalInput");

const setGoalBtn =
    document.getElementById("setGoalBtn");

const changeGoalBtn =
    document.getElementById("changeGoalBtn");

const goalDashboard =
    document.getElementById("goalDashboard");

const studiedAmount =
    document.getElementById("studiedAmount");

const goalAmount =
    document.getElementById("goalAmount");

const remainingAmount =
    document.getElementById("remainingAmount");

const progressBar =
    document.getElementById("progressBar");

const progressPercent =
    document.getElementById("progressPercent");

const motivation =
    document.getElementById("motivation");

const backgroundMessage =
    document.getElementById("backgroundMessage");


// Edit modal

const editModal =
    document.getElementById("editModal");

const editStart =
    document.getElementById("editStart");

const editEnd =
    document.getElementById("editEnd");

const editError =
    document.getElementById("editError");

const saveEditBtn =
    document.getElementById("saveEditBtn");

const cancelEditBtn =
    document.getElementById("cancelEditBtn");



// ==========================================
// DATA
// ==========================================

let sessions =
    JSON.parse(
        localStorage.getItem("studySessions")
    ) || [];


let activeSession =
    JSON.parse(
        localStorage.getItem(
            "activeStudySession"
        )
    );


let dailyGoal =
    Number(
        localStorage.getItem("dailyStudyGoal")
    ) || 0;


let interval;

let editingSessionIndex = null;



// ==========================================
// SETTINGS
// ==========================================

// If an active timer is longer than this,
// the tracker assumes you may have forgotten
// to stop it.

const FORGOTTEN_TIMER_HOURS = 8;

const FORGOTTEN_TIMER_LIMIT =
    FORGOTTEN_TIMER_HOURS *
    60 *
    60 *
    1000;



// ==========================================
// DATE HELPERS
// ==========================================

function getDateKey(timestamp) {

    const date =
        new Date(timestamp);

    return (
        date.getFullYear() +
        "-" +
        String(
            date.getMonth() + 1
        ).padStart(2, "0") +
        "-" +
        String(
            date.getDate()
        ).padStart(2, "0")
    );
}


function getTodayKey() {

    return getDateKey(
        Date.now()
    );
}



// ==========================================
// TIME FORMATTING
// ==========================================

function formatDuration(milliseconds) {

    const safeMilliseconds =
        Math.max(
            0,
            milliseconds
        );


    const totalSeconds =
        Math.floor(
            safeMilliseconds / 1000
        );


    const hours =
        Math.floor(
            totalSeconds / 3600
        );


    const minutes =
        Math.floor(
            (totalSeconds % 3600) / 60
        );


    const seconds =
        totalSeconds % 60;


    return [
        hours,
        minutes,
        seconds
    ]
        .map(
            value =>
                String(value)
                    .padStart(2, "0")
        )
        .join(":");
}



function formatClock(timestamp) {

    return new Date(timestamp)
        .toLocaleTimeString(
            [],
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );
}



function formatDate(timestamp) {

    return new Date(timestamp)
        .toLocaleDateString(
            [],
            {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric"
            }
        );
}



// ==========================================
// DATETIME-LOCAL HELPERS
// ==========================================

function timestampToInputValue(timestamp) {

    const date =
        new Date(timestamp);


    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    const hours =
        String(
            date.getHours()
        ).padStart(2, "0");


    const minutes =
        String(
            date.getMinutes()
        ).padStart(2, "0");


    return (
        year +
        "-" +
        month +
        "-" +
        day +
        "T" +
        hours +
        ":" +
        minutes
    );
}



// ==========================================
// FRIENDLY HOURS
// ==========================================

function formatHours(milliseconds) {

    if (milliseconds <= 0) {

        return "0h";
    }


    const totalMinutes =
        Math.ceil(
            milliseconds / 60000
        );


    const hours =
        Math.floor(
            totalMinutes / 60
        );


    const minutes =
        totalMinutes % 60;


    if (hours === 0) {

        return minutes + "m";
    }


    if (minutes === 0) {

        return hours + "h";
    }


    return (
        hours +
        "h " +
        minutes +
        "m"
    );
}



// ==========================================
// STORAGE
// ==========================================

function saveSessions() {

    localStorage.setItem(
        "studySessions",
        JSON.stringify(sessions)
    );
}



function saveActiveSession() {

    if (activeSession) {

        localStorage.setItem(
            "activeStudySession",
            JSON.stringify(activeSession)
        );

    } else {

        localStorage.removeItem(
            "activeStudySession"
        );
    }
}



// ==========================================
// TODAY'S COMPLETED TIME
// ==========================================

function getTodayCompletedTime() {

    const today =
        getTodayKey();


    return sessions

        .filter(
            session =>
                getDateKey(
                    session.start
                ) === today
        )

        .reduce(
            (total, session) =>
                total +
                Math.max(
                    0,
                    session.end -
                    session.start
                ),
            0
        );
}



// ==========================================
// TOTAL TODAY INCLUDING ACTIVE SESSION
// ==========================================

function getTodayTotalTime() {

    let total =
        getTodayCompletedTime();


    if (
        activeSession &&
        getDateKey(
            activeSession.start
        ) === getTodayKey()
    ) {

        total +=
            Math.max(
                0,
                Date.now() -
                activeSession.start
            );
    }


    return total;
}



// ==========================================
// TIMER
// ==========================================

function updateTimer() {

    const total =
        getTodayTotalTime();


    timer.textContent =
        formatDuration(total);


    updateGoalProgress(total);
}



// ==========================================
// START STUDY
// ==========================================

function startStudy() {

    if (activeSession) {

        return;
    }


    activeSession = {

        start: Date.now()

    };


    saveActiveSession();


    startBtn.disabled = true;

    stopBtn.disabled = false;


    statusText.textContent =
        "Studying since " +
        formatClock(
            activeSession.start
        );


    interval =
        setInterval(
            updateTimer,
            1000
        );


    updateTimer();
}



// ==========================================
// STOP STUDY
// ==========================================

function stopStudy() {

    if (!activeSession) {

        return;
    }


    const completedSession = {

        start:
            activeSession.start,

        end:
            Date.now()

    };


    sessions.push(
        completedSession
    );


    saveSessions();


    activeSession = null;

    saveActiveSession();


    clearInterval(interval);


    startBtn.disabled = false;

    stopBtn.disabled = true;


    statusText.textContent =
        "Not studying";


    updateEverything();
}



// ==========================================
// DAILY GOAL
// ==========================================

function setGoal() {

    const hours =
        Number(
            goalInput.value
        );


    if (
        !hours ||
        hours <= 0
    ) {

        alert(
            "Enter a valid study goal."
        );

        return;
    }


    dailyGoal = hours;


    localStorage.setItem(
        "dailyStudyGoal",
        dailyGoal
    );


    goalInput.value = "";


    showGoalDashboard();

    updateTimer();
}



// ==========================================
// SHOW GOAL
// ==========================================

function showGoalDashboard() {

    if (dailyGoal <= 0) {

        goalDashboard
            .classList
            .add("hidden");

        return;
    }


    goalDashboard
        .classList
        .remove("hidden");


    goalAmount.textContent =
        dailyGoal + "h";
}



// ==========================================
// CHANGE GOAL
// ==========================================

function changeGoal() {

    const newGoal =
        prompt(
            "Enter your new goal in hours:",
            dailyGoal
        );


    if (newGoal === null) {

        return;
    }


    const hours =
        Number(newGoal);


    if (
        !hours ||
        hours <= 0
    ) {

        alert(
            "Please enter a valid number."
        );

        return;
    }


    dailyGoal = hours;


    localStorage.setItem(
        "dailyStudyGoal",
        dailyGoal
    );


    showGoalDashboard();

    updateTimer();
}



// ==========================================
// GOAL PROGRESS
// ==========================================

function updateGoalProgress(
    studiedMilliseconds
) {

    if (dailyGoal <= 0) {

        motivation.textContent =
            "Set a goal. Your procrastination deserves competition.";

        backgroundMessage.textContent =
            "Your future self is watching 👀";

        return;
    }


    const goalMilliseconds =
        dailyGoal *
        60 *
        60 *
        1000;


    const remaining =
        Math.max(
            goalMilliseconds -
            studiedMilliseconds,
            0
        );


    const percent =
        (
            studiedMilliseconds /
            goalMilliseconds
        ) * 100;


    const displayPercent =
        Math.min(
            percent,
            100
        );


    studiedAmount.textContent =
        formatHours(
            studiedMilliseconds
        );


    goalAmount.textContent =
        dailyGoal + "h";


    remainingAmount.textContent =
        formatHours(
            remaining
        );


    progressBar.style.width =
        displayPercent + "%";


    progressPercent.textContent =
        Math.floor(
            displayPercent
        ) +
        "% complete";


    updateMotivation(
        percent,
        remaining
    );
}



// ==========================================
// MOTIVATION
// ==========================================

function updateMotivation(
    percent,
    remaining
) {

    if (percent >= 100) {

        motivation.textContent =
            "🎉 GOAL CRUSHED! Your brain has officially clocked out with honor.";

        backgroundMessage.textContent =
            "ABSOLUTE STUDY MACHINE 🏆";

    }

    else if (percent >= 75) {

        motivation.textContent =
            "🔥 You're almost there. Don't let YouTube win now.";

        backgroundMessage.textContent =
            "FINISH HIM. 📚";

    }

    else if (percent >= 50) {

        motivation.textContent =
            "😤 Halfway there. Your bed is temporary. Academic glory is forever.";

        backgroundMessage.textContent =
            "KEEP COOKING 🧠";

    }

    else if (percent >= 25) {

        motivation.textContent =
            "☕ Okay, we're actually studying. Character development.";

        backgroundMessage.textContent =
            "PROCRASTINATION IS GETTING NERVOUS";

    }

    else if (percent > 0) {

        motivation.textContent =
            "🐢 Slow progress is still progress. Unless you're scrolling Instagram.";

        backgroundMessage.textContent =
            "THE BOOK WON'T READ ITSELF";

    }

    else {

        motivation.textContent =
            "👀 The timer says zero. The books are judging you.";

        backgroundMessage.textContent =
            "START STUDYING, CHAMP";

    }
}



// ==========================================
// TODAY'S SESSION LIST
// ==========================================

function renderTodaySessions() {

    const today =
        getTodayKey();


    const todaySessions =
        sessions

            .map(
                (session, index) => ({
                    ...session,
                    originalIndex: index
                })
            )

            .filter(
                session =>
                    getDateKey(
                        session.start
                    ) === today
            );


    if (
        todaySessions.length === 0
    ) {

        sessionList.innerHTML =
            '<p class="empty">No sessions yet.</p>';

        return;
    }


    sessionList.innerHTML = "";


    todaySessions

        .sort(
            (a, b) =>
                a.start - b.start
        )

        .forEach(
            session => {

                const div =
                    document.createElement(
                        "div"
                    );


                div.className =
                    "session";


                div.innerHTML = `

                    <div class="session-info">

                        <span class="session-time">

                            🕐
                            ${formatClock(
                                session.start
                            )}

                            →

                            ${formatClock(
                                session.end
                            )}

                        </span>


                        <strong
                            class="session-duration"
                        >

                            ${formatDuration(
                                session.end -
                                session.start
                            )}

                        </strong>

                    </div>


                    <div class="session-actions">

                        <button
                            class="edit-session"
                            data-index="${session.originalIndex}"
                        >
                            Edit
                        </button>


                        <button
                            class="delete-session"
                            data-index="${session.originalIndex}"
                        >
                            Delete
                        </button>

                    </div>

                `;


                sessionList.appendChild(
                    div
                );
            }
        );
}



// ==========================================
// DELETE SESSION
// ==========================================

function deleteSession(index) {

    const session =
        sessions[index];


    if (!session) {

        return;
    }


    const confirmed =
        confirm(

            "Delete this study session?\n\n" +

            formatClock(
                session.start
            ) +

            " → " +

            formatClock(
                session.end
            ) +

            "\n\nDuration: " +

            formatDuration(
                session.end -
                session.start
            )
        );


    if (!confirmed) {

        return;
    }


    sessions.splice(
        index,
        1
    );


    saveSessions();

    updateEverything();
}



// ==========================================
// EDIT SESSION
// ==========================================

function openEditSession(index) {

    const session =
        sessions[index];


    if (!session) {

        return;
    }


    editingSessionIndex =
        index;


    editStart.value =
        timestampToInputValue(
            session.start
        );


    editEnd.value =
        timestampToInputValue(
            session.end
        );


    editError.textContent =
        "";


    editModal
        .classList
        .remove("hidden");
}



function closeEditSession() {

    editingSessionIndex =
        null;


    editError.textContent =
        "";


    editModal
        .classList
        .add("hidden");
}



function saveEditedSession() {

    if (
        editingSessionIndex === null
    ) {

        return;
    }


    const newStart =
        new Date(
            editStart.value
        ).getTime();


    const newEnd =
        new Date(
            editEnd.value
        ).getTime();


    if (
        !editStart.value ||
        !editEnd.value ||
        Number.isNaN(newStart) ||
        Number.isNaN(newEnd)
    ) {

        editError.textContent =
            "Please enter both the start and end time.";

        return;
    }


    if (newEnd <= newStart) {

        editError.textContent =
            "End time must be after the start time.";

        return;
    }


    sessions[
        editingSessionIndex
    ] = {

        start:
            newStart,

        end:
            newEnd

    };


    saveSessions();


    closeEditSession();

    updateEverything();
}



// ==========================================
// HISTORY
// ==========================================

function renderHistory() {

    const grouped = {};


    sessions.forEach(
        (session, index) => {

            const date =
                getDateKey(
                    session.start
                );


            if (!grouped[date]) {

                grouped[date] = [];
            }


            grouped[date].push({

                ...session,

                originalIndex:
                    index

            });
        }
    );


    const dates =
        Object
            .keys(grouped)
            .sort()
            .reverse();


    if (dates.length === 0) {

        historyDiv.innerHTML =
            '<p class="empty">No history yet.</p>';

        return;
    }


    historyDiv.innerHTML = "";


    dates.forEach(
        date => {

            const daySessions =
                grouped[date]
                    .sort(
                        (a, b) =>
                            a.start -
                            b.start
                    );


            const total =
                daySessions.reduce(
                    (sum, session) =>
                        sum +
                        (
                            session.end -
                            session.start
                        ),
                    0
                );


            const dayDiv =
                document.createElement(
                    "div"
                );


            dayDiv.className =
                "history-day";


            const firstTimestamp =
                daySessions[0].start;


            dayDiv.innerHTML = `

                <div class="history-summary">

                    <span class="history-date">

                        📅
                        ${formatDate(
                            firstTimestamp
                        )}

                    </span>


                    <strong class="history-total">

                        ${formatDuration(
                            total
                        )}

                    </strong>

                </div>


                <div class="history-sessions">

                    ${daySessions
                        .map(
                            session => `

                            <div class="history-session">

                                <div>

                                    <div class="history-session-time">

                                        🕐
                                        ${formatClock(
                                            session.start
                                        )}

                                        →

                                        ${formatClock(
                                            session.end
                                        )}

                                    </div>


                                    <div class="history-session-duration">

                                        ${formatDuration(
                                            session.end -
                                            session.start
                                        )}

                                    </div>

                                </div>


                                <div class="history-session-actions">

                                    <button
                                        class="edit-session"
                                        data-index="${session.originalIndex}"
                                    >
                                        Edit
                                    </button>


                                    <button
                                        class="delete-session"
                                        data-index="${session.originalIndex}"
                                    >
                                        Delete
                                    </button>

                                </div>

                            </div>

                        `
                        )
                        .join("")
                    }

                </div>

            `;


            historyDiv.appendChild(
                dayDiv
            );
        }
    );
}



// ==========================================
// FORGOTTEN TIMER RECOVERY
// ==========================================

function checkForgottenTimer() {

    if (!activeSession) {

        return;
    }


    const elapsed =
        Date.now() -
        activeSession.start;


    if (
        elapsed <
        FORGOTTEN_TIMER_LIMIT
    ) {

        return;
    }


    const startText =
        formatDate(
            activeSession.start
        ) +
        " at " +
        formatClock(
            activeSession.start
        );


    const answer =
        confirm(

            "⚠️ Your study timer has been running for " +

            formatHours(elapsed) +

            ".\n\n" +

            "It started " +
            startText +
            ".\n\n" +

            "Did you forget to stop the timer?\n\n" +

            "Press OK to fix it.\n" +

            "Press Cancel if you really studied this long."
        );


    if (!answer) {

        return;
    }


    recoverForgottenSession();
}



// ==========================================
// RECOVER FORGOTTEN SESSION
// ==========================================

function recoverForgottenSession() {

    if (!activeSession) {

        return;
    }


    const started =
        new Date(
            activeSession.start
        );


    const suggestedTime =
        String(
            started.getHours()
        ).padStart(2, "0") +
        ":" +
        String(
            started.getMinutes()
        ).padStart(2, "0");


    const stopTime =
        prompt(

            "What time did you ACTUALLY stop studying?\n\n" +

            "Enter the time like:\n" +

            "10:30 PM\n" +
            "or\n" +
            "22:30"
        );


    if (stopTime === null) {

        return;
    }


    const correctedEnd =
        parseRecoveryTime(
            stopTime,
            activeSession.start
        );


    if (!correctedEnd) {

        alert(

            "I couldn't understand that time.\n\n" +

            "Please try again using something like:\n" +

            "10:30 PM\n" +

            "or\n" +

            "22:30"
        );


        recoverForgottenSession();

        return;
    }


    if (
        correctedEnd <=
        activeSession.start
    ) {

        alert(
            "The stop time must be after the session started."
        );

        return;
    }


    if (
        correctedEnd >
        Date.now()
    ) {

        alert(
            "The stop time cannot be in the future."
        );

        return;
    }


    sessions.push({

        start:
            activeSession.start,

        end:
            correctedEnd

    });


    saveSessions();


    activeSession = null;

    saveActiveSession();


    clearInterval(interval);


    startBtn.disabled =
        false;

    stopBtn.disabled =
        true;


    statusText.textContent =
        "Not studying";


    alert(
        "✅ Session fixed!\n\n" +
        "Your corrected study session has been saved."
    );


    updateEverything();
}



// ==========================================
// PARSE RECOVERY TIME
// ==========================================

function parseRecoveryTime(
    input,
    startTimestamp
) {

    const text =
        input
            .trim()
            .toUpperCase();


    const match =
        text.match(
            /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/
        );


    if (!match) {

        return null;
    }


    let hours =
        Number(
            match[1]
        );


    const minutes =
        Number(
            match[2]
        );


    const period =
        match[3];


    if (
        minutes < 0 ||
        minutes > 59
    ) {

        return null;
    }


    if (period) {

        if (
            hours < 1 ||
            hours > 12
        ) {

            return null;
        }


        if (
            period === "PM" &&
            hours !== 12
        ) {

            hours += 12;
        }


        if (
            period === "AM" &&
            hours === 12
        ) {

            hours = 0;
        }

    } else {

        if (
            hours < 0 ||
            hours > 23
        ) {

            return null;
        }
    }


    const startDate =
        new Date(
            startTimestamp
        );


    const result =
        new Date(
            startDate
        );


    result.setHours(
        hours,
        minutes,
        0,
        0
    );


    /*
        If the entered time is earlier
        than the starting time, assume
        the session ended after midnight.
    */

    if (
        result.getTime() <=
        startTimestamp
    ) {

        result.setDate(
            result.getDate() + 1
        );
    }


    return result.getTime();
}



// ==========================================
// RESTORE ACTIVE SESSION
// ==========================================

function restoreActiveSession() {

    if (!activeSession) {

        return;
    }


    /*
        First check whether this looks
        like a forgotten timer.
    */

    checkForgottenTimer();


    /*
        checkForgottenTimer() may have
        corrected and removed the session.
    */

    if (!activeSession) {

        return;
    }


    startBtn.disabled =
        true;

    stopBtn.disabled =
        false;


    statusText.textContent =
        "Studying since " +
        formatClock(
            activeSession.start
        );


    interval =
        setInterval(
            updateTimer,
            1000
        );
}



// ==========================================
// UPDATE EVERYTHING
// ==========================================

function updateEverything() {

    renderTodaySessions();

    renderHistory();

    updateTimer();
}



// ==========================================
// SESSION BUTTON HANDLER
// ==========================================

function handleSessionButton(event) {

    const button =
        event.target.closest(
            "button"
        );


    if (!button) {

        return;
    }


    const index =
        Number(
            button.dataset.index
        );


    if (
        button.classList.contains(
            "delete-session"
        )
    ) {

        deleteSession(index);

        return;
    }


    if (
        button.classList.contains(
            "edit-session"
        )
    ) {

        openEditSession(index);
    }
}



// ==========================================
// EVENTS
// ==========================================

startBtn.addEventListener(
    "click",
    startStudy
);


stopBtn.addEventListener(
    "click",
    stopStudy
);


setGoalBtn.addEventListener(
    "click",
    setGoal
);


changeGoalBtn.addEventListener(
    "click",
    changeGoal
);


// Press Enter to set goal

goalInput.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Enter"
        ) {

            setGoal();
        }
    }
);


// Today's session buttons

sessionList.addEventListener(
    "click",
    handleSessionButton
);


// History session buttons

historyDiv.addEventListener(
    "click",
    handleSessionButton
);


// Save edited session

saveEditBtn.addEventListener(
    "click",
    saveEditedSession
);


// Cancel editing

cancelEditBtn.addEventListener(
    "click",
    closeEditSession
);


// Close modal by clicking outside it

editModal.addEventListener(
    "click",
    function(event) {

        if (
            event.target ===
            editModal
        ) {

            closeEditSession();
        }
    }
);


// Escape closes edit window

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Escape" &&
            !editModal.classList.contains(
                "hidden"
            )
        ) {

            closeEditSession();
        }
    }
);



// ==========================================
// INITIAL LOAD
// ==========================================

showGoalDashboard();

renderTodaySessions();

renderHistory();

restoreActiveSession();

updateTimer();