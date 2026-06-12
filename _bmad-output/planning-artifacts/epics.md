---
stepsCompleted: [1, 2, 3]
partyModeReviewApplied: true
inputDocuments:
  - _bmad-output/planning-artifacts/PRD-kandles-bg.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/brainstorming/brainstorming-session-2026-06-05-1315.md
  - brand-assets/Hamza-Shehzad-brand-system (анализиран визуално)
project_name: Kandles.bg
user_name: Daniel
date: 2026-06-07
---

# Kandles.bg — Epic Breakdown

## Преглед

Този документ съдържа пълната epic и story декомпозиция за Kandles.bg — custom e-commerce платформа за ръчно изработени свещи и artisan продукти от Стефка Григорова. Изискванията са извлечени от PRD, Architecture документа, brainstorming сесията, анализ на реалната бранд идентичност (дизайнер Hamza Shehzad), Advanced Elicitation сесия, и Party Mode Review (6 агента: Amelia/Arch, Winston/PM, Paige/SEO, Sally/UX, John/Business, Mary/Operations).

---

## Requirements Inventory

### Functional Requirements

#### MVP — В обхват

FR-1: Продуктова страница — купувачът разглежда: галерия (мин. 3 снимки + 1 видео lazy-loaded), поетично описание в brand voice, аромат нотки (top/heart/base), цена, наличност, производствено време, свързани продукти. Badge "Само X броя" при наличност ≤ 5.

FR-2: Сезонно показване — системата автоматично приоритизира колекции по дата: Коледна (1 ноем – 31 дек), Флорална/Пролетна (1 мар – 31 май), Лятна (1 юни – 31 авг), Есенна/Ботаническа (1 сеп – 31 окт). Admin може да override ръчно.

FR-3: Occasion филтриране — купувачът филтрира по повод: Рожден ден, Коледа, 8-ми март, Сватба, Кръщене, Просто така. SEO-четими URLs (/kolektsii/rozhden-den). Всеки продукт има мин. 1 occasion tag.

FR-4: "Последна минута" секция — отделна секция с продукти за доставка до 24ч (при `stock > 0`). Показва се само при ≥ 1 last-minute eligible продукт с наличност. Admin маркира продукти като last-minute eligible.

FR-5: Букет Конфигуратор wizard — 5 стъпки: (1) вид цветя с картинки, (2) цветова схема, (3) брой (5–30), (4) носач (кошница/без), (5) допълнения. Static preview image по combination key (не canvas/WebGL). Динамична цена в реално време. localStorage persistence при refresh. Проверка на stock пред add-to-cart.

FR-6: Персонализирана поръчка с preview снимка — state machine: Производство → Preview качена → Клиент одобри/Корекция → Изпратена. Admin upload снимка → система изпраща имейл с preview до клиента. 1 безплатна корекция. Signed JWT с expiry, max 3 изпращания. `correction_count` ≤ 1 enforced на DB ниво (CHECK constraint). Политиката е видима на product page и в checkout.

FR-7: Gift Wrap добавка — +8 лв; включва кутия + стружка + панделка + картичка с персонален текст (макс. 150 знака). Опцията е на cart страницата. Текстът на картичката е видим в admin поръчката. При gift wrap: снимка в потвърдителния имейл показва опакован вариант.

FR-8: Gift Sets — предварително съставени комплекти (2+ продукта) с обща опаковка и комбинирана цена. Собствена продуктова страница. Admin създава Sets от съществуващи продукти. Инвентарът на компонентите се намалява атомарно при поръчка (SELECT FOR UPDATE + transaction).

FR-10: Guest checkout — завършване на поръчка без регистрация. Email е единственото задължително поле. Опция "Запази данните ми" → background акаунт.

FR-11: Методи на плащане — Наложен платеж (default), Дебитна/Кредитна карта (Stripe Hosted Checkout + 3D Secure), ApplePay/GooglePay (чрез Stripe Hosted — prominent на mobile, не скрит option). Revolut Pay → v2.

FR-12: Куриерска интеграция — автоматична калкулация чрез Econt API + Speedy API. Async с 2s timeout + fallback фиксирана цена + предупреждение. "До офис" пръв (по-евтино). Безплатна доставка при ≥ 60 лв автоматично.

FR-13: Order Tracking страница — купувачът проверява статус с номер на поръчка + имейл. Статуси: Приета → В производство → Готова → Изпратена → Доставена. Tracking номерът е clickable link към Econt/Speedy. Всяка промяна → автоматичен имейл.

FR-14: Транзакционни имейли — 4 вида автоматични имейли: (1) Потвърждение на поръчка, (2) "В производство", (3) "Изпратена е!" с tracking, (4) "Доставена — как беше?" с review покана. Брандирани, на български, SPF/DKIM (Resend).

FR-17: Order Management admin — всички поръчки с филтри по статус/дата/метод на плащане. Admin сменя статус (→ авто имейл), въвежда tracking номер, качва preview снимка (FR-6), добавя бележка. Dashboard: поръчки днес/тази седмица/pending. Mobile-responsive. Touch targets ≥ 48x48px.

FR-18: Product Management admin — CRUD + архив за продукти. Полета: заглавие, описание, аромат нотки, цена, **наличност (`stock` INTEGER)**,  категория, occasion tags, сезон, снимки (upload + drag-and-drop наредба), видео (upload), производствено време, last-minute eligible, alt text (задължително поле). Bulk edit на наличност/цена. Архивиран продукт невидим в storefront, поръчките му запазени.

FR-19: Viber нотификации за admin — при нова поръчка Viber съобщение с: продукт, количество, адрес, метод на плащане, специални бележки. Email fallback задължителен (Viber API одобрение отнема 2–4 седмици — вижте Risk Register).

FR-20: Seller Story страница — "Нашата история" с Стефка Григорова: снимка, личен разказ, защо прави свещи, производствен процес, ценности на бранда. Опционално: кратко видео от ателието. Person + Organization Schema.org markup.

FR-21: Reviews система — 5 дни след "Доставена" → имейл покана за review. Купувачът оставя: текст + снимка + 1-5 звезди. Admin одобрява преди публикуване. Reviews с снимки по-prominent. Средна оценка на product page. Schema.org AggregateRating + Review markup.

FR-23: Occasion Landing Pages — 5 SSG страници: /za-rozhden-den, /za-koleda, /za-8-mart, /za-svatba, /korporativni-podaratsi. Всяка: уникален H1, мета описание, филтриран продуктов grid, FAQPage Schema.org (top 3 въпроса per occasion).

FR-24: Структурирани данни (разширени) — пълна Schema.org имплементация: Product + AggregateRating + Offer + BreadcrumbList на product pages; WebSite + Organization + Person (Стефка) на homepage; ItemList + FAQPage на occasion pages; CollectionPage + ItemList на collections. Google Rich Results Test в CI.

FR-26: Newsletter — абонамент с double opt-in (потвърждение по имейл). При абониране → 5% off купон за първа поръчка. GDPR: explicit consent задължителен.

FR-32: Правни & Cookie страници — три статични Astro SSG страници: `/politika-za-poveritelnost` (GDPR Privacy Policy), `/obshti-usloviya` (Terms of Service + право на отказ 14 дни по ЗЗП), `/politika-za-cookies`. Cookie consent banner (GTM Consent Mode v2): появява се при първо посещение, блокира GTG/CAPI fire до user consent, state persists в localStorage. Footer: задължителни линкове към трите страници.

FR-33: Контакти & Връщания страница — `/kontakti` статична страница (Astro SSG): имейл, Viber/WhatsApp бутон за директен контакт, кратка политика за връщане (14 дни по ЗЗП). Замества chatbot за MVP — contact button е нулев performance overhead. Linкване от footer и от product pages.

#### Out of Scope за MVP (v2/v3)

FR-9 (Изпрати като изненада) → **v2 ПРИОРИТЕТ #1** — core JTBD за gift купувача, незаменим за brand differentiation | FR-15 (Abandoned Cart) → v2 | FR-16 (Birthday Reminder) → v2 | FR-22 (Community галерия) → v2 | FR-25 (Instagram Shop) → v2 | FR-27 (Referral) → v2 | FR-28 (Loyalty точки) → v2 | FR-29 (QR кодове) → v2 | FR-30 (EN език) → v2 | FR-31 (Адвент Календар) → ноември 2026 | Chatbot (сложна интеграция, тежко за performance) → v2 или замества с Viber Business button (FR-33)

FR-34: Catalog Export API & Marketplace Integrations → **v2 (след FR-30 EN език)** — Kandles като глобален B2B бранд:

- **Partner REST API** — `/api/v1/catalog` (JSON, пагиниран, versioned), автоматично генериран API key per партньор, управление от Admin панела (партньори, keys, per-partner markup override напр. +15% за marketplace fee)
- **Стандартни product feeds (auto-генерирани при всяка product промяна):**
  - `/feeds/google-shopping.xml` — Google Merchant Center XML feed (Product Schema: title, description, price, availability, image, GTIN/MPN)
  - `/feeds/facebook-catalog.csv` — Meta Commerce Manager catalog (id, title, description, price, image_link, availability, condition)
  - `/feeds/ozone.csv` — Ozone.bg формат (BG пазар)
  - `/feeds/emag.csv` — eMAG формат (BG + RO пазар)
- **Marketplace интеграции (API push, не само pull):** Etsy (EU/US, Handmade категория), Amazon Handmade (global), Ozone.bg, eMAG
- **Stock sync:** real-time webhook push до партньорите при промяна на `stock` (или hourly batch за по-прости интеграции)
- **Prerequisite:** FR-30 EN език (feed-овете трябва да имат EN локализация за международни marketplaces)
- **Architecture note:** Feed endpoints живеят в `apps/storefront` като Astro SSR endpoints (edge-rendered, CDN cached 5 мин); Partner API в `apps/admin` (auth-protected)

---

### Non-Functional Requirements

NFR-1: Core Web Vitals на мобилен — **LCP < 2.5s** (Lighthouse "Good" threshold), CLS < 0.1, INP < 200ms. Измервано в CI при всеки deploy. Explicit performance budget като AC в Epic 2 stories.

NFR-2: Mobile-first перформанс — TTI < 5 секунди на 4G мобилен. Astro Islands → нулев JS overhead за статични pages.

NFR-3: GDPR compliant — newsletter double opt-in, cookie consent banner (GTM Consent Mode v2, AR-32), Cloudflare Turnstile на checkout (invisible, GDPR-friendly), self-hosted шрифтове (не Google Fonts CDN), Plausible Analytics (privacy-first), retention policies за PII. Meta CAPI server-side (без browser cookie от Facebook). Политика за поверителност линкната от footer и checkout.

NFR-4: SEO от ден 1 — readable URLs (/kolektsii/rozhden-den), comprehensive Schema.org (Product, Organization, Person, FAQPage, ItemList), sitemap.xml + robots.txt (AR-37), language-specific meta tags, occasion SSG pages, Google Rich Results Test в CI.

NFR-5: Security — 8 слоя: Supabase RLS, CSP headers, Upstash Redis rate limiting (разширен — AR-36), Stripe 3DS (Hosted Checkout), Cloudflare Turnstile, git-secrets CI pre-commit, @t3-oss/env-nextjs build fails при missing secret, stripe_webhook_events idempotency.

NFR-6: Business metrics — Conversion rate ≥ 2.5%, AOV ≥ 35 лв, Review submission ≥ 20%, Newsletter open rate ≥ 35%.

NFR-7: Lighthouse ≥ 90 на всички категории — Performance / Accessibility / Best Practices / SEO — задължително и на mobile, и на desktop. @lhci/cli блокира merge при < 90 на Performance mobile.

NFR-8: Third-party scripts с нулев main thread impact — GTG (Google Tag Gateway) за Google тагове; Meta Conversions API server-side за Facebook (нула browser Pixel script); Chatbot → замества с `/kontakti` страница + Viber/WhatsApp button (нулев JS overhead). Без Partytown.

NFR-9: Accessibility WCAG AA built-in — a11y е definition-of-done criterion за ВСЯКА story, не post-launch audit. Screen reader support (JAWS, NVDA, VoiceOver), keyboard navigation, focus management, ARIA landmarks.

---

### Additional Requirements (Architecture)

AR-1: **[EPIC 1 STORY 1]** Custom Turborepo bootstrap: `npx create-turbo@latest kandles --package-manager pnpm`. Версии (верифицирани 2026-06-05): create-turbo v2.9.14, Astro v6.4.3 (Node ≥ v22.12.0), Next.js v16.2.7.

AR-2: Shared packages scaffold — задължителни преди всичко останало: `packages/db` (@kandles/db), `packages/types` (@kandles/types), `packages/env` (@kandles/env), `packages/ui` (@kandles/ui), `packages/email` (@kandles/email).

AR-3: Supabase project + Drizzle schema — таблици: products (с `stock INTEGER NOT NULL DEFAULT 0`), product_images, collections, orders (с `correction_count SMALLINT NOT NULL DEFAULT 0 CHECK (correction_count <= 1)`, `preview_uploaded_at`, `approved_at`), order_items, cart_reservations (с `expires_at TIMESTAMPTZ NOT NULL`), stripe_webhook_events, users (supabase_auth_id FK), marketing_consents, reviews. Drizzle schema е source of truth; Supabase client само за Auth + Storage.

AR-4: Supabase RLS policies + Auth — single admin user, signup disabled в Dashboard, ADMIN_EMAIL hardcoded в env. Storefront: anon key + RLS (reads only). Admin: service_role само на Vercel сървър.

AR-5: Astro Islands architecture — `output: 'hybrid'` (SSG default + SSR за dynamic endpoints). React Islands само за интерактивни компоненти: BouquetConfigurator, Cart, ProductGallery, NewsletterForm.

AR-6: Next.js App Router admin — Server Actions за всички мутации (CSRF protected), shadcn/ui от @kandles/ui, React Hook Form + Zod resolver, TanStack Table.

AR-7: Stripe Hosted Checkout (не custom form) — Stripe управлява 3DS диалозите, ApplePay/GooglePay, PCI compliance. cash_on_delivery → не се създава Payment Intent; flow се разклонява след address step. Apple Pay/GooglePay се показват prominent като primary CTA на mobile.

AR-8: Webhook idempotency + cron reconciliation — stripe_webhook_events таблица с stripe_event_id UNIQUE. Background cron (15 мин) → stripe.paymentIntents.retrieve() за pending поръчки > 30 мин.

AR-9: Cart reservations — cart_reservations таблица с 30 мин TTL при checkout.start (SELECT FOR UPDATE). Abandoned cart purge след 30 дни. TTL cleanup cron: pg_cron или Vercel cron `DELETE FROM cart_reservations WHERE expires_at < NOW()` — изпълнява се hourly.

AR-10: localStorage cart → DB sync при checkout.start. Warning toast при private browsing detection (cart загуба).

AR-11: Cloudflare Images pipeline — WebP/AVIF auto-conversion, resize on-the-fly, aggressive CDN cache (1 year). `file-type` magic bytes validation + UUID filenames + 10MB size limit при upload.

AR-12: @kandles/env dual export — packages/env/src/nextjs.ts (NEXT_PUBLIC_ prefix), packages/env/src/astro.ts (PUBLIC_ prefix), packages/env/src/index.ts (server secrets). Build fails при missing secret.

AR-13: Upstash Redis rate limiting — sliding window: checkout (5 req/min), newsletter (3 req/min), reviews (2 req/min), contact form (5 req/min), admin login (3 req/min). Пълен обхват дефиниран в AR-36.

AR-14: Bot protection — Cloudflare Turnstile (invisible, GDPR-friendly) на checkout форма. hCaptcha при повторни грешки (> 3).

