// Haversine formula — calculates distance between two GPS coordinates in meters
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const checkGeofence = (req, res, next) => {
  const { latitude, longitude } = req.body;

  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: "Location coordinates are required." });
  }

  const campusLat = parseFloat(process.env.CAMPUS_LATITUDE);
  const campusLon = parseFloat(process.env.CAMPUS_LONGITUDE);
  const allowedRadius = parseFloat(process.env.CAMPUS_RADIUS_METERS) || 300;

  const distance = haversineDistance(latitude, longitude, campusLat, campusLon);

  if (distance > allowedRadius) {
    return res.status(403).json({
      error: "Check-in failed. You must be on campus to mark attendance.",
      distanceFromCampus: `${Math.round(distance)}m`,
      allowedRadius: `${allowedRadius}m`,
    });
  }

  req.distanceFromCampus = distance;
  next();
};

module.exports = { checkGeofence, haversineDistance };
