import React, { useState, useRef } from 'react';
import { ResumeData, TemplateStyle } from '../types';
import { Download, Copy, Check, Edit2, Eye, FileText, Sparkles, Layout, Palette, Printer, FileType } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { exportResumeToDocx } from '../utils/docxExport';
import { formatUrl, formatLinkedInUrl, formatGithubUrl, formatMailto, formatTel } from '../utils/urlHelper';

interface TailoredResumePreviewProps {
  resume: ResumeData;
  onUpdateResume: (updated: ResumeData) => void;
  highlightKeywords?: string[];
}

export const TailoredResumePreview: React.FC<TailoredResumePreviewProps> = ({
  resume,
  onUpdateResume,
  highlightKeywords = [],
}) => {
  const [template, setTemplate] = useState<TemplateStyle>('modern');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [showKeywordHighlight, setShowKeywordHighlight] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);
  const [isExportingDocx, setIsExportingDocx] = useState<boolean>(false);

  const previewRef = useRef<HTMLDivElement>(null);

  // Download Word (.docx) Handler
  const handleDownloadDocx = async () => {
    setIsExportingDocx(true);
    try {
      await exportResumeToDocx(resume);
    } catch (err) {
      console.error('Error generating Word document:', err);
    } finally {
      setIsExportingDocx(false);
    }
  };

  // Download PDF Handler
  const handleDownloadPDF = async () => {
    if (!previewRef.current) return;
    setIsExportingPDF(true);
    const savedScrollY = window.scrollY;
    window.scrollTo(0, 0);

    // Wait for React re-render so highlights are stripped from DOM
    await new Promise((resolve) => setTimeout(resolve, 150));

    const styleElements = Array.from(document.querySelectorAll('style'));
    const originalStyleContents: string[] = styleElements.map((s) => s.textContent || '');

    try {
      // Temporarily sanitize oklch from document <style> elements before html2canvas parses document.styleSheets
      styleElements.forEach((s) => {
        if (s.textContent && s.textContent.includes('oklch')) {
          s.textContent = s.textContent.replace(/oklch\([^)]+\)/gi, '#475569');
        }
      });

      const element = previewRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
          const clonedStyles = clonedDoc.querySelectorAll('style');
          clonedStyles.forEach((styleEl) => {
            if (styleEl.textContent && styleEl.textContent.includes('oklch')) {
              styleEl.textContent = styleEl.textContent.replace(/oklch\([^)]+\)/gi, '#475569');
            }
          });

          const clonedPreview = clonedDoc.querySelector('[data-resume-preview="true"]') as HTMLElement;
          if (clonedPreview) {
            clonedPreview.style.backgroundColor = '#ffffff';
            // Strip any remaining highlight backgrounds or mark elements
            const marks = clonedPreview.querySelectorAll('mark');
            marks.forEach((m) => {
              m.style.backgroundColor = 'transparent';
              m.style.color = 'inherit';
              m.style.padding = '0';
              m.style.fontWeight = 'inherit';
            });
          }
        },
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // Fit full width of A4 page (210mm) so text scales accurately
      const renderWidth = pdfWidth;
      const renderHeight = (imgHeight * pdfWidth) / imgWidth;

      if (renderHeight <= pdfHeight) {
        pdf.addImage(imgData, 'JPEG', 0, 0, renderWidth, renderHeight);
      } else {
        // Multi-page export ensuring all bottom content (Education & Certifications) is rendered
        let heightLeft = renderHeight;
        let position = 0;

        pdf.addImage(imgData, 'JPEG', 0, position, renderWidth, renderHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 2) {
          position -= pdfHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, position, renderWidth, renderHeight);
          heightLeft -= pdfHeight;
        }
      }

      pdf.save(`${(resume.contact?.name || 'Candidate').replace(/\s+/g, '_')}_Tailored_CV.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      // Fallback to print dialog
      window.print();
    } finally {
      window.scrollTo(0, savedScrollY);
      // Restore original style contents
      styleElements.forEach((s, idx) => {
        if (s.textContent !== originalStyleContents[idx]) {
          s.textContent = originalStyleContents[idx];
        }
      });
      setIsExportingPDF(false);
    }
  };

  // Copy Markdown Handler
  const handleCopyMarkdown = () => {
    let md = `# ${resume.contact.name || 'Candidate'}\n`;
    if (resume.title) md += `${resume.title}\n`;
    
    const portfolioLink = resume.contact.portfolio || resume.contact.website;
    const contacts = [
      resume.contact.email && `[${resume.contact.email}](${formatMailto(resume.contact.email)})`,
      resume.contact.phone && `[${resume.contact.phone}](${formatTel(resume.contact.phone)})`,
      resume.contact.location && `${resume.contact.location}`,
      portfolioLink && `[Portfolio](${formatUrl(portfolioLink)})`,
      resume.contact.linkedin && `[LinkedIn](${formatLinkedInUrl(resume.contact.linkedin)})`,
      resume.contact.github && `[GitHub](${formatGithubUrl(resume.contact.github)})`,
    ].filter(Boolean);
    md += `${contacts.join(' | ')}\n\n`;

    if (resume.summary) {
      md += `## Professional Summary\n${resume.summary}\n\n`;
    }

    if (resume.skills) {
      md += `## Skills\n`;
      if (resume.skills.technical?.length) md += `- Technical: ${resume.skills.technical.join(', ')}\n`;
      if (resume.skills.soft?.length) md += `- Soft Skills: ${resume.skills.soft.join(', ')}\n`;
      if (resume.skills.tools?.length) md += `- Tools: ${resume.skills.tools.join(', ')}\n`;
      md += `\n`;
    }

    if (resume.experience?.length) {
      md += `## Work Experience\n`;
      resume.experience.forEach((e) => {
        md += `### ${e.role} - ${e.company} (${e.dates})\n`;
        e.bullets?.forEach((b) => (md += `- ${b}\n`));
        md += `\n`;
      });
    }

    if (resume.education?.length) {
      md += `## Education\n`;
      resume.education.forEach((ed) => {
        md += `- **${ed.degree}**, ${ed.institution} (${ed.dates})\n`;
      });
    }

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to render plain text segment with keyword highlights
  const renderKeywordsOnly = (text: string) => {
    if (isExportingPDF || !showKeywordHighlight || !highlightKeywords || highlightKeywords.length === 0 || !text) {
      return text;
    }

    // Escape regex characters
    const safeKws = highlightKeywords.filter((k) => k.length > 2).map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (safeKws.length === 0) return text;

    const regex = new RegExp(`\\b(${safeKws.join('|')})\\b`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) => {
      const isMatch = safeKws.some((k) => k.toLowerCase() === part.toLowerCase());
      if (isMatch) {
        return (
          <mark key={i} className="bg-emerald-100 text-emerald-900 font-semibold px-1 rounded border border-emerald-300">
            {part}
          </mark>
        );
      }
      return part;
    });
  };

  // Helper to render text with clickable hyperlinks and keyword highlights
  const renderTextWithHighlights = (text: string): React.ReactNode => {
    if (!text) return text;

    // Pattern for markdown links [label](url) or standalone URLs (http:// or https://)
    const linkPattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+|tel:[^\s)]+)\)|(https?:\/\/[^\s]+)/g;

    if (!linkPattern.test(text)) {
      return renderKeywordsOnly(text);
    }

    linkPattern.lastIndex = 0;
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = linkPattern.exec(text)) !== null) {
      const matchIndex = match.index;
      if (matchIndex > lastIndex) {
        elements.push(renderKeywordsOnly(text.slice(lastIndex, matchIndex)));
      }

      if (match[1] && match[2]) {
        // [label](url)
        const label = match[1];
        const linkUrl = match[2];
        elements.push(
          <a
            key={`md-link-${matchIndex}`}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-700 font-semibold hover:underline cursor-pointer inline-flex items-center gap-0.5"
            title={linkUrl}
          >
            {label}
          </a>
        );
      } else if (match[3]) {
        // Standalone URL
        const rawUrl = match[3];
        elements.push(
          <a
            key={`raw-url-${matchIndex}`}
            href={rawUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-700 font-semibold hover:underline cursor-pointer"
            title={rawUrl}
          >
            {rawUrl.replace(/^https?:\/\/(www\.)?/, '')}
          </a>
        );
      }

      lastIndex = linkPattern.lastIndex;
    }

    if (lastIndex < text.length) {
      elements.push(renderKeywordsOnly(text.slice(lastIndex)));
    }

    return <>{elements}</>;
  };

  return (
    <div className="space-y-6 my-6">
      {/* Top Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        {/* Template Selector */}
        <div className="flex items-center space-x-2">
          <Palette className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-medium text-slate-300">Template Style:</span>
          <div className="flex space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setTemplate('modern')}
              className={`px-3 py-1 rounded transition-colors ${
                template === 'modern' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Modern Minimal
            </button>
            <button
              onClick={() => setTemplate('executive')}
              className={`px-3 py-1 rounded transition-colors ${
                template === 'executive' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Executive Navy
            </button>
            <button
              onClick={() => setTemplate('classic')}
              className={`px-3 py-1 rounded transition-colors ${
                template === 'classic' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Classic Serif
            </button>
            <button
              onClick={() => setTemplate('tech')}
              className={`px-3 py-1 rounded transition-colors ${
                template === 'tech' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tech Crisp
            </button>
          </div>
        </div>

        {/* Highlight & Edit Toggles & Export */}
        <div className="flex flex-wrap items-center space-x-2">
          <button
            onClick={() => setShowKeywordHighlight(!showKeywordHighlight)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              showKeywordHighlight
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>{showKeywordHighlight ? 'Keywords Highlighted' : 'Highlight Keywords'}</span>
          </button>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              isEditing
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {isEditing ? <Eye className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
            <span>{isEditing ? 'Preview Mode' : 'Edit Mode'}</span>
          </button>

          <button
            onClick={handleCopyMarkdown}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied MD!' : 'Copy Markdown'}</span>
          </button>

          <button
            onClick={handleDownloadDocx}
            disabled={isExportingDocx}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs shadow-md transition-colors cursor-pointer disabled:opacity-50"
            title="Export as Microsoft Word (.docx)"
          >
            <FileType className="w-3.5 h-3.5 text-blue-200" />
            <span>{isExportingDocx ? 'Generating Word...' : 'Download Word (.docx)'}</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={isExportingPDF}
            className="flex items-center space-x-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs shadow-md transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExportingPDF ? 'Exporting PDF...' : 'Download PDF'}</span>
          </button>
        </div>
      </div>

      {/* Resume Document Render Stage */}
      <div className="bg-slate-950 p-4 sm:p-8 rounded-2xl border border-slate-800 overflow-x-auto flex justify-center">
        <div
          ref={previewRef}
          data-resume-preview="true"
          className={`w-full max-w-[800px] bg-white text-slate-900 shadow-2xl rounded-sm p-8 sm:p-12 min-h-[1050px] text-left ${
            template === 'classic' ? 'font-serif' : 'font-sans'
          }`}
          style={{ boxSizing: 'border-box' }}
        >
          {/* EDITABLE CONTACT HEADER IN EDIT MODE */}
          {isEditing ? (
            <div className="bg-slate-50 border-2 border-indigo-200 rounded-xl p-4 mb-6 text-xs text-slate-800 space-y-3 font-sans shadow-sm">
              <div className="font-bold text-indigo-950 flex items-center justify-between text-sm">
                <span>Edit Header Contact Details</span>
                <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  Updates Live on PDF & Markdown Export
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Full Name</label>
                  <input
                    type="text"
                    value={resume.contact.name || ''}
                    onChange={(e) => onUpdateResume({ ...resume, contact: { ...resume.contact, name: e.target.value } })}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:ring-1 focus:ring-indigo-500 font-bold"
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Title / Headline</label>
                  <input
                    type="text"
                    value={resume.title || ''}
                    onChange={(e) => onUpdateResume({ ...resume, title: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:ring-1 focus:ring-indigo-500 font-medium"
                    placeholder="Senior Software Engineer"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Email</label>
                  <input
                    type="text"
                    value={resume.contact.email || ''}
                    onChange={(e) => onUpdateResume({ ...resume, contact: { ...resume.contact, email: e.target.value } })}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:ring-1 focus:ring-indigo-500"
                    placeholder="jane@example.com"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Phone</label>
                  <input
                    type="text"
                    value={resume.contact.phone || ''}
                    onChange={(e) => onUpdateResume({ ...resume, contact: { ...resume.contact, phone: e.target.value } })}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:ring-1 focus:ring-indigo-500"
                    placeholder="+1 (555) 019-2834"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Location</label>
                  <input
                    type="text"
                    value={resume.contact.location || ''}
                    onChange={(e) => onUpdateResume({ ...resume, contact: { ...resume.contact, location: e.target.value } })}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:ring-1 focus:ring-indigo-500"
                    placeholder="New York, NY"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-indigo-900 mb-0.5">
                    Portfolio / Website Link
                  </label>
                  <input
                    type="text"
                    value={resume.contact.portfolio || resume.contact.website || ''}
                    onChange={(e) =>
                      onUpdateResume({
                        ...resume,
                        contact: { ...resume.contact, portfolio: e.target.value, website: e.target.value },
                      })
                    }
                    className="w-full bg-white border border-indigo-400 rounded px-2.5 py-1.5 text-slate-900 focus:ring-1 focus:ring-indigo-500 font-semibold text-indigo-950 placeholder-slate-400"
                    placeholder="https://myportfolio.dev"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">LinkedIn Profile</label>
                  <input
                    type="text"
                    value={resume.contact.linkedin || ''}
                    onChange={(e) => onUpdateResume({ ...resume, contact: { ...resume.contact, linkedin: e.target.value } })}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:ring-1 focus:ring-indigo-500"
                    placeholder="linkedin.com/in/username"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">GitHub Profile</label>
                  <input
                    type="text"
                    value={resume.contact.github || ''}
                    onChange={(e) => onUpdateResume({ ...resume, contact: { ...resume.contact, github: e.target.value } })}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:ring-1 focus:ring-indigo-500"
                    placeholder="github.com/username"
                  />
                </div>
              </div>
            </div>
          ) : template === 'executive' ? (
            <div className="border-b-4 border-indigo-900 pb-5 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-indigo-950 tracking-tight">{resume.contact.name}</h1>
                  <p className="text-base sm:text-lg font-bold text-indigo-800 uppercase tracking-wider mt-1">
                    {resume.title}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3 text-xs sm:text-sm text-slate-700 mt-3 pt-2.5 border-t border-slate-200 font-medium">
                {resume.contact.email && (
                  <a
                    href={formatMailto(resume.contact.email)}
                    className="hover:underline text-indigo-950 font-medium transition-colors"
                    title={`Email ${resume.contact.email}`}
                  >
                    {resume.contact.email}
                  </a>
                )}
                {resume.contact.phone && (
                  <>
                    <span className="text-slate-300">•</span>
                    <a
                      href={formatTel(resume.contact.phone)}
                      className="hover:underline text-slate-800 transition-colors"
                    >
                      {resume.contact.phone}
                    </a>
                  </>
                )}
                {resume.contact.location && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span>{resume.contact.location}</span>
                  </>
                )}
                {(resume.contact.portfolio || resume.contact.website) && (
                  <>
                    <span className="text-slate-300">•</span>
                    <a
                      href={formatUrl(resume.contact.portfolio || resume.contact.website)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-indigo-900 hover:text-indigo-700 hover:underline transition-colors inline-flex items-center gap-0.5"
                      title="Open Portfolio Website"
                    >
                      Portfolio
                    </a>
                  </>
                )}
                {resume.contact.linkedin && (
                  <>
                    <span className="text-slate-300">•</span>
                    <a
                      href={formatLinkedInUrl(resume.contact.linkedin)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-indigo-900 hover:text-indigo-700 hover:underline transition-colors inline-flex items-center gap-0.5"
                      title="Open LinkedIn Profile"
                    >
                      LinkedIn
                    </a>
                  </>
                )}
                {resume.contact.github && (
                  <>
                    <span className="text-slate-300">•</span>
                    <a
                      href={formatGithubUrl(resume.contact.github)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-indigo-900 hover:text-indigo-700 hover:underline transition-colors inline-flex items-center gap-0.5"
                      title="Open GitHub Profile"
                    >
                      GitHub
                    </a>
                  </>
                )}
              </div>
            </div>
          ) : template === 'tech' ? (
            <div className="bg-slate-900 text-white p-6 sm:p-8 -mx-8 sm:-mx-12 -mt-8 sm:-mt-12 mb-6 rounded-t-sm">
              <h1 className="text-3xl font-black text-white tracking-wide">{resume.contact.name}</h1>
              <p className="text-sm font-mono text-indigo-400 mt-1 uppercase tracking-widest font-semibold">{resume.title}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs sm:text-sm text-slate-300 mt-3 font-mono">
                {resume.contact.email && (
                  <a
                    href={formatMailto(resume.contact.email)}
                    className="hover:underline text-indigo-300 transition-colors"
                    title={`Email ${resume.contact.email}`}
                  >
                    {resume.contact.email}
                  </a>
                )}
                {resume.contact.phone && (
                  <>
                    <span className="text-slate-500">|</span>
                    <a
                      href={formatTel(resume.contact.phone)}
                      className="hover:underline text-slate-300 transition-colors"
                    >
                      {resume.contact.phone}
                    </a>
                  </>
                )}
                {resume.contact.location && (
                  <>
                    <span className="text-slate-500">|</span>
                    <span>{resume.contact.location}</span>
                  </>
                )}
                {(resume.contact.portfolio || resume.contact.website) && (
                  <>
                    <span className="text-slate-500">|</span>
                    <a
                      href={formatUrl(resume.contact.portfolio || resume.contact.website)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-300 font-bold hover:text-white hover:underline transition-colors inline-flex items-center gap-0.5"
                      title="Open Portfolio Website"
                    >
                      Portfolio
                    </a>
                  </>
                )}
                {resume.contact.linkedin && (
                  <>
                    <span className="text-slate-500">|</span>
                    <a
                      href={formatLinkedInUrl(resume.contact.linkedin)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-300 font-bold hover:text-white hover:underline transition-colors inline-flex items-center gap-0.5"
                      title="Open LinkedIn Profile"
                    >
                      LinkedIn
                    </a>
                  </>
                )}
                {resume.contact.github && (
                  <>
                    <span className="text-slate-500">|</span>
                    <a
                      href={formatGithubUrl(resume.contact.github)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-300 font-bold hover:text-white hover:underline transition-colors inline-flex items-center gap-0.5"
                      title="Open GitHub Profile"
                    >
                      GitHub
                    </a>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="border-b-2 border-slate-300 pb-5 mb-6">
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">{resume.contact.name}</h1>
              <p className="text-base font-semibold text-slate-700 mt-1">{resume.title}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs sm:text-sm text-slate-600 mt-2.5 font-medium">
                {resume.contact.email && (
                  <a
                    href={formatMailto(resume.contact.email)}
                    className="hover:underline text-indigo-700 font-medium transition-colors"
                    title={`Email ${resume.contact.email}`}
                  >
                    {resume.contact.email}
                  </a>
                )}
                {resume.contact.phone && (
                  <>
                    <span className="text-slate-300">•</span>
                    <a
                      href={formatTel(resume.contact.phone)}
                      className="hover:underline text-slate-600 transition-colors"
                    >
                      {resume.contact.phone}
                    </a>
                  </>
                )}
                {resume.contact.location && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span>{resume.contact.location}</span>
                  </>
                )}
                {(resume.contact.portfolio || resume.contact.website) && (
                  <>
                    <span className="text-slate-300">•</span>
                    <a
                      href={formatUrl(resume.contact.portfolio || resume.contact.website)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-indigo-700 hover:text-indigo-900 hover:underline transition-colors inline-flex items-center gap-0.5"
                      title="Open Portfolio Website"
                    >
                      Portfolio
                    </a>
                  </>
                )}
                {resume.contact.linkedin && (
                  <>
                    <span className="text-slate-300">•</span>
                    <a
                      href={formatLinkedInUrl(resume.contact.linkedin)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-indigo-700 hover:text-indigo-900 hover:underline transition-colors inline-flex items-center gap-0.5"
                      title="Open LinkedIn Profile"
                    >
                      LinkedIn
                    </a>
                  </>
                )}
                {resume.contact.github && (
                  <>
                    <span className="text-slate-300">•</span>
                    <a
                      href={formatGithubUrl(resume.contact.github)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-indigo-700 hover:text-indigo-900 hover:underline transition-colors inline-flex items-center gap-0.5"
                      title="Open GitHub Profile"
                    >
                      GitHub
                    </a>
                  </>
                )}
              </div>
            </div>
          )}

          {/* SUMMARY */}
          {resume.summary && (
            <div className="mb-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-300 pb-1 mb-2.5">
                Professional Summary
              </h2>
              {isEditing ? (
                <textarea
                  value={resume.summary}
                  onChange={(e) => onUpdateResume({ ...resume, summary: e.target.value })}
                  className="w-full text-sm p-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                  rows={3}
                />
              ) : (
                <p className="text-sm sm:text-[14.5px] text-slate-800 leading-relaxed font-normal">{renderTextWithHighlights(resume.summary)}</p>
              )}
            </div>
          )}

          {/* SKILLS & CERTIFICATIONS */}
          {(resume.skills || isEditing) && (
            <div className="mb-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-300 pb-1 mb-2.5">
                Core Competencies & Technical Skills
              </h2>

              <div className="space-y-2 text-sm sm:text-[14.5px]">
                {(resume.skills?.technical?.length > 0 || isEditing) && (
                  <div>
                    <span className="font-bold text-slate-900">Technical Skills: </span>
                    {isEditing ? (
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
                        className="w-full text-xs p-1 mt-1 border border-slate-300 rounded focus:outline-none"
                        placeholder="React, TypeScript, Node.js..."
                      />
                    ) : (
                      <span className="text-slate-800">
                        {renderTextWithHighlights(resume.skills?.technical?.join(', ') || '')}
                      </span>
                    )}
                  </div>
                )}

                {(resume.skills?.soft?.length > 0 || isEditing) && (
                  <div>
                    <span className="font-bold text-slate-900">Core Capabilities: </span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={resume.skills?.soft?.join(', ') || ''}
                        onChange={(e) =>
                          onUpdateResume({
                            ...resume,
                            skills: {
                              ...resume.skills,
                              soft: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                            },
                          })
                        }
                        className="w-full text-xs p-1 mt-1 border border-slate-300 rounded focus:outline-none"
                        placeholder="Leadership, Agile, Communication..."
                      />
                    ) : (
                      <span className="text-slate-800">{renderTextWithHighlights(resume.skills?.soft?.join(', ') || '')}</span>
                    )}
                  </div>
                )}

                {(resume.skills?.tools?.length > 0 || isEditing) && (
                  <div>
                    <span className="font-bold text-slate-900">Tools & Platforms: </span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={resume.skills?.tools?.join(', ') || ''}
                        onChange={(e) =>
                          onUpdateResume({
                            ...resume,
                            skills: {
                              ...resume.skills,
                              tools: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                            },
                          })
                        }
                        className="w-full text-xs p-1 mt-1 border border-slate-300 rounded focus:outline-none"
                        placeholder="Git, Docker, AWS, JIRA..."
                      />
                    ) : (
                      <span className="text-slate-800">{renderTextWithHighlights(resume.skills?.tools?.join(', ') || '')}</span>
                    )}
                  </div>
                )}

                {(resume.skills?.certifications?.length > 0 || isEditing) && (
                  <div>
                    <span className="font-bold text-slate-900">Certifications & Licenses: </span>
                    {isEditing ? (
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
                        className="w-full text-xs p-1 mt-1 border border-slate-300 rounded focus:outline-none"
                        placeholder="AWS Certified Solutions Architect, PMP, CSM..."
                      />
                    ) : (
                      <span className="text-slate-800">{renderTextWithHighlights(resume.skills?.certifications?.join(', ') || '')}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* EXPERIENCE */}
          {resume.experience?.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-300 pb-1 mb-3">
                Professional Experience
              </h2>

              <div className="space-y-5">
                {resume.experience.map((exp, expIdx) => (
                  <div key={exp.id || expIdx}>
                    <div className="flex justify-between items-baseline">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900">{exp.role}</h3>
                      <span className="text-xs sm:text-sm font-semibold text-slate-600">{exp.dates}</span>
                    </div>
                    <div className="flex justify-between items-baseline text-sm text-slate-700 mb-1.5">
                      <span className="font-bold text-indigo-950">{exp.company}</span>
                      <span className="text-slate-600 font-medium">{exp.location}</span>
                    </div>

                    <ul className="list-disc list-outside ml-4 space-y-1.5 text-sm sm:text-[14px] text-slate-800 leading-relaxed">
                      {(exp.bullets || []).map((b, bIdx) => (
                        <li key={bIdx}>
                          {isEditing ? (
                            <input
                              type="text"
                              value={b}
                              onChange={(e) => {
                                const newExp = [...resume.experience];
                                newExp[expIdx].bullets[bIdx] = e.target.value;
                                onUpdateResume({ ...resume, experience: newExp });
                              }}
                              className="w-full text-sm p-1 border border-slate-300 rounded focus:outline-none"
                            />
                          ) : (
                            renderTextWithHighlights(b)
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PROJECTS */}
          {resume.projects?.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-300 pb-1 mb-3">
                Key Projects & Initiatives
              </h2>

              <div className="space-y-4">
                {resume.projects.map((proj, projIdx) => (
                  <div key={proj.id || projIdx}>
                    <div className="flex justify-between items-baseline">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900">
                        {proj.link || proj.url ? (
                          <a
                            href={formatUrl(proj.link || proj.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-950 hover:text-indigo-700 hover:underline inline-flex items-center gap-1"
                            title={formatUrl(proj.link || proj.url)}
                          >
                            {proj.name}
                          </a>
                        ) : (
                          proj.name
                        )}
                      </h3>
                      <span className="text-xs sm:text-sm font-medium text-slate-600">{proj.technologies?.join(', ')}</span>
                    </div>
                    {proj.description && (
                      <p className="text-sm text-slate-700 italic mb-1">
                        {renderTextWithHighlights(proj.description)}
                      </p>
                    )}
                    {proj.bullets?.length > 0 && (
                      <ul className="list-disc list-outside ml-4 space-y-1.5 text-sm sm:text-[14px] text-slate-800 leading-relaxed">
                        {proj.bullets.map((b, bIdx) => (
                          <li key={bIdx}>{renderTextWithHighlights(b)}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EDUCATION */}
          {(resume.education?.length > 0 || isEditing) && (
            <div className="mb-6">
              <div className="flex justify-between items-center border-b-2 border-slate-300 pb-1 mb-2.5">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Education
                </h2>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      const newEdu = [...(resume.education || [])];
                      newEdu.push({
                        id: `edu-${Date.now()}`,
                        degree: 'Degree / Degree Program',
                        institution: 'University / Institution',
                        location: 'City, Country',
                        dates: 'Graduation Year',
                        details: '',
                      });
                      onUpdateResume({ ...resume, education: newEdu });
                    }}
                    className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded cursor-pointer"
                  >
                    + Add Education
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {(resume.education || []).map((ed, edIdx) => (
                  <div key={ed.id || edIdx} className="text-sm text-slate-800">
                    {isEditing ? (
                      <div className="bg-slate-50 border border-slate-200 rounded p-2 space-y-2 mb-2 font-sans">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={ed.degree}
                            onChange={(e) => {
                              const newEdu = [...resume.education];
                              newEdu[edIdx].degree = e.target.value;
                              onUpdateResume({ ...resume, education: newEdu });
                            }}
                            className="text-xs p-1 border border-slate-300 rounded font-bold"
                            placeholder="Degree / Qualification"
                          />
                          <input
                            type="text"
                            value={ed.institution}
                            onChange={(e) => {
                              const newEdu = [...resume.education];
                              newEdu[edIdx].institution = e.target.value;
                              onUpdateResume({ ...resume, education: newEdu });
                            }}
                            className="text-xs p-1 border border-slate-300 rounded"
                            placeholder="University / School"
                          />
                          <input
                            type="text"
                            value={ed.location || ''}
                            onChange={(e) => {
                              const newEdu = [...resume.education];
                              newEdu[edIdx].location = e.target.value;
                              onUpdateResume({ ...resume, education: newEdu });
                            }}
                            className="text-xs p-1 border border-slate-300 rounded"
                            placeholder="Location (e.g. Cambridge, MA)"
                          />
                          <input
                            type="text"
                            value={ed.dates || ''}
                            onChange={(e) => {
                              const newEdu = [...resume.education];
                              newEdu[edIdx].dates = e.target.value;
                              onUpdateResume({ ...resume, education: newEdu });
                            }}
                            className="text-xs p-1 border border-slate-300 rounded"
                            placeholder="Dates (e.g. 2018 - 2022)"
                          />
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={ed.details || ''}
                            onChange={(e) => {
                              const newEdu = [...resume.education];
                              newEdu[edIdx].details = e.target.value;
                              onUpdateResume({ ...resume, education: newEdu });
                            }}
                            className="w-full text-xs p-1 border border-slate-300 rounded"
                            placeholder="Honors, GPA, Relevant Coursework, etc."
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newEdu = resume.education.filter((_, idx) => idx !== edIdx);
                              onUpdateResume({ ...resume, education: newEdu });
                            }}
                            className="text-[10px] text-red-600 font-bold hover:underline shrink-0"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-baseline">
                          <div>
                            <span className="font-bold text-slate-900 text-sm sm:text-base">{ed.degree}</span>
                            <span className="text-slate-800"> — {ed.institution}</span>
                            {ed.location && <span className="text-slate-600 italic"> ({ed.location})</span>}
                          </div>
                          <span className="text-xs sm:text-sm font-semibold text-slate-600 ml-2">{ed.dates}</span>
                        </div>
                        {ed.details && <p className="text-xs sm:text-sm text-slate-700 mt-1">{renderTextWithHighlights(ed.details)}</p>}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AWARDS & HONORS */}
          {resume.awards && resume.awards.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-300 pb-1 mb-2.5">
                Honors & Awards
              </h2>
              <ul className="list-disc list-outside ml-4 space-y-1.5 text-sm sm:text-[14px] text-slate-800 leading-relaxed">
                {resume.awards.map((award, idx) => (
                  <li key={idx}>{renderTextWithHighlights(award)}</li>
                ))}
              </ul>
            </div>
          )}

          {/* LANGUAGES */}
          {resume.languages && resume.languages.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-300 pb-1 mb-2.5">
                Languages
              </h2>
              <p className="text-sm sm:text-[14px] text-slate-800 leading-relaxed">
                {renderTextWithHighlights(resume.languages.join(', '))}
              </p>
            </div>
          )}

          {/* CUSTOM SECTIONS */}
          {resume.customSections && resume.customSections.length > 0 && (
            <>
              {resume.customSections.map((sec, secIdx) => (
                <div key={secIdx} className="mb-6">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-300 pb-1 mb-2.5">
                    {sec.title}
                  </h2>
                  <ul className="list-disc list-outside ml-4 space-y-1.5 text-sm sm:text-[14px] text-slate-800 leading-relaxed">
                    {(sec.items || []).map((item, itemIdx) => (
                      <li key={itemIdx}>{renderTextWithHighlights(item)}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