AR-15: Data retention cron jobs — pg_cron (Supabase Pro) или Vercel cron: PII anonymize 3 години след последна поръчка, abandoned cart hard delete след 30 дни, expired cart_reservations delete hourly. SQL файлове: packages/db/src/cron/anonymize-orders.sql, purge-abandoned-carts.sql, cleanup-cart-reservations.sql.

AR-16: CI/CD GitHub Actions — при PR: pnpm install → turbo typecheck lint test → turbo build → Drizzle migration dry-run. При merge main: Vercel deploy (admin) + wrangler CLI (Cloudflare Pages storefront) + Lighthouse CI check + Google Rich Results Test validation + sitemap validation.

AR-17: Monitoring stack — Sentry (error tracking + source maps, двете apps — setup в Epic 1, вижте AR-39), Axiom (structured logs), Pino logger в Next.js (задължителен [functionName] prefix), Vercel Analytics (admin), Cloudflare Analytics (storefront), Plausible (business metrics).

AR-18: Testing strategy — Vitest (unit/integration: schema tests, Zod validation, Server Actions с mocked Supabase). Playwright E2E: checkout happy path (Stripe test mode), admin order status flow, product page gallery + configurator, accessibility checks (axe-core). Lighthouse CI за performance regression. Co-located тестове.

AR-19: Split hosting — Cloudflare Pages за storefront (edge, global, free tier), Vercel за admin (serverless functions, Supabase Postgres direct connection).

AR-20: Preview-photo approval state machine — signed JWT с expiry, max 3 изпращания на approval link. DB tracking: preview_uploaded_at, approved_at, correction_count в orders таблицата. DB-level CHECK constraint: `correction_count <= 1`.

AR-21: ApiResponse<T> standard — всички Server Actions и API routes връщат:
`{ success: true; data: T } | { success: false; error: string; code: ErrorCode }`
Codes: VALIDATION_ERROR | NOT_FOUND | UNAUTHORIZED | RATE_LIMITED | INVENTORY_INSUFFICIENT | PAYMENT_FAILED | INTERNAL. Никога stack traces към client.

AR-22: Inventory mutation pattern — задължително SELECT FOR UPDATE + Drizzle transaction при всяка inventory промяна. TOCTOU checks забранени.

AR-23: GTG (Google Tag Gateway) — конфигуриран в GTM UI, маршрутизира Google Analytics 4 и Google Ads тагове през `metrics.kandles.bg` subdomain. Без отделен sGTM сървър. Browser GTM container остава минимален (само GTG client). Без @astrojs/partytown. GTG fire само след cookie consent (GTM Consent Mode v2).

AR-24: Meta Conversions API (CAPI) — server-side events имплементирани в `apps/admin/src/app/api/webhooks/stripe/route.ts`. Events: Purchase (при payment_intent.succeeded), InitiateCheckout (при checkout.start), ViewContent (optional). **Deduplication с `event_id`**: browser генерира UUID при checkout start, изпраща в Stripe metadata, webhook handler използва същия UUID — елиминира дублирани conversion events. Нула browser Facebook Pixel script.

AR-25: Scroll анимации — три слоя (Lighthouse-safe):
- Layer 1: CSS Scroll-Driven Animations (Chrome 115+, progressive enhancement, 0KB JS) — hero parallax, product card reveal, section fade-in
- Layer 2: Intersection Observer (native browser API) — CSS class toggles за reveal animations в Astro компоненти
- Layer 3: Motion One (3KB gzip) — само в React Islands (BouquetConfigurator steps, Cart drawer, gift wrap ribbon)
- Lenis smooth scroll (6KB, само при `prefers-reduced-motion: no-preference`)
- GSAP: забранен в MVP (67KB gzip, прекалено тежък)

AR-26: Caching стратегия:
- SSG product pages → Cloudflare edge, Cache-Control: public max-age=86400 stale-while-revalidate=3600
- Stock availability → Supabase Realtime subscription за critical updates
- Courier price API → 5 мин cache
- Images → Cloudflare Images CDN, 1 година
- Static assets (JS/CSS) → content-hash filenames → Cache-Control: immutable, 1 година
- Occasion landing pages → full SSG, rebuild при product change

AR-27: Lighthouse CI — @lhci/cli в GitHub Actions, блокира merge при Performance < 90 на mobile симулация. Runs срещу staging URL преди production deploy.

AR-28: Resource hints в <head>:
`<link rel="preconnect" href="https://[project].supabase.co">`
`<link rel="preconnect" href="https://js.stripe.com">`
`<link rel="dns-prefetch" href="https://www.googletagmanager.com">`
`<link rel="preload" as="image" href="/hero.webp" fetchpriority="high">`
`<link rel="preload" as="font" href="/fonts/cormorant-garamond-bg.woff2" crossorigin>`

AR-29: Self-hosted шрифтове — Cormorant Garamond (display, кирилица ✅) + Jost (UI, кирилица ✅). Subset: само BG кирилица + латиница (~70% по-малък файл). font-display: swap. Self-hosted в storefront/public/fonts/ — не Google Fonts CDN (GDPR + DNS lookup elimination). Font subsetting е blocking за Lighthouse ≥ 90 — задължителна Story 1.x.

AR-30: Comprehensive Schema.org — `packages/types/src/schema-org.ts` генерира типизирани JSON-LD обекти. `storefront/src/lib/schema-org.ts` е shared utility за всички Astro pages. Покритие:

| Страница | Schema типове |
|---|---|
| Homepage | WebSite + Organization + Person (Стефка) |
| Product page | Product + AggregateRating + Offer + BreadcrumbList |
| Occasion pages | ItemList + FAQPage |
| Collections | CollectionPage + ItemList |
| "Нашата история" | Person + Organization |
| Review section | Review + AggregateRating |

Google Rich Results Test validation в CI (блокира при errors).

AR-31: **[EPIC 1 + EPIC 2 + EPIC 5]** Inventory stock management — `stock INTEGER NOT NULL DEFAULT 0` е явна колона в products таблицата (вече в AR-3). Out-of-stock states в storefront: при `stock = 0` → badge "Изчерпан" (не скрива продукта) + disabled add-to-cart бутон + `aria-disabled="true"`. Real-time stock validation преди Stripe session creation (не само cart_reservations). Admin: bulk edit включва stock; low-stock dashboard alert при `stock ≤ 3`. Gift Sets: атомарна stock консумация на всички компоненти (вече AR-22).

AR-32: **[EPIC 2]** Legal & Cookie consent — три статични Astro SSG страницата (FR-32): `/politika-za-poveritelnost`, `/obshti-usloviya`, `/politika-za-cookies`. Cookie consent banner: GTM Consent Mode v2 интеграция — GTG и Meta CAPI fire само след `analytics_storage: 'granted'`. Consent state persists в localStorage ключ `kd_consent`. Banner: chocolate bg + cream text + два бутона ("Приемам" / "Откажи"). Footer: задължителни линкове. `/obshti-usloviya` съдържа право на отказ 14 дни (ЗЗП член 50).

AR-33: **[EPIC 2]** Error states & empty states — branded, не generic browser pages:
- `apps/storefront/src/pages/404.astro` — dark colorway, brand voice copy "Изгубихте се? Намерете пътя към свещите.", CTA към каталога
- `apps/storefront/src/pages/500.astro` — light colorway, "Нещо се обърка от наша страна. Опитайте отново след малко."
- Empty cart state — SVG brand illustration (aria-hidden) + "Количката е празна" + CTA бутон
- Out-of-stock product state — (AR-31) — "Изчерпан" badge, disabled бутон
- Empty occasion grid — "Няма продукти в тази категория все още" + link към всички продукти
- Loading skeleton — sand + chocolate pulse lines (CSS animation `@keyframes pulse`, 0 JS)
- Admin 404 + Unauthorized pages в Next.js

AR-34: **[EPIC 1]** Drizzle migration strategy — Explicit decision (не ambiguous): `drizzle-kit generate` → генерира SQL migration файлове в `packages/db/drizzle/migrations/`. `drizzle-kit migrate` → прилага в CI преди E2E тестове и в production deploy. `drizzle-kit push` → само за local dev и Supabase Branch databases. Migration файловете се commit-ват в git (version-controlled schema history). Никога `push` в production. CI gate: migration apply step преди Playwright E2E.

AR-35: **[EPIC 1]** DB seed data — `packages/db/src/seed.ts` с: 3 примерни колекции (Флорална, Коледна, Подаръчни комплекти), 6 примерни продукта (с всички полета, occasion tags, stock > 0), 1 admin user (ADMIN_EMAIL от env), 2 одобрени reviews. Script: `pnpm --filter @kandles/db seed`. Задължително за local dev onboarding. TypeScript, Drizzle client.

AR-36: **[EPIC 4 + EPIC 7]** Rate limiting разширен — Upstash Redis sliding window (централизирана конфигурация в `packages/env`):
- checkout: 5 req/min per IP
- newsletter subscribe: 3 req/min per IP
- review submit: 2 req/min per IP + user
- contact form: 5 req/min per IP
- admin login: 3 req/min per IP
`X-RateLimit-Remaining` header в response. Rate limit exceeded → `429 Too Many Requests` + AR-21 error response `{ code: "RATE_LIMITED" }`.

AR-37: **[EPIC 2]** Sitemap + robots.txt — `@astrojs/sitemap` интеграция в `astro.config.ts` (auto-генерира sitemap.xml при build, включва product/collection/occasion pages, excludа /admin). `apps/storefront/public/robots.txt`:
```
User-agent: *
Allow: /
Disallow: /api/
Sitemap: https://kandles.bg/sitemap-0.xml
```
Canonical `<link rel="canonical" href="...">` на всяка product, collection, и occasion страница. CI: проверка sitemap.xml генерирана и непразна след build.

AR-38: **[EPIC 1 — schema prep]** Search стратегия — Explicit MVP решение: **NO search UI в MVP**. Schema preparation сега: GIN index в migration:
```sql
CREATE INDEX idx_products_search ON products
USING GIN(to_tsvector('bulgarian', title || ' ' || coalesce(description, '')));
```
TODO comment в codebase: `// v1.1: full-text search — index ready, RPC + React Island TBD`. Суpabase RPC `search_products(query TEXT)` се имплементира в v1.1.

AR-39: **[EPIC 1]** Sentry explicitно в Epic 1 — setup не се defer-ва: `apps/admin/sentry.server.config.ts` + `sentry.client.config.ts` (чрез `@sentry/nextjs`), `apps/storefront/src/lib/sentry.ts` (чрез `@sentry/astro`). Source maps upload в CI при всеки deploy. DSN от `@kandles/env`. Всички последващи epics автоматично benefit-ват от error tracking от ден 1.

---

### UX Design Requirements

*Извлечени от анализ на brand system (дизайнер Hamza Shehzad), логото, цветовата система, business context, и Advanced Elicitation сесия.*

UX-DR1: Brand дизайн система с точни tokens — CSS custom properties в `storefront/src/styles/tokens.css`:
- --color-sand: #E8D4AD (основен фон, светъл режим)
- --color-chocolate: #5A2D0C (основен бранд цвят, тъмни фонове)
- --color-amber: #B5621E (акцент, badge, sunburst)
- --color-cream: #EDE0CC (текст върху тъмен фон)
- --color-copper: #C47830 (вторичен акцент)
- --font-display: 'Cormorant Garamond', serif (headlines, кирилица ✅, self-hosted)
- --font-ui: 'Jost', sans-serif (UI, body, navigation, кирилица ✅, self-hosted)
Само тези 5 цвята. Никакви студени тонове. Никакви нови цветове без дизайн одобрение.

UX-DR2: Brand icons като UI компоненти — flame/candle-pot/sunburst SVG от Hamza Shehzad се имплементират като `<KandlesIcon variant="flame|pot|sunburst|badge" size colorway aria-hidden="true" />` React компонент. Декоративните икони → `aria-hidden="true"` (screen readers ги skip-ват). Семантичните употреби → `role="img" aria-label="..."`. Brand паттернът → inline SVG `<pattern>` за CSS background-image.

UX-DR3: Двата colorway-а — всяка секция е `data-theme="light"` (sand + chocolate) или `data-theme="dark"` (chocolate + cream + amber). Hero, Maker Story section, Newsletter CTA → dark. Product grid, checkout, product pages → light. CSS target: `[data-theme="dark"] { --color-bg: var(--color-chocolate); --color-text: var(--color-cream); }`.

UX-DR4: Сезонни token overrides — `data-season="winter|spring|summer|autumn"` на `<html>`. Максимум 2 CSS variable overrides per season (intensity промяна, не нова палитра). Server-side от lib/seasonal.ts.

UX-DR5: Editorial hero (dark colorway) — first visible screen: full-bleed chocolate background, kandles.bg SVG wordmark в cream, tagline "Освети своя свят" в Jost all-caps с letter-spacing: 0.2em, и 1 CTA бутон. Lifestyle видео (muted, autoplay, loop, lazy за LCP compliance) ИЛИ high-quality product photo с dark overlay. Hero text reveal: CSS `animation-delay` per word span (0KB JS). Никакъв product grid above the fold. LCP element е hero image/video poster — `fetchpriority="high"` задължително.

UX-DR6: Occasion-first discovery flow — под hero: 5 визуални occasion тайла (не dropdown): Рожден ден / 8-ми март / Коледа / Сватба / Просто така. Hover: 2px amber border. Click → scroll до product grid с активен occasion filter (React Island, без page reload). Keyboard navigable: `role="radiogroup"`, всяко тайло е `role="radio"`, Space/Enter за избор.

UX-DR7: Photography-first product grid — 2 колони mobile, 3 desktop, gap 24px mobile / 32px desktop. Product card: само hero image + name (Cormorant Garamond 18px) + цена (Jost 16px). Никакви badges видими by default. "Само X броя" badge → само на hover/focus: amber bg + cream text. "Изчерпан" badge → само на out-of-stock продукти, постоянно видим (copper bg + cream text). Hover glow: `box-shadow: 0 0 0 2px var(--color-amber)`. Product cards reveal: CSS Scroll-Driven Animation (`@keyframes cardReveal`, `animation-timeline: view()`).

UX-DR8: Editorial product page анатомия — секции в ред: (1) Full-bleed hero image, sand overlay на scroll (CSS parallax). (2) Brand voice description: Cormorant Garamond 22px/1.6, поетично. (3) Aroma pyramid visualization (UX-DR9). (4) "Как се прави" — 3 стъпки с KandlesIcon (`aria-hidden="true"`) като visual markers, текстовите описания са semantic. (5) Production time: "Твоята свещ ще бъде готова за 2-3 дни — направена специално за теб." (6) Свързани продукти. Specs → accordion с `<details><summary>` (native, accessible).

UX-DR9: Аромат pyramid visualization (CSS-only) — top/heart/base нотките: визуална пирамида, pure CSS + minimal inline SVG. Top = amber, heart = chocolate, base = sand с chocolate border. Hover/focus → tooltip с поетично описание. Tooltip: `role="tooltip"` + `aria-describedby` на trigger. Mobile: вертикален стак. 0 JS library.

UX-DR10: Стефка Григорова — лицето на сайта навсякъде:
- Footer: "Изработено с ♥ от Стефка Григорова" в Cormorant Garamond italic
- Product pages: "Направено от ръцете на Стефка" до production time section
- Homepage maker section (dark colorway): editorial снимка + цитат + link към "Нашата история"
- "Нашата история" page (FR-20): пълна editorial страница с Person Schema.org
- Placeholder: AI-генерирани lifestyle снимки до реален brand photoshoot (TODO коментари в кода)
- Photoshoot direction: топла светлина, свещи, дърво, ателие — атмосфера като снимката на Стефка с горящата свещ

