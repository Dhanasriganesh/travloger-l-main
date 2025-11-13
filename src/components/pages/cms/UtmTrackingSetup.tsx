import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../ui/button'
import { Card, CardContent } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { ArrowLeft, Zap, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'

interface UtmStatus {
  success: boolean
  setup_complete: boolean
  utm_fields_in_leads: Array<{ column_name: string; data_type: string }>
  utm_indexes: Array<{ indexname: string; indexdef: string }>
  uncategorized_source: { id: number; source_name: string; status: string } | null
}

const UtmTrackingSetup: React.FC = () => {
  const navigate = useNavigate()
  const [status, setStatus] = useState<UtmStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [runningSetup, setRunningSetup] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/utm-setup')
      const data = await response.json()
      if (response.ok) {
        setStatus(data)
      } else {
        setError(data.error || 'Failed to fetch UTM setup status')
      }
    } catch (err) {
      console.error('Error fetching UTM status:', err)
      setError('Failed to fetch UTM setup status')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const handleSetup = async () => {
    try {
      setRunningSetup(true)
      setMessage(null)
      setError(null)
      const response = await fetch('/api/utm-setup', { method: 'POST' })
      const data = await response.json()
      if (response.ok) {
        setMessage(data.message || 'UTM tracking setup completed successfully.')
        await fetchStatus()
      } else {
        setError(data.error || 'Failed to complete UTM setup')
      }
    } catch (err) {
      console.error('Error running UTM setup:', err)
      setError('Failed to complete UTM setup')
    } finally {
      setRunningSetup(false)
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <Button variant="ghost" onClick={() => navigate('/settings')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Settings
        </Button>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Zap className="h-6 w-6 text-blue-600" />
              UTM Tracking Setup
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Configure campaign tracking fields across leads and lead source masters. Ensures all Meta/Google integrations capture UTM data.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchStatus} disabled={loading || runningSetup}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleSetup}
              disabled={runningSetup}
            >
              {runningSetup ? 'Running Setup...' : 'Run UTM Setup'}
            </Button>
          </div>
        </div>
      </div>

      {message && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Current Setup Status</h2>
            <Badge className={status?.setup_complete ? 'bg-green-600' : 'bg-yellow-500 text-gray-900'}>
              {status?.setup_complete ? 'Complete' : 'Action Required'}
            </Badge>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Checking UTM tracking status...</p>
          ) : status ? (
            <div className="space-y-6 text-sm text-gray-700">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">UTM Fields in Leads Table</h3>
                {status.utm_fields_in_leads.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {status.utm_fields_in_leads.map((field) => (
                      <li key={field.column_name}>
                        <span className="font-medium">{field.column_name}</span> ({field.data_type})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-500">
                    UTM fields not found. Run the setup to add required columns.
                  </p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Uncategorized Source</h3>
                {status.uncategorized_source ? (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>{status.uncategorized_source.source_name} ({status.uncategorized_source.status})</span>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">
                    "Uncategorized Source" entry not found. Run setup to create the default record.
                  </p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">UTM Indexes</h3>
                {status.utm_indexes.length > 0 ? (
                  <ul className="space-y-2">
                    {status.utm_indexes.map((index) => (
                      <li key={index.indexname} className="bg-gray-50 border border-gray-200 rounded px-3 py-2">
                        <div className="font-medium text-gray-800">{index.indexname}</div>
                        <div className="text-xs text-gray-500 break-all">{index.indexdef}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-500">
                    No UTM indexes detected. Setup will add recommended indexes for performance.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Unable to load UTM setup status.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-3 text-sm text-gray-700">
          <h3 className="text-sm font-semibold text-gray-900">How it works</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Adds UTM fields (source, medium, campaign) and lead source link to the leads table.</li>
            <li>Creates required indexes for fast campaign analytics.</li>
            <li>Ensures “Uncategorized Source” exists in Lead Source Master for unmatched campaigns.</li>
            <li>Supports automation engine, reports, and lead routing based on UTM data.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

export default UtmTrackingSetup


