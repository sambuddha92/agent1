// ============================================
// OpenWeatherMap Integration
// ============================================

import { WEATHER_CONFIG } from './constants';
import type { WeatherForecast, ForecastDay, WeatherAlertType } from '@/types';

const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

/**
 * Get weather forecast from OpenWeatherMap
 * Parses response into gardening-relevant data with alerts
 * 
 * @param city - City name (e.g., "Mumbai", "Berlin")
 * @param days - Number of forecast days (default: 3, max: 5)
 * @returns Weather forecast with gardening-relevant alerts
 * @throws Error if API key is not configured or API request fails
 */
export async function getWeatherForecast(
  city: string,
  days: number = WEATHER_CONFIG.DEFAULT_FORECAST_DAYS
): Promise<WeatherForecast> {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    throw new Error('OPENWEATHER_API_KEY is not configured');
  }

  const response = await fetch(
    `${OPENWEATHER_BASE_URL}/forecast?q=${encodeURIComponent(city)}&units=metric&cnt=${days * 8}&appid=${apiKey}`
  );

  if (!response.ok) {
    throw new Error(`OpenWeatherMap API error: ${response.statusText}`);
  }

  const data = await response.json();

  // Group 3-hour forecasts into daily summaries
  const dailyMap = new Map<string, Array<{
    dt_txt: string;
    main: { temp: number; humidity: number };
    wind: { speed: number };
    rain?: { '3h': number };
    weather: Array<{ description: string }>;
  }>>();

  for (const item of data.list) {
    const date = item.dt_txt.split(' ')[0];
    if (!dailyMap.has(date)) {
      dailyMap.set(date, []);
    }
    dailyMap.get(date)!.push(item);
  }

  const forecastDays: ForecastDay[] = [];

  for (const [date, items] of dailyMap) {
    if (forecastDays.length >= days) break;

    const temps = items.map((i) => i.main.temp);
    const humidity = items.map((i) => i.main.humidity);
    const windSpeeds = items.map((i) => i.wind.speed);
    const rainTotal = items.reduce(
      (sum, i) => sum + (i.rain?.['3h'] || 0),
      0
    );

    const tempMin = Math.min(...temps);
    const tempMax = Math.max(...temps);
    const avgHumidity =
      humidity.reduce((a, b) => a + b, 0) / humidity.length;
    const maxWind = Math.max(...windSpeeds);

    // Generate gardening-relevant alerts
    const alerts: WeatherAlertType[] = [];
    if (tempMin < WEATHER_CONFIG.FROST_THRESHOLD_CELSIUS) alerts.push('FROST_WARNING');
    if (tempMax > WEATHER_CONFIG.HEATWAVE_THRESHOLD_CELSIUS) alerts.push('HEATWAVE');
    if (rainTotal > WEATHER_CONFIG.HEAVY_RAIN_THRESHOLD_MM) alerts.push('HEAVY_RAIN');
    if (avgHumidity > WEATHER_CONFIG.HIGH_HUMIDITY_THRESHOLD && tempMax > WEATHER_CONFIG.HUMID_TEMP_THRESHOLD) alerts.push('FUNGAL_RISK');
    if (maxWind > WEATHER_CONFIG.HIGH_WIND_THRESHOLD_KMH) alerts.push('HIGH_WIND');

    forecastDays.push({
      date,
      temp_min: Math.round(tempMin * 10) / 10,
      temp_max: Math.round(tempMax * 10) / 10,
      humidity: Math.round(avgHumidity),
      description: items[Math.floor(items.length / 2)].weather[0].description,
      wind_speed: Math.round(maxWind * 10) / 10,
      rain_mm: Math.round(rainTotal * 10) / 10,
      alerts,
    });
  }

  return {
    city: data.city?.name || city,
    days: forecastDays,
  };
}

/**
 * Check if weather conditions warrant proactive user notification
 * 
 * @param forecast - Weather forecast data
 * @returns Array of human-readable alert messages
 */
export function getWeatherAlerts(forecast: WeatherForecast): string[] {
  const criticalAlerts: string[] = [];

  for (const day of forecast.days) {
    for (const alert of day.alerts) {
      switch (alert) {
        case 'FROST_WARNING':
          criticalAlerts.push(
            `🥶 Frost warning on ${day.date} (${day.temp_min}°C). Move frost-sensitive plants indoors tonight.`
          );
          break;
        case 'HEATWAVE':
          criticalAlerts.push(
            `🔥 Heatwave on ${day.date} (${day.temp_max}°C). Increase watering frequency and provide shade.`
          );
          break;
        case 'HEAVY_RAIN':
          criticalAlerts.push(
            `🌧️ Heavy rain expected on ${day.date} (${day.rain_mm}mm). Skip watering and check drainage.`
          );
          break;
        case 'FUNGAL_RISK':
          criticalAlerts.push(
            `🍄 Fungal risk on ${day.date} (${day.humidity}% humidity, ${day.temp_max}°C). Improve airflow around plants.`
          );
          break;
        case 'HIGH_WIND':
          criticalAlerts.push(
            `💨 High wind on ${day.date} (${day.wind_speed} km/h). Secure or shelter exposed containers.`
          );
          break;
      }
    }
  }

  return criticalAlerts;
}
