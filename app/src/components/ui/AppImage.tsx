'use client'

import Image, { ImageProps } from 'next/image'

function isUploadedImage(src: string) {
  return src.startsWith('/uploads/')
}

type Props = ImageProps

export function AppImage(props: Props) {
  const { src, alt, className, fill, width, height, sizes, style, ...rest } = props
  const srcValue = typeof src === 'string' ? src : src.toString()

  if (isUploadedImage(srcValue)) {
    if (fill) {
      return (
        <img
          src={srcValue}
          alt={alt}
          className={className}
          sizes={sizes}
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
        src={srcValue}
        alt={alt}
        width={typeof width === 'number' ? width : undefined}
        height={typeof height === 'number' ? height : undefined}
        className={className}
        sizes={sizes}
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
      {...rest}
    />
  )
}
