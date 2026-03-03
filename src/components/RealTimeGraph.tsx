'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from 'recharts'
import { TrendingUp, TrendingDown, Activity, Zap, RefreshCw } from 'lucide-react'
import { api } from '../lib/api'

interface DataPoint {
  time: string
  value: number
  risk: number
  predicted: number
  timestamp: number
  isActual: boolean
}

interface RealTimeGraphProps {
  currentAmount?: number
  currentLocation?: number
  currentHour?: number
  riskScore?: number
  isSimulating?: boolean
  className?: string
}

// Custom cursor component
const CustomCursor = ({ x, y, payload }: { x: number; y: number; payload?: Array<{ payload: DataPoint }> }) => {
  if (!payload || !payload.length) return null
  
  const data = payload[0].payload
  
  return (
    <g>
      <line x1={x} y1={0} x2={x} y2={400} stroke="rgba(139, 92, 246, 0.3)" strokeDasharray="4 4" />
      <circle cx={x} cy={y} r={6} fill="#8b5cf6" stroke="#fff" strokeWidth={2} />
      <foreignObject x={x + 10} y={y - 60} width={180} height={120}>
        <div className="bg-card/95 backdrop-blur-xl border border-border rounded-xl p-3 shadow-2xl">
          <div className="text-xs text-muted-foreground mb-1">{data.time}</div>
          <div className="text-sm font-bold text-foreground">₹{data.value.toLocaleString()}</div>
          <div className={`text-xs font-semibold ${data.risk > 70 ? 'text-destructive' : data.risk > 40 ? 'text-accent-purple' : 'text-accent-emerald'}`}>
            Risk: {data.risk}%
          </div>
          {data.isActual && (
            <div className="text-xs text-accent-blue mt-1">Actual Transaction</div>
          )}
        </div>
      </foreignObject>
    </g>
  )
}

