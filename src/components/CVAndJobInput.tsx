import React, { useState, useRef } from 'react';
import { ResumeData, JobDescriptionData } from '../types';
import { FileText, Briefcase, Sparkles, Wand2, Upload, ArrowRight, CheckCircle2, AlertCircle, FileUp, Loader2, X, ClipboardPaste } from 'lucide-react';

interface CVAndJobInputProps {
  resume: ResumeData;
  onUpdateResume: (updated: ResumeData) => void;
  jobDescription: JobDescriptionData;
  onUpdateJobDescription: (updated: JobDescriptionData) => void;
  onRunAnalysis: () => void;
  isAnalyzing: boolean;
}

export const CVAndJobInput: React.FC<CVAndJobInputProps> = ({
  resume,
  onUpdateResume,
  jobDescription,
  onUpdateJobDescription,
  onRunAnalysis,
  isAnalyzing,
}) => {
  const [showRawParserModal, setShowRawParserModal] = useState<boolean>(false);
  const [rawCVText, setRawCVText] = useState<string>('');
  const [isParsingText, setIsParsingText] = useState<boolean>(false);

  // File Upload State
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const modalFileInputRef = useRef<HTMLInputElement | null>(null);
  const jobTextAreaRef = useRef<HTMLTextAreaElement | null>(null);

  // File Upload Handler
  const handleFileChange = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadedFileName(file.name);

    try {
      // Read file as base64 data URL
      const reader = new FileReader();

      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      const fileData = await base64Promise;

      const res = await fetch('/api/upload-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData,
          fileName: file.name,
          mimeType: file.type,
        }),
      });

      if (!res.ok) {
        const errorRes = await res.json().catch(() => ({}));
        throw new Error(errorRes.error || `Failed to parse uploaded file (${res.status})`);
      }

      const parsedData = await res.json();

      if (parsedData.contact || parsedData.experience || parsedData.skills) {
        onUpdateResume(parsedData);
        setShowRawParserModal(false);
      } else {
        throw new Error('Could not extract resume information from this file.');
      }
    } catch (err: any) {
      console.error('Error uploading CV file:', err);
      setUploadError(err.message || 'Error processing file upload');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Handle AI Raw Text Parsing
  const handleParseRawCV = async () => {
    if (!rawCVText.trim()) return;
    setIsParsingText(true);

    try {
      const res = await fetch('/api/parse-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: rawCVText }),
      });

      const parsedData = await res.json();
      if (parsedData.contact || parsedData.experience) {
        onUpdateResume(parsedData);
        setShowRawParserModal(false);
        setRawCVText('');
      }
    } catch (err) {
      console.error('Error parsing raw CV text:', err);
    } finally {
      setIsParsingText(false);
    }
  };

  const handlePasteJobDescription = async () => {
    let textToPaste = '';
    try {
      if (navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
        textToPaste = await navigator.clipboard.readText();
      }
    } catch (err) {
      console.warn('Clipboard readText restricted by browser/iframe:', err);
    }

    if (textToPaste && textToPaste.trim().length > 0) {
      onUpdateJobDescription({ ...jobDescription, rawText: textToPaste });
      if (jobTextAreaRef.current) {
        jobTextAreaRef.current.focus();
      }
    } else {
      // Fallback if browser security blocks automated clipboard reading inside iframe
      const promptText = window.prompt(
        'Automatic clipboard access is restricted by browser security inside preview frames.\n\nPlease paste (Ctrl+V / Cmd+V) your job description text here:',
        ''
      );
      if (promptText && promptText.trim().length > 0) {
        onUpdateJobDescription({ ...jobDescription, rawText: promptText });
      }
      if (jobTextAreaRef.current) {
        jobTextAreaRef.current.focus();
      }
    }
  };

  return (
    <div className="space-y-6 my-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-400" />
          1. Resume & Target Job Description Setup
        </h3>
        <p className="text-sm text-slate-400 mt-1">
          Upload your resume or paste text on the left, then paste your target job description on the right. When you're ready, click <span className="text-indigo-300 font-medium">Analyze ATS Match Score</span> at the bottom.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN: BASE RESUME EDITOR & UPLOADER */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h4 className="font-bold text-slate-100 text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              Base Resume Details
            </h4>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isUploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>Upload File</span>
              </button>

              <button
                onClick={() => setShowRawParserModal(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Paste Text</span>
              </button>
            </div>
          </div>

          {/* DRAG & DROP RESUME UPLOAD CARD */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer relative ${
              isDragging
                ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
                : isUploading
                ? 'border-indigo-500/50 bg-indigo-950/20'
                : 'border-slate-800 hover:border-indigo-500/60 bg-slate-950/60 hover:bg-slate-950'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              accept=".pdf,.docx,.doc,.txt,.md,.png,.jpg,.jpeg,.webp"
              className="hidden"
            />

            {isUploading ? (
              <div className="flex flex-col items-center justify-center space-y-2 py-2">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                <p className="text-xs font-semibold text-slate-200">
                  Parsing {uploadedFileName || 'Resume File'} with Gemini AI...
                </p>
                <p className="text-[11px] text-slate-400">Extracting contact, work experience, education, & skills</p>
              </div>
            ) : uploadedFileName && !uploadError ? (
              <div className="flex items-center justify-between bg-indigo-950/40 border border-indigo-500/30 rounded-lg p-3 text-left">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-200 truncate max-w-[220px]">{uploadedFileName}</p>
                    <p className="text-[10px] text-emerald-400">Successfully extracted & loaded into editor</p>
                  </div>
                </div>

                <span className="text-[11px] font-medium text-indigo-400 hover:underline">Replace</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-2 py-1">
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <FileUp className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200">
                    <span className="text-indigo-400 hover:underline">Click to upload</span> or drag and drop your resume
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Supports <span className="text-slate-300 font-medium">PDF, DOCX, TXT, MD, PNG, JPG</span> (max 25MB)
                  </p>
                </div>
              </div>
            )}

            {uploadError && (
              <div className="mt-2 p-2.5 bg-rose-950/50 border border-rose-500/40 rounded-lg text-rose-300 text-xs flex items-center space-x-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>

          {/* Contact Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Full Name</label>
              <input
                type="text"
                value={resume.contact?.name || ''}
                onChange={(e) =>
                  onUpdateResume({
                    ...resume,
                    contact: { ...resume.contact, name: e.target.value },
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Target Headline / Role Title</label>
              <input
                type="text"
                value={resume.title || ''}
                onChange={(e) => onUpdateResume({ ...resume, title: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Senior Software Engineer"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Email Address</label>
              <input
                type="text"
                value={resume.contact?.email || ''}
                onChange={(e) =>
                  onUpdateResume({
                    ...resume,
                    contact: { ...resume.contact, email: e.target.value },
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Phone Number</label>
              <input
                type="text"
                value={resume.contact?.phone || ''}
                onChange={(e) =>
                  onUpdateResume({
                    ...resume,
                    contact: { ...resume.contact, phone: e.target.value },
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="+1 (555) 019-2834"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Location</label>
              <input
                type="text"
                value={resume.contact?.location || ''}
                onChange={(e) =>
                  onUpdateResume({
                    ...resume,
                    contact: { ...resume.contact, location: e.target.value },
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="New York, NY"
              />
            </div>

            <div>
              <label className="block text-indigo-300 font-medium mb-1 flex items-center justify-between">
                <span>Portfolio / Personal Website Link</span>
                <span className="text-[10px] text-indigo-400">Exported to CV</span>
              </label>
              <input
                type="text"
                value={resume.contact?.portfolio || resume.contact?.website || ''}
                onChange={(e) =>
                  onUpdateResume({
                    ...resume,
                    contact: {
                      ...resume.contact,
                      portfolio: e.target.value,
                      website: e.target.value,
                    },
                  })
                }
                className="w-full bg-slate-950 border border-indigo-500/40 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-600"
                placeholder="https://myportfolio.com or github.io"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">LinkedIn Profile</label>
              <input
                type="text"
                value={resume.contact?.linkedin || ''}
                onChange={(e) =>
                  onUpdateResume({
                    ...resume,
                    contact: { ...resume.contact, linkedin: e.target.value },
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="linkedin.com/in/username"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">GitHub Profile</label>
              <input
                type="text"
                value={resume.contact?.github || ''}
                onChange={(e) =>
                  onUpdateResume({
                    ...resume,
                    contact: { ...resume.contact, github: e.target.value },
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="github.com/username"
              />
            </div>
          </div>

          {/* Professional Summary */}
          <div>
            <label className="block text-xs text-slate-400 font-medium mb-1">Professional Summary</label>
            <textarea
              rows={3}
              value={resume.summary || ''}
              onChange={(e) => onUpdateResume({ ...resume, summary: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Summary statement describing your professional achievements..."
            />
          </div>

          {/* Skills & Certifications */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1">Technical Skills (Comma Separated)</label>
              <input
                type="text"
                value={resume.skills?.technical?.join(', ') || ''}
                onChange={(e) =>
                  onUpdateResume({
                    ...resume,
                    skills: {
                      ...resume.skills,
                      technical: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    },
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="React, TypeScript, Node.js..."
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1">Certifications & Licenses</label>
              <input
                type="text"
                value={resume.skills?.certifications?.join(', ') || ''}
                onChange={(e) =>
                  onUpdateResume({
                    ...resume,
                    skills: {
                      ...resume.skills,
                      certifications: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    },
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="AWS Architect, PMP, Certified Scrum Master..."
              />
            </div>
          </div>

          {/* Education Summary */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs text-slate-400 font-medium">
                Education History ({resume.education?.length || 0} Entries)
              </label>
              <button
                type="button"
                onClick={() => {
                  const newEdu = [...(resume.education || [])];
                  newEdu.push({
                    id: `edu-${Date.now()}`,
                    degree: 'B.S. Computer Science',
                    institution: 'State University',
                    location: '',
                    dates: '2018 - 2022',
                    details: '',
                  });
                  onUpdateResume({ ...resume, education: newEdu });
                }}
                className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300"
              >
                + Add Degree
              </button>
            </div>

            {resume.education && resume.education.length > 0 ? (
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {resume.education.map((ed, edIdx) => (
                  <div key={ed.id || edIdx} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-200">{ed.degree}</span>
                      <p className="text-slate-400 text-[11px]">{ed.institution} {ed.dates && `(${ed.dates})`}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newEdu = resume.education.filter((_, idx) => idx !== edIdx);
                        onUpdateResume({ ...resume, education: newEdu });
                      }}
                      className="text-red-400 hover:text-red-300 text-[10px] ml-2"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-xs italic bg-slate-950/50 p-2 rounded border border-slate-800">No education entries added yet.</p>
            )}
          </div>

          {/* Work History Summary */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs text-slate-400 font-medium">
                Work History & Accomplishments ({resume.experience?.length || 0} Positions)
              </label>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {resume.experience?.map((exp, expIdx) => (
                <div key={exp.id || expIdx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-slate-200">{exp.role}</span>
                      <p className="text-indigo-400 text-[11px] font-medium">{exp.company}</p>
                    </div>
                    <span className="text-slate-400 text-[11px]">{exp.dates}</span>
                  </div>

                  {exp.bullets && exp.bullets.length > 0 ? (
                    <div className="pt-2 border-t border-slate-900 space-y-1.5">
                      <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                        Parsed Accomplishments ({exp.bullets.length}):
                      </p>
                      <ul className="list-disc list-outside ml-4 space-y-1 text-slate-300 text-[11px] leading-snug">
                        {exp.bullets.map((bullet, bIdx) => (
                          <li key={bIdx}>{bullet}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-amber-400/80 text-[11px] italic">No accomplishment bullets detected for this role.</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: TARGET JOB DESCRIPTION */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h4 className="font-bold text-slate-100 text-base flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-400" />
              Target Job Posting Specifications
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Job Title</label>
              <input
                type="text"
                value={jobDescription.title || ''}
                onChange={(e) => onUpdateJobDescription({ ...jobDescription, title: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="e.g. Senior Full Stack Engineer"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Company Name</label>
              <input
                type="text"
                value={jobDescription.company || ''}
                onChange={(e) => onUpdateJobDescription({ ...jobDescription, company: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="e.g. NextGen Tech"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs text-slate-400 font-medium">
                Raw Job Description Text (Paste Full Posting Requirements)
              </label>
              <button
                type="button"
                onClick={handlePasteJobDescription}
                className="inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-semibold text-indigo-300 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 rounded-lg transition-all cursor-pointer shadow-sm hover:text-white"
                title="Paste job description from clipboard"
              >
                <ClipboardPaste className="w-3.5 h-3.5 text-indigo-400" />
                <span>Paste Text</span>
              </button>
            </div>
            <textarea
              ref={jobTextAreaRef}
              rows={16}
              value={jobDescription.rawText || ''}
              onChange={(e) => onUpdateJobDescription({ ...jobDescription, rawText: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              placeholder="Paste the full job posting requirements, role qualifications, preferred skills, and tech stack here..."
            />
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            Ready to test your ATS match?
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Analyze keyword coverage, missing skills, and calculate your job alignment score.
          </p>
        </div>

        <button
          onClick={onRunAnalysis}
          disabled={isAnalyzing || !jobDescription.rawText.trim()}
          className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 cursor-pointer shrink-0"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{isAnalyzing ? 'Analyzing ATS Alignment...' : 'Analyze ATS Match Score'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* RAW CV AI PARSER MODAL */}
      {showRawParserModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 relative">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-amber-400" />
                Resume Import Options
              </h4>
              <button
                onClick={() => setShowRawParserModal(false)}
                className="text-slate-400 hover:text-slate-200 font-bold px-2 py-1 rounded hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick File Upload option in Modal */}
            <div className="p-4 bg-indigo-950/30 border border-indigo-500/20 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-200">Have a resume document or image?</p>
                <p className="text-[11px] text-slate-400">Upload PDF, DOCX, TXT, or image file directly</p>
              </div>
              <input
                type="file"
                ref={modalFileInputRef}
                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                accept=".pdf,.docx,.doc,.txt,.md,.png,.jpg,.jpeg,.webp"
                className="hidden"
              />
              <button
                onClick={() => modalFileInputRef.current?.click()}
                disabled={isUploading}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload File</span>
              </button>
            </div>

            <div className="relative flex items-center my-2">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-3 text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Or Paste Raw Text</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            <textarea
              rows={8}
              value={rawCVText}
              onChange={(e) => setRawCVText(e.target.value)}
              placeholder="Paste raw CV text from Word, PDF, or LinkedIn here..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowRawParserModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleParseRawCV}
                disabled={isParsingText || !rawCVText.trim()}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{isParsingText ? 'Parsing Text...' : 'Parse Text'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

