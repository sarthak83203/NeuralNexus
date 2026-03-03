'use client'

import { motion } from 'framer-motion'

export function Services() {
    const techStack = [
        {
            category: "Machine Learning",
            items: [
                { name: "1D CNN Architecture", detail: "Conv1D(64) → MaxPool → Conv1D(128) → GlobalAvgPool → Dense(64) → Sigmoid" },
                { name: "StandardScaler", detail: "Normalizes amount, hour, and time_gap features for consistent model input" },
                { name: "Sequence Processing", detail: "10-transaction sliding window with 8 features per step (3 continuous + 5 one-hot)" },
            ]
        },
        {
            category: "Backend & API",
            items: [
                { name: "Flask REST API", detail: "User auth, transaction processing, admin panel with role-based access" },
                { name: "MongoDB", detail: "Users and transactions collections with flexible document schemas" },
                { name: "Google Gemini", detail: "Generates ≤100 word fraud explanations with user context and transaction history" },
            ]
        },
        {
            category: "Data Pipeline",
            items: [
                { name: "Synthetic Dataset", detail: "1000 users × 100 txns each — 90% normal, 10% fraud with realistic distributions" },
                { name: "Feature Engineering", detail: "Amount deviation, location anomaly, time gap analysis, hour pattern matching" },
                { name: "Real-time Scoring", detail: "Last 9 transactions + current form a sequence fed to the CNN for instant prediction" },
            ]
        }
    ]

    return (
        <section id="technology" className="relative py-32 bg-card/30">
            <div className="container mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
                <div className="text-center mb-20">
                    <div className="inline-flex items-center gap-3 mb-6">
                        <div className="w-3 h-3 bg-accent-purple rounded-full animate-pulse" />
                        <span className="text-sm font-semibold text-muted-foreground">Under The Hood</span>
                        <div className="w-3 h-3 bg-accent-blue rounded-full animate-pulse" />
                    </div>

                    <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6 text-foreground">
                        Technology Stack
                    </h2>

                    <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                        Built with battle-tested frameworks and cutting-edge AI models
                    </p>
                </div>

                <div className="max-w-6xl mx-auto space-y-12">
                    {techStack.map((section, sIdx) => (
                        <motion.div
                            key={section.category}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: sIdx * 0.2 }}
                        >
                            <h3 className="text-2xl font-bold text-primary mb-6">{section.category}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {section.items.map((item) => (
                                    <div key={item.name} className="bg-card rounded-xl p-6 border border-border hover:border-primary/30 gentle-animation">
                                        <h4 className="text-lg font-bold text-foreground mb-2">{item.name}</h4>
                                        <p className="text-sm text-muted-foreground leading-relaxed">{item.detail}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
