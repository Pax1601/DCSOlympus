import express = require("express");
import fs = require("fs");
var gtts = require("node-gtts")("en");

const router = express.Router();

module.exports = function () {
  router.put("/generate", (req, res, next) => {
    res.set({ "Content-Type": "audio/mpeg" });
    gtts.stream(req.body.text).pipe(res);
  });

  router.get("/recognize", (req, res, next) => {
    //// Imports the Google Cloud client library
    //const speech = require("@google-cloud/speech");
//
    //// Creates a client
    //const client = new speech.SpeechClient();
//
    //// The path to the remote LINEAR16 file
    //const gcsUri = "gs://cloud-samples-data/speech/brooklyn_bridge.raw";
//
    //// The audio file's encoding, sample rate in hertz, and BCP-47 language code
    //const audio = {
    //  uri: gcsUri,
    //};
    //const config = {
    //  encoding: "LINEAR16",
    //  sampleRateHertz: 16000,
    //  languageCode: "en-US",
    //};
    //const request = {
    //  audio: audio,
    //  config: config,
    //};
//
    //// Detects speech in the audio file
    //client.recognize(request).then((response) => {
    //  const transcription = response.results
    //    .map((result) => result.alternatives[0].transcript)
    //    .join("\n");
    //  console.log(`Transcription: ${transcription}`);
    //});
  });

  return router;
};
