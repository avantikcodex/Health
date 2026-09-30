"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  FlaskConical,
  Hospital,
  KeyRound,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  User,
} from "lucide-react";
import { api } from "@/lib/api";

const DEMO_ACCOUNTS = [
  {
    role: "PATIENT",
    name: "Rahul Verma",
    id: "rahul@patient.com",
    badge: "Patient",
    redirect: "/patient/dashboard",
    icon: User,
  },
  {
    role: "DOCTOR",
    name: "Dr. Ananya Sharma",
    id: "dr.ananya@citycare.com",
    badge: "Cardiology OPD",
    redirect: "/doctor/cockpit",
    icon: Stethoscope,
  },
  {
    role: "LAB_TECH",
    name: "Amit Desai",
    id: "lab@citycare.com",
    badge: "Diagnostics",
    redirect: "/lab",
    icon: FlaskConical,
  },
  {
    role: "HOSPITAL_ADMIN",
    name: "Suresh Menon",
    id: "admin@citycare.com",
    badge: "Hospital Ops",
    redirect: "/hospital/operations",
    icon: Hospital,
  },
  {
    role: "SUPER_ADMIN",
    name: "CareFlow Admin",
    id: "superadmin@careflow.com",
    badge: "Platform Admin",
    redirect: "/admin",
    icon: ShieldCheck,
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("rahul@patient.com");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent, customId?: string, customPass?: string, redirectPath?: string) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    const targetId = customId || identifier;
    const targetPass = customPass || password;

    try {
      const res = await api.post<any>("/auth/login", {
        identifier: targetId,
        password: targetPass,
      });

      api.setToken(res.access_token);

      // Determine redirect path
      let dest = redirectPath || "/patient/dashboard";
      if (!redirectPath) {
        const userRole = res.user?.role;
        if (userRole === "DOCTOR") dest = "/doctor/cockpit";
        else if (userRole === "LAB_TECH") dest = "/lab";
        else if (userRole === "HOSPITAL_ADMIN") dest = "/hospital/operations";
        else if (userRole === "SUPER_ADMIN") dest = "/admin";
      }

      router.push(dest);
    } catch (err: any) {
      setError(err?.message || "Invalid credentials. Please verify phone/email and password.");
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setIdentifier(acc.id);
    setPassword("password123");
    handleLogin(undefined, acc.id, "password123", acc.redirect);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-emerald-50/20 to-slate-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-600/20 group-hover:scale-105 transition-transform">
              <Activity className="w-7 h-7 stroke-[2.5]" />
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Welcome to CareFlow
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Sign in to access your sovereign healthcare journey & clinical tools.
          </p>
        </div>

        {/* 1-Click Quick Demo Sign-In */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>1-Click Instant Demo Login</span>
            </span>
            <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Hackathon Ready
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.slice(0, 4).map((acc) => {
              const Icon = acc.icon;
              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => quickLogin(acc)}
                  className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 text-left transition-all group"
                >
                  <div className="w-7 h-7 rounded-lg bg-white shadow-2xs flex items-center justify-center text-emerald-700 shrink-0 group-hover:scale-105">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="font-bold text-xs text-slate-900 truncate">{acc.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{acc.badge}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => quickLogin(DEMO_ACCOUNTS[4])}
            className="w-full p-2 rounded-xl bg-slate-50 hover:bg-purple-50 hover:border-purple-300 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition-all"
          >
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>Login as Platform Super Admin</span>
          </button>
        </div>

        {/* Credentials Login Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium animate-in fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Phone Number or Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. rahul@patient.com or 9876543210"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Password</label>
                <span className="text-[11px] text-emerald-700 hover:underline cursor-pointer">
                  Forgot?
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/25 disabled:opacity-50 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
              >
                {loading ? "Signing in..." : "Sign In to CareFlow"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="pt-2 text-center border-t border-slate-100">
            <p className="text-xs text-slate-500">
              New to CareFlow?{" "}
              <Link href="/signup" className="font-bold text-emerald-700 hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>ABDM & DPDP Act 2023 Sovereign Data Protection</span>
        </div>
      </div>
    </div>
  );
}
