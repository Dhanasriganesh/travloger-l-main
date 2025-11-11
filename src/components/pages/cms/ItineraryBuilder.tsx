'use client'
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import { useParams, Link } from 'react-router-dom'
import QuillEditor from './QuillEditor'
import PricingPage from './PricingPage'
import FinalPage from './FinalPage'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface Itinerary {
  id: number
  name: string
  destinations: string
  start_date: string | null
  end_date: string | null
  adults: number
  children: number
  cover_photo?: string
  package_terms?: any[]
}

// Memoized constants to prevent recreation on every render
const EVENT_OPTIONS = [
  { label: 'Details', icon: '📝' },
  { label: 'Accommodation', icon: '🏨' },
  { label: 'Activity', icon: '🎯' },
  { label: 'Transportation', icon: '🚗' },
  { label: 'Meal', icon: '🍽️' },
  { label: 'Flight', icon: '✈️' },
  { label: 'Leisure', icon: '🏖️' }
]

const TIME_OPTIONS = [
  '12:00 AM', '1:00 AM', '2:00 AM', '3:00 AM', '4:00 AM', '5:00 AM',
  '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
  '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM'
]

const ItineraryBuilder: React.FC = () => {
  const params = useParams()
  const id = params.id as string
  const [row, setRow] = useState<Itinerary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState<any[]>([])
  const [selectedDayId, setSelectedDayId] = useState<number | null>(null)
  const [events, setEvents] = useState<any[]>([])
  const [transferImageErrors, setTransferImageErrors] = useState<Record<string, boolean>>({})
  const [hotelImageErrors, setHotelImageErrors] = useState<Record<string, boolean>>({})
  
  // Group events by day
  const eventsByDay = useMemo(() => {
    const grouped: { [key: number]: any[] } = {}
    events.forEach(event => {
      if (!grouped[event.day_id]) {
        grouped[event.day_id] = []
      }
      grouped[event.day_id].push(event)
    })
    return grouped
  }, [events])
  const [showEventMenu, setShowEventMenu] = useState(false)
  const [showRightSidebar, setShowRightSidebar] = useState(false)
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null)
  const [showCoverPhotoModal, setShowCoverPhotoModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any | null>(null)
  const [showPackageTerms, setShowPackageTerms] = useState(false)
  const [showTips, setShowTips] = useState(false)
  const [showPackageTermsEventMenu, setShowPackageTermsEventMenu] = useState(false)
  const [showTipsModal, setShowTipsModal] = useState(false)
  const [packageTermsItems, setPackageTermsItems] = useState<Array<{ type?: string; title: string; description: string }>>([])
  const [editingPackageTerm, setEditingPackageTerm] = useState<any | null>(null)
  const [tipsForm, setTipsForm] = useState<{ title: string; description: string }>({ title: 'Inclusions & Exclusions', description: '' })
  const [currentStep, setCurrentStep] = useState<'build' | 'pricing' | 'final'>('build')
  const [exporting, setExporting] = useState(false)
  // Refs for closing dropdowns on outside click
  const eventMenuRef = useRef<HTMLDivElement | null>(null)
  const packageTermsMenuRef = useRef<HTMLDivElement | null>(null)
  
  // Debug showTipsModal state
  useEffect(() => {
    console.log('showTipsModal state changed:', showTipsModal)
  }, [showTipsModal])
  const [eventForm, setEventForm] = useState({ title: '', subtitle: '', description: '' })
  const [destinations, setDestinations] = useState<string[]>([])
  const [hotels, setHotels] = useState<any[]>([])
  const [mealPlans, setMealPlans] = useState<any[]>([])
  const [transfers, setTransfers] = useState<any[]>([])
  const [roomTypes, setRoomTypes] = useState<Array<{ id: number; name: string }>>([])
  const [hotelRates, setHotelRates] = useState<any[]>([])
  // Track destinations already auto-created to avoid duplicate POSTs
  const autoCreatedDestinationsRef = useRef<Set<string>>(new Set())
  const [accForm, setAccForm] = useState({
    destination: '',
    type: 'Manual',
    hotelName: '',
    category: '1 Star',
    roomName: '',
    mealPlan: '',
    hotelOption: 'Option 1',
    countSingle: '',
    countDouble: '1',
    countTriple: '',
    countQuad: '',
    countCwb: '',
    countCnb: '',
    checkinDate: '2025-03-31',
    checkinTime: '2:00 PM',
    showTime: false,
    checkoutDate: '2025-03-31',
    checkoutTime: '11:00 AM'
  })
  const [activityForm, setActivityForm] = useState({
    destination: '',
    type: 'Manual',
    name: '',
    date: '2025-03-31',
    startTime: '1:00 PM',
    endTime: '2:00 PM',
    showTime: false
  })
  const [transportationForm, setTransportationForm] = useState({
    destination: '',
    type: 'Manual',
    transferType: 'Private',
    name: '',
    content: '',
    price: 0,
    date: '2025-03-31',
    startTime: '1:00 PM',
    endTime: '2:00 PM',
    showTime: false
  })
  const [mealForm, setMealForm] = useState({
    name: '',
    destination: '',
    mealType: 'BB',
    date: '2025-03-31',
    startTime: '1:00 PM',
    endTime: '2:00 PM',
    showTime: false
  })
  const [flightForm, setFlightForm] = useState({
    name: '',
    flightNo: '',
    fromDestination: '',
    toDestination: '',
    flightDuration: '',
    date: '2025-03-31',
    startTime: '1:00 PM',
    endTime: '2:00 PM'
  })
  const [leisureForm, setLeisureForm] = useState({
    name: 'Day at Leisure',
    destination: ''
  })
  const richRef = useRef<HTMLDivElement | null>(null)
  const detailsRef = useRef<HTMLTextAreaElement | null>(null)

  // Only allow one room count type to be non-zero at a time in Accommodation
  const setExclusiveRoomCount = useCallback((field: 'countSingle' | 'countDouble' | 'countTriple' | 'countQuad' | 'countCwb' | 'countCnb', value: string) => {
    const sanitized = value || '0'
    setAccForm(prev => ({
      ...prev,
      countSingle: field === 'countSingle' ? sanitized : '0',
      countDouble: field === 'countDouble' ? sanitized : '0',
      countTriple: field === 'countTriple' ? sanitized : '0',
      countQuad: field === 'countQuad' ? sanitized : '0',
      countCwb: field === 'countCwb' ? sanitized : '0',
      countCnb: field === 'countCnb' ? sanitized : '0'
    }))
  }, [])

  // Global click handler to close open dropdown menus when clicking outside
  useEffect(() => {
    const handleAnyClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (showEventMenu && eventMenuRef.current && !eventMenuRef.current.contains(target)) {
        setShowEventMenu(false)
      }
      if (showPackageTermsEventMenu && packageTermsMenuRef.current && !packageTermsMenuRef.current.contains(target)) {
        setShowPackageTermsEventMenu(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showEventMenu) setShowEventMenu(false)
        if (showPackageTermsEventMenu) setShowPackageTermsEventMenu(false)
      }
    }
    const handleViewportChange = () => {
      if (showEventMenu) setShowEventMenu(false)
      if (showPackageTermsEventMenu) setShowPackageTermsEventMenu(false)
    }

    // Use capture phase to ensure we catch it even if inner handlers stop propagation
    document.addEventListener('click', handleAnyClick, true)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('scroll', handleViewportChange, true)
    window.addEventListener('resize', handleViewportChange)
    return () => {
      document.removeEventListener('click', handleAnyClick, true)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('scroll', handleViewportChange, true)
      window.removeEventListener('resize', handleViewportChange)
    }
  }, [showEventMenu, showPackageTermsEventMenu])
  
  // Memoized file conversion function
  const convertFileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }, [])
  
  // Memoized cover photo upload handler
  const handleCoverPhotoUpload = useCallback(async (file: File) => {
    try {
      console.log('📸 Starting cover photo upload for file:', file.name, 'Size:', file.size)
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB')
        return
      }
      
      console.log('✅ File validation passed, converting to base64...')
      const base64 = await convertFileToBase64(file)
      console.log('✅ Base64 conversion complete, length:', base64.length)
      
      setCoverPhoto(base64)
      
      console.log('📤 Sending to API...')
      // Save to database
      const res = await fetch(`/api/itineraries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coverPhoto: base64 })
      })
      
      console.log('📡 API response status:', res.status)
      
      if (res.ok) {
        const data = await res.json()
        console.log('✅ Cover photo saved successfully:', data)
        
        // Update the row state with the new cover photo
        setRow(prev => prev ? { ...prev, cover_photo: base64 } : null)
        
        setShowCoverPhotoModal(false)
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
        console.error('❌ Failed to save cover photo:', errorData)
        alert(`Failed to save cover photo: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('❌ Error uploading cover photo:', error)
      alert(`Error uploading cover photo: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [id, convertFileToBase64])
  // Memoized fetch functions to prevent unnecessary re-renders
  const fetchDestinations = useCallback(async () => {
    try {
      const res = await fetch('/api/destinations')
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setDestinations(data.destinations?.map((d: any) => d.name) || [])
      }
    } catch (error) {
      console.error('Failed to fetch destinations:', error)
    }
  }, [])

  // Auto-create any destinations present on the itinerary that aren't in master list
  useEffect(() => {
    const maybeCreateMissingDestinations = async () => {
      try {
        if (!row?.destinations) return
        if (!Array.isArray(destinations)) return

        const namesFromRow = row.destinations
          .split(',')
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0)

        if (namesFromRow.length === 0) return

        const existingLower = new Set(destinations.map((d) => d.toLowerCase()))

        const toCreate = namesFromRow.filter((name) => {
          const lower = name.toLowerCase()
          return !existingLower.has(lower) && !autoCreatedDestinationsRef.current.has(lower)
        })

        if (toCreate.length === 0) return

        const createPromises = toCreate.map(async (name) => {
          try {
            const res = await fetch('/api/destinations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name })
            })
            // Mark as attempted regardless to avoid loops
            autoCreatedDestinationsRef.current.add(name.toLowerCase())
            if (res.ok) {
              // Optimistically update local list; also safe if server normalizes case
              setDestinations((prev) => Array.isArray(prev) ? [...prev, name] : [name])
            }
          } catch {
            // Ignore individual errors; do not block other creations
          }
        })

        await Promise.all(createPromises)
      } catch {
        // No-op
      }
    }

    maybeCreateMissingDestinations()
  }, [row?.destinations, destinations])

  const fetchHotels = useCallback(async () => {
    try {
      const res = await fetch('/api/hotels')
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setHotels(data.hotels || [])
      }
    } catch (error) {
      console.error('Failed to fetch hotels:', error)
    }
  }, [])

  const fetchMealPlans = useCallback(async () => {
    try {
      const res = await fetch('/api/meal-plans')
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setMealPlans(data.mealPlans || [])
      }
    } catch (error) {
      console.error('Failed to fetch meal plans:', error)
    }
  }, [])

  const fetchRoomTypes = useCallback(async () => {
    try {
      const res = await fetch('/api/room-types')
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setRoomTypes((data.roomTypes || []).map((rt: any) => ({ id: rt.id, name: rt.name })))
      }
    } catch (error) {
      console.error('Failed to fetch room types:', error)
    }
  }, [])

  const fetchTransfers = useCallback(async () => {
    try {
      const res = await fetch('/api/transfers')
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setTransfers(data.transfers || [])
      }
    } catch (error) {
      console.error('Failed to fetch transfers:', error)
    }
  }, [])

  const fetchHotelRates = useCallback(async (hotelId: string | number) => {
    try {
      const res = await fetch(`/api/hotel-rates?hotelId=${hotelId}`)
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setHotelRates(data.rates || [])
      } else {
        setHotelRates([])
      }
    } catch (error) {
      console.error('Failed to fetch hotel rates:', error)
      setHotelRates([])
    }
  }, [])

  // Helper functions for PDF
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    const dayName = days[date.getDay()]
    const day = date.getDate()
    const month = months[date.getMonth()]
    const year = date.getFullYear()
    
    return `${dayName}, ${day} ${month} ${year}`
  }, [])

  const formatTime = useCallback((timeString: string) => {
    if (!timeString || timeString === 'Not specified') return ''
    return timeString
  }, [])

  const getEventIcon = useCallback((title: string) => {
    switch (title) {
      case 'Accommodation': return '[HOTEL]'
      case 'Transportation': return '[CAR]'
      case 'Activity': return '[ACTIVITY]'
      case 'Meal': return '[MEAL]'
      case 'Flight': return '[FLIGHT]'
      case 'Leisure': return '[LEISURE]'
      case 'Details': return '[DETAILS]'
      default: return '[EVENT]'
    }
  }, [])

  // PDF Export Function
  const exportToPDF = useCallback(async () => {
    try {
      setExporting(true)
      
      // First, fetch ALL events for ALL days
      console.log('📋 Fetching all events for PDF export...')
      const allEvents: any[] = []
      
      for (const day of days) {
        try {
          const res = await fetch(`/api/itineraries/days/${day.id}/events`)
          const data = await res.json().catch(() => ({}))
          if (res.ok && data.events) {
            allEvents.push(...data.events)
            console.log(`✅ Loaded ${data.events.length} events for Day ${day.day_number}`)
          }
        } catch (error) {
          console.error(`❌ Error loading events for Day ${day.day_number}:`, error)
        }
      }
      
      console.log(`📋 Total events loaded for PDF: ${allEvents.length}`)
      
      console.log('🚀 Starting PDF creation...')
      
      // Debug: Check if itinerary has cover photo
      console.log('🖼️ Itinerary data for PDF:', {
        id: row?.id,
        name: row?.name,
        hasCoverPhoto: !!row?.cover_photo,
        coverPhotoLength: row?.cover_photo?.length || 0,
        coverPhotoStart: row?.cover_photo?.substring(0, 30) || 'none'
      })
      
      // Test: Try to fetch fresh data from database
      try {
        if (row?.id) {
          console.log('🔄 Fetching fresh itinerary data from database...')
          const freshRes = await fetch(`/api/itineraries/${row.id}`)
          const freshData = await freshRes.json()
          console.log('🔄 Fresh data from database:', {
            hasCoverPhoto: !!freshData.itinerary?.cover_photo,
            coverPhotoLength: freshData.itinerary?.cover_photo?.length || 0,
            coverPhotoStart: freshData.itinerary?.cover_photo?.substring(0, 30) || 'none'
          })
          
          // Use fresh data if available
          if (freshData.itinerary?.cover_photo && row) {
            console.log('🔄 Using fresh cover photo from database')
            row.cover_photo = freshData.itinerary.cover_photo
          }
        }
      } catch (error) {
        console.error('🔄 Error fetching fresh data:', error)
      }
      
      // Group all events by day
      const allEventsByDay: { [key: number]: any[] } = {}
      allEvents.forEach(event => {
        if (!allEventsByDay[event.day_id]) {
          allEventsByDay[event.day_id] = []
        }
        allEventsByDay[event.day_id].push(event)
      })
      
      // Create a new PDF document
      console.log('📄 Creating PDF document...')
      try {
        const pdf = new jsPDF('p', 'mm', 'a4')
        const pageWidth = pdf.internal.pageSize.getWidth()
        const pageHeight = pdf.internal.pageSize.getHeight()
        console.log('📄 PDF created successfully, page size:', pageWidth, 'x', pageHeight)
      
      // Add header with cover photo
      if (row?.cover_photo) {
        try {
          console.log('🖼️ Adding cover photo to PDF:', row.cover_photo)
          console.log('🖼️ Cover photo type:', typeof row.cover_photo)
          console.log('🖼️ Cover photo length:', row.cover_photo.length)
          console.log('🖼️ Cover photo starts with:', row.cover_photo.substring(0, 50))
          
          // Convert cover photo to canvas
          const coverImg = document.createElement('img')
          coverImg.crossOrigin = 'anonymous'
          
          // Check if it's a base64 data URL
          if (row.cover_photo.startsWith('data:')) {
            console.log('🖼️ Cover photo is a base64 data URL')
            coverImg.src = row.cover_photo
          } else {
            console.log('🖼️ Cover photo is a regular URL')
            coverImg.src = row.cover_photo
          }
          
          console.log('🖼️ Image object created, waiting for load...')
          
          await new Promise<void>((resolve, reject) => {
            coverImg.onload = () => {
              console.log('🖼️ Cover photo loaded successfully!')
              console.log('🖼️ Image dimensions:', coverImg.width, 'x', coverImg.height)
              resolve()
            }
            coverImg.onerror = (error) => {
              console.error('🖼️ Cover photo failed to load:', error)
              reject(error)
            }
            // Timeout after 10 seconds
            setTimeout(() => {
              console.error('🖼️ Cover photo load timeout')
              reject(new Error('Image load timeout'))
            }, 10000)
          })
          
          console.log('🖼️ Adding cover photo to PDF document...')
          
          // Add cover photo to PDF (full width, 60mm height)
          const coverHeight = 60
          
          // Try different image formats
          try {
            if (row.cover_photo.includes('data:image/png')) {
              console.log('🖼️ Adding as PNG')
              pdf.addImage(coverImg, 'PNG', 0, 0, pageWidth, coverHeight)
            } else if (row.cover_photo.includes('data:image/jpeg') || row.cover_photo.includes('data:image/jpg')) {
              console.log('🖼️ Adding as JPEG')
              pdf.addImage(coverImg, 'JPEG', 0, 0, pageWidth, coverHeight)
            } else {
              console.log('🖼️ Adding as default format')
              pdf.addImage(coverImg, 'JPEG', 0, 0, pageWidth, coverHeight)
            }
          } catch (imgError) {
            console.error('🖼️ Error adding image with specific format:', imgError)
            console.log('🖼️ Trying with default format...')
            pdf.addImage(coverImg, 'JPEG', 0, 0, pageWidth, coverHeight)
          }
          
          console.log('🖼️ Cover photo added to PDF successfully!')
          
          // Add itinerary title with shadow for readability
          pdf.setTextColor(0, 0, 0) // Black shadow
          pdf.setFontSize(24)
          pdf.setFont('helvetica', 'bold')
          pdf.text(row.name || 'Itinerary Details', 16, 26) // Shadow position
          
          pdf.setTextColor(255, 255, 255) // White text
          pdf.text(row.name || 'Itinerary Details', 15, 25) // Main text position
          
          // Add date and travelers info with shadows
          pdf.setFontSize(12)
          pdf.setFont('helvetica', 'normal')
          const dateText = row?.start_date && row?.end_date 
            ? `${new Date(row.start_date).toLocaleDateString()} to ${new Date(row.end_date).toLocaleDateString()}`
            : ''
          const travelersText = row?.adults && row?.children 
            ? `Adults: ${row.adults} | Children: ${row.children}`
            : ''
          
          // Add shadows
          pdf.setTextColor(0, 0, 0)
          pdf.text(dateText, 16, 36)
          pdf.text(travelersText, 16, 43)
          
          // Add main text
          pdf.setTextColor(255, 255, 255)
          pdf.text(dateText, 15, 35)
          pdf.text(travelersText, 15, 42)
          
          // Add Travloger branding with shadows
          pdf.setFontSize(16)
          pdf.setFont('helvetica', 'bold')
          
          // Add shadows
          pdf.setTextColor(0, 0, 0)
          pdf.text('travloger.in', pageWidth - 49, 26)
          pdf.setFontSize(8)
          pdf.setFont('helvetica', 'normal')
          pdf.text('You travel. We capture', pageWidth - 49, 33)
          
          // Add main text
          pdf.setTextColor(255, 255, 255)
          pdf.setFontSize(16)
          pdf.setFont('helvetica', 'bold')
          pdf.text('travloger.in', pageWidth - 50, 25)
          pdf.setFontSize(8)
          pdf.setFont('helvetica', 'normal')
          pdf.text('You travel. We capture', pageWidth - 50, 32)
          
        } catch (error) {
          console.error('🖼️ Error adding cover photo:', error)
          console.log('🖼️ Falling back to header without cover photo')
          // Fallback to header without cover photo
          pdf.setFillColor(59, 130, 246) // Blue background
          pdf.rect(0, 0, pageWidth, 40, 'F')
          
          pdf.setTextColor(255, 255, 255)
          pdf.setFontSize(24)
          pdf.setFont('helvetica', 'bold')
          pdf.text(row?.name || 'Itinerary Details', 15, 25)
          
          pdf.setFontSize(12)
          pdf.setFont('helvetica', 'normal')
          const dateText = row?.start_date && row?.end_date 
            ? `${new Date(row.start_date).toLocaleDateString()} to ${new Date(row.end_date).toLocaleDateString()}`
            : ''
          pdf.text(dateText, 15, 35)
        }
      } else {
        // Add header without cover photo
        pdf.setFillColor(59, 130, 246) // Blue background
        pdf.rect(0, 0, pageWidth, 40, 'F')
        
        pdf.setTextColor(255, 255, 255)
        pdf.setFontSize(24)
        pdf.setFont('helvetica', 'bold')
        pdf.text(row?.name || 'Itinerary Details', 15, 25)
        
        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'normal')
        const dateText = row?.start_date && row?.end_date 
          ? `${new Date(row.start_date).toLocaleDateString()} to ${new Date(row.end_date).toLocaleDateString()}`
          : ''
        pdf.text(dateText, 15, 35)
      }
      
      let currentY = row?.cover_photo ? 70 : 50
      
      // Add day-by-day itinerary
      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(18)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Day-by-Day Itinerary', 15, currentY)
      currentY += 15
      
      // Process each day
      for (const day of days) {
        const dayEvents = allEventsByDay[day.id] || []
        
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
        
        // Process events for this day (if any)
        if (dayEvents.length > 0) {
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
                // Removed per-night pricing from PDF export
                
                // Add hotel image if available
                const hotel = hotels.find(h => h.name === eventData.hotelName)
                if (hotel?.icon_url) {
                  try {
                    const hotelImg = document.createElement('img')
                    hotelImg.crossOrigin = 'anonymous'
                    hotelImg.src = hotel.icon_url
                    
                    await new Promise<void>((resolve, reject) => {
                      hotelImg.onload = () => resolve()
                      hotelImg.onerror = () => reject(new Error('Hotel image load timeout'))
                      setTimeout(() => reject(new Error('Hotel image load timeout')), 3000)
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
                    const transferImg = document.createElement('img')
                    transferImg.crossOrigin = 'anonymous'
                    transferImg.src = transfer.photo_url
                    
                    await new Promise<void>((resolve, reject) => {
                      transferImg.onload = () => resolve()
                      transferImg.onerror = () => reject(new Error('Transfer image load timeout'))
                      setTimeout(() => reject(new Error('Transfer image load timeout')), 3000)
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
        }
        
        // If no events for this day, add a message
        if (dayEvents.length === 0) {
          pdf.setFontSize(10)
          pdf.setFont('helvetica', 'italic')
          pdf.setTextColor(128, 128, 128)
          pdf.text('No events scheduled for this day.', 20, currentY)
          pdf.setTextColor(0, 0, 0) // Reset to black
          currentY += 8
        }
        
        currentY += 10
      }
      
      // Add package terms if available
      if (row?.package_terms && row.package_terms.length > 0) {
        if (currentY > pageHeight - 50) {
          pdf.addPage()
          currentY = 20
        }
        
        pdf.setFontSize(18)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Package Terms', 15, currentY)
        currentY += 15
        
        for (const term of row.package_terms) {
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
      const fileName = `${row?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'itinerary'}_${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)
      
      } catch (pdfError) {
        console.error('❌ Error creating PDF document:', pdfError)
        throw pdfError
      }
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setExporting(false)
    }
  }, [row, days, hotels, transfers, formatDate, formatTime, getEventIcon])

  // Memoized textarea helper functions
  const updateTextarea = useCallback((next: string, selStart?: number, selEnd?: number) => {
    if (!detailsRef.current) return
    detailsRef.current.value = next
    setEventForm(prev => ({ ...prev, description: next }))
    if (typeof selStart === 'number' && typeof selEnd === 'number') {
      requestAnimationFrame(() => {
        if (!detailsRef.current) return
        detailsRef.current.focus()
        detailsRef.current.selectionStart = selStart
        detailsRef.current.selectionEnd = selEnd
      })
    }
  }, [])

  const wrapSelectionWithTag = useCallback((tag: string, isBlock?: boolean) => {
    const ta = detailsRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const value = ta.value
    const selected = value.slice(start, end) || ''
    const open = `<${tag}>`
    const close = `</${tag}>`
    const next = value.slice(0, start) + open + selected + close + value.slice(end)
    const cursor = start + open.length + selected.length
    updateTextarea(next, cursor, cursor)
  }, [updateTextarea])

  const wrapSelectionWithAlign = useCallback((align: 'left' | 'center' | 'right') => {
    const ta = detailsRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const value = ta.value
    const selected = value.slice(start, end) || ''
    const open = `<div style="text-align:${align}">`
    const close = `</div>`
    const next = value.slice(0, start) + open + selected + close + value.slice(end)
    const cursor = start + open.length + selected.length
    updateTextarea(next, cursor, cursor)
  }, [updateTextarea])

  const makeList = useCallback((ordered: boolean) => {
    const ta = detailsRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const value = ta.value
    const selected = (value.slice(start, end) || '').split(/\r?\n/)
    const tag = ordered ? 'ol' : 'ul'
    const items = selected.filter(Boolean).map(line => `<li>${line}</li>`).join('') || '<li></li>'
    const fragment = `<${tag}>${items}</${tag}>`
    const next = value.slice(0, start) + fragment + value.slice(end)
    const cursor = start + fragment.length
    updateTextarea(next, cursor, cursor)
  }, [updateTextarea])

  // Memoized computed values to prevent unnecessary recalculations
  const selectedDay = useMemo(() => days.find(d => d.id === selectedDayId), [days, selectedDayId])
  const sortedEvents = useMemo(() => {
    return events.sort((a, b) => {
      // Always put "Details" first
      if (a.title === 'Details' && b.title !== 'Details') return -1
      if (b.title === 'Details' && a.title !== 'Details') return 1
      // For other events, maintain original order
      return a.sort_order - b.sort_order
    })
  }, [events])

  const filteredHotels = useMemo(() => {
    return hotels.filter(h => h.destination === accForm.destination)
  }, [hotels, accForm.destination])

  const filteredMealPlans = useMemo(() => {
    return mealPlans.filter(mp => mp.destination === accForm.destination)
  }, [mealPlans, accForm.destination])

  const filteredTransfers = useMemo(() => {
    return transfers.filter(t => t.destination === transportationForm.destination)
  }, [transfers, transportationForm.destination])

  // Destinations allowed for this itinerary (from itinerary record only)
  const itineraryDestinations = useMemo(() => {
    if (!row?.destinations) return [] as string[]
    const parts = row.destinations
      .split(',')
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0)
    // De-duplicate while preserving order
    return Array.from(new Set(parts))
  }, [row?.destinations])

  // Hotels available for Accommodation form when selecting "From Master"
  const masterHotelsForAccommodation = useMemo(() => {
    const targetDestination = accForm.destination || (editingEvent ? (days.find(d => d.id === editingEvent.day_id)?.location || '') : '')
    if (!targetDestination) return [] as any[]
    return hotels.filter(h => h.destination === targetDestination)
  }, [hotels, accForm.destination, editingEvent, days])

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        console.log('🚀 Starting optimized ItineraryBuilder load for:', id)
        
        // Parallel fetch: itinerary data and days data simultaneously
        const [res, dres] = await Promise.all([
          fetch(`/api/itineraries/${id}`),
          fetch(`/api/itineraries/${id}/days`)
        ])
        
        const data = await res.json().catch(() => ({}))
        const ddata = await dres.json().catch(() => ({}))
        
        if (res.ok) {
          setRow(data.itinerary)
          setCoverPhoto(data.itinerary.cover_photo || null)
          setPackageTermsItems(data.itinerary.package_terms || [])
          
          if (dres.ok) {
            const existingDays = ddata.days || []
            setDays(existingDays)
            
            // Auto-create days based on date range if no days exist
            if (existingDays.length === 0 && data.itinerary.start_date && data.itinerary.end_date) {
              const startDate = new Date(data.itinerary.start_date)
              const endDate = new Date(data.itinerary.end_date)
              const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
              
              console.log('📅 Auto-creating', daysDiff, 'days for date range')
              
              // Create all days in parallel
              const dayPromises = []
              for (let i = 1; i <= daysDiff; i++) {
                const dayDate = new Date(startDate)
                dayDate.setDate(startDate.getDate() + i - 1)
                
                dayPromises.push(
                  fetch(`/api/itineraries/${id}/days`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      dayNumber: i, 
                      title: `Day ${i}`,
                      date: dayDate.toISOString().split('T')[0]
                    })
                  }).then(dayRes => dayRes.json().catch(() => ({})))
                )
              }
              
              const dayResults = await Promise.all(dayPromises)
              const newDays = dayResults.filter(result => result.day).map(result => result.day)
              
              if (newDays.length > 0) {
                setDays(newDays)
                setSelectedDayId(newDays[0].id)
                console.log('✅ Created', newDays.length, 'days')
              }
            } else if (existingDays.length > 0) {
              setSelectedDayId(existingDays[0].id)
              console.log('✅ Loaded', existingDays.length, 'existing days')
            }
          }
        } else {
          setError(data.error || 'Failed to load itinerary')
        }
      } catch (e) {
        setError('Failed to load itinerary')
      } finally {
        setLoading(false)
        console.log('🏁 ItineraryBuilder load completed')
      }
    }
    if (id) {
      load()
      fetchDestinations()
      fetchHotels()
      fetchMealPlans()
      fetchTransfers()
      fetchRoomTypes()
    }
  }, [id, fetchDestinations, fetchHotels, fetchMealPlans, fetchTransfers, fetchRoomTypes])

  // Load rates when a hotel is selected in Accommodation form
  useEffect(() => {
    if (!accForm.hotelName) { setHotelRates([]); return }
    const selectedHotel = hotels.find(h => h.name === accForm.hotelName)
    if (selectedHotel?.id) {
      fetchHotelRates(selectedHotel.id)
    } else {
      setHotelRates([])
    }
  }, [accForm.hotelName, hotels, fetchHotelRates])

  // Load events when day changes
  useEffect(() => {
    const loadEvents = async () => {
      if (!selectedDayId) { setEvents([]); return }
      const res = await fetch(`/api/itineraries/days/${selectedDayId}/events`)
      const data = await res.json().catch(()=>({}))
      if (res.ok) setEvents(data.events || [])
      else setEvents([])
    }
    loadEvents()
  }, [selectedDayId])

  if (loading) return <div className="p-4">Loading itinerary...</div>
  if (error) return <div className="p-4 text-red-600">{error}</div>
  if (!row) return <div className="p-4">Not found</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Ultra Compact Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 py-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link 
                to="/packages" 
                className="flex items-center gap-1 text-slate-600 hover:text-slate-900 transition-colors duration-200 group"
              >
                <svg className="w-3 h-3 group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-xs font-medium">Back to itineraries</span>
              </Link>
              <div className="h-3 w-px bg-slate-300"></div>
              <h1 className="text-base font-bold text-slate-900">{row.name}</h1>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Step Navigation */}
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => setCurrentStep('build')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all duration-200 ${
                    currentStep === 'build' 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm hover:shadow-md hover:scale-105' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  BUILD
                </button>
                <button 
                  onClick={() => setCurrentStep('pricing')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all duration-200 ${
                    currentStep === 'pricing' 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm hover:shadow-md hover:scale-105' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  PRICING
                </button>
                <button 
                  onClick={() => setCurrentStep('final')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all duration-200 ${
                    currentStep === 'final' 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm hover:shadow-md hover:scale-105' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  FINAL
                </button>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={exportToPDF}
                  disabled={exporting}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                    exporting 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {exporting ? 'EXPORTING...' : 'EXPORT'}
                </button>
                <button 
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: row?.name || 'Itinerary',
                        text: `Check out this itinerary: ${row?.name}`,
                        url: window.location.href
                      }).catch(console.error)
                    } else {
                      // Fallback: copy to clipboard
                      navigator.clipboard.writeText(window.location.href).then(() => {
                        alert('Link copied to clipboard!')
                      }).catch(() => {
                        alert('Unable to share. Please copy the URL manually.')
                      })
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-all duration-200"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  SHARE
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Step-based Content Rendering */}
        {currentStep === 'build' && (
          <>
            {/* Ultra Compact Cover Section */}
            <div className="relative mb-4">
          <div className="h-24 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-lg shadow-md overflow-hidden">
            {/* Cover Photo Background */}
            {coverPhoto && (
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${coverPhoto})` }}
              >
                <div className="absolute inset-0 bg-black/40"></div>
              </div>
            )}
            
            {/* Gradient Overlay (only if no cover photo) */}
            {!coverPhoto && <div className="absolute inset-0 bg-black/20"></div>}
            
            <div className="absolute inset-0 flex items-end p-4">
              <div className="text-white">
                <h2 className="text-lg font-bold mb-0.5">{row.name}</h2>
                <div className="flex items-center gap-1.5 text-blue-100">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs">{row.destinations}</span>
                </div>
                
                {/* Arrow button to toggle right sidebar */}
                {/* <button
                  onClick={() => setShowRightSidebar(!showRightSidebar)}
                  className={`px-3 py-1.5 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-all duration-200 flex items-center gap-1 text-sm ${
                    showRightSidebar ? 'bg-blue-100 text-blue-700' : ''
                  }`}
                  title={showRightSidebar ? 'Hide sidebar' : 'Show sidebar'}
                >
                  <svg 
                    className={`w-4 h-4 transition-transform duration-200 ${showRightSidebar ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="text-xs">Tools</span>
                </button> */}
              </div>
            </div>
            <button 
              onClick={() => setShowCoverPhotoModal(true)}
              className="absolute top-2 right-2 px-2 py-1 bg-white/20 backdrop-blur-sm text-white rounded text-xs hover:bg-white/30 transition-colors duration-200"
            >
              Change Cover Photo
            </button>
          </div>
        </div>

        {/* Step Navigation */}
        <div className="flex justify-center mb-6">
          <div className="bg-gray-100 rounded-lg p-1 flex gap-1">
            <button
              onClick={() => setCurrentStep('build')}
              className={`px-6 py-2 rounded-md font-semibold text-sm transition-all duration-200 ${
                currentStep === 'build'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              BUILD
            </button>
            <button
              onClick={() => setCurrentStep('pricing')}
              className={`px-6 py-2 rounded-md font-semibold text-sm transition-all duration-200 ${
                currentStep === 'pricing'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              PRICING
            </button>
            <button
              onClick={() => setCurrentStep('final')}
              className={`px-6 py-2 rounded-md font-semibold text-sm transition-all duration-200 ${
                currentStep === 'final'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              FINAL
            </button>
          </div>
        </div>
          </>
        )}

        <div className="grid grid-cols-12 gap-4">
          {currentStep === 'build' && (
            <>
              {/* Compact Left days sidebar */}
              <div className="col-span-2">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/60 overflow-hidden">
              {days.map((d) => (
                <div key={d.id} className={`${selectedDayId===d.id?'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500':''} hover:bg-slate-50 transition-all duration-200`}>
                  <div className="px-3 py-2 flex items-center justify-between">
                  <button className="text-left min-w-0 flex-1" onClick={()=>{ setSelectedDayId(d.id); setShowPackageTerms(false) }}>
                      <div className={`font-semibold ${selectedDayId===d.id?'text-blue-900':'text-slate-900'} transition-colors duration-200 text-sm`}>
                        Day {d.day_number}
                      </div>
                      {d.location && (
                        <div className="text-xs text-slate-600 mt-0.5 truncate">{d.location}</div>
                      )}
                    </button>
                    <button className="text-slate-400 hover:text-slate-600 p-0.5 rounded hover:bg-slate-100 transition-colors duration-200" title="Edit day">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                      </svg>
                    </button>
                  </div>
                  <div className="px-3 pb-2">
                    <select
                      className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs bg-white focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      value={d.location || ''}
                      onChange={async (e)=>{
                        const value = e.target.value
                        const res = await fetch(`/api/itineraries/${id}/days`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ dayId: d.id, location: value }) })
                        const data = await res.json().catch(()=>({}))
                        if (res.ok) {
                          setDays(prev => prev.map(x => x.id===d.id ? { ...x, location: data.day?.location ?? value } : x))
                          if (selectedDayId===d.id) {
                            setSelectedDayId(d.id)
                          }
                        }
                      }}
                    >
                      <option value="" disabled>Select location</option>
                      {itineraryDestinations.map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>
                  {selectedDayId !== d.id && <div className="border-b border-slate-100"></div>}
                </div>
              ))}
            </div>
            <div className="px-4 py-4 border-t bg-slate-50">
              <button
                onClick={async ()=>{
                  const nextNo = (days[days.length-1]?.day_number || 0) + 1
                  const res = await fetch(`/api/itineraries/${id}/days`,{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ dayNumber: nextNo, title: `Day ${nextNo}`})})
                  const data = await res.json().catch(()=>({}))
                  if(res.ok){ 
                    setDays(prev=>[...prev, data.day]); 
                    setSelectedDayId(data.day.id)
                    // Auto-create a starting Details event and open editor
                    try {
                      const sort = (events[events.length-1]?.sort_order || 0) + 1
                      const er = await fetch(`/api/itineraries/days/${data.day.id}/events`, { 
                        method:'POST', headers:{'Content-Type':'application/json'}, 
                        body: JSON.stringify({ title: 'Details', sortOrder: sort }) 
                      })
                      const ev = await er.json().catch(()=>({}))
                      if (er.ok && ev.event) {
                        setEvents(prev => [...prev, ev.event])
                        setEditingEvent(ev.event)
                        setEventForm({ title: ev.event.title || 'Details', subtitle: '', description: '' })
                      }
                    } catch { /* ignore */ }
                  }
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white hover:bg-gray-50 shadow-sm"
              >+ Add Day</button>
              {/* Package Terms entry at the bottom */}
              <div className="mt-3">
                <button
                  onClick={()=>{ setShowPackageTerms(true); setShowRightSidebar(true) }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm border ${showPackageTerms ? 'bg-blue-200/80 border-blue-300 text-blue-900' : 'bg-white hover:bg-gray-50 border-gray-300 text-slate-800'}`}
                  title="Package Terms"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h10M7 16h6M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
                    </svg>
                    Package Terms
                  </span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Main day content */}
          <div className={`${showRightSidebar ? 'col-span-7' : 'col-span-10'} p-4 border-r transition-all duration-300 relative`}>
            {showPackageTerms && (
              <div className="absolute inset-0 bg-white z-[1]">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xl font-semibold text-gray-900">Package Terms</div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <button
                        onClick={()=>setShowPackageTermsEventMenu(v=>!v)}
                        className="px-3.5 py-1.5 rounded-md bg-blue-600 text-white text-sm shadow-sm hover:bg-blue-700 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Event
                      </button>
                      {showPackageTermsEventMenu && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowPackageTermsEventMenu(false)} />
                          <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
                          {[
                            {label:'Terms & Conditions', icon:'📋'},
                            {label:'Payment Policy', icon:'💳'},
                            {label:'Cancellation Policy', icon:'❌'},
                            {label:'Inclusions', icon:'✅'},
                            {label:'Exclusions', icon:'❌'},
                            {label:'Contact Info', icon:'📞'},
                            {label:'Emergency Info', icon:'🚨'},
                            {label:'Add tips', icon:'💡'}
                          ].map((opt) => (
                            <button
                              key={opt.label}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-gray-50"
                              onClick={()=>{
                                setShowPackageTermsEventMenu(false)
                                if (opt.label === 'Add tips') {
                                  console.log('Opening Add Tips modal')
                                  setShowTipsModal(true)
                                  return
                                }
                                setPackageTermsItems(prev => [...prev, { type: opt.label, title: opt.label, description: '' }])
                              }}
                            >
                              <span className="w-5 text-center">{opt.icon}</span>
                              <span className="text-gray-800">{opt.label}</span>
                            </button>
                          ))}
                          </div>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => setShowRightSidebar(!showRightSidebar)}
                      className={`px-3 py-1.5 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-all duration-200 flex items-center gap-1 text-sm ${
                        showRightSidebar ? 'bg-blue-100 text-blue-700' : ''
                      }`}
                      title={showRightSidebar ? 'Hide sidebar' : 'Show sidebar'}
                    >
                      <svg 
                        className={`w-4 h-4 transition-transform duration-200 ${showRightSidebar ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="text-sm text-slate-600">
                  {packageTermsItems.length === 0 ? (
                    <div className="text-slate-500">No items yet.</div>
                  ) : (
                    <div className="space-y-3">
                      {packageTermsItems.map((item, idx) => (
                        <div key={idx} className="border border-blue-200 rounded-md p-4 bg-white shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-semibold text-slate-800 text-sm">{item.title}</div>
                            <div className="flex items-center gap-2">
                              <button 
                                className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
                                onClick={() => {
                                  setEditingPackageTerm(item)
                                  setTipsForm({ title: item.title, description: item.description })
                                  setShowTipsModal(true)
                                }}
                              >
                                Edit
                              </button>
                              <button 
                                className="text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50"
                                onClick={async () => {
                                  if (confirm('Are you sure you want to delete this item?')) {
                                    try {
                                      const updatedItems = packageTermsItems.filter((_, i) => i !== idx)
                                      const response = await fetch(`/api/itineraries/${id}`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ packageTerms: updatedItems })
                                      })
                                      
                                      if (response.ok) {
                                        setPackageTermsItems(updatedItems)
                                        console.log('✅ Item deleted successfully')
                                      } else {
                                        alert('Failed to delete item. Please try again.')
                                      }
                                    } catch (error) {
                                      console.error('❌ Error deleting item:', error)
                                      alert('Error deleting item. Please try again.')
                                    }
                                  }
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{__html: item.description || '<em>No description</em>'}} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="flex items-center justify-between mb-4">
              <div className="text-xl font-semibold text-gray-900">Day {days.find(d=>d.id===selectedDayId)?.day_number || ''} → {days.find(d=>d.id===selectedDayId)?.location || ''}</div>
              <div className="flex items-center gap-2">
                <div className="relative" ref={packageTermsMenuRef}>
                  <button
                    onClick={()=>setShowEventMenu(v=>!v)}
                    className="px-3.5 py-1.5 rounded-md bg-blue-600 text-white text-sm shadow-sm hover:bg-blue-700 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Event
                  </button>
                {showEventMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowEventMenu(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
                    {[
                      {label:'Details', icon:'📝'},
                      {label:'Accommodation', icon:'🛏️'},
                      {label:'Activity', icon:'🏞️'},
                      {label:'Transportation', icon:'🚗'},
                      {label:'Visa', icon:'🛂'},
                      {label:'Meal', icon:'🍽️'},
                      {label:'Flight', icon:'✈️'},
                      {label:'Leisure', icon:'🎉'},
                      {label:'Cruise', icon:'⚓'},
                      {label:'Add tips', icon:'💡'}
                    ].map((opt, optIndex) => {
                      // Allow multiple accommodations and transportation, but only one of other event types
                      const allowMultiple = ['Accommodation', 'Transportation', 'Activity', 'Meal', 'Flight', 'Leisure'].includes(opt.label)
                      const existingEvent = !allowMultiple ? events.find(ev => ev.title === opt.label) : null
                      
                      return (
                      <button
                        key={`${opt.label}-${optIndex}`}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm ${
                          existingEvent 
                            ? 'text-gray-400 cursor-not-allowed bg-gray-50' 
                            : 'hover:bg-gray-50'
                        }`}
                        disabled={existingEvent && opt.label !== 'Add tips'}
                        onClick={async ()=>{
                          setShowEventMenu(false)
                          if(!selectedDayId) return
                          
                          // Handle Add tips (not a real event)
                          if (opt.label === 'Add tips') {
                            setShowPackageTerms(true)
                            setShowRightSidebar(true)
                            setShowTips(true)
                            return
                          }
                          
                          // Check if this event type already exists for this day (only for non-multiple event types)
                          if (existingEvent && !allowMultiple) {
                            alert(`${opt.label} already exists for this day. Please edit the existing one instead.`)
                            return
                          }
                          
                          const sort = (events[events.length-1]?.sort_order || 0) + 1
                          
                          // Prepare event data based on type
                          let eventData = {}
                          if (opt.label === 'Accommodation') {
                            const selectedHotel = hotels.find(h => h.name === accForm.hotelName)
                            eventData = {
                              destination: accForm.destination,
                              type: accForm.type,
                              hotelName: accForm.hotelName,
                              category: accForm.category,
                              roomName: accForm.roomName,
                              mealPlan: accForm.mealPlan,
                              hotelOption: accForm.hotelOption,
                              hotelPhoto: selectedHotel?.icon_url || null, // Include hotel image
                              roomCounts: {
                                single: accForm.countSingle,
                                double: accForm.countDouble,
                                triple: accForm.countTriple,
                                quad: accForm.countQuad,
                                cwb: accForm.countCwb,
                                cnb: accForm.countCnb
                              },
                              checkin: {
                                date: accForm.checkinDate,
                                time: accForm.checkinTime,
                                showTime: accForm.showTime
                              },
                              checkout: {
                                date: accForm.checkoutDate,
                                time: accForm.checkoutTime
                              }
                            }
                          } else if (opt.label === 'Activity') {
                            eventData = {
                              destination: activityForm.destination,
                              type: activityForm.type,
                              name: activityForm.name,
                              date: activityForm.date,
                              startTime: activityForm.startTime,
                              endTime: activityForm.endTime,
                              showTime: activityForm.showTime
                            }
                          } else if (opt.label === 'Transportation') {
                            const selectedTransfer = transfers.find(t => t.query_name === transportationForm.name)
                            eventData = {
                              destination: transportationForm.destination,
                              type: transportationForm.type,
                              transferType: transportationForm.transferType,
                              name: transportationForm.name,
                              content: transportationForm.content,
                              transferPhoto: selectedTransfer?.photo_url || null, // Include transfer image
                              date: transportationForm.date,
                              startTime: transportationForm.startTime,
                              endTime: transportationForm.endTime,
                              showTime: transportationForm.showTime
                            }
                          } else if (opt.label === 'Meal') {
                            eventData = {
                              name: mealForm.name,
                              destination: mealForm.destination,
                              mealType: mealForm.mealType,
                              date: mealForm.date,
                              startTime: mealForm.startTime,
                              endTime: mealForm.endTime,
                              showTime: mealForm.showTime
                            }
                          } else if (opt.label === 'Flight') {
                            eventData = {
                              name: flightForm.name,
                              flightNo: flightForm.flightNo,
                              fromDestination: flightForm.fromDestination,
                              toDestination: flightForm.toDestination,
                              flightDuration: flightForm.flightDuration,
                              date: flightForm.date,
                              startTime: flightForm.startTime,
                              endTime: flightForm.endTime
                            }
                          } else if (opt.label === 'Leisure') {
                            eventData = {
                              name: leisureForm.name,
                              destination: leisureForm.destination
                            }
                          }
                          
                          // Auto-save manually entered hotel to database
                          if (opt.label === 'Accommodation' && accForm.type === 'Manual' && accForm.hotelName.trim() && accForm.destination.trim()) {
                            try {
                              // Check if hotel already exists
                              const existingHotels = hotels.filter(h => 
                                h.name.toLowerCase() === accForm.hotelName.toLowerCase() && 
                                h.destination.toLowerCase() === accForm.destination.toLowerCase()
                              )
                              
                              if (existingHotels.length === 0) {
                                // Extract star number from category (e.g., "3 Star" -> 3)
                                const categoryNumber = parseInt(accForm.category.split(' ')[0]) || 3
                                
                                const hotelRes = await fetch('/api/hotels', {
                                  method: 'POST',
                                  headers: {'Content-Type': 'application/json'},
                                  body: JSON.stringify({
                                    name: accForm.hotelName.trim(),
                                    destination: accForm.destination.trim(),
                                    category: categoryNumber,
                                    status: 'Active'
                                  })
                                })
                                
                                if (hotelRes.ok) {
                                  const hotelData = await hotelRes.json()
                                  setHotels(prev => [hotelData.hotel, ...prev])
                                  console.log('✅ Hotel auto-saved to master:', accForm.hotelName)
                                }
                              }
                            } catch (error) {
                              console.error('Failed to auto-save hotel:', error)
                              // Don't block event creation if hotel save fails
                            }
                          }

                          // Auto-save manually entered transportation to database
                          if (opt.label === 'Transportation' && transportationForm.type === 'Manual' && transportationForm.name.trim() && transportationForm.destination.trim()) {
                            try {
                              // Check if transfer already exists
                              const existingTransfers = transfers.filter(t => 
                                t.query_name.toLowerCase() === transportationForm.name.toLowerCase() && 
                                t.destination.toLowerCase() === transportationForm.destination.toLowerCase()
                              )
                              
                              if (existingTransfers.length === 0) {
                                const transferRes = await fetch('/api/transfers', {
                                  method: 'POST',
                                  headers: {'Content-Type': 'application/json'},
                                  body: JSON.stringify({
                                    queryName: transportationForm.name.trim(),
                                    destination: transportationForm.destination.trim(),
                                    content: transportationForm.content.trim(),
                                    status: 'Active'
                                  })
                                })
                                
                                if (transferRes.ok) {
                                  const transferData = await transferRes.json()
                                  setTransfers(prev => [transferData.transfer, ...prev])
                                  console.log('✅ Transportation auto-saved to master:', transportationForm.name)
                                }
                              }
                            } catch (error) {
                              console.error('Failed to auto-save transportation:', error)
                              // Don't block event creation if transportation save fails
                            }
                          }
                          
                          const res = await fetch(`/api/itineraries/days/${selectedDayId}/events`, { 
                            method:'POST', 
                            headers:{'Content-Type':'application/json'}, 
                            body: JSON.stringify({ 
                              title: opt.label, 
                              sortOrder: sort,
                              eventData: eventData
                            }) 
                          })
                          const data = await res.json().catch(()=>({}))
                          if(res.ok) {
                            setEvents(prev=>[...prev, data.event])
                            setEditingEvent(data.event)
                            setEventForm({ title: data.event.title || '', subtitle: data.event.subtitle || '', description: data.event.description || '' })
                            setAccForm({
                              destination: '', type: 'Manual', hotelName: '', category: '1 Star', roomName: '', mealPlan: '', hotelOption: 'Option 1',
                              countSingle: '', countDouble: '1', countTriple: '', countQuad: '', countCwb: '', countCnb: '',
                              checkinDate: '2025-03-31', checkinTime: '2:00 PM', showTime: false,
                              checkoutDate: '2025-03-31', checkoutTime: '11:00 AM'
                            })
                            setActivityForm({
                              destination: '', type: 'Manual', name: '', date: '2025-03-31', 
                              startTime: '1:00 PM', endTime: '2:00 PM', showTime: false
                            })
                            setTransportationForm({
                              destination: '', type: 'Manual', transferType: 'Private', name: '', content: '', price: 0,
                              date: '2025-03-31', startTime: '1:00 PM', endTime: '2:00 PM', showTime: false
                            })
                            setMealForm({
                              name: '', destination: '', mealType: 'BB', 
                              date: '2025-03-31', startTime: '1:00 PM', endTime: '2:00 PM', showTime: false
                            })
                            setFlightForm({
                              name: '', flightNo: '', fromDestination: '', toDestination: '', flightDuration: '',
                              date: '2025-03-31', startTime: '1:00 PM', endTime: '2:00 PM'
                            })
                            setLeisureForm({
                              name: 'Day at Leisure', destination: ''
                            })
                          }
                        }}
                      >
                        <span className="w-5 text-center">{opt.icon}</span>
                        <span className={existingEvent ? 'text-gray-400' : 'text-gray-800'}>{opt.label}</span>
                        {existingEvent && <span className="text-xs text-gray-400 ml-auto">(exists)</span>}
                      </button>
                      )
                    })}
                    </div>
                  </>
                )}
              </div>
              
              {/* Arrow button to toggle right sidebar */}
              <button
                onClick={() => setShowRightSidebar(!showRightSidebar)}
                className={`px-3 py-1.5 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-all duration-200 flex items-center gap-1 text-sm ml-2 ${
                  showRightSidebar ? 'bg-blue-100 text-blue-700' : ''
                }`}
                title={showRightSidebar ? 'Hide sidebar' : 'Show sidebar'}
              >
                <svg 
                  className={`w-4 h-4 transition-transform duration-200 ${showRightSidebar ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            </div>

            <div className="space-y-4">
              {events
                .sort((a, b) => {
                  // Always put "Details" first
                  if (a.title === 'Details' && b.title !== 'Details') return -1
                  if (b.title === 'Details' && a.title !== 'Details') return 1
                  // For other events, maintain original order
                  return a.sort_order - b.sort_order
                })
                .map(ev => {
                  // Parse event data for accommodation events
                  const eventData = ev.event_data ? (typeof ev.event_data === 'string' ? JSON.parse(ev.event_data) : ev.event_data) : {}
                  
                  return (
                    <div key={ev.id}>
                      {ev.title === 'Transportation' && eventData.name ? (
                        // Special transportation card layout
                        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                          {/* Header Section */}
                          <div className="flex items-center justify-between mb-3">
                            {/* Left side - Transfer icon, image, name */}
                            <div className="flex items-center gap-3">
                              {/* Transfer icon container */}
                              <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                                {/* Inner transfer image */}
                                <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center relative">
                                  {(() => {
                                    const transfer = transfers.find(t => t.query_name === eventData.name && t.destination === eventData.destination)
                                    const photoUrl = transfer?.photo_url?.trim()
                                    if (photoUrl && !transferImageErrors[photoUrl]) {
                                      return (
                                        <Image 
                                          src={photoUrl} 
                                          alt={eventData.name}
                                          fill
                                          sizes="32px"
                                          className="object-cover rounded"
                                          unoptimized
                                          onError={() => {
                                            setTransferImageErrors(prev => ({ ...prev, [photoUrl]: true }))
                                          }}
                                        />
                                      )
                                    }
                                    return null
                                  })()}
                                  <div className="w-full h-full bg-gray-300 rounded flex items-center justify-center" style={{display: (() => {
                                    const transfer = transfers.find(t => t.query_name === eventData.name && t.destination === eventData.destination)
                                    const photoUrl = transfer?.photo_url?.trim()
                                    return photoUrl && !transferImageErrors[photoUrl] ? 'none' : 'flex'
                                  })()}}>
                                    <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                                      <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z"/>
                                    </svg>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Transfer name and details */}
                              <div>
                                <div className="font-semibold text-gray-900 text-sm">
                                  {eventData.name}
                                  {eventData.content && (
                                    <span className="ml-2 text-gray-600 font-normal">
                                      {eventData.content}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500">{eventData.destination}</div>
                              </div>
                            </div>
                            
                            {/* Right side - Price, Transfer type badge and edit button */}
                            <div className="flex items-center gap-2">
                              {/* Price display */}
                              {(() => {
                                const transfer = transfers.find(t => t.query_name === eventData.name && t.destination === eventData.destination)
                                const price = transfer?.price || eventData.price || 0
                                return price > 0 ? (
                                  <div className="text-right">
                                    <div className="text-lg font-bold text-green-600">₹{price.toLocaleString()}</div>
                                    <div className="text-xs text-gray-500">total</div>
                                  </div>
                                ) : null
                              })()}
                              <span className="bg-green-100 text-green-600 text-sm px-2 py-1 rounded">{eventData.transferType || 'Private'}</span>
                              <button 
                                className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center"
                                title="Edit Transportation" 
                                onClick={()=>{ setEditingEvent(ev); setEventForm({ title: ev.title || '', subtitle: ev.subtitle || '', description: ev.description || '' }) }}
                              >
                                <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                                </svg>
                              </button>
                            </div>
                          </div>
                          
                          {/* Separator line */}
                          <div className="border-t border-gray-200 mb-3"></div>
                          
                          {/* Content Section */}
                          <div className="space-y-2">
                            {/* Date and Time */}
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                                </svg>
                                <span className="text-gray-600">{eventData.date || 'Not specified'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                                </svg>
                                <span className="text-gray-600">{eventData.startTime || 'Not specified'} - {eventData.endTime || 'Not specified'}</span>
                              </div>
                            </div>
                            
                            {/* Description */}
                            {ev.description && (
                              <div className="text-sm text-gray-700 mt-2">
                                <div dangerouslySetInnerHTML={{ __html: ev.description || 'No description yet.' }} />
                              </div>
                            )}
                          </div>
                          
                          {/* Delete button */}
                          <div className="flex justify-end mt-3">
                            <button 
                              className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50" 
                              title="Delete Transportation" 
                              onClick={async ()=>{
                                if (confirm(`Are you sure you want to delete "${ev.title}"?`)) {
                                  const res = await fetch(`/api/itineraries/days/${ev.day_id}/events?eventId=${ev.id}`, {
                                    method: 'DELETE'
                                  })
                                  if (res.ok) {
                                    setEvents(prev => prev.filter(event => event.id !== ev.id))
                                  } else {
                                    const error = await res.json().catch(() => ({}))
                                    alert(`Failed to delete: ${error.error || 'Unknown error'}`)
                                  }
                                }
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ) : ev.title === 'Accommodation' && eventData.hotelName ? (
                        // Special accommodation card layout - exact match to design
                        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                          {/* Header Section */}
                          <div className="flex items-center justify-between mb-3">
                            {/* Left side - Hotel icon, image, name, rating */}
                            <div className="flex items-center gap-3">
                              {/* Hotel icon container */}
                              <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                                {/* Inner hotel image */}
                                <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center relative">
                                  {/* Check if hotel has an image */}
                                  {(() => {
                                    const hotel = hotels.find(h => h.name === eventData.hotelName)
                                    const iconUrl = hotel?.icon_url?.trim()
                                    if (iconUrl && !hotelImageErrors[iconUrl]) {
                                      return (
                                        <Image 
                                          src={iconUrl} 
                                          alt={eventData.hotelName}
                                          fill
                                          sizes="32px"
                                          className="object-cover rounded"
                                          unoptimized
                                          onError={() => {
                                            setHotelImageErrors(prev => ({ ...prev, [iconUrl]: true }))
                                          }}
                                        />
                                      )
                                    }
                                    
                                    return (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
                                        </svg>
                                      </div>
                                    )
                                  })()}
                                  
                                  {/* Edit image button */}
                                  <button 
                                    className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-200 rounded-full flex items-center justify-center hover:bg-blue-300 transition-colors"
                                    title="Upload Hotel Image"
                                    onClick={() => {
                                      // TODO: Implement image upload functionality
                                      alert('Image upload functionality will be implemented in the Hotels admin page')
                                    }}
                                  >
                                    <svg className="w-2 h-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                                    </svg>
                                  </button>
                                </div>
                              </div>
                              
                              {/* Hotel name and rating */}
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold text-gray-900">{eventData.hotelName}</h3>
                                <div className="flex items-center">
                                  {Array.from({ length: 5 }, (_, i) => {
                                    // Parse category properly - handle both "3" and "3 Star" formats
                                    let starCount = 3
                                    if (eventData.category) {
                                      const categoryStr = eventData.category.toString()
                                      const match = categoryStr.match(/(\d+)/)
                                      if (match) {
                                        starCount = parseInt(match[1])
                                      }
                                    }
                                    return (
                                      <svg key={i} className={`w-4 h-4 ${i < starCount ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                      </svg>
                                    )
                                  })}
                                </div>
                              </div>
                            </div>
                            
                            {/* Right side - Price, Option badge and edit button */}
                            <div className="flex items-center gap-2">
                              
                              <span className="bg-blue-100 text-blue-600 text-sm px-2 py-1 rounded">{eventData.hotelOption || 'Option 1'}</span>
                              <button 
                                className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center"
                                title="Edit Accommodation" 
                                onClick={()=>{ 
                                  setEditingEvent(ev); 
                                  setEventForm({ title: ev.title || '', subtitle: ev.subtitle || '', description: ev.description || '' });
                                  // Populate accommodation form with existing data
                                  if (ev.event_data) {
                                    setAccForm({
                                      destination: ev.event_data.destination || '',
                                      type: ev.event_data.type || 'Manual',
                                      hotelName: ev.event_data.hotelName || '',
                                      category: ev.event_data.category || '1 Star',
                                      roomName: ev.event_data.roomName || '',
                                      mealPlan: ev.event_data.mealPlan || '',
                                      hotelOption: ev.event_data.hotelOption || 'Option 1',
                                      countSingle: ev.event_data.roomCounts?.single || '',
                                      countDouble: ev.event_data.roomCounts?.double || '1',
                                      countTriple: ev.event_data.roomCounts?.triple || '',
                                      countQuad: ev.event_data.roomCounts?.quad || '',
                                      countCwb: ev.event_data.roomCounts?.cwb || '',
                                      countCnb: ev.event_data.roomCounts?.cnb || '',
                                      checkinDate: ev.event_data.checkin?.date || '2025-03-31',
                                      checkinTime: ev.event_data.checkin?.time || '2:00 PM',
                                      showTime: ev.event_data.checkin?.showTime || false,
                                      checkoutDate: ev.event_data.checkout?.date || '2025-03-31',
                                      checkoutTime: ev.event_data.checkout?.time || '11:00 AM'
                                    });
                                  }
                                }}
                              >
                                <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                                </svg>
                              </button>
                            </div>
                          </div>
                          
                          {/* Separator line */}
                          <div className="border-t border-gray-200 mb-3"></div>
                          
                          {/* Details Section */}
                          <div className="space-y-2">
                            {/* First row - Check-in, Check-out, Room Type */}
                            <div className="flex items-center">
                              <div className="flex items-center gap-2 pr-4 border-r border-gray-200">
                                <span className="text-sm text-gray-600">Check-in</span>
                                <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                                </svg>
                                <span className="text-sm text-gray-900">{eventData.checkin?.date || 'Not set'}</span>
                              </div>
                              <div className="flex items-center gap-2 px-4 border-r border-gray-200">
                                <span className="text-sm text-gray-600">Check-out</span>
                                <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                                </svg>
                                <span className="text-sm text-gray-900">{eventData.checkout?.date || 'Not set'}</span>
                              </div>
                              <div className="flex items-center gap-2 pl-4 min-w-0">
                                <span className="text-sm text-gray-600">Room Type</span>
                                <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
                                </svg>
                                <span className="text-sm text-gray-900 truncate">{eventData.roomName || 'Not specified'}</span>
                              </div>
                            </div>
                            
                            {/* Second row - Room details and Meal plan */}
                            <div className="flex items-start">
                              {/* Room details */}
                              <div className="flex flex-col gap-1 pr-4 border-r border-gray-200">
                                {eventData.roomCounts && (
                                  <>
                                    {eventData.roomCounts.double && eventData.roomCounts.double !== '0' && (
                                      <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                                        </svg>
                                        <span className="text-sm text-gray-900">Room: {eventData.roomCounts.double} Double</span>
                                      </div>
                                    )}
                                    {eventData.roomCounts.triple && eventData.roomCounts.triple !== '0' && (
                                      <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                                        </svg>
                                        <span className="text-sm text-gray-900">Room: {eventData.roomCounts.triple} Triple</span>
                                      </div>
                                    )}
                                    {eventData.roomCounts.single && eventData.roomCounts.single !== '0' && (
                                      <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                                        </svg>
                                        <span className="text-sm text-gray-900">Room: {eventData.roomCounts.single} Single</span>
                                      </div>
                                    )}
                                    {eventData.roomCounts.quad && eventData.roomCounts.quad !== '0' && (
                                      <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                                        </svg>
                                        <span className="text-sm text-gray-900">Room: {eventData.roomCounts.quad} Quad</span>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                              
                              {/* Meal plan */}
                              <div className="flex items-center gap-2 pl-4 min-w-0">
                                <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M3 3a1 1 0 000 2v11a2 2 0 002 2h2a2 2 0 002-2V5a1 1 0 100-2H3zM14 3a1 1 0 011 1v11a2 2 0 01-2 2h-2a2 2 0 01-2-2V4a1 1 0 011-1h4z"/>
                                </svg>
                                <span className="text-sm text-gray-900 truncate">Meal: {eventData.mealPlan || 'Not specified'}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Delete button */}
                          <div className="flex justify-end mt-3">
                            <button 
                              className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50" 
                              title="Delete Accommodation" 
                              onClick={async ()=>{
                                if (confirm(`Are you sure you want to delete "${ev.title}"?`)) {
                                  const res = await fetch(`/api/itineraries/days/${ev.day_id}/events?eventId=${ev.id}`, {
                                    method: 'DELETE'
                                  })
                                  if (res.ok) {
                                    setEvents(prev => prev.filter(event => event.id !== ev.id))
                                  } else {
                                    const error = await res.json().catch(() => ({}))
                                    alert(`Failed to delete: ${error.error || 'Unknown error'}`)
                                  }
                                }
                              }}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Default event layout for other event types
                        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-gray-900">{ev.title}</div>
                            <div className="flex items-center gap-1">
                              <button 
                                className="text-gray-500 hover:text-gray-700 text-sm" 
                                title="Edit" 
                                onClick={()=>{ setEditingEvent(ev); setEventForm({ title: ev.title || '', subtitle: ev.subtitle || '', description: ev.description || '' }) }}
                              >
                                ✎
                              </button>
                              <button 
                                className="text-red-500 hover:text-red-700 text-xs" 
                                title="Delete" 
                                onClick={async ()=>{
                                  if (confirm(`Are you sure you want to delete "${ev.title}"?`)) {
                                    const res = await fetch(`/api/itineraries/days/${ev.day_id}/events?eventId=${ev.id}`, {
                                      method: 'DELETE'
                                    })
                                    if (res.ok) {
                                      setEvents(prev => prev.filter(event => event.id !== ev.id))
                                    } else {
                                      const error = await res.json().catch(() => ({}))
                                      alert(`Failed to delete: ${error.error || 'Unknown error'}`)
                                    }
                                  }
                                }}
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                          {ev.subtitle && <div className="text-sm text-gray-600 mt-1">{ev.subtitle}</div>}
                          <div 
                            className="text-sm text-gray-700 mt-2"
                            dangerouslySetInnerHTML={{ 
                              __html: ev.description || 'No description yet.' 
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              {events.length===0 && (
                <div className="text-sm text-gray-500">No events yet.</div>
              )}
            </div>
          </div>

          {/* Right tools panel - conditionally rendered */}
          {showRightSidebar && (
            <div className="col-span-3 p-4 bg-slate-50 animate-slideIn">
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Search"
                className="w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm"
              />

              <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800 shadow-sm bg-white">
                <option>Day Itinerary</option>
                <option>Accommodation</option>
                <option>Activity</option>
                <option>Transportation</option>
                <option>Insurance / Visa</option>
                <option>Meal</option>
                <option>Flight</option>
                <option>Leisure</option>
                <option>Cruise</option>
              </select>

              <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-md shadow-sm">+ Add Accommodation</button>

              <div className="text-sm text-gray-600">Suggested Accommodation in <span className="font-semibold">{days.find(d=>d.id===selectedDayId)?.location || '-'}</span></div>

              {/* Suggestions list placeholder */}
              <div className="space-y-3">
                {[1,2].map((i)=> (
                  <div key={i} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <div className="flex p-3 items-center gap-3">
                      <div className="h-14 w-14 bg-gray-200 rounded" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">Hotel {i}</div>
                        <div className="text-yellow-500 text-sm leading-none">★★★</div>
                      </div>
                      <button title="Add" className="h-9 w-9 rounded-full bg-gray-900 text-white flex items-center justify-center shadow">
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

    {/* Add Tips Modal */}
    {showTipsModal && (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={()=>setShowTipsModal(false)} />
        <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">{editingPackageTerm ? 'Edit Tips' : 'Add Tips'}</h3>
            <button className="text-slate-500 hover:text-slate-700 text-xl" onClick={()=>{
              setShowTipsModal(false)
              setEditingPackageTerm(null)
              setTipsForm({ title: 'Inclusions & Exclusions', description: '' })
            }}>✕</button>
          </div>
          <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title*</label>
              <input
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={tipsForm.title}
                onChange={e=>setTipsForm({...tipsForm, title: e.target.value})}
                placeholder="Inclusions & Exclusions"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description*</label>
              <div className="border border-gray-300 rounded-md max-h-96 overflow-auto w-full">
                <div className="w-full min-w-0" style={{wordWrap: 'break-word', overflowWrap: 'break-word'}}>
                  <QuillEditor
                    value={tipsForm.description}
                    onChange={(html: string) => setTipsForm({...tipsForm, description: html})}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 border-t">
            <button className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600" onClick={()=>{ 
              setTipsForm({ title: 'Inclusions & Exclusions', description: '' })
            }}>Delete</button>
            <div className="space-x-2">
              <button className="px-4 py-2 bg-slate-100 rounded-md hover:bg-slate-200" onClick={()=>setShowTipsModal(false)}>Cancel</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700" onClick={async ()=>{ 
                try {
                  console.log('Saving tips to database:', tipsForm)
                  
                  let updatedItems
                  if (editingPackageTerm) {
                    // Editing existing item
                    updatedItems = packageTermsItems.map(item => 
                      item === editingPackageTerm 
                        ? { ...item, title: tipsForm.title, description: tipsForm.description }
                        : item
                    )
                  } else {
                    // Adding new item
                    updatedItems = [...packageTermsItems, { 
                      type: 'Add tips', 
                      title: tipsForm.title, 
                      description: tipsForm.description 
                    }]
                  }
                  
                  // Save to database
                  const response = await fetch(`/api/itineraries/${id}`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      packageTerms: updatedItems
                    })
                  })
                  
                  if (response.ok) {
                    console.log('✅ Tips saved to database successfully')
                    // Update local state
                    setPackageTermsItems(updatedItems)
                    setShowTipsModal(false)
                    setEditingPackageTerm(null)
                    // Reset form
                    setTipsForm({ title: 'Inclusions & Exclusions', description: '' })
                  } else {
                    console.error('❌ Failed to save tips to database')
                    alert('Failed to save tips. Please try again.')
                  }
                } catch (error) {
                  console.error('❌ Error saving tips:', error)
                  alert('Error saving tips. Please try again.')
                }
              }}>Save</button>
            </div>
          </div>
        </div>
      </div>
    )}

      {/* Edit Event Modal */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={()=>setEditingEvent(null)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                {editingEvent.title === 'Details' ? `Day ${days.find(d=>d.id===editingEvent.day_id)?.day_number || ''} Details` : 
                 editingEvent.title === 'Accommodation' ? `Accommodation in day ${days.find(d=>d.id===editingEvent.day_id)?.day_number || ''}` : 
                 editingEvent.title === 'Activity' ? `Activity in day ${days.find(d=>d.id===editingEvent.day_id)?.day_number || ''}` :
                 editingEvent.title === 'Transportation' ? `Transportation in day ${days.find(d=>d.id===editingEvent.day_id)?.day_number || ''}` :
                 editingEvent.title === 'Meal' ? `Meal in day ${days.find(d=>d.id===editingEvent.day_id)?.day_number || ''}` :
                 editingEvent.title === 'Flight' ? `Flight in day ${days.find(d=>d.id===editingEvent.day_id)?.day_number || ''}` :
                 editingEvent.title === 'Leisure' ? `Leisure in day ${days.find(d=>d.id===editingEvent.day_id)?.day_number || ''}` :
                 `Edit ${editingEvent.title}`}
              </h3>
              <button 
                onClick={()=>setEditingEvent(null)} 
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 max-h-96 overflow-y-auto">
              {editingEvent.title === 'Accommodation' ? (
                <div className="space-y-6">
                  {/* General Accommodation Details */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">General Accommodation Details</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Destination</label>
                        <select 
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={accForm.destination}
                          onChange={e => setAccForm({...accForm, destination: e.target.value})}
                        >
                          <option value="">Select destination</option>
                          {itineraryDestinations.map(dest => (
                            <option key={dest} value={dest}>{dest}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                        <select 
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={accForm.type}
                          onChange={e => setAccForm({...accForm, type: e.target.value})}
                        >
                          <option value="Manual">Manual</option>
                          <option value="From Master">From Master</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Hotel Name</label>
                        {accForm.type === 'From Master' ? (
                          <select 
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={accForm.hotelName}
                            onChange={e => {
                              const selectedHotel = hotels.find(h => h.name === e.target.value)
                              setAccForm({
                                ...accForm, 
                                hotelName: e.target.value,
                                category: selectedHotel ? `${selectedHotel.category} Star` : accForm.category
                              })
                            }}
                          >
                            <option value="">Select hotel from master</option>
                            {masterHotelsForAccommodation
                              .map((hotel, idx) => (
                                <option key={idx} value={hotel.name}>
                                  {hotel.name} ({hotel.category} ⭐) - ₹{hotel.price || 0}
                                </option>
                              ))}
                          </select>
                        ) : (
                          <input 
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={accForm.hotelName}
                            onChange={e => setAccForm({...accForm, hotelName: e.target.value})}
                            placeholder="Enter hotel name"
                          />
                        )}

                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                        <select 
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={accForm.category}
                          onChange={e => setAccForm({...accForm, category: e.target.value})}
                          disabled={accForm.type === 'From Master'}
                        >
                          <option value="1 Star">1 Star</option>
                          <option value="2 Star">2 Star</option>
                          <option value="3 Star">3 Star</option>
                          <option value="4 Star">4 Star</option>
                          <option value="5 Star">5 Star</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Room Type</label>
                        <select
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={accForm.roomName}
                          onChange={e => setAccForm({ ...accForm, roomName: e.target.value })}
                        >
                          <option value="">Select room type</option>
                          {roomTypes.map(rt => (
                            <option key={rt.id} value={rt.name}>{rt.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Meal Plan</label>
                        {accForm.type === 'From Master' ? (
                          <select 
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={accForm.mealPlan}
                            onChange={e => setAccForm({...accForm, mealPlan: e.target.value})}
                          >
                            <option value="">Select meal plan from master</option>
                            {mealPlans
                              .filter(mp => !accForm.destination || mp.destination === accForm.destination)
                              .map((mealPlan, idx) => (
                                <option key={idx} value={mealPlan.meal_type}>
                                  {mealPlan.name} ({mealPlan.meal_type})
                                </option>
                              ))}
                          </select>
                        ) : (
                          <input 
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={accForm.mealPlan}
                            onChange={e => setAccForm({...accForm, mealPlan: e.target.value})}
                            placeholder="Enter meal plan"
                          />
                        )}
                      </div>
                      
                      
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Hotel Option</label>
                        <select 
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={accForm.hotelOption}
                          onChange={e => setAccForm({...accForm, hotelOption: e.target.value})}
                        >
                          <option value="Option 1">Option 1</option>
                          <option value="Option 2">Option 2</option>
                          <option value="Option 3">Option 3</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Matched Rates (from Hotel Rates master) */}
                  <div className="space-y-2">
                    <h4 className="text-lg font-semibold text-gray-900">Available Rates</h4>
                    {(() => {
                      const checkin = accForm.checkinDate
                      const checkout = accForm.checkoutDate
                      const roomType = accForm.roomName
                      const meal = accForm.mealPlan
                      const inRange = (rate: any) => {
                        if (!checkin || !checkout) return true
                        const s = new Date(rate.from_date || rate.fromDate || rate.start_date || rate.startDate)
                        const e = new Date(rate.to_date || rate.toDate || rate.end_date || rate.endDate)
                        const ci = new Date(checkin)
                        const co = new Date(checkout)
                        return !(co < s || ci > e)
                      }
                      const filtered = hotelRates.filter(r => inRange(r))
                        .filter(r => !roomType || (r.room_type || r.roomType) === roomType)
                        .filter(r => !meal || (r.meal_plan || r.mealPlan) === meal)
                        .slice(0, 5)
                      if (filtered.length === 0) {
                        return <div className="text-sm text-gray-500">No matching rates found for the selected inputs.</div>
                      }
                      return (
                        <div className="overflow-x-auto border rounded">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left">From</th>
                                <th className="px-3 py-2 text-left">To</th>
                                <th className="px-3 py-2 text-left">Room Type</th>
                                <th className="px-3 py-2 text-left">Meal Plan</th>
                                <th className="px-3 py-2 text-right">Single</th>
                                <th className="px-3 py-2 text-right">Double</th>
                                <th className="px-3 py-2 text-right">Triple</th>
                                <th className="px-3 py-2 text-right">Quad</th>
                                <th className="px-3 py-2 text-right">CWB</th>
                                <th className="px-3 py-2 text-right">CNB</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {filtered.map((r, idx) => (
                                <tr key={idx}>
                                  <td className="px-3 py-2">{r.from_date_formatted || r.from_date || r.fromDate?.substring(0,10)}</td>
                                  <td className="px-3 py-2">{r.to_date_formatted || r.to_date || r.toDate?.substring(0,10)}</td>
                                  <td className="px-3 py-2">{r.room_type || r.roomType}</td>
                                  <td className="px-3 py-2">{r.meal_plan || r.mealPlan}</td>
                                  <td className="px-3 py-2 text-right">{r.single ?? '-'}</td>
                                  <td className="px-3 py-2 text-right">{r.double ?? '-'}</td>
                                  <td className="px-3 py-2 text-right">{r.triple ?? '-'}</td>
                                  <td className="px-3 py-2 text-right">{r.quad ?? '-'}</td>
                                  <td className="px-3 py-2 text-right">{r.cwb ?? '-'}</td>
                                  <td className="px-3 py-2 text-right">{r.cnb ?? '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )
                    })()}
                  </div>

                  {/* Number of Rooms Section */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">Enter Number of Rooms</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Single</label>
                        <input 
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={accForm.countSingle}
                          onChange={e => setExclusiveRoomCount('countSingle', e.target.value)}
                          placeholder="0"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Double</label>
                        <input 
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={accForm.countDouble}
                          onChange={e => setExclusiveRoomCount('countDouble', e.target.value)}
                          placeholder="0"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Triple</label>
                        <input 
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={accForm.countTriple}
                          onChange={e => setExclusiveRoomCount('countTriple', e.target.value)}
                          placeholder="0"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Quad</label>
                        <input 
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={accForm.countQuad}
                          onChange={e => setExclusiveRoomCount('countQuad', e.target.value)}
                          placeholder="0"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">CWB</label>
                        <input 
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={accForm.countCwb}
                          onChange={e => setExclusiveRoomCount('countCwb', e.target.value)}
                          placeholder="0"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">CNB</label>
                        <input 
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={accForm.countCnb}
                          onChange={e => setExclusiveRoomCount('countCnb', e.target.value)}
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Check-in/Check-out Details */}
                  <div className="space-y-4 border border-orange-200 bg-orange-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900">Check-in/Check-out Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Check-in date*</label>
                        <input 
                          type="date"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={accForm.checkinDate}
                          onChange={e => setAccForm({...accForm, checkinDate: e.target.value})}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Check-in time</label>
                        <select 
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={accForm.checkinTime}
                          onChange={e => setAccForm({...accForm, checkinTime: e.target.value})}
                        >
                          <option value="12:00 AM">12:00 AM</option>
                          <option value="1:00 AM">1:00 AM</option>
                          <option value="2:00 AM">2:00 AM</option>
                          <option value="3:00 AM">3:00 AM</option>
                          <option value="4:00 AM">4:00 AM</option>
                          <option value="5:00 AM">5:00 AM</option>
                          <option value="6:00 AM">6:00 AM</option>
                          <option value="7:00 AM">7:00 AM</option>
                          <option value="8:00 AM">8:00 AM</option>
                          <option value="9:00 AM">9:00 AM</option>
                          <option value="10:00 AM">10:00 AM</option>
                          <option value="11:00 AM">11:00 AM</option>
                          <option value="12:00 PM">12:00 PM</option>
                          <option value="1:00 PM">1:00 PM</option>
                          <option value="2:00 PM">2:00 PM</option>
                          <option value="3:00 PM">3:00 PM</option>
                          <option value="4:00 PM">4:00 PM</option>
                          <option value="5:00 PM">5:00 PM</option>
                          <option value="6:00 PM">6:00 PM</option>
                          <option value="7:00 PM">7:00 PM</option>
                          <option value="8:00 PM">8:00 PM</option>
                          <option value="9:00 PM">9:00 PM</option>
                          <option value="10:00 PM">10:00 PM</option>
                          <option value="11:00 PM">11:00 PM</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center">
                        <input 
                          type="checkbox"
                          className="mr-2"
                          checked={accForm.showTime}
                          onChange={e => setAccForm({...accForm, showTime: e.target.checked})}
                        />
                        <label className="text-sm font-medium text-gray-700">Show Time</label>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Check-out date*</label>
                        <input 
                          type="date"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={accForm.checkoutDate}
                          onChange={e => setAccForm({...accForm, checkoutDate: e.target.value})}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Check-out time</label>
                        <select 
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={accForm.checkoutTime}
                          onChange={e => setAccForm({...accForm, checkoutTime: e.target.value})}
                        >
                          <option value="12:00 AM">12:00 AM</option>
                          <option value="1:00 AM">1:00 AM</option>
                          <option value="2:00 AM">2:00 AM</option>
                          <option value="3:00 AM">3:00 AM</option>
                          <option value="4:00 AM">4:00 AM</option>
                          <option value="5:00 AM">5:00 AM</option>
                          <option value="6:00 AM">6:00 AM</option>
                          <option value="7:00 AM">7:00 AM</option>
                          <option value="8:00 AM">8:00 AM</option>
                          <option value="9:00 AM">9:00 AM</option>
                          <option value="10:00 AM">10:00 AM</option>
                          <option value="11:00 AM">11:00 AM</option>
                          <option value="12:00 PM">12:00 PM</option>
                          <option value="1:00 PM">1:00 PM</option>
                          <option value="2:00 PM">2:00 PM</option>
                          <option value="3:00 PM">3:00 PM</option>
                          <option value="4:00 PM">4:00 PM</option>
                          <option value="5:00 PM">5:00 PM</option>
                          <option value="6:00 PM">6:00 PM</option>
                          <option value="7:00 PM">7:00 PM</option>
                          <option value="8:00 PM">8:00 PM</option>
                          <option value="9:00 PM">9:00 PM</option>
                          <option value="10:00 PM">10:00 PM</option>
                          <option value="11:00 PM">11:00 PM</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Description Section */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">Description</h4>
                    <div className="border border-gray-300 rounded-md overflow-hidden" dir="ltr">
                      <QuillEditor
                        value={eventForm.description || ''}
                        onChange={(content) => setEventForm({...eventForm, description: content})}
                      />
                    </div>
                  </div>
                </div>
              ) : editingEvent.title === 'Activity' ? (
                <div className="space-y-6">
                  {/* Basic Activity Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Destination</label>
                      <select 
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={activityForm.destination}
                        onChange={e => setActivityForm({...activityForm, destination: e.target.value})}
                      >
                        <option value="">Select destination</option>
                        {destinations.map(dest => (
                          <option key={dest} value={dest}>{dest}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                      <select 
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={activityForm.type}
                        onChange={e => setActivityForm({...activityForm, type: e.target.value})}
                      >
                        <option value="Manual">Manual</option>
                        <option value="From Master">From Master</option>
                      </select>
                    </div>
                    
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                      <input 
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={activityForm.name}
                        onChange={e => setActivityForm({...activityForm, name: e.target.value})}
                        placeholder="Enter activity name"
                      />
                    </div>
                  </div>

                  {/* Date & Time Section */}
                  <div className="space-y-4 border border-orange-200 bg-orange-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900">Date & Time</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date*</label>
                        <input 
                          type="date"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={activityForm.date}
                          onChange={e => setActivityForm({...activityForm, date: e.target.value})}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Start time</label>
                        <select 
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={activityForm.startTime}
                          onChange={e => setActivityForm({...activityForm, startTime: e.target.value})}
                        >
                          <option value="12:00 AM">12:00 AM</option>
                          <option value="1:00 AM">1:00 AM</option>
                          <option value="2:00 AM">2:00 AM</option>
                          <option value="3:00 AM">3:00 AM</option>
                          <option value="4:00 AM">4:00 AM</option>
                          <option value="5:00 AM">5:00 AM</option>
                          <option value="6:00 AM">6:00 AM</option>
                          <option value="7:00 AM">7:00 AM</option>
                          <option value="8:00 AM">8:00 AM</option>
                          <option value="9:00 AM">9:00 AM</option>
                          <option value="10:00 AM">10:00 AM</option>
                          <option value="11:00 AM">11:00 AM</option>
                          <option value="12:00 PM">12:00 PM</option>
                          <option value="1:00 PM">1:00 PM</option>
                          <option value="2:00 PM">2:00 PM</option>
                          <option value="3:00 PM">3:00 PM</option>
                          <option value="4:00 PM">4:00 PM</option>
                          <option value="5:00 PM">5:00 PM</option>
                          <option value="6:00 PM">6:00 PM</option>
                          <option value="7:00 PM">7:00 PM</option>
                          <option value="8:00 PM">8:00 PM</option>
                          <option value="9:00 PM">9:00 PM</option>
                          <option value="10:00 PM">10:00 PM</option>
                          <option value="11:00 PM">11:00 PM</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">End time</label>
                        <select 
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={activityForm.endTime}
                          onChange={e => setActivityForm({...activityForm, endTime: e.target.value})}
                        >
                          <option value="12:00 AM">12:00 AM</option>
                          <option value="1:00 AM">1:00 AM</option>
                          <option value="2:00 AM">2:00 AM</option>
                          <option value="3:00 AM">3:00 AM</option>
                          <option value="4:00 AM">4:00 AM</option>
                          <option value="5:00 AM">5:00 AM</option>
                          <option value="6:00 AM">6:00 AM</option>
                          <option value="7:00 AM">7:00 AM</option>
                          <option value="8:00 AM">8:00 AM</option>
                          <option value="9:00 AM">9:00 AM</option>
                          <option value="10:00 AM">10:00 AM</option>
                          <option value="11:00 AM">11:00 AM</option>
                          <option value="12:00 PM">12:00 PM</option>
                          <option value="1:00 PM">1:00 PM</option>
                          <option value="2:00 PM">2:00 PM</option>
                          <option value="3:00 PM">3:00 PM</option>
                          <option value="4:00 PM">4:00 PM</option>
                          <option value="5:00 PM">5:00 PM</option>
                          <option value="6:00 PM">6:00 PM</option>
                          <option value="7:00 PM">7:00 PM</option>
                          <option value="8:00 PM">8:00 PM</option>
                          <option value="9:00 PM">9:00 PM</option>
                          <option value="10:00 PM">10:00 PM</option>
                          <option value="11:00 PM">11:00 PM</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center">
                        <input 
                          type="checkbox"
                          className="mr-2"
                          checked={activityForm.showTime}
                          onChange={e => setActivityForm({...activityForm, showTime: e.target.checked})}
                        />
                        <label className="text-sm font-medium text-gray-700">Show Time</label>
                      </div>
                    </div>
                  </div>

                  {/* Description Section */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">Description</h4>
                    <div className="border border-gray-300 rounded-md overflow-hidden" dir="ltr">
                      <QuillEditor
                        value={eventForm.description || ''}
                        onChange={(content) => setEventForm({...eventForm, description: content})}
                      />
                    </div>
                  </div>
                </div>
              ) : editingEvent.title === 'Transportation' ? (
                <div className="space-y-6">
                  {/* Basic Transportation Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Destination</label>
                      <select 
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={transportationForm.destination}
                        onChange={e => setTransportationForm({...transportationForm, destination: e.target.value})}
                      >
                        <option value="">Select destination</option>
                        {destinations.map(dest => (
                          <option key={dest} value={dest}>{dest}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                      <select 
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={transportationForm.type}
                        onChange={e => setTransportationForm({...transportationForm, type: e.target.value})}
                      >
                        <option value="Manual">Manual</option>
                        <option value="From Master">From Master</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Transfer Type</label>
                      {transportationForm.type === 'From Master' ? (
                        <select 
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={transportationForm.transferType}
                          onChange={e => setTransportationForm({...transportationForm, transferType: e.target.value})}
                        >
                          <option value="Private">Private</option>
                          <option value="Shared">Shared</option>
                          <option value="Public">Public</option>
                          <option value="Group">Group</option>
                        </select>
                      ) : (
                        <select 
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={transportationForm.transferType}
                          onChange={e => setTransportationForm({...transportationForm, transferType: e.target.value})}
                        >
                          <option value="Private">Private</option>
                          <option value="Shared">Shared</option>
                          <option value="Public">Public</option>
                          <option value="Group">Group</option>
                        </select>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                      {transportationForm.type === 'From Master' ? (
                        <select 
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={transportationForm.name}
                          onChange={e => {
                            const selectedTransfer = transfers.find(t => t.query_name === e.target.value)
                            setTransportationForm({
                              ...transportationForm, 
                              name: e.target.value,
                              content: selectedTransfer?.content || '',
                              price: selectedTransfer?.price || 0
                            })
                          }}
                        >
                          <option value="">Select transportation</option>
                          {transfers
                            .filter(t => t.destination === transportationForm.destination)
                            .map(transfer => (
                              <option key={transfer.id} value={transfer.query_name}>
                                {transfer.query_name} - ₹{transfer.price}
                              </option>
                            ))
                          }
                        </select>
                      ) : (
                        <input 
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={transportationForm.name}
                          onChange={e => setTransportationForm({...transportationForm, name: e.target.value})}
                          placeholder="Enter transportation name"
                        />
                      )}
                    </div>
                    
                    {/* Content Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                      <input 
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={transportationForm.content}
                        onChange={e => setTransportationForm({...transportationForm, content: e.target.value})}
                        placeholder="Enter content (e.g., CRYSTA 4N/5D MAV)"
                      />
                    </div>
                    
                    {/* Price Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹)</label>
                      <input 
                        type="number"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={transportationForm.price || ''}
                        onChange={e => setTransportationForm({...transportationForm, price: parseFloat(e.target.value) || 0})}
                        placeholder="Enter price"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  {/* Date & Time Section */}
                  <div className="space-y-4 border border-orange-200 bg-orange-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900">Date & Time</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date*</label>
                        <input 
                          type="date"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={transportationForm.date}
                          onChange={e => setTransportationForm({...transportationForm, date: e.target.value})}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Start time</label>
                        <select 
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={transportationForm.startTime}
                          onChange={e => setTransportationForm({...transportationForm, startTime: e.target.value})}
                        >
                          <option value="12:00 AM">12:00 AM</option>
                          <option value="1:00 AM">1:00 AM</option>
                          <option value="2:00 AM">2:00 AM</option>
                          <option value="3:00 AM">3:00 AM</option>
                          <option value="4:00 AM">4:00 AM</option>
                          <option value="5:00 AM">5:00 AM</option>
                          <option value="6:00 AM">6:00 AM</option>
                          <option value="7:00 AM">7:00 AM</option>
                          <option value="8:00 AM">8:00 AM</option>
                          <option value="9:00 AM">9:00 AM</option>
                          <option value="10:00 AM">10:00 AM</option>
                          <option value="11:00 AM">11:00 AM</option>
                          <option value="12:00 PM">12:00 PM</option>
                          <option value="1:00 PM">1:00 PM</option>
                          <option value="2:00 PM">2:00 PM</option>
                          <option value="3:00 PM">3:00 PM</option>
                          <option value="4:00 PM">4:00 PM</option>
                          <option value="5:00 PM">5:00 PM</option>
                          <option value="6:00 PM">6:00 PM</option>
                          <option value="7:00 PM">7:00 PM</option>
                          <option value="8:00 PM">8:00 PM</option>
                          <option value="9:00 PM">9:00 PM</option>
                          <option value="10:00 PM">10:00 PM</option>
                          <option value="11:00 PM">11:00 PM</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">End time</label>
                        <select 
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={transportationForm.endTime}
                          onChange={e => setTransportationForm({...transportationForm, endTime: e.target.value})}
                        >
                          <option value="12:00 AM">12:00 AM</option>
                          <option value="1:00 AM">1:00 AM</option>
                          <option value="2:00 AM">2:00 AM</option>
                          <option value="3:00 AM">3:00 AM</option>
                          <option value="4:00 AM">4:00 AM</option>
                          <option value="5:00 AM">5:00 AM</option>
                          <option value="6:00 AM">6:00 AM</option>
                          <option value="7:00 AM">7:00 AM</option>
                          <option value="8:00 AM">8:00 AM</option>
                          <option value="9:00 AM">9:00 AM</option>
                          <option value="10:00 AM">10:00 AM</option>
                          <option value="11:00 AM">11:00 AM</option>
                          <option value="12:00 PM">12:00 PM</option>
                          <option value="1:00 PM">1:00 PM</option>
                          <option value="2:00 PM">2:00 PM</option>
                          <option value="3:00 PM">3:00 PM</option>
                          <option value="4:00 PM">4:00 PM</option>
                          <option value="5:00 PM">5:00 PM</option>
                          <option value="6:00 PM">6:00 PM</option>
                          <option value="7:00 PM">7:00 PM</option>
                          <option value="8:00 PM">8:00 PM</option>
                          <option value="9:00 PM">9:00 PM</option>
                          <option value="10:00 PM">10:00 PM</option>
                          <option value="11:00 PM">11:00 PM</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center">
                        <input 
                          type="checkbox"
                          className="mr-2"
                          checked={transportationForm.showTime}
                          onChange={e => setTransportationForm({...transportationForm, showTime: e.target.checked})}
                        />
                        <label className="text-sm font-medium text-gray-700">Show Time</label>
                      </div>
                    </div>
                  </div>

                  {/* Description Section */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">Description</h4>
                    <div className="border border-gray-300 rounded-md overflow-hidden" dir="ltr">
                      <QuillEditor
                        value={eventForm.description || ''}
                        onChange={(content) => setEventForm({...eventForm, description: content})}
                      />
                    </div>
                  </div>
                </div>
              ) : editingEvent.title === 'Meal' ? (
                <div className="space-y-6">
                  {/* Basic Meal Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                      <input 
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={mealForm.name}
                        onChange={e => setMealForm({...mealForm, name: e.target.value})}
                        placeholder="Enter meal name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Destination</label>
                      <select 
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={mealForm.destination}
                        onChange={e => setMealForm({...mealForm, destination: e.target.value})}
                      >
                        <option value="">Select destination</option>
                        {destinations.map(dest => (
                          <option key={dest} value={dest}>{dest}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Meal Type</label>
                      <select 
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={mealForm.mealType}
                        onChange={e => setMealForm({...mealForm, mealType: e.target.value})}
                      >
                        <option value="BB">BB</option>
                        <option value="HB">HB</option>
                        <option value="FB">FB</option>
                        <option value="AI">AI</option>
                        <option value="CP">CP</option>
                        <option value="MAP">MAP</option>
                        <option value="EP">EP</option>
                      </select>
                    </div>
                  </div>

                  {/* Date & Time Section */}
                  <div className="space-y-4 border border-orange-200 bg-orange-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900">Date & Time</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date*</label>
                        <input 
                          type="date"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={mealForm.date}
                          onChange={e => setMealForm({...mealForm, date: e.target.value})}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Start time</label>
                        <select 
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={mealForm.startTime}
                          onChange={e => setMealForm({...mealForm, startTime: e.target.value})}
                        >
                          <option value="12:00 AM">12:00 AM</option>
                          <option value="1:00 AM">1:00 AM</option>
                          <option value="2:00 AM">2:00 AM</option>
                          <option value="3:00 AM">3:00 AM</option>
                          <option value="4:00 AM">4:00 AM</option>
                          <option value="5:00 AM">5:00 AM</option>
                          <option value="6:00 AM">6:00 AM</option>
                          <option value="7:00 AM">7:00 AM</option>
                          <option value="8:00 AM">8:00 AM</option>
                          <option value="9:00 AM">9:00 AM</option>
                          <option value="10:00 AM">10:00 AM</option>
                          <option value="11:00 AM">11:00 AM</option>
                          <option value="12:00 PM">12:00 PM</option>
                          <option value="1:00 PM">1:00 PM</option>
                          <option value="2:00 PM">2:00 PM</option>
                          <option value="3:00 PM">3:00 PM</option>
                          <option value="4:00 PM">4:00 PM</option>
                          <option value="5:00 PM">5:00 PM</option>
                          <option value="6:00 PM">6:00 PM</option>
                          <option value="7:00 PM">7:00 PM</option>
                          <option value="8:00 PM">8:00 PM</option>
                          <option value="9:00 PM">9:00 PM</option>
                          <option value="10:00 PM">10:00 PM</option>
                          <option value="11:00 PM">11:00 PM</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">End time</label>
                        <select 
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={mealForm.endTime}
                          onChange={e => setMealForm({...mealForm, endTime: e.target.value})}
                        >
                          <option value="12:00 AM">12:00 AM</option>
                          <option value="1:00 AM">1:00 AM</option>
                          <option value="2:00 AM">2:00 AM</option>
                          <option value="3:00 AM">3:00 AM</option>
                          <option value="4:00 AM">4:00 AM</option>
                          <option value="5:00 AM">5:00 AM</option>
                          <option value="6:00 AM">6:00 AM</option>
                          <option value="7:00 AM">7:00 AM</option>
                          <option value="8:00 AM">8:00 AM</option>
                          <option value="9:00 AM">9:00 AM</option>
                          <option value="10:00 AM">10:00 AM</option>
                          <option value="11:00 AM">11:00 AM</option>
                          <option value="12:00 PM">12:00 PM</option>
                          <option value="1:00 PM">1:00 PM</option>
                          <option value="2:00 PM">2:00 PM</option>
                          <option value="3:00 PM">3:00 PM</option>
                          <option value="4:00 PM">4:00 PM</option>
                          <option value="5:00 PM">5:00 PM</option>
                          <option value="6:00 PM">6:00 PM</option>
                          <option value="7:00 PM">7:00 PM</option>
                          <option value="8:00 PM">8:00 PM</option>
                          <option value="9:00 PM">9:00 PM</option>
                          <option value="10:00 PM">10:00 PM</option>
                          <option value="11:00 PM">11:00 PM</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center">
                        <input 
                          type="checkbox"
                          className="mr-2"
                          checked={mealForm.showTime}
                          onChange={e => setMealForm({...mealForm, showTime: e.target.checked})}
                        />
                        <label className="text-sm font-medium text-gray-700">Show Time</label>
                      </div>
                    </div>
                  </div>

                  {/* Description Section */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">Description</h4>
                    <div className="border border-gray-300 rounded-md overflow-hidden" dir="ltr">
                      <QuillEditor
                        value={eventForm.description || ''}
                        onChange={(content) => setEventForm({...eventForm, description: content})}
                      />
                    </div>
                  </div>
                </div>
              ) : editingEvent.title === 'Flight' ? (
                <div className="space-y-6">
                  {/* Basic Flight Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                      <input 
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={flightForm.name}
                        onChange={e => setFlightForm({...flightForm, name: e.target.value})}
                        placeholder="Enter flight name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Flight No.</label>
                      <input 
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={flightForm.flightNo}
                        onChange={e => setFlightForm({...flightForm, flightNo: e.target.value})}
                        placeholder="Enter flight number"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">From Destination</label>
                      <input 
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={flightForm.fromDestination}
                        onChange={e => setFlightForm({...flightForm, fromDestination: e.target.value})}
                        placeholder="Enter departure city"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">To Destination</label>
                      <input 
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={flightForm.toDestination}
                        onChange={e => setFlightForm({...flightForm, toDestination: e.target.value})}
                        placeholder="Enter arrival city"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Flight Duration</label>
                      <input 
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={flightForm.flightDuration}
                        onChange={e => setFlightForm({...flightForm, flightDuration: e.target.value})}
                        placeholder="e.g., 2h 30m"
                      />
                    </div>
                  </div>

                  {/* Date & Time Section */}
                  <div className="space-y-4 border border-orange-200 bg-orange-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900">Date & Time</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date*</label>
                        <input 
                          type="date"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={flightForm.date}
                          onChange={e => setFlightForm({...flightForm, date: e.target.value})}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Start time</label>
                        <select 
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={flightForm.startTime}
                          onChange={e => setFlightForm({...flightForm, startTime: e.target.value})}
                        >
                          <option value="12:00 AM">12:00 AM</option>
                          <option value="1:00 AM">1:00 AM</option>
                          <option value="2:00 AM">2:00 AM</option>
                          <option value="3:00 AM">3:00 AM</option>
                          <option value="4:00 AM">4:00 AM</option>
                          <option value="5:00 AM">5:00 AM</option>
                          <option value="6:00 AM">6:00 AM</option>
                          <option value="7:00 AM">7:00 AM</option>
                          <option value="8:00 AM">8:00 AM</option>
                          <option value="9:00 AM">9:00 AM</option>
                          <option value="10:00 AM">10:00 AM</option>
                          <option value="11:00 AM">11:00 AM</option>
                          <option value="12:00 PM">12:00 PM</option>
                          <option value="1:00 PM">1:00 PM</option>
                          <option value="2:00 PM">2:00 PM</option>
                          <option value="3:00 PM">3:00 PM</option>
                          <option value="4:00 PM">4:00 PM</option>
                          <option value="5:00 PM">5:00 PM</option>
                          <option value="6:00 PM">6:00 PM</option>
                          <option value="7:00 PM">7:00 PM</option>
                          <option value="8:00 PM">8:00 PM</option>
                          <option value="9:00 PM">9:00 PM</option>
                          <option value="10:00 PM">10:00 PM</option>
                          <option value="11:00 PM">11:00 PM</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">End time</label>
                        <select 
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={flightForm.endTime}
                          onChange={e => setFlightForm({...flightForm, endTime: e.target.value})}
                        >
                          <option value="12:00 AM">12:00 AM</option>
                          <option value="1:00 AM">1:00 AM</option>
                          <option value="2:00 AM">2:00 AM</option>
                          <option value="3:00 AM">3:00 AM</option>
                          <option value="4:00 AM">4:00 AM</option>
                          <option value="5:00 AM">5:00 AM</option>
                          <option value="6:00 AM">6:00 AM</option>
                          <option value="7:00 AM">7:00 AM</option>
                          <option value="8:00 AM">8:00 AM</option>
                          <option value="9:00 AM">9:00 AM</option>
                          <option value="10:00 AM">10:00 AM</option>
                          <option value="11:00 AM">11:00 AM</option>
                          <option value="12:00 PM">12:00 PM</option>
                          <option value="1:00 PM">1:00 PM</option>
                          <option value="2:00 PM">2:00 PM</option>
                          <option value="3:00 PM">3:00 PM</option>
                          <option value="4:00 PM">4:00 PM</option>
                          <option value="5:00 PM">5:00 PM</option>
                          <option value="6:00 PM">6:00 PM</option>
                          <option value="7:00 PM">7:00 PM</option>
                          <option value="8:00 PM">8:00 PM</option>
                          <option value="9:00 PM">9:00 PM</option>
                          <option value="10:00 PM">10:00 PM</option>
                          <option value="11:00 PM">11:00 PM</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Description Section */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">Description</h4>
                    <textarea 
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={6}
                      value={eventForm.description || ''}
                      onChange={e => setEventForm({...eventForm, description: e.target.value})}
                      placeholder="Enter flight details..."
                    />
                  </div>
                </div>
              ) : editingEvent.title === 'Leisure' ? (
                <div className="space-y-6">
                  {/* Basic Leisure Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                      <input 
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={leisureForm.name}
                        onChange={e => setLeisureForm({...leisureForm, name: e.target.value})}
                        placeholder="Enter leisure activity name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Destination</label>
                      <select 
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={leisureForm.destination}
                        onChange={e => setLeisureForm({...leisureForm, destination: e.target.value})}
                      >
                        <option value="">Select destination</option>
                        {destinations.map(dest => (
                          <option key={dest} value={dest}>{dest}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Description Section */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">Description</h4>
                    <div className="border border-gray-300 rounded-md overflow-hidden" dir="ltr">
                      <QuillEditor
                        value={eventForm.description || ''}
                        onChange={(content) => setEventForm({...eventForm, description: content})}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Subject Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                    <input 
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      value={eventForm.subtitle} 
                      onChange={e=>setEventForm({...eventForm, subtitle:e.target.value})} 
                      placeholder="Start"
                    />
                  </div>

                  {/* Details Rich Text Editor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Details</label>
                    <div className="border border-gray-300 rounded-md overflow-hidden" dir="ltr">
                      <QuillEditor
                        value={eventForm.description || ''}
                        onChange={(content) => setEventForm({...eventForm, description: content})}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={async ()=>{
                  const res = await fetch(`/api/itineraries/days/${editingEvent.day_id}/events`, { 
                    method:'PUT', 
                    headers:{'Content-Type':'application/json'}, 
                    body: JSON.stringify({ 
                      eventId: editingEvent.id, 
                      title: eventForm.title, 
                      subtitle: eventForm.subtitle, 
                      description: eventForm.description,
                      // Include accommodation data if it's an accommodation event
                      ...(editingEvent.title === 'Accommodation' ? {
                        accommodationData: {
                          destination: accForm.destination,
                          type: accForm.type,
                          hotelName: accForm.hotelName,
                          category: accForm.category,
                          roomName: accForm.roomName,
                          mealPlan: accForm.mealPlan,
                          hotelOption: accForm.hotelOption,
                          roomCounts: {
                            single: accForm.countSingle,
                            double: accForm.countDouble,
                            triple: accForm.countTriple,
                            quad: accForm.countQuad,
                            cwb: accForm.countCwb,
                            cnb: accForm.countCnb
                          },
                          checkin: {
                            date: accForm.checkinDate,
                            time: accForm.checkinTime,
                            showTime: accForm.showTime
                          },
                          checkout: {
                            date: accForm.checkoutDate,
                            time: accForm.checkoutTime
                          }
                        }
                      } : {}),
                      // Include activity data if it's an activity event
                      ...(editingEvent.title === 'Activity' ? {
                        activityData: {
                          destination: activityForm.destination,
                          type: activityForm.type,
                          name: activityForm.name,
                          date: activityForm.date,
                          startTime: activityForm.startTime,
                          endTime: activityForm.endTime,
                          showTime: activityForm.showTime
                        }
                      } : {}),
                      // Include transportation data if it's a transportation event
                      ...(editingEvent.title === 'Transportation' ? {
                        transportationData: {
                          destination: transportationForm.destination,
                          type: transportationForm.type,
                          transferType: transportationForm.transferType,
                          name: transportationForm.name,
                          content: transportationForm.content,
                          date: transportationForm.date,
                          startTime: transportationForm.startTime,
                          endTime: transportationForm.endTime,
                          showTime: transportationForm.showTime
                        }
                      } : {}),
                      // Include meal data if it's a meal event
                      ...(editingEvent.title === 'Meal' ? {
                        mealData: {
                          name: mealForm.name,
                          destination: mealForm.destination,
                          mealType: mealForm.mealType,
                          date: mealForm.date,
                          startTime: mealForm.startTime,
                          endTime: mealForm.endTime,
                          showTime: mealForm.showTime
                        }
                      } : {}),
                      // Include flight data if it's a flight event
                      ...(editingEvent.title === 'Flight' ? {
                        flightData: {
                          name: flightForm.name,
                          flightNo: flightForm.flightNo,
                          fromDestination: flightForm.fromDestination,
                          toDestination: flightForm.toDestination,
                          flightDuration: flightForm.flightDuration,
                          date: flightForm.date,
                          startTime: flightForm.startTime,
                          endTime: flightForm.endTime
                        }
                      } : {}),
                      // Include leisure data if it's a leisure event
                      ...(editingEvent.title === 'Leisure' ? {
                        leisureData: {
                          name: leisureForm.name,
                          destination: leisureForm.destination
                        }
                      } : {})
                    }) 
                  })

                  const data = await res.json().catch(()=>({}))
                  if(res.ok){
                    setEvents(prev => prev.map(ev => ev.id===editingEvent.id ? data.event : ev))
                    setEditingEvent(null)
                  }
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )}
</div>

{/* Pricing Step */}
{currentStep === 'pricing' && (
  <PricingPage itinerary={row} />
)}

{/* Final Step */}
{currentStep === 'final' && (
  <FinalPage itinerary={row} />
)}
      
{/* Cover Photo Upload Modal */}
{showCoverPhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCoverPhotoModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upload Cover Photo</h3>
              <button
                onClick={() => setShowCoverPhotoModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors duration-200">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleCoverPhotoUpload(file)
                    }
                  }}
                  className="hidden"
                  id="cover-photo-upload"
                />
                <label
                  htmlFor="cover-photo-upload"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium text-blue-600 hover:text-blue-500">Click to upload</span> or drag and drop
                  </div>
                  <div className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</div>
                </label>
              </div>
              
              {coverPhoto && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Current Cover Photo:</div>
                <div className="relative w-full h-32" ref={eventMenuRef}>
                    <Image
                      src={coverPhoto}
                      alt="Cover preview"
                      fill
                      sizes="(max-width: 768px) 100vw, 640px"
                      className="object-cover rounded-lg"
                      unoptimized
                      onError={() => setCoverPhoto(null)}
                    />
                    <button
                      onClick={() => {
                        setCoverPhoto(null)
                        // Remove from database
                        fetch(`/api/itineraries/${id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ coverPhoto: null })
                        })
                        setShowCoverPhotoModal(false)
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default ItineraryBuilder


