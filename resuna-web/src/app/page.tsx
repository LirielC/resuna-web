'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/contexts/LanguageContext';
import { GrainOverlay } from '@/components/ui/GrainOverlay';

/*
 * DESIGN DIRECTION: Refined Editorial with Warmth
 * 
 * Typography: Playfair Display (display) + Crimson Pro (body)
 * Color: Deep warm neutrals + terracotta orange + sage green
 * Texture: Subtle grain overlay for depth
 * Layout: Asymmetric, generous whitespace, intentional overlap
 * Animation: Smooth staggered reveals on load
 */

export default function Home() {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Google Fonts */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Crimson+Pro:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&display=swap');
      `}</style>

      <div
        className="relative min-h-screen overflow-hidden"
        style={{
          backgroundColor: '#F8F6F1',
          fontFamily: "'Crimson Pro', Georgia, serif",
        }}
      >
        <GrainOverlay />

        {/* Decorative Background Elements */}
        <div
          className="fixed top-0 right-0 w-[60%] h-[70%] opacity-40 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 70% 30%, rgba(196, 107, 72, 0.12) 0%, transparent 60%)',
          }}
        />
        <div
          className="fixed bottom-0 left-0 w-[40%] h-[50%] opacity-30 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 20% 80%, rgba(94, 122, 99, 0.1) 0%, transparent 50%)',
          }}
        />

        {/* Navigation */}
        <nav className="relative z-40 px-8 lg:px-16 py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link
              href="/"
              className="text-[28px] tracking-tight"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontWeight: 600,
                color: '#2A2824',
                letterSpacing: '-0.02em',
              }}
            >
              Resuna
            </Link>

            {/* Desktop links */}
            <div className="hidden md:flex items-center" style={{ gap: '3rem' }}>
              <Link
                href="#features"
                className="text-[17px] tracking-wide transition-colors duration-300 text-[#6B6760] hover:text-[#C46B48]"
                style={{ fontWeight: 400 }}
              >
                Recursos
              </Link>
              <Link
                href="/login"
                className="text-[15px] font-medium tracking-wide transition-colors duration-300 hover:opacity-70"
                style={{ color: '#6B6760' }}
              >
                {t('landing.signIn')}
              </Link>
            </div>

            {/* Mobile: Entrar + hamburger */}
            <div className="flex md:hidden items-center gap-3">
              <Link
                href="/login"
                className="text-[15px] font-medium px-4 py-2 rounded"
                style={{
                  color: '#2A2824',
                  border: '1px solid #C4BCB0',
                }}
              >
                {t('landing.signIn')}
              </Link>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded"
                style={{ backgroundColor: '#EFECE6', color: '#2A2824' }}
                aria-label="Menu"
              >
                {mobileMenuOpen ? (
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="4" y1="4" x2="16" y2="16" /><line x1="16" y1="4" x2="4" y2="16" />
                  </svg>
                ) : (
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="3" y1="6" x2="17" y2="6" /><line x1="3" y1="12" x2="17" y2="12" /><line x1="3" y1="18" x2="17" y2="18" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile dropdown menu */}
          {mobileMenuOpen && (
            <div
              className="md:hidden mt-4 py-4 px-6 rounded-lg"
              style={{ backgroundColor: '#EFECE6', border: '1px solid #E0DBD3' }}
            >
              <Link
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 text-[17px]"
                style={{ color: '#2A2824', borderBottom: '1px solid #E0DBD3' }}
              >
                Recursos
              </Link>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 text-[17px] font-medium"
                style={{ color: '#C46B48' }}
              >
                {t('landing.signIn')}
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="block mt-3 py-3 px-4 text-center text-[15px] font-medium rounded text-white"
                style={{ backgroundColor: '#C46B48' }}
              >
                {t('landing.beginJourney')}
              </Link>
            </div>
          )}
        </nav>

        {/* Hero Section */}
        <section className="relative z-10 pt-12 lg:pt-20 pb-32">
          <div className="max-w-7xl mx-auto px-8 lg:px-16">
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-4 items-start">

              {/* Left Column - Text */}
              <div className="lg:col-span-5 lg:pt-12">
                {/* Small Label */}
                <motion.div
                  className="inline-flex items-center mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                >
                  <span
                    className="w-8 h-[1px] mr-3"
                    style={{ backgroundColor: '#C46B48' }}
                  />
                  <span
                    className="text-[12px] uppercase tracking-[0.25em] font-medium"
                    style={{ color: '#C46B48' }}
                  >
                    {t('landing.resumeIntelligence')}
                  </span>
                </motion.div>

                {/* Headline */}
                <motion.h1
                  className="mb-10"
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 'clamp(3.5rem, 7vw, 5.5rem)',
                    fontWeight: 500,
                    lineHeight: 1.05,
                    color: '#2A2824',
                    letterSpacing: '-0.03em',
                  }}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                >
                  {t('landing.heroTitle')}<br />
                  <em style={{ fontWeight: 400, fontStyle: 'italic' }}>{t('landing.heroTitleEmphasis')}</em>
                </motion.h1>

                {/* Description */}
                <motion.p
                  className="mb-12 max-w-lg"
                  style={{
                    fontSize: '21px',
                    lineHeight: 1.75,
                    color: '#5C5850',
                    fontWeight: 300,
                  }}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.35 }}
                >
                  {t('landing.heroDescription')}
                </motion.p>

                {/* CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
                >
                  <Link
                    href="/signup"
                    className="group inline-flex items-center text-[17px] font-medium tracking-wide transition-all duration-300 text-white bg-[#C46B48] hover:bg-[#A85A3C] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(196,107,72,0.3)]"
                    style={{ padding: '16px 32px', borderRadius: '2px' }}
                  >
                    {t('landing.beginJourney')}
                    <svg
                      className="ml-3 transition-transform duration-300 group-hover:translate-x-1"
                      width="16" height="16" viewBox="0 0 16 16" fill="none"
                    >
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </motion.div>
              </div>

              {/* Right Column - Visual */}
              <div className="lg:col-span-7 relative hidden lg:block" style={{ minHeight: '480px' }}>
                {/* Decorative Shape */}
                <motion.div
                  className="absolute"
                  style={{
                    top: '8%',
                    right: '5%',
                    width: '380px',
                    height: '420px',
                    background: 'linear-gradient(165deg, #D4835A 0%, #C46B48 50%, #9B4E35 100%)',
                    borderRadius: '180px 180px 240px 60px',
                  }}
                  initial={{ opacity: 0, rotate: -8 }}
                  animate={{ opacity: 1, rotate: -8 }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                />

                {/* Decorative Elements */}
                <motion.div
                  className="absolute"
                  style={{
                    top: '5%',
                    right: '38%',
                    width: '6px',
                    height: '6px',
                    backgroundColor: '#E8B89A',
                    borderRadius: '50%',
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, ease: 'easeOut', delay: 0.9 }}
                />
                <motion.div
                  className="absolute"
                  style={{ top: '18%', right: '8%' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, ease: 'easeOut', delay: 1.0 }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="#E8C9A0">
                    <path d="M10 0L12.5 7.5L20 10L12.5 12.5L10 20L7.5 12.5L0 10L7.5 7.5L10 0Z" />
                  </svg>
                </motion.div>
                <motion.div
                  className="absolute"
                  style={{
                    top: '65%',
                    right: '42%',
                    width: '4px',
                    height: '4px',
                    backgroundColor: '#C9B89A',
                    rotate: '45deg',
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, ease: 'easeOut', delay: 1.1 }}
                />

                {/* Resume Card */}
                <motion.div
                  className="absolute bg-white"
                  style={{
                    top: '12%',
                    right: '18%',
                    width: '280px',
                    padding: '28px 24px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                    borderRadius: '3px',
                  }}
                  initial={{ opacity: 0, y: 40, rotate: -6 }}
                  animate={{ opacity: 1, y: 0, rotate: -6 }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
                >
                  {/* Resume Header */}
                  <div className="mb-5 pb-4" style={{ borderBottom: '1px solid #EEEAE4' }}>
                    <div
                      className="text-[13px] font-semibold mb-1"
                      style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        color: '#2A2824',
                      }}
                    >
                      Currículo
                    </div>
                  </div>

                  {/* Sections */}
                  {[
                    { label: t('landing.experience'), lines: [100, 88, 75] },
                    { label: t('landing.education'), lines: [100, 70] },
                    { label: t('landing.skills'), lines: [60, 45, 55] },
                  ].map((section, i) => (
                    <div key={section.label} className={i < 2 ? 'mb-5' : ''}>
                      <div
                        className="text-[9px] uppercase tracking-[0.15em] font-semibold mb-2"
                        style={{ color: '#C46B48' }}
                      >
                        {section.label}
                      </div>
                      <div className="space-y-[6px]">
                        {section.lines.map((w, j) => (
                          <div
                            key={j}
                            className="h-[5px] rounded-full"
                            style={{
                              width: `${w}%`,
                              backgroundColor: j === 0 ? '#E5E1DB' : '#EEEAE4',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </motion.div>

                {/* Score Badge */}
                <motion.div
                  className="absolute bg-white rounded-full flex flex-col items-center justify-center"
                  style={{
                    top: '6%',
                    right: '12%',
                    width: '88px',
                    height: '88px',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12)',
                  }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.8 }}
                >
                  <svg width="68" height="68" viewBox="0 0 68 68" style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
                    <circle cx="34" cy="34" r="28" fill="none" stroke="#EDF3EE" strokeWidth="4" />
                    <circle
                      cx="34" cy="34" r="28" fill="none"
                      stroke="#5E7A63" strokeWidth="4" strokeLinecap="round"
                      strokeDasharray={`${0.92 * 2 * Math.PI * 28} ${2 * Math.PI * 28}`}
                    />
                  </svg>
                  <span
                    className="text-[24px] font-semibold z-10"
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      color: '#5E7A63',
                    }}
                  >
                    92
                  </span>
                  <span
                    className="text-[8px] uppercase tracking-[0.1em] font-medium z-10"
                    style={{ color: '#5E7A63' }}
                  >
                    {t('landing.atsScore')}
                  </span>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="relative z-10 py-24 lg:py-32">
          <div className="max-w-6xl mx-auto px-8 lg:px-16">
            {/* Section Header */}
            <div className="text-center mb-20">
              <div className="inline-flex items-center justify-center mb-6">
                <span className="w-12 h-[1px]" style={{ backgroundColor: '#D5CFC5' }} />
                <span
                  className="mx-4 text-[11px] uppercase tracking-[0.2em]"
                  style={{ color: '#8A847A' }}
                >
                  {t('landing.capabilities')}
                </span>
                <span className="w-12 h-[1px]" style={{ backgroundColor: '#D5CFC5' }} />
              </div>
              <h2
                className="text-[2.75rem] lg:text-[3.5rem]"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontWeight: 500,
                  color: '#2A2824',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1,
                }}
              >
                {t('landing.precisionTitle')}
              </h2>
            </div>

            {/* Feature Grid */}
            <div className="grid md:grid-cols-3 gap-12 lg:gap-16">
              {[
                {
                  num: '01',
                  title: t('landing.feature01Title'),
                  desc: t('landing.feature01Desc'),
                },
                {
                  num: '02',
                  title: t('landing.feature02Title'),
                  desc: t('landing.feature02Desc'),
                },
                {
                  num: '03',
                  title: t('landing.feature03Title'),
                  desc: t('landing.feature03Desc'),
                },
              ].map((feature) => (
                <div key={feature.num} className="group">
                  <div
                    className="text-[13px] uppercase tracking-[0.18em] mb-5 transition-colors duration-300"
                    style={{ color: '#C46B48' }}
                  >
                    {feature.num}
                  </div>
                  <h3
                    className="text-[1.65rem] lg:text-[1.85rem] mb-5"
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontWeight: 500,
                      color: '#2A2824',
                      lineHeight: 1.2,
                    }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    className="text-[17px] leading-relaxed"
                    style={{ color: '#6B6760', fontWeight: 300, lineHeight: 1.7 }}
                  >
                    {feature.desc}
                  </p>
                  <div
                    className="mt-6 w-12 h-[1px] transition-all duration-500 group-hover:w-20"
                    style={{ backgroundColor: '#D5CFC5' }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative z-10 py-24 lg:py-32">
          <div className="max-w-2xl mx-auto px-8 lg:px-16 text-center">
            <h2
              className="text-[2.5rem] lg:text-[3.25rem] mb-8"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontWeight: 500,
                color: '#2A2824',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}
            >
              {t('landing.ctaTitle')}
            </h2>
            <p
              className="text-[19px] mb-12 leading-relaxed"
              style={{ color: '#6B6760', fontWeight: 300, lineHeight: 1.7 }}
            >
              {t('landing.ctaDescription')}
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center text-[17px] font-medium tracking-wide transition-all duration-300 text-white bg-[#C46B48] hover:bg-[#A85A3C] hover:-translate-y-0.5"
              style={{ padding: '16px 40px', borderRadius: '2px' }}
            >
              {t('landing.startFree')}
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer
          className="relative z-10 py-10"
          style={{ borderTop: '1px solid #E5E1DB' }}
        >
          <div className="max-w-6xl mx-auto px-8 lg:px-16 flex flex-col md:flex-row justify-between items-center gap-6">
            <span
              className="text-[22px]"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontWeight: 600,
                color: '#2A2824',
                letterSpacing: '-0.02em',
              }}
            >
              Resuna
            </span>
            <div className="flex gap-8">
              {[t('landing.terms'), t('landing.privacy')].map((item, i) => (
                <Link
                  key={item}
                  href={i === 0 ? '/terms' : '/privacy'}
                  className="text-[15px] transition-colors duration-300 text-[#8A847A] hover:text-[#C46B48]"
                >
                  {item}
                </Link>
              ))}
            </div>
            <a
              href="https://github.com/LirielC/resuna-web"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[13px] transition-colors duration-300 text-[#8A847A] hover:text-[#C46B48]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              Feito por LirielC
            </a>
          </div>
        </footer>
      </div>

    </>
  );
}
