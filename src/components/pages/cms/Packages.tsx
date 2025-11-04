'use client'
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Image from 'next/image'
import { useSearchParams, useNavigate } from 'react-router-dom'

interface Package {
  id: number
  name: string
  destination: string
  duration: string
  price: number
  original_price: number
  description: string
  highlights: string[]
  includes: string[]
  category: string
  status: 'Active' | 'Inactive' | 'Draft'
  featured: boolean
  image: string
  created_at: string
  bookings: number
  route?: string
  nights?: number
  days?: number
  trip_type?: 'custom' | 'group'
}

interface NewPackage {
  destination: string
  plan: 'Custom Plan' | 'Fixed Plan' | 'Both'
  serviceType?: 'Hotels' | 'Vehicles' | 'Both'
  hotelLocation?: string
  vehicleLocation?: string
  selectedHotel?: string
  selectedVehicle?: string
  fixedDaysId?: string
  fixedLocationId?: string
  fixedPlanId?: string
  fixedAdults?: number
  fixedPricePerPerson?: number
  fixedRoomsVehicle?: string
}

interface NewPackagePayload {
  destination: string
  plan: 'Custom Plan' | 'Fixed Plan' | 'Both'
  serviceType?: 'Hotels' | 'Vehicles' | 'Both'
  hotelLocation?: string
  vehicleLocation?: string
  selectedHotel?: string
  selectedVehicle?: string
  fixedDaysId?: string
  fixedLocationId?: string
  fixedPlanId?: string
  fixedAdults?: number
  fixedPricePerPerson?: number
  fixedRoomsVehicle?: string
  status: 'Active' | 'Inactive' | 'Draft'
}

type FilterType = 'all' | 'active' | 'inactive' | 'draft'

interface HotelLocation {
  id: string
  name: string
  city: string
}

interface VehicleLocation {
  id: string
  name: string
  city: string
  rates: any
}

interface Hotel {
  id: string
  name: string
  map_rate: number
  eb: number
  category: string
  location_id: string
}

