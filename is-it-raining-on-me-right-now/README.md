# ☔ Is It Raining On Me Right Now? 🌧️

The most useless weather app ever made!

## What does it do?

This app tells you if it's raining on you right now. But here's the catch - **you have to be outside to use it**!

## Features

- 📍 Uses your geolocation to get your exact position
- 🌦️ Fetches real-time weather data from Open-Meteo API
- 💡 Attempts to detect if you're outside using ambient light sensor (if your browser supports it)
- 🤦 Makes you wonder why you're using an app to check if it's raining when you could just... look up

## Why is this useless?

If you're outside and want to know if it's raining, you could:

- Look up at the sky
- Hold out your hand
- Feel the rain on your face
- Just... observe your surroundings

But instead, you're using an app! 😄

## How to run

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

## How to use

1. Go outside (seriously, the app requires this)
2. Open the app on your phone or laptop
3. Allow location permissions
4. Click "Check If It's Raining"
5. The app will tell you what you already know from being outside

## Browser Support

The app uses the Ambient Light Sensor API to detect if you're outside. This is supported in:

- Some Chromium-based browsers (Chrome, Edge) on certain devices
- May require HTTPS in production

If your browser doesn't support it, the app will still work but won't be able to verify you're outside (defeating the whole point of the uselessness!).

## Technologies Used

- React
- Geolocation API
- Ambient Light Sensor API
- Open-Meteo Weather API (free, no API key needed)

---

**Disclaimer**: This is a joke app. Please don't actually use this. Just look outside. 🌈
