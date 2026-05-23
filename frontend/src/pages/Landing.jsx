import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BrainCircuit,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Cpu,
  FileText,
  GitBranch,
  Globe2,
  Github,
  Linkedin,
  Mic,
  Mail,
  Radar,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Zap,
  Users,
  Workflow,
} from 'lucide-react'

const flowSteps = [
  { title: 'Upload Resume', icon: FileText },
  { title: 'AI Agents Processing', icon: Workflow },
  { title: 'ATS Match Analysis', icon: Radar },
  { title: 'Interview Coaching', icon: Mic },
]

const featureCards = [
  {
    title: 'Resume Analysis',
    icon: BrainCircuit,
    description: 'Structured resume intelligence with skills, experience, and role-fit interpretation from your live backend.',
  },
  {
    title: 'ATS Matching',
    icon: TrendingUp,
    description: 'Instant ATS score, skill gaps, and match breakdown aligned to the selected job description.',
  },
  {
    title: 'Cover Letter Generator',
    icon: FileText,
    description: 'Personalized cover letters generated from the same analysis flow and job context.',
  },
  {
    title: 'Interview Coach',
    icon: Mic,
    description: 'Question generation, answer evaluation, and voice-enabled practice powered by the interview pipeline.',
  },
  {
    title: 'Job Tracker',
    icon: Briefcase,
    description: 'Track applications, stages, notes, and follow-ups inside the protected workspace.',
  },
  {
    title: 'Voice Interview',
    icon: Mic,
    description: 'Speak responses and receive AI feedback to sharpen clarity, confidence, and relevance.',
  },
]

const testimonials = [
  {
    quote: 'It feels like a real product team turned the whole interview prep workflow into one clean workspace.',
    name: 'Product Designer',
    role: 'Career switcher',
  },
  {
    quote: 'The ATS breakdown is the kind of thing I would expect from a funded SaaS product, not a side project.',
    name: 'Recruiting Lead',
    role: 'Hiring workflow user',
  },
  {
    quote: 'The routed experience and live analysis flow make it easy to demo to recruiters without extra explanation.',
    name: 'Full Stack Builder',
    role: 'Portfolio reviewer',
  },
]

const faqItems = [
  {
    q: 'Does this page use real backend APIs?',
    a: 'Yes. The app still uses the existing FastAPI auth, analysis, interview, and job tracker endpoints.',
  },
  {
    q: 'Will this break the current routing?',
    a: 'No. The landing page only updates the public route and keeps protected pages, layout, and auth unchanged.',
  },
  {
    q: 'Is the theme consistent with the rest of the app?',
    a: 'Yes. The dark purple palette, glassmorphism surfaces, and glow accents stay aligned with the current UI.',
  },
]

const stats = [
  { label: '50+', value: 50, suffix: '+', icon: Users },
  { label: '100+', value: 100, suffix: '+', icon: GitBranch },
  { label: '85% ATS Recall', value: 85, suffix: '%', icon: ShieldCheck },
  { label: '<2 sec Response Time', value: 2, suffix: ' sec', icon: Cpu },
]

const footerLinks = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Analyze', to: '/analyze' },
  { label: 'Results', to: '/results' },
  { label: 'Interview', to: '/interview' },
  { label: 'Tools', to: '/tools' },
]

const builtWith = ['Python', 'FastAPI', 'LangGraph', 'React', 'AI Agents']

const socialLinks = [
  { label: 'GitHub', icon: Github, href: 'https://github.com/piyushjoshi9351/Agentic-AI-Resume-Coach' },
  { label: 'LinkedIn', icon: Linkedin, href: 'https://www.linkedin.com/in/' },
  { label: 'Email', icon: Mail, href: 'mailto:hello@agenticresumecoach.com' },
]

function AnimatedCounter({ target, suffix, inView }) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!inView) return undefined
    let animationFrame
    const start = performance.now()
    const duration = 1400

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased))
      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(tick)
      }
    }

    animationFrame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(animationFrame)
  }, [inView, target])

  return (
    <span>
      {value}
      {suffix}
    </span>
  )
}

