import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getEnv(name: string): string {
	const value = process.env[name]
	if (!value) {
		console.warn(`Missing env var: ${name}, using fallback`)
		// Provide fallback values for build time
		if (name === 'NEXT_PUBLIC_SUPABASE_URL') return 'https://your-project.supabase.co'
		if (name === 'SUPABASE_SERVICE_ROLE_KEY') return 'your-service-role-key'
		return ''
	}
	return value
}

export async function POST(request: Request) {
	try {
		const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL')
		const serviceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')
		const bucket = process.env.SUPABASE_PUBLIC_BUCKET || 'city-assets'
		const tripOptionsBucket = process.env.SUPABASE_TRIPOPTIONS_BUCKET || 'tripoptions'
		
		console.log('Upload API - Supabase URL:', supabaseUrl ? 'SET' : 'MISSING')
		console.log('Upload API - Service Key:', serviceKey ? 'SET' : 'MISSING')
		console.log('Upload API - City Bucket:', bucket)
		console.log('Upload API - Trip Options Bucket:', tripOptionsBucket)

		const form = await request.formData()
		const file = form.get('file') as File | null
		const slug = (form.get('slug') as string | null) || 'common'
		const folder = (form.get('folder') as string | null) || 'hero'
		const path = form.get('path') as string | null

		if (!file) {
			return NextResponse.json({ error: 'file is required' }, { status: 400 })
		}

		// Check file size - different limits for images vs videos
		const isVideo = file.type.startsWith('video/')
		const maxSize = isVideo ? 20 * 1024 * 1024 : 4 * 1024 * 1024 // 20MB for videos, 4MB for images
		if (file.size > maxSize) {
			return NextResponse.json({ 
				error: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.` 
			}, { status: 413 })
		}

		const supabase = createClient(supabaseUrl, serviceKey)

		// Determine bucket based on path
		let targetBucket = bucket
		if (path && path.includes('trip-options')) {
			targetBucket = tripOptionsBucket
		} else if (path && path.includes('brands')) {
			targetBucket = bucket // Use city-assets bucket for brand logos
		}

		// Use provided path or generate deterministic path: folder/slug/timestamp-filename
		let finalPath: string
		if (path) {
			const timestamp = Date.now()
			const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_') || 'upload'
			finalPath = `${path}/${timestamp}-${safeName}`
		} else {
			const timestamp = Date.now()
			const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_') || 'upload'
			finalPath = `${folder}/${slug}/${timestamp}-${safeName}`
		}
		
		console.log('Upload API - File:', file.name, 'Size:', file.size, 'Type:', file.type)
		console.log('Upload API - Target Bucket:', targetBucket)
		console.log('Upload API - Final Path:', finalPath)

		const arrayBuffer = await file.arrayBuffer()
		const { error: uploadError } = await supabase.storage
			.from(targetBucket)
			.upload(finalPath, Buffer.from(arrayBuffer), {
				upsert: true,
				contentType: file.type || 'application/octet-stream'
			})

		if (uploadError) {
			console.log('Upload API - Upload error:', uploadError)
			return NextResponse.json({ error: uploadError.message }, { status: 500 })
		}

		const { data } = supabase.storage.from(targetBucket).getPublicUrl(finalPath)
		console.log('Upload API - Success! URL:', data.publicUrl)
		return NextResponse.json({ ok: true, url: data.publicUrl, path: finalPath })
	} catch (e: any) {
		return NextResponse.json({ error: e?.message || 'Upload failed' }, { status: 500 })
	}
}


