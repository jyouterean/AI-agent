#!/usr/bin/env node
/**
 * 管理者アカウントを直接作成するスクリプト
 * 使用方法: DATABASE_URL="..." npx tsx scripts/create-admin-direct.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('=== 管理者アカウント作成スクリプト ===\n')

  // 環境変数の確認
  if (!process.env.DATABASE_URL) {
    console.error('エラー: DATABASE_URL環境変数が設定されていません')
    console.error('使用方法: DATABASE_URL="postgresql://..." npx tsx scripts/create-admin-direct.ts')
    process.exit(1)
  }

  const adminEmail = 'admin@zentry.co.jp'
  const adminPassword = 'admin123'

  try {
    // 既存のユーザーを確認
    const existingAdmin = await prisma.users.findUnique({
      where: { email: adminEmail },
    })

    if (existingAdmin) {
      console.log('管理者アカウントは既に存在します')
      console.log(`ID: ${existingAdmin.id}`)
      console.log(`メール: ${existingAdmin.email}`)
      console.log(`名前: ${existingAdmin.name}`)
      console.log(`権限: ${existingAdmin.role}`)
      console.log(`ステータス: ${existingAdmin.isActive ? '有効' : '無効'}`)
      
      // パスワードを確認（テスト用）
      const testPassword = await bcrypt.compare(adminPassword, existingAdmin.passwordHash)
      console.log(`パスワード検証: ${testPassword ? 'OK' : 'NG'}`)
      
      if (!testPassword) {
        console.log('\nパスワードが一致しません。パスワードをリセットします...')
        const passwordHash = await bcrypt.hash(adminPassword, 10)
        await prisma.users.update({
          where: { id: existingAdmin.id },
          data: { passwordHash },
        })
        console.log('✓ パスワードをリセットしました')
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
      console.log('✓ 管理者アカウントを作成しました')
      console.log(`ID: ${admin.id}`)
      console.log(`メール: ${admin.email}`)
      console.log(`名前: ${admin.name}`)
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
      orderBy: { createdAt: 'desc' },
    })
    
    console.log('\n=== 登録されているユーザー一覧 ===')
    if (allUsers.length === 0) {
      console.log('ユーザーが存在しません')
    } else {
      allUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (${user.name}) - ${user.role} - ${user.isActive ? '有効' : '無効'}`)
      })
    }

    console.log('\n=== ログイン情報 ===')
    console.log(`メールアドレス: ${adminEmail}`)
    console.log(`パスワード: ${adminPassword}`)
    console.log('\n✓ 完了しました！')

  } catch (error) {
    console.error('エラーが発生しました:', error)
    if (error instanceof Error) {
      console.error('エラーメッセージ:', error.message)
    }
    process.exit(1)
  }
}

main()
  .catch((e) => {
    console.error('予期しないエラー:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

