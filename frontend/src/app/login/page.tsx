"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe,
  HeartPulse,
  Hospital,
  KeyRound,
  Lock,
  Mail,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  User,
  Volume2,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  INDIAN_LANGUAGES,
  LanguageProvider,
  useLanguage,
} from "@/context/LanguageContext";
import {
  AccessibilityProvider,
  useAccessibility,
} from "@/context/AccessibilityContext";

const ROLE_PRESETS = [
  {
    role: "PATIENT",
    title: "Patient",
    name: "Rahul Verma",
    id: "rahul@patient.com",
    pass: "password123",
    badge: "ABDM Health Record",
    icon: User,
    color: "from-blue-500/20 to-cyan-500/10 text-cyan-400 border-cyan-500/30",
  },
  {
    role: "DOCTOR",
    title: "Doctor",
    name: "Dr. Ananya Sharma",
    id: "dr.ananya@citycare.com",
    pass: "password123",
    badge: "Cardiology OPD",
    icon: Stethoscope,
    color: "from-teal-500/20 to-emerald-500/10 text-teal-400 border-teal-500/30",
  },
  {
    role: "HOSPITAL_ADMIN",
    title: "Hospital Admin",
    name: "Amitabh Sen",
    id: "amit.admin@maxhealthcare.in",
    pass: "password123",
    badge: "Facility Control",
    icon: Hospital,
    color: "from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-500/30",
  },
  {
    role: "SUPER_ADMIN",
    title: "Super Admin",
    name: "Platform Chief",
    id: "edure6377@gmail.com",
    pass: "CareFlowAdmin#2026",
    badge: "Governance & Security",
    icon: ShieldCheck,
    color: "from-rose-500/20 to-red-500/10 text-rose-400 border-rose-500/30",
  },
];

function LoginForm() {
  const router = useRouter();
  const { currentLanguage, setLanguageCode, t } = useLanguage();
  const { simpleView, setSimpleView, speakText } = useAccessibility();

  const [identifier, setIdentifier] = useState("rahul@patient.com");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState("PATIENT");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectPreset = (preset: (typeof ROLE_PRESETS)[0]) => {
    setSelectedRole(preset.role);
    setIdentifier(preset.id);
    setPassword(preset.pass);
    setError(null);
    speakText(`Selected ${preset.title} profile`);
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post<any>("/auth/login", {
        identifier: identifier.trim(),
        password: password,
      });

      if (!res.access_token) {
        throw new Error("Invalid response from authorization server.");
      }

      api.setToken(res.access_token);

      // ZERO-TRUST ROUTING: Dictated STRICTLY by the backend-authenticated user role
      const authenticatedRole = res.user?.role;
      let destination = "/patient/dashboard";

      if (authenticatedRole === "SUPER_ADMIN") {
        destination = "/admin";
      } else if (authenticatedRole === "HOSPITAL_ADMIN") {
        destination = "/hospital-admin";
      } else if (authenticatedRole === "DOCTOR") {
        destination = "/doctor/cockpit";
      } else if (authenticatedRole === "LAB_TECH") {
        destination = "/lab";
      } else if (authenticatedRole === "RECEPTIONIST") {
        destination = "/hospital-admin/queue";
      } else {
        destination = "/patient/dashboard";
      }

      speakText(`Welcome, login successful. Loading ${authenticatedRole}`);
      router.push(destination);
    } catch (err: any) {
      setError(
        err?.message || "Invalid credentials. Please verify your email/phone and password."
      );
      speakText("Login failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Navbar: Brand, Language Picker, Simple View, Voice Assistance */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between gap-4 py-2">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-base text-white tracking-wide">CareFlow</span>
            <span className="block text-[10px] text-teal-400 font-mono">UNIFIED AUTH</span>
          </div>
        </Link>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Simple View Toggle */}
          <button
            onClick={() => setSimpleView((prev) => !prev)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              simpleView
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{simpleView ? t("normal_view", "Standard") : t("simple_view", "Elder / Simple")}</span>
          </button>

          {/* 22 Indian Languages */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
            <Globe className="w-3.5 h-3.5 text-teal-400 mr-1.5 shrink-0" />
            <select
              aria-label="Interface Language"
              value={currentLanguage.code}
              onChange={(e) => setLanguageCode(e.target.value)}
              className="bg-transparent text-xs text-slate-200 outline-none cursor-pointer pr-1"
            >
              {INDIAN_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-slate-900 text-slate-200">
                  {lang.nativeName} ({lang.name})
                </option>
              ))}
            </select>
          </div>

          {/* Voice Prompt Help */}
          <button
            onClick={() =>
              speakText(
                "Welcome to CareFlow Healthcare. Click your role card or enter your registered mobile number or email and password to sign in."
              )
            }
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-teal-400"
            title="Read instructions aloud"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Login Container */}
      <main className="max-w-4xl w-full mx-auto my-6 space-y-6">
        {/* Title */}
        <div className="text-center space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {t("welcome", "Welcome to CareFlow")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            {t("subtitle", "Unified Consent-Driven Healthcare Coordination Engine")}
          </p>
        </div>

        {/* 4 Role Selector Cards */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-semibold text-slate-300">{t("select_role", "Select Your Access Role")}</span>
            <span className="text-[11px] text-teal-400">{t("demo_credentials", "Auto-fills credentials")}</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ROLE_PRESETS.map((preset) => {
              const Icon = preset.icon;
              const isSelected = selectedRole === preset.role;

              return (
                <button
                  type="button"
                  key={preset.role}
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                    simpleView ? "min-h-[115px]" : "min-h-[100px]"
                  } ${
                    isSelected
                      ? `bg-slate-900 shadow-xl ${preset.color} ring-1 ring-teal-500/50`
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-slate-950/80 flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white mt-2">{preset.title}</div>
                    <div className="text-[11px] text-slate-400 truncate">{preset.name}</div>
                    <div className="text-[10px] font-mono mt-0.5 text-slate-500">{preset.badge}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Login Credentials Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl max-w-lg mx-auto">
          {error && (
            <div className="p-3.5 mb-5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {t("phone_or_email", "Mobile Number or Email Address")}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter email or 10-digit mobile"
                  className={`w-full pl-9 pr-3 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-teal-500 transition-colors ${
                    simpleView ? "py-3 text-base min-h-[48px]" : "py-2.5 text-sm min-h-[42px]"
                  }`}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  {t("password", "Password")}
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter account password"
                  className={`w-full pl-9 pr-10 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-teal-500 transition-colors font-mono ${
                    simpleView ? "py-3 text-base min-h-[48px]" : "py-2.5 text-sm min-h-[42px]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold transition-all shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2 mt-2 ${
                simpleView ? "py-4 text-lg min-h-[56px]" : "py-3 text-sm min-h-[44px]"
              }`}
            >
              <span>{loading ? t("logging_in", "Signing in securely...") : t("sign_in", "Sign In")}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Zero-Trust Notice */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 text-center">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Zero-Trust Security Gate: Session role and destination are verified exclusively by the backend operating layer.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl w-full mx-auto text-center text-xs text-slate-500 py-2">
        CareFlow Healthcare Operating Layer • NRCeS FHIR R4 & ABDM M1/M2/M3 Compliant
      </footer>
    </div>
  );
}

export default function UnifiedLoginPage() {
  return (
    <LanguageProvider>
      <AccessibilityProvider>
        <LoginForm />
      </AccessibilityProvider>
    </LanguageProvider>
  );
}
