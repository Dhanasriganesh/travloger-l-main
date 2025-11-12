import { NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function requireEnv(name: string): string {
	const value = process.env[name]
	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`)
	}
	return value
}

export async function POST(request: Request) {
	try {
		// AWS S3 Configuration
		const awsAccessKeyId = requireEnv('AWS_ACCESS_KEY_ID')
		const awsSecretAccessKey = requireEnv('AWS_SECRET_ACCESS_KEY')
		const awsRegion = process.env.AWS_REGION || 'ap-south-1'
		const awsBucket = process.env.AWS_S3_BUCKET || 'travloger-media-storage'
		
		console.log('Upload API - AWS Region:', awsRegion)
		console.log('Upload API - AWS Bucket:', awsBucket)
		console.log('Upload API - AWS Access Key:', awsAccessKeyId ? 'SET' : 'MISSING')

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
		const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024 // 50MB for videos, 10MB for images
		if (file.size > maxSize) {
			return NextResponse.json({ 
				error: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.` 
			}, { status: 413 })
		}

		// Initialize S3 Client
		const s3Client = new S3Client({
			region: awsRegion,
			credentials: {
				accessKeyId: awsAccessKeyId,
				secretAccessKey: awsSecretAccessKey,
			},
		})

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
		console.log('Upload API - Final Path:', finalPath)

		// Convert file to buffer
		const arrayBuffer = await file.arrayBuffer()
		const buffer = Buffer.from(arrayBuffer)

		// Upload to S3
		const uploadCommand = new PutObjectCommand({
			Bucket: awsBucket,
			Key: finalPath,
			Body: buffer,
			ContentType: file.type || 'application/octet-stream',
		})

		await s3Client.send(uploadCommand)

		// Generate public URL
		const publicUrl = `https://${awsBucket}.s3.${awsRegion}.amazonaws.com/${finalPath}`
		
		console.log('Upload API - Success! URL:', publicUrl)
		return NextResponse.json({ 
			ok: true, 
			url: publicUrl, 
			path: finalPath,
			bucket: awsBucket,
			region: awsRegion
		})
	} catch (e: any) {
		console.error('Upload API - Error:', e)
		return NextResponse.json({ 
			error: e?.message || 'Upload failed',
			details: e?.stack
		}, { status: 500 })
	}
}
