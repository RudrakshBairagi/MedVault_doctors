"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const PAST_DOCS = [
  {
    id: "DOC-001",
    date: "10 May 2024",
    type: "Prescription",
    doctor: "Dr. Sarah Jenkins",
    title: "General Checkup Rx",
    description: "Prescribed Amoxicillin for mild throat infection.",
    icon: "prescriptions",
    color: "text-blue-600 bg-blue-100 border-blue-200"
  },
  {
    id: "DOC-002",
    date: "15 Apr 2024",
    type: "Lab Report",
    doctor: "City Diagnostics",
    title: "Complete Blood Count (CBC)",
    description: "Routine blood work. All parameters within normal ranges.",
    icon: "science",
    color: "text-purple-600 bg-purple-100 border-purple-200"
  },
  {
    id: "DOC-003",
    date: "22 Nov 2023",
    type: "Imaging",
    doctor: "Dr. Robert Chen",
    title: "Chest X-Ray",
    description: "Annual screening. Clear lungs, no abnormalities detected.",
    icon: "pulmonology",
    color: "text-orange-600 bg-orange-100 border-orange-200"
  },
  {
    id: "DOC-004",
    date: "05 Sep 2023",
    type: "Prescription",
    doctor: "Dr. Sarah Jenkins",
    title: "Allergy Medication",
    description: "Prescribed antihistamines for seasonal allergies.",
    icon: "prescriptions",
    color: "text-blue-600 bg-blue-100 border-blue-200"
  }
];

export default function HistoryPage() {
  const router = useRouter();
  const [patient, setPatient] = useState(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("medvault_patient");
    if (!stored) {
      router.push("/");
      return;
    }
    setPatient(JSON.parse(stored));
  }, [router]);

  const handleBack = () => {
    router.push("/");
  };

  if (!patient) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-64 h-8 bg-surface-variant rounded-full animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body-md antialiased flex flex-col pb-12">
      {/* TopAppBar */}
      <header className="bg-primary text-white font-plus-jakarta text-sm tracking-tight docked full-width top-0 shadow-md flex justify-between items-center w-full px-6 h-16 z-50 sticky">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="text-white hover:bg-white/10 transition-colors active:scale-95 duration-150 p-2 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">
              Clinical History
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 border border-white/30">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="text-xs font-semibold text-white">Encrypted Vault</span>
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-8 space-y-8">
        
        {/* Patient Header Card */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant shadow-sm relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-primary"></div>
          <div className="flex items-center gap-5 mt-2">
            <img 
              src={patient.name === 'Julian Reed' ? "https://lh3.googleusercontent.com/aida-public/AB6AXuBHZCPn7NSZ2wu_mpVYu5uo2tcRmwuvX1JjcwapY_A8k-PEoefNVVP2qS9-v3U2fhpyClVhtCy7iDgZs-5tlguih_1U5vfdVySYWESX61Jmhdj7eqgYhU5-CtRU_zV5GO-i5NkVBdVcfIRM7YLW8ya5cYrhVU-wLHQVOp_GOoRWZG34gwXYor-quySTVe00p_hgF3vENghkwcWuNGh9AMfgpdFMs7uRdIDzgqMn7Gm99tfJAlXrkaJy8wLOAE2tH_IhRCoT7mQgldw" : `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name)}&background=e0e0ff&color=000666`} 
              className="w-20 h-20 rounded-full border-4 border-primary-fixed object-cover shadow-sm shrink-0" 
              alt={patient.name} 
            />
            <div>
              <h2 className="font-headline-lg text-2xl font-bold mb-1 text-on-surface">{patient.name}</h2>
              <p className="font-mono text-sm text-on-surface-variant mb-2">{patient.patientId}</p>
              <div className="flex flex-wrap gap-2">
                {patient.bloodGroup && (
                  <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold border border-red-200">
                    🩸 {patient.bloodGroup}
                  </span>
                )}
                {patient.allergies?.length > 0 && (
                  <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold border border-orange-200">
                    ⚠ {patient.allergies.length} Allergies
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 w-full md:w-auto mt-4 md:mt-0">
            <button onClick={() => router.push("/prescribe")} className="w-full md:w-auto px-6 py-3 rounded-lg font-label-lg bg-primary text-on-primary hover:bg-tertiary transition-colors flex items-center justify-center gap-2 shadow-sm shadow-primary/20">
              <span className="material-symbols-outlined text-lg">clinical_notes</span>
              Start Prescription
            </button>
            <label className="w-full md:w-auto px-6 py-3 rounded-lg font-label-lg bg-surface-container text-on-surface hover:bg-surface-variant border border-outline-variant transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer">
              <span className="material-symbols-outlined text-lg">upload_file</span>
              Upload Document
              <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={(e) => { if(e.target.files.length) { alert("Document uploaded securely to " + patient.name + "'s MedVault!"); } }} />
            </label>
          </div>
        </div>

        {/* Timeline / Records List */}
        <div>
          <h3 className="font-headline-md text-xl mb-6 text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">folder_open</span>
            Past Documentations
          </h3>

          <div className="space-y-4">
            {PAST_DOCS.map((doc) => (
              <div key={doc.id} className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant shadow-sm hover:shadow-md transition-shadow group cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${doc.color} shrink-0`}>
                    <span className="material-symbols-outlined text-2xl">{doc.icon}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-bold text-on-surface text-lg group-hover:text-primary transition-colors">{doc.title}</h4>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-surface-variant text-on-surface-variant">{doc.type}</span>
                    </div>
                    <p className="text-sm text-on-surface-variant mb-2">{doc.description}</p>
                    <div className="flex items-center gap-4 text-xs font-medium text-on-surface-variant">
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">calendar_today</span> {doc.date}</span>
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">stethoscope</span> {doc.doctor}</span>
                    </div>
                  </div>
                </div>
                
                <button className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-surface-variant text-on-surface-variant group-hover:bg-primary-fixed group-hover:text-primary transition-colors shrink-0">
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
