var __version:number = 20210211;
console.log("Davinci e-learning player version:" + __version + " /n by David Barreto");
/*TODO
- create an array whith all info into slides
- create a xml to word
- add load method check the behavior on sequences and made for video and audio
*/
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
var __tocList:HTMLElement;
var __ui:HTMLElement;
var __uiButton:HTMLElement;
var __toogleTOC:boolean = false;
var __toogleUI:boolean = false;
var __visited:any[] = [];
var __counter:HTMLElement;
var __AdvanceBar:HTMLElement;
var __portraitAlertCenter:number;
var __frame:number;
var __events:any = null;
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
declare var doLMSInitialize:any;
declare var doLMSSetValue:any;
declare var doLMSGetValue:any;
declare var doLMSCommit:any;
declare var loadQuiz:any;
var __isPlayEnable:boolean = false;
var __cover:HTMLElement;
var __audio:any;
var __audioInterval:any;
var __volumeControl:any;
var __volumeButton:HTMLElement;
var __isMute:boolean = false;
var __suspendDataVisited:any;
var __suspendData:string = "";
var __isiE:boolean = false;
var __isEdge:boolean = false;
var __mainAudio:any;
var __fxAudio:any;
var __testMode:boolean = false;
var __suspendDataAttemps:any;
var __attemps:any[] = [];
var __scale:number = 1;
var __isHackeable:boolean = false;
var __spacePressed :boolean= false;
var __sessionStatTime:Date = new Date();
var __guide:HTMLElement;
var __guideInterval:any;
var __isGuide:boolean = false;
var __addonsPath:string = "bin/addons/addons.xml";
var __addons:XMLDocument;
var __aboutButton:HTMLElement;
var __about:HTMLElement;
var __fastMode:boolean = false;
declare var domtoimage:any;
declare var saveAs:any;
declare var FileSaver:any;
document.addEventListener('DOMContentLoaded', init, false);
window.addEventListener('resize', windowedCourse);
window.addEventListener("click", hideTOC);
window.addEventListener("orientationchange", function () { checkHorizontal(); }, false);
function init() {
    //console.log("init---");
    __isiE = msieversion();
    __isEdge = edgeversion();
    checkMobile();
    checkHorizontal();
    loadCourse(__courseLocation);
    loadAddons(__addonsPath);
    checkLMS();
}
function loadCourse(src:string) {
    //console.log("loadCourse---");
    var requestCourse:any;
    if (window.XMLHttpRequest) {
        requestCourse = new XMLHttpRequest();
    }
    else { // IE 5/6
        requestCourse = new ActiveXObject("Microsoft.XMLHTTP");
    }
    requestCourse.overrideMimeType('text/xml');
    requestCourse.open('GET', src);
    requestCourse.onload = function () {
        //console.log("on load start ------------------------");
        __course = requestCourse.responseXML;
        //console.dir(__course);
        courseConfig();
    };
    requestCourse.onerror = function () {
        alert("Network Error");
    };
    requestCourse.onprogress = function (event:any) {
        console.log("on progress start ------------------------");
        console.log('Received'+ event.loaded + ' of ' + event.total);
        console.log("----------------------------------- on progress ends");
    };
    requestCourse.setRequestHeader("Content-Type", "text/xml");
    requestCourse.send();
}
function courseConfig() {
    __displayWindow = document.getElementById("Course");
    __totalPages = __course.getElementsByTagName("lesson").length + __course.getElementsByTagName("quiz").length;
    //__courseName = __course.getElementsByTagName("course")[0].getAttribute("name");
    __isWindowed = (__course.getElementsByTagName("course")[0].getAttribute("windowed") == "true");
    __courseWidth = parseInt(__course.getElementsByTagName("course")[0].getAttribute("width"));
    __courseHeight = parseInt(__course.getElementsByTagName("course")[0].getAttribute("height"));
    __courseContainer = document.getElementById("Course_Content");
    __mainAudio = document.getElementById("main_audio");
    __fxAudio = document.getElementById("fx_audio");
    __guide = document.getElementById("Guide");
    __about = document.getElementById("About");
    __isGuide = (__course.getElementsByTagName("course")[0].getAttribute("guide") == "true");
    windowedCourse();
    //setCourseName(__courseName);
    set_uiElements();
    loadTOC();
    setCourseStatus();
    if ((__LMSInitialized) && (__suspendData != "")) {
        //console.log("__visited = " + __visited.toString());
        for (var i = 0; i < __visited.length; i++) {
            unlockTOC(__visited[i] - 1);
        }
    }
    setLessonCounter();
    if (__testMode) {
        //console.log("--- Test Mode ---");
        for (var i = 0; i < __totalPages; i++) {
            unlockTOC(i);
        }
    }
}
function setCourseName(name:string) {
    document.getElementById("Course_Name").innerHTML = name;
}
function clearCourseContainer() {
    clearInterval(__frameInterval);
    clearInterval(__videoTimeInternal);
    clearInterval(__audioInterval);
    __audio = undefined;
    __courseContainer.innerHTML = "";
    hideTOC();
}
function setCourseContent(index:number) {
    //console.log("setCourseContent " + index);
    playAudio("");
    playFxAudio("");
    pauseAudio();
    disableNext();
    for (var i = 0; i < __visited.length; i++) {
        //console.log("check to enable next " + __visited[i] + " vs " + (index+1));
        if (__visited[i] == (index + 1)) {
            enableNext();
        }
    }
    __isPaused = false;
    __page = __lessons[index];
    var type = __page.tagName;
    clearCourseContainer();
    if (type == "lesson") {
        __courseContainer.innerHTML = __page.getElementsByTagName("content")[0].textContent;
        setEvents();
        loadScript();
    }
    if (type == "quiz") {
        loadQuiz(__lessons[index].getAttribute("file"));
    }
    if (index == 0) {
        __prevButton.style.display = "none";
    }
    else {
        __prevButton.style.display = "block";
    }
    if (index == (__totalPages - 1)) {
        __nextButton.style.display = "none";
    }
    else {
        __nextButton.style.display = "block";
    }
    setLessonCounter();
    if (index < (__totalPages - 1)) {
        __tooltipNext.innerHTML = __lessons[index + 1].getAttribute("name");
    }
    else {
        __tooltipNext.innerHTML = "";
    }
    if (index > 0) {
        __tooltipPrev.innerHTML = __lessons[index - 1].getAttribute("name");
    }
    else {
        __tooltipPrev.innerHTML = "";
    }
    cathMedia();
    highlightTOC(index);
    setLessonLocation(index + 1);
}
function cathMedia() {
    //console.log("catchMedia");
    __currentSubtitle = 0;
    __video = __courseContainer.getElementsByTagName("video");
    if (__video.length > 0) {
        __subtitles = __page.getElementsByTagName("subtitles")[0].getElementsByTagName("subtitle");
        //console.log("has video | subtitles " + __subtitles.length);
        __videoTimeInternal = setInterval(checkVideoTime, __frameRate);

        play_pause(true);
        __video[0].addEventListener("canplay", videoWithBuffer);
    }
    if (__isMute) {
        mute();
    }
    else {
        setVolume();
    }
    //console.log("catchMedia ends ---");
}
function checkVideoTime() {
    /*
      for(var i = 0; i < __subtitles.length; i++)
      {
        var start = parseInt(__subtitles[i].getAttribute("start"));
        var end = parseInt(__subtitles[i].getAttribute("end"));
        //console.log(__video[0].currentTime + " | start " + start + " | end " + end);
        var time = __video[0].currentTime;
        if(time >= start && time <= end)
        {
          //console.log("awiwi");
          eval(__subtitles[i].textContent);
        }
      } */
    //console.log(__currentSubtitle + " vs " + __subtitles.length);
    //console.log("__video.ended " + __video[0].ended);
    if (__video[0].ended) {
        clearInterval(__videoTimeInternal);
        //console.log("---subtitles ends");
        nextPage();
        return;
    }
    //console.log("__currentSubtitle " + __currentSubtitle + " | __subtitles.length " + __subtitles.length);
    if (__currentSubtitle == __subtitles.length) {
        return;
    }
    var start = parseInt(__subtitles[__currentSubtitle].getAttribute("start"));
    var end = parseInt(__subtitles[__currentSubtitle].getAttribute("end"));
    //console.log(__video[0].currentTime + " | start " + start + " | end " + end);
    var time = __video[0].currentTime;
    if (time >= start && time <= end) {
        eval(__subtitles[__currentSubtitle].textContent);
        __currentSubtitle++;
    }
}
function loadScript() {
    var script = __page.getElementsByTagName("script")[0];
    if (script != undefined) {
        //console.log(script.textContent);
        eval(script.textContent);
    }
}
function setEvents() {
    __blockEvent = true;
    __frame = 0;
    __events = undefined;
    clearInterval(__frameInterval);
    //__eventPlayed = 0;
    playCourse();
}
function playCourse() {
  //console.log("playCourse()");
  __playButton.classList.remove("pause");
  __playButton.classList.add("play");
  if(__page != undefined){
    if (__page.getElementsByTagName("events")[0] != undefined) {
        __events = __page.getElementsByTagName("events")[0].getElementsByTagName("event");
        __blockEvent = false;
        __frameInterval = setInterval(playFrame, __frameRate);
    }
  }
}

