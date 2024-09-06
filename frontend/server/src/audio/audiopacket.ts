import { Buffer } from "buffer";
import {
  byteArrayToDouble,
  byteArrayToInteger,
  doubleToByteArray,
  integerToByteArray,
} from "../utils";

var packetID = 0;

export class AudioPacket {
  #encodedData: Uint8Array;
  
  /* Mandatory data */
  #frequencies: { frequency: number; modulation: number; encryption: number }[];
  #audioData: Uint8Array;
  #transmissionGUID: string;
  #clientGUID: string;

  /* Default data */
  #unitID: number = 0;
  #packetID: number = 0;
  #hops: number = 0;

  /* Out of standard data (this is not compliant with SRS standard, used for external audio effects) */
  #latitude: number | null = null;
  #longitude: number | null = null;
  #altitude: number | null = null;

  setEncodedData(encodedData: Uint8Array) {
    this.#encodedData = encodedData;
  }

  getEncodedData() {
    return this.#encodedData;
  }

  setFrequencies(frequencies: { frequency: number; modulation: number; encryption: number }[]) {
    this.#frequencies = frequencies;
  }

  getFrequencies() {
    return this.#frequencies;
  }

  setAudioData(audioData: Uint8Array) {
    this.#audioData = audioData;
  }

  getAudioData() {
    return this.#audioData;
  }

  setTransmissionGUID(transmissionGUID: string) {
    this.#transmissionGUID = transmissionGUID;
  }

  getTransmissionGUID() {
    return this.#transmissionGUID;
  }

  setClientGUID(clientGUID: string) {
    this.#clientGUID = clientGUID;
  }

  getClientGUID() {
    return this.#clientGUID;
  }

  setUnitID(unitID: number) {
    this.#unitID = unitID;
  }

  getUnitID() {
    return this.#unitID;
  }

  setPacketID(packetID: number) {
    this.#packetID = packetID;
  }
  
  getPacketID() {
    return this.#packetID;
  }

  setHops(hops: number) {
    this.#hops = hops;
  }

  getHops() {
    return this.#hops;
  }

  setLatitude(latitude: number) {
    this.#latitude = latitude;
  }

  getLatitude() {
    return this.#latitude;
  }

  setLongitude(longitude: number) {
    this.#longitude = longitude;
  }

  getLongitude() {
    return this.#longitude;
  }

  setAltitude(altitude: number) {
    this.#altitude = altitude;
  }

  getAltitude() {
    return this.#altitude;
  }

  fromByteArray(byteArray: Uint8Array) {
    let totalLength = byteArrayToInteger(byteArray.slice(0, 2));
    let audioLength = byteArrayToInteger(byteArray.slice(2, 4));
    let frequenciesLength = byteArrayToInteger(byteArray.slice(4, 6));

    /* Perform some sanity checks */
    if (totalLength !== byteArray.length) {
      console.log(
        `Warning, audio packet expected length is ${totalLength} but received length is ${byteArray.length}, aborting...`
      );
      return;
    }

    if (frequenciesLength % 10 !== 0) {
      console.log(
        `Warning, audio packet frequencies data length is ${frequenciesLength} which is not a multiple of 10, aborting...`
      );
      return;
    }

    /* Extract the audio data */
    this.#audioData = byteArray.slice(6, 6 + audioLength);

    /* Extract the frequencies */
    let offset = 6 + audioLength;
    for (let idx = 0; idx < frequenciesLength / 10; idx++) {
      this.#frequencies.push({
        frequency: byteArrayToDouble(byteArray.slice(offset, offset + 8)),
        encryption: byteArray[offset + 8],
        modulation: byteArray[offset + 9],
      });
      offset += 10;
    }

    /* Extract the remaining data */
    this.#unitID = byteArrayToInteger(byteArray.slice(offset, offset + 4));
    offset += 4;
    this.#packetID = byteArrayToInteger(byteArray.slice(offset, offset + 8));
    offset += 8;
    this.#hops = byteArrayToInteger(byteArray.slice(offset, offset + 1));
    offset += 1;
    this.#transmissionGUID = byteArray.slice(offset, offset + 22).toString();
    offset += 22;
    this.#clientGUID = byteArray.slice(offset, offset + 22).toString();
    offset += 22;
  }

  toByteArray() {
    /* Perform some sanity checks // TODO check correct values */
    if (this.#frequencies.length === 0) {
        console.log("Warning, could not encode audio packet, no frequencies data provided, aborting...");
        return;
    }

    if (this.#audioData === undefined) {
        console.log("Warning, could not encode audio packet, no audio data provided, aborting...");
        return;
    }

    if (this.#transmissionGUID === undefined) {
        console.log("Warning, could not encode audio packet, no transmission GUID provided, aborting...");
        return;
    }

    if (this.#clientGUID === undefined) {
        console.log("Warning, could not encode audio packet, no client GUID provided, aborting...");
        return;
    }
    
    // Prepare the array for the header
    let header: number[] = [0, 0, 0, 0, 0, 0];

    // Encode the frequencies data
    let frequenciesData = ([] as number[])
    this.#frequencies.forEach((data) => {
        return frequenciesData.concat([...doubleToByteArray(data.frequency)], [data.modulation], [data.encryption]);
    })
    
    // Encode unitID, packetID, hops
    let encUnitID: number[] = integerToByteArray(this.#unitID, 4);
    let encPacketID: number[] = integerToByteArray(this.#packetID, 8);
    let encHops: number[] = [this.#hops];

    // Assemble packet
    let encodedData: number[] = ([] as number[]).concat(
      header,
      [...this.#audioData],
      frequenciesData,
      encUnitID,
      encPacketID,
      encHops,
      [...Buffer.from(this.#transmissionGUID, "utf-8")],
      [...Buffer.from(this.#clientGUID, "utf-8")]
    );

    if (this.#latitude !== undefined && this.#longitude !== undefined && this.#altitude !== undefined) {
      encodedData.concat(
        [...doubleToByteArray(this.#latitude)],
        [...doubleToByteArray(this.#longitude)],
        [...doubleToByteArray(this.#altitude)]
      );
    }

    // Set the lengths of the parts
    let encPacketLen = integerToByteArray(encodedData.length, 2);
    encodedData[0] = encPacketLen[0];
    encodedData[1] = encPacketLen[1];

    let encAudioLen = integerToByteArray(this.#audioData.length, 2);
    encodedData[2] = encAudioLen[0];
    encodedData[3] = encAudioLen[1];

    let frequencyAudioLen = integerToByteArray(frequenciesData.length, 2);
    encodedData[4] = frequencyAudioLen[0];
    encodedData[5] = frequencyAudioLen[1];

    this.#encodedData = new Uint8Array([0].concat(encodedData));
  }
}
