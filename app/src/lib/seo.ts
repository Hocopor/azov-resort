// ============================================================================
// SEO helpers — единое место для ключевых слов, alt-текстов и микроразметки.
// Локацию меняешь здесь в одном месте — она подставится везде.
// ============================================================================

export const SITE_LOCALITY = 'Кучугуры'
export const SITE_REGION = 'Краснодарский край'
export const SITE_STREET = 'ул. Зелёная, 26'

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'http://localhost:3000'
}

// Alt-текст для фото номера: «{название}, гостевой дом в Кучугурах — фото N».
// Подставляется автоматически ко всем фото, включая будущие.
export function buildRoomImageAlt(name: string, index: number): string {
  return `${name}, гостевой дом в ${SITE_LOCALITY} — фото ${index + 1}`
}

// ---------------------------------------------------------------------------
// FAQ — показывается на сайте и оборачивается в микроразметку FAQPage.
// Снимает возражения (= мягко повышает конверсию) и ловит длинные запросы.
// ---------------------------------------------------------------------------
export interface FaqItem {
  question: string
  answer: string
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: `Как далеко до моря от гостевого дома в ${SITE_LOCALITY}?`,
    answer:
      'Около 350 метров — это 5 минут спокойным шагом до пляжа и набережной. С пляжными сумками и детьми дойти легко.',
  },
  {
    question: 'Есть ли на территории парковка?',
    answer: 'Да, собственная бесплатная парковка прямо во дворе. Машина всегда рядом и под присмотром.',
  },
  {
    question: 'Можно ли готовить самим?',
    answer:
      'Конечно. В номерах 4, 5 и 7 — своя кухня, в номерах 1, 2 и 3 — общая кухня в том же доме. Везде есть посуда, плита и холодильник.',
  },
  {
    question: 'Подходит ли для отдыха с детьми?',
    answer:
      'Да. Пологий вход в море, тёплая вода, на территории детская площадка с песочницей, а в номерах — кондиционер, чтобы малышам было комфортно в жару.',
  },
  {
    question: 'Есть ли кондиционер и Wi-Fi?',
    answer: 'Кондиционер есть в каждом номере, бесплатный Wi-Fi работает по всей территории.',
  },
  {
    question: 'Можно ли разместиться большой компанией?',
    answer:
      'Да. Есть номер на 6 человек со своей кухней и большой беседкой, а номера 1, 2 и 3 можно забронировать вместе — они в одном доме.',
  },
  {
    question: 'Что рядом с гостевым домом?',
    answer:
      'В 300 метрах — «Пятёрочка» и центральный рынок со свежей рыбой и овощами. До моря — 350 метров. Всё в шаговой доступности.',
  },
]

// ---------------------------------------------------------------------------
// JSON-LD билдеры (микроразметка для «звёзд» и быстрых ответов в выдаче).
// ---------------------------------------------------------------------------

interface LodgingArgs {
  name: string
  description: string
  phone?: string
  image?: string
}

export function buildLodgingBusinessJsonLd({ name, description, phone, image }: LodgingArgs) {
  const url = getSiteUrl()
  return {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name,
    description,
    url,
    ...(image ? { image: image.startsWith('http') ? image : `${url}${image}` } : {}),
    ...(phone ? { telephone: phone } : {}),
    address: {
      '@type': 'PostalAddress',
      addressLocality: SITE_LOCALITY,
      addressRegion: SITE_REGION,
      streetAddress: SITE_STREET,
      addressCountry: 'RU',
    },
    amenityFeature: [
      { '@type': 'LocationFeatureSpecification', name: 'Бесплатная парковка', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Wi-Fi', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Кондиционер', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Кухня', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Мангал', value: true },
    ],
  }
}

interface HotelRoomArgs {
  name: string
  description: string
  url: string
  image?: string
  priceFrom?: number // в рублях
  capacity?: number
}

export function buildHotelRoomJsonLd({ name, description, url, image, priceFrom, capacity }: HotelRoomArgs) {
  const site = getSiteUrl()
  return {
    '@context': 'https://schema.org',
    '@type': 'HotelRoom',
    name,
    description,
    url,
    ...(image ? { image: image.startsWith('http') ? image : `${site}${image}` } : {}),
    ...(capacity
      ? { occupancy: { '@type': 'QuantitativeValue', maxValue: capacity, unitText: 'человек' } }
      : {}),
    ...(priceFrom
      ? {
          offers: {
            '@type': 'Offer',
            price: priceFrom,
            priceCurrency: 'RUB',
            availability: 'https://schema.org/InStock',
            url,
          },
        }
      : {}),
  }
}

export function buildFaqJsonLd(items: FaqItem[] = FAQ_ITEMS) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }
}

export function buildBreadcrumbJsonLd(trail: Array<{ name: string; path: string }>) {
  const site = getSiteUrl()
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `${site}${crumb.path}`,
    })),
  }
}
