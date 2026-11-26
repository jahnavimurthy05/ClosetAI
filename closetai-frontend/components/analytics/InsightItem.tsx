'use client'
import { LightbulbIcon, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

interface InsightItemProps {
  text: string
  actionLabel?: string
  onAction?: () => void
  variant?: 'default' | 'warning' | 'tip'
}

export function InsightItem({ text, actionLabel, onAction, variant = 'default' }: InsightItemProps) {
  const colours = {
    default: 'bg-[#F8F6F2] border-[#A99B8C]',
    warning: 'bg-amber-50 border-amber-300',
    tip: 'bg-blue-50 border-blue-300',
  }
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-start gap-3 p-3 rounded-lg border-l-4 ${colours[variant]}`}
    >
      <LightbulbIcon className="w-4 h-4 mt-0.5 text-[#A99B8C] shrink-0" />
      <p className="text-sm text-[#252525] flex-1">{text}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-1 text-xs text-[#A99B8C] hover:text-[#252525] transition-colors shrink-0"
        >
          {actionLabel} <ArrowRight className="w-3 h-3" />
        </button>
      )}
    </motion.div>
  )
}
