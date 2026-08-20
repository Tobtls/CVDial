import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import mammoth from "mammoth";
import * as pdfParseModule from "pdf-parse";

async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    if (typeof (pdfParseModule as any).PDFParse === 'function') {
      const PDFParseClass = (pdfParseModule as any).PDFParse;
      const parser = new PDFParseClass({ data: buffer });
      const res = await parser.getText();
      if (res && typeof res.text === 'string' && res.text.trim()) {
        return res.text;
      }
    }
    const fn = (pdfParseModule as any).default || pdfParseModule;
    if (typeof fn === 'function') {
      const res = await fn(buffer);
      if (res && typeof res.text === 'string' && res.text.trim()) {
        return res.text;
      }
    }
  } catch (err) {
    console.warn("pdf-parse extraction note:", (err as any)?.message || err);
  }
  return "";
}

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));

// Initialize GoogleGenAI SDK server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Helper for Gemini model call with fallbacks to survive quota rate limits
const FALLBACK_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-2.5-flash",
  "gemini-3.1-pro-preview",
];

async function generateContentWithFallback(params: {
  contents: any;
  config?: any;
}): Promise<any> {
  let lastError: any = null;

  for (const modelName of FALLBACK_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: params.contents,
          config: params.config,
        });
        return response;
      } catch (err: any) {
        lastError = err;

        const isQuotaOrRateLimit =
          err?.status === "RESOURCE_EXHAUSTED" ||
          err?.code === 429 ||
          (err?.message &&
            (err.message.includes("429") ||
              err.message.includes("quota") ||
              err.message.includes("RESOURCE_EXHAUSTED") ||
              err.message.includes("rate limit")));

        const isQuotaExceeded = err?.message && (err.message.includes("Quota exceeded") || err.message.includes("quota"));

        if (!isQuotaOrRateLimit) {
          console.error(`Gemini call error on model [${modelName}]:`, err?.message || err);
          throw err;
        }

        console.log(`[Gemini Fallback] Model ${modelName} hit rate limit / quota. Moving to next candidate.`);

        if (isQuotaExceeded) {
          // Move directly to next fallback model without retrying this quota-exhausted model
          break;
        }

        // If transient rate limit, wait 1 second before attempt 2
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  throw lastError || new Error("Gemini API rate limit reached across all models. Please try again in a moment.");
}

const PARSER_SYSTEM_INSTRUCTION = `You are a world-class executive ATS resume parser and technical recruiter.
Your task is to thoroughly analyze candidate resume/CV documents or text and extract EVERY detail into a structured JSON schema.

CRITICAL INSTRUCTIONS FOR ACCOMPLISHMENTS & BULLET POINTS:
1. Contact Info:
   - "name": Full candidate name.
   - "email", "phone", "location", "linkedin", "github", "website", "portfolio".
2. Title: Professional target headline or current job title.
3. Summary: Professional profile or summary statement.
4. Categorized Skills (Must categorize every skill found):
   - "technical": Programming languages, frameworks, databases, domain technical knowledge.
   - "tools": Developer tools, SaaS platforms, IDEs, software utilities.
   - "soft": Leadership, project management, communication, teamwork.
   - "certifications": Professional certifications, credentials, or licenses.
5. Work Experience Accomplishments & Bullets (CRITICAL MANDATE):
   - For every job position, extract "company", "role", "location", "dates" (e.g. "Jan 2022 - Present").
   - Extract ALL bullet points, key accomplishments, achievements, responsibilities, metrics, and project outcomes into the "bullets" array of strings.
   - DO NOT skip any accomplishments or bullet points present in the document.
   - Break down paragraphs into individual, distinct accomplishment bullet points.
   - Every position MUST have its accomplishments populated in the "bullets" array.
6. Projects: Extract all portfolio/project entries ("name", "description", "technologies", "bullets").
7. Education: Extract degrees, institutions, locations, dates, and honors/details ("degree", "institution", "location", "dates", "details").

Never leave work experience or accomplishment bullet points empty if present in the document.`;

