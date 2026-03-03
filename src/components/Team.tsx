'use client'

import { motion } from 'framer-motion'

export function Team() {
    const team = [
        {
            name: "Arjun Mehta",
            role: "ML Engineer",
            description: "Designed and trained the 1D CNN fraud detection model. Expert in TensorFlow and sequence analysis.",
            emoji: "🧠"
        },
        {
            name: "Priya Sharma",
            role: "Backend Developer",
            description: "Built the Flask API, MongoDB integration, and real-time transaction processing pipeline.",
            emoji: "⚙️"
        },
        {
            name: "Rahul Verma",
            role: "Data Scientist",
            description: "Created the synthetic dataset generator and feature engineering pipeline for training data.",
            emoji: "📊"
        },
        {
            name: "Neha Patel",
            role: "AI Integration Lead",
            description: "Integrated Google Gemini for explainable AI — making fraud decisions transparent and user-friendly.",
            emoji: "🤖"
        },
        {
            name: "Vikram Singh",
            role: "Security Architect",
            description: "Designed the secure architecture with encryption, environment-based secrets, and access controls.",
            emoji: "🔒"
        },
        {
            name: "Ananya Gupta",
            role: "Frontend Developer",
            description: "Crafted the cybersecurity-themed UI with cursor-reactive effects and responsive design.",
            emoji: "🎨"
        }
    ]

    return (
        <div id="team" className="relative py-32 bg-background">
            <div className="container mx-auto px-6 sm:px-8 lg:px-12">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-3 mb-6">
                        <div className="w-3 h-3 bg-accent-blue rounded-full animate-pulse" />
                        <span className="text-sm font-semibold text-muted-foreground">The Builders</span>
                        <div className="w-3 h-3 bg-accent-purple rounded-full animate-pulse" />
                    </div>

                    <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-8 text-foreground">
                        Meet Our Team
                    </h2>

                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                        The engineers and researchers behind NexusGuard's intelligent fraud detection system
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {team.map((member, index) => (
                        <motion.div
                            key={member.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-card rounded-2xl p-8 border border-border hover:border-primary/30 gentle-animation hover:cyber-glow text-center"
                        >
                            <div className="text-5xl mb-4">{member.emoji}</div>
                            <h3 className="text-xl font-bold text-foreground mb-1">{member.name}</h3>
                            <div className="text-sm font-semibold text-primary mb-4">{member.role}</div>
                            <p className="text-sm text-muted-foreground leading-relaxed">{member.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    )
}
