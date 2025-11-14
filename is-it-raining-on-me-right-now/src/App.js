import "./App.css";
import { useState, useEffect } from "react";

function App() {
  const [weather, setWeather] = useState(null);
  const [isOutside, setIsOutside] = useState(null);
  const [lightLevel, setLightLevel] = useState(null);
  const [error, setError] = useState(null);
  const [checking, setChecking] = useState(false);
  const [showBrainrot, setShowBrainrot] = useState(false);

  useEffect(() => {
    // Check if the Ambient Light Sensor API is available
    if ("AmbientLightSensor" in window) {
      try {
        const sensor = new window.AmbientLightSensor();
        sensor.addEventListener("reading", () => {
          setLightLevel(sensor.illuminance);
          // If light level is above 1000 lux, probably outside
          setIsOutside(sensor.illuminance > 1000);
        });
        sensor.start();
        return () => sensor.stop();
      } catch (err) {
        console.log("Ambient light sensor not available:", err);
      }
    }
  }, []);

  // Brainrot effect every 10 seconds
  useEffect(() => {
    const vineThud = new Audio(
      "https://www.myinstants.com/media/sounds/vine-boom.mp3"
    );

    const interval = setInterval(() => {
      // Play vine thud sound
      vineThud.play().catch((err) => console.log("Audio play failed:", err));

      // Show brainrot image
      setShowBrainrot(true);

      // Hide after 1 second
      setTimeout(() => {
        setShowBrainrot(false);
      }, 1000);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const checkIfRaining = async () => {
    setChecking(true);
    setError(null);

    // Get user's location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // Fetch weather data from Open-Meteo API (free, no key needed)
          try {
            const response = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=precipitation,rain,showers&timezone=auto`
            );
            const data = await response.json();
            setWeather(data);
            setChecking(false);
          } catch (err) {
            setError("Failed to fetch weather data");
            setChecking(false);
          }
        },
        (err) => {
          setError("Please enable location access to use this app");
          setChecking(false);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser");
      setChecking(false);
    }
  };

  const isRaining =
    weather &&
    (weather.current.precipitation > 0 ||
      weather.current.rain > 0 ||
      weather.current.showers > 0);

  return (
    <div className="App">
      {showBrainrot && (
        <div className="brainrot-overlay">
          <img src="/brainrot.jpg" alt="brainrot" className="brainrot-image" />
        </div>
      )}
      <header className="App-header">
        <h1>☔ Is It Raining On Me Right Now? 🌧️</h1>
        <p className="subtitle">The most useless weather app ever made</p>

        {!checking && !weather && (
          <div className="check-container">
            <button onClick={checkIfRaining} className="check-button">
              Check If It's Raining
            </button>
            <p className="warning">⚠️ You must be outside to use this app ⚠️</p>
          </div>
        )}

        {checking && <div className="loading">🔍 Checking...</div>}

        {error && <div className="error">{error}</div>}

        {lightLevel !== null && (
          <div className="light-info">
            💡 Light level: {Math.round(lightLevel)} lux
          </div>
        )}

        {weather && isOutside === false && (
          <div className="result not-outside">
            <h2>🏠 YOU'RE INSIDE! 🏠</h2>
            <p>This app only works when you're outside.</p>
            <p>Please go outside and try again.</p>
            <button onClick={() => setWeather(null)} className="reset-button">
              Try Again
            </button>
          </div>
        )}

        {weather && isOutside === true && (
          <div className={`result ${isRaining ? "raining" : "not-raining"}`}>
            <h2>{isRaining ? "🌧️ YES! 🌧️" : "☀️ NO! ☀️"}</h2>
            <p className="answer">
              {isRaining
                ? "It's raining on you right now!"
                : "It's not raining on you right now!"}
            </p>
            <div className="details">
              <p>Precipitation: {weather.current.precipitation} mm</p>
              <p>Rain: {weather.current.rain} mm</p>
            </div>
            <button onClick={() => setWeather(null)} className="reset-button">
              Check Again
            </button>
          </div>
        )}

        {weather && isOutside === null && (
          <div className="result">
            <h2>{isRaining ? "🌧️ MAYBE? 🌧️" : "☀️ PROBABLY NOT? ☀️"}</h2>
            <p className="answer">
              {isRaining
                ? "It might be raining on you... but are you outside?"
                : "It's probably not raining... if you're outside."}
            </p>
            <p className="note">
              (Your browser doesn't support light detection, so we can't tell if
              you're outside)
            </p>
            <div className="details">
              <p>Precipitation: {weather.current.precipitation} mm</p>
              <p>Rain: {weather.current.rain} mm</p>
            </div>
            <button onClick={() => setWeather(null)} className="reset-button">
              Check Again
            </button>
          </div>
        )}

        <footer className="footer">
          <p>📱 Why use this when you could just... look up? 📱</p>
        </footer>
      </header>
    </div>
  );
}

export default App;
