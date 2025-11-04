import React, { useState, useEffect } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Card, CardContent } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Plus, Search, Edit, Trash2, ArrowLeft, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface ItineraryNoteInclusion {
  id: number
  title: string
  description: string
  category: string
  status: string
  created_by: string
  date: string
}

const ItineraryNotesInclusions: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [notesInclusions, setNotesInclusions] = useState<ItineraryNoteInclusion[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingNoteInclusion, setEditingNoteInclusion] = useState<ItineraryNoteInclusion | null>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    status: 'Active'
  })

  useEffect(() => {
    fetchNotesInclusions()
  }, [])

  const fetchNotesInclusions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/itinerary-notes-inclusions')
      const data = await response.json()
      
      if (response.ok) {
        setNotesInclusions(data.notesInclusions || [])
      } else {
        console.error('Failed to fetch notes/inclusions:', data.error)
      }
    } catch (error) {
      console.error('Error fetching notes/inclusions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNoteInclusion = async () => {
    if (!formData.title.trim()) {
      alert('Please enter a title')
      return
    }
    if (!formData.description.trim()) {
      alert('Please enter a description/text block')
      return
    }
    if (!formData.category) {
      alert('Please select a category')
      return
    }

    try {
      setSaving(true)
      const method = editingNoteInclusion ? 'PUT' : 'POST'
      const body = {
        ...(editingNoteInclusion ? { id: editingNoteInclusion.id } : {}),
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        status: formData.status
      }

      const response = await fetch('/api/itinerary-notes-inclusions', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (response.ok) {
        await fetchNotesInclusions()
        setShowAddForm(false)
        setFormData({
          title: '',
          description: '',
          category: '',
          status: 'Active'
        })
        setEditingNoteInclusion(null)
        alert(data.message || 'Note/Inclusion saved successfully')
      } else {
        alert(data.error || 'Failed to save note/inclusion')
      }
    } catch (error) {
      console.error('Error saving note/inclusion:', error)
      alert('Error saving note/inclusion')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteNoteInclusion = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/itinerary-notes-inclusions?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        await fetchNotesInclusions()
        alert(data.message || 'Note/Inclusion deleted successfully')
      } else {
        alert(data.error || 'Failed to delete note/inclusion')
      }
    } catch (error) {
      console.error('Error deleting note/inclusion:', error)
      alert('Error deleting note/inclusion')
    }
  }

  const handleEditClick = (noteInclusion: ItineraryNoteInclusion) => {
    setEditingNoteInclusion(noteInclusion)
    setFormData({
      title: noteInclusion.title,
      description: noteInclusion.description,
      category: noteInclusion.category,
      status: noteInclusion.status
    })
    setShowAddForm(true)
  }

  const handleCloseForm = () => {
    setShowAddForm(false)
    setEditingNoteInclusion(null)
    setFormData({
      title: '',
      description: '',
      category: '',
      status: 'Active'
    })
  }

  const filteredNotesInclusions = notesInclusions.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'Inclusion':
        return 'default'
      case 'Exclusion':
        return 'secondary'
      case 'Note':
        return 'outline'
      case 'Tip':
        return 'default'
      default:
        return 'default'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading notes/inclusions...</p>
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
              <h1 className="text-lg font-bold text-gray-900">Itinerary Notes & Inclusions Library</h1>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
                <Input
                  type="text"
                  placeholder="Search by title, description, or category"
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
              Add Note/Inclusion
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
                    <th className="w-full px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="w-48 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="w-32 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="w-12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredNotesInclusions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-4 text-center text-sm text-gray-500">
                        {searchTerm ? 'No notes/inclusions found matching your search' : 'No notes/inclusions found. Click "Add Note/Inclusion" to create one.'}
                      </td>
                    </tr>
                  ) : (
                    filteredNotesInclusions.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-3 py-3 text-sm font-medium text-gray-900">{item.title}</td>
                        <td className="px-3 py-3 text-sm text-gray-600">
                          <div className="truncate" title={item.description}>
                            {item.description.length > 100 ? `${item.description.substring(0, 100)}...` : item.description}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-sm">
                          <Badge variant={getCategoryBadgeColor(item.category)}>
                            {item.category}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-sm">
                          <Badge variant={item.status === 'Active' ? 'default' : 'secondary'}>
                            {item.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-500">{item.date}</td>
                        <td className="px-3 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditClick(item)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteNoteInclusion(item.id, item.title)}
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
                  {editingNoteInclusion ? 'Edit Note/Inclusion' : 'Add Note/Inclusion'}
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
                      Title <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g., Inclusions, Exclusions, Important Notes"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                    >
                      <option value="">Select category</option>
                      <option value="Inclusion">Inclusion</option>
                      <option value="Exclusion">Exclusion</option>
                      <option value="Note">Note</option>
                      <option value="Tip">Tip</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description / Text Block <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={8}
                      placeholder="Enter the full text content for this note/inclusion. This will be used as a reusable text block in quotes."
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This text block will be used consistently across quotes and itineraries.
                    </p>
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
                  onClick={handleSaveNoteInclusion}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {saving ? 'Saving...' : editingNoteInclusion ? 'Update' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ItineraryNotesInclusions

