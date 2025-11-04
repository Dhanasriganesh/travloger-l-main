'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Image from 'next/image'

interface HeroContent {
  title: string
  subtitle: string
  backgroundImageUrl: string
  mobileVideoUrl: string
  whatsappPhone: string
  whatsappMessage: string
}

interface TripDay {
  day: number
  title: string
  description: string
}

interface TripOption {
  id: string
  title: string
  description: string
  image: string
  nights: number
  days: number
  price: number
  category: 'custom' | 'group'
  route?: string
  trending?: boolean
  detailedItinerary?: {
    subtitle: string
    briefItinerary: TripDay[]
    keyAttractions: string[]
    inclusions: string[]
  }
}

interface TripOptionsContent {
  heading: string
  subheading: string
  customLabel: string
  groupLabel: string
  customTrips: TripOption[]
  groupTrips: TripOption[]
}

interface HeaderContent {
  navItems: { label: string; href: string }[]
  enquireLabel: string
  callNumber: string
}

interface ReviewsContent {
  heading: string
  subheading: string
  reviews: {
  id: string
    name: string
    review: string
    images: {
      src: string
  alt: string
    }[]
  }[]
}

interface BrandsContent {
  heading: string
  subheading: string
  brands: {
    id: string
    name: string
    logoUrl: string
    width?: number
    height?: number
  }[]
}

interface FAQContent {
  heading: string
  items: {
    id: string
    question: string
    answer: string
  }[]
}

interface USPContent {
  heading: string
  subheading?: string
  items: {
    id: string
    title: string
    description: string
  }[]
}

// Removed advanced sections (USP, FAQ, GroupCTA) from editor to reduce confusion


interface ContactContent {
  email: string
  phone: string
  address: string
}

// Itinerary (Packages) types reused here in a simplified way
interface ItineraryPackage {
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
  image?: string
  route?: string
  nights?: number
  days?: number
  trip_type?: 'custom' | 'group'
  created_at?: string
  bookings?: number
}

interface NewItineraryForm {
  name: string
  destination: string
  duration: string
  price: number
  originalPrice: number
  description: string
  highlights: string
  includes: string
  category: string
  featured: boolean
  route?: string
  nights?: number
  days?: number
  tripType?: 'custom' | 'group'
}

type CitySlug = 'kashmir' | 'ladakh' | 'gokarna' | 'kerala' | 'meghalaya' | 'mysore' | 'singapore' | 'hyderabad' | 'bengaluru' | 'manali'

const LOCATIONS: { slug: CitySlug; name: string }[] = [
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
]

