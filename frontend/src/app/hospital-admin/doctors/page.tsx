"use client";

import React, { useEffect, useState } from "react";
import { Stethoscope, DoorOpen, Award, Clock, Loader2, CheckCircle2, IndianRupee } from "lucide-react";
import { api } from "@/lib/api";
import { useAccessibility } from "@/context/AccessibilityContext";

interface DoctorItem {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  department_name: string;
  specialization: string;
  qualification: string;
  room_number: string;
  consultation_fee: number;
  experience_years: number;
  is_verified: boolean;
  schedules_count: number;
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<DoctorItem | null>(null);
  const [roomNumber, setRoomNumber] = useState("");
  const [consultFee, setConsultFee] = useState<number>(500);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { simpleView, speakText } = useAccessibility();

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await api.get<DoctorItem[]>("/hospital-admin/doctors");
      setDoctors(res || []);
    } catch (err: any) {
      console.error("Failed to load doctors:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const openEditModal = (doc: DoctorItem) => {
    setSelectedDoc(doc);
    setRoomNumber(doc.room_number || "Room 101");
    setConsultFee(doc.consultation_fee || 500);
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc || !roomNumber) return;
    try {
      setSaving(true);
      setMessage(null);
      await api.put(`/hospital-admin/doctors/${selectedDoc.id}/room`, {
        room_number: roomNumber.trim(),
        consultation_fee: Number(consultFee),
      });
      setMessage(`Room updated to '${roomNumber}' for ${selectedDoc.full_name}`);
      speakText(`Room updated to ${roomNumber}`);
      setSelectedDoc(null);
      await fetchDoctors();
    } catch (err: any) {
      setMessage(err.message || "Failed to update doctor room.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-teal-400" />
            Hospital Doctor Roster
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Assigned clinicians practicing at this facility. Set OPD room allocations and operational fees.
          </p>
        </div>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-xs text-teal-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex justify-center text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
        </div>
      ) : doctors.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          <Stethoscope className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No Doctors Attached</h3>
          <p className="text-xs text-slate-500 mt-1">
            Clinicians must be attached to this facility by the Super Admin during verification.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-400 border border-teal-500/20">
                    {doc.department_name}
                  </span>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                      doc.is_verified
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {doc.is_verified ? "Practicing" : "Pending Check"}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mb-1">{doc.full_name}</h3>
                <p className="text-xs text-teal-300 font-medium mb-3">{doc.specialization}</p>

                <div className="space-y-1.5 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>
                      {doc.qualification} • {doc.experience_years} yrs exp
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DoorOpen className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span className="font-semibold text-white">{doc.room_number || "Room Unassigned"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>₹{doc.consultation_fee} OPD Consultation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{doc.schedules_count} Active OPD time blocks</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 mt-4 border-t border-slate-800 flex justify-between items-center">
                <span className="text-[11px] text-slate-500 font-mono">OPD Clinician</span>
                <button
                  onClick={() => openEditModal(doc)}
                  className={`rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 font-semibold transition-colors ${
                    simpleView ? "px-4 py-2.5 text-sm" : "px-3 py-1.5 text-xs"
                  }`}
                >
                  Assign Room
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Room Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white">Assign OPD Consultation Room</h2>
            <p className="text-xs text-slate-400">Updating facility room allocation for {selectedDoc.full_name}</p>
            <form onSubmit={handleSaveRoom} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Room Number / Cabin *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Room 204 (OPD Block B)"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Consultation Fee (INR)</label>
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={consultFee}
                  onChange={(e) => setConsultFee(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm outline-none focus:border-teal-500 font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDoc(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-bold shadow-md"
                >
                  {saving ? "Saving..." : "Save Allocation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
