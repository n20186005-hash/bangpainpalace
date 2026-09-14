export interface WeatherCurrent {
  temp: number;
  feelsLike: number;
  humidity: number;
  windKmh: number;
  conditionCode: number;
}

export interface WeatherDaily {
  date: string;
  tempMax: number;
  tempMin: number;
  sunrise: string;
  sunset: string;
  weatherCode: number;
  precipitationProbMax: number;
  precipitationSum: number;
  uvMax: number;
  windMaxKmh: number;
}

export interface WeatherResult {
  current: WeatherCurrent;
  daily: WeatherDaily[];
  retrievedAt: string;
}

// ========== 智能建议引擎 ==========
export type Lang = 'th' | 'en' | 'zh';

export interface SuggestionBucket {
  // 三大类标签分组建议 key（对应 i18n weather.advice.*）
  outfit: string[]; // 出行穿搭
  plan: string[];   // 游玩安排
  gear: string[];   // 随身物品
  // 风险预警（置顶红色，有则显示）
  warning: string | null;
  // 当前天气文字标签（如"晴"、"中雨"等，key → i18n weather.condition.*）
  conditionKey: string;
  icon: string;
}

// WMO 代码归约 → 邦巴因游客关心的 7 种场景
export function classifyCondition(code: number, precipMm: number): {
  kind: 'clear' | 'cloudy' | 'drizzle' | 'rain' | 'storm' | 'fog' | 'other';
  rainIntensity: 'none' | 'light' | 'medium' | 'heavy';
  thunder: boolean;
  fog: boolean;
  snow: boolean;
} {
  const thunder = code >= 95;
  const snow = (code >= 71 && code <= 86) || (code >= 36 && code <= 38);
  const fog = code >= 41 && code <= 49;
  let kind: SuggestionBucket['conditionKey'] extends string ? any : never;
  kind = 'other' as any;

  let intensity: 'none' | 'light' | 'medium' | 'heavy' = 'none';
  if (code <= 1) kind = 'clear';
  else if (code <= 3) kind = 'cloudy';
  else if (fog) kind = 'fog';
  else if (thunder) kind = 'storm';
  else if (code >= 61) {
    // 毛毛雨 / 降雨
    kind = 'rain';
    if (precipMm <= 0.5 || (code >= 45 && code <= 48)) intensity = 'light';
    else if (precipMm < 5 || code <= 64) intensity = 'medium';
    else intensity = 'heavy';
    if (code >= 51 && code <= 57) {
      intensity = 'light';
      kind = 'drizzle';
    }
  } else if (snow) kind = 'snow' as any;
  else kind = 'cloudy';

  return {
    kind: kind as any,
    rainIntensity: intensity,
    thunder,
    fog,
    snow,
  };
}

// km/h 风级（简化 Beaufort 对应）
export function windLevel(kmh: number): 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 {
  if (kmh < 1) return 0;
  if (kmh <= 5) return 1;
  if (kmh <= 11) return 2;
  if (kmh <= 19) return 3;
  if (kmh <= 28) return 4;
  if (kmh <= 38) return 5;
  if (kmh <= 49) return 6;
  return 7;
}

/**
 * 核心建议引擎：返回三大类 + 风险预警的 key 数组
 * 所有 key 对应三语 i18n 中 weather.advice / weather.warning / weather.condition 的文本
 * 这样文案可以翻译、引擎本身语言无关
 */
