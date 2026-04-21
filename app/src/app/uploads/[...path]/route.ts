import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { extname, join, resolve } from 'path'

const UPLOAD_ROOT = join(process.cwd(), 'uploads')
const LEGACY_UPLOAD_ROOT = join(process.cwd(), 'public', 'uploads')

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

export async function GET(_req: NextRequest, context: { params: { path: string[] } }) {
  const result = await readUploadFile(context.params.path)

  if (!result) {
    return new NextResponse('Not found', { status: 404 })
  }

  return new NextResponse(result.file, {
    status: 200,
    headers: {
      'Content-Type': getContentType(result.path),
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  })
}
