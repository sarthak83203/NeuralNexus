'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useSpring, useInView } from 'framer-motion'

interface AnimatedCounterProps {
  value: number
  prefix?: string
  suffix?: string
  duration?: number
  className?: string
  decimals?: number
}

export default function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  duration = 2,
  className = '',
  decimals = 0
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [displayValue, setDisplayValue] = useState(0)
  
  const spring = useSpring(0, {
    stiffness: 50,
    damping: 20
  })
  
  useEffect(() => {
    if (isInView) {
      spring.set(value)
    }
  }, [isInView, value, spring])
  
  useEffect(() => {
    const unsubscribe = spring.on('change', (latest) => {
      const formatted = decimals > 0 
        ? latest.toFixed(decimals) 
        : Math.round(latest).toLocaleString()
      setDisplayValue(formatted as unknown as number)
    })
    return unsubscribe
  }, [spring, decimals])
  
  return (
    <span ref={ref} className={className}>
      {prefix}{displayValue}{suffix}
    </span>
  )
}

// Pulse animation wrapper for stats
export function PulseStat({ children, color = 'purple' }: { children: React.ReactNode; color?: 'purple' | 'blue' | 'emerald' | 'pink' | 'destructive' }) {
  const colorClasses = {
    purple: 'from-accent-purple/20 to-accent-purple/5',
    blue: 'from-accent-blue/20 to-accent-blue/5',
    emerald: 'from-accent-emerald/20 to-accent-emerald/5',
    pink: 'from-accent-pink/20 to-accent-pink/5',
    destructive: 'from-destructive/20 to-destructive/5'
  }
  
  return (
    <motion.div
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${colorClasses[color]} p-6 border border-border`}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {/* Animated background pulse */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
        animate={{
          x: ['-100%', '100%']
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      
      {/* Glow effect */}
      <motion.div
        className="absolute -inset-1 rounded-xl opacity-0"
        style={{
          background: `radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.15), transparent 70%)`
        }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
      
      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}

// Number ticker for real-time updates
export function NumberTicker({ 
  value, 
  className = '' 
}: { 
  value: number
  className?: string 
}) {
  const [displayValue, setDisplayValue] = useState(value)
  
  useEffect(() => {
    const diff = value - displayValue
    if (Math.abs(diff) < 0.01) return
    
    const step = diff * 0.1
    const timer = setTimeout(() => {
      setDisplayValue(prev => prev + step)
    }, 16) // ~60fps
    
    return () => clearTimeout(timer)
  }, [value, displayValue])
  
  return (
    <motion.span 
      className={className}
      initial={false}
      animate={{ 
        color: value > displayValue ? '#10b981' : value < displayValue ? '#ef4444' : 'inherit'
      }}
      transition={{ duration: 0.3 }}
    >
      {displayValue.toLocaleString()}
    </motion.span>
  )
}
