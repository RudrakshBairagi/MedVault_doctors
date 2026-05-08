"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const COMMON_SYMPTOMS = [
  "Fever", "Cough", "Headache", "Nausea",
  "Fatigue", "Sore Throat", "Body Ache", "Dizziness"
];

export default function PrescribePage() {
  const router = useRouter();
  const [patient, setPatient] = useState(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [medications, setMedications] = useState([]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [symptomQuery, setSymptomQuery] = useState("");
  const [symptomSuggestions, setSymptomSuggestions] = useState([]);
  const [newMed, setNewMed] = useState({ name: "", dosage: "", duration: "" });
  const [medSuggestions, setMedSuggestions] = useState([]);

  // Load patient from session
  useEffect(() => {
    const stored = sessionStorage.getItem("medvault_patient");
    if (!stored) {
      router.push("/");
      return;
    }
    setPatient(JSON.parse(stored));
  }, [router]);

  // Fetch Symptoms from NIH
  useEffect(() => {
    if (symptomQuery.length < 2) { setSymptomSuggestions([]); return; }
    const fetchSymptoms = async () => {
      try {
        const res = await fetch(`https://clinicaltables.nlm.nih.gov/api/conditions/v3/search?terms=${symptomQuery}&df=primary_name`);
        const data = await res.json();
        if (data && data[3]) setSymptomSuggestions(data[3].map(item => item[0]));
      } catch (err) { console.error("Failed to fetch symptoms", err); }
    };
    const tid = setTimeout(fetchSymptoms, 300);
    return () => clearTimeout(tid);
  }, [symptomQuery]);

  // Fetch Medications from NIH
  useEffect(() => {
    if (newMed.name.length < 2) { setMedSuggestions([]); return; }
    const fetchMeds = async () => {
      try {
        const res = await fetch(`https://clinicaltables.nlm.nih.gov/api/rxterms/v3/search?terms=${newMed.name}`);
        const data = await res.json();
        if (data && data[3]) setMedSuggestions(data[3].map(item => item[0]));
      } catch (err) { console.error("Failed to fetch medications", err); }
    };
    const tid = setTimeout(fetchMeds, 300);
    return () => clearTimeout(tid);
  }, [newMed.name]);

  const addSymptom = (s) => {
    if (!selectedSymptoms.includes(s)) setSelectedSymptoms([...selectedSymptoms, s]);
    setSymptomQuery("");
    setSymptomSuggestions([]);
  };
  const removeSymptom = (s) => setSelectedSymptoms(selectedSymptoms.filter(x => x !== s));

  const addMedication = () => {
    if (newMed.name && newMed.dosage) {
      setMedications([...medications, newMed]);
      setNewMed({ name: "", dosage: "", duration: "" });
      setMedSuggestions([]);
    }
  };
  const removeMedication = (i) => setMedications(medications.filter((_, idx) => idx !== i));

  const handleUpload = async () => {
    setIsSubmitting(true);
    console.log("Uploading:", { patient, symptoms: selectedSymptoms, medications, notes });
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 1500);
  };

  const handleNewPrescription = () => {
    sessionStorage.removeItem("medvault_patient");
    router.push("/");
  };

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)" }}>
        <div className="shimmer w-64 h-8" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--bg-primary)" }}>
        <div className="glass-card p-10 max-w-md w-full text-center animate-fade-in-up" style={{ opacity: 0, animationFillMode: "forwards" }}>
          <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: "rgba(16,185,129,0.15)", border: "2px solid rgba(16,185,129,0.3)" }}>
            <span className="material-symbols-outlined text-4xl" style={{ color: "var(--accent-emerald)" }}>check_circle</span>
          </div>
          <h2 className="text-2xl font-extrabold mb-2" style={{ color: "var(--text-primary)" }}>Prescription Uploaded</h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
            Successfully uploaded to <strong>{patient.name}</strong>'s MedVault.
          </p>
          <div className="flex flex-col gap-3">
            <button onClick={handleNewPrescription} className="btn-primary text-sm flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-lg">person_search</span>
              New Patient
            </button>
            <button onClick={() => { setSubmitted(false); setSelectedSymptoms([]); setMedications([]); setNotes(""); }} className="btn-secondary text-sm">
              Prescribe Again for {patient.name}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* BG Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-15" style={{ background: "radial-gradient(circle, var(--accent-teal) 0%, transparent 70%)" }} />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full opacity-8" style={{ background: "radial-gradient(circle, var(--accent-cyan) 0%, transparent 70%)" }} />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5 animate-fade-in-up" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center gap-3">
          <button onClick={handleNewPrescription} className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
            <span className="material-symbols-outlined text-lg" style={{ color: "var(--text-secondary)" }}>arrow_back</span>
          </button>
          <div>
            <h1 className="text-lg font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Clinical <span className="gradient-text">Prescription</span>
            </h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Builder</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: "var(--accent-teal-dim)", border: "1px solid rgba(20,184,166,0.2)" }}>
          <div className="dot-pulse" />
          <span className="text-xs font-semibold" style={{ color: "var(--accent-teal)" }}>NIH Connected</span>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left - Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Symptoms */}
            <div className="glass-card p-6 animate-fade-in-up" style={{ opacity: 0, animationFillMode: "forwards", animationDelay: "0.1s" }}>
              <div className="flex items-center gap-3 mb-5">
                <span className="material-symbols-outlined" style={{ color: "var(--accent-teal)" }}>stethoscope</span>
                <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Diagnosis / Symptoms</h2>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {COMMON_SYMPTOMS.map((s) => (
                  <button key={s} onClick={() => selectedSymptoms.includes(s) ? removeSymptom(s) : addSymptom(s)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer"
                    style={selectedSymptoms.includes(s) ? { background: "var(--accent-teal)", color: "#fff" } : { background: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>
                    {selectedSymptoms.includes(s) ? "✓ " : "+ "}{s}
                  </button>
                ))}
              </div>
              <div className="relative mb-4">
                <input className="input-field" placeholder="Search 10,000+ medical conditions..." value={symptomQuery} onChange={(e) => setSymptomQuery(e.target.value)} />
                {symptomSuggestions.length > 0 && (
                  <ul className="absolute z-20 w-full mt-2 rounded-xl overflow-hidden max-h-48 overflow-y-auto" style={{ background: "var(--bg-card)", border: "1px solid var(--border-active)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
                    {symptomSuggestions.map((s, i) => (
                      <li key={i} onClick={() => addSymptom(s)} className="px-4 py-3 cursor-pointer text-sm transition-colors" style={{ color: "var(--text-primary)", borderBottom: "1px solid var(--border-subtle)" }}
                        onMouseEnter={e => e.target.style.background = "var(--accent-teal-dim)"} onMouseLeave={e => e.target.style.background = "transparent"}>
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {selectedSymptoms.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedSymptoms.map(s => (
                    <span key={s} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium" style={{ background: "var(--accent-teal-dim)", color: "#5eead4", border: "1px solid rgba(20,184,166,0.2)" }}>
                      {s}
                      <button onClick={() => removeSymptom(s)} className="hover:opacity-70 cursor-pointer"><span className="material-symbols-outlined text-sm">close</span></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Medications */}
            <div className="glass-card p-6 animate-fade-in-up" style={{ opacity: 0, animationFillMode: "forwards", animationDelay: "0.2s" }}>
              <div className="flex items-center gap-3 mb-5">
                <span className="material-symbols-outlined" style={{ color: "#818cf8" }}>medication</span>
                <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Prescribe Medication</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div className="relative">
                  <input className="input-field text-sm" placeholder="Search medicine..." value={newMed.name} onChange={(e) => setNewMed({...newMed, name: e.target.value})} />
                  {medSuggestions.length > 0 && (
                    <ul className="absolute z-20 w-full mt-2 rounded-xl overflow-hidden max-h-48 overflow-y-auto" style={{ background: "var(--bg-card)", border: "1px solid var(--border-active)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
                      {medSuggestions.map((s, i) => (
                        <li key={i} onClick={() => { setNewMed({...newMed, name: s}); setMedSuggestions([]); }} className="px-4 py-2.5 cursor-pointer text-sm transition-colors" style={{ color: "var(--text-primary)", borderBottom: "1px solid var(--border-subtle)" }}
                          onMouseEnter={e => e.target.style.background = "rgba(99,102,241,0.1)"} onMouseLeave={e => e.target.style.background = "transparent"}>
                          {s}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <input className="input-field text-sm" placeholder="Dosage (e.g. 1-0-1)" value={newMed.dosage} onChange={(e) => setNewMed({...newMed, dosage: e.target.value})} />
                <div className="flex gap-2">
                  <input className="input-field text-sm flex-1" placeholder="Duration" value={newMed.duration} onChange={(e) => setNewMed({...newMed, duration: e.target.value})} />
                  <button onClick={addMedication} className="btn-primary px-4 py-2 text-sm whitespace-nowrap" style={{ borderRadius: 14 }}>Add</button>
                </div>
              </div>
              {medications.length > 0 && (
                <div className="space-y-2 mt-4">
                  {medications.map((med, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{med.name}</p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{med.dosage}{med.duration ? ` • ${med.duration}` : ""}</p>
                      </div>
                      <button onClick={() => removeMedication(i)} className="text-xs font-medium px-3 py-1 rounded-lg cursor-pointer" style={{ background: "rgba(239,68,68,0.1)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.2)" }}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="glass-card p-6 animate-fade-in-up" style={{ opacity: 0, animationFillMode: "forwards", animationDelay: "0.3s" }}>
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined" style={{ color: "var(--warning)" }}>clinical_notes</span>
                <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Clinical Notes & Advice</h2>
              </div>
              <textarea rows="4" placeholder="Dietary restrictions, next visit, general advice..." className="input-field resize-none" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Patient Card */}
            <div className="animate-fade-in-up rounded-2xl p-6 relative overflow-hidden" style={{ opacity: 0, animationFillMode: "forwards", animationDelay: "0.15s", background: "linear-gradient(135deg, #0d3b30 0%, #0a2f28 100%)", border: "1px solid rgba(20,184,166,0.2)" }}>
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10" style={{ background: "var(--accent-teal)" }} />
              <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "var(--accent-teal)" }}>Patient</h3>
              <p className="text-xl font-extrabold mb-1" style={{ color: "var(--text-primary)" }}>{patient.name}</p>
              <p className="font-mono text-sm mb-4" style={{ color: "var(--accent-teal)" }}>{patient.patientId}</p>
              {patient.bloodGroup && <span className="patient-chip patient-chip-danger mb-3">🩸 {patient.bloodGroup}</span>}
              {patient.allergies?.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>Allergies</p>
                  <div className="flex flex-wrap gap-1">{patient.allergies.map(a => <span key={a} className="patient-chip patient-chip-warning text-xs">{a}</span>)}</div>
                </div>
              )}
              {patient.conditions?.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>Conditions</p>
                  <div className="flex flex-wrap gap-1">{patient.conditions.map(c => <span key={c} className="patient-chip patient-chip-info text-xs">{c}</span>)}</div>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="glass-card p-6 animate-fade-in-up" style={{ opacity: 0, animationFillMode: "forwards", animationDelay: "0.25s" }}>
              <h3 className="text-lg font-bold mb-4" style={{ color: "var(--text-primary)" }}>Summary</h3>
              <div className="space-y-3 mb-5">
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--text-muted)" }}>Symptoms</span>
                  <span className="font-bold px-2 py-0.5 rounded-md" style={{ background: "var(--bg-card)", color: "var(--text-primary)" }}>{selectedSymptoms.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--text-muted)" }}>Medications</span>
                  <span className="font-bold px-2 py-0.5 rounded-md" style={{ background: "var(--bg-card)", color: "var(--text-primary)" }}>{medications.length}</span>
                </div>
              </div>
              <div className="h-px mb-5" style={{ background: "var(--border-subtle)" }} />
              <button onClick={handleUpload} disabled={isSubmitting || selectedSymptoms.length === 0}
                className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${isSubmitting || selectedSymptoms.length === 0 ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                style={{ background: isSubmitting || selectedSymptoms.length === 0 ? "var(--bg-card)" : "linear-gradient(135deg, var(--accent-teal), var(--accent-emerald))", color: isSubmitting || selectedSymptoms.length === 0 ? "var(--text-muted)" : "#fff" }}>
                {isSubmitting ? (
                  <><span className="material-symbols-outlined text-lg animate-spin">progress_activity</span> Uploading...</>
                ) : (
                  <><span className="material-symbols-outlined text-lg">cloud_upload</span> Upload to MedVault</>
                )}
              </button>
              {selectedSymptoms.length === 0 && (
                <p className="text-xs text-center mt-3 py-2 rounded-lg" style={{ background: "rgba(245,158,11,0.1)", color: "#fcd34d", border: "1px solid rgba(245,158,11,0.15)" }}>
                  Add at least one symptom to continue.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