export function buildSuggestions(
  current: WeatherCurrent,
  daily0: WeatherDaily | undefined,
): SuggestionBucket {
  const outfit: string[] = [];
  const plan: string[] = [];
  const gear: string[] = [];
  let warning: string | null = null;

  const temp = current.temp;
  const tmax = daily0?.tempMax ?? temp;
  const tmin = daily0?.tempMin ?? temp;
  const delta = tmax - tmin;
  const wind = current.windKmh;
  const wLv = windLevel(wind);
  const wLvDaily = windLevel(daily0?.windMaxKmh ?? 0);
  const precipProb = daily0?.precipitationProbMax ?? 0;
  const precipMm = daily0?.precipitationSum ?? 0;
  const uv = daily0?.uvMax ?? 0;
  const humidity = current.humidity;

  const cc = classifyCondition(current.conditionCode, precipMm);
  const conditionKey: SuggestionBucket['conditionKey'] = (() => {
    if (cc.thunder) return 'storm';
    if (cc.fog) return 'fog';
    if (cc.kind === 'clear') return 'clear';
    if (cc.kind === 'cloudy') return 'cloudy';
    if (cc.kind === 'drizzle') return 'drizzle';
    if (cc.kind === 'storm') return 'storm';
    if (cc.rainIntensity === 'light') return 'light_rain';
    if (cc.rainIntensity === 'medium') return 'medium_rain';
    if (cc.rainIntensity === 'heavy') return 'heavy_rain';
    return 'cloudy';
  })();

  const icon = {
    clear: '☀️',
    cloudy: '☁️',
    drizzle: '🌦️',
    light_rain: '🌧️',
    medium_rain: '🌧️',
    heavy_rain: '🌧️',
    storm: '⛈️',
    fog: '🌫️',
  }[conditionKey] || '🌤️';

  const wMax = Math.max(wLv, wLvDaily);

  // ==== 预警（优先级最高，会置顶红色卡）====
  // 1. 雷雨
  if (cc.thunder || precipProb >= 85 && cc.rainIntensity === 'heavy') {
    warning = 'warn_thunder';
  }
  // 2. 中到大雨 + 大風
  else if (cc.rainIntensity === 'heavy' && wMax >= 6) {
    warning = 'warn_heavy_rain_wind';
  }
  // 3. 大雨单独
  else if (cc.rainIntensity === 'heavy') {
    warning = 'warn_heavy_rain';
  }
  // 4. 风 ≥ 7
  else if (wMax >= 7) {
    warning = 'warn_strong_wind';
  }
  // 5. 大雾
  else if (cc.fog) {
    warning = 'warn_fog';
  }
  // 6. 极高温（热带阈值）
  else if (tmax >= 38) {
    warning = 'warn_extreme_heat';
  }

  // ==== 降水概率 / 降雨强度 → 三大类 ====
  if (precipProb >= 60 && cc.rainIntensity === 'none' && !cc.thunder) {
    outfit.push('outfit_rain_probable');
    plan.push('plan_rain_probable');
    gear.push('gear_umbrella_or_raincoat');
  }

  if (cc.kind === 'drizzle' || cc.rainIntensity === 'light') {
    outfit.push('outfit_light_rain');
    plan.push('plan_light_rain');
    if (!gear.includes('gear_umbrella_or_raincoat')) gear.push('gear_foldable_umbrella');
  }

  if (cc.rainIntensity === 'medium' || cc.rainIntensity === 'heavy' || cc.thunder) {
    outfit.push('outfit_heavy_rain');
    plan.push('plan_heavy_rain');
    gear.push('gear_raincoat_no_long_umbrella');
  }

  // ==== 高温 & 紫外线 ====
  if (tmax >= 32) {
    outfit.push('outfit_hot');
    plan.push('plan_hot');
    gear.push('gear_sun_and_water');
  } else if (tmax >= 28) {
    outfit.push('outfit_warm');
    plan.push('plan_hot_mild');
    gear.push('gear_water');
  }

  if (uv >= 8) {
    outfit.push('outfit_uv_strong');
    gear.push('gear_full_sun_protection');
  } else if (uv >= 5) {
    if (!gear.includes('gear_sun_and_water')) gear.push('gear_sun_basic');
    outfit.push('outfit_uv_moderate');
  }

  // ==== 低温 & 温差 ====
  if (delta > 8) {
    outfit.push('outfit_large_delta');
    gear.push('gear_light_jacket');
  }

  if (tmax <= 10) {
    outfit.push('outfit_cold');
    gear.push('gear_winter');
  } else if (tmin < 20 && delta > 5) {
    outfit.push('outfit_cool_morning');
  }

  // ==== 风力 ====
  if (wMax === 5 || wMax === 6) {
    outfit.push('outfit_windy');
    plan.push('plan_windy_moderate');
  }
  if (wMax >= 7) {
    outfit.push('outfit_strong_wind');
    plan.push('plan_strong_wind');
  }

  // ==== 晴好 / 阴天 专属 ====
  if (conditionKey === 'clear' && cc.rainIntensity === 'none' && precipProb < 30) {
    plan.push('plan_clear');
    if (!gear.includes('gear_sun_basic') && !gear.includes('gear_sun_and_water') && uv < 5) {
      gear.push('gear_sun_basic');
    }
  }
  if (conditionKey === 'cloudy' && cc.rainIntensity === 'none' && !cc.fog) {
    plan.push('plan_cloudy');
  }

  // ==== 湿度提示（人话说"闷热"） ====
  if (humidity >= 80 && tmax >= 30) {
    outfit.push('outfit_humid_hot');
  }

  // 去重（简单数组 dedupe）
  const dedupe = <T,>(arr: T[]): T[] => Array.from(new Set(arr));

  return {
    outfit: dedupe(outfit),
    plan: dedupe(plan),
    gear: dedupe(gear),
    warning,
    conditionKey,
    icon,
  };
}

// ========== 天气数据获取 ==========
const CACHE_TTL_MS = 60 * 60 * 1000;
let cache: { value: WeatherResult; expire: number } | null = null;

const LAT = 14.2302;
const LON = 100.5751;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function fmtTime(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export async function fetchWeather(force = false): Promise<WeatherResult> {
  const now = Date.now();
  if (!force && cache && cache.expire > now) return cache.value;

  const q = new URLSearchParams({
    latitude: String(LAT),
    longitude: String(LON),
    current:
      'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
    daily:
      'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max',
    timezone: 'Asia/Bangkok',
    forecast_days: '7',
    wind_speed_unit: 'kmh',
    temperature_unit: 'celsius',
  });

  const url = `https://api.open-meteo.com/v1/forecast?${q.toString()}`;
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 3500);

  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const d = await res.json();

    const c = d.current;
    const daily = d.daily;

    const result: WeatherResult = {
      current: {
        temp: Math.round(c.temperature_2m),
        feelsLike: Math.round(c.apparent_temperature),
        humidity: Math.round(c.relative_humidity_2m),
        windKmh: Math.round(c.wind_speed_10m),
        conditionCode: Math.round(c.weather_code),
      },
      daily: (daily.time as string[]).map((_, i) => ({
        date: daily.time[i],
        tempMax: Math.round(daily.temperature_2m_max[i]),
        tempMin: Math.round(daily.temperature_2m_min[i]),
        sunrise: daily.sunrise[i],
        sunset: daily.sunset[i],
        weatherCode: Math.round(daily.weather_code[i]),
        precipitationProbMax: Math.round(daily.precipitation_probability_max[i] ?? 0),
        precipitationSum: Math.round((daily.precipitation_sum[i] ?? 0) * 10) / 10,
        uvMax: Math.round((daily.uv_index_max[i] ?? 0) * 10) / 10,
        windMaxKmh: Math.round(daily.wind_speed_10m_max[i] ?? 0),
      })),
      retrievedAt: new Date().toISOString(),
    };

    cache = { value: result, expire: now + CACHE_TTL_MS };
    return result;
  } catch (_err) {
    if (cache) return cache.value;
    throw _err;
  } finally {
    clearTimeout(timeout);
  }
}
