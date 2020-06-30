console.log("DavEngine v20200624");

var __courseLocation:string = "course/course.xml";
var __course:XMLDocument;

var __courseContainer:HTMLElement;
var __isMobile:boolean = false;
var __pageCounter:number = 0;
var __totalPages:number;
var __courseName:string;

var __nextButton:HTMLElement;
var __prevButton:HTMLElement;
var __playButton:HTMLElement;
var __reloadButton:HTMLElement;
var __tocButton:HTMLElement;
var __isWindowed:boolean;
var __courseWidth:number;
var __courseHeight:number;
var __displayWindow:HTMLElement;
var __toc:HTMLElement;
var __ui:HTMLElement;
var __uiButton:HTMLElement;
var __toogleTOC:boolean = false;
var __toogleUI:boolean = false;

var __visited = [];
var __counter:HTMLElement;
var __AdvanceBar:HTMLElement;
var __portraitAlertCenter:number;
var __frame:number;
var __events = null;
var __frameInterval:any;
var __frameRate:number = 100;
var __blockEvent:boolean = false;
var __isPaused:boolean = false;
var __tooltipNext:HTMLElement;
var __tooltipPrev:HTMLElement;
var __lessons:any[] = [];
var __page:any;

var __videoTimeInternal:any;
var __video:any;
var __subtitles:any[] = [];
var __currentSubtitle:number;
var __reviewPool:Array<boolean> = new Array();
var __LMSInitialized:boolean = false;

declare var doLMSSetValue:any;
declare var doLMSCommit:any;
declare var loadQuiz:any;

document.addEventListener('DOMContentLoaded', init, false);
window.addEventListener('resize', windowedCourse);

function init(){
  console.log("init---");
  checkMobile();
  checkHorizontal();
  loadCourse(__courseLocation);
}

function loadCourse(src:string){
  console.log("loadCourse---");
  var requestCourse:any;
  if (window.XMLHttpRequest){
   requestCourse = new XMLHttpRequest();
  }
  else { // IE 5/6
   requestCourse = new ActiveXObject("Microsoft.XMLHTTP");
  }
  requestCourse.overrideMimeType('text/xml');
  requestCourse.open('GET', src);

  requestCourse.onload = function() {
    console.log("on load start ------------------------");
    __course = requestCourse.responseXML;
    console.dir(__course);
    courseConfig();
  }

  requestCourse.onerror = function() { // only triggers if the request couldn't be made at all
    alert("Network Error");
  }

  requestCourse.onprogress = function(event:any) { // triggers periodically
    console.log("on progress start ------------------------");
    console.log('Received'+ event.loaded + ' of ' + event.total);
    console.log("----------------------------------- on progress ends");
  }

  requestCourse.setRequestHeader("Content-Type", "text/xml");
  requestCourse.send();
}

function courseConfig()
{
  __totalPages = __course.getElementsByTagName("lesson").length + __course.getElementsByTagName("quiz").length;
  //__courseName = __course.getElementsByTagName("course")[0].getAttribute("name");
  __isWindowed = (__course.getElementsByTagName("course")[0].getAttribute("windowed") == "true");
  __displayWindow = document.getElementById("Course");
  __courseWidth = parseInt(__course.getElementsByTagName("course")[0].getAttribute("width"));
  __courseHeight = parseInt(__course.getElementsByTagName("course")[0].getAttribute("height"));
  __courseContainer = document.getElementById("Course_Content");
  document.getElementById("Welcome_UI").addEventListener("click", function(){setCourseContent(0); this.style.display = "none";});
  windowedCourse();
  //setCourseName(__courseName);
  set_uiElements();
  loadTOC();
  setLessonCounter();
}

function setCourseName(name:string){
  document.getElementById("Course_Name").innerHTML = name;
}

