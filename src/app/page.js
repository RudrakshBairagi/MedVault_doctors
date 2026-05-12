"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function DoctorHome() {
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
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
      // ensure cleanup of previous instance if it exists
      if (html5QrRef.current) {
        try {
          await html5QrRef.current.stop();
          html5QrRef.current.clear();
        } catch (e) {}
      }
      
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
            scanner.stop().then(() => scanner.clear()).catch(() => {});
          } catch (e) {}
          setScanning(false);
        },
        () => {} // ignore scan failures
      );
    } catch (err) {
      console.error("Scanner Error:", err);
      setError("Camera access denied or unavailable. Please ensure you are on localhost or HTTPS, or try manual entry instead.");
      setScanning(false);
    }
  }, []);

  const stopScanner = useCallback(async () => {
    if (html5QrRef.current) {
      try {
        const state = html5QrRef.current.getState();
        if (state !== 1) { // 1 is UNKNOWN/NOT_STARTED
          await html5QrRef.current.stop();
        }
        html5QrRef.current.clear();
      } catch (e) {}
      html5QrRef.current = null;
    }
    setScanning(false);
  }, []);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualForm.patientId) {
      setError("Patient ID is required.");
      return;
    }
    
    // Simulate fetching patient data from the network
    const patientData = {
      name: manualForm.name || "Scanned Patient",
      patientId: manualForm.patientId,
      dob: manualForm.dob || "1985-06-20",
      bloodGroup: manualForm.bloodGroup || "A+",
      allergies: manualForm.allergies ? manualForm.allergies.split(",").map(a => a.trim()) : [],
      conditions: manualForm.conditions ? manualForm.conditions.split(",").map(c => c.trim()) : [],
      emergencyContact: manualForm.emergencyContact || "+1 555-0100"
    };

    // Auto-fill Julian's mock data if the ID matches or if it came from the drawer click
    if (manualForm.patientId.includes("0042") || manualForm.name === "Julian Reed") {
       patientData.name = "Julian Reed";
       patientData.dob = "1990-03-15";
       patientData.bloodGroup = "O+";
       patientData.allergies = ["Penicillin", "Latex"];
       patientData.conditions = ["Hypertension", "Type 2 Diabetes"];
    }

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

      {/* Navigation Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[100] flex">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-indigo-900/20 backdrop-blur-sm transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          ></div>
          
          {/* Drawer Content */}
          <div className="relative w-80 max-w-[80vw] bg-surface h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-300 border-r border-outline-variant">
            {/* Doctor Profile Header */}
            <div className="p-6 bg-surface-container-low border-b border-outline-variant relative overflow-hidden">
              {/* Decorative blob */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-fixed/40 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
              
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="w-16 h-16 rounded-full bg-primary-fixed border-4 border-surface shadow-sm flex items-center justify-center overflow-hidden">
                  <span className="material-symbols-outlined text-3xl text-primary">medical_services</span>
                </div>
                <button onClick={() => setIsDrawerOpen(false)} className="text-on-surface-variant/70 hover:text-on-surface transition-colors p-1.5 rounded-full hover:bg-surface-variant">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              <div className="relative z-10">
                <h2 className="text-xl font-headline-md text-on-surface tracking-tight mb-0.5">Dr. Sarah Jenkins</h2>
                <p className="text-sm font-body-md text-on-surface-variant mb-4">Chief Medical Officer</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest bg-surface border border-outline-variant text-on-surface-variant uppercase shadow-sm">MED-88392</span>
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest bg-[#e8f5e9] border border-[#c8e6c9] text-[#2e7d32] uppercase shadow-sm flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4caf50]"></span> Active
                  </span>
                </div>
              </div>
            </div>

            {/* Previous Patients List */}
            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4 px-2">Recent Patients</h3>
              <div className="space-y-2">
                
                {/* Patient 1 */}
                <button onClick={() => { setManualForm({ ...manualForm, name: "Julian Reed", patientId: "MV-2024-0042", dob: "1990-03-15", bloodGroup: "O+", allergies: "Penicillin, Latex", conditions: "Hypertension, Type 2 Diabetes" }); setMode("manual"); setIsDrawerOpen(false); }} className="w-full text-left p-3 rounded-xl hover:bg-surface-variant transition-colors group">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">Julian Reed</p>
                    <span className="text-[10px] text-primary font-bold bg-primary-fixed px-1.5 py-0.5 rounded">Today</span>
                  </div>
                  <p className="font-mono text-xs text-on-surface-variant mb-1">MV-2024-0042</p>
                  <p className="text-xs text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">prescriptions</span> Prescribed Lisinopril
                  </p>
                </button>

                {/* Patient 2 */}
                <button className="w-full text-left p-3 rounded-xl hover:bg-surface-variant transition-colors group">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">Emily Chen</p>
                    <span className="text-[10px] text-on-surface-variant">Yesterday</span>
                  </div>
                  <p className="font-mono text-xs text-on-surface-variant mb-1">MV-2023-1120</p>
                  <p className="text-xs text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">medical_information</span> Routine Checkup
                  </p>
                </button>

                {/* Patient 3 */}
                <button className="w-full text-left p-3 rounded-xl hover:bg-surface-variant transition-colors group">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">Marcus Johnson</p>
                    <span className="text-[10px] text-on-surface-variant">Oct 20</span>
                  </div>
                  <p className="font-mono text-xs text-on-surface-variant mb-1">MV-2024-0105</p>
                  <p className="text-xs text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">monitor_heart</span> Cardiology Consult
                  </p>
                </button>

                {/* Patient 4 */}
                <button className="w-full text-left p-3 rounded-xl hover:bg-surface-variant transition-colors group">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">Sarah Williams</p>
                    <span className="text-[10px] text-on-surface-variant">Oct 15</span>
                  </div>
                  <p className="font-mono text-xs text-on-surface-variant mb-1">MV-2022-8493</p>
                  <p className="text-xs text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">blood_test</span> Lab Results Review
                  </p>
                </button>

              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-outline-variant bg-surface-container-lowest">
              <button className="w-full py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-bold text-error hover:bg-error-container transition-colors">
                <span className="material-symbols-outlined text-[18px]">logout</span> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shared Component: TopAppBar */}
      <header className="bg-white dark:bg-slate-900 font-plus-jakarta text-sm tracking-tight docked full-width top-0 border-b border-indigo-50 dark:border-indigo-900/50 shadow-sm shadow-indigo-900/5 flex justify-between items-center w-full px-6 h-16 z-50 sticky">
        {/* Leading Icon */}
        <button onClick={() => setIsDrawerOpen(true)} className="text-indigo-900 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors active:scale-95 duration-150 p-2 rounded-full flex items-center justify-center">
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
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider mb-2 block text-on-surface-variant">MedVault ID</label>
                    <input 
                      className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-4 text-on-surface font-mono focus:border-primary focus:ring-2 focus:ring-primary-fixed outline-none transition-all shadow-inner" 
                      placeholder="e.g. MV-2024-0042" 
                      value={manualForm.patientId} 
                      onChange={(e) => setManualForm({...manualForm, patientId: e.target.value})} 
                      required 
                      autoFocus
                    />
                    <p className="text-xs text-on-surface-variant mt-3 text-center">
                      Our system will securely fetch the patient's records linked to this ID.
                    </p>
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
