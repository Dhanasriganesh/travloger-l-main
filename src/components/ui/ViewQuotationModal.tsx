import React, { useState, useEffect, useCallback } from 'react'
import { X, Printer, Mail, Camera } from 'lucide-react'

interface QuotationData {
  queryId: string
  customerName: string
  destination: string
  adults: number
  children: number
  nights: number
  days: number
  startDate: string
  endDate: string
  queryDate: string
  totalPrice: number
  hotels: Array<{
    city: string
    hotelName: string
    checkIn: string
    checkOut: string
    nights: number
    roomType: string
    mealPlan: string
    rooms: number
  }>
  itinerary: Array<{
    day: number
    date: string
    title: string
    description: string
    activities: string[]
  }>
  inclusions: string[]
  exclusions: string[]
  terms: string[]
  cancellationPolicy: string[]
  usefulTips: string[]
}

interface ViewQuotationModalProps {
  isOpen: boolean
  onClose: () => void
  itineraryId?: number
  queryId?: string
}

const fallbackQuotationData: QuotationData = {
  queryId: 'N/A',
  customerName: 'Customer',
  destination: 'Destination',
  adults: 0,
  children: 0,
  nights: 0,
  days: 0,
  startDate: '',
  endDate: '',
  queryDate: '',
  totalPrice: 0,
  hotels: [],
  itinerary: [],
  inclusions: [],
  exclusions: [],
  terms: [],
  cancellationPolicy: [],
  usefulTips: []
}

