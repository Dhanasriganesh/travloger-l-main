import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

// Simple in-memory storage for testing hotels
let testHotels = []

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId')

    let filteredHotels = testHotels
    if (locationId) {
      filteredHotels = testHotels.filter(hotel => hotel.location_id === locationId)
    }

    return NextResponse.json({ hotels: filteredHotels })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { name, mapRate, eb, category, locationId } = await request.json()

    if (!name || !locationId) {
      return NextResponse.json({ error: 'Name and locationId are required' }, { status: 400 })
    }

    const newHotel = {
      id: randomUUID(),
      name: name.trim(),
      map_rate: mapRate || 0,
      eb: eb || 0,
      category: category.trim() || '',
      location_id: locationId,
      created_at: new Date().toISOString()
    }

    testHotels.push(newHotel)

    return NextResponse.json({ hotel: newHotel }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

