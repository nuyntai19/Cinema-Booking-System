const addresses = [
  "965a Huỳnh Tấn Phát, Quận 7, Thành phố Hồ Chí Minh",
  "116 Nguyễn Du, Quận 1, TP.HCM",
  "Lô A4, Đường 2/9, Hải Châu, Đà Nẵng",
  "246 Nguyễn Hồng Đào, Quận Tân Bình, TP.HCM"
];

async function test() {
  for (const address of addresses) {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
    console.log("Testing:", address);
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'CinemaBookingSystem/1.0' } });
      const data = await res.json();
      if (data && data.length > 0) {
        console.log(" -> Result:", data[0].display_name, "| Coords:", [parseFloat(data[0].lon), parseFloat(data[0].lat)]);
      } else {
        console.log(" -> No results");
      }
    } catch (e) {
      console.log(" -> Error:", e.message);
    }
  }
}

test();
