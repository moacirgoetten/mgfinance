export type InvestmentType = 'acoes' | 'fiis' | 'tesouro' | 'renda_fixa' | 'crypto' | 'etfs' | 'poupanca' | 'outros'

export interface InvestmentAsset {
  id: string
  user_id: string
  name: string
  ticker?: string
  type: InvestmentType
  amount_invested: number
  current_value: number
  quantity?: number
  purchase_date?: string
  notes?: string
  created_at: string
  updated_at: string
}

export const INVESTMENT_TYPES: Record<InvestmentType, { label: string; color: string; emoji: string }> = {
  acoes:      { label: 'Ações',         color: '#3b82f6', emoji: '📈' },
  fiis:       { label: 'FIIs',          color: '#8b5cf6', emoji: '🏢' },
  tesouro:    { label: 'Tesouro Direto',color: '#22c55e', emoji: '🏛️' },
  renda_fixa: { label: 'Renda Fixa',    color: '#06b6d4', emoji: '🏦' },
  crypto:     { label: 'Cripto',        color: '#f97316', emoji: '₿'  },
  etfs:       { label: 'ETFs',          color: '#a855f7', emoji: '📊' },
  poupanca:   { label: 'Poupança',      color: '#84cc16', emoji: '🐷' },
  outros:     { label: 'Outros',        color: '#64748b', emoji: '💼' },
}
