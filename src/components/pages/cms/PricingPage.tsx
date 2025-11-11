import React, { useState, useEffect, useMemo } from 'react'

interface PricingPageProps {
  itinerary: any
}

interface EventData {
  id: number
  title: string
  event_data: any
  day_id: number
}

interface ServiceItem {
  id: number
  item: {
    name: string
    details: string
    icon: string
    rating?: number
  }
  option: string
  type: string
  net: number
  markup: number
  gross: number
}

const PricingPage: React.FC<PricingPageProps> = ({ itinerary }) => {
  const [pricingData, setPricingData] = useState({
    cgst: 0,
    sgst: 0,
    igst: 0,
    tcs: 0,
    discount: 0,
    baseMarkup: 0,
    extraMarkup: 15000,
    priceIn: 'INR'
  })

  const [events, setEvents] = useState<EventData[]>([])
  const [days, setDays] = useState<any[]>([])
  const [hotels, setHotels] = useState<any[]>([])
  const [hotelRatesByHotel, setHotelRatesByHotel] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)
  const [showMarkupModal, setShowMarkupModal] = useState(false)

  // Fetch events, days data, and pricing data - SUPER OPTIMIZED
  useEffect(() => {
    const fetchData = async () => {
      if (!itinerary?.id) return
      
      try {
        setLoading(true)
        console.log('🚀 Starting super optimized data fetch for itinerary:', itinerary.id)
        
        // Parallel fetch: itinerary data, days data, and ALL events simultaneously
        const [itineraryRes, daysRes, eventsRes, hotelsRes] = await Promise.all([
          fetch(`/api/itineraries/${itinerary.id}`),
          fetch(`/api/itineraries/${itinerary.id}/days`),
          fetch(`/api/itineraries/${itinerary.id}/events`), // New optimized endpoint
          fetch('/api/hotels')
        ])
        
        // Process itinerary data
        if (itineraryRes.ok) {
          const itineraryData = await itineraryRes.json()
          if (itineraryData.itinerary?.pricing_data) {
            const savedPricingData = typeof itineraryData.itinerary.pricing_data === 'string' 
              ? JSON.parse(itineraryData.itinerary.pricing_data) 
              : itineraryData.itinerary.pricing_data
            setPricingData(prev => ({ ...prev, ...savedPricingData }))
          }
        }
        
        // Process days data
        if (daysRes.ok) {
          const daysData = await daysRes.json()
          setDays(daysData.days || [])
        }
        
        // Process events data (single optimized query)
        if (eventsRes.ok) {
          const eventsData = await eventsRes.json()
          setEvents(eventsData.events || [])
          console.log('✅ Loaded', eventsData.count || 0, 'events in single query')
        }

        if (hotelsRes.ok) {
          const hotelsData = await hotelsRes.json()
          setHotels(hotelsData.hotels || [])
        }
        
      } catch (error) {
        console.error('❌ Error fetching pricing data:', error)
      } finally {
        setLoading(false)
        console.log('🏁 Super optimized data fetch completed')
      }
    }

    fetchData()
  }, [itinerary?.id])

  // Preload hotel rates for all accommodation hotels used in this itinerary
  useEffect(() => {
    const loadRates = async () => {
      const hotelNames = events
        .map(e => (typeof e.event_data === 'string' ? JSON.parse(e.event_data) : e.event_data))
        .filter(ed => ed && ed.hotelName)
        .map(ed => ed.hotelName as string)
      const uniqueHotelIds = Array.from(new Set(hotelNames.map(name => hotels.find(h => h.name === name)?.id).filter(Boolean))) as (string|number)[]
      const missing = uniqueHotelIds.filter(id => hotelRatesByHotel[id as any] === undefined)
      if (missing.length === 0) return
      const results = await Promise.all(missing.map(async (id) => {
        try {
          const res = await fetch(`/api/hotel-rates?hotelId=${id}`)
          const data = await res.json().catch(() => ({}))
          return [id, data.rates || []] as const
        } catch {
          return [id, []] as const
        }
      }))
      setHotelRatesByHotel(prev => {
        const next = { ...prev }
        results.forEach(([id, rates]) => { next[id as any] = rates })
        return next
      })
    }
    if (events.length && hotels.length) loadRates()
  }, [events, hotels, hotelRatesByHotel])

  const dateDiffNights = (start: string, end: string) => {
    if (!start || !end) return 1
    const s = new Date(start)
    const e = new Date(end)
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000*60*60*24))
    return diff > 0 ? diff : 1
  }

  // Process events into service items
  const services: ServiceItem[] = useMemo(() => {
    const serviceItems: ServiceItem[] = []
    let serviceId = 1

    events.forEach((event) => {
      const eventData = event.event_data ? 
        (typeof event.event_data === 'string' ? JSON.parse(event.event_data) : event.event_data) : {}
      
      const day = days.find(d => d.id === event.day_id)
      const dayNumber = day?.day_number || 'Unknown'

      if (event.title === 'Accommodation' && eventData.hotelName) {
        const checkinDate = eventData.checkin?.date || 'Not specified'
        const checkoutDate = eventData.checkout?.date || 'Not specified'
        const roomType = eventData.roomName || 'Not specified'
        const mealPlan = eventData.mealPlan || ''
        let price = 0
        // Resolve hotelId and matching rate rows
        const hotelId = hotels.find(h => h.name === eventData.hotelName)?.id
        const rates = hotelRatesByHotel[hotelId]?.length ? hotelRatesByHotel[hotelId] : []
        if (rates.length) {
          const inRange = (rate: any) => {
            const s = new Date(rate.from_date || rate.fromDate)
            const e = new Date(rate.to_date || rate.toDate)
            const ci = new Date(checkinDate)
            const co = new Date(checkoutDate)
            return !(co < s || ci > e)
          }
          const matches = rates.filter(inRange)
            .filter((r: any) => !roomType || (r.room_type || r.roomType) === roomType)
            .filter((r: any) => !mealPlan || (r.meal_plan || r.mealPlan) === mealPlan)
          if (matches.length) {
            // choose first match
            const selected = matches[0]
            // Find which room count was chosen
            const rc = eventData.roomCounts || {}
            const keyOrder = ['double','triple','single','quad','cwb','cnb']
            const pickedKey = keyOrder.find(k => {
              const v = rc[k === 'single' ? 'single' : k]
              return v && v !== '0'
            }) || 'double'
            const count = parseInt(rc[pickedKey] || '1') || 1
            const perNight = selected[pickedKey] || 0
            price = (perNight || 0) * count * dateDiffNights(checkinDate, checkoutDate)
          }
        }
        serviceItems.push({
          id: serviceId++,
          item: {
            name: eventData.hotelName,
            details: `${roomType} - ${checkinDate} TO ${checkoutDate}`,
            icon: '🛏️',
            rating: parseInt(eventData.category?.toString().match(/(\d+)/)?.[1] || '3')
          },
          option: eventData.hotelOption || 'Option 1',
          type: 'Accommodation',
          net: price,
          markup: 0,
          gross: price
        })
      } else if (event.title === 'Transportation' && eventData.name) {
        const date = eventData.date || 'Not specified'
        const startTime = eventData.startTime || 'Not specified'
        const endTime = eventData.endTime || 'Not specified'
        const vehicleInfo = eventData.content ? ` - ${eventData.content}` : ''
        const price = typeof eventData.price === 'number' ? eventData.price : parseFloat(eventData.price) || 0
        
        serviceItems.push({
          id: serviceId++,
          item: {
            name: eventData.name,
            details: `${date} - ${startTime} TO ${endTime}${vehicleInfo}`,
            icon: '🚗'
          },
          option: '',
          type: `Transportation - ${eventData.transferType || 'Private'}`,
          net: price,
          markup: 0,
          gross: price
        })
      } else if (event.title === 'Activity' && eventData.name) {
        const date = eventData.date || 'Not specified'
        const startTime = eventData.startTime || 'Not specified'
        const endTime = eventData.endTime || 'Not specified'
        const price = typeof eventData.price === 'number' ? eventData.price : parseFloat(eventData.price) || 0
        
        serviceItems.push({
          id: serviceId++,
          item: {
            name: eventData.name,
            details: `${date} - ${startTime} TO ${endTime}`,
            icon: '🎯'
          },
          option: '',
          type: 'Activity',
          net: price,
          markup: 0,
          gross: price
        })
      } else if (event.title === 'Meal' && eventData.name) {
        const date = eventData.date || 'Not specified'
        const mealType = eventData.mealType || 'Not specified'
        const price = typeof eventData.price === 'number' ? eventData.price : parseFloat(eventData.price) || 0
        
        serviceItems.push({
          id: serviceId++,
          item: {
            name: eventData.name,
            details: `${mealType} - ${date}`,
            icon: '🍽️'
          },
          option: '',
          type: 'Meal',
          net: price,
          markup: 0,
          gross: price
        })
      } else if (event.title === 'Flight' && eventData.name) {
        const flightNo = eventData.flightNo || 'Not specified'
        const fromDest = eventData.fromDestination || 'Not specified'
        const toDest = eventData.toDestination || 'Not specified'
        const price = typeof eventData.price === 'number' ? eventData.price : parseFloat(eventData.price) || 0
        
        serviceItems.push({
          id: serviceId++,
          item: {
            name: eventData.name,
            details: `${flightNo} - ${fromDest} TO ${toDest}`,
            icon: '✈️'
          },
          option: '',
          type: 'Flight',
          net: price,
          markup: 0,
          gross: price
        })
      }
    })

    return serviceItems
  }, [events, days, hotels, hotelRatesByHotel])

  const totalNet = useMemo(() => {
    const sum = services.reduce((sum, service) => {
      const netValue = typeof service.net === 'number' ? service.net : parseFloat(service.net) || 0
      return sum + netValue
    }, 0)
    console.log('Total Net Calculation:', { services: services.map(s => ({ name: s.item.name, net: s.net })), sum })
    return sum
  }, [services])

  const totalGross = useMemo(() => {
    const netValue = typeof totalNet === 'number' ? totalNet : parseFloat(totalNet) || 0
    const markupValue = typeof pricingData.extraMarkup === 'number' ? pricingData.extraMarkup : parseFloat(pricingData.extraMarkup) || 0
    const gross = netValue + markupValue
    console.log('Total Gross Calculation:', { totalNet: netValue, extraMarkup: markupValue, gross })
    return gross
  }, [totalNet, pricingData.extraMarkup])

  // Save pricing data to database
  const savePricingData = async () => {
    if (!itinerary?.id) return
    
    try {
      const response = await fetch(`/api/itineraries/${itinerary.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pricingData: pricingData
        }),
      })
      
      if (response.ok) {
        console.log('✅ Pricing data saved successfully')
        alert('Pricing data updated successfully!')
      } else {
        const error = await response.json()
        console.error('❌ Error saving pricing data:', error)
        alert('Error saving pricing data: ' + error.error)
      }
    } catch (error: unknown) {
      console.error('❌ Error saving pricing data:', error)
      const message =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : 'Unknown error'
      alert('Error saving pricing data: ' + message)
    }
  }

  if (loading) {
    return (
      <div className="p-6 bg-white">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading pricing data...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-white">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {itinerary?.name || '8 DAYS ULTIMATE KERALA'}
            </h1>
            <p className="text-sm text-gray-600">
              {itinerary?.destinations || 'Kerala, Munnar, Thekkady, Alleppey, Kovalam, Kanyakumari, Trivandrum, Cochin, Varkala'} - 
              Adult: {itinerary?.adults || 2} | Child: {itinerary?.children || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Option</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Markup</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {services.length > 0 ? (
              services.map((service) => (
                <tr key={service.id}>
                  <td className="px-3 py-4">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">{service.item.icon}</span>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {service.item.name}
                          {service.item.rating && (
                            <span className="ml-1 text-yellow-500">
                              {'★'.repeat(service.item.rating)}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">{service.item.details}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    {service.option && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {service.option}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-900">{service.type}</td>
                  <td className="px-3 py-4 text-sm text-gray-900">₹{service.net.toLocaleString()}</td>
                  <td className="px-3 py-4 text-sm text-gray-900">{service.markup}%</td>
                  <td className="px-3 py-4 text-sm text-gray-900">₹{service.gross.toLocaleString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No services found. Add accommodations, transportation, and other services in the BUILD section.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        {/* Markup Summary */}
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm">
              <span className="text-gray-600">Base Markup: {pricingData.baseMarkup}%</span>
              <span className="ml-4 text-gray-600">Extra Markup: ₹{pricingData.extraMarkup.toLocaleString()}</span>
            </div>
            <button 
              onClick={() => setShowMarkupModal(true)}
              className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
            >
              Update
            </button>
          </div>
        </div>
      </div>

      {/* GST On Total Dropdown */}
      <div className="mb-6">
        <label htmlFor="gst-total" className="block text-sm font-medium text-gray-700 mb-2">GST On Total</label>
        <select
          id="gst-total"
          className="block w-full md:w-1/3 lg:w-1/4 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          <option>Select GST Option</option>
          <option>5%</option>
          <option>12%</option>
          <option>18%</option>
        </select>
      </div>

      {/* Pricing Summary and Controls */}
      <div className="space-y-6">
        {/* Pricing Summary Table */}
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Pricing Summary</h3>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-3 py-3 border-b border-gray-200">Hotel / Service</th>
                  <th className="px-3 py-3 border-b border-gray-200 text-right">Price (₹)</th>
                  <th className="px-3 py-3 border-b border-gray-200 text-right">Markup</th>
                  <th className="px-3 py-3 border-b border-gray-200 text-right">CGST</th>
                  <th className="px-3 py-3 border-b border-gray-200 text-right">SGST</th>
                  <th className="px-3 py-3 border-b border-gray-200 text-right">IGST</th>
                  <th className="px-3 py-3 border-b border-gray-200 text-right">TCS</th>
                  <th className="px-3 py-3 border-b border-gray-200 text-right">Discount</th>
                  <th className="px-3 py-3 border-b border-gray-200 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr className="bg-blue-50 hover:bg-blue-100">
                  <td className="px-3 py-3 text-sm font-medium text-blue-800">
                    Option 1 <button className="ml-2 text-xs text-gray-500 hover:text-gray-700">Edit</button>
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-900 text-right">₹{totalNet.toLocaleString()}</td>
                  <td className="px-3 py-3 text-sm text-gray-900 text-right">₹{pricingData.extraMarkup.toLocaleString()}</td>
                  <td className="px-3 py-3 text-sm text-gray-500 text-right">-</td>
                  <td className="px-3 py-3 text-sm text-gray-500 text-right">-</td>
                  <td className="px-3 py-3 text-sm text-gray-500 text-right">-</td>
                  <td className="px-3 py-3 text-sm text-gray-500 text-right">-</td>
                  <td className="px-3 py-3 text-sm text-gray-500 text-right">-</td>
                  <td className="px-3 py-3 text-sm font-bold text-gray-900 text-right">₹{totalGross.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Tax and Discount Inputs */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Adjustments</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div>
              <label htmlFor="cgst" className="block text-sm font-medium text-gray-700 mb-2">CGST %</label>
              <input 
                type="number" 
                id="cgst" 
                value={pricingData.cgst} 
                onChange={(e) => setPricingData(prev => ({ ...prev, cgst: parseFloat(e.target.value) || 0 }))}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" 
              />
            </div>
            <div>
              <label htmlFor="sgst" className="block text-sm font-medium text-gray-700 mb-2">SGST %</label>
              <input 
                type="number" 
                id="sgst" 
                value={pricingData.sgst} 
                onChange={(e) => setPricingData(prev => ({ ...prev, sgst: parseFloat(e.target.value) || 0 }))}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" 
              />
            </div>
            <div>
              <label htmlFor="igst" className="block text-sm font-medium text-gray-700 mb-2">IGST %</label>
              <input 
                type="number" 
                id="igst" 
                value={pricingData.igst} 
                onChange={(e) => setPricingData(prev => ({ ...prev, igst: parseFloat(e.target.value) || 0 }))}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" 
              />
            </div>
            <div>
              <label htmlFor="tcs" className="block text-sm font-medium text-gray-700 mb-2">TCS %</label>
              <input 
                type="number" 
                id="tcs" 
                value={pricingData.tcs} 
                onChange={(e) => setPricingData(prev => ({ ...prev, tcs: parseFloat(e.target.value) || 0 }))}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" 
              />
            </div>
            <div>
              <label htmlFor="discount" className="block text-sm font-medium text-gray-700 mb-2">Discount</label>
              <input 
                type="number" 
                id="discount" 
                value={pricingData.discount} 
                onChange={(e) => setPricingData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" 
              />
            </div>
            <div>
              <label htmlFor="price-in" className="block text-sm font-medium text-gray-700 mb-2">Price In:</label>
              <select 
                id="price-in" 
                value={pricingData.priceIn || 'INR'} 
                onChange={(e) => setPricingData(prev => ({ ...prev, priceIn: e.target.value }))}
                className="w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <button className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors duration-200">Early Bird Offer</button>
          </div>
        </div>
      </div>

      {/* Update Billing Button */}
      <div className="mt-6 flex justify-end">
        <button 
          onClick={savePricingData}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Update Billing
        </button>
      </div>

      {/* Add Extra Markup Modal */}
      {showMarkupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-96 max-w-md mx-4">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add Extra Markup</h3>
              <button
                onClick={() => setShowMarkupModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="base-markup" className="block text-sm font-medium text-gray-700 mb-2">
                  Base Markup %
                </label>
                <input
                  type="number"
                  id="base-markup"
                  value={pricingData.baseMarkup}
                  onChange={(e) => setPricingData(prev => ({ ...prev, baseMarkup: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label htmlFor="extra-markup" className="block text-sm font-medium text-gray-700 mb-2">
                  Extra Markup
                </label>
                <input
                  type="number"
                  id="extra-markup"
                  value={pricingData.extraMarkup}
                  onChange={(e) => setPricingData(prev => ({ ...prev, extraMarkup: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="15000"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={() => setShowMarkupModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 mr-3"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowMarkupModal(false)
                  // Optionally save immediately or just update local state
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PricingPage
