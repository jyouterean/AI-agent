import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('管理者アカウントの確認と作成を開始します...')
  
  const adminEmail = 'admin@zentry.co.jp'
  const adminPassword = 'admin123'

  // 既存のユーザーを確認
  const existingAdmin = await prisma.users.findUnique({
    where: { email: adminEmail },
  })

  if (existingAdmin) {
    console.log('管理者アカウントは既に存在します')
    console.log('ID:', existingAdmin.id)
    console.log('メール:', existingAdmin.email)
    console.log('名前:', existingAdmin.name)
    console.log('権限:', existingAdmin.role)
    console.log('ステータス:', existingAdmin.isActive ? '有効' : '無効')
    
    // パスワードを確認（テスト用）
    const testPassword = await bcrypt.compare(adminPassword, existingAdmin.passwordHash)
    console.log('パスワード検証:', testPassword ? 'OK' : 'NG')
    
    if (!testPassword) {
      console.log('パスワードが一致しません。パスワードをリセットします...')
      const passwordHash = await bcrypt.hash(adminPassword, 10)
      await prisma.users.update({
        where: { id: existingAdmin.id },
        data: { passwordHash },
      })
      console.log('パスワードをリセットしました')
    }
  } else {
    console.log('管理者アカウントが存在しません。作成します...')
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
    console.log('管理者アカウントを作成しました')
    console.log('ID:', admin.id)
    console.log('メール:', admin.email)
    console.log('名前:', admin.name)
  }

  // すべてのユーザーを一覧表示
  const allUsers = await prisma.users.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
    },
  })
  
  console.log('\n=== 登録されているユーザー一覧 ===')
  if (allUsers.length === 0) {
    console.log('ユーザーが存在しません')
  } else {
    allUsers.forEach((user) => {
      console.log(`- ${user.email} (${user.name}) - ${user.role} - ${user.isActive ? '有効' : '無効'}`)
    })
  }
}

main()
  .catch((e) => {
    console.error('エラー:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

