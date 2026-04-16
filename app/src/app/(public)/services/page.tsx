import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getSetting } from '@/lib/settings'
import { formatMoney } from '@/lib/utils'
import Link from 'next/link'
import {
  Car, Waves, Bike, WashingMachine, Flame, ParkingSquare,
  Sparkles, Baby, Wifi, Umbrella, Map, ChefHat, ArrowLeft, CheckCircle
} from 'lucide-react'

export const metadata: Metadata = { title: 'Услуги и удобства' }
export const revalidate = 60

const iconMap: Record<string, any> = {
  Car, Waves, Bike, WashingMachine, Flame, ParkingSquare,
  Sparkles, Baby, Wifi, Umbrella, Map, ChefHat,
}

export default async function ServicesPage() {
  const [isActive, cookingActive, services] = await Promise.all([
    getSetting('services_page_active', 'false'),
    getSetting('cooking_service_active', 'false'),
    prisma.service.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
  ])

  if (isActive !== 'true') {
    redirect('/')
  }

  const visibleServices = services.filter(
    (s) => !(s.category === 'food' && cookingActive !== 'true')
  )

  const categories: Record<string, { label: string; services: typeof services }> = {}
  const catLabels: Record<string, string> = {
    transport: 'Транспорт и трансфер',
    sport: 'Активный отдых',
    recreation: 'Зоны отдыха',
    household: 'Бытовые услуги',
    general: 'Основное',
    tours: 'Экскурсии',
    food: 'Питание',
  }

  for (const s of visibleServices) {
    if (!categories[s.category]) categories[s.category] = { label: catLabels[s.category] || s.category, services: [] }
    categories[s.category].services.push(s)
  }

  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-deep-900 to-sea-700 text-white pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> На главную
          </Link>
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-4">Услуги и удобства</h1>
          <p className="text-white/80 text-lg max-w-xl mx-auto">
            Всё для вашего комфортного отдыха у Азовского моря
          </p>
        </div>
      </section>

      <section className="bg-sand-50 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-12">
          {Object.entries(categories).map(([key, cat]) => (
            <div key={key}>
              <h2 className="font-display text-3xl font-semibold text-deep-700 mb-6">{cat.label}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {cat.services.map((service) => {
                  const Icon = iconMap[service.icon || ''] || CheckCircle
                  const isFree = service.price === 0

                  return (
                    <div key={service.id} className="card p-6 hover:-translate-y-1 transition-transform duration-300">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${isFree ? 'bg-green-100 text-green-600' : 'bg-sea-100 text-sea-600'}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">{service.name}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed mb-4">{service.description}</p>
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${isFree ? 'bg-green-100 text-green-700' : 'bg-sea-100 text-sea-700'}`}>
                        {isFree ? '✓ Бесплатно' : service.priceNote || (service.price ? formatMoney(service.price) : 'По договорённости')}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-sea-700 text-white py-16 text-center">
        <div className="max-w-xl mx-auto px-4">
          <h2 className="font-display text-3xl font-bold mb-3">Готовы отдохнуть?</h2>
          <p className="text-white/80 mb-8">Все услуги доступны гостям нашего гостевого дома</p>
          <Link href="/rooms" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-sea-700 font-bold rounded-2xl hover:-translate-y-1 transition-all duration-300 hover:shadow-xl">
            Забронировать номер →
          </Link>
        </div>
      </section>
    </div>
  )
}
