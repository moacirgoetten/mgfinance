import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date))
}

export function getMonthName(month: number): string {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ]
  return months[month - 1]
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    income: 'Entrada',
    fixed_expense: 'Gasto Fixo',
    variable_expense: 'Gasto Variável',
    investment: 'Investimento',
  }
  return labels[category] || category
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    income: '#22c55e',
    fixed_expense: '#ef4444',
    variable_expense: '#f97316',
    investment: '#6366f1',
  }
  return colors[category] || '#94a3b8'
}
