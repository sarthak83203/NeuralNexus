'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion'
import { Shield, LogOut, Upload, AlertTriangle, CheckCircle, TrendingUp, Database, Activity, Brain, Home, BarChart3, CreditCard, LineChart, Lock, MessageCircle, X, Send, Zap, Sparkles, Target, Clock, RefreshCw, User, ShieldCheck, Wallet, MapPin, Timer } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { Transaction, DashboardData, FlaggedData, TransactionResult } from '../lib/types'
import RealTimeGraph from '../components/RealTimeGraph'
import RiskGauge from '../components/RiskGauge'
import AnimatedCounter, { PulseStat } from '../components/AnimatedCounter'
import ParticleBackground from '../components/ParticleBackground'

// Smooth scroll hook
const useSmoothScroll = () => {
  const scrollTo = (elementId: string) => {
    const element = document.getElementById(elementId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
  return scrollTo
}

// Animated card component with hover effects
const AnimatedCard = ({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left)
    mouseY.set(e.clientY - rect.top)
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, scale: 1.01 }}
      onMouseMove={handleMouseMove}
      className={`relative overflow-hidden rounded-2xl border border-border bg-card ${className}`}
      style={{
        transform: 'translateZ(0)', // GPU acceleration
        willChange: 'transform'
      }}
    >
      {/* Animated gradient background on hover */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: useTransform(
            [mouseX, mouseY],
            ([x, y]) => `radial-gradient(400px circle at ${x}px ${y}px, rgba(139, 92, 246, 0.1), transparent 40%)`
          )
        }}
      />
      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}

// Floating animation wrapper
const FloatingElement = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div
    animate={{ 
      y: [0, -8, 0],
    }}
    transition={{ 
      duration: 4, 
      repeat: Infinity, 
      ease: "easeInOut",
      delay 
    }}
  >
    {children}
  </motion.div>
)

// Shimmer loading effect
const ShimmerLoader = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-4 bg-muted rounded w-3/4" />
    <div className="h-4 bg-muted rounded w-1/2" />
    <div className="h-20 bg-muted rounded" />
  </div>
)

