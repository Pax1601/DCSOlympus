// TODO: we can probably refactor this to be a bit cleaner

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

module.exports = {
    showErrorPopup: showErrorPopup,
    showConfirmPopup: showConfirmPopup,
    showWaitPopup: showWaitPopup,
    hidePopup: hidePopup
}