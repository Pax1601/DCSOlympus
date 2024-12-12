import express = require("express");
//const gtts = require("node-gtts")("en");
const speech = require("@google-cloud/speech");
const textToSpeech = require('@google-cloud/text-to-speech');
const router = express.Router();

// Creates a client
const recognizeClient = new speech.SpeechClient();
const generateClient = new textToSpeech.TextToSpeechClient();

module.exports = function () {
  router.put("/generate", (req, res, next) => {
    const request = {
      input: {text: req.body.text},
      voice: {languageCode: 'en-US', ssmlGender: 'MALE'},
      audioConfig: {audioEncoding: 'MP3'},
    };
    
    generateClient.synthesizeSpeech(request).then(
      (response) => {
        res.set({ "Content-Type": "audio/mpeg" });
        res.send(response[0].audioContent);
        res.end()
      }
    ).catch((error) => res.sendStatus(404)); 
  });

  router.put("/recognize", (req, res, next) => {

    // The audio file's encoding, sample rate in hertz, and BCP-47 language code
    const audio = {
      content: req.body.data.substring(req.body.data.indexOf("base64,") + 7),
    };
    const config = {
      encoding: "WEBM_OPUS",
      languageCode: "en-US"
    };
    const request = {
      audio: audio,
      config: config,
    };

    // Detects speech in the audio file
    recognizeClient.recognize(request).then((response) => {
      const transcription = response[0].results 
        .map((result) => result.alternatives[0].transcript)
        .join("\n");
      res.send(transcription)
    }).catch((error) => res.sendStatus(404)); 
  });

  return router;
};