function clearCourseContainer()
{
  clearInterval(__frameInterval);
  clearInterval(__videoTimeInternal);
  __courseContainer.innerHTML = "";
  /*
  __courseContainer.remove();
  var cc = document.createElement("div");
  cc.setAttribute("id", "Course_Content");
  document.getElementById("Course").appendChild(cc);
  __courseContainer = document.getElementById("Course_Content");
  */
}

function setCourseContent(index:number){
  console.log("setCourseContent " + index);
  __isPaused = false;
  __page = __lessons[index];
  var type:string = __page.tagName;

  clearCourseContainer();

  if(type == "lesson"){
    __courseContainer.innerHTML = __page.getElementsByTagName("content")[0].textContent;
    setEvents();
    loadScript();
  }
  if(type == "quiz"){

    loadQuiz(__lessons[index].getAttribute("file"));
  }

  if(index == 0)
  {
    __prevButton.style.display = "none";
  }
  else{
    __prevButton.style.display = "block";
  }
  if(index == (__totalPages -1))
  {
    __nextButton.style.display = "none";
  }
  else{
    __nextButton.style.display = "block";
  }
  setLessonCounter();

  if(index < (__totalPages -1)){
    __tooltipNext.innerHTML = __lessons[index + 1].getAttribute("name");
  }
  else{
    __tooltipNext.innerHTML = "";
  }

  if(index > 0){
  __tooltipPrev.innerHTML = __lessons[index - 1].getAttribute("name");
  }
  else {
    __tooltipPrev.innerHTML = "";
  }
  cathMedia();
  highlightTOC(index);
}

function cathMedia()
{
  __currentSubtitle = 0;
  __video = __courseContainer.getElementsByTagName("video");
  if(__video.length > 0){
    __subtitles = __page.getElementsByTagName("subtitles")[0].getElementsByTagName("subtitle");
    console.log("has video | subtitles " + __subtitles.length);
    __videoTimeInternal = setInterval(checkVideoTime, 100);
  }
}

function checkVideoTime()
{
/*
  for(var i = 0; i < __subtitles.length; i++)
  {
    var start = parseInt(__subtitles[i].getAttribute("start"));
    var end = parseInt(__subtitles[i].getAttribute("end"));
    console.log(__video[0].currentTime + " | start " + start + " | end " + end);
    var time = __video[0].currentTime;
    if(time >= start && time <= end)
    {
      console.log("awiwi");
      eval(__subtitles[i].textContent);
    }
  } */
  console.log(__currentSubtitle + " vs " + __subtitles.length);
  //console.log("__video.ended " + __video[0].ended);
  if(__video[0].ended)
  {
    clearInterval(__videoTimeInternal);
    //console.log("---subtitles ends");
    nextPage();
    return;
  }
  var start = parseInt(__subtitles[__currentSubtitle].getAttribute("start"));
  var end = parseInt(__subtitles[__currentSubtitle].getAttribute("end"));
  //console.log(__video[0].currentTime + " | start " + start + " | end " + end);
  var time = __video[0].currentTime;
  if(time >= start && time <= end)
  {
    eval(__subtitles[__currentSubtitle].textContent);
    __currentSubtitle ++;
  }
}

function loadScript()
{
  var script = __page.getElementsByTagName("script")[0];
  if(script != undefined)
  {
    //console.log(script.textContent);
    eval(script.textContent);
  }
}

function setEvents(){
  __blockEvent = true;
  __frame = 0;
  __events = undefined;
  clearInterval(__frameInterval);
  //__eventPlayed = 0;

  playCourse();
}

function playCourse()
{
  console.log("playCourse()");
  __playButton.classList.remove("pause");
  __playButton.classList.add("play");
  if(__page.getElementsByTagName("events")[0] != undefined)
  {
    __events = __page.getElementsByTagName("events")[0].getElementsByTagName("event");
    __blockEvent = false;
    __frameInterval = setInterval(playFrame, __frameRate);
  }
}

function pauseCourse()
{
  console.log("pauseCourse()");
  clearInterval(__frameInterval);
  __blockEvent = true;
  __playButton.classList.add("pause");
  __playButton.classList.remove("play");
}