UX-DR11: "Последна минута" — amber emotional section — background: var(--color-amber), text: var(--color-cream). KandlesIcon sunburst (`aria-hidden="true"`) вляво на heading. Copy: "Нужен е подарък за утре? Имаме нещо специално." Без countdown таймери. Само при ≥ 1 last-minute product с stock > 0. Section aria-labelledby на heading.

UX-DR12: Gift mode checkout трансформация — при gift wrap toggle ON: recipient address поле се reveals чрез height: 0 → auto transition (250ms ease-out). Gift preview image. Copy: "Вие изпращате изненада ✦". Картичка поле prominent с character counter (X/150, `aria-live="polite"` за counter updates). Ribbon SVG animation CSS-only при toggle.

UX-DR13: Brand pattern като текстура — repeating SVG pattern (inline, CSP compliant, opacity: 0.06) в: gift wrap секцията в cart, newsletter subscription секция, empty cart state. `aria-hidden="true"` на pattern container.

UX-DR14: Mobile-native navigation (< 768px) — sticky bottom nav bar: Начало / Магазин / Количка / Стефка. chocolate background + cream icons + labels. Активен tab: 2px amber top-border. `role="navigation"`, `aria-label="Мобилна навигация"`. Product gallery: CSS scroll-snap carousel. Hamburger меню забранен.

UX-DR15: Брандиран motion language — CSS Scroll-Driven Animations (Layer 1), Intersection Observer (Layer 2), Motion One в Islands (Layer 3). Lenis smooth scroll (6KB, само при `prefers-reduced-motion: no-preference`). GSAP забранен в MVP. Всички анимации: `will-change: transform` (не `will-change: all`). Само `transform` и `opacity` се анимират (нулев layout reflow). Loading skeleton: sand + chocolate pulse lines.

UX-DR16: WCAG AA accessibility built-in — задължително във всяка Story:
- Skip to content link: първи DOM елемент на всяка страница (`<a href="#main-content" class="sr-only focus:not-sr-only">`)
- Semantic HTML landmarks: `<header>`, `<nav aria-label="...">`, `<main id="main-content">`, `<footer>`
- Всички form inputs: explicit `<label>` с `for` атрибут (не само placeholder)
- Cart drawer: `role="dialog"`, `aria-modal="true"`, focus trap при отваряне, Escape затваря, focus връща се на trigger при затваряне
- ARIA live region за cart updates: `<div aria-live="polite" aria-atomic="true">` — announces "X добавен. Y продукта в количката."
- Configurator wizard: `role="tablist"`, `aria-current="step"`, `aria-label` на всяка стъпка, пълна keyboard navigation (Tab/Enter/Escape/Arrow keys)
- Product images: alt text е задължително поле в admin при upload (не optional)
- Декоративни SVG икони: `aria-hidden="true"` — не се announce-ват от screen readers
- Focus rings: 2px solid var(--color-amber), outline-offset: 2px (заменя default blue)
- Touch targets admin: minimum 48x48px (за Стефка, 60+ потребители)
- Admin session: 30-дневен persistent cookie (не logout при затваряне на браузъра)
- Color contrast: всички text/bg двойки ≥ 4.5:1; amber само за акценти, не body text
- Playwright axe-core accessibility checks в CI (блокира при violations)

UX-DR17: Comprehensive Schema.org за SEO — `lib/schema-org.ts` utility генерира типизирани JSON-LD. Инжектира се в `<head>` на всяка Astro страница. Пълно покритие:

Person schema (Стефка):
```json
{
  "@type": "Person",
  "name": "Стефка Григорова",
  "jobTitle": "Artisan Candle Maker",
  "worksFor": { "@type": "Organization", "name": "Kandles.bg" },
  "url": "https://kandles.bg/nashata-istoriya"
}
```

Organization schema:
```json
{
  "@type": "Organization",
  "name": "Kandles.bg",
  "url": "https://kandles.bg",
  "logo": "https://kandles.bg/logo.svg",
  "foundingDate": "2023",
  "description": "Ръчно изработени свещи от Стефка Григорова",
  "sameAs": ["https://instagram.com/kandles.bg"]
}
```

Product schema включва: name, description, image (array), offers (price, availability, priceCurrency), aggregateRating (ratingValue, reviewCount), brand.

FAQPage schema на occasion pages: 3 въпроса per occasion (admin управлява от CMS поле).

---

### FR Coverage Map

| FR/NFR/AR | Epic | Описание |
|---|---|---|
| FR-1 | Epic 2 | Product page галерия + описание + аромат + badge |
| FR-2 | Epic 2 | Seasonal display logic |
| FR-3 | Epic 2 | Occasion filtering + SEO URLs |
| FR-4 | Epic 2 | "Последна минута" секция (stock > 0) |
| FR-5 | Epic 3 | Букет конфигуратор wizard |
| FR-6 | Epic 3 | Preview photo approval workflow |
| FR-7 | Epic 3 | Gift wrap добавка + cart |
| FR-8 | Epic 3 | Gift Sets + атомарен инвентар |
| FR-10 | Epic 4 | Guest checkout |
| FR-11 | Epic 4 | Stripe + ApplePay/GooglePay + Наложен платеж |
| FR-12 | Epic 4 | Econt + Speedy + fallback |
| FR-13 | Epic 4 | Order tracking страница |
| FR-14 | Epic 6 | 4 транзакционни имейла |
| FR-17 | Epic 5 | Admin order management |
| FR-18 | Epic 5 | Admin product management + stock |
| FR-19 | Epic 6 | Viber нотификации + email fallback |
| FR-20 | Epic 7 | "Нашата история" — Стефка editorial page |
| FR-21 | Epic 7 | Reviews система (storefront + admin) |
| FR-23 | Epic 2 | Occasion SSG landing pages |
| FR-24 | Epic 2 | Schema.org (expanded — AR-30) |
| FR-26 | Epic 7 | Newsletter double opt-in |
| FR-32 | Epic 2 | Legal & Cookie consent pages |
| FR-33 | Epic 7 | Contact & Returns page (/kontakti) |
| NFR-7 | Epic 1 | Lighthouse CI setup |
| NFR-8 | Epic 6 | GTG + Meta CAPI (без chatbot) |
| NFR-9 | All | A11y built-in в всяка story DOD |
| AR-1→22 | Epic 1 | Platform foundation |
| AR-23 | Epic 6 | GTG (GTM Consent Mode v2) |
| AR-24 | Epic 6 | Meta CAPI + event_id dedup |
| AR-25 | Epic 2+3 | Scroll animations |
| AR-26 | Epic 1+4 | Caching strategy |
| AR-27 | Epic 1 | Lighthouse CI |
| AR-28 | Epic 2 | Resource hints |
| AR-29 | Epic 1 | Self-hosted fonts + subsetting |
| AR-30 | Epic 2 | Comprehensive Schema.org |
| AR-31 | Epic 1+2+5 | Inventory stock management |
| AR-32 | Epic 2 | Legal & Cookie consent |
| AR-33 | Epic 2 | Error states & empty states |
| AR-34 | Epic 1 | Drizzle migration strategy |
| AR-35 | Epic 1 | DB seed data |
| AR-36 | Epic 4+7 | Rate limiting разширен |
| AR-37 | Epic 2 | Sitemap + robots.txt |
| AR-38 | Epic 1 | Search schema prep (UI → v1.1) |
| AR-39 | Epic 1 | Sentry explicit setup |
| UX-DR1→4 | Epic 2 | Brand дизайн система + tokens |
| UX-DR5→11 | Epic 2 | Storefront UX |
| UX-DR12→13 | Epic 3 | Gift experience UX |
| UX-DR14→15 | Epic 2 | Mobile nav + motion |
| UX-DR16 | All | A11y built-in |
| UX-DR17 | Epic 2 | Schema.org implementation |

---

## Epic List

### Epic 1: Platform Foundation

Turborepo монорепо с всички shared packages, Supabase проект с пълна Drizzle schema (включва `stock`, `correction_count CHECK`, `cart_reservations.expires_at`), explicit Drizzle migration strategy (generate + migrate, не push в production), RLS политики, Auth, split hosting (Cloudflare Pages + Vercel), CI/CD GitHub Actions с Lighthouse CI + migration gate, self-hosted шрифтове (Cormorant Garamond + Jost BG subset), @kandles/env dual export, brand CSS токени, data retention cron jobs (включва cart_reservations cleanup), DB seed data (`packages/db/src/seed.ts`), Sentry setup (двете apps, от ден 1), GIN index за бъдещ search (v1.1). Всяко последващо epic build-ва върху тази основа.

**User outcome:** Разработчикът стартира проекта с `pnpm seed`, CI/CD работи, Sentry улавя грешки от ден 1, Lighthouse CI блокира регресии, migration history е чист и version-controlled.

**FRs covered:** AR-1, AR-2, AR-3, AR-4, AR-12, AR-15, AR-16, AR-17, AR-18, AR-19, AR-26 (infra layer), AR-27, AR-29, AR-34, AR-35, AR-38, AR-39, NFR-5, NFR-7

---

### Story 1.1: Turborepo монорепо + shared packages scaffold

As a developer,
I want a Turborepo monorepo with all shared packages initialized,
So that all apps share types, DB client, UI components, and email templates from a single source of truth.

**Acceptance Criteria:**

**Given** the repo is cloned and Node ≥ v22.12.0 is active
**When** `pnpm install` runs
**Then** all dependencies install without errors across all workspaces

**Given** `turbo.json` defines build pipeline
**When** `turbo build` runs
**Then** packages build in dependency order: types → env → db → ui → email → apps

**Given** workspace is configured
**When** `pnpm --filter @kandles/storefront dev` runs
**Then** only the storefront app starts (not admin)

**Given** all packages are scaffolded
**Then** `packages/db`, `packages/types`, `packages/env`, `packages/ui`, `packages/email` each exist with `package.json`, `tsconfig.json`, and `src/index.ts` stub

**Given** Node version requirement
**Then** `.nvmrc` contains `22` and root `package.json` has `"engines": { "node": ">=22.12.0", "pnpm": ">=9" }`

**Given** `apps/storefront` uses Astro v6.4.3 and `apps/admin` uses Next.js v16.2.7
**When** `turbo typecheck` runs
**Then** all packages and apps pass TypeScript checks with zero errors

---

### Story 1.2: Environment validation + secrets management

As a developer,
I want `@kandles/env` to validate all environment variables at build time,
So that the app fails fast at build if any required secret is missing — never silently at runtime.

**Acceptance Criteria:**

**Given** `packages/env/src/nextjs.ts` exports NEXT_PUBLIC_ vars via `@t3-oss/env-nextjs`
**When** Next.js build runs with a required var missing
**Then** build fails with a descriptive Zod error naming the missing variable

**Given** `packages/env/src/astro.ts` exports PUBLIC_ vars
**When** Astro build runs with a required var missing
**Then** build fails with a descriptive error (not a runtime crash)

**Given** `packages/env/src/index.ts` exports server-only secrets (Supabase service_role, Stripe secret key, etc.)
**When** this module is imported in a file that ends up in a client bundle
**Then** TypeScript compilation fails with a clear error

**Given** all required env vars are set correctly
**When** both apps build
**Then** env values are accessible as fully-typed objects throughout the codebase

**Given** `.env.example` exists in repo root
**Then** it lists every required variable with placeholder values and one-line comments explaining each

**Given** `git-secrets` is configured as a pre-commit hook
**When** a commit contains a pattern matching `sk_live_`, `AKIA`, or `sk_test_` outside of `.env.example`
**Then** the commit is rejected with the matching secret pattern shown

---

### Story 1.3: Core DB schema — products + collections + Drizzle migration strategy

As a developer,
I want the products, collections, and product_images Drizzle schema with an explicit migration strategy,
So that Epic 2 (storefront) has a correct DB foundation and the team has a safe, version-controlled migration process.

**Acceptance Criteria:**

**Given** `packages/db/src/schema/products.ts` exists
**Then** it defines: `id` (uuid, PK), `title` (varchar 255, NOT NULL), `description` (text), `price` (numeric 10,2, NOT NULL), `stock` (integer, NOT NULL DEFAULT 0), `season` (enum: spring|summer|autumn|winter|all), `is_last_minute` (boolean, DEFAULT false), `is_archived` (boolean, DEFAULT false), `production_days` (smallint), `occasion_tags` (text[]), `created_at`, `updated_at`

**Given** `packages/db/src/schema/collections.ts` exists
**Then** it defines: `id` (uuid, PK), `name` (varchar 100, NOT NULL), `slug` (varchar 100, UNIQUE, NOT NULL), `season_start_month` (smallint 1–12), `season_end_month` (smallint 1–12), `is_active` (boolean, DEFAULT true)

**Given** `packages/db/src/schema/product_images.ts` exists
**Then** it defines: `id` (uuid, PK), `product_id` (uuid, FK → products ON DELETE CASCADE), `url` (text, NOT NULL), `alt_text` (varchar 255, NOT NULL — never nullable), `sort_order` (smallint, DEFAULT 0), `is_hero` (boolean, DEFAULT false)

**Given** Drizzle migration strategy (AR-34)
**When** `pnpm --filter @kandles/db generate` runs
**Then** SQL migration files appear in `packages/db/drizzle/migrations/` and are committed to git

**Given** migration files exist in git
**When** `pnpm --filter @kandles/db migrate` runs against Supabase
**Then** schema is applied idempotently (safe to run multiple times)

**Given** GIN index for future search (AR-38)
**Then** a migration file contains:
```sql
-- v1.1: full-text search — index ready, UI deferred
CREATE INDEX CONCURRENTLY idx_products_search
ON products USING GIN(to_tsvector('bulgarian', title || ' ' || coalesce(description, '')));
```

**Given** `drizzle.config.ts` at repo root of `packages/db`
**Then** it uses `dialect: 'postgresql'`, `schema: './src/schema'`, `out: './drizzle/migrations'`, and connection string from `@kandles/env`

---

### Story 1.4: Orders + checkout DB schema

As a developer,
I want the orders, order_items, cart_reservations, and stripe_webhook_events Drizzle schema,
So that Epic 4 (checkout) has a complete and correct DB foundation with proper constraints.

**Acceptance Criteria:**

**Given** `packages/db/src/schema/orders.ts` exists
**Then** it defines: `id` (uuid, PK), `user_id` (uuid, nullable FK → users), `guest_email` (varchar 255), `status` (enum: received|in_production|ready|shipped|delivered, DEFAULT received), `payment_method` (enum: card|cash_on_delivery), `stripe_payment_intent_id` (varchar, nullable), `tracking_number` (varchar, nullable), `courier` (enum: econt|speedy|manual, nullable), `gift_wrap` (boolean, DEFAULT false), `gift_card_text` (varchar 150, nullable), `preview_uploaded_at` (timestamptz, nullable), `approved_at` (timestamptz, nullable), `correction_count` (smallint, NOT NULL DEFAULT 0), `total_price` (numeric 10,2, NOT NULL), `shipping_address` (jsonb, NOT NULL), `created_at`, `updated_at`

**Given** `correction_count` column definition
**Then** a CHECK constraint `correction_count <= 1` is present in the migration SQL

**Given** `packages/db/src/schema/order_items.ts` exists
**Then** it defines: `id` (uuid, PK), `order_id` (FK → orders ON DELETE CASCADE), `product_id` (FK → products), `quantity` (smallint, NOT NULL), `unit_price` (numeric 10,2, NOT NULL), `snapshot_title` (varchar 255, NOT NULL), `snapshot_image_url` (text)

**Given** `packages/db/src/schema/cart_reservations.ts` exists
**Then** it defines: `id` (uuid, PK), `product_id` (FK → products), `quantity` (smallint, NOT NULL), `session_id` (varchar 255, NOT NULL), `expires_at` (timestamptz, NOT NULL), `order_id` (uuid, nullable FK → orders), `created_at`

