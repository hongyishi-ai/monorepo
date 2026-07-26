"use client";

import { useCallback, useEffect, useState } from "react";
import { calculateHeatIndexCelsius, getHeatIndexLabel } from "@/lib/heat-index";

type CurrentWeather = {
  main?: {
    humidity?: number;
    temp?: number;
  };
  name?: string;
  weather?: Array<{
    description?: string;
  }>;
};

type ReadyWeather = {
  condition: string;
  heatIndex: number;
  humidity: number;
  location: string;
  stale?: boolean;
  temperature: number;
};

type WeatherState =
  | { status: "idle" | "locating" | "loading" }
  | { status: "ready"; data: ReadyWeather }
  | { status: "error"; message: string };

const CACHE_KEY = "hys-home-local-weather";
const CACHE_TTL = 30 * 60 * 1000;
const POSITION_MAX_AGE = 10 * 60 * 1000;

function readCachedWeather() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const cached = JSON.parse(raw) as {
      timestamp?: number;
      data?: ReadyWeather;
    };
    if (!cached.timestamp || !cached.data) return null;

    return {
      data: cached.data,
      isFresh: Date.now() - cached.timestamp < CACHE_TTL,
    };
  } catch {
    return null;
  }
}

function cacheWeather(data: ReadyWeather) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ data, timestamp: Date.now() }),
    );
  } catch {
    // Weather remains usable when storage is unavailable.
  }
}

function buildWeatherUrl(latitude: number, longitude: number) {
  const url = new URL("/api/openweather", window.location.origin);
  url.searchParams.set("path", "/data/2.5/weather");
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("units", "metric");
  url.searchParams.set("lang", "zh_cn");
  return url.toString();
}

function normalizeWeather(data: CurrentWeather): ReadyWeather {
  const temperature = data.main?.temp;
  const humidity = data.main?.humidity;

  if (
    typeof temperature !== "number" ||
    typeof humidity !== "number" ||
    !Number.isFinite(temperature) ||
    !Number.isFinite(humidity)
  ) {
    throw new Error("天气数据不完整");
  }

  return {
    condition: data.weather?.[0]?.description?.trim() || "当前天气",
    heatIndex: calculateHeatIndexCelsius(temperature, humidity),
    humidity,
    location: data.name?.trim() || "当前位置",
    temperature,
  };
}

export function HomeWeatherWidget() {
  const [state, setState] = useState<WeatherState>({ status: "idle" });

  const loadWeather = useCallback(() => {
    if (!window.matchMedia("(max-width: 767px)").matches) return;

    const cached = readCachedWeather();
    if (cached?.isFresh) {
      setState({ status: "ready", data: cached.data });
      return;
    }

    if (!navigator.geolocation) {
      setState({ status: "error", message: "此设备无法定位" });
      return;
    }

    setState({ status: "locating" });
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        setState({ status: "loading" });

        try {
          const response = await fetch(
            buildWeatherUrl(coords.latitude, coords.longitude),
          );
          if (!response.ok) throw new Error(`天气接口返回 ${response.status}`);

          const data = normalizeWeather(
            (await response.json()) as CurrentWeather,
          );
          cacheWeather(data);
          setState({ status: "ready", data });
        } catch {
          if (cached?.data) {
            setState({
              status: "ready",
              data: { ...cached.data, stale: true },
            });
          } else {
            setState({ status: "error", message: "天气暂时不可用" });
          }
        }
      },
      (error) => {
        if (cached?.data) {
          setState({
            status: "ready",
            data: { ...cached.data, stale: true },
          });
          return;
        }

        setState({
          status: "error",
          message:
            error.code === error.PERMISSION_DENIED
              ? "开启位置权限后显示"
              : "暂时无法定位",
        });
      },
      {
        enableHighAccuracy: false,
        maximumAge: POSITION_MAX_AGE,
        timeout: 8000,
      },
    );
  }, []);

  useEffect(() => {
    loadWeather();
  }, [loadWeather]);

  return (
    <aside
      aria-label="当地天气和热指数"
      aria-live="polite"
      className="min-w-0 border-l-2 border-black pl-3 dark:border-white/25"
      data-home-weather
      data-home-weather-state={state.status}
    >
      <p className="font-mono text-[0.62rem] font-bold uppercase leading-4 text-neutral-500 dark:text-neutral-400">
        当地天气
      </p>

      {state.status === "ready" ? (
        <>
          <div className="mt-1 flex items-baseline justify-between gap-2">
            <strong className="font-mono text-2xl font-black leading-none text-[#12313c] dark:text-white">
              {state.data.temperature.toFixed(1)}°
            </strong>
            <span className="truncate text-xs font-bold text-neutral-600 dark:text-neutral-300">
              {state.data.condition}
            </span>
          </div>
          <p className="mt-2 text-xs font-black text-constructivism-red">
            热指数 {state.data.heatIndex.toFixed(1)}° ·{" "}
            {getHeatIndexLabel(state.data.heatIndex)}
          </p>
          <p className="mt-1 truncate font-mono text-[0.6rem] leading-4 text-neutral-500 dark:text-neutral-400">
            {state.data.location} · 湿度 {Math.round(state.data.humidity)}%
            {state.data.stale ? " · 缓存" : ""}
          </p>
          <a
            className="mt-1 inline-block font-mono text-[0.58rem] text-neutral-500 underline underline-offset-2 dark:text-neutral-400"
            href="https://openweathermap.org/"
            rel="noopener noreferrer"
            target="_blank"
          >
            数据：OpenWeather
          </a>
        </>
      ) : state.status === "error" ? (
        <>
          <p className="mt-2 text-xs font-bold leading-5 text-neutral-600 dark:text-neutral-300">
            {state.message}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[0.62rem] font-bold">
            <button
              className="min-h-7 text-constructivism-red underline underline-offset-2"
              onClick={loadWeather}
              type="button"
            >
              重试
            </button>
            <a
              className="min-h-7 text-neutral-600 underline underline-offset-2 dark:text-neutral-300"
              href="/heat-stroke/pages/heat-index"
            >
              手动查询
            </a>
          </div>
        </>
      ) : (
        <p className="mt-2 text-xs font-bold leading-5 text-neutral-600 dark:text-neutral-300">
          {state.status === "loading" ? "正在获取天气" : "正在定位"}
        </p>
      )}
    </aside>
  );
}