function playFrame(){
  var milisecondTime = (__frame * 100);
  var totalEvents = __events.length;
  //console.log("playFrame(): playEvent = " + __frame + " | __blockEvent : " + __blockEvent + " | __isPaused : " + __isPaused);
  if(!__blockEvent)
  {
    for (var i:number = 0; i < totalEvents; i++){
        var sTime:number = Number(__events[i].getAttribute("time"));
        var timing:number = sTime * 1000;
        //console.log(i + " of " + totalEvents + " totalEvents");
        if(__blockEvent){return}
        if(timing == milisecondTime)
        {
          /*
          console.log("--- Play frame : " + __frame + " second: " + sTime + " ... comes from event " + i);
          __eventPlayed ++;
          if(__eventPlayed == totalEvents)
          {
            clearInterval(__frameInterval);
            console.log("events end");
          }
          */
          if(!__blockEvent)
          {
            eval(__events[i].textContent);
            console.log("---Event found");
          }
          else{
            clearInterval(__frameInterval);
          }
          break;
        }
      }
      __frame++;
  }
  else{
    clearInterval(__frameInterval);
  }

}

function setLessonCounter(){
  __counter.innerHTML = (__pageCounter + 1) + " / " + __totalPages;
  var percentage:number = ((__pageCounter + 1) * 100) / __totalPages;
  __AdvanceBar.getElementsByTagName("div")[0].style.width = percentage + "%";
}

function checkMobile(){
  if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent)
      || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4))) {
      __isMobile = true;
    }
    else {
      __isMobile = false;
    }
    console.log("__isMobile = " + __isMobile);
}

function nextPage(){
  if(__pageCounter < (__totalPages -1)){
    __pageCounter ++;
    setCourseContent(__pageCounter);
    setVisited(__pageCounter);
    setLessonLocation(__pageCounter);
  }
}

function prevPage(){
  if(__pageCounter > 0){
    __pageCounter --;
    setCourseContent(__pageCounter);
    setLessonLocation(__pageCounter);
  }
}

function setLessonLocation(location:number)
{
  if(__LMSInitialized != false)
  {
    doLMSSetValue( "cmi.core.lesson_location", location );
  }
}

function setVisited(id:number)
{
  console.log("setVisited " + id);
  for(var i:any = 0; i <= __visited.length; i++)
  {
    if(__visited[i] == id)
    {
      console.log("find " + id);
      break;
    }else {
      console.log("added " + id);
      __visited.push(id);
      break;
    }
  }
}

function set_uiElements()
{
  __nextButton = document.getElementById("Button_Next");
  __prevButton = document.getElementById("Button_Prev");
  __tocButton = document.getElementById("Button_TOC");
  __counter = document.getElementById("Counter");
  __AdvanceBar = document.getElementById("Advance_Bar");
  __playButton = document.getElementById("Button_Play");
  __reloadButton = document.getElementById("Button_Reload");
  __tooltipNext = document.getElementById("Next_Page_Tooltip");
  __tooltipPrev = document.getElementById("Prev_Page_Tooltip");
  __ui = document.getElementById("Course_UI");
  __uiButton = document.getElementById("Button_showUI");
  __nextButton.addEventListener("click", nextPage);
  __nextButton.addEventListener("mouseover", function(){__tooltipNext.style.display = "block";});
  __nextButton.addEventListener("mouseout", function(){__tooltipNext.style.display = "none";});
  __prevButton.addEventListener("click", prevPage);
  __prevButton.addEventListener("mouseover", function(){__tooltipPrev.style.display = "block";});
  __prevButton.addEventListener("mouseout", function(){__tooltipPrev.style.display = "none";});
  __tocButton.addEventListener("click", showTOC);
  __playButton.addEventListener("click", tooglePlayPause);
  __reloadButton.addEventListener("click", reload);
  document.getElementById("Button_Size").addEventListener("click", function(){__isWindowed = !__isWindowed; if(__isMobile){ if(!__isWindowed){document.body.requestFullscreen();}else{document.exitFullscreen();}}else{ windowedCourse(); }});
  document.getElementById("Button_Close").addEventListener("click", function(){window.close();});
  __uiButton.addEventListener("click", showUI);
}

