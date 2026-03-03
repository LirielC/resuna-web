'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useTranslation } from '@/contexts/LanguageContext';

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
  const heroRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    // Add loaded class for animations after mount
    const timer = setTimeout(() => {
      heroRef.current?.classList.add('loaded');
    }, 100);
    return () => clearTimeout(timer);
  }, []);

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
        {/* Grain Texture Overlay */}
        <div
          className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

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

            <div className="hidden md:flex items-center" style={{ gap: '3rem' }}>
              <Link
                href="#features"
                className="text-[17px] tracking-wide transition-colors duration-300"
                style={{
                  color: '#6B6760',
                  fontWeight: 400,
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#C46B48'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#6B6760'}
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
          </div>
        </nav>

        {/* Hero Section */}
        <section
          ref={heroRef}
          className="hero-section relative z-10 pt-12 lg:pt-20 pb-32"
        >
          <div className="max-w-7xl mx-auto px-8 lg:px-16">
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-4 items-start">

              {/* Left Column - Text */}
              <div className="lg:col-span-5 lg:pt-12">
                {/* Small Label */}
                <div
                  className="hero-label inline-flex items-center mb-8"
                  style={{
                    opacity: 0,
                    transform: 'translateY(20px)',
                  }}
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
                </div>

                {/* Headline */}
                <h1
                  className="hero-headline mb-10"
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 'clamp(3.5rem, 7vw, 5.5rem)',
                    fontWeight: 500,
                    lineHeight: 1.05,
                    color: '#2A2824',
                    letterSpacing: '-0.03em',
                    opacity: 0,
                    transform: 'translateY(30px)',
                  }}
                >
                  {t('landing.heroTitle')}<br />
                  <em style={{ fontWeight: 400, fontStyle: 'italic' }}>{t('landing.heroTitleEmphasis')}</em>
                </h1>

                {/* Description */}
                <p
                  className="hero-description mb-12 max-w-lg"
                  style={{
                    fontSize: '21px',
                    lineHeight: 1.75,
                    color: '#5C5850',
                    fontWeight: 300,
                    opacity: 0,
                    transform: 'translateY(30px)',
                  }}
                >
                  {t('landing.heroDescription')}
                </p>

                {/* CTA */}
                <div
                  className="hero-cta"
                  style={{
                    opacity: 0,
                    transform: 'translateY(30px)',
                  }}
                >
                  <Link
                    href="/signup"
                    className="group inline-flex items-center text-[17px] font-medium tracking-wide transition-all duration-300"
                    style={{
                      color: '#fff',
                      backgroundColor: '#C46B48',
                      padding: '16px 32px',
                      borderRadius: '2px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#A85A3C';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(196, 107, 72, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#C46B48';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {t('landing.beginJourney')}
                    <svg
                      className="ml-3 transition-transform duration-300 group-hover:translate-x-1"
                      width="16" height="16" viewBox="0 0 16 16" fill="none"
                    >
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Right Column - Visual */}
              <div className="lg:col-span-7 relative hidden lg:block" style={{ minHeight: '480px' }}>
                {/* Decorative Shape */}
                <div
                  className="hero-shape absolute"
                  style={{
                    top: '8%',
                    right: '5%',
                    width: '380px',
                    height: '420px',
                    background: 'linear-gradient(165deg, #D4835A 0%, #C46B48 50%, #9B4E35 100%)',
                    borderRadius: '180px 180px 240px 60px',
                    transform: 'rotate(-8deg)',
                    opacity: 0,
                  }}
                />

                {/* Decorative Elements */}
                <div
                  className="hero-decor-1 absolute"
                  style={{
                    top: '5%',
                    right: '38%',
                    width: '6px',
                    height: '6px',
                    backgroundColor: '#E8B89A',
                    borderRadius: '50%',
                    opacity: 0,
                  }}
                />
                <div
                  className="hero-decor-2 absolute"
                  style={{
                    top: '18%',
                    right: '8%',
                    opacity: 0,
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="#E8C9A0">
                    <path d="M10 0L12.5 7.5L20 10L12.5 12.5L10 20L7.5 12.5L0 10L7.5 7.5L10 0Z" />
                  </svg>
                </div>
                <div
                  className="hero-decor-3 absolute"
                  style={{
                    top: '65%',
                    right: '42%',
                    width: '4px',
                    height: '4px',
                    backgroundColor: '#C9B89A',
                    transform: 'rotate(45deg)',
                    opacity: 0,
                  }}
                />

                {/* Resume Card */}
                <div
                  className="hero-resume absolute bg-white"
                  style={{
                    top: '12%',
                    right: '18%',
                    width: '280px',
                    padding: '28px 24px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                    borderRadius: '3px',
                    transform: 'rotate(-6deg)',
                    opacity: 0,
                  }}
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
                    <div key={i} className={i < 2 ? 'mb-5' : ''}>
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
                </div>

                {/* Score Badge */}
                <div
                  className="hero-score absolute bg-white rounded-full flex flex-col items-center justify-center"
                  style={{
                    top: '6%',
                    right: '12%',
                    width: '88px',
                    height: '88px',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12)',
                    opacity: 0,
                  }}
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
                </div>
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
              ].map((feature, i) => (
                <div key={i} className="group">
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
              className="inline-flex items-center text-[17px] font-medium tracking-wide transition-all duration-300"
              style={{
                color: '#fff',
                backgroundColor: '#C46B48',
                padding: '16px 40px',
                borderRadius: '2px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#A85A3C';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#C46B48';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
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
                  className="text-[15px] transition-colors duration-300"
                  style={{ color: '#8A847A' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#C46B48'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#8A847A'}
                >
                  {item}
                </Link>
              ))}
            </div>
            <span
              className="text-[13px]"
              style={{ color: '#A8A29E' }}
            >
              © 2026
            </span>
          </div>
        </footer>
      </div>

      {/* Animations */}
      <style jsx>{`
        .hero-section.loaded .hero-label {
          animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards;
        }
        .hero-section.loaded .hero-headline {
          animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards;
        }
        .hero-section.loaded .hero-description {
          animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.35s forwards;
        }
        .hero-section.loaded .hero-cta {
          animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards;
        }
        .hero-section.loaded .hero-shape {
          animation: shapeIn 1s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards;
        }
        .hero-section.loaded .hero-resume {
          animation: resumeIn 1s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards;
        }
        .hero-section.loaded .hero-score {
          animation: scoreIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.8s forwards;
        }
        .hero-section.loaded .hero-decor-1 {
          animation: decorIn 0.6s ease-out 0.9s forwards;
        }
        .hero-section.loaded .hero-decor-2 {
          animation: decorIn 0.6s ease-out 1s forwards;
        }
        .hero-section.loaded .hero-decor-3 {
          animation: decorIn 0.6s ease-out 1.1s forwards;
        }

        @keyframes fadeUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shapeIn {
          to {
            opacity: 1;
            transform: rotate(-8deg);
          }
        }
        @keyframes resumeIn {
          0% {
            opacity: 0;
            transform: translateY(40px) rotate(-6deg);
          }
          100% {
            opacity: 1;
            transform: translateY(0) rotate(-6deg);
          }
        }
        @keyframes scoreIn {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes decorIn {
          to {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
