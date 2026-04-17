const { PrismaClient, Role } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function upsertAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!@#'

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: 'Administrator',
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: Role.ADMIN,
      emailVerified: new Date(),
    },
    create: {
      email: adminEmail,
      name: 'Administrator',
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: Role.ADMIN,
      emailVerified: new Date(),
    },
  })
}

async function seedSettings() {
  const settings = [
    { key: 'deposit_type', value: 'PERCENT' },
    { key: 'deposit_percent', value: '30' },
    { key: 'deposit_fixed', value: '200000' },
    { key: 'cancellation_policy', value: '14' },
    { key: 'cancellation_partial_days', value: '7' },
    { key: 'services_page_active', value: 'true' },
    { key: 'cooking_service_active', value: 'false' },
    { key: 'transfer_price_per_km', value: '5000' },
    { key: 'transfer_base_price', value: '50000' },
    { key: 'site_name', value: 'Отдых на Азове' },
    { key: 'site_phone', value: '+7 (900) 000-00-00' },
    { key: 'site_address', value: 'Азовское море, Краснодарский край' },
    { key: 'check_in_time', value: '14:00' },
    { key: 'check_out_time', value: '12:00' },
    { key: 'min_booking_days', value: '1' },
    { key: 'review_text_1', value: 'Чисто, уютно и очень близко к морю. Отличное место для спокойного отдыха.' },
    { key: 'review_author_1', value: 'Анна и Сергей' },
    { key: 'review_city_1', value: 'Ростов-на-Дону' },
    { key: 'review_text_2', value: 'Уютный двор, детям понравилось, хозяева всегда на связи. Приедем еще.' },
    { key: 'review_author_2', value: 'Семья Петровых' },
    { key: 'review_city_2', value: 'Воронеж' },
    { key: 'review_text_3', value: 'Хороший вариант рядом с морем. Тихо, спокойно и все нужное под рукой.' },
    { key: 'review_author_3', value: 'Михаил К.' },
    { key: 'review_city_3', value: 'Москва' },
    { key: 'hero_title', value: 'Отдых у Азовского моря' },
    { key: 'hero_subtitle', value: 'Уютные номера, теплое море и спокойная атмосфера для семейного отдыха' },
    { key: 'about_text', value: 'Гостевой дом для тех, кто хочет отдохнуть у моря без суеты: чистые номера, двор, кухня и близкий пляж.' },
  ]

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    })
  }
}