function windowedCourse(){
  if(__isMobile)
  {
    //1.333333333333333‬ ipad
    //2.165333333333333 iphonex
    //1.77777777777778 1280 * 720 HD

    var aspecRatio = window.innerWidth / window.innerHeight;
    var x:number;

    if(aspecRatio < 1.7){
      x = window.innerWidth * .5625;
      /*
      __displayWindow.style.width = "100%";
      __displayWindow.style.height = x + "px";
      __displayWindow.style.left = 0 + "px";
      __displayWindow.style.top = (window.innerHeight / 2) - (x / 2) + "px" ;
      console.log(" is less than 1.7 ---- " + x);
      //iPad when fit with width.
*/
//------------------------------


      var scale = ((window.innerWidth * 100) / __courseWidth) / 100;
      var translateX = ((__courseWidth - window.innerWidth) / scale) / 2;
      var translateY = ((__courseHeight - window.innerHeight)  / scale) / 2;
      __displayWindow.style.width = __courseWidth + "px";
      __displayWindow.style.height =  __courseHeight + "px";
      __displayWindow.style.left = 0 + "px";
      __displayWindow.style.top = 0 + "px";
      __displayWindow.style.transform = ("scale(" + scale + ") translate(" + (translateX * -1) + "px, " + ( translateY * -1 )+"px)");

    }else{
      x = window.innerHeight * 1.77777777777778;
      /*
      __displayWindow.style.width = x + "px";
      __displayWindow.style.height = "100%";
      __displayWindow.style.left = (window.innerWidth / 2) - (x / 2) + "px";
      __displayWindow.style.top = 0 + "px";
      */
      console.log("is more than 1.7 --- " + x);
      //when fit to height.

      //------------------------------------------------
      var scale = ((window.innerHeight * 100) / __courseHeight) / 100;
    //  var translateX = (__courseWidth - window.innerWidth) * scale;
    var translateX = ((__courseWidth - window.innerWidth) / scale) / 2;
      var translateY = ((__courseHeight - window.innerHeight)  / scale) / 2;

      //alert("(window.innerHeight = " + window.innerHeight + " | window.outerHeight = " + window.outerHeight + " | scale = " + scale + " | translateX = " + translateY  + " | translateY = " + translateY);

      __displayWindow.style.width = __courseWidth + "px";
      __displayWindow.style.height =  __courseHeight + "px";
      //__displayWindow.style.left = (window.innerWidth / 2) - ((x * scale) / 2) + "px";
      __displayWindow.style.left = 0 +"px";

      __displayWindow.style.top = 0 + "px";

      __displayWindow.style.transform = ("scale(" + scale + ") translate(" + (translateX * -1) + "px, " + ( translateY * -1 )+"px)");
      /*
      __displayWindow.style.webkitTransform = ("scale(" + scale + ")");
    __displayWindow.style.MozTransform = ("scale(" + scale + ")");
    __displayWindow.style.msTransform = ("scale(" + scale + ")");
    __displayWindow.style.OTransform = ("scale(" + scale + ")"); */

    }
  }
  else {
    if(__isWindowed)
    {
      __displayWindow.style.width = __courseWidth + "px";
      __displayWindow.style.height = __courseHeight + "px";
      __displayWindow.style.left = (window.innerWidth / 2) - (__courseWidth / 2) + "px";
      __displayWindow.style.top = (window.innerHeight / 2) - (__courseHeight / 2) + "px";
    }
    else {
      if(window.innerHeight > __courseHeight){
        var w = Math.round((window.innerHeight / 9) * 16);
        __displayWindow.style.width = w + "px";
        __displayWindow.style.height = window.innerHeight + "px";
        __displayWindow.style.left = (window.innerWidth / 2) - (w / 2) + "px";
        __displayWindow.style.top = 0 + "px";
      }
      else {
        __displayWindow.style.width = __courseWidth + "px";
        __displayWindow.style.height = __courseHeight + "px";
        __displayWindow.style.left = (window.innerWidth / 2) - (__courseWidth / 2) + "px";
        __displayWindow.style.top = 0 + "px";
      }
    }
  }
}

