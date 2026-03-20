"use client";

import Link from "next/link";
import { FileText, Twitter, Github, Linkedin, Mail } from "lucide-react";

export function Footer() {
  const footerLinks = {
    Legal: [
      { label: "Privacidade", href: "/privacy" },
      { label: "Termos", href: "/terms" },
      { label: "Política de Cookies", href: "/cookies" },
    ],
  };

  const socialLinks = [
    { icon: Twitter, href: "https://x.com/pythinkpad", label: "X" },
    { icon: Github, href: "https://github.com/lirielc/resuna-web", label: "GitHub" },
  ];

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="container-custom py-12 lg:py-16">
        <div className="flex flex-col md:flex-row justify-between gap-12">
          {/* Brand */}
          <div className="max-w-sm">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Resuna</span>
            </Link>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs mb-4">
              Crie currículos otimizados para ATS que geram mais entrevistas. Construtor de currículos com IA para candidatos modernos.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-gray-800 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} Resuna. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              Privacidade
            </Link>
            <Link href="/terms" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              Termos
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
