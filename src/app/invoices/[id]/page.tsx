import React from 'react'
import { headers } from 'next/headers'
import PrintButtons from '../components/PrintButtons'

async function fetchJSON(url: string) {
  const res = await fetch(url, { next: { revalidate: 0 } })
  if (!res.ok) return null
  return res.json()
}

export default async function InvoicePage({ params }: { params: { id: string } }) {
  const queryId = params.id
  const hdr = await headers()
  const host = hdr.get('host') || ''
  const proto = hdr.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https')
  const base = `${proto}://${host}`

  // Fetch lead/query info (best-effort)
  let lead = null
  try { lead = await fetchJSON(`${base}/api/leads/${queryId}`) } catch {}
  // Fetch confirmed proposals amount
  const confirmed = await fetchJSON(`${base}/api/confirmed-proposals?queryId=${queryId}`)
  const confirmedAmount = confirmed?.totalAmount || 0

  // Convert amount to Indian Rupees words
  function amountToWords(num: number): string {
    const a = [ '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen' ]
    const b = [ '', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety' ]
    function twoDigits(n: number): string {
      if (n < 20) return a[n]
      const tens = Math.floor(n / 10)
      const ones = n % 10
      return b[tens] + (ones ? ' ' + a[ones] : '')
    }
    function threeDigits(n: number): string {
      const hundred = Math.floor(n / 100)
      const rest = n % 100
      return (hundred ? a[hundred] + ' hundred' + (rest ? ' ' : '') : '') + (rest ? twoDigits(rest) : '')
    }
    if (num === 0) return 'zero'
    const parts: string[] = []
    const crore = Math.floor(num / 10000000)
    num %= 10000000
    const lakh = Math.floor(num / 100000)
    num %= 100000
    const thousand = Math.floor(num / 1000)
    num %= 1000
    const hundred = Math.floor(num)
    if (crore) parts.push(threeDigits(crore) + ' crore')
    if (lakh) parts.push(threeDigits(lakh) + ' lakh')
    if (thousand) parts.push(threeDigits(thousand) + ' thousand')
    if (hundred) parts.push(threeDigits(hundred))
    return parts.join(' ').trim()
  }
  const integerAmount = Math.round(confirmedAmount)
  const amountWords = amountToWords(integerAmount).replace(/\b\w/g, c => c.toUpperCase())

  return (
    <div className="min-h-screen bg-white text-gray-900 print:bg-white">
      <div className="max-w-5xl mx-auto py-6 px-8 print:py-0 print:px-4 print:mx-0">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="text-2xl font-extrabold text-gray-900">Travloger</div>
            <div className="mt-2 text-base">1-3-38, Nallakunta, Hyderabad, 500044, Telangana,</div>
            <div className="text-base">Phone no.: 9391203737</div>
            <div className="text-base">Email: gajanan@travloger.in</div>
            <div className="text-base">GSTIN: 36AAWFD8280H1ZS</div>
            <div className="text-base">State: -Hyderabad</div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-semibold tracking-wide text-gray-600">travloger.in</div>
            <div className="text-xs text-gray-500 mt-2">~You travel, We capture</div>
          </div>
        </div>
        <div className="mt-4 border-b-4 border-gray-300" />

        {/* Title */}
        <div className="text-center font-extrabold text-3xl mt-6 mb-8">Proforma Invoice</div>

        <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
          <div>
            <div className="font-bold mb-2">Bill To</div>
            <div>Mr. {lead?.lead?.name || '-'}</div>
            <div>Contact No.: {lead?.lead?.phone || '-'}</div>
            <div>State: {lead?.lead?.state || '-'}</div>
          </div>
          <div className="text-right">
            <div className="font-bold mb-2">Invoice Details</div>
            <div>Date: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
            <div>Place of supply: -Hyderabad</div>
            <div>Invoice No: MT/25-26/4</div>
            <div>Sales Person: NA</div>
            <div>Tour Start Date: -</div>
            <div>Tour End Date: -</div>
          </div>
        </div>

        <table className="w-full mb-6 text-base border border-gray-300">
          <thead className="bg-[#2f3846] text-white">
            <tr>
              <th className="p-2 border border-gray-600 text-center" style={{width: '3%'}}>#</th>
              <th className="p-2 border border-gray-600 text-left" style={{width: '25%'}}>Item Name</th>
              <th className="p-2 border border-gray-600 text-center" style={{width: '12%'}}>HSN/SAC</th>
              <th className="p-2 border border-gray-600 text-center" style={{width: '10%'}}>Quantity</th>
              <th className="p-2 border border-gray-600 text-right" style={{width: '12%'}}>Price/Unit</th>
              <th className="p-2 border border-gray-600 text-center" style={{width: '12%'}}>GST</th>
              <th className="p-2 border border-gray-600 text-center" style={{width: '12%'}}>TCS</th>
              <th className="p-2 border border-gray-600 text-right" style={{width: '14%'}}>Amount</th>
            </tr>
          </thead>
          <tbody className="bg-white text-base">
            <tr>
              <td className="p-2 border border-gray-300 text-center">1.</td>
              <td className="p-2 border border-gray-300">Temp</td>
              <td className="p-2 border border-gray-300 text-center">&nbsp;</td>
              <td className="p-2 border border-gray-300 text-center">1</td>
              <td className="p-2 border border-gray-300 text-right">₹{confirmedAmount.toLocaleString()}</td>
              <td className="p-2 border border-gray-300 text-center">₹0 (18%)</td>
              <td className="p-2 border border-gray-300 text-center">₹0 (0%)</td>
              <td className="p-2 border border-gray-300 text-right">₹{confirmedAmount.toLocaleString()}</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="p-2 border border-gray-300 font-semibold" colSpan={5}>Total</td>
              <td className="p-2 border border-gray-300 text-center font-semibold">₹0</td>
              <td className="p-2 border border-gray-300 text-center font-semibold">₹0</td>
              <td className="p-2 border border-gray-300 text-right font-semibold">₹{confirmedAmount.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <div className="font-bold text-xl mb-2">Invoice Amount In Words</div>
        <div className="mb-8 text-lg">{amountWords} Rupees Only</div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <div className="font-bold mb-6 mt-32">Pay To:</div>
            <div className="text-sm">
              <div>Bank Name: HDFC BANK</div>
              <div>Bank Account No. : 50200070247064</div>
              <div>Bank IFSC code: HDFC0001997</div>
              <div>Account holder&apos;s name: TRAVLOGER</div>
            </div>
          </div>
          <div className="text-base space-y-3">
            <div className="flex justify-between"><span>Sub Total</span><span>₹{confirmedAmount.toLocaleString()}</span></div>
            <div className="flex justify-between"><span>CGST@9%</span><span>₹0</span></div>
            <div className="flex justify-between"><span>SGST@9%</span><span>₹0</span></div>
            <div className="flex justify-between font-bold bg-[#2f3846] text-white px-3 py-2 mt-3">
              <span>Total</span>
              <span>₹{confirmedAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between"><span>Received</span><span>₹0</span></div>
            <div className="flex justify-between"><span>Balance</span><span>₹{confirmedAmount.toLocaleString()}</span></div>
            <div className="pt-12 text-right font-medium">For : Travloger</div>
          </div>
        </div>

        <div className="mt-32 text-right text-base font-semibold">Authorized Signatory</div>
        <PrintButtons />
      </div>
    </div>
  )
}


