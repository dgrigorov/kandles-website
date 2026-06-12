import 'dotenv/config'
import { db, collections, products, productCollections, productImages, users, reviews } from './index'

const COLLECTION_IDS = {
  spring: 'c0000001-0000-0000-0000-000000000001',
  xmas:   'c0000001-0000-0000-0000-000000000002',
  gifts:  'c0000001-0000-0000-0000-000000000003',
}

const PRODUCT_IDS = [
  'e0000001-0000-0000-0000-000000000001',
  'e0000001-0000-0000-0000-000000000002',
  'e0000001-0000-0000-0000-000000000003',
  'e0000001-0000-0000-0000-000000000004',
  'e0000001-0000-0000-0000-000000000005',
  'e0000001-0000-0000-0000-000000000006',
]

const ADMIN_SEED_USER_ID   = 'a0000001-0000-0000-0000-000000000001'
const ADMIN_SEED_AUTH_UUID = 'a0000001-0000-0000-0000-000000000002'

async function seed() {
  await db.insert(collections).values([
    { id: COLLECTION_IDS.spring, name: 'Флорална пролет',     slug: 'floralna-prolet',      seasonStartMonth: 3,  seasonEndMonth: 5  },
    { id: COLLECTION_IDS.xmas,   name: 'Коледна магия',       slug: 'koledna-magiya',        seasonStartMonth: 11, seasonEndMonth: 12 },
    { id: COLLECTION_IDS.gifts,  name: 'Подаръчни комплекти', slug: 'podarachni-komplekti'                                           },
  ]).onConflictDoNothing()

  await db.insert(products).values([
    { id: PRODUCT_IDS[0], title: 'Розова пролет',          price: '45.00', stock: 10, productionDays: 2, occasionTags: ['birthday', 'mothers_day']  },
    { id: PRODUCT_IDS[1], title: 'Слънчоглед и лавандула', price: '55.00', stock: 8,  productionDays: 3, occasionTags: ['birthday', 'anniversary']   },
    { id: PRODUCT_IDS[2], title: 'Коледна звезда',         price: '65.00', stock: 15, productionDays: 2, occasionTags: ['christmas', 'new_year']     },
    { id: PRODUCT_IDS[3], title: 'Зимна приказка',         price: '80.00', stock: 5,  productionDays: 4, occasionTags: ['christmas', 'anniversary']  },
    { id: PRODUCT_IDS[4], title: 'Релакс комплект',        price: '95.00', stock: 7,  productionDays: 3, occasionTags: ['birthday', 'valentines']    },
    { id: PRODUCT_IDS[5], title: 'Нежен момент',           price: '70.00', stock: 6,  productionDays: 3, occasionTags: ['anniversary', 'valentines'] },
  ]).onConflictDoNothing()

  await db.insert(productCollections).values([
    { productId: PRODUCT_IDS[0], collectionId: COLLECTION_IDS.spring, sortOrder: 0 },
    { productId: PRODUCT_IDS[1], collectionId: COLLECTION_IDS.spring, sortOrder: 1 },
    { productId: PRODUCT_IDS[2], collectionId: COLLECTION_IDS.xmas,   sortOrder: 0 },
    { productId: PRODUCT_IDS[3], collectionId: COLLECTION_IDS.xmas,   sortOrder: 1 },
    { productId: PRODUCT_IDS[4], collectionId: COLLECTION_IDS.gifts,  sortOrder: 0 },
    { productId: PRODUCT_IDS[5], collectionId: COLLECTION_IDS.gifts,  sortOrder: 1 },
  ]).onConflictDoNothing()

  await db.insert(productImages).values([
    { id: 'b0000001-0000-0000-0000-000000000001', productId: PRODUCT_IDS[0], url: 'https://images.kandles.bg/seed/rozova-prolet.jpg',          altText: 'Розова пролет — букет рози и лалета',         sortOrder: 0, isHero: true },
    { id: 'b0000001-0000-0000-0000-000000000002', productId: PRODUCT_IDS[1], url: 'https://images.kandles.bg/seed/slanchogledi-lavandula.jpg', altText: 'Слънчоглед и лавандула — летен букет',         sortOrder: 0, isHero: true },
    { id: 'b0000001-0000-0000-0000-000000000003', productId: PRODUCT_IDS[2], url: 'https://images.kandles.bg/seed/koledna-zvezda.jpg',         altText: 'Коледна звезда — пойнсетия аранжировка',      sortOrder: 0, isHero: true },
    { id: 'b0000001-0000-0000-0000-000000000004', productId: PRODUCT_IDS[3], url: 'https://images.kandles.bg/seed/zimna-prikazka.jpg',         altText: 'Зимна приказка — бяла коледна аранжировка',   sortOrder: 0, isHero: true },
    { id: 'b0000001-0000-0000-0000-000000000005', productId: PRODUCT_IDS[4], url: 'https://images.kandles.bg/seed/relaks-komplet.jpg',         altText: 'Релакс комплект — свещи и ароматни продукти', sortOrder: 0, isHero: true },
    { id: 'b0000001-0000-0000-0000-000000000006', productId: PRODUCT_IDS[5], url: 'https://images.kandles.bg/seed/nezhen-moment.jpg',          altText: 'Нежен момент — орхидеи и зелени акценти',    sortOrder: 0, isHero: true },
  ]).onConflictDoNothing()

  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) throw new Error('ADMIN_EMAIL env var is required for seed')
  await db.insert(users).values([
    { id: ADMIN_SEED_USER_ID, supabaseAuthId: ADMIN_SEED_AUTH_UUID, email: adminEmail },
  ]).onConflictDoNothing()

  await db.insert(reviews).values([
    {
      id:         'f0000001-0000-0000-0000-000000000001',
      productId:  PRODUCT_IDS[0],
      rating:     5,
      text:       'Невероятно красив букет! Получих го за рождения ден и всички бяха възхитени. Свежи цветя и прекрасна аранжировка.',
      isApproved: true,
    },
    {
      id:         'f0000001-0000-0000-0000-000000000002',
      productId:  PRODUCT_IDS[1],
      rating:     4,
      text:       'Много красив и ароматен букет. Цветята издържаха повече от седмица. Определено ще поръчам отново!',
      isApproved: true,
    },
  ]).onConflictDoNothing()

  console.log('Seed complete.')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