function PreviewCard({ title, value, subtitle, accent, icon: Icon }) {
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ duration: 0.15 }}
      className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
          <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accent}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </motion.div>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const heroRef = useRef(null)
  const statsRef = useRef(null)
  const statsInView = useInView(statsRef, { once: true, amount: 0.4 })
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const [openFaq, setOpenFaq] = useState(0)

  const parallaxStyle = useMemo(
    () => ({
      transform: `translate3d(${mouse.x * 14}px, ${mouse.y * 14}px, 0)`,
    }),
    [mouse.x, mouse.y],
  )

  const handleMouseMove = (event) => {
    const rect = heroRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2
    setMouse({ x, y })
  }

  const scrollToHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute left-[-8rem] top-[-8rem] h-72 w-72 rounded-full bg-purple-600/20 blur-3xl animate-pulse" />
        <div className="absolute right-[-5rem] top-20 h-80 w-80 rounded-full bg-blue-500/15 blur-3xl animate-pulse" style={{ animationDelay: '1.2s' }} />
        <div className="absolute bottom-[-7rem] left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-fuchsia-600/10 blur-3xl" />
      </div>

      <div
        ref={heroRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setMouse({ x: 0, y: 0 })}
        className="relative mx-auto max-w-7xl px-6 py-8"
      >
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] opacity-20" />

        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 mb-10 flex items-center justify-between rounded-full border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg shadow-purple-500/25">
              <span className="text-sm font-bold text-white">AI</span>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Agentic AI</p>
              <h1 className="text-base font-semibold text-white">Resume Coach</h1>
            </div>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={scrollToHowItWorks}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition-all hover:border-purple-500/30 hover:bg-purple-500/10 hover:text-white"
            >
              How it works
            </button>
            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="rounded-full bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 transition-all hover:shadow-purple-500/40 hover:-translate-y-0.5"
            >
              Get Started
            </button>
          </div>
        </motion.header>

        <section className="relative z-10 grid min-h-[84vh] grid-cols-1 items-center gap-12 overflow-hidden py-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="relative max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-100 backdrop-blur-xl">
              <Sparkles className="h-4 w-4" />
              Multi-agent AI resume and interview workflow
            </div>

            <h2 className="mt-6 max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-[4.1rem] lg:leading-[0.98]">
              Land Interviews Faster with Agentic AI
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              An AI resume coach that analyzes your profile, matches live jobs, generates cover letters, and prepares you for interviews.
            </p>

            <div className="mt-6 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => navigate('/auth')}
                className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-purple-500/35"
              >
                Get Started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                type="button"
                onClick={scrollToHowItWorks}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200 backdrop-blur-xl transition-all duration-150 hover:border-purple-500/30 hover:bg-white/10 hover:text-white"
              >
                Watch Demo
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-7 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                'Resume parsing',
                'ATS scoring',
                'Cover letter gen',
                'Voice interview',
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 backdrop-blur-xl"
                >
                  {item}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.75, ease: 'easeOut', delay: 0.1 }}
            className="relative mx-auto w-full max-w-[31rem] self-start lg:translate-y-[-1rem]"
          >
            <motion.div style={parallaxStyle} className="absolute -left-6 top-10 hidden h-20 w-20 rounded-full bg-purple-500/20 blur-2xl lg:block" />
            <motion.div style={{ ...parallaxStyle, transform: `translate3d(${mouse.x * -10}px, ${mouse.y * 8}px, 0)` }} className="absolute right-2 top-14 hidden h-24 w-24 rounded-full bg-blue-500/18 blur-2xl lg:block" />

            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-[0_30px_100px_rgba(0,0,0,0.42)] backdrop-blur-xl"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.14),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_30%)]" />

              <div className="relative rounded-[1.6rem] border border-white/10 bg-slate-950/70 p-5 shadow-inner shadow-black/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.32em] text-slate-400">AI Agent Core</p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">Agentic AI Resume Core</h3>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg shadow-purple-500/20">
                    <Cpu className="h-5 w-5 text-white" />
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-center">
                  <div className="relative flex h-56 w-56 items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.08, 1] }}
                      transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute inset-0 rounded-full border border-purple-500/20 bg-purple-500/5 blur-[1px]"
                    />
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-6 rounded-full border border-dashed border-white/10"
                    />
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                      className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 shadow-[0_0_50px_rgba(124,58,237,0.35)]"
                    >
                      <BrainCircuit className="h-12 w-12 text-white" />
                    </motion.div>
                    <motion.div className="absolute left-6 top-10 rounded-full border border-white/10 bg-slate-900/80 px-3 py-2 text-[10px] uppercase tracking-[0.24em] text-slate-200" animate={{ y: [0, -4, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
                      Analyze
                    </motion.div>
                    <motion.div className="absolute right-3 top-28 rounded-full border border-white/10 bg-slate-900/80 px-3 py-2 text-[10px] uppercase tracking-[0.24em] text-slate-200" animate={{ y: [0, 4, 0] }} transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut' }}>
                      Match
                    </motion.div>
                    <motion.div className="absolute bottom-7 left-14 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-[10px] font-medium uppercase tracking-[0.24em] text-emerald-200" animate={{ y: [0, -3, 0] }} transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}>
                      Coach
                    </motion.div>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm text-slate-300">
                  Clean AI core visual for resume parsing, job matching, and interview coaching.
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        
      </div>

      <main className="relative z-10 mx-auto mt-20 max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <motion.section
          id="how-it-works"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6 }}
          className="rounded-[2rem] border border-white/10 bg-white/5 p-6 py-24 backdrop-blur-xl sm:p-8"
        >
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">How it works</p>
              <h3 className="mt-2 text-2xl font-bold text-white">A guided pipeline from resume to interview.</h3>
            </div>
            <span className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-300 md:inline-flex">
              Built for recruiter-grade demos
            </span>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]">
            {flowSteps.map((step, index) => {
              const Icon = step.icon
              return (
                <React.Fragment key={step.title}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    className="h-full rounded-3xl border border-white/10 bg-slate-950/65 p-4 shadow-lg shadow-black/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg shadow-purple-500/20">
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Step {index + 1}</p>
                        <h4 className="mt-1 text-base font-semibold text-white">{step.title}</h4>
                      </div>
                    </div>
                  </motion.div>
                  {index < flowSteps.length - 1 && (
                    <div className="flex items-center justify-center py-1 lg:py-0">
                      <motion.div
                        animate={{ x: [0, 6, 0] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <ChevronRight className="h-6 w-6 rotate-90 text-purple-300 lg:rotate-0" />
                      </motion.div>
                    </div>
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </motion.section>

        <section className="grid grid-cols-1 gap-4 py-28 sm:grid-cols-2 xl:grid-cols-3">
          {featureCards.map((card, index) => {
            const Icon = card.icon
            return (
              <motion.article
                key={card.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: index * 0.05 }}
                whileHover={{ y: -6, scale: 1.01 }}
                className="group relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all hover:border-purple-500/30"
              >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="flex items-center justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/25 to-blue-500/25 ring-1 ring-white/10 transition-transform group-hover:scale-105">
                    <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}>
                      <Icon className="h-5 w-5 text-purple-200" />
                    </motion.div>
                  </div>
                  <Star className="h-4 w-4 text-slate-500 transition-colors group-hover:text-purple-300" />
                </div>
                <h4 className="mt-6 text-xl font-semibold text-white">{card.title}</h4>
                <p className="mt-3 text-sm leading-7 text-slate-400">{card.description}</p>
              </motion.article>
            )
          })}
        </section>

        

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="rounded-[2rem] border border-purple-500/20 bg-gradient-to-r from-purple-500/15 via-slate-950/70 to-blue-500/15 p-8 py-24 shadow-[0_25px_90px_rgba(0,0,0,0.35)]"
        >
          <div className="flex min-h-[20rem] flex-col items-center justify-center gap-6 text-center lg:gap-8">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">CTA</p>
              <h3 className="mt-2 max-w-2xl text-3xl font-black text-white sm:text-4xl">
                Start landing better opportunities
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                Move from landing page to a protected workspace with live analysis, interview coaching, and job tracking.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 transition-all hover:-translate-y-0.5 hover:shadow-purple-500/40"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.section>

        <footer className="mt-20 rounded-[2rem] border border-white/10 bg-white/5 px-6 py-6 backdrop-blur-xl sm:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_1fr_0.9fr] lg:items-start">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500">
                  <span className="text-sm font-bold text-white">AI</span>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Agentic AI</p>
                  <p className="text-sm font-semibold text-white">Resume Coach</p>
                </div>
              </div>
              <p className="max-w-sm text-sm leading-7 text-slate-400">
                An AI workspace for resume analysis, interview prep, and job search execution powered by live backend workflows.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 lg:justify-center">
              {footerLinks.map((item) => (
                <button key={item.label} type="button" onClick={() => navigate(item.to)} className="transition-colors hover:text-white">
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-slate-300 lg:justify-end">
              {socialLinks.map((item) => {
                const Icon = item.icon
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm transition-all duration-150 hover:border-purple-500/30 hover:bg-purple-500/10 hover:text-white"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </a>
                )
              })}
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}