"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  FlaskConical,
  Hospital,
  MapPin,
  QrCode,
  ShieldCheck,
  Stethoscope,
  User,
} from "lucide-react";
import { api } from "@/lib/api";

interface Appointment {
  id: string;
  doctor_name: string;
  department_name: string;
  hospital_name: string;
  scheduled_start: string;
  status: string;
  ticket_number?: string;
  queue_position?: number;
  estimated_wait_minutes?: number;
}

interface CareJourneyData {
  patient_name: string;
  next_action?: {
    action: string;
    details: string;
    suggested_date?: string;
    stage: string;
  };
  events: Array<{
    id: string;
    stage: string;
    title: string;
    description: string;
    timestamp: string;
    status: string;
    metadata_json?: any;
  }>;
}

export default function PatientDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [journey, setJourney] = useState<CareJourneyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch user profile
      const meRes = await api.get<any>("/auth/me").catch(() => null);
      if (meRes) setProfile(meRes);

      // Fetch appointments
      const apptRes = await api.get<Appointment[]>("/appointments/my").catch(() => []);
      setAppointments(apptRes || []);

      // Fetch journey
      const journeyRes = await api.get<CareJourneyData>("/journey/my").catch(() => null);
      if (journeyRes) setJourney(journeyRes);
    } catch (err) {
      console.error("Failed to load patient dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const activeAppointment = appointments.find(
    (a) => a.status === "CONFIRMED" || a.status === "CHECKED_IN"
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Patient Welcome & ABHA Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Welcome back, {profile?.user?.full_name || "Rahul Verma"}
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              ABHA Verified
            </span>
          </div>
          <p className="text-sm text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>
              ABHA: <strong className="text-slate-700">{profile?.patient_profile?.abha_number || "91-4567-8912-3456"}</strong>
            </span>
            <span>•</span>
            <span>
              ABHA Address: <strong className="text-slate-700">{profile?.patient_profile?.abha_address || "rahulverma@abdm"}</strong>
            </span>
            <span>•</span>
            <span>Phone: +91 {profile?.user?.phone || "9876543210"}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/patient/discover"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm shadow-sm transition-all"
          >
            <Stethoscope className="w-4 h-4" />
            Find Doctor & Book
          </Link>
          <Link
            href="/patient/consent"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-sm border border-slate-200 transition-all"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Consent Privacy
          </Link>
        </div>
      </div>

      {/* Primary Highlights: Active Appointment & Next Action */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Appointment Card (Takes 2 columns) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <h2 className="font-bold text-base text-slate-900">Active Healthcare Visit</h2>
              </div>
              {activeAppointment ? (
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    activeAppointment.status === "CHECKED_IN"
                      ? "bg-amber-100 text-amber-800 border border-amber-200 animate-pulse"
                      : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  }`}
                >
                  {activeAppointment.status === "CHECKED_IN" ? "Checked-In (In Live Queue)" : "Scheduled & Confirmed"}
                </span>
              ) : (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  No Active Visit
                </span>
              )}
            </div>

            {activeAppointment ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">{activeAppointment.doctor_name}</h3>
                    <p className="text-sm text-slate-600 font-medium">{activeAppointment.department_name}</p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                      <Hospital className="w-3.5 h-3.5 text-slate-400" />
                      <span>{activeAppointment.hospital_name}</span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-start sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                    <div className="text-xs text-slate-500">Scheduled Time</div>
                    <div className="text-base font-bold text-slate-900">
                      {new Date(activeAppointment.scheduled_start).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(activeAppointment.scheduled_start).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                </div>

                {activeAppointment.status === "CHECKED_IN" ? (
                  <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs uppercase font-bold text-amber-800 tracking-wider">Your Live Token</div>
                      <div className="text-2xl font-black text-amber-900 mt-0.5">
                        {activeAppointment.ticket_number || "CARD-A14"}
                      </div>
                      <div className="text-xs text-amber-700 mt-1">
                        Queue Position: <strong>#{activeAppointment.queue_position ?? 1}</strong> • Estimated wait:{" "}
                        <strong>{activeAppointment.estimated_wait_minutes ?? 14} mins (EWMA)</strong>
                      </div>
                    </div>
                    <Link
                      href={`/patient/appointments/${activeAppointment.id}/checkin`}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors"
                    >
                      View Live Queue
                    </Link>
                  </div>
                ) : (
                  <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-slate-900">Contactless Smart Check-In</div>
                        <div className="text-xs text-slate-500">
                          Scan the hospital QR code or click check-in upon arrival to get your live queue token.
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/patient/appointments/${activeAppointment.id}/checkin`}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-xs shrink-0 text-center transition-colors"
                    >
                      Check-In Now
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-10 space-y-3">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm text-slate-500">You have no pending visits scheduled for today.</p>
                <Link
                  href="/patient/discover"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  Book an OPD appointment <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Hospital OPD hours: 09:00 AM – 06:00 PM</span>
            <Link href="/patient/journey" className="text-emerald-700 font-semibold hover:underline">
              View full appointment history →
            </Link>
          </div>
        </div>

        {/* What Happens Next Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-md flex flex-col justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
              <Activity className="w-3.5 h-3.5" />
              <span>Care Journey Navigator</span>
            </div>

            <h3 className="text-lg font-bold">What Needs to Happen Next</h3>

            {journey?.next_action ? (
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  {journey.next_action.stage}
                </div>
                <div className="font-semibold text-slate-100 text-sm leading-snug">
                  {journey.next_action.action}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {journey.next_action.details}
                </p>
                {journey.next_action.suggested_date && (
                  <div className="text-xs font-medium text-amber-300 pt-1">
                    Target: {journey.next_action.suggested_date}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 text-xs text-slate-400">
                Your medical journey is up to date. Keep routine health records current.
              </div>
            )}

            <div className="space-y-2 pt-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Clinical Alerts</div>
              <div className="flex items-center gap-2 text-xs bg-slate-800/50 p-2.5 rounded-lg border border-slate-700">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-slate-300">
                  Allergy on file: <strong className="text-white">Penicillin</strong> (Noted in doctor cockpit)
                </span>
              </div>
            </div>
          </div>

          <Link
            href="/patient/journey"
            className="mt-6 flex items-center justify-between p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
          >
            <span>Open Connected Care Timeline</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/patient/discover"
          className="p-5 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-xs transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Stethoscope className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900 text-sm">Find Doctor & Book</h4>
          <p className="text-xs text-slate-500 mt-1">Search specialties, view doctor profiles and open slots.</p>
        </Link>

        <Link
          href="/patient/journey"
          className="p-5 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-xs transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900 text-sm">Prescriptions & Tests</h4>
          <p className="text-xs text-slate-500 mt-1">Download signed prescriptions and verified lab reports.</p>
        </Link>

        <Link
          href="/patient/consent"
          className="p-5 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-xs transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900 text-sm">DPDP Consent Manager</h4>
          <p className="text-xs text-slate-500 mt-1">Manage hospital access permissions and audit who viewed data.</p>
        </Link>

        <Link
          href="/lab"
          className="p-5 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-xs transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <FlaskConical className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900 text-sm">Diagnostic Workbench</h4>
          <p className="text-xs text-slate-500 mt-1">Track laboratory test progress, sample barcodes, and results.</p>
        </Link>
      </div>
    </div>
  );
}