const RESUME_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Professional target headline or current title" },
    contact: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        email: { type: Type.STRING },
        phone: { type: Type.STRING },
        location: { type: Type.STRING },
        linkedin: { type: Type.STRING },
        github: { type: Type.STRING },
        website: { type: Type.STRING },
        portfolio: { type: Type.STRING },
      },
      required: ["name"],
    },
    summary: { type: Type.STRING, description: "Professional summary statement" },
    skills: {
      type: Type.OBJECT,
      properties: {
        technical: { type: Type.ARRAY, items: { type: Type.STRING } },
        soft: { type: Type.ARRAY, items: { type: Type.STRING } },
        tools: { type: Type.ARRAY, items: { type: Type.STRING } },
        certifications: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
    },
    experience: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          company: { type: Type.STRING },
          role: { type: Type.STRING },
          location: { type: Type.STRING },
          dates: { type: Type.STRING },
          bullets: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of accomplishment bullet points, key responsibilities, and achievements for this role.",
          },
        },
        required: ["company", "role", "bullets"],
      },
    },
    projects: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          technologies: { type: Type.ARRAY, items: { type: Type.STRING } },
          bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
      },
    },
    education: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          degree: { type: Type.STRING },
          institution: { type: Type.STRING },
          location: { type: Type.STRING },
          dates: { type: Type.STRING },
          details: { type: Type.STRING },
        },
      },
    },
    customSections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          items: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
      },
    },
    languages: { type: Type.ARRAY, items: { type: Type.STRING } },
    awards: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["contact", "experience"],
};

