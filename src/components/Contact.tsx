'use client'

import { useEffect } from 'react'

export function Contact() {
    useEffect(() => {
        const script = document.createElement('script')
        script.src = 'https://assets.calendly.com/assets/external/widget.js'
        script.async = true
        document.body.appendChild(script)
        return () => { if (document.body.contains(script)) document.body.removeChild(script) }
    }, [])

    return (
        <section id="contact" className="relative py-32 bg-card/30">
            <div className="container mx-auto px-6 sm:px-8 lg:px-12">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-3 mb-6">
                        <div className="w-3 h-3 bg-accent-emerald rounded-full animate-pulse" />
                        <span className="text-sm font-semibold text-muted-foreground">Get In Touch</span>
                        <div className="w-3 h-3 bg-accent-blue rounded-full animate-pulse" />
                    </div>

                    <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-8">
                        <span className="block gradient-text">Let's Secure Your Platform</span>
                    </h2>

                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                        Book a call to discuss how NexusGuard can protect your UPI transactions with AI-powered fraud detection
                    </p>
                </div>

                <div className="max-w-5xl mx-auto">
                    <div className="bg-card border border-border rounded-2xl overflow-hidden">
                        <div className="px-8 py-6 border-b border-border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-foreground mb-1">NexusGuard Introduction Call</h3>
                                    <p className="text-muted-foreground">30 minutes • Video call • Free consultation</p>
                                </div>
                                <div className="hidden sm:flex items-center space-x-2">
                                    <div className="w-3 h-3 bg-accent-emerald rounded-full animate-pulse" />
                                    <span className="text-sm text-muted-foreground font-medium">Available now</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-0 bg-white">
                            <div
                                className="calendly-inline-widget"
                                data-url="https://calendly.com/d/cvb4-btv-mxp/introduction-with-zeroqode"
                                style={{ width: '100%', height: '660px', overflow: 'hidden' }}
                            />
                        </div>
                    </div>
                </div>

                <div className="text-center mt-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        {[
                            { title: "Technical Demo", desc: "See the CNN model detect fraud in real-time with live transactions", color: "primary" },
                            { title: "Custom Integration", desc: "Learn how NexusGuard fits into your existing payment infrastructure", color: "accent-emerald" },
                            { title: "Deployment Plan", desc: "Get a roadmap for production deployment with timeline and requirements", color: "accent-purple" },
                        ].map(item => (
                            <div key={item.title} className="bg-card border border-border rounded-2xl p-6">
                                <h4 className="font-bold text-foreground mb-2">{item.title}</h4>
                                <p className="text-muted-foreground text-sm">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
