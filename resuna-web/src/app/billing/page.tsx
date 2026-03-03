"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  Check,
  CreditCard,
  Calendar,
  Zap,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function BillingPage() {
  const subscription = {
    plan: "Premium",
    status: "active",
    price: "$9.99",
    interval: "month",
    nextBilling: "February 15, 2024",
    paymentMethod: {
      brand: "visa",
      last4: "4242",
      expMonth: 12,
      expYear: 2025,
    },
  };

  const usage = {
    resumes: { used: 3, limit: "Unlimited" },
    analyses: { used: 12, limit: "Unlimited" },
    refines: { used: 5, limit: "Unlimited" },
  };

  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />

      <main className="pt-24 lg:pt-28 pb-16">
        <div className="container-custom max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Billing & Subscription
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Manage your subscription and payment methods
            </p>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Current Plan */}
                <Card variant="featured">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="premium">Current Plan</Badge>
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                          Active
                        </span>
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {subscription.plan}
                      </h2>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {subscription.price}
                      </p>
                      <p className="text-gray-500 text-sm">/{subscription.interval}</p>
                    </div>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {[
                      "Unlimited resumes",
                      "AI refinement",
                      "Job analysis",
                      "Cover letter generator",
                      "Priority support",
                    ].map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                      >
                        <Check className="w-4 h-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button variant="secondary">
                      Change Plan
                    </Button>
                    <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                      Cancel Subscription
                    </Button>
                  </div>
                </Card>

                {/* Payment Method */}
                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Payment Method
                    </h3>
                    <Button variant="ghost" size="sm">
                      Update
                    </Button>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs">
                      VISA
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        •••• •••• •••• {subscription.paymentMethod.last4}
                      </p>
                      <p className="text-sm text-gray-500">
                        Expires {subscription.paymentMethod.expMonth}/
                        {subscription.paymentMethod.expYear}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Billing History */}
                <Card>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                    Billing History
                  </h3>

                  <div className="space-y-3">
                    {[
                      { date: "Jan 15, 2024", amount: "$9.99", status: "Paid" },
                      { date: "Dec 15, 2023", amount: "$9.99", status: "Paid" },
                      { date: "Nov 15, 2023", amount: "$9.99", status: "Paid" },
                    ].map((invoice, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <Calendar className="w-4 h-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                              Premium Plan
                            </p>
                            <p className="text-xs text-gray-500">{invoice.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {invoice.amount}
                          </span>
                          <Badge variant="success">{invoice.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Usage */}
                <Card>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                    Usage This Month
                  </h3>

                  <div className="space-y-4">
                    {Object.entries(usage).map(([key, value]) => (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                            {key}
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {value.used} / {value.limit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Next Billing */}
                <Card>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Next billing</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {subscription.nextBilling}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    You'll be charged {subscription.price} on this date
                  </p>
                </Card>

                {/* Need Help */}
                <Card variant="outline">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Need help?
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Contact our support team for billing assistance.
                  </p>
                  <Link
                    href="/support"
                    className="text-sm text-orange-600 font-medium hover:underline"
                  >
                    Contact Support →
                  </Link>
                </Card>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  
    </ProtectedRoute>);
}
