export interface WeatherData {
  temperature: number;
  temperatureUnit: 'C' | 'F';
  condition: WeatherCondition;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  description: string;
  location: {
    city?: string;
    region?: string;
    country?: string;
    lat: number;
    lon: number;
    isApproximate: boolean;
  };
}

export type WeatherCondition =
  | 'clear'
  | 'partly-cloudy'
  | 'cloudy'
  | 'overcast'
  | 'rain'
  | 'drizzle'
  | 'snow'
  | 'sleet'
  | 'fog'
  | 'thunderstorm'
  | 'unknown';

export type WeatherMode = 'off' | 'match' | 'escape';

export interface WeatherSettings {
  enabled: boolean;
  mode: WeatherMode;
  usePreciseLocation: boolean;
  temperatureUnit: 'C' | 'F';
}
