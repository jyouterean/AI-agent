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
  createdBy: string | null
}

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'employee' as 'admin' | 'employee',
  })
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    fetchCurrentUser()
    fetchUsers()
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setCurrentUser(data.user)
        if (data.user.role !== 'admin') {
          router.push('/dashboard')
        }
      } else {
        router.push('/login')
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
      router.push('/login')
    }
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data.data || [])
      } else if (res.status === 401 || res.status === 403) {
        router.push('/login')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setShowForm(false)
        setFormData({ email: '', password: '', name: '', role: 'employee' })
        fetchUsers()
      } else {
        const error = await res.json()
        alert(`エラー: ${error.error || '従業員の作成に失敗しました'}`)
      }
    } catch (error) {
      console.error('Error creating user:', error)
      alert('従業員の作成に失敗しました')
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      })

      if (res.ok) {
        fetchUsers()
      } else {
        const error = await res.json()
        alert(`エラー: ${error.error || '更新に失敗しました'}`)
      }
    } catch (error) {
      console.error('Error updating user:', error)
      alert('更新に失敗しました')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この従業員を無効化しますか？')) return

    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchUsers()
      } else {
        const error = await res.json()
        alert(`エラー: ${error.error || '削除に失敗しました'}`)
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('削除に失敗しました')
    }
  }

  if (loading) {
    return <div className="p-8 text-center">読み込み中...</div>
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return null
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">従業員管理</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            {showForm ? 'キャンセル' : '新規登録'}
          </button>
          <Link href="/dashboard" className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300">
            ダッシュボードへ
          </Link>
        </div>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6 max-w-2xl">
          <h2 className="text-xl font-bold mb-4">従業員を登録</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">メールアドレス *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">パスワード *（8文字以上）</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">名前 *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">権限</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'employee' })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="employee">従業員</option>
                <option value="admin">管理者</option>
              </select>
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
              >
                登録
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300"
              >
                キャンセル
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">名前</th>
              <th className="px-4 py-3 text-left text-sm font-medium">メールアドレス</th>
              <th className="px-4 py-3 text-left text-sm font-medium">権限</th>
              <th className="px-4 py-3 text-left text-sm font-medium">ステータス</th>
              <th className="px-4 py-3 text-left text-sm font-medium">登録日</th>
              <th className="px-4 py-3 text-left text-sm font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium">{user.name}</td>
                <td className="px-4 py-3 text-sm">{user.email}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded text-xs ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user.role === 'admin' ? '管理者' : '従業員'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded text-xs ${
                    user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.isActive ? '有効' : '無効'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">{dayjs(user.createdAt).format('YYYY年M月D日')}</td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleActive(user.id, user.isActive)}
                      className={`text-sm ${
                        user.isActive ? 'text-orange-600 hover:underline' : 'text-green-600 hover:underline'
                      }`}
                    >
                      {user.isActive ? '無効化' : '有効化'}
                    </button>
                    {user.id !== currentUser.id && (
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:underline text-sm"
                      >
                        削除
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