async function seedRooms() {
  const rooms = [
    {
      name: 'Стандарт Бриз',
      slug: 'standart-briz',
      shortDescription: 'Уютный номер для пары или одного гостя',
      description: 'Светлый номер с двуспальной кроватью, ванной комнатой, холодильником и Wi-Fi. Хороший вариант для спокойного отдыха у моря.',
      capacity: 2,
      area: 18,
      pricePerDay: 400000,
      images: ['/images/rooms/room-1-1.jpg', '/images/rooms/room-1-2.jpg'],
      hasAC: false,
      hasPrivateKitchen: false,
      hasTV: true,
      hasFridge: true,
      amenities: { shower: true, toilet: true, ac: false, tv: true, fridge: true, wifi: true, sharedKitchen: true },
      sortOrder: 1,
    },
    {
      name: 'Стандарт Прибой',
      slug: 'standart-priboj',
      shortDescription: 'Номер с отдельной кухней и кондиционером',
      description: 'Просторный номер для двоих с отдельной кухней, кондиционером, телевизором и всем необходимым для комфортного проживания.',
      capacity: 2,
      area: 24,
      pricePerDay: 500000,
      images: ['/images/rooms/room-2-1.jpg', '/images/rooms/room-2-2.jpg'],
      hasAC: true,
      hasPrivateKitchen: true,
      hasTV: true,
      hasFridge: true,
      amenities: { shower: true, toilet: true, ac: true, tv: true, fridge: true, wifi: true, privateKitchen: true },
      sortOrder: 2,
    },
    {
      name: 'Семейный Лагуна',
      slug: 'semejnyj-laguna',
      shortDescription: 'Большой номер для семьи до 4 человек',
      description: 'Семейный номер с двуспальной кроватью, двумя дополнительными спальными местами, кухней, ванной комнатой и кондиционером.',
      capacity: 4,
      area: 35,
      pricePerDay: 700000,
      images: ['/images/rooms/room-3-1.jpg', '/images/rooms/room-3-2.jpg'],
      hasAC: true,
      hasPrivateKitchen: true,
      hasTV: true,
      hasFridge: true,
      amenities: { shower: true, toilet: true, ac: true, tv: true, fridge: true, wifi: true, privateKitchen: true },
      sortOrder: 3,
    },
    {
      name: 'Эконом Ракушка',
      slug: 'ekonom-rakushka',
      shortDescription: 'Бюджетный номер с общей кухней',
      description: 'Практичный вариант для гостей, которым нужен чистый и спокойный номер рядом с морем по доступной цене.',
      capacity: 2,
      area: 15,
      pricePerDay: 280000,
      images: ['/images/rooms/room-4-1.jpg', '/images/rooms/room-4-2.jpg'],
      hasAC: false,
      hasPrivateKitchen: false,
      hasTV: false,
      hasFridge: false,
      amenities: { shower: true, toilet: true, ac: false, tv: false, fridge: false, wifi: true, sharedKitchen: true },
      sortOrder: 4,
    },
    {
      name: 'Эконом Якорь',
      slug: 'ekonom-yakor',
      shortDescription: 'Эконом-вариант для двоих с холодильником',
      description: 'Компактный и уютный номер с удобной кроватью, холодильником, душем и доступом к общей кухне.',
      capacity: 2,
      area: 16,
      pricePerDay: 280000,
      images: ['/images/rooms/room-5-1.jpg', '/images/rooms/room-5-2.jpg'],
      hasAC: false,
      hasPrivateKitchen: false,
      hasTV: false,
      hasFridge: true,
      amenities: { shower: true, toilet: true, ac: false, tv: false, fridge: true, wifi: true, sharedKitchen: true },
      sortOrder: 5,
    },
    {
      name: 'Эконом Волна',
      slug: 'ekonom-volna',
      shortDescription: 'Номер для 2-3 гостей с общей кухней',
      description: 'Удобный номер с дополнительным спальным местом, телевизором, холодильником и доступом к общей кухне.',
      capacity: 3,
      area: 20,
      pricePerDay: 320000,
      images: ['/images/rooms/room-6-1.jpg', '/images/rooms/room-6-2.jpg'],
      hasAC: false,
      hasPrivateKitchen: false,
      hasTV: true,
      hasFridge: true,
      amenities: { shower: true, toilet: true, ac: false, tv: true, fridge: true, wifi: true, sharedKitchen: true },
      sortOrder: 6,
    },
    {
      name: 'Люкс Азовский',
      slug: 'lyuks-azovskij',
      shortDescription: 'Просторный люкс с кухней и верандой',
      description: 'Самый просторный номер с отдельной спальней, гостиной зоной, кухней, кондиционером, телевизором и собственной верандой.',
      capacity: 4,
      area: 45,
      pricePerDay: 900000,
      images: ['/images/rooms/room-7-1.jpg', '/images/rooms/room-7-2.jpg'],
      hasAC: true,
      hasPrivateKitchen: true,
      hasTV: true,
      hasFridge: true,
      amenities: { shower: true, toilet: true, ac: true, tv: true, fridge: true, wifi: true, privateKitchen: true, veranda: true, sofa: true },
      sortOrder: 7,
    },
  ]

  for (const room of rooms) {
    await prisma.room.upsert({
      where: { slug: room.slug },
      update: room,
      create: room,
    })
  }
}

async function seedServices() {
  const services = [
    { name: 'Трансфер', description: 'Встреча на вокзале, автовокзале или в аэропорту по договоренности.', icon: 'Car', price: null, priceNote: 'от 500 ₽', category: 'transport', isActive: true, sortOrder: 1 },
    { name: 'Сапборды', description: 'Бесплатное использование сапбордов на время проживания.', icon: 'Waves', price: 0, priceNote: 'Бесплатно', category: 'sport', isActive: true, sortOrder: 2 },
    { name: 'Велосипеды', description: 'Велосипеды для прогулок по окрестностям.', icon: 'Bike', price: 0, priceNote: 'Бесплатно', category: 'sport', isActive: true, sortOrder: 3 },
    { name: 'Стирка', description: 'Стирка вещей в стиральной машине.', icon: 'WashingMachine', price: 10000, priceNote: '100 ₽ / загрузка', category: 'household', isActive: true, sortOrder: 4 },
    { name: 'Мангал', description: 'Мангал и зона отдыха во дворе.', icon: 'Flame', price: 0, priceNote: 'Бесплатно', category: 'recreation', isActive: true, sortOrder: 5 },
    { name: 'Парковка', description: 'Парковка на территории гостевого дома.', icon: 'ParkingSquare', price: 0, priceNote: 'Бесплатно', category: 'transport', isActive: true, sortOrder: 6 },
  ]

  for (const service of services) {
    const existing = await prisma.service.findFirst({ where: { name: service.name } })

    if (existing) {
      await prisma.service.update({
        where: { id: existing.id },
        data: service,
      })
      continue
    }

    await prisma.service.create({ data: service })
  }
}

async function seedBlogPost() {
  const blogCount = await prisma.blogPost.count()

  if (blogCount > 0) return

  await prisma.blogPost.create({
    data: {
      title: 'Добро пожаловать',
      content: 'Гостевой дом открыт для бронирований. На сайте уже можно смотреть номера, условия проживания и свободные даты.',
      mediaItems: [],
      published: true,
    },
  })
}

async function main() {
  console.log('Seeding database...')

  await upsertAdmin()
  await seedSettings()
  await seedRooms()
  await seedServices()
  await seedBlogPost()

  console.log('Seed complete')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
