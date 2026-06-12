import { pgEnum } from 'drizzle-orm/pg-core'

export const seasonEnum = pgEnum('season', ['spring', 'summer', 'autumn', 'winter', 'all'])
export const orderStatusEnum = pgEnum('order_status', ['received', 'in_production', 'ready', 'shipped', 'delivered'])
export const paymentMethodEnum = pgEnum('payment_method', ['card', 'cash_on_delivery'])
export const courierEnum = pgEnum('courier', ['econt', 'speedy', 'manual'])