export default function Dashboard() {
    const navigate = useNavigate()
    const scrollTo = useSmoothScroll()
    const containerRef = useRef<HTMLDivElement>(null)
    
    // Scroll-based parallax
    const { scrollYProgress } = useScroll({ container: containerRef })
    const headerY = useTransform(scrollYProgress, [0, 0.1], [0, -20])
    const headerOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0.9])
    
    const [user, setUser] = useState<{ username: string; _id: string; is_active: boolean; is_admin: boolean } | null>(null)
    const [balance, setBalance] = useState<number>(0)
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [aiInsight, setAiInsight] = useState('')
    const [securityTip, setSecurityTip] = useState('')
    const [loading, setLoading] = useState(true)

    // Admin State
    const [adminData, setAdminData] = useState<FlaggedData | null>(null)
    const [adminStats, setAdminStats] = useState<{ total_users: number; total_tx: number; total_blocked: number; block_rate: number; unreviewed_count: number } | null>(null)
    const [isAdmin, setIsAdmin] = useState(false)

    // Transaction Form State
    const [txAmount, setTxAmount] = useState('')
    const [txLocation, setTxLocation] = useState('0')
    const [txLoading, setTxLoading] = useState(false)
    const [txResult, setTxResult] = useState<TransactionResult | null>(null)
    const [txError, setTxError] = useState('')

    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [analyzing, setAnalyzing] = useState(false)
    const [results, setResults] = useState<{
        isFraud: boolean
        confidence: string
        transactionsAnalyzed: number
        fraudDetected: number
        riskScore: string
        explanation: string
        userProfile?: {
            avgAmount: number
            stdAmount: number
            medianAmount: number
            minAmount: number
            maxAmount: number
            commonLocations: number[]
            commonHours: number[]
            totalTransactions: number
            fraudRate: number
        }
        profileSaved?: boolean
    } | null>(null)
    const [activeTab, setActiveTab] = useState('home')
    const [chatOpen, setChatOpen] = useState(false)
    const [chatInput, setChatInput] = useState('')
    const [chatLoading, setChatLoading] = useState(false)
    const [chatMessages, setChatMessages] = useState<Array<{type: string, text: string}>>([
        { type: 'bot', text: 'Hello! I\'m your NexusGuard AI assistant. How can I help you today?' }
    ])

    // Live Fraud Simulator State
    const [simulatorData, setSimulatorData] = useState({
        amount: 5000,
        location: 2,
        hour: 14
    })
    const [riskScore, setRiskScore] = useState(0)
    const [simulatorExplanation, setSimulatorExplanation] = useState('')
    const [showSimulatorResult, setShowSimulatorResult] = useState(false)
    const [isSimulating, setIsSimulating] = useState(false)

    const fetchDashboard = async () => {
        setLoading(true)
        try {
            const data = await api.dashboard.get()
            if (data.error) {
                navigate('/login')
                return
            }
            setUser(data.user)
            setBalance(data.balance)
            setTransactions(data.transactions)
            setAiInsight(data.ai_insight)
            setSecurityTip(data.security_tip)
            setIsAdmin(data.user.is_admin)
        } catch (err) {
            console.error('Failed to fetch dashboard', err)
        } finally {
            setLoading(false)
        }
    }

    const fetchAdminData = async () => {
        if (!isAdmin) return
        try {
            const [flagged, stats] = await Promise.all([
                api.admin.flagged(),
                api.admin.stats()
            ])
            if (!flagged.error && !stats.error) {
                setAdminData(flagged)
                setAdminStats(stats)
            }
        } catch (err) {
            console.error('Admin fetch failed', err)
        }
    }

    useEffect(() => {
        fetchDashboard()
    }, [])

    useEffect(() => {
        if (activeTab === 'admin' && isAdmin) {
            fetchAdminData()
        }
    }, [activeTab, isAdmin])

    const handleLogout = async () => {
        await api.auth.logout()
        navigate('/')
    }

    const handleTransaction = async (e: React.FormEvent) => {
        e.preventDefault()
        setTxLoading(true)
        setTxError('')
        setTxResult(null)

        try {
            const data = await api.transactions.create(Number(txAmount), Number(txLocation))
            if (data.error) {
                setTxError(data.error)
            } else {
                setTxResult(data)
                if (data.status === 'success') {
                    setTimeout(() => fetchDashboard(), 2000)
                }
            }
        } catch (err) {
            setTxError('Transaction failed')
        } finally {
            setTxLoading(false)
        }
    }

    const handleReview = async (id: string) => {
        try {
            const res = await api.admin.reviewFlagged(id)
            if (res.success) {
                fetchAdminData()
            }
        } catch (err) {
            console.error('Review failed', err)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0])
            setResults(null)
        }
    }

    const handleAnalyze = async () => {
        if (!selectedFile) return

        setAnalyzing(true)
        const startTime = Date.now()

        try {
            const data = await api.transactions.analyze(selectedFile)
            // Ensure minimum 3 second loading time for better UX
            const elapsed = Date.now() - startTime
            const minDelay = 3000
            if (elapsed < minDelay) {
                await new Promise(resolve => setTimeout(resolve, minDelay - elapsed))
            }
            if (data.error) {
                console.error('Analysis failed', data.error)
            } else {
                setResults(data)
            }
        } catch (err) {
            console.error('Analysis error', err)
        } finally {
            setAnalyzing(false)
        }
    }

    const handleSimulate = async () => {
        const { amount, location, hour } = simulatorData
        setIsSimulating(true)
        
        try {
            const res = await api.transactions.predict(amount, location, hour)
            if (res.error) {
                console.error('Simulation failed', res.error)
                setIsSimulating(false)
                return
            }
            
            // Animate risk score change
            const targetRisk = Math.round(res.probability * 100)
            setRiskScore(targetRisk)
            setSimulatorExplanation(res.explanation)
            setShowSimulatorResult(true)
            setIsSimulating(false)
        } catch (err) {
            console.error('Simulator error', err)
            setIsSimulating(false)
        }
    }

    const navItems = [
        { id: 'home', label: 'Analysis', icon: Brain },
        { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
        { id: 'transactions', label: 'Pay', icon: CreditCard },
        { id: 'analytics', label: 'Insights', icon: LineChart },
        ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: Lock }] : []),
    ]

    const predefinedResponses: { [key: string]: string } = {
        'How does fraud detection work?': 'NexusGuard uses a 1D CNN neural network to analyze transaction patterns in real-time. The model examines features like amount, location, time, and historical behavior to detect anomalies. Google Gemini AI then generates human-readable explanations for each detection.',
        'What is the accuracy rate?': 'Our fraud detection system achieves 99.2% accuracy with a processing speed of under 200ms per transaction. We\'ve analyzed over 1.2M transactions and successfully detected 12.4K fraudulent activities.',
        'How to upload transaction data?': 'Simply click the file upload button, select your CSV or JSON file containing transaction data, and click "Analyze with AI". Our system will process the data and provide instant fraud detection results with AI-powered explanations.',
        'What data format is supported?': 'We support CSV and JSON formats. Your file should include transaction details like amount, timestamp, location, and user ID. The system automatically processes and analyzes the data structure.',
    }

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!chatInput.trim() || chatLoading) return

        const userMsg = chatInput.trim()
        setChatInput('')
        setChatMessages(prev => [...prev, { type: 'user', text: userMsg }])
        setChatLoading(true)

        try {
            const data = await api.transactions.chat(userMsg)
            setChatMessages(prev => [...prev, { type: 'bot', text: data.answer || "I'm not sure how to respond to that." }])
        } catch (err) {
            setChatMessages(prev => [...prev, { type: 'bot', text: "Sorry, I'm having trouble connecting right now." }])
        } finally {
            setChatLoading(false)
        }
    }

    const handleChatOption = async (option: string) => {
        setChatMessages(prev => [...prev, { type: 'user', text: option }])
        setChatLoading(true)
        
        try {
            const data = await api.transactions.chat(option)
            setChatMessages(prev => [...prev, { type: 'bot', text: data.answer || "I'm not sure how to respond to that." }])
        } catch (err) {
            setChatMessages(prev => [...prev, { type: 'bot', text: predefinedResponses[option] || 'I can help you with fraud detection queries.' }])
        } finally {
            setChatLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                    <Shield className="w-16 h-16 text-primary mb-4" />
                </motion.div>
                <h2 className="text-xl font-bold text-foreground">Initialising NexusGuard...</h2>
                <p className="text-muted-foreground">Securing your UPI experience</p>
            </div>
        )
    }

    return (
        <div ref={containerRef} className="min-h-screen bg-background relative overflow-x-hidden">
            {/* Particle Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <ParticleBackground particleCount={25} connectionDistance={120} />
            </div>
            
            {/* Navigation Bar */}
            <motion.nav 
                style={{ y: headerY, opacity: headerOpacity }}
                className="border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-50"
            >
                <div className="container mx-auto px-6">
                    <div className="flex items-center justify-between py-4">
                        {/* Logo */}
                        <motion.div 
                            className="flex items-center gap-3"
                            whileHover={{ scale: 1.02 }}
                        >
                            <motion.div
                                whileHover={{ rotate: 360 }}
                                transition={{ duration: 0.6 }}
                            >
                                <Shield className="w-8 h-8 text-primary" />
                            </motion.div>
                            <div>
                                <h1 className="font-bold text-xl text-foreground">NexusGuard</h1>
                                <p className="text-xs text-muted-foreground">Fraud Detection Dashboard</p>
                            </div>
                        </motion.div>

                        {/* Navigation Items */}
                        <div className="hidden md:flex items-center gap-1">
                            {navItems.map((item, index) => {
                                const Icon = item.icon
                                const isActive = activeTab === item.id
                                return (
                                    <motion.button
                                        key={item.id}
                                        onClick={() => setActiveTab(item.id)}
                                        initial={{ opacity: 0, y: -20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className={`relative flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                                            isActive
                                                ? 'text-foreground'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span className="text-sm font-medium">{item.label}</span>
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeTab"
                                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent-blue via-accent-purple to-accent-pink"
                                                initial={false}
                                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                            />
                                        )}
                                    </motion.button>
                                )
                            })}
                        </div>

                        {/* Logout Button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">Logout</span>
                        </motion.button>
                    </div>
                </div>
            </motion.nav>

            <div className="container mx-auto px-6 py-8 relative z-10">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[
                        { icon: Wallet, label: 'Wallet Balance', value: balance, color: 'from-accent-blue/20 to-accent-blue/5', prefix: '₹' },
                        { icon: Activity, label: 'Transactions', value: transactions.length, color: 'from-accent-pink/20 to-accent-pink/5', suffix: '' },
                        { icon: CheckCircle, label: 'Status', value: user?.is_active ? 'Active' : 'Inactive', color: 'from-accent-emerald/20 to-accent-emerald/5', isText: true },
                        { icon: ShieldCheck, label: 'Security', value: 'Enabled', color: 'from-accent-purple/20 to-accent-purple/5', isText: true },
                    ].map((stat, index) => (
                        <AnimatedCard key={stat.label} delay={index * 0.1} className="p-6">
                            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-50`} />
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <motion.div
                                        whileHover={{ rotate: 15, scale: 1.1 }}
                                        transition={{ type: "spring", stiffness: 300 }}
                                    >
                                        <stat.icon className="w-8 h-8 text-foreground/80" />
                                    </motion.div>
                                    <Activity className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div className="text-3xl font-black gradient-text mb-1">
                                    {stat.isText ? (
                                        stat.value
                                    ) : (
                                        <AnimatedCounter value={stat.value as number} prefix={stat.prefix} suffix={stat.suffix} />
                                    )}
                                </div>
                                <div className="text-sm text-muted-foreground">{stat.label}</div>
                            </div>
                        </AnimatedCard>
                    ))}
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    {activeTab === 'home' && (
                        <motion.div
                            key="home"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                            className="space-y-8"
                        >
                            {/* Real-time Graph Section */}
                            <RealTimeGraph 
                                currentAmount={simulatorData.amount}
                                currentLocation={simulatorData.location}
                                currentHour={simulatorData.hour}
                                riskScore={riskScore}
                                isSimulating={isSimulating}
                            />

                            {/* Main Analysis Section */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Upload Section */}
                                <AnimatedCard className="lg:col-span-2 p-8" delay={0.2}>
                                    <div className="flex items-center gap-3 mb-6">
                                        <motion.div
                                            animate={{ y: [0, -4, 0] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        >
                                            <Upload className="w-6 h-6 text-primary" />
                                        </motion.div>
                                        <h2 className="text-2xl font-bold text-foreground">Upload Transaction Data</h2>
                                    </div>

                                    {/* File Upload */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-foreground mb-3">
                                            Select CSV or JSON file
                                        </label>
                                        <motion.div 
                                            className="relative"
                                            whileHover={{ scale: 1.01 }}
                                        >
                                            <input
                                                type="file"
                                                accept=".csv,.json"
                                                onChange={handleFileChange}
                                                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:opacity-90 file:cursor-pointer cursor-pointer border border-border rounded-lg bg-input transition-all"
                                            />
                                        </motion.div>
                                        <AnimatePresence>
                                            {selectedFile && (
                                                <motion.p 
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="mt-2 text-sm text-accent-emerald flex items-center gap-2"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    {selectedFile.name} selected
                                                </motion.p>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Analyze Button */}
                                    <motion.button
                                        whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(139, 92, 246, 0.3)' }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleAnalyze}
                                        disabled={!selectedFile || analyzing}
                                        className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden"
                                    >
                                        {analyzing ? (
                                            <>
                                                <motion.div 
                                                    className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                />
                                                Analyzing...
                                            </>
                                        ) : (
                                            <>
                                                <Brain className="w-5 h-5" />
                                                Analyze with AI
                                            </>
                                        )}
                                    </motion.button>

                                    {/* Results */}
                                    <AnimatePresence>
                                        {results && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="mt-8 space-y-4 overflow-hidden"
                                            >
                                                {/* Status Badge */}
                                                <motion.div 
                                                    initial={{ x: -20, opacity: 0 }}
                                                    animate={{ x: 0, opacity: 1 }}
                                                    transition={{ delay: 0.1 }}
                                                    className={`flex items-center gap-3 p-4 rounded-xl ${
                                                        results.isFraud
                                                            ? 'bg-destructive/10 border border-destructive/30'
                                                            : 'bg-accent-emerald/10 border border-accent-emerald/30'
                                                    }`}
                                                >
                                                    {results.isFraud ? (
                                                        <>
                                                            <AlertTriangle className="w-6 h-6 text-destructive" />
                                                            <div>
                                                                <div className="font-bold text-destructive">Fraud Detected</div>
                                                                <div className="text-sm text-muted-foreground">High risk transaction patterns identified</div>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircle className="w-6 h-6 text-accent-emerald" />
                                                            <div>
                                                                <div className="font-bold text-accent-emerald">No Fraud Detected</div>
                                                                <div className="text-sm text-muted-foreground">Transaction patterns appear normal</div>
                                                            </div>
                                                        </>
                                                    )}
                                                </motion.div>

                                                {/* Metrics */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    <motion.div 
                                                        initial={{ y: 20, opacity: 0 }}
                                                        animate={{ y: 0, opacity: 1 }}
                                                        transition={{ delay: 0.2 }}
                                                        className="bg-background/50 p-4 rounded-lg border border-border"
                                                    >
                                                        <div className="text-sm text-muted-foreground mb-1">Confidence</div>
                                                        <div className="text-2xl font-bold text-primary">{results.confidence}%</div>
                                                    </motion.div>
                                                    <motion.div 
                                                        initial={{ y: 20, opacity: 0 }}
                                                        animate={{ y: 0, opacity: 1 }}
                                                        transition={{ delay: 0.3 }}
                                                        className="bg-background/50 p-4 rounded-lg border border-border"
                                                    >
                                                        <div className="text-sm text-muted-foreground mb-1">Risk Score</div>
                                                        <div className="text-2xl font-bold text-accent-purple">{results.riskScore}</div>
                                                    </motion.div>
                                                </div>

                                                {/* AI Explanation */}
                                                <motion.div 
                                                    initial={{ y: 20, opacity: 0 }}
                                                    animate={{ y: 0, opacity: 1 }}
                                                    transition={{ delay: 0.4 }}
                                                    className="bg-background/50 p-6 rounded-lg border border-border"
                                                >
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Brain className="w-5 h-5 text-primary" />
                                                        <div className="font-bold text-foreground">AI Explanation</div>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                                        {results.explanation}
                                                    </p>
                                                </motion.div>

                                                {/* User Profile from CSV */}
                                                {results.userProfile && (
                                                    <motion.div 
                                                        initial={{ y: 20, opacity: 0 }}
                                                        animate={{ y: 0, opacity: 1 }}
                                                        transition={{ delay: 0.5 }}
                                                        className="bg-accent-blue/5 p-6 rounded-lg border border-accent-blue/20"
                                                    >
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <Database className="w-5 h-5 text-accent-blue" />
                                                            <div className="font-bold text-foreground">CSV Profile Loaded</div>
                                                            {results.profileSaved && (
                                                                <motion.span 
                                                                    initial={{ scale: 0 }}
                                                                    animate={{ scale: 1 }}
                                                                    className="px-2 py-0.5 bg-accent-emerald/20 text-accent-emerald text-xs rounded-full"
                                                                >
                                                                    Active
                                                                </motion.span>
                                                            )}
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                                            <div>
                                                                <span className="text-muted-foreground">Average:</span>
                                                                <span className="ml-2 font-semibold">₹{results.userProfile.avgAmount.toLocaleString()}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-muted-foreground">Std Dev:</span>
                                                                <span className="ml-2 font-semibold">₹{results.userProfile.stdAmount.toLocaleString()}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-muted-foreground">Range:</span>
                                                                <span className="ml-2 font-semibold">₹{results.userProfile.minAmount.toLocaleString()} - ₹{results.userProfile.maxAmount.toLocaleString()}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-muted-foreground">Transactions:</span>
                                                                <span className="ml-2 font-semibold">{results.userProfile.totalTransactions}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-muted-foreground">Usual Locations:</span>
                                                                <span className="ml-2 font-semibold">{results.userProfile.commonLocations.join(', ')}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-muted-foreground">Fraud Rate:</span>
                                                                <span className={`ml-2 font-semibold ${results.userProfile.fraudRate > 0.1 ? 'text-destructive' : 'text-accent-emerald'}`}>
                                                                    {(results.userProfile.fraudRate * 100).toFixed(1)}%
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </AnimatedCard>

                                {/* Info Panel */}
                                <div className="space-y-6">
                                    <AnimatedCard className="p-6" delay={0.3}>
                                        <h3 className="font-bold text-lg text-foreground mb-4">How It Works</h3>
                                        <div className="space-y-4">
                                            {[
                                                { step: '1', text: 'Upload transaction data (CSV/JSON)', icon: Upload },
                                                { step: '2', text: '1D CNN analyzes patterns', icon: Brain },
                                                { step: '3', text: 'AI generates explanation', icon: Sparkles },
                                                { step: '4', text: 'Get instant results', icon: CheckCircle }
                                            ].map((item, i) => (
                                                <motion.div 
                                                    key={item.step} 
                                                    className="flex items-start gap-3"
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.4 + i * 0.1 }}
                                                    whileHover={{ x: 4 }}
                                                >
                                                    <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                                                        {item.step}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">{item.text}</p>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </AnimatedCard>
                                    
                                    <AnimatedCard className="p-6" delay={0.4}>
                                        <h3 className="font-bold text-lg text-foreground mb-4">Model Info</h3>
                                        <div className="space-y-3">
                                            {[
                                                { label: 'Architecture', value: '1D CNN + Dense Layers' },
                                                { label: 'AI Engine', value: 'Google Gemini' },
                                                { label: 'Database', value: 'MongoDB' },
                                                { label: 'Latency', value: '< 200ms' }
                                            ].map((item, i) => (
                                                <motion.div 
                                                    key={item.label}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: 0.5 + i * 0.1 }}
                                                    className="flex justify-between items-center"
                                                >
                                                    <div className="text-xs text-muted-foreground">{item.label}</div>
                                                    <div className="text-sm font-semibold text-foreground">{item.value}</div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </AnimatedCard>
                                </div>
                            </div>

                            {/* Live Fraud Simulator Section */}
                            <AnimatedCard className="p-8 relative overflow-hidden" delay={0.5}>
                                <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/5 via-accent-purple/5 to-accent-pink/5 opacity-50" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <motion.div
                                            animate={{ rotate: [0, 15, -15, 0] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        >
                                            <Sparkles className="w-6 h-6 text-accent-purple" />
                                        </motion.div>
                                        <h2 className="text-2xl font-bold gradient-text">Live Fraud Simulator</h2>
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 1, repeat: Infinity }}
                                        >
                                            <Zap className="w-5 h-5 text-accent-emerald" />
                                        </motion.div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                        <div className="lg:col-span-2 space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {/* Amount Slider */}
                                                <motion.div 
                                                    className="bg-background/50 p-6 rounded-xl border border-border"
                                                    whileHover={{ borderColor: 'rgba(139, 92, 246, 0.3)' }}
                                                >
                                                    <div className="flex items-center justify-between mb-3">
                                                        <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                            <Wallet className="w-4 h-4" />
                                                            Amount
                                                        </label>
                                                        <motion.span 
                                                            key={simulatorData.amount}
                                                            initial={{ scale: 1.2, color: '#8b5cf6' }}
                                                            animate={{ scale: 1, color: 'inherit' }}
                                                            className="text-lg font-bold text-primary"
                                                        >
                                                            ₹{simulatorData.amount.toLocaleString()}
                                                        </motion.span>
                                                    </div>
                                                    <input
                                                        type="range" min="100" max="10000000" step="10000"
                                                        value={simulatorData.amount}
                                                        onChange={(e) => setSimulatorData({ ...simulatorData, amount: parseInt(e.target.value) })}
                                                        className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
                                                    />
                                                </motion.div>
                                                
                                                {/* Location Select */}
                                                <motion.div 
                                                    className="bg-background/50 p-6 rounded-xl border border-border"
                                                    whileHover={{ borderColor: 'rgba(139, 92, 246, 0.3)' }}
                                                >
                                                    <label className="text-sm font-semibold text-foreground mb-3 block flex items-center gap-2">
                                                        <MapPin className="w-4 h-4" />
                                                        Location
                                                    </label>
                                                    <select
                                                        value={simulatorData.location}
                                                        onChange={(e) => setSimulatorData({ ...simulatorData, location: parseInt(e.target.value) })}
                                                        className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/30 outline-none transition-all"
                                                    >
                                                        <option value={0}>Home (0)</option>
                                                        <option value={1}>Work (1)</option>
                                                        <option value={2}>Market (2)</option>
                                                        <option value={3}>Other City (3)</option>
                                                        <option value={4}>Foreign (4)</option>
                                                    </select>
                                                </motion.div>
                                                
                                                {/* Hour Slider */}
                                                <motion.div 
                                                    className="bg-background/50 p-6 rounded-xl border border-border"
                                                    whileHover={{ borderColor: 'rgba(139, 92, 246, 0.3)' }}
                                                >
                                                    <div className="flex items-center justify-between mb-3">
                                                        <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                            <Timer className="w-4 h-4" />
                                                            Hour
                                                        </label>
                                                        <motion.span 
                                                            key={simulatorData.hour}
                                                            initial={{ scale: 1.2 }}
                                                            animate={{ scale: 1 }}
                                                            className="text-lg font-bold text-accent-purple"
                                                        >
                                                            {simulatorData.hour}:00
                                                        </motion.span>
                                                    </div>
                                                    <input
                                                        type="range" min="0" max="23"
                                                        value={simulatorData.hour}
                                                        onChange={(e) => setSimulatorData({ ...simulatorData, hour: parseInt(e.target.value) })}
                                                        className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-accent-purple"
                                                    />
                                                </motion.div>
                                            </div>
                                            
                                            <motion.button
                                                whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(139, 92, 246, 0.4)' }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={handleSimulate}
                                                disabled={isSimulating}
                                                className="w-full bg-gradient-to-r from-accent-blue via-accent-purple to-accent-pink text-white font-semibold py-4 rounded-lg relative overflow-hidden disabled:opacity-50"
                                            >
                                                <motion.div
                                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                                    animate={{ x: ['-100%', '100%'] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                />
                                                <span className="relative z-10 flex items-center justify-center gap-2">
                                                    {isSimulating ? (
                                                        <>
                                                            <RefreshCw className="w-5 h-5 animate-spin" />
                                                            Analyzing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Brain className="w-5 h-5" />
                                                            Simulate Fraud Detection
                                                        </>
                                                    )}
                                                </span>
                                            </motion.button>
                                        </div>
                                        
                                        {/* Risk Gauge */}
                                        <div className="flex flex-col items-center justify-center">
                                            <RiskGauge risk={riskScore} size={220} />
                                            
                                            <AnimatePresence>
                                                {showSimulatorResult && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 20 }}
                                                        className="mt-6 bg-background/50 p-4 rounded-xl border border-border w-full"
                                                    >
                                                        <div className="flex items-center gap-2 mb-2 font-bold text-sm">
                                                            <Brain className="w-4 h-4 text-primary" /> 
                                                            AI Analysis
                                                        </div>
                                                        <p className="text-xs text-muted-foreground leading-relaxed">{simulatorExplanation}</p>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                </div>
                            </AnimatedCard>
                        </motion.div>
                    )}

                    {activeTab === 'dashboard' && (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                        >
                            <div className="lg:col-span-2 space-y-8">
                                <AnimatedCard className="p-6" delay={0.1}>
                                    <div className="flex items-center gap-3 mb-6">
                                        <TrendingUp className="w-6 h-6 text-accent-emerald" />
                                        <h2 className="text-xl font-bold">Recent Activity</h2>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="text-left text-sm text-muted-foreground border-b border-border">
                                                    <th className="pb-4 font-medium">Time</th>
                                                    <th className="pb-4 font-medium">Amount</th>
                                                    <th className="pb-4 font-medium">Location</th>
                                                    <th className="pb-4 font-medium">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                <AnimatePresence>
                                                    {transactions.map((tx, i) => (
                                                        <motion.tr 
                                                            key={i} 
                                                            className="text-sm"
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            exit={{ opacity: 0, x: 20 }}
                                                            transition={{ delay: i * 0.05 }}
                                                            whileHover={{ backgroundColor: 'rgba(139, 92, 246, 0.05)' }}
                                                        >
                                                            <td className="py-4 text-muted-foreground">{new Date(tx.timestamp).toLocaleString()}</td>
                                                            <td className="py-4 font-bold">₹{tx.amount.toLocaleString()}</td>
                                                            <td className="py-4 text-muted-foreground">Loc-{tx.location}</td>
                                                            <td className="py-4">
                                                                <motion.span 
                                                                    className={`px-2 py-1 rounded-full text-xs font-bold ${tx.blocked ? 'bg-destructive/10 text-destructive' : 'bg-accent-emerald/10 text-accent-emerald'}`}
                                                                    whileHover={{ scale: 1.1 }}
                                                                >
                                                                    {tx.blocked ? 'Blocked' : 'Success'}
                                                                </motion.span>
                                                            </td>
                                                        </motion.tr>
                                                    ))}
                                                </AnimatePresence>
                                                {transactions.length === 0 && (
                                                    <tr>
                                                        <td colSpan={4} className="py-8 text-center text-muted-foreground">No transactions found</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </AnimatedCard>
                            </div>

                            <div className="space-y-6">
                                <AnimatedCard className="p-6 relative overflow-hidden" delay={0.2}>
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <Sparkles className="w-20 h-20 text-primary" />
                                    </div>
                                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                        <Brain className="w-5 h-5 text-primary" />
                                        AI Security Tip
                                    </h3>
                                    <motion.p 
                                        className="text-sm text-muted-foreground leading-relaxed italic"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        "{securityTip || "Always verify the recipient's name before completing any UPI transaction."}"
                                    </motion.p>
                                </AnimatedCard>

                                <AnimatedCard className="p-6" delay={0.3}>
                                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-primary">
                                        <Activity className="w-5 h-5" />
                                        Personal Profile
                                    </h3>
                                    <div className="space-y-4">
                                        <motion.div 
                                            className="flex items-center gap-3"
                                            whileHover={{ x: 4 }}
                                        >
                                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary uppercase">
                                                {user?.username?.[0]}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-foreground">@{user?.username}</div>
                                                <div className="text-xs text-muted-foreground">User ID: {user?._id?.substring(0, 8)}...</div>
                                            </div>
                                        </motion.div>
                                        <div className="pt-4 border-t border-border space-y-2">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-muted-foreground">Status</span>
                                                <span className="text-accent-emerald font-bold">Verified</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-muted-foreground">Daily Limit</span>
                                                <span className="text-foreground font-bold">₹50,000</span>
                                            </div>
                                        </div>
                                    </div>
                                </AnimatedCard>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'transactions' && (
                        <motion.div
                            key="transactions"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.4 }}
                            className="max-w-2xl mx-auto"
                        >
                            <AnimatedCard className="p-8 shadow-xl" delay={0.1}>
                                <div className="flex items-center gap-3 mb-8">
                                    <motion.div 
                                        className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"
                                        whileHover={{ rotate: 15, scale: 1.1 }}
                                    >
                                        <Send className="w-6 h-6 text-primary" />
                                    </motion.div>
                                    <div>
                                        <h2 className="text-2xl font-bold">New UPI Payment</h2>
                                        <p className="text-sm text-muted-foreground">Secure real-time transaction</p>
                                    </div>
                                </div>

                                {!txResult ? (
                                    <form onSubmit={handleTransaction} className="space-y-6">
                                        <div className="space-y-4">
                                            <motion.div
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.2 }}
                                            >
                                                <label className="text-sm font-semibold mb-2 block">Amount (₹)</label>
                                                <input
                                                    type="number" required min="1" max="10000000"
                                                    value={txAmount}
                                                    onChange={(e) => setTxAmount(e.target.value)}
                                                    className="w-full bg-input border border-border rounded-xl px-4 py-4 text-xl font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                                                    placeholder="0.00"
                                                />
                                            </motion.div>
                                            <motion.div
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.3 }}
                                            >
                                                <label className="text-sm font-semibold mb-2 block">Current Location</label>
                                                <select
                                                    value={txLocation}
                                                    onChange={(e) => setTxLocation(e.target.value)}
                                                    className="w-full bg-input border border-border rounded-xl px-4 py-4 focus:ring-2 focus:ring-primary outline-none transition-all"
                                                >
                                                    <option value="0">Home (Usual)</option>
                                                    <option value="1">Office</option>
                                                    <option value="2">Market / Mall</option>
                                                    <option value="3">Other City</option>
                                                    <option value="4">Unknown / Foreign</option>
                                                </select>
                                            </motion.div>
                                        </div>

                                        <AnimatePresence>
                                            {txError && (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-sm font-medium"
                                                >
                                                    {txError}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <motion.button
                                            type="submit" 
                                            disabled={txLoading}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                                        >
                                            {txLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                                            {txLoading ? 'Securing Transaction...' : 'Pay Now'}
                                        </motion.button>
                                    </form>
                                ) : (
                                    <AnimatePresence mode="wait">
                                        <motion.div 
                                            className="space-y-6 text-center"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                        >
                                            {txResult.status === 'success' ? (
                                                <motion.div 
                                                    className="p-8 bg-accent-emerald/10 border border-accent-emerald/20 rounded-2xl space-y-4"
                                                    initial={{ scale: 0.9 }}
                                                    animate={{ scale: 1 }}
                                                >
                                                    <motion.div 
                                                        className="w-16 h-16 bg-accent-emerald/20 text-accent-emerald rounded-full flex items-center justify-center mx-auto"
                                                        animate={{ scale: [1, 1.2, 1] }}
                                                        transition={{ duration: 0.5 }}
                                                    >
                                                        <CheckCircle className="w-10 h-10" />
                                                    </motion.div>
                                                    <h3 className="text-2xl font-bold text-accent-emerald">Payment Successful</h3>
                                                    <p className="text-muted-foreground">{txResult.message}</p>
                                                    <div className="text-3xl font-black">₹{txResult.amount?.toLocaleString()}</div>
                                                    <div className="pt-4 border-t border-accent-emerald/10 flex justify-between items-center text-sm">
                                                        <span className="text-muted-foreground">New Balance</span>
                                                        <span className="font-bold">₹{txResult.balance?.toLocaleString()}</span>
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                <motion.div 
                                                    className="p-8 bg-destructive/10 border border-destructive/20 rounded-2xl space-y-6"
                                                    initial={{ scale: 0.9 }}
                                                    animate={{ scale: 1 }}
                                                >
                                                    <motion.div 
                                                        className="w-16 h-16 bg-destructive/20 text-destructive rounded-full flex items-center justify-center mx-auto"
                                                        animate={{ shake: [0, -10, 10, -10, 0] }}
                                                        transition={{ duration: 0.5 }}
                                                    >
                                                        <AlertTriangle className="w-10 h-10" />
                                                    </motion.div>
                                                    <div>
                                                        <h3 className="text-2xl font-bold text-destructive">Payment Blocked</h3>
                                                        <p className="text-sm text-muted-foreground mt-1">Our AI detected high fraud risk</p>
                                                    </div>
                                                    <div className="bg-background/80 p-4 rounded-xl text-sm italic text-left border border-destructive/10">
                                                        "{txResult.explanation}"
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div className="flex flex-wrap gap-2 justify-center">
                                                            {txResult.risk_factors?.map((rf, i) => (
                                                                <motion.span 
                                                                    key={i} 
                                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                                    animate={{ opacity: 1, scale: 1 }}
                                                                    transition={{ delay: i * 0.1 }}
                                                                    className={`px-2 py-1 rounded-full text-xs font-bold ${rf.severity === 'high' ? 'bg-destructive/20 text-destructive' : 'bg-accent-purple/20 text-accent-purple'}`}
                                                                >
                                                                    {rf.factor}
                                                                </motion.span>
                                                            ))}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">Fraud Probability: {(txResult.fraud_probability * 100).toFixed(1)}%</div>
                                                    </div>
                                                </motion.div>
                                            )}
                                            <motion.button
                                                onClick={() => setTxResult(null)}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                className="w-full bg-background border border-border py-4 rounded-xl font-bold hover:bg-muted transition-colors"
                                            >
                                                Make Another Payment
                                            </motion.button>
                                        </motion.div>
                                    </AnimatePresence>
                                )}
                            </AnimatedCard>
                        </motion.div>
                    )}

                    {activeTab === 'analytics' && (
                        <motion.div
                            key="analytics"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                            className="space-y-8"
                        >
                            <AnimatedCard className="p-8" delay={0.1}>
                                <div className="flex items-center gap-4 mb-8">
                                    <motion.div 
                                        className="w-12 h-12 rounded-xl bg-accent-purple/10 flex items-center justify-center"
                                        whileHover={{ rotate: 360 }}
                                        transition={{ duration: 0.6 }}
                                    >
                                        <Sparkles className="w-6 h-6 text-accent-purple" />
                                    </motion.div>
                                    <div>
                                        <h2 className="text-2xl font-bold">AI Spending Insights</h2>
                                        <p className="text-sm text-muted-foreground">Gemini-powered pattern analysis</p>
                                    </div>
                                </div>

                                <motion.div 
                                    className="bg-background/50 border border-border rounded-xl p-8"
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <div className="flex gap-4 mb-6">
                                        <motion.div 
                                            className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0"
                                            animate={{ scale: [1, 1.1, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        >
                                            <Brain className="w-6 h-6 text-primary" />
                                        </motion.div>
                                        <div className="space-y-4">
                                            <p className="text-lg text-foreground leading-relaxed">
                                                {aiInsight || "Analyzing your recent transaction patterns to provide personalized security insights..."}
                                            </p>
                                            <div className="flex flex-wrap gap-3">
                                                {['Normal Patterns', 'Safe Locations', 'Optimal Timing'].map((tag, i) => (
                                                    <motion.span 
                                                        key={tag}
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: 0.3 + i * 0.1 }}
                                                        whileHover={{ scale: 1.05 }}
                                                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                            i === 0 ? 'bg-accent-emerald/10 text-accent-emerald' :
                                                            i === 1 ? 'bg-accent-blue/10 text-accent-blue' :
                                                            'bg-accent-purple/10 text-accent-purple'
                                                        }`}
                                                    >
                                                        {tag}
                                                    </motion.span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                                    <AnimatedCard className="p-6" delay={0.3}>
                                        <h4 className="font-bold mb-4 flex items-center gap-2">
                                            <Target className="w-4 h-4 text-accent-blue" />
                                            Risk Dimension
                                        </h4>
                                        <div className="space-y-4">
                                            {[
                                                { label: 'Location Anomaly', value: 15, color: 'bg-accent-emerald' },
                                                { label: 'Amount Volatility', value: 45, color: 'bg-accent-purple' },
                                                { label: 'Time Pattern', value: 25, color: 'bg-accent-blue' }
                                            ].map((item, i) => (
                                                <motion.div 
                                                    key={item.label}
                                                    className="space-y-1"
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.4 + i * 0.1 }}
                                                >
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span>{item.label}</span>
                                                        <span>{item.value < 30 ? 'Low' : item.value < 60 ? 'Medium' : 'High'} Risk</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                        <motion.div 
                                                            className={`h-full ${item.color}`}
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${item.value}%` }}
                                                            transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
                                                        />
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </AnimatedCard>
                                    
                                    <AnimatedCard className="p-6" delay={0.4}>
                                        <h4 className="font-bold mb-4 flex items-center gap-2">
                                            <Shield className="w-4 h-4 text-accent-emerald" />
                                            Safety Score
                                        </h4>
                                        <div className="text-center py-4">
                                            <motion.div 
                                                className="text-4xl font-black text-accent-emerald mb-2"
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: 0.5, type: "spring" }}
                                            >
                                                94/100
                                            </motion.div>
                                            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Strong Protection</p>
                                        </div>
                                    </AnimatedCard>
                                </div>
                            </AnimatedCard>
                        </motion.div>
                    )}

                    {activeTab === 'admin' && isAdmin && (
                        <motion.div
                            key="admin"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.4 }}
                            className="space-y-8"
                        >
                            {/* Admin Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {[
                                    { label: 'Users', key: 'total_users', color: 'text-foreground' },
                                    { label: 'Tx Count', key: 'total_tx', color: 'text-foreground' },
                                    { label: 'Blocked', key: 'total_blocked', color: 'text-destructive' },
                                    { label: 'Rate', key: 'block_rate', suffix: '%', color: 'text-foreground' },
                                    { label: 'Pending', key: 'unreviewed_count', color: 'text-accent-purple' }
                                ].map((stat, i) => (
                                    <AnimatedCard key={stat.label} className="p-4" delay={i * 0.05}>
                                        <p className="text-xs text-muted-foreground uppercase font-bold">{stat.label}</p>
                                        <motion.p 
                                            className={`text-2xl font-black mt-1 ${stat.color}`}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 + i * 0.05 }}
                                        >
                                            {adminStats?.[stat.key] || 0}{stat.suffix || ''}
                                        </motion.p>
                                    </AnimatedCard>
                                ))}
                            </div>

                            {/* AI Admin Summary */}
                            <AnimatedCard className="p-6 relative overflow-hidden" delay={0.3}>
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <ShieldCheck className="w-16 h-16 text-accent-purple" />
                                </div>
                                <div className="flex items-center gap-3 mb-3">
                                    <motion.div
                                        animate={{ rotate: [0, 10, -10, 0] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        <Brain className="w-5 h-5 text-accent-purple" />
                                    </motion.div>
                                    <h3 className="font-bold text-accent-purple">AI Fraud Briefing</h3>
                                </div>
                                <p className="text-sm text-foreground leading-relaxed max-w-4xl">
                                    {adminData?.ai_summary || "Analyzing recent flagged activities..."}
                                </p>
                            </AnimatedCard>

                            {/* Flagged Transactions Table */}
                            <AnimatedCard className="overflow-hidden shadow-lg" delay={0.4}>
                                <div className="p-6 border-b border-border flex justify-between items-center">
                                    <h3 className="font-bold text-lg">Flagged Transactions</h3>
                                    <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground font-bold uppercase">
                                        Review Required
                                    </span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-muted/50 text-xs font-bold uppercase text-muted-foreground">
                                            <tr>
                                                <th className="px-6 py-4">User</th>
                                                <th className="px-6 py-4">Amount</th>
                                                <th className="px-6 py-4">Fraud Prob</th>
                                                <th className="px-6 py-4">Explanation</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4 text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            <AnimatePresence>
                                                {adminData?.flagged_transactions.map((tx: { _id: string; username: string; amount: number; fraud_probability: number; explanation: string; reviewed: boolean }, i: number) => (
                                                    <motion.tr 
                                                        key={tx._id} 
                                                        className={`text-sm hover:bg-muted/30 transition-colors ${tx.reviewed ? 'opacity-60' : ''}`}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -10 }}
                                                        transition={{ delay: i * 0.05 }}
                                                    >
                                                        <td className="px-6 py-4 font-bold">@{tx.username}</td>
                                                        <td className="px-6 py-4 text-destructive font-bold">₹{tx.amount}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`font-black ${(tx.fraud_probability || 0) > 0.8 ? 'text-destructive' : 'text-accent-purple'}`}>
                                                                {((tx.fraud_probability || 0) * 100).toFixed(1)}%
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-xs text-muted-foreground max-w-xs truncate">{tx.explanation}</td>
                                                        <td className="px-6 py-4">
                                                            {tx.reviewed ? (
                                                                <span className="text-accent-emerald flex items-center gap-1 font-bold text-xs"><CheckCircle className="w-3 h-3" /> Reviewed</span>
                                                            ) : (
                                                                <span className="text-accent-purple font-bold text-xs">Pending</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            {!tx.reviewed && (
                                                                <motion.button
                                                                    onClick={() => handleReview(tx._id)}
                                                                    whileHover={{ scale: 1.05 }}
                                                                    whileTap={{ scale: 0.95 }}
                                                                    className="bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded-lg font-bold hover:opacity-90 transition-opacity"
                                                                >
                                                                    Review
                                                                </motion.button>
                                                            )}
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </AnimatePresence>
                                        </tbody>
                                    </table>
                                </div>
                            </AnimatedCard>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Chat Assistant Widget */}
            <AnimatePresence>
                {chatOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
                    >
                        {/* Chat Header */}
                        <div className="bg-gradient-to-r from-accent-blue via-accent-purple to-accent-pink p-4 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <motion.div 
                                    className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    <Brain className="w-6 h-6 text-white" />
                                </motion.div>
                                <div>
                                    <div className="font-bold text-white">NexusGuard AI</div>
                                    <div className="text-xs text-white/80">{chatLoading ? 'Thinking...' : 'Always here to help'}</div>
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setChatOpen(false)}
                                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </motion.button>
                        </div>

                        {/* Chat Messages */}
                        <div className="h-80 overflow-y-auto p-4 space-y-3 bg-background/50 scroll-smooth">
                            <AnimatePresence>
                                {chatMessages.map((msg, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: msg.type === 'bot' ? -20 : 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0 }}
                                        className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[85%] p-3 rounded-2xl ${
                                            msg.type === 'user'
                                                ? 'bg-primary text-primary-foreground rounded-tr-none'
                                                : 'bg-card border border-border text-foreground rounded-tl-none'
                                        }`}>
                                            <p className="text-sm leading-relaxed">{msg.text}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {chatLoading && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex justify-start"
                                >
                                    <div className="bg-card border border-border p-3 rounded-2xl rounded-tl-none flex gap-1">
                                        <motion.span 
                                            className="w-1.5 h-1.5 bg-primary rounded-full"
                                            animate={{ y: [0, -5, 0] }}
                                            transition={{ duration: 0.5, repeat: Infinity, delay: 0 }}
                                        />
                                        <motion.span 
                                            className="w-1.5 h-1.5 bg-primary rounded-full"
                                            animate={{ y: [0, -5, 0] }}
                                            transition={{ duration: 0.5, repeat: Infinity, delay: 0.15 }}
                                        />
                                        <motion.span 
                                            className="w-1.5 h-1.5 bg-primary rounded-full"
                                            animate={{ y: [0, -5, 0] }}
                                            transition={{ duration: 0.5, repeat: Infinity, delay: 0.3 }}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Chat Input Area */}
                        <div className="p-4 border-t border-border bg-card">
                            {/* Quick Options */}
                            <div className="flex gap-2 overflow-x-auto pb-3 mb-3 no-scrollbar">
                                {Object.keys(predefinedResponses).slice(0, 3).map((option) => (
                                    <motion.button
                                        key={option}
                                        onClick={() => handleChatOption(option)}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="whitespace-nowrap px-3 py-1.5 bg-muted/50 hover:bg-primary/10 border border-border rounded-full text-xs font-medium transition-colors"
                                    >
                                        {option.split('?')[0]}?
                                    </motion.button>
                                ))}
                            </div>

                            <form onSubmit={handleSendMessage} className="relative">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Ask anything about UPI security..."
                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                                />
                                <motion.button
                                    type="submit"
                                    disabled={!chatInput.trim() || chatLoading}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary hover:bg-primary/10 rounded-lg disabled:opacity-30 transition-colors"
                                >
                                    <Send className="w-5 h-5" />
                                </motion.button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setChatOpen(!chatOpen)}
                className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-accent-blue via-accent-purple to-accent-pink rounded-full shadow-2xl flex items-center justify-center z-50"
                animate={{
                    boxShadow: [
                        '0 0 20px rgba(66, 133, 244, 0.3)',
                        '0 0 40px rgba(170, 0, 255, 0.5)',
                        '0 0 20px rgba(66, 133, 244, 0.3)',
                    ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                <AnimatePresence mode="wait">
                    {chatOpen ? (
                        <motion.div
                            key="close"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <X className="w-7 h-7 text-white" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="open"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <MessageCircle className="w-7 h-7 text-white" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>
        </div>
    )
}