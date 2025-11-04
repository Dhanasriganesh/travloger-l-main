import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

// Simple in-memory storage for testing
let testLocations = []

export async function GET() {
  try {
    return NextResponse.json({ locations: testLocations })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { name, city, type } = await request.json()

    if (!name || !city) {
      return NextResponse.json({ error: 'Name and city are required' }, { status: 400 })
    }

    const newLocation = {
      id: randomUUID(), // Generate proper UUID
      name: name.trim(),
      city: city.trim(),
      type: type || 'hotel',
      created_at: new Date().toISOString()
    }

    testLocations.push(newLocation)

    return NextResponse.json({ location: newLocation }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
