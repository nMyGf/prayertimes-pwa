"use client"

import { useEffect, useRef, useState } from "react"
import { useGoogleMaps } from "@/hooks/use-google-maps"
import { usePrayerCalculations } from "@/hooks/use-prayer-calculations"
import { useTranslation } from "@/hooks/use-translation"
import { LocateFixed } from "lucide-react"
declare global {
  interface Window {
qiblaArrow: any
    userCircle: any
    google: any
    initMap: () => void
    toggleSettingsPanel: () => void
    toggleInfoPanel: () => void
    closeInfoPanel: () => void
    currentClockInterval: any
    countdownInterval: any
    prayerTimes: any
    currentTimeZoneId: string | null
    currentMapInstance: any
    useAgreedTime: boolean
    selectedLang: string
    lastClickedLatLng: any
  }

  interface HTMLDivElement {
    gMap?: any
  }
}

interface MapComponentProps {
  onLoadingChange: (loading: boolean) => void
  selectedLang: string
  useAgreedTime: boolean
}

export function MapComponent({ onLoadingChange, selectedLang, useAgreedTime }: MapComponentProps) {
const mapRef = useRef<HTMLDivElement>(null)
const [map, setMap] = useState<any>(null)
const [isEarthMode, setIsEarthMode] = useState(true)
const [isDarkMode, setIsDarkMode] = useState(false)
const userMarker = useRef<any>(null)
const { isLoaded, error } = useGoogleMaps()
const { calculatePrayerTimes, startClocksAndTimers } = usePrayerCalculations()
const { t } = useTranslation(selectedLang as "en" | "ar" | "tr" | "ur" | "hi" | "de" | "fr")
  // Store the map instance globally for easier access in other functions
  const mapInstance = useRef<any>(null)
  const infoWindowRef = useRef<any>(null)
  const isInfoWindowOpenRef = useRef(false)
  const selectedLangRef = useRef(selectedLang)
  const useAgreedTimeRef = useRef(useAgreedTime)
  const tRef = useRef(t)

  const getCurrentT = () => tRef.current
  
  useEffect(() => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
  (position) => {
    const lat = position.coords.latitude
    const lng = position.coords.longitude

    console.log("MY LOCATION:", lat, lng)

    // 🟢 تحديث الموقع
    calculatePrayerTimes(lat, lng, useAgreedTime, selectedLang)

    // 🔥 هون السحر
    if (mapInstance.current) {
      mapInstance.current.setCenter({ lat, lng })  // يروح لعندك
      mapInstance.current.setZoom(15) 
     if (userMarker.current) {
  userMarker.current.setMap(null)
}

if (window.userCircle) {
  window.userCircle.setMap(null)
}

userMarker.current = new window.google.maps.Marker({
  position: { lat, lng },
  map: mapInstance.current,
  icon: {
    path: window.google.maps.SymbolPath.CIRCLE,
    scale: 9,
    fillColor: "#1a73e8",
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 3,
  },
  zIndex: 9999,
})

window.userCircle = new window.google.maps.Circle({
  strokeColor: "#1a73e8",
  strokeOpacity: 0.35,
  strokeWeight: 1,
  fillColor: "#1a73e8",
  fillOpacity: 0.18,
  map: mapInstance.current,
  center: { lat, lng },
  radius: 35,
})
      // يقرب
    }
  },
  (error) => {
    console.log("Location error:", error)
  },
  {
    enableHighAccuracy: true, // 🔥 مهم جداً
  }
)
  }
}, [calculatePrayerTimes, useAgreedTime, selectedLang])

  useEffect(() => {
    selectedLangRef.current = selectedLang
    useAgreedTimeRef.current = useAgreedTime
    tRef.current = t
    window.selectedLang = selectedLang
    window.useAgreedTime = useAgreedTime
  }, [selectedLang, useAgreedTime, t])

  useEffect(() => {
    // Set up global functions for the info window buttons
    window.currentClockInterval = null
    window.countdownInterval = null
    window.prayerTimes = {}
    window.currentTimeZoneId = null
  }, [])

  // Google Earth-like smooth animation function
  const smoothFlyTo = (map: any, target: { lat: number; lng: number }, zoom = 15) => {
    const start = {
      lat: map.getCenter().lat(),
      lng: map.getCenter().lng(),
      zoom: map.getZoom(),
      tilt: map.getTilt(),
      heading: map.getHeading(),
    }

    const end = {
      lat: target.lat,
      lng: target.lng,
      zoom: zoom,
      tilt: 67.5,
      heading: 0,
    }

    const duration = 2000
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1)
      const easedProgress = easeInOutCubic(progress)

      const current = {
        lat: start.lat + (end.lat - start.lat) * easedProgress,
        lng: start.lng + (end.lng - start.lng) * easedProgress,
        zoom: start.zoom + (end.zoom - start.zoom) * easedProgress,
        tilt: start.tilt + (end.tilt - start.tilt) * easedProgress,
        heading: start.heading + (end.heading - start.heading) * easedProgress,
      }

      map.setCenter({ lat: current.lat, lng: current.lng })
      map.setZoom(current.zoom)
      map.setTilt(current.tilt)
      map.setHeading(current.heading)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    animate()
  }
  const getQiblaBearing = (lat: number, lng: number) => {
  const makkahLat = 21.4225 * (Math.PI / 180)
  const makkahLng = 39.8262 * (Math.PI / 180)
  const userLat = lat * (Math.PI / 180)
  const userLng = lng * (Math.PI / 180)

  const deltaLng = makkahLng - userLng
  const y = Math.sin(deltaLng)
  const x = Math.cos(userLat) * Math.tan(makkahLat) - Math.sin(userLat) * Math.cos(deltaLng)

  const bearing = Math.atan2(y, x) * (180 / Math.PI)
  return (bearing + 360) % 360
}

const toggleQiblaArrow = (map: any, lat: number, lng: number) => {
  const existingArrow = window.qiblaArrow
  if (existingArrow) {
    existingArrow.setMap(null)
    window.qiblaArrow = null
    return
  }

  const bearing = getQiblaBearing(lat, lng)
  const distance = 0.02
  const rad = bearing * (Math.PI / 180)

  const endLat = lat + distance * Math.cos(rad)
  const endLng = lng + (distance * Math.sin(rad)) / Math.cos(lat * (Math.PI / 180))

  const arrowLine = new window.google.maps.Polyline({
    path: [
      { lat, lng },
      { lat: endLat, lng: endLng },
    ],
    geodesic: true,
    strokeColor: "#60a5fa",
    strokeOpacity: 1,
    strokeWeight: 4,
    icons: [
      {
        icon: {
          path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 4,
          strokeColor: "#60a5fa",
          strokeOpacity: 1,
          fillColor: "#60a5fa",
          fillOpacity: 1,
        },
        offset: "100%",
      },
    ],
    map,
  })

  window.qiblaArrow = arrowLine
}

