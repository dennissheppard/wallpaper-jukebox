interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    weather_code: number;
    wind_speed_10m: number;
  };
}

interface LocationData {
  lat: number;
  lon: number;
  city?: string;
  region?: string;
  country?: string;
}

// Weather code to condition mapping based on Open-Meteo WMO codes
// https://open-meteo.com/en/docs
function getConditionFromCode(code: number): string {
  if (code === 0) return 'clear';
  if (code >= 1 && code <= 3) return 'partly-cloudy';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if (code >= 61 && code <= 67) return 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return 'rain';
  if (code >= 85 && code <= 86) return 'snow';
  if (code === 95) return 'thunderstorm';
  if (code >= 96 && code <= 99) return 'thunderstorm';
  return 'unknown';
}

function getDescriptionFromCode(code: number): string {
  const descriptions: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };
  return descriptions[code] || 'Unknown';
}

export async function getWeatherData(lat: number, lon: number, temperatureUnit: 'C' | 'F' = 'F') {
  const tempUnit = temperatureUnit === 'F' ? 'fahrenheit' : 'celsius';
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&temperature_unit=${tempUnit}&wind_speed_unit=mph`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch weather data');
  }

  const data: OpenMeteoResponse = await response.json();
  const current = data.current;

  return {
    temperature: Math.round(current.temperature_2m),
    temperatureUnit,
    condition: getConditionFromCode(current.weather_code),
    feelsLike: Math.round(current.apparent_temperature),
    humidity: current.relative_humidity_2m,
    windSpeed: Math.round(current.wind_speed_10m),
    description: getDescriptionFromCode(current.weather_code),
  };
}

// Get approximate location from IP using a free IP geolocation service
export async function getLocationFromIP(): Promise<LocationData> {
  try {
    // Using ip-api.com (free, no key required)
    const response = await fetch('http://ip-api.com/json/?fields=lat,lon,city,regionName,country');
    if (!response.ok) {
      throw new Error('Failed to get location from IP');
    }

    const data = await response.json();
    return {
      lat: data.lat,
      lon: data.lon,
      city: data.city,
      region: data.regionName,
      country: data.country,
    };
  } catch (error) {
    console.error('Error getting location from IP:', error);
    // Fallback to a default location (New York)
    return {
      lat: 40.7128,
      lon: -74.0060,
      city: 'New York',
      region: 'New York',
      country: 'United States',
    };
  }
}
