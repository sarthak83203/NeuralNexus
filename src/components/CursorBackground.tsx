'use client'

import { useEffect } from 'react'

export function CursorBackground() {
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const x = (e.clientX / window.innerWidth) * 100
            const y = (e.clientY / window.innerHeight) * 100
            document.documentElement.style.setProperty('--cursor-x', `${x}%`)
            document.documentElement.style.setProperty('--cursor-y', `${y}%`)
        }

        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [])

    return (
        <div className="fixed inset-0 pointer-events-none z-0 cursor-reactive-bg" />
    )
}
