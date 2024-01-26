// TODO: we can probably refactor this to be a bit cleaner

function showInfoPopup(message, onCloseCallback) {
    document.getElementById("grayout").classList.remove("hide");
    document.getElementById("popup").classList.remove("hide");
    document.getElementById("popup").querySelector(".error").classList.add("hide");
    document.getElementById("popup").querySelector(".wait").classList.add("hide");
    document.getElementById("popup").querySelector(".confirm").classList.remove("hide");
    document.getElementById("popup").querySelector(".close-popup").classList.remove("hide");
    document.getElementById("popup").querySelector(".accept-popup").classList.add("hide");

    /* Not using event listeners to make sure we only have one callback */
    document.getElementById("popup").querySelector(".close-popup").onclick = (e) => {
        hidePopup();
        if (onCloseCallback)
            onCloseCallback();
    }
    document.getElementById("popup").querySelector(".content").innerHTML = message;
}


function showErrorPopup(message, onCloseCallback) {
    document.getElementById("grayout").classList.remove("hide");
    document.getElementById("popup").classList.remove("hide");
    document.getElementById("popup").querySelector(".error").classList.remove("hide");
    document.getElementById("popup").querySelector(".wait").classList.add("hide");
    document.getElementById("popup").querySelector(".confirm").classList.add("hide");
    document.getElementById("popup").querySelector(".close-popup").classList.remove("hide");
    document.getElementById("popup").querySelector(".accept-popup").classList.add("hide");

    /* Not using event listeners to make sure we only have one callback */
    document.getElementById("popup").querySelector(".close-popup").onclick = (e) => {
        hidePopup();
        if (onCloseCallback)
            onCloseCallback();
    }
    document.getElementById("popup").querySelector(".content").innerHTML = message;
}

function showWaitPopup(message) {
    document.getElementById("grayout").classList.remove("hide");
    document.getElementById("popup").classList.remove("hide");
    document.getElementById("popup").querySelector(".error").classList.add("hide");
    document.getElementById("popup").querySelector(".wait").classList.remove("hide");
    document.getElementById("popup").querySelector(".confirm").classList.add("hide");
    document.getElementById("popup").querySelector(".close-popup").classList.add("hide");
    document.getElementById("popup").querySelector(".accept-popup").classList.add("hide");
    document.getElementById("popup").querySelector(".content").innerHTML = message;
}

function showWaitLoadingPopup(message) {
    document.getElementById("grayout").classList.remove("hide");
    document.getElementById("popup").classList.remove("hide");
    document.getElementById("popup").querySelector(".error").classList.add("hide");
    document.getElementById("popup").querySelector(".wait").classList.remove("hide");
    document.getElementById("popup").querySelector(".confirm").classList.add("hide");
    document.getElementById("popup").querySelector(".close-popup").classList.add("hide");
    document.getElementById("popup").querySelector(".accept-popup").classList.add("hide");
    document.getElementById("popup").querySelector(".content").innerHTML = `${message}<div class="loading-bar" style="width: 100%; height: 10px;"></div><div class="loading-message" style="font-weight: normal; text-align: center;"></div>` ;
}

function showConfirmPopup(message, onAcceptCallback, onCloseCallback) {
    document.getElementById("grayout").classList.remove("hide");
    document.getElementById("popup").classList.remove("hide");
    document.getElementById("popup").querySelector(".error").classList.add("hide");
    document.getElementById("popup").querySelector(".wait").classList.add("hide");
    document.getElementById("popup").querySelector(".confirm").classList.remove("hide");
    document.getElementById("popup").querySelector(".close-popup").classList.remove("hide");
    document.getElementById("popup").querySelector(".accept-popup").classList.remove("hide");

    /* Not using event listeners to make sure we only have one callback */
    document.getElementById("popup").querySelector(".close-popup").onclick = (e) => {
        hidePopup();
        if (onCloseCallback)
            onCloseCallback();
    }

     /* Not using event listeners to make sure we only have one callback */
     document.getElementById("popup").querySelector(".accept-popup").onclick = (e) => {
        hidePopup();
        if (onAcceptCallback)
            onAcceptCallback();
    }

    document.getElementById("popup").querySelector(".content").innerHTML = message;
}

function hidePopup() {
    document.getElementById("grayout").classList.add("hide");
    document.getElementById("popup").classList.add("hide");
}

function setPopupLoadingProgress(message, percent) {
    document.querySelector("#popup .loading-message").innerHTML = message;
    if (percent) {
        var style = document.querySelector('#popup .loading-bar').style;
        style.setProperty('--percent', `${percent}%`);
    }
}

module.exports = {
    showInfoPopup: showInfoPopup,
    showErrorPopup: showErrorPopup,
    showConfirmPopup: showConfirmPopup,
    showWaitPopup: showWaitPopup,
    showWaitLoadingPopup: showWaitLoadingPopup,
    hidePopup: hidePopup,
    setPopupLoadingProgress: setPopupLoadingProgress
}