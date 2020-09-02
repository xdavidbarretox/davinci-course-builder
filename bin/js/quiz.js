//Pool questions
var __quiz;
var __alfabet = ["A", "B", "C", "D", "E", "F"];
var __questionCounter;
var __maxQuestionNumber;
var __answerPool;
var __questionPool;

function loadQuiz(src)
{
  console.log("--------------------------------"+src);
  var requestQuiz;
  if (window.XMLHttpRequest){
   requestQuiz = new XMLHttpRequest();
  }
  else { // IE 5/6
   requestQuiz = new ActiveXObject("Microsoft.XMLHTTP");
  }

  requestQuiz.overrideMimeType('text/xml');
  requestQuiz.open('GET', src);

  requestQuiz.onload = function() {
    __quiz = requestQuiz.responseXML;
    quizConfig();
  };

  requestQuiz.onerror = function() {
    alert("Network Error");
  };

  requestQuiz.onprogress = function(event) { // triggers periodically
    console.log("on progress start ------------------------");
    console.log('Received'+ event.loaded + ' of ' + event.total);
  };

  requestQuiz.setRequestHeader("Content-Type", "text/xml");
  requestQuiz.send();

  console.log("------------------------------end quiz");
}

function quizConfig(){
  setQuestionsPool();
}

function loadIntro(){
  clearCourseContainer();
  var intro = __quiz.getElementsByTagName("intro")[0];
  var content = intro.getElementsByTagName("content")[0].textContent;
  var txt = content.replace("#", __maxQuestionNumber);
  __courseContainer.innerHTML = txt;
  var script = intro.getElementsByTagName("script")[0];
  if(script != undefined)
  {
    eval(script.textContent);
  }
}

function startQuiz(){
  showUI(false);
  __questionCounter = 0;
  __answerPool = new Array();

  setQuestion(__questionCounter);
}

function setQuestionNumber()
{
  __maxQuestionNumber = __questionPool.length;
}

function setQuestion(index){
  clearCourseContainer();
  var question = __quiz.getElementsByTagName("question")[__questionPool[index]];
  var questionText = question.getElementsByTagName("text")[0];
  var answers = question.getElementsByTagName("answer");
  var content = questionText.textContent;
  var replaceStr;
  var currentQuestion = index + 1;
  if(currentQuestion < 10)
  {
    replaceStr = "0" + currentQuestion.toString();
  }
  else {
    replaceStr = currentQuestion.toString();
  }

  var txt = content.replace("#", replaceStr);

  __courseContainer.innerHTML = txt;
  var answerContainer = document.createElement("div");
  answerContainer.classList.add("questionAnswerContainer");
  __courseContainer.appendChild(answerContainer);
  for(i=0;i<answers.length;i++){
    console.log(answers[i]);
    var answer = answers[i].innerHTML;
    addAnswer(i, answer, answerContainer, __questionPool[index]);
  }

}

function addAnswer(index, answer, container, question){
  var answerElement = document.createElement("div");
  answerElement.setAttribute("index", index);
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
}

function checkAnswer()
{
  var question_id = parseInt(this.parentElement.getAttribute("question"));
  var answer_id = parseInt(this.getAttribute("index"));
  console.log("que pasa " + question_id);
  var question = __quiz.getElementsByTagName("question")[question_id];
  var feedback = question.getElementsByTagName("answer")[answer_id].getAttribute("showFeedback");
  showFeedback(question_id, feedback, true);
}

function showFeedback(question_id, feedback, isCorrect)
{
    __courseContainer.innerHTML = "";
    var question = __quiz.getElementsByTagName("question")[question_id];
    var feedbacks = question.getElementsByTagName("feedback");
    var content  = "";
    console.dir(feedbacks);
    for(var i = 0; i < feedbacks.length; i++)
    {
      var id = feedbacks[i].getAttribute("id");
      if(id == feedback)
      {
        content = feedbacks[i].textContent;
        __courseContainer.innerHTML = content;
      }
    }
console.log(question_id, feedback, isCorrect);
}

function nextQuestion(isRight){
  if(isRight){
    __answerPool.push(__questionCounter);
  }

  if(__questionCounter < (__maxQuestionNumber -1))
  {
    __questionCounter ++;
    setQuestion(__questionCounter);
  }
  else {
    showResult();
  }
}

function showResult()
{
  clearCourseContainer();
  showUI(true);
  var intro = __quiz.getElementsByTagName("result")[0];
  var goodAnswers = __answerPool.length;
  var minToPass = parseInt(__quiz.getElementsByTagName("quiz")[0].getAttribute("minToPass"));
  var result = Math.floor((goodAnswers / __maxQuestionNumber) * 100);
  var content;
  if(result >= minToPass)
  {
    content = intro.getElementsByTagName("pass")[0].textContent;
  }
  else {
    content = intro.getElementsByTagName("fail")[0].textContent;
  }
  
  var txt = content.replace("#", result);
  __courseContainer.innerHTML = txt;
  var script = intro.getElementsByTagName("script")[0];

  console.log("minToPass = " + minToPass);
  doLMSSetValue('cmi.core.score.raw', result.toString());doLMSCommit();
  if(script != undefined)
  {
    eval(script.textContent);
  }
}

function getAleatoryAnswers(){
  //var maxQuestionsNumber = parseInt(__quiz.getElementsByTagName("maxQuestions"));
  var questionNumber = __quiz.getElementsByTagName("question");
  var aleatoryNumber = Math.floor(Math.random() * questionNumber.length);

  for(var i = 0; i < __questionPool.length; i++){
    if(aleatoryNumber == __questionPool[i])
    {
      console.log("alv");
      return;
    }
  }
  __questionPool.push(aleatoryNumber);
}

function setQuestionsPool()
{
  __questionPool = new Array();
  var maxQuestionsNumber = parseInt(__quiz.firstElementChild.getAttribute("maxQuestions"));
  var questionNumber = __quiz.getElementsByTagName("question").length;

  if(questionNumber < maxQuestionsNumber){
    maxQuestionsNumber = questionNumber;
  }
  console.log("questionNumber " + questionNumber);
  console.log("maxQuestionsNumber " + maxQuestionsNumber);

  while (__questionPool.length < maxQuestionsNumber) {
    getAleatoryAnswers();
    console.log(__questionPool);
  }
  setQuestionNumber();
  loadIntro();
}
