import Link from "next/link";
import { TrendingUp, BarChart2, Target, Brain, Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050a14] via-[#0a1628] to-[#050a14]">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-600 rounded-xl">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">MGFinance</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="text-slate-300 hover:text-white text-sm font-medium transition">
            Entrar
          </Link>
          <Link href="/auth/register" className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
            Criar conta grátis
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 rounded-full px-4 py-1.5 text-sm text-blue-300 mb-6">
          <Brain className="w-3.5 h-3.5" />
          Resumo mensal gerado por IA
        </div>
        <h1 className="text-5xl font-bold text-white leading-tight mb-6">
          Suas finanças sob<br />
          <span className="text-blue-400">total controle</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto mb-10">
          Registre entradas, gastos e investimentos. No final do mês, nossa IA analisa tudo e te dá um relatório completo da sua vida financeira.
        </p>
        <Link href="/auth/register" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3.5 rounded-xl transition text-lg">
          Começar agora — é grátis
        </Link>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-20">
          {[
            { icon: BarChart2, title: "Gráficos em tempo real", desc: "Visualize como está distribuindo seu dinheiro em gráficos de pizza e barras." },
            { icon: Target, title: "Metas financeiras", desc: "Defina metas de economia e acompanhe seu progresso mês a mês." },
            { icon: Shield, title: "Orçamento por categoria", desc: "Defina limites por categoria e receba alertas quando estiver ultrapassando." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-[#0a1628]/80 border border-[#1a3a5c]/60 rounded-2xl p-6 text-left">
              <div className="p-2.5 bg-blue-600/20 rounded-lg w-fit mb-4">
                <Icon className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
