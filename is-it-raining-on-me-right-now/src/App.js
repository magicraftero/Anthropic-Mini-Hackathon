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
  const [capturedImages, setCapturedImages] = useState([]);
  const [showJumpscare, setShowJumpscare] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState("");
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [showResult, setShowResult] = useState(false);
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
          // Wait for video to be ready
          videoRef.current.onloadedmetadata = () => {
            console.log("Video metadata loaded");
            videoRef.current.play();
            setVideoReady(true);
          };
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
          console.log("Light level:", sensor.illuminance);
          setLightLevel(sensor.illuminance);
          // Lower threshold - if light level is above 500 lux, probably outside
          setIsOutside(sensor.illuminance > 500);
        });
        sensor.start();
        return () => sensor.stop();
      } catch (err) {
        console.log("Ambient light sensor not available:", err);
      }
    } else {
      console.log("AmbientLightSensor API not supported");
    }
  }, []);

  // Random jumpscares every 15-25 seconds
  useEffect(() => {
    const scheduleRandomJumpscare = () => {
      const randomDelay = 15000 + Math.random() * 10000; // 15-25 seconds
      setTimeout(() => {
        if (Math.random() > 0.3) { // 70% chance
          triggerRandomJumpscare();
        }
        scheduleRandomJumpscare();
      }, randomDelay);
    };
    
    scheduleRandomJumpscare();
  }, [videoReady]);

  // Brainrot effect every 10 seconds
  useEffect(() => {
    const vineThud = new Audio(
      "https://www.myinstants.com/media/sounds/vine-boom.mp3"
    );

    const interval = setInterval(() => {
      vineThud.play().catch((err) => console.log("Audio play failed:", err));
      setShowBrainrot(true);
      setTimeout(() => {
        setShowBrainrot(false);
      }, 1000);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !videoReady) return null;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;
    
    const context = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    return canvas.toDataURL("image/png");
  };

  const triggerRandomJumpscare = () => {
    if (!videoReady) return;
    
    // Random jumpscare types
    const jumpscareTypes = ['caught', 'watching', 'stalker'];
    const randomType = jumpscareTypes[Math.floor(Math.random() * jumpscareTypes.length)];
    
    setShowJumpscare(randomType);

    const scream = new Audio("https://www.myinstants.com/media/sounds/movie_1.mp3");
    scream.play().catch((err) => console.log("Audio play failed:", err));

    setTimeout(() => {
      setShowJumpscare(false);
    }, 2500);
  };

  const checkIfRaining = async () => {
    setChecking(true);
    setError(null);
    setAnalyzing(true);
    setAnalysisProgress(0);
    
    const creepySteps = [
      "👁️ Detecting facial features...",
      "🔍 Analyzing your environment...",
      "💧 Checking for water droplets on you...",
      "🌧️ Scanning for rain around you...",
      "📊 Processing moisture data...",
      "🌡️ Checking if you're wet...",
      "☔ Looking for rain on YOU specifically...",
      "🤔 Are you currently being rained on?",
      "💦 Wetness analysis complete!",
    ];
    
    // Creepy progress bar animation
    for (let i = 0; i < creepySteps.length; i++) {
      setAnalysisStep(creepySteps[i]);
      setAnalysisProgress(((i + 1) / creepySteps.length) * 100);
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Capture a photo midway through analysis
      if (i === Math.floor(creepySteps.length / 2)) {
        const photo = capturePhoto();
        if (photo) setCapturedImage(photo);
      }
    }
    
    setAnalyzing(false);
    
    // Get location for actual weather
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            const response = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=precipitation,rain,showers&timezone=auto`
            );
            const data = await response.json();
            setWeather(data);
            setShowResult(true);
            setChecking(false);
            
            // Funny reveal with sound
            setTimeout(() => {
              const boom = new Audio("https://www.myinstants.com/media/sounds/vine-boom.mp3");
              boom.play().catch((err) => console.log("Audio play failed:", err));
            }, 100);
            
          } catch (err) {
            setError("Failed to fetch weather data");
            setChecking(false);
          }
        },
        (err) => {
          setError("Please enable location access to use this app");
          setChecking(false);
          setAnalyzing(false);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser");
      setChecking(false);
      setAnalyzing(false);
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
        style={{ display: 'none' }}
      />
      
      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {/* Main video element - visible during analysis, hidden otherwise */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ display: 'none' }}
      />

      {showJumpscare && (
        <div className="jumpscare-overlay">
          {showJumpscare === 'caught' && (
            <div className="jumpscare-content">
              <div className="camera-grid">
                <video ref={videoRef} autoPlay playsInline muted className="jumpscare-camera-live" style={{ filter: 'grayscale(100%) contrast(150%)' }} />
                <video ref={videoRef} autoPlay playsInline muted className="jumpscare-camera-live" style={{ filter: 'sepia(100%)' }} />
                <video ref={videoRef} autoPlay playsInline muted className="jumpscare-camera-live" style={{ filter: 'invert(100%)' }} />
                <video ref={videoRef} autoPlay playsInline muted className="jumpscare-camera-live" style={{ filter: 'hue-rotate(180deg)' }} />
              </div>
              <h1 className="jumpscare-text">WE'RE WATCHING YOU! 👁️👄👁️</h1>
              <p className="jumpscare-subtext">FROM 4 DIFFERENT ANGLES 📹</p>
            </div>
          )}
          
          {showJumpscare === 'watching' && (
            <div className="jumpscare-content">
              <div className="big-eye-container">
                <div className="big-eye">
                  <video ref={videoRef} autoPlay playsInline muted className="eye-pupil" />
                </div>
              </div>
              <h1 className="jumpscare-text">👁️ I SEE YOU 👁️</h1>
              <p className="jumpscare-subtext">You're in my eye now...</p>
            </div>
          )}
          
          {showJumpscare === 'stalker' && (
            <div className="jumpscare-content">
              <div className="stalker-cam">
                <video ref={videoRef} autoPlay playsInline muted className="stalker-video" />
                <div className="rec-indicator">⬤ REC</div>
                <div className="timestamp">{new Date().toLocaleTimeString()}</div>
                <div className="crosshair"></div>
              </div>
              <h1 className="jumpscare-text">📹 RECORDING... 📹</h1>
              <p className="jumpscare-subtext">Target locked. Footage saved.</p>
            </div>
          )}
        </div>
      )}
      
      {analyzing && (
        <div className="analysis-overlay">
          <div className="analysis-content">
            <div className="camera-feed-box">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="analysis-video"
              />
              <div className="scanning-line"></div>
            </div>
            <h2 className="analysis-title">{analysisStep}</h2>
            <div className="progress-container">
              <div className="progress-bar" style={{ width: `${analysisProgress}%` }}></div>
            </div>
            <p className="analysis-percent">{Math.round(analysisProgress)}%</p>
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

        {!checking && !weather && !analyzing && (
          <div className="check-container">
            <button onClick={checkIfRaining} className="check-button">
              🌧️ Is It Raining On Me? 🌧️
            </button>
            <p className="warning">⚠️ Allow camera to scan for rain on YOU ⚠️</p>
          </div>
        )}

        {checking && !analyzing && <div className="loading">📍 Getting your exact location...</div>}

        {error && <div className="error">{error}</div>}

        {showResult && weather && (
          <div className={`result ${isRaining ? "raining" : "not-raining"}`}>
            <h2 style={{ fontSize: '3em', marginBottom: '20px' }}>
              {isRaining ? "🌧️ YES! IT'S RAINING ON YOU! 🌧️" : "☀️ NOPE! YOU'RE DRY AS A BONE! ☀️"}
            </h2>
            <div style={{ marginBottom: '30px' }}>
              {capturedImage && (
                <img src={capturedImage} alt="you getting scanned" style={{ 
                  maxWidth: '400px', 
                  borderRadius: '20px', 
                  border: '5px solid white',
                  boxShadow: '0 0 20px rgba(0,0,0,0.3)'
                }} />
              )}
            </div>
            <p className="answer" style={{ fontSize: '1.5em' }}>
              {isRaining
                ? "🌧️ It's LITERALLY raining on you right now! 💦"
                : "☀️ No rain detected on your person! 🏜️"}
            </p>
            <p style={{ fontSize: '1.2em', marginTop: '20px' }}>
              {isRaining 
                ? "Get inside or grab an umbrella! ☂️" 
                : "You're perfectly dry! Why did you even check? 😂"}
            </p>
            <div className="details">
              <p><strong>Current Precipitation:</strong> {weather.current.precipitation} mm</p>
              <p><strong>Rain Intensity:</strong> {weather.current.rain} mm</p>
              <p><strong>Status:</strong> {isRaining ? "🌧️ GETTING WET" : "✨ DRY AND COZY"}</p>
            </div>
            <button onClick={() => {
              setWeather(null);
              setShowResult(false);
              setCapturedImage(null);
            }} className="reset-button">
              Check Again (Why Though?)
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
