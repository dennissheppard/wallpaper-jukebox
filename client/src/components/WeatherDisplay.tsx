import { useState } from 'react';
import { WeatherData } from '../types/weather';
import { getWeatherIcon } from '../services/weatherService';
import styles from './WeatherDisplay.module.css';

interface Props {
  weather: WeatherData | null;
  loading: boolean;
  onRequestPreciseLocation: () => void;
  isMinimized: boolean;
  onToggleMinimize: () => void;
}

function WeatherDisplay({ weather, loading, onRequestPreciseLocation, isMinimized, onToggleMinimize }: Props) {
  if (loading) {
    return (
      <div className={styles.container}>
        <div>Loading weather...</div>
      </div>
    );
  }

  if (!weather) {
    return null;
  }

  const icon = getWeatherIcon(weather.condition);
  const locationText = weather.location.city
    ? `${weather.location.city}, ${weather.location.region || weather.location.country}`
    : `${weather.location.lat.toFixed(2)}, ${weather.location.lon.toFixed(2)}`;

  if (isMinimized) {
    return (
      <div 
        className={styles.minimized} 
        onClick={onToggleMinimize}
        title="Show Weather"
      >
        <span className={styles.icon}>{icon}</span>
        <span className={styles.minimizedTemp}>
          {weather.temperature}°
        </span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.description}>{weather.description}</div>
        <button className={styles.minimizeBtn} onClick={onToggleMinimize}>
          _
        </button>
      </div>

      <div className={styles.mainInfo}>
        <span className={styles.icon}>{icon}</span>
        <span className={styles.temp}>
          {weather.temperature}°{weather.temperatureUnit}
        </span>
      </div>

      <div className={styles.details}>
        <div>Feels like: {weather.feelsLike}°{weather.temperatureUnit}</div>
        <div>Humidity: {weather.humidity}%</div>
        <div>Wind: {weather.windSpeed} mph</div>
      </div>

      <div className={styles.location}>
        <span className={styles.locationText}>{locationText}</span>
        {weather.location.isApproximate && (
          <button
            className={styles.preciseBtn}
            onClick={onRequestPreciseLocation}
            title="Use precise location"
          >
            📍 More accurate
          </button>
        )}
      </div>
      
      {weather.location.isApproximate && (
        <div className={styles.approxNote}>Approximate location</div>
      )}
    </div>
  );
}

export default WeatherDisplay;
