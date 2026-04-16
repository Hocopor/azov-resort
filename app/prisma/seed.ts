import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!@#'
  
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } })
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Администратор',
        passwordHash: await bcrypt.hash(adminPassword, 12),
        role: Role.ADMIN,
        emailVerified: new Date(),
      },
    })
    console.log(`✅ Admin created: ${adminEmail}`)
  }

  // Default settings
  const defaultSettings = [
    { key: 'deposit_type', value: 'PERCENT' },        // PERCENT or FIXED
    { key: 'deposit_percent', value: '30' },           // 30%
    { key: 'deposit_fixed', value: '200000' },         // 2000 руб в копейках
    { key: 'cancellation_policy', value: '14' },       // days for full refund
    { key: 'cancellation_partial_days', value: '7' },  // days for 50% refund
    { key: 'services_page_active', value: 'false' },   // extra services page toggle
    { key: 'cooking_service_active', value: 'false' }, // cooking service toggle
    { key: 'transfer_price_per_km', value: '5000' },   // 50 руб/км
    { key: 'transfer_base_price', value: '50000' },    // 500 руб базовая
    { key: 'site_name', value: 'Отдых на Азове' },
    { key: 'site_phone', value: '+7 (XXX) XXX-XX-XX' },
    { key: 'site_address', value: 'Азовское море, Краснодарский край' },
    { key: 'check_in_time', value: '14:00' },
    { key: 'check_out_time', value: '12:00' },
    { key: 'min_booking_days', value: '1' },
    { key: 'review_text_1', value: 'Отличное место! Чисто, уютно, хозяева очень приветливые. Море рядом, песок чистый. Обязательно вернёмся!' },
    { key: 'review_author_1', value: 'Анна и Сергей' },
    { key: 'review_city_1', value: 'Ростов-на-Дону' },
    { key: 'review_text_2', value: 'Провели 10 дней — время пролетело незаметно. Дети были в восторге от песочницы и велосипедов. Спасибо за трансфер!' },
    { key: 'review_author_2', value: 'Семья Петровых' },
    { key: 'review_city_2', value: 'Воронеж' },
    { key: 'review_text_3', value: 'Тихое и уютное место для отдыха. Супы на кухне, мангал, wi-fi — всё есть. Море в 5 минутах пешком.' },
    { key: 'review_author_3', value: 'Михаил К.' },
    { key: 'review_city_3', value: 'Москва' },
    { key: 'hero_title', value: 'Отдых у Азовского моря' },
    { key: 'hero_subtitle', value: 'Уютные номера, чистое море, тёплый приём — всё для вашего идеального отпуска' },
    { key: 'about_text', value: 'Мы принимаем гостей уже несколько лет и знаем, как сделать ваш отдых незабываемым. Наш гостевой дом расположен в тихом месте в нескольких минутах ходьбы от пляжа Азовского моря.' },
  ]

  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    })
  }
  console.log('✅ Settings seeded')

  // Rooms
  const rooms = [
    {
      name: 'Стандарт «Бриз»',
      slug: 'standart-briz',
      shortDescription: 'Уютный номер с видом на сад для пары или одного гостя',
      description: 'Светлый и уютный номер с двуспальной кроватью, собственной ванной комнатой и небольшим холодильником. Идеально подходит для пары или одного гостя, желающего спокойного отдыха у моря.',
      capacity: 2,
      area: 18,
      pricePerDay: 400000, // 4000 руб
      images: ['/images/rooms/room-1-1.jpg', '/images/rooms/room-1-2.jpg'],
      hasAC: false,
      hasPrivateKitchen: false,
      hasTV: true,
      hasFridge: true,
      amenities: { shower: true, toilet: true, ac: false, tv: true, fridge: true, wifi: true, sharedKitchen: true },
      sortOrder: 1,
    },
    {
      name: 'Стандарт «Прибой»',
      slug: 'standart-priboj',
      shortDescription: 'Просторный номер с отдельной кухней для двух гостей',
      description: 'Просторный номер с отдельной кухней, всем необходимым для самостоятельного приготовления пищи. Оснащён кондиционером для комфорта в жаркие дни.',
      capacity: 2,
      area: 24,
      pricePerDay: 500000, // 5000 руб
      images: ['/images/rooms/room-2-1.jpg', '/images/rooms/room-2-2.jpg'],
      hasAC: true,
      hasPrivateKitchen: true,
      hasTV: true,
      hasFridge: true,
      amenities: { shower: true, toilet: true, ac: true, tv: true, fridge: true, wifi: true, privateKitchen: true },
      sortOrder: 2,
    },
    {
      name: 'Семейный «Лагуна»',
      slug: 'semejnyj-laguna',
      shortDescription: 'Большой номер для семьи с детьми до 4 человек',
      description: 'Просторный семейный номер с двуспальной кроватью и двумя односпальными. Собственная кухня, ванная комната и кондиционер. Идеален для семьи с детьми.',
      capacity: 4,
      area: 35,
      pricePerDay: 700000, // 7000 руб
      images: ['/images/rooms/room-3-1.jpg', '/images/rooms/room-3-2.jpg'],
      hasAC: true,
      hasPrivateKitchen: true,
      hasTV: true,
      hasFridge: true,
      amenities: { shower: true, toilet: true, ac: true, tv: true, fridge: true, wifi: true, privateKitchen: true },
      sortOrder: 3,
    },
    {
      name: 'Эконом «Ракушка»',
      slug: 'ekonom-rakushka',
      shortDescription: 'Бюджетный вариант с общей кухней',
      description: 'Экономичный номер с двуспальной кроватью и душевой кабиной. Общая кухня на три номера полностью оборудована всей необходимой техникой и посудой.',
      capacity: 2,
      area: 15,
      pricePerDay: 280000, // 2800 руб
      images: ['/images/rooms/room-4-1.jpg', '/images/rooms/room-4-2.jpg'],
      hasAC: false,
      hasPrivateKitchen: false,
      hasTV: false,
      hasFridge: false,
      amenities: { shower: true, toilet: true, ac: false, tv: false, fridge: false, wifi: true, sharedKitchen: true },
      sortOrder: 4,
    },
    {
      name: 'Эконом «Якорь»',
      slug: 'ekonom-yakor',
      shortDescription: 'Уютный эконом с общей кухней и видом на двор',
      description: 'Компактный и уютный номер с двуспальной кроватью, небольшой верандой и доступом к общей кухне. Отличный выбор для тех, кто ценит экономию.',
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
      name: 'Эконом «Волна»',
      slug: 'ekonom-volna',
      shortDescription: 'Эконом номер с общей кухней, подходит для 2-3 человек',
      description: 'Просторный эконом-номер с возможностью размещения третьего человека на раскладном диване. Доступ к общей кухне, бесплатный вай-фай.',
      capacity: 3,
      area: 20,
      pricePerDay: 320000, // 3200 руб
      images: ['/images/rooms/room-6-1.jpg', '/images/rooms/room-6-2.jpg'],
      hasAC: false,
      hasPrivateKitchen: false,
      hasTV: true,
      hasFridge: true,
      amenities: { shower: true, toilet: true, ac: false, tv: true, fridge: true, wifi: true, sharedKitchen: true },
      sortOrder: 6,
    },
    {
      name: 'Люкс «Азовский»',
      slug: 'lyuks-azovskij',
      shortDescription: 'Просторный люкс с кондиционером, кухней и верандой',
      description: 'Наш лучший номер! Просторные апартаменты с отдельной спальней, гостиной, полностью оборудованной кухней и собственной верандой. Кондиционер, Smart TV, большой холодильник.',
      capacity: 4,
      area: 45,
      pricePerDay: 900000, // 9000 руб
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
    const existing = await prisma.room.findUnique({ where: { slug: room.slug } })
    if (!existing) {
      await prisma.room.create({ data: room })
    }
  }
  console.log('✅ Rooms seeded')

  // Services
  const services = [
    { name: 'Трансфер', description: 'Встретим вас на вокзале, автовокзале или аэропорту и доставим прямо к нам. Цена зависит от расстояния.', icon: 'Car', price: null, priceNote: 'от 500 ₽', category: 'transport', isActive: true, sortOrder: 1 },
    { name: 'Сапборды', description: 'Катайтесь на сапбордах в любое время — они в вашем распоряжении бесплатно весь срок проживания.', icon: 'Waves', price: 0, priceNote: 'Бесплатно', category: 'sport', isActive: true, sortOrder: 2 },
    { name: 'Велосипеды', description: 'Исследуйте окрестности на велосипедах — они предоставляются бесплатно всем гостям.', icon: 'Bike', price: 0, priceNote: 'Бесплатно', category: 'sport', isActive: true, sortOrder: 3 },
    { name: 'Стирка', description: 'Стирка вещей в стиральной машине. Быстро, аккуратно, качественно.', icon: 'WashingMachine', price: 10000, priceNote: '100 ₽ / загрузка', category: 'household', isActive: true, sortOrder: 4 },
    { name: 'Мангальная зона', description: 'Уютная мангальная зона с беседкой для шашлыков и вечеринок на природе.', icon: 'Flame', price: 0, priceNote: 'Бесплатно', category: 'recreation', isActive: true, sortOrder: 5 },
    { name: 'Парковка', description: 'Охраняемая парковка на территории гостевого дома для всех гостей.', icon: 'ParkingSquare', price: 0, priceNote: 'Бесплатно', category: 'transport', isActive: true, sortOrder: 6 },
    { name: 'Уборка номера', description: 'Ежедневная уборка номера включена в стоимость проживания.', icon: 'Sparkles', price: 0, priceNote: 'Бесплатно', category: 'household', isActive: true, sortOrder: 7 },
    { name: 'Детская площадка', description: 'Песочница и мини-беседка для маленьких гостей — безопасное место для игр.', icon: 'Baby', price: 0, priceNote: 'Бесплатно', category: 'recreation', isActive: true, sortOrder: 8 },
    { name: 'Wi-Fi', description: 'Высокоскоростной интернет на всей территории гостевого дома.', icon: 'Wifi', price: 0, priceNote: 'Бесплатно', category: 'general', isActive: true, sortOrder: 9 },
    { name: 'Беседки', description: 'Уютные беседки для отдыха в тени, общения и трапезы на свежем воздухе.', icon: 'Umbrella', price: 0, priceNote: 'Бесплатно', category: 'recreation', isActive: true, sortOrder: 10 },
    { name: 'Выездные экскурсии', description: 'Организуем выезды в интересные места региона: соляные озёра, грязевые вулканы, дельта Кубани и другие природные достопримечательности.', icon: 'Map', price: null, priceNote: 'По договорённости', category: 'tours', isActive: false, sortOrder: 11 },
    { name: 'Блюда по предзаказу', description: 'По вашему желанию приготовим вкусный обед или ужин из местных продуктов. Заказ принимается накануне.', icon: 'ChefHat', price: null, priceNote: 'По договорённости', category: 'food', isActive: false, sortOrder: 12 },
  ]

  for (const service of services) {
    const existing = await prisma.service.findFirst({ where: { name: service.name } })
    if (!existing) {
      await prisma.service.create({ data: service })
    }
  }
  console.log('✅ Services seeded')

  // Sample blog post
  const blogCount = await prisma.blogPost.count()
  if (blogCount === 0) {
    await prisma.blogPost.create({
      data: {
        title: 'Добро пожаловать! 🌊',
        content: 'Рады приветствовать всех гостей нашего гостевого дома! Азовское море уже прогрелось, пляж чистый, погода отличная. Ждём вас!',
        mediaItems: [],
        published: true,
      },
    })
    console.log('✅ Sample blog post created')
  }

  console.log('🎉 Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
