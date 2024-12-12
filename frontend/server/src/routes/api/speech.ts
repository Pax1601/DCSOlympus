import express = require("express");
//const gtts = require("node-gtts")("en");
const speech = require("@google-cloud/speech");
const router = express.Router();

module.exports = function () {
  router.put("/generate", (req, res, next) => {
    //res.set({ "Content-Type": "audio/mpeg" });
    // TODO
    //gtts.stream(req.body.text).pipe(res);
    res.sendStatus(404);
  });

  router.put("/recognize", (req, res, next) => {
    // Creates a client
    const client = new speech.SpeechClient();
    
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
    client.recognize(request).then((response) => {
      const transcription = response[0].results 
        .map((result) => result.alternatives[0].transcript)
        .join("\n");
      res.send(transcription)
    }).catch((error) => res.sendStatus(400)); 
  });

  return router;
};