**Given** `packages/db/src/schema/stripe_webhook_events.ts` exists
**Then** it defines: `stripe_event_id` (varchar, PRIMARY KEY), `processed_at` (timestamptz, DEFAULT NOW())

**Given** schemas are added and `generate` runs
**When** migration is applied
**Then** Supabase shows all new tables with correct columns and constraints

---

### Story 1.5: Users + Auth + Supabase RLS policies

As admin (Стефка),
I want secure Supabase Auth with single-admin access and correct RLS policies,
So that only the admin can write data, while buyers can safely read products and approved reviews.

**Acceptance Criteria:**

**Given** `packages/db/src/schema/users.ts` exists
**Then** it defines: `id` (uuid, PK), `supabase_auth_id` (uuid, UNIQUE, NOT NULL), `email` (varchar 255, NOT NULL), `created_at`

**Given** `packages/db/src/schema/marketing_consents.ts` exists
**Then** it defines: `id` (uuid, PK), `email` (varchar 255, NOT NULL), `consented_at` (timestamptz, NOT NULL), `source` (varchar 50), `unsubscribed_at` (timestamptz, nullable)

**Given** `packages/db/src/schema/reviews.ts` exists
**Then** it defines: `id` (uuid, PK), `product_id` (FK → products), `order_id` (FK → orders, nullable), `rating` (smallint 1–5, NOT NULL), `text` (text), `image_url` (text, nullable), `is_approved` (boolean, DEFAULT false), `created_at`

**Given** Supabase Auth configuration
**Then** new user signup is disabled (Email Provider → "Disable sign ups" = ON in Supabase Dashboard)
**And** `ADMIN_EMAIL` from `@kandles/env` is the only allowed login email

**Given** RLS is enabled on `products` table
**When** anon key executes `SELECT * FROM products WHERE is_archived = false`
**Then** query returns rows successfully

**Given** RLS is enabled on `orders` table
**When** anon key attempts `INSERT INTO orders`
**Then** query is rejected with RLS violation (storefront uses service-role via API endpoint only)

**Given** RLS on `reviews` table
**When** anon key reads reviews
**Then** only rows where `is_approved = true` are returned

**Given** service_role key is used in admin (Vercel server environment only)
**Then** it bypasses RLS and can write to all tables
**And** service_role key is NEVER present in any client-side bundle (verified via `@t3-oss/env-nextjs` server-only guard)

---

### Story 1.6: Split hosting setup — Cloudflare Pages + Vercel

As a developer,
I want both apps deployable to their respective hosting platforms with working base routes,
So that the storefront runs on Cloudflare edge globally and the admin runs on Vercel with Supabase access.

**Acceptance Criteria:**

**Given** `apps/storefront/astro.config.ts` is configured
**Then** `output: 'hybrid'` is set (SSG default + SSR for dynamic endpoints)
**And** `@astrojs/cloudflare` adapter is installed and configured

**Given** `apps/storefront/wrangler.toml` exists
**When** `wrangler pages deploy ./dist` runs
**Then** storefront deploys to Cloudflare Pages and `GET /` returns HTTP 200

**Given** `apps/admin/vercel.json` exists
**When** `vercel deploy` runs
**Then** admin deploys and `GET /` redirects to `/login` (or renders login page) with HTTP 200/302

**Given** both apps import from `@kandles/env`
**Then** all required env vars are validated at build time on both platforms
**And** builds fail descriptively if any secret is missing

**Given** admin app connects to Supabase
**Then** it uses `@kandles/db` with service_role key (server-only)
**And** no Supabase credentials appear in any client bundle

**Given** storefront connects to Supabase
**Then** it uses anon key only for SSR data fetching in Astro components

---

### Story 1.7: CI/CD GitHub Actions pipeline

As a developer,
I want GitHub Actions CI/CD that validates code quality, runs migrations safely, and blocks Lighthouse regressions,
So that the main branch always has passing tests, correct schema, and Lighthouse ≥ 90.

**Acceptance Criteria:**

**Given** `.github/workflows/pr.yml` exists
**When** a PR is opened or updated
**Then** pipeline runs in order: `pnpm install` → `turbo typecheck` → `turbo lint` → `turbo test` → `turbo build` → Drizzle migration dry-run

**Given** Drizzle migration dry-run step
**When** pending unapplied migrations exist in `packages/db/drizzle/migrations/`
**Then** step validates SQL syntax and exits 0 (does not apply to production DB)

**Given** `.github/workflows/deploy.yml` exists
**When** PR merges to main
**Then** pipeline runs: Vercel deploy → Cloudflare Pages deploy → Lighthouse CI → Google Rich Results Test

**Given** `lighthouserc.js` configuration
**Then** it asserts all four categories ≥ 90 (Performance, Accessibility, Best Practices, SEO) on mobile simulation
**And** merge is blocked if Performance mobile < 90

**Given** GitHub Actions secrets
**Then** all sensitive values (Supabase URLs, Stripe keys, Sentry tokens) come from GitHub Secrets — never hardcoded in workflow files

**Given** Turborepo remote cache (optional but configured)
**Then** `turbo.json` has `remoteCache` configured to skip redundant rebuilds on unchanged packages

**Given** `axe-core` Playwright accessibility check in CI (AR-18)
**Then** it runs against storefront and blocks merge on WCAG AA violations

---

### Story 1.8: Self-hosted fonts + brand CSS design tokens

As a buyer,
I want the site to load in the correct Kandles brand typography with Bulgarian Cyrillic support,
So that the brand experience is consistent from the first render without GDPR-violating third-party font requests.

**Acceptance Criteria:**

**Given** `apps/storefront/public/fonts/` exists
**Then** it contains: `cormorant-garamond-bg.woff2` (BG Cyrillic + Latin subset) and `jost-bg.woff2` (BG Cyrillic + Latin subset)

**Given** font subsetting is complete
**Then** each font file is ≤ 35KB (full Cormorant Garamond is ~120KB — subsetting eliminates unused glyph ranges)

**Given** `apps/storefront/src/styles/tokens.css` exists and is imported in the Astro layout
**Then** it defines all 5 CSS custom properties: `--color-sand: #E8D4AD`, `--color-chocolate: #5A2D0C`, `--color-amber: #B5621E`, `--color-cream: #EDE0CC`, `--color-copper: #C47830`
**And** `--font-display: 'Cormorant Garamond', serif` and `--font-ui: 'Jost', sans-serif`

**Given** `@font-face` declarations in tokens.css
**Then** `font-display: swap` is set on both fonts
**And** `src` uses local woff2 path (no `fonts.googleapis.com` URL)

**Given** the fonts are self-hosted
**When** Playwright network test runs
**Then** zero requests are made to `fonts.googleapis.com` or `fonts.gstatic.com`

**Given** Bulgarian Cyrillic text ("Свещи", "Стефка Григорова", "Ръчно изработени")
**When** rendered in a browser
**Then** all glyphs display correctly in both Cormorant Garamond and Jost (no missing glyph rectangles)

**Given** resource hint requirement (AR-28)
**Then** Astro base layout `<head>` contains: `<link rel="preload" as="font" href="/fonts/cormorant-garamond-bg.woff2" type="font/woff2" crossorigin>`

---

### Story 1.9: Sentry + monitoring stack setup

As a developer,
I want Sentry error tracking active in both apps from day 1 with source maps,
So that runtime errors in all subsequent epics are immediately captured with actionable stack traces.

**Acceptance Criteria:**

**Given** `@sentry/nextjs` is installed in `apps/admin`
**Then** `sentry.server.config.ts` and `sentry.client.config.ts` exist at app root
**And** DSN is read from `SENTRY_DSN_ADMIN` via `@kandles/env` (never hardcoded)

**Given** `@sentry/astro` is installed in `apps/storefront`
**Then** `apps/storefront/src/lib/sentry.ts` initializes Sentry with `SENTRY_DSN_STOREFRONT` from env

**Given** a thrown uncaught error in an admin Server Action
**When** it propagates to Sentry
**Then** the error appears in Sentry dashboard within 30 seconds with correct stack trace and source-mapped file/line

**Given** a thrown uncaught error in a storefront Astro page
**When** it propagates to Sentry
**Then** the error is captured with correct context (URL, user agent)

**Given** CI deploy workflow (`deploy.yml`)
**Then** source maps are uploaded to Sentry using `SENTRY_AUTH_TOKEN` after each successful build

**Given** Sentry tunnel configuration
**Then** both apps route Sentry requests through `/api/sentry-tunnel` to bypass ad-blockers

**Given** `apps/admin` uses Pino logger (AR-17)
**Then** all logger calls include `[functionName]` prefix: e.g., `log.info('[updateOrderStatus] status changed', { orderId })`

**Given** `SENTRY_DSN_ADMIN`, `SENTRY_DSN_STOREFRONT`, `SENTRY_AUTH_TOKEN` vars
**Then** they are validated in `@kandles/env` and build fails if missing in CI

---

### Story 1.10: DB seed data + data retention cron jobs

As a developer,
I want seed data for local development and automated cron jobs for PII cleanup,
So that local dev starts with realistic data and production DB doesn't accumulate stale personal information.

**Acceptance Criteria:**

**Given** `packages/db/src/seed.ts` exists
**When** `pnpm --filter @kandles/db seed` runs
**Then** it inserts: 3 collections (Флорална пролет, Коледна магия, Подаръчни комплекти), 6 products (at least 2 occasion tags each, `stock > 0`, `production_days` set, Bulgarian titles), 1 admin user seeded with `ADMIN_EMAIL` from env, 2 approved reviews with text and rating

**Given** seed runs multiple times on same DB
**Then** it is idempotent (uses upsert / ON CONFLICT DO NOTHING — no duplicate key errors)

**Given** all seed products
**Then** each has at least one `product_images` row with non-null `alt_text`

**Given** `packages/db/src/cron/anonymize-orders.sql` exists
**Then** it executes: `UPDATE orders SET guest_email = NULL, shipping_address = '{}' WHERE created_at < NOW() - INTERVAL '3 years'`

**Given** `packages/db/src/cron/purge-abandoned-carts.sql` exists
**Then** it executes: `DELETE FROM cart_reservations WHERE created_at < NOW() - INTERVAL '30 days' AND order_id IS NULL`

**Given** `packages/db/src/cron/cleanup-cart-reservations.sql` exists
**Then** it executes: `DELETE FROM cart_reservations WHERE expires_at < NOW()`

**Given** Vercel cron alternative (for teams without Supabase Pro pg_cron)
**Then** `apps/admin/src/app/api/cron/cleanup/route.ts` exists, runs all three SQL jobs, is protected by `Authorization: Bearer ${CRON_SECRET}` header check, and is configured in `vercel.json` to run on schedule

---

### Epic 2: Продуктов Каталог & Brand Experience

Пълното storefront преживяване: brand дизайн система (5 цвята + 2 шрифта), editorial hero (dark colorway, CSS word-reveal), occasion-first discovery (5 тайла, React Island filter), product grid (photography-first, out-of-stock states — AR-31, AR-33), editorial product pages (аромат pyramid, maker присъствие), сезонно показване, "Последна минута" amber секция, 5 occasion SSG landing pages, Schema.org (AR-30), resource hints, CSS Scroll-Driven Animations + Lenis, mobile bottom nav bar, **правни & cookie pages (FR-32, AR-32)**, cookie consent banner (GTM Consent Mode v2), **sitemap.xml + robots.txt (AR-37)**, **branded error pages + empty states (AR-33)**, пълна WCAG AA a11y. **Explicit performance budget:** LCP < 2.5s, INP < 200ms, CLS < 0.1 са acceptance criteria за всяка story.

**User outcome:** Купувачът открива красив artisan brand website, разглежда продукти организирани по повод, вижда ясно out-of-stock статуси, cookie consent е налице от ден 1 (legal compliance), Google индексира сайта правилно от ден 1.

**FRs covered:** FR-1, FR-2, FR-3, FR-4, FR-23, FR-24, FR-32
**UX-DR covered:** UX-DR1–11, UX-DR14, UX-DR15, UX-DR16 (storefront), UX-DR17
**AR covered:** AR-5, AR-25, AR-28, AR-30, AR-31 (storefront layer), AR-32, AR-33, AR-37

---

### Story 2.1: Brand design system component library

As a developer,
I want the `<KandlesIcon>` component, colorway CSS system, and `data-theme` / `data-season` tokens implemented,
So that all subsequent stories have a consistent, accessible brand component foundation to build on.

**Acceptance Criteria:**

**Given** `packages/ui/src/components/KandlesIcon.tsx` exists
**Then** it accepts `variant: 'flame' | 'pot' | 'sunburst' | 'badge'`, `size: 'sm' | 'md' | 'lg'`, `colorway: 'amber' | 'cream' | 'chocolate'`
**And** when `aria-hidden={true}` is passed, the SVG renders `aria-hidden="true"` with no accessible name

**Given** semantic icon use (not decorative)
**When** `aria-hidden` prop is omitted
**Then** TypeScript enforces that `aria-label` prop is required (union type: `{ 'aria-hidden': true } | { 'aria-label': string }`)

**Given** `[data-theme="light"]` CSS selector
**Then** it resolves: `--color-bg: var(--color-sand)`, `--color-text: var(--color-chocolate)`

**Given** `[data-theme="dark"]` CSS selector
**Then** it resolves: `--color-bg: var(--color-chocolate)`, `--color-text: var(--color-cream)`, `--color-accent: var(--color-amber)`

**Given** `[data-season="winter"]` on `<html>`
**Then** at most 2 CSS variables change (intensity override only — no new colors, no palette replacement)

**Given** brand SVG pattern (UX-DR13)
**Then** it is defined as `<svg id="kandles-bg-pattern"><defs><pattern id="kandles-pattern" ...>` in the Astro base layout
**And** its container has `aria-hidden="true"`

**Given** all `@kandles/ui` components
**Then** they are tree-shakeable named exports (no barrel `export * from` that prevents tree-shaking)

---

### Story 2.2: Editorial hero section

As a buyer,
I want to land on a full-screen brand editorial hero with the Kandles identity,
So that my first impression is a premium artisan brand, not a generic e-commerce store.

**Acceptance Criteria:**

**Given** the homepage loads
**Then** the hero is full-viewport-height with `data-theme="dark"` (chocolate background, cream text)
**And** it contains: kandles.bg SVG wordmark in cream, tagline "Освети своя свят" in Jost all-caps with `letter-spacing: 0.2em`, one CTA button linking to `#produkti`

**Given** hero text reveal animation
**Then** each word of the tagline is wrapped in `<span>` with staggered CSS `animation-delay` increments
**And** the animation uses `@keyframes` + `animation-fill-mode: forwards` with zero JS

**Given** hero image/video
**Then** `<link rel="preload" as="image" fetchpriority="high">` is in `<head>` for the hero image
**And** if video is used: `<video autoplay muted loop playsinline>` with a poster image that loads immediately

**Given** no product grid above the fold
**Then** the first viewport contains ONLY the hero (verified: no product card renders before scroll)

**Given** performance budget (NFR-1)
**When** Lighthouse runs on homepage (mobile simulation)
**Then** LCP < 2.5s, CLS < 0.1, INP < 200ms

**Given** `prefers-reduced-motion: reduce` media query
**Then** hero text animation does not play (CSS `@media (prefers-reduced-motion: reduce) { animation: none }`)

**Given** WCAG AA (UX-DR16)
**Then** hero CTA button has ≥ 4.5:1 contrast ratio
**And** focus ring is `2px solid var(--color-amber)` with `outline-offset: 2px`

**Given** skip-to-content link (UX-DR16)
**Then** `<a href="#main-content" class="sr-only focus:not-sr-only">` is the first DOM element on the page

---

### Story 2.3: Product grid + occasion filter React Island

As a buyer,
I want to browse products filtered by occasion without page reload,
So that I quickly find the right gift for my specific event.

