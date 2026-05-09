import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const getCurrentDateTimeTool = createTool({
  id: "get-current-datetime",
  description: "現在の日付・時刻・曜日を取得する",
  inputSchema: z.object({
    timezone: z
      .string()
      .optional()
      .default("Asia/Tokyo")
      .describe("タイムゾーン（例: Asia/Tokyo）"),
  }),
  outputSchema: z.object({
    datetime: z.string(),
    date: z.string(),
    time: z.string(),
    weekday: z.string(),
    timezone: z.string(),
  }),
  execute: async ({ timezone }) => {
    const tz = timezone ?? "Asia/Tokyo";
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("ja-JP", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      weekday: "long",
    });
    const parts = formatter.formatToParts(now);
    const get = (type: string) =>
      parts.find((p) => p.type === type)?.value ?? "";

    const date = `${get("year")}年${get("month")}月${get("day")}日`;
    const time = `${get("hour")}:${get("minute")}:${get("second")}`;
    const weekday = get("weekday");

    return {
      datetime: `${date} ${weekday} ${time}`,
      date,
      time,
      weekday,
      timezone: tz,
    };
  },
});

const WEATHER_CODES: Record<number, string> = {
  0: "快晴",
  1: "ほぼ晴れ",
  2: "一部曇り",
  3: "曇り",
  45: "霧",
  48: "霧氷",
  51: "霧雨（弱）",
  53: "霧雨",
  55: "霧雨（強）",
  61: "小雨",
  63: "雨",
  65: "大雨",
  71: "小雪",
  73: "雪",
  75: "大雪",
  80: "にわか雨（弱）",
  81: "にわか雨",
  82: "にわか雨（強）",
  95: "雷雨",
  99: "雷雨（ひょう）",
};

export const getWeatherTool = createTool({
  id: "get-weather",
  description: "指定した都市の現在の天気と7日間の予報を取得する",
  inputSchema: z.object({
    city: z.string().describe("都市名（例: 東京、大阪、札幌）"),
  }),
  outputSchema: z.object({
    city: z.string(),
    current: z.object({
      temperature: z.number(),
      feelsLike: z.number(),
      condition: z.string(),
      humidity: z.number(),
      windSpeed: z.number(),
    }),
    forecast: z.array(
      z.object({
        date: z.string(),
        weekday: z.string(),
        conditionDay: z.string(),
        tempMax: z.number(),
        tempMin: z.number(),
        precipitationProbability: z.number(),
      })
    ),
  }),
  execute: async ({ city }) => {
    // ジオコーディング
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=ja&format=json`
    );
    const geoData = await geoRes.json();
    if (!geoData.results?.length) {
      throw new Error(`都市「${city}」が見つからなかったのだ`);
    }
    const { latitude, longitude, name } = geoData.results[0];

    // 現在天気 + 7日間予報を一括取得
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
        `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
        `&timezone=Asia%2FTokyo&forecast_days=7`
    );
    const weatherData = await weatherRes.json();
    const c = weatherData.current;
    const d = weatherData.daily;

    const forecast = (d.time as string[]).map((dateStr: string, i: number) => {
      const dt = new Date(`${dateStr}T00:00:00+09:00`);
      return {
        date: dateStr,
        weekday: dt.toLocaleDateString("ja-JP", {
          weekday: "short",
          timeZone: "Asia/Tokyo",
        }),
        conditionDay: WEATHER_CODES[d.weather_code[i]] ?? "不明",
        tempMax: Math.round(d.temperature_2m_max[i]),
        tempMin: Math.round(d.temperature_2m_min[i]),
        precipitationProbability: d.precipitation_probability_max[i] ?? 0,
      };
    });

    return {
      city: name,
      current: {
        temperature: Math.round(c.temperature_2m),
        feelsLike: Math.round(c.apparent_temperature),
        condition: WEATHER_CODES[c.weather_code] ?? "不明",
        humidity: c.relative_humidity_2m,
        windSpeed: Math.round(c.wind_speed_10m),
      },
      forecast,
    };
  },
});

export const searchPlacesTool = createTool({
  id: "search-places",
  description:
    "Google Maps でお店・施設を検索し、評価・住所・口コミ・地図リンクを返す",
  inputSchema: z.object({
    query: z.string().describe("検索クエリ（例: 札幌 寿司 おすすめ）"),
    maxResults: z.number().optional().default(3),
  }),
  outputSchema: z.object({
    places: z.array(
      z.object({
        name: z.string(),
        address: z.string(),
        rating: z.number().optional(),
        reviewCount: z.number().optional(),
        reviews: z.array(z.string()),
        mapsUrl: z.string(),
        phoneNumber: z.string().optional(),
      })
    ),
  }),
  execute: async ({ query, maxResults }) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_MAPS_API_KEY が設定されていないのだ");
    }

    const res = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": [
            "places.displayName",
            "places.formattedAddress",
            "places.rating",
            "places.userRatingCount",
            "places.reviews",
            "places.googleMapsUri",
            "places.nationalPhoneNumber",
          ].join(","),
        },
        body: JSON.stringify({
          textQuery: query,
          pageSize: maxResults ?? 3,
          languageCode: "ja",
        }),
      }
    );

    if (!res.ok) {
      throw new Error(`Places API エラー: ${res.status}`);
    }

    const data = await res.json();
    const rawPlaces = (data.places ?? []) as Array<{
      displayName?: { text?: string };
      formattedAddress?: string;
      rating?: number;
      userRatingCount?: number;
      reviews?: Array<{ text?: { text?: string } }>;
      googleMapsUri?: string;
      nationalPhoneNumber?: string;
    }>;

    const places = rawPlaces.map((p) => ({
      name: p.displayName?.text ?? "不明",
      address: p.formattedAddress ?? "不明",
      rating: p.rating,
      reviewCount: p.userRatingCount,
      reviews: (p.reviews ?? [])
        .slice(0, 2)
        .map((r) => r.text?.text ?? "")
        .filter(Boolean),
      mapsUrl: p.googleMapsUri ?? "",
      phoneNumber: p.nationalPhoneNumber,
    }));

    return { places };
  },
});
