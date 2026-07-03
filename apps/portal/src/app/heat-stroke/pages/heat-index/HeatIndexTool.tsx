"use client";

import { useEffect, useMemo, useState } from "react";

type WeatherCondition = {
  description?: string;
  icon?: string;
};

type CurrentWeatherResponse = {
  main?: {
    temp?: number;
    humidity?: number;
  };
  weather?: WeatherCondition[];
  wind?: {
    speed?: number;
  };
};

type ForecastItem = {
  dt: number;
  main: {
    temp: number;
    humidity: number;
  };
};

type GeoLocation = {
  name: string;
  state?: string;
  country: string;
  lat: number;
  lon: number;
};

type WeatherState =
  | { status: "loading"; message: string }
  | { status: "ready"; data: CurrentWeatherResponse; heatIndex: number }
  | { status: "error"; message: string };

type ChecklistItem = {
  id: string;
  title: string;
  detail: string;
};

const API_BASE = "/api/openweather";
const REQUEST_TIMEOUT = 12000;
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_PREFIX = "hs-weather-cache:";
const FALLBACK_CITY = "北京";

const checklistItems: ChecklistItem[] = [
  {
    id: "check-1",
    title: "是否经历过完整热习服？",
    detail:
      "通过反复热刺激，使人体出现适应性反应，提高机体对热的耐受能力。热习服训练一般需要10～14天",
  },
  {
    id: "check-2",
    title: "确认无带病参训",
    detail: "生病时身体抵抗力下降，在炎热天气下训练容易发生中暑",
  },
  {
    id: "check-3",
    title: "是否在训练间隙的降温？",
    detail:
      "训练前和训练间隙可通过冷水喷雾、戴冰帽和冷颈圈、用湿毛巾和冰袋冰敷等方式降温",
  },
  {
    id: "check-4",
    title: "补水补盐是否充分？",
    detail: "建议每小时补充含盐饮品0.5～1升，每天补水6～8升",
  },
  {
    id: "check-5",
    title: '防暑监测"三宝"是否备齐？',
    detail: "温湿度计、耳温监测仪、指脉氧检测仪，用来监测环境温湿度和生命体征",
  },
  {
    id: "check-6",
    title: "降温设备是否齐备？",
    detail:
      "准备热射病救援浴盆担架组合、贮水槽、医用冰帽、冰颈圈、冰毯等降温设备",
  },
  {
    id: "check-7",
    title: "睡眠是否充足？",
    detail: "充足的睡眠可以使大脑和身体得到充分放松，有助于恢复体力",
  },
  {
    id: "check-8",
    title: "是否有需要重点关注的人？",
    detail:
      "新训人员、长期不锻炼人员、未进行热习服训练人员等热耐受能力较差的人群需特别关注",
  },
];

function buildApiUrl(path: string, params: Record<string, string | number>) {
  const url = new URL(API_BASE, window.location.origin);
  url.searchParams.set("path", path);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  return url.toString();
}

async function fetchJson<T>(url: string, contextLabel: string): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`${contextLabel}失败 (${response.status})`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`${contextLabel}超时`);
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function buildCacheKey(namespace: string, key: string) {
  return `${CACHE_PREFIX}${namespace}:${key}`;
}