// Robust Post-Processing Normalization Helper
function normalizeResumeData(raw: any): any {
  if (!raw || typeof raw !== "object") raw = {};

  const contact = raw.contact || {};
  const normalizedContact = {
    name: typeof contact.name === "string" && contact.name.trim() ? contact.name.trim() : "Candidate Name",
    email: typeof contact.email === "string" ? contact.email.trim() : "",
    phone: typeof contact.phone === "string" ? contact.phone.trim() : "",
    location: typeof contact.location === "string" ? contact.location.trim() : "",
    linkedin: typeof contact.linkedin === "string" ? contact.linkedin.trim() : "",
    github: typeof contact.github === "string" ? contact.github.trim() : "",
    website: typeof contact.website === "string" ? contact.website.trim() : "",
  };

  const parseSkillList = (list: any): string[] => {
    if (!list) return [];
    if (typeof list === "string") {
      return list.split(/[,;\n•]/).map((s: string) => s.trim()).filter(Boolean);
    }
    if (Array.isArray(list)) {
      const result: string[] = [];
      for (const item of list) {
        if (typeof item === "string") {
          if (item.includes(",") || item.includes("\n")) {
            result.push(...item.split(/[,;\n•]/).map((s: string) => s.trim()).filter(Boolean));
          } else if (item.trim()) {
            result.push(item.trim());
          }
        }
      }
      return Array.from(new Set(result));
    }
    return [];
  };

  const rawSkills = raw.skills || {};
  const normalizedSkills = {
    technical: parseSkillList(rawSkills.technical),
    soft: parseSkillList(rawSkills.soft),
    tools: parseSkillList(rawSkills.tools),
    certifications: parseSkillList(rawSkills.certifications),
  };

  // If raw.skills was provided as a flat array
  if (Array.isArray(raw.skills)) {
    const flatSkills = parseSkillList(raw.skills);
    if (normalizedSkills.technical.length === 0) {
      normalizedSkills.technical = flatSkills;
    }
  }

  const cleanBullets = (bulletsInput: any): string[] => {
    if (!bulletsInput) return [];

    const rawArray = Array.isArray(bulletsInput) ? bulletsInput : [bulletsInput];
    const itemsToProcess: string[] = [];

    for (const item of rawArray) {
      if (!item) continue;
      if (typeof item === "string") {
        itemsToProcess.push(item);
      } else if (typeof item === "object") {
        const val =
          item.text ||
          item.bullet ||
          item.accomplishment ||
          item.achievement ||
          item.description ||
          item.value ||
          item.title ||
          String(item);
        if (typeof val === "string") {
          itemsToProcess.push(val);
        }
      }
    }

    const results: string[] = [];
    for (const text of itemsToProcess) {
      // Split by newlines, carriage returns, or bullet symbols
      const parts = text.split(/\r?\n|\\n|•|\u2022|\u25cf|\u25cb|\u25aa/);
      for (const part of parts) {
        // Remove leading bullet icons, dashes, asterisks, numbers like "1.", "1)", spaces
        const cleaned = part.replace(/^[\s•\-\*\u2022\u25cf\u25cb\u25aa\d+\.\)]+/, "").trim();
        if (cleaned.length > 2) {
          results.push(cleaned);
        }
      }
    }

    return Array.from(new Set(results));
  };

  const rawExp = Array.isArray(raw.experience) ? raw.experience : [];
  const normalizedExp = rawExp.map((exp: any, idx: number) => {
    const bulletSources = [
      exp.bullets,
      exp.accomplishments,
      exp.achievements,
      exp.keyAccomplishments,
      exp.responsibilities,
      exp.highlights,
      exp.duties,
      exp.description,
      exp.summary,
      exp.points,
    ];

    let combinedBullets: string[] = [];
    for (const src of bulletSources) {
      if (src) {
        const cleaned = cleanBullets(src);
        if (cleaned.length > 0) {
          combinedBullets.push(...cleaned);
        }
      }
    }
    combinedBullets = Array.from(new Set(combinedBullets));

    return {
      id: exp.id || `exp-${idx}-${Date.now()}`,
      company: typeof exp.company === "string" ? exp.company.trim() : "Company",
      role: typeof exp.role === "string" ? exp.role.trim() : "Position",
      location: typeof exp.location === "string" ? exp.location.trim() : "",
      dates: typeof exp.dates === "string" ? exp.dates.trim() : "",
      bullets: combinedBullets,
    };
  });

  const rawProj = Array.isArray(raw.projects) ? raw.projects : [];
  const normalizedProj = rawProj.map((proj: any, idx: number) => {
    const bulletSources = [
      proj.bullets,
      proj.accomplishments,
      proj.achievements,
      proj.highlights,
      proj.description,
      proj.details,
    ];

    let combinedBullets: string[] = [];
    for (const src of bulletSources) {
      if (src) {
        const cleaned = cleanBullets(src);
        if (cleaned.length > 0) {
          combinedBullets.push(...cleaned);
        }
      }
    }
    combinedBullets = Array.from(new Set(combinedBullets));

    return {
      id: proj.id || `proj-${idx}-${Date.now()}`,
      name: typeof proj.name === "string" ? proj.name.trim() : "Project",
      description: typeof proj.description === "string" ? proj.description.trim() : "",
      technologies: parseSkillList(proj.technologies),
      bullets: combinedBullets,
    };
  });

  const rawEdu = Array.isArray(raw.education) ? raw.education : [];
  const normalizedEdu = rawEdu.map((edu: any, idx: number) => ({
    id: edu.id || `edu-${idx}-${Date.now()}`,
    degree: typeof edu.degree === "string" ? edu.degree.trim() : "Degree",
    institution: typeof edu.institution === "string" ? edu.institution.trim() : "Institution",
    location: typeof edu.location === "string" ? edu.location.trim() : "",
    dates: typeof edu.dates === "string" ? edu.dates.trim() : "",
    details: typeof edu.details === "string" ? edu.details.trim() : "",
  }));

  const rawCustom = Array.isArray(raw.customSections) ? raw.customSections : [];
  const normalizedCustom = rawCustom
    .map((cs: any) => ({
      title: typeof cs.title === "string" ? cs.title.trim() : "Additional Section",
      items: parseSkillList(cs.items || cs.bullets || cs.list),
    }))
    .filter((cs: any) => cs.title && cs.items.length > 0);

  const normalizedLanguages = parseSkillList(raw.languages);
  const normalizedAwards = parseSkillList(raw.awards || raw.honors);

  const title =
    typeof raw.title === "string" && raw.title.trim()
      ? raw.title.trim()
      : normalizedExp[0]?.role || "Professional Candidate";

  const summary = typeof raw.summary === "string" ? raw.summary.trim() : "";

  return {
    title,
    contact: normalizedContact,
    summary,
    skills: normalizedSkills,
    experience: normalizedExp,
    projects: normalizedProj,
    education: normalizedEdu,
    customSections: normalizedCustom,
    languages: normalizedLanguages,
    awards: normalizedAwards,
  };
}

