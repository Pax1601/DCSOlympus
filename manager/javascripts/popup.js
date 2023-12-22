function showPopup(message, onCloseCallback) {
    document.getElementById("grayout").classList.remove("hide");
    document.getElementById("popup").classList.remove("hide");
    document.getElementById("popup").querySelector(".close-popup").addEventListener("click", (e) => {
        hidePopup();
        onCloseCallback();
    })
    document.getElementById("popup").querySelector(".content").innerText = message;
}

function hidePopup() {
    document.getElementById("grayout").classList.add("hide");
    document.getElementById("popup").classList.add("hide");
}

module.exports = {
    showPopup: showPopup,
    hidePopup: hidePopup
}