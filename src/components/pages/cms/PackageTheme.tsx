import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Plus, Search, Edit, Trash2, ArrowLeft, Image as ImageIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface DayItinerary {
  id: number
  name: string
  destinations: string[]
  numDays: number
}

interface LeadType {
  id: number
  name: string
}

interface PackageTheme {
  id: number
  name: string
  description?: string
  iconUrl?: string
  dayItineraryIds?: number[]
  leadTypeIds?: number[]
  status: string
  created_by: string
  date: string
}

const PackageTheme: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [packageThemes, setPackageThemes] = useState<PackageTheme[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingTheme, setEditingTheme] = useState<PackageTheme | null>(null)
  
  // Masters data
  const [dayItineraries, setDayItineraries] = useState<DayItinerary[]>([])
  const [leadTypes, setLeadTypes] = useState<LeadType[]>([])
  
  // Image upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    iconUrl: '',
    dayItineraryIds: [] as number[],
    leadTypeIds: [] as number[],
    status: 'Active'
  })

  useEffect(() => {
    fetchPackageThemes()
    fetchMasters()
  }, [])

  const fetchMasters = async () => {
    try {
      const [dayItRes, leadTypesRes] = await Promise.all([
        fetch('/api/day-itineraries').catch(() => null),
        fetch('/api/lead-types').catch(() => null) // Lead Type might not exist yet
      ])
      
      if (dayItRes && dayItRes.ok) {
        try {
          const dayItData = await dayItRes.json()
          setDayItineraries((dayItData.dayItineraries || []).map((it: any) => ({
            id: it.id,
            name: it.name || it.title || '',
            destinations: it.destinations || [],
            numDays: it.numDays || 1
          })))
        } catch (error) {
          console.error('Error parsing day itineraries:', error)
        }
      }
      
      if (leadTypesRes && leadTypesRes.ok) {
        const contentType = leadTypesRes.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          try {
            const leadTypesData = await leadTypesRes.json()
            setLeadTypes(leadTypesData.leadTypes || [])
          } catch (error) {
            console.error('Error parsing lead types:', error)
            // Use default lead types on parse error
            setLeadTypes([
              { id: 1, name: 'Individual' },
              { id: 2, name: 'Corporate' },
              { id: 3, name: 'Travel Agent' },
              { id: 4, name: 'Group' }
            ])
          }
        } else {
          // Not JSON, use defaults
          setLeadTypes([
            { id: 1, name: 'Individual' },
            { id: 2, name: 'Corporate' },
            { id: 3, name: 'Travel Agent' },
            { id: 4, name: 'Group' }
          ])
        }
      } else {
        // Default lead types if master doesn't exist
        setLeadTypes([
          { id: 1, name: 'Individual' },
          { id: 2, name: 'Corporate' },
          { id: 3, name: 'Travel Agent' },
          { id: 4, name: 'Group' }
        ])
      }
    } catch (error) {
      console.error('Error fetching masters:', error)
      // Set default lead types on error
      setLeadTypes([
        { id: 1, name: 'Individual' },
        { id: 2, name: 'Corporate' },
        { id: 3, name: 'Travel Agent' },
        { id: 4, name: 'Group' }
      ])
    }
  }

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result)
        } else {
          reject(new Error('Failed to convert file to base64'))
        }
      }
      reader.onerror = () => reject(new Error('Error reading file'))
      reader.readAsDataURL(file)
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (PNG, JPG, JPEG, GIF, etc.)')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB')
        return
      }
      setSelectedFile(file)
      try {
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
      } catch (_) {
        setPreviewUrl('')
      }
    }
  }

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const fetchPackageThemes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/package-themes')
      const data = await response.json()
      
      if (response.ok) {
        const themes = (data.packageThemes || []).map((theme: any) => ({
          id: theme.id,
          name: theme.name,
          description: theme.description || '',
          iconUrl: theme.icon_url || theme.iconUrl || '',
          dayItineraryIds: theme.day_itinerary_ids || theme.dayItineraryIds || [],
          leadTypeIds: theme.lead_type_ids || theme.leadTypeIds || [],
          status: theme.status || 'Active',
          created_by: theme.created_by,
          date: theme.date
        }))
        setPackageThemes(themes)
      } else {
        console.error('Failed to fetch package themes:', data.error)
      }
    } catch (error) {
      console.error('Error fetching package themes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTheme = async () => {
    if (!formData.name.trim()) {
      alert('Please enter a theme name')
      return
    }

    try {
      setSaving(true)
      let body: any = {
        ...formData,
        dayItineraryIds: formData.dayItineraryIds,
        leadTypeIds: formData.leadTypeIds
      }

      // Convert selected file to base64 if provided
      if (selectedFile) {
        try {
          const base64String = await convertFileToBase64(selectedFile)
          body.iconUrl = base64String
        } catch (error) {
          console.error('Error converting file to base64:', error)
          alert('Error processing the image file. Please try again.')
          return
        }
      }

      if (editingTheme) {
        body.id = editingTheme.id
      }

      const method = editingTheme ? 'PUT' : 'POST'
      const response = await fetch('/api/package-themes', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (response.ok) {
        await fetchPackageThemes()
        setShowAddForm(false)
        setFormData({ name: '', description: '', iconUrl: '', dayItineraryIds: [], leadTypeIds: [], status: 'Active' })
        setEditingTheme(null)
        setSelectedFile(null)
        setPreviewUrl('')
        alert(data.message || 'Package theme saved successfully')
      } else {
        alert(data.error || 'Failed to save package theme')
      }
    } catch (error) {
      console.error('Error saving package theme:', error)
      alert('Error saving package theme')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTheme = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/package-themes?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        await fetchPackageThemes()
        alert(data.message || 'Package theme deleted successfully')
      } else {
        alert(data.error || 'Failed to delete package theme')
      }
    } catch (error) {
      console.error('Error deleting package theme:', error)
      alert('Error deleting package theme')
    }
  }

  const handleEditClick = (theme: PackageTheme) => {
    setEditingTheme(theme)
    setFormData({
      name: theme.name,
      description: theme.description || '',
      iconUrl: theme.iconUrl || '',
      dayItineraryIds: theme.dayItineraryIds || [],
      leadTypeIds: theme.leadTypeIds || [],
      status: theme.status
    })
    setSelectedFile(null)
    setPreviewUrl(theme.iconUrl || '')
    setShowAddForm(true)
  }

  const handleCloseForm = () => {
    setShowAddForm(false)
    setEditingTheme(null)
    setFormData({ name: '', description: '', iconUrl: '', dayItineraryIds: [], leadTypeIds: [], status: 'Active' })
    setSelectedFile(null)
    setPreviewUrl('')
  }

  const filteredThemes = packageThemes.filter(theme =>
    theme.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading package themes...</p>
        </div>
      </div>
    )
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
              <h1 className="text-lg font-bold text-gray-900">Package Theme</h1>
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
              Add Theme
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <Card>
          <CardContent className="p-0">
            <div className="overflow-hidden">
              <table className="w-full table-fixed">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Icon</th>
                    <th className="w-64 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="w-full px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="w-20 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="w-20 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">By</th>
                    <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="w-12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredThemes.map((theme) => (
                    <tr key={theme.id} className="hover:bg-gray-50">
                      <td className="px-3 py-4 text-sm text-gray-900">
                        {theme.iconUrl ? (
                          <div className="relative w-8 h-8">
                            <Image src={theme.iconUrl} alt={theme.name} fill sizes="32px" className="object-cover rounded" unoptimized />
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                            <ImageIcon className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-4 text-sm font-medium text-gray-900 truncate">{theme.name}</td>
                      <td className="px-3 py-4 text-sm text-gray-900 truncate">{theme.description || '-'}</td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        <Badge variant="success" className="bg-green-600 text-white">
                          {theme.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        <div className="flex items-center gap-1">
                          <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">T</span>
                          </div>
                          <span className="text-xs truncate">{theme.created_by}</span>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        {theme.date}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        <button 
                          onClick={() => handleEditClick(theme)}
                          className="hover:text-gray-700"
                        >
                          <Edit className="h-4 w-4" />
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
          Total Records: {filteredThemes.length}
        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div 
            className="absolute inset-0 backdrop-blur-sm"
            onClick={handleCloseForm}
          />
          
          <div className="absolute right-0 top-0 h-full w-[600px] bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingTheme ? 'Edit Package Theme' : 'Add Package Theme'}
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
                      Theme Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-0 top-0 h-full w-0.5 bg-red-500 rounded-l-sm"></div>
                      <Input 
                        type="text" 
                        className="pl-3.5"
                        placeholder="e.g., Honeymoon, Family, Adventure, Luxury, Wellness"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={3}
                      placeholder="Enter theme description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Image / Icon (optional)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        id="theme-icon"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                      <label
                        htmlFor="theme-icon"
                        className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-200 text-sm"
                      >
                        Choose File
                      </label>
                      {selectedFile && (
                        <span className="text-sm text-gray-500">{selectedFile.name}</span>
                      )}
                      {!selectedFile && !editingTheme && (
                        <span className="text-sm text-gray-500">No file chosen</span>
                      )}
                    </div>
                    {(previewUrl || (editingTheme && editingTheme.iconUrl)) && (
                      <div className="mt-2">
                        <div className="relative w-16 h-16">
                          <Image 
                            src={(previewUrl || editingTheme?.iconUrl)!} 
                            alt="Preview" 
                            fill 
                            sizes="64px"
                            className="object-cover rounded border border-gray-300 bg-white"
                            unoptimized
                          />
                        </div>
                      </div>
                    )}
                    {editingTheme && !selectedFile && !previewUrl && (
                      <div className="mt-2 text-xs text-blue-600">
                        ℹ Current icon will be kept if no new file is selected
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Linked Day Itineraries
                    </label>
                    <select
                      multiple
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                      value={formData.dayItineraryIds.map(String)}
                      onChange={(e) => {
                        const ids = Array.from(e.target.selectedOptions).map(opt => parseInt(opt.value, 10))
                        setFormData({...formData, dayItineraryIds: ids})
                      }}
                    >
                      {dayItineraries.map(di => (
                        <option key={di.id} value={di.id}>
                          {di.name} ({di.numDays} days) - {di.destinations.join(', ')}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Linked Lead Types
                    </label>
                    <select
                      multiple
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                      value={formData.leadTypeIds.map(String)}
                      onChange={(e) => {
                        const ids = Array.from(e.target.selectedOptions).map(opt => parseInt(opt.value, 10))
                        setFormData({...formData, leadTypeIds: ids})
                      }}
                    >
                      {leadTypes.map(lt => (
                        <option key={lt.id} value={lt.id}>
                          {lt.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
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
                    onClick={handleSaveTheme}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : (editingTheme ? 'Update' : 'Save')}
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

export default PackageTheme
