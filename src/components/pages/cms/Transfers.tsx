import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Plus, Search, Edit, Trash2, ArrowLeft, Download, Upload, FileDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Transfer {
  id: number
  query_name: string
  destination: string
  price: number
  content: string
  photo_url: string
  status: string
  created_by: string
  date: string
  // new optional fields from API
  supplier_id?: number
  vehicle_type?: string
  distance_duration?: string
  rate_type?: string
  base_rate?: number
  extra_km_rate?: number
  waiting_charge?: number
  notes?: string
}

interface TransferRate {
  id: number
  transfer_id: number
  from_date: string
  to_date: string
  type: 'SIC' | 'PVT'
  adult_count: number
  child_count: number
  vehicle: string
  adult_price: number
  child_price: number
  created_at: string
  updated_at: string
}

const Transfers: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingTransfer, setEditingTransfer] = useState<Transfer | null>(null)
  
  const [formData, setFormData] = useState({
    queryName: '',
    destination: '',
    supplierId: '' as any,
    vehicleType: '',
    distanceDuration: '',
    rateType: 'fixed',
    baseRate: 0,
    extraKmRate: 0,
    waitingCharge: 0,
    price: 0,
    content: '',
    notes: '',
    status: 'Active'
  })
  
  const [destinations, setDestinations] = useState<string[]>([])
  const [destinationInput, setDestinationInput] = useState('')
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false)
  const [suppliers, setSuppliers] = useState<{id:number,name:string,city:string}[]>([])

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Convert file to base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
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
      
      setSelectedFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Remove selected file
  const removeSelectedFile = () => {
    setSelectedFile(null)
    setImagePreview(null)
  }

  // Price modal states
  const [showPriceModal, setShowPriceModal] = useState(false)
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null)
  const [transferRates, setTransferRates] = useState<TransferRate[]>([])
  const [loadingRates, setLoadingRates] = useState(false)
  const [savingRate, setSavingRate] = useState(false)
  
  const [rateFormData, setRateFormData] = useState({
    fromDate: '',
    toDate: '',
    type: 'SIC' as 'SIC' | 'PVT',
    adultCount: 1,
    childCount: 0,
    vehicle: '',
    adultPrice: 0,
    childPrice: 0
  })

  useEffect(() => {
    fetchTransfers()
    fetchDestinations()
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers')
      const data = await response.json()
      if (response.ok) {
        setSuppliers((data.suppliers || []).map((s:any)=>({id:s.id,name:s.company_name,city:s.city})))
      }
    } catch (e) { console.error('Error fetching suppliers:', e) }
  }

  const filteredSuppliers = suppliers.filter(s => (s.city||'').toLowerCase() === (formData.destination||destinationInput).toLowerCase())

  const fetchDestinations = async () => {
    try {
      const response = await fetch('/api/destinations')
      const data = await response.json()
      
      if (response.ok) {
        setDestinations(data.destinations?.map((d: any) => d.name) || [])
      }
    } catch (error) {
      console.error('Error fetching destinations:', error)
    }
  }

  const fetchTransfers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/transfers')
      const data = await response.json()
      
      if (response.ok) {
        setTransfers(data.transfers || [])
      } else {
        console.error('Failed to fetch transfers:', data.error)
      }
    } catch (error) {
      console.error('Error fetching transfers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTransfer = async () => {
    if (!formData.queryName.trim() || !formData.destination.trim()) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setSaving(true)
      
      let photoUrl = ''
      
      // Convert file to base64 if selected
      if (selectedFile) {
        photoUrl = await convertFileToBase64(selectedFile)
      }
      
      const method = editingTransfer ? 'PUT' : 'POST'
      const body = editingTransfer 
        ? { 
            id: editingTransfer.id, 
            ...formData,
            supplierId: formData.supplierId ? Number(formData.supplierId) : null,
            baseRate: formData.baseRate || formData.price,
            photoUrl
          }
        : {
            ...formData,
            supplierId: formData.supplierId ? Number(formData.supplierId) : null,
            baseRate: formData.baseRate || formData.price,
            photoUrl
          }

      const response = await fetch('/api/transfers', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (response.ok) {
        await fetchTransfers() // Refresh the list
        setShowAddForm(false)
        setFormData({ queryName: '', destination: '', supplierId:'', vehicleType:'', distanceDuration:'', rateType:'fixed', baseRate:0, extraKmRate:0, waitingCharge:0, price: 0, content: '', notes:'', status: 'Active' })
        setSelectedFile(null)
        setImagePreview(null)
        setEditingTransfer(null)
        alert(data.message || 'Transfer saved successfully')
      } else {
        alert(data.error || 'Failed to save transfer')
      }
    } catch (error) {
      console.error('Error saving transfer:', error)
      alert('Error saving transfer')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTransfer = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/transfers?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        await fetchTransfers() // Refresh the list
        alert(data.message || 'Transfer deleted successfully')
      } else {
        alert(data.error || 'Failed to delete transfer')
      }
    } catch (error) {
      console.error('Error deleting transfer:', error)
      alert('Error deleting transfer')
    }
  }

  const handleEditClick = (transfer: Transfer) => {
    setEditingTransfer(transfer)
    setFormData({
      queryName: transfer.query_name,
      destination: transfer.destination,
      supplierId: transfer.supplier_id || '',
      vehicleType: transfer.vehicle_type || '',
      distanceDuration: transfer.distance_duration || '',
      rateType: transfer.rate_type || 'fixed',
      baseRate: typeof transfer.base_rate === 'number' ? transfer.base_rate : transfer.price || 0,
      extraKmRate: transfer.extra_km_rate || 0,
      waitingCharge: transfer.waiting_charge || 0,
      price: transfer.price,
      content: transfer.content || '',
      notes: transfer.notes || '',
      status: transfer.status
    })
    setDestinationInput(transfer.destination || '')
    setImagePreview(transfer.photo_url || null)
    setSelectedFile(null)
    setShowAddForm(true)
  }

  const handleCloseForm = () => {
    setShowAddForm(false)
    setEditingTransfer(null)
    setFormData({ queryName: '', destination: '', supplierId:'', vehicleType:'', distanceDuration:'', rateType:'fixed', baseRate:0, extraKmRate:0, waitingCharge:0, price: 0, content: '', notes:'', status: 'Active' })
    setDestinationInput('')
    setShowDestinationSuggestions(false)
    setSelectedFile(null)
    setImagePreview(null)
  }

  const handleTransferNameClick = async (transfer: Transfer) => {
    setSelectedTransfer(transfer)
    setShowPriceModal(true)
    await fetchTransferRates(transfer.id)
  }

  const fetchTransferRates = async (transferId: number) => {
    try {
      setLoadingRates(true)
      const response = await fetch(`/api/transfer-rates?transferId=${transferId}`)
      const data = await response.json()
      
      if (response.ok) {
        setTransferRates(data.rates || [])
      } else {
        console.error('Failed to fetch transfer rates:', data.error)
      }
    } catch (error) {
      console.error('Error fetching transfer rates:', error)
    } finally {
      setLoadingRates(false)
    }
  }

  const handleAddRate = async () => {
    if (!selectedTransfer || !rateFormData.fromDate || !rateFormData.toDate) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setSavingRate(true)
      const response = await fetch('/api/transfer-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transferId: selectedTransfer.id,
          ...rateFormData
        })
      })

      const data = await response.json()

      if (response.ok) {
        await fetchTransferRates(selectedTransfer.id)
        setRateFormData({
          fromDate: '',
          toDate: '',
          type: 'SIC',
          adultCount: 1,
          childCount: 0,
          vehicle: '',
          adultPrice: 0,
          childPrice: 0
        })
        alert(data.message || 'Rate added successfully')
      } else {
        alert(data.error || 'Failed to add rate')
      }
    } catch (error) {
      console.error('Error adding rate:', error)
      alert('Error adding rate')
    } finally {
      setSavingRate(false)
    }
  }

  const handleDeleteRate = async (rateId: number) => {
    if (!confirm('Are you sure you want to delete this rate?')) {
      return
    }

    try {
      const response = await fetch(`/api/transfer-rates?id=${rateId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        await fetchTransferRates(selectedTransfer!.id)
        alert(data.message || 'Rate deleted successfully')
      } else {
        alert(data.error || 'Failed to delete rate')
      }
    } catch (error) {
      console.error('Error deleting rate:', error)
      alert('Error deleting rate')
    }
  }

  const handleClosePriceModal = () => {
    setShowPriceModal(false)
    setSelectedTransfer(null)
    setTransferRates([])
    setRateFormData({
      fromDate: '',
      toDate: '',
      type: 'SIC',
      adultCount: 1,
      childCount: 0,
      vehicle: '',
      adultPrice: 0,
      childPrice: 0
    })
  }

  const filteredTransfers = transfers.filter(transfer =>
    transfer.query_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transfer.destination.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading transfers..</p>
        </div>
      </div>
    )
  }

  const getTransferIcon = (name: string) => {
    if (name.toLowerCase().includes('nautika') || name.toLowerCase().includes('ferry')) {
      return '🚢'
    } else if (name.toLowerCase().includes('elephant')) {
      return '🐘'
    } else if (name.toLowerCase().includes('tempo')) {
      return '🚐'
    } else if (name.toLowerCase().includes('dezire') || name.toLowerCase().includes('ertiga') || name.toLowerCase().includes('xylo')) {
      return '🚗'
    } else {
      return '🚌'
    }
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
              <h1 className="text-lg font-bold text-gray-900">Transfer</h1>
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
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="text-gray-700 bg-white hover:bg-gray-50 px-2 py-1 text-sm"
              >
                <Download className="w-3 h-3 mr-1" />
                Download Format
              </Button>
              <Button
                variant="outline"
                className="text-gray-700 bg-white hover:bg-gray-50 px-2 py-1 text-sm"
              >
                <Upload className="w-3 h-3 mr-1" />
                Import CSV
              </Button>
              <Button
                variant="outline"
                className="text-gray-700 bg-white hover:bg-gray-50 px-2 py-1 text-sm"
              >
                <FileDown className="w-3 h-3 mr-1" />
                Export Data
              </Button>
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 text-sm"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Transfer
              </Button>
            </div>
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
                    <th className="w-full px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Queries Name</th>
                    <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                    <th className="w-20 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="w-20 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="w-20 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">By</th>
                    <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="w-12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                    <th className="w-12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransfers.map((transfer) => (
                    <tr key={transfer.id} className="hover:bg-gray-50">
                      <td className="px-3 py-4 text-sm font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getTransferIcon(transfer.query_name)}</span>
                          <button 
                            onClick={() => handleTransferNameClick(transfer)}
                            className="truncate text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                          >
                            {transfer.query_name}
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        {transfer.destination}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        <button className="text-blue-600 hover:text-blue-800 underline">
                          ₹{transfer.price}
                        </button>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        <Badge variant="success" className="bg-green-600 text-white">
                          {transfer.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        <div className="flex items-center gap-1">
                          <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">T</span>
                          </div>
                          <span className="text-xs truncate">{transfer.created_by}</span>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        {transfer.date}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        <button 
                          onClick={() => handleEditClick(transfer)}
                          className="hover:text-gray-700"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        <button 
                          onClick={() => handleDeleteTransfer(transfer.id, transfer.query_name)}
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

        {/* Total Records */}
        <div className="mt-4 text-sm text-gray-600">
          Total Records: {filteredTransfers.length}
        </div>
      </div>

      {/* Add Transfer Form Panel */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 backdrop-blur-sm"
            onClick={() => setShowAddForm(false)}
          />
          
          {/* Sliding Panel */}
          <div className="absolute right-0 top-0 h-full w-[500px] bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingTransfer ? 'Edit Transfer' : 'Add Transfer'}
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

              {/* Form */}
              <div className="flex-1 p-6 overflow-y-auto">
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transfer name
                    </label>
                    <div className="relative">
                      <div className="absolute left-0 top-0 h-full w-0.5 bg-red-500 rounded-l-sm"></div>
                      <Input 
                        type="text" 
                        className="pl-3.5"
                        placeholder="Enter transfer name"
                        value={formData.queryName}
                        onChange={(e) => setFormData({...formData, queryName: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Destination <span className="text-red-500">*</span>
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
                        className="border-l-2 border-red-500 pl-3.5"
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
                                  setFormData({...formData, destination: destination, supplierId: ''})
                                  setDestinationInput(destination)
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
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Linked Supplier</label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.supplierId}
                      onChange={(e) => setFormData({...formData, supplierId: e.target.value})}
                    >
                      <option value="">Select supplier</option>
                      {filteredSuppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                      <Input 
                        type="text" 
                        placeholder="e.g., Sedan, SUV, Tempo Traveller"
                        value={formData.vehicleType}
                        onChange={(e) => setFormData({...formData, vehicleType: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Distance / Duration</label>
                      <Input 
                        type="text" 
                        placeholder="e.g., 35 km / 1 hr"
                        value={formData.distanceDuration}
                        onChange={(e) => setFormData({...formData, distanceDuration: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rate Type</label>
                      <select 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.rateType}
                        onChange={(e) => setFormData({...formData, rateType: e.target.value})}
                      >
                        <option value="fixed">Fixed</option>
                        <option value="per_km">Per KM</option>
                        <option value="per_day">Per Day</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Base Rate</label>
                      <Input 
                        type="number" 
                        placeholder="Enter base rate"
                        value={formData.baseRate}
                        onChange={(e) => setFormData({...formData, baseRate: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Extra KM Rate</label>
                      <Input 
                        type="number" 
                        placeholder="0"
                        value={formData.extraKmRate}
                        onChange={(e) => setFormData({...formData, extraKmRate: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Waiting Charge</label>
                      <Input 
                        type="number" 
                        placeholder="0"
                        value={formData.waitingCharge}
                        onChange={(e) => setFormData({...formData, waitingCharge: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <Input 
                      type="text" 
                      placeholder="Any notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price
                    </label>
                    <Input 
                      type="number" 
                      placeholder="Enter price"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Content
                    </label>
                    <Input 
                      type="text" 
                      placeholder="Enter content (e.g., CRYSTA 4N/5D MAV)"
                      value={formData.content}
                      onChange={(e) => setFormData({...formData, content: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transfer Photo <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {imagePreview && (
                        <div className="relative w-32 h-32">
                          <Image 
                            src={imagePreview} 
                            alt="Transfer preview" 
                            fill
                            sizes="128px"
                            className="object-cover rounded-lg border border-gray-200"
                            unoptimized
                          />
                          <button
                            type="button"
                            onClick={removeSelectedFile}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      )}
                      {selectedFile && (
                        <p className="text-sm text-gray-600">Selected: {selectedFile.name}</p>
                      )}
                    </div>
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

              {/* Footer */}
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
                    onClick={handleSaveTransfer}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : (editingTransfer ? 'Update' : 'Save')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Price Update Modal */}
      {showPriceModal && selectedTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={handleClosePriceModal}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-lg shadow-xl w-[800px] max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Update Price</h2>
              <button
                onClick={handleClosePriceModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Admin Section */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Admin</h3>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
                    <Input
                      type="date"
                      value={rateFormData.fromDate}
                      onChange={(e) => setRateFormData({...rateFormData, fromDate: e.target.value})}
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
                    <Input
                      type="date"
                      value={rateFormData.toDate}
                      onChange={(e) => setRateFormData({...rateFormData, toDate: e.target.value})}
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                    <select
                      value={rateFormData.type}
                      onChange={(e) => setRateFormData({...rateFormData, type: e.target.value as 'SIC' | 'PVT'})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="SIC">SIC</option>
                      <option value="PVT">PVT</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Adult</label>
                    <Input
                      type="number"
                      value={rateFormData.adultCount}
                      onChange={(e) => setRateFormData({...rateFormData, adultCount: parseInt(e.target.value) || 0})}
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Child</label>
                    <Input
                      type="number"
                      value={rateFormData.childCount}
                      onChange={(e) => setRateFormData({...rateFormData, childCount: parseInt(e.target.value) || 0})}
                      className="w-full"
                    />
                  </div>
                  <Button
                    onClick={handleAddRate}
                    disabled={savingRate}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4"
                  >
                    {savingRate ? 'Adding...' : 'Add'}
                  </Button>
                </div>
              </div>

              {/* Rate List Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Rate List</h3>
                {loadingRates ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-md overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">From</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">To</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Adult</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Child</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {transferRates.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-3 py-8 text-center text-sm text-gray-500">
                              No Rate
                            </td>
                          </tr>
                        ) : (
                          transferRates.map((rate) => (
                            <tr key={rate.id}>
                              <td className="px-3 py-2 text-sm text-gray-900">{new Date(rate.from_date).toLocaleDateString()}</td>
                              <td className="px-3 py-2 text-sm text-gray-900">{new Date(rate.to_date).toLocaleDateString()}</td>
                              <td className="px-3 py-2 text-sm text-gray-900">{rate.type}</td>
                              <td className="px-3 py-2 text-sm text-gray-900">{rate.adult_count}</td>
                              <td className="px-3 py-2 text-sm text-gray-900">{rate.child_count}</td>
                              <td className="px-3 py-2 text-sm text-gray-900">{rate.vehicle || '-'}</td>
                              <td className="px-3 py-2 text-sm">
                                <button
                                  onClick={() => handleDeleteRate(rate.id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Transfers

