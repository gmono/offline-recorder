import { defineConfig, presetAttributify, presetUno } from 'unocss'

export default defineConfig({
  presets: [presetUno(), presetAttributify()],
  shortcuts: {
    'glass-panel': 'rounded-[28px] border border-[#e2e4ea] bg-[#f8f9fb] shadow-[0_2px_12px_rgba(0,0,0,0.08)]',
    'glass-soft': 'rounded-[22px] border border-[#e2e4ea] bg-white',
    'panel-title': 'text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500',
    'section-title': 'text-sm font-semibold uppercase tracking-[0.22em] text-slate-500',
    'btn-base': 'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-45',
    'btn-primary': 'btn-base bg-gradient-to-r from-[#6C5CE7] to-[#8B5CF6] text-white shadow-[0_10px_28px_rgba(108,92,231,0.28)] hover:-translate-y-0.5',
    'btn-secondary': 'btn-base border border-white/60 bg-white/75 text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 hover:border-[#6C5CE7]/35 hover:text-[#6C5CE7]',
    'btn-danger': 'btn-base bg-gradient-to-r from-[#FF6B9D] to-[#FF4757] text-white shadow-[0_10px_28px_rgba(255,107,157,0.28)] hover:-translate-y-0.5',
    'btn-warning': 'btn-base bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white shadow-[0_10px_28px_rgba(245,158,11,0.24)] hover:-translate-y-0.5',
    'btn-success': 'btn-base bg-gradient-to-r from-[#10B981] to-[#059669] text-white shadow-[0_10px_28px_rgba(16,185,129,0.22)] hover:-translate-y-0.5',
  },
  theme: {
    colors: {
      accent1: '#6C5CE7',
      accent2: '#00B4D8',
      accent3: '#FF6B9D',
      accent4: '#00F5A0',
    },
  },
})