const Packages: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hotelsLoading, setHotelsLoading] = useState(true)
  
  // Get city from URL query parameter, default to 'all' if not provided
  const citySlug = searchParams.get('city') || 'all'

  // Human-readable city name for storage/display - defined after LOCATIONS below

  // Static list of supported locations for selection (matches WebsiteEdit)
  const LOCATIONS: { slug: string; name: string }[] = useMemo(() => [
    { slug: 'kashmir', name: 'Kashmir' },
    { slug: 'ladakh', name: 'Ladakh' },
    { slug: 'gokarna', name: 'Gokarna' },
    { slug: 'kerala', name: 'Kerala' },
    { slug: 'meghalaya', name: 'Meghalaya' },
    { slug: 'mysore', name: 'Mysore' },
    { slug: 'singapore', name: 'Singapore' },
    { slug: 'hyderabad', name: 'Hyderabad' },
    { slug: 'bengaluru', name: 'Bengaluru' },
    { slug: 'manali', name: 'Manali' }
  ], [])
  
  // Human-readable city name for storage/display
  const cityName = (LOCATIONS.find(l => l.slug === citySlug)?.name) || citySlug
  // Hero thumbnails per location for the initial location cards grid
  const [heroThumbs, setHeroThumbs] = useState<Record<string, string>>({})
  const thumbsLoadedRef = useRef<boolean>(false)

  // Preload hero thumbnails when viewing all cities
  useEffect(() => {
    const loadThumbs = async () => {
      try {
        const cacheKey = 'cmsHeroThumbs:v2'
        const cached = typeof window !== 'undefined' ? localStorage.getItem(cacheKey) : null
        if (!thumbsLoadedRef.current && cached) {
          try { 
            const parsed = JSON.parse(cached)
            // Check if cache is not too old (24 hours)
            if (parsed.timestamp && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
              setHeroThumbs(parsed.data || {})
              thumbsLoadedRef.current = true
              return
            }
          } catch { /* ignore */ }
        }
        if (thumbsLoadedRef.current) return

        // Load images with better error handling and concurrent loading
        const entries = await Promise.allSettled(
          LOCATIONS.map(async (loc) => {
            try {
              const res = await fetch(`/api/cms/cities/${loc.slug}`, {
                cache: 'force-cache', // Use browser cache
                headers: { 'Cache-Control': 'max-age=3600' }
              })
              if (!res.ok) return [loc.slug, ''] as const
              const data = await res.json().catch(() => ({}))
              const url = data?.hero?.backgroundImageUrl || ''
              
              // Preload image with better error handling
              if (url) {
                return new Promise<[string, string]>((resolve) => {
                  const img = new window.Image()
                  img.onload = () => resolve([loc.slug, url])
                  img.onerror = () => resolve([loc.slug, ''])
                  img.src = url
                  // Fallback timeout
                  setTimeout(() => resolve([loc.slug, url]), 2000)
                })
              }
              return [loc.slug, ''] as const
            } catch (_) {
              return [loc.slug, ''] as const
            }
          })
        )
        
        const map: Record<string, string> = {}
        entries.forEach((result) => {
          if (result.status === 'fulfilled') {
            const [slug, url] = result.value
            if (url) map[slug] = url
          }
        })
        
        if (Object.keys(map).length) {
          setHeroThumbs(map)
          try { 
            localStorage.setItem(cacheKey, JSON.stringify({
              data: map,
              timestamp: Date.now()
            }))
          } catch { /* ignore */ }
        }
        thumbsLoadedRef.current = true
      } catch (_) { /* ignore */ }
    }
    if (citySlug === 'all') loadThumbs()
  }, [citySlug, LOCATIONS])
  
  // Location management state
  const [hotelLocations, setHotelLocations] = useState<HotelLocation[]>([])
  const [vehicleLocations, setVehicleLocations] = useState<VehicleLocation[]>([])
  const [showAddLocationModal, setShowAddLocationModal] = useState(false)
  const [newLocationName, setNewLocationName] = useState('')
  const [newLocationType, setNewLocationType] = useState<'hotel' | 'vehicle' | 'fixed'>('hotel')
  
  // Hotels management state
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [showAddHotelModal, setShowAddHotelModal] = useState(false)
  const [newHotel, setNewHotel] = useState({
    name: '',
    mapRate: 0,
    eb: 0,
    category: ''
  })

  // Vehicles management state
  interface Vehicle { id: string; vehicle_type: string; rate: number; ac_extra: number; location_id: string }
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false)
  const [newVehicle, setNewVehicle] = useState({ vehicleType: '', rate: 0, acExtra: 0 })

  // Fixed plan days state
  const [fixedDaysOptions, setFixedDaysOptions] = useState<Array<{ id: string; days: number; label: string }>>([])
  const [fixedLocations, setFixedLocations] = useState<HotelLocation[]>([])
  const [fixedPlans, setFixedPlans] = useState<Array<{ id: string; name: string }>>([])
  const [fixedPlansByLocation, setFixedPlansByLocation] = useState<Record<string, Array<{ id: string; name: string }>>>({})
  const [showAddFixedPlanModal, setShowAddFixedPlanModal] = useState(false)
  const [newFixedPlanName, setNewFixedPlanName] = useState('')
  const [fixedPlanVariants, setFixedPlanVariants] = useState<Array<{ id: string; adults: number; price_per_person: number; rooms_vehicle: string }>>([])
  const [showAddVariantModal, setShowAddVariantModal] = useState(false)
  const [newVariant, setNewVariant] = useState({ adults: 2, pricePerPerson: 0, roomsVehicle: '' })
  const [showAddFixedDaysModal, setShowAddFixedDaysModal] = useState(false)
  const [newFixedDays, setNewFixedDays] = useState({ days: 1, label: '' })
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set())

  const [showModal, setShowModal] = useState<boolean>(false)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false)
  
  const [creating, setCreating] = useState<boolean>(false)
  const [newPackage, setNewPackage] = useState<NewPackage>({
    destination: '',
    plan: 'Custom Plan',
    serviceType: 'Hotels',
    hotelLocation: '',
    vehicleLocation: ''
  })


  // Fetch packages from API
  const fetchPackages = useCallback(async () => {
    try {
      setLoading(true)
      const url = citySlug && citySlug !== 'all' ? `/api/packages/city/${encodeURIComponent(cityName)}` : '/api/packages'
      const response = await fetch(url)
      const data = await response.json()
      
      if (response.ok) {
        setPackages(data.packages || [])
        setError(null)
      } else {
        setError(data.error || 'Failed to fetch packages')
      }
    } catch (err) {
      setError('Failed to fetch packages')
      console.error('Error fetching packages:', err)
    } finally {
      setLoading(false)
    }
  }, [citySlug, cityName])

  // Fetch hotel and vehicle locations
  const fetchLocations = useCallback(async () => {
    try {
      console.log('Fetching locations...')
      
      // Use real Supabase endpoints
      const [hotelsRes, vehiclesRes] = await Promise.all([
        fetch('/api/locations/hotels'),
        fetch('/api/locations/vehicles')
      ])
      
      console.log('Hotels response status:', hotelsRes.status)
      console.log('Vehicles response status:', vehiclesRes.status)
      
      if (hotelsRes.ok) {
        const hotelsData = await hotelsRes.json()
        console.log('Hotels data:', hotelsData)
        setHotelLocations(hotelsData.locations || [])
      } else {
        console.error('Failed to fetch hotel locations:', await hotelsRes.text())
        setHotelLocations([])
      }
      
      if (vehiclesRes.ok) {
        const vehiclesData = await vehiclesRes.json()
        console.log('Vehicles data:', vehiclesData)
        setVehicleLocations(vehiclesData.locations || [])
      } else {
        console.error('Failed to fetch vehicle locations:', await vehiclesRes.text())
        setVehicleLocations([])
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error)
    }
  }, [])

  // Add new location
  const addNewLocation = async () => {
    console.log('addNewLocation called:', { newLocationName, citySlug, newLocationType })
    
    if (!newLocationName.trim()) {
      console.log('Validation failed: No location name')
      alert('Please enter a location name')
      return
    }
    
    if (!citySlug || citySlug === 'all') {
      console.log('Validation failed: No city selected', { citySlug })
      alert('Please navigate to Packages from a specific location in WebsiteEdit to add locations')
      return
    }
    
    try {
      // Use real Supabase endpoint
      const endpoint = newLocationType === 'hotel' ? '/api/locations/hotels' : (newLocationType === 'vehicle' ? '/api/locations/vehicles' : '/api/locations/fixed')
      const payload = {
        name: newLocationName.trim(),
        city: citySlug
      }
      
      console.log('Sending request to:', endpoint, 'with payload:', payload)
      
      const res = await fetch(endpoint, {
          method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      console.log('Response status:', res.status)
      
      if (res.ok) {
        let data: any = null
        try { data = await res.json() } catch (_) { data = null }
        console.log('Success response:', data)
        
        // Refresh the locations list
        await fetchLocations()
        
        if (newLocationType === 'hotel') {
          // Add to custom hotel locations list
          setHotelLocations((prev) => [{ id: data.location.id, name: data.location.name, city: data.location.city }, ...prev])
          setNewPackage(prev => ({ ...prev, hotelLocation: data.location.id }))
        } else if (newLocationType === 'vehicle') {
          setNewPackage(prev => ({ ...prev, vehicleLocation: data.location.id }))
        } else if ((newLocationType as any) === 'fixed') {
          // For Fixed Plan separate locations
          setFixedLocations((prev) => [{ id: data.location.id, name: data.location.name, city: data.location.city } as any, ...prev])
          setNewPackage(prev => ({ ...(prev as any), fixedLocationId: data.location.id }))
        }
        setNewLocationName('')
        setShowAddLocationModal(false)
        alert('Location added successfully!')
      } else {
        let error: any = {}
        try { error = await res.json() } catch (_) { error = { message: await res.text() } }
        console.error('Error response:', error)
        alert(error.error || error.message || `Failed to add location (status ${res.status})`)
      }
    } catch (error: any) {
      console.error('Exception in addNewLocation:', error)
      alert('Failed to add location: ' + error.message)
    }
  }

  // Fetch hotels for selected location
  const fetchHotels = useCallback(async (locationId: string) => {
    if (!locationId) {
      setHotels([])
      return
    }
    
    try {
      console.log('Fetching hotels for location:', locationId)
      // Use real Supabase endpoint
      const res = await fetch(`/api/hotels?locationId=${locationId}`)
      
      if (res.ok) {
        const data = await res.json()
        console.log('Hotels data:', data)
        setHotels(data.hotels || [])
      } else {
        console.error('Failed to fetch hotels:', await res.text())
        setHotels([])
      }
    } catch (error) {
      console.error('Error fetching hotels:', error)
      setHotels([])
    }
  }, [])

  // Add new hotel
  const addNewHotel = async () => {
    if (!newHotel.name.trim() || !newPackage.hotelLocation) {
      alert('Please enter hotel name and ensure a hotel location is selected')
      return
    }
    
    try {
      const payload = {
        name: newHotel.name.trim(),
        mapRate: newHotel.mapRate,
        eb: newHotel.eb,
        category: newHotel.category.trim(),
        locationId: newPackage.hotelLocation
      }
      
      console.log('Adding new hotel:', payload)
      
      // Use real Supabase endpoint
      const res = await fetch('/api/hotels', {
          method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      if (res.ok) {
        const data = await res.json()
        console.log('Hotel added:', data)
        
        // Refresh hotels list
        await fetchHotels(newPackage.hotelLocation)
        
        // Automatically select the newly added hotel
        setNewPackage(prev => ({ ...prev, selectedHotel: data.hotel.id }))
        
        setNewHotel({ name: '', mapRate: 0, eb: 0, category: '' })
        setShowAddHotelModal(false)
        alert('Hotel added successfully and selected!')
      } else {
        const error = await res.json()
        console.error('Error adding hotel:', error)
        alert(error.error || 'Failed to add hotel')
      }
    } catch (error: any) {
      console.error('Exception in addNewHotel:', error)
      alert('Failed to add hotel: ' + error.message)
    }
  }

  // Add new vehicle
  const addNewVehicle = async () => {
    if (!newVehicle.vehicleType.trim() || !newPackage.vehicleLocation) {
      alert('Please enter vehicle type and ensure a vehicle location is selected')
      return
    }
    try {
      const payload = {
        vehicleType: newVehicle.vehicleType.trim(),
        rate: newVehicle.rate,
        acExtra: newVehicle.acExtra,
        locationId: newPackage.vehicleLocation
      }
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        const data = await res.json()
        // Refresh list
        const fres = await fetch(`/api/vehicles?locationId=${newPackage.vehicleLocation}`)
        const fdata = fres.ok ? await fres.json() : { vehicles: [] }
        setVehicles(fdata.vehicles || [])
        // Select new vehicle
        setNewPackage(prev => ({ ...prev, selectedVehicle: data.vehicle.id }))
        setNewVehicle({ vehicleType: '', rate: 0, acExtra: 0 })
        setShowAddVehicleModal(false)
        alert('Vehicle added successfully and selected!')
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to add vehicle')
      }
    } catch (e: any) {
      alert('Failed to add vehicle: ' + e.message)
    }
  }

  // Create new package
  const createPackage = async (packageData: any, city: string) => {
    try {
      const response = await fetch('/api/packages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(packageData),
      })
      
      let data: any = null
      try { data = await response.json() } catch (_) { data = {} }
      
      if (response.ok) {
        // Do not mutate local state here. Let caller fetch full row and update list.
        return { success: true, package: data.package }
      } else {
        return { success: false, error: data?.error || 'Failed to create package' }
      }
    } catch (err) {
      return { success: false, error: 'Failed to create package' }
    }
  }


  // Delete package
  const deletePackage = async (id: number) => {
    try {
      const response = await fetch(`/api/packages/${id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        await fetchPackages() // Refresh the list
        return { success: true }
      } else {
        const data = await response.json()
        return { success: false, error: data.error }
      }
    } catch (err) {
      return { success: false, error: 'Failed to delete package' }
    }
  }

  // Load packages on component mount and when city changes
  useEffect(() => {
    fetchPackages()
  }, [fetchPackages])

  // Load all hotels and vehicles for name resolution
  useEffect(() => {
    const loadAllData = async () => {
      try {
        setHotelsLoading(true)
        // Load all hotels from all locations
        const hotelsRes = await fetch('/api/hotels')
        if (hotelsRes.ok) {
          const hotelsData = await hotelsRes.json()
          setHotels(hotelsData.hotels || [])
        }
        
        // Load all vehicles from all locations  
        const vehiclesRes = await fetch('/api/vehicles')
        if (vehiclesRes.ok) {
          const vehiclesData = await vehiclesRes.json()
          setVehicles(vehiclesData.vehicles || [])
        }
      } catch (error) {
        console.error('Failed to load hotels/vehicles:', error)
      } finally {
        setHotelsLoading(false)
      }
    }
    
    loadAllData()
  }, [])

  // Load locations on component mount
  useEffect(() => {
    fetchLocations()
  }, [fetchLocations])

  // Fetch hotels when hotel location changes
  useEffect(() => {
    if (newPackage.hotelLocation) {
      fetchHotels(newPackage.hotelLocation)
    } else {
      setHotels([])
    }
  }, [newPackage.hotelLocation, fetchHotels])

  // Load fixed-days when plan changes to Fixed or city changes
  useEffect(() => {
    const fetchFixedDays = async () => {
      try {
        const res = await fetch(`/api/fixed-days?city=${citySlug}`)
        if (res.ok) {
          const data = await res.json()
          setFixedDaysOptions((data.options || []).map((o: any) => ({ id: o.id, days: o.days, label: o.label || '' })))
        } else {
          setFixedDaysOptions([])
        }
      } catch (_) {
        setFixedDaysOptions([])
      }
    }
    fetchFixedDays()
  }, [citySlug])

  // Load fixed locations when plan is Fixed or city changes
  useEffect(() => {
    const fetchFixedLocations = async () => {
      try {
        const res = await fetch(`/api/locations/fixed?city=${citySlug}`)
        if (res.ok) {
          const data = await res.json()
          setFixedLocations(data.locations || [])
        } else {
          setFixedLocations([])
        }
      } catch (_) {
        setFixedLocations([])
      }
    }
    fetchFixedLocations()
  }, [citySlug])

  // Load fixed plans for all locations referenced in packages for display
  useEffect(() => {
    const loadPlansForLocations = async () => {
      const locationIds = Array.from(new Set(
        packages
          .map((p: any) => p.fixed_location_id)
          .filter((id: any) => typeof id === 'string' && id.length > 0)
      )) as string[]

      await Promise.all(locationIds.map(async (locId) => {
        if (fixedPlansByLocation[locId]) return
        try {
          const res = await fetch(`/api/fixed-plans?city=${citySlug}&locationId=${locId}`)
          if (res.ok) {
            const data = await res.json()
            setFixedPlansByLocation(prev => ({ ...prev, [locId]: (data.plans || []).map((p: any) => ({ id: p.id, name: p.name })) }))
          }
        } catch (_) {
          // ignore
        }
      }))
    }
    if (packages.length) loadPlansForLocations()
  }, [packages, citySlug, fixedPlansByLocation])

  // Extract primitive dependency for stable effect deps
  const fixedLocationId: string = (newPackage as any).fixedLocationId || ''
  const fixedPlanId: string = (newPackage as any).fixedPlanId || ''

  // Load fixed plans when fixed location changes
  useEffect(() => {
    const fetchFixedPlans = async () => {
      try {
        const res = await fetch(`/api/fixed-plans?city=${citySlug}&locationId=${fixedLocationId}`)
        if (res.ok) {
          const data = await res.json()
          setFixedPlans((data.plans || []).map((p: any) => ({ id: p.id, name: p.name })))
        } else {
          setFixedPlans([])
        }
      } catch (_) {
        setFixedPlans([])
      }
    }
    if (fixedLocationId) fetchFixedPlans()
    else setFixedPlans([])
  }, [citySlug, fixedLocationId])

  // Load fixed plan variants when plan changes
  useEffect(() => {
    const fetchVariants = async () => {
      try {
        const res = await fetch(`/api/fixed-plan-options?city=${citySlug}&locationId=${fixedLocationId}&planId=${fixedPlanId}`)
        if (res.ok) {
          const data = await res.json()
          setFixedPlanVariants(data.options || [])
        } else {
          setFixedPlanVariants([])
        }
      } catch (_) {
        setFixedPlanVariants([])
      }
    }
    if (fixedPlanId) fetchVariants()
    else setFixedPlanVariants([])
  }, [citySlug, fixedLocationId, fixedPlanId])

  // Fetch vehicles when vehicle location changes
  useEffect(() => {
    const fetchVehicles = async (locationId: string) => {
      try {
        const res = await fetch(`/api/vehicles?locationId=${locationId}`)
        if (res.ok) {
          const data = await res.json()
          setVehicles(data.vehicles || [])
        } else {
          setVehicles([])
        }
      } catch (_) {
        setVehicles([])
      }
    }
    if (newPackage.vehicleLocation) fetchVehicles(newPackage.vehicleLocation)
    else setVehicles([])
  }, [newPackage.vehicleLocation])

  // Publish/Unpublish
  const updatePackageStatus = async (id: number, nextStatus: 'Active' | 'Draft' | 'Inactive') => {
    try {
      const response = await fetch(`/api/packages/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      })
      if (response.ok) {
        await fetchPackages()
        return { success: true }
      } else {
        const data = await response.json()
        return { success: false, error: data.error }
      }
    } catch (_) {
      return { success: false, error: 'Failed to update status' }
    }
  }

  const filteredPackages = packages.filter((pkg: Package) => {
    if (filter === 'all') return true
    return pkg.status.toLowerCase() === filter.toLowerCase()
  })

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Active': return 'bg-primary/10 text-primary'
      case 'Inactive': return 'bg-red-100 text-red-800'
      case 'Draft': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'Adventure': return 'bg-green-100 text-green-800'
      case 'Cultural': return 'bg-blue-100 text-blue-800'
      case 'Luxury': return 'bg-purple-100 text-purple-800'
      case 'Beach': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const openPackageDetails = (pkg: Package): void => {
    setSelectedPackage(pkg)
    setShowModal(true)
  }

  // Delete all packages for the selected city
  const deleteAllPackagesForCity = async (): Promise<void> => {
    if (citySlug === 'all') {
      alert('Please select a specific city first')
      return
    }
    if (!packages.length) {
      alert('No itineraries to delete for this city')
      return
    }
    const ok = window.confirm(`Delete all ${packages.length} itineraries for ${citySlug}? This cannot be undone.`)
    if (!ok) return

    try {
      const results = await Promise.allSettled(
        packages.map((p) => fetch(`/api/packages/${p.id}`, { method: 'DELETE' }))
      )
      const failed = results.filter(
        (r) => r.status === 'rejected' || (r.status === 'fulfilled' && !(r.value as Response).ok)
      )
      if (failed.length > 0) {
        alert(`Some deletions failed (${failed.length}/${packages.length}). Refreshing list...`)
      } else {
        alert('All itineraries deleted successfully')
      }
      await fetchPackages()
    } catch (e) {
      console.error('Bulk delete error:', e)
      alert('Failed to delete all itineraries')
    }
  }


  const handleCreatePackage = async (): Promise<void> => {
    if (!citySlug || citySlug === 'all') {
      alert('Please choose a specific city before creating an itinerary')
      return
    }
    if (!newPackage.destination?.trim()) {
      alert('Please enter a package name')
      return
    }
    if (!newPackage.plan) {
      alert('Please select a plan type')
      return
    }
    if ((newPackage.plan === 'Custom Plan') && !newPackage.serviceType) {
      alert('Please select a service type')
      return
    }

    // Map form data to packages table structure
    const enteredDestination = newPackage.destination?.trim() || ''
    const packageData = {
      name: enteredDestination,
      destination: enteredDestination, // store the entered destination text
      route: cityName, // persist the selected location for filtering
      duration: 'Custom', // Default duration
      price: 0, // Default price
      original_price: 0, // Default original price
      description: `Custom ${newPackage.plan} for ${cityName}`,
      highlights: ['Customized experience', 'Professional service'],
      includes: ['Accommodation', 'Transportation'],
      category: 'Adventure', // Default category
      status: 'Active' as const,
      featured: false,
      image: '', // Default empty image
      nights: 0, // Default nights
      days: 0, // Default days
      trip_type: 'custom' as const,
      // Additional fields for plan configuration
      plan_type: newPackage.plan,
      service_type: newPackage.serviceType || '',
      hotel_location_id: newPackage.hotelLocation || '',
      vehicle_location_id: newPackage.vehicleLocation || '',
      selected_hotel_id: newPackage.selectedHotel || '',
      selected_vehicle_id: newPackage.selectedVehicle || '',
      fixed_days_id: (newPackage as any).fixedDaysId || '',
      fixed_location_id: (newPackage as any).fixedLocationId || '',
      fixed_plan_id: (newPackage as any).fixedPlanId || '',
      fixed_adults: (newPackage as any).fixedAdults || 0,
      fixed_price_per_person: (newPackage as any).fixedPricePerPerson || 0,
      fixed_rooms_vehicle: (newPackage as any).fixedRoomsVehicle || ''
    }
    try {
      setCreating(true)
      const result = await createPackage(packageData, citySlug)
      
      if (result.success && result.package?.id) {
        try {
          const fullRes = await fetch(`/api/packages/${result.package.id}`)
          let fullData: any = null
          try { fullData = await fullRes.json() } catch (_) { fullData = {} }
          if (fullRes.ok && fullData?.package) {
            setPackages(prev => [fullData.package, ...prev])
          } else {
            // Fallback: refresh entire list
            await fetchPackages()
          }
        } catch (e) {
          console.warn('Fetch full package failed, refreshing list...', e)
          await fetchPackages()
        }
      } else {
        // If creation failed silently, refresh list to reflect server state
        await fetchPackages()
      }

      setShowCreateModal(false)
      setNewPackage({
        destination: '',
        plan: 'Custom Plan',
        serviceType: 'Hotels',
        hotelLocation: '',
        vehicleLocation: '',
        selectedHotel: '',
        selectedVehicle: ''
      })
      // List is already updated with full record; no-op
    } catch (e) {
      console.error('Create itinerary error:', e)
      alert('Failed to create itinerary. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  const totalRevenue = packages
    .filter(p => p.status === 'Active')
    .reduce((sum, pkg) => sum + (pkg.price * pkg.bookings), 0)

  // If no city selected → show location cards (same UX as WebsiteEdit)
  if (citySlug === 'all') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Choose a Location</h1>
            <p className="text-sm text-gray-600">Select a location to manage itineraries (create and view) for that city</p>
          </div>
         
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {LOCATIONS.map((loc, idx) => (
            <button
              key={loc.slug}
              onClick={() => navigate(`/packages?city=${loc.slug}`)}
              className="group bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all rounded-lg p-4 text-left"
            >
              <div className="h-20 w-full rounded-md mb-3 flex items-center justify-center relative overflow-hidden border border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
                {heroThumbs[loc.slug] ? (
                  <Image
                    src={heroThumbs[loc.slug]}
                    alt={`${loc.name} hero`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width:1024px) 50vw, 33vw"
                    priority={idx < 6} // Prioritize first 6 images
                    fetchPriority={idx < 6 ? 'high' : 'low'}
                    className="object-cover transition-opacity duration-200"
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                    quality={85}
                    unoptimized={false} // Enable optimization for better performance
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-gray-500 font-medium text-sm animate-pulse">{loc.name}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">{loc.name}</h3>
                  <p className="text-xs text-gray-500">Create and manage itineraries</p>
                </div>
                <span className="text-primary group-hover:translate-x-0.5 transition-transform text-sm">→</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (loading || hotelsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading packages and hotel data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Packages</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchPackages}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold text-gray-900">
            Itineraries Management
            {citySlug !== 'all' && (
              <span className="text-sm font-normal text-gray-600 ml-2">
                · {cityName}
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-600">
            {citySlug === 'all' 
              ? 'Create and manage travel itineraries for all cities' 
              : `Create and manage travel itineraries for ${cityName}`
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/packages')}
            className="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Change Location
          </button>
          
          <button
            className="bg-primary text-white px-3 py-1.5 text-sm rounded-md hover:opacity-90 transition-colors"
            onClick={() => setShowCreateModal(true)}
          >
            New Itinerary
          </button>
          
          {/* <button
            onClick={deleteAllPackagesForCity}
            className="px-4 py-2 rounded-lg border border-red-300 text-red-700 hover:bg-red-50"
            title="Delete all itineraries in this city"
          >
            Delete All
          </button> */}
        </div>
      </div>

      {/* Stats */}
      {/* <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">📦</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Packages</dt>
                  <dd className="text-lg font-medium text-gray-900">{packages.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">✓</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active</dt>
                  <dd className="text-lg font-medium text-gray-900">{packages.filter((p: Package) => p.status === 'Active').length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">⭐</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Featured</dt>
                  <dd className="text-lg font-medium text-gray-900">{packages.filter((p: Package) => p.featured).length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">💰</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                  <dd className="text-lg font-medium text-gray-900">${totalRevenue.toLocaleString()}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div> */}

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === 'all' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({packages.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === 'active' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Active ({packages.filter((p: Package) => p.status === 'Active').length})
          </button>
          <button
            onClick={() => setFilter('inactive')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === 'inactive' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Inactive ({packages.filter((p: Package) => p.status === 'Inactive').length})
          </button>
          
        </div>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredPackages.length === 0 && (
          <div className="col-span-full">
            <div className="bg-white border border-dashed border-gray-200 rounded-lg p-8 text-center text-gray-600">
              No itineraries found for {cityName}. Click &quot;New Itinerary&quot; to add one.
            </div>
          </div>
        )}
        {filteredPackages.map((pkg) => {
          const isExpanded = expandedCards.has(pkg.id)
          return (
            <div key={pkg.id} className="group bg-white border border-gray-200 rounded-lg hover:shadow-md hover:border-primary transition-all duration-200 overflow-hidden">
              {/* Card Header */}
              <div className="relative">
                {pkg.image && (
                  <div className="h-24 bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center relative">
                    <Image src={pkg.image} alt={pkg.name} fill className="object-cover" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                    pkg.status === 'Active' 
                      ? 'bg-primary/10 text-primary border border-primary/20' 
                      : pkg.status === 'Draft' 
                        ? 'bg-primary/10 text-primary border border-primary/20' 
                        : 'bg-primary/10 text-primary border border-primary/20'
                  }`}>
                    {pkg.status}
                  </span>
                </div>
              </div>
              
              {/* Card Content */}
              <div className="p-3">
                <div className="mb-2">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-primary transition-colors line-clamp-2">
                    {pkg.name}
                  </h3>
                  {isExpanded && (
                    <>
                      <div className="flex items-center text-xs text-gray-600 mb-1">
                        <svg className="h-3 w-3 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="font-medium">{pkg.destination}</span>
                      </div>
                      {'route' in pkg && pkg.route && (
                        <div className="flex items-center text-xs text-gray-500 mb-2">
                          <svg className="h-3 w-3 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{(pkg as any).route || cityName}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                {/* Package Details - Only show when expanded */}
                {isExpanded && (
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Plan Type</span>
                      <span className="font-medium text-gray-900">{(pkg as any).plan_type || 'Custom'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Service</span>
                      <span className="font-medium text-gray-900">{(pkg as any).service_type || '-'}</span>
                    </div>
                    {/* Fixed plan fields */}
                    {(pkg as any).fixed_days_id && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Fixed Days</span>
                        <span className="font-medium text-gray-900">
                          {fixedDaysOptions.find(d => d.id === (pkg as any).fixed_days_id)?.days || '-'}
                        </span>
                      </div>
                    )}
                    {(pkg as any).fixed_location_id && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Fixed Location</span>
                        <span className="font-medium text-gray-900">
                          {fixedLocations.find(l => l.id === (pkg as any).fixed_location_id)?.name || (pkg as any).fixed_location_id}
                        </span>
                      </div>
                    )}
                    {(pkg as any).fixed_plan_id && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Fixed Plan</span>
                        <span className="font-medium text-gray-900">
                          {fixedPlansByLocation[(pkg as any).fixed_location_id || '']?.find(p => p.id === (pkg as any).fixed_plan_id)?.name || (pkg as any).fixed_plan_id}
                        </span>
                      </div>
                    )}
                    {(((pkg as any).fixed_adults ?? 0) > 0) && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Adults</span>
                        <span className="font-medium text-gray-900">{(pkg as any).fixed_adults}</span>
                      </div>
                    )}
                    {(((pkg as any).fixed_price_per_person ?? 0) > 0) && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Price/Person</span>
                        <span className="font-medium text-gray-900">₹{(pkg as any).fixed_price_per_person}</span>
                      </div>
                    )}
                    {Boolean((pkg as any).fixed_rooms_vehicle) && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Rooms & Vehicle</span>
                        <span className="font-medium text-gray-900">{(pkg as any).fixed_rooms_vehicle}</span>
                      </div>
                    )}
                    {(pkg as any).hotel_location_id && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Hotel Location</span>
                        <span className="font-medium text-gray-900">
                          {hotelLocations.find(l => l.id === (pkg as any).hotel_location_id)?.name || (pkg as any).hotel_location_id}
                        </span>
                      </div>
                    )}
                    {(pkg as any).selected_hotel_id && (() => {
                      const hotel = hotels.find(h => h.id === (pkg as any).selected_hotel_id)
                      return hotel ? (
                        <>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Hotel</span>
                            <span className="font-medium text-gray-900">{hotel.name}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Map Rate</span>
                            <span className="font-medium text-gray-900">₹{hotel.map_rate || 0}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">EB</span>
                            <span className="font-medium text-gray-900">₹{hotel.eb || 0}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Category</span>
                            <span className="font-medium text-gray-900">{hotel.category || 'N/A'}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Hotel</span>
                          <span className="font-medium text-gray-900">{(pkg as any).selected_hotel_id}</span>
                        </div>
                      )
                    })()}
                    {(pkg as any).vehicle_location_id && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Vehicle Location</span>
                        <span className="font-medium text-gray-900">
                          {vehicleLocations.find(l => l.id === (pkg as any).vehicle_location_id)?.name || (pkg as any).vehicle_location_id}
                        </span>
                      </div>
                    )}
                    {(pkg as any).selected_vehicle_id && (() => {
                      const vehicle = vehicles.find(v => v.id === (pkg as any).selected_vehicle_id)
                      return vehicle ? (
                        <>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Vehicle</span>
                            <span className="font-medium text-gray-900">{vehicle.vehicle_type}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Rate</span>
                            <span className="font-medium text-gray-900">₹{(vehicle as any).rate ?? 0}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">AC Extra</span>
                            <span className="font-medium text-gray-900">₹{(vehicle as any).ac_extra ?? 0}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Vehicle</span>
                          <span className="font-medium text-gray-900">{(pkg as any).selected_vehicle_id}</span>
                        </div>
                      )
                    })()}
                  </div>
                )}
                
                {/* Card Footer */}
                <div className="pt-2 border-t border-gray-100">
                  <button
                    onClick={() => {
                      if (isExpanded) {
                        setExpandedCards(prev => {
                          const newSet = new Set(prev)
                          newSet.delete(pkg.id)
                          return newSet
                        })
                      } else {
                        setExpandedCards(prev => new Set(prev).add(pkg.id))
                      }
                    }}
                    className="w-full bg-primary/10 hover:bg-primary/20 text-primary font-medium py-1.5 px-3 rounded-md transition-colors duration-200 flex items-center justify-center space-x-1 text-xs"
                  >
                    <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
                    <svg className={`h-3 w-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Package Details Modal */}
      {showModal && selectedPackage && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Package Details</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="text-sm text-gray-900">{selectedPackage.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Destination</label>
                  <p className="text-sm text-gray-900">{selectedPackage.destination}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Duration</label>
                  <p className="text-sm text-gray-900">{selectedPackage.duration}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Price</label>
                  <p className="text-sm text-gray-900">
                    ${selectedPackage.price.toLocaleString()}
                    {selectedPackage.original_price > selectedPackage.price && (
                      <span className="text-gray-500 line-through ml-2">${selectedPackage.original_price.toLocaleString()}</span>
                    )}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <p className="text-sm text-gray-900">{selectedPackage.category}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="text-sm text-gray-900">{selectedPackage.description}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Highlights</label>
                  <ul className="text-sm text-gray-900 list-disc list-inside">
                    {selectedPackage.highlights.map((highlight, index) => (
                      <li key={index}>{highlight}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Includes</label>
                  <ul className="text-sm text-gray-900 list-disc list-inside">
                    {selectedPackage.includes.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Stats</label>
                  <p className="text-sm text-gray-900">Bookings: {selectedPackage.bookings} • Created: {selectedPackage.created_at}</p>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Package Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Fill in the details to create a new itinerary.</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
                >
                  ✕
                </button>
                </div>

            {/* Form Content */}
            <div className="p-4">
              <div className="space-y-3">
                {/* Itinerary Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Itinerary Name<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newPackage.destination}
                    onChange={(e) => setNewPackage({ ...newPackage, destination: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter itinerary name"
                    required
                  />
                </div>
                
                {/* Date Fields - Side by Side */}
                <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="dd-mm-yyyy"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                  </div>
                  </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="dd-mm-yyyy"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                  </div>
                  </div>
                  </div>
                </div>

                {/* Adults and Children - Side by Side */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adults</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      defaultValue="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Children</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      defaultValue="0"
                    />
                  </div>
                </div>

                {/* Destinations */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destinations<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter destinations (e.g., Kerala, Munnar, Thekkady)"
                    required
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="Additional notes or special requirements..."
                  />
                </div>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Location Modal */}
      {showAddLocationModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-1">
              <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add New {newLocationType === 'hotel' ? 'Hotel' : newLocationType === 'vehicle' ? 'Vehicle' : 'Fixed Plan'} Location</h3>
                <button onClick={() => setShowAddLocationModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <div className="space-y-4">
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location Name</label>
                    <input
                      type="text"
                    value={newLocationName} 
                    onChange={(e) => setNewLocationName(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={`Enter ${newLocationType} location name`}
                    />
                  </div>
                <div className="text-sm text-gray-600">
                  {citySlug === 'all' ? (
                    <span className="text-red-600">⚠️ Please navigate to Packages from a specific location in WebsiteEdit</span>
                  ) : (
                    <span>This will be added to <strong>{citySlug}</strong> locations.</span>
                  )}
                  </div>
                </div>
              <div className="mt-6 flex justify-end gap-2">
                <button onClick={() => setShowAddLocationModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                <button 
                  onClick={addNewLocation} 
                  disabled={citySlug === 'all'}
                  className={`px-4 py-2 rounded ${
                    citySlug === 'all' 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-primary text-white hover:opacity-90'
                  }`}
                >
                  Add Location
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Add New Hotel Modal */}
      {showAddHotelModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Add New Hotel for {hotelLocations.find(loc => loc.id === newPackage.hotelLocation)?.name || 'Selected Location'}
                </h3>
                <button onClick={() => setShowAddHotelModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <div className="space-y-4">
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Name</label>
                    <input
                      type="text"
                    value={newHotel.name} 
                    onChange={(e) => setNewHotel({ ...newHotel, name: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter hotel name"
                    />
                  </div>
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">MAP Rate</label>
                    <input
                      type="number"
                    value={newHotel.mapRate} 
                    onChange={(e) => setNewHotel({ ...newHotel, mapRate: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter MAP rate"
                    />
                  </div>
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">EB</label>
                    <input
                      type="number"
                    value={newHotel.eb} 
                    onChange={(e) => setNewHotel({ ...newHotel, eb: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter EB rate"
                    />
                  </div>
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input 
                    type="text" 
                    value={newHotel.category} 
                    onChange={(e) => setNewHotel({ ...newHotel, category: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., 3 star Premier, 4 star, 3 star Dlx"
                  />
                  </div>
                </div>
              <div className="mt-6 flex justify-end gap-2">
                <button onClick={() => setShowAddHotelModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                <button onClick={addNewHotel} className="px-4 py-2 bg-primary text-white rounded">Add Hotel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Vehicle Modal */}
      {showAddVehicleModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Add New Vehicle
                </h3>
                <button onClick={() => setShowAddVehicleModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                  <input
                    type="text"
                    value={newVehicle.vehicleType}
                    onChange={(e) => setNewVehicle({ ...newVehicle, vehicleType: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., Sedan, SUV, Tempo Traveller"
                  />
                </div>
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rate (₹)</label>
                    <input
                      type="number"
                    value={newVehicle.rate}
                    onChange={(e) => setNewVehicle({ ...newVehicle, rate: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter base rate"
                    />
                  </div>
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Extra for AC (₹)</label>
                    <input
                      type="number"
                    value={newVehicle.acExtra}
                    onChange={(e) => setNewVehicle({ ...newVehicle, acExtra: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter AC extra"
                    />
                  </div>
                </div>
              <div className="mt-6 flex justify-end gap-2">
                <button onClick={() => setShowAddVehicleModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                <button onClick={addNewVehicle} className="px-4 py-2 bg-primary text-white rounded">Add Vehicle</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Fixed Days Modal */}
      {showAddFixedDaysModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add Fixed Plan Days</h3>
                <button onClick={() => setShowAddFixedDaysModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Days</label>
                  <input
                    type="number"
                    min={1}
                    value={newFixedDays.days}
                    onChange={(e) => setNewFixedDays({ ...newFixedDays, days: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., 5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Label (optional)</label>
                  <input
                    type="text"
                    value={newFixedDays.label}
                    onChange={(e) => setNewFixedDays({ ...newFixedDays, label: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., Family Special"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button onClick={() => setShowAddFixedDaysModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                <button
                  onClick={async () => {
                    if (citySlug === 'all') { alert('Select a specific city first'); return }
                    const res = await fetch('/api/fixed-days', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ city: citySlug, days: newFixedDays.days, label: newFixedDays.label })
                    })
                    if (res.ok) {
                      const data = await res.json()
                      setFixedDaysOptions(prev => [...prev, { id: data.option.id, days: data.option.days, label: data.option.label || '' }].sort((a,b)=>a.days-b.days))
                      setShowAddFixedDaysModal(false)
                      ;(setNewPackage as any)((prev: any) => ({ ...prev, fixedDaysId: data.option.id }))
                      setNewFixedDays({ days: 1, label: '' })
                    } else {
                      const err = await res.json()
                      alert(err.error || 'Failed to add days')
                    }
                  }}
                  className="px-4 py-2 bg-primary text-white rounded"
                >Add</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Fixed Plan Modal */}
      {showAddFixedPlanModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add New Plan</h3>
                <button onClick={() => setShowAddFixedPlanModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                  <input
                    type="text"
                    value={newFixedPlanName}
                    onChange={(e) => setNewFixedPlanName(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., Standard, Deluxe, Premium"
                  />
                </div>
                </div>
              <div className="mt-6 flex justify-end gap-2">
                <button onClick={() => setShowAddFixedPlanModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                <button
                  onClick={async () => {
                    if (!newFixedPlanName.trim() || !(newPackage as any).fixedLocationId) {
                      alert('Enter plan name and select a fixed location first')
                      return
                    }
                    const res = await fetch('/api/fixed-plans', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ city: citySlug, locationId: (newPackage as any).fixedLocationId, name: newFixedPlanName.trim() })
                    })
                    if (res.ok) {
                      const data = await res.json()
                      setFixedPlans(prev => [{ id: data.plan.id, name: data.plan.name }, ...prev])
                      setNewPackage(prev => ({ ...(prev as any), fixedPlanId: data.plan.id }))
                      setNewFixedPlanName('')
                      setShowAddFixedPlanModal(false)
                    } else {
                      const err = await res.json().catch(async () => ({ message: await res.text() }))
                      alert(err.error || err.message || 'Failed to add plan')
                    }
                  }}
                  className="px-4 py-2 bg-primary text-white rounded"
                >Add</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Variant Modal */}
      {showAddVariantModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add Variant</h3>
                <button onClick={() => setShowAddVariantModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">No. of Adults</label>
                  <input type="number" min={1} value={newVariant.adults} onChange={(e) => setNewVariant({ ...newVariant, adults: Number(e.target.value) })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price per Person (₹)</label>
                  <input type="number" min={0} value={newVariant.pricePerPerson} onChange={(e) => setNewVariant({ ...newVariant, pricePerPerson: Number(e.target.value) })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rooms & Vehicle</label>
                  <input type="text" value={newVariant.roomsVehicle} onChange={(e) => setNewVariant({ ...newVariant, roomsVehicle: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" placeholder="e.g., 1 Room + Sedan" />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button onClick={() => setShowAddVariantModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                <button
                  onClick={async () => {
                    if (!(newPackage as any).fixedPlanId || !(newPackage as any).fixedLocationId) {
                      alert('Select a fixed location and plan first')
                      return
                    }
                    const res = await fetch('/api/fixed-plan-options', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        city: citySlug,
                        locationId: (newPackage as any).fixedLocationId,
                        planId: (newPackage as any).fixedPlanId,
                        adults: newVariant.adults,
                        pricePerPerson: newVariant.pricePerPerson,
                        roomsVehicle: newVariant.roomsVehicle
                      })
                    })
                    if (res.ok) {
                      const data = await res.json()
                      setFixedPlanVariants(prev => [data.option, ...prev])
                      setNewPackage(prev => ({ ...(prev as any), fixedVariantId: data.option.id }))
                      setNewVariant({ adults: 2, pricePerPerson: 0, roomsVehicle: '' })
                      setShowAddVariantModal(false)
                    } else {
                      const err = await res.json().catch(async () => ({ message: await res.text() }))
                      alert(err.error || err.message || 'Failed to add variant')
                    }
                  }}
                  className="px-4 py-2 bg-primary text-white rounded"
                >Add</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Packages

