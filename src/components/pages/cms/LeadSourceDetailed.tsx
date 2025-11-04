import React, { useState, useEffect } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Card, CardContent } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Plus, Search, Edit, Trash2, ArrowLeft, Target } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface LeadSourceDetailed {
  id: number
  source_name: string
  source_type: string
  platform_channel: string
  default_campaign_tag: string
  default_lead_type: string
  default_sales_team: string
  default_owner: string
  round_robin_active: boolean
  auto_whatsapp_template_id: string
  auto_email_template_id: string
  utm_source: string
  utm_medium: string
  utm_campaign: string
  avg_response_time_mins: number
  success_rate_percent: number
  avg_cpa: number
  status: string
  notes: string
  created_by: string
  date: string
}

const LeadSourceDetailed: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [leadSources, setLeadSources] = useState<LeadSourceDetailed[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingSource, setEditingSource] = useState<LeadSourceDetailed | null>(null)
  
  const [formData, setFormData] = useState({
    sourceName: '',
    sourceType: '',
    platformChannel: '',
    defaultCampaignTag: '',
    defaultLeadType: '',
    defaultSalesTeam: '',
    defaultOwner: '',
    roundRobinActive: false,
    autoWhatsappTemplateId: '',
    autoEmailTemplateId: '',
    utmSource: '',
    utmMedium: '',
    utmCampaign: '',
    avgResponseTimeMins: 0,
    successRatePercent: 0,
    avgCpa: 0,
    status: 'Active',
    notes: ''
  })

  useEffect(() => {
    fetchLeadSources()
  }, [])

  const fetchLeadSources = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/lead-source-detailed')
      const data = await response.json()
      
      if (response.ok) {
        setLeadSources(data.leadSources || [])
      } else {
        console.error('Failed to fetch lead sources:', data.error)
      }
    } catch (error) {
      console.error('Error fetching lead sources:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSource = async () => {
    if (!formData.sourceName.trim()) {
      alert('Please enter a source name')
      return
    }
    if (!formData.sourceType) {
      alert('Please select a source type')
      return
    }
    if (!formData.platformChannel.trim()) {
      alert('Please enter a platform/channel')
      return
    }

    try {
      setSaving(true)
      const method = editingSource ? 'PUT' : 'POST'
      const body = {
        ...(editingSource ? { id: editingSource.id } : {}),
        sourceName: formData.sourceName.trim(),
        sourceType: formData.sourceType,
        platformChannel: formData.platformChannel.trim(),
        defaultCampaignTag: formData.defaultCampaignTag.trim(),
        defaultLeadType: formData.defaultLeadType,
        defaultSalesTeam: formData.defaultSalesTeam.trim(),
        defaultOwner: formData.defaultOwner.trim(),
        roundRobinActive: formData.roundRobinActive,
        autoWhatsappTemplateId: formData.autoWhatsappTemplateId.trim(),
        autoEmailTemplateId: formData.autoEmailTemplateId.trim(),
        utmSource: formData.utmSource.trim(),
        utmMedium: formData.utmMedium.trim(),
        utmCampaign: formData.utmCampaign.trim(),
        avgResponseTimeMins: formData.avgResponseTimeMins || 0,
        successRatePercent: formData.successRatePercent || 0,
        avgCpa: formData.avgCpa || 0,
        status: formData.status,
        notes: formData.notes.trim()
      }

      const response = await fetch('/api/lead-source-detailed', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (response.ok) {
        await fetchLeadSources()
        setShowAddForm(false)
        setFormData({
          sourceName: '',
          sourceType: '',
          platformChannel: '',
          defaultCampaignTag: '',
          defaultLeadType: '',
          defaultSalesTeam: '',
          defaultOwner: '',
          roundRobinActive: false,
          autoWhatsappTemplateId: '',
          autoEmailTemplateId: '',
          utmSource: '',
          utmMedium: '',
          utmCampaign: '',
          avgResponseTimeMins: 0,
          successRatePercent: 0,
          avgCpa: 0,
          status: 'Active',
          notes: ''
        })
        setEditingSource(null)
        alert(data.message || 'Lead source saved successfully')
      } else {
        alert(data.error || 'Failed to save lead source')
      }
    } catch (error) {
      console.error('Error saving lead source:', error)
      alert('Error saving lead source')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSource = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/lead-source-detailed?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        await fetchLeadSources()
        alert(data.message || 'Lead source deleted successfully')
      } else {
        alert(data.error || 'Failed to delete lead source')
      }
    } catch (error) {
      console.error('Error deleting lead source:', error)
      alert('Error deleting lead source')
    }
  }

  const handleEditClick = (source: LeadSourceDetailed) => {
    setEditingSource(source)
    setFormData({
      sourceName: source.source_name,
      sourceType: source.source_type || '',
      platformChannel: source.platform_channel || '',
      defaultCampaignTag: source.default_campaign_tag || '',
      defaultLeadType: source.default_lead_type || '',
      defaultSalesTeam: source.default_sales_team || '',
      defaultOwner: source.default_owner || '',
      roundRobinActive: source.round_robin_active || false,
      autoWhatsappTemplateId: source.auto_whatsapp_template_id || '',
      autoEmailTemplateId: source.auto_email_template_id || '',
      utmSource: source.utm_source || '',
      utmMedium: source.utm_medium || '',
      utmCampaign: source.utm_campaign || '',
      avgResponseTimeMins: source.avg_response_time_mins || 0,
      successRatePercent: source.success_rate_percent || 0,
      avgCpa: source.avg_cpa || 0,
      status: source.status || 'Active',
      notes: source.notes || ''
    })
    setShowAddForm(true)
  }

  const handleCloseForm = () => {
    setShowAddForm(false)
    setEditingSource(null)
    setFormData({
      sourceName: '',
      sourceType: '',
      platformChannel: '',
      defaultCampaignTag: '',
      defaultLeadType: '',
      defaultSalesTeam: '',
      defaultOwner: '',
      roundRobinActive: false,
      autoWhatsappTemplateId: '',
      autoEmailTemplateId: '',
      utmSource: '',
      utmMedium: '',
      utmCampaign: '',
      avgResponseTimeMins: 0,
      successRatePercent: 0,
      avgCpa: 0,
      status: 'Active',
      notes: ''
    })
  }

  const filteredSources = leadSources.filter(source =>
    source.source_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    source.platform_channel.toLowerCase().includes(searchTerm.toLowerCase()) ||
    source.source_type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading lead sources...</p>
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
              <h1 className="text-lg font-bold text-gray-900">Lead Source Master (Detailed)</h1>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
                <Input
                  type="text"
                  placeholder="Search by name, platform, or type"
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
              Add Lead Source
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
                    <th className="w-full px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source Name</th>
                    <th className="w-32 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="w-32 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Platform</th>
                    <th className="w-32 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead Type</th>
                    <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success Rate</th>
                    <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="w-12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSources.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-4 text-center text-sm text-gray-500">
                        {searchTerm ? 'No lead sources found matching your search' : 'No lead sources found. Click "Add Lead Source" to create one.'}
                      </td>
                    </tr>
                  ) : (
                    filteredSources.map((source) => (
                      <tr key={source.id} className="hover:bg-gray-50">
                        <td className="px-3 py-3 text-sm font-medium text-gray-900">{source.source_name}</td>
                        <td className="px-3 py-3 text-sm">
                          <Badge variant={source.source_type === 'Paid' ? 'default' : source.source_type === 'Organic' ? 'outline' : 'secondary'}>
                            {source.source_type}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600">{source.platform_channel}</td>
                        <td className="px-3 py-3 text-sm text-gray-600">{source.default_lead_type || '-'}</td>
                        <td className="px-3 py-3 text-sm text-gray-600">
                          {source.success_rate_percent ? `${source.success_rate_percent.toFixed(1)}%` : '-'}
                        </td>
                        <td className="px-3 py-3 text-sm">
                          <Badge variant={source.status === 'Active' ? 'default' : 'secondary'}>
                            {source.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditClick(source)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSource(source.id, source.source_name)}
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
                  {editingSource ? 'Edit Lead Source' : 'Add Lead Source'}
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
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Basic Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Source Name <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="text"
                          placeholder="e.g., Meta Ads, Google Ads, Website, WhatsApp"
                          value={formData.sourceName}
                          onChange={(e) => setFormData({...formData, sourceName: e.target.value})}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Source Type <span className="text-red-500">*</span>
                          </label>
                          <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.sourceType}
                            onChange={(e) => setFormData({...formData, sourceType: e.target.value})}
                          >
                            <option value="">Select type</option>
                            <option value="Paid">Paid</option>
                            <option value="Organic">Organic</option>
                            <option value="Manual">Manual</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Platform / Channel <span className="text-red-500">*</span>
                          </label>
                          <Input
                            type="text"
                            placeholder="e.g., Meta, Google, Website, WhatsApp, Offline"
                            value={formData.platformChannel}
                            onChange={(e) => setFormData({...formData, platformChannel: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Campaign & Lead Settings */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Campaign & Lead Settings</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Default Campaign Tag
                        </label>
                        <Input
                          type="text"
                          placeholder="e.g., hampi_group_oct"
                          value={formData.defaultCampaignTag}
                          onChange={(e) => setFormData({...formData, defaultCampaignTag: e.target.value})}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Default Lead Type
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.defaultLeadType}
                          onChange={(e) => setFormData({...formData, defaultLeadType: e.target.value})}
                        >
                          <option value="">Select lead type</option>
                          <option value="Group">Group</option>
                          <option value="FIT">FIT</option>
                          <option value="Corporate">Corporate</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Default Sales Team
                          </label>
                          <Input
                            type="text"
                            placeholder="Team name"
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
                            placeholder="Owner name"
                            value={formData.defaultOwner}
                            onChange={(e) => setFormData({...formData, defaultOwner: e.target.value})}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.roundRobinActive}
                            onChange={(e) => setFormData({...formData, roundRobinActive: e.target.checked})}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700">Round-Robin Active</span>
                        </label>
                        <p className="text-xs text-gray-500 mt-1">Enable auto-assignment for this source</p>
                      </div>
                    </div>
                  </div>

                  {/* Automation Templates */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Automation Templates</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Auto WhatsApp Template ID
                        </label>
                        <Input
                          type="text"
                          placeholder="Gallabox template ID"
                          value={formData.autoWhatsappTemplateId}
                          onChange={(e) => setFormData({...formData, autoWhatsappTemplateId: e.target.value})}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Auto Email Template ID
                        </label>
                        <Input
                          type="text"
                          placeholder="SendGrid/Mailgun template ID"
                          value={formData.autoEmailTemplateId}
                          onChange={(e) => setFormData({...formData, autoEmailTemplateId: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  {/* UTM Tracking */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">UTM Tracking</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          UTM Source
                        </label>
                        <Input
                          type="text"
                          placeholder="For ads tracking"
                          value={formData.utmSource}
                          onChange={(e) => setFormData({...formData, utmSource: e.target.value})}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            UTM Medium
                          </label>
                          <Input
                            type="text"
                            placeholder="For ads tracking"
                            value={formData.utmMedium}
                            onChange={(e) => setFormData({...formData, utmMedium: e.target.value})}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            UTM Campaign
                          </label>
                          <Input
                            type="text"
                            placeholder="For ads tracking"
                            value={formData.utmCampaign}
                            onChange={(e) => setFormData({...formData, utmCampaign: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Performance Metrics (Read-only/Auto-calculated) */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Performance Metrics (Auto-calculated)</h3>
                    <div className="space-y-4 bg-gray-50 p-4 rounded-md">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Avg. Response Time (mins)
                          </label>
                          <Input
                            type="number"
                            value={formData.avgResponseTimeMins}
                            onChange={(e) => setFormData({...formData, avgResponseTimeMins: parseFloat(e.target.value) || 0})}
                            disabled={!editingSource}
                            className="bg-gray-100"
                          />
                          <p className="text-xs text-gray-500 mt-1">Auto-calculated</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Success Rate (%)
                          </label>
                          <Input
                            type="number"
                            step="0.1"
                            value={formData.successRatePercent}
                            onChange={(e) => setFormData({...formData, successRatePercent: parseFloat(e.target.value) || 0})}
                            disabled={!editingSource}
                            className="bg-gray-100"
                          />
                          <p className="text-xs text-gray-500 mt-1">Confirmed ÷ Total leads</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Avg. CPA (₹)
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.avgCpa}
                            onChange={(e) => setFormData({...formData, avgCpa: parseFloat(e.target.value) || 0})}
                            disabled={!editingSource}
                            className="bg-gray-100"
                          />
                          <p className="text-xs text-gray-500 mt-1">Ad spend ÷ Confirmed leads</p>
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
                          placeholder="Internal remarks"
                          value={formData.notes}
                          onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        />
                      </div>
                    </div>
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
                  onClick={handleSaveSource}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {saving ? 'Saving...' : editingSource ? 'Update' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LeadSourceDetailed

