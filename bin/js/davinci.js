console.log("Davinci e-learning player version:20200820_nonhack /n by David Barreto");
var __courseLocation = "course/course.xml";
var __course;
var __courseContainer;
var __isMobile = false;
var __pageCounter = 0;
var __totalPages;
var __courseName;
var __nextButton;
var __prevButton;
var __playButton;
var __reloadButton;
var __tocButton;
var __isWindowed;
var __courseWidth;
var __courseHeight;
var __displayWindow;
var __toc;
var __tocList;
var __ui;
var __uiButton;
var __toogleTOC = false;
var __toogleUI = false;
var __visited = [];
var __counter;
var __AdvanceBar;
var __portraitAlertCenter;
var __frame;
var __events = null;
var __frameInterval;
var __frameRate = 100;
var __blockEvent = false;
var __isPaused = false;
var __tooltipNext;
var __tooltipPrev;
var __lessons = [];
var __page;
var __videoTimeInternal;
var __video;
var __subtitles = [];
var __currentSubtitle;
var __reviewPool = new Array();
var __LMSInitialized = false;
var __isPlayEnable = false;
var __cover;
var __audio;
var __audioInterval;
var __volumeControl;
var __volumeButton;
var __isMute = false;
var __suspendDataVisited;
var __suspendData = "";
var __isiE = false;
var __isEdge = false;
var __mainAudio;
var __fxAudio;
var __testMode = false;
document.addEventListener('DOMContentLoaded', init, false);
window.addEventListener('resize', windowedCourse);
window.addEventListener("click", hideTOC);
window.addEventListener("orientationchange", function () { checkHorizontal(); }, false);
function init() {
    console.log("init---");
    __isiE = msieversion();
    __isEdge = edgeversion();
    checkMobile();
    checkHorizontal();
    loadCourse(__courseLocation);
    checkLMS();
}
function loadCourse(src) {
    console.log("loadCourse---");
    var requestCourse;
    if (window.XMLHttpRequest) {
        requestCourse = new XMLHttpRequest();
    }
    else { // IE 5/6
        requestCourse = new ActiveXObject("Microsoft.XMLHTTP");
    }
    requestCourse.overrideMimeType('text/xml');
    requestCourse.open('GET', src);
    requestCourse.onload = function () {
        console.log("on load start ------------------------");
        __course = requestCourse.responseXML;
        console.dir(__course);
        courseConfig();
    };
    requestCourse.onerror = function () {
        alert("Network Error");
    };
    requestCourse.onprogress = function (event) {
        console.log("on progress start ------------------------");
        console.log('Received' + event.loaded + ' of ' + event.total);
        console.log("----------------------------------- on progress ends");
    };
    requestCourse.setRequestHeader("Content-Type", "text/xml");
    requestCourse.send();
}
function courseConfig() {
    __totalPages = __course.getElementsByTagName("lesson").length + __course.getElementsByTagName("quiz").length;
    //__courseName = __course.getElementsByTagName("course")[0].getAttribute("name");
    __isWindowed = (__course.getElementsByTagName("course")[0].getAttribute("windowed") == "true");
    __displayWindow = document.getElementById("Course");
    __courseWidth = parseInt(__course.getElementsByTagName("course")[0].getAttribute("width"));
    __courseHeight = parseInt(__course.getElementsByTagName("course")[0].getAttribute("height"));
    __courseContainer = document.getElementById("Course_Content");
    __mainAudio = document.getElementById("main_audio");
    __fxAudio = document.getElementById("fx_audio");
    windowedCourse();
    //setCourseName(__courseName);
    set_uiElements();
    loadTOC();
    if ((__LMSInitialized) && (__suspendData != "")) {
        console.log("__visited = " + __visited.toString());
        for (var i = 0; i < __visited.length; i++) {
            unlockTOC(__visited[i] - 1);
        }
    }
    setLessonCounter();
    if (__testMode) {
        console.log("--- Test Mode ---");
        for (var i = 0; i < __totalPages; i++) {
            unlockTOC(i);
        }
    }
}
function setCourseName(name) {
    document.getElementById("Course_Name").innerHTML = name;
}
function clearCourseContainer() {
    clearInterval(__frameInterval);
    clearInterval(__videoTimeInternal);
    clearInterval(__audioInterval);
    __audio = undefined;
    __courseContainer.innerHTML = "";
    hideTOC();
    /*
    __courseContainer.remove();
    var cc = document.createElement("div");
    cc.setAttribute("id", "Course_Content");
    document.getElementById("Course").appendChild(cc);
    __courseContainer = document.getElementById("Course_Content");
    */
}
function setCourseContent(index) {
    console.log("setCourseContent " + index);
    playAudio("");
    pauseAudio();
    disableNext();
    for (var i = 0; i < __visited.length; i++) {
        console.log("check to enable next " + __visited[i] + " vs " + (index + 1));
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
    console.log("catchMedia");
    __currentSubtitle = 0;
    __video = __courseContainer.getElementsByTagName("video");
    if (__video.length > 0) {
        __subtitles = __page.getElementsByTagName("subtitles")[0].getElementsByTagName("subtitle");
        console.log("has video | subtitles " + __subtitles.length);
        __videoTimeInternal = setInterval(checkVideoTime, __frameRate);
    }
    if (__isMute) {
        mute();
    }
    else {
        setVolume();
    }
    console.log("catchMedia ends ---");
}
function checkVideoTime() {
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
    if (__video[0].ended) {
        clearInterval(__videoTimeInternal);
        //console.log("---subtitles ends");
        nextPage();
        return;
    }
    console.log("__currentSubtitle " + __currentSubtitle + " | __subtitles.length " + __subtitles.length);
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
        console.log(script.textContent);
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
    console.log("playCourse()");
    __playButton.classList.remove("pause");
    __playButton.classList.add("play");
    if (__page.getElementsByTagName("events")[0] != undefined) {
        __events = __page.getElementsByTagName("events")[0].getElementsByTagName("event");
        __blockEvent = false;
        __frameInterval = setInterval(playFrame, __frameRate);
    }
}
function pauseCourse() {
    console.log("pauseCourse()");
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
            var timing = sTime * 1000;
            //console.log(i + " of " + totalEvents + " totalEvents");
            if (__blockEvent) {
                return;
            }
            if (timing == milisecondTime) {
                /*
                console.log("--- Play frame : " + __frame + " second: " + sTime + " ... comes from event " + i);
                __eventPlayed ++;
                if(__eventPlayed == totalEvents)
                {
                  clearInterval(__frameInterval);
                  console.log("events end");
                }
                */
                if (!__blockEvent) {
                    eval(__events[i].textContent);
                    console.log("---Event found");
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
    console.log("__isMobile = " + __isMobile);
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
function setLessonLocation(location) {
    if (__LMSInitialized) {
        doLMSSetValue("cmi.core.lesson_location", location);
        doLMSCommit();
    }
}
function setVisited(id) {
    console.log("setVisited " + id);
    for (var i = 0; i <= __visited.length; i++) {
        if (__visited[i] == id) {
            console.log("find " + id);
            return;
        }
    }
    __visited.push(id);
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
    __nextButton.addEventListener("click", function () { if (__isPlayEnable) {
        nextPage();
    } });
    //__nextButton.addEventListener("mouseover", function(){__tooltipNext.style.display = "block";});
    //__nextButton.addEventListener("mouseout", function(){__tooltipNext.style.display = "none";});
    __prevButton.addEventListener("click", prevPage);
    //__prevButton.addEventListener("mouseover", function(){__tooltipPrev.style.display = "block";});
    //__prevButton.addEventListener("mouseout", function(){__tooltipPrev.style.display = "none";});
    __tocButton.addEventListener("click", showTOC);
    __playButton.addEventListener("click", tooglePlayPause);
    __reloadButton.addEventListener("click", reload);
    //document.getElementById("Button_Size").addEventListener("click", function(){__isWindowed = !__isWindowed; if(__isMobile){ if(!__isWindowed){document.body.requestFullscreen();}else{document.exitFullscreen();}}else{ windowedCourse(); }});
    //document.getElementById("Button_Close").addEventListener("click", function(){window.close();});
    __uiButton.addEventListener("click", showUI);
    __volumeControl.oninput = function () { setVolume(); };
    __volumeButton.addEventListener("click", toogleMute);
    if (__isiE) {
        __volumeControl.classList.add("iESlider");
    }
    if (__isEdge) {
        __volumeControl.classList.add("EdgeSlider");
    }
}
function windowedCourse() {
    console.log("windowedCourse");
    if (__isMobile) {
        //1.333333333333333‬ ipad
        //2.165333333333333 iphonex
        //1.77777777777778 1280 * 720 HD
        var aspecRatio = window.innerWidth / window.innerHeight;
        console.log("aspecRatio:" + aspecRatio);
        if (aspecRatio < 1.8) {
            console.log("aspecRatio is less");
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
            //var translateX = ((__courseWidth - window.innerWidth) / scale) / 2;
            var translateY = (window.innerHeight - (__courseHeight * scale)) / 2;
            __displayWindow.style.width = __courseWidth + "px";
            __displayWindow.style.height = __courseHeight + "px";
            __displayWindow.style.left = 0 + "px";
            __displayWindow.style.top = 0 + "px";
            __displayWindow.style.transform = ("scale(" + scale + ") translate(" + 0 + "px, " + translateY + "px)");
        }
        else {
            console.log("aspecRatio is more");
            /*
            __displayWindow.style.width = x + "px";
            __displayWindow.style.height = "100%";
            __displayWindow.style.left = (window.innerWidth / 2) - (x / 2) + "px";
            __displayWindow.style.top = 0 + "px";
            */
            //when fit to height.
            //------------------------------------------------
            var scale = ((window.innerHeight * 100) / __courseHeight) / 100;
            //var translateX = (__courseWidth - window.innerWidth) * scale;
            var translateX = (window.innerWidth - (__courseWidth * scale)) / 2;
            //var translateY = ((__courseHeight - window.innerHeight)  / scale) / 2;
            //alert("(window.innerHeight = " + window.innerHeight + " | window.outerHeight = " + window.outerHeight + " | scale = " + scale + " | translateX = " + translateY  + " | translateY = " + translateY);
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
    console.log("loadTOC");
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
function addTOCelement(name, id, isModule) {
    var entry = document.createElement("div");
    var p = document.createElement("p");
    var line = document.createElement("div");
    if (!isModule) {
        entry.addEventListener("click", function (event) {
            var block = this.classList.contains("TOCListElementDisable");
            console.log("block = " + block);
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
function showTOC(event) {
    event.stopPropagation();
    if (__toogleTOC) {
        __toc.style.display = "none";
    }
    else {
        __toc.style.display = "block";
    }
    __toogleTOC = !__toogleTOC;
}
function hideTOC() {
    __toogleTOC = false;
    __toc.style.display = "none";
}
function highlightTOC(id) {
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
function play_pause(isPaused) {
    __isPaused = isPaused;
    var audios = document.getElementsByTagName("audio");
    var videos = document.getElementsByTagName("video");
    console.log(audios.length + "|" + videos.length);
    if (audios.length > 0) {
        console.log("playing audios ");
        for (var i = 0; i < audios.length; i++) {
            console.log("pausing " + i);
            if (__isPaused) {
                audios[i].pause();
            }
            else {
                audios[0].play();
            }
        }
    }
    if (videos.length > 0) {
        console.log("playing audios ");
        for (i = 0; i < videos.length; i++) {
            console.log("pausing " + i);
            if (__isPaused) {
                videos[i].pause();
            }
            else {
                videos[0].play();
            }
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
document.addEventListener('keydown', function (event) {
    console.log(event.code);
    console.log(event.keyCode);
    if (event.code == "ArrowRight") {
        if (__isPlayEnable) {
            console.log("ArrowRight");
            nextPage();
        }
    }
    if (event.code == "ArrowLeft") {
        prevPage();
    }
    if (event.code == "Space") {
        tooglePlayPause();
    }
    if (event.keyCode in map) {
        map[event.keyCode] = true;
        console.log(map[17] + " - " + map[39]);
        if (map[17] && map[39]) {
            //console.log("hack nextPage"); nextPage();
        }
        if (map[17] && map[40]) {
            for (var i = 0; i < __totalPages; i++) {
                unlockTOC(i);
            }
        }
    }
});
document.addEventListener("keyup", function (event) {
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
function goTo(goFrame) {
    __frame = goFrame * 10;
    playCourse();
}
function goToAndStop(goFrame) {
    __frame = goFrame * 10;
    var milisecondTime = (__frame * 100);
    __blockEvent = true;
    clearInterval(__frameInterval);
    var totalEvents = __events.length;
    console.log("---------------------goToAndStop = " + __frame + " | __blockEvent = " + __blockEvent);
    for (var i = 0; i < totalEvents; i++) {
        var sTime = Number(__events[i].getAttribute("time"));
        var timing = sTime * 1000;
        if (timing == milisecondTime) {
            eval(__events[i].textContent);
            return;
        }
    }
}
function goToAndPlay(goFrame) {
    console.log("goToAndPlay()");
    clearInterval(__frameInterval);
    __blockEvent = false;
    __frame = (goFrame * 10);
    __frameInterval = setInterval(playFrame, __frameRate);
}
function configReviewItems(nItems) {
    __reviewPool = [];
    for (var i = 0; i < nItems; i++) {
        __reviewPool[i] = false;
    }
}
function setReviewItem(nItem) {
    __reviewPool[nItem - 1] = true;
}
function checkReviewItems(frameToGo) {
    console.log("checkReviewItems");
    for (var i = 0; i < __reviewPool.length; i++) {
        if (__reviewPool[i] == false) {
            console.log("return.......");
            return;
        }
    }
    console.log("action..................................... frame = " + frameToGo);
    goToAndPlay(frameToGo);
}
function stop() {
    clearInterval(__frameInterval);
    __blockEvent = true;
    console.log("---stop()---");
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
        console.log("audio ends----");
        nextPage();
    }
}
function setVolume() {
    __volumeButton.classList.remove("mute");
    __isMute = false;
    var audios = document.getElementsByTagName("audio");
    var videos = document.getElementsByTagName("video");
    if (audios.length > 0) {
        console.log("there is some audios to play");
        for (var i = 0; i < audios.length; i++) {
            console.log("set volume for audio " + i + " audio value " + __volumeControl.value);
            audios[i].volume = __volumeControl.value / 100;
        }
    }
    if (videos.length > 0) {
        console.log("there is some videos to play");
        for (var j = 0; j < videos.length; j++) {
            console.log("set volume for video " + j + " video value " + __volumeControl.value);
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
        console.log("LMS connection available <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<");
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
        doLMSSetValue("cmi.suspend_data", data);
        doLMSCommit();
    }
}
function getSuspendData() {
    if (__LMSInitialized) {
        __suspendData = doLMSGetValue("cmi.suspend_data");
        if (__suspendData != "") {
            __suspendDataVisited = __suspendData.split(",");
            __suspendDataVisited.forEach(function (v) {
                var id = parseInt(v);
                __visited.push(id);
            });
        }
    }
}
function unlockTOC(id) {
    console.log("unlockTOC " + id);
    document.getElementById("L" + id).classList.remove("TOCListElementDisable");
}
function setWelcomeInfo() {
    console.log("setWelcomeInfo");
    var studentName = "";
    var percentage = Math.floor((__visited.length * 100) / __totalPages);
    var d = new Date();
    var year = d.getFullYear();
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
    var cover = __course.getElementsByTagName("cover")[0].getElementsByTagName("content")[0].textContent;
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
        console.log("here to set welcome ui");
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
    console.log("---getLessonId | __LMSInitialized = " + __LMSInitialized);
    var lessonLocation = "";
    var LessonTarget = 1;
    var LessonID = 0;
    var ModuleID = 0;
    var output = "0|0";
    var moduleList = __course.getElementsByTagName("course")[0].getElementsByTagName("module");
    if (__LMSInitialized) {
        lessonLocation = doLMSGetValue("cmi.core.lesson_location");
        console.log("lessonLocation:" + lessonLocation);
        if (lessonLocation != "") {
            LessonTarget = parseInt(lessonLocation);
        }
        console.log("lessonLocation " + lessonLocation);
        for (var i = 0; i < moduleList.length; i++) {
            console.log("Module " + i);
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
                console.log("Lesson " + LessonID);
            }
            for (var k = 0; k < quiz.length; k++) {
                console.log("Quiz ---" + k);
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
function startCourse(start) {
    console.log("startCourse " + start + " | __lessonsContinue:" + __pageCounter);
    windowedCourse();
    document.getElementById("Welcome_UI").style.display = "none";
    if (start) {
        __pageCounter = 0;
    }
    setCourseContent(__pageCounter);
}
/*
function playAudio(id:string){
  var promise = document.querySelector(id).play();

  if (promise !== undefined) {
      promise.catch(error => {
          // Auto-play was prevented
          // Show a UI element to let the user manually start playback
          alert("que la chin");
      }).then(() => {
          // Auto-play started
          alert("okas");
      });
}
*/
function playAudio(src) {
    __mainAudio.pause();
    __mainAudio.setAttribute("src", src);
    __mainAudio.play();
}
function pauseAudio() {
    __mainAudio.pause();
}
function playFxAudio(src) {
    __fxAudio.pause();
    __fxAudio.setAttribute("src", src);
    __fxAudio.play();
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