const [location, setLocation] = useState({
  latitude: 39.9334,
  longitude: 32.8597,
})
  useEffect(() => {
    if (isLoaded && mapRef.current && !map && window.google) {
      // Create Google Earth-like map with smart default location
      const googleMap = new window.google.maps.Map(mapRef.current, {
        zoom: 14, // Perfect neighborhood/district level zoom
        center: { lat: 39.9334, lng: 32.8597 }, // Temporary center (Ankara, Turkey)
        mapTypeId: "satellite",
        tilt: 0,
        heading: 0,

        mapTypeControl: true,
        mapTypeControlOptions: {
          style: window.google.maps.MapTypeControlStyle.DROPDOWN_MENU,
          position: window.google.maps.ControlPosition.TOP_LEFT,
          mapTypeIds: ["satellite", "hybrid", "terrain"],
        },

        streetViewControl: true,
        streetViewControlOptions: {
          position: window.google.maps.ControlPosition.LEFT_BOTTOM,
        },

        fullscreenControl: true,
        fullscreenControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_TOP,
        },

        zoomControl: true,
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_CENTER,
        },

        scaleControl: true,
        rotateControl: true,
        gestureHandling: "greedy",
        disableDefaultUI: false,

        styles: [
          {
            featureType: "all",
            elementType: "geometry",
            stylers: [{ saturation: 20 }, { lightness: -10 }, { contrast: 15 }],
          },
          {
            featureType: "water",
            elementType: "geometry.fill",
            stylers: [{ color: "#0f2b47" }, { lightness: 10 }, { saturation: 30 }],
          },
          {
            featureType: "landscape.natural",
            elementType: "geometry.fill",
            stylers: [{ saturation: 25 }, { lightness: -5 }, { contrast: 10 }],
          },
          {
            featureType: "landscape.man_made",
            elementType: "geometry.fill",
            stylers: [{ saturation: 10 }, { lightness: -15 }],
          },
          {
            featureType: "poi.park",
            elementType: "geometry.fill",
            stylers: [{ color: "#2d5a2d" }, { saturation: 20 }],
          },
        ],

        minZoom: 2,
        maxZoom: 21,
        clickableIcons: true,
        keyboardShortcuts: true,
      })

      setTimeout(() => {
        googleMap.setTilt(67.5)
        googleMap.setMapTypeId("satellite")
      }, 1000)

      setMap(googleMap)
      window.currentMapInstance = googleMap
      mapRef.current.gMap = googleMap
      mapInstance.current = googleMap // Store in ref

      // Smart location detection based on user's region
      const detectUserLocation = async () => {
        try {
          console.log("[v0] Starting geolocation detection...")

          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const lat: number = position.coords.latitude
                const lng: number = position.coords.longitude
                const userLocation = {
                  lat: lat,
                  lng: lng,
                }
                calculatePrayerTimes(lat, lng, useAgreedTime, selectedLang)

                console.log("[v0] Geolocation success:", userLocation)

                setTimeout(() => {
                  smoothFlyTo(googleMap, userLocation, 14)
                }, 1500)
              },
              async (error) => {
                console.log("[v0] Geolocation failed:", error.message, "- trying IP-based detection")

                // Fallback to IP-based location
                console.log("[v0] Using IP-based location")
                const response = await fetch("https://ipapi.co/json/")
                if (response.ok) {
                  const data = await response.json()
                  console.log("[v0] IP location data:", data)
                  const ipLat = data.latitude
                  const ipLng = data.longitude
                  if (ipLat && ipLng) {
                    googleMap.setCenter({ lat: ipLat, lng: ipLng })
                    googleMap.setZoom(12)
                    showLocationNotification(`📍 ${getCurrentT().showingIP}`)
                    return
                  }
                }
                console.error("[v0] IP-based location failed:", error)
                timezoneBasedLocation(googleMap)
              },
              {
                enableHighAccuracy: true, // Improved accuracy
                timeout: 15000, // Increased timeout to 15 seconds for better accuracy
                maximumAge: 0, // Don't use cached position
              },
            )
          } else {
            console.log("[v0] Geolocation not supported, trying IP-based detection")
            // No geolocation support, try IP-based
            console.log("[v0] Using IP-based location")
            const response = await fetch("https://ipapi.co/json/")
            if (response.ok) {
              const data = await response.json()
              console.log("[v0] IP-based location data:", data)
              const ipLat = data.latitude
              const ipLng = data.longitude
              if (ipLat && ipLng) {
                googleMap.setCenter({ lat: ipLat, lng: ipLng })
                googleMap.setZoom(12)
                showLocationNotification(`📍 ${getCurrentT().showingIP}`)
                return
              }
            }
            console.error("[v0] IP-based location failed:", response.statusText)
            timezoneBasedLocation(googleMap)
          }
        } catch (error) {
          console.log("[v0] All location detection failed, using timezone fallback:", error)
          timezoneBasedLocation(googleMap)
        }
      }

      // Timezone-based location fallback
      const timezoneBasedLocation = (map: any) => {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        const regionalDefaults: { [key: string]: { lat: number; lng: number; name: string } } = {
          // Europe
          "Europe/London": { lat: 51.5074, lng: -0.1278, name: "London, UK" },
          "Europe/Paris": { lat: 48.8566, lng: 2.3522, name: "Paris, France" },
          "Europe/Berlin": { lat: 52.52, lng: 13.405, name: "Berlin, Germany" },
          "Europe/Rome": { lat: 41.9028, lng: 12.4964, name: "Rome, Italy" },
          "Europe/Madrid": { lat: 40.4168, lng: -3.7038, name: "Madrid, Spain" },
          "Europe/Amsterdam": { lat: 52.3676, lng: 4.9041, name: "Amsterdam, Netherlands" },
          "Europe/Brussels": { lat: 50.8503, lng: 4.3517, name: "Brussels, Belgium" },
          "Europe/Vienna": { lat: 48.2082, lng: 16.3738, name: "Vienna, Austria" },
          "Europe/Zurich": { lat: 47.3769, lng: 8.5417, name: "Zurich, Switzerland" },
          "Europe/Stockholm": { lat: 59.3293, lng: 18.0686, name: "Stockholm, Sweden" },
          "Europe/Istanbul": { lat: 41.0082, lng: 28.9784, name: "Istanbul, Turkey" },
          "Europe/Moscow": { lat: 55.7558, lng: 37.6176, name: "Moscow, Russia" },

          // North America
          "America/New_York": { lat: 40.7128, lng: -74.006, name: "New York, USA" },
          "America/Los_Angeles": { lat: 34.0522, lng: -118.2437, name: "Los Angeles, USA" },
          "America/Chicago": { lat: 41.8781, lng: -87.6298, name: "Chicago, USA" },
          "America/Toronto": { lat: 43.6532, lng: -79.3832, name: "Toronto, Canada" },
          "America/Vancouver": { lat: 49.2827, lng: -123.1207, name: "Vancouver, Canada" },
          "America/Mexico_City": { lat: 19.4326, lng: -99.1332, name: "Mexico City, Mexico" },

          // Asia
          "Asia/Tokyo": { lat: 35.6762, lng: 139.6503, name: "Tokyo, Japan" },
          "Asia/Shanghai": { lat: 31.2304, lng: 121.4737, name: "Shanghai, China" },
          "Asia/Seoul": { lat: 37.5665, lng: 126.978, name: "Seoul, South Korea" },
          "Asia/Mumbai": { lat: 19.076, lng: 72.8777, name: "Mumbai, India" },
          "Asia/Delhi": { lat: 28.7041, lng: 77.1025, name: "Delhi, India" },
          "Asia/Bangkok": { lat: 13.7563, lng: 100.5018, name: "Bangkok, Thailand" },
          "Asia/Singapore": { lat: 1.3521, lng: 103.8198, name: "Singapore" },
          "Asia/Jakarta": { lat: -6.2088, lng: 106.8456, name: "Jakarta, Indonesia" },
          "Asia/Karachi": { lat: 24.8607, lng: 67.0011, name: "Karachi, Pakistan" },
          "Asia/Tehran": { lat: 35.6892, lng: 51.389, name: "Tehran, Iran" },
          "Asia/Dubai": { lat: 25.2048, lng: 55.2708, name: "Dubai, UAE" },
          "Asia/Riyadh": { lat: 24.7136, lng: 46.6753, name: "Riyadh, Saudi Arabia" },
          "Asia/Kuwait": { lat: 29.3759, lng: 47.9774, name: "Kuwait City, Kuwait" },
          "Asia/Doha": { lat: 25.2854, lng: 51.531, name: "Doha, Qatar" },

          // Middle East & Africa
          "Africa/Cairo": { lat: 30.0444, lng: 31.2357, name: "Cairo, Egypt" },
          "Africa/Lagos": { lat: 6.5244, lng: 3.3792, name: "Lagos, Nigeria" },
          "Africa/Johannesburg": { lat: -26.2041, lng: 28.0473, name: "Johannesburg, South Africa" },
          "Africa/Casablanca": { lat: 33.5731, lng: -7.5898, name: "Casablanca, Morocco" },
          "Africa/Tunis": { lat: 36.8065, lng: 10.1815, name: "Tunis, Tunisia" },
          "Africa/Algiers": { lat: 36.7538, lng: 3.0588, name: "Algiers, Algeria" },

          // Oceania
          "Australia/Sydney": { lat: -33.8688, lng: 151.2093, name: "Sydney, Australia" },
          "Australia/Melbourne": { lat: -37.8136, lng: 144.9631, name: "Melbourne, Australia" },
          "Pacific/Auckland": { lat: -36.8485, lng: 174.7633, name: "Auckland, New Zealand" },

          // South America
          "America/Sao_Paulo": { lat: -23.5505, lng: -46.6333, name: "São Paulo, Brazil" },
          "America/Buenos_Aires": { lat: -34.6118, lng: -58.396, name: "Buenos Aires, Argentina" },
          "America/Lima": { lat: -12.0464, lng: -77.0428, name: "Lima, Peru" },
        }

        const location = regionalDefaults[timezone] || { lat: 41.0082, lng: 28.9784, name: "Istanbul, Turkey" }
        console.log("[v0] Using timezone-based location:", location)
        map.setCenter({ lat: location.lat, lng: location.lng })
        map.setZoom(12)
        showLocationNotification(`🌍 ${getCurrentT().showingTimezone.replace("{location}", location.name)}`)
      }

      // Show location notification
      const showLocationNotification = (message: string) => {
        const notification = document.createElement("div")
        notification.innerHTML = `
          <div
          
            style={{
  position: "absolute",
  bottom: "170px",
right: "22px",
  zIndex: 9999,
  width: "44px",
  height: "46px",
  borderRadius: "50%",
  border: "1px solid #660808",
  background: "#6e1616",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  boxShadow: "0 2px 8px rgba(131, 22, 22, 0.25)",
  transition: "all 0.2s ease",
}}
          </div>
        `
        document.body.appendChild(notification)

        setTimeout(() => {
          notification.style.animation = "slideOutUp 0.5s ease-in"
          setTimeout(() => notification.remove(), 500)
        }, 4000)
      }

      // Start location detection
      detectUserLocation()

      // Rest of the map event listeners...
      if (!infoWindowRef.current) {
        infoWindowRef.current = new window.google.maps.InfoWindow({
          maxWidth: 420,
          pixelOffset: new window.google.maps.Size(0, -10),
        })

        window.google.maps.event.addListener(infoWindowRef.current, "closeclick", () => {
          isInfoWindowOpenRef.current = false
        })
      }

      const infoWindow = infoWindowRef.current

      googleMap.addListener("click", async (event: any) => {
        if (!event.latLng) return
        const existingArrow = window.qiblaArrow
        if (existingArrow) {
        existingArrow.setMap(null)
        window.qiblaArrow = null
          }

        let lat: number, lng: number
        if (typeof event.latLng.lat === "function") {
          lat = event.latLng.lat()
          lng = event.latLng.lng()
        } else {
          lat = event.latLng.lat
          lng = event.latLng.lng
        }

        if (infoWindowRef.current) {
          infoWindowRef.current.close()
          isInfoWindowOpenRef.current = false
        }

        window.lastClickedLatLng = { lat, lng }

        if (googleMap.getZoom() < 14) {
          smoothFlyTo(googleMap, { lat, lng }, 15)
        }

        if (window.currentClockInterval) clearInterval(window.currentClockInterval)
        if (window.countdownInterval) clearInterval(window.countdownInterval)

        window.google.maps.event.addListenerOnce(infoWindow, "domready", () => {
          const findButton = document.getElementById("findButton")
          if (findButton) {
          findButton.addEventListener("click", () => {
          toggleQiblaArrow(googleMap, lat, lng)
           })
          }
          const settingsButton = document.getElementById("settingsButton")
          if (settingsButton) {
            settingsButton.addEventListener("click", window.toggleSettingsPanel)
          }

          const closeButton = document.getElementById("closeInfoButton")
if (closeButton) {
  closeButton.addEventListener("click", () => {
    infoWindow.close()
    isInfoWindowOpenRef.current = false

    const existingArrow = window.qiblaArrow
    if (existingArrow) {
      existingArrow.setMap(null)
      window.qiblaArrow = null
    }
  })
}
        })

        try {
          onLoadingChange(true)
          const result = await calculatePrayerTimes(lat, lng, window.useAgreedTime || useAgreedTimeRef.current, selectedLangRef.current)

          const content = `
            <div id="infoWindowContent" style="background: linear-gradient(135deg, rgba(0,0,0,0.95), rgba(30,30,30,0.98)); color: white; border-radius: 15px; padding: 15px; max-width: 400px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8); position: relative;">
              
              <!-- Added visible close button at top-right corner -->
              <button id="closeInfoButton" style="position: absolute; top: 8px; right: 8px; width: 32px; height: 32px; background: linear-gradient(135deg, #ef4444, #dc2626); border: 2px solid white; border-radius: 50%; color: white; font-size: 20px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.3); transition: all 0.2s; z-index: 10;" onmouseover="this.style.transform='scale(1.1)'; this.style.background='linear-gradient(135deg, #dc2626, #b91c1c)';" onmouseout="this.style.transform='scale(1)'; this.style.background='linear-gradient(135deg, #ef4444, #dc2626)';" title="Close">×</button>
              
              <h3 style="border: 4px solid ${result.method === "agreed" ? "#34a853" : "#ea4335"}; color: white; padding: 8px; margin: 0 0 15px 0; text-align: center; border-radius: 10px; background: rgba(0,0,0,0.5); font-size: 20px;">
                🕌 ${getCurrentT().popupTitle}
              </h3>
              
              <!-- Prayer times moved to top with larger sizing -->
              <div style="background: rgba(0,0,0,0.4); padding: 15px; border-radius: 10px; margin-bottom: 15px; border: 4px solid #3b82f6;">
                <!-- Use translation for Prayer Times title -->
                <h4 style="text-align: center; color: #3b82f6; margin: 0 0 15px 0; font-size: 18px; font-weight: bold;">🕌 ${getCurrentT().prayerTimes}</h4>
                
                <div class="prayer-card" style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); margin-bottom: 8px; padding: 12px 15px; border-radius: 10px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4); animation: fadeInUp 0.3s ease-out; border: 3px solid #3b82f6; max-width: 350px;">
                  <div style="display: flex; align-items: center;">
                    <span style="font-weight: bold; font-size: 18px; color: white;">${getCurrentT().fajr}</span>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-size: 20px; font-weight: bold; color: #fbbf24;">
                      ${(result.displayTimes?.fajr || result.prayerTimes.fajr).replace(/([AP]M)/, '<span style="font-size: 12px;">$1</span>')}
                    </div>
                  </div>
                </div>

                <div class="prayer-card" style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); margin-bottom: 8px; padding: 12px 15px; border-radius: 10px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4); animation: fadeInUp 0.4s ease-out; border: 3px solid #3b82f6; max-width: 350px;">
                  <div style="display: flex; align-items: center;">
                    <span style="font-weight: bold; font-size: 18px; color: white;">${getCurrentT().sunrise}</span>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-size: 20px; font-weight: bold; color: #fbbf24;">
                      ${(result.displayTimes?.sunrise || result.prayerTimes.sunrise).replace(/([AP]M)/, '<span style="font-size: 12px;">$1</span>')}
                    </div>
                  </div>
                </div>

                <div class="prayer-card" style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); margin-bottom: 8px; padding: 12px 15px; border-radius: 10px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4); animation: fadeInUp 0.5s ease-out; border: 3px solid #3b82f6; max-width: 350px;">
                  <div style="display: flex; align-items: center;">
                    <span style="font-weight: bold; font-size: 18px; color: white;">${getCurrentT().dhohr}</span>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-size: 20px; font-weight: bold; color: #fbbf24;">
                      ${(result.displayTimes?.dhohr || result.prayerTimes.dhohr).replace(/([AP]M)/, '<span style="font-size: 12px;">$1</span>')}
                    </div>
                  </div>
                </div>

                <div class="prayer-card" style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); margin-bottom: 8px; padding: 12px 15px; border-radius: 10px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4); animation: fadeInUp 0.6s ease-out; border: 3px solid #3b82f6; max-width: 350px;">
                  <div style="display: flex; align-items: center;">
                    <span style="font-weight: bold; font-size: 18px; color: white;">${getCurrentT().asr}</span>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-size: 20px; font-weight: bold; color: #fbbf24;">
                      ${(result.displayTimes?.asr || result.prayerTimes.asr).replace(/([AP]M)/, '<span style="font-size: 12px;">$1</span>')}
                    </div>
                  </div>
                </div>

                <!-- Added margin-bottom to Maghrib for spacing before Isha -->
                <div class="prayer-card" style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); margin-bottom: 8px; padding: 12px 15px; border-radius: 10px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4); animation: fadeInUp 0.7s ease-out; border: 3px solid #3b82f6; max-width: 350px;">
                  <div style="display: flex; align-items: center;">
                    <span style="font-weight: bold; font-size: 18px; color: white;">${getCurrentT().maghrib}</span>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-size: 20px; font-weight: bold; color: #fbbf24;">
                      ${(result.displayTimes?.maghrib || result.prayerTimes.maghrib).replace(/([AP]M)/, '<span style="font-size: 12px;">$1</span>')}
                    </div>
                  </div>
                </div>

                <div class="prayer-card" style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); margin-bottom: 0; padding: 12px 15px; border-radius: 10px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4); animation: fadeInUp 0.8s ease-out; border: 3px solid #3b82f6; max-width: 350px;">
                  <div style="display: flex; align-items: center;">
                    <span style="font-weight: bold; font-size: 18px; color: white;">${getCurrentT().isha}</span>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-size: 20px; font-weight: bold; color: #fbbf24;">
                      ${(result.displayTimes?.isha || result.prayerTimes.isha).replace(/([AP]M)/, '<span style="font-size: 12px;">$1</span>')}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Location information moved to bottom with smaller sizing and white borders -->
              <div style="background: rgba(0,0,0,0.4); padding: 10px; border-radius: 10px; margin-bottom: 15px; border: 4px solid white;">
                <!-- Use translation for Location Information title -->
                <h4 style="text-align: center; color: white; margin: 0 0 10px 0; font-size: 12px; font-weight: bold;">📍 ${getCurrentT().locationInfo}</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                  
                  <div class="info-card" style="background: linear-gradient(135deg, #581c87, #8b5cf6); padding: 6px; border-radius: 6px; display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 4px rgba(139, 92, 246, 0.3); animation: fadeInUp 0.2s ease-out; border: 2px solid white; min-height: 40px;">
                    <span style="font-size: 12px;">📍</span>
                    <div style="flex: 1;">
                      <div style="font-size: 10px; font-weight: bold; color: white;">${getCurrentT().latitude}</div>
                      <div style="font-size: 11px; font-weight: bold; color: #fbbf24;">${lat.toFixed(5)}</div>
                    </div>
                  </div>

                  <div class="info-card" style="background: linear-gradient(135deg, #581c87, #8b5cf6); padding: 6px; border-radius: 6px; display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 4px rgba(139, 92, 246, 0.3); animation: fadeInUp 0.3s ease-out; border: 2px solid white; min-height: 40px;">
                    <span style="font-size: 12px;">📍</span>
                    <div style="flex: 1;">
                      <div style="font-size: 10px; font-weight: bold; color: white;">${getCurrentT().longitude}</div>
                      <div style="font-size: 11px; font-weight: bold; color: #fbbf24;">${lng.toFixed(5)}</div>
                    </div>
                  </div>

                  ${
                    result.elevation !== undefined
                      ? `
                  <div class="info-card" style="background: linear-gradient(135deg, #581c87, #8b5cf6); padding: 6px; border-radius: 6px; display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 4px rgba(139, 92, 246, 0.3); animation: fadeInUp 0.4s ease-out; border: 2px solid white; min-height: 40px;">
                    <span style="font-size: 12px;">⛰️</span>
                    <div style="flex: 1;">
                      <div style="font-size: 10px; font-weight: bold; color: white;">${getCurrentT().elevation}</div>
                      <div style="font-size: 11px; font-weight: bold; color: #fbbf24;">${result.elevation}m</div>
                    </div>
                  </div>
                  `
                      : ""
                  }

                  <div class="info-card" style="background: linear-gradient(135deg, #581c87, #8b5cf6); padding: 6px; border-radius: 6px; display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 4px rgba(139, 92, 246, 0.3); animation: fadeInUp 0.5s ease-out; border: 2px solid white; min-height: 40px;">
                    <span style="font-size: 12px;">🌍</span>
                    <div style="flex: 1;">
                      <!-- Use translation for Time Zone -->
                      <div style="font-size: 10px; font-weight: bold; color: white;">${getCurrentT().timeZone}</div>
                      <div style="font-size: 11px; font-weight: bold; color: #fbbf24;">${result.timeZoneId?.split("/")[1] || "Unknown"}</div>
                    </div>
                  </div>

                  <div class="info-card" style="background: linear-gradient(135deg, #581c87, #8b5cf6); padding: 6px; border-radius: 6px; display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 4px rgba(139, 92, 246, 0.3); animation: fadeInUp 0.6s ease-out; border: 2px solid white; min-height: 40px;">
                    <span style="font-size: 12px;">🌙</span>
                    <div style="flex: 1;">
                      <div style="font-size: 10px; font-weight: bold; color: white;">${getCurrentT().hijri}</div>
                      <div style="font-size: 11px; font-weight: bold; color: #fbbf24;">${result.hijriDate}</div>
                    </div>
                  </div>

                  <div class="info-card" style="background: linear-gradient(135deg, #581c87, #8b5cf6); padding: 6px; border-radius: 6px; display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 4px rgba(139, 92, 246, 0.3); animation: fadeInUp 0.7s ease-out; border: 2px solid white; min-height: 40px;">
                    <span style="font-size: 12px;">📅</span>
                    <div style="flex: 1;">
                      <div style="font-size: 10px; font-weight: bold; color: white;">${getCurrentT().date}</div>
                      <div style="font-size: 11px; font-weight: bold; color: #fbbf24;">${result.date}</div>
                    </div>
                  </div>

                  <div class="info-card" style="grid-column: 1 / -1; background: linear-gradient(135deg, #581c87, #8b5cf6); padding: 6px; border-radius: 6px; display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 4px rgba(139, 92, 246, 0.3); animation: fadeInUp 0.8s ease-out; border: 2px solid white; min-height: 40px;">
                    <span style="font-size: 12px;">🕒</span>
                    <div style="flex: 1;">
                      <div style="font-size: 10px; font-weight: bold; color: white;">${getCurrentT().localTime}</div>
                      <div id="liveClock" style="font-size: 18px; font-weight: bold; color: #fbbf24;">${new Date().toLocaleTimeString()}</div>
                    </div>
                  </div>

                  <div class="info-card" style="grid-column: 1 / -1; background: linear-gradient(135deg, #581c87, #8b5cf6); padding: 6px; border-radius: 6px; display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 4px rgba(139, 92, 246, 0.3); animation: fadeInUp 0.9s ease-out; border: 2px solid white; min-height: 40px;">
                    <span style="font-size: 12px;">📍</span>
                    <div style="flex: 1;">
                      <div style="font-size: 10px; font-weight: bold; color: white;">${getCurrentT().Address}</div>
                      <div style="font-size: 11px; font-weight: bold; color: #fbbf24; line-height: 1.3;">${result.locationName}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              ${result.methodName ? `<div style="text-align: center; margin-bottom: 15px; padding: 4px; background: rgba(52,168,83,0.2); border-radius: 6px; font-size: 11px; border: 1px solid rgba(52,168,83,0.4);"><b>📋 ${getCurrentT().method}:</b> <span style="color: #34a853;">${result.methodName}</span></div>` : ""}
              
              <!-- Added developer credit above the settings button -->
              <div style="text-align: center; margin-bottom: 10px; padding: 6px; background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2)); border-radius: 6px; font-size: 10px; border: 1px solid rgba(139,92,246,0.3);">
                <span style="color: #c4b5fd; font-weight: 600;">${getCurrentT().developerCredit}</span>
              </div>
              
             <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 15px;">
  <button id="findButton" style="flex: 1; background:  #fbbf24; color: black; border: none; padding: 10px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 12px;">
    🧭${getCurrentT().findQiblaButton} 
  </button>

  <button id="settingsButton" style="flex: 1; background: #fbbf24; color: black; border: none; padding: 10px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 12px;">
    ⚙️ ${getCurrentT().settingsButton}
  </button>
</div>
          `

          infoWindow.setContent(content)
          infoWindow.setPosition(event.latLng)
          infoWindow.open(googleMap)
          isInfoWindowOpenRef.current = true

          window.prayerTimes = result.prayerTimes
          window.currentTimeZoneId = result.timeZoneId

          startClocksAndTimers(result.timeZoneId, selectedLangRef.current)
        } catch (error) {
          console.error("Error calculating prayer times:", error)
          infoWindow.setContent(`
            <div style="padding: 15px; color: #ea4335; background: rgba(0,0,0,0.9); border-radius: 10px; text-align: center;">
              <h3>❌ Error</h3>
              <p>${error}</p>
            </div>
          `)
          infoWindow.setPosition(event.latLng)
          infoWindow.open(googleMap)
          isInfoWindowOpenRef.current = true
        } finally {
          onLoadingChange(false)
        }
      })
    }
  }, [isLoaded, map, calculatePrayerTimes, useAgreedTime, selectedLang, onLoadingChange, startClocksAndTimers, t])

  useEffect(() => {
    // If there's an open info window and a last clicked location, regenerate its content
    if (!window.google?.maps || !window.lastClickedLatLng || !mapInstance.current) return
    if (!infoWindowRef.current || !isInfoWindowOpenRef.current) return

    const infoWindow = infoWindowRef.current
    const lat = window.lastClickedLatLng.lat
    const lng = window.lastClickedLatLng.lng

    infoWindow.close()
    isInfoWindowOpenRef.current = false

    // Recalculate and refresh the info window with new translations
      calculatePrayerTimes(lat, lng, window.useAgreedTime || useAgreedTimeRef.current, selectedLangRef.current)
        .then((result) => {
          const content = `
              <div id="infoWindowContent" style="background: linear-gradient(135deg, rgba(0,0,0,0.95), rgba(30,30,30,0.98)); color: white; border-radius: 15px; padding: 15px; max-width: 400px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8); position: relative;">
                <!-- Added visible close button at top-right corner -->
                <button id="closeInfoButton" style="position: absolute; top: 8px; right: 8px; width: 32px; height: 32px; background: linear-gradient(135deg, #ef4444, #dc2626); border: 2px solid white; border-radius: 50%; color: white; font-size: 20px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.3); transition: all 0.2s; z-index: 10;" onmouseover="this.style.transform='scale(1.1)'; this.style.background='linear-gradient(135deg, #dc2626, #b91c1c)';" onmouseout="this.style.transform='scale(1)'; this.style.background='linear-gradient(135deg, #ef4444, #dc2626)';" title="Close">×</button>
                
                <h3 style="border: 4px solid ${result.method === "agreed" ? "#34a853" : "#ea4335"}; color: white; padding: 8px; margin: 0 0 15px 0; text-align: center; border-radius: 10px; background: rgba(0,0,0,0.5); font-size: 20px;">
                  🕌 ${getCurrentT().popupTitle}
                </h3>
                
                <div style="background: rgba(0,0,0,0.4); padding: 15px; border-radius: 10px; margin-bottom: 15px; border: 4px solid #3b82f6;">
                  <h4 style="text-align: center; color: #3b82f6; margin: 0 0 15px 0; font-size: 18px; font-weight: bold;">🕌 ${getCurrentT().prayerTimes}</h4>
                  
                  <div class="prayer-card" style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); margin-bottom: 8px; padding: 12px 15px; border-radius: 10px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4); animation: fadeInUp 0.3s ease-out; border: 3px solid #3b82f6; max-width: 350px;">
                    <div style="display: flex; align-items: center;">
                      <span style="font-weight: bold; font-size: 18px; color: white;">${getCurrentT().fajr}</span>
                    </div>
                    <div style="text-align: right;">
                      <div style="font-size: 20px; font-weight: bold; color: #fbbf24;">
                        ${(result.displayTimes?.fajr || result.prayerTimes.fajr).replace(/([AP]M)/, '<span style="font-size: 12px;">$1</span>')}
                      </div>
                    </div>
                  </div>

                  <div class="prayer-card" style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); margin-bottom: 8px; padding: 12px 15px; border-radius: 10px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4); animation: fadeInUp 0.4s ease-out; border: 3px solid #3b82f6; max-width: 350px;">
                    <div style="display: flex; align-items: center;">
                      <span style="font-weight: bold; font-size: 18px; color: white;">${getCurrentT().sunrise}</span>
                    </div>
                    <div style="text-align: right;">
                      <div style="font-size: 20px; font-weight: bold; color: #fbbf24;">
                        ${(result.displayTimes?.sunrise || result.prayerTimes.sunrise).replace(/([AP]M)/, '<span style="font-size: 12px;">$1</span>')}
                      </div>
                    </div>
                  </div>

                  <div class="prayer-card" style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); margin-bottom: 8px; padding: 12px 15px; border-radius: 10px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4); animation: fadeInUp 0.5s ease-out; border: 3px solid #3b82f6; max-width: 350px;">
                    <div style="display: flex; align-items: center;">
                      <span style="font-weight: bold; font-size: 18px; color: white;">${getCurrentT().dhohr}</span>
                    </div>
                    <div style="text-align: right;">
                      <div style="font-size: 20px; font-weight: bold; color: #fbbf24;">
                        ${(result.displayTimes?.dhohr || result.prayerTimes.dhohr).replace(/([AP]M)/, '<span style="font-size: 12px;">$1</span>')}
                      </div>
                    </div>
                  </div>

                  <div class="prayer-card" style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); margin-bottom: 8px; padding: 12px 15px; border-radius: 10px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4); animation: fadeInUp 0.6s ease-out; border: 3px solid #3b82f6; max-width: 350px;">
                    <div style="display: flex; align-items: center;">
                      <span style="font-weight: bold; font-size: 18px; color: white;">${getCurrentT().asr}</span>
                    </div>
                    <div style="text-align: right;">
                      <div style="font-size: 20px; font-weight: bold; color: #fbbf24;">
                        ${(result.displayTimes?.asr || result.prayerTimes.asr).replace(/([AP]M)/, '<span style="font-size: 12px;">$1</span>')}
                      </div>
                    </div>
                  </div>

                  <div class="prayer-card" style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); margin-bottom: 8px; padding: 12px 15px; border-radius: 10px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4); animation: fadeInUp 0.7s ease-out; border: 3px solid #3b82f6; max-width: 350px;">
                    <div style="display: flex; align-items: center;">
                      <span style="font-weight: bold; font-size: 18px; color: white;">${getCurrentT().maghrib}</span>
                    </div>
                    <div style="text-align: right;">
                      <div style="font-size: 20px; font-weight: bold; color: #fbbf24;">
                        ${(result.displayTimes?.maghrib || result.prayerTimes.maghrib).replace(/([AP]M)/, '<span style="font-size: 12px;">$1</span>')}
                      </div>
                    </div>
                  </div>

                  <div class="prayer-card" style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); margin-bottom: 0; padding: 12px 15px; border-radius: 10px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4); animation: fadeInUp 0.8s ease-out; border: 3px solid #3b82f6; max-width: 350px;">
                    <div style="display: flex; align-items: center;">
                      <span style="font-weight: bold; font-size: 18px; color: white;">${getCurrentT().isha}</span>
                    </div>
                    <div style="text-align: right;">
                      <div style="font-size: 20px; font-weight: bold; color: #fbbf24;">
                        ${(result.displayTimes?.isha || result.prayerTimes.isha).replace(/([AP]M)/, '<span style="font-size: 12px;">$1</span>')}
                      </div>
                    </div>
                  </div>
                </div>

                <div style="background: rgba(0,0,0,0.4); padding: 10px; border-radius: 10px; margin-bottom: 15px; border: 4px solid white;">
                  <h4 style="text-align: center; color: white; margin: 0 0 10px 0; font-size: 12px; font-weight: bold;">📍 ${getCurrentT().locationInfo}</h4>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                    
                    <div class="info-card" style="background: linear-gradient(135deg, #581c87, #8b5cf6); padding: 6px; border-radius: 6px; display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 4px rgba(139, 92, 246, 0.3); animation: fadeInUp 0.2s ease-out; border: 2px solid white; min-height: 40px;">
                      <span style="font-size: 12px;">📍</span>
                      <div style="flex: 1;">
                        <div style="font-size: 10px; font-weight: bold; color: white;">${getCurrentT().latitude}</div>
                        <div style="font-size: 11px; font-weight: bold; color: #fbbf24;">${lat.toFixed(5)}</div>
                      </div>
                    </div>

                    <div class="info-card" style="background: linear-gradient(135deg, #581c87, #8b5cf6); padding: 6px; border-radius: 6px; display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 4px rgba(139, 92, 246, 0.3); animation: fadeInUp 0.3s ease-out; border: 2px solid white; min-height: 40px;">
                      <span style="font-size: 12px;">📍</span>
                      <div style="flex: 1;">
                        <div style="font-size: 10px; font-weight: bold; color: white;">${getCurrentT().longitude}</div>
                        <div style="font-size: 11px; font-weight: bold; color: #fbbf24;">${lng.toFixed(5)}</div>
                      </div>
                    </div>

                    ${
                      result.elevation !== undefined
                        ? `
                    <div class="info-card" style="background: linear-gradient(135deg, #581c87, #8b5cf6); padding: 6px; border-radius: 6px; display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 4px rgba(139, 92, 246, 0.3); animation: fadeInUp 0.4s ease-out; border: 2px solid white; min-height: 40px;">
                      <span style="font-size: 12px;">⛰️</span>
                      <div style="flex: 1;">
                        <div style="font-size: 10px; font-weight: bold; color: white;">${getCurrentT().elevation}</div>
                        <div style="font-size: 11px; font-weight: bold; color: #fbbf24;">${result.elevation}m</div>
                      </div>
                    </div>
                    `
                        : ""
                    }

                    <div class="info-card" style="background: linear-gradient(135deg, #581c87, #8b5cf6); padding: 6px; border-radius: 6px; display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 4px rgba(139, 92, 246, 0.3); animation: fadeInUp 0.5s ease-out; border: 2px solid white; min-height: 40px;">
                      <span style="font-size: 12px;">🌍</span>
                      <div style="flex: 1;">
                        <div style="font-size: 10px; font-weight: bold; color: white;">${getCurrentT().timeZone}</div>
                        <div style="font-size: 11px; font-weight: bold; color: #fbbf24;">${result.timeZoneId?.split("/")[1] || "Unknown"}</div>
                      </div>
                    </div>

                    <div class="info-card" style="background: linear-gradient(135deg, #581c87, #8b5cf6); padding: 6px; border-radius: 6px; display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 4px rgba(139, 92, 246, 0.3); animation: fadeInUp 0.6s ease-out; border: 2px solid white; min-height: 40px;">
                      <span style="font-size: 12px;">🌙</span>
                      <div style="flex: 1;">
                        <div style="font-size: 10px; font-weight: bold; color: white;">${getCurrentT().hijri}</div>
                        <div style="font-size: 11px; font-weight: bold; color: #fbbf24;">${result.hijriDate}</div>
                      </div>
                    </div>

                    <div class="info-card" style="background: linear-gradient(135deg, #581c87, #8b5cf6); padding: 6px; border-radius: 6px; display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 4px rgba(139, 92, 246, 0.3); animation: fadeInUp 0.7s ease-out; border: 2px solid white; min-height: 40px;">
                      <span style="font-size: 12px;">📅</span>
                      <div style="flex: 1;">
                        <div style="font-size: 10px; font-weight: bold; color: white;">${getCurrentT().date}</div>
                        <div style="font-size: 11px; font-weight: bold; color: #fbbf24;">${result.date}</div>
                      </div>
                    </div>

                    <div class="info-card" style="grid-column: 1 / -1; background: linear-gradient(135deg, #581c87, #8b5cf6); padding: 6px; border-radius: 6px; display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 4px rgba(139, 92, 246, 0.3); animation: fadeInUp 0.8s ease-out; border: 2px solid white; min-height: 40px;">
                      <span style="font-size: 12px;">🕒</span>
                      <div style="flex: 1;">
                        <div style="font-size: 10px; font-weight: bold; color: white;">${getCurrentT().localTime}</div>
                        <div id="liveClock" style="font-size: 18px; font-weight: bold; color: #fbbf24;">${new Date().toLocaleTimeString()}</div>
                      </div>
                    </div>

                    <div class="info-card" style="grid-column: 1 / -1; background: linear-gradient(135deg, #581c87, #8b5cf6); padding: 6px; border-radius: 6px; display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 4px rgba(139, 92, 246, 0.3); animation: fadeInUp 0.9s ease-out; border: 2px solid white; min-height: 40px;">
                      <span style="font-size: 12px;">📍</span>
                      <div style="flex: 1;">
                        <div style="font-size: 10px; font-weight: bold; color: white;">${getCurrentT().Address}</div>
                        <div style="font-size: 11px; font-weight: bold; color: #fbbf24; line-height: 1.3;">${result.locationName}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                ${result.methodName ? `<div style="text-align: center; margin-bottom: 15px; padding: 4px; background: rgba(52,168,83,0.2); border-radius: 6px; font-size: 11px; border: 1px solid rgba(52,168,83,0.4);"><b>📋 ${getCurrentT().method}:</b> <span style="color: #34a853;">${result.methodName}</span></div>` : ""}
                
                <!-- Added developer credit above the settings button -->
                <div style="text-align: center; margin-bottom: 10px; padding: 6px; background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2)); border-radius: 6px; font-size: 10px; border: 1px solid rgba(139,92,246,0.3);">
                  <span style="color: #c4b5fd; font-weight: 600;">${getCurrentT().developerCredit}</span>
                </div>
                
              <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 15px;">
  <button id="findButton" style="flex: 1; background:  #fbbf24; color: black; border: none; padding: 10px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 12px;">
    🧭${getCurrentT().findQiblaButton} 
  </button>

  <button id="settingsButton" style="flex: 1; background: #fbbf24; color: black; border: none; padding: 10px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 12px;">
    ⚙️ ${getCurrentT().settingsButton}
  </button>
</div>
            `

          infoWindow.setContent(content)
          infoWindow.setPosition({ lat, lng })
          infoWindow.open(mapInstance.current)
          isInfoWindowOpenRef.current = true

          window.google.maps.event.addListenerOnce(infoWindow, "domready", () => {
            const findButton = document.getElementById("findButton")
if (findButton) {
  findButton.addEventListener("click", () => {
    toggleQiblaArrow(mapInstance.current, lat, lng)
  })
}
            const settingsButton = document.getElementById("settingsButton")
            if (settingsButton) {
              settingsButton.addEventListener("click", window.toggleSettingsPanel)
            }
            const closeButton = document.getElementById("closeInfoButton")
            if (closeButton) {
             closeButton.addEventListener("click", () => {
  infoWindow.close()
  isInfoWindowOpenRef.current = false

  const existingArrow = window.qiblaArrow
  if (existingArrow) {
    existingArrow.setMap(null)
    window.qiblaArrow = null
  }
})
            }
            startClocksAndTimers(result.timeZoneId, selectedLangRef.current)
          })
        })
        .catch((error) => {
          console.error("[v0] Error refreshing info window:", error)
        })
  }, [selectedLang, t, calculatePrayerTimes, startClocksAndTimers, useAgreedTime]) // Re-run when language or relevant props change
 


  
  return (
    <>
 <button
  onClick={() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude

        if (mapInstance.current) {
          mapInstance.current.setCenter({ lat, lng })
          mapInstance.current.setZoom(18)

        }

        calculatePrayerTimes(lat, lng, useAgreedTime, selectedLang)
      },
      (error) => {
        console.log(error)
      },
      {
        enableHighAccuracy: true
      }
    )
  }}
  style={{
    position: "absolute",
   bottom: "90px",
    right: "20px",
    zIndex: 9999,
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    border: "none",
    background: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(170, 22, 22, 0.3)"
  }}
