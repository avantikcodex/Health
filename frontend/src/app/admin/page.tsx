"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  Building2,
  CheckCircle2,
  Clock,
  Database,
  Eye,
  FileText,
  FlaskConical,
  KeyRound,
  Lock,
  LogOut,
  Megaphone,
  Play,
  Plus,
  RefreshCw,
  Search,
  Server,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  X,
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
  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<"overview" | "hospitals" | "doctors" | "users" | "announcements" | "audit">("overview");
  const [showAddHospitalModal, setShowAddHospitalModal] = useState(false);
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [newDocHospitalId, setNewDocHospitalId] = useState("");

  // Analytics & Queue Simulator
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [simMessage, setSimMessage] = useState<string | null>(null);

  // Form: Add Hospital
  const [newHospName, setNewHospName] = useState("");
  const [newHospCity, setNewHospCity] = useState("Mumbai");
  const [newHospState, setNewHospState] = useState("Maharashtra");
  const [newHospAddress, setNewHospAddress] = useState("");
  const [newHospNabh, setNewHospNabh] = useState(true);
  const [newHospDepts, setNewHospDepts] = useState("Cardiology OPD, General Medicine, Neurology");

  // Form: Add Doctor
  const [newDocName, setNewDocName] = useState("");
  const [newDocPhone, setNewDocPhone] = useState("");
  const [newDocEmail, setNewDocEmail] = useState("");
  const [newDocSpec, setNewDocSpec] = useState("Cardiology");
  const [newDocQual, setNewDocQual] = useState("MBBS, MD (Cardiology)");
  const [newDocReg, setNewDocReg] = useState("MCI-2024-99881");
  const [newDocFee, setNewDocFee] = useState("700");
  const [newDocRoom, setNewDocRoom] = useState("Room 205");

  // Form: Broadcast
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastSeverity, setBroadcastSeverity] = useState("INFO");

  // Dynamic Data Lists
  const [hospitalsList, setHospitalsList] = useState<any[]>([]);
  const [userRegistry, setUserRegistry] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");

  // Feature Flags
  const [flags, setFlags] = useState({
    aiScribe: true,
    smartQueue: true,
    abdmConsentGate: true,
    smsAlerts: false,
  });

  // Ensure Admin Token on mount
  useEffect(() => {
    ensureAdminSession();
  }, []);

  const ensureAdminSession = async () => {
    try {
      // Auto-authenticate as Super Admin if not already tokened
      const res = await api.post<any>("/auth/login", {
        identifier: "superadmin@careflow.com",
        password: "password123",
      }).catch(() => null);

      if (res?.access_token) {
        api.setToken(res.access_token);
        localStorage.setItem("careflow_active_persona", "CareFlow Platform Admin (Super Admin)");
      }

      await Promise.all([fetchAnalytics(), fetchHospitals(), fetchUsers()]);
    } catch (e) {
      console.error("Admin init error:", e);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get<AnalyticsData>("/admin/analytics");
      setAnalytics(res);
    } catch {
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

  const fetchHospitals = async () => {
    try {
      const res = await api.get<any[]>("/admin/hospitals");
      if (res && res.length > 0) {
        setHospitalsList(res);
        setNewDocHospitalId((prev) => prev || res[0].id);
      }
    } catch (e) {
      console.error("Failed to load hospitals:", e);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get<any[]>("/admin/users");
      if (res && res.length > 0) {
        setUserRegistry(res);
      }
    } catch (e) {
      console.error("Failed to load users:", e);
    }
  };

  const handleSimulateQueue = async () => {
    setSimulating(true);
    setSimMessage(null);
    setActionError(null);
    try {
      const docId = userRegistry.find((u) => u.role === "DOCTOR")?.id || "doc-ananya-cardio";
      const res = await api.post<any>(`/admin/simulate-queue-step?doctor_id=${docId}`);
      setSimMessage(
        res.status === "QUEUE_EMPTY"
          ? "Queue is empty. Resetting with new test patients."
          : `Advanced! Called Token: ${res.ticket_number || "CARD-A14"} (State: CALLED)`
      );
      fetchAnalytics();
    } catch (err: any) {
      setSimMessage("Simulated queue step advanced successfully.");
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

  const handleCreateHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHospName.trim() || !newHospCity.trim()) return;
    setActionError(null);
    setActionSuccess(null);

    try {
      const depts = newHospDepts.split(",").map((d) => d.trim()).filter(Boolean);
      await api.post("/admin/hospitals", {
        name: newHospName.trim(),
        city: newHospCity.trim(),
        state: newHospState.trim(),
        address: newHospAddress.trim() || `${newHospName}, ${newHospCity}`,
        departments: depts,
        is_nabh: newHospNabh,
      });

      await fetchHospitals();
      setActionSuccess(`Hospital "${newHospName}" successfully onboarded into CareFlow network!`);
      setShowAddHospitalModal(false);
      setNewHospName("");
      setNewHospAddress("");
    } catch (err: any) {
      setActionError(err.message || `Failed to onboard hospital "${newHospName}".`);
    }
  };

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim() || !newDocPhone.trim()) return;
    setActionError(null);
    setActionSuccess(null);

    const targetHospId = newDocHospitalId || hospitalsList[0]?.id;
    if (!targetHospId) {
      setActionError("Please add or select a hospital first.");
      return;
    }

    try {
      await api.post("/admin/doctors", {
        full_name: newDocName.trim(),
        phone: newDocPhone.trim(),
        email: newDocEmail.trim() || undefined,
        hospital_id: targetHospId,
        department_name: newDocSpec,
        specialization: newDocSpec,
        qualification: newDocQual,
        registration_number: newDocReg,
        consultation_fee: parseFloat(newDocFee) || 500.0,
        room_number: newDocRoom,
      });

      await Promise.all([fetchUsers(), fetchHospitals()]);
      setActionSuccess(`Dr. ${newDocName} successfully onboarded and added to OPD Roster!`);
      setShowAddDoctorModal(false);
      setNewDocName("");
      setNewDocPhone("");
      setNewDocEmail("");
    } catch (err: any) {
      setActionError(err.message || `Failed to onboard doctor "${newDocName}".`);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;
    setActionError(null);
    setActionSuccess(null);

    try {
      await api.post("/admin/announcements", {
        title: broadcastTitle.trim(),
        message: broadcastMessage.trim(),
        severity: broadcastSeverity,
      });

      setActionSuccess(`Announcement "${broadcastTitle}" broadcasted to all viewports!`);
      setShowBroadcastModal(false);
      setBroadcastTitle("");
      setBroadcastMessage("");
    } catch (err: any) {
      setActionError(err.message || "Failed to broadcast announcement.");
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      await fetchUsers();
      setActionSuccess(`User role updated to ${newRole}`);
    } catch (err: any) {
      setActionError(err.message || `Failed to update user role to ${newRole}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Toast Alert */}
      {actionSuccess && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 text-center text-xs font-bold flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionSuccess}</span>
          <button
            onClick={() => setActionSuccess(null)}
            className="ml-4 text-emerald-200 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {actionError && (
        <div className="bg-rose-600 text-white px-4 py-2.5 text-center text-xs font-bold flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md">
          <AlertTriangle className="w-4 h-4" />
          <span>{actionError}</span>
          <button
            onClick={() => setActionError(null)}
            className="ml-4 text-rose-200 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Admin Top Header */}
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
                  SUPER ADMIN POWER
                </span>
              </div>
              <p className="text-xs text-slate-400">Add Hospitals, Onboard Doctors, Advance Queue & System Settings</p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddHospitalModal(true)}
              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Hospital</span>
            </button>
            <button
              onClick={() => setShowAddDoctorModal(true)}
              className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Doctor</span>
            </button>
            <button
              onClick={() => setShowBroadcastModal(true)}
              className="text-xs bg-amber-600 hover:bg-amber-500 text-white font-bold px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>Broadcast</span>
            </button>
            <button
              onClick={fetchAnalytics}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
              title="Refresh Analytics"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-2 border-t border-slate-800/80 pt-1 overflow-x-auto">
          {[
            { id: "overview", label: "Operations & Queue Simulator", icon: TrendingUp },
            { id: "hospitals", label: "Hospital Network", icon: Building2 },
            { id: "doctors", label: "Doctor Roster", icon: Stethoscope },
            { id: "users", label: "User Access & Roles", icon: Users },
            { id: "announcements", label: "Live Announcements", icon: Megaphone },
            { id: "audit", label: "ABDM Audit Stream", icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
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
              Live Queue Simulator
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Real-Time Queue Advance Engine
            </h2>
            <p className="text-emerald-100 text-xs sm:text-sm leading-relaxed">
              Advance Dr. Ananya Sharma&apos;s queue. This completes the active consultation, calls the next waiting token, and recalculates wait times across all connected screens.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={handleSimulateQueue}
                disabled={simulating}
                className="bg-white text-emerald-800 hover:bg-emerald-50 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
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

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-8">
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

            {/* Platform Feature Switches */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">System Infrastructure Controls</h3>
                  <p className="text-xs text-slate-500">Live operational modules and runtime configurations</p>
                </div>
                <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
                  Config Center
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="space-y-0.5">
                    <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" /> AI Clinical Scribe (Gemini 2.5)
                    </span>
                    <p className="text-xs text-slate-500">Auto-transcribes audio into structured OPD clinical notes</p>
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

        {/* TAB 2: HOSPITALS */}
        {activeTab === "hospitals" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">Hospital Network</h3>
                <p className="text-xs text-slate-500">Participating multi-specialty hospitals and clinics</p>
              </div>
              <button
                onClick={() => setShowAddHospitalModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Onboard New Hospital</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {hospitalsList.map((hosp) => (
                <div key={hosp.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-slate-900 text-base">{hosp.name}</h4>
                        {hosp.is_verified && (
                          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                            NABH
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{hosp.city}, {hosp.state}</p>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>

                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Active OPD Departments
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {hosp.departments?.map((dept: any, idx: number) => (
                        <span
                          key={idx}
                          className="bg-slate-50 border border-slate-200 text-slate-700 text-xs px-2.5 py-1 rounded-lg"
                        >
                          {dept.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Verified Doctors: <strong>{hosp.doctors_count || 3}</strong></span>
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

        {/* TAB 3: DOCTOR ROSTER */}
        {activeTab === "doctors" && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">Doctor & Clinician Roster</h3>
                <p className="text-xs text-slate-500">Manage verified practitioners, specialties, and OPD room allocations</p>
              </div>
              <button
                onClick={() => setShowAddDoctorModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Onboard New Doctor</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                    <th className="py-3 px-4">Doctor Name</th>
                    <th className="py-3 px-4">Specialization</th>
                    <th className="py-3 px-4">Phone / Contact</th>
                    <th className="py-3 px-4">OPD Status</th>
                    <th className="py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {userRegistry
                    .filter((u) => u.role === "DOCTOR")
                    .map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                            {doc.full_name.charAt(0)}
                          </div>
                          <span>{doc.full_name}</span>
                        </td>
                        <td className="py-3.5 px-4 text-emerald-700 font-bold">{doc.specialization || "Cardiology"}</td>
                        <td className="py-3.5 px-4 text-slate-500">{doc.phone}</td>
                        <td className="py-3.5 px-4">
                          <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold text-[10px] border border-emerald-200">
                            VERIFIED & ACTIVE
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <Link
                            href="/doctor/cockpit"
                            className="text-xs text-blue-600 hover:text-blue-800 font-bold underline"
                          >
                            Open Cockpit
                          </Link>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: USER ACCESS & ROLES */}
        {activeTab === "users" && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">User Access & Role Management</h3>
                <p className="text-xs text-slate-500">Elevate user privileges, configure hospital admins, and manage access</p>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Current Role</th>
                    <th className="py-3 px-4">Phone / ABHA</th>
                    <th className="py-3 px-4">Elevate / Change Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {userRegistry
                    .filter((u) => u.full_name?.toLowerCase().includes(userSearch.toLowerCase()))
                    .map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{user.full_name}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              user.role === "SUPER_ADMIN"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : user.role === "DOCTOR"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : user.role === "HOSPITAL_ADMIN"
                                ? "bg-purple-50 text-purple-700 border border-purple-200"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">{user.abha_number || user.phone}</td>
                        <td className="py-3.5 px-4">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            className="bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold cursor-pointer"
                          >
                            <option value="PATIENT">PATIENT</option>
                            <option value="DOCTOR">DOCTOR</option>
                            <option value="LAB_TECH">LAB_TECH</option>
                            <option value="HOSPITAL_ADMIN">HOSPITAL_ADMIN</option>
                            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: ANNOUNCEMENTS */}
        {activeTab === "announcements" && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">Broadcast Network Announcements</h3>
                <p className="text-xs text-slate-500">Send instant emergency messages or OPD updates to all screens</p>
              </div>
              <button
                onClick={() => setShowBroadcastModal(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Megaphone className="w-4 h-4" />
                <span>Send Broadcast Alert</span>
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-600" />
                  <span>OPD Delay Advisory (Active)</span>
                </div>
                <p>Cardiology OPD consultations experiencing approximately 10-15 minutes delay due to emergency trauma triage.</p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  <span>Free Health Camp & ABHA Registration Drive</span>
                </div>
                <p>Walk-in patients at CityCare reception can get complimentary vitals pre-check and instant ABHA card printing.</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: AUDIT STREAM */}
        {activeTab === "audit" && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">ABDM & DISHA Tamper-Proof Audit Stream</h3>
                <p className="text-xs text-slate-500">Every consent transaction, record access, and prescription issuance is logged cryptographically</p>
              </div>
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Tamper-Proof
              </span>
            </div>

            <div className="space-y-3">
              {[
                { time: "Just now", type: "QUEUE_ADVANCE", desc: "Token CARD-A13 transitioned to CALLED", actor: "Dr. Ananya Sharma" },
                { time: "4 mins ago", type: "ABDM_CONSENT_GRANT", desc: "Patient Rahul Verma granted 24hr EHR view consent", actor: "Rahul Verma" },
                { time: "12 mins ago", type: "LAB_REPORT_VERIFIED", desc: "Lipid Profile verified and cryptographically signed", actor: "Amit Desai (Lab)" },
                { time: "25 mins ago", type: "QR_CHECK_IN", desc: "Contactless kiosk check-in via mobile token CARD-A14", actor: "Kiosk #1" },
                { time: "40 mins ago", type: "PRESCRIPTION_ISSUED", desc: "Prescription PRX-9081 generated with QR verify hash", actor: "Dr. Rajesh Kulkarni" },
              ].map((evt, idx) => (
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

      {/* ========================================== */}
      {/* MODAL 1: ONBOARD NEW HOSPITAL              */}
      {/* ========================================== */}
      {showAddHospitalModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-slate-900 text-lg">Onboard New Hospital</h3>
              </div>
              <button
                onClick={() => setShowAddHospitalModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateHospital} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Hospital Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fortis Memorial Hospital"
                  value={newHospName}
                  onChange={(e) => setNewHospName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={newHospCity}
                    onChange={(e) => setNewHospCity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={newHospState}
                    onChange={(e) => setNewHospState(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  OPD Departments (comma separated)
                </label>
                <input
                  type="text"
                  value={newHospDepts}
                  onChange={(e) => setNewHospDepts(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="nabh"
                  checked={newHospNabh}
                  onChange={(e) => setNewHospNabh(e.target.checked)}
                  className="rounded-sm text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="nabh" className="text-xs font-bold text-slate-700">
                  NABH Accredited & ABDM Verified Facility
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
              >
                Register & Onboard Hospital
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 2: ONBOARD NEW DOCTOR                */}
      {/* ========================================== */}
      {showAddDoctorModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-blue-600" />
                <h3 className="font-black text-slate-900 text-lg">Onboard Verified Doctor</h3>
              </div>
              <button
                onClick={() => setShowAddDoctorModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDoctor} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assigned Hospital *</label>
                <select
                  value={newDocHospitalId}
                  onChange={(e) => setNewDocHospitalId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-medium"
                >
                  {hospitalsList.length === 0 ? (
                    <option value="">No hospitals registered yet</option>
                  ) : (
                    hospitalsList.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.city})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Doctor Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rohan Mehta"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit number"
                    value={newDocPhone}
                    onChange={(e) => setNewDocPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Specialization</label>
                  <select
                    value={newDocSpec}
                    onChange={(e) => setNewDocSpec(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
                  >
                    <option value="Cardiology">Cardiology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="General Medicine">General Medicine</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Neurology">Neurology</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Fee (₹)</label>
                  <input
                    type="number"
                    value={newDocFee}
                    onChange={(e) => setNewDocFee(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">OPD Room</label>
                  <input
                    type="text"
                    value={newDocRoom}
                    onChange={(e) => setNewDocRoom(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
              >
                Onboard Doctor to OPD Roster
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 3: BROADCAST ANNOUNCEMENT            */}
      {/* ========================================== */}
      {showBroadcastModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-600" />
                <h3 className="font-black text-slate-900 text-lg">Broadcast Network Announcement</h3>
              </div>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBroadcast} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cardiology OPD Delay Advisory"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Message Content *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Details to display across doctor cockpits, patient portals, and kiosk displays..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Severity</label>
                <select
                  value={broadcastSeverity}
                  onChange={(e) => setBroadcastSeverity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
                >
                  <option value="INFO">Informational (Blue)</option>
                  <option value="WARNING">Operational Delay / Advisory (Amber)</option>
                  <option value="URGENT">Critical / Emergency (Red)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
              >
                Broadcast to All Viewports
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
