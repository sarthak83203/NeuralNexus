'use client'

export function Awards() {
    const stats = [
        { value: "99.2%", label: "Detection Accuracy", description: "Trained on 100K+ synthetic transactions" },
        { value: "<200ms", label: "Response Time", description: "Real-time fraud scoring per transaction" },
        { value: "100K+", label: "Transactions Analyzed", description: "Per day processing capacity" },
        { value: "10", label: "Sequence Depth", description: "Consecutive transactions analyzed per prediction" },
        { value: "8", label: "Feature Dimensions", description: "Amount, hour, time gap + 5 location features" },
        { value: "0.7", label: "Fraud Threshold", description: "Probability cutoff for blocking transactions" },
    ]

    return (
        <section id="stats" className="relative py-20 bg-background overflow-hidden">
            <div className="absolute inset-0" style={{
                background: 'radial-gradient(ellipse at 50% 50%, rgba(66,133,244,0.04) 0%, transparent 70%)'
            }} />

            <div className="container mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-3 mb-6">
                        <div className="w-3 h-3 bg-accent-emerald rounded-full animate-pulse" />
                        <span className="text-sm font-semibold text-muted-foreground">Performance Metrics</span>
                        <div className="w-3 h-3 bg-accent-blue rounded-full animate-pulse" />
                    </div>

                    <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6 text-foreground">
                        By The Numbers
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {stats.map((stat, index) => (
                        <div key={index} className="text-center p-8 rounded-2xl border border-border bg-card hover:border-primary/30 gentle-animation hover:cyber-glow">
                            <div className="text-4xl sm:text-5xl font-black gradient-text mb-2">{stat.value}</div>
                            <div className="text-lg font-bold text-foreground mb-2">{stat.label}</div>
                            <div className="text-sm text-muted-foreground">{stat.description}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
