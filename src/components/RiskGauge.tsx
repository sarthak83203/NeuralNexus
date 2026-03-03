'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, useSpring, useInView } from 'framer-motion'
import { AlertTriangle, Shield, Zap } from 'lucide-react'

// Simple animated number component
function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })
  const spring = useSpring(0, { stiffness: 60, damping: 20 })
  const [displayValue, setDisplayValue] = useState(0)
  
  useEffect(() => {
    spring.set(value)
  }, [value, spring])
  
  useEffect(() => {
    const unsubscribe = spring.on('change', (latest) => {
      setDisplayValue(Math.round(latest))
    })
    return unsubscribe
  }, [spring])
  
  return <span ref={ref}>{displayValue}</span>
}

interface RiskGaugeProps {
  risk: number
  size?: number
  className?: string
}

export default function RiskGauge({ risk, size = 200, className = '' }: RiskGaugeProps) {
  
  // Calculate color based on risk
  const getColor = (value: number) => {
    if (value > 70) return '#ef4444' // destructive
    if (value > 40) return '#a855f7' // purple
    return '#10b981' // emerald
  }
  
  const getStatus = (value: number) => {
    if (value > 70) return { text: 'HIGH RISK', icon: AlertTriangle, color: 'text-destructive' }
    if (value > 40) return { text: 'MODERATE', icon: Zap, color: 'text-accent-purple' }
    return { text: 'LOW RISK', icon: Shield, color: 'text-accent-emerald' }
  }
  
  const color = getColor(risk)
  const status = getStatus(risk)
  const StatusIcon = status.icon
  
  // SVG circle calculations
  const strokeWidth = 12
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (risk / 100) * circumference * 0.75 // 75% circle
  
  return (
    <motion.div 
      className={`relative flex flex-col items-center justify-center ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background glow */}
        <motion.div
          className="absolute inset-0 rounded-full blur-3xl"
          style={{ backgroundColor: color }}
          animate={{ 
            opacity: [0.1, 0.2, 0.1],
            scale: [0.8, 1, 0.8]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-[135deg]"
        >
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(148, 163, 184, 0.1)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference * 0.75}
            strokeLinecap="round"
          />
          
          {/* Progress arc */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
            strokeLinecap="round"
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
            style={{
              filter: `drop-shadow(0 0 10px ${color}40)`
            }}
          />
          
          {/* Animated gradient overlay */}
          <defs>
            <linearGradient id={`gaugeGradient-${risk}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={color} stopOpacity="0.8" />
              <stop offset="100%" stopColor={color} stopOpacity="1" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${status.color.replace('text-', 'bg-')}/20`}
          >
            <StatusIcon className={`w-6 h-6 ${status.color}`} />
          </motion.div>
          
          <div className="text-5xl font-black flex items-start" style={{ color }}>
            <AnimatedNumber value={risk} />
            <span className="text-2xl">%</span>
          </div>
          
          <motion.div 
            className={`text-sm font-bold mt-1 ${status.color}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {status.text}
          </motion.div>
        </div>
        
        {/* Decorative dots */}
        {[0, 25, 50, 75, 100].map((tick, i) => {
          const angle = -135 + (tick / 100) * 270
          const rad = (angle * Math.PI) / 180
          const x = size / 2 + (radius + 20) * Math.cos(rad)
          const y = size / 2 + (radius + 20) * Math.sin(rad)
          
          return (
            <motion.div
              key={tick}
              className="absolute w-2 h-2 rounded-full bg-muted-foreground/30"
              style={{
                left: x - 4,
                top: y - 4
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 * i }}
            />
          )
        })}
      </div>
      
      {/* Risk factors */}
      <motion.div 
        className="mt-4 flex gap-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        {risk > 70 && (
          <span className="px-2 py-1 bg-destructive/10 text-destructive text-xs rounded-full font-semibold animate-pulse">
            Critical
          </span>
        )}
        {risk > 40 && risk <= 70 && (
          <span className="px-2 py-1 bg-accent-purple/10 text-accent-purple text-xs rounded-full font-semibold">
            Warning
          </span>
        )}
        {risk <= 40 && (
          <span className="px-2 py-1 bg-accent-emerald/10 text-accent-emerald text-xs rounded-full font-semibold">
            Secure
          </span>
        )}
      </motion.div>
    </motion.div>
  )
}
