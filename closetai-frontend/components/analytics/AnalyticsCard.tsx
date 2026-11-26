'use client'
import { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface AnalyticsCardProps {
  title: string
  children: ReactNode
  className?: string
  icon?: ReactNode
}

export function AnalyticsCard({ title, children, className = '', icon }: AnalyticsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-xl shadow-sm p-6 ${className}`}
    >
      <div className="flex items-center gap-2 mb-4">
        {icon && <span className="text-[#A99B8C]">{icon}</span>}
        <h3 className="font-semibold text-[#252525] text-lg">{title}</h3>
      </div>
      {children}
    </motion.div>
  )
}
