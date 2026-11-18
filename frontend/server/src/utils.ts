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

function normalizeAddress(address) {
  if (typeof address !== "string") {
    return null;
  }

  if (address.startsWith("::ffff:")) {
    return address.slice(7);
  }

  return address;
}

function isLoopbackAddress(address) {
  const normalized = normalizeAddress(address);
  return normalized === "127.0.0.1" || normalized === "::1";
}

function isTrustedCustomAuthSource(config, req) {
  const remoteAddress = normalizeAddress(req.socket?.remoteAddress ?? req.connection?.remoteAddress);
  if (!remoteAddress) {
    return false;
  }

  const trustedProxyIps = config?.frontend?.customAuthHeaders?.trustedProxyIps;
  if (Array.isArray(trustedProxyIps) && trustedProxyIps.length > 0) {
    return trustedProxyIps.some((ip) => normalizeAddress(ip) === remoteAddress);
  }

  return isLoopbackAddress(remoteAddress);
}

export function connectionIsLocal(config, req) {
  /* Check if the connection is local, and if autoconnection is enabled */
  let local = false;
  if (config.frontend.autoconnectWhenLocal) {
    const isLoopback = isLoopbackAddress(req.socket?.remoteAddress ?? req.connection?.remoteAddress);

    if (isLoopback) {
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
    if (!isTrustedCustomAuthSource(config, req)) {
      return user;
    }

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
