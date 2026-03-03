'use client'

import { motion } from 'framer-motion'
import { Volume2, VolumeX, Menu, X, Shield } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export function Hero() {
    const [isMuted, setIsMuted] = useState(true)
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.volume = 0
            videoRef.current.muted = true
            videoRef.current.defaultMuted = true
            const playPromise = videoRef.current.play()
            if (playPromise !== undefined) {
                playPromise.catch(error => console.error('Video autoplay failed:', error))
            }
        }
    }, [])

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = isMuted
            videoRef.current.volume = isMuted ? 0 : 0.7
        }
    }, [isMuted])

    useEffect(() => {
        document.body.style.overflow = isMobileMenuOpen ? 'hidden' : 'unset'
        return () => { document.body.style.overflow = 'unset' }
    }, [isMobileMenuOpen])

    useEffect(() => {
        const handleScroll = () => { if (isMobileMenuOpen) setIsMobileMenuOpen(false) }
        if (isMobileMenuOpen) window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [isMobileMenuOpen])

    const navLinks = [
        { href: '#features', label: 'Features' },
        { href: '#how-it-works', label: 'How It Works' },
        { href: '#technology', label: 'Technology' },
        { href: '#team', label: 'Team' },
        { href: '#contact', label: 'Contact' },
    ]

    return (
        <div className="relative h-screen w-full overflow-hidden bg-background">
            {/* Video Background with dark overlay */}
            <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover scale-110 opacity-30"
                autoPlay muted loop playsInline
            >
                <source src="https://mojli.s3.us-east-2.amazonaws.com/Mojli+Website+upscaled+(12mb).webm" type="video/webm" />
            </video>

            {/* Cybersecurity overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
            <div className="absolute inset-0" style={{
                background: 'radial-gradient(ellipse at 30% 20%, rgba(66,133,244,0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(170,0,255,0.06) 0%, transparent 50%)'
            }} />

            {/* Navbar */}
            <motion.nav
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="fixed top-0 left-0 right-0 w-full z-[110]"
            >
                <div className={`w-full px-6 sm:px-8 lg:px-12 py-4 transition-all duration-300 ease-out ${
                    isScrolled ? 'bg-background/90 backdrop-blur-xl border-b border-border' : 'bg-transparent'
                }`}>
                    <div className="flex items-center justify-between">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        >
                            <Shield className="w-6 h-6 text-primary" />
                            <span className="font-bold text-foreground text-xl tracking-wider">NexusGuard</span>
                        </motion.div>

                        <div className="hidden md:flex items-center space-x-8">
                            {navLinks.map(link => (
                                <a key={link.href} href={link.href} className="text-foreground/80 hover:text-primary font-medium gentle-animation">
                                    {link.label}
                                </a>
                            ))}
                        </div>

                        <div className="flex items-center space-x-3">
                            <div className="relative">
                                <button
                                    onClick={() => setIsMuted(!isMuted)}
                                    className="glass-effect p-3 rounded-full text-foreground hover:text-primary gentle-animation cursor-pointer"
                                >
                                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                </button>
                                {isMuted && (
                                    <div className="absolute -bottom-10 right-0 flex items-center text-foreground/60">
                                        <span className="whitespace-nowrap font-medium text-sm mr-2">Sound On</span>
                                        <span className="text-lg">↗</span>
                                    </div>
                                )}
                            </div>

                            <motion.a
                                href="/register"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="hidden sm:block bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-lg hover:opacity-90 gentle-animation ml-4 cursor-pointer"
                            >
                                Get Started
                            </motion.a>

                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="md:hidden glass-effect p-3 rounded-full text-foreground gentle-animation cursor-pointer z-[120] relative"
                            >
                                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.nav>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-md z-[80] cursor-pointer"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: isMobileMenuOpen ? '0%' : '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="md:hidden fixed top-0 right-0 h-full w-72 max-w-[85vw] bg-background/95 backdrop-blur-xl border-l border-border z-[90]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex flex-col h-full">
                    <div className="flex justify-end p-4">
                        <button onClick={() => setIsMobileMenuOpen(false)} className="glass-effect p-3 rounded-full text-foreground cursor-pointer">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex flex-col px-6 pb-6 h-full">
                        <div className="flex flex-col space-y-4">
                            {navLinks.map(link => (
                                <a key={link.href} href={link.href}
                                   className="px-4 py-3 text-foreground hover:text-primary hover:bg-primary/10 rounded-lg gentle-animation font-medium text-lg"
                                   onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {link.label}
                                </a>
                            ))}
                        </div>
                        <motion.a
                            href="/register"
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-lg mt-8 cursor-pointer block text-center"
                        >
                            Get Started
                        </motion.a>
                    </div>
                </div>
            </motion.div>

            {/* Hero Content */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.8 }}
                className="absolute inset-0 flex items-center justify-center z-40"
            >
                <div className="text-center max-w-4xl mx-auto px-6">
                    <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full border border-accent-emerald/30 bg-accent-emerald/5">
                        <div className="w-2 h-2 bg-accent-emerald rounded-full animate-pulse" />
                        <span className="text-accent-emerald text-sm font-semibold">AI-Powered Protection Active</span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black leading-tight text-foreground mb-6">
                        <span className="block">REAL-TIME UPI</span>
                        <span className="block gradient-text">FRAUD DETECTION</span>
                    </h1>

                    <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                        Powered by 1D Convolutional Neural Networks and Google Gemini AI — protecting every transaction with intelligent, explainable fraud analysis.
                    </p>

                    <div className="flex flex-wrap gap-4 justify-center">
                        <motion.a
                            href="/register"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-primary text-primary-foreground font-semibold px-8 py-4 rounded-lg cyber-glow cursor-pointer"
                        >
                            Get Started
                        </motion.a>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                            className="glass-effect text-foreground font-semibold px-8 py-4 rounded-lg cursor-pointer"
                        >
                            How It Works
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
