import { useEffect, useState } from "react";
import axios from "axios";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const WeatherWidget = () => {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    const fetchWeather = async () => {
      const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
      const location = "Hyderabad"; 
      const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${location}&aqi=no`;

      try {
        const response = await axios.get(url);
        setWeather(response.data);
      } catch (error) {
        console.error("Weather fetch error:", error);
      }
    };

    fetchWeather();
  }, []);

  if (!weather) return <div className="text-sm text-muted-foreground">Loading weather...</div>;

  const { current, location } = weather;
  const greeting = getGreeting();

  return (
    <div className="w-full p-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-black shadow-sm hover:shadow-md transition-shadow duration-300 flex items-center justify-between">
      <div>
        <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">{greeting},</p>
        <p className="text-2xl font-bold text-black dark:text-white mt-1">
          {location.name} — {current.temp_c}°C
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{current.condition.text}</p>
      </div>
      <img 
        src={current.condition.icon} 
        alt="weather icon" 
        className="w-16 h-16 object-contain" 
      />
    </div>
  );
};

export default WeatherWidget;
