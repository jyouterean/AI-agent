import { PrismaClient } from '@prisma/client'
import dayjs from 'dayjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // 顧客を作成
  const client1 = await prisma.clients.create({
    data: {
      name: 'A株式会社',
      email: 'contact@a-corp.jp',
      address: '東京都千代田区1-1-1',
      invoiceRegNo: 'T1234567890123',
    },
  })

  const client2 = await prisma.clients.create({
    data: {
      name: 'B商事',
      email: 'info@b-shoji.co.jp',
      address: '大阪府大阪市2-2-2',
    },
  })

  console.log('Created clients:', client1.name, client2.name)

  // 取引を作成
  const transactions = [
    {
      type: 'income' as const,
      date: dayjs().subtract(5, 'day').toDate(),
      accountCategory: '売上',
      partnerName: 'A株式会社',
      amountYen: 200000,
      memo: '11月分の開発費',
    },
    {
      type: 'expense' as const,
      date: dayjs().subtract(3, 'day').toDate(),
      accountCategory: 'ガソリン代',
      partnerName: 'コンビニ',
      amountYen: 6500,
      memo: '出張時のガソリン代',
    },
    {
      type: 'expense' as const,
      date: dayjs().subtract(1, 'day').toDate(),
      accountCategory: '交通費',
      partnerName: 'JR',
      amountYen: 12000,
    },
    {
      type: 'income' as const,
      date: dayjs().toDate(),
      accountCategory: '売上',
      partnerName: 'B商事',
      amountYen: 150000,
      memo: '12月分のコンサルティング費',
    },
  ]

  for (const txn of transactions) {
    await prisma.transactions.create({ data: txn })
  }

  console.log(`Created ${transactions.length} transactions`)

  // 請求書を作成
  const invoice1 = await prisma.invoices.create({
    data: {
      clientId: client1.id,
      issueDate: dayjs().subtract(10, 'day').toDate(),
      dueDate: dayjs().add(20, 'day').toDate(),
      status: 'sent',
      subtotalYen: 100000,
      taxYen: 10000,
      totalYen: 110000,
      notes: '11月分の開発費',
      bankAccount: 'みずほ銀行 本店 普通 1234567',
    },
  })

  await prisma.invoice_items.create({
    data: {
      invoiceId: invoice1.id,
      description: '開発費',
      quantity: 5,
      unitPriceYen: 20000,
      amountYen: 100000,
      taxRate: 0.1,
    },
  })

  const invoice2 = await prisma.invoices.create({
    data: {
      clientId: client2.id,
      issueDate: dayjs().toDate(),
      dueDate: dayjs().add(30, 'day').toDate(),
      status: 'draft',
      subtotalYen: 0,
      taxYen: 0,
      totalYen: 0,
    },
  })

  console.log('Created invoices:', invoice1.id, invoice2.id)

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

