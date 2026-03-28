const addresses = [
  "965a Huỳnh Tấn Phát, Quận 7, Thành phố Hồ Chí Minh",
  "Huỳnh Tấn Phát, Quận 7, Hồ Chí Minh",
  "Galaxy Nguyễn Du, Quận 1, TP.HCM", // from screenshot
  "116 Nguyễn Du, Quận 1, TP.HCM", // from screenshot
];

const orsKey = '5b3ce3597851110001cf624891e2d06862484566b57d559fd48de1f6'; // Decoded from base64 earlier?
// Wait, the .env says: VITE_ORS_API_KEY=eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjkxZTJkMDY4NjI0ODQ1NjZiNTdkNTU5ZmQ0OGRlMWY2IiwiaCI6Im11cm11cjY0In0=
async function test() {
  const apiKey = '5b3ce3597851110001cf624891e2d06862484566b57d559fd48de1f6';
  for (const address of addresses) {
    const url = `https://api.openrouteservice.org/geocode/search?api_key=${apiKey}&text=${encodeURIComponent(address)}&boundary.country=VN`;
    console.log("Testing:", address);
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        console.log(" -> Result:", data.features[0].properties.label, "| Coords:", data.features[0].geometry.coordinates);
      } else {
        console.log(" -> No results");
      }
    } catch (e) {
      console.log(" -> Error:", e.message);
    }
  }
}

test();
