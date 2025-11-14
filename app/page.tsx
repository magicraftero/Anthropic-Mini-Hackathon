'use client'

import { useState, useEffect } from 'react'

interface Location {
  lat: number
  lon: number
}

interface WeatherData {
  isRaining: boolean
  description: string
  temperature: number
}

interface SavedLocation {
  lat: number
  lon: number
  timestamp: number
  wasRaining: boolean
}

export default function Home() {
  const [location, setLocation] = useState<Location | null>(null)
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [isOutside, setIsOutside] = useState<boolean>(true)
  const [shakeDetected, setShakeDetected] = useState<boolean>(false)
  const [historicalData, setHistoricalData] = useState<WeatherData | null>(null)
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([])
  const [showPremium, setShowPremium] = useState<boolean>(false)
  const [showNotification, setShowNotification] = useState<boolean>(false)
  const [shakeCount, setShakeCount] = useState<number>(0)

  // Light sensor detection
  useEffect(() => {
    if ('AmbientLightSensor' in window) {
      try {
        const sensor = new (window as any).AmbientLightSensor()
        sensor.addEventListener('reading', () => {
          const lux = sensor.illuminance
          setIsOutside(lux > 100) // If light level is low, assume indoors
        })
        sensor.start()
      } catch (err) {
        console.log('Light sensor not available')
      }
    }
  }, [])

  // Motion detection for shake
  useEffect(() => {
    let lastX = 0
    let lastY = 0
    let lastZ = 0

    const handleMotion = (event: DeviceMotionEvent) => {
      const acceleration = event.accelerationIncludingGravity
      if (!acceleration) return

      const x = acceleration.x || 0
      const y = acceleration.y || 0
      const z = acceleration.z || 0

      const deltaX = Math.abs(x - lastX)
      const deltaY = Math.abs(y - lastY)
      const deltaZ = Math.abs(z - lastZ)

      if (deltaX + deltaY + deltaZ > 30) {
        setShakeCount(prev => prev + 1)
        setShakeDetected(true)
        setTimeout(() => setShakeDetected(false), 2000)
      }

      lastX = x
      lastY = y
      lastZ = z
    }

    if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      window.addEventListener('devicemotion', handleMotion)
      return () => window.removeEventListener('devicemotion', handleMotion)
    }
  }, [])

  // Load saved locations from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('rainLocations')
    if (saved) {
      setSavedLocations(JSON.parse(saved))
    }
  }, [])

  const checkRain = async () => {
    setError('')
    setLoading(true)
    setWeatherData(null)

    // Check if user is outside (light sensor)
    if (!isOutside) {
      setError('❌ ERROR: Please go outside to check if it\'s raining! 🌞 (Light sensor detected you\'re indoors)')
      setLoading(false)
      return
    }

    // Check if shake was detected
    if (shakeCount < 1) {
      setError('❌ ERROR: Please shake your phone to activate rain detection! 📱💫')
      setLoading(false)
      return
    }

    try {
      // Get geolocation
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
        })
      })

      const { latitude, longitude } = position.coords
      setLocation({ lat: latitude, lon: longitude })

      // Save historical data (5 minutes ago simulation)
      if (weatherData) {
        setHistoricalData(weatherData)
      }

      // Call weather API (using Open-Meteo free API, no key needed)
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,precipitation,weather_code&timezone=auto`
      )

      if (!weatherResponse.ok) {
        throw new Error('Failed to fetch weather data')
      }

      const data = await weatherResponse.json()
      const precipitation = data.current.precipitation || 0
      const weatherCode = data.current.weather_code
      const temperature = data.current.temperature_2m

      // Weather codes: 51-67, 80-82, 95-99 are rain/drizzle/showers
      const isRaining = precipitation > 0 || 
        (weatherCode >= 51 && weatherCode <= 67) ||
        (weatherCode >= 80 && weatherCode <= 82) ||
        (weatherCode >= 95 && weatherCode <= 99)

      const weather: WeatherData = {
        isRaining,
        description: isRaining ? 'YES! IT\'S RAINING! 🌧️' : 'NO! IT\'S NOT RAINING! ☀️',
        temperature,
      }

      setWeatherData(weather)

      // Save to favorites
      const newLocation: SavedLocation = {
        lat: latitude,
        lon: longitude,
        timestamp: Date.now(),
        wasRaining: isRaining,
      }
      const updated = [...savedLocations, newLocation]
      setSavedLocations(updated)
      localStorage.setItem('rainLocations', JSON.stringify(updated))

    } catch (err: any) {
      if (err.code === 1) {
        setError('❌ Location permission denied. We need to know EXACTLY where you are!')
      } else {
        setError(`❌ Error: ${err.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const shareToSocial = () => {
    const text = `It's ${weatherData?.isRaining ? 'RAINING' : 'NOT RAINING'} on me right now at ${location?.lat.toFixed(4)}°N, ${location?.lon.toFixed(4)}°W! 🌧️⚡ #IsItRainingOnMe #UselessApp`
    
    if (navigator.share) {
      navigator.share({
        title: 'Is It Raining On Me?',
        text: text,
      })
    } else {
      // Fallback to Twitter
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank')
    }
  }

  const calculateOffset = (meters: number) => {
    // Rough calculation: 1 degree ≈ 111km at equator
    const degreeOffset = meters / 111000
    return degreeOffset
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 space-y-6">
        
        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-black text-blue-900 tracking-tight">
            IS IT RAINING
            <br />
            ON ME
            <br />
            RIGHT NOW?
          </h1>
          <p className="text-gray-600 italic">The most useless weather app ever created</p>
        </div>

        {/* Shake indicator */}
        {shakeDetected && (
          <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4 text-center animate-pulse">
            <p className="text-yellow-800 font-bold">🎉 SHAKE DETECTED! Rain detection activated! 🎉</p>
          </div>
        )}

        {/* Main Button */}
        <button
          onClick={checkRain}
          disabled={loading}
          className={`w-full py-8 px-6 rounded-2xl font-black text-3xl transition-all transform hover:scale-105 active:scale-95 shadow-lg ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white'
          }`}
        >
          {loading ? '🌧️ DETECTING RAIN...' : '🌧️ IS IT RAINING ON ME? 🌧️'}
        </button>

        {/* Shake instruction */}
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 text-center">
          <p className="text-blue-800 font-semibold">
            📱 Shake your phone to activate rain detection! (Shakes: {shakeCount})
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border-2 border-red-400 rounded-lg p-4 text-center">
            <p className="text-red-800 font-bold text-lg">{error}</p>
          </div>
        )}

        {/* Weather Result */}
        {weatherData && location && (
          <div className="space-y-4">
            <div className={`rounded-2xl p-6 text-center ${
              weatherData.isRaining 
                ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white' 
                : 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white'
            }`}>
              <p className="text-6xl font-black mb-2">{weatherData.description}</p>
              <p className="text-2xl font-bold mb-4">Temperature: {weatherData.temperature}°C</p>
              
              {/* Overly specific location */}
              <div className="bg-white/20 rounded-lg p-4 mt-4 space-y-2">
                <p className="text-lg font-bold">
                  It is {weatherData.isRaining ? 'RAINING' : 'NOT RAINING'} on you at:
                </p>
                <p className="font-mono text-sm">
                  {location.lat.toFixed(6)}°N, {location.lon.toFixed(6)}°W
                </p>
                <p className="text-sm italic mt-2">
                  But {weatherData.isRaining ? 'probably NOT' : 'maybe'} raining 2 meters to your left at:
                </p>
                <p className="font-mono text-xs">
                  {(location.lat + calculateOffset(2)).toFixed(6)}°N, {location.lon.toFixed(6)}°W
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={shareToSocial}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105"
              >
                📱 Share to Social Media
              </button>
              <button
                onClick={() => setShowPremium(true)}
                className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105"
              >
                ⭐ Premium Feature
              </button>
            </div>

            <button
              onClick={() => setShowNotification(!showNotification)}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-all"
            >
              🔔 {showNotification ? 'Disable' : 'Enable'} Rain Notifications
            </button>

            {showNotification && (
              <div className="bg-green-100 border-2 border-green-400 rounded-lg p-4 text-center">
                <p className="text-green-800 font-bold">
                  ✅ You will now be notified when it's raining... while you're already outside in the rain! 🌧️
                </p>
              </div>
            )}
          </div>
        )}

        {/* Historical Data */}
        {historicalData && (
          <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-4">
            <p className="text-gray-800 font-bold text-center">
              ⏰ Historical Data (5 minutes ago):
            </p>
            <p className="text-gray-700 text-center mt-2">
              It was {historicalData.isRaining ? 'RAINING' : 'NOT RAINING'} on you 5 minutes ago! 
              <br />
              <span className="text-sm italic">(Completely unhelpful information 😎)</span>
            </p>
          </div>
        )}

        {/* Premium Modal */}
        {showPremium && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full space-y-4">
              <h2 className="text-3xl font-black text-purple-600 text-center">
                ⭐ PREMIUM FEATURE ⭐
              </h2>
              <p className="text-xl font-bold text-center">
                Is it going to rain on me in 5 seconds?
              </p>
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-6 text-center">
                <p className="text-4xl font-black">$0.99</p>
                <p className="text-sm mt-2">One-time payment for this revolutionary feature!</p>
              </div>
              <button
                onClick={() => setShowPremium(false)}
                className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-4 rounded-lg transition-all"
              >
                Maybe Later
              </button>
              <p className="text-xs text-center text-gray-500 italic">
                (Just kidding, we're not actually charging you anything)
              </p>
            </div>
          </div>
        )}

        {/* Saved Locations */}
        {savedLocations.length > 0 && (
          <div className="border-2 border-blue-300 rounded-lg p-4">
            <h3 className="text-xl font-bold text-blue-900 mb-3">
              💾 Your Favorite Rain Locations ({savedLocations.length})
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {savedLocations.slice(-5).reverse().map((loc, idx) => (
                <div key={idx} className="bg-blue-50 rounded p-2 text-sm">
                  <p className="font-mono text-xs">
                    {loc.lat.toFixed(4)}°N, {loc.lon.toFixed(4)}°W
                  </p>
                  <p className="text-gray-600">
                    {loc.wasRaining ? '🌧️ Was raining' : '☀️ Was not raining'} - {new Date(loc.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 text-sm">
          <p className="text-yellow-800 font-bold mb-2">📋 Instructions:</p>
          <ol className="list-decimal list-inside space-y-1 text-yellow-700">
            <li>Go outside (light sensor will detect if you're indoors)</li>
            <li>Shake your phone to activate rain detection</li>
            <li>Press the big button</li>
            <li>Get the most useless weather information ever! 🎉</li>
          </ol>
        </div>

      </div>
    </main>
  )
}
