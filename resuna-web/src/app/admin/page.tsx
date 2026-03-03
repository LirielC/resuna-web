"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

interface DashboardStats {
    totalUsers: number;
    activeToday: number;
    activeWeek: number;
    activeMonth: number;
    activitiesToday: number;
    actionBreakdown: Record<string, number>;
}

interface Activity {
    id: number;
    userId: string;
    userEmail: string;
    action: string;
    details: string;
    ipAddress: string;
    timestamp: string;
}

interface UserInfo {
    userId: string;
    email: string;
    lastActivity: string;
}

interface UserUsage {
    userId: string;
    email: string | null;
    totalRequests: number;
    lastActivity: string | null;
    creditsRemaining?: number;
    creditsUsed?: number;
    subscriptionStatus?: string;
    subscriptionTier?: string;
}

interface UserProfile {
    userId: string;
    email: string;
    name: string | null;
    createdAt: string;
    lastLogin: string;
}

interface UsageAggregate {
    id: string;
    periodType: string;
    periodKey: string;
    userId?: string | null;
    totalRequests: number;
    actionCounts: Record<string, number>;
    updatedAt: string;
}

interface BillingEvent {
    id: string;
    userId: string;
    credits: number;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
}

interface FeatureFlags {
    userId: string;
    aiEnabled: boolean;
    atsEnabled: boolean;
}

