import { Buffer } from "buffer";

function getBytes(value, length) {
  let res: number[] = [];
  for (let i = 0; i < length; i++) {
    res.push(value & 255);
    value = value >> 8;
  }
  return res;
}

function doubleToByteArray(number) {
  var buffer = new ArrayBuffer(8); // JS numbers are 8 bytes long, or 64 bits
  var longNum = new Float64Array(buffer); // so equivalent to Float64

  longNum[0] = number;

  return Array.from(new Uint8Array(buffer));
}

var packetID = 0;

export class AudioPacket {
  #packet: Uint8Array;

  constructor(data, settings, guid) {
    let header: number[] = [0, 0, 0, 0, 0, 0];

    let encFrequency: number[] = [...doubleToByteArray(settings.frequency)];
    let encModulation: number[] = [settings.modulation];
    let encEncryption: number[] = [0];

    let encUnitID: number[] = getBytes(100000001, 4);
    let encPacketID: number[] = getBytes(packetID, 8);
    packetID++;
    let encHops: number[] = [0];

    let packet: number[] = ([] as number[]).concat(
      header,
      [...data],
      encFrequency,
      encModulation,
      encEncryption,
      encUnitID,
      encPacketID,
      encHops,
      [...Buffer.from(guid, "utf-8")],
      [...Buffer.from(guid, "utf-8")]
    );

    let encPacketLen = getBytes(packet.length, 2);
    packet[0] = encPacketLen[0];
    packet[1] = encPacketLen[1];

    let encAudioLen = getBytes(data.length, 2);
    packet[2] = encAudioLen[0];
    packet[3] = encAudioLen[1];

    let frequencyAudioLen = getBytes(10, 2);
    packet[4] = frequencyAudioLen[0];
    packet[5] = frequencyAudioLen[1];

    this.#packet = new Uint8Array([0].concat(packet));
  }

  getArray() {
    return this.#packet;
  }
}
