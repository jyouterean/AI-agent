'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dayjs from 'dayjs'

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'employee'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/auth/profile')
      if (res.ok) {
        const data = await res.json()
        setUser(data.data)
        setFormData({
          name: data.data.name,
          email: data.data.email,
        })
      } else {
        const error = await res.json()
        setError(error.error || 'プロフィールの取得に失敗しました')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setError('プロフィールの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        const data = await res.json()
        setUser(data.data)
        setEditing(false)
        setSuccess('プロフィールを更新しました')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        const error = await res.json()
        setError(error.error || 'プロフィールの更新に失敗しました')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setError('プロフィールの更新に失敗しました')
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('新しいパスワードが一致しません')
      return
    }

    if (passwordForm.newPassword.length < 8) {
      setError('パスワードは8文字以上である必要があります')
      return
    }

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      })

      if (res.ok) {
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
        setShowPasswordForm(false)
        setSuccess('パスワードを変更しました')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        const error = await res.json()
        setError(error.error || 'パスワードの変更に失敗しました')
      }
    } catch (error) {
      console.error('Error changing password:', error)
      setError('パスワードの変更に失敗しました')
    }
  }

  if (loading) {
    return <div className="p-8 text-center">読み込み中...</div>
  }

  if (!user) {
    return <div className="p-8 text-center">ユーザー情報が見つかりません</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">プロフィール</h1>
        <Link href="/dashboard" className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300">
          ダッシュボードへ
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">基本情報</h2>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              編集
            </button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">名前</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">メールアドレス</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
              >
                保存
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false)
                  setFormData({
                    name: user.name,
                    email: user.email,
                  })
                }}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300"
              >
                キャンセル
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">名前</label>
              <p className="text-lg">{user.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">メールアドレス</label>
              <p className="text-lg">{user.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">権限</label>
              <p className="text-lg">
                <span className={`px-2 py-1 rounded text-sm ${
                  user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {user.role === 'admin' ? '管理者' : '従業員'}
                </span>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">ステータス</label>
              <p className="text-lg">
                <span className={`px-2 py-1 rounded text-sm ${
                  user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {user.isActive ? '有効' : '無効'}
                </span>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">登録日</label>
              <p className="text-lg">{dayjs(user.createdAt).format('YYYY年M月D日')}</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">パスワード変更</h2>
          {!showPasswordForm && (
            <button
              onClick={() => setShowPasswordForm(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              パスワードを変更
            </button>
          )}
        </div>

        {showPasswordForm && (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">現在のパスワード</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">新しいパスワード（8文字以上）</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">新しいパスワード（確認）</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
                minLength={8}
              />
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
              >
                変更
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(false)
                  setPasswordForm({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                  })
                }}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300"
              >
                キャンセル
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

