import React, { useState, useEffect } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Card, CardContent } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Plus, Search, Edit, Trash2, ArrowLeft, Shield } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface UserRoleAccess {
  id: number
  role_name: string
  description: string
  permissions: string[]
  notes?: string
  created_by: string
  date: string
}

const UserRoleAccess: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [roles, setRoles] = useState<UserRoleAccess[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingRole, setEditingRole] = useState<UserRoleAccess | null>(null)
  
  const [formData, setFormData] = useState({
    roleName: '',
    description: '',
    permissions: [] as string[],
    notes: ''
  })

  const permissionOptions = ['Create', 'Edit', 'View', 'Delete']

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user-role-access')
      const data = await response.json()
      
      if (response.ok) {
        setRoles(data.roles || [])
      } else {
        console.error('Failed to fetch roles:', data.error)
      }
    } catch (error) {
      console.error('Error fetching roles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePermissionToggle = (permission: string) => {
    setFormData(prev => {
      if (prev.permissions.includes(permission)) {
        return {
          ...prev,
          permissions: prev.permissions.filter(p => p !== permission)
        }
      } else {
        return {
          ...prev,
          permissions: [...prev.permissions, permission]
        }
      }
    })
  }

  const handleSaveRole = async () => {
    if (!formData.roleName.trim()) {
      alert('Please enter a role name')
      return
    }
    if (!formData.description.trim()) {
      alert('Please enter a description')
      return
    }
    if (formData.permissions.length === 0) {
      alert('Please select at least one permission')
      return
    }

    try {
      setSaving(true)
      const method = editingRole ? 'PUT' : 'POST'
      const body = {
        ...(editingRole ? { id: editingRole.id } : {}),
        roleName: formData.roleName.trim(),
        description: formData.description.trim(),
        permissions: formData.permissions,
        notes: formData.notes.trim()
      }

      const response = await fetch('/api/user-role-access', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (response.ok) {
        await fetchRoles()
        setShowAddForm(false)
        setFormData({
          roleName: '',
          description: '',
          permissions: [],
          notes: ''
        })
        setEditingRole(null)
        alert(data.message || 'Role saved successfully')
      } else {
        alert(data.error || 'Failed to save role')
      }
    } catch (error) {
      console.error('Error saving role:', error)
      alert('Error saving role')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteRole = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/user-role-access?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        await fetchRoles()
        alert(data.message || 'Role deleted successfully')
      } else {
        alert(data.error || 'Failed to delete role')
      }
    } catch (error) {
      console.error('Error deleting role:', error)
      alert('Error deleting role')
    }
  }

  const handleEditClick = (role: UserRoleAccess) => {
    setEditingRole(role)
    setFormData({
      roleName: role.role_name,
      description: role.description,
      permissions: role.permissions || [],
      notes: role.notes || ''
    })
    setShowAddForm(true)
  }

  const handleCloseForm = () => {
    setShowAddForm(false)
    setEditingRole(null)
    setFormData({
      roleName: '',
      description: '',
      permissions: [],
      notes: ''
    })
  }

  const filteredRoles = roles.filter(role =>
    role.role_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading roles...</p>
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
              <h1 className="text-lg font-bold text-gray-900">User Role & Access Master</h1>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
                <Input
                  type="text"
                  placeholder="Search by role name or description"
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
              Add Role
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
                    <th className="w-full px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role Name</th>
                    <th className="w-48 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="w-48 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
                    <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="w-12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRoles.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-center text-sm text-gray-500">
                        {searchTerm ? 'No roles found matching your search' : 'No roles found. Click "Add Role" to create one.'}
                      </td>
                    </tr>
                  ) : (
                    filteredRoles.map((role) => (
                      <tr key={role.id} className="hover:bg-gray-50">
                        <td className="px-3 py-3 text-sm font-medium text-gray-900">{role.role_name}</td>
                        <td className="px-3 py-3 text-sm text-gray-600">
                          <div className="truncate" title={role.description}>
                            {role.description.length > 100 ? `${role.description.substring(0, 100)}...` : role.description}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-sm">
                          <div className="flex flex-wrap gap-1">
                            {(role.permissions || []).map((perm, idx) => (
                              <Badge key={idx} variant="default" className="text-xs">
                                {perm}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-500">{role.date}</td>
                        <td className="px-3 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditClick(role)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRole(role.id, role.role_name)}
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
                  {editingRole ? 'Edit User Role' : 'Add User Role'}
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
                      Role Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g., Admin, Sales, Ops, Finance, Viewer"
                      value={formData.roleName}
                      onChange={(e) => setFormData({...formData, roleName: e.target.value})}
                      list="role-suggestions"
                    />
                    <datalist id="role-suggestions">
                      <option value="Admin" />
                      <option value="Sales" />
                      <option value="Ops" />
                      <option value="Finance" />
                      <option value="Viewer" />
                    </datalist>
                    <p className="text-xs text-gray-500 mt-1">
                      Enter a role name (suggestions: Admin, Sales, Ops, Finance, Viewer)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={4}
                      placeholder="Describe the purpose and scope of this role"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Permissions <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2 border border-gray-300 rounded-md p-3">
                      {permissionOptions.map((permission) => (
                        <label key={permission} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.permissions.includes(permission)}
                            onChange={() => handlePermissionToggle(permission)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{permission}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Select the permissions this role should have. These apply to all masters.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Additional notes about this role"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    />
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
                  onClick={handleSaveRole}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {saving ? 'Saving...' : editingRole ? 'Update' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserRoleAccess

