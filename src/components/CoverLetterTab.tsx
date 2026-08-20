import React, { useState } from 'react';
import { ResumeData, JobDescriptionData } from '../types';
import { Briefcase, Copy, Check, Sparkles, RefreshCw, Download, FileText, FileType } from 'lucide-react';
import jsPDF from 'jspdf';
import { exportCoverLetterToDocx } from '../utils/docxExport';

interface CoverLetterTabProps {
  resume: ResumeData;
  jobDescription: JobDescriptionData | null;
  initialCoverLetter?: string;
}

export const CoverLetterTab: React.FC<CoverLetterTabProps> = ({
  resume,
  jobDescription,
  initialCoverLetter = '',
}) => {
  const [tone, setTone] = useState<string>('Professional and Enthusiastic');
  const [coverLetter, setCoverLetter] = useState<string>(initialCoverLetter);
  const [subjectLine, setSubjectLine] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isExportingDocx, setIsExportingDocx] = useState<boolean>(false);

  const handleDownloadDocx = async () => {
    setIsExportingDocx(true);
    try {
      await exportCoverLetterToDocx(
        resume,
        jobDescription?.title || 'Position',
        coverLetter,
        subjectLine
      );
    } catch (err) {
      console.error('Failed to export Word document:', err);
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handleGenerate = async () => {
    if (!jobDescription) return;
    setIsGenerating(true);

    try {
      const res = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume,
          jobDescription: jobDescription.rawText,
          tone,
        }),
      });

      const data = await res.json();
      if (data.fullText) {
        setCoverLetter(data.fullText);
        setSubjectLine(data.subjectLine || '');
      }
    } catch (err) {
      console.error('Failed to generate cover letter:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const margin = 20;
    let yPos = 25;

    // Header - Candidate Name & Title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.text(resume.contact.name || 'Candidate', margin, yPos);
    yPos += 7;

    if (resume.title) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.setTextColor(80, 80, 80);
      pdf.text(resume.title, margin, yPos);
      yPos += 6;
    }

    // Contact Details
    const contactParts = [
      resume.contact.email,
      resume.contact.phone,
      resume.contact.location,
      resume.contact.portfolio || resume.contact.website,
      resume.contact.linkedin,
    ].filter(Boolean);

    if (contactParts.length > 0) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9.5);
      pdf.setTextColor(100, 100, 100);
      pdf.text(contactParts.join('  •  '), margin, yPos);
      yPos += 8;
    }

    // Divider Line
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPos, 210 - margin, yPos);
    yPos += 10;

    // Date
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10.5);
    pdf.setTextColor(50, 50, 50);
    pdf.text(new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), margin, yPos);
    yPos += 8;

    // Subject Line
    const subject = subjectLine || `Application for ${jobDescription?.title || 'Position'} - ${resume.contact.name}`;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(30, 41, 59);
    pdf.text(`RE: ${subject}`, margin, yPos);
    yPos += 10;

    // Body Text
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10.5);
    pdf.setTextColor(30, 30, 30);

    const paragraphs = coverLetter.split('\n\n');
    paragraphs.forEach((p) => {
      const lines = pdf.splitTextToSize(p.trim(), 170);
      if (yPos + lines.length * 5 > 280) {
        pdf.addPage();
        yPos = 20;
      }
      pdf.text(lines, margin, yPos);
      yPos += lines.length * 5.5 + 4;
    });

    pdf.save(`${(resume.contact.name || 'Candidate').replace(/\s+/g, '_')}_Cover_Letter.pdf`);
  };

  return (
    <div className="space-y-6 my-6">
      {/* Top Bar Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-400" />
            AI Cover Letter Generator
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Craft a targeted 3-paragraph letter explaining why you are the ideal match for {jobDescription?.company || 'the position'}.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="bg-slate-950 text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="Professional and Enthusiastic">Tone: Professional & Enthusiastic</option>
            <option value="Executive and Formal">Tone: Executive & Authoritative</option>
            <option value="Concise and Direct">Tone: Concise & Direct</option>
            <option value="Creative and Innovative">Tone: Creative & Modern</option>
          </select>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !jobDescription}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{isGenerating ? 'Writing Letter...' : 'Generate Cover Letter'}</span>
          </button>
        </div>
      </div>

      {/* Main Cover Letter Document Box */}
      {coverLetter ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs uppercase font-semibold text-slate-500 tracking-wider">Subject Line</span>
              <p className="text-sm font-bold text-indigo-300 mt-0.5">
                {subjectLine || `Application for ${jobDescription?.title || 'Position'} - ${resume.contact.name}`}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Letter'}</span>
              </button>

              <button
                onClick={handleDownloadDocx}
                disabled={isExportingDocx}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-50"
                title="Export as Microsoft Word (.docx)"
              >
                <FileType className="w-3.5 h-3.5 text-blue-200" />
                <span>{isExportingDocx ? 'Word...' : 'Word (.docx)'}</span>
              </button>

              <button
                onClick={handleDownloadPDF}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-950 p-6 sm:p-10 rounded-xl border border-slate-800 font-sans text-slate-200 text-sm leading-relaxed space-y-4 whitespace-pre-wrap">
            {coverLetter}
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center shadow-xl">
          <FileText className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <h4 className="text-base font-semibold text-slate-300">No Cover Letter Generated Yet</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Click "Generate Cover Letter" above to write a custom application letter tailored to your candidate strengths and job specifications.
          </p>
          <button
            onClick={handleGenerate}
            disabled={!jobDescription}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl shadow cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Generate Now</span>
          </button>
        </div>
      )}
    </div>
  );
};
