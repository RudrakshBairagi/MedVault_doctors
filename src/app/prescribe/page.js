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
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-64 h-8 bg-surface-variant rounded-full animate-pulse" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-6">
        <div className="bg-surface-container-lowest border border-outline-variant shadow-sm p-10 max-w-md w-full rounded-2xl text-center">
          <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center bg-green-100 border-2 border-green-200">
            <span className="material-symbols-outlined text-4xl text-green-600">check_circle</span>
          </div>
          <h2 className="font-headline-lg text-headline-md text-on-surface mb-2">Prescription Uploaded</h2>
          <p className="font-body-md text-on-surface-variant mb-8">
            Successfully uploaded to <strong className="text-on-surface">{patient.name}</strong>'s MedVault.
          </p>
          <div className="flex flex-col gap-3">
            <button onClick={handleNewPrescription} className="w-full py-3 rounded-lg font-label-lg bg-primary text-on-primary hover:bg-tertiary transition-colors flex items-center justify-center gap-2 shadow-sm">
              <span className="material-symbols-outlined text-lg">person_search</span>
              New Patient
            </button>
            <button onClick={() => { setSubmitted(false); setSelectedSymptoms([]); setMedications([]); setNotes(""); }} className="w-full py-3 rounded-lg font-label-lg bg-surface-container text-on-surface hover:bg-surface-variant border border-outline-variant transition-colors">
              Prescribe Again for {patient.name}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body-md antialiased flex flex-col">
      {/* Shared Component: TopAppBar */}
      <header className="bg-white dark:bg-slate-900 font-plus-jakarta text-sm tracking-tight docked full-width top-0 border-b border-indigo-50 dark:border-indigo-900/50 shadow-sm shadow-indigo-900/5 flex justify-between items-center w-full px-6 h-16 z-50 sticky">
        <div className="flex items-center gap-3">
          <button onClick={handleNewPrescription} className="text-indigo-900 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors active:scale-95 duration-150 p-2 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-indigo-900 dark:text-indigo-100">
              Clinical <span className="text-primary">Prescription</span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-fixed border border-primary-fixed-dim">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-semibold text-primary">NIH Connected</span>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-6 md:px-12 py-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left - Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Symptoms */}
            <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <span className="material-symbols-outlined text-primary">stethoscope</span>
                <h2 className="font-headline-md text-title-lg text-on-surface">Diagnosis / Symptoms</h2>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {COMMON_SYMPTOMS.map((s) => (
                  <button key={s} onClick={() => selectedSymptoms.includes(s) ? removeSymptom(s) : addSymptom(s)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer border ${
                      selectedSymptoms.includes(s) 
                        ? "bg-primary text-on-primary border-primary" 
                        : "bg-surface text-on-surface-variant border-outline-variant hover:border-primary"
                    }`}>
                    {selectedSymptoms.includes(s) ? "✓ " : "+ "}{s}
                  </button>
                ))}
              </div>
              <div className="relative mb-4">
                <input className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary-fixed outline-none transition-all" placeholder="Search 10,000+ medical conditions..." value={symptomQuery} onChange={(e) => setSymptomQuery(e.target.value)} />
                {symptomSuggestions.length > 0 && (
                  <ul className="absolute z-20 w-full mt-2 rounded-xl overflow-hidden max-h-48 overflow-y-auto bg-surface-container-lowest border border-outline-variant shadow-lg">
                    {symptomSuggestions.map((s, i) => (
                      <li key={i} onClick={() => addSymptom(s)} className="px-4 py-3 cursor-pointer text-sm text-on-surface border-b border-outline-variant hover:bg-surface-variant transition-colors">
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {selectedSymptoms.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedSymptoms.map(s => (
                    <span key={s} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary-fixed text-on-primary-fixed border border-primary-fixed-dim">
                      {s}
                      <button onClick={() => removeSymptom(s)} className="hover:opacity-70 cursor-pointer"><span className="material-symbols-outlined text-sm">close</span></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Medications */}
            <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <span className="material-symbols-outlined text-tertiary">medication</span>
                <h2 className="font-headline-md text-title-lg text-on-surface">Prescribe Medication</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div className="relative">
                  <input className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 text-sm text-on-surface focus:border-primary focus:ring-2 focus:ring-primary-fixed outline-none transition-all" placeholder="Search medicine..." value={newMed.name} onChange={(e) => setNewMed({...newMed, name: e.target.value})} />
                  {medSuggestions.length > 0 && (
                    <ul className="absolute z-20 w-full mt-2 rounded-xl overflow-hidden max-h-48 overflow-y-auto bg-surface-container-lowest border border-outline-variant shadow-lg">
                      {medSuggestions.map((s, i) => (
                        <li key={i} onClick={() => { setNewMed({...newMed, name: s}); setMedSuggestions([]); }} className="px-4 py-3 cursor-pointer text-sm text-on-surface border-b border-outline-variant hover:bg-surface-variant transition-colors">
                          {s}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <input className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 text-sm text-on-surface focus:border-primary focus:ring-2 focus:ring-primary-fixed outline-none transition-all" placeholder="Dosage (e.g. 1-0-1)" value={newMed.dosage} onChange={(e) => setNewMed({...newMed, dosage: e.target.value})} />
                <div className="flex gap-2">
                  <input className="flex-1 bg-surface border border-outline-variant rounded-lg px-4 py-3 text-sm text-on-surface focus:border-primary focus:ring-2 focus:ring-primary-fixed outline-none transition-all" placeholder="Duration" value={newMed.duration} onChange={(e) => setNewMed({...newMed, duration: e.target.value})} />
                  <button onClick={addMedication} className="bg-primary text-on-primary font-label-lg px-4 py-2 rounded-lg hover:bg-tertiary transition-colors">Add</button>
                </div>
              </div>
              {medications.length > 0 && (
                <div className="space-y-2 mt-4">
                  {medications.map((med, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl bg-surface border border-outline-variant">
                      <div>
                        <p className="font-semibold text-sm text-on-surface">{med.name}</p>
                        <p className="text-xs text-on-surface-variant">{med.dosage}{med.duration ? ` • ${med.duration}` : ""}</p>
                      </div>
                      <button onClick={() => removeMedication(i)} className="text-xs font-medium px-3 py-1 rounded-lg bg-error-container text-on-error-container border border-error/20 hover:bg-error hover:text-on-error transition-colors">Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-on-surface-variant">clinical_notes</span>
                <h2 className="font-headline-md text-title-lg text-on-surface">Clinical Notes & Advice</h2>
              </div>
              <textarea rows="4" placeholder="Dietary restrictions, next visit, general advice..." className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary-fixed outline-none transition-all resize-none" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Patient Card */}
            <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-primary"></div>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-4 text-primary mt-2">Patient Details</h3>
              <p className="font-headline-lg text-title-lg mb-1 text-on-surface">{patient.name}</p>
              <p className="font-mono text-sm mb-4 text-on-surface-variant">{patient.patientId}</p>
              {patient.bloodGroup && <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200 mb-3">🩸 {patient.bloodGroup}</span>}
              {patient.allergies?.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold mb-2 text-on-surface-variant">Allergies</p>
                  <div className="flex flex-wrap gap-1">{patient.allergies.map(a => <span key={a} className="px-2 py-1 rounded-md bg-orange-100 text-orange-700 text-xs font-bold border border-orange-200">{a}</span>)}</div>
                </div>
              )}
              {patient.conditions?.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold mb-2 text-on-surface-variant">Conditions</p>
                  <div className="flex flex-wrap gap-1">{patient.conditions.map(c => <span key={c} className="px-2 py-1 rounded-md bg-primary-fixed text-primary text-xs font-bold border border-primary-fixed-dim">{c}</span>)}</div>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant shadow-sm">
              <h3 className="font-headline-md text-title-lg mb-4 text-on-surface">Summary</h3>
              <div className="space-y-3 mb-5">
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">Symptoms</span>
                  <span className="font-bold px-2 py-0.5 rounded-md bg-surface text-on-surface border border-outline-variant">{selectedSymptoms.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">Medications</span>
                  <span className="font-bold px-2 py-0.5 rounded-md bg-surface text-on-surface border border-outline-variant">{medications.length}</span>
                </div>
              </div>
              <div className="h-px w-full bg-outline-variant/50 mb-5" />
              <button onClick={handleUpload} disabled={isSubmitting || selectedSymptoms.length === 0}
                className={`w-full py-3.5 rounded-lg font-label-lg transition-all flex items-center justify-center gap-2 ${isSubmitting || selectedSymptoms.length === 0 ? "opacity-50 cursor-not-allowed bg-surface-container text-on-surface-variant border border-outline-variant" : "bg-primary text-on-primary shadow-sm hover:bg-tertiary"}`}>
                {isSubmitting ? (
                  <><span className="material-symbols-outlined text-lg animate-spin">progress_activity</span> Uploading...</>
                ) : (
                  <><span className="material-symbols-outlined text-lg">cloud_upload</span> Upload to MedVault</>
                )}
              </button>
              {selectedSymptoms.length === 0 && (
                <p className="text-xs text-center mt-3 py-2 rounded-lg bg-surface-variant text-on-surface-variant border border-outline-variant">
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
