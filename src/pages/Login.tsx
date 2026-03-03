'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, User, Lock, ArrowRight } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../lib/api'

export default function Login() {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const data = await api.auth.login(formData.username, formData.password)
            if (data.success) {
                localStorage.setItem('username', data.username)
                navigate('/dashboard')
            } else {
                setError(data.error || 'Login failed. Please check your credentials.')
            }
        } catch (err) {
            setError('Connection error. Please ensure the backend is running.')
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background text-foreground">
            {/* Background Effects */}
            <div className="absolute inset-0" style={{
                background: 'radial-gradient(ellipse at 30% 20%, rgba(66,133,244,0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(170,0,255,0.06) 0%, transparent 50%)'
            }} />

            {/* Floating elements */}
            <div className="absolute top-20 left-20 w-4 h-4 bg-accent-blue rounded-full float-gentle opacity-60"></div>
            <div className="absolute top-40 right-32 w-6 h-6 bg-accent-pink rounded-full drift-left opacity-40"></div>
            <div className="absolute bottom-32 left-1/4 w-5 h-5 bg-accent-purple rounded-full drift-right opacity-50"></div>

            <div className="container mx-auto px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="max-w-md mx-auto"
                >
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.5 }}
                            className="inline-flex items-center gap-3 mb-4"
                        >
                            <Shield className="w-10 h-10 text-primary" />
                            <span className="font-bold text-3xl text-foreground">NexusGuard</span>
                        </motion.div>
                        <p className="text-muted-foreground font-medium">Sign in to your account</p>
                    </div>

                    {/* Login Form */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-2xl"
                    >
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Username Field */}
                            <div>
                                <label htmlFor="username" className="block text-sm font-semibold text-foreground mb-2">
                                    Username
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <input
                                        type="text"
                                        id="username"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        className="w-full pl-11 pr-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300"
                                        placeholder="Enter your username"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-semibold text-foreground mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full pl-11 pr-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="text-accent-pink text-sm text-center bg-accent-pink/10 p-3 rounded-lg border border-accent-pink/20 font-medium"
                                >
                                    {error}
                                </motion.div>
                            )}

                            {/* Submit Button */}
                            <motion.button
                                type="submit"
                                disabled={loading}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg hover:opacity-90 gentle-animation flex items-center justify-center gap-2 cyber-glow disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        Sign In
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </motion.button>
                        </form>

                        {/* Register Link */}
                        <div className="mt-6 text-center">
                            <p className="text-muted-foreground">
                                Don't have an account?{' '}
                                <Link to="/register" className="text-primary font-bold hover:underline transition-all">
                                    Create Account
                                </Link>
                            </p>
                        </div>
                    </motion.div>

                    {/* Back to Home */}
                    <div className="mt-6 text-center">
                        <Link to="/" className="text-muted-foreground hover:text-primary font-medium gentle-animation transition-all">
                            ← Back to Home
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