// 1. API: Parse Raw CV Text into Structured Resume Object
app.post("/api/parse-cv", async (req, res) => {
  try {
    const { rawText } = req.body;
    if (!rawText || typeof rawText !== "string") {
      return res.status(400).json({ error: "rawText is required" });
    }

    const prompt = `Parse the following raw resume/CV text into a structured JSON format according to the schema:

Resume Content:
"""
${rawText}
"""`;

    const response = await generateContentWithFallback({
      contents: prompt,
      config: {
        systemInstruction: PARSER_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESUME_RESPONSE_SCHEMA,
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    const normalized = normalizeResumeData(parsedData);

    res.json(normalized);
  } catch (err: any) {
    console.error("Error in /api/parse-cv:", err);
    res.status(500).json({ error: err.message || "Failed to parse CV text" });
  }
});

// API: Upload and Parse Resume File (PDF, DOCX, TXT, PNG, JPG)
app.post("/api/upload-cv", async (req, res) => {
  try {
    const { fileData, fileName, mimeType } = req.body;
    if (!fileData) {
      return res.status(400).json({ error: "fileData (base64 string) is required" });
    }

    // Strip prefix if present (e.g. data:application/pdf;base64,)
    const base64Clean = fileData.replace(/^data:[^;]+;base64,/, "");
    const ext = (fileName || "").split(".").pop()?.toLowerCase() || "";
    const buffer = Buffer.from(base64Clean, "base64");

    let responseText = "";

    // A) Word Documents (DOCX / DOC) via Mammoth
    if (
      ext === "docx" ||
      ext === "doc" ||
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimeType === "application/msword"
    ) {
      const result = await mammoth.extractRawText({ buffer });
      const extractedText = result.value || "";

      if (!extractedText.trim()) {
        return res.status(400).json({ error: "Could not extract text from Word document" });
      }

      const prompt = `Parse the following raw resume/CV extracted from a Word document into the JSON schema:

Resume Text:
"""
${extractedText}
"""`;

      const response = await generateContentWithFallback({
        contents: prompt,
        config: {
          systemInstruction: PARSER_SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: RESUME_RESPONSE_SCHEMA,
        },
      });

      responseText = response.text || "{}";
    }
    // B) PDF Files: First extract text with pdf-parse, fallback/supplement with Multimodal Gemini
    else if (ext === "pdf" || mimeType === "application/pdf") {
      const pdfExtractedText = await extractPdfText(buffer);

      // If text extraction yielded substantial content, feed the clean text
      if (pdfExtractedText.trim().length > 50) {
        const prompt = `Parse the following resume extracted from a PDF document into structured JSON:

Extracted Resume Text:
"""
${pdfExtractedText}
"""`;

        const response = await generateContentWithFallback({
          contents: prompt,
          config: {
            systemInstruction: PARSER_SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: RESUME_RESPONSE_SCHEMA,
          },
        });

        responseText = response.text || "{}";
      } else {
        // Fallback to Gemini Multimodal inlineData OCR for scanned or image-based PDFs
        const response = await generateContentWithFallback({
          contents: [
            {
              inlineData: {
                mimeType: "application/pdf",
                data: base64Clean,
              },
            },
            {
              text: "Extract all resume details (contact, summary, categorized skills, work history, projects, education) into the JSON schema.",
            },
          ],
          config: {
            systemInstruction: PARSER_SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: RESUME_RESPONSE_SCHEMA,
          },
        });

        responseText = response.text || "{}";
      }
    }
    // C) Image Files (PNG, JPG, WEBP)
    else if (
      ext === "png" ||
      ext === "jpg" ||
      ext === "jpeg" ||
      ext === "webp" ||
      (mimeType && mimeType.startsWith("image/"))
    ) {
      const effectiveMimeType = mimeType && mimeType.startsWith("image/") ? mimeType : "image/jpeg";

      const response = await generateContentWithFallback({
        contents: [
          {
            inlineData: {
              mimeType: effectiveMimeType,
              data: base64Clean,
            },
          },
          {
            text: "Read this resume image and extract all details into structured JSON according to the schema.",
          },
        ],
        config: {
          systemInstruction: PARSER_SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: RESUME_RESPONSE_SCHEMA,
        },
      });

      responseText = response.text || "{}";
    }
    // D) Text / Markdown / RTF
    else {
      const decodedText = buffer.toString("utf-8");
      const prompt = `Parse the following raw resume text into structured JSON:

Resume Text:
"""
${decodedText}
"""`;

      const response = await generateContentWithFallback({
        contents: prompt,
        config: {
          systemInstruction: PARSER_SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: RESUME_RESPONSE_SCHEMA,
        },
      });

      responseText = response.text || "{}";
    }

    const parsedData = JSON.parse(responseText);
    const normalized = normalizeResumeData(parsedData);

    res.json(normalized);
  } catch (err: any) {
    console.error("Error in /api/upload-cv:", err);
    res.status(500).json({ error: err.message || "Failed to upload and parse resume file" });
  }
});

// 2. API: Analyze ATS Match & Keyword Gaps
app.post("/api/analyze-cv", async (req, res) => {
  try {
    const { resume, jobDescription } = req.body;
    if (!resume || !jobDescription) {
      return res.status(400).json({ error: "resume and jobDescription are required" });
    }

    const prompt = `Analyze this candidate CV against the specified Job Description for ATS compatibility, keyword match, and experience alignment.

RESUME DATA:
${JSON.stringify(resume, null, 2)}

JOB DESCRIPTION:
"""
${jobDescription}
"""`;

    const response = await generateContentWithFallback({
      contents: prompt,
      config: {
        systemInstruction: "You are an expert enterprise ATS (Applicant Tracking System) recruiter and resume screener. Perform a strict, actionable analysis of match percentage, keyword gaps, strengths, and formatting/ATS warnings.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchScore: { type: Type.NUMBER, description: "Overall match score percentage 0 to 100" },
            breakdown: {
              type: Type.OBJECT,
              properties: {
                hardSkillsScore: { type: Type.NUMBER, description: "0 to 100" },
                experienceScore: { type: Type.NUMBER, description: "0 to 100" },
                softSkillsScore: { type: Type.NUMBER, description: "0 to 100" },
                formattingScore: { type: Type.NUMBER, description: "0 to 100" },
              },
              required: ["hardSkillsScore", "experienceScore", "softSkillsScore", "formattingScore"],
            },
            verdict: { type: Type.STRING, description: "Headline evaluation e.g., 'Strong Match', 'Moderate Match - Keyword Gaps'" },
            executiveSummary: { type: Type.STRING, description: "2-3 sentences overview of candidate fit" },
            keywords: {
              type: Type.OBJECT,
              properties: {
                required: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Key terms in JD" },
                matching: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Terms present in CV" },
                missingCritical: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Essential terms missing from CV" },
                missingRecommended: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Nice-to-have terms missing" },
              },
              required: ["required", "matching", "missingCritical", "missingRecommended"],
            },
            missingSkillsAndGaps: { type: Type.ARRAY, items: { type: Type.STRING } },
            keyStrengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            atsWarnings: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["matchScore", "breakdown", "verdict", "executiveSummary", "keywords", "missingSkillsAndGaps", "keyStrengths", "atsWarnings"],
        },
      },
    });

    const analysis = JSON.parse(response.text || "{}");
    res.json(analysis);
  } catch (err: any) {
    console.error("Error in /api/analyze-cv:", err);
    res.status(500).json({ error: err.message || "Failed to analyze CV" });
  }
});

// 3. API: Fully Optimize & Tailor CV to Job Description
app.post("/api/optimize-cv", async (req, res) => {
  try {
    const { resume, jobDescription } = req.body;
    if (!resume || !jobDescription) {
      return res.status(400).json({ error: "resume and jobDescription are required" });
    }

    const prompt = `Tailor the following CV to maximally align with the provided Job Description while preserving complete truthfulness and factual accuracy.

RULES:
1. Rephrase work experience bullet points to integrate missing critical ATS keywords organically.
2. Use strong action verbs and Google's X-Y-Z metric formula ("Accomplished [X] as measured by [Y], by doing [Z]") where numbers exist or can be inferred realistically.
3. Re-order and highlight skills so relevant job requirements appear at the top.
4. Craft a compelling 3-4 sentence professional summary targeted specifically at the company and role.
5. Provide a list of specific improvements made with explanations and keywords added.
6. Calculate the updated projected ATS match score (0-100).
7. Draft a matching tailored 3-paragraph cover letter.
8. CRITICAL MANDATE FOR RESUME SECTIONS:
   - Retain ALL work experience entries, ALL project entries, ALL education entries, ALL skill categories (technical, soft, tools, certifications), and ALL contact information from the BASE RESUME.
   - Do NOT delete, drop, omit, or truncate any education entries, professional certifications, projects, or job experience present in the base resume.
   - DO NOT truncate or omit sections to fit a single page. Multi-page resumes are fully supported and encouraged for complete content preservation. Every degree, school, certification, and accomplishment MUST be preserved in full.

BASE RESUME:
${JSON.stringify(resume, null, 2)}

TARGET JOB DESCRIPTION:
"""
${jobDescription}
"""`;

    const response = await generateContentWithFallback({
      contents: prompt,
      config: {
        systemInstruction: "You are an elite career strategist and executive resume writer. Return a complete tailored resume structure, detailed improvements made, updated match score, and tailored cover letter.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tailoredResume: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                contact: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    email: { type: Type.STRING },
                    phone: { type: Type.STRING },
                    location: { type: Type.STRING },
                    linkedin: { type: Type.STRING },
                    github: { type: Type.STRING },
                    website: { type: Type.STRING },
                  },
                  required: ["name", "email"],
                },
                summary: { type: Type.STRING },
                skills: {
                  type: Type.OBJECT,
                  properties: {
                    technical: { type: Type.ARRAY, items: { type: Type.STRING } },
                    soft: { type: Type.ARRAY, items: { type: Type.STRING } },
                    tools: { type: Type.ARRAY, items: { type: Type.STRING } },
                    certifications: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ["technical", "soft", "tools"],
                },
                experience: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      company: { type: Type.STRING },
                      role: { type: Type.STRING },
                      location: { type: Type.STRING },
                      dates: { type: Type.STRING },
                      bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ["company", "role", "bullets"],
                  },
                },
                projects: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      name: { type: Type.STRING },
                      description: { type: Type.STRING },
                      technologies: { type: Type.ARRAY, items: { type: Type.STRING } },
                      bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ["name"],
                  },
                },
                education: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      degree: { type: Type.STRING },
                      institution: { type: Type.STRING },
                      location: { type: Type.STRING },
                      dates: { type: Type.STRING },
                      details: { type: Type.STRING },
                    },
                    required: ["degree", "institution"],
                  },
                },
              },
              required: ["contact", "summary", "skills", "experience", "education"],
            },
            improvementsMade: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  section: { type: Type.STRING },
                  original: { type: Type.STRING },
                  tailored: { type: Type.STRING },
                  reasoning: { type: Type.STRING },
                  keywordsAdded: { type: Type.ARRAY, items: { type: Type.STRING } },
                  isApplied: { type: Type.BOOLEAN },
                },
                required: ["section", "original", "tailored", "reasoning", "keywordsAdded"],
              },
            },
            newMatchScore: { type: Type.NUMBER },
            coverLetter: { type: Type.STRING },
          },
          required: ["tailoredResume", "improvementsMade", "newMatchScore", "coverLetter"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");

    if (result.tailoredResume) {
      // Normalize tailoredResume structure
      const normalizedTailored = normalizeResumeData(result.tailoredResume);

      // Preserve projects if base resume had projects but tailored lost them or left empty
      if ((!normalizedTailored.projects || normalizedTailored.projects.length === 0) && resume.projects && resume.projects.length > 0) {
        normalizedTailored.projects = resume.projects;
      }

      // Preserve education if base resume had education but tailored lost it
      if ((!normalizedTailored.education || normalizedTailored.education.length === 0) && resume.education && resume.education.length > 0) {
        normalizedTailored.education = resume.education;
      }

      // Preserve certifications if base resume had certifications
      if (resume.skills?.certifications && resume.skills.certifications.length > 0) {
        if (!normalizedTailored.skills.certifications || normalizedTailored.skills.certifications.length === 0) {
          normalizedTailored.skills.certifications = resume.skills.certifications;
        }
      }

      // Preserve contact fields (linkedin, github, website) if present in original
      if (resume.contact) {
        normalizedTailored.contact = {
          linkedin: resume.contact.linkedin || "",
          github: resume.contact.github || "",
          website: resume.contact.website || "",
          ...normalizedTailored.contact,
        };
      }

      // Preserve customSections, languages, and awards if present in original
      if (resume.customSections && resume.customSections.length > 0) {
        if (!normalizedTailored.customSections || normalizedTailored.customSections.length === 0) {
          normalizedTailored.customSections = resume.customSections;
        }
      }
      if (resume.languages && resume.languages.length > 0) {
        if (!normalizedTailored.languages || normalizedTailored.languages.length === 0) {
          normalizedTailored.languages = resume.languages;
        }
      }
      if (resume.awards && resume.awards.length > 0) {
        if (!normalizedTailored.awards || normalizedTailored.awards.length === 0) {
          normalizedTailored.awards = resume.awards;
        }
      }

      result.tailoredResume = normalizedTailored;
    }

    // Ensure IDs exist on experience and improvements
    if (result.tailoredResume?.experience) {
      result.tailoredResume.experience = result.tailoredResume.experience.map((e: any, idx: number) => ({
        ...e,
        id: e.id || resume.experience?.[idx]?.id || `exp-${idx}-${Date.now()}`,
      }));
    }

    if (result.improvementsMade) {
      result.improvementsMade = result.improvementsMade.map((imp: any, idx: number) => ({
        ...imp,
        id: imp.id || `imp-${idx}-${Date.now()}`,
        isApplied: true,
      }));
    }

    res.json(result);
  } catch (err: any) {
    console.error("Error in /api/optimize-cv:", err);
    res.status(500).json({ error: err.message || "Failed to optimize CV" });
  }
});

