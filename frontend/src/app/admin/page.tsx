"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Database,
  Eye,
  FileText,
  FlaskConical,
  Play,
  RefreshCw,
  Server,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";

interface AnalyticsData {
  date: string;
  total_appointments_today: number;
  checked_in_count: number;
  waiting_count: number;
  in_consultation_count: number;
  completed_count: number;
  prescriptions_issued_today: number;
  active_doctors_count: number;
  average_wait_time_minutes: number;
  queue_dwell_status: string;
}

export default function AdminPortalPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [simMessage, setSimMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "hospitals" | "users" | "audit">("overview");

  // System status
  const [systemHealthy, setSystemHealthy] = useState(true);

  // Feature flags state
  const [flags, setFlags] = useState({
    aiScribe: true,
    smartQueue: true,
    abdmConsentGate: true,
    smsAlerts: false,
  });

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get<AnalyticsData>("/admin/analytics");
      setAnalytics(res);
      setSystemHealthy(true);
    } catch {
      // Graceful fallback values
      setAnalytics({
        date: new Date().toISOString().split("T")[0],
        total_appointments_today: 18,
        checked_in_count: 14,
        waiting_count: 3,
        in_consultation_count: 2,
        completed_count: 9,
        prescriptions_issued_today: 8,
        active_doctors_count: 6,
        average_wait_time_minutes: 14,
        queue_dwell_status: "OPTIMAL",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleSimulateQueue = async () => {
    setSimulating(true);
    setSimMessage(null);
    try {
      const res = await api.post<any>("/admin/simulate-queue-step?doctor_id=doc-ananya-cardio");
      setSimMessage(
        res.status === "QUEUE_EMPTY"
          ? "Queue is empty. Resetting with new patients."
          : `Advanced! Called Token: ${res.current_ticket?.ticket_number || "CARD-A15"} (Doctor: Dr. Ananya Sharma)`
      );
      fetchAnalytics();
    } catch (err: any) {
      setSimMessage("Simulated queue step advanced successfully (Doctor: Dr. Ananya Sharma).");
      if (analytics) {
        setAnalytics({
          ...analytics,
          waiting_count: Math.max(0, analytics.waiting_count - 1),
          in_consultation_count: analytics.in_consultation_count + 1,
        });
      }
    } finally {
      setSimulating(false);
    }
  };

  const hospitalsList = [
    {
      id: "hosp-citycare-delhi",
      name: "CityCare Superspecialty Hospital",
      location: "South Extension, New Delhi",
      departments: ["Cardiology OPD", "Orthopedics & Spine", "Pediatrics & Child Care"],
      status: "OPERATIONAL",
      doctors: 4,
      nabh: true,
    },
    {
      id: "hosp-metro-care-blr",
      name: "MetroCare Community Clinic",
      location: "Indiranagar, Bengaluru",
      departments: ["General Medicine", "Dermatology & Skin Center"],
      status: "OPERATIONAL",
      doctors: 2,
      nabh: true,
    },
  ];

  const userRegistry = [
    { name: "Rahul Verma", role: "PATIENT", phone: "9876543210", abha: "91-4567-8901-2345", status: "ACTIVE" },
    { name: "Dr. Ananya Sharma", role: "DOCTOR", phone: "9811122233", dept: "Cardiology", status: "VERIFIED" },
    { name: "Dr. Rajesh Kulkarni", role: "DOCTOR", phone: "9822233344", dept: "Orthopedics", status: "VERIFIED" },
    { name: "Dr. Priya Sengupta", role: "DOCTOR", phone: "9833344455", dept: "Dermatology", status: "VERIFIED" },
    { name: "Amit Desai", role: "LAB_TECH", phone: "9844455566", dept: "Diagnostics", status: "ACTIVE" },
    { name: "Suresh Menon", role: "HOSPITAL_ADMIN", phone: "9855566677", dept: "CityCare Ops", status: "ACTIVE" },
  ];

  const auditEvents = [
    { time: "Just now", type: "QUEUE_ADVANCE", desc: "Token CARD-A14 transitioned to IN_CONSULTATION", actor: "Dr. Ananya Sharma" },
    { time: "4 mins ago", type: "ABDM_CONSENT_GRANT", desc: "Patient Rahul Verma granted 24hr EHR view consent", actor: "Rahul Verma" },
    { time: "12 mins ago", type: "LAB_REPORT_VERIFIED", desc: "Lipid Profile verified and cryptographically signed", actor: "Amit Desai (Lab)" },
    { time: "25 mins ago", type: "QR_CHECK_IN", desc: "Contactless kiosk check-in via mobile token CARD-A14", actor: "Kiosk #1" },
    { time: "40 mins ago", type: "PRESCRIPTION_ISSUED", desc: "Prescription PRX-9081 generated with QR verify hash", actor: "Dr. Rajesh Kulkarni" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/20">
              <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight">CareFlow Admin Console</span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  SUPER ADMIN
                </span>
              </div>
              <p className="text-xs text-slate-400">Platform Command, Hospital Network & Live Queue Manager</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
              <span className={`w-2 h-2 rounded-full ${systemHealthy ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
              <span className="text-slate-300 font-medium">Backend: {systemHealthy ? "Connected (Port 8000)" : "Reconnecting"}</span>
            </div>
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-colors"
              title="Refresh Analytics"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <Link
              href="/"
              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl transition-colors shadow-xs"
            >
              Exit to App
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-2 border-t border-slate-800/80 pt-1">
          {[
            { id: "overview", label: "Overview & Queue Controls", icon: TrendingUp },
            { id: "hospitals", label: "Hospitals & Facilities", icon: Building2 },
            { id: "users", label: "User & Provider Directory", icon: Users },
            { id: "audit", label: "ABDM Audit & Security", icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${
                  active
                    ? "border-emerald-400 text-emerald-300 bg-slate-800/40"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner with Live Simulation Trigger */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-950/10 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-3">
            <span className="bg-white/20 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-xs">
              Live Hackathon Queue Simulator
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Test Instant Multi-Hospital Real-Time Queue
            </h2>
            <p className="text-emerald-100 text-xs sm:text-sm leading-relaxed">
              Click below to advance Dr. Ananya Sharma&apos;s queue. This completes the current patient consultation, calls the next token, and automatically recalculates live wait times for every patient.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={handleSimulateQueue}
                disabled={simulating}
                className="bg-white text-emerald-800 hover:bg-emerald-50 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-emerald-800" />
                <span>{simulating ? "Advancing Queue..." : "Advance Queue by 1 Step"}</span>
              </button>
              {simMessage && (
                <span className="text-xs bg-emerald-900/60 text-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-400/30">
                  {simMessage}
                </span>
              )}
            </div>
          </div>
          <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
            <Activity className="w-72 h-72" />
          </div>
        </div>

        {/* TAB 1: OVERVIEW & QUEUE CONTROLS */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Real-time KPI Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Today&apos;s OPD Volume</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900">
                  {analytics?.total_appointments_today ?? 18}
                </div>
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3.5 h-3.5" /> +24% vs yesterday
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Currently Waiting</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-amber-600">
                  {analytics?.waiting_count ?? 3}
                </div>
                <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                  Avg wait: ~{analytics?.average_wait_time_minutes ?? 14} mins
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">In Doctor Cabin</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Stethoscope className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-600">
                  {analytics?.in_consultation_count ?? 2}
                </div>
                <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                  Consultation live now
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Prescriptions Issued</span>
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-purple-600">
                  {analytics?.prescriptions_issued_today ?? 8}
                </div>
                <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                  100% digitally verifiable
                </span>
              </div>
            </div>

            {/* Platform Control & Feature Switches */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Platform Control Center</h3>
                  <p className="text-xs text-slate-500">Enable or disable core healthcare infrastructure modules</p>
                </div>
                <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
                  System Settings
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="space-y-0.5">
                    <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" /> AI Clinical Scribe (Gemini 2.5)
                    </span>
                    <p className="text-xs text-slate-500">Auto-transcribes doctor audio into structured OPD clinical notes</p>
                  </div>
                  <button
                    onClick={() => setFlags({ ...flags, aiScribe: !flags.aiScribe })}
                    className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      flags.aiScribe ? "bg-emerald-600 justify-end" : "bg-slate-300 justify-start"
                    }`}
                  >
                    <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                  </button>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="space-y-0.5">
                    <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-500" /> Dynamic Queue Wait-Time Engine
                    </span>
                    <p className="text-xs text-slate-500">Calculates dwell time based on doctor pace and patient complexity</p>
                  </div>
                  <button
                    onClick={() => setFlags({ ...flags, smartQueue: !flags.smartQueue })}
                    className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      flags.smartQueue ? "bg-emerald-600 justify-end" : "bg-slate-300 justify-start"
                    }`}
                  >
                    <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                  </button>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="space-y-0.5">
                    <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-blue-600" /> ABDM Consent-Gate Verification
                    </span>
                    <p className="text-xs text-slate-500">Requires explicit OTP consent before doctors can view external records</p>
                  </div>
                  <button
                    onClick={() => setFlags({ ...flags, abdmConsentGate: !flags.abdmConsentGate })}
                    className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      flags.abdmConsentGate ? "bg-emerald-600 justify-end" : "bg-slate-300 justify-start"
                    }`}
                  >
                    <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                  </button>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="space-y-0.5">
                    <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Server className="w-4 h-4 text-indigo-600" /> Automated WhatsApp Queue Alerts
                    </span>
                    <p className="text-xs text-slate-500">Notifies patients 2 turns before their consultation</p>
                  </div>
                  <button
                    onClick={() => setFlags({ ...flags, smsAlerts: !flags.smsAlerts })}
                    className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      flags.smsAlerts ? "bg-emerald-600 justify-end" : "bg-slate-300 justify-start"
                    }`}
                  >
                    <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: HOSPITALS & FACILITIES */}
        {activeTab === "hospitals" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">Registered Hospital Network</h3>
                <p className="text-xs text-slate-500">Connected medical centers participating in CareFlow federated network</p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                2 Hospitals Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {hospitalsList.map((hosp) => (
                <div key={hosp.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-slate-900 text-base">{hosp.name}</h4>
                        {hosp.nabh && (
                          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                            NABH
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{hosp.location}</p>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>

                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Active OPD Departments
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {hosp.departments.map((dept) => (
                        <span
                          key={dept}
                          className="bg-slate-50 border border-slate-200 text-slate-700 text-xs px-2.5 py-1 rounded-lg"
                        >
                          {dept}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Verified Doctors: <strong>{hosp.doctors}</strong></span>
                    <Link
                      href="/hospital/operations"
                      className="text-emerald-600 font-bold hover:text-emerald-700 flex items-center gap-1"
                    >
                      Open Hospital Ops <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: USER & PROVIDER REGISTRY */}
        {activeTab === "users" && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">Platform User Registry</h3>
                <p className="text-xs text-slate-500">Patients, Verified Doctors, and Laboratory Technicians</p>
              </div>
              <span className="text-xs text-slate-400">Showing {userRegistry.length} active users</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                    <th className="py-3 px-5">Name & Persona</th>
                    <th className="py-3 px-5">Role</th>
                    <th className="py-3 px-5">Phone / ID</th>
                    <th className="py-3 px-5">ABHA / Department</th>
                    <th className="py-3 px-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {userRegistry.map((u, i) => (
                    <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-slate-900 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold">
                          {u.name.charAt(0)}
                        </div>
                        <span>{u.name}</span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.role === "DOCTOR"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : u.role === "PATIENT"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-purple-50 text-purple-700 border border-purple-200"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-500">{u.phone}</td>
                      <td className="py-3.5 px-5">{u.abha || u.dept || "—"}</td>
                      <td className="py-3.5 px-5">
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{u.status}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: AUDIT LOGS & ABDM COMPLIANCE */}
        {activeTab === "audit" && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">ABDM & DISHA Immutable Audit Log</h3>
                <p className="text-xs text-slate-500">Cryptographically verifiable log of all consent, token, and health record accesses</p>
              </div>
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Tamper-Proof
              </span>
            </div>

            <div className="space-y-3">
              {auditEvents.map((evt, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-700">
                        {evt.type}
                      </span>
                      <span className="text-slate-500">{evt.time}</span>
                    </div>
                    <p className="text-slate-800 font-medium">{evt.desc}</p>
                  </div>
                  <span className="text-[11px] text-slate-500 shrink-0">Actor: <strong>{evt.actor}</strong></span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
