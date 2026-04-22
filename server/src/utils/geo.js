const http = require('http');

/**
 * Fetch geolocation data for an IP address
 * @param {string} ip 
 * @returns {Promise<object>}
 */
async function getGeoData(ip) {
  // skip local IPs
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return null;
  }

  return new Promise((resolve) => {
    http.get(`http://ip-api.com/json/${ip}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.status === 'success') {
            resolve({
              country: parsed.country,
              city: parsed.city,
              lat: parsed.lat,
              lon: parsed.lon,
              isp: parsed.isp,
              org: parsed.org
            });
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

module.exports = { getGeoData };
