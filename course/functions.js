function ShowPopup( popup, time ) {
    var e = document.getElementById(popup);
    e.classList.add("FadeBigInLeft");
    e.classList.remove("DisplayOff");
    goToAndPlay(time);
    playFxAudio("course/audios/click.mp3");
};

function ClosePopup(popup, time, completeTime) {
    var e = document.getElementById(popup);
    e.classList.add("DisplayOff");
    playFxAudio("course/audios/click.mp3");
    pauseAudio();
    goToAndPlay(time);
    checkReviewItems(completeTime);
}

var InteractivityCounter = 0;

function ResetCounter(counter) {
    var localcounter = counter;
    localcounter = 0; 
}

function CheckCounter(counter) {
    if (counter == 5) {
        goToAndPlay('600')
        return InteractivityCounter = 0;
        
        /* alert('Felicidades'); */

    } else {
        
        stop()
    }
    
}


function fillStar(id, time) {
    playFxAudio("course/audios/click.mp3");
    var e = document.getElementById(id);
    e.classList.add("OpacityZero")
    InteractivityCounter ++;
    e.querySelector('[id^="hotspot"]').classList.remove("cursorPointer")
    var itemsText = document.getElementById("ItemsFound");
    itemsText.textContent = InteractivityCounter.toString(); 
    
    /* console.log(InteractivityCounter) */

    var star = document.getElementById('Star-IBS_' + InteractivityCounter);
    star.classList.add("star-IBS-fill"); 

     goToAndPlay(time)
    
}


function hotspot(id, time) {
    var e = document.getElementById(id);
   
    e.querySelector('[id^="hotspot"]').classList.add("cursorPointer");

    e.addEventListener("click", function() {
       fillStar(id, time)
    }, {once : true});
    
    
}

function hasClass(id, className) {
    var e = document.getElementById(id);
    if (e.classList.contains(className)) {
        return;
    } else {
        e.classList.add(className)
    }
    
}

