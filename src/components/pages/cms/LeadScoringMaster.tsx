import React, { useState, useEffect } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Card, CardContent } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Plus, Search, Edit, Trash2, ArrowLeft, Target, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface ScoringRule {
  id: number
  scoring_criteria_name: string
  field_checked: string
  condition_type: string
  condition_value: string
  score_value: number
  lead_type: string
  automation_trigger: string
  priority_range_hot: number
  priority_range_warm_min: number
  priority_range_warm_max: number
  priority_range_cold_max: number
  status: string
  notes: string
  created_by: string
  date: string
}

const LeadScoringMaster: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [scoringRules, setScoringRules] = useState<ScoringRule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingRule, setEditingRule] = useState<ScoringRule | null>(null)
  const [filterLeadType, setFilterLeadType] = useState<string>('all')
  
  const [formData, setFormData] = useState({
    scoringCriteriaName: '',
    fieldChecked: 'budget',
    conditionType: 'greater_than_or_equal',
    conditionValue: '',
    scoreValue: 10,
    leadType: 'Group',
    automationTrigger: 'On Lead Create',
    priorityRangeHot: 40,
    priorityRangeWarmMin: 25,
    priorityRangeWarmMax: 39,
    priorityRangeColdMax: 24,
    status: 'Active',
    notes: ''
  })

  useEffect(() => {
    fetchScoringRules()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterLeadType])

  const fetchScoringRules = async () => {
    try {
      setLoading(true)
      const url = filterLeadType === 'all' 
        ? '/api/lead-scoring' 
        : `/api/lead-scoring?lead_type=${filterLeadType}`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setScoringRules(data.scoringRules || [])
      }
    } catch (error) {
      console.error('Error fetching scoring rules:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const payload = {
        scoring_criteria_name: formData.scoringCriteriaName,
        field_checked: formData.fieldChecked,
        condition_type: formData.conditionType,
        condition_value: formData.conditionValue,
        score_value: formData.scoreValue,
        lead_type: formData.leadType,
        automation_trigger: formData.automationTrigger,
        priority_range_hot: formData.priorityRangeHot,
        priority_range_warm_min: formData.priorityRangeWarmMin,
        priority_range_warm_max: formData.priorityRangeWarmMax,
        priority_range_cold_max: formData.priorityRangeColdMax,
        status: formData.status,
        notes: formData.notes,
        created_by: 'Admin'
      }

      const url = '/api/lead-scoring'
      const method = editingRule ? 'PUT' : 'POST'
      const body = editingRule ? { ...payload, id: editingRule.id } : payload

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        await fetchScoringRules()
        resetForm()
      } else {
        const error = await response.json()
        alert(`Failed to save scoring rule: ${error.details || error.error}`)
      }
    } catch (error) {
      console.error('Error saving scoring rule:', error)
      alert('Failed to save scoring rule')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (rule: ScoringRule) => {
    setEditingRule(rule)
    setFormData({
      scoringCriteriaName: rule.scoring_criteria_name,
      fieldChecked: rule.field_checked,
      conditionType: rule.condition_type,
      conditionValue: rule.condition_value || '',
      scoreValue: rule.score_value,
      leadType: rule.lead_type || 'Group',
      automationTrigger: rule.automation_trigger || 'On Lead Create',
      priorityRangeHot: rule.priority_range_hot,
      priorityRangeWarmMin: rule.priority_range_warm_min,
      priorityRangeWarmMax: rule.priority_range_warm_max,
      priorityRangeColdMax: rule.priority_range_cold_max,
      status: rule.status,
      notes: rule.notes || ''
    })
    setShowAddForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this scoring rule?')) return

    try {
      const response = await fetch(`/api/lead-scoring?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchScoringRules()
      } else {
        alert('Failed to delete scoring rule')
      }
    } catch (error) {
      console.error('Error deleting scoring rule:', error)
      alert('Failed to delete scoring rule')
    }
  }

  const resetForm = () => {
    setFormData({
      scoringCriteriaName: '',
      fieldChecked: 'budget',
      conditionType: 'greater_than_or_equal',
      conditionValue: '',
      scoreValue: 10,
      leadType: 'Group',
      automationTrigger: 'On Lead Create',
      priorityRangeHot: 40,
      priorityRangeWarmMin: 25,
      priorityRangeWarmMax: 39,
      priorityRangeColdMax: 24,
      status: 'Active',
      notes: ''
    })
    setEditingRule(null)
    setShowAddForm(false)
  }

  const filteredRules = scoringRules.filter(rule =>
    rule.scoring_criteria_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rule.field_checked.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const groupedRules = filteredRules.reduce((acc, rule) => {
    const type = rule.lead_type || 'General'
    if (!acc[type]) acc[type] = []
    acc[type].push(rule)
    return acc
  }, {} as Record<string, ScoringRule[]>)

  if (showAddForm) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={resetForm}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Scoring Rules
        </Button>

        <h2 className="text-2xl font-bold mb-6">
          {editingRule ? 'Edit Scoring Rule' : 'Add New Scoring Rule'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scoring Criteria Name *
              </label>
              <Input
                type="text"
                required
                value={formData.scoringCriteriaName}
                onChange={(e) => setFormData({...formData, scoringCriteriaName: e.target.value})}
                placeholder="e.g., High Budget Group Lead"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Field to Check *
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.fieldChecked}
                onChange={(e) => setFormData({...formData, fieldChecked: e.target.value})}
              >
                <option value="budget">Budget (Total)</option>
                <option value="budget_per_person">Budget Per Person</option>
                <option value="number_of_travelers">Number of Travelers (Pax)</option>
                <option value="travel_date">Travel Date / Month</option>
                <option value="destination">Destination</option>
                <option value="response_time_hours">Response Time (Hours)</option>
                <option value="itinerary_created_hours">Itinerary Created (Hours)</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="notes">Notes</option>
                <option value="source">Source</option>
                <option value="lead_type">Lead Type</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Condition Type *
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.conditionType}
                onChange={(e) => setFormData({...formData, conditionType: e.target.value})}
              >
                <option value="equals">Equals</option>
                <option value="not_equals">Not Equals</option>
                <option value="greater_than">Greater Than (&gt;)</option>
                <option value="greater_than_or_equal">Greater Than or Equal (≥)</option>
                <option value="less_than">Less Than (&lt;)</option>
                <option value="less_than_or_equal">Less Than or Equal (≤)</option>
                <option value="between">Between (min,max)</option>
                <option value="contains">Contains Text</option>
                <option value="not_contains">Not Contains</option>
                <option value="not_empty">Not Empty (Field has value)</option>
                <option value="is_empty">Is Empty</option>
                <option value="contains_comma">Contains Comma</option>
                <option value="within_days">Within X Days (from now)</option>
                <option value="matches_campaign">Matches Active Group Campaign</option>
                <option value="high_inquiry_fit">Part of High-Inquiry FIT List</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Condition Value
              </label>
              <Input
                type="text"
                value={formData.conditionValue}
                onChange={(e) => setFormData({...formData, conditionValue: e.target.value})}
                placeholder="e.g., 500000 or 5,9 for between"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty for &apos;not_empty&apos;, &apos;is_empty&apos;, or &apos;contains_comma&apos;
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Score Value *
              </label>
              <Input
                type="number"
                required
                value={formData.scoreValue}
                onChange={(e) => setFormData({...formData, scoreValue: parseInt(e.target.value) || 0})}
                placeholder="10"
                min="0"
                max="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lead Type
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.leadType}
                onChange={(e) => setFormData({...formData, leadType: e.target.value})}
              >
                <option value="Group">Group</option>
                <option value="FIT">FIT</option>
                <option value="Corporate">Corporate</option>
                <option value="">All Types</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Automation Trigger
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.automationTrigger}
                onChange={(e) => setFormData({...formData, automationTrigger: e.target.value})}
              >
                <option value="On Lead Create">On Lead Create</option>
                <option value="On Lead Update">On Lead Update</option>
                <option value="Both">Both</option>
              </select>
            </div>
          </div>

          {/* Priority Ranges */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-3">Priority Ranges</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hot (≥)
                </label>
                <Input
                  type="number"
                  value={formData.priorityRangeHot}
                  onChange={(e) => setFormData({...formData, priorityRangeHot: parseInt(e.target.value) || 40})}
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Warm Min
                </label>
                <Input
                  type="number"
                  value={formData.priorityRangeWarmMin}
                  onChange={(e) => setFormData({...formData, priorityRangeWarmMin: parseInt(e.target.value) || 25})}
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Warm Max
                </label>
                <Input
                  type="number"
                  value={formData.priorityRangeWarmMax}
                  onChange={(e) => setFormData({...formData, priorityRangeWarmMax: parseInt(e.target.value) || 39})}
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cold (≤)
                </label>
                <Input
                  type="number"
                  value={formData.priorityRangeColdMax}
                  onChange={(e) => setFormData({...formData, priorityRangeColdMax: parseInt(e.target.value) || 24})}
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Additional Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Admin or developer remarks"
              />
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
              {saving ? 'Saving...' : (editingRule ? 'Update Rule' : 'Create Rule')}
            </Button>
          </div>
        </form>
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
              <Target className="mr-2 h-6 w-6" />
              Lead Scoring Master
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Automate lead prioritization with scoring rules (Hot ≥40, Warm 25-39, Cold &lt;25)
            </p>
          </div>
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Scoring Rule
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search scoring rules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filterLeadType}
          onChange={(e) => setFilterLeadType(e.target.value)}
        >
          <option value="all">All Lead Types</option>
          <option value="Group">Group</option>
          <option value="FIT">FIT</option>
          <option value="Corporate">Corporate</option>
        </select>
      </div>

      {/* Scoring Rules by Lead Type */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading scoring rules...</p>
        </div>
      ) : Object.keys(groupedRules).length === 0 ? (
        <div className="text-center py-12">
          <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">No scoring rules found. Add your first rule!</p>
        </div>
      ) : (
        Object.entries(groupedRules).map(([leadType, rules]) => (
          <div key={leadType} className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              {leadType} Lead Scoring Rules
              <Badge className="ml-3" variant="secondary">{rules.length} rules</Badge>
            </h2>

            <div className="grid gap-4">
              {rules.map((rule) => (
                <Card key={rule.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {rule.scoring_criteria_name}
                          </h3>
                          <Badge 
                            variant={rule.status === 'Active' ? 'default' : 'secondary'}
                            className={rule.status === 'Active' ? 'bg-green-500' : 'bg-gray-400'}
                          >
                            {rule.status}
                          </Badge>
                          <Badge variant="outline" className="bg-purple-50">
                            +{rule.score_value} points
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Field:</span> {rule.field_checked}
                          </div>
                          <div>
                            <span className="font-medium">Condition:</span> {rule.condition_type}
                            {rule.condition_value && ` (${rule.condition_value})`}
                          </div>
                          <div>
                            <span className="font-medium">Trigger:</span> {rule.automation_trigger}
                          </div>
                        </div>

                        {rule.notes && (
                          <p className="text-sm text-gray-500 mt-2 italic">
                            {rule.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(rule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(rule.id)}
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
          </div>
        ))
      )}
    </div>
  )
}

export default LeadScoringMaster

