"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "@/hooks/use-translation"

interface PrayerTimesPopupProps {
  data: any
  selectedLang: string
  onShowSettings: () => void
  onShowInfo: () => void
}

export function PrayerTimesPopup({ data, selectedLang, onShowSettings, onShowInfo }: PrayerTimesPopupProps) {
  const { t } = useTranslation(selectedLang as "tr" | "en" | "ar" )
  const [currentTime, setCurrentTime] = useState("")

  useEffect(() => {
    const updateClock = () => {
      if (data.timeZoneId) {
        const now = new Date()
        const timeString = now.toLocaleTimeString(selectedLang === "ar" ? "ar-EG" : selectedLang, {
          timeZone: data.timeZoneId,
        })
        setCurrentTime(timeString)
      }
    }

    updateClock()
    const interval = setInterval(updateClock, 1000)
    return () => clearInterval(interval)
  }, [data.timeZoneId, selectedLang])

  const isAgreed = data.method === "agreed"

  return (
    <div className="bg-white border-[14px] border-gray-300 p-2.5 z-[2] min-w-[300px]">
      <h3
        className={`border-4 ${isAgreed ? "border-green-500" : "border-red-500"} text-black p-1 m-0.5 text-center text-sm font-bold`}
      >
        {t.popupTitle} ({isAgreed ? "Agreed" : "Astronomical"})
      </h3>

      <div className="text-xs mb-2">
        <p>
          <b>{t.latitude}:</b> <span className="text-blue-600">{data.location.lat.toFixed(5)}</span>
        </p>
        <p>
          <b>{t.longitude}:</b> <span className="text-blue-600">{data.location.lng.toFixed(5)}</span>
        </p>
        <p>
          <b>{t.date}:</b> <span className="text-blue-600">{data.date}</span>
        </p>
        <p>
          <b>🕒 {t.localTime}:</b> <span className="text-blue-600">{currentTime}</span>
        </p>
        <p>
          <b>📍 {t.Location}:</b> <span className="text-blue-600">{data.locationName}</span>
        </p>
      </div>

      <hr className="border-2 border-black my-2" />

      <div className="text-xs">
        <p>
          <b>{t.fajr}:</b> <span className="text-blue-600">{data.prayerTimes.fajr}</span>
        </p>
        <p>
          <b>{t.sunrise}:</b> <span className="text-blue-600">{data.prayerTimes.sunrise}</span>
        </p>
        <p>
          <b>{t.dhohr}:</b> <span className="text-blue-600">{data.prayerTimes.dhohr}</span>
        </p>
        <p>
          <b>{t.asr}:</b> <span className="text-blue-600">{data.prayerTimes.asr}</span>
        </p>
        <p>
          <b>{t.maghrib}:</b> <span className="text-blue-600">{data.prayerTimes.maghrib}</span>
        </p>
        <p>
          <b>{t.isha}:</b> <span className="text-blue-600">{data.prayerTimes.isha}</span>
        </p>
      </div>

      <div className="mt-2 space-y-1">
        <button onClick={onShowInfo} className="w-full bg-black text-white px-2 py-1 rounded text-xs cursor-pointer">
          <b>{t.infoButton}</b>
        </button>
        <button
          onClick={onShowSettings}
          className="w-full bg-red-800 text-white px-2 py-1 rounded text-xs cursor-pointer"
        >
          <b>{t.settingsButton}</b>
        </button>
      </div>
    </div>
  )
}
