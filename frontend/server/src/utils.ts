export function byteArrayToInteger(array) {
  let res = 0;
  for (let i = 0; i < array.length; i++) {
    res = res << 8;
    res += array[array.length - i - 1];
  }
  return res;
}

export function integerToByteArray(value, length) {
  let res: number[] = [];
  for (let i = 0; i < length; i++) {
    res.push(value & 255);
    value = value >> 8;
  }
  return res;
}

export function doubleToByteArray(number) {
  var buffer = new ArrayBuffer(8); // JS numbers are 8 bytes long, or 64 bits
  var longNum = new Float64Array(buffer); // so equivalent to Float64

  longNum[0] = number;

  return Array.from(new Uint8Array(buffer));
}

export function byteArrayToDouble(array) {
  return new DataView(array.reverse().buffer).getFloat64(0);
}