>
  <LocateFixed size={22} color="#420c0c" />
</button>

    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full" id="map" />

      {error && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center z-50">
          <div className="text-center text-white max-w-2xl mx-4 p-8">
            <div className="text-8xl mb-6 animate-bounce">🗺️</div>
            <h2 className="text-3xl font-bold mb-4 text-red-400">Google Maps API Error</h2>
            <p className="text-gray-300 mb-8 text-lg leading-relaxed">
              Google Maps API key is missing. Please add{" "}
              <code className="bg-gray-700 px-2 py-1 rounded text-yellow-300 font-mono">
                NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
              </code>{" "}
              to your environment variables.
            </p>

            <div className="bg-gray-800 border border-gray-600 p-6 rounded-xl text-left">
              <h3 className="text-xl font-bold mb-4 text-blue-400 flex items-center gap-2">
                <span>🔧</span> To fix this issue:
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <p className="text-gray-200 mb-2">
                      Create a <code className="bg-gray-700 px-2 py-1 rounded text-yellow-300">.env.local</code> file in
                      your project root
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <p className="text-gray-200 mb-2">Add:</p>
                    <code className="bg-gray-900 text-green-400 px-3 py-2 rounded block font-mono text-sm">
                      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key
                    </code>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <p className="text-gray-200 mb-2">Get an API key from</p>
                    <a
                      href="https://console.cloud.google.com"
                      className="text-blue-400 hover:text-blue-300 underline transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Google Cloud Console
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                    4
                  </span>
                  <div>
                    <p className="text-gray-200 mb-2">
                      Enable: Maps JavaScript API, Geocoding API, Time Zone API, Elevation API
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-yellow-900/30 border border-yellow-600/50 rounded-lg">
                <p className="text-yellow-200 text-sm">
                  <span className="font-bold">💡 Tip:</span> After adding the API key, refresh this page to load the
                  map.
                </p>
              </div>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2 mx-auto"
            >
              <span>🔄</span> Retry Loading Map
            </button>
          </div>
        </div>
      )}

      {!isLoaded && !error && (
        <div className="absolute inset-0 bg-black flex items-center justify-center z-50">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold mb-2">🌍 Loading Earth...</h2>
            <p className="text-gray-300">Preparing your 3D satellite experience</p>
          </div>
        </div>
      )}
    </div>
    </>
  )
}
