"use client";
import { useState, useEffect, useRef } from "react";

const COMMON_SYMPTOMS = [
  "Fever", "Cough", "Headache", "Nausea", 
  "Fatigue", "Sore Throat", "Body Ache", "Dizziness"
];

export default function DoctorDashboard() {
  const [patientId, setPatientId] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [medications, setMedications] = useState([]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-complete States
  const [symptomQuery, setSymptomQuery] = useState("");
  const [symptomSuggestions, setSymptomSuggestions] = useState([]);
  
  const [newMed, setNewMed] = useState({ name: "", dosage: "", duration: "" });
  const [medSuggestions, setMedSuggestions] = useState([]);

  // Fetch Symptoms from NIH Clinical API
  useEffect(() => {
    if (symptomQuery.length < 2) {
      setSymptomSuggestions([]);
      return;
    }
    const fetchSymptoms = async () => {
      try {
        const res = await fetch(`https://clinicaltables.nlm.nih.gov/api/conditions/v3/search?terms=${symptomQuery}&df=primary_name`);
        const data = await res.json();
        // The NIH API returns an array where index 3 has the actual string values
        if (data && data[3]) {
          setSymptomSuggestions(data[3].map(item => item[0]));
        }
      } catch (err) {
        console.error("Failed to fetch symptoms", err);
      }
    };
    const timeoutId = setTimeout(fetchSymptoms, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [symptomQuery]);

  // Fetch Medications from NIH RxTerms API
  useEffect(() => {
    if (newMed.name.length < 2) {
      setMedSuggestions([]);
      return;
    }
    const fetchMeds = async () => {
      try {
        const res = await fetch(`https://clinicaltables.nlm.nih.gov/api/rxterms/v3/search?terms=${newMed.name}`);
        const data = await res.json();
        if (data && data[3]) {
          setMedSuggestions(data[3].map(item => item[0]));
        }
      } catch (err) {
        console.error("Failed to fetch medications", err);
      }
    };
    const timeoutId = setTimeout(fetchMeds, 300);
    return () => clearTimeout(timeoutId);
  }, [newMed.name]);

  const addSymptom = (symptom) => {
    if (!selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
    setSymptomQuery("");
    setSymptomSuggestions([]);
  };

  const removeSymptom = (symptom) => {
    setSelectedSymptoms(selectedSymptoms.filter((s) => s !== symptom));
  };

  const addMedication = () => {
    if (newMed.name && newMed.dosage) {
      setMedications([...medications, newMed]);
      setNewMed({ name: "", dosage: "", duration: "" });
      setMedSuggestions([]);
    }
  };

  const removeMedication = (index) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    setIsSubmitting(true);
    console.log("Uploading to MedVault:", { patientId, symptoms: selectedSymptoms, medications, notes });
    
    setTimeout(() => {
      alert("Prescription successfully uploaded to MedVault!");
      setIsSubmitting(false);
      setPatientId("");
      setSelectedSymptoms([]);
      setMedications([]);
      setNotes("");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-800">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <header className="flex items-center justify-between border-b pb-6 border-slate-200">
          <div>
            <h1 className="text-3xl font-bold text-teal-700 tracking-tight">MedVault <span className="text-slate-800">for Doctors</span></h1>
            <p className="text-slate-500 mt-1">Clinical Prescription Builder</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm font-medium text-slate-600">NIH Database Connected</span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            
            {/* Symptoms Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-semibold mb-4 text-slate-800">Diagnosis / Symptoms</h2>
              
              {/* Quick Select */}
              <div className="mb-4 flex flex-wrap gap-2">
                {COMMON_SYMPTOMS.map((symptom) => (
                  <button
                    key={symptom}
                    onClick={() => {
                      if (selectedSymptoms.includes(symptom)) removeSymptom(symptom);
                      else addSymptom(symptom);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                      selectedSymptoms.includes(symptom)
                        ? "bg-teal-600 border-teal-600 text-white shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:border-teal-300 hover:bg-teal-50"
                    }`}
                  >
                    {selectedSymptoms.includes(symptom) ? "✓ " : "+ "} {symptom}
                  </button>
                ))}
              </div>

              <div className="relative mb-4">
                <input 
                  type="text" 
                  placeholder="Search over 10,000+ medical conditions..." 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                  value={symptomQuery}
                  onChange={(e) => setSymptomQuery(e.target.value)}
                />
                
                {/* Suggestions Dropdown */}
                {symptomSuggestions.length > 0 && (
                  <ul className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {symptomSuggestions.map((suggestion, idx) => (
                      <li 
                        key={idx} 
                        className="px-4 py-2 hover:bg-teal-50 cursor-pointer text-slate-700 border-b last:border-0 border-slate-50"
                        onClick={() => addSymptom(suggestion)}
                      >
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Selected Symptoms Chips */}
              {selectedSymptoms.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {selectedSymptoms.map((symptom) => (
                    <span 
                      key={symptom} 
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-100 text-teal-800 rounded-lg text-sm font-medium border border-teal-200"
                    >
                      {symptom}
                      <button 
                        onClick={() => removeSymptom(symptom)}
                        className="hover:text-red-500 hover:bg-teal-200 rounded-full p-0.5 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Medications Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-semibold mb-4 text-slate-800">Prescribe Medication</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search Medicine..." 
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                    value={newMed.name}
                    onChange={(e) => setNewMed({...newMed, name: e.target.value})}
                  />
                  {/* Med Suggestions Dropdown */}
                  {medSuggestions.length > 0 && (
                    <ul className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {medSuggestions.map((suggestion, idx) => (
                        <li 
                          key={idx} 
                          className="px-4 py-2 hover:bg-teal-50 cursor-pointer text-slate-700 text-sm border-b last:border-0 border-slate-50"
                          onClick={() => {
                            setNewMed({...newMed, name: suggestion});
                            setMedSuggestions([]);
                          }}
                        >
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                
                <input 
                  type="text" 
                  placeholder="Dosage (e.g. 1-0-1)" 
                  className="px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  value={newMed.dosage}
                  onChange={(e) => setNewMed({...newMed, dosage: e.target.value})}
                />
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Duration" 
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                    value={newMed.duration}
                    onChange={(e) => setNewMed({...newMed, duration: e.target.value})}
                  />
                  <button 
                    onClick={addMedication}
                    className="bg-slate-800 text-white px-4 py-2 rounded-xl hover:bg-slate-700 transition-colors whitespace-nowrap"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Medication List */}
              {medications.length > 0 && (
                <div className="mt-6 space-y-2">
                  {medications.map((med, index) => (
                    <div key={index} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div>
                        <p className="font-medium text-slate-800">{med.name}</p>
                        <p className="text-sm text-slate-500">{med.dosage} {med.duration ? `• ${med.duration}` : ''}</p>
                      </div>
                      <button 
                        onClick={() => removeMedication(index)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-1 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Clinical Notes */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-semibold mb-4 text-slate-800">Clinical Notes & Advice</h2>
              <textarea 
                rows="4" 
                placeholder="Add dietary restrictions, next visit details, or general advice here..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-none"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>

          </div>

          {/* Right Sidebar (Patient & Actions) */}
          <div className="space-y-6">
            
            <div className="bg-teal-900 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 opacity-10 transform translate-x-4 -translate-y-4">
                <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              </div>
              <h2 className="text-lg font-medium mb-4 text-teal-100 relative z-10">Patient Details</h2>
              <div className="space-y-4 relative z-10">
                <div>
                  <label className="text-xs text-teal-300 uppercase tracking-wider font-semibold">Patient MedVault ID</label>
                  <input 
                    type="text" 
                    placeholder="Enter Patient ID..." 
                    className="w-full mt-1 bg-teal-800 border border-teal-700 text-white placeholder-teal-500 px-4 py-3 rounded-xl focus:ring-2 focus:ring-teal-400 outline-none transition-all"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
              <h2 className="text-lg font-semibold text-slate-800">Summary</h2>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Symptoms Logged</span>
                <span className="font-medium bg-slate-100 px-2 py-0.5 rounded-md">{selectedSymptoms.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Medications</span>
                <span className="font-medium bg-slate-100 px-2 py-0.5 rounded-md">{medications.length}</span>
              </div>
              
              <hr className="border-slate-100" />

              <button 
                onClick={handleUpload}
                disabled={isSubmitting || !patientId}
                className={`w-full py-3 rounded-xl font-medium transition-all ${
                  isSubmitting || !patientId
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-teal-600 text-white hover:bg-teal-700 hover:shadow-lg transform hover:-translate-y-0.5"
                }`}
              >
                {isSubmitting ? "Uploading..." : "Upload to MedVault"}
              </button>
              
              {!patientId && (
                <p className="text-xs text-center text-amber-600 mt-2 font-medium bg-amber-50 py-1.5 rounded-lg border border-amber-100">
                  Please enter a Patient ID to upload.
                </p>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
