import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Card, CardContent } from '../../ui/card'
import { Badge } from '../../ui/badge'
import {
  ArrowLeft,
  Filter,
  Search,
  Eye,
  Plus,
  ShieldCheck,
  Activity,
  Trash2,
  Lock,
  FileText,
  History
} from 'lucide-react'

type ActionType = 'Create' | 'Update' | 'Delete' | 'Automation Trigger'

interface AuditLog {
  id: number
  log_id: string
  activity_timestamp: string
  user_name: string
  module: string
  action_type: ActionType
  old_value: string | null
  new_value: string | null
  ip_address: string | null
  notes: string | null
  created_at: string
}

/**
 * Audit Log Master
 *
 * Integrations:
 * - Logs changes from all Masters
 * - Linked with User Role & Access Master for actor tracking
 * - Reports & Dashboard use this data for compliance
 *
 * Purpose: Provides visibility into every data change and automation trigger.
 */
const AuditLogMaster: React.FC = () => {
  const navigate = useNavigate()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterModule, setFilterModule] = useState<string>('all')
  const [filterAction, setFilterAction] = useState<string>('all')
  const [filterUser, setFilterUser] = useState<string>('all')
  const [limit, setLimit] = useState<number>(200)
  const [viewLog, setViewLog] = useState<AuditLog | null>(null)

  const [formData, setFormData] = useState({
    userName: '',
    module: '',
    actionType: 'Update' as ActionType,
    oldValue: '',
    newValue: '',
    ipAddress: '',
    notes: ''
  })

  useEffect(() => {
    fetchLogs()
  }, [filterModule, filterAction, filterUser, limit])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterModule !== 'all') params.append('module', filterModule)
      if (filterAction !== 'all') params.append('action', filterAction)
      if (filterUser !== 'all') params.append('user', filterUser)
      params.append('limit', String(limit))

      const response = await fetch(`/api/audit-logs?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const uniqueModules = useMemo(() => {
    const modules = new Set<string>()
    logs.forEach((log) => modules.add(log.module))
    return Array.from(modules).sort()
  }, [logs])

  const uniqueUsers = useMemo(() => {
    const users = new Set<string>()
    logs.forEach((log) => users.add(log.user_name))
    return Array.from(users).sort()
  }, [logs])

  const summary = useMemo(() => {
    const total = logs.length
    const byAction: Record<ActionType, number> = {
      Create: 0,
      Update: 0,
      Delete: 0,
      'Automation Trigger': 0
    }
    logs.forEach((log) => {
      byAction[log.action_type] = (byAction[log.action_type] || 0) + 1
    })

    const latestAutomation = logs.find((log) => log.action_type === 'Automation Trigger')

    return { total, byAction, latestAutomation }
  }, [logs])

  const filteredLogs = useMemo(() => {
    const normalized = searchTerm.toLowerCase()
    return logs.filter((log) => {
      return (
        log.log_id.toLowerCase().includes(normalized) ||
        log.user_name.toLowerCase().includes(normalized) ||
        log.module.toLowerCase().includes(normalized) ||
        log.action_type.toLowerCase().includes(normalized) ||
        (log.notes || '').toLowerCase().includes(normalized)
      )
    })
  }, [logs, searchTerm])

  const resetForm = () => {
    setFormData({
      userName: '',
      module: '',
      actionType: 'Update',
      oldValue: '',
      newValue: '',
      ipAddress: '',
      notes: ''
    })
    setSaving(false)
    setShowForm(false)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)

    const payload = {
      user_name: formData.userName,
      module: formData.module,
      action_type: formData.actionType,
      activity_timestamp: new Date().toISOString(),
      old_value: formData.oldValue || null,
      new_value: formData.newValue || null,
      ip_address: formData.ipAddress || null,
      notes: formData.notes || null
    }

    try {
      const response = await fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        await fetchLogs()
        resetForm()
      } else {
        const error = await response.json()
        alert(`Failed to create audit log: ${error.details || error.error}`)
      }
    } catch (error) {
      console.error('Error creating audit log:', error)
      alert('Failed to create audit log')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this audit log entry? This should only be done to remove erroneous records.')) return

    try {
      const response = await fetch(`/api/audit-logs?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchLogs()
      } else {
        const error = await response.json()
        alert(`Failed to delete audit log: ${error.details || error.error}`)
      }
    } catch (error) {
      console.error('Error deleting audit log:', error)
      alert('Failed to delete audit log')
    }
  }

  const actionBadgeColor = (action: ActionType) => {
    switch (action) {
      case 'Create':
        return 'bg-green-600'
      case 'Update':
        return 'bg-blue-600'
      case 'Delete':
        return 'bg-red-600'
      case 'Automation Trigger':
        return 'bg-purple-600'
      default:
        return 'bg-gray-600'
    }
  }

  if (viewLog) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => setViewLog(null)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Audit Logs
        </Button>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Audit Log Details</h2>
                <p className="text-sm text-gray-500">Log ID: {viewLog.log_id}</p>
              </div>
              <Badge className={`${actionBadgeColor(viewLog.action_type)} text-white`}>
                {viewLog.action_type}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <span className="font-medium text-gray-600">User Name:</span> {viewLog.user_name}
              </div>
              <div>
                <span className="font-medium text-gray-600">Module:</span> {viewLog.module}
              </div>
              <div>
                <span className="font-medium text-gray-600">Timestamp:</span>{' '}
                {new Date(viewLog.activity_timestamp).toLocaleString()}
              </div>
              <div>
                <span className="font-medium text-gray-600">IP Address:</span>{' '}
                {viewLog.ip_address || 'Not Captured'}
              </div>
            </div>

            <div>
              <span className="font-medium text-gray-600 block mb-1">Old Value:</span>
              <pre className="bg-gray-50 border border-gray-200 rounded-md p-3 text-sm text-gray-800 whitespace-pre-wrap overflow-x-auto">
                {viewLog.old_value || 'N/A'}
              </pre>
            </div>

            <div>
              <span className="font-medium text-gray-600 block mb-1">New Value:</span>
              <pre className="bg-gray-50 border border-gray-200 rounded-md p-3 text-sm text-gray-800 whitespace-pre-wrap overflow-x-auto">
                {viewLog.new_value || 'N/A'}
              </pre>
            </div>

            {viewLog.notes && (
              <div>
                <span className="font-medium text-gray-600 block mb-1">Notes:</span>
                <p className="text-sm text-gray-700 bg-yellow-50 border border-yellow-200 rounded-md p-2">
                  {viewLog.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (showForm) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Button variant="ghost" onClick={resetForm} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Audit Logs
        </Button>
        <h2 className="text-2xl font-bold mb-6">Manual Audit Log Entry</h2>
        <p className="text-sm text-gray-500 mb-6">
          Use this form to document manual adjustments or backfill historical actions. Automated events are
          recorded in real-time by the system.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User Name *
              </label>
              <Input
                value={formData.userName}
                onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                required
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Module Affected *
              </label>
              <Input
                value={formData.module}
                onChange={(e) => setFormData({ ...formData, module: e.target.value })}
                required
                placeholder="Leads / Hotels / Automation"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action Type *
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.actionType}
                onChange={(e) =>
                  setFormData({ ...formData, actionType: e.target.value as ActionType })
                }
              >
                <option value="Create">Create</option>
                <option value="Update">Update</option>
                <option value="Delete">Delete</option>
                <option value="Automation Trigger">Automation Trigger</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IP Address
              </label>
              <Input
                value={formData.ipAddress}
                onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                placeholder="192.168.1.10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Old Value
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={5}
              value={formData.oldValue}
              onChange={(e) => setFormData({ ...formData, oldValue: e.target.value })}
              placeholder="Previous JSON / text value"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Value
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={5}
              value={formData.newValue}
              onChange={(e) => setFormData({ ...formData, newValue: e.target.value })}
              placeholder="Updated JSON / text value"
            />
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
              placeholder="Optional remarks or reference ID"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" type="button" onClick={resetForm} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={saving}>
              {saving ? 'Saving...' : 'Record Audit Log'}
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
              <History className="h-6 w-6" />
              Audit Log Master
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Track every data change, automation trigger, and user activity across the CRM.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Connected to all Masters, User Role &amp; Access for actor mapping, and compliance dashboards for reporting.
            </p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Manual Entry
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/settings/user-role-access')}>
            <ShieldCheck className="h-4 w-4 mr-2" />
            User Role &amp; Access Master
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/reports')}>
            <FileText className="h-4 w-4 mr-2" />
            Compliance Reports
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/automation')}>
            <Activity className="h-4 w-4 mr-2" />
            Automation Engine
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Total Logs</div>
            <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Creates</div>
            <div className="text-2xl font-bold text-green-600">{summary.byAction.Create}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Updates</div>
            <div className="text-2xl font-bold text-blue-600">{summary.byAction.Update}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Deletes / Automation</div>
            <div className="text-lg font-semibold text-purple-600">
              Delete: {summary.byAction.Delete} • Automation: {summary.byAction['Automation Trigger']}
            </div>
            {summary.latestAutomation && (
              <p className="text-xs text-gray-500 mt-2">
                Latest automation: {summary.latestAutomation.module} at{' '}
                {new Date(summary.latestAutomation.activity_timestamp).toLocaleTimeString()}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
        <div className="lg:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search log ID, user, module, or note..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          className="px-3 py-2 border border-gray-300 rounded-md"
          value={filterModule}
          onChange={(e) => setFilterModule(e.target.value)}
        >
          <option value="all">All Modules</option>
          {uniqueModules.map((module) => (
            <option key={module} value={module}>
              {module}
            </option>
          ))}
        </select>
        <select
          className="px-3 py-2 border border-gray-300 rounded-md"
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
        >
          <option value="all">All Actions</option>
          <option value="Create">Create</option>
          <option value="Update">Update</option>
          <option value="Delete">Delete</option>
          <option value="Automation Trigger">Automation Trigger</option>
        </select>
        <select
          className="px-3 py-2 border border-gray-300 rounded-md"
          value={filterUser}
          onChange={(e) => setFilterUser(e.target.value)}
        >
          <option value="all">All Users</option>
          {uniqueUsers.map((user) => (
            <option key={user} value={user}>
              {user}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2 border border-gray-300 rounded-md px-3 py-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <input
            type="number"
            className="w-full outline-none text-sm"
            min={50}
            max={1000}
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value || '50', 10))}
          />
          <span className="text-sm text-gray-500">records</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading audit logs...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-12">
          <History className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">
            No audit logs found for the selected filters.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredLogs.map((log) => (
            <Card key={log.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge variant="outline">Log #{log.log_id}</Badge>
                      <Badge className={`${actionBadgeColor(log.action_type)} text-white`}>
                        {log.action_type}
                      </Badge>
                      <Badge variant="outline">{log.module}</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 text-sm text-gray-700">
                      <div>
                        <span className="font-medium text-gray-600">User:</span> {log.user_name}
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Timestamp:</span>{' '}
                        {new Date(log.activity_timestamp).toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">IP:</span>{' '}
                        {log.ip_address || 'Not Captured'}
                      </div>
                      {log.notes && (
                        <div>
                          <span className="font-medium text-gray-600">Notes:</span> {log.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 lg:flex-col lg:items-end">
                    <Button size="sm" variant="outline" onClick={() => setViewLog(log)}>
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => handleDelete(log.id)}
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

export default AuditLogMaster