// 4. API: Rewrite Single Bullet Point with Custom Prompt
app.post("/api/rewrite-bullet", async (req, res) => {
  try {
    const { originalBullet, roleContext, jobDescription, instruction } = req.body;
    if (!originalBullet) {
      return res.status(400).json({ error: "originalBullet is required" });
    }

    const prompt = `Rewrite the following resume bullet point to make it more impactful for ATS systems and hiring managers.

ORIGINAL BULLET:
"${originalBullet}"

ROLE CONTEXT:
${roleContext || "Software Engineer"}

JOB DESCRIPTION context:
"""
${jobDescription || "N/A"}
"""

USER CUSTOM INSTRUCTION:
"${instruction || "Make it more quantified with measurable impact and strong action verbs."}"

Generate 3 high-quality, distinct bullet options.`;

    const response = await generateContentWithFallback({
      contents: prompt,
      config: {
        systemInstruction: "You are an expert executive resume writer. Provide 3 distinct, highly effective rewrites of a bullet point.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            variations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING, description: "e.g., 'Action-Oriented', 'Quantitative Focus', 'Leadership Angle'" },
                  text: { type: Type.STRING },
                  keywordsInjected: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["label", "text", "keywordsInjected"],
              },
            },
          },
          required: ["variations"],
        },
      },
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (err: any) {
    console.error("Error in /api/rewrite-bullet:", err);
    res.status(500).json({ error: err.message || "Failed to rewrite bullet point" });
  }
});

