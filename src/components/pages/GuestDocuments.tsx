import React, { useState } from 'react'
// Note: This component can render inside contexts without React Router. Avoid router hooks.
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'

interface Guest {
  id: number
  prefix?: string
  firstName: string
  lastName: string
  gender: 'MALE' | 'FEMALE' | 'OTHER'
  dob: string
  panUrl?: string
  passportFrontUrl?: string
  passportBackUrl?: string
  flightUrls?: string[]
}

interface GuestDocumentsProps {
  queryId?: string | number
}

const GuestDocuments: React.FC<GuestDocumentsProps> = ({ queryId }) => {
  const [guests, setGuests] = useState<Guest[]>([
    { id: 1, prefix: 'Mr.', firstName: 'harsha', lastName: 'vardhan', gender: 'MALE', dob: new Date().toISOString() },
  ])

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingGuestId, setEditingGuestId] = useState<number | null>(null)
  const [formPrefix, setFormPrefix] = useState<string>('Mr.')
  const [formFirstName, setFormFirstName] = useState<string>('')
  const [formLastName, setFormLastName] = useState<string>('')
  const [formGender, setFormGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE')
  const [formDob, setFormDob] = useState<string>('') // yyyy-mm-dd

  // Documents modal state
  const [isDocModalOpen, setIsDocModalOpen] = useState(false)
  const [docGuestId, setDocGuestId] = useState<number | null>(null)
  const [panFile, setPanFile] = useState<File | null>(null)
  const [passportFrontFile, setPassportFrontFile] = useState<File | null>(null)
  const [passportBackFile, setPassportBackFile] = useState<File | null>(null)
  const [flightFiles, setFlightFiles] = useState<FileList | null>(null)
  const [uploading, setUploading] = useState(false)

  const openAddModal = () => {
    setEditingGuestId(null)
    setFormPrefix('Mr.')
    setFormFirstName('')
    setFormLastName('')
    setFormGender('MALE')
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    setFormDob(`${yyyy}-${mm}-${dd}`)
    setIsModalOpen(true)
  }

  const openEditModal = (guest: Guest) => {
    setEditingGuestId(guest.id)
    setFormPrefix(guest.prefix || 'Mr.')
    setFormFirstName(guest.firstName || '')
    setFormLastName(guest.lastName || '')
    setFormGender(guest.gender)
    const d = guest.dob ? new Date(guest.dob) : new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    setFormDob(`${yyyy}-${mm}-${dd}`)
    setIsModalOpen(true)
  }

  const handleSaveGuest = () => {
    if (!formFirstName.trim() || !formLastName.trim() || !formDob) {
      alert('Please fill all required fields')
      return
    }
    if (editingGuestId) {
      setGuests(prev => prev.map(g => g.id === editingGuestId ? {
        ...g,
        prefix: formPrefix,
        firstName: formFirstName.trim(),
        lastName: formLastName.trim(),
        gender: formGender,
        dob: new Date(formDob).toISOString()
      } : g))
    } else {
      const id = guests.length ? Math.max(...guests.map(g => g.id)) + 1 : 1
      setGuests(prev => [
        ...prev,
        {
          id,
          prefix: formPrefix,
          firstName: formFirstName.trim(),
          lastName: formLastName.trim(),
          gender: formGender,
          dob: new Date(formDob).toISOString()
        }
      ])
    }
    setIsModalOpen(false)
  }

  const deleteGuest = (id: number) => setGuests(prev => prev.filter(g => g.id !== id))

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Guests ({guests.length}) {queryId ? `(Query #${queryId})` : ''}</h2>
            <Button variant="outline" onClick={() => {
              if (typeof window !== 'undefined') {
                if (window.history.length > 1) window.history.back()
                else window.location.href = queryId ? `/queries/${queryId}` : '/queries'
              }
            }}>Back</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={openAddModal}>+Add Guest</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">First Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Last Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Gender</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date of Birth</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {guests.map(guest => (
                  <tr key={guest.id}>
                    <td className="px-4 py-3 text-gray-900">{guest.prefix ? `${guest.prefix} ` : ''}{guest.firstName}</td>
                    <td className="px-4 py-3 text-gray-900">{guest.lastName}</td>
                    <td className="px-4 py-3 text-gray-900">{guest.gender}</td>
                    <td className="px-4 py-3 text-gray-900">{new Date(guest.dob).toLocaleDateString('en-GB')}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={async () => {
                          setDocGuestId(guest.id)
                          setPanFile(null)
                          setPassportFrontFile(null)
                          setPassportBackFile(null)
                          setFlightFiles(null)
                          // load existing doc from DB
                          try {
                            if (queryId) {
                              const r = await fetch(`/api/guest-documents?queryId=${queryId}&guestId=${guest.id}`)
                              const j = await r.json().catch(() => ({}))
                              if (r.ok && j?.doc) {
                                setGuests(prev => prev.map(g => g.id === guest.id ? { ...g,
                                  panUrl: j.doc.pan_url || g.panUrl,
                                  passportFrontUrl: j.doc.passport_front_url || g.passportFrontUrl,
                                  passportBackUrl: j.doc.passport_back_url || g.passportBackUrl,
                                  flightUrls: Array.isArray(j.doc.flight_urls) ? j.doc.flight_urls : (j.doc.flight_urls ? (typeof j.doc.flight_urls === 'string' ? JSON.parse(j.doc.flight_urls) : j.doc.flight_urls) : g.flightUrls)
                                } : g))
                              }
                            }
                          } catch (_) {}
                          setIsDocModalOpen(true)
                        }}>Document</Button>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => openEditModal(guest)}>Edit</Button>
                        <button onClick={() => deleteGuest(guest.id)} className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Guest Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div className="text-xl font-semibold text-gray-900">{editingGuestId ? 'Edit Guest' : 'Add Guest'}</div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">×</button>
            </div>
            <div className="px-6 py-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prefix</label>
                    <select
                      value={formPrefix}
                      onChange={(e) => setFormPrefix(e.target.value)}
                      className="w-full border rounded px-3 py-2 text-sm"
                    >
                      <option>Mr.</option>
                      <option>Mrs.</option>
                      <option>Ms.</option>
                      <option>Dr.</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name*</label>
                    <input
                      type="text"
                      value={formFirstName}
                      onChange={(e) => setFormFirstName(e.target.value)}
                      className="w-full border rounded px-3 py-2 text-sm"
                      placeholder="First Name"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name*</label>
                  <input
                    type="text"
                    value={formLastName}
                    onChange={(e) => setFormLastName(e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="Last Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender*</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender((e.target.value.toUpperCase() as 'MALE' | 'FEMALE' | 'OTHER'))}
                    className="w-full border rounded px-3 py-2 text-sm"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth*</label>
                  <input
                    type="date"
                    value={formDob}
                    onChange={(e) => setFormDob(e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSaveGuest}>Save</Button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Documents Modal */}
      {isDocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsDocModalOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div className="text-2xl font-semibold text-gray-900">Upload Documents</div>
              <button onClick={() => setIsDocModalOpen(false)} className="text-gray-500 hover:text-gray-700">×</button>
            </div>
            <div className="px-6 py-6 space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="mb-2 text-gray-900">Pan Card</div>
                  <input type="file" accept=".png,.jpg,.jpeg,.pdf" onChange={(e) => setPanFile(e.target.files?.[0] || null)} className="w-full border rounded px-3 py-2 text-sm" />
                </div>
                {(() => {
                  const g = guests.find(x => x.id === docGuestId)
                  if (g?.panUrl) {
                    return (
                      <a href={g.panUrl} target="_blank" rel="noreferrer" className="px-4 py-2 bg-blue-500 text-white rounded">Download Pan Card</a>
                    )
                  }
                  return null
                })()}
              </div>
              <div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-2 text-gray-900">Passport Front</div>
                    <input type="file" accept=".png,.jpg,.jpeg,.pdf" onChange={(e) => setPassportFrontFile(e.target.files?.[0] || null)} className="w-full border rounded px-3 py-2 text-sm" />
                  </div>
                  {(() => {
                    const g = guests.find(x => x.id === docGuestId)
                    if (g?.passportFrontUrl) {
                      return (
                        <a href={g.passportFrontUrl} target="_blank" rel="noreferrer" className="px-4 py-2 bg-blue-500 text-white rounded">Download Passport Front</a>
                      )
                    }
                    return null
                  })()}
                </div>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="mb-2 text-gray-900">Passport Back</div>
                  <input type="file" accept=".png,.jpg,.jpeg,.pdf" onChange={(e) => setPassportBackFile(e.target.files?.[0] || null)} className="w-full border rounded px-3 py-2 text-sm" />
                </div>
                {(() => {
                  const g = guests.find(x => x.id === docGuestId)
                  if (g?.passportBackUrl) {
                    return (
                      <a href={g.passportBackUrl} target="_blank" rel="noreferrer" className="px-4 py-2 bg-blue-500 text-white rounded">Download Passport Back</a>
                    )
                  }
                  return null
                })()}
              </div>
              <div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-2 text-gray-900">Flight</div>
                    <input multiple type="file" accept=".png,.jpg,.jpeg,.pdf" onChange={(e) => setFlightFiles(e.target.files)} className="w-full border rounded px-3 py-2 text-sm" />
                  </div>
                  {(() => {
                    const g = guests.find(x => x.id === docGuestId)
                    const count = g?.flightUrls?.length || 0
                    if (count > 0) {
                      return (
                        <a href={(g!.flightUrls![0])} target="_blank" rel="noreferrer" className="px-4 py-2 bg-blue-500 text-white rounded">{count} Download Flight</a>
                      )
                    }
                    return null
                  })()}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end">
              <Button
                className={`bg-blue-600 hover:bg-blue-700 text-white ${uploading ? 'opacity-70 cursor-not-allowed' : ''}`}
                onClick={async () => {
                  if (!docGuestId) return
                  try {
                    setUploading(true)
                    const folderBase = `guest-documents/${queryId || 'unknown'}/${docGuestId}`
                    const uploadOne = async (file: File | null, name: string) => {
                      if (!file) return undefined
                      const fd = new FormData()
                      fd.append('file', file)
                      fd.append('path', folderBase)
                      const res = await fetch('/api/upload', { method: 'POST', body: fd })
                      const j = await res.json().catch(() => ({}))
                      if (!res.ok || !j?.url) throw new Error(j?.error || `Failed to upload ${name}`)
                      return j.url as string
                    }
                    const panUrl = await uploadOne(panFile, 'Pan Card')
                    const passportFrontUrl = await uploadOne(passportFrontFile, 'Passport Front')
                    const passportBackUrl = await uploadOne(passportBackFile, 'Passport Back')
                    let flightUrls: string[] | undefined
                    if (flightFiles && flightFiles.length) {
                      flightUrls = []
                      for (let i = 0; i < flightFiles.length; i++) {
                        const url = await uploadOne(flightFiles.item(i), `Flight ${i+1}`)
                        if (url) flightUrls.push(url)
                      }
                    }
                    setGuests(prev => prev.map(g => g.id === docGuestId ? { ...g, panUrl, passportFrontUrl, passportBackUrl, flightUrls } : g))

                    // Persist to DB
                    await fetch('/api/guest-documents', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        queryId,
                        guestId: docGuestId,
                        panUrl,
                        passportFrontUrl,
                        passportBackUrl,
                        flightUrls
                      })
                    })
                    alert('Documents uploaded successfully')
                    setIsDocModalOpen(false)
                  } catch (e: any) {
                    alert(e?.message || 'Failed to upload documents')
                  } finally {
                    setUploading(false)
                  }
                }}
              >
                {uploading ? 'Uploading...' : 'Upload Documents'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GuestDocuments


