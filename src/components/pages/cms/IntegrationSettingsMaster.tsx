import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Card, CardContent } from '../../ui/card'
import { Badge } from '../../ui/badge'
import {
  ArrowLeft,
  Plus,
  Search,
  Edit,
  Trash2,
  Zap,
  Plug,
  Clock,
  Link2,
  KeyRound,
  Workflow,
  Send,
  Activity
} from 'lucide-react'

type IntegrationType = 'Messaging' | 'Lead' | 'Payment' | 'Analytics' | 'Other'
type ConnectionStatus = 'Active' | 'Inactive'

interface IntegrationSetting {
  id: number
  integration_name: string
  api_key: string
  endpoint_url: string
  integration_type: IntegrationType
  last_synced: string | null
  connection_status: ConnectionStatus
  added_by: string
  notes: string | null
  updated_at: string
  created_at: string
}

/**
 * Integration Settings Master
 *
 * Integrations:
 * - Notification Template Master (for messaging template IDs / API keys)
 * - UTM Tracking Setup (source tracking for campaigns)
 * - Automation Engine (lead syncs, webhooks, workflows)
 *
 * Purpose:
 * Stores credentials and configuration for third-party integrations like Meta, Google, Gallabox, SendGrid, etc.
 */
const IntegrationSettingsMaster: React.FC = () => {
  const navigate = useNavigate()
  const [settings, setSettings] = useState<IntegrationSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingSetting, setEditingSetting] = useState<IntegrationSetting | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | IntegrationType>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | ConnectionStatus>('all')

  const [formData, setFormData] = useState({
    integrationName: '',
    apiKey: '',
    endpointUrl: '',
    integrationType: 'Messaging' as IntegrationType,
    lastSynced: '',
    connectionStatus: 'Active' as ConnectionStatus,
    addedBy: 'Admin',
    notes: ''
  })

  useEffect(() => {
    fetchSettings()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, filterStatus])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterType !== 'all') params.append('type', filterType)
      if (filterStatus !== 'all') params.append('status', filterStatus)

      const response = await fetch(`/api/integration-settings?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings || [])
      }
    } catch (error) {
      console.error('Error fetching integration settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      integrationName: '',
      apiKey: '',
      endpointUrl: '',
      integrationType: 'Messaging',
      lastSynced: '',
      connectionStatus: 'Active',
      addedBy: 'Admin',
      notes: ''
    })
    setSaving(false)
    setEditingSetting(null)
    setShowForm(false)
  }

  const maskApiKey = (apiKey: string) => {
    if (!apiKey) return ''
    if (apiKey.length <= 8) return '*'.repeat(apiKey.length)
    return `${apiKey.slice(0, 4)}****${apiKey.slice(-4)}`
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)

    const payload = {
      integration_name: formData.integrationName,
      api_key: formData.apiKey,
      endpoint_url: formData.endpointUrl,
      integration_type: formData.integrationType,
      last_synced: formData.lastSynced || null,
      connection_status: formData.connectionStatus,
      added_by: formData.addedBy,
      notes: formData.notes || null
    }

    try {
      const method = editingSetting ? 'PUT' : 'POST'
      const body = editingSetting ? { ...payload, id: editingSetting.id } : payload

      const response = await fetch('/api/integration-settings', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        await fetchSettings()
        resetForm()
      } else {
        const error = await response.json()
        alert(`Failed to save integration: ${error.details || error.error}`)
      }
    } catch (error) {
      console.error('Error saving integration:', error)
      alert('Failed to save integration')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (setting: IntegrationSetting) => {
    setEditingSetting(setting)
    setFormData({
      integrationName: setting.integration_name,
      apiKey: setting.api_key,
      endpointUrl: setting.endpoint_url,
      integrationType: setting.integration_type,
      lastSynced: setting.last_synced
        ? new Date(setting.last_synced).toISOString().slice(0, 16)
        : '',
      connectionStatus: setting.connection_status,
      addedBy: setting.added_by,
      notes: setting.notes || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete integration "${name}"?`)) return

    try {
      const response = await fetch(`/api/integration-settings?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      if (response.ok) {
        await fetchSettings()
        alert(data.message || 'Integration deleted successfully')
      } else {
        alert(data.error || 'Failed to delete integration')
      }
    } catch (error) {
      console.error('Error deleting integration:', error)
      alert('Failed to delete integration')
    }
  }

  const filteredSettings = useMemo(() => {
    const normalized = searchTerm.toLowerCase()
    return settings.filter((integration) => {
      return (
        integration.integration_name.toLowerCase().includes(normalized) ||
        (integration.endpoint_url || '').toLowerCase().includes(normalized) ||
        (integration.notes || '').toLowerCase().includes(normalized) ||
        (integration.added_by || '').toLowerCase().includes(normalized)
      )
    })
  }, [settings, searchTerm])

  const summary = useMemo(() => {
    const total = settings.length
    const active = settings.filter((s) => s.connection_status === 'Active').length
    const byType = settings.reduce<Record<IntegrationType, number>>(
      (acc, integration) => {
        acc[integration.integration_type] = (acc[integration.integration_type] || 0) + 1
        return acc
      },
      { Messaging: 0, Lead: 0, Payment: 0, Analytics: 0, Other: 0 }
    )
    const recentlySynced = settings
      .map((s) => s.last_synced ? new Date(s.last_synced).getTime() : 0)
      .filter(Boolean)
      .sort((a, b) => b - a)[0]

    return { total, active, byType, recentlySynced }
  }, [settings])

  if (showForm) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Button variant="ghost" onClick={resetForm} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Integrations
        </Button>

        <h2 className="text-2xl font-bold mb-2">
          {editingSetting ? 'Edit Integration Setting' : 'Add Integration Setting'}
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Manage credentials and configuration for external systems. Ensure API keys are stored securely and rotated periodically.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Integration Name *
              </label>
              <Input
                value={formData.integrationName}
                onChange={(e) => setFormData({ ...formData, integrationName: e.target.value })}
                required
                placeholder="Gallabox / SendGrid / Meta"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Integration Type *
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.integrationType}
                onChange={(e) =>
                  setFormData({ ...formData, integrationType: e.target.value as IntegrationType })
                }
              >
                <option value="Messaging">Messaging</option>
                <option value="Lead">Lead</option>
                <option value="Payment">Payment</option>
                <option value="Analytics">Analytics</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key / Token *
              </label>
              <Input
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                required
                placeholder="Paste API key or token"
              />
              <p className="text-xs text-gray-500 mt-1">
                Store credentials securely. Update keys when regenerating access.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Endpoint URL *
              </label>
              <Input
                type="url"
                value={formData.endpointUrl}
                onChange={(e) => setFormData({ ...formData, endpointUrl: e.target.value })}
                required
                placeholder="https://api.example.com/webhook"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Added By *
              </label>
              <Input
                value={formData.addedBy}
                onChange={(e) => setFormData({ ...formData, addedBy: e.target.value })}
                required
                placeholder="Admin user who configured this integration"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Connection Status *
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.connectionStatus}
                onChange={(e) =>
                  setFormData({ ...formData, connectionStatus: e.target.value as ConnectionStatus })
                }
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Synced
              </label>
              <Input
                type="datetime-local"
                value={formData.lastSynced}
                onChange={(e) => setFormData({ ...formData, lastSynced: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Credentials reference, webhook instructions, fallback contacts, etc."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" type="button" onClick={resetForm} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={saving}>
              {saving ? 'Saving...' : editingSetting ? 'Update Integration' : 'Create Integration'}
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

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Plug className="h-6 w-6" />
              Integration Settings Master
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage API credentials and endpoints for messaging, lead, payment, and analytics integrations.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Connected to Notification Template Master, UTM Tracking Setup, and Automation Engine to enable seamless campaigns and workflows.
            </p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Integration
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/settings/notification-template-master')}>
            <Send className="h-4 w-4 mr-2" />
            Notification Template Master
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/settings/utm-setup')}>
            <Zap className="h-4 w-4 mr-2" />
            UTM Tracking Setup
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/automation')}>
            <Workflow className="h-4 w-4 mr-2" />
            Automation Engine
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Total Integrations</div>
            <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Active Connections</div>
            <div className="text-2xl font-bold text-green-600">{summary.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Messaging / Lead</div>
            <div className="text-lg font-semibold text-blue-600">
              Messaging: {summary.byType.Messaging} • Lead: {summary.byType.Lead}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Last Synced</div>
            <div className="text-sm font-medium text-gray-900">
              {summary.recentlySynced
                ? new Date(summary.recentlySynced).toLocaleString()
                : 'No Sync Recorded'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
        <div className="lg:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by integration, endpoint, or user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          className="px-3 py-2 border border-gray-300 rounded-md"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as typeof filterType)}
        >
          <option value="all">All Types</option>
          <option value="Messaging">Messaging</option>
          <option value="Lead">Lead</option>
          <option value="Payment">Payment</option>
          <option value="Analytics">Analytics</option>
          <option value="Other">Other</option>
        </select>
        <select
          className="px-3 py-2 border border-gray-300 rounded-md"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
        >
          <option value="all">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <Button variant="outline" onClick={fetchSettings}>
          <Activity className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading integration settings...</p>
        </div>
      ) : filteredSettings.length === 0 ? (
        <div className="text-center py-12">
          <Plug className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">No integrations found. Add your first integration.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredSettings.map((integration) => (
            <Card key={integration.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {integration.integration_name}
                      </h3>
                      <Badge variant="outline">
                        {integration.integration_type}
                      </Badge>
                      <Badge
                        className={
                          integration.connection_status === 'Active'
                            ? 'bg-green-600 text-white'
                            : 'bg-yellow-500 text-gray-900'
                        }
                      >
                        {integration.connection_status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <KeyRound className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-700">API Key:</span>{' '}
                        {maskApiKey(integration.api_key)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Link2 className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-700">Endpoint:</span>{' '}
                        <span className="truncate">{integration.endpoint_url}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-700">Last Synced:</span>{' '}
                        {integration.last_synced
                          ? new Date(integration.last_synced).toLocaleString()
                          : 'Not sync’d yet'}
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-700">Added By:</span>{' '}
                        {integration.added_by}
                      </div>
                    </div>

                    {integration.notes && (
                      <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-md p-2">
                        {integration.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 lg:flex-col lg:items-end">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(integration)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => handleDelete(integration.id, integration.integration_name)}
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

export default IntegrationSettingsMaster