function pauseCourse() {
    //console.log("pauseCourse()");
    clearInterval(__frameInterval);
    __blockEvent = true;
    __playButton.classList.add("pause");
    __playButton.classList.remove("play");
}
function playFrame() {
    var milisecondTime = (__frame * 100);
    var totalEvents = __events.length;
    //console.log("playFrame(): playEvent = " + __frame + " | __blockEvent : " + __blockEvent + " | __isPaused : " + __isPaused);
    if (!__blockEvent) {
        for (var i = 0; i < totalEvents; i++) {
            var sTime = Number(__events[i].getAttribute("time"));
            var timing = Math.round(sTime * 1000);
            //console.log(i + " of " + totalEvents + " totalEvents");
            if (__blockEvent) {
                return;
            }
            if (timing == milisecondTime) {
                /*
                //console.log("--- Play frame : " + __frame + " second: " + sTime + " ... comes from event " + i);
                __eventPlayed ++;
                if(__eventPlayed == totalEvents)
                {
                  clearInterval(__frameInterval);
                  //console.log("events end");
                }
                */
                if (!__blockEvent) {
                    var script = __events[i].textContent;
                    if (__fastMode) {
                        script = script.replace("nextPage();", "");
                    }
                    eval(script);
                    //console.log("---Event found");
                }
                else {
                    clearInterval(__frameInterval);
                }
                break;
            }
        }
        __frame++;
    }
    else {
        clearInterval(__frameInterval);
    }
}
function setLessonCounter() {
    __counter.innerHTML = (__pageCounter + 1) + " / " + __totalPages;
    var percentage = ((__pageCounter + 1) * 100) / __totalPages;
    __AdvanceBar.getElementsByTagName("div")[0].style.width = percentage + "%";
}
function checkMobile() {
    if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent)
        || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0, 4))) {
        __isMobile = true;
    }
    else {
        __isMobile = isIpad();
    }
    //console.log("__isMobile = " + __isMobile);
}
function nextPage() {
    if (__pageCounter < (__totalPages - 1)) {
        __pageCounter++;
        setVisited(__pageCounter);
        //setLessonLocation(__pageCounter);
        setCourseContent(__pageCounter);
        if (__pageCounter == (__totalPages - 1)) {
            doLMSSetValue("cmi.core.lesson_status", "completed");
            doLMSCommit();
        }
    }
}
function enableNext() {
    __isPlayEnable = true;
    __nextButton.classList.remove("disable");
}
function disableNext() {
    __isPlayEnable = false;
    __nextButton.classList.add("disable");
}
function prevPage() {
    if (__pageCounter > 0) {
        __pageCounter--;
        //setLessonLocation(__pageCounter);
        setCourseContent(__pageCounter);
    }
}
function setLessonLocation(location:number) {
    if (__LMSInitialized) {
        doLMSSetValue("cmi.core.lesson_location", location);
        doLMSCommit();
    }
}
function setVisited(id:number) {
    //console.log("setVisited " + id);
    for (var i = 0; i <= __visited.length; i++) {
        if (__visited[i] == id) {
            //console.log("find " + id);
            return;
        }
    }
    __visited.push(id);
    sessionTime();
    saveSuspendData();
    unlockTOC(id - 1);
}
function set_uiElements() {
    __cover = document.getElementById("Welcome_UI");
    setWelcomeInfo();
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
    __volumeControl = document.getElementById("Volume_Silider");
    __volumeButton = document.getElementById("Button_Volume");
    __nextButton.addEventListener("click", function () { if (__isPlayEnable && !__isGuide) {
        nextPage();
    } });
    //__nextButton.addEventListener("mouseover", function(){__tooltipNext.style.display = "block";});
    //__nextButton.addEventListener("mouseout", function(){__tooltipNext.style.display = "none";});
    __prevButton.addEventListener("click", function () { if (!__isGuide) {
        prevPage();
    } });
    //__prevButton.addEventListener("mouseover", function(){__tooltipPrev.style.display = "block";});
    //__prevButton.addEventListener("mouseout", function(){__tooltipPrev.style.display = "none";});
    __tocButton.addEventListener("click", showTOC);
    __playButton.addEventListener("click", function () { if (!__isGuide) {
        tooglePlayPause();
    } });
    __reloadButton.addEventListener("click", function () { if (!__isGuide) {
        reload();
    } });
    //document.getElementById("Button_Size").addEventListener("click", function(){__isWindowed = !__isWindowed; if(__isMobile){ if(!__isWindowed){document.body.requestFullscreen();}else{document.exitFullscreen();}}else{ windowedCourse(); }});
    //document.getElementById("Button_Close").addEventListener("click", function(){window.close();});
    __uiButton.addEventListener("click", function () { if (!__isGuide) {
        showUI();
    } });
    __volumeControl.oninput = function () { setVolume(); };
    __volumeButton.addEventListener("click", function () { if (!__isGuide) {
        toogleMute();
    } });
    if (__isiE) {
        __volumeControl.classList.add("iESlider");
    }
    if (__isEdge) {
        __volumeControl.classList.add("EdgeSlider");
    }
    __aboutButton = document.getElementById("Button_Info");
    __aboutButton.addEventListener("click", function () { if (!__isGuide) {
        about();
    } });
    __about.addEventListener("click", closeAbout);
}
function windowedCourse() {
    //console.log("windowedCourse");
    if (__isMobile) {
        //1.333333333333333‬ ipad
        //2.165333333333333 iphonex
        //1.77777777777778 1280 * 720 HD
        var aspecRatio = window.innerWidth / window.innerHeight;
        //console.log("aspecRatio:" + aspecRatio);
        if (aspecRatio < 1.8) {
            //console.log("aspecRatio is less");
            /*
            __displayWindow.style.width = "100%";
            __displayWindow.style.height = x + "px";
            __displayWindow.style.left = 0 + "px";
            __displayWindow.style.top = (window.innerHeight / 2) - (x / 2) + "px" ;
            //console.log(" is less than 1.7 ---- " + x);
            //iPad when fit with width.
      */
            //------------------------------
            var scale = ((window.innerWidth * 100) / __courseWidth) / 100;
            __scale = scale;
            //var translateX = ((__courseWidth - window.innerWidth) / scale) / 2;
            var translateY = (window.innerHeight - (__courseHeight * scale)) / 2;
            __displayWindow.style.width = __courseWidth + "px";
            __displayWindow.style.height = __courseHeight + "px";
            __displayWindow.style.left = 0 + "px";
            __displayWindow.style.top = 0 + "px";
            __displayWindow.style.transform = ("scale(" + scale + ") translate(" + 0 + "px, " + translateY + "px)");
        }
        else {
            //console.log("aspecRatio is more");
            /*
            __displayWindow.style.width = x + "px";
            __displayWindow.style.height = "100%";
            __displayWindow.style.left = (window.innerWidth / 2) - (x / 2) + "px";
            __displayWindow.style.top = 0 + "px";
            */
            //when fit to height.
            //------------------------------------------------
            var scale = ((window.innerHeight * 100) / __courseHeight) / 100;
            __scale = scale;
            //var translateX = (__courseWidth - window.innerWidth) * scale;
            var translateX = (window.innerWidth - (__courseWidth * scale)) / 2;
            //var translateY = ((__courseHeight - window.innerHeight)  / scale) / 2;
            __displayWindow.style.width = __courseWidth + "px";
            __displayWindow.style.height = __courseHeight + "px";
            //__displayWindow.style.left = (window.innerWidth / 2) - ((x * scale) / 2) + "px";
            __displayWindow.style.left = 0 + "px";
            __displayWindow.style.top = 0 + "px";
            __displayWindow.style.transform = ("scale(" + scale + ") translate(" + translateX + "px, " + 0 + "px)");
            /*
            __displayWindow.style.webkitTransform = ("scale(" + scale + ")");
          __displayWindow.style.MozTransform = ("scale(" + scale + ")");
          __displayWindow.style.msTransform = ("scale(" + scale + ")");
          __displayWindow.style.OTransform = ("scale(" + scale + ")"); */
        }
    }
    else {
        if (__isWindowed) {
            __displayWindow.style.width = __courseWidth + "px";
            __displayWindow.style.height = __courseHeight + "px";
            __displayWindow.style.left = (window.innerWidth / 2) - (__courseWidth / 2) + "px";
            __displayWindow.style.top = (window.innerHeight / 2) - (__courseHeight / 2) + "px";
        }
        else {
            if (window.innerHeight > __courseHeight) {
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
function loadTOC() {
    //console.log("loadTOC");
    __toc = document.getElementById("TOC");
    __tocList = document.getElementById("TOC_List");
    /*
      var entryTitle = document.createElement("div");
      var entryContent = document.createElement("p");
      entryTitle.classList.add("TOCtitle");
      entryContent.innerHTML = __courseName;
      entryTitle.appendChild(entryContent);
      __toc.appendChild(entryTitle);
    */
    var id = 0;
    var moduleList = __course.getElementsByTagName("course")[0].getElementsByTagName("module");
    for (var i = 0; i < moduleList.length; i++) {
        //console.log("Module " + i);
        var ModuleName = moduleList[i].getAttribute("name");
        var lessonList = __course.getElementsByTagName("course")[0].getElementsByTagName("module")[i].getElementsByTagName("lesson");
        var quiz = __course.getElementsByTagName("course")[0].getElementsByTagName("module")[i].getElementsByTagName("quiz");
        addTOCelement(ModuleName, i, true);
        for (var j = 0; j < lessonList.length; j++) {
            var lessonName = lessonList[j].getAttribute("name");
            __lessons.push(lessonList[j]);
            addTOCelement(lessonName, id, false);
            id++;
            //console.log("Lesson " + id );
        }
        for (var k = 0; k < quiz.length; k++) {
            //console.log("Quiz ---" + k);
            var quizName = quiz[k].getAttribute("name");
            __lessons.push(quiz[k]);
            addTOCelement(quizName, id, false);
            id++;
        }
    }
}
function addTOCelement(name:string, id:number, isModule:boolean) {
    var entry = document.createElement("div");
    var p = document.createElement("p");
    var line = document.createElement("div");
    if (!isModule) {
        entry.addEventListener("click", function (event:any) {
            var block = this.classList.contains("TOCListElementDisable");
            //console.log("block = " + block);
            event.stopPropagation();
            if (!block) {
                var i = parseInt(this.getAttribute("goto"), 10);
                __pageCounter = i;
                setCourseContent(i);
                hideTOC();
            }
        });
        entry.classList.add("TOCListElement");
        entry.setAttribute("id", "L" + id.toString());
        entry.setAttribute("goto", id.toString());
        entry.classList.add("TOCListElementDisable");
    }
    else {
        entry.classList.add("TOCModuleElement");
        entry.setAttribute("id", "M" + id.toString());
    }
    p.innerHTML = name;
    entry.appendChild(p);
    entry.appendChild(line);
    __tocList.appendChild(entry);
}
function showTOC(event:any) {
    if (!__isGuide) {
        event.stopPropagation();
        if (__toogleTOC) {
            __toc.style.display = "none";
        }
        else {
            __toc.style.display = "block";
        }
        __toogleTOC = !__toogleTOC;
    }
}
function hideTOC() {
    __toogleTOC = false;
    __toc.style.display = "none";
}
function highlightTOC(id:number) {
    var all = __toc.getElementsByClassName("highlightTOC");
    for (var i = 0; i < all.length; i++) {
        all[i].classList.remove("highlightTOC");
    }
    var e = document.getElementById("L" + id);
    e.classList.add("highlightTOC");
}
function checkHorizontal() {
    var __PortraitAlert = document.getElementById("PortraitAlert");
    if (window.orientation == 0 || window.orientation == 1) {
        __PortraitAlert.style.display = "block";
        __portraitAlertCenter = (window.innerHeight / 2) - ((window.innerWidth * 0.66) / 2);
        if (window.innerHeight < window.innerWidth) {
            /*TODO review if you can enter here
            var timmerDelay:any = setTimeout(function(){
              __portraitAlertCenter = (window.innerHeight / 2) - ((window.innerWidth * 0.66) / 2);
              document.getElementById("PortraitAlert").getElementsByTagName("img")[0].style.top = __portraitAlertCenter + "px";
            }, 250);
            */
        }
        else {
            document.getElementById("PortraitAlert").getElementsByTagName("img")[0].style.top = __portraitAlertCenter + "px";
        }
    }
    else {
        __PortraitAlert.style.display = "none";
    }
}
function tooglePlayPause() {
    __isPaused = !__isPaused;
    play_pause(__isPaused);
}
function play_pause(isPaused:boolean) {
    __isPaused = isPaused;
    console.log("play_pause " + __isPaused);
    var videos = document.getElementsByTagName("video");
    if (__isPaused) {
        __mainAudio.pause();
        __fxAudio.pause();
    }
    else {
        console.log("__mainAudio src = " + __mainAudio.src);
        if(__mainAudio.src != "")
        {
          console.log("playing ...");
          var playAudioPromise = __mainAudio.play();

          if (playAudioPromise !== undefined) {
            playAudioPromise.then(function() {
            }).catch(function(error:string) {
              console.log("error: " + error);
            });
          }
        }

        if ((__fxAudio.currentTime != 0) && (!__fxAudio.ended)) {

            var playAudioFXPromise =  __fxAudio.play();;

            if (playAudioFXPromise !== undefined) {
              playAudioFXPromise.then(function() {
              }).catch(function(error:string) {
                console.log("error: " + error);
              });
            }
        }
    }
    if (videos.length > 0) {
        //console.log("playing videos ");
        if (__isPaused) {
            for (var i = 0; i < videos.length; i++) {
                //console.log("pausing " + i);
                videos[i].pause();
            }
        }
        else {
            videos[0].play();
        }
    }
    if (__isPaused) {
        pauseCourse();
    }
    else {
        playCourse();
    }
}
function pause() {
    __isPaused = true;
    play_pause(__isPaused);
}
function play() {
    __isPaused = false;
    play_pause(__isPaused);
}
var map = { 17: false, 39: false, 40: false };
document.addEventListener('keydown', function (event:any) {
    //console.log(event.code);
    //console.log(event.keyCode);
    if (event.code == "ArrowRight") {
        if (__isPlayEnable) {
            //console.log("ArrowRight");
            nextPage();
        }
    }
    if (event.code == "ArrowLeft") {
        prevPage();
    }
    if (event.code == "Space") {
        //console.log("SPACE KEY");
        if (!__spacePressed) {
            __spacePressed = true;
            tooglePlayPause();
            setTimeout(function () { __spacePressed = false; }, 750);
        }
    }
    if (event.code == "Escape") {
        closeAbout();
    }
    if (event.keyCode in map) {
        map[event.keyCode] = true;
        //console.log(map[17] + " - " + map[39]);
        if (map[17] && map[39]) {
            //console.log("hack nextPage"); nextPage();
        }
        if (map[17] && map[40]) {
            /*
              for(var i:number = 0; i < __totalPages; i++){
                unlockTOC(i);
              }
              */
            hackMode();
        }
    }
});
document.addEventListener("keyup", function (event:any) {
    if (event.keyCode in map) {
        map[event.keyCode] = false;
    }
});
function showUI() {
    __toogleUI = !__toogleUI;
    if (__toogleUI) {
        __ui.style.display = "block";
        __uiButton.classList.add("hideUI");
    }
    else {
        __ui.style.display = "none";
        __uiButton.classList.remove("hideUI");
    }
}
function goTo(goFrame:number) {
    __frame = goFrame * 10;
    playCourse();
}
function goToAndStop(goFrame:number) {
    __frame = goFrame * 10;
    var milisecondTime = (__frame * 100);
    __blockEvent = true;
    clearInterval(__frameInterval);
    var totalEvents = __events.length;
    //console.log("---------------------goToAndStop = " + __frame + " | __blockEvent = " + __blockEvent);
    for (var i = 0; i < totalEvents; i++) {
        var sTime = Number(__events[i].getAttribute("time"));
        var timing = sTime * 1000;
        if (timing == milisecondTime) {
            eval(__events[i].textContent);
            return;
        }
    }
}
function goToAndPlay(goFrame:number) {
    //console.log("goToAndPlay()");
    clearInterval(__frameInterval);
    __blockEvent = false;
    __frame = (goFrame * 10);
    __frameInterval = setInterval(playFrame, __frameRate);
}
function configReviewItems(nItems:number) {
    __reviewPool = [];
    for (var i = 0; i < nItems; i++) {
        __reviewPool[i] = false;
    }
}
function setReviewItem(nItem:number) {
    __reviewPool[nItem - 1] = true;
}
function checkReviewItems(frameToGo:number) {
    //console.log("checkReviewItems");
    for (var i = 0; i < __reviewPool.length; i++) {
        if (__reviewPool[i] == false) {
            //console.log("return.......");
            return;
        }
    }
    //console.log("action..................................... frame = " + frameToGo);
    goToAndPlay(frameToGo);
}
function stop() {
    clearInterval(__frameInterval);
    __blockEvent = true;
    //console.log("---stop()---");
}
function reload() {
    setCourseContent(__pageCounter);
}
function movefordwardbyaudio() {
    //__audio = document.getElementById(sAudio);
    __audioInterval = setInterval(checkAudioEnd, __frameRate);
}
function checkAudioEnd() {
    if (__mainAudio.ended) {
        clearInterval(__audioInterval);
        //console.log("audio ends----");
        nextPage();
    }
}
function setVolume() {
    __volumeButton.classList.remove("mute");
    __isMute = false;
    var audios = document.getElementsByTagName("audio");
    var videos = document.getElementsByTagName("video");
    if (audios.length > 0) {
        //console.log("there is some audios to play");
        for (var i = 0; i < audios.length; i++) {
            //console.log("set volume for audio " + i + " audio value " + __volumeControl.value);
            audios[i].volume = __volumeControl.value / 100;
        }
    }
    if (videos.length > 0) {
        //console.log("there is some videos to play");
        for (var j = 0; j < videos.length; j++) {
            //console.log("set volume for video " + j + " video value " + __volumeControl.value);
            videos[j].volume = __volumeControl.value / 100;
        }
    }
}
function mute() {
    __isMute = true;
    __volumeButton.classList.add("mute");
    var audios = document.getElementsByTagName("audio");
    var videos = document.getElementsByTagName("video");
    if (audios.length > 0) {
        for (var i = 0; i < audios.length; i++) {
            audios[i].volume = 0;
        }
    }
    if (videos.length > 0) {
        for (var j = 0; j < videos.length; j++) {
            videos[j].volume = 0;
        }
    }
}
function toogleMute() {
    __isMute = !__isMute;
    if (__isMute) {
        mute();
    }
    else {
        setVolume();
    }
}
function toogleWindowed() {
    __isWindowed = !__isWindowed;
    if (__isMobile) {
        if (!__isWindowed) {
            document.body.requestFullscreen();
        }
        else {
            document.exitFullscreen();
        }
    }
    else {
        windowedCourse();
    }
}
function checkLMS() {
    var s = doLMSInitialize();
    __LMSInitialized = (s == "true");
    if (__LMSInitialized)
        //console.log("LMS connection available <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<");
        getSuspendData();
}
function saveSuspendData() {
    if (__LMSInitialized) {
        var data = "";
        for (var i = 0; i < __visited.length; i++) {
            data += __visited[i];
            if (i < (__visited.length - 1)) {
                data += ",";
            }
        }
        var isNumber = isNaN(parseInt(__attemps[__attemps.length - 1]));
        if (!isNumber) {
            data += "|";
            for (var j = 0; j < __attemps.length; j++) {
                //console.log("__attemps " + __attemps[j]);
                data += __attemps[j];
                if (j < (__attemps.length - 1)) {
                    data += ",";
                }
            }
        }
        doLMSSetValue("cmi.suspend_data", data);
        doLMSCommit();
    }
}
//TODO review
function getSuspendData() {
    if (__LMSInitialized) {
        __suspendData = doLMSGetValue("cmi.suspend_data");
        if (__suspendData != "") {
            var parseCategory = __suspendData.split("|");
            __suspendDataVisited = parseCategory[0].split(",");
            __suspendDataVisited.forEach(function (v:string) {
                var id = parseInt(v);
                __visited.push(id);
            });
            __suspendDataAttemps = parseCategory[1].split(",");//TODO review this
            __suspendDataAttemps.forEach(function (v:string) {
                var score = parseInt(v);
                if (!isNaN(score)) {
                    __attemps.push(score);
                }
            });
        }
    }
}
function unlockTOC(id:number) {
    //console.log("unlockTOC " + id);
    document.getElementById("L" + id).classList.remove("TOCListElementDisable");
}
function setWelcomeInfo() {
    //console.log("setWelcomeInfo");
    var studentName = "";
    var percentage = Math.floor((__visited.length * 100) / __totalPages);
    var d = new Date();
    var year:any = d.getFullYear();
    //var ModuleName:string = "";
    //var LessoneName:string = "";
    //var aids:any;
    //var sids:string = "";
    //var ModuleID:number = 0;
    //var LessonID:number = 0;
    if (__LMSInitialized) {
        studentName = doLMSGetValue("cmi.core.student_name");
        if (doLMSGetValue("cmi.core.lesson_location") != "") {
            __pageCounter = parseInt(doLMSGetValue("cmi.core.lesson_location")) - 1;
        }
    }
    //console.log("getLessonId " + getLessonId());
    //sids = getLessonId();
    //aids = sids.split("|");
    //ModuleID = parseInt(aids[0]);
    //LessonID = parseInt(aids[1]);
    //__pageCounter = LessonID;
    //console.log("__lessonsContinue:"+__pageCounter);
    //console.log("ModuleID " + ModuleID);
    //ModuleName = __course.getElementsByTagName("course")[0].getElementsByTagName("module")[ModuleID].getAttribute("name");
    //LessoneName = __course.getElementsByTagName("course")[0].getElementsByTagName("module")[ModuleID].getElementsByTagName("lesson")[LessonID].getAttribute("name");
    var cover:string = __course.getElementsByTagName("cover")[0].getElementsByTagName("content")[0].textContent;
    cover = cover.replace("#name", studentName);
    //cover = cover.replace("#percentage", percentage + "%");
    //cover = cover.replace("#module", ModuleName);
    //cover = cover.replace("#lesson", LessoneName);
    cover = cover.replace("#year", year);
    __cover.innerHTML = cover;
    /*
    document.getElementById("ButtonStart").addEventListener("click", function(){});
    document.getElementById("ButtonContinue").addEventListener("click", function(){});
  */
    if (percentage == 0) {
        //console.log("here to set welcome ui");
        //document.getElementById("location").style.display = "none";
        document.getElementById("ButtonStart").classList.add("buttonWelcomeCentred");
        document.getElementById("ButtonContinue").style.display = "none";
    }
    else {
        document.getElementById("ButtonStart").classList.remove("buttonWelcomeCentred");
        document.getElementById("ButtonContinue").style.display = "block";
    }
    var script = __course.getElementsByTagName("cover")[0].getElementsByTagName("script")[0].textContent;
    if (script != undefined) {
        //console.log(script);
        eval(script);
    }
}
function getLessonId() {
    //console.log("---getLessonId | __LMSInitialized = " + __LMSInitialized);
    var lessonLocation = "";
    var LessonTarget = 1;
    var LessonID = 0;
    var ModuleID = 0;
    var output = "0|0";
    var moduleList = __course.getElementsByTagName("course")[0].getElementsByTagName("module");
    if (__LMSInitialized) {
        lessonLocation = doLMSGetValue("cmi.core.lesson_location");
        //console.log("lessonLocation:" + lessonLocation);
        if (lessonLocation != "") {
            LessonTarget = parseInt(lessonLocation);
        }
        //console.log("lessonLocation " + lessonLocation);
        for (var i = 0; i < moduleList.length; i++) {
            //console.log("Module " + i);
            //ModuleName = moduleList[i].getAttribute("name");
            var lessonList = __course.getElementsByTagName("course")[0].getElementsByTagName("module")[i].getElementsByTagName("lesson");
            var quiz = __course.getElementsByTagName("course")[0].getElementsByTagName("module")[i].getElementsByTagName("quiz");
            for (var j = 0; j < lessonList.length; j++) {
                //var lessonName:string = lessonList[j].getAttribute("name");
                if (LessonID + 1 == LessonTarget) {
                    output = ModuleID + "|" + LessonID;
                    return output;
                }
                LessonID++;
                //console.log("Lesson " + LessonID );
            }
            for (var k = 0; k < quiz.length; k++) {
                //console.log("Quiz ---" + k);
                //var quizName:string = quiz[k].getAttribute("name");
                if (LessonID + 1 == LessonTarget) {
                    output = ModuleID + "|" + LessonID;
                    return output;
                }
                LessonID++;
            }
            ModuleID++;
        }
    }
    else {
        return output;
    }
}
function msieversion() {
    var ua = window.navigator.userAgent;
    var msie = ua.indexOf("MSIE ");
    if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)) // If Internet Explorer, return version number
     {
        return true;
    }
    return false;
}
function edgeversion() {
    var isEdge = navigator.appVersion.indexOf('Edge') > -1;
    return isEdge;
}
function startCourse(start:boolean) {
    //console.log("startCourse " + start + " | __lessonsContinue:"+__pageCounter + "| __isGuide = " + __isGuide);
    setCourseStatus();
    windowedCourse();
    document.getElementById("Welcome_UI").style.display = "none";
    if (start) {
        __pageCounter = 0;
    }
    if (__isGuide && (__pageCounter == 0)) {
        showGuide();
    }
    else {
        __isGuide = false;
        __toogleUI = false;
        showUI();
        setCourseContent(__pageCounter);
    }
}
function playAudio(src:string) {
    //__mainAudio.pause();
    __mainAudio.src = src;
    //__mainAudio.setAttribute("src", src);
    if (src != "") {
        //__mainAudio.play();
        play_pause(true);
        __mainAudio.addEventListener("canplay", playWithBuffer);

    }
}
function pauseAudio() {
    __mainAudio.pause();
}
function playFxAudio(src:string) {
    //__fxAudio.pause();
    __fxAudio.src = src;
    //__fxAudio.setAttribute("src", src);
    if (src != "") {
      __fxAudio.addEventListener("canplay", playFxWithBuffer);
    }
}
function isIpad() {
    var ua = window.navigator.userAgent;
    if (ua.indexOf('iPad') > -1) {
        return true;
    }
    if (ua.indexOf('Macintosh') > -1) {
        try {
            document.createEvent("TouchEvent");
            return true;
        }
        catch (e) { }
    }
    return false;
}
var __TimingDelay = 1.0;
var __wordsPerMinute = 120;
var __characteresPerMinute = 14.3;
function getTiming() {
    //console.log("__characteresPerMinute="+__characteresPerMinute);
    var ps:any = __courseContainer.querySelectorAll("p");
    var globalTiming = __TimingDelay;
    //var globalCharacters:number = 0;
    for (var i = 0; i < ps.length; i++) {
        //console.log(ps[i].getAttribute("id") + ":" + globalTiming);
        var wordCounter = ps[i].innerText.trim().length;
        //console.log(wordCounter);
        //globalCharacters += wordCounter;
        var localTiming = (Math.round((wordCounter / __characteresPerMinute) * 10) / 10);
        ps[i].setAttribute("timing", globalTiming);
        globalTiming += localTiming;
    }
    //console.log("total timing: " + globalTiming + " - total characers: " + globalCharacters);
}
function hideUI(hide:boolean) {
    if (hide) {
        __uiButton.style.display = "none";
        __ui.style.display = "none";
    }
    else {
        __toogleUI = !__toogleUI;
        __uiButton.style.display = "block";
        __ui.style.display = "block";
        showUI();
    }
}
function hackMode() {
    var div:HTMLElement;
    div = document.getElementById("hack");
    if (div != null) {
        return;
    }
    div = document.createElement("div");
    div.setAttribute("id", "hack");
    var btnClose = document.createElement("div");
    var iconPassword = document.createElement("img");
    var img = document.createElement("img");
    var welcome = document.createElement("label");
    var input = document.createElement("input");
    var bntSend = document.createElement("div");
    var iconSend = document.createElement("img");
    var btnUnlockTOC = document.createElement("div");
    var pb1 = document.createElement("p");
    var btnNextPage = document.createElement("div");
    var pb2 = document.createElement("p");
    var btnUnlockNext = document.createElement("div");
    var pb3 = document.createElement("p");
    var btnShowScorm = document.createElement("div");
    var pb4 = document.createElement("p");
    var btnScreenshot = document.createElement("div");
    var pb5 = document.createElement("p");
    var btnFastMode = document.createElement("div");
    var pb6 = document.createElement("p");
    var iconBtn1 = document.createElement("img");
    iconBtn1.setAttribute("src", "bin/images/unlock.png");
    var iconBtn2 = document.createElement("img");
    iconBtn2.setAttribute("src", "bin/images/next.png");
    var iconBtn3 = document.createElement("img");
    iconBtn3.setAttribute("src", "bin/images/enable.png");
    var iconBtn4 = document.createElement("img");
    iconBtn4.setAttribute("src", "bin/images/scorm.png");
    var iconBtn5 = document.createElement("img");
    iconBtn5.setAttribute("src", "bin/images/screenshot.png");
    var iconBtn6 = document.createElement("img");
    iconBtn6.setAttribute("src", "bin/images/fast.png");
    btnClose.setAttribute("id", "btnClose");
    iconPassword.setAttribute("src", "bin/images/password.png");
    img.setAttribute("src", "bin/images/close_a.png");
    welcome.setAttribute("for", "saymyname");
    welcome.innerText = "PASSWORD:";
    input.setAttribute("type", "text");
    input.setAttribute("id", "saymyname");
    input.setAttribute("name", "saymyname");
    iconSend.setAttribute("src", "bin/images/go_a.png");
    iconBtn1.classList.add("middleY");
    btnUnlockTOC.appendChild(iconBtn1);
    iconBtn2.classList.add("middleY");
    btnNextPage.appendChild(iconBtn2);
    iconBtn3.classList.add("middleY");
    btnUnlockNext.appendChild(iconBtn3);
    iconBtn4.classList.add("middleY");
    btnShowScorm.appendChild(iconBtn4);
    iconBtn5.classList.add("middleY");
    btnScreenshot.appendChild(iconBtn5);
    iconBtn6.classList.add("middleY");
    btnFastMode.appendChild(iconBtn6);
    btnUnlockTOC.classList.add("btnHack");
    btnNextPage.classList.add("btnHack");
    btnUnlockNext.classList.add("btnHack");
    btnShowScorm.classList.add("btnHack");
    btnScreenshot.classList.add("btnHack");
    btnFastMode.classList.add("btnHack");
    pb1.innerText = "UNLOCK TOC";
    pb2.innerText = "NEXT PAGE";
    pb3.innerText = "ENABLE NEXT";
    pb4.innerText = "SHOW SCORM";
    pb5.innerText = "SCREENSHOT";
    pb6.innerText = "FAST MODE";
    bntSend.addEventListener("click", function () {
        if (!__isHackeable && (input.value == "davinci")) {
            __isHackeable = true;
            welcome.innerText = "COMMAND";
            input.value = "";
            //div.style.backgroundColor = "rgba(135, 206, 235, 0.75)";
            iconPassword.setAttribute("src", "bin/images/command.png");
            div.appendChild(btnUnlockTOC);
            div.appendChild(btnNextPage);
            div.appendChild(btnUnlockNext);
            div.appendChild(btnShowScorm);
            div.appendChild(btnScreenshot);
            div.appendChild(btnFastMode);
            div.insertBefore(btnUnlockTOC, btnClose);
            div.insertBefore(btnNextPage, btnClose);
            div.insertBefore(btnUnlockNext, btnClose);
            div.insertBefore(btnShowScorm, btnClose);
            div.insertBefore(btnScreenshot, btnClose);
            div.insertBefore(btnFastMode, btnClose);
        }
        else if (__isHackeable) {
            eval(input.value);
        }
        else {
            alert("Wrong password.");
        }
    });
    bntSend.addEventListener("mouseover", function () { iconSend.setAttribute("src", "bin/images/go_b.png"); });
    bntSend.addEventListener("mouseout", function () { iconSend.setAttribute("src", "bin/images/go_a.png"); });
    btnClose.addEventListener("click", function () { div.remove(); __isHackeable = false; });
    btnClose.addEventListener("mouseover", function () { img.setAttribute("src", "bin/images/close_b.png"); });
    btnClose.addEventListener("mouseout", function () { img.setAttribute("src", "bin/images/close_a.png"); });
    btnUnlockTOC.addEventListener("click", function () {
        for (var i = 0; i < __totalPages; i++) {
            unlockTOC(i);
        }
    });
    btnNextPage.addEventListener("click", function () { nextPage(); });
    btnUnlockNext.addEventListener("click", function () { enableNext(); });
    btnShowScorm.addEventListener("click", function () {
        var cmi = "";
        cmi += ("student_id: " + doLMSGetValue("cmi.core.student_id") + "\n");
        cmi += ("student_name: " + doLMSGetValue("cmi.core.student_name") + "\n");
        cmi += ("lesson_location: " + doLMSGetValue("cmi.core.lesson_location") + "\n");
        cmi += ("lesson_status: " + doLMSGetValue("cmi.core.lesson_status") + "\n");
        cmi += ("score: " + doLMSGetValue("cmi.core.score.raw") + "\n");
        cmi += ("suspend_data: " + doLMSGetValue("cmi.suspend_data") + "\n");
        if (__LMSInitialized) {
            alert(cmi);
        }
        else {
            alert("The course has to be connected to an LMS platform.");
        }
    });
    btnScreenshot.addEventListener("click", function () {
        var _str:string = __lessons[__pageCounter].getAttribute("name");
        var leftNumber:string = "";
        if (__pageCounter < 9) {
            leftNumber = "0";
        }
        _str = _str.replace(" ", "_");
        var fileName:string = leftNumber + (__pageCounter + 1) + "_" + _str;
        __displayWindow.classList.add("screenshot");
        domtoimage.toBlob(__displayWindow)
            .then(function (blob:any) {
            saveAs(blob, fileName);
        });
        setTimeout(function () { __displayWindow.classList.remove("screenshot"); }, 1000);
    });
    btnFastMode.addEventListener("click", fastMode);
    div.appendChild(iconPassword);
    div.appendChild(welcome);
    div.appendChild(input);
    div.appendChild(bntSend);
    bntSend.appendChild(iconSend);
    btnClose.appendChild(img);
    div.appendChild(btnClose);
    btnUnlockTOC.appendChild(pb1);
    btnNextPage.appendChild(pb2);
    btnUnlockNext.appendChild(pb3);
    btnShowScorm.appendChild(pb4);
    btnScreenshot.appendChild(pb5);
    btnFastMode.appendChild(pb6);
    div.classList.add("hack");
    document.getElementById("Course").appendChild(div);
    input.select();
}
function sessionTime() {
    var hour = __sessionStatTime.getHours();
    var min = __sessionStatTime.getMinutes();
    var currentTime = new Date();
    var currHour = currentTime.getHours() - hour;
    var currMin = currentTime.getMinutes() - min;
    var currSec = currentTime.getSeconds();
    var sHour:string;
    var sMin:string;
    var sSec:string;
    if (currHour < 10) {
        sHour = "0" + currHour;
    }
    else {
        sHour = currHour.toString();
    }
    if (currMin < 10) {
        sMin = "0" + currMin;
    }
    else {
        sMin = currMin.toString();
    }
    if (currSec < 10) {
        sSec = "0" + currSec;
    }
    else {
        sSec = currSec.toString();
    }
    var sTime = sHour + ":" + sMin + ":" + sSec;
    doLMSSetValue("cmi.core.session_time", sTime);
}
function showGuide() {
    //show if is on xml
    var guide = __addons.getElementsByTagName("guide")[0].getElementsByTagName("content")[0].textContent;
    __guide.innerHTML = guide;
    __guide.style.display = "block";
    __isGuide = true;
    var gifs = __guide.getElementsByClassName("reload_gif");
    for (var i = 0; i < gifs.length; i++) {
        var src = gifs[i].getAttribute("src");
        gifs[i].setAttribute("src", src + "?" + Math.random());
    }
    var script = __addons.getElementsByTagName("guide")[0].getElementsByTagName("script")[0];
    if (script != undefined) {
        eval(script.textContent);
    }
    __toogleUI = false;
    showUI();
}
function closeGuide() {
    __guide.style.display = "none";
    clearInterval(__guideInterval);
    __guide.innerHTML = "";
    __isGuide = false;
    __uiButton.classList.remove("higlightButton");
    __volumeButton.classList.remove("higlightButton");
    __prevButton.classList.remove("higlightButton");
    __prevButton.classList.remove("show");
    __playButton.classList.remove("higlightButton");
    __nextButton.classList.remove("higlightButton");
    __reloadButton.classList.remove("higlightButton");
    __tocButton.classList.remove("higlightButton");
    setCourseContent(__pageCounter);
}
function loadAddons(src:string) {
    //console.log("loadAddons---");
    var requestCourse:any;
    if (window.XMLHttpRequest) {
        requestCourse = new XMLHttpRequest();
    }
    else { // IE 5/6
        requestCourse = new ActiveXObject("Microsoft.XMLHTTP");
    }
    requestCourse.overrideMimeType('text/xml');
    requestCourse.open('GET', src);
    requestCourse.onload = function () {
        //console.log("on load addons start ------------------------");
        __addons = requestCourse.responseXML;
    };
    requestCourse.setRequestHeader("Content-Type", "text/xml");
    requestCourse.send();
}
function about() {
    var about = __addons.getElementsByTagName("about")[0].getElementsByTagName("content")[0].textContent;
    var d = new Date();
    var year = d.getFullYear();
    about = about.replace("#version", __version.toString());
    about = about.replace("#year", year.toString());
    __about.innerHTML = about;
    __about.style.display = "block";
    pauseCourse();
}
function closeAbout() {
    __about.innerHTML = "";
    __about.style.display = "none";
}
function fastMode() {
    __fastMode = true;
    __frameRate = 10;
    reload();
    mute();
}

function saveText()
{
  var content:string = "";
  var title: string = document.getElementById("title").textContent;
  var subtitle: string = document.getElementById("subtitle").textContent;
  var _s:any = document.getElementsByClassName("s");


  content += (title + " ");
  content += (subtitle + "\n");

  for (var i = 0; i < _s.length; i++) {
    content += (_s[i].textContent + "\n") ;
  }

  var _sTitle:string = __lessons[__pageCounter].getAttribute("name");
  var leftNumber:string = "";
  if (__pageCounter < 9) {
      leftNumber = "0";
  }
  _sTitle = _sTitle.replace(" ", "_");
  var fileName:string = leftNumber + (__pageCounter + 1) + "_" + _sTitle;

  var blob = new Blob([content], {type: "text/plain;charset=utf-8"});
  saveAs(blob, fileName + ".txt");
}
function setCourseStatus()
{
  if (__LMSInitialized) {
      var lessonStatus = doLMSGetValue("cmi.core.lesson_status");
      var doIt:string = "";
      console.log("lessonStatus before = " + lessonStatus);
      if ((lessonStatus != "completed") && (lessonStatus != "passed") && (lessonStatus != "failed") && (lessonStatus != "incomplete") && (lessonStatus != "browsed")) {
          doLMSSetValue("cmi.core.lesson_status", "incomplete");
          doIt = doLMSCommit();
      }
      else{
        doLMSSetValue("cmi.core.lesson_status", lessonStatus);
      }
      console.log("lessonStatus after = " + lessonStatus + "- saved = " + doIt);
  }
}

function playWithBuffer()
{
  play_pause(false);
}

function videoWithBuffer()
{
  play_pause(false);
}

function playFxWithBuffer()
{
  __fxAudio.play();
}
