import React, { useState, useEffect } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Card, CardContent } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Plus, Search, Edit, Trash2, ArrowLeft, BookOpen, Image as ImageIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface DayItinerary {
  id: number
  name: string
  destinations: string[]
  numDays: number
}

interface PackageTheme {
  id: number
  name: string
}

interface Policy {
  id: number
  name: string
  policy_type: string
}

interface Hotel {
  id: string
  name: string
  destination?: string
}

interface Transfer {
  id: number
  name: string
  destination?: string
}

interface Activity {
  id: number
  name: string
  destination?: string
}

interface MealPlan {
  code: string
  description?: string
}

interface PricingTaxRule {
  id: number
  name: string
  linked_module: string
}

interface ItineraryTemplate {
  id: number
  package_name: string
  destinations: string[]
  linked_theme_id?: number
  linked_theme_name?: string
  day_itinerary_ids: number[]
  day_itinerary_names?: string[]
  base_price: number
  validity_start_date?: string | null
  validity_end_date?: string | null
  notes: string
  highlights: string[]
  images: string[]
  template_status: string
  created_by: string
  date: string
}

const ItineraryTemplate: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [templates, setTemplates] = useState<ItineraryTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ItineraryTemplate | null>(null)
  
  // Masters
  const [destinations, setDestinations] = useState<string[]>([])
  const [dayItineraries, setDayItineraries] = useState<DayItinerary[]>([])
  const [packageThemes, setPackageThemes] = useState<PackageTheme[]>([])
  const [policies, setPolicies] = useState<Policy[]>([])
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([])
  const [pricingRules, setPricingRules] = useState<PricingTaxRule[]>([])
  
  const [destinationInput, setDestinationInput] = useState('')
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    packageName: '',
    destinations: [] as string[],
    linkedThemeId: '',
    dayItineraryIds: [] as number[],
    basePrice: 0,
    validityStartDate: '',
    validityEndDate: '',
    notes: '',
    highlights: [''] as string[],
    images: [] as string[],
    templateStatus: 'Active'
  })

  useEffect(() => {
    fetchTemplates()
    fetchMasters()
  }, [])

  const fetchMasters = async () => {
    try {
      const [
        destRes, dayItRes, themeRes, policyRes, hotelRes, 
        transferRes, activityRes, mealRes, pricingRes
      ] = await Promise.all([
        fetch('/api/destinations'),
        fetch('/api/day-itineraries'),
        fetch('/api/package-themes'),
        fetch('/api/policies'),
        fetch('/api/hotels'),
        fetch('/api/transfers'),
        fetch('/api/activities'),
        fetch('/api/meal-plans'),
        fetch('/api/pricing-tax-rules')
      ])
      
      const [
        destData, dayItData, themeData, policyData, hotelData,
        transferData, activityData, mealData, pricingData
      ] = await Promise.all([
        destRes.json().catch(() => ({ destinations: [] })),
        dayItRes.json().catch(() => ({ dayItineraries: [] })),
        themeRes.json().catch(() => ({ packageThemes: [] })),
        policyRes.json().catch(() => ({ policies: [] })),
        hotelRes.json().catch(() => ({ hotels: [] })),
        transferRes.json().catch(() => ({ transfers: [] })),
        activityRes.json().catch(() => ({ activities: [] })),
        mealRes.json().catch(() => ({ mealPlans: [] })),
        pricingRes.json().catch(() => ({ pricingRules: [] }))
      ])
      
      setDestinations((destData.destinations || []).map((d: any) => d.name))
      setDayItineraries(dayItData.dayItineraries || [])
      setPackageThemes(themeData.packageThemes || [])
      setPolicies(policyData.policies || [])
      setHotels(hotelData.hotels || [])
      setTransfers(transferData.transfers || [])
      setActivities(activityData.activities || [])
      setMealPlans((mealData.mealPlans || []).filter((mp: any) => mp.code))
      setPricingRules(pricingData.pricingRules || [])
    } catch (error) {
      console.error('Error fetching masters:', error)
    }
  }

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }
      setSelectedImage(file)
      const preview = URL.createObjectURL(file)
      setImagePreview(preview)
    }
  }

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/itinerary-templates')
      const data = await response.json()
      
      if (response.ok) {
        setTemplates(data.templates || [])
      } else {
        console.error('Failed to fetch templates:', data.error)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTemplate = async () => {
    if (!formData.packageName.trim()) {
      alert('Please enter a package name')
      return
    }
    if (!formData.destinations.length) {
      alert('Please select at least one destination')
      return
    }
    if (!formData.dayItineraryIds.length) {
      alert('Please select at least one day itinerary')
      return
    }

    try {
      setSaving(true)
      
      // Convert image to base64 if selected
      let images = [...formData.images]
      if (selectedImage) {
        const base64Image = await convertFileToBase64(selectedImage)
        images.push(base64Image)
      }
      
      const method = editingTemplate ? 'PUT' : 'POST'
      const body = {
        ...(editingTemplate ? { id: editingTemplate.id } : {}),
        packageName: formData.packageName.trim(),
        destinations: formData.destinations,
        linkedThemeId: formData.linkedThemeId ? parseInt(formData.linkedThemeId) : null,
        dayItineraryIds: formData.dayItineraryIds,
        basePrice: formData.basePrice,
        validityStartDate: formData.validityStartDate || null,
        validityEndDate: formData.validityEndDate || null,
        notes: formData.notes.trim(),
        highlights: formData.highlights.filter(h => h.trim()),
        images: images,
        templateStatus: formData.templateStatus
      }

      const response = await fetch('/api/itinerary-templates', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (response.ok) {
        await fetchTemplates()
        setShowAddForm(false)
        setFormData({
          packageName: '',
          destinations: [],
          linkedThemeId: '',
          dayItineraryIds: [],
          basePrice: 0,
          validityStartDate: '',
          validityEndDate: '',
          notes: '',
          highlights: [''],
          images: [],
          templateStatus: 'Active'
        })
        setEditingTemplate(null)
        setSelectedImage(null)
        setImagePreview(null)
        setDestinationInput('')
        alert(data.message || 'Template saved successfully')
      } else {
        alert(data.error || 'Failed to save template')
      }
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Error saving template')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTemplate = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/itinerary-templates?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        await fetchTemplates()
        alert(data.message || 'Template deleted successfully')
      } else {
        alert(data.error || 'Failed to delete template')
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Error deleting template')
    }
  }

  const handleEditClick = (template: ItineraryTemplate) => {
    setEditingTemplate(template)
    setFormData({
      packageName: template.package_name,
      destinations: template.destinations || [],
      linkedThemeId: template.linked_theme_id ? template.linked_theme_id.toString() : '',
      dayItineraryIds: template.day_itinerary_ids || [],
      basePrice: template.base_price || 0,
      validityStartDate: template.validity_start_date ? (template.validity_start_date.includes('T') ? template.validity_start_date.split('T')[0] : template.validity_start_date) : '',
      validityEndDate: template.validity_end_date ? (template.validity_end_date.includes('T') ? template.validity_end_date.split('T')[0] : template.validity_end_date) : '',
      notes: template.notes || '',
      highlights: template.highlights && template.highlights.length > 0 ? template.highlights : [''],
      images: template.images || [],
      templateStatus: template.template_status || 'Active'
    })
    setImagePreview(template.images && template.images.length > 0 ? template.images[0] : null)
    setSelectedImage(null)
    setDestinationInput('')
    setShowAddForm(true)
  }

  const handleCloseForm = () => {
    setShowAddForm(false)
    setEditingTemplate(null)
    setFormData({
      packageName: '',
      destinations: [],
      linkedThemeId: '',
      dayItineraryIds: [],
      basePrice: 0,
      validityStartDate: '',
      validityEndDate: '',
      notes: '',
      highlights: [''],
      images: [],
      templateStatus: 'Active'
    })
    setSelectedImage(null)
    setImagePreview(null)
    setDestinationInput('')
    setShowDestinationSuggestions(false)
  }

  const filteredTemplates = templates.filter(template =>
    template.package_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (template.destinations || []).some(d => d.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading templates...</p>
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
              <h1 className="text-lg font-bold text-gray-900">Itinerary Template Library</h1>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
                <Input
                  type="text"
                  placeholder="Search by name or destination"
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
              Add Template
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
                    <th className="w-full px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Package Name</th>
                    <th className="w-40 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destinations</th>
                    <th className="w-32 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Theme</th>
                    <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Price</th>
                    <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="w-12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTemplates.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-4 text-center text-sm text-gray-500">
                        {searchTerm ? 'No templates found matching your search' : 'No templates found. Click "Add Template" to create one.'}
                      </td>
                    </tr>
                  ) : (
                    filteredTemplates.map((template) => (
                      <tr key={template.id} className="hover:bg-gray-50">
                        <td className="px-3 py-3 text-sm text-gray-900">{template.package_name}</td>
                        <td className="px-3 py-3 text-sm text-gray-600">
                          {(template.destinations || []).slice(0, 2).join(', ')}
                          {(template.destinations || []).length > 2 && '...'}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600">{template.linked_theme_name || '-'}</td>
                        <td className="px-3 py-3 text-sm text-gray-600">₹{template.base_price || 0}</td>
                        <td className="px-3 py-3 text-sm">
                          <Badge variant={template.template_status === 'Active' ? 'default' : 'secondary'}>
                            {template.template_status}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-500">{template.date}</td>
                        <td className="px-3 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditClick(template)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTemplate(template.id, template.package_name)}
                              className="text-red-600 hover:text-red-800"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div 
            className="absolute inset-0 backdrop-blur-sm"
            onClick={handleCloseForm}
          />
          
          <div className="absolute right-0 top-0 h-full w-[700px] bg-white shadow-xl transform transition-transform duration-300 ease-in-out overflow-y-auto">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingTemplate ? 'Edit Itinerary Template' : 'Add Itinerary Template'}
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
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Package Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g., Kerala 5D/4N Honeymoon"
                      value={formData.packageName}
                      onChange={(e) => setFormData({...formData, packageName: e.target.value})}
                    />
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Linked Theme
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.linkedThemeId}
                        onChange={(e) => setFormData({...formData, linkedThemeId: e.target.value})}
                      >
                        <option value="">Select theme (optional)</option>
                        {packageThemes.map((theme) => (
                          <option key={theme.id} value={theme.id}>
                            {theme.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Base Price
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Enter base price"
                        value={formData.basePrice}
                        onChange={(e) => setFormData({...formData, basePrice: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Day Itineraries <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          const dayItId = parseInt(e.target.value, 10)
                          if (!formData.dayItineraryIds.includes(dayItId)) {
                            setFormData({...formData, dayItineraryIds: [...formData.dayItineraryIds, dayItId]})
                          }
                          e.target.value = ''
                        }
                      }}
                    >
                      <option value="">Select day itinerary</option>
                      {dayItineraries.map((di) => (
                        <option key={di.id} value={di.id}>
                          {di.name} ({di.numDays} days)
                        </option>
                      ))}
                    </select>
                    {formData.dayItineraryIds.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {formData.dayItineraryIds.map((dayItId) => {
                          const dayIt = dayItineraries.find(di => di.id === dayItId)
                          if (!dayIt) return null
                          return (
                            <span key={dayItId} className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs">
                              {dayIt.name}
                              <button
                                type="button"
                                onClick={() => setFormData({...formData, dayItineraryIds: formData.dayItineraryIds.filter(id => id !== dayItId)})}
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Validity Start Date
                      </label>
                      <Input
                        type="date"
                        value={formData.validityStartDate}
                        onChange={(e) => setFormData({...formData, validityStartDate: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Validity End Date
                      </label>
                      <Input
                        type="date"
                        value={formData.validityEndDate}
                        onChange={(e) => setFormData({...formData, validityEndDate: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Highlights
                    </label>
                    {formData.highlights.map((highlight, idx) => (
                      <div key={idx} className="mb-2 flex gap-2">
                        <Input
                          type="text"
                          placeholder="Enter highlight"
                          value={highlight}
                          onChange={(e) => {
                            const next = [...formData.highlights]
                            next[idx] = e.target.value
                            setFormData({...formData, highlights: next})
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (formData.highlights.length > 1) {
                              setFormData({...formData, highlights: formData.highlights.filter((_, i) => i !== idx)})
                            }
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, highlights: [...formData.highlights, '']})}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      + Add Highlight
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Images / Banners
                    </label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="text-sm"
                    />
                    {imagePreview && (
                      <div className="mt-2">
                        <img src={imagePreview} alt="Preview" className="h-32 w-auto rounded-md border border-gray-300" />
                      </div>
                    )}
                    {formData.images.length > 0 && !imagePreview && (
                      <div className="mt-2 space-y-2">
                        {formData.images.map((img, idx) => (
                          <div key={idx} className="relative inline-block">
                            <img src={img} alt={`Image ${idx + 1}`} className="h-32 w-auto rounded-md border border-gray-300" />
                            <button
                              type="button"
                              onClick={() => setFormData({...formData, images: formData.images.filter((_, i) => i !== idx)})}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={4}
                      placeholder="Additional notes about the template"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Template Status
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.templateStatus}
                      onChange={(e) => setFormData({...formData, templateStatus: e.target.value})}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 sticky bottom-0 bg-white">
                <Button
                  onClick={handleCloseForm}
                  variant="outline"
                  className="text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveTemplate}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {saving ? 'Saving...' : editingTemplate ? 'Update' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ItineraryTemplate

