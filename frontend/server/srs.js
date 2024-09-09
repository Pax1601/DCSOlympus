const WaveFile = require('wavefile').WaveFile;

var fs = require('fs');
let source = fs.readFileSync('sample3.WAV');
let wav = new WaveFile(source);
let wavBuffer = wav.toBuffer();
const { OpusEncoder } = require('@discordjs/opus');
const encoder = new OpusEncoder(16000, 1);

let fileIndex = 0;
let packetID = 0;

var udp = require("dgram");
var udpClient = udp.createSocket("udp4");

let clientData = {
  ClientGuid: "AZi9CkptY0yW_C-3YmI7oQ",
  Name: "Olympus",
  Seat: 0,
  Coalition: 0,
  AllowRecord: false,
  RadioInfo: {
    radios: [
      {
        enc: false,
        encKey: 0,
        freq: 1.0,
        modulation: 3,
        secFreq: 1.0,
        retransmit: false,
      },
      {
        enc: false,
        encKey: 0,
        freq: 1.0,
        modulation: 3,
        secFreq: 1.0,
        retransmit: false,
      },
      {
        enc: false,
        encKey: 0,
        freq: 1.0,
        modulation: 3,
        secFreq: 1.0,
        retransmit: false,
      },
      {
        enc: false,
        encKey: 0,
        freq: 1.0,
        modulation: 3,
        secFreq: 1.0,
        retransmit: false,
      },
      {
        enc: false,
        encKey: 0,
        freq: 1.0,
        modulation: 3,
        secFreq: 1.0,
        retransmit: false,
      },
      {
        enc: false,
        encKey: 0,
        freq: 1.0,
        modulation: 3,
        secFreq: 1.0,
        retransmit: false,
      },
      {
        enc: false,
        encKey: 0,
        freq: 1.0,
        modulation: 3,
        secFreq: 1.0,
        retransmit: false,
      },
      {
        enc: false,
        encKey: 0,
        freq: 1.0,
        modulation: 3,
        secFreq: 1.0,
        retransmit: false,
      },
      {
        enc: false,
        encKey: 0,
        freq: 1.0,
        modulation: 3,
        secFreq: 1.0,
        retransmit: false,
      },
      {
        enc: false,
        encKey: 0,
        freq: 1.0,
        modulation: 3,
        secFreq: 1.0,
        retransmit: false,
      },
      {
        enc: false,
        encKey: 0,
        freq: 1.0,
        modulation: 3,
        secFreq: 1.0,
        retransmit: false,
      },
    ],
    unit: "",
    unitId: 0,
    iff: {
      control: 2,
      mode1: -1,
      mode2: -1,
      mode3: -1,
      mode4: false,
      mic: -1,
      status: 0,
    },
    ambient: { vol: 1.0, abType: "" },
  },
  LatLngPosition: { lat: 0.0, lng: 0.0, alt: 0.0 },
};

var net = require("net");

var tcpClient = new net.Socket();

tcpClient.on("data", function (data) {
  console.log("Received: " + data);
  
});

tcpClient.on("close", function () {
  console.log("Connection closed");
});

tcpClient.connect(5002, "localhost", function () {
  console.log("Connected");

  setTimeout(() => {
    let SYNC = {
      Client: clientData,
      MsgType: 2,
      Version: "2.1.0.10",
    };
    let string = JSON.stringify(SYNC);
    tcpClient.write(string + "\n");

    setInterval(() => {
      let slice = [];
      for (let i = 0; i < 16000 * 0.04; i++) {
        slice.push(wavBuffer[Math.round(fileIndex) * 2], wavBuffer[Math.round(fileIndex) * 2 + 1]);
        fileIndex += 44100 / 16000;
      }
      const encoded = encoder.encode(new Uint8Array(slice));
  
      let header = [
        0, 0,
        0, 0,
        0, 0
      ]
  
      let encFrequency = [...doubleToByteArray(251000000)];
      let encModulation = [2];
      let encEncryption = [0];
  
      let encUnitID = getBytes(100000001, 4);
      let encPacketID = getBytes(packetID, 8);
      packetID++;
      let encHops = [0];
      
      let packet = [].concat(header, [...encoded], encFrequency, encModulation, encEncryption, encUnitID, encPacketID, encHops, [...Buffer.from(clientData.ClientGuid, 'utf-8')], [...Buffer.from(clientData.ClientGuid, 'utf-8')]);
      
      let encPacketLen = getBytes(packet.length, 2);
      packet[0] = encPacketLen[0];
      packet[1] = encPacketLen[1];
  
      let encAudioLen = getBytes(encoded.length, 2);
      packet[2] = encAudioLen[0];
      packet[3] = encAudioLen[1];
  
      let frequencyAudioLen = getBytes(10, 2);
      packet[4] = frequencyAudioLen[0];
      packet[5] = frequencyAudioLen[1];
  
      let data = new Uint8Array(packet);
      udpClient.send(data, 5002, "localhost", function (error) {
        if (error) {
          tcpClient.close();
        } else {
          console.log("Data sent !!!");
        }
      });
    }, 40);
  }, 1000);
});

function getBytes(value, length) {
  let res = [];
  for (let i = 0; i < length; i++) {
    res.push(value & 255);
    value = value >> 8;
  }
  return res;
}

function doubleToByteArray(number) {
  var buffer = new ArrayBuffer(8);         // JS numbers are 8 bytes long, or 64 bits
  var longNum = new Float64Array(buffer);  // so equivalent to Float64

  longNum[0] = number;

  return Array.from(new Uint8Array(buffer)); 
}