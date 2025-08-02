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

export function connectionIsLocal(config, req) {
  /* Check if the connection is local, and if autoconnection is enabled */
  let local = false;
  if (config.frontend.autoconnectWhenLocal) {
    
    var ip = req.connection.remoteAddress;
    var host = req.get('host');
    
    /* If the request address is not localhost, we are not local */
    if (!(ip === "127.0.0.1" || ip === "::ffff:127.0.0.1" || ip === "::1" || host.indexOf("localhost") !== -1)) {
      local = false;
    } else {
      /* If the request address is localhost, we are local unless a proxyHeader is present (to be used with reverse proxies) */
      local = req.headers[config.frontend.proxyHeader] === undefined;
    }
  }
  return local;
}

export function getUserFromCustomHeaders(config, usersConfig, groupsConfig, req) {
  let user = req.auth?.user ?? null;
  let group = null;

  /* Check if custom authorization headers are enabled */
  if ("customAuthHeaders" in config["frontend"] && config["frontend"]["customAuthHeaders"]["enabled"]) {
    /* If so, check that the custom headers are indeed present */
    if (
      config["frontend"]["customAuthHeaders"]["username"].toLowerCase() in req.headers &&
      config["frontend"]["customAuthHeaders"]["group"].toLowerCase() in req.headers
    ) {
      /* If they are, assign the group */
      group = req.headers[config["frontend"]["customAuthHeaders"]["group"].toLowerCase()];

      /* Check that the user is in an existing group */
      if (group in groupsConfig) {
        user = req.headers[config["frontend"]["customAuthHeaders"]["username"].toLowerCase()];
        usersConfig[user] = { password: null, roles: groupsConfig[group] };
      }
    }
  }

  return user;
}
