import React, { useState, useEffect } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Card, CardContent } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Plus, Search, Edit, Trash2, ArrowLeft, Truck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface VehicleDriver {
  id: number
  vehicle_name: string
  registration_number: string
  vehicle_type: string
  supplier_name: string
  driver_name: string
  driver_contact: string
  license_expiry?: string | null
  rc_expiry?: string | null
  availability_status: string
  notes?: string
  status: string
  created_by: string
  date: string
}

const VehicleDriver: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [vehicles, setVehicles] = useState<VehicleDriver[]>([])
  const [vehicleTypes, setVehicleTypes] = useState<{ id: number; vehicle_type: string }[]>([])
  const [suppliers, setSuppliers] = useState<{ id: number; company_name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<VehicleDriver | null>(null)
  
  const [formData, setFormData] = useState({
    vehicleName: '',
    registrationNumber: '',
    vehicleType: '',
    supplierName: '',
    driverName: '',
    driverContact: '',
    licenseExpiry: '',
    rcExpiry: '',
    availabilityStatus: 'Available',
    notes: '',
    status: 'Active'
  })

  useEffect(() => {
    fetchVehicleDrivers()
    fetchMasters()
  }, [])

  const fetchMasters = async () => {
    try {
      // Fetch vehicle types
      const vehicleTypesRes = await fetch('/api/vehicle-types')
      if (vehicleTypesRes.ok) {
        const vehicleTypesData = await vehicleTypesRes.json()
        setVehicleTypes(vehicleTypesData.vehicleTypes || [])
      }

      // Fetch suppliers
      const suppliersRes = await fetch('/api/suppliers')
      if (suppliersRes.ok) {
        const suppliersData = await suppliersRes.json()
        setSuppliers(suppliersData.suppliers || [])
      }
    } catch (error) {
      console.error('Error fetching masters:', error)
    }
  }

  const fetchVehicleDrivers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/vehicle-drivers')
      const data = await response.json()
      
      if (response.ok) {
        setVehicles(data.vehicleDrivers || [])
      } else {
        console.error('Failed to fetch vehicle drivers:', data.error)
      }
    } catch (error) {
      console.error('Error fetching vehicle drivers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveVehicle = async () => {
    if (!formData.vehicleName.trim() && !formData.registrationNumber.trim()) {
      alert('Please enter vehicle name or registration number')
      return
    }
    if (!formData.vehicleType) {
      alert('Please select a vehicle type')
      return
    }
    if (!formData.supplierName.trim()) {
      alert('Please enter supplier name')
      return
    }
    if (!formData.driverName.trim()) {
      alert('Please enter driver name')
      return
    }
    if (!formData.driverContact.trim()) {
      alert('Please enter driver contact')
      return
    }

    try {
      setSaving(true)
      const method = editingVehicle ? 'PUT' : 'POST'
      const body = {
        ...(editingVehicle ? { id: editingVehicle.id } : {}),
        vehicleName: formData.vehicleName.trim(),
        registrationNumber: formData.registrationNumber.trim(),
        vehicleType: formData.vehicleType,
        supplierName: formData.supplierName.trim(),
        driverName: formData.driverName.trim(),
        driverContact: formData.driverContact.trim(),
        licenseExpiry: formData.licenseExpiry || null,
        rcExpiry: formData.rcExpiry || null,
        availabilityStatus: formData.availabilityStatus,
        notes: formData.notes || '',
        status: formData.status
      }

      const response = await fetch('/api/vehicle-drivers', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (response.ok) {
        await fetchVehicleDrivers()
        setShowAddForm(false)
        setFormData({
          vehicleName: '',
          registrationNumber: '',
          vehicleType: '',
          supplierName: '',
          driverName: '',
          driverContact: '',
          licenseExpiry: '',
          rcExpiry: '',
          availabilityStatus: 'Available',
          notes: '',
          status: 'Active'
        })
        setEditingVehicle(null)
        alert(data.message || 'Vehicle & Driver saved successfully')
      } else {
        alert(data.error || 'Failed to save vehicle & driver')
      }
    } catch (error) {
      console.error('Error saving vehicle & driver:', error)
      alert('Error saving vehicle & driver')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteVehicle = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/vehicle-drivers?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        await fetchVehicleDrivers()
        alert(data.message || 'Vehicle & Driver deleted successfully')
      } else {
        alert(data.error || 'Failed to delete vehicle & driver')
      }
    } catch (error) {
      console.error('Error deleting vehicle & driver:', error)
      alert('Error deleting vehicle & driver')
    }
  }

  const handleEditClick = (vehicle: VehicleDriver) => {
    setEditingVehicle(vehicle)
    setFormData({
      vehicleName: vehicle.vehicle_name || '',
      registrationNumber: vehicle.registration_number || '',
      vehicleType: vehicle.vehicle_type || '',
      supplierName: vehicle.supplier_name || '',
      driverName: vehicle.driver_name || '',
      driverContact: vehicle.driver_contact || '',
      licenseExpiry: vehicle.license_expiry ? (vehicle.license_expiry.includes('T') ? vehicle.license_expiry.split('T')[0] : vehicle.license_expiry) : '',
      rcExpiry: vehicle.rc_expiry ? (vehicle.rc_expiry.includes('T') ? vehicle.rc_expiry.split('T')[0] : vehicle.rc_expiry) : '',
      availabilityStatus: vehicle.availability_status || 'Available',
      notes: vehicle.notes || '',
      status: vehicle.status
    })
    setShowAddForm(true)
  }

  const handleCloseForm = () => {
    setShowAddForm(false)
    setEditingVehicle(null)
    setFormData({
      vehicleName: '',
      registrationNumber: '',
      vehicleType: '',
      supplierName: '',
      driverName: '',
      driverContact: '',
      licenseExpiry: '',
      rcExpiry: '',
      availabilityStatus: 'Available',
      notes: '',
      status: 'Active'
    })
  }

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.vehicle_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.registration_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.driver_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading vehicles & drivers...</p>
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
              <h1 className="text-lg font-bold text-gray-900">Vehicle & Driver</h1>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
                <Input
                  type="text"
                  placeholder="Search by vehicle, reg no, or driver"
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
              Add Vehicle & Driver
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
                    <th className="w-full px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle / Reg No</th>
                    <th className="w-32 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="w-32 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                    <th className="w-32 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                    <th className="w-32 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="w-32 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Availability</th>
                    <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="w-12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredVehicles.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-4 text-center text-sm text-gray-500">
                        {searchTerm ? 'No vehicles found matching your search' : 'No vehicles found. Click "Add Vehicle & Driver" to create one.'}
                      </td>
                    </tr>
                  ) : (
                    filteredVehicles.map((vehicle) => (
                      <tr key={vehicle.id} className="hover:bg-gray-50">
                        <td className="px-3 py-3 text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{vehicle.vehicle_name || '-'}</div>
                            {vehicle.registration_number && (
                              <div className="text-xs text-gray-500">{vehicle.registration_number}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600">{vehicle.vehicle_type || '-'}</td>
                        <td className="px-3 py-3 text-sm text-gray-600">{vehicle.supplier_name || '-'}</td>
                        <td className="px-3 py-3 text-sm text-gray-600">{vehicle.driver_name || '-'}</td>
                        <td className="px-3 py-3 text-sm text-gray-600">{vehicle.driver_contact || '-'}</td>
                        <td className="px-3 py-3 text-sm">
                          <Badge variant={vehicle.availability_status === 'Available' ? 'default' : 'secondary'}>
                            {vehicle.availability_status || 'Available'}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-sm">
                          <Badge variant={vehicle.status === 'Active' ? 'default' : 'secondary'}>
                            {vehicle.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditClick(vehicle)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteVehicle(vehicle.id, vehicle.vehicle_name || vehicle.registration_number || 'Vehicle')}
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
          
          <div className="absolute right-0 top-0 h-full w-[600px] bg-white shadow-xl transform transition-transform duration-300 ease-in-out overflow-y-auto">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingVehicle ? 'Edit Vehicle & Driver' : 'Add Vehicle & Driver'}
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
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vehicle Name
                      </label>
                      <Input
                        type="text"
                        placeholder="e.g., Toyota Innova"
                        value={formData.vehicleName}
                        onChange={(e) => setFormData({...formData, vehicleName: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Registration Number
                      </label>
                      <Input
                        type="text"
                        placeholder="e.g., KL-01-AB-1234"
                        value={formData.registrationNumber}
                        onChange={(e) => setFormData({...formData, registrationNumber: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vehicle Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.vehicleType}
                        onChange={(e) => setFormData({...formData, vehicleType: e.target.value})}
                      >
                        <option value="">Select vehicle type</option>
                        {vehicleTypes.map((vt) => (
                          <option key={vt.id} value={vt.vehicle_type}>
                            {vt.vehicle_type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Supplier Name <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.supplierName}
                        onChange={(e) => setFormData({...formData, supplierName: e.target.value})}
                      >
                        <option value="">Select supplier</option>
                        {suppliers.map((supplier) => (
                          <option key={supplier.id} value={supplier.company_name}>
                            {supplier.company_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Driver Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        placeholder="Enter driver name"
                        value={formData.driverName}
                        onChange={(e) => setFormData({...formData, driverName: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Driver Contact <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        placeholder="Enter driver contact"
                        value={formData.driverContact}
                        onChange={(e) => setFormData({...formData, driverContact: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        License Expiry (Optional)
                      </label>
                      <Input
                        type="date"
                        value={formData.licenseExpiry}
                        onChange={(e) => setFormData({...formData, licenseExpiry: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vehicle RC Expiry (Optional)
                      </label>
                      <Input
                        type="date"
                        value={formData.rcExpiry}
                        onChange={(e) => setFormData({...formData, rcExpiry: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Availability Status
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.availabilityStatus}
                      onChange={(e) => setFormData({...formData, availabilityStatus: e.target.value})}
                    >
                      <option value="Available">Available</option>
                      <option value="Unavailable">Unavailable</option>
                      <option value="On Trip">On Trip</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Additional notes about the vehicle or driver"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    />
                  </div>

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
                  onClick={handleSaveVehicle}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {saving ? 'Saving...' : editingVehicle ? 'Update' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VehicleDriver

