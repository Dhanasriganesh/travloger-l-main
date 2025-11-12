import React, { useState, useEffect } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Card, CardContent } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Plus, Search, Edit, Trash2, ArrowLeft, Tag } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface LeadType {
  id: number
  lead_type_name: string
  code: string
  description: string
  default_destination_handling: string
  default_sales_team: string
  default_owner: string
  default_workflow_name: string
  default_whatsapp_template_id: string
  default_email_template_id: string
  followup_rule_days: number
  status: string
  notes: string
  created_by: string
  date: string
}

const LeadTypeMaster: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [leadTypes, setLeadTypes] = useState<LeadType[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingLeadType, setEditingLeadType] = useState<LeadType | null>(null)
  
  const [formData, setFormData] = useState({
    leadTypeName: '',
    code: '',
    description: '',
    defaultDestinationHandling: 'Flexible',
    defaultSalesTeam: '',
    defaultOwner: '',
    defaultWorkflowName: '',
    defaultWhatsappTemplateId: '',
    defaultEmailTemplateId: '',
    followupRuleDays: 3,
    status: 'Active',
    notes: ''
  })

  useEffect(() => {
    fetchLeadTypes()
  }, [])

  const fetchLeadTypes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/lead-types')
      if (response.ok) {
        const data = await response.json()
        setLeadTypes(data.leadTypes || [])
      }
    } catch (error) {
      console.error('Error fetching lead types:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = editingLeadType 
        ? `/api/lead-types?id=${editingLeadType.id}`
        : '/api/lead-types'
      
      const method = editingLeadType ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchLeadTypes()
        resetForm()
        alert(editingLeadType ? 'Lead type updated!' : 'Lead type created!')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error || 'Something went wrong'}`)
      }
    } catch (error) {
      console.error('Error saving lead type:', error)
      alert('Failed to save lead type')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (leadType: LeadType) => {
    setEditingLeadType(leadType)
    setFormData({
      leadTypeName: leadType.lead_type_name,
      code: leadType.code,
      description: leadType.description,
      defaultDestinationHandling: leadType.default_destination_handling,
      defaultSalesTeam: leadType.default_sales_team,
      defaultOwner: leadType.default_owner,
      defaultWorkflowName: leadType.default_workflow_name,
      defaultWhatsappTemplateId: leadType.default_whatsapp_template_id,
      defaultEmailTemplateId: leadType.default_email_template_id,
      followupRuleDays: leadType.followup_rule_days,
      status: leadType.status,
      notes: leadType.notes
    })
    setShowAddForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to deactivate this lead type?')) return

    try {
      const response = await fetch(`/api/lead-types?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchLeadTypes()
        alert('Lead type deactivated successfully')
      }
    } catch (error) {
      console.error('Error deleting lead type:', error)
      alert('Failed to delete lead type')
    }
  }

  const resetForm = () => {
    setFormData({
      leadTypeName: '',
      code: '',
      description: '',
      defaultDestinationHandling: 'Flexible',
      defaultSalesTeam: '',
      defaultOwner: '',
      defaultWorkflowName: '',
      defaultWhatsappTemplateId: '',
      defaultEmailTemplateId: '',
      followupRuleDays: 3,
      status: 'Active',
      notes: ''
    })
    setEditingLeadType(null)
    setShowAddForm(false)
  }

  const filteredLeadTypes = leadTypes.filter(lt =>
    lt.lead_type_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lt.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lt.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/settings')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Settings
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Tag className="mr-2 h-6 w-6" />
              Lead Type Master
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage lead categories and automation rules (Group, FIT, Corporate)
            </p>
          </div>
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Lead Type
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search lead types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Lead Types Grid */}
      <div className="grid gap-4">
        {filteredLeadTypes.map((leadType) => (
          <Card key={leadType.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {leadType.lead_type_name}
                    </h3>
                    {leadType.code && (
                      <Badge variant="outline" className="text-xs">
                        {leadType.code}
                      </Badge>
                    )}
                    <Badge
                      variant={leadType.status === 'Active' ? 'default' : 'secondary'}
                    >
                      {leadType.status}
                    </Badge>
                  </div>
                  
                  {leadType.description && (
                    <p className="text-sm text-gray-600 mb-3">{leadType.description}</p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Destination Handling:</span>
                      <p className="font-medium">{leadType.default_destination_handling}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Follow-up Interval:</span>
                      <p className="font-medium">{leadType.followup_rule_days} days</p>
                    </div>
                    {leadType.default_sales_team && (
                      <div>
                        <span className="text-gray-500">Default Team:</span>
                        <p className="font-medium">{leadType.default_sales_team}</p>
                      </div>
                    )}
                    {leadType.default_workflow_name && (
                      <div>
                        <span className="text-gray-500">Workflow:</span>
                        <p className="font-medium">{leadType.default_workflow_name}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(leadType)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(leadType.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredLeadTypes.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No lead types found. Create one to get started!
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl my-8">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingLeadType ? 'Edit Lead Type' : 'Add New Lead Type'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Basic Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lead Type Name *
                    </label>
                    <Input
                      type="text"
                      required
                      placeholder="e.g., Group Trip, FIT, Corporate"
                      value={formData.leadTypeName}
                      onChange={(e) => setFormData({...formData, leadTypeName: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Code
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g., GROUP, FIT, CORP"
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Short explanation of this lead type"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </div>

              {/* Defaults & Rules */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Defaults & Rules</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Destination Handling
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.defaultDestinationHandling}
                      onChange={(e) => setFormData({...formData, defaultDestinationHandling: e.target.value})}
                    >
                      <option value="Fixed">Fixed (Group Tours)</option>
                      <option value="Flexible">Flexible (Custom)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Follow-up Rule (days)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.followupRuleDays}
                      onChange={(e) => setFormData({...formData, followupRuleDays: parseInt(e.target.value) || 3})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default Sales Team
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g., Group Sales Team"
                      value={formData.defaultSalesTeam}
                      onChange={(e) => setFormData({...formData, defaultSalesTeam: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default Owner
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g., John Doe"
                      value={formData.defaultOwner}
                      onChange={(e) => setFormData({...formData, defaultOwner: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Automation */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Automation</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default Workflow Name
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g., Group Tour Workflow"
                      value={formData.defaultWorkflowName}
                      onChange={(e) => setFormData({...formData, defaultWorkflowName: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Default WhatsApp Template ID
                      </label>
                      <Input
                        type="text"
                        placeholder="Gallabox template ID"
                        value={formData.defaultWhatsappTemplateId}
                        onChange={(e) => setFormData({...formData, defaultWhatsappTemplateId: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Default Email Template ID
                      </label>
                      <Input
                        type="text"
                        placeholder="SendGrid/Mailgun template ID"
                        value={formData.defaultEmailTemplateId}
                        onChange={(e) => setFormData({...formData, defaultEmailTemplateId: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Status & Notes */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Status & Notes</h3>
                <div className="space-y-4">
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Internal notes or developer reference"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : (editingLeadType ? 'Update' : 'Create')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default LeadTypeMaster