function readCache<T>(cacheKey: string): { timestamp: number; data: T } | null {
  try {
    const raw = localStorage.getItem(cacheKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { timestamp?: number; data?: T };
    if (!parsed?.timestamp || !parsed.data) return null;
    return parsed as { timestamp: number; data: T };
  } catch (error) {
    console.warn("读取缓存失败", error);
    return null;
  }
}

function writeCache<T>(cacheKey: string, data: T) {
  try {
    localStorage.setItem(
      cacheKey,
      JSON.stringify({ timestamp: Date.now(), data }),
    );
  } catch (error) {
    console.warn("写入缓存失败", error);
  }
}

async function fetchJsonWithCache<T>(
  url: string,
  cacheKey: string,
  contextLabel: string,
): Promise<T> {
  const cached = readCache<T>(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const data = await fetchJson<T>(url, contextLabel);
    writeCache(cacheKey, data);
    return data;
  } catch (error) {
    if (cached) {
      console.warn(`${contextLabel}失败，使用缓存数据`, error);
      return cached.data;
    }
    throw error;
  }
}

function calculateHeatIndex(temperature: number, humidity: number) {
  const tempF = temperature * (9 / 5) + 32;
  let heatIndexF =
    -42.379 +
    2.04901523 * tempF +
    10.14333127 * humidity -
    0.22475541 * tempF * humidity -
    0.00683783 * tempF * tempF -
    0.05481717 * humidity * humidity +
    0.00122874 * tempF * tempF * humidity +
    0.00085282 * tempF * humidity * humidity -
    0.00000199 * tempF * tempF * humidity * humidity;

  if (tempF < 80) {
    heatIndexF =
      0.5 * (tempF + 61.0 + (tempF - 68.0) * 1.2 + humidity * 0.094);
  }

  return (heatIndexF - 32) * (5 / 9);
}

function getHeatLevel(heatIndex: number) {
  if (heatIndex < 27) {
    return {
      label: "舒适",
      alert: "当前热指数处于舒适范围",
      tone:
        "border-slate-300 bg-slate-100 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100",
      tips: [
        "当前热指数处于舒适范围，适合正常活动",
        "保持正常的水分摄入",
        "可以正常进行户外活动",
      ],
    };
  }

  if (heatIndex < 32) {
    return {
      label: "注意",
      alert: "注意：可能感到轻微不适",
      tone:
        "border-yellow-400 bg-yellow-100 text-yellow-950 dark:border-yellow-500 dark:bg-yellow-950 dark:text-yellow-100",
      tips: [
        "对于敏感人群可能感到不适",
        "进行剧烈活动时注意休息",
        "保持适当的水分摄入",
        "尽量避免长时间暴露在阳光下",
      ],
    };
  }

  if (heatIndex < 41) {
    return {
      label: "警惕",
      alert: "警惕：可能导致热痉挛和热疲劳",
      tone:
        "border-orange-500 bg-orange-100 text-orange-950 dark:border-orange-400 dark:bg-orange-950 dark:text-orange-100",
      tips: [
        "注意可能出现热痉挛和热疲劳",
        "减少户外活动时间，特别是在阳光直射时",
        "增加水分摄入，每小时至少喝一杯水",
        "穿着轻便、浅色、宽松的衣物",
        "注意观察身体不适症状",
      ],
    };
  }

  if (heatIndex < 54) {
    return {
      label: "危险",
      alert: "危险：可能导致热疲劳，长时间暴露可能导致中暑",
      tone:
        "border-red-500 bg-red-100 text-red-950 dark:border-red-400 dark:bg-red-950 dark:text-red-100",
      tips: [
        "危险！可能导致热疲劳",
        "避免户外活动，尤其是剧烈运动",
        "待在阴凉处或有空调的环境中",
        "大量补充水分和电解质",
        "密切关注老人、儿童和有慢性病的人",
        "如出现头晕、恶心、皮肤发热但不出汗等症状，立即就医",
      ],
    };
  }

  return {
    label: "极度危险",
    alert: "极度危险：可能导致热射病/中暑",
    tone:
      "border-red-700 bg-red-700 text-white dark:border-red-300 dark:bg-red-900 dark:text-red-100",
    tips: [
      "极度危险！可能导致热射病",
      "取消所有户外活动",
      "待在有空调的环境中",
      "如必须外出，限制在短时间内并避免剧烈活动",
      "密切关注自己和他人的健康状况",
      "如出现高热、意识模糊、皮肤干热症状，立即就医",
    ],
  };
}

function formatLocation(location: GeoLocation) {
  return `${location.name}${location.state ? `, ${location.state}` : ""}, ${
    location.country
  }`;
}

function isValidCurrentWeather(data: CurrentWeatherResponse) {
  return (
    typeof data.main?.temp === "number" &&
    typeof data.main.humidity === "number" &&
    Array.isArray(data.weather) &&
    Boolean(data.weather[0])
  );
}

function TrendChart({ forecast }: { forecast: ForecastItem[] }) {
  const chartData = useMemo(
    () =>
      forecast.slice(0, 8).map((item) => {
        const date = new Date(item.dt * 1000);
        return {
          label: `${date.getHours()}:00`,
          temp: item.main.temp,
          humidity: item.main.humidity,
          heatIndex: calculateHeatIndex(item.main.temp, item.main.humidity),
        };
      }),
    [forecast],
  );

  if (chartData.length === 0) {
    return (
      <div
        className="grid min-h-[18rem] place-items-center border-2 border-dashed border-border bg-muted/40 p-6 text-center text-sm font-bold text-muted-foreground"
        id="heat-index-chart"
      >
        小时级预报暂不可用
      </div>
    );
  }

  const width = 720;
  const height = 280;
  const padding = { top: 24, right: 28, bottom: 44, left: 44 };
  const yMin = Math.min(20, ...chartData.map((item) => item.heatIndex)) - 2;
  const yMax = Math.max(56, ...chartData.map((item) => item.heatIndex)) + 2;
  const xStep =
    (width - padding.left - padding.right) / Math.max(chartData.length - 1, 1);
  const y = (value: number) =>
    padding.top +
    ((yMax - value) / (yMax - yMin)) *
      (height - padding.top - padding.bottom);
  const x = (index: number) => padding.left + index * xStep;
  const heatPoints = chartData
    .map((item, index) => `${x(index)},${y(item.heatIndex)}`)
    .join(" ");
  const tempPoints = chartData
    .map((item, index) => `${x(index)},${y(item.temp)}`)
    .join(" ");

  return (
    <div
      className="min-w-0 overflow-hidden border-2 border-border bg-card shadow-[6px_6px_0_rgba(18,49,60,0.14)] dark:shadow-[6px_6px_0_rgba(217,48,37,0.18)]"
      id="heat-index-chart"
    >
      <svg
        aria-label="未来24小时热指数趋势图"
        className="h-72 w-full text-foreground"
        role="img"
        viewBox={`0 0 ${width} ${height}`}
      >
        {[27, 32, 41, 54].map((value) => (
          <line
            className="stroke-border"
            key={value}
            strokeDasharray="6 6"
            x1={padding.left}
            x2={width - padding.right}
            y1={y(value)}
            y2={y(value)}
          />
        ))}
        <polyline
          fill="none"
          points={tempPoints}
          stroke="hsl(var(--muted-foreground))"
          strokeDasharray="8 8"
          strokeWidth="3"
        />
        <polyline
          fill="none"
          points={heatPoints}
          stroke="hsl(var(--primary))"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="5"
        />
        {chartData.map((item, index) => (
          <g key={`${item.label}-${index}`}>
            <circle
              cx={x(index)}
              cy={y(item.heatIndex)}
              fill="hsl(var(--primary))"
              r="5"
            />
            <text
              className="fill-muted-foreground font-mono text-[13px] font-black"
              textAnchor="middle"
              x={x(index)}
              y={height - 18}
            >
              {item.label}
            </text>
          </g>
        ))}
        <text
          className="fill-muted-foreground font-mono text-[13px] font-black"
          x={padding.left}
          y="18"
        >
          热指数 (°C)
        </text>
        <text
          className="fill-primary font-mono text-[13px] font-black"
          x={width - 160}
          y="18"
        >
          热指数
        </text>
        <text
          className="fill-muted-foreground font-mono text-[13px] font-black"
          x={width - 88}
          y="18"
        >
          温度
        </text>
      </svg>
    </div>
  );
}

export function HeatIndexTool() {
  const [locationLabel, setLocationLabel] = useState("正在获取位置...");
  const [cityInput, setCityInput] = useState("");
  const [weatherState, setWeatherState] = useState<WeatherState>({
    status: "loading",
    message: "正在加载...",
  });
  const [forecast, setForecast] = useState<ForecastItem[]>([]);
  const [manualTemp, setManualTemp] = useState("");
  const [manualHumidity, setManualHumidity] = useState("");
  const [manualError, setManualError] = useState("");
  const [manualResult, setManualResult] = useState<number | null>(null);
  const [fallbackNotice, setFallbackNotice] = useState("");
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const savedState = localStorage.getItem("preventionChecklist");
      if (savedState) {
        setCheckedItems(JSON.parse(savedState) as Record<string, boolean>);
      }
    } catch (error) {
      console.error("加载检查清单状态失败:", error);
    }

    void fetchWeatherByCity(FALLBACK_CITY, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("preventionChecklist", JSON.stringify(checkedItems));
    } catch (error) {
      console.warn("保存检查清单状态失败", error);
    }
  }, [checkedItems]);

  const activeHeatIndex =
    manualResult ?? (weatherState.status === "ready" ? weatherState.heatIndex : null);
  const activeLevel = activeHeatIndex !== null ? getHeatLevel(activeHeatIndex) : null;
  const checkedCount = checklistItems.filter((item) => checkedItems[item.id]).length;
  const allChecked = checkedCount === checklistItems.length;

  async function fetchWeatherByCity(cityName: string, isFallback = false) {
    setWeatherState({
      status: "loading",
      message: `正在搜索 "${cityName}" 的天气数据...`,
    });
    setLocationLabel(`正在搜索 "${cityName}" 的天气数据...`);
    setFallbackNotice("");

    try {
      const locations = await fetchJsonWithCache<GeoLocation[]>(
        buildApiUrl("/geo/1.0/direct", { q: cityName, limit: 1 }),
        buildCacheKey("direct", cityName.toLowerCase()),
        "搜索位置",
      );

      if (!Array.isArray(locations) || locations.length === 0) {
        setLocationLabel("未找到该位置");
        setWeatherState({
          status: "error",
          message: "无法找到该位置的天气数据，请检查输入并重试",
        });
        return;
      }

      const location = locations[0];
      setLocationLabel(
        `${isFallback ? "默认城市" : "查询位置"}: ${formatLocation(location)}`,
      );
      await fetchWeatherData(location.lat, location.lon);
    } catch (error) {
      console.error("搜索位置失败:", error);
      showManualFallback(isFallback ? "默认城市天气数据暂不可用" : "搜索位置失败");
    }
  }

  async function fetchWeatherData(latitude: number, longitude: number) {
    await Promise.all([
      fetchCurrentWeather(latitude, longitude),
      fetchHourlyForecast(latitude, longitude),
    ]);
  }

  async function fetchCurrentWeather(latitude: number, longitude: number) {
    try {
      const data = await fetchJsonWithCache<CurrentWeatherResponse>(
        buildApiUrl("/data/2.5/weather", {
          lat: latitude,
          lon: longitude,
          units: "metric",
          lang: "zh_cn",
        }),
        buildCacheKey("current", `${latitude.toFixed(2)},${longitude.toFixed(2)}`),
        "获取当前天气数据",
      );

      if (!isValidCurrentWeather(data)) {
        throw new Error("天气数据不完整");
      }

      const heatIndex = calculateHeatIndex(data.main!.temp!, data.main!.humidity!);
      setWeatherState({ status: "ready", data, heatIndex });
    } catch (error) {
      console.error("获取当前天气数据失败:", error);
      showManualFallback("自动天气数据暂不可用");
    }
  }

  async function fetchHourlyForecast(latitude: number, longitude: number) {
    try {
      const data = await fetchJsonWithCache<{ list?: ForecastItem[] }>(
        buildApiUrl("/data/2.5/forecast", {
          lat: latitude,
          lon: longitude,
          units: "metric",
          lang: "zh_cn",
        }),
        buildCacheKey("forecast", `${latitude.toFixed(2)},${longitude.toFixed(2)}`),
        "获取小时预报数据",
      );
      setForecast(Array.isArray(data.list) ? data.list.slice(0, 8) : []);
    } catch (error) {
      console.error("获取小时预报数据失败:", error);
      setForecast([]);
    }
  }

  function showManualFallback(message: string) {
    setWeatherState({
      status: "error",
      message: `${message}。请使用下方手动计算热指数。`,
    });
    setFallbackNotice(`${message}。请输入现场温度和湿度，仍可立即计算热指数。`);
  }

  function handleSearch() {
    const nextCity = cityInput.trim();
    if (!nextCity) {
      setManualError("请输入城市名称");
      return;
    }

    setManualError("");
    void fetchWeatherByCity(nextCity);
  }

  function handleRefresh() {
    void fetchWeatherByCity(cityInput.trim() || FALLBACK_CITY, !cityInput.trim());
  }

  function handleManualCalculate() {
    const temperature = Number.parseFloat(manualTemp);
    const humidity = Number.parseFloat(manualHumidity);

    if (Number.isNaN(temperature) || Number.isNaN(humidity)) {
      setManualError("请输入有效的温度和湿度值");
      return;
    }

    if (temperature < 0 || temperature > 50) {
      setManualError("温度应在0-50°C范围内");
      return;
    }

    if (humidity < 0 || humidity > 100) {
      setManualError("湿度应在0-100%范围内");
      return;
    }

    setManualError("");
    setManualResult(calculateHeatIndex(temperature, humidity));
  }

  function resetChecklist() {
    localStorage.removeItem("preventionChecklist");
    setCheckedItems({});
  }

  return (
    <section className="bg-background py-8 md:py-12">
      <div className="mx-auto grid w-[min(1200px,calc(100%_-_32px))] grid-cols-1 gap-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.4fr_0.8fr]">
          <div className="min-w-0 border-2 border-border bg-card p-5 shadow-[6px_6px_0_rgba(18,49,60,0.14)] dark:shadow-[6px_6px_0_rgba(217,48,37,0.18)]">
            <p
              className="font-mono text-sm font-black text-muted-foreground"
              id="location-display"
            >
              {locationLabel}
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto]">
              <input
                className="min-h-12 min-w-0 border-2 border-border bg-background px-3 text-base font-bold text-foreground outline-none focus:ring-2 focus:ring-primary"
                id="location-input"
                onChange={(event) => setCityInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleSearch();
                }}
                placeholder="输入城市，例如：北京"
                type="text"
                value={cityInput}
              />
              <button
                className="min-h-12 border-2 border-primary bg-primary px-5 font-black text-primary-foreground"
                id="search-btn"
                onClick={handleSearch}
                type="button"
              >
                搜索
              </button>
              <button
                className="min-h-12 border-2 border-border bg-muted px-5 font-black text-foreground"
                id="refresh-btn"
                onClick={handleRefresh}
                type="button"
              >
                刷新
              </button>
            </div>
            {fallbackNotice ? (
              <p
                className="mt-4 border-l-4 border-primary bg-muted p-3 text-sm font-bold text-foreground"
                id="manual-fallback-notice"
              >
                {fallbackNotice}
              </p>
            ) : null}
          </div>

          <div className="min-w-0 border-2 border-border bg-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs font-black uppercase text-muted-foreground">
                  NOW
                </p>
                <h2 className="mt-1 text-2xl font-black text-primary">
                  当前天气
                </h2>
              </div>
              {weatherState.status === "ready" &&
              weatherState.data.weather?.[0]?.icon ? (
                <img
                  alt="天气图标"
                  className="h-14 w-14"
                  id="weather-icon"
                  src={`https://openweathermap.org/img/wn/${weatherState.data.weather[0].icon}@2x.png`}
                />
              ) : null}
            </div>

            {weatherState.status === "loading" ? (
              <p
                className="mt-5 text-sm font-bold text-muted-foreground"
                id="loading"
              >
                {weatherState.message}
              </p>
            ) : null}

            {weatherState.status === "error" ? (
              <p
                className="mt-5 text-sm font-bold text-muted-foreground"
                id="loading"
              >
                {weatherState.message}
              </p>
            ) : null}

            {weatherState.status === "ready" ? (
              <div className="mt-5 grid gap-4" id="weather-info">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p
                      className="text-sm font-bold text-muted-foreground"
                      id="weather-description"
                    >
                      {weatherState.data.weather?.[0]?.description ?? ""}
                    </p>
                    <p className="mt-2 font-mono text-4xl font-black text-foreground">
                      <span id="temperature">
                        {weatherState.data.main!.temp!.toFixed(1)}°C
                      </span>
                    </p>
                  </div>
                  <div className="text-right text-sm font-bold text-muted-foreground">
                    <p>
                      湿度{" "}
                      <span className="text-foreground" id="humidity">
                        {weatherState.data.main!.humidity}%
                      </span>
                    </p>
                    <p>
                      风速{" "}
                      <span className="text-foreground" id="wind-speed">
                        {typeof weatherState.data.wind?.speed === "number"
                          ? `${weatherState.data.wind.speed} m/s`
                          : "-- m/s"}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="border-2 border-border bg-background p-4 text-center">
                  <p className="text-sm font-black text-muted-foreground">
                    热指数 HI
                  </p>
                  <p className="mt-1 font-mono text-4xl font-black text-primary">
                    <span id="heat-index">
                      {weatherState.heatIndex.toFixed(1)}°C
                    </span>
                  </p>
                </div>
                <p
                  className={`border-2 p-3 text-sm font-black ${getHeatLevel(
                    weatherState.heatIndex,
                  ).tone}`}
                  id="heat-index-alert"
                >
                  {getHeatLevel(weatherState.heatIndex).alert}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="min-w-0 border-2 border-border bg-card p-5">
            <p className="font-mono text-xs font-black uppercase text-muted-foreground">
              Manual
            </p>
            <h2 className="mt-1 text-2xl font-black text-primary">
              手动计算热指数
            </h2>
            <p className="mt-2 text-sm font-bold leading-6 text-muted-foreground">
              自备温湿度计更准确。天气接口不可用时，仍可输入现场温度和湿度立即计算。
            </p>
            <div className="mt-5 grid min-w-0 grid-cols-2 gap-3">
              <label className="grid gap-2 text-sm font-black text-muted-foreground">
                温度 (°C)
                <input
                  className="min-h-12 min-w-0 border-2 border-border bg-background px-3 text-base font-bold text-foreground outline-none focus:ring-2 focus:ring-primary"
                  id="manual-temp"
                  max={50}
                  min={0}
                  onChange={(event) => setManualTemp(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      document.getElementById("manual-humidity")?.focus();
                    }
                  }}
                  placeholder="例如：32"
                  step={0.1}
                  type="number"
                  value={manualTemp}
                />
              </label>
              <label className="grid gap-2 text-sm font-black text-muted-foreground">
                湿度 (%)
                <input
                  className="min-h-12 min-w-0 border-2 border-border bg-background px-3 text-base font-bold text-foreground outline-none focus:ring-2 focus:ring-primary"
                  id="manual-humidity"
                  max={100}
                  min={0}
                  onChange={(event) => setManualHumidity(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleManualCalculate();
                  }}
                  placeholder="例如：70"
                  step={1}
                  type="number"
                  value={manualHumidity}
                />
              </label>
              <button
                className="col-span-2 min-h-12 border-2 border-primary bg-primary px-5 font-black text-primary-foreground"
                id="calculate-hi-btn"
                onClick={handleManualCalculate}
                type="button"
              >
                计算热指数
              </button>
            </div>
            {manualError ? (
              <p className="mt-3 border-2 border-red-500 bg-red-50 p-3 text-sm font-black text-red-950 dark:bg-red-950 dark:text-red-100">
                {manualError}
              </p>
            ) : null}
            {manualResult !== null ? (
              <div
                className="mt-5 border-2 border-border bg-background p-4"
                id="manual-result"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-sm font-black text-muted-foreground">
                      计算结果：
                    </span>
                    <span
                      className="ml-2 font-mono text-3xl font-black text-primary"
                      id="manual-hi-value"
                    >
                      {manualResult.toFixed(1)}°C
                    </span>
                  </div>
                  <div
                    className={`border-2 px-4 py-1 text-sm font-black ${getHeatLevel(
                      manualResult,
                    ).tone}`}
                    id="manual-hi-level"
                  >
                    {getHeatLevel(manualResult).label}
                  </div>
                </div>
                <div
                  className="mt-3 grid gap-1 text-sm font-bold text-muted-foreground"
                  id="manual-hi-tips"
                >
                  {getHeatLevel(manualResult).tips.map((tip) => (
                    <p key={tip}>• {tip}</p>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="min-w-0 border-2 border-border bg-muted/25 p-5">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="font-mono text-xs font-black uppercase text-muted-foreground">
                  Forecast
                </p>
                <h2 className="mt-1 text-2xl font-black text-primary">
                  24小时预测
                </h2>
              </div>
              <p className="max-w-[12rem] text-right text-xs font-bold leading-5 text-muted-foreground">
                橙线为热指数，虚线为温度
              </p>
            </div>
            <TrendChart forecast={forecast} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <aside className="min-w-0 border-2 border-border bg-card p-5">
            <p className="font-mono text-xs font-black uppercase text-muted-foreground">
              Tips
            </p>
            <h3 className="mt-1 text-2xl font-black text-primary">健康提示</h3>
            <ul
              className="mt-4 grid gap-2 text-sm font-bold leading-6 text-muted-foreground"
              id="health-tips-list"
            >
              {activeLevel ? (
                activeLevel.tips.map((tip) => <li key={tip}>• {tip}</li>)
              ) : (
                <li>请等待热指数计算完成后查看相应健康建议</li>
              )}
            </ul>
          </aside>

          <section
            className="min-w-0 border-2 border-border bg-card p-5"
            aria-labelledby="checklist-heading"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-xs font-black uppercase text-muted-foreground">
                  Checklist
                </p>
                <h3
                  className="mt-1 text-2xl font-black text-primary"
                  id="checklist-heading"
                >
                  8项预防措施
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="font-mono text-2xl font-black text-foreground"
                  id="checklist-count"
                >
                  {checkedCount}/8
                </span>
                <button
                  className="border-2 border-border bg-muted px-3 py-2 text-sm font-black text-foreground"
                  id="reset-checklist"
                  onClick={resetChecklist}
                  type="button"
                >
                  重置
                </button>
              </div>
            </div>

            <ul className="mt-5 grid gap-3" id="prevention-checklist">
              {checklistItems.map((item) => {
                const checked = Boolean(checkedItems[item.id]);

                return (
                  <li
                    className={`border-2 p-4 transition-colors ${
                      checked
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background"
                    }`}
                    key={item.id}
                  >
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        checked={checked}
                        className="mt-1 h-6 w-6 accent-[hsl(var(--primary))]"
                        id={item.id}
                        onChange={(event) =>
                          setCheckedItems((current) => ({
                            ...current,
                            [item.id]: event.target.checked,
                          }))
                        }
                        type="checkbox"
                      />
                      <span>
                        <span className="block text-lg font-black text-foreground">
                          {item.title}
                        </span>
                        <span className="mt-1 block text-sm font-bold leading-6 text-muted-foreground">
                          {item.detail}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>

            {checkedCount > 0 ? (
              <div
                className={`mt-5 border-2 p-4 ${
                  allChecked
                    ? "border-green-500 bg-green-50 text-green-950 dark:bg-green-950 dark:text-green-100"
                    : "border-primary bg-primary/10 text-foreground"
                }`}
                id="checklist-summary"
              >
                <h4 className="text-lg font-black">
                  {allChecked ? "预防措施已全部到位" : "预防措施未全部到位"}
                </h4>
                <p className="mt-1 text-sm font-bold leading-6">
                  {allChecked
                    ? "您已完成所有热射病预防检查项目，降低了热射病发生风险。"
                    : "请确保所有预防措施到位，以降低发生热射病的风险。"}
                </p>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </section>
  );
}