export default function AdminDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [users, setUsers] = useState<UserInfo[]>([]);
    const [userUsage, setUserUsage] = useState<UserUsage[]>([]);
    const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
    const [usageAggregates, setUsageAggregates] = useState<UsageAggregate[]>([]);
    const [billingEvents, setBillingEvents] = useState<BillingEvent[]>([]);
    const [featureFlags, setFeatureFlags] = useState<Record<string, FeatureFlags>>({});
    const [activeTab, setActiveTab] = useState<
        "overview" | "activities" | "users" | "profiles" | "usage" | "billing" | "flags"
    >("overview");
    const [error, setError] = useState<string | null>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                router.push("/login");
                return;
            }
            setUser(currentUser);

            // Check if user is admin via custom claims
            const tokenResult = await currentUser.getIdTokenResult();
            if (tokenResult.claims.admin) {
                setIsAdmin(true);
                fetchDashboardData(await currentUser.getIdToken());
            } else {
                setIsAdmin(false);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router]);

    const fetchDashboardData = async (token: string) => {
        try {
            setLoading(true);

            // Fetch stats
            const statsRes = await fetch(`${API_URL}/api/admin/stats`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (statsRes.ok) {
                setStats(await statsRes.json());
            }

            // Fetch recent activities
            const activitiesRes = await fetch(`${API_URL}/api/admin/activities?page=0&size=20`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (activitiesRes.ok) {
                const data = await activitiesRes.json();
                setActivities(data.content || []);
            }

            // Fetch users
            const usersRes = await fetch(`${API_URL}/api/admin/users`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (usersRes.ok) {
                const usersData = await usersRes.json();
                setUsers(
                    usersData.map((row: any) => ({
                        userId: row.userId,
                        email: row.email,
                        lastActivity: row.lastActivity,
                    }))
                );
            }

            const usageRes = await fetch(`${API_URL}/api/admin/users/usage?days=30`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (usageRes.ok) {
                setUserUsage(await usageRes.json());
            }

            const profilesRes = await fetch(`${API_URL}/api/admin/users/profiles`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (profilesRes.ok) {
                const profiles = await profilesRes.json();
                setUserProfiles(profiles);
                await fetchFeatureFlags(token, profiles);
            }

            const aggregatesRes = await fetch(`${API_URL}/api/admin/usage-aggregates?periodType=day&days=30`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (aggregatesRes.ok) {
                setUsageAggregates(await aggregatesRes.json());
            }

            const billingRes = await fetch(`${API_URL}/api/admin/billing-events?limit=50`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (billingRes.ok) {
                setBillingEvents(await billingRes.json());
            }
        } catch (err) {
            setError("Failed to load dashboard data");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        return date.toLocaleString("en-US", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const fetchFeatureFlags = async (token: string, profiles: UserProfile[]) => {
        const results: Record<string, FeatureFlags> = {};
        await Promise.all(
            profiles.map(async (profile) => {
                const res = await fetch(`${API_URL}/api/admin/feature-flags/${profile.userId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const flags = await res.json();
                    results[profile.userId] = flags;
                }
            })
        );
        setFeatureFlags(results);
    };

    const updateFeatureFlags = async (userId: string, aiEnabled: boolean, atsEnabled: boolean) => {
        if (!user) return;
        const token = await user.getIdToken();
        const res = await fetch(`${API_URL}/api/admin/feature-flags/${userId}`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ aiEnabled, atsEnabled }),
        });
        if (res.ok) {
            const updated = await res.json();
            setFeatureFlags((prev) => ({ ...prev, [userId]: updated }));
        }
    };

    const getActionColor = (action: string) => {
        const colors: Record<string, string> = {
            CREATE_RESUME: "bg-orange-50 text-orange-700 border-orange-200",
            UPDATE_RESUME: "bg-blue-50 text-blue-700 border-blue-200",
            DELETE_RESUME: "bg-red-50 text-red-700 border-red-200",
            EXPORT_PDF: "bg-stone-100 text-stone-700 border-stone-200",
            EXPORT_DOCX: "bg-stone-100 text-stone-700 border-stone-200",
            ATS_ANALYSIS: "bg-green-50 text-green-700 border-green-200",
            ATS_ANALYSIS_PDF: "bg-green-50 text-green-700 border-green-200",
            LOGIN: "bg-gray-50 text-gray-700 border-gray-200",
            PURCHASE_BLOCKED: "bg-red-50 text-red-700 border-red-200",
            PURCHASE_PENDING: "bg-amber-50 text-amber-700 border-amber-200",
            PURCHASE_SUCCESS: "bg-green-50 text-green-700 border-green-200",
        };
        return colors[action] || "bg-gray-50 text-gray-600 border-gray-200";
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8F6F1] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
                    <p className="font-serif text-stone-600 italic">Accessing Archives...</p>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-[#F8F6F1] flex items-center justify-center p-4">
                <div className="bg-white border border-red-200 rounded-lg p-12 text-center max-w-md shadow-sm">
                    <div className="text-4xl mb-6">🔒</div>
                    <h1 className="text-3xl font-serif text-stone-900 mb-4">Restricted Access</h1>
                    <p className="text-stone-600 mb-8 leading-relaxed">
                        This area is reserved for administrators only. Please return to the main dashboard.
                    </p>
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="px-8 py-3 bg-stone-900 text-white font-serif hover:bg-stone-800 transition-colors rounded-sm"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F6F1] text-stone-900 font-serif">
            {/* Texture Overlay */}
            <div
                className="fixed inset-0 pointer-events-none opacity-[0.03] z-0"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                }}
            />

            {/* Header */}
            <header className="relative z-10 border-b border-stone-200 bg-[#F8F6F1]/90 backdrop-blur-sm sticky top-0">
                <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <h1 className="text-2xl font-display font-semibold text-stone-900 tracking-tight">
                            Resuna<span className="text-orange-600">.</span> Admin
                        </h1>
                        <span className="hidden sm:inline-block h-6 w-px bg-stone-300"></span>
                        <span className="hidden sm:inline-block font-mono text-xs tracking-wider text-stone-500 uppercase">
                            Overview
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-stone-600 hidden sm:inline-block">
                            {user?.email}
                        </span>
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="text-sm font-medium text-orange-700 hover:text-orange-800 transition-colors hover:underline underline-offset-4"
                        >
                            Exit
                        </button>
                    </div>
                </div>
            </header>

            <main className="relative z-10 max-w-7xl mx-auto px-6 py-10">
                {error && (
                    <div className="mb-8 p-4 bg-red-50 text-red-700 border border-red-200 rounded-sm">
                        {error}
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-8 mb-10 border-b border-stone-200 pb-1">
                    {[
                        { id: "overview", label: "Overview" },
                        { id: "activities", label: "Activity Log" },
                        { id: "users", label: "User Directory" },
                        { id: "profiles", label: "Profiles" },
                        { id: "usage", label: "Usage" },
                        { id: "billing", label: "Billing" },
                        { id: "flags", label: "Feature Flags" },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`pb-3 text-lg transition-all relative ${activeTab === tab.id
                                    ? "text-stone-900 font-medium"
                                    : "text-stone-400 hover:text-stone-600"
                                }`}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-orange-600"></span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Overview Tab */}
                {activeTab === "overview" && stats && (
                    <div className="space-y-12 animate-fade-in-up">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <EditorialStatCard
                                title="Total Users"
                                value={stats.totalUsers}
                                label="Registered accounts"
                            />
                            <EditorialStatCard
                                title="Active Today"
                                value={stats.activeToday}
                                label="Unique sessions"
                                highlight
                            />
                            <EditorialStatCard
                                title="Active This Week"
                                value={stats.activeWeek}
                                label="7-day engagement"
                            />
                            <EditorialStatCard
                                title="Activities Today"
                                value={stats.activitiesToday}
                                label="Total actions logged"
                            />
                        </div>

                        {/* Action Breakdown */}
                        <div className="border border-stone-200 bg-white p-8 rounded-sm shadow-sm">
                            <h2 className="text-2xl font-display mb-8 text-stone-900 border-b border-stone-100 pb-4">
                                Activity Breakdown <span className="text-stone-400 text-lg font-normal ml-2">(30 Days)</span>
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {Object.entries(stats.actionBreakdown).map(([action, count]) => (
                                    <div
                                        key={action}
                                        className="p-4 border border-stone-100 hover:border-orange-200 hover:bg-orange-50/30 transition-colors rounded-sm group"
                                    >
                                        <div className="text-3xl font-display font-semibold text-stone-900 mb-2 group-hover:text-orange-700 transition-colors">
                                            {count}
                                        </div>
                                        <div className="text-xs font-mono uppercase tracking-wider text-stone-500">
                                            {action.replace(/_/g, " ")}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Blocked Purchases */}
                        <div className="border border-stone-200 bg-white p-8 rounded-sm shadow-sm">
                            <h2 className="text-2xl font-display mb-6 text-stone-900 border-b border-stone-100 pb-4">
                                Purchase Blocks <span className="text-stone-400 text-lg font-normal ml-2">(Recent)</span>
                            </h2>
                            <div className="space-y-3">
                                {activities
                                    .filter((activity) => activity.action === "PURCHASE_BLOCKED")
                                    .slice(0, 8)
                                    .map((activity) => (
                                        <div
                                            key={activity.id}
                                            className="flex items-center justify-between gap-4 p-3 border border-stone-100 rounded-sm"
                                        >
                                            <div>
                                                <div className="text-sm font-medium text-stone-900">
                                                    {activity.userEmail || activity.userId || "Unknown user"}
                                                </div>
                                                <div className="text-xs text-stone-500">
                                                    {activity.details || "Blocked purchase"}
                                                </div>
                                            </div>
                                            <div className="text-xs text-stone-400">
                                                {formatDate(activity.timestamp)}
                                            </div>
                                        </div>
                                    ))}
                                {activities.filter((activity) => activity.action === "PURCHASE_BLOCKED").length === 0 && (
                                    <div className="text-sm text-stone-500 italic">
                                        No blocked purchases recorded.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Activities Tab */}
                {activeTab === "activities" && (
                    <div className="border border-stone-200 bg-white rounded-sm shadow-sm overflow-hidden animate-fade-in-up">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-stone-50 border-b border-stone-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-mono font-medium text-stone-500 uppercase tracking-widest">
                                            Action
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-mono font-medium text-stone-500 uppercase tracking-widest">
                                            User
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-mono font-medium text-stone-500 uppercase tracking-widest">
                                            Details
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-mono font-medium text-stone-500 uppercase tracking-widest">
                                            Timestamp
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {activities.map((activity) => (
                                        <tr key={activity.id} className="hover:bg-stone-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getActionColor(activity.action)}`}
                                                >
                                                    {activity.action.replace(/_/g, " ")}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-stone-900">
                                                    {activity.userEmail || "Anonymous"}
                                                </div>
                                                <div className="text-xs text-stone-400 font-mono mt-1">
                                                    {activity.ipAddress}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-stone-600 max-w-xs truncate font-mono">
                                                {activity.details || "-"}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-stone-500">
                                                {formatDate(activity.timestamp)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {activities.length === 0 && (
                                <div className="p-16 text-center">
                                    <p className="text-stone-400 italic font-serif text-lg">No records found within this timeframe.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Users Tab */}
                {activeTab === "users" && (
                    <div className="border border-stone-200 bg-white rounded-sm shadow-sm overflow-hidden animate-fade-in-up">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-stone-50 border-b border-stone-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-mono font-medium text-stone-500 uppercase tracking-widest">
                                            User
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-mono font-medium text-stone-500 uppercase tracking-widest">
                                            User ID
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-mono font-medium text-stone-500 uppercase tracking-widest">
                                            Last Seen
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {users.map((u, i) => (
                                        <tr key={i} className="hover:bg-stone-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-600 font-display text-lg">
                                                        {u.email?.[0]?.toUpperCase() || "?"}
                                                    </div>
                                                    <span className="font-medium text-stone-900">{u.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-mono text-stone-500">
                                                {u.userId}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-stone-600">
                                                {formatDate(u.lastActivity)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {users.length === 0 && (
                                <div className="p-16 text-center">
                                    <p className="text-stone-400 italic font-serif text-lg">No users registered yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Profiles Tab */}
                {activeTab === "profiles" && (
                    <div className="border border-stone-200 bg-white rounded-sm shadow-sm overflow-hidden animate-fade-in-up">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-stone-50 border-b border-stone-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-mono font-medium text-stone-500 uppercase tracking-widest">
                                            User
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-mono font-medium text-stone-500 uppercase tracking-widest">
                                            Created
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-mono font-medium text-stone-500 uppercase tracking-widest">
                                            Last Login
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {userProfiles.map((profile) => (
                                        <tr key={profile.userId} className="hover:bg-stone-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-stone-900">{profile.email}</div>
                                                <div className="text-xs text-stone-500">{profile.name || "-"}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-stone-600">
                                                {formatDate(profile.createdAt)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-stone-600">
                                                {formatDate(profile.lastLogin)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {userProfiles.length === 0 && (
                                <div className="p-16 text-center">
                                    <p className="text-stone-400 italic font-serif text-lg">No profiles available.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Usage Tab */}
                {activeTab === "usage" && (
                    <div className="border border-stone-200 bg-white rounded-sm shadow-sm overflow-hidden animate-fade-in-up">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-stone-50 border-b border-stone-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-mono font-medium text-stone-500 uppercase tracking-widest">
                                            User
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-mono font-medium text-stone-500 uppercase tracking-widest">
                                            Requests (30d)
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-mono font-medium text-stone-500 uppercase tracking-widest">
                                            Credits
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-mono font-medium text-stone-500 uppercase tracking-widest">
                                            Last Activity
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {userUsage.map((entry) => (
                                        <tr key={entry.userId} className="hover:bg-stone-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-stone-900">{entry.email || entry.userId}</div>
                                                <div className="text-xs text-stone-500">{entry.subscriptionTier}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-stone-600">
                                                {entry.totalRequests ?? 0}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-stone-600">
                                                {entry.creditsRemaining ?? 0} remaining / {entry.creditsUsed ?? 0} used
                                            </td>
                                            <td className="px-6 py-4 text-sm text-stone-600">
                                                {entry.lastActivity ? formatDate(entry.lastActivity) : "-"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {userUsage.length === 0 && (
                                <div className="p-16 text-center">
                                    <p className="text-stone-400 italic font-serif text-lg">No usage records available.</p>
                                </div>
                            )}
                        </div>
                        {usageAggregates.length > 0 && (
                            <div className="border-t border-stone-200 bg-stone-50/50 px-6 py-6">
                                <h3 className="text-sm font-mono uppercase tracking-widest text-stone-500 mb-4">
                                    Global Usage Aggregates (Daily)
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {usageAggregates
                                        .filter((agg) => !agg.userId)
                                        .slice(0, 6)
                                        .map((agg) => (
                                            <div key={agg.id} className="border border-stone-200 bg-white p-4 rounded-sm">
                                                <div className="text-xs text-stone-500 font-mono">{agg.periodKey}</div>
                                                <div className="text-2xl font-display text-stone-900">{agg.totalRequests}</div>
                                                <div className="text-xs text-stone-400">Total Requests</div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Billing Tab */}
                {activeTab === "billing" && (
                    <div className="border border-stone-200 bg-white rounded-sm shadow-sm overflow-hidden animate-fade-in-up">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-stone-50 border-b border-stone-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-mono font-medium text-stone-500 uppercase tracking-widest">
                                            User ID
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-mono font-medium text-stone-500 uppercase tracking-widest">
                                            Credits
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-mono font-medium text-stone-500 uppercase tracking-widest">
                                            Amount
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-mono font-medium text-stone-500 uppercase tracking-widest">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-mono font-medium text-stone-500 uppercase tracking-widest">
                                            Created
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {billingEvents.map((event) => (
                                        <tr key={event.id} className="hover:bg-stone-50 transition-colors">
                                            <td className="px-6 py-4 text-xs font-mono text-stone-500">
                                                {event.userId}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-stone-600">
                                                {event.credits}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-stone-600">
                                                {event.currency} {event.amount}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-stone-600">
                                                {event.status}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-stone-600">
                                                {formatDate(event.createdAt)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {billingEvents.length === 0 && (
                                <div className="p-16 text-center">
                                    <p className="text-stone-400 italic font-serif text-lg">No billing events found.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Feature Flags Tab */}
                {activeTab === "flags" && (
                    <div className="border border-stone-200 bg-white rounded-sm shadow-sm overflow-hidden animate-fade-in-up">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-stone-50 border-b border-stone-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-mono font-medium text-stone-500 uppercase tracking-widest">
                                            User
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-mono font-medium text-stone-500 uppercase tracking-widest">
                                            AI
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-mono font-medium text-stone-500 uppercase tracking-widest">
                                            ATS
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {userProfiles.map((profile) => {
                                        const flags = featureFlags[profile.userId];
                                        return (
                                            <tr key={profile.userId} className="hover:bg-stone-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-stone-900">{profile.email}</div>
                                                    <div className="text-xs text-stone-500">{profile.userId}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        className={`px-3 py-1 text-xs border rounded-sm ${flags?.aiEnabled
                                                                ? "bg-green-50 text-green-700 border-green-200"
                                                                : "bg-red-50 text-red-700 border-red-200"
                                                            }`}
                                                        onClick={() =>
                                                            updateFeatureFlags(profile.userId, !(flags?.aiEnabled ?? true), flags?.atsEnabled ?? true)
                                                        }
                                                    >
                                                        {flags?.aiEnabled ? "Enabled" : "Disabled"}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        className={`px-3 py-1 text-xs border rounded-sm ${flags?.atsEnabled
                                                                ? "bg-green-50 text-green-700 border-green-200"
                                                                : "bg-red-50 text-red-700 border-red-200"
                                                            }`}
                                                        onClick={() =>
                                                            updateFeatureFlags(profile.userId, flags?.aiEnabled ?? true, !(flags?.atsEnabled ?? true))
                                                        }
                                                    >
                                                        {flags?.atsEnabled ? "Enabled" : "Disabled"}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {userProfiles.length === 0 && (
                                <div className="p-16 text-center">
                                    <p className="text-stone-400 italic font-serif text-lg">No users to manage.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

function EditorialStatCard({
    title,
    value,
    label,
    highlight = false,
}: {
    title: string;
    value: number;
    label: string;
    highlight?: boolean;
}) {
    return (
        <div className={`relative p-8 bg-white border transition-all duration-300 group
            ${highlight ? 'border-orange-200 shadow-md' : 'border-stone-200 hover:border-stone-300'}`}
        >
            {/* Corner brackets */}
            <div className={`absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 transition-colors duration-300
                ${highlight ? 'border-orange-500' : 'border-stone-300 group-hover:border-stone-400'}`}
            />
            <div className={`absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 transition-colors duration-300
                ${highlight ? 'border-orange-500' : 'border-stone-300 group-hover:border-stone-400'}`}
            />

            <div className="mb-2 text-xs font-mono uppercase tracking-widest text-stone-500">
                {title}
            </div>
            <div className={`text-4xl font-display font-bold mb-2 
                ${highlight ? 'text-orange-600' : 'text-stone-900'}`}
            >
                {value}
            </div>
            <div className="text-sm font-serif italic text-stone-500">
                {label}
            </div>
        </div>
    );
}
