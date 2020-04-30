console.log("DavEngine v0.3");

/* TODO
  +save leson_location scorm
  +save data
  +reload button
  +copyright info loaded by date.year
  + is needed glossary or help?
*/

var __courseLocation = "course/course.xml";
var __course;
var __isMobile = false;
var __pageCounter = 0;
var __totalPages;
var __courseName;

var __nextButton;
var __prevButton;
var __tocButton;
var __isWindowed;
var __courseWindow;
var __courseWidth;
var __courseHeight;
var __displayWindow;
var __toc;
var __toogleTOC = false;

var __visited = [];
var __counter;

document.addEventListener('DOMContentLoaded', init, false);
window.addEventListener('resize', windowedCourse);

function init(){
  console.log("init---");
  checkMobile();
  loadCourse(__courseLocation);
}

function loadCourse(src){
  console.log("loadCourse---");
  var requestCourse;
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
    courseConfig();
};

requestCourse.onerror = function() { // only triggers if the request couldn't be made at all
  alert("Network Error");
};

requestCourse.onprogress = function(event) { // triggers periodically
  console.log("on progress start ------------------------");
  console.log('Received'+ event.loaded + ' of ' + event.total);
};

    requestCourse.setRequestHeader("Content-Type", "text/xml");
    requestCourse.send();
    console.log("it was sended");
    //course = requestCourse.responseXML;
    //console.log("course - " + course);

console.log("----------------------------------- on progress ends");
}

function courseConfig()
{
  __totalPages = __course.getElementsByTagName("lesson").length;
  __courseName = __course.getElementsByTagName("course")[0].getAttribute("name");
  __isWindowed = (__course.getElementsByTagName("course")[0].getAttribute("windowed") == "true");
  __displayWindow = document.getElementById("Course");
  __courseWidth = parseInt(__course.getElementsByTagName("course")[0].getAttribute("width"));
  __courseHeight = parseInt(__course.getElementsByTagName("course")[0].getAttribute("height"));
  document.getElementById("Welcome_UI").addEventListener("click", function(){setCourseContent(0); this.style.display = "none";});
  windowedCourse();
  setCourseName(__courseName);
  set_uiElements();
  //setCourseContent(0);
  loadTOC();
  setLessonCounter();
}

function setCourseName(name){
  document.getElementById("Course_Name").innerHTML = name;
}

function setCourseContent(index){
  var page = __course.getElementsByTagName("lesson")[index];
  document.getElementById('Course_Content').innerHTML = "";
  document.getElementById("Course_Content").innerHTML = page.getElementsByTagName("content")[0].textContent;
  loadScript(index);

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
}

function loadScript(index)
{
  var script = __course.getElementsByTagName("lesson")[index].getElementsByTagName("script")[0];
  if(script != undefined)
  {
    //console.log(script);
    eval(script.textContent);
    //alert(script.textContent);
  }
}

function setLessonCounter(){
  __counter.innerHTML = (__pageCounter + 1) + " / " + __totalPages;
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
  if(__pageCounter > 1){
    __pageCounter --;
    setCourseContent(__pageCounter);
    setLessonLocation(__pageCounter);
  }
}

function setLessonLocation(location)
{
  if(__LMSInitialized != "false")
  {
    doLMSSetValue( "cmi.core.lesson_location", location );
  }
}

function setVisited(id)
{
  console.log("setVisited " + id);
  for(i = 0; i <= __visited.length; i++)
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
  __nextButton.addEventListener("click", nextPage);
  __prevButton.addEventListener("click", prevPage);
  __tocButton.addEventListener("click", showTOC);
  document.getElementById("Button_Size").addEventListener("click", function(){__isWindowed = !__isWindowed; windowedCourse();});
  document.getElementById("Button_Close").addEventListener("click", function(){window.close();});
}

function windowedCourse(){

  if(__isMobile)
  {
    var w = (window.innerHeight / 9) * 16;
    __displayWindow.style.width = w + "px";
    __displayWindow.style.height = window.innerHeight + "px";
    __displayWindow.style.left = (window.innerWidth / 2) - (w / 2) + "px";
    __displayWindow.style.top = 0 + "px";
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
  __toc = document.getElementById("TOC");

  var entryTitle = document.createElement("div");
  var entryContent = document.createElement("p");
  entryTitle.classList.add("TOCtitle");
  entryContent.innerHTML = __courseName;
  entryTitle.appendChild(entryContent);
  __toc.appendChild(entryTitle);

  var id = 0;

  var moduleList = __course.getElementsByTagName("course")[0].getElementsByTagName("module");
  for(i = 0; i < moduleList.length; i++)
  {
    console.log("Module " + i);
    var ModuleName = moduleList[i].getAttribute("name");
    var lessonList = __course.getElementsByTagName("course")[0].getElementsByTagName("module")[i].getElementsByTagName("lesson");
    addTOCelement(ModuleName, i, true)
    for(j = 0; j < lessonList.length; j++){
      var lessonName = lessonList[j].getAttribute("name");
      addTOCelement(lessonName, id, false)
      id++;
      console.log("Lesson " + id );
    }
  }
  console.log("loadTOC");
}

function addTOCelement(name, id, isModule)
{
  var entry = document.createElement("div");
  var p = document.createElement("p");
  if(!isModule)
  {
    entry.addEventListener("click", function(){var i = parseInt(this.getAttribute("id"),10); __pageCounter = i; setCourseContent( i ); });
    entry.classList.add("TOCListElement");
  }
  else {
    entry.classList.add("TOCModuleElement");
  }
  entry.setAttribute("id", id);
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

window.addEventListener("orientationchange", function() {
  // Announce the new orientation number
  alert(window.orientation);
  var __PortraitAlert = document.getElementById("PortraitAlert");
  if(window.orientation = 1)
  {
    __PortraitAlert.style.display = "block";
  }
  else{
    __PortraitAlert.style.display = "none";
  }
}, false);
