export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const destination = req.query.destination;
  if (!destination) {
    return res.status(400).json({ ok: false, error: 'Missing destination' });
  }

  const HEADERS = { 'User-Agent': 'AdrianoCameraBooking/1.0' };

  try {
    // 1. Geocode origin (Brossard home address)
    const originGeo = await fetch(
      'https://nominatim.openstreetmap.org/search?q=' +
      encodeURIComponent('5815 Rue Bretagne, Brossard, QC, Canada') +
      '&format=json&limit=1',
      { headers: HEADERS }
    ).then(r => r.json());

    if (!originGeo.length) {
      return res.status(200).json({ ok: false, error: 'Could not geocode origin' });
    }

    // 2. Geocode destination
    const destGeo = await fetch(
      'https://nominatim.openstreetmap.org/search?q=' +
      encodeURIComponent(destination) +
      '&format=json&limit=1',
      { headers: HEADERS }
    ).then(r => r.json());

    if (!destGeo.length) {
      return res.status(200).json({ ok: false, error: 'Address not found' });
    }

    const oLon = originGeo[0].lon, oLat = originGeo[0].lat;
    const dLon = destGeo[0].lon,  dLat = destGeo[0].lat;

    // 3. Get driving distance via OSRM
    const route = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${oLon},${oLat};${dLon},${dLat}?overview=false`,
      { headers: HEADERS }
    ).then(r => r.json());

    if (route.code !== 'Ok' || !route.routes.length) {
      return res.status(200).json({ ok: false, error: 'Could not calculate route' });
    }

    const km = Math.ceil(route.routes[0].distance / 1000);
    return res.status(200).json({ ok: true, km });

  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
