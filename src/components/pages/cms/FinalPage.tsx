import React, { useState, useEffect, useMemo } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface Itinerary {
  id: number
  name: string
  start_date: string | null
  end_date: string | null
  adults: number
  children: number
  destinations: string
  cover_photo?: string
  package_terms?: any[]
}

interface EventData {
  id: number
  title: string
  event_data: any
  day_id: number
  created_at: string
}

interface DayData {
  id: number
  day_number: number
  title: string
  date: string
  location: string
  itinerary_id: number
}

interface FinalPageProps {
  itinerary: Itinerary
}

const FinalPage: React.FC<FinalPageProps> = ({ itinerary }) => {
  const [events, setEvents] = useState<EventData[]>([])
  const [days, setDays] = useState<DayData[]>([])
  const [hotels, setHotels] = useState<any[]>([])
  const [transfers, setTransfers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  // Fetch events and days data
  useEffect(() => {
    const fetchData = async () => {
      if (!itinerary?.id) return
      
      try {
        setLoading(true)
        console.log('🚀 Starting FinalPage data fetch for itinerary:', itinerary.id)
        
        // Parallel fetch: days data, events, hotels, and transfers simultaneously
        const [daysRes, eventsRes, hotelsRes, transfersRes] = await Promise.all([
          fetch(`/api/itineraries/${itinerary.id}/days`),
          fetch(`/api/itineraries/${itinerary.id}/events`),
          fetch('/api/hotels'),
          fetch('/api/transfers')
        ])
        
        // Process days data
        if (daysRes.ok) {
          const daysData = await daysRes.json()
          setDays(daysData.days || [])
        }
        
        // Process events data
        if (eventsRes.ok) {
          const eventsData = await eventsRes.json()
          setEvents(eventsData.events || [])
          console.log('✅ Loaded', eventsData.count || 0, 'events for FinalPage')
        }
        
        // Process hotels data
        if (hotelsRes.ok) {
          const hotelsData = await hotelsRes.json()
          setHotels(hotelsData.hotels || [])
          console.log('✅ Loaded', hotelsData.hotels?.length || 0, 'hotels for FinalPage')
        }
        
        // Process transfers data
        if (transfersRes.ok) {
          const transfersData = await transfersRes.json()
          setTransfers(transfersData.transfers || [])
          console.log('✅ Loaded', transfersData.transfers?.length || 0, 'transfers for FinalPage')
        }
        
      } catch (error) {
        console.error('❌ Error fetching FinalPage data:', error)
      } finally {
        setLoading(false)
        console.log('🏁 FinalPage data fetch completed')
      }
    }

    fetchData()
  }, [itinerary?.id])

  // PDF Export Function
  const exportToPDF = async () => {
    try {
      setExporting(true)
      
      // Create a new PDF document
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      
      // Add header with cover photo
      if (itinerary?.cover_photo) {
        try {
          // Convert cover photo to canvas
          const coverImg = new Image()
          coverImg.crossOrigin = 'anonymous'
          coverImg.src = itinerary.cover_photo
          
          await new Promise((resolve) => {
            coverImg.onload = resolve
          })
          
          // Add cover photo to PDF (full width, 60mm height)
          const coverHeight = 60
          pdf.addImage(coverImg, 'JPEG', 0, 0, pageWidth, coverHeight)
          
          // Add overlay for text readability
          pdf.setFillColor(0, 0, 0, 0.4)
          pdf.rect(0, 0, pageWidth, coverHeight, 'F')
          
          // Add itinerary title
          pdf.setTextColor(255, 255, 255)
          pdf.setFontSize(24)
          pdf.setFont('helvetica', 'bold')
          pdf.text(itinerary.name || 'Itinerary Details', 15, 25)
          
          // Add date and travelers info
          pdf.setFontSize(12)
          pdf.setFont('helvetica', 'normal')
          const dateText = itinerary?.start_date && itinerary?.end_date 
            ? `${new Date(itinerary.start_date).toLocaleDateString()} to ${new Date(itinerary.end_date).toLocaleDateString()}`
            : ''
          const travelersText = itinerary?.adults && itinerary?.children 
            ? `Adults: ${itinerary.adults} | Children: ${itinerary.children}`
            : ''
          pdf.text(dateText, 15, 35)
          pdf.text(travelersText, 15, 42)
          
          // Add Travloger branding
          pdf.setFontSize(16)
          pdf.setFont('helvetica', 'bold')
          pdf.text('travloger.in', pageWidth - 50, 25)
          pdf.setFontSize(8)
          pdf.setFont('helvetica', 'normal')
          pdf.text('You travel. We capture', pageWidth - 50, 32)
          
        } catch (error) {
          console.error('Error adding cover photo:', error)
        }
      } else {
        // Add header without cover photo
        pdf.setFillColor(59, 130, 246) // Blue background
        pdf.rect(0, 0, pageWidth, 40, 'F')
        
        pdf.setTextColor(255, 255, 255)
        pdf.setFontSize(24)
        pdf.setFont('helvetica', 'bold')
        pdf.text(itinerary?.name || 'Itinerary Details', 15, 25)
        
        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'normal')
        const dateText = itinerary?.start_date && itinerary?.end_date 
          ? `${new Date(itinerary.start_date).toLocaleDateString()} to ${new Date(itinerary.end_date).toLocaleDateString()}`
          : ''
        pdf.text(dateText, 15, 35)
      }
      
      let currentY = itinerary?.cover_photo ? 70 : 50
      
      // Add day-by-day itinerary
      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(18)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Day-by-Day Itinerary', 15, currentY)
      currentY += 15
      
      // Process each day
      for (const day of days) {
        const dayEvents = eventsByDay[day.id] || []
        
        if (dayEvents.length === 0) continue
        
        // Check if we need a new page
        if (currentY > pageHeight - 50) {
          pdf.addPage()
          currentY = 20
        }
        
        // Day header
        pdf.setFillColor(240, 240, 240)
        pdf.rect(10, currentY - 5, pageWidth - 20, 12, 'F')
        
        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'bold')
        pdf.text(`Day ${day.day_number}`, 15, currentY + 2)
        
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'normal')
        pdf.text(formatDate(day.date), 50, currentY + 2)
        
        if (day.location) {
          pdf.text(day.location, 100, currentY + 2)
        }
        
        currentY += 20
        
        // Process events for this day
        for (const event of dayEvents) {
          const eventData = event.event_data ? 
            (typeof event.event_data === 'string' ? JSON.parse(event.event_data) : event.event_data) : {}
          
          // Check if we need a new page
          if (currentY > pageHeight - 30) {
            pdf.addPage()
            currentY = 20
          }
          
          // Event title and details
          pdf.setFontSize(12)
          pdf.setFont('helvetica', 'bold')
          pdf.text(`${getEventIcon(event.title)} ${event.title}`, 15, currentY)
          
          currentY += 8
          
          // Event-specific content
          switch (event.title) {
            case 'Accommodation':
              pdf.setFontSize(10)
              pdf.setFont('helvetica', 'normal')
              pdf.text(`Hotel: ${eventData.hotelName || 'Not specified'}`, 20, currentY)
              currentY += 6
              pdf.text(`Room Type: ${eventData.roomName || 'Not specified'}`, 20, currentY)
              currentY += 6
              pdf.text(`Check-in: ${eventData.checkin?.date || 'Not specified'}`, 20, currentY)
              currentY += 6
              pdf.text(`Check-out: ${eventData.checkout?.date || 'Not specified'}`, 20, currentY)
              currentY += 6
              pdf.text(`Meal Plan: ${eventData.mealPlan || 'Not specified'}`, 20, currentY)
              currentY += 6
              if (eventData.price) {
                pdf.text(`Price: ₹${eventData.price.toLocaleString()} per night`, 20, currentY)
                currentY += 6
              }
              
              // Add hotel image if available
              const hotel = hotels.find(h => h.name === eventData.hotelName)
              if (hotel?.icon_url) {
                try {
                  const hotelImg = new Image()
                  hotelImg.crossOrigin = 'anonymous'
                  hotelImg.src = hotel.icon_url
                  
                  await new Promise((resolve) => {
                    hotelImg.onload = resolve
                  })
                  
                  // Add hotel image (30mm x 30mm)
                  pdf.addImage(hotelImg, 'JPEG', pageWidth - 40, currentY - 30, 30, 30)
                } catch (error) {
                  console.error('Error adding hotel image:', error)
                }
              }
              break
              
            case 'Transportation':
              pdf.setFontSize(10)
              pdf.setFont('helvetica', 'normal')
              pdf.text(`Transfer: ${eventData.name || 'Not specified'}`, 20, currentY)
              currentY += 6
              if (eventData.content) {
                pdf.text(`Details: ${eventData.content}`, 20, currentY)
                currentY += 6
              }
              pdf.text(`Type: ${eventData.transferType || 'Private'}`, 20, currentY)
              currentY += 6
              pdf.text(`Time: ${formatTime(eventData.startTime)} TO ${formatTime(eventData.endTime)}`, 20, currentY)
              currentY += 6
              if (eventData.price) {
                pdf.text(`Price: ₹${eventData.price.toLocaleString()} total`, 20, currentY)
                currentY += 6
              }
              
              // Add transfer image if available
              const transfer = transfers.find(t => t.query_name === eventData.name && t.destination === eventData.destination)
              if (transfer?.photo_url) {
                try {
                  const transferImg = new Image()
                  transferImg.crossOrigin = 'anonymous'
                  transferImg.src = transfer.photo_url
                  
                  await new Promise((resolve) => {
                    transferImg.onload = resolve
                  })
                  
                  // Add transfer image (30mm x 30mm)
                  pdf.addImage(transferImg, 'JPEG', pageWidth - 40, currentY - 30, 30, 30)
                } catch (error) {
                  console.error('Error adding transfer image:', error)
                }
              }
              break
              
            case 'Activity':
              pdf.setFontSize(10)
              pdf.setFont('helvetica', 'normal')
              pdf.text(`Activity: ${eventData.name || 'Not specified'}`, 20, currentY)
              currentY += 6
              pdf.text(`Time: ${formatTime(eventData.startTime)} TO ${formatTime(eventData.endTime)}`, 20, currentY)
              currentY += 6
              if (eventData.price) {
                pdf.text(`Price: ₹${eventData.price.toLocaleString()} total`, 20, currentY)
                currentY += 6
              }
              break
              
            case 'Meal':
              pdf.setFontSize(10)
              pdf.setFont('helvetica', 'normal')
              pdf.text(`Meal: ${eventData.name || 'Not specified'}`, 20, currentY)
              currentY += 6
              pdf.text(`Type: ${eventData.mealType || 'Not specified'}`, 20, currentY)
              currentY += 6
              if (eventData.price) {
                pdf.text(`Price: ₹${eventData.price.toLocaleString()} total`, 20, currentY)
                currentY += 6
              }
              break
              
            case 'Flight':
              pdf.setFontSize(10)
              pdf.setFont('helvetica', 'normal')
              pdf.text(`Flight: ${eventData.name || 'Not specified'}`, 20, currentY)
              currentY += 6
              pdf.text(`Flight No: ${eventData.flightNo || 'Not specified'}`, 20, currentY)
              currentY += 6
              pdf.text(`From: ${eventData.fromDestination || 'Not specified'}`, 20, currentY)
              currentY += 6
              pdf.text(`To: ${eventData.toDestination || 'Not specified'}`, 20, currentY)
              currentY += 6
              if (eventData.price) {
                pdf.text(`Price: ₹${eventData.price.toLocaleString()} total`, 20, currentY)
                currentY += 6
              }
              break
              
            case 'Details':
              pdf.setFontSize(10)
              pdf.setFont('helvetica', 'normal')
              if (eventData.description) {
                // Split long descriptions into multiple lines
                const lines = pdf.splitTextToSize(eventData.description.replace(/<[^>]*>/g, ''), pageWidth - 40)
                pdf.text(lines, 20, currentY)
                currentY += lines.length * 4
              }
              break
          }
          
          currentY += 10
        }
        
        currentY += 10
      }
      
      // Add package terms if available
      if (itinerary?.package_terms && itinerary.package_terms.length > 0) {
        if (currentY > pageHeight - 50) {
          pdf.addPage()
          currentY = 20
        }
        
        pdf.setFontSize(18)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Package Terms', 15, currentY)
        currentY += 15
        
        for (const term of itinerary.package_terms) {
          if (currentY > pageHeight - 30) {
            pdf.addPage()
            currentY = 20
          }
          
          pdf.setFontSize(12)
          pdf.setFont('helvetica', 'bold')
          pdf.text(term.title, 15, currentY)
          currentY += 8
          
          pdf.setFontSize(10)
          pdf.setFont('helvetica', 'normal')
          if (term.description) {
            const lines = pdf.splitTextToSize(term.description.replace(/<[^>]*>/g, ''), pageWidth - 30)
            pdf.text(lines, 20, currentY)
            currentY += lines.length * 4
          }
          currentY += 10
        }
      }
      
      // Save the PDF
      const fileName = `${itinerary?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'itinerary'}_${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  // Group events by day
  const eventsByDay = useMemo(() => {
    const grouped: { [key: number]: EventData[] } = {}
    events.forEach(event => {
      if (!grouped[event.day_id]) {
        grouped[event.day_id] = []
      }
      grouped[event.day_id].push(event)
    })
    return grouped
  }, [events])

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    const dayName = days[date.getDay()]
    const day = date.getDate()
    const month = months[date.getMonth()]
    const year = date.getFullYear()
    
    return `${dayName}, ${day} ${month} ${year}`
  }

  // Format time for display
  const formatTime = (timeString: string) => {
    if (!timeString || timeString === 'Not specified') return ''
    return timeString
  }

  // Get event icon
  const getEventIcon = (title: string) => {
    switch (title) {
      case 'Accommodation': return '🛏️'
      case 'Transportation': return '🚗'
      case 'Activity': return '🎯'
      case 'Meal': return '🍽️'
      case 'Flight': return '✈️'
      case 'Leisure': return '🏖️'
      case 'Details': return '📝'
      default: return '📋'
    }
  }

  // Render event card
  const renderEventCard = (event: EventData) => {
    const eventData = event.event_data ? 
      (typeof event.event_data === 'string' ? JSON.parse(event.event_data) : event.event_data) : {}
    
    // Debug logging for accommodation events
    if (event.title === 'Accommodation') {
      console.log('🏨 Accommodation event data:', eventData)
      console.log('🏨 Hotel photo URL:', eventData.hotelPhoto)
    }
    
    // Debug logging for transportation events
    if (event.title === 'Transportation') {
      console.log('🚗 Transportation event data:', eventData)
      console.log('🚗 Transfer photo URL:', eventData.transferPhoto)
    }
    
    const icon = getEventIcon(event.title)
    
    switch (event.title) {
      case 'Accommodation':
        return (
          <div key={event.id} className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{icon}</span>
                  <h3 className="font-semibold text-gray-900">{eventData.hotelName || 'Hotel'}</h3>
                  {eventData.category && (
                    <div className="flex items-center gap-1">
                      {Array.from({ length: parseInt(eventData.category.toString().match(/(\d+)/)?.[1] || '3') }, (_, i) => (
                        <span key={i} className="text-yellow-500">★</span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Room Type: {eventData.roomName || 'Not specified'}</div>
                  <div>Check-in: {eventData.checkin?.date || 'Not specified'}</div>
                  <div>Check-out: {eventData.checkout?.date || 'Not specified'}</div>
                  <div>Meal Plan: {eventData.mealPlan || 'Not specified'}</div>
                  {eventData.price && (
                    <div className="font-semibold text-green-600">₹{eventData.price.toLocaleString()} per night</div>
                  )}
                </div>
              </div>
              
              {/* Hotel Image */}
              {(() => {
                const hotel = hotels.find(h => h.name === eventData.hotelName)
                const hasImage = hotel?.icon_url && hotel.icon_url.trim() !== ''
                
                if (hasImage) {
                  return (
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <img 
                        src={hotel.icon_url} 
                        alt={eventData.hotelName || 'Hotel'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                  )
                }
                return null
              })()}
            </div>
          </div>
        )

      case 'Transportation':
        return (
          <div key={event.id} className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{icon}</span>
                  <h3 className="font-semibold text-gray-900">{eventData.name || 'Transportation'}</h3>
                  {eventData.content && (
                    <span className="text-sm text-gray-500">- {eventData.content}</span>
                  )}
                </div>
                
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Date: {eventData.date || 'Not specified'}</div>
                  <div>Time: {formatTime(eventData.startTime)} TO {formatTime(eventData.endTime)}</div>
                  <div>Type: {eventData.transferType || 'Private'}</div>
                  {eventData.price && (
                    <div className="font-semibold text-green-600">₹{eventData.price.toLocaleString()} total</div>
                  )}
                </div>
              </div>
              
              {/* Transfer Image */}
              {(() => {
                const transfer = transfers.find(t => t.query_name === eventData.name && t.destination === eventData.destination)
                const hasImage = transfer?.photo_url && transfer.photo_url.trim() !== ''
                
                if (hasImage) {
                  return (
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <img 
                        src={transfer.photo_url} 
                        alt={eventData.name || 'Transfer'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                  )
                }
                return null
              })()}
            </div>
          </div>
        )

      case 'Activity':
        return (
          <div key={event.id} className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{icon}</span>
              <h3 className="font-semibold text-gray-900">{eventData.name || 'Activity'}</h3>
            </div>
            
            <div className="space-y-1 text-sm text-gray-600">
              <div>Date: {eventData.date || 'Not specified'}</div>
              <div>Time: {formatTime(eventData.startTime)} TO {formatTime(eventData.endTime)}</div>
              {eventData.price && (
                <div className="font-semibold text-green-600">₹{eventData.price.toLocaleString()} total</div>
              )}
            </div>
          </div>
        )

      case 'Meal':
        return (
          <div key={event.id} className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{icon}</span>
              <h3 className="font-semibold text-gray-900">{eventData.name || 'Meal'}</h3>
            </div>
            
            <div className="space-y-1 text-sm text-gray-600">
              <div>Type: {eventData.mealType || 'Not specified'}</div>
              <div>Date: {eventData.date || 'Not specified'}</div>
              {eventData.price && (
                <div className="font-semibold text-green-600">₹{eventData.price.toLocaleString()} total</div>
              )}
            </div>
          </div>
        )

      case 'Flight':
        return (
          <div key={event.id} className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{icon}</span>
              <h3 className="font-semibold text-gray-900">{eventData.name || 'Flight'}</h3>
            </div>
            
            <div className="space-y-1 text-sm text-gray-600">
              <div>Flight No: {eventData.flightNo || 'Not specified'}</div>
              <div>From: {eventData.fromDestination || 'Not specified'}</div>
              <div>To: {eventData.toDestination || 'Not specified'}</div>
              {eventData.price && (
                <div className="font-semibold text-green-600">₹{eventData.price.toLocaleString()} total</div>
              )}
            </div>
          </div>
        )

      case 'Details':
        return (
          <div key={event.id} className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{icon}</span>
              <h3 className="font-semibold text-gray-900">{eventData.title || 'Details'}</h3>
            </div>
            
            {eventData.description && (
              <div 
                className="text-sm text-gray-700 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: eventData.description }}
              />
            )}
          </div>
        )

      default:
        return (
          <div key={event.id} className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{icon}</span>
              <h3 className="font-semibold text-gray-900">{event.title}</h3>
            </div>
            
            <div className="text-sm text-gray-600">
              {JSON.stringify(eventData, null, 2)}
            </div>
          </div>
        )
    }
  }

  if (loading) {
    return (
      <div className="p-6 bg-white">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading itinerary details...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Cover Photo */}
      <div className="relative">
        {/* Cover Photo Background */}
        {itinerary?.cover_photo && (
          <div 
            className="h-48 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${itinerary.cover_photo})` }}
          >
            <div className="absolute inset-0 bg-black/40"></div>
          </div>
        )}
        
        {/* Header Content */}
        <div className={`${itinerary?.cover_photo ? 'absolute inset-0' : 'bg-white border-b border-gray-200 shadow-sm'}`}>
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className={`${itinerary?.cover_photo ? 'text-white' : ''}`}>
                <h1 className="text-2xl font-bold mb-2">
                  {itinerary?.name || 'Itinerary Details'}
                </h1>
                <p className="text-sm opacity-90">
                  {itinerary?.start_date && itinerary?.end_date && (
                    <>
                      {new Date(itinerary.start_date).toLocaleDateString()} to {new Date(itinerary.end_date).toLocaleDateString()}
                    </>
                  )}
                  {itinerary?.adults && itinerary?.children && (
                    <> • Adults: {itinerary.adults} | Children: {itinerary.children}</>
                  )}
                </p>
              </div>
              
               {/* Travloger Logo */}
               <div className={`text-right ${itinerary?.cover_photo ? 'text-white' : ''}`}>
                 <div className={`text-lg font-bold ${itinerary?.cover_photo ? 'text-white' : 'text-blue-600'}`}>travloger.in</div>
                 <div className="text-xs opacity-90">You travel. We capture</div>
               </div>
             </div>
             
             {/* Export Button */}
             <div className="mt-4 flex justify-center">
               <button
                 onClick={exportToPDF}
                 disabled={exporting}
                 className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
                   exporting 
                     ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                     : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl'
                 }`}
               >
                 {exporting ? (
                   <>
                     <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                     Generating PDF...
                   </>
                 ) : (
                   <>
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                     </svg>
                     Export to PDF
                   </>
                 )}
               </button>
             </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        {days.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500">No days found for this itinerary.</div>
          </div>
        ) : (
          <div className="space-y-8">
            {days.map((day) => {
              const dayEvents = eventsByDay[day.id] || []
              
              return (
                <div key={day.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                  {/* Day Header */}
                  <div className="border-b border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-1">
                      Day {day.day_number}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {formatDate(day.date)}
                    </p>
                    {day.location && (
                      <p className="text-sm text-gray-500 mt-1">
                        {day.location}
                      </p>
                    )}
                  </div>

                  {/* Day Events */}
                  <div className="p-6">
                    {dayEvents.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No events scheduled for this day.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {dayEvents.map(renderEventCard)}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Package Terms */}
            {itinerary?.package_terms && itinerary.package_terms.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="border-b border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-900">Package Terms</h2>
                </div>
                
                <div className="p-6">
                  <div className="space-y-4">
                    {itinerary.package_terms.map((term: any, index: number) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">{term.title || `Term ${index + 1}`}</h3>
                        {term.description && (
                          <div 
                            className="text-sm text-gray-700 prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: term.description }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default FinalPage
