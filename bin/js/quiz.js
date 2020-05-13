var __quiz;
var requestQuiz;

function loadQuiz(src)
{
  console.log("--------------------------------"+src);

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
  //alert("quiz loaded");
  loadIntro();
}

function loadIntro(){
  var intro = __quiz.getElementsByTagName("intro")[0];
  __courseContainer.innerHTML = intro.getElementsByTagName("content")[0].textContent;
  var script = intro.getElementsByTagName("script")[0];
  if(script != undefined)
  {
    eval(script.textContent);
  }

}
