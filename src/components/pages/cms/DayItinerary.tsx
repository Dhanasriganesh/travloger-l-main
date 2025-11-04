import React, { useState, useEffect } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Plus, Search, Edit, Trash2, ArrowLeft, FolderOpen } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Activity { id: number; name: string; destination?: string }
interface Transfer { id: number; name: string; destination?: string }
interface Hotel { id: string; name: string; destination?: string }
interface MealPlan { code: string; description?: string }

interface DayPlan {
  title: string
  description: string
  activityIds: number[]
  transferIds: number[]
  mealCodes: string[]
  notes: string
}

interface DayItineraryItem {
  id: number
  name: string
  destinations: string[]
  numDays: number
  days: DayPlan[]
  status: string
  created_by: string
  date: string
}

const DayItinerary: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [dayItineraries, setDayItineraries] = useState<DayItineraryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingDayItinerary, setEditingDayItinerary] = useState<DayItineraryItem | null>(null)
  
  // Masters
  const [destinations, setDestinations] = useState<string[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([])
  
  const [destinationInput, setDestinationInput] = useState('')
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    destinations: [] as string[],
    numDays: 1,
    days: [
      { title: '', description: '', activityIds: [] as number[], transferIds: [] as number[], mealCodes: [] as string[], notes: '' }
    ] as DayPlan[],
    status: 'Active'
  })

  useEffect(() => {
    fetchDayItineraries()
    fetchMasters()
  }, [])

  const fetchMasters = async () => {
    try {
      const [destRes, actRes, trRes, hotelRes, mealRes] = await Promise.all([
        fetch('/api/destinations'),
        fetch('/api/activities'),
        fetch('/api/transfers'),
        fetch('/api/hotels'),
        fetch('/api/meal-plans')
      ])
      const [destData, actData, trData, hotelData, mealData] = await Promise.all([
        destRes.json(), actRes.json(), trRes.json(), hotelRes.json(), mealRes.json()
      ])
      setDestinations((destData.destinations || []).map((d: any) => d.name))
      setActivities((actData.activities || []).map((a: any) => ({ id: a.id, name: a.name, destination: a.destination })))
      setTransfers((trData.transfers || []).map((t: any) => ({ id: t.id, name: t.name || t.transfer_name, destination: t.destination })))
      setHotels((hotelData.hotels || []).map((h: any) => ({ id: h.id, name: h.name, destination: h.destination })))
      setMealPlans((mealData.mealPlans || []).map((m: any) => ({ code: m.code, description: m.description })))
    } catch (_) {
      // Silent fail keeps UI usable
    }
  }

  const fetchDayItineraries = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/day-itineraries')
      const data = await response.json()
      
      if (response.ok) {
        const items: DayItineraryItem[] = (data.dayItineraries || []).map((it: any) => ({
          id: it.id,
          name: it.name || it.title || '',
          destinations: it.destinations || [],
          numDays: it.numDays || (it.days?.length || 1),
          days: (it.days || []).map((d: any) => ({
            title: d.title || '',
            description: d.description || d.detail || '',
            activityIds: d.activityIds || [],
            transferIds: d.transferIds || [],
            mealCodes: d.mealCodes || [],
            notes: d.notes || ''
          })),
          status: it.status || 'Active',
          created_by: it.created_by,
          date: it.date
        }))
        setDayItineraries(items)
      } else {
        console.error('Failed to fetch day itineraries:', data.error)
      }
    } catch (error) {
      console.error('Error fetching day itineraries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDayItinerary = async () => {
    if (!formData.name.trim()) {
      alert('Please enter itinerary name')
      return
    }
    if (!formData.destinations.length) {
      alert('Please select at least one destination')
      return
    }
    if (formData.numDays < 1) {
      alert('Number of days must be at least 1')
      return
    }

    try {
      setSaving(true)
      const method = editingDayItinerary ? 'PUT' : 'POST'
      const body = editingDayItinerary 
        ? { id: editingDayItinerary.id, ...formData }
        : formData

      const response = await fetch('/api/day-itineraries', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (response.ok) {
        await fetchDayItineraries()
        setShowAddForm(false)
        setFormData({ name: '', destinations: [], numDays: 1, days: [{ title: '', description: '', activityIds: [], transferIds: [], mealCodes: [], notes: '' }], status: 'Active' })
        setEditingDayItinerary(null)
        alert(data.message || 'Day itinerary saved successfully')
      } else {
        alert(data.error || 'Failed to save day itinerary')
      }
    } catch (error) {
      console.error('Error saving day itinerary:', error)
      alert('Error saving day itinerary')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteDayItinerary = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/day-itineraries?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        await fetchDayItineraries()
        alert(data.message || 'Day itinerary deleted successfully')
      } else {
        alert(data.error || 'Failed to delete day itinerary')
      }
    } catch (error) {
      console.error('Error deleting day itinerary:', error)
      alert('Error deleting day itinerary')
    }
  }

  const handleEditClick = (dayItinerary: DayItineraryItem) => {
    setEditingDayItinerary(dayItinerary)
    setFormData({
      name: dayItinerary.name,
      destinations: dayItinerary.destinations || [],
      numDays: dayItinerary.numDays || Math.max(1, dayItinerary.days?.length || 1),
      days: (dayItinerary.days && dayItinerary.days.length ? dayItinerary.days : [{ title: '', description: '', activityIds: [], transferIds: [], mealCodes: [], notes: '' }]),
      status: dayItinerary.status
    })
    setShowAddForm(true)
  }

  const handleCloseForm = () => {
    setShowAddForm(false)
    setEditingDayItinerary(null)
    setFormData({ name: '', destinations: [], numDays: 1, days: [{ title: '', description: '', activityIds: [], transferIds: [], mealCodes: [], notes: '' }], status: 'Active' })
    setDestinationInput('')
    setShowDestinationSuggestions(false)
  }

  const filteredDayItineraries = dayItineraries.filter(di =>
    (di.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading day itineraries...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/settings/admin')}
                className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                <span className="text-xs">Back to Admin Settings</span>
              </button>
              <h1 className="text-lg font-bold text-gray-900">Day Itinerary</h1>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
                <Input
                  type="text"
                  placeholder="Search by name"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-40 h-8"
                />
              </div>
            </div>
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 text-sm"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Day Itinerary
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <Card>
          <CardContent className="p-0">
            <div className="overflow-hidden">
              <table className="w-full table-fixed">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Icon</th>
                    <th className="w-56 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Itinerary Name</th>
                    <th className="w-64 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destinations</th>
                    <th className="w-16 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                    <th className="w-20 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="w-20 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">By</th>
                    <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="w-12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                    <th className="w-12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDayItineraries.map((dayItinerary) => (
                    <tr key={dayItinerary.id} className="hover:bg-gray-50">
                      <td className="px-3 py-4 text-sm text-gray-900">
                        <FolderOpen className="h-5 w-5 text-orange-500" />
                      </td>
                      <td className="px-3 py-4 text-sm font-medium text-gray-900 truncate">{dayItinerary.name}</td>
                      <td className="px-3 py-4 text-sm text-gray-900 truncate">{(dayItinerary.destinations || []).join(', ') || '-'}</td>
                      <td className="px-3 py-4 text-sm text-gray-900">{dayItinerary.numDays}</td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        <Badge variant="success" className="bg-green-600 text-white">
                          {dayItinerary.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        <div className="flex items-center gap-1">
                          <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">T</span>
                          </div>
                          <span className="text-xs truncate">{dayItinerary.created_by}</span>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        {dayItinerary.date}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        <button 
                          onClick={() => handleEditClick(dayItinerary)}
                          className="hover:text-gray-700"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        <button 
                          onClick={() => handleDeleteDayItinerary(dayItinerary.id, dayItinerary.name)}
                          className="hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 text-sm text-gray-600">
          Total Records: {filteredDayItineraries.length}
        </div>
      </div>

      {/* Add Day Itinerary Form Panel */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div 
            className="absolute inset-0 backdrop-blur-sm"
            onClick={handleCloseForm}
          />
          
          <div className="absolute right-0 top-0 h-full w-[500px] bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingDayItinerary ? 'Edit Day Itinerary' : 'Add Day Itinerary'}
                </h2>
                <button
                  onClick={handleCloseForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 p-6 overflow-y-auto">
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-0 top-0 h-full w-0.5 bg-red-500 rounded-l-sm"></div>
                      <Input 
                        type="text" 
                        className="pl-3.5"
                        placeholder="Enter day itinerary name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Destinations <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Input 
                        type="text" 
                        placeholder="Type to search destinations..."
                        value={destinationInput}
                        onChange={(e) => {
                          setDestinationInput(e.target.value)
                          setShowDestinationSuggestions(true)
                        }}
                        onFocus={() => setShowDestinationSuggestions(true)}
                        className="border-l-2 border-red-500"
                      />
                      
                      {showDestinationSuggestions && destinationInput && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                          {destinations
                            .filter(d => d.toLowerCase().includes(destinationInput.toLowerCase()))
                            .map((destination, idx) => (
                              <button
                                key={idx}
                                type="button"
                                className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm"
                                onClick={() => {
                                  if (!formData.destinations.includes(destination)) {
                                    setFormData({...formData, destinations: [...formData.destinations, destination]})
                                  }
                                  setDestinationInput('')
                                  setShowDestinationSuggestions(false)
                                }}
                              >
                                {destination}
                              </button>
                            ))}
                          {destinations.filter(d => d.toLowerCase().includes(destinationInput.toLowerCase())).length === 0 && (
                            <div className="px-4 py-2 text-sm text-gray-500">No destinations found</div>
                          )}
                        </div>
                      )}
                    </div>
                    {formData.destinations.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {formData.destinations.map((dest, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs">
                            {dest}
                            <button
                              type="button"
                              onClick={() => setFormData({...formData, destinations: formData.destinations.filter((_, i) => i !== idx)})}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Number of Days</label>
                    <Input 
                      type="number" 
                      value={formData.numDays}
                      onChange={(e) => {
                        const val = Math.max(1, parseInt(e.target.value || '1', 10))
                        const nextDays = [...formData.days]
                        if (val > nextDays.length) {
                          while (nextDays.length < val) {
                            nextDays.push({ title: '', description: '', activityIds: [], transferIds: [], mealCodes: [], notes: '' })
                          }
                        } else if (val < nextDays.length) {
                          nextDays.splice(val)
                        }
                        setFormData({ ...formData, numDays: val, days: nextDays })
                      }}
                    />
                  </div>

                  {/* Per-day builder */}
                  <div className="space-y-3">
                    {formData.days.map((day, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-md p-3 bg-gray-50">
                        <div className="mb-2 text-sm font-semibold text-gray-800">Day {idx + 1}</div>
                        <div className="grid grid-cols-1 gap-2">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Title</label>
                            <Input type="text" value={day.title} onChange={(e) => {
                              const next = [...formData.days]
                              next[idx] = { ...next[idx], title: e.target.value }
                              setFormData({ ...formData, days: next })
                            }} />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Description</label>
                            <textarea 
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                              rows={3}
                              value={day.description}
                              onChange={(e) => {
                                const next = [...formData.days]
                                next[idx] = { ...next[idx], description: e.target.value }
                                setFormData({ ...formData, days: next })
                              }}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Activities</label>
                            <select
                              className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  const activityId = parseInt(e.target.value, 10)
                                  const next = [...formData.days]
                                  const currentIds = next[idx].activityIds
                                  if (!currentIds.includes(activityId)) {
                                    next[idx] = { ...next[idx], activityIds: [...currentIds, activityId] }
                                    setFormData({ ...formData, days: next })
                                  }
                                  e.target.value = ''
                                }
                              }}
                            >
                              <option value="">Select activity</option>
                              {activities
                                .filter(a => !formData.destinations.length || !a.destination || formData.destinations.includes(a.destination))
                                .map(a => (
                                  <option key={a.id} value={a.id}>
                                    {a.name}{a.destination ? ` (${a.destination})` : ''}
                                  </option>
                                ))}
                            </select>
                            {day.activityIds.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {day.activityIds.map((activityId) => {
                                  const activity = activities.find(a => a.id === activityId)
                                  if (!activity) return null
                                  return (
                                    <span key={activityId} className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs">
                                      {activity.name}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const next = [...formData.days]
                                          next[idx] = { ...next[idx], activityIds: next[idx].activityIds.filter(id => id !== activityId) }
                                          setFormData({ ...formData, days: next })
                                        }}
                                        className="text-green-600 hover:text-green-800"
                                      >
                                        ×
                                      </button>
                                    </span>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Transfers</label>
                            <select
                              className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  const transferId = parseInt(e.target.value, 10)
                                  const next = [...formData.days]
                                  const currentIds = next[idx].transferIds
                                  if (!currentIds.includes(transferId)) {
                                    next[idx] = { ...next[idx], transferIds: [...currentIds, transferId] }
                                    setFormData({ ...formData, days: next })
                                  }
                                  e.target.value = ''
                                }
                              }}
                            >
                              <option value="">Select transfer</option>
                              {transfers
                                .filter(t => !formData.destinations.length || !t.destination || formData.destinations.includes(t.destination))
                                .map(t => (
                                  <option key={t.id} value={t.id}>
                                    {t.name}{t.destination ? ` (${t.destination})` : ''}
                                  </option>
                                ))}
                            </select>
                            {day.transferIds.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {day.transferIds.map((transferId) => {
                                  const transfer = transfers.find(t => t.id === transferId)
                                  if (!transfer) return null
                                  return (
                                    <span key={transferId} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-md text-xs">
                                      {transfer.name}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const next = [...formData.days]
                                          next[idx] = { ...next[idx], transferIds: next[idx].transferIds.filter(id => id !== transferId) }
                                          setFormData({ ...formData, days: next })
                                        }}
                                        className="text-purple-600 hover:text-purple-800"
                                      >
                                        ×
                                      </button>
                                    </span>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Meals Included</label>
                            <div className="flex flex-wrap gap-2">
                              {mealPlans.filter(mp => mp.code).map((mp, mpIdx) => {
                                const checked = day.mealCodes.includes(mp.code)
                                return (
                                  <label key={`${mp.code}-${mpIdx}`} className="flex items-center gap-1 text-xs">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={(e) => {
                                        const next = [...formData.days]
                                        const current = new Set(next[idx].mealCodes)
                                        if (e.target.checked) current.add(mp.code); else current.delete(mp.code)
                                        next[idx] = { ...next[idx], mealCodes: Array.from(current) }
                                        setFormData({ ...formData, days: next })
                                      }}
                                    />
                                    {mp.code}{mp.description ? ` - ${mp.description}` : ''}
                                  </label>
                                )
                              })}
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Notes</label>
                            <Input type="text" value={day.notes} onChange={(e) => {
                              const next = [...formData.days]
                              next[idx] = { ...next[idx], notes: e.target.value }
                              setFormData({ ...formData, days: next })
                            }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-gray-200">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleCloseForm}
                    className="flex-1"
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveDayItinerary}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : (editingDayItinerary ? 'Update' : 'Save')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DayItinerary