**Acceptance Criteria:**

**Given** the product grid section
**Then** it renders 2 columns on mobile, 3 columns on desktop, `gap: 24px` mobile / `32px` desktop

**Given** 5 occasion filter tiles above the grid
**Then** they form a `role="radiogroup"`, each tile is `role="radio"`, navigable via Space/Enter
**And** selected tile shows 2px amber border; unselected tiles show no border

**Given** an occasion tile is activated
**When** clicked or Space/Enter pressed
**Then** product grid filters without page reload (React Island state update — no navigation)

**Given** a product card
**Then** it shows: hero image, product name (Cormorant Garamond 18px), price (Jost 16px) — no other elements by default

**Given** a product with `stock > 0` and `stock ≤ 5`
**Then** "Само X броя" badge appears only on card hover/focus (amber bg + cream text, `aria-label="Само X броя налични"`)

**Given** a product with `stock = 0`
**Then** "Изчерпан" badge is always visible (copper bg + cream text)
**And** add-to-cart button is `disabled` with `aria-disabled="true"` and `cursor: not-allowed`

**Given** CSS Scroll-Driven Animation (AR-25 Layer 1)
**Then** product cards use `@keyframes cardReveal` with `animation-timeline: view()` for scroll-based reveal

**Given** card hover interaction
**Then** `box-shadow: 0 0 0 2px var(--color-amber)` appears (no `width`/`height`/`top` change — zero CLS)

**Given** storefront reads products
**Then** Supabase anon key query filters `is_archived = false` and orders by `created_at DESC`

**Given** performance budget
**When** Lighthouse runs on products page (mobile)
**Then** LCP < 2.5s, INP < 200ms, CLS < 0.1

---

### Story 2.4: Editorial product page

As a buyer,
I want an editorial product page with brand voice description, aroma visualization, and maker presence,
So that I connect emotionally with the candle before purchasing.

**Acceptance Criteria:**

**Given** a product page at `/produkti/[slug]`
**Then** page sections render in order: (1) full-bleed hero image with CSS parallax sand overlay on scroll, (2) brand voice description (Cormorant Garamond 22px / line-height 1.6), (3) aroma pyramid, (4) "Как се прави" 3 steps, (5) production time, (6) related products

**Given** aroma pyramid (UX-DR9)
**Then** it is pure CSS + inline SVG: top note = amber, heart = chocolate, base = sand with chocolate border
**And** hover/focus on each note shows a tooltip with poetic description
**And** tooltip has `role="tooltip"` and trigger has `aria-describedby` pointing to it

**Given** mobile viewport for aroma pyramid
**Then** it renders as a vertical stack (not triangular)
**And** 0 JS library is used (pure CSS + SVG)

**Given** "Как се прави" section
**Then** `<KandlesIcon aria-hidden="true">` is used as visual marker for each step
**And** step text is semantic `<p>` content (accessible without icons)

**Given** production time display
**Then** it reads: "Твоята свещ ще бъде готова за [X] дни — направена специално за теб." using `production_days` from DB

**Given** "Направено от ръцете на Стефка" (UX-DR10)
**Then** this note appears near the production time section on every product page

**Given** product specs
**Then** they render in `<details><summary>` accordion (native HTML, no JS)

**Given** `getStaticPaths()` in Astro
**Then** it generates all product pages where `is_archived = false`

**Given** product images
**Then** all `<img>` elements use `alt_text` from DB (never an empty string for product photos)

**Given** performance budget
**When** Lighthouse runs on a product page (mobile)
**Then** LCP < 2.5s, CLS < 0.1, INP < 200ms

---

### Story 2.5: Seasonal display + "Последна минута" секция

As a buyer,
I want collections auto-prioritized by season and last-minute products highlighted,
So that I always see the most relevant products right now.

**Acceptance Criteria:**

**Given** `apps/storefront/src/lib/seasonal.ts` exists
**Then** it exports `getCurrentSeason(): 'winter' | 'spring' | 'summer' | 'autumn'` returning the correct value for the current month (Dec–Feb → winter, Mar–May → spring, Jun–Aug → summer, Sep–Nov → autumn)

**Given** seasonal logic runs server-side in Astro
**Then** `data-season="[season]"` is set on `<html>` at SSR time (no client-side JS toggle — zero layout shift)

**Given** admin has manually set an active collection override
**Then** it takes precedence over date-based auto-selection

**Given** "Последна минута" section (UX-DR11)
**Then** it renders ONLY when `COUNT(products WHERE is_last_minute = true AND stock > 0) ≥ 1`

**Given** the section renders
**Then** it has: `background: var(--color-amber)`, `color: var(--color-cream)`, `<KandlesIcon variant="sunburst" aria-hidden={true}>` left of heading
**And** copy: "Нужен е подарък за утре? Имаме нещо специално."
**And** `<section aria-labelledby="last-minute-heading">`

**Given** no countdown timers
**Then** no `<time>` countdown, `setInterval`, or JavaScript timer exists in this section

**Given** the section does not render (no eligible products)
**Then** zero DOM nodes remain — no empty `<section>` placeholder

**Given** seasonal collection priority
**Then** the active season's collection products appear first in homepage grid (before other collections)

---

### Story 2.6: Occasion SSG landing pages

As a buyer finding gifts via Google,
I want dedicated landing pages for each gift occasion,
So that I land directly on a curated product selection with emotional framing matched to my gift need.

**Acceptance Criteria:**

**Given** 5 Astro SSG pages exist: `/za-rozhden-den`, `/za-koleda`, `/za-8-mart`, `/za-svatba`, `/korporativni-podaratsi`
**Then** each builds at `turbo build` time as a fully static HTML file

**Given** each occasion page
**Then** it has: unique `<h1>` (e.g., "Свещи за рожден ден — ръчно изработени с любов"), unique `<meta name="description">`, filtered product grid showing only products with matching occasion tag

**Given** `FAQPage` Schema.org (UX-DR17)
**Then** each page injects JSON-LD with 3 occasion-specific FAQ `Question` + `Answer` pairs in `<head>`

**Given** CI workflow (AR-16)
**When** deploy completes
**Then** Google Rich Results Test validates at least `/za-rozhden-den` — pipeline fails on validation errors

**Given** SEO-friendly Bulgarian transliteration slugs
**Then** URLs are `/za-rozhden-den`, `/za-koleda`, `/za-8-mart`, `/za-svatba`, `/korporativni-podaratsi` (no English, no `/occasion/`)

**Given** an occasion page with zero matching products
**Then** it shows AR-33 empty state: "Няма продукти в тази категория все още" + link to all products (no broken grid)

**Given** canonical and breadcrumb (AR-37, AR-30)
**Then** each page has `<link rel="canonical">` and BreadcrumbList JSON-LD: `Начало > Поводи > [Название]`

---

### Story 2.7: Comprehensive Schema.org + sitemap + robots.txt

As a buyer discovering Kandles via Google,
I want rich search results and correct site structure,
So that Kandles appears professionally in search and Google fully understands the content.

**Acceptance Criteria:**

**Given** `packages/types/src/schema-org.ts` exports typed JSON-LD builder functions
**Then** it covers: `buildProductSchema()`, `buildOrganizationSchema()`, `buildPersonSchema()`, `buildWebSiteSchema()`, `buildFAQPageSchema()`, `buildItemListSchema()`, `buildBreadcrumbSchema()`
**And** all functions are fully typed with TypeScript (no `any`)

**Given** `apps/storefront/src/lib/schema-org.ts`
**Then** it uses the typed builders and injects JSON-LD via `<script type="application/ld+json">` in `<head>`

**Given** homepage
**Then** `<head>` contains valid JSON-LD for: WebSite (with `SearchAction`), Organization (name, url, logo, sameAs Instagram), Person (Стефка — name, jobTitle, worksFor, url)

**Given** a product page
**Then** `<head>` contains Product JSON-LD with: name, description, image array, `offers.price`, `offers.priceCurrency: "BGN"`, `offers.availability` derived from `stock > 0`, AggregateRating (if reviews exist), BreadcrumbList

**Given** `@astrojs/sitemap` in `astro.config.ts`
**When** `turbo build` runs
**Then** `dist/sitemap-0.xml` is generated containing all product, collection, and occasion page URLs
**And** admin URLs (`/admin/*`) are excluded from sitemap

**Given** `apps/storefront/public/robots.txt`
**Then** it contains:
```
User-agent: *
Allow: /
Disallow: /api/
Sitemap: https://kandles.bg/sitemap-0.xml
```

**Given** all product and occasion pages
**Then** each has `<link rel="canonical" href="https://kandles.bg/[path]">` in `<head>`

**Given** CI workflow (AR-16)
**When** deploy completes
**Then** CI asserts `sitemap-0.xml` is non-empty and contains at least 10 URLs

---

### Story 2.8: Cookie consent banner + legal pages

As a buyer,
I want a clear cookie consent choice and accessible legal pages,
So that I control my data and Kandles is GDPR compliant from day 1.

**Acceptance Criteria:**

**Given** a first-time visitor (no `kd_consent` in localStorage)
**When** any page loads
**Then** cookie consent banner appears before GTG or Meta CAPI can fire

**Given** the banner renders
**Then** it has: chocolate background, cream text, "Приемам всички бисквитки" button and "Откажи незадължителните" button
**And** `aria-live="assertive"` on the banner container

**Given** "Приемам" click
**Then** `localStorage.setItem('kd_consent', 'granted')` is set
**And** `gtag('consent', 'update', { analytics_storage: 'granted', ad_storage: 'granted', ad_user_data: 'granted' })` fires
**And** banner is removed from DOM

**Given** "Откажи" click
**Then** `localStorage.setItem('kd_consent', 'denied')` is set
**And** GTG and Meta CAPI do NOT fire for this session
**And** banner is removed from DOM

**Given** returning visitor with `kd_consent` already set in localStorage
**When** any page loads
**Then** consent banner does NOT appear

**Given** GTM Consent Mode v2 (AR-23, AR-32)
**Then** GTM container initializes with default consent state `denied` before any tags fire
**And** GTG fires analytics events only after `analytics_storage: 'granted'`

**Given** 3 SSG legal pages exist
**Then** `/politika-za-poveritelnost` (Privacy Policy), `/obshti-usloviya` (Terms — includes 14-day withdrawal right per ЗЗП чл. 50), `/politika-za-cookies` (Cookie Policy) all build at compile time

**Given** footer
**Then** links to all 3 legal pages are present on every page of the site

**Given** WCAG AA
**Then** when banner is visible: focus is trapped inside it, Escape key dismisses it (treated as "Откажи"), and screen reader announces it via `aria-live`

---

### Story 2.9: Branded error pages + empty states + skeleton loaders

As a buyer,
I want branded, helpful pages for errors and empty states,
So that even error moments feel like part of the Kandles experience.

**Acceptance Criteria:**

**Given** `apps/storefront/src/pages/404.astro` exists
**Then** it renders with `data-theme="dark"`, brand voice copy: "Изгубихте се? Намерете пътя към свещите.", `<KandlesIcon variant="flame" aria-hidden={true}>`, CTA button linking to `/produkti`

**Given** `apps/storefront/src/pages/500.astro` exists
**Then** it renders with `data-theme="light"`, copy: "Нещо се обърка от наша страна. Опитайте отново след малко.", brand logo in header

**Given** empty cart state
**Then** it shows: SVG brand decoration (`aria-hidden="true"`), "Количката е празна — намерете нещо специално", CTA button to `/produkti`
**And** brand SVG pattern texture (UX-DR13) fills the background at `opacity: 0.06`

**Given** an occasion page with zero products (AR-31 out-of-stock edge case)
**Then** it shows: "Няма продукти в тази категория все още" + `<a href="/produkti">Разгледайте всички свещи</a>`

**Given** any product image that is loading
**Then** skeleton loader renders as a div with `background: var(--color-sand)` and CSS `@keyframes pulse` shimmer using `--color-chocolate` at low opacity
**And** skeleton dimensions match the final image dimensions (zero CLS when image loads)

**Given** `apps/admin/src/app/not-found.tsx` (Next.js 404)
**Then** it renders "Страницата не е намерена" with back-to-dashboard link

**Given** all branded error pages
**Then** Playwright axe-core check passes (zero WCAG AA violations)
**And** `<title>` tag is populated (not the browser default)

---

### Story 2.10: Mobile bottom nav + scroll animations + Lenis smooth scroll

As a buyer on mobile,
I want sticky bottom navigation and smooth scroll-driven animations,
So that the site feels native on mobile and premium on all devices.

**Acceptance Criteria:**

**Given** viewport < 768px
**Then** a sticky bottom nav bar renders with 4 items: Начало, Магазин, Количка (with badge showing item count), Стефка
**And** it has `role="navigation"`, `aria-label="Мобилна навигация"`, chocolate background, cream icons + labels

**Given** active route matches a nav item
**Then** that item has `aria-current="page"` and a 2px amber top-border

**Given** viewport ≥ 768px
**Then** bottom nav is `display: none` and top header navigation is visible instead

**Given** cart item count
**Then** the Количка nav item shows a badge with count when `count > 0`, using `aria-label="Количка, X продукта"` for screen readers

**Given** CSS Scroll-Driven Animations (AR-25 Layer 1)
**Then** hero section has CSS parallax via `animation-timeline: scroll(root)`
**And** product cards have `@keyframes cardReveal` with `animation-timeline: view()` for viewport-based reveal

**Given** Intersection Observer (AR-25 Layer 2)
**Then** section headings and brand text blocks get `.is-visible` CSS class added when 20% in viewport, triggering `opacity: 0 → 1` + `translateY: 20px → 0` transition

**Given** Lenis smooth scroll (AR-25)
**When** `window.matchMedia('(prefers-reduced-motion: reduce)').matches === false`
**Then** Lenis is initialized (6KB, loaded via dynamic import)

**Given** `prefers-reduced-motion: reduce`
**Then** Lenis is NOT initialized
**And** all CSS scroll animations are disabled via `@media (prefers-reduced-motion: reduce) { animation: none; transition: none }`

**Given** all animated elements
**Then** only `transform` and `opacity` are animated (no `width`, `height`, `top`, `left`, `margin`, `padding`)

**Given** product image gallery on mobile (UX-DR14)
**Then** it uses `scroll-snap-type: x mandatory` with `scroll-snap-align: center` on each image (CSS only, zero JS)

**Given** performance budget
**When** Lighthouse runs on homepage with scroll animations active (mobile)
**Then** CLS < 0.1 (verified: animations cause zero layout shift)

---

### Epic 3: Gift Experience & Персонализация

Букет конфигуратор wizard (5 стъпки, localStorage, static preview image lookup, динамична цена, stock check пред add-to-cart, пълна keyboard navigation + ARIA tablist), preview photo approval state machine (signed JWT, max 3 изпращания, `correction_count <= 1` DB CHECK constraint, DB state tracking), gift wrap добавка в cart (ribbon CSS animation, gift mode checkout трансформация, character counter с aria-live), Gift Sets с атомарна inventory консумация (SELECT FOR UPDATE), brand паттерн текстура (aria-hidden). Motion One за Island animations.

**User outcome:** Купувачът конфигурира уникален восъчен букет, добавя луксозна опаковка с лична картичка, получава preview за одобрение — перфектно персонализирано gifting изживяване с ясна политика за корекции.

**FRs covered:** FR-5, FR-6, FR-7, FR-8
**UX-DR covered:** UX-DR10 (product page maker note), UX-DR12, UX-DR13, UX-DR16 (Islands a11y)
**AR covered:** AR-9, AR-20, AR-22, AR-25 (Motion One)

---

### Story 3.1: Букет конфигуратор wizard

As a buyer,
I want to configure a custom wax bouquet step by step,
So that I create a unique personalized gift that matches exactly my vision.

