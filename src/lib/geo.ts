/**
 * Calculates the distance between two coordinate points in kilometers using the Haversine formula.
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in kilometers
 */
export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Validates if the user is within the allowed radius of a target location.
 */
export function isWithinRadius(
  userLat: number, 
  userLng: number, 
  targetLat: number, 
  targetLng: number, 
  allowedRadiusKm: number = 0.5
): { valid: boolean; distanceKm: number } {
  const distanceKm = getDistanceKm(userLat, userLng, targetLat, targetLng);
  return {
    valid: distanceKm <= allowedRadiusKm,
    distanceKm
  };
}
