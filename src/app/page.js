"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function DoctorHome() {
  const router = useRouter();
  const [mode, setMode] = useState(null); // null | 'scan' | 'manual'
  const [scanning, setScanning] = useState(false);
  const [manualForm, setManualForm] = useState({
    name: "", patientId: "", dob: "", bloodGroup: "", allergies: "", conditions: "", emergencyContact: ""
  });
  const [scannedData, setScannedData] = useState(null);
  const [error, setError] = useState("");
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (html5QrRef.current) {
        html5QrRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startScanner = useCallback(async () => {
    setScanning(true);
    setError("");
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-reader");
      html5QrRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          try {
            const data = JSON.parse(decodedText);
            setScannedData(data);
            scanner.stop().catch(() => {});
            setScanning(false);
          } catch {
            setError("Invalid QR code format. Please scan a MedVault patient QR.");
          }
        },
        () => {} // ignore scan failures
      );
    } catch (err) {
      setError("Camera access denied or unavailable. Try manual entry instead.");
      setScanning(false);
    }
  }, []);

  const stopScanner = useCallback(async () => {
    if (html5QrRef.current) {
      await html5QrRef.current.stop().catch(() => {});
      html5QrRef.current = null;
    }
    setScanning(false);
  }, []);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualForm.name || !manualForm.patientId) {
      setError("Patient name and ID are required.");
      return;
    }
    const patientData = {
      ...manualForm,
      allergies: manualForm.allergies ? manualForm.allergies.split(",").map(a => a.trim()) : [],
      conditions: manualForm.conditions ? manualForm.conditions.split(",").map(c => c.trim()) : [],
    };
    navigateToPrescribe(patientData);
  };

  const navigateToPrescribe = (patientData) => {
    sessionStorage.setItem("medvault_patient", JSON.stringify(patientData));
    router.push("/prescribe");
  };

  const resetAll = () => {
    stopScanner();
    setMode(null);
    setScannedData(null);
    setError("");
    setManualForm({ name: "", patientId: "", dob: "", bloodGroup: "", allergies: "", conditions: "", emergencyContact: "" });
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "var(--bg-primary)" }}>
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20" style={{ background: "radial-gradient(circle, var(--accent-teal) 0%, transparent 70%)" }} />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full opacity-10" style={{ background: "radial-gradient(circle, var(--accent-cyan) 0%, transparent 70%)" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5" style={{ background: "radial-gradient(circle, var(--accent-emerald) 0%, transparent 60%)" }} />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--accent-teal-dim)", border: "1px solid var(--border-active)" }}>
            <span className="material-symbols-outlined gradient-text" style={{ WebkitTextFillColor: "var(--accent-teal)", fontSize: 22 }}>local_hospital</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Med<span className="gradient-text">Vault</span>
            </h1>
            <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Doctor Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
          <div className="dot-pulse" />
          <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>System Online</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center px-6 md:px-12 pt-8 pb-20">
        {/* Hero - shown when no mode selected */}
        {!mode && !scannedData && (
          <div className="w-full max-w-3xl animate-fade-in-up" style={{ animationDelay: "0.1s", opacity: 0, animationFillMode: "forwards" }}>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ background: "var(--accent-teal-dim)", border: "1px solid rgba(20,184,166,0.2)" }}>
                <span className="material-symbols-outlined text-sm" style={{ color: "var(--accent-teal)" }}>verified_user</span>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--accent-teal)" }}>Secure Clinical Access</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4" style={{ color: "var(--text-primary)", lineHeight: 1.1 }}>
                Identify Your <span className="gradient-text">Patient</span>
              </h2>
              <p className="text-base md:text-lg max-w-md mx-auto" style={{ color: "var(--text-secondary)" }}>
                Scan the patient's MedVault QR code or enter their details manually to begin prescribing.
              </p>
            </div>

            {/* Two option cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {/* Scan QR Card */}
              <button
                onClick={() => { setMode("scan"); setTimeout(startScanner, 300); }}
                className="glass-card p-8 text-left group cursor-pointer"
                id="scan-qr-btn"
              >
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110" style={{ background: "linear-gradient(135deg, var(--accent-teal-dim), rgba(6,182,212,0.15))", border: "1px solid var(--border-active)" }}>
                  <span className="material-symbols-outlined text-3xl" style={{ color: "var(--accent-teal)" }}>qr_code_scanner</span>
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>Scan QR Code</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  Use your camera to scan the patient's MedVault profile QR for instant identification.
                </p>
                <div className="flex items-center gap-2 mt-5 text-xs font-semibold" style={{ color: "var(--accent-teal)" }}>
                  <span>Open Scanner</span>
                  <span className="material-symbols-outlined text-sm transition-transform duration-300 group-hover:translate-x-1">arrow_forward</span>
                </div>
              </button>

              {/* Manual Entry Card */}
              <button
                onClick={() => setMode("manual")}
                className="glass-card p-8 text-left group cursor-pointer"
                id="manual-entry-btn"
              >
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110" style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)" }}>
                  <span className="material-symbols-outlined text-3xl" style={{ color: "#818cf8" }}>edit_note</span>
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>Manual Entry</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  Type in the patient's name, ID, and medical details to proceed.
                </p>
                <div className="flex items-center gap-2 mt-5 text-xs font-semibold" style={{ color: "#818cf8" }}>
                  <span>Enter Details</span>
                  <span className="material-symbols-outlined text-sm transition-transform duration-300 group-hover:translate-x-1">arrow_forward</span>
                </div>
              </button>
            </div>

            {/* Quick stats */}
            <div className="flex items-center justify-center gap-8 mt-12">
              {[
                { icon: "shield", label: "HIPAA Compliant" },
                { icon: "encrypted", label: "End-to-End Encrypted" },
                { icon: "speed", label: "Instant Access" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base" style={{ color: "var(--text-muted)" }}>{item.icon}</span>
                  <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* QR Scanner Mode */}
        {mode === "scan" && !scannedData && (
          <div className="w-full max-w-lg animate-fade-in-up" style={{ opacity: 0, animationFillMode: "forwards" }}>
            <button onClick={resetAll} className="flex items-center gap-2 mb-6 text-sm font-medium cursor-pointer" style={{ color: "var(--text-secondary)" }}>
              <span className="material-symbols-outlined text-lg">arrow_back</span> Back
            </button>
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--accent-teal-dim)" }}>
                  <span className="material-symbols-outlined" style={{ color: "var(--accent-teal)" }}>qr_code_scanner</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Scanning...</h3>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Point camera at patient's MedVault QR</p>
                </div>
              </div>
              <div className="qr-scanner-container">
                <div id="qr-reader" style={{ width: "100%", minHeight: 280 }} />
              </div>
              {error && (
                <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <span className="material-symbols-outlined text-sm" style={{ color: "var(--danger)" }}>error</span>
                  <p className="text-sm" style={{ color: "#fca5a5" }}>{error}</p>
                </div>
              )}
              <button onClick={() => { stopScanner(); setMode("manual"); }} className="btn-secondary w-full mt-5 text-sm flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-lg">edit_note</span>
                Switch to Manual Entry
              </button>
            </div>
          </div>
        )}

        {/* Manual Entry Mode */}
        {mode === "manual" && !scannedData && (
          <div className="w-full max-w-xl animate-fade-in-up" style={{ opacity: 0, animationFillMode: "forwards" }}>
            <button onClick={resetAll} className="flex items-center gap-2 mb-6 text-sm font-medium cursor-pointer" style={{ color: "var(--text-secondary)" }}>
              <span className="material-symbols-outlined text-lg">arrow_back</span> Back
            </button>
            <div className="glass-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(99,102,241,0.12)" }}>
                  <span className="material-symbols-outlined" style={{ color: "#818cf8" }}>person_add</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Patient Details</h3>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Enter patient information to continue</p>
                </div>
              </div>

              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--text-muted)" }}>Patient Name *</label>
                    <input className="input-field" placeholder="e.g. Julian Reed" value={manualForm.name} onChange={(e) => setManualForm({...manualForm, name: e.target.value})} required />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--text-muted)" }}>MedVault ID *</label>
                    <input className="input-field font-mono" placeholder="MV-XXXX-XXXX" value={manualForm.patientId} onChange={(e) => setManualForm({...manualForm, patientId: e.target.value})} required />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--text-muted)" }}>Date of Birth</label>
                    <input type="date" className="input-field" value={manualForm.dob} onChange={(e) => setManualForm({...manualForm, dob: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--text-muted)" }}>Blood Group</label>
                    <select className="input-field" value={manualForm.bloodGroup} onChange={(e) => setManualForm({...manualForm, bloodGroup: e.target.value})}>
                      <option value="">Select...</option>
                      {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--text-muted)" }}>Known Allergies</label>
                  <input className="input-field" placeholder="Comma separated, e.g. Penicillin, Latex" value={manualForm.allergies} onChange={(e) => setManualForm({...manualForm, allergies: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--text-muted)" }}>Existing Conditions</label>
                  <input className="input-field" placeholder="Comma separated, e.g. Hypertension, Diabetes" value={manualForm.conditions} onChange={(e) => setManualForm({...manualForm, conditions: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--text-muted)" }}>Emergency Contact</label>
                  <input className="input-field" placeholder="+91 XXXXX XXXXX" value={manualForm.emergencyContact} onChange={(e) => setManualForm({...manualForm, emergencyContact: e.target.value})} />
                </div>

                {error && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                    <span className="material-symbols-outlined text-sm" style={{ color: "var(--danger)" }}>error</span>
                    <p className="text-sm" style={{ color: "#fca5a5" }}>{error}</p>
                  </div>
                )}

                <button type="submit" className="btn-primary w-full text-sm flex items-center justify-center gap-2 mt-2">
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  Continue to Prescription
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Scanned Patient Confirmation */}
        {scannedData && (
          <div className="w-full max-w-lg animate-fade-in-up" style={{ opacity: 0, animationFillMode: "forwards" }}>
            <button onClick={resetAll} className="flex items-center gap-2 mb-6 text-sm font-medium cursor-pointer" style={{ color: "var(--text-secondary)" }}>
              <span className="material-symbols-outlined text-lg">arrow_back</span> Scan Again
            </button>
            <div className="glass-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)" }}>
                  <span className="material-symbols-outlined text-2xl" style={{ color: "var(--accent-emerald)" }}>check_circle</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Patient Identified</h3>
                  <p className="text-xs" style={{ color: "var(--accent-emerald)" }}>QR scan successful</p>
                </div>
              </div>

              <div className="space-y-3 mb-6 p-5 rounded-2xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: "var(--text-muted)" }}>Name</span>
                  <span className="font-bold" style={{ color: "var(--text-primary)" }}>{scannedData.name}</span>
                </div>
                <div className="h-px" style={{ background: "var(--border-subtle)" }} />
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: "var(--text-muted)" }}>Patient ID</span>
                  <span className="font-mono font-bold text-sm" style={{ color: "var(--accent-teal)" }}>{scannedData.patientId}</span>
                </div>
                {scannedData.dob && (<><div className="h-px" style={{ background: "var(--border-subtle)" }} /><div className="flex justify-between items-center"><span className="text-sm" style={{ color: "var(--text-muted)" }}>DOB</span><span className="font-medium" style={{ color: "var(--text-primary)" }}>{scannedData.dob}</span></div></>)}
                {scannedData.bloodGroup && (<><div className="h-px" style={{ background: "var(--border-subtle)" }} /><div className="flex justify-between items-center"><span className="text-sm" style={{ color: "var(--text-muted)" }}>Blood Group</span><span className="patient-chip patient-chip-danger">🩸 {scannedData.bloodGroup}</span></div></>)}
              </div>

              {scannedData.allergies?.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>⚠ Allergies</p>
                  <div className="flex flex-wrap gap-2">
                    {scannedData.allergies.map(a => <span key={a} className="patient-chip patient-chip-warning">{a}</span>)}
                  </div>
                </div>
              )}

              {scannedData.conditions?.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Existing Conditions</p>
                  <div className="flex flex-wrap gap-2">
                    {scannedData.conditions.map(c => <span key={c} className="patient-chip patient-chip-info">{c}</span>)}
                  </div>
                </div>
              )}

              <button onClick={() => navigateToPrescribe(scannedData)} className="btn-primary w-full text-sm flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-lg">clinical_notes</span>
                Start Prescription
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
