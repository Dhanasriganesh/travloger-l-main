'use client'

import React, { useEffect, useState } from 'react'
import WebsiteEdit from './WebsiteEdit'

function MainWebsiteEdit() {
  const [activeTab, setActiveTab] = useState<'cities' | 'pages'>('cities')

  // Home hero state (for Other Pages tab)
  const [homeHero, setHomeHero] = useState({
    title: '',
    subtitle: '',
    backgroundImageUrl: ''
  })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Trip Overview (Home) state
  const [overview, setOverview] = useState({
    title: '',
    description: '',
    readMoreText: 'Read More',
    readMoreHref: '',
    duration: '6N / 7D',
    days: [
      // { count: 3, label: 'DAYS IN', city: 'UDAIPUR' }
    ] as { count: number; label: string; city: string }[],
    inclusions: [
      // { label: 'TRANSPORT' }
    ] as { label: string }[]
  })

  // Trip Durations (cards)
  type DurationCard = { label: string; imageUrl: string; priceText: string; selected?: boolean }
  const [durations, setDurations] = useState<DurationCard[]>([])

  // Destination Route and Stay Categories
  const [routeCities, setRouteCities] = useState<string[]>([])
  type StayCategory = { label: string; selected?: boolean }
  const [stayCategories, setStayCategories] = useState<StayCategory[]>([])
  // About section (simple bullets)
  const [about, setAbout] = useState({
    routeText: '',
    durationText: '',
    startPoint: '',
    endPoint: ''
  })
  // Itinerary days
  type ItinDay = { title: string; points: string[] }
  const [itinerary, setItinerary] = useState<ItinDay[]>([])
  // Inclusions/Exclusions
  const [activeIE, setActiveIE] = useState<'inclusion' | 'exclusion'>('inclusion')
  const [inclusions, setInclusions] = useState<string[]>([])
  const [exclusions, setExclusions] = useState<string[]>([])
  // Why travel with us
  type WhyItem = { iconUrl: string; title: string; text: string }
  const [whyUs, setWhyUs] = useState<{ heading: string; items: WhyItem[] }>({ heading: 'WHY TRAVEL WITH US???', items: [] })
  // Trending destinations
  type TrendingCard = { title: string; imageUrl: string; priceText: string; strikeText?: string; link?: string }
  const [trending, setTrending] = useState<TrendingCard[]>([])
  // Privacy Policy
  const [privacy, setPrivacy] = useState<{ title: string; lastUpdated: string; content: string; sections: { heading: string; bullets: string[] }[] }>({ title: 'Privacy Policy', lastUpdated: '', content: '', sections: [] })
  // Terms & Conditions
  const [terms, setTerms] = useState<{ title: string; lastUpdated: string; intro: string; sections: { heading: string; bullets: string[] }[] }>({ title: 'Terms and Conditions', lastUpdated: '', intro: '', sections: [] })
  // Copyright & Content Policy
  const [copyrightPolicy, setCopyrightPolicy] = useState<{ title: string; intro: string; sections: { heading: string; bullets: string[] }[] }>({ title: 'Copyright & Content Policy', intro: '', sections: [] })

  useEffect(() => {
    const load = async () => {
      if (activeTab !== 'pages') return
      try {
        setLoading(true)
        const res = await fetch('/api/cms/site/home', { cache: 'no-store' })
        const data = await res.json().catch(() => ({}))
        if (res.ok && data?.hero) {
          setHomeHero({
            title: data.hero.title || '',
            subtitle: data.hero.subtitle || '',
            backgroundImageUrl: data.hero.backgroundImageUrl || ''
          })
        }
        // Load overview if present
        const ov = data?.sections?.overview
        if (ov) {
          setOverview({
            title: ov.title || '',
            description: ov.description || '',
            readMoreText: ov.readMoreText || 'Read More',
            readMoreHref: ov.readMoreHref || '',
            duration: ov.duration || '6N / 7D',
            days: Array.isArray(ov.days) ? ov.days : [],
            inclusions: Array.isArray(ov.inclusions) ? ov.inclusions : []
          })
        }
        // Load durations if present
        const du = data?.sections?.durations
        if (Array.isArray(du)) {
          setDurations(du)
        }
        // Load route & stay categories
        const rt = data?.sections?.route
        if (Array.isArray(rt)) setRouteCities(rt)
        const sc = data?.sections?.stayCategories
        if (Array.isArray(sc)) setStayCategories(sc)
        const ab = data?.sections?.about
        if (ab) {
          setAbout({
            routeText: ab.routeText || '',
            durationText: ab.durationText || '',
            startPoint: ab.startPoint || '',
            endPoint: ab.endPoint || ''
          })
        }
        const it = data?.sections?.itinerary
        if (Array.isArray(it)) setItinerary(it)
        const ie = data?.sections?.inclusions
        if (ie) {
          if (Array.isArray(ie.inclusions)) setInclusions(ie.inclusions)
          if (Array.isArray(ie.exclusions)) setExclusions(ie.exclusions)
          if (ie.active) setActiveIE(ie.active === 'exclusion' ? 'exclusion' : 'inclusion')
        }
        const wu = data?.sections?.whyUs
        if (wu) setWhyUs({ heading: wu.heading || 'WHY TRAVEL WITH US???', items: Array.isArray(wu.items) ? wu.items : [] })
        const tr = data?.sections?.trending
        if (Array.isArray(tr)) setTrending(tr)
        const pp = data?.sections?.privacyPolicy
        if (pp) setPrivacy({ title: pp.title || 'Privacy Policy', lastUpdated: pp.lastUpdated || '', content: pp.content || '', sections: Array.isArray(pp.sections) ? pp.sections : [] })
        const tc = data?.sections?.terms
        if (tc) setTerms({ title: tc.title || 'Terms and Conditions', lastUpdated: tc.lastUpdated || '', intro: tc.intro || '', sections: Array.isArray(tc.sections) ? tc.sections : [] })
        const cp = data?.sections?.copyrightPolicy
        if (cp) setCopyrightPolicy({ title: cp.title || 'Copyright & Content Policy', intro: cp.intro || '', sections: Array.isArray(cp.sections) ? cp.sections : [] })
      } catch (e) {
        // noop
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [activeTab])

  const saveHomeHero = async (): Promise<void> => {
    try {
      setSaving(true)
      setError(null)
      const res = await fetch('/api/cms/site/home', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hero: homeHero })
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Failed to save')
      }
      alert('Home hero saved')
    } catch (e: any) {
      setError(e?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const saveOverview = async (): Promise<void> => {
    try {
      setSaving(true)
      setError(null)
      // Fetch current sections to merge
      const currentRes = await fetch('/api/cms/site/home', { cache: 'no-store' })
      const currentData = await currentRes.json().catch(() => ({}))
      const currentSections = currentData?.sections || {}
      const mergedSections = { ...currentSections, overview }
      const res = await fetch('/api/cms/site/home', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: mergedSections })
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Failed to save')
      }
      alert('Overview saved')
    } catch (e: any) {
      setError(e?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const saveDurations = async (): Promise<void> => {
    try {
      setSaving(true)
      setError(null)
      const currentRes = await fetch('/api/cms/site/home', { cache: 'no-store' })
      const currentData = await currentRes.json().catch(() => ({}))
      const currentSections = currentData?.sections || {}
      const mergedSections = { ...currentSections, durations }
      const res = await fetch('/api/cms/site/home', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: mergedSections })
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Failed to save')
      }
      alert('Durations saved')
    } catch (e: any) {
      setError(e?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const saveRoute = async (): Promise<void> => {
    try {
      setSaving(true)
      setError(null)
      const currentRes = await fetch('/api/cms/site/home', { cache: 'no-store' })
      const currentData = await currentRes.json().catch(() => ({}))
      const currentSections = currentData?.sections || {}
      const mergedSections = { ...currentSections, route: routeCities }
      const res = await fetch('/api/cms/site/home', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: mergedSections })
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Failed to save')
      }
      alert('Route saved')
    } catch (e: any) {
      setError(e?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const saveStayCategories = async (): Promise<void> => {
    try {
      setSaving(true)
      setError(null)
      const currentRes = await fetch('/api/cms/site/home', { cache: 'no-store' })
      const currentData = await currentRes.json().catch(() => ({}))
      const currentSections = currentData?.sections || {}
      const mergedSections = { ...currentSections, stayCategories }
      const res = await fetch('/api/cms/site/home', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: mergedSections })
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Failed to save')
      }
      alert('Stay categories saved')
    } catch (e: any) {
      setError(e?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const saveAbout = async (): Promise<void> => {
    try {
      setSaving(true)
      setError(null)
      const currentRes = await fetch('/api/cms/site/home', { cache: 'no-store' })
      const currentData = await currentRes.json().catch(() => ({}))
      const currentSections = currentData?.sections || {}
      const mergedSections = { ...currentSections, about }
      const res = await fetch('/api/cms/site/home', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: mergedSections })
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Failed to save')
      }
      alert('About saved')
    } catch (e: any) {
      setError(e?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const saveItinerary = async (): Promise<void> => {
    try {
      setSaving(true)
      setError(null)
      const currentRes = await fetch('/api/cms/site/home', { cache: 'no-store' })
      const currentData = await currentRes.json().catch(() => ({}))
      const currentSections = currentData?.sections || {}
      const mergedSections = { ...currentSections, itinerary }
      const res = await fetch('/api/cms/site/home', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: mergedSections })
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Failed to save')
      }
      alert('Itinerary saved')
    } catch (e: any) {
      setError(e?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const saveInclusions = async (): Promise<void> => {
    try {
      setSaving(true)
      setError(null)
      const currentRes = await fetch('/api/cms/site/home', { cache: 'no-store' })
      const currentData = await currentRes.json().catch(() => ({}))
      const currentSections = currentData?.sections || {}
      const mergedSections = { ...currentSections, inclusions: { active: activeIE, inclusions, exclusions } }
      const res = await fetch('/api/cms/site/home', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: mergedSections })
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Failed to save')
      }
      alert('Inclusions/Exclusions saved')
    } catch (e: any) {
      setError(e?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const saveWhyUs = async (): Promise<void> => {
    try {
      setSaving(true)
      setError(null)
      const currentRes = await fetch('/api/cms/site/home', { cache: 'no-store' })
      const currentData = await currentRes.json().catch(() => ({}))
      const currentSections = currentData?.sections || {}
      const mergedSections = { ...currentSections, whyUs }
      const res = await fetch('/api/cms/site/home', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: mergedSections })
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Failed to save')
      }
      alert('Why Us saved')
    } catch (e: any) {
      setError(e?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const saveTrending = async (): Promise<void> => {
    try {
      setSaving(true)
      setError(null)
      const currentRes = await fetch('/api/cms/site/home', { cache: 'no-store' })
      const currentData = await currentRes.json().catch(() => ({}))
      const currentSections = currentData?.sections || {}
      const mergedSections = { ...currentSections, trending }
      const res = await fetch('/api/cms/site/home', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: mergedSections })
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Failed to save')
      }
      alert('Trending destinations saved')
    } catch (e: any) {
      setError(e?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const savePrivacy = async (): Promise<void> => {
    try {
      setSaving(true)
      setError(null)
      const currentRes = await fetch('/api/cms/site/home', { cache: 'no-store' })
      const currentData = await currentRes.json().catch(() => ({}))
      const currentSections = currentData?.sections || {}
      const mergedSections = { ...currentSections, privacyPolicy: privacy }
      const res = await fetch('/api/cms/site/home', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: mergedSections })
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Failed to save')
      }
      alert('Privacy Policy saved')
    } catch (e: any) {
      setError(e?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const saveTerms = async (): Promise<void> => {
    try {
      setSaving(true)
      setError(null)
      const currentRes = await fetch('/api/cms/site/home', { cache: 'no-store' })
      const currentData = await currentRes.json().catch(() => ({}))
      const currentSections = currentData?.sections || {}
      const mergedSections = { ...currentSections, terms }
      const res = await fetch('/api/cms/site/home', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: mergedSections })
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Failed to save')
      }
      alert('Terms & Conditions saved')
    } catch (e: any) {
      setError(e?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const saveCopyrightPolicy = async (): Promise<void> => {
    try {
      setSaving(true)
      setError(null)
      const currentRes = await fetch('/api/cms/site/home', { cache: 'no-store' })
      const currentData = await currentRes.json().catch(() => ({}))
      const currentSections = currentData?.sections || {}
      const mergedSections = { ...currentSections, copyrightPolicy }
      const res = await fetch('/api/cms/site/home', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: mergedSections })
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Failed to save')
      }
      alert('Copyright & Content Policy saved')
    } catch (e: any) {
      setError(e?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border-b-4 border-blue-600 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
    <div>
            <h1 className="text-2xl font-bold text-gray-900">Main Website CMS</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage the content of the public Travloger website here.
            </p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setActiveTab('cities')}
            className={`px-4 py-2 text-sm font-semibold rounded-md border ${
              activeTab === 'cities'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            City Pages
          </button>
          <button
            onClick={() => setActiveTab('pages')}
            className={`px-4 py-2 text-sm font-semibold rounded-md border ${
              activeTab === 'pages'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Other Pages (Home, About, Contact)
          </button>
        </div>
      </div>

      {activeTab === 'cities' && (
        <WebsiteEdit />
      )}

      {activeTab === 'pages' && (
        <div className="space-y-6">
          <div className="bg-white border-2 border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Home Hero</h2>
                    <p className="text-xs text-gray-500">Title, subtitle and background image</p>
                  </div>
                </div>
                <button
                  onClick={saveHomeHero}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 shadow-sm transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>

            {error && (
              <div className="m-4 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-md shadow-sm">
                <div className="flex items-center">
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            )}

            <div className="p-6">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                  <input
                    type="text"
                    value={homeHero.title}
                    onChange={(e) => setHomeHero(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    placeholder="RAJASTHAN 2025"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Subtitle</label>
                  <input
                    type="text"
                    value={homeHero.subtitle}
                    onChange={(e) => setHomeHero(prev => ({ ...prev, subtitle: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    placeholder="6N/7D EXCLUSIVE RAJASTHAN 2025"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Background Image URL</label>
                  <input
                    type="url"
                    value={homeHero.backgroundImageUrl}
                    onChange={(e) => setHomeHero(prev => ({ ...prev, backgroundImageUrl: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    placeholder="https://..."
                  />
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Or upload image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        const maxSize = 4 * 1024 * 1024
                        if (file.size > maxSize) {
                          alert(`File too large. Maximum size is 4MB.`)
                          return
                        }
                        try {
                          const form = new FormData()
                          form.append('file', file)
                          form.append('slug', 'home')
                          form.append('folder', 'hero')
                          const res = await fetch('/api/upload', { method: 'POST', body: form })
                          if (!res.ok) {
                            const err = await res.json().catch(() => ({}))
                            throw new Error(err.error || 'Upload failed')
                          }
                          const data = await res.json()
                          setHomeHero(prev => ({ ...prev, backgroundImageUrl: data.url }))
                        } catch (err: any) {
                          setError(err?.message || 'Failed to upload image')
                        }
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    />
                  </div>

                  {homeHero.backgroundImageUrl && (
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Preview</label>
                      <div className="relative w-full h-32 rounded-md overflow-hidden border border-gray-200">
                        <img src={homeHero.backgroundImageUrl} alt="Hero background preview" className="w-full h-full object-cover" />
                      </div>
                      <div className="mt-1.5">
                        <button
                          type="button"
                          onClick={() => setHomeHero(prev => ({ ...prev, backgroundImageUrl: '' }))}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Remove Image
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {loading && <div className="text-sm text-gray-500 mt-3">Loading content…</div>}
            </div>
          </div>

          {/* Trip Overview Section */}
          <div className="bg-white border-2 border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h10m-10 5h14" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Trip Overview</h2>
                    <p className="text-xs text-gray-500">Title, description, duration, days breakdown and inclusions</p>
                  </div>
                </div>
                <button
                  onClick={saveOverview}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 shadow-sm transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                <input
                  type="text"
                  value={overview.title}
                  onChange={(e) => setOverview(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  placeholder="Rajasthan 2025"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea
                  value={overview.description}
                  onChange={(e) => setOverview(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  rows={3}
                  placeholder="Enjoy the best of Rajasthan with Travloger..."
                />
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={overview.readMoreText}
                    onChange={(e) => setOverview(prev => ({ ...prev, readMoreText: e.target.value }))}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    placeholder="Read More"
                  />
                  <input
                    type="url"
                    value={overview.readMoreHref}
                    onChange={(e) => setOverview(prev => ({ ...prev, readMoreHref: e.target.value }))}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    placeholder="https://example.com/rajasthan"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration Badge</label>
                <input
                  type="text"
                  value={overview.duration}
                  onChange={(e) => setOverview(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  placeholder="6N / 7D"
                />
              </div>

              {/* Days breakdown */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Days in Cities</label>
                  <button
                    type="button"
                    onClick={() => setOverview(prev => ({ ...prev, days: [...prev.days, { count: 1, label: 'DAYS IN', city: '' }] }))}
                    className="text-xs px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50"
                  >
                    + Add City
                  </button>
                </div>
                <div className="space-y-2">
                  {overview.days.map((d, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2">
                      <input
                        type="number"
                        value={d.count}
                        onChange={(e) => {
                          const n = parseInt(e.target.value || '0', 10)
                          const copy = [...overview.days]
                          copy[idx] = { ...copy[idx], count: isNaN(n) ? 0 : n }
                          setOverview(prev => ({ ...prev, days: copy }))
                        }}
                        className="col-span-2 px-3 py-2 text-sm border border-gray-200 rounded-md"
                        placeholder="2"
                      />
                      <input
                        type="text"
                        value={d.label}
                        onChange={(e) => {
                          const copy = [...overview.days]
                          copy[idx] = { ...copy[idx], label: e.target.value }
                          setOverview(prev => ({ ...prev, days: copy }))
                        }}
                        className="col-span-4 px-3 py-2 text-sm border border-gray-200 rounded-md"
                        placeholder="DAYS IN"
                      />
                      <input
                        type="text"
                        value={d.city}
                        onChange={(e) => {
                          const copy = [...overview.days]
                          copy[idx] = { ...copy[idx], city: e.target.value }
                          setOverview(prev => ({ ...prev, days: copy }))
                        }}
                        className="col-span-5 px-3 py-2 text-sm border border-gray-200 rounded-md"
                        placeholder="UDAIPUR"
                      />
                      <button
                        type="button"
                        onClick={() => setOverview(prev => ({ ...prev, days: prev.days.filter((_, i) => i !== idx) }))}
                        className="col-span-1 text-xs text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inclusions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Inclusions</label>
                  <button
                    type="button"
                    onClick={() => setOverview(prev => ({ ...prev, inclusions: [...prev.inclusions, { label: '' }] }))}
                    className="text-xs px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50"
                  >
                    + Add Inclusion
                  </button>
                </div>
                <div className="space-y-2">
                  {overview.inclusions.map((inc, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={inc.label}
                        onChange={(e) => {
                          const copy = [...overview.inclusions]
                          copy[idx] = { ...copy[idx], label: e.target.value }
                          setOverview(prev => ({ ...prev, inclusions: copy }))
                        }}
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md"
                        placeholder="TRANSPORT"
                      />
                      <button
                        type="button"
                        onClick={() => setOverview(prev => ({ ...prev, inclusions: prev.inclusions.filter((_, i) => i !== idx) }))}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Trip Duration Cards */}
          <div className="bg-white border-2 border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-teal-600 rounded-lg flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M3 11h18M5 19h14a2 2 0 002-2v-6H3v6a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Choose Trip Duration</h2>
                    <p className="text-xs text-gray-500">Cards with image, duration label and starting price</p>
                  </div>
                </div>
                <button
                  onClick={saveDurations}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 shadow-sm transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Duration Cards</span>
                <button
                  type="button"
                  onClick={() => setDurations(prev => ([...prev, { label: '', imageUrl: '', priceText: '' }]))}
                  className="text-xs px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50"
                >
                  + Add Card
                </button>
              </div>

              <div className="space-y-3">
                {durations.map((card, idx) => (
                  <div key={idx} className="rounded-lg border border-gray-200 p-3">
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <input
                        type="text"
                        value={card.label}
                        onChange={(e) => {
                          const copy = [...durations]
                          copy[idx] = { ...copy[idx], label: e.target.value }
                          setDurations(copy)
                        }}
                        className="col-span-3 px-3 py-2 text-sm border border-gray-200 rounded-md"
                        placeholder="6N/7D"
                      />
                      <input
                        type="text"
                        value={card.priceText}
                        onChange={(e) => {
                          const copy = [...durations]
                          copy[idx] = { ...copy[idx], priceText: e.target.value }
                          setDurations(copy)
                        }}
                        className="col-span-3 px-3 py-2 text-sm border border-gray-200 rounded-md"
                        placeholder="₹15,000"
                      />
                      <input
                        type="url"
                        value={card.imageUrl}
                        onChange={(e) => {
                          const copy = [...durations]
                          copy[idx] = { ...copy[idx], imageUrl: e.target.value }
                          setDurations(copy)
                        }}
                        className="col-span-4 px-3 py-2 text-sm border border-gray-200 rounded-md"
                        placeholder="Image URL"
                      />
                      <label className="col-span-1 inline-flex items-center gap-2 text-xs text-gray-700">
                        <input
                          type="checkbox"
                          checked={!!card.selected}
                          onChange={(e) => {
                            const copy = [...durations]
                            copy[idx] = { ...copy[idx], selected: e.target.checked }
                            setDurations(copy)
                          }}
                        />
                        Highlight
                      </label>
                      <button
                        type="button"
                        onClick={() => setDurations(prev => prev.filter((_, i) => i !== idx))}
                        className="col-span-1 text-xs text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="mt-2 grid grid-cols-12 gap-2">
                      <div className="col-span-6">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            const maxSize = 4 * 1024 * 1024
                            if (file.size > maxSize) {
                              alert('File too large. Maximum size is 4MB.')
                              return
                            }
                            try {
                              const form = new FormData()
                              form.append('file', file)
                              form.append('slug', 'home')
                              form.append('folder', 'durations')
                              const res = await fetch('/api/upload', { method: 'POST', body: form })
                              if (!res.ok) {
                                const err = await res.json().catch(() => ({}))
                                throw new Error(err.error || 'Upload failed')
                              }
                              const data = await res.json()
                              const copy = [...durations]
                              copy[idx] = { ...copy[idx], imageUrl: data.url }
                              setDurations(copy)
                            } catch (err: any) {
                              setError(err?.message || 'Failed to upload image')
                            }
                          }}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md"
                        />
                      </div>
                      <div className="col-span-6">
                        {card.imageUrl ? (
                          <div className="relative w-full h-24 rounded-md overflow-hidden border border-gray-200">
                            <img src={card.imageUrl} alt="Duration preview" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-full h-24 rounded-md border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-500">No image</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Destination Route */}
          <div className="bg-white border-2 border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-cyan-600 rounded-lg flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A2 2 0 013 15.382V6a2 2 0 012-2h2m6 0h4a2 2 0 012 2v9.382a2 2 0 01-1.553 1.894L13 20M7 4v4m0 0l2-2m-2 2L5 6" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Destination Route</h2>
                    <p className="text-xs text-gray-500">Ordered list of cities (e.g., Jodhpur → Udaipur → Jaisalmer)</p>
                  </div>
                </div>
                <button
                  onClick={saveRoute}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-400 shadow-sm transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Cities</span>
                <button
                  type="button"
                  onClick={() => setRouteCities(prev => ([...prev, '']))}
                  className="text-xs px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50"
                >
                  + Add City
                </button>
              </div>
              <div className="space-y-2">
                {routeCities.map((city, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => {
                        const copy = [...routeCities]
                        copy[idx] = e.target.value
                        setRouteCities(copy)
                      }}
                      className="col-span-8 px-3 py-2 text-sm border border-gray-200 rounded-md"
                      placeholder="City name"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (idx === 0) return
                        const copy = [...routeCities]
                        const tmp = copy[idx - 1]
                        copy[idx - 1] = copy[idx]
                        copy[idx] = tmp
                        setRouteCities(copy)
                      }}
                      className="col-span-1 text-xs px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (idx === routeCities.length - 1) return
                        const copy = [...routeCities]
                        const tmp = copy[idx + 1]
                        copy[idx + 1] = copy[idx]
                        copy[idx] = tmp
                        setRouteCities(copy)
                      }}
                      className="col-span-1 text-xs px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => setRouteCities(prev => prev.filter((_, i) => i !== idx))}
                      className="col-span-2 text-xs text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stay Category */}
          <div className="bg-white border-2 border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-fuchsia-600 rounded-lg flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 21h10a2 2 0 002-2v-7H5v7a2 2 0 002 2zM7 10V7a5 5 0 0110 0v3" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Stay Category</h2>
                    <p className="text-xs text-gray-500">Add categories and mark one as the default (highlighted)</p>
                  </div>
                </div>
                <button
                  onClick={saveStayCategories}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-fuchsia-600 hover:bg-fuchsia-700 disabled:bg-gray-400 shadow-sm transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>

            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Categories</span>
                <button
                  type="button"
                  onClick={() => setStayCategories(prev => ([...prev, { label: '' }]))}
                  className="text-xs px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50"
                >
                  + Add Category
                </button>
              </div>
              <div className="space-y-2">
                {stayCategories.map((cat, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      value={cat.label}
                      onChange={(e) => {
                        const copy = [...stayCategories]
                        copy[idx] = { ...copy[idx], label: e.target.value }
                        setStayCategories(copy)
                      }}
                      className="col-span-8 px-3 py-2 text-sm border border-gray-200 rounded-md"
                      placeholder="STANDARD"
                    />
                    <label className="col-span-2 inline-flex items-center gap-2 text-xs text-gray-700">
                      <input
                        type="radio"
                        name="stay-default"
                        checked={!!cat.selected}
                        onChange={() => {
                          setStayCategories(prev => prev.map((c, i) => ({ ...c, selected: i === idx })))
                        }}
                      />
                      Default
                    </label>
                    <button
                      type="button"
                      onClick={() => setStayCategories(prev => prev.filter((_, i) => i !== idx))}
                      className="col-span-2 text-xs text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="bg-white border-2 border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-slate-600 rounded-lg flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">About</h2>
                    <p className="text-xs text-gray-500">Route, Duration, Start and End points</p>
                  </div>
                </div>
                <button
                  onClick={saveAbout}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-slate-600 hover:bg-slate-700 disabled:bg-gray-400 shadow-sm transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Route (text)</label>
                <textarea
                  value={about.routeText}
                  onChange={(e) => setAbout(prev => ({ ...prev, routeText: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  rows={2}
                  placeholder="Delhi - Shimla - ... - Delhi"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration (text)</label>
                <input
                  type="text"
                  value={about.durationText}
                  onChange={(e) => setAbout(prev => ({ ...prev, durationText: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  placeholder="7 Days and 6 Nights"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Point</label>
                  <input
                    type="text"
                    value={about.startPoint}
                    onChange={(e) => setAbout(prev => ({ ...prev, startPoint: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    placeholder="Delhi"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">End Point</label>
                  <input
                    type="text"
                    value={about.endPoint}
                    onChange={(e) => setAbout(prev => ({ ...prev, endPoint: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    placeholder="Delhi"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Itinerary Section */}
          <div className="bg-white border-2 border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-orange-600 rounded-lg flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12M8 12h12M8 17h12M3 7h.01M3 12h.01M3 17h.01" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Itinerary (Days)</h2>
                    <p className="text-xs text-gray-500">Add days with a title and bullet points</p>
                  </div>
                </div>
                <button
                  onClick={saveItinerary}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 shadow-sm transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Days</span>
                <button
                  type="button"
                  onClick={() => setItinerary(prev => ([...prev, { title: '', points: [''] }]))}
                  className="text-xs px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50"
                >
                  + Add Day
                </button>
              </div>
              <div className="space-y-3">
                {itinerary.map((day, idx) => (
                  <div key={idx} className="rounded-lg border border-gray-200 p-3">
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <input
                        type="text"
                        value={day.title}
                        onChange={(e) => {
                          const copy = [...itinerary]
                          copy[idx] = { ...copy[idx], title: e.target.value }
                          setItinerary(copy)
                        }}
                        className="col-span-9 px-3 py-2 text-sm border border-gray-200 rounded-md"
                        placeholder="Day 1: Udaipur | Lake Pichola ..."
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (idx === 0) return
                          const copy = [...itinerary]
                          const tmp = copy[idx - 1]
                          copy[idx - 1] = copy[idx]
                          copy[idx] = tmp
                          setItinerary(copy)
                        }}
                        className="col-span-1 text-xs px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (idx === itinerary.length - 1) return
                          const copy = [...itinerary]
                          const tmp = copy[idx + 1]
                          copy[idx + 1] = copy[idx]
                          copy[idx] = tmp
                          setItinerary(copy)
                        }}
                        className="col-span-1 text-xs px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => setItinerary(prev => prev.filter((_, i) => i !== idx))}
                        className="col-span-1 text-xs text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="mt-2 space-y-2">
                      {day.points.map((pt, pIdx) => (
                        <div key={pIdx} className="grid grid-cols-12 gap-2 items-center">
                          <input
                            type="text"
                            value={pt}
                            onChange={(e) => {
                              const copy = [...itinerary]
                              const pts = [...copy[idx].points]
                              pts[pIdx] = e.target.value
                              copy[idx] = { ...copy[idx], points: pts }
                              setItinerary(copy)
                            }}
                            className="col-span-10 px-3 py-2 text-sm border border-gray-200 rounded-md"
                            placeholder="Point"
                          />
                          <button
                            type="button"
                            onClick={() => setItinerary(prev => {
                              const copy = [...prev]
                              const pts = [...copy[idx].points]
                              pts.splice(pIdx, 1)
                              copy[idx] = { ...copy[idx], points: pts }
                              return copy
                            })}
                            className="col-span-2 text-xs text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setItinerary(prev => {
                          const copy = [...prev]
                          const pts = [...copy[idx].points, '']
                          copy[idx] = { ...copy[idx], points: pts }
                          return copy
                        })}
                        className="text-xs px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50"
                      >
                        + Add Point
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* What's in the package (Inclusion/Exclusion) */}
          <div className="bg-white border-2 border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">What's in the package</h2>
                    <p className="text-xs text-gray-500">Manage inclusions and exclusions</p>
                  </div>
                </div>
                <button
                  onClick={saveInclusions}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 shadow-sm transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveIE('exclusion')}
                  className={`px-4 py-2 text-sm font-semibold rounded-full border ${activeIE === 'exclusion' ? 'bg-white text-gray-900 border-gray-400' : 'bg-gray-100 text-gray-700 border-gray-200'}`}
                >
                  Exclusion
                </button>
                <button
                  type="button"
                  onClick={() => setActiveIE('inclusion')}
                  className={`px-4 py-2 text-sm font-semibold rounded-full border ${activeIE === 'inclusion' ? 'bg-black text-white border-black' : 'bg-gray-100 text-gray-700 border-gray-200'}`}
                >
                  Inclusion
                </button>
              </div>

              {/* Lists */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold mb-2">Included</h3>
                  <div className="space-y-2">
                    {inclusions.map((text, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          type="text"
                          value={text}
                          onChange={(e) => {
                            const copy = [...inclusions]
                            copy[idx] = e.target.value
                            setInclusions(copy)
                          }}
                          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md"
                          placeholder="Inclusion item"
                        />
                        <button
                          type="button"
                          onClick={() => setInclusions(prev => prev.filter((_, i) => i !== idx))}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setInclusions(prev => ([...prev, '']))}
                      className="text-xs px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50"
                    >
                      + Add Inclusion
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-2">Excluded</h3>
                  <div className="space-y-2">
                    {exclusions.map((text, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          type="text"
                          value={text}
                          onChange={(e) => {
                            const copy = [...exclusions]
                            copy[idx] = e.target.value
                            setExclusions(copy)
                          }}
                          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md"
                          placeholder="Exclusion item"
                        />
                        <button
                          type="button"
                          onClick={() => setExclusions(prev => prev.filter((_, i) => i !== idx))}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setExclusions(prev => ([...prev, '']))}
                      className="text-xs px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50"
                    >
                      + Add Exclusion
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Why Travel With Us */}
          <div className="bg-white border-2 border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-emerald-700 rounded-lg flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM17 11l4 4m0 0l-4 4m4-4H9" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Why travel with us?</h2>
                    <p className="text-xs text-gray-500">Heading and up to four feature items</p>
                  </div>
                </div>
                <button
                  onClick={saveWhyUs}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-400 shadow-sm transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Heading</label>
                <input
                  type="text"
                  value={whyUs.heading}
                  onChange={(e) => setWhyUs(prev => ({ ...prev, heading: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md"
                  placeholder="WHY TRAVEL WITH US???"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Items</span>
                <button
                  type="button"
                  onClick={() => setWhyUs(prev => ({ ...prev, items: [...prev.items, { iconUrl: '', title: '', text: '' }] }))}
                  className="text-xs px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50"
                >
                  + Add Item
                </button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {whyUs.items.map((it, idx) => (
                  <div key={idx} className="rounded-lg border border-gray-200 p-3 space-y-2">
                    <div className="grid grid-cols-12 gap-2">
                      <input
                        type="text"
                        value={it.title}
                        onChange={(e) => {
                          const copy = [...whyUs.items]
                          copy[idx] = { ...copy[idx], title: e.target.value }
                          setWhyUs(prev => ({ ...prev, items: copy }))
                        }}
                        className="col-span-6 px-3 py-2 text-sm border border-gray-200 rounded-md"
                        placeholder="Retention"
                      />
                      <input
                        type="url"
                        value={it.iconUrl}
                        onChange={(e) => {
                          const copy = [...whyUs.items]
                          copy[idx] = { ...copy[idx], iconUrl: e.target.value }
                          setWhyUs(prev => ({ ...prev, items: copy }))
                        }}
                        className="col-span-6 px-3 py-2 text-sm border border-gray-200 rounded-md"
                        placeholder="Icon URL"
                      />
                      <div className="col-span-12">
                        <textarea
                          value={it.text}
                          onChange={(e) => {
                            const copy = [...whyUs.items]
                            copy[idx] = { ...copy[idx], text: e.target.value }
                            setWhyUs(prev => ({ ...prev, items: copy }))
                          }}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md"
                          rows={3}
                          placeholder="Short supporting paragraph"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-12 gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          const maxSize = 4 * 1024 * 1024
                          if (file.size > maxSize) { alert('File too large (max 4MB)'); return }
                          try {
                            const form = new FormData()
                            form.append('file', file)
                            form.append('slug', 'home')
                            form.append('folder', 'whyus')
                            const res = await fetch('/api/upload', { method: 'POST', body: form })
                            if (!res.ok) {
                              const err = await res.json().catch(() => ({}))
                              throw new Error(err.error || 'Upload failed')
                            }
                            const data = await res.json()
                            const copy = [...whyUs.items]
                            copy[idx] = { ...copy[idx], iconUrl: data.url }
                            setWhyUs(prev => ({ ...prev, items: copy }))
                          } catch (err) {
                            setError('Failed to upload icon')
                          }
                        }}
                        className="col-span-8 px-3 py-2 text-sm border border-gray-200 rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => setWhyUs(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }))}
                        className="col-span-4 text-xs text-red-600 hover:text-red-800"
                      >
                        Remove Item
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Trending Destinations */}
          <div className="bg-white border-2 border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-blue-700 rounded-lg flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zm10-10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1h-6a1 1 0 01-1-1V4zm0 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1h-6a1 1 0 01-1-1v-6z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Trending Destinations</h2>
                    <p className="text-xs text-gray-500">Cards with image, title, price and link</p>
                  </div>
                </div>
                <button
                  onClick={saveTrending}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-blue-700 hover:bg-blue-800 disabled:bg-gray-400 shadow-sm transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Cards</span>
                <button
                  type="button"
                  onClick={() => setTrending(prev => ([...prev, { title: '', imageUrl: '', priceText: '', strikeText: '', link: '' }]))}
                  className="text-xs px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50"
                >
                  + Add Card
                </button>
              </div>
              <div className="space-y-3">
                {trending.map((card, idx) => (
                  <div key={idx} className="rounded-lg border border-gray-200 p-3">
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <input
                        type="text"
                        value={card.title}
                        onChange={(e) => {
                          const copy = [...trending]
                          copy[idx] = { ...copy[idx], title: e.target.value }
                          setTrending(copy)
                        }}
                        className="col-span-3 px-3 py-2 text-sm border border-gray-200 rounded-md"
                        placeholder="Bali"
                      />
                      <input
                        type="text"
                        value={card.priceText}
                        onChange={(e) => {
                          const copy = [...trending]
                          copy[idx] = { ...copy[idx], priceText: e.target.value }
                          setTrending(copy)
                        }}
                        className="col-span-3 px-3 py-2 text-sm border border-gray-200 rounded-md"
                        placeholder="₹69,999/- onwards"
                      />
                      <input
                        type="text"
                        value={card.strikeText || ''}
                        onChange={(e) => {
                          const copy = [...trending]
                          copy[idx] = { ...copy[idx], strikeText: e.target.value }
                          setTrending(copy)
                        }}
                        className="col-span-2 px-3 py-2 text-sm border border-gray-200 rounded-md"
                        placeholder="₹79,999/-"
                      />
                      <input
                        type="url"
                        value={card.link || ''}
                        onChange={(e) => {
                          const copy = [...trending]
                          copy[idx] = { ...copy[idx], link: e.target.value }
                          setTrending(copy)
                        }}
                        className="col-span-4 px-3 py-2 text-sm border border-gray-200 rounded-md"
                        placeholder="Link (optional)"
                      />
                      <input
                        type="url"
                        value={card.imageUrl}
                        onChange={(e) => {
                          const copy = [...trending]
                          copy[idx] = { ...copy[idx], imageUrl: e.target.value }
                          setTrending(copy)
                        }}
                        className="col-span-8 px-3 py-2 text-sm border border-gray-200 rounded-md"
                        placeholder="Image URL"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          const maxSize = 4 * 1024 * 1024
                          if (file.size > maxSize) { alert('File too large (max 4MB)'); return }
                          try {
                            const form = new FormData()
                            form.append('file', file)
                            form.append('slug', 'home')
                            form.append('folder', 'trending')
                            const res = await fetch('/api/upload', { method: 'POST', body: form })
                            if (!res.ok) {
                              const err = await res.json().catch(() => ({}))
                              throw new Error(err.error || 'Upload failed')
                            }
                            const data = await res.json()
                            const copy = [...trending]
                            copy[idx] = { ...copy[idx], imageUrl: data.url }
                            setTrending(copy)
                          } catch (err) {
                            setError('Failed to upload image')
                          }
                        }}
                        className="col-span-3 px-3 py-2 text-sm border border-gray-200 rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => setTrending(prev => prev.filter((_, i) => i !== idx))}
                        className="col-span-1 text-xs text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Privacy Policy */}
          <div className="bg-white border-2 border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gray-700 rounded-lg flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c.5304 0 1.0391.2107 1.4142.5858C13.7893 11.9609 14 12.4696 14 13v5h-4v-5c0-.5304.2107-1.0391.5858-1.4142C10.9609 11.2107 11.4696 11 12 11zm0-7a4 4 0 00-4 4v2H6v10h12V10h-2V8a4 4 0 00-4-4z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Privacy Policy</h2>
                    <p className="text-xs text-gray-500">Title, last updated date and rich text</p>
                  </div>
                </div>
                <button
                  onClick={savePrivacy}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-gray-700 hover:bg-gray-800 disabled:bg-gray-400 shadow-sm transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                  <input
                    type="text"
                    value={privacy.title}
                    onChange={(e) => setPrivacy(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md"
                    placeholder="Privacy Policy"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Updated</label>
                  <input
                    type="date"
                    value={privacy.lastUpdated}
                    onChange={(e) => setPrivacy(prev => ({ ...prev, lastUpdated: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Content</label>
                <textarea
                  value={privacy.content}
                  onChange={(e) => setPrivacy(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md h-64"
                  placeholder="Enter policy content (supports line breaks and basic formatting)"
                />
              </div>
              {/* Point-wise sections */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Point-wise Sections</span>
                  <button
                    type="button"
                    onClick={() => setPrivacy(prev => ({ ...prev, sections: [...prev.sections, { heading: '', bullets: [''] }] }))}
                    className="text-xs px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50"
                  >
                    + Add Section
                  </button>
                </div>
                <div className="space-y-3">
                  {privacy.sections.map((sec, sIdx) => (
                    <div key={sIdx} className="rounded-lg border border-gray-200 p-3 space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={sec.heading}
                          onChange={(e) => {
                            const copy = [...privacy.sections]
                            copy[sIdx] = { ...copy[sIdx], heading: e.target.value }
                            setPrivacy(prev => ({ ...prev, sections: copy }))
                          }}
                          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md"
                          placeholder="Section heading (e.g., 1. Information We Collect)"
                        />
                        <button
                          type="button"
                          onClick={() => setPrivacy(prev => ({ ...prev, sections: prev.sections.filter((_, i) => i !== sIdx) }))}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="space-y-2">
                        {sec.bullets.map((b, bIdx) => (
                          <div key={bIdx} className="flex gap-2">
                            <input
                              type="text"
                              value={b}
                              onChange={(e) => {
                                const copy = [...privacy.sections]
                                const bullets = [...copy[sIdx].bullets]
                                bullets[bIdx] = e.target.value
                                copy[sIdx] = { ...copy[sIdx], bullets }
                                setPrivacy(prev => ({ ...prev, sections: copy }))
                              }}
                              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md"
                              placeholder="Bullet point text"
                            />
                            <button
                              type="button"
                              onClick={() => setPrivacy(prev => {
                                const copy = [...prev.sections]
                                const bullets = [...copy[sIdx].bullets]
                                bullets.splice(bIdx, 1)
                                copy[sIdx] = { ...copy[sIdx], bullets }
                                return { ...prev, sections: copy }
                              })}
                              className="text-xs text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setPrivacy(prev => {
                            const copy = [...prev.sections]
                            copy[sIdx] = { ...copy[sIdx], bullets: [...copy[sIdx].bullets, ''] }
                            return { ...prev, sections: copy }
                          })}
                          className="text-xs px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50"
                        >
                          + Add Bullet
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="bg-white border-2 border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gray-800 rounded-lg flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Terms & Conditions</h2>
                    <p className="text-xs text-gray-500">Title, last updated, intro and point-wise sections</p>
                  </div>
                </div>
                <button
                  onClick={saveTerms}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-gray-800 hover:bg-black disabled:bg-gray-400 shadow-sm transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                  <input
                    type="text"
                    value={terms.title}
                    onChange={(e) => setTerms(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md"
                    placeholder="Terms and Conditions"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Updated</label>
                  <input
                    type="date"
                    value={terms.lastUpdated}
                    onChange={(e) => setTerms(prev => ({ ...prev, lastUpdated: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Intro</label>
                <textarea
                  value={terms.intro}
                  onChange={(e) => setTerms(prev => ({ ...prev, intro: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md"
                  rows={3}
                  placeholder="By using Travloger’s services, you agree to be bound..."
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Point-wise Sections</span>
                  <button
                    type="button"
                    onClick={() => setTerms(prev => ({ ...prev, sections: [...prev.sections, { heading: '', bullets: [''] }] }))}
                    className="text-xs px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50"
                  >
                    + Add Section
                  </button>
                </div>
                <div className="space-y-3">
                  {terms.sections.map((sec, sIdx) => (
                    <div key={sIdx} className="rounded-lg border border-gray-200 p-3 space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={sec.heading}
                          onChange={(e) => {
                            const copy = [...terms.sections]
                            copy[sIdx] = { ...copy[sIdx], heading: e.target.value }
                            setTerms(prev => ({ ...prev, sections: copy }))
                          }}
                          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md"
                          placeholder="Section heading (e.g., 1. Service Description)"
                        />
                        <button
                          type="button"
                          onClick={() => setTerms(prev => ({ ...prev, sections: prev.sections.filter((_, i) => i !== sIdx) }))}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="space-y-2">
                        {sec.bullets.map((b, bIdx) => (
                          <div key={bIdx} className="flex gap-2">
                            <input
                              type="text"
                              value={b}
                              onChange={(e) => {
                                const copy = [...terms.sections]
                                const bullets = [...copy[sIdx].bullets]
                                bullets[bIdx] = e.target.value
                                copy[sIdx] = { ...copy[sIdx], bullets }
                                setTerms(prev => ({ ...prev, sections: copy }))
                              }}
                              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md"
                              placeholder="Bullet point text"
                            />
                            <button
                              type="button"
                              onClick={() => setTerms(prev => {
                                const copy = [...prev.sections]
                                const bullets = [...copy[sIdx].bullets]
                                bullets.splice(bIdx, 1)
                                copy[sIdx] = { ...copy[sIdx], bullets }
                                return { ...prev, sections: copy }
                              })}
                              className="text-xs text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setTerms(prev => {
                            const copy = [...prev.sections]
                            copy[sIdx] = { ...copy[sIdx], bullets: [...copy[sIdx].bullets, ''] }
                            return { ...prev, sections: copy }
                          })}
                          className="text-xs px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50"
                        >
                          + Add Bullet
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Copyright & Content Policy */}
          <div className="bg-white border-2 border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-indigo-700 rounded-lg flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3m0-6a3 3 0 110 6m-9 0a9 9 0 1118 0 9 9 0 01-18 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Copyright & Content Policy</h2>
                    <p className="text-xs text-gray-500">Intro and point-wise sections</p>
                  </div>
                </div>
                <button
                  onClick={saveCopyrightPolicy}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-indigo-700 hover:bg-indigo-800 disabled:bg-gray-400 shadow-sm transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                <input
                  type="text"
                  value={copyrightPolicy.title}
                  onChange={(e) => setCopyrightPolicy(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md"
                  placeholder="Copyright & Content Policy"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Intro</label>
                <textarea
                  value={copyrightPolicy.intro}
                  onChange={(e) => setCopyrightPolicy(prev => ({ ...prev, intro: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md"
                  rows={3}
                  placeholder="High-level policy introduction"
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Point-wise Sections</span>
                  <button
                    type="button"
                    onClick={() => setCopyrightPolicy(prev => ({ ...prev, sections: [...prev.sections, { heading: '', bullets: [''] }] }))}
                    className="text-xs px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50"
                  >
                    + Add Section
                  </button>
                </div>
                <div className="space-y-3">
                  {copyrightPolicy.sections.map((sec, sIdx) => (
                    <div key={sIdx} className="rounded-lg border border-gray-200 p-3 space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={sec.heading}
                          onChange={(e) => {
                            const copy = [...copyrightPolicy.sections]
                            copy[sIdx] = { ...copy[sIdx], heading: e.target.value }
                            setCopyrightPolicy(prev => ({ ...prev, sections: copy }))
                          }}
                          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md"
                          placeholder="Section heading (e.g., Intellectual Property Rights)"
                        />
                        <button
                          type="button"
                          onClick={() => setCopyrightPolicy(prev => ({ ...prev, sections: prev.sections.filter((_, i) => i !== sIdx) }))}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="space-y-2">
                        {sec.bullets.map((b, bIdx) => (
                          <div key={bIdx} className="flex gap-2">
                            <input
                              type="text"
                              value={b}
                              onChange={(e) => {
                                const copy = [...copyrightPolicy.sections]
                                const bullets = [...copy[sIdx].bullets]
                                bullets[bIdx] = e.target.value
                                copy[sIdx] = { ...copy[sIdx], bullets }
                                setCopyrightPolicy(prev => ({ ...prev, sections: copy }))
                              }}
                              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md"
                              placeholder="Bullet point text"
                            />
                            <button
                              type="button"
                              onClick={() => setCopyrightPolicy(prev => {
                                const copy = [...prev.sections]
                                const bullets = [...copy[sIdx].bullets]
                                bullets.splice(bIdx, 1)
                                copy[sIdx] = { ...copy[sIdx], bullets }
                                return { ...prev, sections: copy }
                              })}
                              className="text-xs text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setCopyrightPolicy(prev => {
                            const copy = [...prev.sections]
                            copy[sIdx] = { ...copy[sIdx], bullets: [...copy[sIdx].bullets, ''] }
                            return { ...prev, sections: copy }
                          })}
                          className="text-xs px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50"
                        >
                          + Add Bullet
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MainWebsiteEdit