**Acceptance Criteria:**

**Given** `BouquetConfigurator` is a React Island (`client:load`) on the bouquet product page
**Then** it renders 5 sequential wizard steps: (1) flower type with images, (2) color scheme swatches, (3) count (5–30), (4) holder (кошница / без носач), (5) extras (допълнения)

**Given** the wizard step navigation
**Then** steps form a `role="tablist"`, each step is `role="tab"` with `aria-selected`
**And** current step has `aria-current="step"`
**And** Tab/Enter advances to next step, Shift+Tab goes back

**Given** step 3 (count input)
**Then** it is `<input type="number" min="5" max="30" step="1">` with keyboard +/− support
**And** count outside 5–30 range shows inline validation error `aria-describedby` on the input

**Given** any combination of step selections
**Then** total price updates in real time (no server call — price matrix defined in a config object)

**Given** a combination key `[flower_type]-[color]-[holder]`
**Then** a static preview image URL is looked up from a pre-generated map (no canvas, no WebGL, no server call)

**Given** localStorage persistence (AR-10 pattern)
**When** user refreshes the page mid-configuration
**Then** configurator state is restored from `localStorage.getItem('kd_bouquet_config')`

**Given** `bouquet_base_product.stock = 0` (AR-31)
**Then** add-to-cart button is `disabled` with `aria-disabled="true"` and tooltip "Изчерпан"

**Given** valid complete configuration and add-to-cart click
**Then** item is added to cart with `snapshot_title` containing configuration summary (e.g., "Восъчен букет — рози, розово, кошница, 15 бр.")

**Given** Motion One (AR-25 Layer 3)
**Then** step transitions use `animate()` from `motion/react`: 150ms `opacity` 0→1 + `translateX` 20px→0

**Given** performance budget
**When** Lighthouse runs on bouquet product page (mobile)
**Then** LCP < 2.5s, INP < 200ms

---

### Story 3.2: Preview photo approval state machine

As a buyer,
I want to receive a preview photo and approve or request one correction before my order ships,
So that my personalized candle matches my expectations.

**Acceptance Criteria:**

**Given** an order reaches "В производство" status and admin uploads a preview photo (FR-17)
**Then** `orders.preview_uploaded_at` is set to `NOW()`
**And** system sends approval email to `orders.guest_email` containing a signed JWT link

**Given** the approval JWT
**Then** it is signed with `PREVIEW_JWT_SECRET` from `@kandles/env`, contains `{ orderId, exp: now + 72h }`, and is generated using `jose` or `jsonwebtoken`

**Given** the approval email link `/orders/[id]/approve?token=[jwt]`
**Then** same link can be resent by admin maximum 3 times total (tracked in `orders` table column `approval_email_count`)

**Given** buyer visits approval URL with valid unexpired JWT
**Then** they see: preview photo, "Одобрявам" button, "Искам корекция" button
**And** page has `<title>` and a message: "Прегледайте своята поръчка и потвърдете"

**Given** "Одобрявам" click
**Then** `orders.approved_at = NOW()`, order status → "Готова", buyer receives confirmation email (FR-14)

**Given** "Искам корекция" click and `correction_count = 0`
**Then** `correction_count` incremented to 1, admin receives notification (Viber + email fallback per FR-19)

**Given** "Искам корекция" click and `correction_count = 1`
**Then** button is disabled with `aria-disabled="true"` and message: "Безплатната корекция е използвана — свържете се с нас за допълнителни промени"

**Given** DB CHECK constraint `correction_count <= 1` (AR-3, AR-20)
**When** any UPDATE attempts `correction_count > 1`
**Then** Supabase rejects with constraint violation (DB-level enforcement independent of application logic)

**Given** expired JWT (> 72 hours)
**When** buyer visits approval link
**Then** page shows: "Линкът е изтекъл — свържете се с нас" with link to `/kontakti`

**Given** WCAG AA
**Then** approve/reject buttons have ≥ 4.5:1 contrast ratio and are keyboard operable with visible focus rings

---

### Story 3.3: Gift wrap добавка + cart gift mode трансформация

As a buyer,
I want to add luxury gift wrap with a personal card message,
So that my order arrives beautifully wrapped with my personal touch — ready to give directly.

**Acceptance Criteria:**

**Given** the cart page
**Then** it shows a gift wrap toggle: `<input type="checkbox" id="gift-wrap">` with explicit `<label>` — not a custom `<div>` toggle

**Given** gift wrap toggle OFF → ON
**Then** recipient address field reveals via `height: 0 → auto` CSS transition (250ms ease-out, no JS animation)
**And** copy "Вие изпращате изненада ✦" appears
**And** total price updates to include +8 лв

**Given** gift wrap toggle ON → OFF
**Then** recipient address field collapses (reverse transition), copy disappears, price reverts

**Given** CSS ribbon animation (UX-DR12)
**Then** toggling ON triggers `@keyframes ribbonTie` SVG animation — CSS only, zero JS animation library

**Given** card text field
**Then** it is `<textarea maxlength="150" aria-describedby="card-counter">` 

**Given** card text input
**Then** character counter "X/150" is in `<span id="card-counter" aria-live="polite">` and announces on every keystroke

**Given** checkout with gift wrap enabled
**Then** `orders.gift_wrap = true` and `orders.gift_card_text` stored (max 150 chars enforced at DB and application level)

**Given** admin views order with gift wrap (FR-17)
**Then** `gift_card_text` is displayed prominently in the order detail view

**Given** gift wrap confirmation email (FR-14)
**Then** it uses a gift-wrapped product image variant, not the standard product photo

**Given** cart drawer (UX-DR16)
**Then** `role="dialog"`, `aria-modal="true"`, focus trap active while open, Escape closes, focus returns to open-trigger on close

**Given** cart ARIA live region (UX-DR16)
**Then** `<div aria-live="polite" aria-atomic="true">` announces "X добавен. Y продукта в количката." on item add

**Given** Motion One (AR-25 Layer 3)
**Then** cart drawer uses `animate()` from `motion/react`: 200ms `translateX` slide open/close

---

### Story 3.4: Gift Sets product type + атомарна inventory консумация

As a buyer,
I want to purchase pre-composed gift sets containing multiple candles,
So that I can gift a complete curated experience without having to build it myself.

**Acceptance Criteria:**

**Given** a Gift Set product in the DB (type flag or separate schema column `is_gift_set = true`)
**Then** its product page renders the standard editorial layout (Story 2.4) plus an "Включва" section listing component product names and images

**Given** admin creates a Gift Set (FR-18 admin panel)
**Then** they select 2+ existing products as components, set a combined price, and upload Gift Set-specific photos (the composed arrangement)

**Given** a buyer adds a Gift Set to cart and proceeds to checkout
**When** checkout session is initiated
**Then** stock for ALL component products is validated (`stock >= quantity` for each) before Stripe session creation (AR-31)

**Given** insufficient stock on any component at checkout validation
**Then** buyer receives error: "Един от продуктите в комплекта е изчерпан" with `code: "INVENTORY_INSUFFICIENT"` (AR-21)

**Given** payment confirmed (`payment_intent.succeeded` webhook fires)
**Then** stock for ALL component products is decremented atomically in a single Drizzle `.transaction()` using `FOR UPDATE` row locks (AR-22)
**And** transaction rolls back entirely if any component stock decrement fails

**Given** two concurrent orders both attempting to purchase the last unit of a component
**Then** only one transaction commits — the other receives a transaction conflict error and responds with `INVENTORY_INSUFFICIENT` to the buyer

**Given** a component product is archived (`is_archived = true`)
**Then** any Gift Set containing it shows "Временно недостъпен" badge and cannot be added to cart

**Given** admin views an order containing a Gift Set (FR-17)
**Then** order detail shows: set name, each component product name, and each component quantity (not just the composite set line)

**Given** brand SVG pattern texture (UX-DR13)
**Then** it appears in the Gift Set product page hero section at `opacity: 0.06` with `aria-hidden="true"` on the container

---

### Epic 4: Checkout, Плащане & Доставка

Guest checkout (само имейл), **real-time inventory validation преди Stripe session creation (AR-31)**, Stripe Hosted Checkout с Apple Pay/GooglePay prominent на mobile, Наложен платеж flow, Econt + Speedy API async (2s timeout + fallback), безплатна доставка ≥ 60 лв, cart reservations (SELECT FOR UPDATE, 30 мин TTL), webhook idempotency + 15 мин reconciliation cron, **Upstash rate limiting разширен (AR-36: checkout 5/min)**, Cloudflare Turnstile bot protection, Order Tracking страница (SSR endpoint, aria-live за статус updates), ARIA focus trap на cart drawer.

**User outcome:** Купувачът завършва поръчка за минути без риск от закупуване на изчерпан продукт. Системата е защитена от bot abuse и webhook replay attacks.

**FRs covered:** FR-10, FR-11, FR-12, FR-13
**AR covered:** AR-7, AR-8, AR-9, AR-10, AR-13, AR-14, AR-26, AR-31 (checkout validation), AR-36

---

### Story 4.1: Cart reservations + localStorage → DB sync

As a buyer,
I want my cart to persist across page refreshes and be protected from overselling during checkout,
So that I don't lose my selections and don't purchase stock that has just sold out.

**Acceptance Criteria:**

**Given** a buyer adds products to cart
**Then** cart state is stored in `localStorage` as a JSON array of `{ productId, quantity, configSnapshot? }`

**Given** buyer opens cart on a new tab or refreshes
**Then** cart is re-hydrated from `localStorage` (React Island reads on mount)

**Given** private browsing mode detection
**When** `localStorage` write throws `SecurityError`
**Then** a warning toast appears: "Браузърът ви е в частен режим — количката може да се изгуби при затваряне." (no crash)

**Given** buyer proceeds to checkout (`checkout.start` event)
**Then** cart items are synced to `cart_reservations` table via a Server Action
**And** each reservation uses `SELECT FOR UPDATE` on the product row to lock stock
**And** reservation `expires_at = NOW() + INTERVAL '30 minutes'`

**Given** requested quantity > available `stock` at reservation time
**Then** Server Action returns `{ success: false, code: "INVENTORY_INSUFFICIENT" }` (AR-21)
**And** buyer sees an inline error: "X е изчерпан — наличност: Y бр."

**Given** buyer abandons checkout (does not complete payment within 30 minutes)
**Then** `cart_reservations` row's `expires_at` has passed — cleanup cron (Story 1.10) removes it and stock is logically released

**Given** buyer returns after reservation expiry and attempts checkout again
**Then** stock validation runs fresh (no stale reservation assumed valid)

---

### Story 4.2: Guest checkout форма + Econt/Speedy courier price calculation

As a buyer,
I want to complete checkout without creating an account and see accurate shipping costs,
So that checkout is frictionless and I know the exact total before paying.

**Acceptance Criteria:**

**Given** the checkout form
**Then** email is the only required field; name, phone, and address are required for delivery but not for account creation

**Given** "Запази данните ми" checkbox (FR-10)
**When** checked at checkout completion
**Then** a background Supabase Auth account is created with `guest_email` and a random password (user receives email to set password later)

**Given** buyer enters a Bulgarian city and postcode
**Then** courier price is calculated by calling both Econt API and Speedy API concurrently with `Promise.race()` and a 2-second timeout

**Given** both Econt and Speedy respond within 2 seconds
**Then** both prices are shown with "До офис" option first (lower cost) and "До адрес" second

**Given** Econt or Speedy API times out (> 2s) or returns an error
**Then** a fallback fixed shipping price is shown (configurable env var `FALLBACK_SHIPPING_PRICE_BGN`)
**And** a note appears: "Точната цена ще бъде потвърдена — ако се различава, ще се свържем с вас"

**Given** order total ≥ 60 лв
**Then** all shipping options show "Безплатна доставка" and shipping line item = 0 лв

**Given** Econt/Speedy price response is cached
**Then** same city+courier combination is cached for 5 minutes (AR-26) to avoid redundant API calls

**Given** form validation
**Then** all required fields show inline errors via `aria-describedby` on invalid submit (not browser native validation popups)
**And** first invalid field receives focus automatically on submit attempt

---

### Story 4.3: Stripe Hosted Checkout + ApplePay/GooglePay + Наложен платеж

As a buyer,
I want to pay with card, Apple Pay, Google Pay, or cash on delivery,
So that I can choose the payment method that works best for me.

**Acceptance Criteria:**

**Given** buyer selects card / Apple Pay / Google Pay and clicks "Поръчай"
**Then** a Stripe Checkout Session is created server-side via `stripe.checkout.sessions.create()`
**And** buyer is redirected to Stripe Hosted Checkout page (not a custom card form)

**Given** Stripe Hosted Checkout
**Then** Stripe manages 3D Secure dialogs, Apple Pay, Google Pay, and PCI compliance
**And** on mobile, Apple Pay / Google Pay appear as primary CTAs at the top of the payment step (not hidden in a dropdown)

**Given** successful Stripe payment
**Then** buyer is redirected to `/porachki/[id]/uspeh` (success page) with order summary
**And** `orders.stripe_payment_intent_id` is populated

**Given** buyer selects "Наложен платеж" (cash on delivery)
**Then** NO Stripe Checkout Session is created
**And** order is saved directly to DB with `payment_method: 'cash_on_delivery'` and `status: 'received'`
**And** buyer is redirected to `/porachki/[id]/uspeh` with "Ще платите при доставка" message

**Given** buyer cancels on Stripe Hosted Checkout page
**Then** they are redirected back to cart with items intact and cart reservations still active

**Given** Stripe Checkout Session creation
**Then** `metadata` includes `{ orderId, eventId: uuid }` — `eventId` used for Meta CAPI deduplication (AR-24)

