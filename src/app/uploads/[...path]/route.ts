import { NextRequest, NextResponse } from 'next/server'
import { mkdir, readFile, writeFile } from 'fs/promises'
import { extname, join, parse, resolve } from 'path'
import sharp from 'sharp'

const UPLOAD_ROOT = join(process.cwd(), 'uploads')
const LEGACY_UPLOAD_ROOT = join(process.cwd(), 'public', 'uploads')
const DERIVED_ROOT = join(UPLOAD_ROOT, '.derived')
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'])

function getContentType(path: string) {
  switch (extname(path).toLowerCase()) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.png':
      return 'image/png'
    case '.webp':
      return 'image/webp'
    case '.gif':
      return 'image/gif'
    case '.avif':
      return 'image/avif'
    case '.mp4':
      return 'video/mp4'
    case '.webm':
      return 'video/webm'
    case '.mov':
      return 'video/quicktime'
    default:
      return 'application/octet-stream'
  }
}

async function readUploadFile(parts: string[]) {
  const normalizedParts = parts
    .map((part) => part.replace(/[^a-zA-Z0-9._-]/g, ''))
    .filter(Boolean)

  if (normalizedParts.length === 0) {
    return null
  }

  const primaryPath = resolve(UPLOAD_ROOT, ...normalizedParts)
  const legacyPath = resolve(LEGACY_UPLOAD_ROOT, ...normalizedParts)
  const primaryRoot = resolve(UPLOAD_ROOT)
  const legacyRoot = resolve(LEGACY_UPLOAD_ROOT)

  if (!primaryPath.startsWith(primaryRoot) || !legacyPath.startsWith(legacyRoot)) {
    return null
  }

  try {
    const file = await readFile(primaryPath)
    return { file, path: primaryPath }
  } catch {
    try {
      const file = await readFile(legacyPath)
      return { file, path: legacyPath }
    } catch {
      return null
    }
  }
}

function isImageFile(path: string) {
  return IMAGE_EXTENSIONS.has(extname(path).toLowerCase())
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getTransformOptions(req: NextRequest) {
  const widthParam = req.nextUrl.searchParams.get('w')
  const qualityParam = req.nextUrl.searchParams.get('q')
  const formatParam = req.nextUrl.searchParams.get('fm')

  const width = widthParam ? clamp(Number.parseInt(widthParam, 10), 32, 2400) : null
  const quality = qualityParam ? clamp(Number.parseInt(qualityParam, 10), 40, 90) : 76
  
  let format: 'webp' | 'avif' | null = (formatParam === 'webp' || formatParam === 'avif') ? formatParam : null
  
  if (!format) {
    const accept = req.headers.get('accept') || ''
    if (accept.includes('image/avif')) {
      format = 'avif'
    } else if (accept.includes('image/webp')) {
      format = 'webp'
    } else {
      format = 'webp'
    }
  }

  if (!width || !Number.isFinite(width) || !format) {
    return null
  }

  return { width, quality, format }
}

async function readDerivedImage(parts: string[], transform: { width: number; quality: number; format: 'webp' | 'avif' }, sourcePath: string) {
  const base = parse(parts[parts.length - 1])
  const nestedParts = parts.slice(0, -1)
  const derivedDir = resolve(DERIVED_ROOT, ...nestedParts)
  const derivedRoot = resolve(DERIVED_ROOT)

  if (!derivedDir.startsWith(derivedRoot)) {
    return null
  }

  await mkdir(derivedDir, { recursive: true })

  const derivedFilename = `${base.name}.w${transform.width}.q${transform.quality}.${transform.format}`
  const derivedPath = resolve(derivedDir, derivedFilename)

  if (!derivedPath.startsWith(derivedRoot)) {
    return null
  }

  try {
    const file = await readFile(derivedPath)
    return { file, path: derivedPath, derived: true }
  } catch {
    const sourceBuffer = await readFile(sourcePath)
    let pipeline = sharp(sourceBuffer)
      .rotate()
      .resize({
        width: transform.width,
        withoutEnlargement: true,
      })

    if (transform.format === 'avif') {
      pipeline = pipeline.avif({ quality: Math.max(transform.quality - 15, 30) }) // AVIF can be heavily compressed and look good
    } else {
      pipeline = pipeline.webp({ quality: transform.quality })
    }

    const transformed = await pipeline.toBuffer()

    await writeFile(derivedPath, transformed)

    return { file: transformed, path: derivedPath, derived: true }
  }
}

export async function GET(req: NextRequest, context: { params: { path: string[] } }) {
  const result = await readUploadFile(context.params.path)

  if (!result) {
    return new NextResponse('Not found', { status: 404 })
  }

  const transform = getTransformOptions(req)
  const transformedResult =
    transform && isImageFile(result.path)
      ? await readDerivedImage(context.params.path, transform, result.path)
      : null

  const fileResult = transformedResult || result

  return new NextResponse(new Uint8Array(fileResult.file), {
    status: 200,
    headers: {
      'Content-Type': getContentType(fileResult.path),
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
