import { OlympusApp } from "./app";

var app: OlympusApp;

function setup() {
    app = new OlympusApp();
    app.start();    
}

export function getApp() {
    return app;
}

window.onload = setup;