// 5. API: Generate Cover Letter with Tone Selection
app.post("/api/generate-cover-letter", async (req, res) => {
  try {
    const { resume, jobDescription, tone } = req.body;
    if (!resume || !jobDescription) {
      return res.status(400).json({ error: "resume and jobDescription are required" });
    }

    const prompt = `Write a compelling 3-paragraph cover letter tailored specifically to the position described in the job description using the candidate's achievements.

TONE: ${tone || "Professional and Enthusiastic"}

CANDIDATE PROFILE:
Name: ${resume.contact?.name || "Candidate"}
Current Title: ${resume.title || "Professional"}
Summary: ${resume.summary || ""}
Key Skills: ${resume.skills?.technical?.join(", ") || ""}

JOB DESCRIPTION:
"""
${jobDescription}
"""`;

    const response = await generateContentWithFallback({
      contents: prompt,
      config: {
        systemInstruction: "Write a high-converting, professional cover letter tailored precisely to the hiring manager and company specified in the job description.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subjectLine: { type: Type.STRING },
            salutation: { type: Type.STRING },
            paragraph1: { type: Type.STRING, description: "Opening hook highlighting candidate interest and matching background" },
            paragraph2: { type: Type.STRING, description: "Core achievements and skills mapping directly to JD challenges" },
            paragraph3: { type: Type.STRING, description: "Call to action and professional sign-off" },
            fullText: { type: Type.STRING },
          },
          required: ["subjectLine", "salutation", "paragraph1", "paragraph2", "paragraph3", "fullText"],
        },
      },
    });

    const letterData = JSON.parse(response.text || "{}");
    res.json(letterData);
  } catch (err: any) {
    console.error("Error in /api/generate-cover-letter:", err);
    res.status(500).json({ error: err.message || "Failed to generate cover letter" });
  }
});

// Start Express server + Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CV Optimizer Server listening on http://localhost:${PORT}`);
  });
}

startServer();
