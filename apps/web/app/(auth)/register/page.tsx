'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../../store/authStore'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { register, loading, error, clearError } = useAuthStore()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await register(username, email, password)
      router.push('/')
    } catch {}
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white">⚔️ May Hero</h1>
          <p className="text-white/40 text-sm mt-1">Crie sua conta e comece a aventura</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900 rounded-2xl p-6 border border-white/10 flex flex-col gap-4">
          {error && (
            <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3 text-red-300 text-sm flex justify-between">
              {error}
              <button type="button" onClick={clearError} className="text-red-400 hover:text-red-200">×</button>
            </div>
          )}

          <div>
            <label className="text-white/50 text-xs uppercase font-bold mb-1 block">Usuário</label>
            <input
              type="text" value={username} onChange={e => setUsername(e.target.value)}
              required placeholder="MayHero123" minLength={3} maxLength={20}
              pattern="[a-zA-Z0-9_]+"
              className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/20 outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-white/50 text-xs uppercase font-bold mb-1 block">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              required placeholder="seu@email.com"
              className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/20 outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-white/50 text-xs uppercase font-bold mb-1 block">Senha</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              required placeholder="mínimo 6 caracteres" minLength={6}
              className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/20 outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-indigo-700 to-purple-700 hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 text-white transition-all"
          >
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </button>

          <p className="text-center text-white/30 text-sm">
            Já tem conta?{' '}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300">Entrar</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
