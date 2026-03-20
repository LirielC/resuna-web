"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Menu,
  X,
  ChevronRight,
  LogOut,
  User,
  FileStack,
  Shield,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";

export function Header() {
  const { user, loading, isAdmin, signOut } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsUserMenuOpen(false);
      router.push("/");
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error("Error signing out:", error);
      }
    }
  };



  const navLinks = user
    ? [
      { href: "/resumes", label: t("header.archives") },
    ]
    : [
      { href: "/#features", label: t("header.features") },
    ];

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
          ? "glass shadow-sm"
          : "bg-transparent"
          }`}
      >
        <div className="container-custom">
          <nav className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                Resuna
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-stone-600 hover:text-orange-600 transition-colors dark:text-stone-400 dark:hover:text-orange-400"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="hidden md:flex items-center gap-4">
              {loading ? (
                <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-700 animate-pulse" />
              ) : user ? (
                /* User Logged In */
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                  >
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || "User"}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-semibold">
                        {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                      </div>
                    )}
                    <span className="text-sm font-medium text-stone-700 dark:text-stone-200 hidden lg:block">
                      {user.displayName?.split(" ")[0] || "User"}
                    </span>
                  </button>

                  {/* User Dropdown Menu */}
                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-56 bg-white dark:bg-stone-900 rounded-xl shadow-lg border border-stone-200 dark:border-stone-700 py-2 overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800">
                          <p className="text-sm font-semibold text-stone-900 dark:text-white truncate">
                            {user.displayName}
                          </p>
                          <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                            {user.email}
                          </p>
                        </div>
                        <div className="py-1">
                          <Link
                            href="/resumes"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                          >
                            <FileStack className="w-4 h-4" />
                            {t("header.myResumes")}
                          </Link>
                          <Link
                            href="/account"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                          >
                            <User className="w-4 h-4" />
                            {t("header.account")}
                          </Link>
                          {isAdmin && (
                            <Link
                              href="/admin"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2 text-sm text-orange-700 hover:bg-orange-50 dark:hover:bg-stone-800"
                            >
                              <Shield className="w-4 h-4" />
                              Admin
                            </Link>
                          )}
                        </div>
                        <div className="border-t border-stone-100 dark:border-stone-800 py-1">
                          <button
                            onClick={handleSignOut}
                            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <LogOut className="w-4 h-4" />
                            {t("header.signOut")}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                /* User Not Logged In */
                <>
                  <Link
                    href="/login"
                    className="text-sm font-semibold text-stone-700 hover:text-orange-600 transition-colors dark:text-stone-200"
                  >
                    {t("header.logIn")}
                  </Link>
                  <Link
                    href="/login"
                    className="btn-primary text-sm"
                  >
                    {t("header.getStarted")}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </>
              )}
            </div>

            {/* Mobile right-side actions */}
            <div className="md:hidden flex items-center gap-2">
              {!user && (
                <Link
                  href="/login"
                  className="text-sm font-semibold px-3 py-1.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-100 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-800 transition-colors"
                >
                  {t("header.logIn")}
                </Link>
              )}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                aria-label="Toggle menu"
              >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
              </button>
            </div>
          </nav>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 z-40 md:hidden bg-[#F8F6F1] border-b border-stone-200 dark:bg-stone-900 dark:border-stone-800 shadow-xl overflow-y-auto max-h-[calc(100vh-4rem)]"
          >
            <div className="container-custom py-4 space-y-4">
              {/* User info in mobile */}
              {user && (
                <div className="flex items-center gap-3 pb-4 border-b border-stone-200 dark:border-stone-700">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || "User"}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-semibold">
                      {user.displayName?.charAt(0) || "U"}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-stone-900 dark:text-white">{user.displayName}</p>
                    <p className="text-sm text-stone-500">{user.email}</p>
                  </div>
                </div>
              )}

              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2 text-base font-medium text-stone-700 hover:text-orange-600 dark:text-stone-200"
                >
                  {link.label}
                </Link>
              ))}

              {user && (
                <>
                  <Link
                    href="/resumes"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-2 text-base font-medium text-stone-700 hover:text-orange-600 dark:text-stone-200"
                  >
                    {t("header.myResumes")}
                  </Link>
                  <Link
                    href="/account"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-2 text-base font-medium text-stone-700 hover:text-orange-600 dark:text-stone-200"
                  >
                    {t("header.account")}
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block py-2 text-base font-medium text-orange-700 hover:text-orange-800 dark:text-orange-400"
                    >
                      Admin
                    </Link>
                  )}
                </>
              )}

              <hr className="border-stone-200 dark:border-stone-700" />
              <div className="flex flex-col gap-3">
                {user ? (
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="btn-secondary w-full justify-center text-red-600"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {t("header.signOut")}
                  </button>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="btn-secondary w-full justify-center"
                    >
                      {t("header.logIn")}
                    </Link>
                    <Link
                      href="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="btn-primary w-full justify-center"
                    >
                      {t("header.getStarted")}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
