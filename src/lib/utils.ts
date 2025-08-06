import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | undefined | null, currencySymbol: string = "R$"): string {
  if (value === undefined || value === null || isNaN(value)) {
    return `${currencySymbol} 0,00`;
  }
  return `${currencySymbol} ${value.toLocaleString('pt-BR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`
}
