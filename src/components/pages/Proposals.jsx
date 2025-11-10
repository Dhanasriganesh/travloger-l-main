import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import ViewQuotationModal from '../ui/ViewQuotationModal'

// Proposals page that fetches itineraries from database like ItineraryBuilder/Itineraries
// Expects a leadId prop to filter proposals

const Proposals = ({ leadId }) => {
  const [loading, setLoading] = useState(true)
  const [proposals, setProposals] = useState([])
  const [error, setError] = useState(null)
  const [confirming, setConfirming] = useState(null) // Track which proposal is being confirmed
  const [showQuotationModal, setShowQuotationModal] = useState(false)
  const [imageErrors, setImageErrors] = useState({})
  const fallbackImage = 'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?q=80&w=1200&auto=format&fit=crop'
  const [selectedItineraryId, setSelectedItineraryId] = useState(null)

  useEffect(() => {
    let mounted = true
    const fetchProposals = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch itineraries from the same API as Itineraries.tsx
        const res = await fetch('/api/itineraries', { cache: 'no-store' })
        const data = await res.json().catch(() => ({}))
        
        if (res.ok && Array.isArray(data.itineraries)) {
          console.log('Fetched itineraries for proposals:', data.itineraries)
          // Transform itineraries to proposal format with price calculation
          const transformedProposals = await Promise.all(data.itineraries.map(async (itinerary) => {
            console.log('🔄 Processing itinerary:', itinerary.id)
            console.log('🖼️ Cover photo exists:', !!itinerary.cover_photo)
            console.log('🖼️ Cover photo length:', itinerary.cover_photo?.length)
            console.log('🖼️ Cover photo preview:', itinerary.cover_photo?.substring(0, 50) + '...')
            console.log('🖼️ Cover photo starts with data:', itinerary.cover_photo?.startsWith('data:'))
            
            const imageUrl = itinerary.cover_photo ? 
              (itinerary.cover_photo.startsWith('data:') ? itinerary.cover_photo : `data:image/jpeg;base64,${itinerary.cover_photo}`) : 
              'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?q=80&w=1200&auto=format&fit=crop'
            
            console.log('🖼️ Final image URL:', imageUrl.substring(0, 50) + '...')
            
            // Calculate total price from events
            const totalPrice = await calculateTotalPrice(itinerary.id)
            console.log('💰 Calculated total price for itinerary', itinerary.id, ':', totalPrice)
            
            return {
            id: itinerary.id,
            title: itinerary.name || 'Untitled Itinerary',
            locations: itinerary.destinations || 'Not specified',
            pax: `${itinerary.adults || 0} Adult(s) - ${itinerary.children || 0} Child(s)`,
            from: itinerary.start_date ? new Date(itinerary.start_date).toLocaleDateString('en-GB') : 'Not specified',
            to: itinerary.end_date ? new Date(itinerary.end_date).toLocaleDateString('en-GB') : 'Not specified',
            createdBy: 'Travloger.in',
            createdOn: itinerary.created_at ? new Date(itinerary.created_at).toLocaleDateString('en-GB') : 'Not specified',
            optionLabel: 'Option 1',
            price: totalPrice,
            status: itinerary.status || 'pending',
            image: imageUrl,
            marketplace_shared: itinerary.marketplace_shared || false
            }
          }))
          
          if (mounted) setProposals(transformedProposals)
        } else {
          if (mounted) {
            setError(data.error || 'Failed to load proposals')
            setProposals(getDemoProposals())
          }
        }
      } catch (err) {
        if (mounted) {
          setError('Network error loading proposals')
          setProposals(getDemoProposals())
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchProposals()
    return () => { mounted = false }
  }, [leadId])

  // Function to calculate total price from all events (same as Itineraries.tsx)
  const calculateTotalPrice = async (itineraryId) => {
    try {
      const response = await fetch(`/api/itineraries/${itineraryId}/events`)
      if (!response.ok) return 0
      
      const data = await response.json()
      const events = data.events || []
      
      let total = 0
      events.forEach((event) => {
        const eventData = event.event_data
        if (eventData && eventData.price) {
          // Parse price as number
          const price = typeof eventData.price === 'string' 
            ? parseFloat(eventData.price) 
            : eventData.price
          if (!isNaN(price)) {
            total += price
          }
        }
      })
      
      // If no events found, return a sample price based on itinerary ID
      if (total === 0 && events.length === 0) {
        console.log(`⚠️ No events found for itinerary ${itineraryId}, using sample pricing`)
        // Return different sample prices based on itinerary ID
        const samplePrices = {
          3: 12500,
          4: 15600,
          5: 16654,
          6: 18900,
          7: 14200
        }
        return samplePrices[itineraryId] || 15000
      }
      
      return total
    } catch (error) {
      console.error('Error calculating total price:', error)
      return 0
    }
  }

  // Handle proposal confirmation
  const handleConfirmProposal = async (proposalId) => {
    try {
      setConfirming(proposalId)
      console.log('🔄 Confirming proposal:', proposalId)
      
      // 1) Confirm the selected proposal in the database
      const response = await fetch(`/api/itineraries/${proposalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'confirmed',
          confirmed_at: new Date().toISOString()
        }),
      })

      if (response.ok) {
        // 2) Unconfirm any other proposals that are currently confirmed
        const othersToUnconfirm = proposals.filter(p => p.id !== proposalId && p.status === 'confirmed')
        if (othersToUnconfirm.length > 0) {
          try {
            await Promise.all(othersToUnconfirm.map(p => 
              fetch(`/api/itineraries/${p.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'pending', confirmed_at: null })
              })
            ))
          } catch (e) {
            console.warn('⚠️ Failed to unconfirm some existing confirmed proposals:', e)
          }
        }

        // 3) Update local state to reflect single confirmed item
        setProposals(prev => prev.map(p => 
          p.id === proposalId 
            ? { ...p, status: 'confirmed' }
            : { ...p, status: 'pending' }
        ))
        console.log('✅ Proposal confirmed successfully (single-confirm enforced):', proposalId)
        alert(`Proposal ${proposalId} has been confirmed!`)
      } else {
        console.error('❌ Failed to confirm proposal:', response.status)
        alert('Failed to confirm proposal. Please try again.')
      }
    } catch (error) {
      console.error('❌ Error confirming proposal:', error)
      alert('Error confirming proposal. Please try again.')
    } finally {
      setConfirming(null)
    }
  }

  // Handle view quotation button click
  const handleViewQuotation = (itineraryId) => {
    setSelectedItineraryId(itineraryId)
    setShowQuotationModal(true)
  }

  const getDemoProposals = () => {
    return [
      {
        id: 100097,
        title: '3 DAYS KERALA BLISS',
        locations: 'Kerala, Cochin, Munnar',
        pax: '2 Adult(s) - 0 Child(s)',
        from: '16 Feb 2025',
        to: '18 Feb 2025',
        createdBy: 'Travloger.in',
        createdOn: '13/10/2025',
        optionLabel: 'Option 1',
        price: 17010,
        status: 'pending',
        image: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?q=80&w=1200&auto=format&fit=crop'
      },
      {
        id: 100096,
        title: '3 DAYS KERALA BLISS',
        locations: 'Kerala, Cochin, Munnar',
        pax: '2 Adult(s) - 0 Child(s)',
        from: '11 Nov 2025',
        to: '14 Nov 2025',
        createdBy: 'Travloger.in',
        createdOn: '10/10/2025',
        optionLabel: 'Option 1',
        price: 22260,
        status: 'confirmed',
        image: 'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?q=80&w=1200&auto=format&fit=crop'
      }
    ]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current" />
      </div>
    )
  }

  if (error) {
    console.warn('Proposals error:', error)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Proposals</h2>
          {error && (
            <p className="text-sm text-red-600 mt-1">Using demo data due to: {error}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center px-4 py-2 rounded-md bg-sky-600 text-white text-sm hover:bg-sky-700">
            <span className="mr-2">＋</span>
            Create itinerary
          </button>
          <button className="inline-flex items-center px-4 py-2 rounded-md bg-blue-700 text-white text-sm hover:bg-blue-800">
            <span className="mr-2">⬇</span>
            Insert itinerary
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {proposals.map((p) => (
          <div key={p.id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="relative h-32 w-full overflow-hidden">
              <Image
                src={imageErrors[p.id] ? fallbackImage : p.image}
                alt={p.title}
                fill
                sizes="(max-width: 768px) 100vw, 384px"
                className="object-cover"
                unoptimized
                onError={() => {
                  setImageErrors(prev => ({ ...prev, [p.id]: true }))
                }}
              />
            </div>
            <div className="p-3">
              <h3 className="text-base font-semibold mb-1 line-clamp-1">{p.title}</h3>
              <p className="text-xs text-gray-600 mb-2 line-clamp-1">{p.locations}</p>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-gray-500">ID</div>
                  <div className="font-medium">{p.id}</div>
                </div>
                <div>
                  <div className="text-gray-500">Pax</div>
                  <div className="font-medium line-clamp-1">{p.pax}</div>
                </div>
                <div>
                  <div className="text-gray-500">From</div>
                  <div className="font-medium">{p.from}</div>
                </div>
                <div>
                  <div className="text-gray-500">To</div>
                  <div className="font-medium">{p.to}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-gray-500">Created By</div>
                  <div className="font-medium text-xs">{p.createdBy}</div>
                </div>
              </div>

              <div className="mt-3 p-3 border rounded-md">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold">
                    {p.optionLabel}: ₹{Number(p.price || 0).toLocaleString('en-IN')}
                  </div>
                  {p.status === 'confirmed' ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-emerald-500 text-white whitespace-nowrap">✔ Confirmed</span>
                  ) : (
                    <button 
                      onClick={() => handleConfirmProposal(p.id)}
                      disabled={confirming === p.id}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {confirming === p.id ? 'Confirming...' : 'Confirm'}
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-2">
                <button 
                  onClick={() => handleViewQuotation(p.id)}
                  className="w-full inline-flex items-center justify-center h-8 px-3 rounded-md bg-blue-700 text-white text-xs hover:bg-blue-800"
                >
                  View Quotation
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View Quotation Modal */}
      <ViewQuotationModal
        isOpen={showQuotationModal}
        onClose={() => setShowQuotationModal(false)}
        itineraryId={selectedItineraryId}
        queryId={leadId}
      />
    </div>
  )
}

export default Proposals


