function distance(lat1, lon1, lat2, lon2)
{
    const R = 6371e3; // metres
    const φ1 = deg2rad(lat1); // φ, λ in radians
    const φ2 = deg2rad(lat2);
    const Δφ = deg2rad(lat2-lat1);
    const Δλ = deg2rad(lon2-lon1);

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    const d = R * c; // in metres

    return d;
}

function bearing(lat1, lon1, lat2, lon2)
{
    const φ1 = deg2rad(lat1); // φ, λ in radians
    const φ2 = deg2rad(lat2);
    const λ1 = deg2rad(lon1); // φ, λ in radians
    const λ2 = deg2rad(lon2);
    const y = Math.sin(λ2-λ1) * Math.cos(φ2);
    const x = Math.cos(φ1)*Math.sin(φ2) - Math.sin(φ1)*Math.cos(φ2)*Math.cos(λ2-λ1);
    const θ = Math.atan2(y, x);
    const brng = (rad2deg(θ) + 360) % 360; // in degrees

    return brng;
}

function latlng2xy(lat, lon)
{
    const latBulls = missionData.bullseye.lat;
    const lonBulls = missionData.bullseye.lng;
    const d = distance(latBulls, lonBulls, lat, lon);
    const brng = bearing(latBulls, lonBulls, lat, lon);
    const x = d * Math.cos(deg2rad(brng));
    const y = d * Math.sin(deg2rad(brng));

    xy = {};
    xy.x = x;
    xy.y = y;

    return xy;
}

function xy2latlng(x, y)
{
    const xBulls = missionData.bullseye.x;
    const yBulls = missionData.bullseye.y;
    const latBulls = missionData.bullseye.lat;
    const lonBulls = missionData.bullseye.lng;

    const R = 6371e3; // metres
    const φ1 = deg2rad(latBulls); // φ, λ in radians
    const λ1 = deg2rad(lonBulls); // φ, λ in radians

    const d = Math.sqrt(Math.pow(x - xBulls, 2) + Math.pow(y - yBulls, 2));
    const brng = -rad2deg(Math.atan2(y - yBulls, x - xBulls));

    const φ2 = Math.asin(Math.sin(φ1)*Math.cos(d/R) + Math.cos(φ1)*Math.sin(d/R)*Math.cos(brng));
    const λ2 = λ1 + Math.atan2(Math.sin(brng)*Math.sin(d/R)*Math.cos(φ1), Math.cos(d/R)-Math.sin(φ1)*Math.sin(φ2));

    latlng = {};
    latlng.lat = rad2deg(φ2);
    latlng.lng = rad2deg(λ2);

    return latlng;
}

const zeroPad = (num, places) => String(num).padStart(places, '0')

function ConvertDDToDMS(D, lng) 
{
    var dir = D < 0 ? (lng ? "W" : "S") : lng ? "E" : "N";
    var deg = 0 | (D < 0 ? (D = -D) : D);
    var min = 0 | (((D += 1e-9) % 1) * 60);
    var sec = (0 | (((D * 60) % 1) * 6000)) / 100;
    var dec = Math.round((sec - Math.floor(sec)) * 100);
    var sec = Math.floor(sec);
    if (lng)
        return dir + zeroPad(deg, 3) + "°" + zeroPad(min, 2) + "'" + zeroPad(sec, 2) + "." + zeroPad(dec, 2) + "\"";
    else
        return dir + zeroPad(deg, 2) + "°" + zeroPad(min, 2) + "'" + zeroPad(sec, 2) + "." + zeroPad(dec, 2) + "\"";
}

function deg2rad(deg)
{
    var pi = Math.PI;
    return deg * (pi/180);
}

function rad2deg(rad)
{
    var pi = Math.PI;
    return rad / (pi/180);
}