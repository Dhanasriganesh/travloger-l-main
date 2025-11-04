import React, { useState, useEffect } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Card, CardContent } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Plus, Search, Edit, Trash2, ArrowLeft, Image as ImageIcon, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface MediaItem {
  id: number
  file_name: string
  image_url: string
  linked_type: string
  title: string
  caption?: string
  upload_date?: string | null
  usage_notes?: string
  status: string
  created_by: string
  date: string
}

const MediaLibrary: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    fileName: '',
    linkedType: '',
    title: '',
    caption: '',
    usageNotes: '',
    status: 'Active'
  })

  useEffect(() => {
    fetchMediaItems()
  }, [])

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size should be less than 10MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }
      setSelectedFile(file)
      const preview = URL.createObjectURL(file)
      setImagePreview(preview)
      setFormData({...formData, fileName: file.name})
    }
  }

  const fetchMediaItems = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/media-library')
      const data = await response.json()
      
      if (response.ok) {
        setMediaItems(data.mediaItems || [])
      } else {
        console.error('Failed to fetch media items:', data.error)
      }
    } catch (error) {
      console.error('Error fetching media items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveMedia = async () => {
    if (!formData.fileName.trim() && !selectedFile) {
      alert('Please select an image file')
      return
    }
    if (!formData.linkedType) {
      alert('Please select a linked type')
      return
    }
    if (!formData.title.trim()) {
      alert('Please enter a title')
      return
    }

    try {
      setSaving(true)
      
      // Convert file to base64 if selected
      let imageUrl = ''
      if (selectedFile) {
        imageUrl = await convertFileToBase64(selectedFile)
      } else if (editingMedia && editingMedia.image_url) {
        imageUrl = editingMedia.image_url
      } else {
        alert('Please select an image file')
        return
      }
      
      const method = editingMedia ? 'PUT' : 'POST'
      const body = {
        ...(editingMedia ? { id: editingMedia.id } : {}),
        fileName: formData.fileName.trim() || selectedFile?.name || 'image',
        imageUrl: imageUrl,
        linkedType: formData.linkedType,
        title: formData.title.trim(),
        caption: formData.caption.trim(),
        usageNotes: formData.usageNotes.trim(),
        status: formData.status
      }

      const response = await fetch('/api/media-library', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (response.ok) {
        await fetchMediaItems()
        setShowAddForm(false)
        setFormData({
          fileName: '',
          linkedType: '',
          title: '',
          caption: '',
          usageNotes: '',
          status: 'Active'
        })
        setEditingMedia(null)
        setSelectedFile(null)
        setImagePreview(null)
        alert(data.message || 'Media item saved successfully')
      } else {
        alert(data.error || 'Failed to save media item')
      }
    } catch (error) {
      console.error('Error saving media item:', error)
      alert('Error saving media item')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteMedia = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/media-library?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        await fetchMediaItems()
        alert(data.message || 'Media item deleted successfully')
      } else {
        alert(data.error || 'Failed to delete media item')
      }
    } catch (error) {
      console.error('Error deleting media item:', error)
      alert('Error deleting media item')
    }
  }

  const handleEditClick = (media: MediaItem) => {
    setEditingMedia(media)
    setFormData({
      fileName: media.file_name,
      linkedType: media.linked_type,
      title: media.title,
      caption: media.caption || '',
      usageNotes: media.usage_notes || '',
      status: media.status
    })
    setImagePreview(media.image_url)
    setSelectedFile(null)
    setShowAddForm(true)
  }

  const handleCloseForm = () => {
    setShowAddForm(false)
    setEditingMedia(null)
    setFormData({
      fileName: '',
      linkedType: '',
      title: '',
      caption: '',
      usageNotes: '',
      status: 'Active'
    })
    setSelectedFile(null)
    setImagePreview(null)
  }

  const filteredMedia = mediaItems.filter(media =>
    media.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    media.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    media.linked_type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading media library...</p>
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
              <h1 className="text-lg font-bold text-gray-900">Media Library</h1>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
                <Input
                  type="text"
                  placeholder="Search by name, title, or type"
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
              Add Media
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
                    <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                    <th className="w-full px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name / Title</th>
                    <th className="w-32 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Linked Type</th>
                    <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Upload Date</th>
                    <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="w-12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMedia.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-4 text-center text-sm text-gray-500">
                        {searchTerm ? 'No media items found matching your search' : 'No media items found. Click "Add Media" to create one.'}
                      </td>
                    </tr>
                  ) : (
                    filteredMedia.map((media) => (
                      <tr key={media.id} className="hover:bg-gray-50">
                        <td className="px-3 py-3">
                          {media.image_url ? (
                            <img 
                              src={media.image_url} 
                              alt={media.title}
                              className="h-16 w-16 object-cover rounded border border-gray-300"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64"%3E%3Crect fill="%23ddd" width="64" height="64"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" dy="10.5" font-weight="bold" x="50%" y="50%" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E'
                              }}
                            />
                          ) : (
                            <div className="h-16 w-16 bg-gray-200 rounded flex items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 text-sm">
                          <div>
                            <div className="font-medium text-gray-900">{media.title}</div>
                            <div className="text-xs text-gray-500">{media.file_name}</div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600">{media.linked_type}</td>
                        <td className="px-3 py-3 text-sm text-gray-500">{media.upload_date || media.date}</td>
                        <td className="px-3 py-3 text-sm">
                          <Badge variant={media.status === 'Active' ? 'default' : 'secondary'}>
                            {media.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditClick(media)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteMedia(media.id, media.title || media.file_name)}
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
          
          <div className="absolute right-0 top-0 h-full w-[600px] bg-white shadow-xl transform transition-transform duration-300 ease-in-out overflow-y-auto">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingMedia ? 'Edit Media Item' : 'Add Media Item'}
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
                      Image File <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="text-sm"
                    />
                    {imagePreview && (
                      <div className="mt-2 relative inline-block">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="h-48 w-auto rounded-md border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview(null)
                            setSelectedFile(null)
                            setFormData({...formData, fileName: ''})
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    {!editingMedia && !imagePreview && (
                      <p className="text-xs text-gray-500 mt-1">Select an image file to upload</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      File Name
                    </label>
                    <Input
                      type="text"
                      placeholder="Auto-filled from file or enter manually"
                      value={formData.fileName}
                      onChange={(e) => setFormData({...formData, fileName: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Linked Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.linkedType}
                      onChange={(e) => setFormData({...formData, linkedType: e.target.value})}
                    >
                      <option value="">Select linked type</option>
                      <option value="Hotel">Hotel</option>
                      <option value="Destination">Destination</option>
                      <option value="Activity">Activity</option>
                      <option value="Vehicle">Vehicle</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title / Caption <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="Enter title or caption"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Caption (Optional)
                    </label>
                    <Input
                      type="text"
                      placeholder="Additional caption text"
                      value={formData.caption}
                      onChange={(e) => setFormData({...formData, caption: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Usage Notes
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Notes about where/how this media is used"
                      value={formData.usageNotes}
                      onChange={(e) => setFormData({...formData, usageNotes: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
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
                  onClick={handleSaveMedia}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {saving ? 'Saving...' : editingMedia ? 'Update' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MediaLibrary

