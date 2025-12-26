import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // 管理者アカウントを作成（既に存在する場合はスキップ）
  const adminEmail = 'admin@zentry.co.jp'
  const adminPassword = 'admin123' // 本番環境では変更してください

  const existingAdmin = await prisma.users.findUnique({
    where: { email: adminEmail },
  })

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10)
    const admin = await prisma.users.create({
      data: {
        email: adminEmail,
        passwordHash,
        name: '管理者',
        role: 'admin',
        isActive: true,
      },
    })
    console.log('管理者アカウントを作成しました:', admin.email)
  } else {
    console.log('管理者アカウントは既に存在します')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