**Given** `@kandles/env` validation
**Then** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY` are all required validated env vars

**Given** Stripe API call fails (network error, invalid key)
**Then** Server Action returns `{ success: false, code: "PAYMENT_FAILED" }` and buyer sees actionable error message (not a stack trace)

---

### Story 4.4: Stripe webhook idempotency + reconciliation cron

As a developer,
I want Stripe webhooks to be processed exactly once and pending orders reconciled automatically,
So that no order is missed or double-processed even under network failures or retries.

**Acceptance Criteria:**

**Given** Stripe fires `payment_intent.succeeded` webhook
**Then** handler in `apps/admin/src/app/api/webhooks/stripe/route.ts` verifies signature using `stripe.webhooks.constructEvent()` with `STRIPE_WEBHOOK_SECRET`

**Given** webhook signature verification fails
**Then** handler returns HTTP 400 immediately (no processing)

**Given** valid webhook event arrives
**Then** handler attempts `INSERT INTO stripe_webhook_events (stripe_event_id, processed_at) VALUES (?, NOW())`
**And** if `stripe_event_id` already exists (UNIQUE constraint violation), handler returns HTTP 200 immediately with no further processing (idempotent)

**Given** new unique event
**Then** handler: updates `orders.status` to appropriate value, decrements `products.stock` via SELECT FOR UPDATE transaction (AR-22), triggers email (FR-14) and Viber notification (FR-19)

**Given** reconciliation cron (runs every 15 minutes via Vercel cron or pg_cron)
**Then** it queries: `SELECT * FROM orders WHERE status = 'received' AND payment_method = 'card' AND created_at < NOW() - INTERVAL '30 minutes' AND stripe_payment_intent_id IS NOT NULL`
**And** for each result calls `stripe.paymentIntents.retrieve(payment_intent_id)`
**And** if status is `succeeded` and not in `stripe_webhook_events`, processes the order (webhook was missed)
**And** if status is `canceled`, marks order as canceled and releases stock

**Given** reconciliation cron endpoint
**Then** it is protected by `Authorization: Bearer ${CRON_SECRET}` header check

**Given** Meta CAPI Purchase event (AR-24)
**Then** it is fired inside the webhook handler with `event_id` from `orders.metadata.eventId` (set at Stripe session creation in Story 4.3) for browser-server deduplication

---

### Story 4.5: Order Tracking страница

As a buyer,
I want to check my order status at any time using my order number and email,
So that I always know where my candle is without needing an account.

**Acceptance Criteria:**

**Given** SSR Astro page at `/prosledete-porachkata` (hybrid SSR endpoint)
**Then** it renders a form with two fields: "Номер на поръчка" and "Имейл адрес"

**Given** buyer submits valid order number + matching email
**Then** page displays: current status, status timeline (Приета → В производство → Готова → Изпратена → Доставена) with completed steps visually differentiated
**And** current status is announced via `<div role="status" aria-live="polite">` for screen readers

**Given** order has a tracking number
**Then** tracking number is a clickable `<a href="[econt_or_speedy_tracking_url]" target="_blank" rel="noopener">` link to the courier's tracking page

**Given** order number + email combination does not match any order
**Then** page shows: "Не намерихме поръчка с тези данни — проверете имейла и номера" (no stack trace, no DB error details)

**Given** any order status change (admin changes status in FR-17 admin panel)
**Then** an automatic transactional email is sent via Resend (FR-14) with the new status and tracking link (if available)

**Given** order status "Доставена"
**Then** tracking page shows a review invitation CTA: "Как беше вашата поръчка? Оставете мнение" linking to the review form (FR-21)

**Given** WCAG AA
**Then** status timeline uses `<ol>` with `<li>` for each status step
**And** completed steps have `aria-label` indicating completion (e.g., `aria-label="Приета — завършена"`)

---

### Story 4.6: Rate limiting + Cloudflare Turnstile bot protection

As a developer,
I want API rate limiting and bot protection on all sensitive endpoints,
So that the checkout flow and contact forms are protected from automated abuse.

**Acceptance Criteria:**

**Given** Upstash Redis client configured in `@kandles/env` (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`)
**Then** a shared rate limiter utility exists at `packages/env/src/rate-limit.ts` exporting `rateLimit(key, limit, window)` using `@upstash/ratelimit` sliding window

**Given** checkout endpoint (`/api/checkout/start`)
**Then** `rateLimit(ip, 5, '1m')` is applied — 5 requests/min per IP
**And** on limit exceeded: HTTP 429 + `{ success: false, code: "RATE_LIMITED" }` + `X-RateLimit-Remaining: 0` header (AR-21)

**Given** newsletter subscribe endpoint (`/api/newsletter/subscribe`)
**Then** `rateLimit(ip, 3, '1m')` applied

**Given** review submit endpoint (`/api/reviews`)
**Then** `rateLimit(ip, 2, '1m')` applied

**Given** contact form endpoint (`/api/contact`)
**Then** `rateLimit(ip, 5, '1m')` applied

**Given** admin login endpoint
**Then** `rateLimit(ip, 3, '1m')` applied — after 3 failed logins, subsequent attempts return same 429 response (no user enumeration)

**Given** Cloudflare Turnstile (AR-14) on the checkout form
**Then** `<div class="cf-turnstile" data-sitekey="${TURNSTILE_SITE_KEY}">` renders in the checkout form
**And** server-side token verification calls `https://challenges.cloudflare.com/turnstile/v0/siteverify` before processing checkout
**And** failed verification returns `{ success: false, code: "VALIDATION_ERROR", error: "Bot protection failed" }`

**Given** buyer fails Turnstile more than 3 times on the same session
**Then** hCaptcha widget replaces Turnstile as fallback (AR-14)

**Given** rate limit response
**Then** it always uses `ApiResponse<T>` standard (AR-21) — never exposes raw Redis errors or stack traces

---

### Epic 5: Admin Панел

Пълен Next.js App Router dashboard за Стефка: Order Management (филтри, статус смяна → авто имейл, tracking номер, preview photo upload, бележки, dashboard summary, mobile-responsive, touch targets ≥ 48x48px), **Product Management (CRUD + архив, `stock` поле с bulk edit, drag-and-drop снимки с alt text задължително, bulk inventory/price edit, last-minute eligible flag, occasion tags, low-stock alert при `stock ≤ 3`)**, persistent 30-дневна сесия. ApiResponse<T> standard на всички Server Actions.

**User outcome:** Стефка управлява поръчки и продукти от телефона — вижда кои продукти свършват, bulk update-ва наличности след производство, всичко с 2-3 тапвания.

**FRs covered:** FR-17, FR-18
**AR covered:** AR-6, AR-21, AR-22, AR-31 (admin stock layer)

---

### Story 5.1: Admin authentication + persistent 30-day session

As admin (Стефка),
I want to log in once and stay logged in for 30 days on my phone,
So that I don't re-authenticate every time I check orders.

**Acceptance Criteria:**

**Given** `/admin/login` page with email + password form
**When** correct `ADMIN_EMAIL` + password submitted
**Then** Supabase Auth creates session with `httpOnly`, `Secure`, `SameSite=Strict` cookie with 30-day expiry

**Given** 30-day session cookie
**Then** it persists across browser close — Стефка does not get logged out on phone overnight

**Given** wrong email (not matching `ADMIN_EMAIL`) or wrong password
**Then** login returns generic "Невалиден имейл или парола" message (no distinction — prevents user enumeration)

**Given** unauthenticated request to any `/admin/*` route
**Then** Next.js middleware redirects to `/admin/login` with `?redirect=[original_path]`

**Given** authenticated session
**When** session expires or is revoked (e.g., `supabase.auth.signOut()`)
**Then** next `/admin/*` request redirects to login

**Given** Supabase service_role key usage
**Then** it is accessed ONLY in Next.js Server Actions and Route Handlers — never imported in any `"use client"` component (verified by `@t3-oss/env-nextjs` server-only guard)

**Given** login form on mobile viewport
**Then** all inputs and the submit button are ≥ 48×48px touch targets
**And** password field has show/hide toggle (`<button type="button">` with `aria-label`)

**Given** rate limiting (AR-36)
**Then** admin login endpoint is rate limited at 3 req/min per IP (Story 4.6 utility)

---

### Story 5.2: Orders dashboard — list, filters, pagination, summary cards

As admin (Стефка),
I want to see all orders with filters and today's activity summary at a glance,
So that I immediately know what needs attention when I open the dashboard.

**Acceptance Criteria:**

**Given** `/admin` (or `/admin/porachki`) dashboard page
**Then** summary cards at the top show: "Поръчки днес" (count + total лв), "Тази седмица" (count), "Чакат обработка" (count of status = received OR in_production)

**Given** orders TanStack Table
**Then** columns are: order number, date, customer email, total price, payment method badge, status badge
**And** status badges use brand colors: received=sand, in_production=amber, ready=copper, shipped=chocolate, delivered=cream-on-chocolate

**Given** filter controls
**Then** buyer can filter by: status (multi-select checkboxes), payment method (card / cash_on_delivery), date range (from/to date pickers)

**Given** search field
**Then** it searches by order number prefix OR email address (debounced 300ms, server-side query)

**Given** server-side pagination
**Then** table shows 25 rows by default with Previous/Next controls and "Страница X от Y"

**Given** mobile viewport (Стефка on phone)
**Then** table shows condensed rows: order number + status badge + date — tap row to open order detail

**Given** all interactive elements
**Then** touch targets are ≥ 48×48px

**Given** data fetching
**Then** page is a Next.js Server Component — data comes from Supabase via service_role in the server render (no client-side fetch waterfall)

---

### Story 5.3: Order detail — статус смяна + tracking + бележки + preview photo upload

As admin (Стефка),
I want to update order status, add tracking, upload preview photos, and leave notes from one page,
So that I can fully process an order from my phone in 2–3 taps.

**Acceptance Criteria:**

**Given** `/admin/porachki/[id]` page
**Then** it shows: customer info, ordered items with snapshot images + quantities, gift wrap status + card text (prominent if present), shipping address, payment method, current status

**Given** status change `<select>` control
**When** admin selects a new status and clicks "Запази статус"
**Then** `orders.status` updates via Server Action AND transactional email fires via Resend (FR-14)
**And** Server Action returns `ApiResponse<T>` (AR-21) — error shown inline if Resend call fails

**Given** admin selects "Изпратена" status
**Then** tracking number input field becomes visible (required — save blocked without it)

**Given** tracking number saved
**Then** `orders.tracking_number` is set and Order Tracking page (Story 4.5) renders it as a clickable courier link

**Given** preview photo upload area (FR-6 admin side)
**Then** it shows a dropzone accepting images ≤ 10MB
**When** image is dropped or selected
**Then** file type is validated via `file-type` magic bytes (not extension), uploaded to Cloudflare Images via `apps/admin` API route, `orders.preview_uploaded_at` set, approval email triggered (Story 3.2 flow)

**Given** upload in progress
**Then** upload button is replaced by a spinner and disabled (prevents double-submit)

**Given** admin notes textarea
**Then** it saves to `orders.admin_note` (internal only — never shown to buyer in any email or tracking page)

**Given** gift card text on the order
**Then** it is displayed in a visually distinct box with a "Копирай текста" button (useful when hand-writing physical card)

**Given** all mutations (status, tracking, photo, note)
**Then** each uses a separate Server Action returning `ApiResponse<T>`
**And** validation errors appear inline next to the relevant field

---

### Story 5.4: Product CRUD — create/edit/archive, images drag-and-drop, alt text

As admin (Стефка),
I want to create, edit, and archive products with full image management,
So that I control the storefront catalog without developer help.

**Acceptance Criteria:**

**Given** `/admin/produkti` page
**Then** it lists all non-archived products: thumbnail, title, price, stock badge, "Редактирай" button

**Given** "Нов продукт" button → `/admin/produkti/nov` form
**Then** all fields are present: title (required), description (textarea), price (numeric, required), stock (integer ≥ 0, required), occasion_tags (multi-select), season, production_days (integer), is_last_minute (checkbox), video URL or upload (optional)

**Given** image upload zone
**Then** it accepts up to 10 images via drag-and-drop or file picker, validates file type (magic bytes) + max 10MB each, uploads to Cloudflare Images on selection

**Given** uploaded images
**Then** they appear as sortable thumbnails using `@dnd-kit/sortable` — drag to reorder, `sort_order` persisted on save

**Given** alt text requirement (UX-DR16, NFR-9)
**Then** each image has a required `<input type="text" aria-label="Alt текст за [filename]">` field
**And** form submission is blocked by Zod validation if ANY image has empty `alt_text`

**Given** first image in sort order after save
**Then** `product_images.is_hero = true` is set on it automatically (and cleared from others)

**Given** "Архивирай продукта" action
**Then** `is_archived = true`, product becomes invisible in storefront immediately (Astro SSR hybrid: SSG pages rebuilt on next deploy, dynamic routes check `is_archived` at request time)

**Given** archived product in admin list
**Then** it shows "Архивиран" badge and "Възстанови" button to unarchive

**Given** form save (create or edit)
**Then** Server Action validates with Zod schema — all errors shown inline next to fields (not page-level only)
**And** on success: redirect to `/admin/produkti/[id]` with "Продуктът е запазен" toast

---

### Story 5.5: Bulk inventory management + low-stock alerts

As admin (Стефка),
I want to update stock for multiple products at once and see which are running low,
So that after a production batch I restock everything in one operation — not product by product.

**Acceptance Criteria:**

**Given** `/admin/inventar` page (or "Инвентар" tab on products list)
**Then** it shows all non-archived products in a table: product name, thumbnail, current `stock` value, editable number input

**Given** inline stock `<input type="number" min="0" inputmode="numeric">` per row
**Then** it is directly editable in the table (no modal required for single-product update)
**And** height ≥ 48px (mobile thumb-friendly)

**Given** "Запази промените" bulk save button
**Then** all modified rows are collected and saved in a single Server Action batch (Drizzle transaction — one SQL roundtrip)

**Given** batch save transaction
**Then** it uses `SELECT FOR UPDATE` on each product row to prevent race conditions with concurrent orders (AR-22)

**Given** batch save where one product update fails (e.g., constraint violation)
**Then** entire transaction rolls back and error message lists which product failed

**Given** product with `stock ≤ 3`
**Then** its row shows amber "⚠ Само X бр." badge in both the bulk table and the main `/admin/produkti` list

**Given** product with `stock = 0`
**Then** its row shows copper "Изчерпан" badge with bold styling and "Обнови наличността" shortcut link

**Given** Server Action response
**Then** it returns `ApiResponse<{ updatedCount: number }>` (AR-21) — success toast shows "X продукта обновени"

**Given** `products.updated_at`
**Then** it is set to `NOW()` on every stock change via Drizzle `onUpdateFn: () => new Date()`

---

### Epic 6: Имейли, Viber & Marketing Infrastructure

4 транзакционни имейла с React Email + Resend (брандирани, БГ, Стефка подпис), Viber Business нотификации при нова поръчка (+ email fallback — Viber API одобрение 2-4 седмици, вижте Risk Register), GTG (Google Tag Gateway) в GTM UI за GA4 — **fire само след cookie consent (GTM Consent Mode v2, AR-32)**, Meta CAPI server-side в Stripe webhook handler — **event_id deduplication (AR-24)** за точни Facebook conversion данни, нула browser Pixel script. **Trigger.dev v3** (не v2) за async marketing flows (готово за v2 features: FR-15 abandoned cart, FR-16 birthday reminder). Rate limiting на newsletter endpoint (AR-36).

**User outcome:** Купувачът получава branded имейли при всяка стъпка. Стефка получава Viber при нова поръчка. GA4 и Facebook conversion данни са точни и GDPR-compliant. Marketing инфраструктурата е готова за v2 automations.

**FRs covered:** FR-14, FR-19
**AR covered:** AR-23, AR-24, AR-36 (newsletter rate limit)
**NFR covered:** NFR-8

---

### Story 6.1: 4 транзакционни имейла — React Email + Resend branded templates

As a buyer,
I want to receive beautifully branded Bulgarian emails at each stage of my order,
So that I stay informed and trust that my order is being handled professionally.

**Acceptance Criteria:**

**Given** `packages/email/src/templates/` directory
**Then** it contains 4 React Email components: `OrderConfirmation.tsx`, `InProduction.tsx`, `Shipped.tsx`, `Delivered.tsx`

**Given** each template
**Then** it uses brand CSS inline styles: chocolate `#5A2D0C` headings, sand `#E8D4AD` background sections, amber `#B5621E` accents
**And** font stack: `'Cormorant Garamond', Georgia, serif` for headings, `'Jost', Arial, sans-serif` for body (web-safe fallbacks for email clients)
**And** footer: "Изработено с ♥ от Стефка Григорова" in Cormorant Garamond italic

**Given** `OrderConfirmation` template
**Then** it displays: order number, items list with `snapshot_image_url` thumbnails + titles + prices, total, payment method, shipping address, production days estimate

**Given** order with `gift_wrap = true`
**Then** `OrderConfirmation` shows gift-wrapped product image variant and gift card text in a styled quote block

**Given** `InProduction` template
**Then** copy includes: "Ръцете на Стефка вече работят по твоята поръчка ✦" and estimated ready date based on `production_days`

**Given** `Shipped` template
**Then** it shows tracking number as a styled CTA button linking to courier tracking URL (Econt or Speedy based on `orders.courier`)

**Given** `Delivered` template
**Then** it shows a review invitation CTA button: "Как беше? Остави мнение" linking directly to the review form for the specific order

**Given** Resend SDK in admin Server Action
**Then** it uses `RESEND_API_KEY` from `@kandles/env` (server-only) and sends from `porachki@kandles.bg`

**Given** Resend API call fails (network error, rate limit)
**Then** error is logged to Sentry + Axiom (AR-17) with order context
**And** order processing continues — email failure is non-blocking (order status still updates)