// Simple animated number component
const AnimatedNumber = ({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) => {
  const [displayValue, setDisplayValue] = useState(0)
  
  useEffect(() => {
    const startTime = Date.now()
    const duration = 500
    const startValue = displayValue
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeProgress = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      const current = startValue + (value - startValue) * easeProgress
      
      setDisplayValue(current)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    requestAnimationFrame(animate)
  }, [value])
  
  return <span>{prefix}{Math.round(displayValue).toLocaleString()}{suffix}</span>
}

export default function RealTimeGraph({ 
  currentAmount = 5000, 
  currentLocation = 2, 
  currentHour = 14,
  riskScore = 0,
  isSimulating = false,
  className = ''
}: RealTimeGraphProps) {
  const [data, setData] = useState<DataPoint[]>([])
  const [transactions, setTransactions] = useState<Array<{ amount: number; timestamp: string; fraud_probability?: number }>>([])
  const [loading, setLoading] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<NodeJS.Timeout>()
  
  // Mouse tracking for interactive effects
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      mouseX.set(e.clientX - rect.left)
      mouseY.set(e.clientY - rect.top)
    }
  }, [mouseX, mouseY])
  
  // Fetch real transaction data
  const fetchTransactionData = useCallback(async () => {
    try {
      const response = await api.transactions.history(20)
      if (response.transactions && Array.isArray(response.transactions)) {
        setTransactions(response.transactions)
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    } finally {
      setLoading(false)
    }
  }, [])
  
  // Initialize data
  useEffect(() => {
    fetchTransactionData()
    // Refresh data every 5 seconds
    intervalRef.current = setInterval(fetchTransactionData, 5000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchTransactionData])
  
  // Process transaction data into graph data
  useEffect(() => {
    if (transactions.length === 0) {
      // Generate initial data based on current amount if no transactions
      const initialData: DataPoint[] = []
      const now = Date.now()
      for (let i = 0; i < 20; i++) {
        const timestamp = now - (19 - i) * 3000
        initialData.push({
          time: new Date(timestamp).toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
          }),
          value: currentAmount,
          risk: riskScore,
          predicted: currentAmount * (1 + (riskScore / 100) * 0.3),
          timestamp,
          isActual: false
        })
      }
      setData(initialData)
      return
    }
    
    // Process actual transaction data
    const processedData: DataPoint[] = transactions
      .slice(-20)
      .map((tx, index) => {
        const timestamp = new Date(tx.timestamp).getTime()
        const fraudProb = Math.round((tx.fraud_probability || 0) * 100)
        return {
          time: new Date(timestamp).toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
          }),
          value: tx.amount,
          risk: fraudProb,
          predicted: tx.amount * (1 + (fraudProb / 100) * 0.3),
          timestamp,
          isActual: true
        }
      })
    
    // If simulating, add current input as the latest point
    if (isSimulating) {
      const now = Date.now()
      processedData.push({
        time: new Date(now).toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit'
        }),
        value: currentAmount,
        risk: riskScore,
        predicted: currentAmount * (1 + (riskScore / 100) * 0.3),
        timestamp: now,
        isActual: false
      })
    }
    
    setData(processedData)
  }, [transactions, currentAmount, riskScore, isSimulating])
  
  // Calculate stats from actual data
  const stats = useMemo(() => {
    if (data.length === 0) return { avg: currentAmount, max: currentAmount, min: currentAmount, trend: 0 }
    
    const values = data.map(d => d.value)
    const avg = values.reduce((a, b) => a + b, 0) / values.length
    const max = Math.max(...values)
    const min = Math.min(...values)
    const trend = values[values.length - 1] - values[0]
    
    return { avg, max, min, trend }
  }, [data, currentAmount])
  
  const currentRisk = data[data.length - 1]?.risk || riskScore
  const riskColor = currentRisk > 70 ? '#ef4444' : currentRisk > 40 ? '#a855f7' : '#10b981'
  
  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`bg-card border border-border rounded-2xl overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
    >
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ 
                rotate: loading ? 0 : 360,
                scale: isSimulating ? [1, 1.1, 1] : 1
              }}
              transition={{ 
                rotate: { duration: 4, repeat: Infinity, ease: "linear" },
                scale: { duration: 0.5, repeat: Infinity }
              }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-blue/20 to-accent-purple/20 flex items-center justify-center"
            >
              {loading ? <RefreshCw className="w-5 h-5 text-accent-purple animate-spin" /> : <Activity className="w-5 h-5 text-accent-purple" />}
            </motion.div>
            <div>
              <h3 className="font-bold text-lg text-foreground">Live Transaction Monitor</h3>
              <p className="text-xs text-muted-foreground">
                {transactions.length > 0 ? `Showing ${transactions.length} real transactions` : 'Real-time fraud pattern analysis'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Live indicator */}
            <motion.div 
              className="flex items-center gap-2 px-3 py-1.5 bg-accent-emerald/10 rounded-full"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.div
                className="w-2 h-2 rounded-full bg-accent-emerald"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="text-xs font-semibold text-accent-emerald">LIVE</span>
            </motion.div>
            
            {/* Risk badge */}
            <motion.div
              key={currentRisk}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                currentRisk > 70 ? 'bg-destructive/20 text-destructive' :
                currentRisk > 40 ? 'bg-accent-purple/20 text-accent-purple' :
                'bg-accent-emerald/20 text-accent-emerald'
              }`}
            >
              Risk: {currentRisk}%
            </motion.div>
          </div>
        </div>
        
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <motion.div 
            className="bg-background/50 rounded-xl p-3 border border-border"
            whileHover={{ scale: 1.02, borderColor: 'rgba(139, 92, 246, 0.3)' }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <div className="text-xs text-muted-foreground mb-1">Average</div>
            <div className="text-lg font-bold text-foreground">
              <AnimatedNumber value={stats.avg} prefix="₹" />
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-background/50 rounded-xl p-3 border border-border"
            whileHover={{ scale: 1.02, borderColor: 'rgba(139, 92, 246, 0.3)' }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <div className="text-xs text-muted-foreground mb-1">Peak</div>
            <div className="text-lg font-bold text-accent-blue">
              <AnimatedNumber value={stats.max} prefix="₹" />
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-background/50 rounded-xl p-3 border border-border"
            whileHover={{ scale: 1.02, borderColor: 'rgba(139, 92, 246, 0.3)' }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <div className="text-xs text-muted-foreground mb-1">Low</div>
            <div className="text-lg font-bold text-muted-foreground">
              <AnimatedNumber value={stats.min} prefix="₹" />
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-background/50 rounded-xl p-3 border border-border"
            whileHover={{ scale: 1.02, borderColor: 'rgba(139, 92, 246, 0.3)' }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <div className="text-xs text-muted-foreground mb-1">Trend</div>
            <div className={`text-lg font-bold flex items-center gap-1 ${stats.trend >= 0 ? 'text-accent-emerald' : 'text-destructive'}`}>
              {stats.trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <AnimatedNumber value={Math.abs(stats.trend)} prefix="₹" />
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Chart */}
      <div className="relative h-[350px] p-4">
        {/* Background grid animation */}
        <motion.div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
          animate={{
            backgroundPosition: ['0px 0px', '40px 40px']
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={riskColor} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={riskColor} stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            <XAxis 
              dataKey="time" 
              stroke="rgba(148, 163, 184, 0.2)"
              tick={{ fill: 'rgba(148, 163, 184, 0.6)', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={30}
            />
            
            <YAxis 
              stroke="rgba(148, 163, 184, 0.2)"
              tick={{ fill: 'rgba(148, 163, 184, 0.6)', fontSize: 10 }}
              tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
              tickLine={false}
              axisLine={false}
              width={50}
            />
            
            <Tooltip 
              content={<CustomCursor />}
              cursor={{ stroke: 'rgba(139, 92, 246, 0.3)', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            
            <ReferenceLine y={currentAmount} stroke="rgba(148, 163, 184, 0.3)" strokeDasharray="3 3" label={{ value: 'Current', fill: 'rgba(148, 163, 184, 0.6)', fontSize: 10 }} />
            
            <Area
              type="monotone"
              dataKey="value"
              stroke={riskColor}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorValue)"
              animationDuration={300}
              animationEasing="ease-out"
            />
            
            <Area
              type="monotone"
              dataKey="predicted"
              stroke="#3b82f6"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              fillOpacity={1}
              fill="url(#colorPredicted)"
              animationDuration={300}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
        
        {/* Hover effect overlay */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: useTransform(
              [mouseX, mouseY],
              ([x, y]) => `radial-gradient(600px circle at ${x}px ${y}px, rgba(139, 92, 246, 0.06), transparent 40%)`
            )
          }}
        />
      </div>
      
      {/* Footer */}
      <div className="px-6 py-4 border-t border-border bg-background/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: riskColor }} />
              Actual Transactions
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-accent-blue" />
              Predicted Risk
            </span>
          </div>
          
          <motion.div
            className="flex items-center gap-2 text-xs"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Zap className="w-3 h-3 text-accent-purple" />
            <span className="text-muted-foreground">
              {isSimulating ? 'Simulating with current input' : 'Live transaction data'}
            </span>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