const WebsiteEdit: React.FC = () => {
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [filteredSections, setFilteredSections] = useState<string[]>([])
  // Hero thumbnails per location for the location cards grid
  const [heroThumbs, setHeroThumbs] = useState<Record<string, string>>({})
  const thumbsLoadedRef = useRef<boolean>(false)

  // Selected city (none at first → show location cards)
  const [citySlug, setCitySlug] = useState<CitySlug | ''>('')

  // Search functionality
  useEffect(() => {
    const handleSearch = (event: any) => {
      const query = event.detail.toLowerCase()
      setSearchQuery(query)
      
      if (!query) {
        setFilteredSections([])
        return
      }
      
      const sections = [
        'header', 'hero', 'trip options', 'reviews', 'usp', 'brands', 'faq'
      ]
      
      const filtered = sections.filter(section => 
        section.toLowerCase().includes(query)
      )
      
      setFilteredSections(filtered)
    }
    
    window.addEventListener('searchQuery', handleSearch)
    return () => window.removeEventListener('searchQuery', handleSearch)
  }, [])

  // Hero section
  const [hero, setHero] = useState<HeroContent>({
    title: 'Discover Your Next Adventure',
    subtitle: 'Curated experiences across the globe',
    backgroundImageUrl: '',
    mobileVideoUrl: '',
    whatsappPhone: '+919876543210',
    whatsappMessage: 'Hi! I am interested in your tour packages. Can you help me plan my trip?'
  })


  const [contact, setContact] = useState<ContactContent>({
    email: 'info@example.com',
    phone: '+1 555-0100',
    address: '123 Main St, City, Country'
  })

  const [header, setHeader] = useState<HeaderContent>({
    navItems: [
      { label: 'Plan my trip', href: '#packages' },
      { label: 'Stays', href: '#accommodation' },
      { label: 'Highlights', href: '#highlights' }
    ],
    enquireLabel: 'Enquire now',
    callNumber: '+919876543210'
  })

  const [reviews, setReviews] = useState<ReviewsContent>({
    heading: 'Unfiltered Reviews',
    subheading: 'Real experiences from real travelers - authentic stories from Kashmir',
    reviews: [
      {
        id: '1',
        name: 'Aarav & Meera Sharma',
        review: 'Our Kashmir honeymoon package trip with WanderOn was pure magic! From the cozy houseboat stay in Srinagar to the breathtaking views of Gulmarg, everything was perfectly arranged.',
        images: [
          { src: '/Reviews/1.jpg', alt: 'A group of friends enjoying a boat ride on a serene lake.' },
          { src: '/Reviews/2.jpg', alt: 'A stunning view of a calm lake with snow-capped mountains in the background.' }
        ]
      },
      {
        id: '2',
        name: 'Rohan Sharma',
        review: 'An absolutely mesmerizing experience with WanderOn! The beauty of Kashmir is unparalleled, and the trip was organized flawlessly.',
        images: [
          { src: '/Reviews/3.jpg', alt: 'A vibrant, colorful boat docked on the shore of a lake.' },
          { src: '/Reviews/4.jpg', alt: 'A picturesque landscape of a river flowing through a lush green valley.' }
        ]
      }
    ]
  })

  const [brands, setBrands] = useState<BrandsContent>({
    heading: "Brands Who've Worked with Us",
    subheading: "Corporate clients who trust Travloger for their offsites & escapes",
    brands: []
  })

  const [faq, setFaq] = useState<FAQContent>({
    heading: "Before You Pack, Read This FAQs.",
    items: [
      {
        id: '1',
        question: "What's included in the Travlogers Kerala package?",
        answer: "Our Kerala package includes hotel stays, daily breakfast & dinner, private cab for sightseeing, and photography. Houseboat bookings, Ayurveda treatments, and adventure activities can be added as extras. You'll also get 24/7 trip support from our team."
      },
      {
        id: '2',
        question: "Is photography included in the group trip?",
        answer: "Yes, professional photography is included in all our Kerala group trips. Our experienced photographers will capture your best moments throughout the journey, including stunning backwaters, tea gardens, and cultural experiences, and you'll receive a curated collection of high-quality photos after the trip."
      },
      {
        id: '3',
        question: "How does the booking process work?",
        answer: "The booking process is simple: 1) Choose your preferred Kerala package and dates, 2) Pay a small booking amount to secure your spot, 3) Complete the remaining payment before the trip, 4) Receive your detailed itinerary and travel documents. Our team will guide you through each step."
      },
      {
        id: '4',
        question: "Will someone assist us during the trip?",
        answer: "Absolutely! You'll have a dedicated trip coordinator who will be available 24/7 throughout your Kerala journey. Additionally, our local guides will accompany you to all major attractions and provide insights about Kerala's culture, history, and hidden gems."
      },
      {
        id: '5',
        question: "Do you arrange adventure activities or surprises for couples?",
        answer: "Yes, we specialize in creating magical experiences in Kerala! We can arrange adventure activities like trekking, bamboo rafting, and spice plantation tours. For couples, we offer romantic surprises like candlelight dinners on houseboats, private Ayurveda sessions, and special photography sessions at scenic locations like Munnar tea gardens."
      }
    ]
  })

  const [selectedFaqItem, setSelectedFaqItem] = useState<string>('1')

  const [usp, setUsp] = useState<USPContent>({
    heading: 'Why Travloger is trusted by thousands?',
    subheading: '',
    items: [
      {
        id: '1',
        title: 'Snap & Go',
        description: 'Photographer onboard - memories included! Every moment captured professionally.'
      },
      {
        id: '2',
        title: 'End-to-End Handling',
        description: 'From bookings to boarding, we handle everything. Just pack your bags and get ready for adventure.'
      },
      {
        id: '3',
        title: 'No Switch-Outs',
        description: 'What you see is what you get. No hidden surprises or last-minute changes to your itinerary.'
      },
      {
        id: '4',
        title: 'Locally Curated',
        description: 'Stays we\'ve slept in, not Googled. Every stay is personally tested and approved by our team.'
      }
    ]
  })

  const [selectedUspItem, setSelectedUspItem] = useState<string>('1')
  const [selectedReview, setSelectedReview] = useState<string>('')
  const [selectedBrand, setSelectedBrand] = useState<string>('')
  const [selectedCustomTrip, setSelectedCustomTrip] = useState<string>('')
  const [selectedGroupTrip, setSelectedGroupTrip] = useState<string>('')

  // File upload states for brands
  const [brandImageFiles, setBrandImageFiles] = useState<{ [brandId: string]: File | null }>({})

  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  // Itineraries legacy state to satisfy existing actions
  const [itLoading, setItLoading] = useState<boolean>(false)
  const [itError, setItError] = useState<string | null>(null)
  const [itineraries, setItineraries] = useState<ItineraryPackage[]>([])
  const [showCreateItModal, setShowCreateItModal] = useState<boolean>(false)
  const [newItImageFile, setNewItImageFile] = useState<File | null>(null)
  const [showEditItModal, setShowEditItModal] = useState<boolean>(false)
  const [editItId, setEditItId] = useState<number | null>(null)
  const [editItImageFile, setEditItImageFile] = useState<File | null>(null)

  const [tripOptions, setTripOptions] = useState<TripOptionsContent>({
    heading: 'How Do You Want To Explore? ',
    subheading: 'Choose your perfect adventure',
    customLabel: 'Custom Trip',
    groupLabel: 'Group Departure',
    customTrips: [
      {
        id: 'custom-1',
        title: 'Kerala Backwaters Bliss',
        description: 'Experience the serene backwaters of Kerala with traditional houseboat stays',
        image: '/cards/1.jpg',
        nights: 4,
        days: 5,
        price: 18999,
        category: 'custom',
        route: 'Kochi → Alleppey → Kumarakom',
        trending: true,
        detailedItinerary: {
          subtitle: 'Complete Travel Experience',
          briefItinerary: [
            {
              day: 1,
              title: 'Srinagar Arrival & Sightseeing',
              description: 'Arrive in Srinagar and explore the beautiful Mughal Gardens and Dal Lake'
            },
            {
              day: 2,
              title: 'Day Trip to Sonmarg – The Meadow of Gold',
              description: 'Visit the stunning meadows and glaciers of Sonmarg'
            },
            {
              day: 3,
              title: 'Day Trip to Gulmarg – The Meadow of Flowers',
              description: 'Experience the famous Gondola ride and enjoy the alpine meadows'
            },
            {
              day: 4,
              title: 'Day Trip to Doodhpathri & Houseboat Stay',
              description: 'Explore the beautiful meadows of Doodhpathri and stay in a traditional houseboat'
            },
            {
              day: 5,
              title: 'Srinagar to Pahalgam – Legendary countryside',
              description: 'Travel to Pahalgam and explore the legendary valleys and countryside'
            }
          ],
          keyAttractions: [
            'Mughal Gardens, Dal Lake',
            'Thajiwas Glacier & Zojila Pass in Sonmarg',
            'Gondola ride at Gulmarg (Asia\'s highest cable car)',
            'Doodhpathri meadows & pine forests',
            'Aru, Betaab & Chandanwari valleys in Pahalgam',
            'Boutique houseboat stay in Srinagar'
          ],
          inclusions: ['Sightseeing', 'Transfers', 'Meals', 'Stay', 'Trip Assistance']
        }
      }
    ],
    groupTrips: []
  })

  // Advanced sections removed from WebsiteEdit UI

  const cityName = useMemo(() => LOCATIONS.find(l => l.slug === citySlug)?.name || '', [citySlug])

  // Itinerary state (scoped to selected city)
  const navigate = useNavigate()

  const [newItinerary, setNewItinerary] = useState<NewItineraryForm>({
    name: '',
    destination: '',
    duration: '',
    price: 0,
    originalPrice: 0,
    description: '',
    highlights: '',
    includes: '',
    category: 'Adventure',
    featured: false,
    route: '',
    nights: 0,
    days: 0,
    tripType: 'custom'
  })

  const [editItForm, setEditItForm] = useState<NewItineraryForm>({
    name: '',
    destination: '',
    duration: '',
    price: 0,
    originalPrice: 0,
    description: '',
    highlights: '',
    includes: '',
    category: 'Adventure',
    featured: false,
    route: '',
    nights: 0,
    days: 0,
    tripType: 'custom'
  })

  useEffect(() => {
    if (!citySlug) return
    const loadInitial = async () => {
      try {
        const res = await fetch(`/api/cms/cities/${citySlug}`)
        if (res.ok) {
          const data = await res.json()
          console.log('Loaded data:', data) // Debug log
          setHero(data.hero ?? {
            title: 'Discover Your Next Adventure',
            subtitle: 'Curated experiences across the globe',
            backgroundImageUrl: '',
            whatsappPhone: '+919876543210',
            whatsappMessage: 'Hi! I am interested in your tour packages. Can you help me plan my trip?'
          })
          setHeader(data.header ?? {
            navItems: [
              { label: 'Plan my trip', href: '#packages' },
              { label: 'Stays', href: '#accommodation' },
              { label: 'Highlights', href: '#highlights' }
            ],
            enquireLabel: 'Enquire now',
            callNumber: '+919876543210'
          })
          setContact(data.contact ?? {
            email: 'info@example.com',
            phone: '+1 555-0100',
            address: '123 Main St, City, Country'
          })
          setReviews(data.reviews ?? {
            heading: 'Unfiltered Reviews',
            subheading: 'Real experiences from real travelers - authentic stories from Kashmir',
            reviews: [
              {
                id: '1',
                name: 'Aarav & Meera Sharma',
                review: 'Our Kashmir honeymoon package trip with WanderOn was pure magic! From the cozy houseboat stay in Srinagar to the breathtaking views of Gulmarg, everything was perfectly arranged.',
                images: [
                  { src: '/Reviews/1.jpg', alt: 'A group of friends enjoying a boat ride on a serene lake.' },
                  { src: '/Reviews/2.jpg', alt: 'A stunning view of a calm lake with snow-capped mountains in the background.' }
                ]
              },
              {
                id: '2',
                name: 'Rohan Sharma',
                review: 'An absolutely mesmerizing experience with WanderOn! The beauty of Kashmir is unparalleled, and the trip was organized flawlessly.',
                images: [
                  { src: '/Reviews/3.jpg', alt: 'A vibrant, colorful boat docked on the shore of a lake.' },
                  { src: '/Reviews/4.jpg', alt: 'A picturesque landscape of a river flowing through a lush green valley.' }
                ]
              }
            ]
          })
          // Default USP items
          const defaultUspItems = [
            {
              id: '1',
              title: 'Snap & Go',
              description: 'Photographer onboard - memories included! Every moment captured professionally.'
            },
            {
              id: '2',
              title: 'End-to-End Handling',
              description: 'From bookings to boarding, we handle everything. Just pack your bags and get ready for adventure.'
            },
            {
              id: '3',
              title: 'No Switch-Outs',
              description: 'What you see is what you get. No hidden surprises or last-minute changes to your itinerary.'
            },
            {
              id: '4',
              title: 'Locally Curated',
              description: 'Stays we\'ve slept in, not Googled. Every stay is personally tested and approved by our team.'
            }
          ];

          // Merge CMS data with defaults, ensuring we always have 4 items
          const mergedUspItems = defaultUspItems.map(defaultItem => {
            const cmsItem = data.usp?.items?.find((item: any) => item.id === defaultItem.id);
            return cmsItem || defaultItem;
          });

          setUsp({
            heading: data.usp?.heading || 'Why Travloger is trusted by thousands?',
            subheading: data.usp?.subheading || '',
            items: mergedUspItems
          })
          setBrands(data.brands ?? {
            heading: "Brands Who've Worked with Us",
            subheading: "Corporate clients who trust Travloger for their offsites & escapes",
            brands: []
          })
          // Default FAQ items
          const defaultFaqItems = [
            {
              id: '1',
              question: "What's included in the Travlogers Kerala package?",
              answer: "Our Kerala package includes hotel stays, daily breakfast & dinner, private cab for sightseeing, and photography. Houseboat bookings, Ayurveda treatments, and adventure activities can be added as extras. You'll also get 24/7 trip support from our team."
            },
            {
              id: '2',
              question: "Is photography included in the group trip?",
              answer: "Yes, professional photography is included in all our Kerala group trips. Our experienced photographers will capture your best moments throughout the journey, including stunning backwaters, tea gardens, and cultural experiences, and you'll receive a curated collection of high-quality photos after the trip."
            },
            {
              id: '3',
              question: "How does the booking process work?",
              answer: "The booking process is simple: 1) Choose your preferred Kerala package and dates, 2) Pay a small booking amount to secure your spot, 3) Complete the remaining payment before the trip, 4) Receive your detailed itinerary and travel documents. Our team will guide you through each step."
            },
            {
              id: '4',
              question: "Will someone assist us during the trip?",
              answer: "Absolutely! You'll have a dedicated trip coordinator who will be available 24/7 throughout your Kerala journey. Additionally, our local guides will accompany you to all major attractions and provide insights about Kerala's culture, history, and hidden gems."
            },
            {
              id: '5',
              question: "Do you arrange adventure activities or surprises for couples?",
              answer: "Yes, we specialize in creating magical experiences in Kerala! We can arrange adventure activities like trekking, bamboo rafting, and spice plantation tours. For couples, we offer romantic surprises like candlelight dinners on houseboats, private Ayurveda sessions, and special photography sessions at scenic locations like Munnar tea gardens."
            }
          ];

          // Merge CMS data with defaults, ensuring we always have 5 items
          const mergedFaqItems = defaultFaqItems.map(defaultItem => {
            const cmsItem = data.faq?.items?.find((item: any) => item.id === defaultItem.id);
            return cmsItem || defaultItem;
          });

          setFaq({
            heading: data.faq?.heading || "Before You Pack, Read This FAQs.",
            items: mergedFaqItems
          })
          setTripOptions(data.tripOptions ?? {
            heading: 'How Do You Want To Explore? ',
            subheading: 'Choose your perfect adventure',
            customLabel: 'Custom Trip',
            groupLabel: 'Group Departure',
            customTrips: [],
            groupTrips: []
          })
          // Advanced sections fetch skipped in simplified editor
          setError(null)
        }
      } catch (e) {
        // keep defaults
      }
    }
    loadInitial()
  }, [citySlug])

  // Fetch itineraries for selected city
  const fetchItineraries = useCallback(async () => {
    if (!citySlug) return
    try {
      setItLoading(true)
      setItError(null)
      const url = `/api/packages/city/${citySlug}`
      const res = await fetch(url)
      const data = await res.json()
      if (res.ok) {
        setItineraries((data.packages as ItineraryPackage[]) || [])
      } else {
        setItError(data.error || 'Failed to load itineraries')
      }
    } catch (_) {
      setItError('Failed to load itineraries')
    } finally {
      setItLoading(false)
    }
  }, [citySlug])

  // Disable embedded itineraries fetch now that we redirect to dedicated page

  const createItinerary = async (): Promise<void> => {
    try {
      const payload = {
        name: newItinerary.name,
        destination: newItinerary.destination,
        duration: newItinerary.duration,
        price: newItinerary.price,
        originalPrice: newItinerary.originalPrice,
        description: newItinerary.description,
        highlights: newItinerary.highlights ? newItinerary.highlights.split(',').map(h => h.trim()) : [],
        includes: newItinerary.includes ? newItinerary.includes.split(',').map(i => i.trim()) : [],
        category: newItinerary.category,
        featured: newItinerary.featured,
        route: newItinerary.route,
        nights: newItinerary.nights,
        days: newItinerary.days,
        tripType: newItinerary.tripType,
        status: 'Active' as const
      }
      let response: Response
      if (newItImageFile) {
        const form = new FormData()
        Object.entries(payload).forEach(([key, value]) => {
          form.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
        })
        form.append('citySlug', citySlug)
        form.append('image', newItImageFile)
        response = await fetch('/api/packages', { method: 'POST', body: form })
      } else {
        response = await fetch('/api/packages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, citySlug })
        })
      }
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to create')
      setShowCreateItModal(false)
      setNewItImageFile(null)
      setNewItinerary({
        name: '', destination: '', duration: '', price: 0, originalPrice: 0, description: '',
        highlights: '', includes: '', category: 'Adventure', featured: false, route: '', nights: 0, days: 0, tripType: 'custom'
      })
      fetchItineraries()
    } catch (e: any) {
      alert(e.message || 'Failed to create')
    }
  }

  const openEditItinerary = (pkg: ItineraryPackage): void => {
    setEditItId(pkg.id)
    setEditItForm({
      name: pkg.name,
      destination: pkg.destination,
      duration: pkg.duration,
      price: pkg.price,
      originalPrice: pkg.original_price,
      description: pkg.description,
      highlights: (pkg.highlights || []).join(', '),
      includes: (pkg.includes || []).join(', '),
      category: pkg.category,
      featured: pkg.featured,
      route: pkg.route || '',
      nights: pkg.nights || 0,
      days: pkg.days || 0,
      tripType: (pkg.trip_type as 'custom' | 'group') || 'custom'
    })
    setShowEditItModal(true)
  }

  const saveEditItinerary = async (): Promise<void> => {
    if (!editItId) return
    try {
      let response: Response
      if (editItImageFile) {
        const form = new FormData()
        const partial: Partial<ItineraryPackage> = {
          name: editItForm.name,
          destination: editItForm.destination,
          duration: editItForm.duration,
          price: editItForm.price,
          original_price: editItForm.originalPrice,
          description: editItForm.description,
          highlights: editItForm.highlights ? editItForm.highlights.split(',').map(h => h.trim()) : [],
          includes: editItForm.includes ? editItForm.includes.split(',').map(i => i.trim()) : [],
          category: editItForm.category,
          featured: editItForm.featured,
          route: editItForm.route,
          nights: editItForm.nights,
          days: editItForm.days,
          trip_type: editItForm.tripType
        }
        Object.entries(partial).forEach(([key, value]) => {
          if (value === undefined || value === null) return
          form.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
        })
        form.append('image', editItImageFile)
        response = await fetch(`/api/packages/${editItId}`, { method: 'PUT', body: form })
      } else {
        const partial: Partial<ItineraryPackage> = {
          name: editItForm.name,
          destination: editItForm.destination,
          duration: editItForm.duration,
          price: editItForm.price,
          original_price: editItForm.originalPrice,
          description: editItForm.description,
          highlights: editItForm.highlights ? editItForm.highlights.split(',').map(h => h.trim()) : [],
          includes: editItForm.includes ? editItForm.includes.split(',').map(i => i.trim()) : [],
          category: editItForm.category,
          featured: editItForm.featured,
          route: editItForm.route,
          nights: editItForm.nights,
          days: editItForm.days,
          trip_type: editItForm.tripType
        }
        response = await fetch(`/api/packages/${editItId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(partial)
        })
      }
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to update')
      setShowEditItModal(false)
      setEditItImageFile(null)
      fetchItineraries()
    } catch (e: any) {
      alert(e.message || 'Failed to update')
    }
  }

  const handleImageUpload = async (
    file: File,
    onUrl: (url: string) => void
  ): Promise<void> => {
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/website/upload', {
        method: 'POST',
        body: form
      })
      const data = await res.json()
      if (res.ok && data.url) {
        onUrl(data.url)
      } else {
        setError(data.error || 'Failed to upload image')
      }
    } catch (e) {
      setError('Failed to upload image')
    }
  }

  const saveAll = async (): Promise<void> => {
    if (!citySlug) return
    try {
      setSaving(true)
      const res = await fetch(`/api/cms/cities/${citySlug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ header, contact, tripOptions })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }
      setError(null)
      alert(`${cityName} content saved`)
    } catch (e: any) {
      setError(e.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const saveSection = async (sectionName: string, data: any): Promise<void> => {
    if (!citySlug) return
    try {
      setSaving(true)
      console.log(`Saving ${sectionName} for ${citySlug}:`, data)
      
      // Debug: Check for base64 data in payload
      const payloadString = JSON.stringify(data)
      const hasBase64 = payloadString.includes('data:image')
      console.log(`Saving ${sectionName} - Payload size: ${payloadString.length} bytes`)
      console.log(`Saving ${sectionName} - Contains base64: ${hasBase64}`)
      
      if (hasBase64) {
        console.warn('WARNING: Payload contains base64 data! This may cause 413 errors.')
        // Find and log base64 data
        const base64Matches = payloadString.match(/data:image[^"]+/g)
        if (base64Matches) {
          console.log('Base64 data found:', base64Matches.map(match => match.substring(0, 50) + '...'))
        }
      }
      
      const res = await fetch(`/api/cms/cities/${citySlug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: payloadString
      })
      
      console.log(`Response status: ${res.status}`)
      
      if (!res.ok) {
        const responseData = await res.json()
        console.error('Save failed:', responseData)
        throw new Error(responseData.error || 'Failed to save')
      }
      
      const result = await res.json()
      console.log('Save successful:', result)
      
      setError(null)
      alert(`${sectionName} saved successfully`)
    } catch (e: any) {
      console.error('Save error:', e)
      setError(e.message || `Failed to save ${sectionName}`)
    } finally {
      setSaving(false)
    }
  }

  // No city selected → show the 7 location cards
  // Preload hero images for all locations and cache in localStorage for instant subsequent loads
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
    if (!citySlug) loadThumbs()
  }, [citySlug])

  if (!citySlug) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Choose a Location</h1>
            <p className="text-sm text-gray-600">Select a location to edit its website content</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {LOCATIONS.map((loc, idx) => (
            <button
              key={loc.slug}
              onClick={() => setCitySlug(loc.slug)}
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
                  <p className="text-xs text-gray-500">Edit content & images</p>
                </div>
                <span className="text-primary group-hover:translate-x-0.5 transition-transform text-sm">→</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Helper function to check if section should be visible
  const isSectionVisible = (sectionName: string) => {
    if (!searchQuery) return true
    return filteredSections.includes(sectionName.toLowerCase())
  }

  // City selected → show the existing editor UI for that scope
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white border-b-4 border-blue-600 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Website Editor</h1>
            <p className="text-sm text-gray-600 mt-1">
              Editing content for: <span className="font-semibold text-blue-600">{cityName}</span>
            </p>
          </div>
          <button
            onClick={() => setCitySlug('')}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Change Location</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-md shadow-sm">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Header Section */}
      {isSectionVisible('header') && (
      <div className="bg-white border-2 border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Section Header */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">1. Header Section</h2>
                <p className="text-xs text-gray-500">Navigation menu and contact details</p>
              </div>
            </div>
            <button
              onClick={() => saveSection('Header', { header })}
              disabled={saving}
              className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 shadow-sm transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
        
        {/* Section Content */}
        <div className="p-6">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Navigation Items
            </label>
            <div className="space-y-2">
              {header.navItems.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => {
                      const newNavItems = [...header.navItems]
                      newNavItems[index] = { ...item, label: e.target.value }
                      setHeader({ ...header, navItems: newNavItems })
                    }}
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    placeholder="Label"
                  />
                  <input
                    type="text"
                    value={item.href}
                    onChange={(e) => {
                      const newNavItems = [...header.navItems]
                      newNavItems[index] = { ...item, href: e.target.value }
                      setHeader({ ...header, navItems: newNavItems })
                    }}
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    placeholder="Link"
                  />
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Enquire Label
            </label>
            <input
              type="text"
              value={header.enquireLabel}
              onChange={(e) => setHeader({ ...header, enquireLabel: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
              placeholder="Enquire now"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Call Number
            </label>
            <input
              type="text"
              value={header.callNumber}
              onChange={(e) => setHeader({ ...header, callNumber: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
              placeholder="+919876543210"
            />
          </div>
        </div>
      </div>
      </div>
      )}

      {/* Hero Section */}
      {isSectionVisible('hero') && (
      <div className="bg-white border-2 border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Section Header */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">2. Hero Section</h2>
                <p className="text-xs text-gray-500">Main banner with title, subtitle & background</p>
              </div>
            </div>
            <button
              onClick={() => saveSection('Hero', { hero })}
              disabled={saving}
              className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 shadow-sm transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
        
        {/* Section Content */}
        <div className="p-6">
        <div className="space-y-3">
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Title
            </label>
              <input
                type="text"
                value={hero.title}
              onChange={(e) => setHero(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
              placeholder="Hero title"
              />
            </div>
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Subtitle
            </label>
              <input
                type="text"
                value={hero.subtitle}
              onChange={(e) => setHero(prev => ({ ...prev, subtitle: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
              placeholder="Hero subtitle"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Background Image URL
            </label>
            <input
              type="url"
              value={hero.backgroundImageUrl}
              onChange={(e) => setHero(prev => ({ ...prev, backgroundImageUrl: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
              placeholder="https://example.com/image.jpg"
            />
            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Or upload image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return

                  // Check file size (4MB limit)
                  const maxSize = 4 * 1024 * 1024 // 4MB
                  if (file.size > maxSize) {
                    alert(`File too large. Maximum size is 4MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB. Please compress the image and try again.`)
                    return
                  }

                  try {
                    const form = new FormData()
                    form.append('file', file)
                    form.append('slug', citySlug || 'common')
                    form.append('folder', 'hero')

                    const res = await fetch('/api/upload', { method: 'POST', body: form })
                    if (!res.ok) {
                      const err = await res.json().catch(() => ({}))
                      throw new Error(err.error || 'Upload failed')
                    }
                    const data = await res.json()
                    setHero(prev => ({ ...prev, backgroundImageUrl: data.url }))
                  } catch (err: any) {
                    setError(err?.message || 'Failed to upload image')
                  }
                }}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
            </div>

            {hero.backgroundImageUrl && (
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Preview</label>
                <div className="relative w-full h-32 rounded-md overflow-hidden border border-gray-200">
                  <Image
                    src={hero.backgroundImageUrl}
                    alt="Hero background preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="mt-1.5">
                  <button
                    type="button"
                    onClick={() => setHero(prev => ({ ...prev, backgroundImageUrl: '' }))}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Remove Image
                  </button>
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Mobile Video (MP4/WebM)
            </label>
            <input
              type="file"
              accept="video/mp4,video/webm"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (file) {
                  // Check file size (20MB limit for videos)
                  const maxSize = 20 * 1024 * 1024 // 20MB
                  if (file.size > maxSize) {
                    alert(`File too large. Maximum size is 20MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB. Please compress the video and try again.`)
                    return
                  }

                  try {
                    const form = new FormData()
                    form.append('file', file)
                    form.append('slug', citySlug || 'common')
                    form.append('folder', 'hero')

                    const res = await fetch('/api/upload', { method: 'POST', body: form })
                    if (!res.ok) {
                      const err = await res.json().catch(() => ({}))
                      throw new Error(err.error || 'Upload failed')
                    }
                    const data = await res.json()
                    setHero(prev => ({ ...prev, mobileVideoUrl: data.url }))
                  } catch (err: any) {
                    setError(err?.message || 'Failed to upload video')
                  }
                }
              }}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
            />
          </div>

          {hero.mobileVideoUrl && (
            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Video Preview</label>
              <div className="relative w-full h-32 rounded-md overflow-hidden border border-gray-200">
                <video
                  src={hero.mobileVideoUrl}
                  className="w-full h-full object-cover"
                  controls
                  muted
                />
              </div>
              <div className="mt-1.5">
                <button
                  type="button"
                  onClick={() => setHero(prev => ({ ...prev, mobileVideoUrl: '' }))}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Remove Video
                </button>
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              WhatsApp Phone
            </label>
            <input
              type="text"
              value={hero.whatsappPhone}
              onChange={(e) => setHero(prev => ({ ...prev, whatsappPhone: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
              placeholder="+919876543210"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              WhatsApp Message
            </label>
            <textarea
              value={hero.whatsappMessage}
              onChange={(e) => setHero(prev => ({ ...prev, whatsappMessage: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
              rows={3}
              placeholder="WhatsApp message template"
            />
          </div>
        </div>
        </div>
      </div>
      )}

      {/* Trip Options Section */}
      {isSectionVisible('trip options') && (
      <div className="bg-white border-2 border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Section Header */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">3. Trip Options Section</h2>
                <p className="text-xs text-gray-500">Custom & Group trip packages</p>
              </div>
            </div>
            <button
              onClick={() => saveSection('TripOptions', { tripOptions })}
              disabled={saving}
              className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 shadow-sm transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
        
        {/* Section Content */}
        <div className="p-6">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Heading
            </label>
            <input
              type="text"
              value={tripOptions.heading}
              onChange={(e) => setTripOptions(prev => ({ ...prev, heading: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
              placeholder="Trip options heading"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Subheading
            </label>
            <input
              type="text"
              value={tripOptions.subheading}
              onChange={(e) => setTripOptions(prev => ({ ...prev, subheading: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
              placeholder="Trip options subheading"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Custom Label
            </label>
            <input
              type="text"
              value={tripOptions.customLabel}
              onChange={(e) => setTripOptions(prev => ({ ...prev, customLabel: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
              placeholder="Custom trips label"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Group Label
            </label>
            <input
              type="text"
              value={tripOptions.groupLabel}
              onChange={(e) => setTripOptions(prev => ({ ...prev, groupLabel: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
              placeholder="Group trips label"
            />
          </div>
        </div>

        {/* Custom Trips Section */}
        <div className="mt-6 pt-6 border-t-2 border-gray-200">
          <div className="flex items-center space-x-2 mb-4">
            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-gray-900">Custom Trips</h3>
          </div>
          
          {/* Custom Trip Selector Dropdown */}
          <div className="mb-4">
            <select
              value={selectedCustomTrip}
              onChange={(e) => setSelectedCustomTrip(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">Select a custom trip to edit</option>
              {(tripOptions.customTrips || []).map((trip, index) => (
                <option key={trip.id} value={trip.id}>
                  Custom Trip {index + 1} - {trip.title || 'Untitled Trip'}
                </option>
              ))}
            </select>
          </div>

          {/* Add New Custom Trip Button */}
          <div className="mb-4">
            <button
              onClick={() => {
                const newTrip: TripOption = {
                  id: `custom-${Date.now()}`,
                  title: 'New Custom Trip',
                  description: 'Custom trip description',
                  image: '/cards/1.jpg',
                  nights: 3,
                  days: 4,
                  price: 12000,
                  category: 'custom',
                  route: '',
                  trending: false,
                  detailedItinerary: {
                    subtitle: 'Custom Travel Experience',
                    briefItinerary: [
                      { day: 1, title: 'Day 1', description: 'Day 1 description' }
                    ],
                    keyAttractions: ['Attraction 1'],
                    inclusions: ['Inclusion 1']
                  }
                }
                setTripOptions({ ...tripOptions, customTrips: [...(tripOptions.customTrips || []), newTrip] })
                setSelectedCustomTrip(newTrip.id)
              }}
              className="w-full py-2 text-sm border-2 border-dashed border-gray-200 rounded-md text-gray-600 hover:border-gray-300 hover:text-gray-700 transition-colors"
            >
              Add New Custom Trip
            </button>
          </div>

          {/* Selected Custom Trip Edit Form */}
          {selectedCustomTrip && tripOptions.customTrips?.find(t => t.id === selectedCustomTrip) && (
            <div className="border border-gray-200 rounded-lg p-4 mb-4">
              {(() => {
                const trip = tripOptions.customTrips?.find(t => t.id === selectedCustomTrip)!
                const tripIndex = tripOptions.customTrips?.findIndex(t => t.id === selectedCustomTrip) || 0
                
                return (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-md font-medium text-gray-800">Custom Trip {tripIndex + 1}</h4>
                      <button
                        onClick={() => {
                          setTripOptions({
                            ...tripOptions,
                            customTrips: (tripOptions.customTrips || []).filter(t => t.id !== selectedCustomTrip)
                          })
                          setSelectedCustomTrip('')
                        }}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove Trip
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Trip Title</label>
                        <input
                          type="text"
                          value={trip.title}
                          onChange={(e) => {
                            const newTrips = [...(tripOptions.customTrips || [])]
                            newTrips[tripIndex] = { ...trip, title: e.target.value }
                            setTripOptions({ ...tripOptions, customTrips: newTrips })
                          }}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <input
                          type="text"
                          value={trip.description}
                          onChange={(e) => {
                            const newTrips = [...(tripOptions.customTrips || [])]
                            newTrips[tripIndex] = { ...trip, description: e.target.value }
                            setTripOptions({ ...tripOptions, customTrips: newTrips })
                          }}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Trip Image</label>
                        <div className="flex items-center gap-4">
                          {trip.image && (
                            <div className="relative w-16 h-16 rounded-lg border border-gray-300 overflow-hidden">
                              <Image
                                src={trip.image} 
                                alt={trip.title}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                // Check file size (4MB limit)
                                const maxSize = 4 * 1024 * 1024 // 4MB
                                if (file.size > maxSize) {
                                  alert(`File too large. Maximum size is 4MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB. Please compress the image and try again.`)
                                  return
                                }

                                try {
                                  const formData = new FormData()
                                  formData.append('file', file)
                                  formData.append('path', `trip-options/${citySlug}/custom-${trip.id}`)
                                  
                                  const uploadRes = await fetch('/api/upload', {
                                    method: 'POST',
                                    body: formData
                                  })
                                  
                                  if (uploadRes.ok) {
                                    const { url } = await uploadRes.json()
                                    const newTrips = [...(tripOptions.customTrips || [])]
                                    newTrips[tripIndex] = { ...trip, image: url }
                                    setTripOptions({ ...tripOptions, customTrips: newTrips })
                                  } else {
                                    const errorData = await uploadRes.json()
                                    console.error('Upload failed:', errorData)
                                    alert(`Upload failed: ${errorData.error || 'Unknown error'}`)
                                  }
                                } catch (error) {
                                  console.error('Upload error:', error)
                                  alert('Upload failed. Please try again.')
                                }
                              }
                            }}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
                        <input
                          type="text"
                          value={trip.route || ''}
                          onChange={(e) => {
                            const newTrips = [...(tripOptions.customTrips || [])]
                            newTrips[tripIndex] = { ...trip, route: e.target.value }
                            setTripOptions({ ...tripOptions, customTrips: newTrips })
                          }}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nights</label>
                        <input
                          type="number"
                          value={trip.nights || ''}
                          onChange={(e) => {
                            const newTrips = [...(tripOptions.customTrips || [])]
                            newTrips[tripIndex] = { ...trip, nights: parseInt(e.target.value) || 0 }
                            setTripOptions({ ...tripOptions, customTrips: newTrips })
                          }}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Days</label>
                        <input
                          type="number"
                          value={trip.days || ''}
                          onChange={(e) => {
                            const newTrips = [...(tripOptions.customTrips || [])]
                            newTrips[tripIndex] = { ...trip, days: parseInt(e.target.value) || 0 }
                            setTripOptions({ ...tripOptions, customTrips: newTrips })
                          }}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                        <input
                          type="number"
                          value={trip.price || ''}
                          onChange={(e) => {
                            const newTrips = [...(tripOptions.customTrips || [])]
                            newTrips[tripIndex] = { ...trip, price: parseInt(e.target.value) || 0 }
                            setTripOptions({ ...tripOptions, customTrips: newTrips })
                          }}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>

                    {/* Detailed Itinerary Section */}
                    <div className="mt-6 border-t border-gray-200 pt-4">
                      <h5 className="text-sm font-semibold text-gray-800 mb-3">Detailed Itinerary</h5>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Itinerary Subtitle</label>
                          <input
                            type="text"
                            value={trip.detailedItinerary?.subtitle || ''}
                            onChange={(e) => {
                              const newTrips = [...(tripOptions.customTrips || [])]
                              newTrips[tripIndex] = {
                                ...trip,
                                detailedItinerary: {
                                  ...trip.detailedItinerary,
                                  subtitle: e.target.value,
                                  briefItinerary: trip.detailedItinerary?.briefItinerary || [],
                                  keyAttractions: trip.detailedItinerary?.keyAttractions || [],
                                  inclusions: trip.detailedItinerary?.inclusions || []
                                }
                              }
                              setTripOptions({ ...tripOptions, customTrips: newTrips })
                            }}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Custom Travel Experience"
                          />
                        </div>

                        {/* Brief Itinerary */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Brief Itinerary</label>
                          <div className="space-y-2">
                            {(trip.detailedItinerary?.briefItinerary || []).map((day, dayIndex) => (
                              <div key={dayIndex} className="flex gap-2 items-center">
                                <input
                                  type="number"
                                  value={day.day}
                                  onChange={(e) => {
                                    const newTrips = [...(tripOptions.customTrips || [])]
                                    const newItinerary = [...(trip.detailedItinerary?.briefItinerary || [])]
                                    newItinerary[dayIndex] = { ...day, day: parseInt(e.target.value) || 1 }
                                    newTrips[tripIndex] = {
                                      ...trip,
                                      detailedItinerary: {
                                        subtitle: trip.detailedItinerary?.subtitle || '',
                                        briefItinerary: newItinerary,
                                        keyAttractions: trip.detailedItinerary?.keyAttractions || [],
                                        inclusions: trip.detailedItinerary?.inclusions || []
                                      }
                                    }
                                    setTripOptions({ ...tripOptions, customTrips: newTrips })
                                  }}
                                  className="w-16 border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                  placeholder="Day"
                                />
                                <input
                                  type="text"
                                  value={day.title}
                                  onChange={(e) => {
                                    const newTrips = [...(tripOptions.customTrips || [])]
                                    const newItinerary = [...(trip.detailedItinerary?.briefItinerary || [])]
                                    newItinerary[dayIndex] = { ...day, title: e.target.value }
                                    newTrips[tripIndex] = {
                                      ...trip,
                                      detailedItinerary: {
                                        subtitle: trip.detailedItinerary?.subtitle || '',
                                        briefItinerary: newItinerary,
                                        keyAttractions: trip.detailedItinerary?.keyAttractions || [],
                                        inclusions: trip.detailedItinerary?.inclusions || []
                                      }
                                    }
                                    setTripOptions({ ...tripOptions, customTrips: newTrips })
                                  }}
                                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                  placeholder="Day title"
                                />
                                <button
                                  onClick={() => {
                                    const newTrips = [...(tripOptions.customTrips || [])]
                                    const newItinerary = (trip.detailedItinerary?.briefItinerary || []).filter((_, i) => i !== dayIndex)
                                    newTrips[tripIndex] = {
                                      ...trip,
                                      detailedItinerary: {
                                        subtitle: trip.detailedItinerary?.subtitle || '',
                                        briefItinerary: newItinerary,
                                        keyAttractions: trip.detailedItinerary?.keyAttractions || [],
                                        inclusions: trip.detailedItinerary?.inclusions || []
                                      }
                                    }
                                    setTripOptions({ ...tripOptions, customTrips: newTrips })
                                  }}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={() => {
                                const newTrips = [...(tripOptions.customTrips || [])]
                                const newItinerary = [...(trip.detailedItinerary?.briefItinerary || []), { day: 1, title: '', description: '' }]
                                newTrips[tripIndex] = {
                                  ...trip,
                                  detailedItinerary: {
                                    subtitle: trip.detailedItinerary?.subtitle || '',
                                    briefItinerary: newItinerary,
                                    keyAttractions: trip.detailedItinerary?.keyAttractions || [],
                                    inclusions: trip.detailedItinerary?.inclusions || []
                                  }
                                }
                                setTripOptions({ ...tripOptions, customTrips: newTrips })
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              + Add Day
                            </button>
                          </div>
                        </div>

                        {/* Key Attractions */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Key Attractions</label>
                          <div className="space-y-2">
                            {(trip.detailedItinerary?.keyAttractions || []).map((attraction, attractionIndex) => (
                              <div key={attractionIndex} className="flex gap-2 items-center">
                                <input
                                  type="text"
                                  value={attraction}
                                  onChange={(e) => {
                                    const newTrips = [...(tripOptions.customTrips || [])]
                                    const newAttractions = [...(trip.detailedItinerary?.keyAttractions || [])]
                                    newAttractions[attractionIndex] = e.target.value
                                    newTrips[tripIndex] = {
                                      ...trip,
                                      detailedItinerary: {
                                        subtitle: trip.detailedItinerary?.subtitle || '',
                                        briefItinerary: trip.detailedItinerary?.briefItinerary || [],
                                        keyAttractions: newAttractions,
                                        inclusions: trip.detailedItinerary?.inclusions || []
                                      }
                                    }
                                    setTripOptions({ ...tripOptions, customTrips: newTrips })
                                  }}
                                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                  placeholder="Key attraction"
                                />
                                <button
                                  onClick={() => {
                                    const newTrips = [...(tripOptions.customTrips || [])]
                                    const newAttractions = (trip.detailedItinerary?.keyAttractions || []).filter((_, i) => i !== attractionIndex)
                                    newTrips[tripIndex] = {
                                      ...trip,
                                      detailedItinerary: {
                                        subtitle: trip.detailedItinerary?.subtitle || '',
                                        briefItinerary: trip.detailedItinerary?.briefItinerary || [],
                                        keyAttractions: newAttractions,
                                        inclusions: trip.detailedItinerary?.inclusions || []
                                      }
                                    }
                                    setTripOptions({ ...tripOptions, customTrips: newTrips })
                                  }}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={() => {
                                const newTrips = [...(tripOptions.customTrips || [])]
                                const newAttractions = [...(trip.detailedItinerary?.keyAttractions || []), '']
                                newTrips[tripIndex] = {
                                  ...trip,
                                  detailedItinerary: {
                                    subtitle: trip.detailedItinerary?.subtitle || '',
                                    briefItinerary: trip.detailedItinerary?.briefItinerary || [],
                                    keyAttractions: newAttractions,
                                    inclusions: trip.detailedItinerary?.inclusions || []
                                  }
                                }
                                setTripOptions({ ...tripOptions, customTrips: newTrips })
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              + Add Attraction
                            </button>
                          </div>
                        </div>

                        {/* Inclusions */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Inclusions</label>
                          <div className="space-y-2">
                            {(trip.detailedItinerary?.inclusions || []).map((inclusion, inclusionIndex) => (
                              <div key={inclusionIndex} className="flex gap-2 items-center">
                                <input
                                  type="text"
                                  value={inclusion}
                                  onChange={(e) => {
                                    const newTrips = [...(tripOptions.customTrips || [])]
                                    const newInclusions = [...(trip.detailedItinerary?.inclusions || [])]
                                    newInclusions[inclusionIndex] = e.target.value
                                    newTrips[tripIndex] = { 
                                      ...trip, 
                                      detailedItinerary: {
                                        subtitle: trip.detailedItinerary?.subtitle || '',
                                        briefItinerary: trip.detailedItinerary?.briefItinerary || [],
                                        keyAttractions: trip.detailedItinerary?.keyAttractions || [],
                                        inclusions: newInclusions
                                      }
                                    }
                                    setTripOptions({ ...tripOptions, customTrips: newTrips })
                                  }}
                                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                  placeholder="Inclusion"
                                />
                                <button
                                  onClick={() => {
                                    const newTrips = [...(tripOptions.customTrips || [])]
                                    const newInclusions = (trip.detailedItinerary?.inclusions || []).filter((_, i) => i !== inclusionIndex)
                                    newTrips[tripIndex] = { 
                                      ...trip, 
                                      detailedItinerary: {
                                        subtitle: trip.detailedItinerary?.subtitle || '',
                                        briefItinerary: trip.detailedItinerary?.briefItinerary || [],
                                        keyAttractions: trip.detailedItinerary?.keyAttractions || [],
                                        inclusions: newInclusions
                                      }
                                    }
                                    setTripOptions({ ...tripOptions, customTrips: newTrips })
                                  }}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={() => {
                                const newTrips = [...(tripOptions.customTrips || [])]
                                const newInclusions = [...(trip.detailedItinerary?.inclusions || []), '']
                                newTrips[tripIndex] = { 
                                  ...trip, 
                                  detailedItinerary: {
                                    subtitle: trip.detailedItinerary?.subtitle || '',
                                    briefItinerary: trip.detailedItinerary?.briefItinerary || [],
                                    keyAttractions: trip.detailedItinerary?.keyAttractions || [],
                                    inclusions: newInclusions
                                  }
                                }
                                setTripOptions({ ...tripOptions, customTrips: newTrips })
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              + Add Inclusion
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>
          )}
        </div>

        {/* Group Trips Section */}
        <div className="mt-6 pt-6 border-t-2 border-gray-200">
          <div className="flex items-center space-x-2 mb-4">
            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-gray-900">Group Departures</h3>
          </div>
          
          {/* Group Trip Selector Dropdown */}
          <div className="mb-4">
            <select
              value={selectedGroupTrip}
              onChange={(e) => setSelectedGroupTrip(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">Select a group trip to edit</option>
              {(tripOptions.groupTrips || []).map((trip, index) => (
                <option key={trip.id} value={trip.id}>
                  Group Trip {index + 1} - {trip.title || 'Untitled Trip'}
                </option>
              ))}
            </select>
          </div>

          {/* Add New Group Trip Button */}
          <div className="mb-4">
            <button
              onClick={() => {
                const newTrip: TripOption = {
                  id: `group-${Date.now()}`,
                  title: 'New Group Trip',
                  description: 'Group trip description',
                  image: '/cards/1.jpg',
                  nights: 3,
                  days: 4,
                  price: 12000,
                  category: 'group',
                  route: '',
                  trending: false,
                  detailedItinerary: {
                    subtitle: 'Group Travel Experience',
                    briefItinerary: [
                      { day: 1, title: 'Day 1', description: 'Day 1 description' }
                    ],
                    keyAttractions: ['Attraction 1'],
                    inclusions: ['Inclusion 1']
                  }
                }
                setTripOptions({ ...tripOptions, groupTrips: [...(tripOptions.groupTrips || []), newTrip] })
                setSelectedGroupTrip(newTrip.id)
              }}
              className="w-full py-2 text-sm border-2 border-dashed border-gray-200 rounded-md text-gray-600 hover:border-gray-300 hover:text-gray-700 transition-colors"
            >
              Add New Group Trip
            </button>
          </div>

          {/* Selected Group Trip Edit Form */}
          {selectedGroupTrip && tripOptions.groupTrips?.find(t => t.id === selectedGroupTrip) && (
            <div className="border border-gray-200 rounded-lg p-4 mb-4">
              {(() => {
                const trip = tripOptions.groupTrips?.find(t => t.id === selectedGroupTrip)!
                const tripIndex = tripOptions.groupTrips?.findIndex(t => t.id === selectedGroupTrip) || 0
                
                return (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-md font-medium text-gray-800">Group Trip {tripIndex + 1}</h4>
                      <button
                        onClick={() => {
                          setTripOptions({
                            ...tripOptions,
                            groupTrips: (tripOptions.groupTrips || []).filter(t => t.id !== selectedGroupTrip)
                          })
                          setSelectedGroupTrip('')
                        }}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove Trip
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Trip Title</label>
                        <input
                          type="text"
                          value={trip.title}
                          onChange={(e) => {
                            const newTrips = [...(tripOptions.groupTrips || [])]
                            newTrips[tripIndex] = { ...trip, title: e.target.value }
                            setTripOptions({ ...tripOptions, groupTrips: newTrips })
                          }}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <input
                          type="text"
                          value={trip.description}
                          onChange={(e) => {
                            const newTrips = [...(tripOptions.groupTrips || [])]
                            newTrips[tripIndex] = { ...trip, description: e.target.value }
                            setTripOptions({ ...tripOptions, groupTrips: newTrips })
                          }}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Trip Image</label>
                        <div className="flex items-center gap-4">
                          {trip.image && (
                            <div className="relative w-16 h-16 rounded-lg border border-gray-300 overflow-hidden">
                              <Image
                                src={trip.image} 
                                alt={trip.title}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                // Check file size (4MB limit)
                                const maxSize = 4 * 1024 * 1024 // 4MB
                                if (file.size > maxSize) {
                                  alert(`File too large. Maximum size is 4MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB. Please compress the image and try again.`)
                                  return
                                }

                                try {
                                  const formData = new FormData()
                                  formData.append('file', file)
                                  formData.append('path', `trip-options/${citySlug}/group-${trip.id}`)
                                  
                                  const uploadRes = await fetch('/api/upload', {
                                    method: 'POST',
                                    body: formData
                                  })
                                  
                                  if (uploadRes.ok) {
                                    const { url } = await uploadRes.json()
                                    const newTrips = [...(tripOptions.groupTrips || [])]
                                    newTrips[tripIndex] = { ...trip, image: url }
                                    setTripOptions({ ...tripOptions, groupTrips: newTrips })
                                  } else {
                                    const errorData = await uploadRes.json()
                                    console.error('Upload failed:', errorData)
                                    alert(`Upload failed: ${errorData.error || 'Unknown error'}`)
                                  }
                                } catch (error) {
                                  console.error('Upload error:', error)
                                  alert('Upload failed. Please try again.')
                                }
                              }
                            }}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
                        <input
                          type="text"
                          value={trip.route || ''}
                          onChange={(e) => {
                            const newTrips = [...(tripOptions.groupTrips || [])]
                            newTrips[tripIndex] = { ...trip, route: e.target.value }
                            setTripOptions({ ...tripOptions, groupTrips: newTrips })
                          }}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nights</label>
                        <input
                          type="number"
                          value={trip.nights || ''}
                          onChange={(e) => {
                            const newTrips = [...(tripOptions.groupTrips || [])]
                            newTrips[tripIndex] = { ...trip, nights: parseInt(e.target.value) || 0 }
                            setTripOptions({ ...tripOptions, groupTrips: newTrips })
                          }}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Days</label>
                        <input
                          type="number"
                          value={trip.days || ''}
                          onChange={(e) => {
                            const newTrips = [...(tripOptions.groupTrips || [])]
                            newTrips[tripIndex] = { ...trip, days: parseInt(e.target.value) || 0 }
                            setTripOptions({ ...tripOptions, groupTrips: newTrips })
                          }}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                        <input
                          type="number"
                          value={trip.price || ''}
                          onChange={(e) => {
                            const newTrips = [...(tripOptions.groupTrips || [])]
                            newTrips[tripIndex] = { ...trip, price: parseInt(e.target.value) || 0 }
                            setTripOptions({ ...tripOptions, groupTrips: newTrips })
                          }}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>

                    {/* Detailed Itinerary Section */}
                    <div className="mt-6 border-t border-gray-200 pt-4">
                      <h5 className="text-sm font-semibold text-gray-800 mb-3">Detailed Itinerary</h5>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Itinerary Subtitle</label>
                          <input
                            type="text"
                            value={trip.detailedItinerary?.subtitle || ''}
                            onChange={(e) => {
                              const newTrips = [...(tripOptions.groupTrips || [])]
                              newTrips[tripIndex] = {
                                ...trip,
                                detailedItinerary: {
                                  ...trip.detailedItinerary,
                                  subtitle: e.target.value,
                                  briefItinerary: trip.detailedItinerary?.briefItinerary || [],
                                  keyAttractions: trip.detailedItinerary?.keyAttractions || [],
                                  inclusions: trip.detailedItinerary?.inclusions || []
                                }
                              }
                              setTripOptions({ ...tripOptions, groupTrips: newTrips })
                            }}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Group Travel Experience"
                          />
                        </div>

                        {/* Brief Itinerary */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Brief Itinerary</label>
                          <div className="space-y-2">
                            {(trip.detailedItinerary?.briefItinerary || []).map((day, dayIndex) => (
                              <div key={dayIndex} className="flex gap-2 items-center">
                                <input
                                  type="number"
                                  value={day.day}
                                  onChange={(e) => {
                                    const newTrips = [...(tripOptions.groupTrips || [])]
                                    const newItinerary = [...(trip.detailedItinerary?.briefItinerary || [])]
                                    newItinerary[dayIndex] = { ...day, day: parseInt(e.target.value) || 1 }
                                    newTrips[tripIndex] = {
                                      ...trip,
                                      detailedItinerary: {
                                        subtitle: trip.detailedItinerary?.subtitle || '',
                                        briefItinerary: newItinerary,
                                        keyAttractions: trip.detailedItinerary?.keyAttractions || [],
                                        inclusions: trip.detailedItinerary?.inclusions || []
                                      }
                                    }
                                    setTripOptions({ ...tripOptions, groupTrips: newTrips })
                                  }}
                                  className="w-16 border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                  placeholder="Day"
                                />
                                <input
                                  type="text"
                                  value={day.title}
                                  onChange={(e) => {
                                    const newTrips = [...(tripOptions.groupTrips || [])]
                                    const newItinerary = [...(trip.detailedItinerary?.briefItinerary || [])]
                                    newItinerary[dayIndex] = { ...day, title: e.target.value }
                                    newTrips[tripIndex] = {
                                      ...trip,
                                      detailedItinerary: {
                                        subtitle: trip.detailedItinerary?.subtitle || '',
                                        briefItinerary: newItinerary,
                                        keyAttractions: trip.detailedItinerary?.keyAttractions || [],
                                        inclusions: trip.detailedItinerary?.inclusions || []
                                      }
                                    }
                                    setTripOptions({ ...tripOptions, groupTrips: newTrips })
                                  }}
                                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                  placeholder="Day title"
                                />
                                <button
                                  onClick={() => {
                                    const newTrips = [...(tripOptions.groupTrips || [])]
                                    const newItinerary = (trip.detailedItinerary?.briefItinerary || []).filter((_, i) => i !== dayIndex)
                                    newTrips[tripIndex] = {
                                      ...trip,
                                      detailedItinerary: {
                                        subtitle: trip.detailedItinerary?.subtitle || '',
                                        briefItinerary: newItinerary,
                                        keyAttractions: trip.detailedItinerary?.keyAttractions || [],
                                        inclusions: trip.detailedItinerary?.inclusions || []
                                      }
                                    }
                                    setTripOptions({ ...tripOptions, groupTrips: newTrips })
                                  }}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={() => {
                                const newTrips = [...(tripOptions.groupTrips || [])]
                                const newItinerary = [...(trip.detailedItinerary?.briefItinerary || []), { day: 1, title: '', description: '' }]
                                newTrips[tripIndex] = {
                                  ...trip,
                                  detailedItinerary: {
                                    subtitle: trip.detailedItinerary?.subtitle || '',
                                    briefItinerary: newItinerary,
                                    keyAttractions: trip.detailedItinerary?.keyAttractions || [],
                                    inclusions: trip.detailedItinerary?.inclusions || []
                                  }
                                }
                                setTripOptions({ ...tripOptions, groupTrips: newTrips })
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              + Add Day
                            </button>
                          </div>
                        </div>

                        {/* Key Attractions */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Key Attractions</label>
                          <div className="space-y-2">
                            {(trip.detailedItinerary?.keyAttractions || []).map((attraction, attractionIndex) => (
                              <div key={attractionIndex} className="flex gap-2 items-center">
                                <input
                                  type="text"
                                  value={attraction}
                                  onChange={(e) => {
                                    const newTrips = [...(tripOptions.groupTrips || [])]
                                    const newAttractions = [...(trip.detailedItinerary?.keyAttractions || [])]
                                    newAttractions[attractionIndex] = e.target.value
                                    newTrips[tripIndex] = {
                                      ...trip,
                                      detailedItinerary: {
                                        subtitle: trip.detailedItinerary?.subtitle || '',
                                        briefItinerary: trip.detailedItinerary?.briefItinerary || [],
                                        keyAttractions: newAttractions,
                                        inclusions: trip.detailedItinerary?.inclusions || []
                                      }
                                    }
                                    setTripOptions({ ...tripOptions, groupTrips: newTrips })
                                  }}
                                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                  placeholder="Key attraction"
                                />
                                <button
                                  onClick={() => {
                                    const newTrips = [...(tripOptions.groupTrips || [])]
                                    const newAttractions = (trip.detailedItinerary?.keyAttractions || []).filter((_, i) => i !== attractionIndex)
                                    newTrips[tripIndex] = {
                                      ...trip,
                                      detailedItinerary: {
                                        subtitle: trip.detailedItinerary?.subtitle || '',
                                        briefItinerary: trip.detailedItinerary?.briefItinerary || [],
                                        keyAttractions: newAttractions,
                                        inclusions: trip.detailedItinerary?.inclusions || []
                                      }
                                    }
                                    setTripOptions({ ...tripOptions, groupTrips: newTrips })
                                  }}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={() => {
                                const newTrips = [...(tripOptions.groupTrips || [])]
                                const newAttractions = [...(trip.detailedItinerary?.keyAttractions || []), '']
                                newTrips[tripIndex] = {
                                  ...trip,
                                  detailedItinerary: {
                                    subtitle: trip.detailedItinerary?.subtitle || '',
                                    briefItinerary: trip.detailedItinerary?.briefItinerary || [],
                                    keyAttractions: newAttractions,
                                    inclusions: trip.detailedItinerary?.inclusions || []
                                  }
                                }
                                setTripOptions({ ...tripOptions, groupTrips: newTrips })
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              + Add Attraction
                            </button>
                          </div>
                        </div>

                        {/* Inclusions */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Inclusions</label>
                          <div className="space-y-2">
                            {(trip.detailedItinerary?.inclusions || []).map((inclusion, inclusionIndex) => (
                              <div key={inclusionIndex} className="flex gap-2 items-center">
                                <input
                                  type="text"
                                  value={inclusion}
                                  onChange={(e) => {
                                    const newTrips = [...(tripOptions.groupTrips || [])]
                                    const newInclusions = [...(trip.detailedItinerary?.inclusions || [])]
                                    newInclusions[inclusionIndex] = e.target.value
                                    newTrips[tripIndex] = { 
                                      ...trip, 
                                      detailedItinerary: {
                                        subtitle: trip.detailedItinerary?.subtitle || '',
                                        briefItinerary: trip.detailedItinerary?.briefItinerary || [],
                                        keyAttractions: trip.detailedItinerary?.keyAttractions || [],
                                        inclusions: newInclusions
                                      }
                                    }
                                    setTripOptions({ ...tripOptions, groupTrips: newTrips })
                                  }}
                                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                  placeholder="Inclusion"
                                />
                                <button
                                  onClick={() => {
                                    const newTrips = [...(tripOptions.groupTrips || [])]
                                    const newInclusions = (trip.detailedItinerary?.inclusions || []).filter((_, i) => i !== inclusionIndex)
                                    newTrips[tripIndex] = { 
                                      ...trip, 
                                      detailedItinerary: {
                                        subtitle: trip.detailedItinerary?.subtitle || '',
                                        briefItinerary: trip.detailedItinerary?.briefItinerary || [],
                                        keyAttractions: trip.detailedItinerary?.keyAttractions || [],
                                        inclusions: newInclusions
                                      }
                                    }
                                    setTripOptions({ ...tripOptions, groupTrips: newTrips })
                                  }}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={() => {
                                const newTrips = [...(tripOptions.groupTrips || [])]
                                const newInclusions = [...(trip.detailedItinerary?.inclusions || []), '']
                                newTrips[tripIndex] = { 
                                  ...trip, 
                                  detailedItinerary: {
                                    subtitle: trip.detailedItinerary?.subtitle || '',
                                    briefItinerary: trip.detailedItinerary?.briefItinerary || [],
                                    keyAttractions: trip.detailedItinerary?.keyAttractions || [],
                                    inclusions: newInclusions
                                  }
                                }
                                setTripOptions({ ...tripOptions, groupTrips: newTrips })
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              + Add Inclusion
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>
          )}
        </div>
        </div>
      </div>
      )}

      {/* Reviews Section */}
      {isSectionVisible('reviews') && (
      <div className="bg-white border-2 border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Section Header */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">4. Reviews Section</h2>
                <p className="text-xs text-gray-500">Customer testimonials & feedback</p>
              </div>
            </div>
            <button
              onClick={() => saveSection('Reviews', { reviews })}
              disabled={saving}
              className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 shadow-sm transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
        
        {/* Section Content */}
        <div className="p-6">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Heading
            </label>
            <input
              type="text"
              value={reviews.heading}
              onChange={(e) => setReviews(prev => ({ ...prev, heading: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
              placeholder="Reviews heading"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Subheading
            </label>
            <input
              type="text"
              value={reviews.subheading}
              onChange={(e) => setReviews(prev => ({ ...prev, subheading: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
              placeholder="Reviews subheading"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Reviews ({reviews.reviews.length})
            </label>
            
            {/* Review Selector Dropdown */}
            <div className="mb-3">
              <select
                value={selectedReview}
                onChange={(e) => setSelectedReview(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Select a review to edit</option>
              {reviews.reviews.map((review, index) => (
                  <option key={review.id} value={review.id}>
                    Review {index + 1} - {review.name || 'Unnamed Review'}
                  </option>
                ))}
              </select>
            </div>

            {/* Add New Review Button */}
            <div className="mb-3">
                    <button
                onClick={() => {
                  const newReview = {
                    id: Date.now().toString(),
                    name: '',
                    review: '',
                    images: [{ src: '', alt: '' }, { src: '', alt: '' }]
                  }
                  setReviews(prev => ({
                        ...prev,
                    reviews: [...prev.reviews, newReview]
                  }))
                  setSelectedReview(newReview.id)
                }}
                className="w-full py-2 text-sm border-2 border-dashed border-gray-200 rounded-md text-gray-600 hover:border-gray-300 hover:text-gray-700 transition-colors"
              >
                Add New Review
              </button>
            </div>

            {/* Selected Review Edit Form */}
            {selectedReview && reviews.reviews.find(r => r.id === selectedReview) && (
              <div className="border border-gray-200 rounded-md p-3">
                {(() => {
                  const review = reviews.reviews.find(r => r.id === selectedReview)!
                  const index = reviews.reviews.findIndex(r => r.id === selectedReview)
                  
                  return (
                    <>
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-medium text-gray-800">Review {index + 1}</h4>
                        <button
                          onClick={() => {
                            setReviews(prev => ({
                              ...prev,
                              reviews: prev.reviews.filter(r => r.id !== selectedReview)
                            }))
                            setSelectedReview('')
                          }}
                          className="text-red-600 hover:text-red-800 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                      <div className="space-y-2">
                    <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={review.name}
                        onChange={(e) => setReviews(prev => ({
                          ...prev,
                          reviews: prev.reviews.map(r => 
                            r.id === review.id ? { ...r, name: e.target.value } : r
                          )
                        }))}
                            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        placeholder="Reviewer name"
                      />
                    </div>
                    <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                        Review Text
                      </label>
                      <textarea
                        value={review.review}
                        onChange={(e) => setReviews(prev => ({
                          ...prev,
                          reviews: prev.reviews.map(r => 
                            r.id === review.id ? { ...r, review: e.target.value } : r
                          )
                        }))}
                            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                            rows={2}
                        placeholder="Review text"
                      />
                    </div>
                        <div className="grid grid-cols-2 gap-2">
                      <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                          Image 1 URL
                        </label>
                        <input
                          type="url"
                          value={review.images[0]?.src || ''}
                          onChange={(e) => setReviews(prev => ({
                            ...prev,
                            reviews: prev.reviews.map(r => 
                              r.id === review.id ? { 
                                ...r, 
                                images: [
                                  { ...r.images[0], src: e.target.value },
                                  r.images[1] || { src: '', alt: '' }
                                ]
                              } : r
                            )
                          }))}
                              className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                          placeholder="First image URL"
                        />
                      </div>
                      <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                          Image 2 URL
                        </label>
                        <input
                          type="url"
                          value={review.images[1]?.src || ''}
                          onChange={(e) => setReviews(prev => ({
                            ...prev,
                            reviews: prev.reviews.map(r => 
                              r.id === review.id ? { 
                                ...r, 
                                images: [
                                  r.images[0] || { src: '', alt: '' },
                                  { ...r.images[1], src: e.target.value }
                                ]
                              } : r
                            )
                          }))}
                              className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                          placeholder="Second image URL"
                        />
                      </div>
                    </div>
                  </div>
                    </>
                  )
                })()}
                </div>
            )}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* USP Section */}
      {isSectionVisible('usp') && (
      <div className="bg-white border-2 border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Section Header */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">5. USP Section</h2>
                <p className="text-xs text-gray-500">Unique selling points & features</p>
              </div>
            </div>
            <button
              onClick={() => saveSection('USP', { usp })}
              disabled={saving}
              className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 shadow-sm transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
        
        {/* Section Content */}
        <div className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Heading
            </label>
            <input
              type="text"
              value={usp.heading}
              onChange={(e) => setUsp(prev => ({ ...prev, heading: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="USP heading"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subheading (Optional)
            </label>
            <input
              type="text"
              value={usp.subheading || ''}
              onChange={(e) => setUsp(prev => ({ ...prev, subheading: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="USP subheading"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select USP Item to Edit
            </label>
            <select
              value={selectedUspItem}
              onChange={(e) => setSelectedUspItem(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            >
              {usp.items.map((item, index) => (
                <option key={item.id} value={item.id}>
                  Item {item.id} - {item.title}
                </option>
              ))}
            </select>
            
            {/* Debug info */}
            <div className="text-xs text-gray-500 mb-2">
              Debug: Found {usp.items.length} items. Items: {usp.items.map(item => `${item.id}(${item.title})`).join(', ')}
            </div>
            
            {(() => {
              const selectedItem = usp.items.find(item => item.id === selectedUspItem);
              if (!selectedItem) {
                return (
                  <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <p className="text-red-600">Item not found: {selectedUspItem}</p>
                    <p className="text-sm text-red-500">Available items: {usp.items.map(item => item.id).join(', ')}</p>
                  </div>
                );
              }
              
              return (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-md font-medium text-gray-800 mb-3">
                    Editing: Item {selectedUspItem} - {selectedItem.title}
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={selectedItem.title}
                        onChange={(e) => setUsp(prev => ({
                          ...prev,
                          items: prev.items.map(i => 
                            i.id === selectedUspItem ? { ...i, title: e.target.value } : i
                          )
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Item title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={selectedItem.description}
                        onChange={(e) => setUsp(prev => ({
                          ...prev,
                          items: prev.items.map(i => 
                            i.id === selectedUspItem ? { ...i, description: e.target.value } : i
                          )
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="Item description"
                      />
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
        </div>
      </div>
      )}

      {/* Brands Section */}
      {isSectionVisible('brands') && (
      <div className="bg-white border-2 border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Section Header */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">6. Brands Section</h2>
                <p className="text-xs text-gray-500">Partner & client logos</p>
              </div>
            </div>
            <button
              onClick={() => saveSection('Brands', { brands })}
              disabled={saving}
              className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 shadow-sm transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
        
        {/* Section Content */}
        <div className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Heading</label>
            <input
              type="text"
              value={brands.heading}
              onChange={(e) => setBrands({ ...brands, heading: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Brands Who've Worked with Us"
              />
            </div>
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subheading</label>
            <textarea
              value={brands.subheading}
              onChange={(e) => setBrands({ ...brands, subheading: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              rows={2}
              placeholder="Corporate clients who trust Travloger for their offsites & escapes"
            />
          </div>
          
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-semibold text-gray-800">Brand Logos ({brands.brands.length})</h3>
              <button
                onClick={() => {
                  const newId = Date.now().toString()
                  setBrands({
                    ...brands,
                    brands: [...brands.brands, {
                      id: newId,
                      name: '',
                      logoUrl: '',
                      width: 120,
                      height: 60
                    }]
                  })
                  setBrandImageFiles(prev => ({ ...prev, [newId]: null }))
                  setSelectedBrand(newId)
                }}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Add Brand
              </button>
            </div>
            
            {/* Brand Selector Dropdown */}
            <div className="mb-4">
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a brand to edit</option>
              {brands.brands.map((brand, index) => (
                  <option key={brand.id} value={brand.id}>
                    Brand {index + 1} - {brand.name || 'Unnamed Brand'}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Brand Edit Form */}
            {selectedBrand && brands.brands.find(b => b.id === selectedBrand) && (
              <div className="border border-gray-200 rounded-lg p-4">
                {(() => {
                  const brand = brands.brands.find(b => b.id === selectedBrand)!
                  const index = brands.brands.findIndex(b => b.id === selectedBrand)
                  
                  return (
                    <>
                  <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-medium text-gray-800">Brand {index + 1}</h4>
                    <button
                      onClick={() => {
                        setBrands({
                          ...brands,
                              brands: brands.brands.filter(b => b.id !== selectedBrand)
                        })
                        setBrandImageFiles(prev => {
                          const newFiles = { ...prev }
                              delete newFiles[selectedBrand]
                          return newFiles
                        })
                            setSelectedBrand('')
                      }}
                          className="text-red-600 hover:text-red-800 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                      <div className="space-y-3">
                    <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Brand Name</label>
                      <input
                        type="text"
                        value={brand.name}
                        onChange={(e) => setBrands({
                          ...brands,
                          brands: brands.brands.map(b => 
                            b.id === brand.id ? { ...b, name: e.target.value } : b
                          )
                        })}
                            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        placeholder="Microsoft"
                      />
                    </div>
                    
                    <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Logo Image</label>
                <input
                  type="file"
                  accept="image/*"
                        onChange={async (e) => {
                    const file = e.target.files?.[0]
                          if (file) {
                                // Check file size (4MB limit)
                                const maxSize = 4 * 1024 * 1024 // 4MB
                                if (file.size > maxSize) {
                                  alert(`File too large. Maximum size is 4MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB. Please compress the image and try again.`)
                                  return
                                }

                                try {
                                  const formData = new FormData()
                                  formData.append('file', file)
                                  formData.append('path', `brands/${brand.id}`)
                                  
                                  const uploadRes = await fetch('/api/upload', {
                                    method: 'POST',
                                    body: formData
                                  })
                                  
                                  if (uploadRes.ok) {
                                    const { url } = await uploadRes.json()
                              setBrandImageFiles(prev => ({ ...prev, [brand.id]: file }))
                              setBrands({
                                ...brands,
                                brands: brands.brands.map(b => 
                                        b.id === brand.id ? { ...b, logoUrl: url } : b
                                )
                              })
                                  } else {
                                    const errorData = await uploadRes.json()
                                    console.error('Upload failed:', errorData)
                                    alert(`Upload failed: ${errorData.error || 'Unknown error'}`)
                                  }
                            } catch (error) {
                                  console.error('Upload error:', error)
                                  alert('Upload failed. Please try again.')
                            }
                          }
                        }}
                            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      />
                      {brand.logoUrl && (
                        <p className="text-xs text-gray-500 mt-1">
                          Current: {brand.logoUrl.startsWith('data:') ? 'Uploaded image' : 'URL image'}
                        </p>
                )}
              </div>
                    
                        <div className="grid grid-cols-2 gap-2">
                    <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Width (px)</label>
                      <input
                        type="number"
                        value={brand.width || 120}
                        onChange={(e) => setBrands({
                          ...brands,
                          brands: brands.brands.map(b => 
                            b.id === brand.id ? { ...b, width: parseInt(e.target.value) || 120 } : b
                          )
                        })}
                              className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        min="50"
                        max="500"
                      />
            </div>
                    
                    <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Height (px)</label>
                      <input
                        type="number"
                        value={brand.height || 60}
                        onChange={(e) => setBrands({
                          ...brands,
                          brands: brands.brands.map(b => 
                            b.id === brand.id ? { ...b, height: parseInt(e.target.value) || 60 } : b
                          )
                        })}
                              className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        min="30"
                        max="200"
                      />
          </div>
        </div>

                  {brand.logoUrl && (
                          <div className="mt-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Preview</label>
                            <div className="w-24 h-12 border border-gray-200 rounded-md flex items-center justify-center bg-gray-50">
                              <div className="relative w-full h-full">
                                <Image
                          src={brand.logoUrl} 
                          alt={brand.name || 'Brand logo'} 
                                  fill
                                  className="object-contain"
                                  unoptimized
                        />
                      </div>
                            </div>
                            <div className="mt-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setBrands({
                              ...brands,
                              brands: brands.brands.map(b => 
                                b.id === brand.id ? { ...b, logoUrl: '' } : b
                              )
                            })
                            setBrandImageFiles(prev => ({ ...prev, [brand.id]: null }))
                          }}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Remove Image
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                    </>
                  )
                })()}
            </div>
            )}
          </div>
        </div>
        </div>
      </div>
      )}

      {/* FAQ Section */}
      {isSectionVisible('faq') && (
      <div className="bg-white border-2 border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Section Header */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">7. FAQ Section</h2>
                <p className="text-xs text-gray-500">Frequently asked questions</p>
              </div>
            </div>
            <button
              onClick={() => saveSection('FAQ', { faq })}
              disabled={saving}
              className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 shadow-sm transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
        
        {/* Section Content */}
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Heading</label>
              <input
                type="text"
              value={faq.heading}
              onChange={(e) => setFaq({ ...faq, heading: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Before You Pack, Read This FAQs."
              />
            </div>
          
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-semibold text-gray-800">FAQ Items</h3>
            </div>
            
            <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select FAQ Item to Edit</label>
                <select
                  value={selectedFaqItem}
                  onChange={(e) => setSelectedFaqItem(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                >
                  {faq.items.map((item, index) => (
                    <option key={item.id} value={item.id}>
                      Item {item.id} - {item.question.substring(0, 50)}...
                    </option>
                  ))}
                </select>
                
                {/* Debug info */}
                <div className="text-xs text-gray-500 mb-2">
                  Debug: Found {faq.items.length} items. Items: {faq.items.map(item => `${item.id}(${item.question.substring(0, 20)}...)`).join(', ')}
                </div>
                
                {(() => {
                  const selectedItem = faq.items.find(item => item.id === selectedFaqItem);
                  if (!selectedItem) {
                    return (
                      <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                        <p className="text-red-600">Item not found: {selectedFaqItem}</p>
                        <p className="text-sm text-red-500">Available items: {faq.items.map(item => item.id).join(', ')}</p>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="text-md font-medium text-gray-800 mb-3">
                        Editing: Item {selectedFaqItem} - {selectedItem.question.substring(0, 50)}...
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Question
                          </label>
                          <input
                            type="text"
                            value={selectedItem.question}
                            onChange={(e) => setFaq(prev => ({
                              ...prev,
                              items: prev.items.map(i => 
                                i.id === selectedFaqItem ? { ...i, question: e.target.value } : i
                              )
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="FAQ question"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Answer
                          </label>
              <textarea
                            value={selectedItem.answer}
                            onChange={(e) => setFaq(prev => ({
                              ...prev,
                              items: prev.items.map(i => 
                                i.id === selectedFaqItem ? { ...i, answer: e.target.value } : i
                              )
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={4}
                            placeholder="FAQ answer"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
      )}
    </div>
  )
}

export default WebsiteEdit
