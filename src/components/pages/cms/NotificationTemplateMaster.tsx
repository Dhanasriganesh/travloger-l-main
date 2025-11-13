import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Card, CardContent } from '../../ui/card'
import { Badge } from '../../ui/badge'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ArrowLeft,
  MessageCircle,
  Mail,
  Phone,
  Workflow,
  Plug,
  Send,
  Tags
} from 'lucide-react'

type ChannelType = 'WhatsApp' | 'Email' | 'SMS'
type StatusType = 'Active' | 'Inactive'

interface NotificationTemplate {
  id: number
  template_name: string
  channel: ChannelType
  template_id: string
  message_content: string
  linked_automation: string | null
  integration_reference: string | null
  lead_source_reference: string | null
  status: StatusType
  notes: string | null
  last_updated_by: string | null
  updated_at: string
  created_at: string
}

/**
 * Notification Template Master
 *
 * Integrations:
 * 1. Automation Engine (linked_automation)
 * 2. Integration Settings Master (Gallabox, SendGrid, etc.) for template IDs
 * 3. Lead Source Master for automated replies
 * 4. Reports & Campaign engine consume the approved templates
 *
 * Purpose:
 * Central library for WhatsApp, Email, and SMS notification templates.
 * Stores pre-approved messages, linked automations, and integration references.
 */
