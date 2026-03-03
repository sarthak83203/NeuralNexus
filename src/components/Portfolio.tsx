'use client'

import { Shield, Brain, Database, Zap, Eye, Lock } from 'lucide-react'

export function Portfolio() {
    const features = [
        {
            icon: Shield,
            title: "Real-Time Fraud Detection",
            description: "1D CNN analyzes transaction sequences in milliseconds, catching fraudulent patterns before they complete.",
            stat: ">99.2%",
            statLabel: "Accuracy"
        },
        {
            icon: Brain,
            title: "Gemini AI Explanations",
            description: "Google Gemini generates human-readable explanations for every blocked transaction — no black box decisions.",
            stat: "<100",
            statLabel: "Word Explanations"
        },
        {
            icon: Database,
            title: "MongoDB Integration",
            description: "Scalable NoSQL storage for transaction history, user profiles, and audit trails with lightning-fast queries.",
            stat: "100K+",
            statLabel: "Transactions/sec"
        },
        {
            icon: Zap,
            title: "Instant Alerts",
            description: "Sub-second notification system alerts users and admins when suspicious activity is detected.",
            stat: "<200ms",
            statLabel: "Response Time"
        },
        {
            icon: Eye,
            title: "Admin Dashboard",
            description: "Comprehensive admin panel showing all blocked transactions with AI-generated fraud analysis reports.",
            stat: "24/7",
            statLabel: "Monitoring"
        },
        {
            icon: Lock,
            title: "Secure Architecture",
            description: "End-to-end encrypted pipeline with Flask backend, environment-based secrets, and role-based access control.",
            stat: "256-bit",
            statLabel: "Encryption"
        }
    ]

    return (
        <section id="features" className="relative py-32 bg-background">
            <div className="container mx-auto px-6 sm:px-8 lg:px-12">
                <div className="text-center mb-20">
                    <div className="inline-flex items-center gap-3 mb-6">
                        <div className="w-3 h-3 bg-accent-blue rounded-full animate-pulse" />
                        <span className="text-sm font-semibold text-muted-foreground">Core Capabilities</span>
                        <div className="w-3 h-3 bg-accent-purple rounded-full animate-pulse" />
                    </div>

                    <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-8">
                        <span className="block gradient-text">Intelligent Protection</span>
                    </h2>

                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                        Six layers of AI-powered security working together to safeguard every UPI transaction.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {features.map((feature, index) => (
                        <div
                            key={feature.title}
                            className="group relative bg-card rounded-2xl p-8 border border-border hover:border-primary/30 gentle-animation hover:cyber-glow"
                        >
                            {/* Icon */}
                            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 gentle-animation">
                                <feature.icon className="w-7 h-7 text-primary" />
                            </div>

                            {/* Stat badge */}
                            <div className="absolute top-6 right-6">
                                <div className="text-right">
                                    <div className="text-2xl font-black text-primary">{feature.stat}</div>
                                    <div className="text-xs text-muted-foreground">{feature.statLabel}</div>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                            <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
