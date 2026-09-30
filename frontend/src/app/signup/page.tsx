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
  Heart,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { api } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [gender, setGender] = useState("MALE");
  const [bloodGroup, setBloodGroup] = useState("B+");
  const [dob, setDob] = useState("1995-06-15");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fillSampleData = () => {
    setFullName("Priya Sharma");
    setPhone(`98${Math.floor(10000000 + Math.random() * 90000000)}`);
    setEmail("priya.sample@careflow.com");
    setPassword("password123");
    setGender("FEMALE");
    setBloodGroup("O+");
    setDob("1998-04-20");
    setError(null);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !password.trim()) {
      setError("Please fill in your name, phone number, and password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.post<any>("/auth/register", {
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        password: password,
        gender: gender,
        blood_group: bloodGroup,
        dob: dob || undefined,
      });

      if (res?.access_token) {
        api.setToken(res.access_token);
      }

      router.push("/patient/dashboard?registered=true");
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please try a different phone or email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-emerald-50/20 to-slate-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-600/20 group-hover:scale-105 transition-transform">
              <Activity className="w-7 h-7 stroke-[2.5]" />
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Create your CareFlow Account
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            One digital health identity for all hospitals, live tokens & records.
          </p>
        </div>

        {/* 1-Click Sample Pre-fill Button for Reviewers */}
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs text-emerald-950 font-medium">
              Want a quick test? Pre-fill with a sample patient profile.
            </span>
          </div>
          <button
            type="button"
            onClick={fillSampleData}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-white border border-emerald-300 hover:border-emerald-400 px-3 py-1.5 rounded-lg shadow-xs transition-colors shrink-0"
          >
            Auto-Fill
          </button>
        </div>

        {/* Signup Form Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Verma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Mobile Phone & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Mobile Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    required
                    placeholder="10-digit number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Email Address (Optional)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    placeholder="you@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Create Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Gender, Blood Group, Date of Birth */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-2.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Blood Group
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full px-2.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Birth Date
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>
            </div>

            {/* ABHA Compliance Note */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>ABDM Compatible:</strong> CareFlow automatically generates your official 14-digit ABHA address stub upon sign up.
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer text-sm"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Free Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Sign in footer */}
          <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-emerald-600 hover:text-emerald-700 underline underline-offset-2 ml-1"
            >
              Sign In here
            </Link>
          </div>
        </div>

        {/* Privacy Note */}
        <p className="text-center text-[11px] text-slate-400">
          Consent-driven healthcare data privacy. Compliant with DISHA & ABDM guidelines.
        </p>
      </div>
    </div>
  );
}
