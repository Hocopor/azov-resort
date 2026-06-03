import { CSSProperties } from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { getSettings, normalizeSiteAddress } from '@/lib/settings'
import { formatMoney } from '@/lib/utils'
import { getRoomPriceRange, normalizeRoomPricePeriods } from '@/lib/pricing'
import { AppImage } from '@/components/ui/AppImage'
import {
  Waves, Star, Shield, Car, Bike, Wifi, ChefHat,
  ArrowRight, Sun, Wind, MapPin, Calendar, Users, CheckCircle,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Гостевой дом на Азовском море — отдых у моря, номера, цены',
}

export const revalidate = 60

function getSettingColor(value: string | undefined, fallback: string) {
  const normalized = value?.trim()
  return normalized ? normalized : fallback
}

function buildOutlineTextStyle(strokeColor: string, strokeWidth: number, baseShadow: string) {
  if (!(strokeWidth > 0)) return undefined
  return {
    textShadow: [
      `${strokeWidth}px 0 0 ${strokeColor}`,
      `${-strokeWidth}px 0 0 ${strokeColor}`,
      `0 ${strokeWidth}px 0 ${strokeColor}`,
      `0 ${-strokeWidth}px 0 ${strokeColor}`,
      `${strokeWidth}px ${strokeWidth}px 0 ${strokeColor}`,
      `${-strokeWidth}px ${strokeWidth}px 0 ${strokeColor}`,
      `${strokeWidth}px ${-strokeWidth}px 0 ${strokeColor}`,
      `${-strokeWidth}px ${-strokeWidth}px 0 ${strokeColor}`,
      baseShadow,
    ].join(', '),
  } as CSSProperties
}

function pickHomeReviews<T>(items: T[]) {
  const pool = [...items]
  pool.sort(() => Math.random() - 0.5)
  return pool.slice(0, 3)
}

async function getHomeData() {
  const [rooms, settings, reviews] = await Promise.all([
    prisma.room.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      take: 4,
      include: { pricePeriods: { orderBy: { dateFrom: 'asc' } } },
    }),
    getSettings([
      'hero_title', 'hero_subtitle', 'about_text', 'site_name', 'site_phone', 'site_address',
      'hero_bg_image', 'about_image_1', 'about_image_2', 'about_image_3', 'about_image_4',
      'hero_badge_bg', 'hero_badge_border', 'hero_badge_text',
      'hero_title_color', 'hero_title_stroke_color', 'hero_title_stroke_width',
      'hero_subtitle_color', 'hero_subtitle_stroke_color', 'hero_subtitle_stroke_width',
      'hero_filter_color', 'hero_filter_opacity',
      'hero_stat_value_color', 'hero_stat_value_stroke_color', 'hero_stat_value_stroke_width',
      'hero_stat_label_color', 'hero_stat_label_stroke_color', 'hero_stat_label_stroke_width',
      'hero_primary_button_bg', 'hero_primary_button_hover', 'hero_primary_button_text',
      'hero_secondary_button_bg', 'hero_secondary_button_hover', 'hero_secondary_button_text',
      'hero_secondary_button_border',
    ]),
    prisma.review.findMany({
      where: { published: true, rating: { gte: 4 } },
      include: { user: { select: { name: true } } },
      orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }],
      take: 12,
    }),
  ])
  return { rooms, settings, reviews: pickHomeReviews(reviews) }
}

