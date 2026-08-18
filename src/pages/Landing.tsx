import { motion } from "framer-motion";
import { BookOpen, GraduationCap, ShieldCheck, ArrowRight, CheckCircle2, Users, Calendar, LineChart } from "lucide-react";
import { Link } from "react-router";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-50 border-b border-slate-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2.5">
              <div className="bg-blue-600 text-white p-1.5 rounded-lg shadow-sm shadow-blue-600/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">Philos <span className="text-yellow-500">EduOS</span></span>
            </div>
            
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500">
              <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How it Works</a>
              <a href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</a>
            </div>

            <div className="flex items-center gap-4">
              <Link to="/auth" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors hidden sm:block">
                Log in
              </Link>
              <Link to="/auth" className="bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-xl"
          >
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold mb-6 border border-blue-100">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              Enterprise-Grade School Management
            </div>
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-6">
              The Future of <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">School Management</span> is Here.
            </h1>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed font-medium">
              A world-class, multi-tenant operating system for modern educational institutions. Manage students, teachers, attendance, and performance with a beautifully designed, lightning-fast platform built for excellence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/auth" className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-0.5">
                Start Free Trial
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#features" className="inline-flex items-center justify-center gap-2 bg-white text-slate-700 px-8 py-4 rounded-xl font-semibold border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm">
                Watch Demo
              </a>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-yellow-50 rounded-3xl transform rotate-3 scale-105 opacity-80"></div>
            <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-white/50">
              {/* Mock Dashboard UI */}
              <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                <span className="ml-3 text-xs font-medium text-slate-400">dashboard@philos-eduos.com</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100">
                  <GraduationCap className="w-5 h-5 text-slate-400 mb-2" />
                  <div className="text-2xl font-bold text-slate-800">1,240</div>
                  <div className="text-xs text-slate-500 font-medium">Active Students</div>
                </div>
                <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100">
                  <Users className="w-5 h-5 text-slate-400 mb-2" />
                  <div className="text-2xl font-bold text-slate-800">64</div>
                  <div className="text-xs text-slate-500 font-medium">Expert Teachers</div>
                </div>
              </div>
              
              <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm font-semibold text-slate-700">Weekly Attendance Overview</div>
                  <div className="text-xs text-slate-400 font-medium">Last 7 days</div>
                </div>
                <div className="h-24 flex items-end gap-2">
                  {[40, 70, 50, 80, 60, 90, 45].map((h, i) => (
                    <div key={i} className="flex-1 bg-blue-100 rounded-t-sm relative group hover:bg-blue-600 transition-colors" style={{ height: `${h}%` }}>
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
                        {h}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Logos Section */}
      <section className="py-12 border-y border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-bold text-slate-400 mb-8 uppercase tracking-widest">Trusted by 200+ Institutions Globally</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="text-xl font-bold font-serif text-slate-600">Harvard Prep</div>
            <div className="text-xl font-bold font-sans text-blue-600">Bright Future</div>
            <div className="text-xl font-bold font-mono text-slate-800">Apex Academy</div>
            <div className="text-xl font-bold font-serif italic text-yellow-600">Legacy School</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Everything You Need to Run Your School</h2>
            <p className="text-lg text-slate-600 font-medium">A comprehensive, intuitive platform designed to empower educators and engage students with world-class tools.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: <Users className="w-6 h-6 text-blue-600" />, title: "Multi-Tenant Architecture", desc: "Seamlessly manage multiple schools or branches from a single, centralized administrative dashboard." },
              { icon: <Calendar className="w-6 h-6 text-slate-500" />, title: "Smart Attendance", desc: "Real-time tracking and deep analytics to identify trends and ensure student safety." },
              { icon: <LineChart className="w-6 h-6 text-green-600" />, title: "Performance Analytics", desc: "Gain deep insights into student performance across subjects with beautiful, actionable visual reports." },
              { icon: <BookOpen className="w-6 h-6 text-yellow-600" />, title: "Digital Report Cards", desc: "Generate, customize, and distribute professional report cards and progress reports with ease." },
              { icon: <ShieldCheck className="w-6 h-6 text-slate-800" />, title: "Secure & Private", desc: "Enterprise-grade security and compliance to keep your institutional data safe and protected." },
              { icon: <CheckCircle2 className="w-6 h-6 text-blue-500" />, title: "Content & Messaging", desc: "Share resources, post updates, and facilitate secure, real-time communication across your community." }
            ].map((feature, i) => (
              <div key={i} className="group p-8 rounded-2xl border border-slate-100 hover:border-blue-100 hover:shadow-2xl hover:shadow-blue-500/5 transition-all bg-white">
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-blue-50 transition-all duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm font-medium">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPHBhdGggZD0iTTAgMEw4IDhNOCwwTDAoOCkiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Ready to Transform Your Institution?</h2>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto font-medium">Join the next generation of educational institutions using Philos EduOS to drive excellence and innovation.</p>
          <Link to="/auth" className="inline-flex items-center gap-2 bg-white text-slate-900 px-10 py-4 rounded-full font-bold hover:bg-slate-50 transition-all shadow-2xl hover:-translate-y-1">
            Get Started for Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 text-sm border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-white" />
            <span className="font-bold text-white">Philos EduOS</span>
          </div>
          <p>© {new Date().getFullYear()} Philos EduOS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}