function loadTOC(){
  console.log("loadTOC");
  __toc = document.getElementById("TOC");
/*
  var entryTitle = document.createElement("div");
  var entryContent = document.createElement("p");
  entryTitle.classList.add("TOCtitle");
  entryContent.innerHTML = __courseName;
  entryTitle.appendChild(entryContent);
  __toc.appendChild(entryTitle);
*/
  var id:number = 0;
  var moduleList:HTMLCollectionOf<Element> = __course.getElementsByTagName("course")[0].getElementsByTagName("module");

  for(var i:any = 0; i < moduleList.length; i ++)
  {
    console.log("Module " + i);
    var ModuleName:string = moduleList[i].getAttribute("name");
    var lessonList:HTMLCollectionOf<Element> = __course.getElementsByTagName("course")[0].getElementsByTagName("module")[i].getElementsByTagName("lesson");
    var quiz:HTMLCollectionOf<Element> = __course.getElementsByTagName("course")[0].getElementsByTagName("module")[i].getElementsByTagName("quiz");

    addTOCelement(ModuleName, i, true);

    for(var j:any = 0; j < lessonList.length; j++){
      var lessonName:string = lessonList[j].getAttribute("name");
      __lessons.push(lessonList[j]);
      addTOCelement(lessonName, id, false);
      id++;
      console.log("Lesson " + id );
    }
    for(var k:any = 0;k < quiz.length; k++){
      console.log("Quiz ---" + k);
      var quizName:string = quiz[k].getAttribute("name");
      __lessons.push(quiz[k]);
      addTOCelement(quizName, id, false);
      id++;
    }
  }
}

function addTOCelement(name:string, id:number, isModule:boolean)
{
  var entry:HTMLElement = document.createElement("div");
  var p:HTMLElement = document.createElement("p");
  if(!isModule)
  {
    entry.addEventListener("click", function(){
      var i:number = parseInt(this.getAttribute("goto"),10);
      __pageCounter = i;
      setCourseContent( i );
      hideTOC();});

    entry.classList.add("TOCListElement");
    entry.setAttribute("id", "L" + id.toString());
    entry.setAttribute("goto",  id.toString());
  }
  else {
    entry.classList.add("TOCModuleElement");
    entry.setAttribute("id", "M" + id.toString());
  }

  //entry.classList.add("TOCListElementDisable");
  //TODO read from supend data
  p.innerHTML = name;
  entry.appendChild(p);
  __toc.appendChild(entry);
}

function showTOC()
{
  if(__toogleTOC)
  {
    __toc.style.display = "none";
  }
  else {
    __toc.style.display = "block";
  }
  __toogleTOC = !__toogleTOC;
}

function hideTOC(){
  __toogleTOC = false;
  __toc.style.display = "none";

}

function highlightTOC(id:number){
  var all:any = __toc.getElementsByClassName("highlightTOC");
  for(var i:number = 0; i < all.length; i++){
    all[i].classList.remove("highlightTOC");
  }
  var e:HTMLElement = document.getElementById("L"+ id);
  e.classList.add("highlightTOC");
}

window.addEventListener("orientationchange", function() { checkHorizontal(); }, false);

