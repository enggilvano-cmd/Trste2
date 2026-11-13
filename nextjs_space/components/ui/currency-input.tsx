'use client';
// Campo de valor em reais com máscara, no padrão do app de referência (src/components/forms/CurrencyInput.tsx):
// o usuário digita só números e o valor é formatado em centavos (1.234.567,89).
import * as React from 'react';
import { cn } from '@/lib/utils';

const BRL = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const MAX_CENTS = 99_999_999_999_99; // até R$ 99.999.999.999,99

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  /** Valor em centavos. */
  value: number;
  onValueChange: (cents: number) => void;
}

export function CurrencyInput({ value, onValueChange, className, placeholder = '0,00', ...props }: CurrencyInputProps) {
  const display = value > 0 ? BRL.format(value / 100) : '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
    const cents = digits ? Math.min(parseInt(digits, 10), MAX_CENTS) : 0;
    onValueChange(cents);
  };

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
      <input
        {...props}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={display}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          'w-full h-10 pl-10 pr-3 rounded-lg border border-border bg-background text-sm font-mono text-right tabular-nums focus:ring-2 focus:ring-primary outline-none',
          className,
        )}
      />
    </div>
  );
}
