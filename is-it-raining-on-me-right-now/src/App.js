import "./App.css";
import { useState, useEffect, useRef } from "react";

function App() {
  const [weather, setWeather] = useState(null);
  const [isOutside, setIsOutside] = useState(null);
  const [lightLevel, setLightLevel] = useState(null);
  const [error, setError] = useState(null);
  const [checking, setChecking] = useState(false);
  const [showBrainrot, setShowBrainrot] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [showJumpscare, setShowJumpscare] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const audioRef = useRef(null);

  // Request camera access on mount
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        });
        setCameraStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.log("Camera access denied:", err);
        setError(
          "📷 Camera access required! Please allow camera access to use this app."
        );
      }
    };

    initCamera();

    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Background music on loop
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.play().catch((err) => console.log("Audio autoplay failed:", err));
    }
  }, []);

  useEffect(() => {
    // Check if the Ambient Light Sensor API is available
    if ("AmbientLightSensor" in window) {
      try {
        const sensor = new window.AmbientLightSensor();
        sensor.addEventListener("reading", () => {
          setLightLevel(sensor.illuminance);
          // If light level is above 1000 lux, probably outside
          setIsOutside(sensor.illuminance > 1000);

          // If inside, trigger jumpscare
          if (sensor.illuminance <= 1000 && cameraStream) {
            captureAndJumpscare();
          }
        });
        sensor.start();
        return () => sensor.stop();
      } catch (err) {
        console.log("Ambient light sensor not available:", err);
      }
    }
  }, [cameraStream]);

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

  const captureAndJumpscare = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Apply random filter
    const filters = [
      "grayscale(100%) contrast(200%)",
      "sepia(100%) saturate(300%)",
      "hue-rotate(180deg) saturate(200%)",
      "invert(100%) hue-rotate(90deg)",
      "contrast(200%) brightness(150%)",
      "blur(3px) brightness(80%)",
    ];

    const randomFilter = filters[Math.floor(Math.random() * filters.length)];
    context.filter = randomFilter;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get the image as data URL
    const imageData = canvas.toDataURL("image/png");
    setCapturedImage(imageData);

    // Show jumpscare
    setShowJumpscare(true);

    // Play scary sound
    const scream = new Audio(
      "https://www.myinstants.com/media/sounds/movie_1.mp3"
    );
    scream.play().catch((err) => console.log("Audio play failed:", err));

    // Hide after 3 seconds
    setTimeout(() => {
      setShowJumpscare(false);
    }, 3000);
  };

  const checkIfRaining = async () => {
    setChecking(true);
    setError(null);

    // Check if we're inside and trigger jumpscare immediately
    if (isOutside === false && cameraStream) {
      captureAndJumpscare();
      setChecking(false);
      return;
    }

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
      {/* Background music */}
      <audio 
        ref={audioRef} 
        src="/Sigma Boy.mp3" 
        loop 
        autoPlay
      />
      
      {/* Hidden video and canvas for camera capture */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ display: "none" }}
      />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {showJumpscare && capturedImage && (
        <div className="jumpscare-overlay">
          <div className="jumpscare-content">
            <img
              src={capturedImage}
              alt="jumpscare"
              className="jumpscare-image"
            />
            <h1 className="jumpscare-text">GET OUTSIDE! 🚪🏃‍♂️</h1>
            <p className="jumpscare-subtext">
              This app only works when you're OUTSIDE!
            </p>
          </div>
        </div>
      )}

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
