/**
 * app/api/products/upload/route.ts
 *
 * POST /api/products/upload
 *   Accepts a multipart/form-data body with a single "file" field.
 *   Validates type (JPEG, PNG, WebP, GIF) and size (max 2 MB).
 *   Saves the file to /public/uploads/products/ with a UUID filename.
 *   Returns { url: "/uploads/products/<uuid>.<ext>" }
 *
 * For production deployments, swap the writeFile logic with an S3
 * PutObjectCommand and return the S3 URL — the rest of the app is unchanged.
 *
 * Authentication: required (enforced by middleware.ts).
 */
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import log from '@/lib/logger'

const ALLOWED_TYPES = ['image/jpeg', 'image/pjpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif']
const MAX_SIZE_BYTES = 2 * 1024 * 1024 // 2 MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    const fileAllowed = ALLOWED_TYPES.includes(file.type) || ALLOWED_EXTENSIONS.includes(ext)

    if (!fileAllowed) {
      return NextResponse.json(
        { error: 'Only JPG, JPEG, PNG, WebP, or GIF images are allowed.' },
        { status: 400 },
      )
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'Image must be under 2 MB.' },
        { status: 400 },
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const filename = `${crypto.randomUUID()}.${ext || 'jpg'}`
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products')

    await mkdir(uploadDir, { recursive: true })
    await writeFile(path.join(uploadDir, filename), buffer)

    const url = `${request.nextUrl.origin}/uploads/products/${filename}`
    log.info({ filename, url, route: 'POST /api/products/upload' }, 'Product image uploaded')
    return NextResponse.json({ url })
  } catch (err) {
    log.error({ err, route: 'POST /api/products/upload' }, 'Failed to upload image')
    const message = err instanceof Error ? err.message : 'Upload failed.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
