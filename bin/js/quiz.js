//Pool questions
var __quiz;
var __alfabet = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
var __questionCounter;
var __maxQuestionNumber;
var __answerPool;
var __questionPool;
;
var __maxAttemps;
var __quizBlocked = false;
var __score = 0;
var __minToPass = 100;
function loadQuiz(src) {
    //console.log("loadQuiz: "+src);
    var requestQuiz;
    if (window.XMLHttpRequest) {
        requestQuiz = new XMLHttpRequest();
    }
    else { // IE 5/6
        requestQuiz = new ActiveXObject("Microsoft.XMLHTTP");
    }
    requestQuiz.overrideMimeType('text/xml');
    requestQuiz.open('GET', src);
    requestQuiz.onload = function () {
        __quiz = requestQuiz.responseXML;
        quizConfig();
    };
    requestQuiz.onerror = function () {
        alert("Network Error");
    };
    requestQuiz.setRequestHeader("Content-Type", "text/xml");
    requestQuiz.send();
}
function quizConfig() {
    __minToPass = parseInt(__quiz.getElementsByTagName("quiz")[0].getAttribute("minToPass"));
    attempConfig();
    if (!__quizBlocked) {
        setQuestionsPool();
    }
}
function loadIntro() {
    clearCourseContainer();
    var intro = __quiz.getElementsByTagName("intro")[0];
    var content = intro.getElementsByTagName("content")[0].textContent;
    var txt = content.replace("#", String(__maxQuestionNumber));
    __courseContainer.innerHTML = txt;
    var script = intro.getElementsByTagName("script")[0];
    if (script != undefined) {
        eval(script.textContent);
    }
    var audio = intro.getElementsByTagName("content")[0].getAttribute("audio");
    if (audio != null) {
        playAudio(audio);
    }
}
function startQuiz() {
    hideUI(true);
    __questionCounter = 0;
    __answerPool = new Array();
    setQuestion(__questionCounter);
}
function setQuestionNumber() {
    __maxQuestionNumber = __questionPool.length;
}
function setQuestion(index) {
    clearCourseContainer();
    var question = __quiz.getElementsByTagName("question")[__questionPool[index]];
    var questionText = question.getElementsByTagName("text")[0];
    var answers = question.getElementsByTagName("answer");
    var content = questionText.textContent;
    var replaceStr;
    var currentQuestion = index + 1;
    if (currentQuestion < 10) {
        replaceStr = "0" + String(currentQuestion);
    }
    else {
        replaceStr = String(currentQuestion);
    }
    var txt = content.replace("#", replaceStr);
    __courseContainer.innerHTML = txt;
    var answerContainer = document.createElement("div");
    answerContainer.classList.add("questionAnswerContainer");
    __courseContainer.appendChild(answerContainer);
    for (var i = 0; i < answers.length; i++) {
        //console.log(answers[i]);
        var answer = answers[i].innerHTML;
        var answerClass = answers[i].getAttribute("class");
        //var audioFx = question.getElementsByTagName("answer")[i].getAttribute("audio");
        addAnswer(i, answer, answerContainer, __questionPool[index], answerClass);
    }
    var audio = questionText.getAttribute("audio");
    if (audio != null) {
        playAudio(audio);
    }
}
function addAnswer(index, answer, container, question, answerClass) {
    var answerElement = document.createElement("div");
    answerElement.setAttribute("index", String(index));
    container.setAttribute("question", question);
    answerElement.classList.add("questionAnswer");
    var text = document.createElement("p");
    var deco = document.createElement("div");
    deco.innerHTML = __alfabet[index];
    text.innerHTML = answer;
    answerElement.appendChild(text);
    answerElement.appendChild(deco);
    container.appendChild(answerElement);
    answerElement.addEventListener("click", checkAnswer);
    if (answerClass != null) {
        answerElement.classList.add(answerClass);
    }
    //console.log("answerClass " + answerClass);
}
function checkAnswer() {
    var question_id = parseInt(this.parentElement.getAttribute("question"));
    var answer_id = parseInt(this.getAttribute("index"));
    var question = __quiz.getElementsByTagName("question")[question_id];
    var feedback = question.getElementsByTagName("answer")[answer_id].getAttribute("showFeedback");
    showFeedback(question_id, feedback);
    //pauseAudio();
    var audioFx = question.getElementsByTagName("answer")[answer_id].getAttribute("audio");
    if (audioFx != null) {
        playFxAudio(audioFx);
    }
}
function showFeedback(question_id, feedback) {
    __courseContainer.innerHTML = "";
    var question = __quiz.getElementsByTagName("question")[question_id];
    var feedbacks = question.getElementsByTagName("feedback");
    var content = "";
    //console.dir(feedbacks);
    for (var i = 0; i < feedbacks.length; i++) {
        var id = feedbacks[i].getAttribute("id");
        if (id == feedback) {
            content = feedbacks[i].textContent;
            __courseContainer.innerHTML = content;
            var audio = question.getElementsByTagName("feedback")[i].getAttribute("audio");
            if (audio != null) {
                playAudio(audio);
            }
        }
    }
    //console.log(question_id, feedback);
}
function nextQuestion(isRight) {
    if (isRight) {
        __answerPool.push(__questionCounter);
    }
    if (__questionCounter < (__maxQuestionNumber - 1)) {
        __questionCounter++;
        setQuestion(__questionCounter);
    }
    else {
        showResult();
    }
}
function showResult() {
    //console.log("--- showResult ---");
    clearCourseContainer();
    hideUI(false);
    var feedback = __quiz.getElementsByTagName("result")[0];
    var goodAnswers = __answerPool.length;
    __score = Math.floor((goodAnswers / __maxQuestionNumber) * 100);
    var content;
    if (__attemps.length < __maxAttemps) {
        __attemps.push(__score);
        saveSuspendData();
    }
    if (((__attemps.length <= __maxAttemps) && (__score >= __minToPass)) || (__attemps.length == __maxAttemps)) {
        //console.log("save score = " + __score);
        doLMSSetValue('cmi.core.score.raw', String(__score));
        doLMSCommit();
    }
    if (__score >= __minToPass) {
        content = feedback.getElementsByTagName("pass")[0];
    }
    else {
        //console.log("__attemps.length = " + __attemps.length + " VS __maxAttemps = " + __maxAttemps);
        if (__attemps.length == __maxAttemps) {
            blockQuiz();
            return;
        }
        else {
            content = feedback.getElementsByTagName("fail")[0];
        }
    }
    var txt = content.textContent.replace("#", String(__score));
    __courseContainer.innerHTML = txt;
    var script = feedback.getElementsByTagName("script")[0];
    if (script != undefined) {
        eval(script.textContent);
    }
    var audio = content.getAttribute("audio");
    if (audio != null) {
        playAudio(audio);
    }
}
function getAleatoryQuestion() {
    //var maxQuestionsNumber = parseInt(__quiz.getElementsByTagName("maxQuestions"));
    var questionNumber = __quiz.getElementsByTagName("question");
    var aleatoryNumber = Math.floor(Math.random() * questionNumber.length);
    for (var i = 0; i < __questionPool.length; i++) {
        if (aleatoryNumber == __questionPool[i]) {
            //console.log("alv");
            return;
        }
    }
    __questionPool.push(aleatoryNumber);
}
function getQuestion() {
    //console.log("---getQuestion---" + __attemps.length + " - " + __maxAttemps);
    //var questionNumber = __quiz.getElementsByTagName("question");
    var maxQuestionsNumber = parseInt(__quiz.firstElementChild.getAttribute("maxQuestions"));
    var beingConstraint = __attemps.length * maxQuestionsNumber;
    var endConstraint = beingConstraint + maxQuestionsNumber;
    //console.log("questionNumber " + questionNumber);
    //console.log("beingConstraint " + beingConstraint);
    //console.log("endConstraint " + endConstraint);
    for (var i = beingConstraint; i < endConstraint; i++) {
        //console.log("i " + i);
        __questionPool.push(i);
    }
}
function setQuestionsPool() {
    __questionPool = new Array();
    var maxQuestionsNumber = parseInt(__quiz.firstElementChild.getAttribute("maxQuestions"));
    var questionNumber = __quiz.getElementsByTagName("question").length;
    var isRandom = __quiz.firstElementChild.getAttribute("randomQuestions") == "true";
    //console.log("isRandom = " + isRandom);
    if (questionNumber < maxQuestionsNumber) {
        maxQuestionsNumber = questionNumber;
    }
    //console.log("questionNumber " + questionNumber);
    //console.log("maxQuestionsNumber " + maxQuestionsNumber);
    if (isRandom) {
        while (__questionPool.length < maxQuestionsNumber) {
            getAleatoryQuestion();
            //console.log(__questionPool);
        }
    }
    else {
        getQuestion();
    }
    setQuestionNumber();
    loadIntro();
}
function attempConfig() {
    //console.log("--- attempConfig ---");
    __maxAttemps = parseInt(__quiz.firstElementChild.getAttribute("maxAttemps"));
    //console.log("attempConfig: __maxAttemps = " + __maxAttemps);
    if ((__maxAttemps == 0) || (__maxAttemps == NaN)) {
        //console.log("attempConfig: 0 - NaN");
        return;
    }
    if (__LMSInitialized) {
        score = doLMSGetValue('cmi.core.score.raw');
        if (score != "" && score != "0") {
            //console.log("score is not an empty string");
            blockQuiz();
            return;
        }
    }
    else {
        //console.log("__score=" + __score);
        if (__score >= __minToPass) {
            blockQuiz();
            return;
        }
    }
    if (__attemps.length >= __maxAttemps) {
        if (!isNaN(parseInt(__attemps[__attemps.length - 1]))) {
            //console.log("(__attemps.length >= __maxAttemps");
            blockQuiz();
            return;
        }
        else {
            //alert("setQuestionsPool " + __attemps[__attemps.length - 1]);
        }
    }
    //console.log("xxx attempConfig xxx");
}
function blockQuiz() {
    //console.log("blockQuiz");
    __quizBlocked = true;
    //console.log("You get __maxAttemps " + __maxAttemps);
    clearCourseContainer();
    var feedback = __quiz.getElementsByTagName("result")[0];
    var content = feedback.getElementsByTagName("block")[0].textContent;
    var txtAttemps = content.replace("&", String(__maxAttemps));
    var score = String(__attemps[__attemps.length - 1]);
    var txt = txtAttemps.replace("#", score);
    __courseContainer.innerHTML = txt;
    var audio = feedback.getElementsByTagName("block")[0].getAttribute("audio");
    if (audio != null) {
        playAudio(audio);
    }
}
