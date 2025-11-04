import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Card, CardContent } from '../../ui/card'
import { ArrowLeft, MoreVertical, Star } from 'lucide-react'
import ErrorBoundary from '../../ErrorBoundary'
import { fetchApi, handleApiError } from '../../../lib/api'

type Hotel = {
  id: string
  name: string
  category: number
  destination: string
}

type RoomType = { id: number, name: string }

type HotelRate = {
  id: number
  hotel_id: string
  from_date: string
  to_date: string
  from_date_formatted: string
  to_date_formatted: string
  room_type: string
  meal_plan: string
  single: number
  double: number
  triple: number
  quad: number
  cwb: number
  cnb: number
}

const HotelRates: React.FC = () => {
  const navigate = useNavigate()
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [destinations, setDestinations] = useState<string[]>([])
  const [selectedDestination, setSelectedDestination] = useState<string>('')
  const [selectedHotelId, setSelectedHotelId] = useState<string>('')
  const [rates, setRates] = useState<HotelRate[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [mealPlans, setMealPlans] = useState<{ code: string, description?: string }[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [loadingRates, setLoadingRates] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)
  const [rateError, setRateError] = useState<string | null>(null)
  const [rateMenuOpen, setRateMenuOpen] = useState<number | null>(null)
  const [editingRate, setEditingRate] = useState<HotelRate | null>(null)

  const [rateForm, setRateForm] = useState({
    fromDate: '',
    toDate: '',
    roomType: '',
    mealPlan: 'AP',
    single: '',
    double: '',
    triple: '',
    quad: '',
    cwb: '',
    cnb: '',
    seasonName: '',
    costPrice: '',
    sellingPrice: '',
    currency: 'INR',
    extraAdult: '',
    extraChild: '',
    weekendRateDiff: '',
    weekdayRateDiff: '',
    rateNotes: '',
    status: 'Active'
  })

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true)
        const [hotelsData, roomTypesData, mealPlansData, destinationsData] = await Promise.all([
          fetchApi('/api/hotels'),
          fetchApi('/api/room-types'),
          fetchApi('/api/meal-plans'),
          fetchApi('/api/destinations')
        ])
        setHotels(hotelsData.hotels || [])
        setRoomTypes(roomTypesData.roomTypes || [])
        const plans = (mealPlansData.mealPlans || []).map((mp: any) => ({ code: mp.code, description: mp.description }))
        setMealPlans(plans)
        setDestinations((destinationsData.destinations || []).map((d: any) => d.name))
      } catch (err) {
        console.error('Error initializing Hotel Rates:', handleApiError(err))
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const currentHotel = useMemo(() => hotels.find(h => h.id === selectedHotelId) || null, [hotels, selectedHotelId])
  const filteredHotels = useMemo(() => {
    if (!selectedDestination) return hotels
    return hotels.filter(h => (h.destination || '').toLowerCase() === selectedDestination.toLowerCase())
  }, [hotels, selectedDestination])

  const fetchRates = async (hotelId: string) => {
    try {
      setLoadingRates(true)
      const data = await fetchApi(`/api/hotel-rates?hotelId=${hotelId}`)
      setRates(data.rates || [])
    } catch (error) {
      console.error('Error fetching rates:', handleApiError(error))
      setRateError(handleApiError(error))
    } finally {
      setLoadingRates(false)
    }
  }

  const resetForm = () => {
    setEditingRate(null)
    setRateForm({
      fromDate: '',
      toDate: '',
      roomType: '',
      mealPlan: 'AP',
      single: '',
      double: '',
      triple: '',
      quad: '',
      cwb: '',
      cnb: '',
      seasonName: '',
      costPrice: '',
      sellingPrice: '',
      currency: 'INR',
      extraAdult: '',
      extraChild: '',
      weekendRateDiff: '',
      weekdayRateDiff: '',
      rateNotes: '',
      status: 'Active'
    })
  }

  const handleAddOrUpdateRate = async () => {
    if (!currentHotel || !rateForm.fromDate || !rateForm.toDate || !rateForm.roomType) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setSaving(true)
      const body = {
        hotelId: currentHotel.id,
        fromDate: rateForm.fromDate,
        toDate: rateForm.toDate,
        roomType: rateForm.roomType,
        mealPlan: rateForm.mealPlan,
        single: parseFloat(rateForm.single) || 0,
        double: parseFloat(rateForm.double) || 0,
        triple: parseFloat(rateForm.triple) || 0,
        quad: parseFloat(rateForm.quad) || 0,
        cwb: parseFloat(rateForm.cwb) || 0,
        cnb: parseFloat(rateForm.cnb) || 0,
        seasonName: rateForm.seasonName,
        costPrice: parseFloat(rateForm.costPrice) || 0,
        sellingPrice: parseFloat(rateForm.sellingPrice) || 0,
        currency: rateForm.currency || 'INR',
        extraAdult: parseFloat(rateForm.extraAdult) || 0,
        extraChild: parseFloat(rateForm.extraChild) || 0,
        weekendRateDiff: parseFloat(rateForm.weekendRateDiff) || 0,
        weekdayRateDiff: parseFloat(rateForm.weekdayRateDiff) || 0,
        notes: rateForm.rateNotes,
        status: rateForm.status
      }
      const method = editingRate ? 'PUT' : 'POST'
      const resp = await fetchApi('/api/hotel-rates', {
        method,
        body: JSON.stringify(editingRate ? { id: editingRate.id, ...body } : body)
      })
      if (resp) {
        await fetchRates(currentHotel.id)
        resetForm()
      }
    } catch (error) {
      console.error('Error saving rate:', handleApiError(error))
      alert(handleApiError(error))
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteRate = async (id: number) => {
    if (!confirm('Are you sure you want to delete this rate?')) return
    try {
      await fetchApi(`/api/hotel-rates?id=${id}`, { method: 'DELETE' })
      if (currentHotel) {
        await fetchRates(currentHotel.id)
      }
    } catch (error) {
      console.error('Error deleting rate:', handleApiError(error))
      alert(handleApiError(error))
    }
  }

  const renderStars = (category: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`h-3 w-3 ${i < category ? 'text-orange-500 fill-current' : 'text-gray-300'}`} />
    ))
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
              <h1 className="text-lg font-bold text-gray-900">Hotel Rate Master</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-4">
                <label className="block text-xs text-gray-600 mb-1">Destination</label>
                <select
                  className="w-full h-9 px-2 border border-gray-300 rounded text-sm"
                  value={selectedDestination}
                  onChange={(e) => {
                    const dest = e.target.value
                    setSelectedDestination(dest)
                    setSelectedHotelId('')
                    setRates([])
                    setRateError(null)
                  }}
                >
                  <option value="">Choose destination</option>
                  {destinations.map((d, idx) => (
                    <option key={`${d}-${idx}`} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-4">
                <label className="block text-xs text-gray-600 mb-1">Select Hotel</label>
                <select
                  className="w-full h-9 px-2 border border-gray-300 rounded text-sm"
                  value={selectedHotelId}
                  onChange={async (e) => {
                    const id = e.target.value
                    setSelectedHotelId(id)
                    setRateError(null)
                    setRates([])
                    if (id) await fetchRates(id)
                  }}
                  disabled={!selectedDestination}
                  title={!selectedDestination ? 'Select destination first' : undefined}
                >
                  <option value="">{selectedDestination ? 'Choose hotel' : 'Select destination first'}</option>
                  {selectedDestination && filteredHotels.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>
              {currentHotel && (
                <div className="col-span-4 text-xs text-gray-700 flex items-center gap-2">
                  <span className="font-semibold">{currentHotel.name}</span>
                  <span className="inline-flex items-center gap-1">{renderStars(currentHotel.category)}</span>
                  <span className="text-gray-500">{currentHotel.destination}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {currentHotel && (
          <div className="mt-4 bg-white rounded-lg shadow border border-gray-200">
            <ErrorBoundary>
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900">Create / Update Rate</h2>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-12 gap-2 mb-2">
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">From Date</label>
                    <Input type="date" value={rateForm.fromDate} onChange={(e) => setRateForm({ ...rateForm, fromDate: e.target.value })} className="h-8" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">To</label>
                    <Input type="date" value={rateForm.toDate} onChange={(e) => setRateForm({ ...rateForm, toDate: e.target.value })} className="h-8" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">Room Type</label>
                    <select className="w-full h-8 px-2 border border-gray-300 rounded text-sm" value={rateForm.roomType} onChange={(e) => setRateForm({ ...rateForm, roomType: e.target.value })}>
                      <option value="">Select</option>
                      {roomTypes.map(rt => <option key={rt.id} value={rt.name}>{rt.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">Meal Plan</label>
                    <select className="w-full h-8 px-2 border border-gray-300 rounded text-sm" value={rateForm.mealPlan} onChange={(e) => setRateForm({ ...rateForm, mealPlan: e.target.value })}>
                      <option value="">Select</option>
                      {mealPlans.filter(mp => !!mp.code).map((mp, idx) => (
                        <option key={`${mp.code}-${idx}`} value={mp.code}>
                          {mp.code}{mp.description ? ` - ${mp.description}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-2 mb-2">
                  <div className="col-span-3">
                    <label className="block text-xs text-gray-600 mb-1">Season</label>
                    <Input type="text" value={rateForm.seasonName} onChange={(e) => setRateForm({ ...rateForm, seasonName: e.target.value })} className="h-8" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">Currency</label>
                    <Input type="text" value={rateForm.currency} onChange={(e) => setRateForm({ ...rateForm, currency: e.target.value })} className="h-8" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">Cost Price</label>
                    <Input type="number" value={rateForm.costPrice} onChange={(e) => setRateForm({ ...rateForm, costPrice: e.target.value })} className="h-8" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">Selling Price</label>
                    <Input type="number" value={rateForm.sellingPrice} onChange={(e) => setRateForm({ ...rateForm, sellingPrice: e.target.value })} className="h-8" />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs text-gray-600 mb-1">Extra Adult / Child</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input type="number" value={rateForm.extraAdult} onChange={(e) => setRateForm({ ...rateForm, extraAdult: e.target.value })} className="h-8" placeholder="Adult" />
                      <Input type="number" value={rateForm.extraChild} onChange={(e) => setRateForm({ ...rateForm, extraChild: e.target.value })} className="h-8" placeholder="Child" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-2 mb-2">
                  <div className="col-span-3">
                    <label className="block text-xs text-gray-600 mb-1">Weekend Diff</label>
                    <Input type="number" value={rateForm.weekendRateDiff} onChange={(e) => setRateForm({ ...rateForm, weekendRateDiff: e.target.value })} className="h-8" />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs text-gray-600 mb-1">Weekday Diff</label>
                    <Input type="number" value={rateForm.weekdayRateDiff} onChange={(e) => setRateForm({ ...rateForm, weekdayRateDiff: e.target.value })} className="h-8" />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs text-gray-600 mb-1">Status</label>
                    <select className="w-full h-8 px-2 border border-gray-300 rounded text-sm" value={rateForm.status} onChange={(e) => setRateForm({ ...rateForm, status: e.target.value })}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="col-span-3 flex items-end">
                    <Button onClick={handleAddOrUpdateRate} className="bg-blue-600 hover:bg-blue-700 text-white h-8 w-full" disabled={saving}>
                      {saving ? 'Saving...' : editingRate ? 'Update' : 'Add'}
                    </Button>
                  </div>
                </div>

                <div className="mb-2">
                  <label className="block text-xs text-gray-600 mb-1">Notes</label>
                  <Input type="text" value={rateForm.rateNotes} onChange={(e) => setRateForm({ ...rateForm, rateNotes: e.target.value })} />
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Rate List</h3>
                {rateError ? (
                  <div className="text-center py-4">
                    <div className="text-red-600 text-sm">{rateError}</div>
                    <button
                      onClick={() => {
                        setRateError(null)
                        if (currentHotel) fetchRates(currentHotel.id)
                      }}
                      className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Try Again
                    </button>
                  </div>
                ) : loadingRates ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">From</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">To</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Room Type</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Meal Plan</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Season</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Cost</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Selling</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Currency</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Extra Adult</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Extra Child</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Weekend Diff</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Weekday Diff</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Notes</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {rates.map((rate) => (
                          <tr key={rate.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-xs text-gray-900">{rate.from_date_formatted}</td>
                            <td className="px-3 py-2 text-xs text-gray-900">{rate.to_date_formatted}</td>
                            <td className="px-3 py-2 text-xs text-gray-900">{rate.room_type}</td>
                            <td className="px-3 py-2 text-xs text-gray-900">{rate.meal_plan}</td>
                            <td className="px-3 py-2 text-xs text-gray-900">{(rate as any).season_name || '-'}</td>
                            <td className="px-3 py-2 text-xs text-gray-900">{(rate as any).cost_price ?? '-'}</td>
                            <td className="px-3 py-2 text-xs text-gray-900">{(rate as any).selling_price ?? '-'}</td>
                            <td className="px-3 py-2 text-xs text-gray-900">{(rate as any).currency || '-'}</td>
                            <td className="px-3 py-2 text-xs text-gray-900">{(rate as any).extra_adult ?? '-'}</td>
                            <td className="px-3 py-2 text-xs text-gray-900">{(rate as any).extra_child ?? '-'}</td>
                            <td className="px-3 py-2 text-xs text-gray-900">{(rate as any).weekend_rate_diff ?? '-'}</td>
                            <td className="px-3 py-2 text-xs text-gray-900">{(rate as any).weekday_rate_diff ?? '-'}</td>
                            <td className="px-3 py-2 text-xs text-gray-900">{(rate as any).status || '-'}</td>
                            <td className="px-3 py-2 text-xs text-gray-900">{(rate as any).notes || '-'}</td>
                            <td className="px-3 py-2 relative">
                              <button onClick={() => setRateMenuOpen(rateMenuOpen === rate.id ? null : rate.id)} className="text-gray-400 hover:text-gray-600">
                                <MoreVertical className="h-4 w-4" />
                              </button>
                              {rateMenuOpen === rate.id && (
                                <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                                  <button
                                    onClick={() => {
                                      setEditingRate(rate)
                                      setRateForm({
                                        fromDate: rate.from_date,
                                        toDate: rate.to_date,
                                        roomType: rate.room_type,
                                        mealPlan: rate.meal_plan,
                                        single: rate.single.toString(),
                                        double: rate.double.toString(),
                                        triple: rate.triple.toString(),
                                        quad: rate.quad.toString(),
                                        cwb: rate.cwb.toString(),
                                        cnb: rate.cnb.toString(),
                                        seasonName: (rate as any).season_name || '',
                                        costPrice: ((rate as any).cost_price ?? '').toString(),
                                        sellingPrice: ((rate as any).selling_price ?? '').toString(),
                                        currency: (rate as any).currency || 'INR',
                                        extraAdult: ((rate as any).extra_adult ?? '').toString(),
                                        extraChild: ((rate as any).extra_child ?? '').toString(),
                                        weekendRateDiff: ((rate as any).weekend_rate_diff ?? '').toString(),
                                        weekdayRateDiff: ((rate as any).weekday_rate_diff ?? '').toString(),
                                        rateNotes: (rate as any).notes || '',
                                        status: (rate as any).status || 'Active'
                                      })
                                      setRateMenuOpen(null)
                                    }}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteRate(rate.id)}
                                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                        {rates.length === 0 && (
                          <tr>
                            <td colSpan={15} className="px-3 py-4 text-center text-sm text-gray-500">No rates added yet</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </ErrorBoundary>
          </div>
        )}
      </div>
    </div>
  )
}

export default HotelRates


