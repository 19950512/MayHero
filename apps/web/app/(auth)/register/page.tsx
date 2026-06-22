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
    <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(circle_at_top,#3a2b17_0%,#1b140d_30%,#100d08_70%,#0a0907_100%)] text-[#e8d7b2]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-amber-100 font-serif">⚔️ May Hero</h1>
          <p className="text-amber-100/40 text-sm mt-2">Crie sua conta e comece a aventura</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#1a140f]/80 rounded-xl p-6 border border-amber-900/40 flex flex-col gap-4 backdrop-blur-sm">
          {error && (
            <div className="bg-red-900/20 border border-red-700/40 rounded-lg p-3 text-red-300 text-sm flex justify-between">
              {error}
              <button type="button" onClick={clearError} className="text-red-400 hover:text-red-200">×</button>
            </div>
          )}

          <div>
            <label className="text-amber-100/60 text-xs uppercase font-bold mb-2 block tracking-wider">Usuário</label>
            <input
              type="text" value={username} onChange={e => setUsername(e.target.value)}
              required placeholder="MayHero123" minLength={3} maxLength={20}
              pattern="[a-zA-Z0-9_]+"
              className="w-full bg-[#0f0a06] border border-amber-900/30 rounded-lg px-3 py-2.5 text-amber-50 text-sm placeholder-amber-900/40 outline-none focus:border-amber-700/60 focus:ring-1 focus:ring-amber-700/30 transition-colors"
            />
          </div>

          <div>
            <label className="text-amber-100/60 text-xs uppercase font-bold mb-2 block tracking-wider">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              required placeholder="seu@email.com"
              className="w-full bg-[#0f0a06] border border-amber-900/30 rounded-lg px-3 py-2.5 text-amber-50 text-sm placeholder-amber-900/40 outline-none focus:border-amber-700/60 focus:ring-1 focus:ring-amber-700/30 transition-colors"
            />
          </div>

          <div>
            <label className="text-amber-100/60 text-xs uppercase font-bold mb-2 block tracking-wider">Senha</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              required placeholder="mínimo 6 caracteres" minLength={6}
              className="w-full bg-[#0f0a06] border border-amber-900/30 rounded-lg px-3 py-2.5 text-amber-50 text-sm placeholder-amber-900/40 outline-none focus:border-amber-700/60 focus:ring-1 focus:ring-amber-700/30 transition-colors"
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full py-3 rounded-lg font-bold bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-amber-50 transition-all uppercase tracking-wider text-sm"
          >
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </button>

          <p className="text-center text-amber-100/40 text-sm">
            Já tem conta?{' '}
            <Link href="/login" className="text-amber-300 hover:text-amber-200 font-semibold">Entrar</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
