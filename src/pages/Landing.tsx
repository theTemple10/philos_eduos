import { motion } from "framer-motion";
import { BookOpen, GraduationCap, ShieldCheck, ArrowRight, CheckCircle2, Users, Calendar, LineChart } from "lucide-react";
import { Link } from "react-router";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">Philos <span className="text-yellow-500">EduOS</span></span>
            </div>
            
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
              <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How it Works</a>
              <a href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</a>
            </div>

            <div className="flex items-center gap-4">
              <Link to="/auth" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors hidden sm:block">
                Log in
              </Link>
              <Link to="/auth" className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40">
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
            <div className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold mb-6 border border-yellow-200">
              <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
              Now Available for Schools
            </div>
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-6">
              The Future of <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">School Management</span> is Here.
            </h1>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              A world-class enterprise operating system for education. Manage students, teachers, attendance, and performance in one beautifully designed, lightning-fast platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/auth" className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-0.5">
                Start Free Trial
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#features" className="inline-flex items-center justify-center gap-2 bg-white text-slate-700 px-6 py-3.5 rounded-xl font-semibold border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all">
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
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-yellow-50 rounded-3xl transform rotate-3 scale-105"></div>
            <div className="relative bg-white rounded-3xl shadow-2xl p-6 border border-slate-100">
              {/* Mock Dashboard UI */}
              <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span className="ml-2 text-xs font-medium text-slate-500">admin@philos-eduos.com</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                  <GraduationCap className="w-6 h-6 text-blue-600 mb-2" />
                  <div className="text-2xl font-bold text-slate-800">1,240</div>
                  <div className="text-xs text-blue-600 font-medium">Students</div>
                </div>
                <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-100">
                  <Users className="w-6 h-6 text-yellow-600 mb-2" />
                  <div className="text-2xl font-bold text-slate-800">64</div>
                  <div className="text-xs text-yellow-600 font-medium">Teachers</div>
                </div>
              </div>
              
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm font-semibold text-slate-700">Attendance Overview</div>
                  <div className="text-xs text-slate-500">Last 7 days</div>
                </div>
                <div className="h-24 flex items-end gap-2">
                  {[40, 70, 50, 80, 60, 90, 45].map((h, i) => (
                    <div key={i} className="flex-1 bg-blue-200 rounded-t-sm relative group hover:bg-blue-400 transition-colors" style={{ height: `${h}%` }}>
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
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
      <section className="py-10 border-y border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-medium text-slate-400 mb-8 uppercase tracking-wider">Trusted by 200+ Schools Globally</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="text-2xl font-bold font-serif text-slate-600">Harvard Prep</div>
            <div className="text-2xl font-bold font-sans text-blue-600">Bright Future</div>
            <div className="text-2xl font-bold font-mono text-slate-800">Apex Academy</div>
            <div className="text-2xl font-bold font-serif italic text-yellow-600">Legacy School</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Everything you need to run your school</h2>
            <p className="text-lg text-slate-600">An all-in-one platform designed to empower educators and engage students.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: <Users className="w-6 h-6 text-blue-600" />, title: "Multi-role Dashboards", desc: "Tailored views for Admins, Teachers, Students, and Parents. Everyone sees what matters to them." },
              { icon: <Calendar className="w-6 h-6 text-yellow-600" />, title: "Smart Attendance", desc: "Real-time tracking and analytics. Identify trends before they become problems." },
              { icon: <LineChart className="w-6 h-6 text-green-600" />, title: "Performance Analytics", desc: "Deep insights into student performance across subjects with beautiful visual reports." },
              { icon: <BookOpen className="w-6 h-6 text-purple-600" />, title: "Digital Report Cards", desc: "Generate and distribute professional report cards in one click." },
              { icon: <ShieldCheck className="w-6 h-6 text-red-600" />, title: "Secure & Private", desc: "Enterprise-grade security. Your data is encrypted and protected at every level." },
              { icon: <CheckCircle2 className="w-6 h-6 text-teal-600" />, title: "Easy Onboarding", desc: "Import your existing data seamlessly. Get started in minutes, not months." }
            ].map((feature, i) => (
              <div key={i} className="group p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-xl transition-all bg-white">
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to transform your school?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">Join the next generation of educational institutions using Philos EduOS to drive excellence.</p>
          <Link to="/auth" className="inline-flex items-center gap-2 bg-white text-blue-900 px-8 py-4 rounded-full font-bold hover:bg-slate-50 transition-all shadow-xl hover:-translate-y-1">
            Get Started for Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-white" />
            <span className="font-bold text-white">Philos EduOS</span>
          </div>
          <p>© 2026 Philos EduOS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}