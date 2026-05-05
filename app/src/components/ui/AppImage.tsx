'use client'

import Image, { ImageProps } from 'next/image'
import {
  buildUploadedImageSrcSet,
  getUploadedImageFallbackSrc,
  getUploadedImageSizes,
  isUploadedImagePath,
  type UploadedImageVariant,
} from '@/lib/media'

type Props = ImageProps & {
  variant?: UploadedImageVariant
}

export function AppImage(props: Props) {
  const {
    src,
    alt,
    className,
    fill,
    width,
    height,
    sizes,
    style,
    priority,
    variant = 'content',
    ...rest
  } = props
  const srcValue = typeof src === 'string' ? src : src.toString()

  if (isUploadedImagePath(srcValue)) {
    const uploadedSizes = sizes || getUploadedImageSizes(variant)
    const uploadedSrc = getUploadedImageFallbackSrc(srcValue, variant)
    const uploadedSrcSet = buildUploadedImageSrcSet(srcValue, variant)
    const loading = priority ? undefined : 'lazy'

    if (fill) {
      return (
        <img
          src={uploadedSrc}
          srcSet={uploadedSrcSet}
          sizes={uploadedSizes}
          alt={alt}
          className={className}
          loading={loading}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            ...style,
          }}
        />
      )
    }

    return (
      <img
        src={uploadedSrc}
        srcSet={uploadedSrcSet}
        sizes={uploadedSizes}
        alt={alt}
        width={typeof width === 'number' ? width : undefined}
        height={typeof height === 'number' ? height : undefined}
        className={className}
        loading={loading}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        style={style}
      />
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      fill={fill}
      width={width}
      height={height}
      sizes={sizes}
      style={style}
      priority={priority}
      {...rest}
    />
  )
}
