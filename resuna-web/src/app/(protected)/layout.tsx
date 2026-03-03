"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ReactNode } from "react";

/**
 * Layout for all protected routes
 * Any route inside the (protected) folder will require authentication
 */
export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
