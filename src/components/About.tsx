'use client'

import { motion } from 'framer-motion'

export function About() {
    const steps = [
        {
            number: "01",
            title: "Data Ingestion",
            description: "Transaction data flows in — amount, location, time, and user behavior patterns are captured in real time.",
            color: "var(--accent-blue)"
        },
        {
            number: "02",
            title: "Sequence Building",
            description: "Last 10 transactions are assembled into a feature sequence with one-hot encoded locations and scaled values.",
            color: "var(--accent-purple)"
        },
        {
            number: "03",
            title: "CNN Analysis",
            description: "1D Convolutional Neural Network processes the sequence through Conv1D → MaxPool → Dense layers for pattern detection.",
            color: "var(--accent-pink)"
        },
        {
            number: "04",
            title: "Fraud Scoring",
            description: "Model outputs a probability score. Transactions exceeding the 0.7 threshold are flagged as potentially fraudulent.",
            color: "var(--accent-emerald)"
        },
        {
            number: "05",
            title: "Gemini Explanation",
            description: "Google Gemini AI generates a human-readable explanation of why the transaction was blocked, under 100 words.",
            color: "var(--accent-blue)"
        }
    ]

    return (
        <section id="how-it-works" className="relative py-32 bg-card/30">
            <div className="container mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
                <div className="text-center mb-20">
                    <div className="inline-flex items-center gap-3 mb-6">
                        <div className="w-3 h-3 bg-accent-blue rounded-full animate-pulse" />
                        <span className="text-sm font-semibold text-muted-foreground">Detection Pipeline</span>
                        <div className="w-3 h-3 bg-accent-purple rounded-full animate-pulse" />
                    </div>

                    <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6 text-foreground">
                        How It Works
                    </h2>

                    <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                        From raw transaction to fraud verdict in under 200 milliseconds
                    </p>
                </div>

                {/* Pipeline Steps */}
                <div className="max-w-4xl mx-auto">
                    {steps.map((step, index) => (
                        <motion.div
                            key={step.number}
                            initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.15 }}
                            className="relative flex items-start gap-6 mb-12 last:mb-0"
                        >
                            {/* Step number */}
                            <div className="flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl text-foreground border border-border"
                                 style={{ background: `linear-gradient(135deg, ${step.color}15, transparent)` }}>
                                {step.number}
                            </div>

                            {/* Content */}
                            <div className="flex-1 pb-12 border-b border-border last:border-0">
                                <h3 className="text-2xl font-bold text-foreground mb-2">{step.title}</h3>
                                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                            </div>

                            {/* Connecting line */}
                            {index < steps.length - 1 && (
                                <div className="absolute left-8 top-16 w-px h-12" style={{ background: `linear-gradient(to bottom, ${step.color}40, transparent)` }} />
                            )}
                        </motion.div>
                    ))}
                </div>

                {/* Architecture diagram hint */}
                <div className="mt-20 max-w-4xl mx-auto">
                    <div className="bg-card rounded-2xl border border-border p-8 text-center">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {[
                                { label: "Flask Backend", detail: "REST API" },
                                { label: "MongoDB", detail: "NoSQL Storage" },
                                { label: "TensorFlow CNN", detail: "ML Engine" },
                                { label: "Gemini AI", detail: "Explainability" },
                            ].map(item => (
                                <div key={item.label} className="p-4 rounded-xl border border-border bg-background">
                                    <div className="text-sm font-bold text-primary mb-1">{item.label}</div>
                                    <div className="text-xs text-muted-foreground">{item.detail}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
