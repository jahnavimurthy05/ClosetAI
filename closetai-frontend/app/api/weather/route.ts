import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  const city = searchParams.get('city');

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Weather API not configured' },
      { status: 503 }
    );
  }

  try {
    let url = '';
    if (lat && lon) {
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    } else if (city) {
      url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
    } else {
      return NextResponse.json({ error: 'Location required' }, { status: 400 });
    }

    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch weather from provider' },
        { status: res.status }
      );
    }

    const data = await res.json();

    return NextResponse.json({
      temperature_c: Math.round(data.main?.temp ?? 0),
      feels_like_c: Math.round(data.main?.feels_like ?? 0),
      condition: data.weather?.[0]?.main ?? 'Unknown',
      description: data.weather?.[0]?.description ?? '',
      icon: data.weather?.[0]?.icon ?? '',
      humidity: data.main?.humidity ?? 0,
      wind_speed_kmh: Math.round((data.wind?.speed ?? 0) * 3.6),
      city: data.name ?? city ?? '',
      date: new Date().toISOString().split('T')[0],
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch weather' },
      { status: 500 }
    );
  }
}
