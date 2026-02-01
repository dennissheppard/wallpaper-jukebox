import { WeatherData, WeatherCondition } from '../types/weather';

interface WeatherAPIResponse {
  weather: {
    temperature: number;
    temperatureUnit: 'C' | 'F';
    condition: WeatherCondition;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    description: string;
  };
  location: {
    lat: number;
    lon: number;
    city?: string;
    region?: string;
    country?: string;
    isApproximate: boolean;
  };
}

export async function fetchWeatherAuto(temperatureUnit: 'C' | 'F' = 'F'): Promise<WeatherData> {
  const response = await fetch(`/api/weather/auto?unit=${temperatureUnit}`);
  if (!response.ok) {
    throw new Error('Failed to fetch weather');
  }

  const data: WeatherAPIResponse = await response.json();
  return {
    ...data.weather,
    location: data.location,
  };
}

export async function fetchWeatherByCoords(
  lat: number,
  lon: number,
  temperatureUnit: 'C' | 'F' = 'F'
): Promise<WeatherData> {
  const response = await fetch(`/api/weather/current?lat=${lat}&lon=${lon}&unit=${temperatureUnit}`);
  if (!response.ok) {
    throw new Error('Failed to fetch weather');
  }

  const data = await response.json();
  return {
    ...data,
    location: {
      lat,
      lon,
      isApproximate: false,
    },
  };
}

export async function getWeatherBasedTheme(
  condition: WeatherCondition,
  mode: 'match' | 'escape',
  temperature?: number,
  temperatureUnit: 'C' | 'F' = 'F'
): Promise<string> {
  if (mode === 'escape') {
    // Escape mode - opposite of current weather
    const escapeMapping: Record<WeatherCondition, string> = {
      'clear': 'forest shade misty',
      'partly-cloudy': 'sunshine bright warm',
      'cloudy': 'sunshine tropical beach',
      'overcast': 'tropical beach paradise',
      'rain': 'desert sunshine dry',
      'drizzle': 'sunshine warm bright',
      'snow': 'tropical beach warm caribbean',
      'sleet': 'tropical beach summer',
      'fog': 'clear bright sunshine',
      'thunderstorm': 'calm serene peaceful',
      'unknown': '',
    };
    return escapeMapping[condition];
  }

  // Match mode - nuanced matching based on weather + temperature + time
  const hour = new Date().getHours();
  const isEvening = hour >= 17 || hour < 6;
  const isMorning = hour >= 6 && hour < 12;

  // Convert to Fahrenheit for consistent comparison
  let tempF = temperature;
  if (temperature && temperatureUnit === 'C') {
    tempF = (temperature * 9/5) + 32;
  }

  // Temperature categories
  const isFreezing = tempF !== undefined && tempF < 32;
  const isCold = tempF !== undefined && tempF >= 32 && tempF < 50;
  const isMild = tempF !== undefined && tempF >= 50 && tempF < 70;
  const isWarm = tempF !== undefined && tempF >= 70 && tempF < 85;
  const isHot = tempF !== undefined && tempF >= 85;

  // Build search query based on multiple factors
  let query = '';

  switch (condition) {
    case 'clear':
      if (isEvening) query = 'golden hour sunset evening sky';
      else if (isMorning) query = 'sunrise morning golden light';
      else if (isHot) query = 'bright sunny summer day';
      else if (isCold) query = 'clear crisp winter day blue sky';
      else query = 'sunny day clear sky';
      break;

    case 'partly-cloudy':
      if (isFreezing || isCold) query = 'winter landscape overcast cold day nature';
      else if (isMild) query = 'cloudy day landscape nature outdoor';
      else if (isWarm) query = 'partly cloudy summer day';
      else query = 'outdoor landscape daylight';
      break;

    case 'cloudy':
    case 'overcast':
      if (isFreezing) query = 'gray winter day cold landscape';
      else if (isCold) query = 'moody overcast nature landscape';
      else if (isEvening) query = 'dusk cloudy evening atmospheric';
      else query = 'cloudy day moody nature';
      break;

    case 'rain':
    case 'drizzle':
      if (isCold) query = 'rain wet street autumn fall';
      else if (isWarm) query = 'rain tropical storm green';
      else query = 'rain wet moody atmospheric';
      break;

    case 'snow':
    case 'sleet':
      if (isEvening) query = 'snowy evening winter night';
      else query = 'snow winter landscape frozen';
      break;

    case 'fog':
      if (isMorning) query = 'morning fog mist atmospheric';
      else query = 'fog misty ethereal landscape';
      break;

    case 'thunderstorm':
      query = 'storm dramatic sky lightning';
      break;

    default:
      query = 'nature landscape outdoor';
  }

  return query;
}

export function getWeatherIcon(condition: WeatherCondition): string {
  const icons: Record<WeatherCondition, string> = {
    'clear': '☀️',
    'partly-cloudy': '⛅',
    'cloudy': '☁️',
    'overcast': '☁️',
    'rain': '🌧️',
    'drizzle': '🌦️',
    'snow': '❄️',
    'sleet': '🌨️',
    'fog': '🌫️',
    'thunderstorm': '⛈️',
    'unknown': '❓',
  };
  return icons[condition];
}
