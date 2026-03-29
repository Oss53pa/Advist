import * as Location from 'expo-location';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  timestamp: number;
  address?: string;
  city?: string;
  country?: string;
}

export interface LocationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
}

/**
 * Check location permission status
 */
export async function checkLocationPermission(): Promise<LocationPermissionStatus> {
  try {
    const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
    return {
      granted: status === 'granted',
      canAskAgain,
    };
  } catch (error) {
    console.error('Location permission check error:', error);
    return { granted: false, canAskAgain: true };
  }
}

/**
 * Request location permission
 */
export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Location permission request error:', error);
    return false;
  }
}

/**
 * Get current location with high accuracy
 */
export async function getCurrentLocation(): Promise<LocationData | null> {
  try {
    const permission = await checkLocationPermission();

    if (!permission.granted) {
      const granted = await requestLocationPermission();
      if (!granted) {
        return null;
      }
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      altitude: location.coords.altitude,
      timestamp: location.timestamp,
    };
  } catch (error) {
    console.error('Get current location error:', error);
    return null;
  }
}

/**
 * Get current location with reverse geocoding
 */
export async function getCurrentLocationWithAddress(): Promise<LocationData | null> {
  try {
    const location = await getCurrentLocation();

    if (!location) {
      return null;
    }

    const [address] = await Location.reverseGeocodeAsync({
      latitude: location.latitude,
      longitude: location.longitude,
    });

    if (address) {
      return {
        ...location,
        address: formatAddress(address),
        city: address.city || address.subregion || undefined,
        country: address.country || undefined,
      };
    }

    return location;
  } catch (error) {
    console.error('Get location with address error:', error);
    return null;
  }
}

/**
 * Format address object to string
 */
function formatAddress(address: Location.LocationGeocodedAddress): string {
  const parts = [
    address.streetNumber,
    address.street,
    address.city,
    address.postalCode,
    address.country,
  ].filter(Boolean);

  return parts.join(', ');
}

/**
 * Get location for signature (with timeout)
 */
export async function getLocationForSignature(
  timeoutMs: number = 10000
): Promise<LocationData | null> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve(null);
    }, timeoutMs);

    getCurrentLocationWithAddress()
      .then((location) => {
        clearTimeout(timeout);
        resolve(location);
      })
      .catch(() => {
        clearTimeout(timeout);
        resolve(null);
      });
  });
}

/**
 * Check if location services are enabled
 */
export async function isLocationServicesEnabled(): Promise<boolean> {
  try {
    return await Location.hasServicesEnabledAsync();
  } catch (error) {
    console.error('Location services check error:', error);
    return false;
  }
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(
  latitude: number,
  longitude: number,
  decimals: number = 6
): string {
  const latDir = latitude >= 0 ? 'N' : 'S';
  const lonDir = longitude >= 0 ? 'E' : 'O';

  return `${Math.abs(latitude).toFixed(decimals)}${latDir}, ${Math.abs(longitude).toFixed(decimals)}${lonDir}`;
}
