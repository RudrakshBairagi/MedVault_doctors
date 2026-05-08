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
        try {
          html5QrRef.current.stop().catch(() => {});
        } catch (e) {}
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
          let data;
          try {
            data = JSON.parse(decodedText);
            if (!data.name) data.name = "Scanned Patient";
            if (!data.patientId) data.patientId = "No-ID";
          } catch {
            data = { name: "Scanned Patient", patientId: decodedText };
          }
          setScannedData(data);
          try {
            scanner.stop().catch(() => {});
          } catch (e) {}
          setScanning(false);
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
      try {
        await html5QrRef.current.stop();
      } catch (e) {}
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
    <div className="bg-surface text-on-surface font-body-md text-body-md min-h-screen flex flex-col antialiased">
      {/* Shared Component: TopAppBar */}
      <header className="bg-white dark:bg-slate-900 font-plus-jakarta text-sm tracking-tight docked full-width top-0 border-b border-indigo-50 dark:border-indigo-900/50 shadow-sm shadow-indigo-900/5 flex justify-between items-center w-full px-6 h-16 z-50 sticky">
        {/* Leading Icon */}
        <button className="text-indigo-900 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors active:scale-95 duration-150 p-2 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined">menu</span>
        </button>
        {/* Headline/Brand */}
        <div className="text-xl font-bold tracking-tight text-indigo-900 dark:text-indigo-100 flex-1 text-center md:text-left md:ml-4">
          MedVault
        </div>
        {/* Trailing Icon */}
        <button className="text-indigo-900 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors active:scale-95 duration-150 p-2 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined">notifications</span>
        </button>
      </header>

      {/* Main Content Area - Task-Focused Canvas */}
      <main className="flex-1 flex flex-col items-center justify-center px-container-margin py-stack-xl relative overflow-hidden">
        {/* Ambient Background Glow (Subtle depth) */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-fixed rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
        <div className="w-full max-w-4xl flex flex-col items-center relative z-10">

          {/* Hero - shown when no mode selected */}
          {!mode && !scannedData && (
            <>
              {/* Secure Badge */}
              <div className="inline-flex items-center gap-stack-sm px-4 py-2 rounded-full bg-secondary-container text-on-secondary-container font-label-md text-label-md mb-stack-lg border border-secondary-fixed-dim/50 shadow-sm">
                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                Secure Clinical Access
              </div>

              {/* Page Header */}
              <h1 className="font-display-lg text-display-lg text-on-surface text-center mb-stack-md tracking-tight">
                Identify Your <span className="text-primary">Patient</span>
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant text-center max-w-2xl mb-stack-xl">
                Select an identification method to securely access and manage patient health records. All interactions are logged and encrypted.
              </p>

              {/* Action Cards Container (Bento Grid Style) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-lg w-full">
                {/* Card 1: QR Code Scanner */}
                <button
                  onClick={() => { setMode("scan"); setTimeout(startScanner, 300); }}
                  className="group relative bg-surface-container-lowest rounded-xl p-stack-xl flex flex-col items-center text-center border border-outline-variant hover:border-primary transition-all duration-300 shadow-sm hover:shadow-[0_8px_32px_rgba(0,6,102,0.06)] overflow-hidden text-left w-full"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-fixed to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="w-24 h-24 rounded-full bg-primary-fixed flex items-center justify-center mb-stack-lg group-hover:scale-110 group-hover:bg-primary transition-all duration-500 shadow-[inset_0_2px_10px_rgba(255,255,255,0.5)]">
                    <span className="material-symbols-outlined text-[40px] text-primary group-hover:text-on-primary transition-colors duration-500">qr_code_scanner</span>
                  </div>
                  <h2 className="font-headline-md text-headline-md text-on-surface mb-stack-sm w-full text-center">Scan QR Code</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant w-full text-center">
                    Instantly retrieve records by scanning the patient's digital or physical MedVault access card.
                  </p>
                </button>

                {/* Card 2: Manual Entry */}
                <button
                  onClick={() => setMode("manual")}
                  className="group relative bg-surface-container-lowest rounded-xl p-stack-xl flex flex-col items-center text-center border border-outline-variant hover:border-primary transition-all duration-300 shadow-sm hover:shadow-[0_8px_32px_rgba(0,6,102,0.06)] overflow-hidden text-left w-full"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-fixed to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="w-24 h-24 rounded-full bg-surface-container flex items-center justify-center mb-stack-lg group-hover:scale-110 group-hover:bg-primary transition-all duration-500 shadow-[inset_0_2px_10px_rgba(255,255,255,0.5)]">
                    <span className="material-symbols-outlined text-[40px] text-tertiary group-hover:text-on-primary transition-colors duration-500">keyboard</span>
                  </div>
                  <h2 className="font-headline-md text-headline-md text-on-surface mb-stack-sm w-full text-center">Manual Entry</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant w-full text-center">
                    Search securely using government ID, patient registry number, or verified contact details.
                  </p>
                </button>
              </div>

              {/* Trust / Security Indicators */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-stack-lg mt-stack-xl pt-stack-lg border-t border-surface-variant w-full max-w-2xl opacity-80">
                <div className="flex items-center gap-stack-sm text-on-surface-variant font-label-md text-label-md">
                  <span className="material-symbols-outlined text-[18px]">health_and_safety</span>
                  <span>HIPAA Compliant</span>
                </div>
                <div className="hidden sm:block w-1 h-1 rounded-full bg-outline-variant"></div>
                <div className="flex items-center gap-stack-sm text-on-surface-variant font-label-md text-label-md">
                  <span className="material-symbols-outlined text-[18px]">enhanced_encryption</span>
                  <span>End-to-End Encryption</span>
                </div>
              </div>
            </>
          )}

          {/* QR Scanner Mode */}
          {mode === "scan" && !scannedData && (
            <div className="w-full max-w-lg flex flex-col items-center">
              <button onClick={resetAll} className="self-start flex items-center gap-2 mb-6 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-lg">arrow_back</span> Back
              </button>
              <div className="bg-surface-container-lowest rounded-xl p-8 border border-outline-variant shadow-sm w-full">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary-fixed">
                    <span className="material-symbols-outlined text-primary">qr_code_scanner</span>
                  </div>
                  <div>
                    <h3 className="font-headline-md text-title-lg text-on-surface">Scanning...</h3>
                    <p className="font-body-md text-label-lg text-on-surface-variant">Point camera at patient's MedVault QR</p>
                  </div>
                </div>
                <div className="qr-scanner-container w-full mb-6">
                  <div id="qr-reader" style={{ width: "100%", minHeight: 280 }} />
                </div>
                {error && (
                  <div className="mb-6 flex items-center gap-2 px-4 py-3 rounded-lg bg-error-container text-on-error-container border border-error/20">
                    <span className="material-symbols-outlined text-sm">error</span>
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}
                <button onClick={() => { stopScanner(); setMode("manual"); }} className="w-full py-3 rounded-lg font-label-lg bg-surface-container text-on-surface hover:bg-surface-variant border border-outline-variant transition-colors flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-lg">edit_note</span>
                  Switch to Manual Entry
                </button>
              </div>
            </div>
          )}

          {/* Manual Entry Mode */}
          {mode === "manual" && !scannedData && (
            <div className="w-full max-w-xl flex flex-col items-center">
              <button onClick={resetAll} className="self-start flex items-center gap-2 mb-6 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-lg">arrow_back</span> Back
              </button>
              <div className="bg-surface-container-lowest rounded-xl p-8 border border-outline-variant shadow-sm w-full">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-secondary-container">
                    <span className="material-symbols-outlined text-on-secondary-container">person_add</span>
                  </div>
                  <div>
                    <h3 className="font-headline-md text-title-lg text-on-surface">Patient Details</h3>
                    <p className="font-body-md text-label-lg text-on-surface-variant">Enter patient information to continue</p>
                  </div>
                </div>

                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider mb-1 block text-on-surface-variant">Patient Name *</label>
                      <input className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary-fixed outline-none transition-all" placeholder="e.g. Julian Reed" value={manualForm.name} onChange={(e) => setManualForm({...manualForm, name: e.target.value})} required />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider mb-1 block text-on-surface-variant">MedVault ID *</label>
                      <input className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 text-on-surface font-mono focus:border-primary focus:ring-2 focus:ring-primary-fixed outline-none transition-all" placeholder="MV-XXXX-XXXX" value={manualForm.patientId} onChange={(e) => setManualForm({...manualForm, patientId: e.target.value})} required />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider mb-1 block text-on-surface-variant">Date of Birth</label>
                      <input type="date" className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary-fixed outline-none transition-all" value={manualForm.dob} onChange={(e) => setManualForm({...manualForm, dob: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider mb-1 block text-on-surface-variant">Blood Group</label>
                      <select className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary-fixed outline-none transition-all" value={manualForm.bloodGroup} onChange={(e) => setManualForm({...manualForm, bloodGroup: e.target.value})}>
                        <option value="">Select...</option>
                        {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider mb-1 block text-on-surface-variant">Known Allergies</label>
                    <input className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary-fixed outline-none transition-all" placeholder="Comma separated, e.g. Penicillin, Latex" value={manualForm.allergies} onChange={(e) => setManualForm({...manualForm, allergies: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider mb-1 block text-on-surface-variant">Existing Conditions</label>
                    <input className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary-fixed outline-none transition-all" placeholder="Comma separated, e.g. Hypertension, Diabetes" value={manualForm.conditions} onChange={(e) => setManualForm({...manualForm, conditions: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider mb-1 block text-on-surface-variant">Emergency Contact</label>
                    <input className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary-fixed outline-none transition-all" placeholder="+91 XXXXX XXXXX" value={manualForm.emergencyContact} onChange={(e) => setManualForm({...manualForm, emergencyContact: e.target.value})} />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-error-container text-on-error-container border border-error/20">
                      <span className="material-symbols-outlined text-sm">error</span>
                      <p className="text-sm font-medium">{error}</p>
                    </div>
                  )}

                  <button type="submit" className="w-full py-3 mt-4 rounded-lg font-label-lg bg-primary text-on-primary hover:bg-tertiary transition-colors flex items-center justify-center gap-2 shadow-sm shadow-primary/20">
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    Continue to Prescription
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Scanned Patient Confirmation */}
          {scannedData && (
            <div className="w-full max-w-lg flex flex-col items-center">
              <button onClick={resetAll} className="self-start flex items-center gap-2 mb-6 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-lg">arrow_back</span> Scan Again
              </button>
              <div className="bg-surface-container-lowest rounded-xl p-8 border border-outline-variant shadow-sm w-full">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-green-100 border border-green-200">
                    <span className="material-symbols-outlined text-3xl text-green-600">check_circle</span>
                  </div>
                  <div>
                    <h3 className="font-headline-md text-headline-md text-on-surface">Patient Identified</h3>
                    <p className="font-body-md text-label-lg text-green-600">Identification successful</p>
                  </div>
                </div>

                <div className="space-y-4 mb-8 p-6 rounded-xl bg-surface border border-outline-variant">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-on-surface-variant">Name</span>
                    <span className="font-bold text-on-surface text-lg">{scannedData.name}</span>
                  </div>
                  <div className="h-px bg-outline-variant/50" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-on-surface-variant">Patient ID</span>
                    <span className="font-mono font-bold text-sm text-primary">{scannedData.patientId}</span>
                  </div>
                  {scannedData.dob && (
                    <>
                      <div className="h-px bg-outline-variant/50" />
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-on-surface-variant">DOB</span>
                        <span className="font-medium text-on-surface">{scannedData.dob}</span>
                      </div>
                    </>
                  )}
                  {scannedData.bloodGroup && (
                    <>
                      <div className="h-px bg-outline-variant/50" />
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-on-surface-variant">Blood Group</span>
                        <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold border border-red-200">🩸 {scannedData.bloodGroup}</span>
                      </div>
                    </>
                  )}
                </div>

                {scannedData.allergies?.length > 0 && (
                  <div className="mb-6">
                    <p className="text-xs font-semibold uppercase tracking-wider mb-3 text-on-surface-variant">⚠ Allergies</p>
                    <div className="flex flex-wrap gap-2">
                      {scannedData.allergies.map(a => <span key={a} className="px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold border border-orange-200">{a}</span>)}
                    </div>
                  </div>
                )}

                {scannedData.conditions?.length > 0 && (
                  <div className="mb-8">
                    <p className="text-xs font-semibold uppercase tracking-wider mb-3 text-on-surface-variant">Existing Conditions</p>
                    <div className="flex flex-wrap gap-2">
                      {scannedData.conditions.map(c => <span key={c} className="px-3 py-1.5 rounded-full bg-primary-fixed text-primary text-xs font-bold border border-primary-fixed-dim">{c}</span>)}
                    </div>
                  </div>
                )}

                <button onClick={() => navigateToPrescribe(scannedData)} className="w-full py-3.5 rounded-lg font-label-lg bg-primary text-on-primary hover:bg-tertiary transition-colors flex items-center justify-center gap-2 shadow-sm shadow-primary/20">
                  <span className="material-symbols-outlined text-lg">clinical_notes</span>
                  Start Prescription
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
