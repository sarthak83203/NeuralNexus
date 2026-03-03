'use client'

import { useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'

interface BinaryColumn {
  x: number
  y: number
  speed: number
  direction: number // 1 for down, -1
  opacity: number
  chars: string[]
  charIndex: number
}

interface BinaryMatrixBackgroundProps {
  className?: string
  columnCount?: number
  charSize?: number
  fadeEdges?: boolean
}

export default function BinaryMatrixBackground({
  className = '',
  columnCount = 40,
  charSize = 14,
  fadeEdges = true
}: BinaryMatrixBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const columnsRef = useRef<BinaryColumn[]>([])
  const animationRef = useRef<number>()
  const frameCountRef = useRef(0)

  // Generate random binary character (0 or 1)
  const getRandomBinary = useCallback(() => {
    return Math.random() > 0.5 ? '1' : '0'
  }, [])

  // Initialize columns with alternating directions
  const initColumns = useCallback((width: number, height: number) => {
    const cols: BinaryColumn[] = []
    const actualColumnCount = Math.ceil(width / charSize)
    
    for (let i = 0; i < actualColumnCount; i++) {
      // Alternate direction: even columns go down, odd columns go up
      const direction = i % 2 === 0 ? 1 : -1
      
      cols.push({
        x: i * charSize,
        y: direction === 1 ? -charSize * 3 : height + charSize * 3,
        speed: 0.3 + Math.random() * 0.4, // Very slow speed for smoothness
        direction,
        opacity: 0.15 + Math.random() * 0.25, // Not too dark
        chars: Array.from({ length: 5 }, getRandomBinary),
        charIndex: 0
      })
    }
    
    columnsRef.current = cols
  }, [charSize, getRandomBinary])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = canvas.offsetWidth * dpr
      canvas.height = canvas.offsetHeight * dpr
      ctx.scale(dpr, dpr)
      initColumns(canvas.offsetWidth, canvas.offsetHeight)
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Animation loop - targeting 90+ FPS
    const animate = () => {
      if (!ctx || !canvas) return

      const width = canvas.offsetWidth
      const height = canvas.offsetHeight

      // Clear canvas
      ctx.clearRect(0, 0, width, height)

      frameCountRef.current++

      columnsRef.current.forEach((col, index) => {
        // Update position with smooth movement
        col.y += col.speed * col.direction

        // Reset position when column moves out of view with fade effect
        const fadeZone = charSize * 8
        let fadeOpacity = col.opacity

        if (col.direction === 1) {
          // Moving down
          if (col.y > height + fadeZone) {
            col.y = -charSize * 5
            col.chars = Array.from({ length: 5 }, getRandomBinary)
          }
          // Fade out at bottom
          if (col.y > height - fadeZone) {
            fadeOpacity = col.opacity * (1 - (col.y - (height - fadeZone)) / fadeZone)
          }
          // Fade in at top
          if (col.y < fadeZone) {
            fadeOpacity = col.opacity * (col.y / fadeZone)
          }
        } else {
          // Moving up
          if (col.y < -charSize * 5) {
            col.y = height + charSize * 3
            col.chars = Array.from({ length: 5 }, getRandomBinary)
          }
          // Fade out at top
          if (col.y < fadeZone) {
            fadeOpacity = col.opacity * (col.y / fadeZone)
          }
          // Fade in at bottom
          if (col.y > height - fadeZone) {
            fadeOpacity = col.opacity * (1 - (col.y - (height - fadeZone)) / fadeZone)
          }
        }

        // Clamp opacity
        fadeOpacity = Math.max(0, Math.min(col.opacity, fadeOpacity))

        // Draw binary characters in column
        ctx.font = `${charSize}px 'JetBrains Mono', 'Fira Code', 'Consolas', monospace`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        // Draw each character in the column with slight offset
        col.chars.forEach((char, charIdx) => {
          const charY = col.y + charIdx * charSize * 1.2
          
          // Skip if out of visible bounds
          if (charY < -charSize || charY > height + charSize) return

          // Calculate character-specific opacity (trail effect)
          const charOpacity = fadeOpacity * (1 - charIdx * 0.15)
          if (charOpacity <= 0) return

          // Color: soft purple/blue tint, not too dark
          const alpha = charOpacity
          ctx.fillStyle = `rgba(139, 92, 246, ${alpha})`
          
          // Draw character
          ctx.fillText(char, col.x + charSize / 2, charY)
        })

        // Occasionally change a random character (every ~60 frames)
        if (frameCountRef.current % 60 === 0 && Math.random() > 0.7) {
          const randomIdx = Math.floor(Math.random() * col.chars.length)
          col.chars[randomIdx] = getRandomBinary()
        }
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [charSize, getRandomBinary, initColumns])

  return (
    <motion.canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5, ease: 'easeOut' }}
      style={{
        width: '100%',
        height: '100%'
      }}
    />
  )
}