const ViewQuotationModal: React.FC<ViewQuotationModalProps> = ({ 
  isOpen, 
  onClose, 
  itineraryId, 
  queryId 
}) => {
  const [quotationData, setQuotationData] = useState<QuotationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [shareType, setShareType] = useState<'private' | 'public'>('private')
  const [clients, setClients] = useState<Array<{ id: string; name: string; email: string; phone: string; selected: boolean }>>([])
  const [ccMail, setCcMail] = useState<string>('')
  const [message, setMessage] = useState<string>('')
  const [sending, setSending] = useState(false)

  // Sample data structure - replace with actual API calls
  // const sampleQuotationData: QuotationData = {
  //   queryId: "100045",
  //   customerName: "Gajanand",
  //   destination: "Kerala",
  //   adults: 2,
  //   children: 0,
  //   nights: 4,
  //   days: 5,
  //   startDate: "Mon, 27 Oct, 2025",
  //   endDate: "Wed, 29 Oct, 2025",
  //   queryDate: "10-Oct-2025",
  //   totalPrice: 16654,
  //   hotels: [
  //     {
  //       city: "Munnar",
  //       hotelName: "June Boutique Villa (3 Star)",
  //       checkIn: "28-Oct-2025",
  //       checkOut: "30-Oct-2025",
  //       nights: 2,
  //       roomType: "Deluxe Balcony Room",
  //       mealPlan: "CP",
  //       rooms: 1
  //     }
  //   ],
  //   itinerary: [
  //     {
  //       day: 1,
  //       date: "27 Oct 2025",
  //       title: "Cochin to Munnar",
  //       description: "Transfer from Cochin to Munnar (4.5 Hours)",
  //       activities: [
  //         "Arrival at Cochin International Airport by 9 AM",
  //         "Scenic drive to Munnar",
  //         "Stop at Neriamangalam Bridge for views of Periyar Lake",
  //         "Visit Cheeyappara and Valara Waterfalls",
  //         "Experience ziplining and a fish spa at Pottas Fun Farm",
  //         "Optional visit to Punarjani Traditional Village for Kathakali and martial arts performances",
  //         "Check into Munnar hotel",
  //         "Unwind for a restful night"
  //       ]
  //     },
  //     {
  //       day: 2,
  //       date: "28 Oct 2025",
  //       title: "Munnar Local Sightseeing",
  //       description: "Munnar Sightseeing | With TOP STATION",
  //       activities: [
  //         "After breakfast, leave the hotel by 9 AM",
  //         "Visit Photo Point and Echo Point",
  //         "Experience jet-skiing at Matupetty Dam",
  //         "Visit Pullu Medu Elephant Viewpoint for wild elephants",
  //         "Continue to Yellapatty Grasslands (highlight of the tour)",
  //         "Ascend to Top Station for panoramic views of the Munnar landscape",
  //         "Overnight stay in Munnar"
  //       ]
  //     },
  //     {
  //       day: 3,
  //       date: "29 Oct 2025",
  //       title: "Munnar to Cochin",
  //       description: "Bid farewell to God's Own Country",
  //       activities: [
  //         "Beautiful sunrise, breakfast, and post-out from the hotel",
  //         "Transferred to Kochi Airport/Railway Station/Bus Stand",
  //         "More sightseeing options depending on flight timing",
  //         "Mattancherry—the Dutch Palace",
  //         "Paradesi Synagogue (ancient chandeliers)",
  //         "Fort Cochin—St. Francis Church (India's oldest European church)",
  //         "Santa Cruz Basilica",
  //         "Chinese Fishing Nets",
  //         "Views of MARINE Drive"
  //       ]
  //     }
  //   ],
  //   inclusions: [
  //     "Airport/Railway/Bus stop pick-up & drop",
  //     "Entire travel as per the itinerary in a private vehicle",
  //     "(Sedan/SUV/MUV/Tempo Traveller)",
  //     "Enter sightseeing as per the mentioned itinerary only",
  //     "Driver come guide",
  //     "All Permits, Tolls & Taxes",
  //     "Fuel expenses & Driver allowances"
  //   ],
  //   exclusions: [
  //     "To and from fares of airlines/buses/railways",
  //     "Entry Fee/Camera Fee/Activities/Rides not mentioned",
  //     "Any kind of food or beverage that is not included in the package, like alcoholic drinks, mineral water, meals/refreshments/lunches on the go"
  //   ],
  //   terms: [
  //     "Driver duty time will only be 8 AM to 7 PM, except for pick up",
  //     "Driver Extra time service according to the location of hotels and will be charged ₹250/- per hour",
  //     "Early morning pickups are only possible after 6 am",
  //     "The provided quotation is based on the specific itinerary discussed. Any extra kilometers or stops will incur extra charges, payable directly to the driver",
  //     "The Air conditioning in the room will not cool suddenly like in homes and hotels. It will take 30 minutes to 1 hour to be in full power",
  //     "The guest must go to the bedroom by 10 PM. It is not allowed to be outside after 10 PM",
  //     "A presence of flies and small insects is the natural habitat. It cannot be 100% eliminated",
  //     "Management will not be liable for missing things during the trip",
  //     "Please pack light, as we aim to travel minimally. Our itinerary is subject to change due to weather, road conditions, participant abilities, and other unforeseen circumstances",
  //     "We don't permit smoking during the movement in transport",
  //     "Travloger reserves the right to end your trip at any time due to inappropriate behavior/conduct. In such cases, no refunds will be issued",
  //     "The individual reserving the spot is liable for any harm caused to room/camp/resort outfitting and is responsible to pay for something similar",
  //     "If any sightseeing is cancelled due to bad weather conditions or unavoidable circumstances, no refund will be given",
  //     "Provided rates are subject to change based on availability/changes in Hotels, fuel rates, etc."
  //   ],
  //   cancellationPolicy: [
  //     "No refund shall be made with respect to the initial booking advance amount for any cancellations",
  //     "If cancellations are made 2015 days before the start date of the trip, 50% of the trip cost will be charged as cancellation fees",
  //     "If cancellations are made 15–7 days before the start date of the trip, 50% of the trip cost will be charged as cancellation fees",
  //     "If cancellations are made within 7 days before the start date of the trip, 75% of the trip cost will be charged as cancellation fees",
  //     "In the case of unforeseen weather conditions or government restrictions, certain activities may be cancelled, and in such cases, the operator will try his best to provide an alternate feasible activity. However, no refund will be provided for the same"
  //   ],
  //   usefulTips: [
  //     "Ensure that you know your preferred destination, activities, travel dates, and budget. This will help us recommend the best package for your needs",
  //     "Double-check what's covered in the package—flights, accommodations, meals, tours, and transfers—so there are no surprises later",
  //     "Be aware of cancellation or modification fees. Make sure you're comfortable with the flexibility offered in case of unexpected changes",
  //     "Inquire about any optional activities, resort fees, taxes, or tips that may not be included in the package price"
  //   ]
  // }

  const fetchQuotationData = useCallback(async () => {
    if (!itineraryId) return
    
    try {
      setLoading(true)
      console.log('🔄 Fetching quotation data for itinerary:', itineraryId, 'queryId:', queryId)
      
      const response = await fetch(`/api/quotation/${itineraryId}?queryId=${queryId}`, { cache: 'no-store' })
      const data = await response.json()
      
      if (response.ok && data.quotation) {
        console.log('✅ Quotation data loaded:', data.quotation)
        console.log('👤 Customer name:', data.quotation.customerName)
        console.log('🏨 Hotels count:', data.quotation.hotels.length)
        console.log('💰 Total price:', data.quotation.totalPrice)
        setQuotationData(data.quotation)
      } else {
        console.error('❌ Failed to fetch quotation data:', data.error)
        // Fallback to sample data if API fails
        setQuotationData(fallbackQuotationData)
      }
    } catch (error) {
      console.error('❌ Error fetching quotation data:', error)
      // Fallback to sample data if API fails
      setQuotationData(fallbackQuotationData)
    } finally {
      setLoading(false)
    }
  }, [itineraryId, queryId])

  useEffect(() => {
    if (isOpen && itineraryId) {
      fetchQuotationData()
    }
  }, [isOpen, itineraryId, fetchQuotationData])

  const handlePrint = () => {
    window.print()
  }

  const fetchClients = async () => {
    if (!queryId) return
    try {
      const response = await fetch(`/api/leads/${queryId}`)
      const data = await response.json()
      if (response.ok && data.lead) {
        setClients([{
          id: String(data.lead.id),
          name: data.lead.name || '',
          email: data.lead.email || '',
          phone: data.lead.phone || '',
          selected: true
        }])
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const handleEmail = async () => {
    await fetchClients()
    setShowEmailModal(true)
  }

  const handleSendEmail = async () => {
    const selectedClients = clients.filter(c => c.selected)
    if (selectedClients.length === 0 && !ccMail) {
      alert('Please select at least one client or add a CC email')
      return
    }

    try {
      setSending(true)
      const response = await fetch('/api/email/send-quotation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itineraryId,
          queryId,
          shareType,
          recipients: selectedClients.map(c => ({ email: c.email, name: c.name })),
          ccMail: ccMail || undefined,
          message: message || undefined,
          quotationData
        })
      })

      const data = await response.json()
      if (response.ok) {
        alert('Quotation sent successfully!')
        setShowEmailModal(false)
        setCcMail('')
        setMessage('')
      } else {
        alert(data.error || 'Failed to send quotation')
      }
    } catch (error: any) {
      alert(error?.message || 'Failed to send quotation')
    } finally {
      setSending(false)
    }
  }

  if (!isOpen) return null

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading quotation data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!quotationData) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">View Quotation</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Branding */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-blue-600">travloger.in</h1>
            <p className="text-gray-600 flex items-center justify-center gap-2">
              <Camera className="w-4 h-4" />
              ~You travel, We capture
            </p>
          </div>

          {/* Greeting */}
          <div>
            <p className="text-lg">Dear {quotationData.customerName},</p>
            <p className="mt-2">
              This is Travloger.in and I will be working with you to plan your trip to <strong>{quotationData.destination}</strong>. 
              Please find below details for your trip and feel free to call me at +919391203737 or{' '}
              <a href="#" className="text-red-600 underline">click here</a> to view more details about this trip.
            </p>
          </div>

          {/* Query Details */}
          <div className="bg-black text-white p-4 rounded">
            <h3 className="text-lg font-semibold mb-4">Query Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>QueryId:</strong> {quotationData.queryId}</div>
              <div><strong>Adult(s):</strong> {quotationData.adults}</div>
              <div><strong>Nights:</strong> {quotationData.nights} Nights & {quotationData.days} Days</div>
              <div><strong>Child(s):</strong> {quotationData.children}</div>
              <div><strong>Destination Covered:</strong> {quotationData.destination}, Cochin, Munnar</div>
              <div><strong>Start Date:</strong> {quotationData.startDate}</div>
              <div><strong>Query Date:</strong> {quotationData.queryDate}</div>
              <div><strong>End Date:</strong> {quotationData.endDate}</div>
            </div>
          </div>

          {/* Hotel Details */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Hotel Details</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 text-left">City</th>
                    <th className="border border-gray-300 p-2 text-left">Hotel Name</th>
                    <th className="border border-gray-300 p-2 text-left">Check In</th>
                    <th className="border border-gray-300 p-2 text-left">Check Out</th>
                    <th className="border border-gray-300 p-2 text-left">Nights</th>
                    <th className="border border-gray-300 p-2 text-left">Room Type</th>
                    <th className="border border-gray-300 p-2 text-left">Meal Plan</th>
                  </tr>
                </thead>
                <tbody>
                  {quotationData.hotels.map((hotel, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 p-2">{hotel.city}</td>
                      <td className="border border-gray-300 p-2">
                        {hotel.hotelName}
                        <div className="text-sm text-gray-600">Double Room: {hotel.rooms}</div>
                      </td>
                      <td className="border border-gray-300 p-2">{hotel.checkIn}</td>
                      <td className="border border-gray-300 p-2">{hotel.checkOut}</td>
                      <td className="border border-gray-300 p-2">{hotel.nights}</td>
                      <td className="border border-gray-300 p-2">{hotel.roomType}</td>
                      <td className="border border-gray-300 p-2">{hotel.mealPlan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Itinerary Details */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Itinerary Details</h3>
            {quotationData.itinerary.map((day, index) => (
              <div key={index} className="mb-6">
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-sm text-gray-500">{day.date}</span>
                  <h4 className="text-lg font-semibold">Day {day.day}: {day.title}</h4>
                </div>
                <p className="text-gray-700 mb-3">{day.description}</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  {day.activities.map((activity, actIndex) => (
                    <li key={actIndex}>{activity}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Inclusions & Exclusions */}
          <div>
            <h3 className="text-xl font-bold mb-4">Inclusions & Exclusions</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold mb-2">Inclusion</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {quotationData.inclusions.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold mb-2">Exclusion</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {quotationData.exclusions.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Useful Tips */}
          <div>
            <h3 className="text-lg font-bold mb-4">Useful Tips Before Booking</h3>
            <div className="space-y-3">
              {quotationData.usefulTips.map((tip, index) => (
                <div key={index}>
                  <h4 className="font-semibold text-sm">{tip.split(':')[0]}:</h4>
                  <p className="text-sm text-gray-600">{tip.split(':')[1]}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Cancellation Policy */}
          <div>
            <h3 className="text-lg font-bold mb-4">Cancellation Policy</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {quotationData.cancellationPolicy.map((policy, index) => (
                <li key={index}>{policy}</li>
              ))}
            </ul>
          </div>

          {/* Terms and Conditions */}
          <div>
            <h3 className="text-lg font-bold mb-4">Terms and Conditions</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {quotationData.terms.map((term, index) => (
                <li key={index} className={term.includes('bold') ? 'font-semibold' : ''}>
                  {term.replace('bold', '')}
                </li>
              ))}
            </ul>
          </div>

          {/* Total Package Price */}
          <div className="text-center py-6 border-t">
            <h3 className="text-2xl font-bold">
              Total Package Price: <strong>{quotationData.totalPrice.toLocaleString('en-IN')} INR</strong>
            </h3>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 pt-6 border-t">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Printer className="w-4 h-4" />
              Print Quotation
            </button>
            <button
              onClick={handleEmail}
              className="flex items-center gap-2 px-6 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
            >
              <Mail className="w-4 h-4" />
              Send To Email
            </button>
          </div>
        </div>
      </div>

      {/* Send Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gray-800 text-white px-6 py-3 flex items-center justify-between">
              <h2 className="text-xl font-semibold">View Quotation</h2>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-white hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Share Options */}
              <div>
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setShareType('private')}
                    className={`flex-1 py-3 px-4 rounded ${shareType === 'private' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800 border border-gray-300'}`}
                  >
                    SHARE PRIVATELY
                  </button>
                  <button
                    onClick={() => setShareType('public')}
                    className={`flex-1 py-3 px-4 rounded ${shareType === 'public' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800 border border-gray-300'}`}
                  >
                    SHARE PUBLICLY
                  </button>
                </div>
                {shareType === 'private' && (
                  <p className="text-sm text-gray-600">
                    Share your itinerary privately via email to specific recipients. Recipients will be prompted to create a login in order to view this itinerary.
                  </p>
                )}
              </div>

              {/* Clients Section */}
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Clients</h3>
                <p className="text-sm text-gray-600 mb-4">Select client you would like to email this itinerary to.</p>
                
                <div className="space-y-3">
                  {clients.map((client) => (
                    <div key={client.id} className="flex items-center gap-4 p-3 border rounded">
                      <input
                        type="checkbox"
                        checked={client.selected}
                        onChange={(e) => {
                          setClients(prev => prev.map(c => 
                            c.id === client.id ? { ...c, selected: e.target.checked } : c
                          ))
                        }}
                        className="w-5 h-5 text-blue-600"
                      />
                      <input
                        type="text"
                        value={client.name}
                        onChange={(e) => {
                          setClients(prev => prev.map(c => 
                            c.id === client.id ? { ...c, name: e.target.value } : c
                          ))
                        }}
                        className="flex-1 border rounded px-3 py-2 text-sm"
                        placeholder="Name"
                      />
                      <input
                        type="email"
                        value={client.email}
                        onChange={(e) => {
                          setClients(prev => prev.map(c => 
                            c.id === client.id ? { ...c, email: e.target.value } : c
                          ))
                        }}
                        className="flex-1 border rounded px-3 py-2 text-sm"
                        placeholder="Email"
                      />
                      <input
                        type="tel"
                        value={client.phone}
                        onChange={(e) => {
                          setClients(prev => prev.map(c => 
                            c.id === client.id ? { ...c, phone: e.target.value } : c
                          ))
                        }}
                        className="flex-1 border rounded px-3 py-2 text-sm"
                        placeholder="Phone"
                      />
                    </div>
                  ))}
                </div>

                {/* CC Mail */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">CC Mail</label>
                  <input
                    type="email"
                    value={ccMail}
                    onChange={(e) => setCcMail(e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="cc@example.com"
                  />
                </div>
              </div>

              {/* Add a Message */}
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Add a message</h3>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm h-32 resize-none"
                  placeholder="Enter message here"
                />
              </div>

              {/* Send Button */}
              <div className="flex justify-end pt-4 border-t">
                <button
                  onClick={handleSendEmail}
                  disabled={sending}
                  className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ViewQuotationModal