const NotificationTemplateMaster: React.FC = () => {
  const navigate = useNavigate()
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterChannel, setFilterChannel] = useState<'all' | ChannelType>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | StatusType>('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null)
  const [formData, setFormData] = useState({
    templateName: '',
    channel: 'WhatsApp' as ChannelType,
    templateId: '',
    messageContent: '',
    linkedAutomation: '',
    integrationReference: '',
    leadSourceReference: '',
    status: 'Active' as StatusType,
    notes: '',
    lastUpdatedBy: 'Admin'
  })

  useEffect(() => {
    fetchTemplates()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterChannel, filterStatus])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterChannel !== 'all') params.append('channel', filterChannel)
      if (filterStatus !== 'all') params.append('status', filterStatus)

      const response = await fetch(`/api/notification-templates?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      templateName: '',
      channel: 'WhatsApp',
      templateId: '',
      messageContent: '',
      linkedAutomation: '',
      integrationReference: '',
      leadSourceReference: '',
      status: 'Active',
      notes: '',
      lastUpdatedBy: 'Admin'
    })
    setEditingTemplate(null)
    setShowForm(false)
    setSaving(false)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)

    const payload = {
      template_name: formData.templateName,
      channel: formData.channel,
      template_id: formData.templateId,
      message_content: formData.messageContent,
      linked_automation: formData.linkedAutomation || null,
      integration_reference: formData.integrationReference || null,
      lead_source_reference: formData.leadSourceReference || null,
      status: formData.status,
      notes: formData.notes || null,
      last_updated_by: formData.lastUpdatedBy || 'Admin'
    }

    try {
      const method = editingTemplate ? 'PUT' : 'POST'
      const body = editingTemplate ? { ...payload, id: editingTemplate.id } : payload
      const response = await fetch('/api/notification-templates', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        await fetchTemplates()
        resetForm()
      } else {
        const error = await response.json()
        alert(`Failed to save template: ${error.details || error.error}`)
      }
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (template: NotificationTemplate) => {
    setEditingTemplate(template)
    setFormData({
      templateName: template.template_name,
      channel: template.channel,
      templateId: template.template_id,
      messageContent: template.message_content,
      linkedAutomation: template.linked_automation || '',
      integrationReference: template.integration_reference || '',
      leadSourceReference: template.lead_source_reference || '',
      status: template.status,
      notes: template.notes || '',
      lastUpdatedBy: template.last_updated_by || 'Admin'
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      const response = await fetch(`/api/notification-templates?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchTemplates()
      } else {
        const error = await response.json()
        alert(`Failed to delete template: ${error.details || error.error}`)
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Failed to delete template')
    }
  }

  const iconForChannel = (channel: ChannelType) => {
    switch (channel) {
      case 'WhatsApp':
        return <MessageCircle className="h-4 w-4" />
      case 'Email':
        return <Mail className="h-4 w-4" />
      case 'SMS':
        return <Phone className="h-4 w-4" />
      default:
        return null
    }
  }

  const filteredTemplates = useMemo(() => {
    const normalized = searchTerm.toLowerCase()
    return templates.filter((template) => {
      return (
        template.template_name.toLowerCase().includes(normalized) ||
        template.template_id.toLowerCase().includes(normalized) ||
        (template.linked_automation || '').toLowerCase().includes(normalized) ||
        (template.integration_reference || '').toLowerCase().includes(normalized) ||
        (template.message_content || '').toLowerCase().includes(normalized)
      )
    })
  }, [templates, searchTerm])

  const summary = useMemo(() => {
    const total = templates.length
    const active = templates.filter((t) => t.status === 'Active').length
    const byChannel = templates.reduce<Record<ChannelType, number>>(
      (acc, template) => {
        acc[template.channel] = (acc[template.channel] || 0) + 1
        return acc
      },
      { WhatsApp: 0, Email: 0, SMS: 0 }
    )

    return { total, active, byChannel }
  }, [templates])

  if (showForm) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Button variant="ghost" onClick={resetForm} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Templates
        </Button>

        <h2 className="text-2xl font-bold mb-6">
          {editingTemplate ? 'Edit Notification Template' : 'Create Notification Template'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name *
              </label>
              <Input
                value={formData.templateName}
                onChange={(e) => setFormData({ ...formData, templateName: e.target.value })}
                required
                placeholder="Welcome Message"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Channel *
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.channel}
                onChange={(e) => setFormData({ ...formData, channel: e.target.value as ChannelType })}
                required
              >
                <option value="WhatsApp">WhatsApp</option>
                <option value="Email">Email</option>
                <option value="SMS">SMS</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template ID *
              </label>
              <Input
                value={formData.templateId}
                onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                required
                placeholder="gallabox_template_001"
              />
              <p className="text-xs text-gray-500 mt-1">
                Refer to Integration Settings (Gallabox / SendGrid) for approved IDs.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Linked Automation
              </label>
              <Input
                value={formData.linkedAutomation}
                onChange={(e) => setFormData({ ...formData, linkedAutomation: e.target.value })}
                placeholder="Payment Reminder Workflow"
              />
              <p className="text-xs text-gray-500 mt-1">
                Automation or workflow that triggers this template.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Integration Reference
              </label>
              <Input
                value={formData.integrationReference}
                onChange={(e) => setFormData({ ...formData, integrationReference: e.target.value })}
                placeholder="Gallabox - Welcome Series"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lead Source Reference
              </label>
              <Input
                value={formData.leadSourceReference}
                onChange={(e) => setFormData({ ...formData, leadSourceReference: e.target.value })}
                placeholder="Website Lead Form"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Updated By
              </label>
              <Input
                value={formData.lastUpdatedBy}
                onChange={(e) => setFormData({ ...formData, lastUpdatedBy: e.target.value })}
                placeholder="Admin User"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as StatusType })}
                required
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message Content *
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={6}
              value={formData.messageContent}
              onChange={(e) => setFormData({ ...formData, messageContent: e.target.value })}
              required
              placeholder="Hello {{name}}, welcome to Travloger!"
            />
            <p className="text-xs text-gray-500 mt-1">
              Ensure placeholders are approved with integration partners (Gallabox / SendGrid).
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Internal notes or developer comments"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" type="button" onClick={resetForm} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={saving}>
              {saving ? 'Saving...' : editingTemplate ? 'Update Template' : 'Create Template'}
            </Button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/settings')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Settings
        </Button>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Send className="mr-2 h-6 w-6" />
              Notification Template Master
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage pre-approved templates for WhatsApp, Email, and SMS automations.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Connected to Automation Engine, Integration Settings (Gallabox, SendGrid), Lead Source Master, and campaign workflows.
            </p>
          </div>
          <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/automation')}>
            <Workflow className="h-4 w-4 mr-2" />
            Automation Engine
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/settings/integration-settings')}>
            <Plug className="h-4 w-4 mr-2" />
            Integration Settings Master
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/settings/lead-source-detailed')}>
            <Tags className="h-4 w-4 mr-2" />
            Lead Source Master
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/reports')}>
            <Send className="h-4 w-4 mr-2" />
            Reports & Dashboard
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Total Templates</div>
            <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Active</div>
            <div className="text-2xl font-bold text-green-600">{summary.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">WhatsApp Templates</div>
            <div className="text-2xl font-bold text-emerald-600">{summary.byChannel.WhatsApp}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Email / SMS</div>
            <div className="text-lg font-semibold text-blue-600">
              Email: {summary.byChannel.Email} • SMS: {summary.byChannel.SMS}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by template name, ID, automation, or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          className="px-4 py-2 border border-gray-300 rounded-md"
          value={filterChannel}
          onChange={(e) => setFilterChannel(e.target.value as typeof filterChannel)}
        >
          <option value="all">All Channels</option>
          <option value="WhatsApp">WhatsApp</option>
          <option value="Email">Email</option>
          <option value="SMS">SMS</option>
        </select>
        <select
          className="px-4 py-2 border border-gray-300 rounded-md"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
        >
          <option value="all">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading notification templates...</p>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <Send className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">
            No templates found. Create one to get started with automations.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {template.template_name}
                      </h3>
                      <Badge variant="outline" className="flex items-center gap-1">
                        {iconForChannel(template.channel)}
                        {template.channel}
                      </Badge>
                      <Badge
                        className={
                          template.status === 'Active' ? 'bg-green-500' : 'bg-yellow-500 text-gray-900'
                        }
                      >
                        {template.status}
                      </Badge>
                      {template.linked_automation && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Workflow className="h-3 w-3" />
                          {template.linked_automation}
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                      <div>
                        <span className="font-medium text-gray-700">Template ID:</span>{' '}
                        {template.template_id}
                      </div>
                      {template.integration_reference && (
                        <div>
                          <span className="font-medium text-gray-700">Integration:</span>{' '}
                          {template.integration_reference}
                        </div>
                      )}
                      {template.lead_source_reference && (
                        <div>
                          <span className="font-medium text-gray-700">Lead Source:</span>{' '}
                          {template.lead_source_reference}
                        </div>
                      )}
                      <div>
                        <span className="font-medium text-gray-700">Last Updated By:</span>{' '}
                        {template.last_updated_by || 'System'}
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Updated:</span>{' '}
                        {new Date(template.updated_at).toLocaleString()}
                      </div>
                    </div>

                    <div className="mt-3 bg-gray-50 border border-gray-200 rounded-md p-3 text-sm text-gray-800 whitespace-pre-line">
                      {template.message_content}
                    </div>

                    {template.notes && (
                      <p className="text-xs text-gray-500 mt-2">Notes: {template.notes}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 md:flex-col md:items-end">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(template)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => handleDelete(template.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default NotificationTemplateMaster

