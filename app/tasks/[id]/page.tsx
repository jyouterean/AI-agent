'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import dayjs from 'dayjs'

interface Task {
  id: string
  title: string
  description: string
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate: string | null
  assignee: string | null
  tags: string[]
  createdAt: string
  updatedAt: string
}

const statusLabels: Record<string, string> = {
  not_started: '未着手',
  in_progress: '進行中',
  completed: '完了',
  on_hold: '保留',
}

const priorityLabels: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '緊急',
}

const statusColors: Record<string, string> = {
  not_started: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  on_hold: 'bg-yellow-100 text-yellow-800',
}

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
}

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) fetchTask()
  }, [id])

  const fetchTask = async () => {
    try {
      const res = await fetch(`/api/tasks/${id}`)
      if (res.ok) {
        const data = await res.json()
        setTask(data.data)
      } else if (res.status === 404) {
        router.push('/not-found')
      } else {
        const error = await res.json()
        console.error('Error fetching task:', error)
      }
    } catch (error) {
      console.error('Error fetching task:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('このタスクを削除しますか？')) return

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        router.push('/tasks')
      } else {
        alert('タスクの削除に失敗しました')
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      alert('タスクの削除に失敗しました')
    }
  }

  if (loading) {
    return <p>読み込み中...</p>
  }

  if (!task) {
    return <p>タスクが見つかりません</p>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">タスク詳細</h1>
        <div className="flex gap-2">
          <Link
            href={`/tasks/${id}/edit`}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
          >
            編集
          </Link>
          <button
            onClick={handleDelete}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            削除
          </button>
          <button
            onClick={() => router.back()}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
          >
            戻る
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">{task.title}</h2>
          <div className="flex gap-4 mb-4">
            <span className={`px-3 py-1 rounded ${statusColors[task.status]}`}>
              {statusLabels[task.status]}
            </span>
            <span className={`px-3 py-1 rounded ${priorityColors[task.priority]}`}>
              優先度: {priorityLabels[task.priority]}
            </span>
          </div>
        </div>

        {task.description && (
          <div className="mb-6">
            <h3 className="font-bold mb-2">説明</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h3 className="font-bold mb-2">期限</h3>
            <p className="text-gray-700">
              {task.dueDate ? (
                <span
                  className={
                    dayjs(task.dueDate).isBefore(dayjs()) && task.status !== 'completed'
                      ? 'text-red-600 font-medium'
                      : ''
                  }
                >
                  {dayjs(task.dueDate).format('YYYY年M月D日')}
                </span>
              ) : (
                <span className="text-gray-400">設定されていません</span>
              )}
            </p>
          </div>

          {task.assignee && (
            <div>
              <h3 className="font-bold mb-2">担当者</h3>
              <p className="text-gray-700">{task.assignee}</p>
            </div>
          )}
        </div>

        {task.tags.length > 0 && (
          <div className="mb-6">
            <h3 className="font-bold mb-2">タグ</h3>
            <div className="flex flex-wrap gap-2">
              {task.tags.map((tag, idx) => (
                <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="border-t pt-4 text-sm text-gray-500">
          <p>作成日: {dayjs(task.createdAt).format('YYYY年M月D日 HH:mm')}</p>
          <p>更新日: {dayjs(task.updatedAt).format('YYYY年M月D日 HH:mm')}</p>
        </div>
      </div>
    </div>
  )
}