function checkHorizontal()
{
  var __PortraitAlert = document.getElementById("PortraitAlert");
  if(window.orientation == 0 || window.orientation == 1)
  {
    __PortraitAlert.style.display = "block";
    __portraitAlertCenter = (window.innerHeight / 2) - ((window.innerWidth * 0.66) / 2);
    if(window.innerHeight < window.innerWidth)
    {
      /*TODO review if you can enter here
      var timmerDelay:any = setTimeout(function(){
        __portraitAlertCenter = (window.innerHeight / 2) - ((window.innerWidth * 0.66) / 2);
        document.getElementById("PortraitAlert").getElementsByTagName("img")[0].style.top = __portraitAlertCenter + "px";
      }, 250);
      */
    }
    else{
      document.getElementById("PortraitAlert").getElementsByTagName("img")[0].style.top = __portraitAlertCenter + "px";
    }
  }
  else{
    __PortraitAlert.style.display = "none";
  }
}

function tooglePlayPause()
{
  __isPaused = !__isPaused;
  play_pause(__isPaused);
}

function play_pause(isPaused:boolean)
{
  __isPaused = isPaused;
  var audios = document.getElementsByTagName("audio");
  var videos = document.getElementsByTagName("video");
  console.log(audios.length + "|" + videos.length);
  if(audios.length > 0)
  {
    console.log("playing audios ");
    for(var i:any = 0; i < audios.length; i++)
    {
      console.log("pausing " + i);
      if(__isPaused)
      {
        audios[i].pause();
      }
      else {
        audios[0].play();
      }
    }
  }
  if(videos.length > 0)
  {
    console.log("playing audios ");
    for(i=0;i<videos.length;i++)
    {
      console.log("pausing " + i);
      if(__isPaused)
      {
        videos[i].pause();
      }
      else {
        videos[0].play();
      }
    }
  }
  if(__isPaused)
  {
    pauseCourse();
  }
  else {
    playCourse();
  }
}

function pause(){
    __isPaused = true;
    play_pause(__isPaused);
}

function play(){
    __isPaused = false;
    play_pause(__isPaused);
}

document.addEventListener('keydown', function(event) {
  console.log(event.code);
  if (event.code == "ArrowRight") {
    nextPage();
  }
  if (event.code == "ArrowLeft") {
    prevPage();
  }
  if (event.code == "Space") {
    tooglePlayPause();
  }
});

function showUI(){
  __toogleUI = !__toogleUI;
  if(__toogleUI){
    __ui.style.display = "block";
    __uiButton.classList.add("hideUI");
  }
  else{
    __ui.style.display = "none";
    __uiButton.classList.remove("hideUI");
  }
}

function goTo(goFrame:number){
  __frame = goFrame * 10;
  playCourse();
}

function goToAndStop(goFrame:number){
  __frame = goFrame * 10;
  var milisecondTime = (__frame * 100);
  __blockEvent = true;
  clearInterval(__frameInterval);
  var totalEvents = __events.length;
  console.log("---------------------goToAndStop = " + __frame + " | __blockEvent = " + __blockEvent);

  for (var i:any = 0; i < totalEvents; i++){
      var sTime:number = Number(__events[i].getAttribute("time"));
      var timing:number = sTime * 1000;
      if(timing == milisecondTime)
      {
        eval(__events[i].textContent);
        return;
      }
  }
}

function goToAndPlay(goFrame:number){
  console.log("goToAndPlay()");
  clearInterval(__frameInterval);
  __blockEvent = false;
  __frame = (goFrame * 10);
  __frameInterval = setInterval(playFrame, __frameRate);
}

function configReviewItems(nItems:number){
  __reviewPool = [];

  for(var i = 0; i < nItems; i++){
    __reviewPool[i] = false;
  }
}

function setReviewItem(nItem:number){
    __reviewPool[nItem - 1] = true;
}

function checkReviewItems(frameToGo:number){
  console.log("checkReviewItems");
  for(var i = 0; i < __reviewPool.length; i++){
    if(__reviewPool[i] == false){
      console.log("return.......");
      return;
    }
  }
  console.log("action..................................... frame = " + frameToGo);
  goToAndPlay(frameToGo);
}

function stop()
{
  clearInterval(__frameInterval);
  __blockEvent = true;
  console.log("---stop()---");
}

function reload()
{
  setCourseContent(__pageCounter);
}
