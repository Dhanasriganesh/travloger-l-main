import React, { useState, useEffect, useCallback } from 'react'


type SectionType = 'leads' | 'payments' | 'bookings'
type LocationType = 'all' | 'Kashmir' | 'Ladakh' | 'Kerala' | 'Gokarna' | 'Meghalaya' | 'Mysore' | 'Singapore' | 'Hyderabad' | 'Bengaluru' | 'Manali'

const Reports: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<LocationType>('all')
  const [selectedSection, setSelectedSection] = useState<SectionType>('leads')
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [reportData, setReportData] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [generatingReport, setGeneratingReport] = useState<boolean>(false)


  // Fetch report data based on selections
  const fetchReportData = useCallback(async () => {
    setLoading(true)
    try {
      let apiEndpoint = ''
      let queryParams = new URLSearchParams()

      // Add location filter (only for API calls)
      if (selectedLocation !== 'all') {
        queryParams.append('destination', selectedLocation)
      }

      // Determine API endpoint based on section
      switch (selectedSection) {
        case 'leads':
          apiEndpoint = '/api/leads'
          break
        case 'payments':
          apiEndpoint = '/api/bookings' // Payments are part of bookings
          break
        case 'bookings':
          apiEndpoint = '/api/bookings'
          break
        default:
          apiEndpoint = '/api/leads'
      }

      const response = await fetch(`${apiEndpoint}?${queryParams.toString()}`)
      const data = await response.json()

      if (response.ok) {
        let rawData = data[selectedSection] || data.bookings || data.leads || []
        
        // Apply client-side filtering for month and year
        let filteredData = rawData

        // Filter by location (if not already filtered by API)
        if (selectedLocation !== 'all') {
          filteredData = filteredData.filter((item: any) => {
            return item.destination === selectedLocation
          })
        }

        // Filter by month
        if (selectedMonth !== 'all') {
          filteredData = filteredData.filter((item: any) => {
            const itemDate = new Date(item.created_at || item.booking_date || item.payment_date)
            const itemMonth = (itemDate.getMonth() + 1).toString()
            return itemMonth === selectedMonth
          })
        }

        // Filter by year
        if (selectedYear !== 'all') {
          filteredData = filteredData.filter((item: any) => {
            const itemDate = new Date(item.created_at || item.booking_date || item.payment_date)
            const itemYear = itemDate.getFullYear().toString()
            return itemYear === selectedYear
          })
        }

        // Debug logging
        console.log('Raw data count:', rawData.length)
        console.log('Filtered data count:', filteredData.length)
        console.log('Selected filters:', { selectedLocation, selectedMonth, selectedYear })
        if (rawData.length > 0) {
          console.log('Sample raw data date:', new Date(rawData[0].created_at || rawData[0].booking_date || rawData[0].payment_date))
        }

        setReportData(filteredData)
      } else {
        console.error('Failed to fetch report data:', data.error)
        setReportData([])
      }
    } catch (error) {
      console.error('Error fetching report data:', error)
      setReportData([])
    } finally {
      setLoading(false)
    }
  }, [selectedLocation, selectedSection, selectedMonth, selectedYear])

  // Generate and download Excel report
  const downloadExcelReport = async () => {
    setGeneratingReport(true)
    try {
      // Create Excel data based on selected section
      let excelData: any[] = []
      let headers: string[] = []

      switch (selectedSection) {
        case 'leads':
          headers = ['ID', 'Name', 'Email', 'Phone', 'Source', 'Destination', 'Travelers', 'Travel Dates', 'Notes', 'Created Date']
          excelData = reportData.map((lead: any) => [
            lead.id,
            lead.name || 'N/A',
            lead.email || 'N/A',
            lead.phone || 'N/A',
            lead.source || 'N/A',
            lead.destination || 'N/A',
            lead.number_of_travelers || 'N/A',
            lead.travel_dates || 'N/A',
            lead.custom_notes || 'N/A',
            new Date(lead.created_at).toLocaleDateString()
          ])
          break

        case 'payments':
          headers = ['ID', 'Customer', 'Package', 'Amount', 'Payment Status', 'Payment Method', 'Payment Date', 'Due Date', 'Transaction ID', 'Assigned Employee', 'Employee Mobile']
          excelData = reportData.map((payment: any) => [
            payment.id,
            payment.customer || 'N/A',
            payment.package || 'N/A',
            payment.amount || 0,
            payment.payment_status || payment.paymentStatus || 'N/A',
            payment.payment_method || payment.paymentMethod || 'N/A',
            payment.payment_date || payment.paymentDate || 'N/A',
            payment.due_date || payment.dueDate || 'N/A',
            payment.transaction_id || payment.transactionId || 'N/A',
            payment.assigned_employee_name || payment.assignedEmployeeName || 'N/A',
            payment.assigned_employee_mobile || payment.assignedEmployeeMobile || 'N/A'
          ])
          break

        case 'bookings':
          headers = ['ID', 'Customer', 'Package', 'Destination', 'Amount', 'Status', 'Travelers', 'Travel Date', 'Booking Date']
          excelData = reportData.map((booking: any) => [
            booking.id,
            booking.customer || 'N/A',
            booking.package || 'N/A',
            booking.destination || 'N/A',
            booking.amount || 0,
            booking.status || 'N/A',
            booking.travelers || 'N/A',
            booking.travel_date || 'N/A',
            new Date(booking.booking_date || booking.created_at).toLocaleDateString()
          ])
          break
      }

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...excelData.map(row => row.map((cell: any) => `"${cell}"`).join(','))
      ].join('\n')

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      
      // Generate filename based on selections
      const locationStr = selectedLocation === 'all' ? 'All-Locations' : selectedLocation
      const monthStr = selectedMonth === 'all' ? 'All-Months' : selectedMonth
      const yearStr = selectedYear === 'all' ? 'All-Years' : selectedYear
      const filename = `${selectedSection.toUpperCase()}-Report-${locationStr}-${monthStr}-${yearStr}-${new Date().toISOString().split('T')[0]}.csv`
      
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      alert(`Report downloaded successfully: ${filename}`)
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Failed to generate report. Please try again.')
    } finally {
      setGeneratingReport(false)
    }
  }

  // Fetch data when selections change
  useEffect(() => {
    if (selectedLocation && selectedSection && selectedMonth && selectedYear) {
      fetchReportData()
    }
  }, [selectedLocation, selectedSection, selectedMonth, selectedYear, fetchReportData])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Generate detailed reports based on location, section, and time period</p>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={downloadExcelReport}
            disabled={generatingReport || reportData.length === 0}
            className="bg-gray-600 text-white px-3 py-1.5 rounded-md hover:bg-gray-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {generatingReport ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Download Excel</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Report Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Location Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value as LocationType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Locations</option>
              <option value="Kashmir">Kashmir</option>
              <option value="Ladakh">Ladakh</option>
              <option value="Kerala">Kerala</option>
              <option value="Gokarna">Gokarna</option>
              <option value="Meghalaya">Meghalaya</option>
              <option value="Mysore">Mysore</option>
              <option value="Singapore">Singapore</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Manali">Manali</option>
            </select>
                </div>

          {/* Section Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value as SectionType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="leads">Leads</option>
              <option value="payments">Payments</option>
              <option value="bookings">Bookings</option>
            </select>
          </div>

          {/* Month Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Months</option>
              <option value="1">January</option>
              <option value="2">February</option>
              <option value="3">March</option>
              <option value="4">April</option>
              <option value="5">May</option>
              <option value="6">June</option>
              <option value="7">July</option>
              <option value="8">August</option>
              <option value="9">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
        </div>

          {/* Year Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Years</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
              <option value="2020">2020</option>
            </select>
          </div>
        </div>

        {/* Report Summary */}
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Report Summary:</span> {selectedSection.toUpperCase()} data for {selectedLocation === 'all' ? 'All Locations' : selectedLocation} 
              {selectedMonth !== 'all' && ` in ${new Date(0, parseInt(selectedMonth) - 1).toLocaleString('default', { month: 'long' })}`}
              {selectedYear !== 'all' && ` ${selectedYear}`}
                </div>
            <div className="text-sm font-medium text-gray-900">
              {loading ? 'Loading...' : `${reportData.length} records found`}
            </div>
          </div>
          {!loading && reportData.length === 0 && (
            <div className="mt-2 text-sm text-amber-600">
              ⚠️ No data found for the selected filters. Try adjusting your location, month, or year selection.
            </div>
          )}
        </div>
      </div>

      {/* Data Preview */}
      {reportData.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Data Preview</h3>
            <p className="text-sm text-gray-600">Preview of {reportData.length} records that will be included in the Excel report</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                  {selectedSection === 'leads' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    </>
                  )}
                  {selectedSection === 'payments' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Employee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Mobile</th>
                    </>
                  )}
                  {selectedSection === 'bookings' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Package</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </>
                  )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {reportData.slice(0, 10).map((item: any, index: number) => (
                <tr key={index}>
                    {selectedSection === 'leads' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.email || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.phone || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.source || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.destination || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(item.created_at).toLocaleDateString()}</td>
                      </>
                    )}
                    {selectedSection === 'payments' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.customer || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{item.amount || 0}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.payment_status || item.paymentStatus || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.payment_method || item.paymentMethod || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(item.payment_date || item.paymentDate || item.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.assigned_employee_name || item.assignedEmployeeName || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.assigned_employee_mobile || item.assignedEmployeeMobile || 'N/A'}</td>
                      </>
                    )}
                    {selectedSection === 'bookings' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.customer || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.package || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.destination || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{item.amount || 0}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.status || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(item.booking_date || item.created_at).toLocaleDateString()}</td>
                      </>
                    )}
                </tr>
              ))}
            </tbody>
          </table>
            {reportData.length > 10 && (
              <div className="px-6 py-3 bg-gray-50 text-sm text-gray-600">
                Showing first 10 of {reportData.length} records. All records will be included in the Excel download.
              </div>
            )}
          </div>
        </div>
      )}




    </div>
  )
}

export default Reports
