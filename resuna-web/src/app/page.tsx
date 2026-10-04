import Link from "next/link";
import { ArrowRight, FileText, Globe2, SearchCheck } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { THEME } from "@/lib/theme";

const features = [
  {
    title: "Editor de currículos",
    description: "Organize sua trajetória em um currículo claro, profissional e fácil de adaptar.",
    href: "/signup",
    icon: FileText,
  },
  {
    title: "Tradução para inglês",
    description: "Prepare uma versão em inglês mantendo as informações e a estrutura do currículo.",
    href: "/signup",
    icon: Globe2,
  },
  {
    title: "Analisador ATS",
    description: "Compare seu currículo em PDF com os requisitos de uma vaga.",
    href: "/resumes/upload",
    icon: SearchCheck,
  },
];

function ResumeSheet() {
  return (
    <article aria-label="Exemplo de currículo sem imagens e em uma coluna" className="relative z-10 mx-auto w-full max-w-[510px] border border-stone-200 bg-white p-7 shadow-md sm:p-10 lg:rotate-[1.5deg]">
      <header className="border-b border-stone-300 pb-4 text-center">
        <p className="font-display text-2xl font-semibold tracking-tight text-stone-900">Mariana Costa</p>
        <p className="mt-1 text-xs text-stone-600">Product Designer · São Paulo, SP · mariana@email.com</p>
        <p className="mt-1 text-xs text-stone-600">linkedin.com/in/marianacosta · github.com/marianacosta</p>
      </header>
      <section className="mt-5">
        <h2 className="border-b border-stone-200 pb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#a64b28]">Resumo profissional</h2>
        <p className="mt-2 text-[11px] leading-relaxed text-stone-700">Designer de produto com experiência em pesquisa, interfaces digitais e colaboração com equipes multidisciplinares.</p>
      </section>
      <section className="mt-5">
        <h2 className="border-b border-stone-200 pb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#a64b28]">Experiência profissional</h2>
        <div className="mt-2 text-[11px] leading-relaxed text-stone-700">
          <p><strong>Product Designer Sênior · InovaTech</strong></p>
          <p className="text-stone-500">2022 – atual · São Paulo, SP</p>
          <p className="mt-1">Liderança de projetos de experiência digital e evolução de produtos.</p>
        </div>
        <div className="mt-3 text-[11px] leading-relaxed text-stone-700">
          <p><strong>Product Designer · Estúdio Norte</strong></p>
          <p className="text-stone-500">2020 – 2022 · Remoto</p>
          <p className="mt-1">Pesquisa com usuários e criação de interfaces acessíveis.</p>
        </div>
      </section>
      <section className="mt-5">
        <h2 className="border-b border-stone-200 pb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#a64b28]">Formação</h2>
        <p className="mt-2 text-[11px] leading-relaxed text-stone-700"><strong>Design Digital</strong> · Universidade de São Paulo · 2020</p>
      </section>
      <section className="mt-5">
        <h2 className="border-b border-stone-200 pb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#a64b28]">Habilidades</h2>
        <p className="mt-2 text-[11px] leading-relaxed text-stone-700">Pesquisa com usuários · Figma · Prototipação · Acessibilidade</p>
      </section>
    </article>
  );
}

export default function Home() {
  return (
    <div className={`min-h-screen overflow-hidden bg-[#f7f5ef] ${THEME.fontBody} text-stone-900`}>
      <Header />
      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-28 sm:px-8 lg:min-h-[690px] lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:pb-24 lg:pt-32">
          <div className="relative z-10 max-w-xl">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-[#a64b28]">Currículos para sua próxima etapa</p>
            <h1 className="font-display text-5xl font-medium leading-[1.04] tracking-tight text-[#252522] sm:text-6xl lg:text-[4.25rem]">
              Seu próximo capítulo começa com um currículo melhor.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-stone-600 sm:text-lg">
              Crie um currículo profissional, traduza para inglês e compare com as vagas que interessam.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/signup" className="btn-primary h-12 gap-2 px-6 text-base">
                Criar currículo <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <span className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/70 px-3 py-2 text-xs font-medium text-stone-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" /> Sempre gratuito
              </span>
            </div>
          </div>
          <div className="relative px-2 py-4 sm:px-8 lg:px-12">
            <div aria-hidden="true" className="absolute inset-x-8 top-12 bottom-8 z-0 -rotate-3 border border-[#e8d8cc] bg-[#f0e5dc]" />
            <ResumeSheet />
          </div>
        </section>

        <section id="features" className="border-y border-stone-200 bg-white/70 px-5 py-16 sm:px-8 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a64b28]">Resuna</p>
              <h2 className="mt-3 font-display text-3xl font-medium tracking-tight sm:text-4xl">Tudo para apresentar bem sua experiência.</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {features.map(({ title, description, href, icon: Icon }) => (
                <Link key={title} href={href} className="group rounded-xl border border-stone-200 bg-white p-6 transition-colors hover:border-[#d4a18a] hover:bg-[#fffdfa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600">
                  <Icon className="h-5 w-5 text-[#a64b28]" strokeWidth={1.7} aria-hidden="true" />
                  <h3 className="mt-5 font-display text-xl font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-stone-600">{description}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#a64b28]">Conhecer <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" /></span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-16 text-center sm:px-8 lg:py-20">
          <h2 className="font-display text-3xl font-medium tracking-tight">Vamos criar o seu?</h2>
          <Link href="/signup" className="btn-primary mt-6 h-12 px-6">Criar currículo</Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
