'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#050a14] via-[#0a1628] to-[#050a14] flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center bg-[#0a1628]/80 backdrop-blur border border-[#1a3a5c]/60 rounded-2xl p-5 md:p-8">
          <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-7 h-7 text-green-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Conta criada!</h2>
          <p className="text-slate-400 text-sm mb-6">
            Verifique seu email para confirmar a conta e depois faça login.
          </p>
          <Link
            href="/auth/login"
            className="inline-block py-2.5 px-6 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition"
          >
            Ir para o login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050a14] via-[#0a1628] to-[#050a14] flex items-center justify-center p-4">
      <div className="w-full max-w-md px-2 md:px-0">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="p-2 bg-blue-600 rounded-xl">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl md:text-2xl font-bold text-white">MGFinance</span>
          </div>
          <p className="text-slate-400 text-sm">Seu gestor financeiro inteligente</p>
        </div>

        <div className="bg-[#0a1628]/80 backdrop-blur border border-[#1a3a5c]/60 rounded-2xl p-5 md:p-8">
          <h1 className="text-xl font-semibold text-white mb-6">Criar conta</h1>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Nome</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="Seu nome completo"
                className="w-full px-4 py-2.5 bg-[#0d1f3c]/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                className="w-full px-4 py-2.5 bg-[#0d1f3c]/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-4 py-2.5 bg-[#0d1f3c]/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Já tem conta?{' '}
            <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 font-medium">
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