export default async function HomePage() {
  const { rooms, settings, reviews } = await getHomeData()
  const heroBackground = settings.hero_bg_image || '/images/general/hero-bg.jpg'
  const hasCustomHeroImage = Boolean(settings.hero_bg_image)
  const aboutImages = [
    settings.about_image_1 || '/images/general/about-1.jpg',
    settings.about_image_2 || '/images/general/about-2.jpg',
    settings.about_image_3 || '/images/general/about-3.jpg',
    settings.about_image_4 || '/images/general/about-4.jpg',
  ]
  const siteAddress = normalizeSiteAddress(settings.site_address)

  const features = [
    { icon: Waves,   label: 'Море рядом',            desc: 'Пляж в 5 минутах ходьбы',                    color: 'text-sea-600 bg-sea-50' },
    { icon: Wifi,    label: 'Бесплатный Wi-Fi',       desc: 'На всей территории',                          color: 'text-blue-600 bg-blue-50' },
    { icon: Car,     label: 'Трансфер',               desc: 'Организуем до нас и обратно',                 color: 'text-green-600 bg-green-50' },
    { icon: Bike,    label: 'Велосипеды и сапборды',  desc: 'Бесплатно для всех гостей',                   color: 'text-orange-600 bg-orange-50' },
    { icon: Shield,  label: 'Спокойствие и уют',      desc: 'Уютная атмосфера для отдыха',                 color: 'text-purple-600 bg-purple-50' },
    { icon: ChefHat, label: 'Номера с кухней',        desc: 'Прям как дома, только у моря',                color: 'text-coral-600 bg-coral-50' },
  ]

  // Hero style computation
  const heroTitleStrokeColor = getSettingColor(settings.hero_title_stroke_color, '#5f432d')
  const heroTitleStrokeWidth = hasCustomHeroImage ? Number.parseFloat(settings.hero_title_stroke_width || '1.5') : 0
  const safeHeroTitleStrokeWidth = Number.isFinite(heroTitleStrokeWidth) ? Math.max(heroTitleStrokeWidth, 0) : 0
  const heroSubtitleStrokeColor = getSettingColor(settings.hero_subtitle_stroke_color, '#3d3126')
  const heroSubtitleStrokeWidth = hasCustomHeroImage ? Number.parseFloat(settings.hero_subtitle_stroke_width || '0') : 0
  const safeHeroSubtitleStrokeWidth = Number.isFinite(heroSubtitleStrokeWidth) ? Math.max(heroSubtitleStrokeWidth, 0) : 0
  const heroStatValueStrokeColor = getSettingColor(settings.hero_stat_value_stroke_color, '#4d3927')
  const heroStatValueStrokeWidth = hasCustomHeroImage ? Number.parseFloat(settings.hero_stat_value_stroke_width || '0') : 0
  const safeHeroStatValueStrokeWidth = Number.isFinite(heroStatValueStrokeWidth) ? Math.max(heroStatValueStrokeWidth, 0) : 0
  const heroStatLabelStrokeColor = getSettingColor(settings.hero_stat_label_stroke_color, '#3d3126')
  const heroStatLabelStrokeWidth = hasCustomHeroImage ? Number.parseFloat(settings.hero_stat_label_stroke_width || '0') : 0
  const safeHeroStatLabelStrokeWidth = Number.isFinite(heroStatLabelStrokeWidth) ? Math.max(heroStatLabelStrokeWidth, 0) : 0
  const heroFilterColor = getSettingColor(settings.hero_filter_color, '#102131')
  const heroFilterOpacity = hasCustomHeroImage ? Number.parseFloat(settings.hero_filter_opacity || '0') : 0
  const safeHeroFilterOpacity = Number.isFinite(heroFilterOpacity) ? Math.min(Math.max(heroFilterOpacity, 0), 100) / 100 : 0

  const heroTitleStyle = buildOutlineTextStyle(heroTitleStrokeColor, safeHeroTitleStrokeWidth, '0 4px 18px rgba(0,0,0,0.32)')
  const heroSubtitleStyle = buildOutlineTextStyle(heroSubtitleStrokeColor, safeHeroSubtitleStrokeWidth, '0 2px 10px rgba(0,0,0,0.28)')
  const heroStatValueStyle = buildOutlineTextStyle(heroStatValueStrokeColor, safeHeroStatValueStrokeWidth, '0 2px 10px rgba(0,0,0,0.24)')
  const heroStatLabelStyle = buildOutlineTextStyle(heroStatLabelStrokeColor, safeHeroStatLabelStrokeWidth, '0 2px 8px rgba(0,0,0,0.2)')

  const heroStyleVars = hasCustomHeroImage
    ? ({
        '--hero-badge-bg':               getSettingColor(settings.hero_badge_bg,               'rgba(58,69,34,0.48)'),
        '--hero-badge-border':           getSettingColor(settings.hero_badge_border,           'rgba(255,248,231,0.24)'),
        '--hero-badge-text':             getSettingColor(settings.hero_badge_text,             '#fff6e8'),
        '--hero-title-color':            getSettingColor(settings.hero_title_color,            '#fff8ef'),
        '--hero-subtitle-color':         getSettingColor(settings.hero_subtitle_color,         '#f8ead7'),
        '--hero-stat-value-color':       getSettingColor(settings.hero_stat_value_color,       '#fff7ec'),
        '--hero-stat-label-color':       getSettingColor(settings.hero_stat_label_color,       '#f3e3cb'),
        '--hero-primary-button-bg':      getSettingColor(settings.hero_primary_button_bg,      '#db7a4e'),
        '--hero-primary-button-hover':   getSettingColor(settings.hero_primary_button_hover,   '#cb6c42'),
        '--hero-primary-button-text':    getSettingColor(settings.hero_primary_button_text,    '#fffaf3'),
        '--hero-secondary-button-bg':    getSettingColor(settings.hero_secondary_button_bg,    'rgba(70,49,31,0.56)'),
        '--hero-secondary-button-hover': getSettingColor(settings.hero_secondary_button_hover, 'rgba(70,49,31,0.72)'),
        '--hero-secondary-button-text':  getSettingColor(settings.hero_secondary_button_text,  '#fff4e4'),
        '--hero-secondary-button-border':getSettingColor(settings.hero_secondary_button_border,'rgba(255,241,220,0.28)'),
      } as CSSProperties)
    : undefined

  const heroBadgeClassName = hasCustomHeroImage
    ? 'inline-flex items-center gap-2 px-4 py-2 bg-[var(--hero-badge-bg)] backdrop-blur-sm rounded-full text-sm font-medium mb-6 border border-[color:var(--hero-badge-border)] text-[var(--hero-badge-text)] shadow-[0_10px_28px_rgba(0,0,0,0.18)]'
    : 'inline-flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm rounded-full text-sm font-medium mb-6 border border-white/20'

  const heroTitleClassName = hasCustomHeroImage
    ? 'font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-5 text-[var(--hero-title-color)]'
    : 'font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-5'

  const heroSubtitleClassName = hasCustomHeroImage
    ? 'text-base sm:text-lg text-[var(--hero-subtitle-color)] leading-relaxed mb-8 max-w-lg drop-shadow-[0_2px_10px_rgba(0,0,0,0.28)]'
    : 'text-base sm:text-lg text-white/80 leading-relaxed mb-8 max-w-lg'

  const heroStatValueClassName = hasCustomHeroImage
    ? 'text-2xl sm:text-3xl font-display font-bold text-[var(--hero-stat-value-color)] drop-shadow-[0_2px_10px_rgba(0,0,0,0.24)]'
    : 'text-2xl sm:text-3xl font-display font-bold'

  const heroStatLabelClassName = hasCustomHeroImage
    ? 'text-xs text-[var(--hero-stat-label-color)] drop-shadow-[0_2px_8px_rgba(0,0,0,0.2)]'
    : 'text-xs text-white/60'

  const heroPrimaryButtonClassName = hasCustomHeroImage
    ? 'inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[var(--hero-primary-button-bg)] hover:bg-[var(--hero-primary-button-hover)] text-[var(--hero-primary-button-text)] font-bold rounded-xl text-base sm:text-lg transition-all duration-200 hover:-translate-y-px hover:shadow-lg'
    : 'inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-coral-500 hover:bg-coral-600 text-white font-bold rounded-xl text-base sm:text-lg transition-all duration-200 hover:-translate-y-px hover:shadow-lg'

  const heroSecondaryButtonClassName = hasCustomHeroImage
    ? 'inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[var(--hero-secondary-button-bg)] hover:bg-[var(--hero-secondary-button-hover)] backdrop-blur-sm text-[var(--hero-secondary-button-text)] font-bold rounded-xl text-base sm:text-lg transition-all duration-200 border border-[color:var(--hero-secondary-button-border)]'
    : 'inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white font-bold rounded-xl text-base sm:text-lg transition-all duration-200 border border-white/25'

  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative min-h-[100dvh] flex items-center overflow-hidden">
        <div className={`absolute inset-0 ${hasCustomHeroImage ? 'bg-deep-900' : 'bg-gradient-to-br from-deep-900 via-sea-800 to-deep-700'}`}>
          <AppImage
            src={heroBackground}
            alt="Азовское море"
            fill
            className={hasCustomHeroImage ? 'object-cover' : 'object-cover opacity-30 mix-blend-overlay'}
            priority
          />
          {hasCustomHeroImage && safeHeroFilterOpacity > 0 && (
            <div className="absolute inset-0" style={{ backgroundColor: heroFilterColor, opacity: safeHeroFilterOpacity }} />
          )}
          <div className="bubble w-4 h-4 left-[10%]"  style={{ animationDuration: '12s', animationDelay: '0s' }} />
          <div className="bubble w-6 h-6 left-[30%]"  style={{ animationDuration: '15s', animationDelay: '3s' }} />
          <div className="bubble w-3 h-3 left-[60%]"  style={{ animationDuration: '10s', animationDelay: '7s' }} />
          <div className="bubble w-5 h-5 left-[80%]"  style={{ animationDuration: '18s', animationDelay: '2s' }} />
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" className="w-full" preserveAspectRatio="none">
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="white" />
          </svg>
        </div>

        <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-28 sm:pt-32 sm:pb-36 text-white text-center" style={heroStyleVars}>
          <div className={heroBadgeClassName}>
            <Sun className="w-4 h-4 text-yellow-300 flex-shrink-0" />
            Гостевой дом на Зелёной 26
          </div>

          <h1 className={heroTitleClassName} style={heroTitleStyle}>
            {settings.hero_title || 'Отдых у Азовского моря'}
          </h1>

          <p className={`${heroSubtitleClassName} mx-auto`} style={heroSubtitleStyle}>
            {settings.hero_subtitle || 'Уютные номера, тёплое море и спокойная атмосфера для семейного отдыха.'}
          </p>

          <div className="flex gap-6 sm:gap-10 mb-8 flex-wrap justify-center">
            {[
              { value: '7',      label: 'номеров' },
              { value: '5 мин.', label: 'до пляжа' },
              { value: '100%',   label: 'тёплый приём' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className={heroStatValueClassName} style={heroStatValueStyle}>{stat.value}</div>
                <div className={heroStatLabelClassName} style={heroStatLabelStyle}>{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/rooms" className={heroPrimaryButtonClassName}>
              Выбрать номер
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a href={`tel:${settings.site_phone || ''}`} className={heroSecondaryButtonClassName}>
              Позвонить нам
            </a>
          </div>
        </div>
      </section>

      {/* ===== INFO BAR ===== */}
      <section className="relative z-10 -mt-1 bg-white border-b border-gray-100 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
              <a href="#map-section" className="flex items-center gap-1.5 hover:text-sea-700 transition-colors">
                <MapPin className="w-4 h-4 text-sea-500 flex-shrink-0" />
                {siteAddress}
              </a>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-sea-500 flex-shrink-0" />
                Заезд с 14:00 / Выезд до 12:00
              </div>
            </div>
            <Link href="/rooms" className="btn-primary py-2 text-sm self-start sm:self-auto flex-shrink-0">
              Номера и цены
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      {/* Clean horizontal items — no card soup */}
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mb-10 sm:mb-14">
            <h2 className="section-title">Почему выбирают нас</h2>
            <p className="section-subtitle">
              Удобные номера, нужные услуги и спокойная атмосфера.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-8">
            {features.map((feature) => (
              <div key={feature.label} className="flex gap-4 items-start">
                <div className={`w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center ${feature.color}`}>
                  <feature.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1 leading-snug">{feature.label}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ROOMS PREVIEW ===== */}
      <section className="section-padding bg-sand-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-10 sm:mb-12">
            <div>
              <h2 className="section-title">Наши номера</h2>
              <p className="section-subtitle">Уютное жильё вдали от городской суеты.</p>
            </div>
            <Link href="/rooms" className="hidden sm:inline-flex items-center gap-1.5 text-sea-700 font-semibold hover:underline text-sm flex-shrink-0">
              Все номера <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {rooms.map((room) => {
              const priceRange = getRoomPriceRange(room.pricePerDay, normalizeRoomPricePeriods(room.pricePeriods || []))
              return (
                <Link key={room.id} href={`/rooms/${room.slug}`} className="card group hover:-translate-y-1 transition-all duration-200 hover:shadow-[0_12px_36px_rgba(0,0,0,0.12)]">
                  <div className="relative h-44 bg-gradient-to-br from-sea-100 to-sea-200 overflow-hidden">
                    {room.images[0] ? (
                      <AppImage
                        src={room.images[0]}
                        alt={room.name}
                        fill
                        variant="card"
                        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Waves className="w-14 h-14 text-sea-300" />
                      </div>
                    )}
                    <div className="absolute top-2.5 left-2.5">
                      <span className="badge-sea text-xs">До {room.capacity} чел.</span>
                    </div>
                    {room.hasAC && (
                      <div className="absolute top-2.5 right-2.5">
                        <span className="badge bg-blue-100 text-blue-700 text-xs">
                          <Wind className="w-3 h-3" /> Конд.
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 sm:p-5">
                    <h3 className="font-display text-base sm:text-lg font-semibold text-gray-900 mb-1 leading-snug">{room.name}</h3>
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">{room.shortDescription}</p>
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-lg font-bold text-sea-700">
                          {priceRange.hasRange
                            ? `${formatMoney(priceRange.minPrice)}-${formatMoney(priceRange.maxPrice)}`
                            : formatMoney(priceRange.minPrice)}
                        </span>
                        <span className="text-xs text-gray-400 ml-1">
                          {priceRange.hasRange ? '/ период' : '/ сут.'}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-coral-600 group-hover:underline">Подробнее</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          <div className="text-center mt-6 sm:hidden">
            <Link href="/rooms" className="btn-outline">
              Все номера <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== ABOUT ===== */}
      <section className="section-padding bg-deep-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-72 h-72 bg-sea-400 rounded-full blur-3xl opacity-10" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-coral-400 rounded-full blur-3xl opacity-10" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold mb-5 leading-tight">
                Уютный уголок<br className="hidden sm:block" /> у Азовского моря
              </h2>
              <p className="text-white/80 text-base sm:text-lg leading-relaxed mb-7">
                {settings.about_text || 'Гостевой дом для тех, кто хочет отдохнуть у моря без суеты: уютные номера, большой двор, своя кухня и море в шаговой доступности.'}
              </p>
              <ul className="space-y-2.5 mb-8">
                {[
                  'Пляж в 5 минутах ходьбы',
                  'Парковка на территории',
                  'Мангальная зона и беседки',
                  'Детская площадка с песочницей',
                  'Сапборды и велосипеды — бесплатно',
                  'Трансфер по предварительному запросу',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-white/85 text-sm sm:text-base">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-sea-400 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/services" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/12 hover:bg-white/22 rounded-xl font-semibold transition-all duration-200 border border-white/18 text-sm sm:text-base">
                Все услуги <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {aboutImages.map((src, index) => (
                <div
                  key={index}
                  className={`relative rounded-xl overflow-hidden bg-sea-900 ${index === 0 ? 'col-span-2 h-44 sm:h-52' : 'h-32 sm:h-40'}`}
                >
                  <AppImage src={src} alt="" fill variant="content" sizes="(max-width: 768px) 100vw, 50vw" className="object-cover opacity-70" />
                  <div className="absolute inset-0 bg-gradient-to-t from-sea-900/40 to-transparent" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== REVIEWS ===== */}
      {reviews.length > 0 && (
        <section className="section-padding bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 sm:mb-12">
              <h2 className="section-title">Отзывы гостей</h2>
              <p className="section-subtitle mx-auto">Реальные впечатления от настоящих гостей.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
              {reviews.map((review) => (
                <div key={review.id} className="flex flex-col gap-4 p-5 sm:p-6 rounded-2xl border border-gray-100 bg-white hover:border-sea-100 transition-colors">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={index}
                        className={`w-4 h-4 ${index < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200 fill-gray-200'}`}
                      />
                    ))}
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed flex-1">«{review.content}»</p>
                  <div className="font-semibold text-gray-900 text-sm">{review.guestName || review.user?.name || 'Гость'}</div>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link href="/reviews" className="btn-outline">
                Все отзывы <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ===== CTA ===== */}
      <section className="section-padding bg-sea-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-15">
          <svg viewBox="0 0 800 200" className="absolute bottom-0 w-full" preserveAspectRatio="none">
            <path d="M0,100 C200,0 600,200 800,100 L800,200 L0,200 Z" fill="white" />
          </svg>
        </div>
        <div className="relative text-center max-w-2xl mx-auto px-4">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Готовы к отдыху?
          </h2>
          <p className="text-white/80 text-base sm:text-lg mb-8 leading-relaxed">
            Выберите номер и отправьте заявку на бронирование, либо позвоните — поможем подобрать вариант по датам и количеству гостей.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/rooms"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white text-sea-700 font-bold rounded-xl text-base transition-all duration-200 hover:-translate-y-px hover:shadow-lg"
            >
              Забронировать номер
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href={`tel:${settings.site_phone || ''}`}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 border-2 border-white/70 text-white font-bold rounded-xl text-base transition-all duration-200 hover:bg-white/10"
            >
              Позвонить нам
            </a>
          </div>
        </div>
      </section>

      {/* ===== MAP ===== */}
      <section id="map-section" className="bg-sand-50 py-14 sm:py-16 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-7 sm:mb-8 text-center">
            <h2 className="section-title">Как нас найти</h2>
            <p className="section-subtitle mx-auto">{siteAddress}</p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-gray-200">
            <iframe
              title="Карта гостевого дома"
              src={`https://yandex.ru/map-widget/v1/?z=17&text=${encodeURIComponent(siteAddress)}`}
              width="100%"
              height="400"
              loading="lazy"
              allowFullScreen
              className="w-full block"
              style={{ minHeight: 280 }}
            />
          </div>
        </div>
      </section>
    </>
  )
}