**Given** `pnpm --filter @kandles/email preview`
**Then** all 4 templates render in react-email preview without errors and export valid HTML

---

### Story 6.2: Viber Business нотификации + email fallback

As admin (Стефка),
I want an instant Viber message when a new order arrives,
So that I start production as fast as possible without constantly checking email.

**Acceptance Criteria:**

**Given** new order confirmed (payment_intent.succeeded webhook OR cash_on_delivery order created)
**Then** a Trigger.dev v3 task `notify-admin-new-order` is invoked via `tasks.trigger()` from the webhook handler (async, non-blocking to HTTP response time)

**Given** `notify-admin-new-order` Trigger.dev v3 task runs
**Then** it attempts Viber Business API call to `VIBER_ADMIN_NUMBER` from `@kandles/env`

**Given** Viber message content
**Then** it includes: "🕯 Нова поръчка #[number]", product name(s) + quantities, total price + payment method, city, any gift_card_text or admin notes

**Given** Viber API call fails (API error, timeout > 5s, or `VIBER_API_KEY` not set in env)
**Then** task immediately falls back to Resend email to `ADMIN_EMAIL` with identical content
**And** error logged to Sentry + Axiom with `{ orderId, failureReason }`

**Given** `VIBER_API_KEY` is not set in env (account pending Viber Business approval — Risk Register)
**Then** Viber attempt is skipped entirely, email fallback fires — zero crash, zero uncaught exception

**Given** non-production environment (`NODE_ENV !== 'production'`)
**Then** Viber message is NOT sent to real `VIBER_ADMIN_NUMBER`
**And** notification is logged to console only (dev mode)

**Given** Trigger.dev v3 task definition
**Then** it lives in `apps/admin/src/trigger/notify-admin-new-order.ts` using `task({ id: 'notify-admin-new-order', run: async (payload) => { ... } })`

---

### Story 6.3: GTG setup в GTM UI + Consent Mode v2 интеграция

As a developer,
I want Google Analytics 4 events routed through a first-party GTG subdomain with Consent Mode v2,
So that GA4 fires reliably as first-party data with zero main-thread impact and GDPR compliance.

**Acceptance Criteria:**

**Given** `metrics.kandles.bg` CNAME configured in Cloudflare DNS
**Then** it points to the GTG (Google Tag Gateway) endpoint configured in GTM UI

**Given** GTM container (ID from `PUBLIC_GTM_CONTAINER_ID` env var)
**Then** it contains only the GTG client tag — no other tags fire before consent

**Given** Astro base layout `<head>`
**Then** GTM initialization script appears after consent banner initialization and sets default consent state:
```javascript
gtag('consent', 'default', {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied'
});
```
**And** GTM snippet uses standard `async` script loading (not Partytown, not defer)

**Given** user grants consent (Story 2.8 "Приемам" click)
**Then** `gtag('consent', 'update', { analytics_storage: 'granted', ad_storage: 'granted', ad_user_data: 'granted' })` fires
**And** GTG begins sending GA4 pageview and event data

**Given** GA4 events route through `metrics.kandles.bg`
**When** Playwright network test runs
**Then** zero requests go to `www.google-analytics.com` directly (all proxied via GTG first-party subdomain)

**Given** Lighthouse CI runs on homepage with GTM+GTG active
**Then** Performance score ≥ 90 (GTM async snippet does not block render)

**Given** `PUBLIC_GTM_CONTAINER_ID` is set
**Then** it is validated in `@kandles/env` astro.ts — build fails if missing in production

---

### Story 6.4: Meta CAPI server-side + event_id deduplication

As a marketer,
I want Facebook conversion events sent server-side with zero browser Pixel script,
So that Meta accurately tracks purchases without impacting Lighthouse scores or placing Facebook cookies.

**Acceptance Criteria:**

**Given** `payment_intent.succeeded` Stripe webhook fires (Story 4.4)
**Then** Meta CAPI Purchase event is sent via Facebook Graph API:
```
POST https://graph.facebook.com/v19.0/{META_PIXEL_ID}/events
```
with payload: `event_name: "Purchase"`, `event_time`, `event_id` (from `orders.metadata.eventId`), `value`, `currency: "BGN"`, `user_data.em` (SHA-256 hashed `guest_email`)

**Given** `checkout.start` Server Action (Story 4.1)
**Then** Meta CAPI `InitiateCheckout` event is sent with the same `event_id` UUID that is stored in Stripe Checkout Session metadata

**Given** `event_id` deduplication (AR-24)
**Then** browser and server events sharing the same `event_id` are deduplicated by Meta — confirmed in Meta Events Manager "Deduplication" diagnostics showing 0 duplicate events

**Given** zero browser Facebook Pixel script
**When** Playwright network intercept test runs on storefront
**Then** zero requests to `connect.facebook.net` or `facebook.com/tr` are detected

**Given** Meta CAPI API call fails (Meta API unavailable, invalid token)
**Then** error is logged to Sentry + Axiom with `{ orderId, eventName, errorCode }`
**And** order processing continues — CAPI failure is non-blocking

**Given** `META_PIXEL_ID` and `META_CAPI_ACCESS_TOKEN` from `@kandles/env`
**Then** they are server-only validated env vars — never present in any client bundle

**Given** user has denied cookie consent (`kd_consent: 'denied'`)
**Then** CAPI events are still sent server-side (no cookie dependency) with minimized `user_data`: only `em` (hashed email), no IP, no `fbp`/`fbc` browser cookies

**Given** Lighthouse CI on storefront
**Then** Performance ≥ 90 confirmed — zero JS added to browser by CAPI (server-side only)

---

### Epic 7: Бранд, Доверие & Маркетинг

"Нашата история" editorial страница (Стефка — история, производствен процес, ценности, AI placeholder снимки с TODO за photoshoot, Person + Organization Schema.org), Reviews система (покана 5 дни след доставка, текст + снимка + звезди, admin модерация, AggregateRating Schema.org, reviews с снимки prominent), Newsletter (double opt-in, 5% off купон, GDPR consent, rate limited — AR-36), **`/kontakti` страница (FR-33): Viber/WhatsApp бутон, имейл, returns policy 14 дни ЗЗП — замества chatbot в MVP**.

**User outcome:** Купувачите се свързват лично с Стефка, оставят reviews, абонират се за newsletter, и лесно намират контакт + политика за връщане. Доверието расте без рекламен бюджет.

**FRs covered:** FR-20, FR-21, FR-26, FR-33
**UX-DR covered:** UX-DR10 (пълна "Нашата история"), UX-DR16 (a11y forms/reviews)
**AR covered:** AR-30 (Person + Organization schema), AR-36 (newsletter rate limit)

---

### Story 7.1: "Нашата история" editorial страница

As a buyer,
I want to read Stefka's personal story and understand who makes the candles,
So that I connect emotionally with the brand and trust the person behind every candle.

**Acceptance Criteria:**

**Given** `/nashata-istoriya` Astro SSG page
**Then** sections render in order: (1) full-bleed hero image of Стефка (`data-theme="dark"`), (2) personal story text (Cormorant Garamond 22px/1.6, brand voice), (3) production process (3 steps, `<KandlesIcon aria-hidden={true}>`), (4) brand values, (5) optional atelier video (lazy-loaded)

**Given** AI placeholder images
**Then** each `<img>` has `alt` text AND an inline comment: `{/* TODO: replace with real photoshoot — warm light, candles, wood, atelier */}`

**Given** Person Schema.org (UX-DR17, AR-30)
**Then** `<head>` contains JSON-LD:
```json
{
  "@type": "Person",
  "name": "Стефка Григорова",
  "jobTitle": "Artisan Candle Maker",
  "worksFor": { "@type": "Organization", "name": "Kandles.bg" },
  "url": "https://kandles.bg/nashata-istoriya"
}
```

**Given** Organization Schema.org
**Then** `<head>` also contains JSON-LD with: name, url, logo, `"foundingDate": "2023"`, `"description"`, `"sameAs": ["https://instagram.com/kandles.bg"]`

**Given** page SEO
**Then** `<title>` = "Нашата история — Стефка Григорова | Kandles.bg"
**And** `<meta name="description">` contains a brand voice sentence about Стефка

**Given** BreadcrumbList Schema.org
**Then** JSON-LD breadcrumb: Home → Нашата история

**Given** homepage maker section (UX-DR10)
**Then** it links here with text "Виж историята на Стефка →"

**Given** WCAG AA
**Then** all images have meaningful `alt` text, heading hierarchy is `h1 → h2 → h3`, page passes Playwright axe-core check

---

### Story 7.2: Reviews система

As a buyer,
I want to leave a photo review 5 days after delivery and see real reviews on product pages,
So that I share my experience and help future buyers make confident choices.

**Acceptance Criteria:**

**Given** order status changes to "Доставена"
**Then** Trigger.dev v3 task `send-review-invitation` is scheduled with `wait.for({ days: 5 })` delay

**Given** 5-day delay elapses
**Then** review invitation email fires via Resend (React Email template): "Как беше вашата поръчка?" with CTA button linking to `/reviews/[orderId]?token=[jwt]`

**Given** `/reviews/[orderId]?token=[jwt]` page (Astro SSR)
**Then** it shows: product name + hero image, star rating (1–5), text field, optional image upload

**Given** star rating input
**Then** it is implemented as 5 `<input type="radio">` with visible star SVG labels — keyboard navigable (arrow keys), announces selection via `aria-live`

**Given** review form submission
**Then** review saved with `is_approved = false`, buyer sees: "Вашето мнение е получено и ще бъде публикувано след одобрение"

**Given** review image upload
**Then** accepts max 1 image ≤ 5MB, validates file type (magic bytes), uploads to Cloudflare Images

**Given** admin reviews moderation (new tab in Epic 5 admin panel)
**Then** admin sees list of pending reviews with: star rating, text, image thumbnail, "Одобри" / "Откажи" buttons
**And** approval triggers `is_approved = true` and review appears on product page within 60 seconds (Supabase Realtime or page reload)

**Given** product page with ≥ 1 approved review
**Then** review section shows: average star rating (numeric + visual), review count, individual reviews
**And** reviews with images render in larger, more prominent cards than text-only reviews

**Given** AggregateRating + Review Schema.org (AR-30)
**Then** product page JSON-LD includes `aggregateRating.ratingValue` and `reviewCount` (when `reviewCount > 0`)
**And** each displayed review has `Review` JSON-LD with `reviewRating`, `author`, `datePublished`

**Given** WCAG AA
**Then** star rating group has `role="radiogroup"` with `aria-label="Оценка"`, review list has `role="list"`, each review is `role="listitem"`

---

### Story 7.3: Newsletter double opt-in + 5% off купон

As a buyer,
I want to subscribe to the Kandles newsletter and receive a first-order discount,
So that I stay connected with the brand and save money on my next purchase.

**Acceptance Criteria:**

**Given** `NewsletterForm` React Island (`client:visible`) on homepage and footer
**Then** it contains: email `<input>`, "Абонирай се" button, GDPR consent `<input type="checkbox">` with explicit `<label>`
**And** uses Jost all-caps style with wide `letter-spacing` per brand (UX-DR7)

**Given** form submission without consent checkbox checked
**Then** validation error appears: "Моля, потвърдете съгласието си" — submit is blocked

**Given** valid email + consent checked → submit
**Then** Server Action inserts into `marketing_consents` (`email`, `consented_at: NOW()`, `source: 'newsletter_form'`, `confirmed_at: NULL`)
**And** double opt-in confirmation email fires via Resend with link: `/newsletter/potvarzhdi?token=[jwt]` (JWT expires 48h)

**Given** buyer clicks confirmation link with valid JWT
**Then** `marketing_consents.confirmed_at = NOW()` is set
**And** 5% off coupon email fires via Resend containing a unique coupon code (valid 90 days)

**Given** coupon code generation
**Then** unique code is stored in a `coupons` table (`code`, `discount_percent: 5`, `expires_at`, `used_at` nullable, `marketing_consent_id` FK)
**And** code is validated at checkout if entered

**Given** duplicate email submission (already in `marketing_consents`)
**Then** Server Action returns `{ success: true }` silently — no error shown, no second confirmation email sent (prevents enumeration)

**Given** rate limiting (AR-36)
**Then** `/api/newsletter/subscribe` applies 3 req/min per IP — exceeded returns `{ code: "RATE_LIMITED" }` inline error

**Given** GDPR (NFR-3)
**Then** `marketing_consents` table stores: `email`, `consented_at`, `source`, `confirmed_at`, `unsubscribed_at` — all admin queries use service_role key

---

### Story 7.4: /kontakti страница + политика за връщания

As a buyer,
I want to easily find contact info and understand my return rights,
So that I can reach Стефка directly and shop with confidence knowing my consumer rights.

**Acceptance Criteria:**

**Given** `/kontakti` Astro SSG page (`data-theme="light"`)
**Then** it contains: `<h1>` "Свържете се с нас", Viber/WhatsApp CTA button, email address display, returns policy section

**Given** Viber contact button
**Then** it links to `viber://chat?number=[VIBER_BUSINESS_NUMBER]` (from env) with `rel="noopener"`
**And** has brand styling: amber bg + cream text, `<KandlesIcon variant="flame" aria-hidden={true}>` icon, text "Пишете ни в Viber"
**And** `aria-label="Свържете се с нас чрез Viber"` on the anchor

**Given** WhatsApp fallback button
**Then** it links to `https://wa.me/[WHATSAPP_NUMBER]` as secondary CTA (in case Viber is unavailable)

**Given** email contact
**Then** `<a href="mailto:contact@kandles.bg" aria-label="Изпратете имейл на contact@kandles.bg">contact@kandles.bg</a>` with brand styling

**Given** returns policy section
**Then** it states clearly: "Право на отказ — 14 календарни дни от получаване на поръчката (съгласно ЗЗП чл. 50)" with step-by-step return instructions and contact email for initiating returns

**Given** footer on every page
**Then** "Контакти" link points to `/kontakti` and is always visible

**Given** product pages
**Then** a small "Въпроси? → Контакти" link appears near the production time section

**Given** WCAG AA
**Then** page heading hierarchy correct (`h1 → h2`), all links have meaningful text or `aria-label`, page passes Playwright axe-core

**Given** `VIBER_BUSINESS_NUMBER` and `WHATSAPP_NUMBER` env vars
**Then** they are validated in `@kandles/env` — if missing in production, build fails with descriptive error

---

## Risk Register

| Риск | Вероятност | Въздействие | Митигация |
|---|---|---|---|
| Viber Business API одобрение — процесът отнема 2–4 седмици | Висока | Средно | Email fallback е задължителен от ден 1 (FR-19). Viber се добавя когато е одобрен, не блокира launch. |
| Econt/Speedy API промяна или downtime | Средна | Средно | 2s timeout + fallback фиксирана цена (FR-12). |
| Stripe Hosted Checkout изменение на UX | Ниска | Ниско | Hosted Checkout = Stripe поема промените; no custom form dependency. |
| Cloudflare Pages cold start latency | Ниска | Ниско | SSG pages = pre-rendered, нулев cold start. SSR endpoints имат ≤ 50ms edge cold start. |
| Supabase Pro billing (pg_cron) | Ниска | Ниско | Алтернатива: Vercel cron (включен в Hobby plan). |
| Trigger.dev v3 API breaking change | Ниска | Ниско | v3 е stable GA. Използва се само за v2 async flows (не в MVP critical path). |

**FR-9 "Изпрати като изненада" — v2 ПРИОРИТЕТ #1:** Идентифициран от John (business agent) като core JTBD за gift купувача — изпращане директно до получателя без адресна размяна. Не е scope creep, а brand differentiator. Планира се като първа story в post-launch v2 sprint.
