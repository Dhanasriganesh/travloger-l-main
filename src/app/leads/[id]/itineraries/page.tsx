'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function LeadItinerariesPage() {
  const params = useParams()
  const leadId = (params?.id as string) || ''
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [itineraries, setItineraries] = useState<any[]>([])
  const [lead, setLead] = useState<any>(null)
  // For resolving fixed-plan IDs to labels
  const [fixedDaysOptions, setFixedDaysOptions] = useState<Array<{ id: string; days: number; label: string }>>([])
  const [fixedLocations, setFixedLocations] = useState<Array<{ id: string; name: string; city: string }>>([])
  const [fixedPlansByLocation, setFixedPlansByLocation] = useState<Record<string, Array<{ id: string; name: string }>>>({})
  // For resolving custom-plan details
  const [hotelLocations, setHotelLocations] = useState<Array<{ id: string; name: string; city: string }>>([])
  const [vehicleLocations, setVehicleLocations] = useState<Array<{ id: string; name: string; city: string }>>([])
  const [hotels, setHotels] = useState<Array<{ id: string; name: string; map_rate: number; eb: number; category: string; location_id: string }>>([])
  const [vehicles, setVehicles] = useState<Array<{ id: string; vehicle_type: string; rate: number; ac_extra: number; location_id: string }>>([])

  const toSlug = (value: string): string => (value || '').toString().trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  // Load lead and employee context, then fetch itineraries similar to dashboard
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)

        // Load lead details for header
        try {
          const lr = await fetch(`/api/leads/${leadId}`)
          const lj = await lr.json().catch(() => ({ lead: null }))
          if (lr.ok) setLead(lj.lead || null)
        } catch (_) {}

        // Get current employee destination via the same endpoint used on dashboard (by email is handled in dashboard).
        // Here, we simply load all itineraries; the packages API already supports city filtering via /api/packages/city/[city].
        const res = await fetch('/api/packages')
        const json = await res.json().catch(() => ({ packages: [] }))
        if (!res.ok) {
          setError(json.error || 'Failed to load itineraries')
        } else {
          setItineraries(json.packages || [])
        }
      } catch (e: any) {
        setError('Failed to load itineraries')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [leadId])

  // Load hotel/vehicle metadata used by custom plan cards
  useEffect(() => {
    const loadAssets = async () => {
      try {
        const [hotLocRes, vehLocRes] = await Promise.all([
          fetch('/api/locations/hotels'),
          fetch('/api/locations/vehicles')
        ])
        if (hotLocRes.ok) {
          const j = await hotLocRes.json(); setHotelLocations(j.locations || [])
        }
        if (vehLocRes.ok) {
          const j = await vehLocRes.json(); setVehicleLocations(j.locations || [])
        }
      } catch (_) {}

      try {
        const [hotRes, vehRes] = await Promise.all([
          fetch('/api/hotels'),
          fetch('/api/vehicles')
        ])
        if (hotRes.ok) {
          const j = await hotRes.json(); setHotels(j.hotels || [])
        }
        if (vehRes.ok) {
          const j = await vehRes.json(); setVehicles(j.vehicles || [])
        }
      } catch (_) {}
    }
    loadAssets()
  }, [])

  // Once itineraries are loaded, fetch fixed metadata for the page's city (derived from first itinerary route)
  useEffect(() => {
    const loadFixedMeta = async () => {
      if (!itineraries.length) return
      const firstCity = toSlug(itineraries.find((p: any) => p.route)?.route || itineraries[0]?.destination || '')
      if (!firstCity) return
      try {
        const [daysRes, locRes] = await Promise.all([
          fetch(`/api/fixed-days?city=${firstCity}`),
          fetch(`/api/locations/fixed?city=${firstCity}`)
        ])
        if (daysRes.ok) {
          const dj = await daysRes.json(); setFixedDaysOptions((dj.options || []).map((o: any) => ({ id: o.id, days: o.days, label: o.label || '' })))
        }
        if (locRes.ok) {
          const lj = await locRes.json(); setFixedLocations(lj.locations || [])
        }
      } catch (_) {}

      // Load plans for all fixed locations referenced
      const locIds = Array.from(new Set(
        itineraries.map((p: any) => p.fixed_location_id).filter((x: any) => typeof x === 'string' && x.length > 0)
      )) as string[]
      await Promise.all(locIds.map(async (locId) => {
        if (fixedPlansByLocation[locId]) return
        try {
          const firstCity2 = toSlug(itineraries.find((p: any) => p.fixed_location_id === locId)?.route || itineraries[0]?.route || itineraries[0]?.destination || '')
          if (!firstCity2) return
          const pr = await fetch(`/api/fixed-plans?city=${firstCity2}&locationId=${locId}`)
          if (pr.ok) {
            const pj = await pr.json()
            setFixedPlansByLocation(prev => ({ ...prev, [locId]: (pj.plans || []).map((p: any) => ({ id: p.id, name: p.name })) }))
          }
        } catch (_) {}
      }))
    }
    loadFixedMeta()
  }, [itineraries, fixedPlansByLocation])

  const assignedItineraryId: string | null = useMemo(() => {
    if (typeof window === 'undefined') return null
    try {
      const map = JSON.parse(localStorage.getItem('leadItineraryAssignments') || '{}')
      return map[leadId] || null
    } catch (_) {
      return null
    }
  }, [leadId])

  const assignItinerary = (itinerary: any) => {
    try {
      const map = JSON.parse(localStorage.getItem('leadItineraryAssignments') || '{}')
      map[leadId] = itinerary.id
      localStorage.setItem('leadItineraryAssignments', JSON.stringify(map))
      alert('Itinerary assigned!')
    } catch (e: any) {
      alert('Failed to assign itinerary')
    }
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Assign itinerary to {lead?.name ? lead.name : `Lead #${leadId}`}</h1>
            <p className="text-sm text-gray-600">{lead?.phone ? `Phone: ${lead.phone}` : lead?.email ? `Email: ${lead.email}` : ''}</p>
          </div>
          <Link href="/employee" className="text-sm text-primary hover:opacity-80">Back to Dashboard</Link>
        </div>
      </div>

      {loading && (
        <div className="text-sm text-gray-600">Loading itineraries...</div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-sm text-red-700 px-3 py-2 rounded">{error}</div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {itineraries.map((pkg: any) => {
            const isAssigned = assignedItineraryId === pkg.id
            return (
              <div key={pkg.id} className="group bg-white border border-gray-200 rounded-lg hover:shadow-md hover:border-primary transition-all duration-200 overflow-hidden">
                <div className="p-3">
                  <div className="mb-2">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-primary transition-colors line-clamp-2">{pkg.name}</h3>
                    <div className="flex items-center text-xs text-gray-600 mb-1">
                      <svg className="h-3 w-3 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="font-medium">{pkg.destination}</span>
                    </div>
                    {'route' in pkg && pkg.route && (
                      <div className="flex items-center text-xs text-gray-500">
                        <svg className="h-3 w-3 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{pkg.route}</span>
                      </div>
                    )}
                  </div>

                  {/* Details similar to dashboard (compact) */}
                  <div className="space-y-1.5 mb-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Plan</span>
                      <span className="font-medium text-gray-900">{pkg.plan_type || 'Custom'}</span>
                    </div>
                    {pkg.service_type && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Service</span>
                        <span className="font-medium text-gray-900">{pkg.service_type}</span>
                      </div>
                    )}
                    {/* Custom-plan fields */}
                    {pkg.hotel_location_id && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Hotel Location</span>
                        <span className="font-medium text-gray-900">{hotelLocations.find(l => l.id === pkg.hotel_location_id)?.name || pkg.hotel_location_id}</span>
                      </div>
                    )}
                    {pkg.selected_hotel_id && (() => {
                      const hotel = hotels.find(h => h.id === pkg.selected_hotel_id)
                      return hotel ? (
                        <>
                          <div className="flex items-center justify-between text-xs"><span className="text-gray-500">Hotel</span><span className="font-medium text-gray-900">{hotel.name}</span></div>
                          <div className="flex items-center justify-between text-xs"><span className="text-gray-500">Map Rate</span><span className="font-medium text-gray-900">₹{hotel.map_rate || 0}</span></div>
                          <div className="flex items-center justify-between text-xs"><span className="text-gray-500">EB</span><span className="font-medium text-gray-900">₹{hotel.eb || 0}</span></div>
                          <div className="flex items-center justify-between text-xs"><span className="text-gray-500">Category</span><span className="font-medium text-gray-900">{hotel.category || 'N/A'}</span></div>
                        </>
                      ) : null
                    })()}
                    {pkg.vehicle_location_id && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Vehicle Location</span>
                        <span className="font-medium text-gray-900">{vehicleLocations.find(l => l.id === pkg.vehicle_location_id)?.name || pkg.vehicle_location_id}</span>
                      </div>
                    )}
                    {pkg.selected_vehicle_id && (() => {
                      const vehicle = vehicles.find(v => v.id === pkg.selected_vehicle_id)
                      return vehicle ? (
                        <>
                          <div className="flex items-center justify-between text-xs"><span className="text-gray-500">Vehicle</span><span className="font-medium text-gray-900">{vehicle.vehicle_type}</span></div>
                          <div className="flex items-center justify-between text-xs"><span className="text-gray-500">Rate</span><span className="font-medium text-gray-900">₹{(vehicle as any).rate ?? 0}</span></div>
                          <div className="flex items-center justify-between text-xs"><span className="text-gray-500">AC Extra</span><span className="font-medium text-gray-900">₹{(vehicle as any).ac_extra ?? 0}</span></div>
                        </>
                      ) : null
                    })()}
                    {pkg.fixed_days_id && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Fixed Days</span>
                        <span className="font-medium text-gray-900">{fixedDaysOptions.find(d => d.id === pkg.fixed_days_id)?.days || '-'}</span>
                      </div>
                    )}
                    {pkg.fixed_location_id && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Fixed Location</span>
                        <span className="font-medium text-gray-900">{fixedLocations.find(l => l.id === pkg.fixed_location_id)?.name || pkg.fixed_location_id}</span>
                      </div>
                    )}
                    {pkg.fixed_plan_id && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Fixed Plan</span>
                        <span className="font-medium text-gray-900">{fixedPlansByLocation[pkg.fixed_location_id || '']?.find(p => p.id === pkg.fixed_plan_id)?.name || pkg.fixed_plan_id}</span>
                      </div>
                    )}
                    {!!(pkg.fixed_adults ?? 0) && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Adults</span>
                        <span className="font-medium text-gray-900">{pkg.fixed_adults}</span>
                      </div>
                    )}
                    {!!(pkg.fixed_price_per_person ?? 0) && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Price/Person</span>
                        <span className="font-medium text-gray-900">₹{pkg.fixed_price_per_person}</span>
                      </div>
                    )}
                    {pkg.fixed_rooms_vehicle && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Rooms & Vehicle</span>
                        <span className="font-medium text-gray-900">{pkg.fixed_rooms_vehicle}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => assignItinerary(pkg)}
                    className={`w-full mt-2 py-1.5 text-xs rounded-md ${isAssigned ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-primary/10 text-primary hover:bg-primary/20'} transition-colors`}
                  >
                    {isAssigned ? 'Assigned' : 'Assign this itinerary'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}


