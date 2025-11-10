import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'

interface Payment {
  id: number
  query_id: string
  trans_id: string
  type: string
  amount: number
  payment_date: string
  status: string
  convenience_fee: number
}

interface ConfirmedProposal {
  id: number
  name: string
  price: number
  confirmed_at: string
}

interface BillingProps {
  queryId: number
  queryData?: {
    name?: string
    email?: string
    phone?: string
    destination?: string
  }
}

const Billing: React.FC<BillingProps> = ({ queryId, queryData }) => {
  const [payments, setPayments] = useState<Payment[]>([])
  const [confirmedProposals, setConfirmedProposals] = useState<ConfirmedProposal[]>([])
  const [loading, setLoading] = useState(false)
  const [isPlanOpen, setIsPlanOpen] = useState(false)
  const [planAmount, setPlanAmount] = useState<string>('')
  const [planDate, setPlanDate] = useState<string>('')
  const [planStatus, setPlanStatus] = useState<'Scheduled' | 'Paid'>('Scheduled')
  const [planRemark, setPlanRemark] = useState<string>('')
  const [planType, setPlanType] = useState<string>('Cash')
  const [planReceipt, setPlanReceipt] = useState<File | null>(null)
  const [editingPaymentId, setEditingPaymentId] = useState<number | null>(null)
  const [invoiceGenerated, setInvoiceGenerated] = useState(false)
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false)
  
  // Lock body scroll when invoice modal open
  useEffect(() => {
    if (isInvoiceOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [isInvoiceOpen])
  
  // Summary calculations
  const confirmedProposalsAmount = confirmedProposals.reduce((sum, p) => sum + parseFloat(p.price.toString()), 0)
  const scheduledOrPaidAmount = payments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0)
  // Tiles should reflect only confirmed package value; payments just split it into scheduled/paid
  const totalAmount = confirmedProposalsAmount
  
  // Debug logging
  console.log('🧮 Summary calculations:', {
    confirmedProposals: confirmedProposals,
    confirmedProposalsAmount,
    payments: payments,
    scheduledOrPaidAmount,
    totalAmount
  })
  
  const receivedAmount = payments
    .filter(p => p.status === 'Paid')
    .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0)
  const pendingAmount = Math.max(totalAmount - receivedAmount, 0)
  const grossProfit = totalAmount * 0.1 // 10% of total amount as example
  const supplierAmount = totalAmount - grossProfit
  const supplierReceived = 0 // Placeholder
  const supplierPending = supplierAmount - supplierReceived
  // Not Scheduled = Confirmed - (Scheduled + Paid)
  const notScheduledAmount = Math.max(confirmedProposalsAmount - scheduledOrPaidAmount, 0)

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/query-payments?queryId=${queryId}`)
      const data = await response.json()
      
      if (response.ok) {
        setPayments(data.payments || [])
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }, [queryId])

  const fetchConfirmedProposals = useCallback(async () => {
    try {
      console.log('🔍 Fetching confirmed proposals for queryId:', queryId)
      const response = await fetch(`/api/confirmed-proposals?queryId=${queryId}`)
      const data = await response.json()
      
      console.log('📡 API Response:', data)
      
      if (response.ok) {
        console.log('📊 Confirmed proposals fetched:', data.confirmedProposals)
        console.log('💰 Total confirmed amount:', data.totalAmount)
        setConfirmedProposals(data.confirmedProposals || [])
      } else {
        console.error('Error fetching confirmed proposals:', data.error)
      }
    } catch (error) {
      console.error('Error fetching confirmed proposals:', error)
    }
  }, [queryId])

  useEffect(() => {
    fetchPayments()
    fetchConfirmedProposals()
  }, [fetchPayments, fetchConfirmedProposals])

  // Persist invoice generation per query and amount
  useEffect(() => {
    const key = `invoice_generated_${queryId}_${Math.round(confirmedProposalsAmount)}`
    try {
      const val = localStorage.getItem(key)
      setInvoiceGenerated(val === '1')
    } catch {}
  }, [queryId, confirmedProposalsAmount])

  const handleDeletePayment = async (id: number) => {
    if (!confirm('Are you sure you want to delete this payment?')) {
      return
    }

    try {
      const response = await fetch(`/api/query-payments?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchPayments()
      } else {
        alert('Failed to delete payment')
      }
    } catch (error) {
      console.error('Error deleting payment:', error)
      alert('Error deleting payment')
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const hours = date.getHours()
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const displayHours = String((hours % 12) || 12).padStart(2, '0')
    return `${day}/${month}/${year} - ${displayHours}:${minutes} ${ampm}`
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-7 gap-3">
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-sm">
          <CardContent className="p-3">
            <div className="text-lg font-bold text-center">₹{totalAmount.toLocaleString()}</div>
            <div className="text-xs opacity-90 mt-1 text-center">TOTAL AMOUNT</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-sm">
          <CardContent className="p-3">
            <div className="text-lg font-bold text-center">₹{receivedAmount.toLocaleString()}</div>
            <div className="text-xs opacity-90 mt-1 text-center">RECEIVED</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white shadow-sm">
          <CardContent className="p-3">
            <div className="text-lg font-bold text-center">₹{pendingAmount.toLocaleString()}</div>
            <div className="text-xs opacity-90 mt-1 text-center">PENDING</div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-3">
            <div className="text-lg font-bold text-gray-900 text-center">₹{grossProfit.toFixed(0)}</div>
            <div className="text-xs text-gray-600 mt-1 text-center">GROSS PROFIT</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-sm">
          <CardContent className="p-3">
            <div className="text-lg font-bold text-center">₹{supplierAmount.toLocaleString()}</div>
            <div className="text-xs opacity-90 mt-1 text-center">SUPPLIER AMOUNT</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-sm">
          <CardContent className="p-3">
            <div className="text-lg font-bold text-center">₹{supplierReceived.toLocaleString()}</div>
            <div className="text-xs opacity-90 mt-1 text-center">SUPPLIER RECEIVED</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-sm">
          <CardContent className="p-3">
            <div className="text-lg font-bold text-center">₹{supplierPending.toLocaleString()}</div>
            <div className="text-xs opacity-90 mt-1 text-center">SUPPLIER PENDING</div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Payments ({payments.length})
            </h3>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Send Payment Plan To Mail
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Payment ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Trans. ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Payment Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Convenience Fee</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Receipt</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="bg-green-50">
                      <td className="px-4 py-3 text-gray-900">{payment.id || '-'}</td>
                      <td className="px-4 py-3 text-gray-900">{payment.trans_id || '-'}</td>
                      <td className="px-4 py-3">
                        <Badge className="bg-blue-600 text-white">
                          {payment.type || '-'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-900 font-medium">₹{parseFloat(payment.amount.toString()).toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-900">{formatDate(payment.payment_date)}</td>
                      <td className="px-4 py-3">
                        {(() => {
                          const today = new Date()
                          const payDate = payment.payment_date ? new Date(payment.payment_date) : null
                          const isOverdue = payment.status !== 'Paid' && payDate && payDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())
                          const label = payment.status === 'Paid' ? 'Paid' : (isOverdue ? 'Overdue' : 'Scheduled')
                          const color = payment.status === 'Paid' ? 'bg-green-500' : (isOverdue ? 'bg-red-500' : 'bg-yellow-500')
                          return (
                            <Badge className={`${color} text-white`}>
                              {label}
                            </Badge>
                          )
                        })()}
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        <input
                          type="number"
                          defaultValue={payment.convenience_fee || 0}
                          className="w-20 border rounded px-2 py-1 text-sm"
                          readOnly
                        />
                      </td>
                      <td className="px-4 py-3 text-gray-900">-</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded">Send Link</button>
                          <button
                            onClick={() => handleDeletePayment(payment.id)}
                            className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => {
                              setEditingPaymentId(payment.id)
                              setPlanAmount(String(payment.amount))
                              // expecting yyyy-mm-dd for input date
                              const d = payment.payment_date ? new Date(payment.payment_date) : new Date()
                              const yyyy = d.getFullYear()
                              const mm = String(d.getMonth() + 1).padStart(2, '0')
                              const dd = String(d.getDate()).padStart(2, '0')
                              setPlanDate(`${yyyy}-${mm}-${dd}`)
                              setPlanStatus((payment.status as 'Scheduled' | 'Paid') || 'Scheduled')
                              setPlanType(payment.type || 'Cash')
                              setPlanRemark('')
                              setIsPlanOpen(true)
                            }}
                            className="px-3 py-1 bg-gray-600 text-white text-xs rounded"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {/* Not Scheduled Amount Row (always show when there is any amount to collect) */}
                  {totalAmount > 0 && (
                    <tr className="bg-white">
                      <td colSpan={8} className="px-4 py-3 text-sm font-medium text-gray-900">
                        Not Scheduled Amount: ₹{notScheduledAmount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            // If a scheduled payment exists, open in edit mode
                            const existing = payments.find(p => (p.status || '').toLowerCase() === 'scheduled')
                            if (existing) {
                              setEditingPaymentId(existing.id)
                              setPlanAmount(String(existing.amount))
                              const d = existing.payment_date ? new Date(existing.payment_date) : new Date()
                              const yyyy = d.getFullYear()
                              const mm = String(d.getMonth() + 1).padStart(2, '0')
                              const dd = String(d.getDate()).padStart(2, '0')
                              setPlanDate(`${yyyy}-${mm}-${dd}`)
                              setPlanStatus('Scheduled')
                              setPlanType(existing.type || 'Cash')
                              setPlanRemark('')
                              setIsPlanOpen(true)
                              return
                            }
                            // Otherwise, create a new schedule prefilled with pending amount
                            setEditingPaymentId(null)
                            setPlanAmount(String(Math.max(pendingAmount, 0)))
                            const today = new Date()
                            const yyyy = today.getFullYear()
                            const mm = String(today.getMonth() + 1).padStart(2, '0')
                            const dd = String(today.getDate()).padStart(2, '0')
                            setPlanDate(`${yyyy}-${mm}-${dd}`)
                            setPlanStatus('Scheduled')
                            setPlanType('Cash')
                            setPlanRemark('')
                            setIsPlanOpen(true)
                          }}
                          className="px-3 py-1 bg-pink-500 text-white text-xs rounded hover:bg-pink-600"
                        >
                          Schedule Payment
                        </button>
                      </td>
                    </tr>
                  )}

                  {payments.length === 0 && confirmedProposals.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-6 text-center text-gray-500">
                        No payments or confirmed proposals yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Section */}
      {!invoiceGenerated ? (
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900">Invoice</div>
              <Button onClick={() => {
                setInvoiceGenerated(true)
                try {
                  const key = `invoice_generated_${queryId}_${Math.round(confirmedProposalsAmount)}`
                  localStorage.setItem(key, '1')
                } catch {}
              }} className="bg-blue-600 hover:bg-blue-700 text-white">Generate Invoice</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Invoice - {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  <div className="text-sm text-gray-600">GI/24-25/001</div>
                </div>
              </div>
              <Button onClick={() => setIsInvoiceOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">View Invoice</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Payment Plan Modal */}
      {isPlanOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsPlanOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[85vh] overflow-y-auto">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <div className="text-lg font-semibold text-gray-900">Create Payment Plan</div>
              <button onClick={() => setIsPlanOpen(false)} className="text-gray-500 hover:text-gray-700">×</button>
            </div>
            <div className="px-5 py-3 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount*</label>
                <input
                  type="number"
                  value={planAmount}
                  onChange={(e) => setPlanAmount(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date*</label>
                <input
                  type="date"
                  value={planDate}
                  onChange={(e) => setPlanDate(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status*</label>
                <select
                  value={planStatus}
                  onChange={(e) => setPlanStatus(e.target.value as 'Scheduled' | 'Paid')}
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
              {planStatus === 'Paid' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type*</label>
                    <select
                      value={planType}
                      onChange={(e) => setPlanType(e.target.value)}
                      className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                      <option value="NEFT">NEFT</option>
                      <option value="Mobile Payment">Mobile Payment</option>
                      <option value="Payzapp">Payzapp</option>
                      <option value="Razorpay">Razorpay</option>
                      <option value="Paypal">Paypal</option>
                      <option value="Payu">Payu</option>
                      <option value="UPI">UPI</option>
                      <option value="IMPS">IMPS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Receipt</label>
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.pdf"
                      onChange={(e) => setPlanReceipt(e.target.files?.[0] || null)}
                      className="w-full border rounded px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-gray-200 file:text-gray-800 file:px-3 file:py-1"
                    />
                    <div className="text-xs text-gray-500 mt-1">Allowed types: PNG, JPG, JPEG, PDF</div>
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remark</label>
                <textarea
                  value={planRemark}
                  onChange={(e) => setPlanRemark(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm h-16 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t flex justify-end">
              <button
                onClick={async () => {
                  try {
                    // If Paid and a file selected, upload first to get URL
                    let receiptUrl: string | undefined
                    if (planStatus === 'Paid' && planReceipt) {
                      const fd = new FormData()
                      fd.append('file', planReceipt)
                      fd.append('path', 'receipts/query-payments')
                      const up = await fetch('/api/upload', { method: 'POST', body: fd })
                      const upJson = await up.json().catch(() => ({}))
                      if (up.ok && upJson?.url) {
                        receiptUrl = upJson.url as string
                      } else {
                        alert(upJson?.error || 'Failed to upload receipt')
                        return
                      }
                    }

                    const payload = editingPaymentId
                      ? {
                          id: editingPaymentId,
                          amount: Number(planAmount || 0),
                          paymentDate: planDate,
                          status: planStatus,
                          type: planStatus === 'Paid' ? planType : undefined,
                          receiptUrl,
                          remark: planRemark || undefined,
                        }
                      : {
                          queryId: String(queryId),
                          amount: Number(planAmount || 0),
                          paymentDate: planDate,
                          status: planStatus,
                          type: planStatus === 'Paid' ? planType : undefined,
                          transId: undefined,
                          convenienceFee: 0,
                          receiptUrl,
                          remark: planRemark || undefined,
                        }
                    const res = await fetch('/api/query-payments', {
                      method: editingPaymentId ? 'PUT' : 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload)
                    })
                    if (res.ok) {
                      setIsPlanOpen(false)
                      setEditingPaymentId(null)
                      fetchPayments()
                    } else {
                      const err = await res.json().catch(() => ({}))
                      alert(err?.error || 'Failed to save payment plan')
                    }
                  } catch (e) {
                    console.error(e)
                    alert('Failed to save payment plan')
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Full Preview Modal (embedded) */}
      {isInvoiceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsInvoiceOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] mx-4 overflow-hidden flex flex-col">
            <div className="px-5 py-3 border-b flex items-center justify-between shrink-0">
              <div className="text-lg font-semibold text-gray-900">View Invoice</div>
              <button onClick={() => setIsInvoiceOpen(false)} className="text-gray-500 hover:text-gray-700">×</button>
            </div>
            <iframe title="invoice" src={`/invoices/${queryId}`} className="w-full flex-1 border-0"></iframe>
          </div>
        </div>
      )}
    </div>
  )
}

export default Billing
