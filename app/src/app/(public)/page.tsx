import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/db'
import { getSettings } from '@/lib/settings'
import { formatMoney } from '@/lib/utils'
import {
  Waves, Star, Shield, Clock, Car, Bike, Wifi, ChefHat,
  ArrowRight, Sun, Wind, MapPin, Calendar, Users, CheckCircle
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Главная — Отдых у Азовского моря',
}

export const revalidate = 60

function isUploadedImage(url: string) {
  return url.startsWith('/uploads/')
}

async function getHomeData() {
  const [rooms, settings, recentPosts] = await Promise.all([
    prisma.room.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      take: 4,
    }),
    getSettings([
      'hero_title', 'hero_subtitle', 'about_text', 'site_name', 'site_phone',
      'review_text_1', 'review_author_1', 'review_city_1',
      'review_text_2', 'review_author_2', 'review_city_2',
      'review_text_3', 'review_author_3', 'review_city_3',
      'hero_bg_image', 'about_image_1', 'about_image_2', 'about_image_3', 'about_image_4',
    ]),
    prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
  ])
  return { rooms, settings, recentPosts }
}

export default async function HomePage() {
  const { rooms, settings, recentPosts } = await getHomeData()
  const heroBackground = settings.hero_bg_image || '/images/general/hero-bg.jpg'
  const hasCustomHeroImage = Boolean(settings.hero_bg_image)
  const aboutImages = [
    settings.about_image_1 || '/images/general/about-1.jpg',
    settings.about_image_2 || '/images/general/about-2.jpg',
    settings.about_image_3 || '/images/general/about-3.jpg',
    settings.about_image_4 || '/images/general/about-4.jpg',
  ]

  const features = [
    { icon: Waves, label: 'Море рядом', desc: 'Пляж в 5 минутах', color: 'text-sea-600 bg-sea-50' },
    { icon: Wifi, label: 'Бесплатный Wi-Fi', desc: 'На всей территории', color: 'text-blue-600 bg-blue-50' },
    { icon: Car, label: 'Трансфер', desc: 'Встретим и доставим', color: 'text-green-600 bg-green-50' },
    { icon: Bike, label: 'Велосипеды и САПы', desc: 'В вашем распоряжении', color: 'text-orange-600 bg-orange-50' },
    { icon: Shield, label: 'Чистота и уют', desc: 'Ежедневная уборка', color: 'text-purple-600 bg-purple-50' },
    { icon: ChefHat, label: 'Кухни в номерах', desc: 'Готовьте сами', color: 'text-coral-600 bg-coral-50' },
  ]

  const reviews = [
    { text: settings.review_text_1, author: settings.review_author_1, city: settings.review_city_1 },
    { text: settings.review_text_2, author: settings.review_author_2, city: settings.review_city_2 },
    { text: settings.review_text_3, author: settings.review_author_3, city: settings.review_city_3 },
  ].filter((r) => r.text && r.author)

  const heroBadgeClassName = hasCustomHeroImage
    ? 'inline-flex items-center gap-2 px-4 py-2 bg-[rgba(58,69,34,0.48)] backdrop-blur-sm rounded-full text-sm font-medium mb-6 border border-[rgba(255,248,231,0.24)] text-[#fff6e8] shadow-[0_10px_28px_rgba(0,0,0,0.18)]'
    : 'inline-flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm rounded-full text-sm font-medium mb-6 border border-white/20'

  const heroTitleClassName = hasCustomHeroImage
    ? 'font-display text-5xl sm:text-6xl md:text-7xl font-bold leading-tight mb-6 text-[#fff8ef] drop-shadow-[0_4px_18px_rgba(0,0,0,0.32)]'
    : 'font-display text-5xl sm:text-6xl md:text-7xl font-bold leading-tight mb-6'

  const heroSubtitleClassName = hasCustomHeroImage
    ? 'text-lg sm:text-xl text-[#f8ead7] leading-relaxed mb-10 max-w-xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.28)]'
    : 'text-lg sm:text-xl text-white/80 leading-relaxed mb-10 max-w-xl'

  const heroStatValueClassName = hasCustomHeroImage
    ? 'text-3xl font-display font-bold text-[#fff7ec] drop-shadow-[0_2px_10px_rgba(0,0,0,0.24)]'
    : 'text-3xl font-display font-bold'

  const heroStatLabelClassName = hasCustomHeroImage
    ? 'text-sm text-[#f3e3cb] drop-shadow-[0_2px_8px_rgba(0,0,0,0.2)]'
    : 'text-sm text-white/60'

  const heroPrimaryButtonClassName = hasCustomHeroImage
    ? 'inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#db7a4e] hover:bg-[#cb6c42] text-[#fffaf3] font-bold rounded-2xl text-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl'
    : 'inline-flex items-center justify-center gap-2 px-8 py-4 bg-coral-500 hover:bg-coral-600 text-white font-bold rounded-2xl text-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl'

  const heroSecondaryButtonClassName = hasCustomHeroImage
    ? 'inline-flex items-center justify-center gap-2 px-8 py-4 bg-[rgba(70,49,31,0.56)] hover:bg-[rgba(70,49,31,0.72)] backdrop-blur-sm text-[#fff4e4] font-bold rounded-2xl text-lg transition-all duration-300 border border-[rgba(255,241,220,0.28)]'
    : 'inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white font-bold rounded-2xl text-lg transition-all duration-300 border border-white/25'

  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background */}
        <div className={`absolute inset-0 ${hasCustomHeroImage ? 'bg-deep-900' : 'bg-gradient-to-br from-deep-900 via-sea-800 to-deep-700'}`}>
          <Image
            src={heroBackground}
            alt="Азовское море"
            fill
            className={hasCustomHeroImage ? 'object-cover' : 'object-cover opacity-30 mix-blend-overlay'}
            priority
            unoptimized={isUploadedImage(heroBackground)}
          />
          {/* Animated bubbles */}
          <div className="bubble w-4 h-4 left-[10%]" style={{ animationDuration: '12s', animationDelay: '0s' }} />
          <div className="bubble w-6 h-6 left-[30%]" style={{ animationDuration: '15s', animationDelay: '3s' }} />
          <div className="bubble w-3 h-3 left-[60%]" style={{ animationDuration: '10s', animationDelay: '7s' }} />
          <div className="bubble w-5 h-5 left-[80%]" style={{ animationDuration: '18s', animationDelay: '2s' }} />
          <div className="bubble w-2 h-2 left-[45%]" style={{ animationDuration: '8s', animationDelay: '5s' }} />
        </div>

        {/* Wave bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" className="w-full" preserveAspectRatio="none">
            <path d="M0,60 C240,100 480,20 720,60 C960,100 1200,20 1440,60 L1440,120 L0,120 Z" fill="white" opacity="0.1" />
            <path d="M0,80 C360,30 720,110 1080,50 C1260,20 1380,80 1440,90 L1440,120 L0,120 Z" fill="white" />
          </svg>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-36 text-white">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className={heroBadgeClassName}>
              <Sun className="w-4 h-4 text-yellow-300" />
              Сезон 2025 открыт — бронируйте сейчас!
            </div>

            <h1 className={heroTitleClassName}>
              {settings.hero_title || 'Отдых у\u00A0Азовского моря'}
            </h1>

            <p className={heroSubtitleClassName}>
              {settings.hero_subtitle || 'Уютные номера, чистое море, тёплый приём — всё для вашего идеального отпуска'}
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 mb-10">
              {[
                { value: '7', label: 'номеров' },
                { value: '5 мин', label: 'до пляжа' },
                { value: '100%', label: 'тёплый приём' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className={heroStatValueClassName}>{stat.value}</div>
                  <div className={heroStatLabelClassName}>{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/rooms"
                className={heroPrimaryButtonClassName}
              >
                Выбрать номер
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href={`tel:${settings.site_phone || ''}`}
                className={heroSecondaryButtonClassName}
              >
                Позвонить нам
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ===== QUICK BOOKING STRIP ===== */}
      <section className="relative z-10 -mt-1 bg-white py-6 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8">
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-5 h-5 text-sea-600" />
              <span className="text-sm">Азовское море, Краснодарский край</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-5 h-5 text-sea-600" />
              <span className="text-sm">Заезд с 14:00 / Выезд до 12:00</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="w-5 h-5 text-sea-600" />
              <span className="text-sm">7 номеров разного типа</span>
            </div>
            <Link href="/rooms" className="btn-primary py-2.5 text-sm">
              Смотреть номера →
            </Link>
          </div>
        </div>
      </section>

      {/* ===== WHY US ===== */}
      <section className="section-padding bg-sand-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="section-title">Почему выбирают нас</h2>
            <p className="section-subtitle mx-auto">
              Мы создаём условия для настоящего отдыха — без лишних забот
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.label}
                className="card p-6 hover:-translate-y-1 transition-transform duration-300"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${f.color}`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{f.label}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ROOMS PREVIEW ===== */}
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="section-title">Наши номера</h2>
              <p className="section-subtitle">Уютное жильё на любой вкус и бюджет</p>
            </div>
            <Link href="/rooms" className="hidden sm:flex items-center gap-1 text-sea-700 font-semibold hover:underline text-sm">
              Все номера <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {rooms.map((room) => (
              <Link key={room.id} href={`/rooms/${room.slug}`} className="card card-hover group">
                <div className="relative h-48 bg-gradient-to-br from-sea-100 to-sea-200 overflow-hidden">
                  {room.images[0] ? (
                    <Image
                      src={room.images[0]}
                      alt={room.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Waves className="w-16 h-16 text-sea-300" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className="badge-sea text-xs">
                      До {room.capacity} чел.
                    </span>
                  </div>
                  {room.hasAC && (
                    <div className="absolute top-3 right-3">
                      <span className="badge bg-blue-100 text-blue-700 text-xs">
                        <Wind className="w-3 h-3" /> AC
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-display text-lg font-semibold text-gray-900 mb-1">{room.name}</h3>
                  <p className="text-xs text-gray-500 mb-4 line-clamp-2">{room.shortDescription}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xl font-bold text-sea-700">{formatMoney(room.pricePerDay)}</span>
                      <span className="text-xs text-gray-400"> / ночь</span>
                    </div>
                    <span className="text-xs font-semibold text-coral-600 group-hover:underline">
                      Подробнее →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8 sm:hidden">
            <Link href="/rooms" className="btn-outline">
              Все номера <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== ABOUT ===== */}
      <section className="section-padding bg-deep-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-sea-400 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-coral-400 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-display text-4xl md:text-5xl font-semibold mb-6">
                Маленький рай у Азовского моря
              </h2>
              <p className="text-white/80 text-lg leading-relaxed mb-8">
                {settings.about_text || 'Мы принимаем гостей и знаем, как сделать ваш отдых незабываемым.'}
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Пляж Азовского моря в 5 минутах ходьбы',
                  'Охраняемая парковка на территории',
                  'Мангальная зона и беседки',
                  'Детская площадка для малышей',
                  'Сапборды и велосипеды бесплатно',
                  'Трансфер по предварительному заказу',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-white/90">
                    <CheckCircle className="w-5 h-5 text-sea-400 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/services" className="inline-flex items-center gap-2 px-6 py-3 bg-white/15 hover:bg-white/25 rounded-2xl font-semibold transition-all duration-300 border border-white/20">
                Все услуги <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {aboutImages.map((src, i) => (
                <div key={i} className={`relative rounded-2xl overflow-hidden bg-sea-900 ${i === 0 ? 'col-span-2 h-52' : 'h-40'}`}>
                  <Image src={src} alt="" fill className="object-cover opacity-70" unoptimized={isUploadedImage(src)} />
                  <div className="absolute inset-0 bg-gradient-to-t from-sea-900/40 to-transparent" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== REVIEWS ===== */}
      {reviews.length > 0 && (
        <section className="section-padding bg-sand-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="section-title">Отзывы гостей</h2>
              <p className="section-subtitle mx-auto">Что говорят те, кто уже отдохнул у нас</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {reviews.map((review, i) => (
                <div key={i} className="card p-7">
                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-5 italic">«{review.text}»</p>
                  <div>
                    <div className="font-semibold text-gray-900">{review.author}</div>
                    <div className="text-sm text-gray-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {review.city}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== CTA ===== */}
      <section className="section-padding bg-coral-500 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <svg viewBox="0 0 800 200" className="absolute bottom-0 w-full" preserveAspectRatio="none">
            <path d="M0,100 C200,0 600,200 800,100 L800,200 L0,200 Z" fill="white" />
          </svg>
        </div>
        <div className="relative text-center max-w-2xl mx-auto px-4">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Готовы к отдыху?
          </h2>
          <p className="text-white/85 text-lg mb-8">
            Бронируйте номер прямо сейчас — лучшие места разбирают быстро
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/rooms"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-coral-600 font-bold rounded-2xl text-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              Забронировать номер
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href={`tel:${settings.site_phone || ''}`}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white text-white font-bold rounded-2xl text-lg transition-all duration-300 hover:bg-white hover:text-coral-600"
            >
              Позвонить нам
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
