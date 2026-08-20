import { Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle, ExternalHyperlink, ParagraphChild } from 'docx';
import { saveAs } from 'file-saver';
import { ResumeData } from '../types';
import { formatUrl, formatLinkedInUrl, formatGithubUrl, formatMailto } from './urlHelper';

export const exportResumeToDocx = async (resume: ResumeData) => {
  const candidateName = resume.contact?.name || 'Candidate';
  const portfolioLink = resume.contact?.portfolio || resume.contact?.website;

  const children: Paragraph[] = [];

  // Header: Name
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: candidateName,
          bold: true,
          size: 32, // 16pt
          color: '0F172A',
        }),
      ],
      spacing: { after: 80 },
    })
  );

  // Title / Headline
  if (resume.title) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: resume.title.toUpperCase(),
            bold: true,
            size: 22, // 11pt
            color: '3730A3',
          }),
        ],
        spacing: { after: 120 },
      })
    );
  }

  // Contact Info Line with Hyperlinks
  const contactChildren: ParagraphChild[] = [];

  const addSeparator = () => {
    if (contactChildren.length > 0) {
      contactChildren.push(
        new TextRun({
          text: '   |   ',
          size: 19,
          color: '94A3B8',
        })
      );
    }
  };

  if (resume.contact?.email) {
    addSeparator();
    contactChildren.push(
      new ExternalHyperlink({
        link: formatMailto(resume.contact.email),
        children: [
          new TextRun({
            text: resume.contact.email,
            color: '2563EB',
            underline: {},
            size: 19,
          }),
        ],
      })
    );
  }

  if (resume.contact?.phone) {
    addSeparator();
    contactChildren.push(
      new TextRun({
        text: resume.contact.phone,
        size: 19,
        color: '475569',
      })
    );
  }

  if (resume.contact?.location) {
    addSeparator();
    contactChildren.push(
      new TextRun({
        text: resume.contact.location,
        size: 19,
        color: '475569',
      })
    );
  }

  if (portfolioLink) {
    addSeparator();
    contactChildren.push(
      new ExternalHyperlink({
        link: formatUrl(portfolioLink),
        children: [
          new TextRun({
            text: 'Portfolio',
            bold: true,
            color: '2563EB',
            underline: {},
            size: 19,
          }),
        ],
      })
    );
  }

  if (resume.contact?.linkedin) {
    addSeparator();
    contactChildren.push(
      new ExternalHyperlink({
        link: formatLinkedInUrl(resume.contact.linkedin),
        children: [
          new TextRun({
            text: 'LinkedIn',
            bold: true,
            color: '2563EB',
            underline: {},
            size: 19,
          }),
        ],
      })
    );
  }

  if (resume.contact?.github) {
    addSeparator();
    contactChildren.push(
      new ExternalHyperlink({
        link: formatGithubUrl(resume.contact.github),
        children: [
          new TextRun({
            text: 'GitHub',
            bold: true,
            color: '2563EB',
            underline: {},
            size: 19,
          }),
        ],
      })
    );
  }

  if (contactChildren.length > 0) {
    children.push(
      new Paragraph({
        children: contactChildren,
        spacing: { after: 200 },
        border: {
          bottom: {
            style: BorderStyle.SINGLE,
            size: 6,
            color: 'CBD5E1',
            space: 10,
          },
        },
      })
    );
  }

  // Section Heading Helper
  const createSectionHeading = (title: string) => {
    return new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          size: 22, // 11pt
          color: '0F172A',
        }),
      ],
      spacing: { before: 240, after: 120 },
      border: {
        bottom: {
          style: BorderStyle.SINGLE,
          size: 4,
          color: '94A3B8',
          space: 4,
        },
      },
    });
  };

  // Professional Summary
  if (resume.summary) {
    children.push(createSectionHeading('Professional Summary'));
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: resume.summary,
            size: 20, // 10pt
            color: '1E293B',
          }),
        ],
        spacing: { after: 160 },
      })
    );
  }

  // Skills
  if (resume.skills) {
    const hasSkills =
      (resume.skills.technical && resume.skills.technical.length > 0) ||
      (resume.skills.soft && resume.skills.soft.length > 0) ||
      (resume.skills.tools && resume.skills.tools.length > 0) ||
      (resume.skills.certifications && resume.skills.certifications.length > 0);

    if (hasSkills) {
      children.push(createSectionHeading('Core Competencies & Technical Skills'));

      if (resume.skills.technical?.length) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Technical Skills: ', bold: true, size: 20, color: '0F172A' }),
              new TextRun({ text: resume.skills.technical.join(', '), size: 20, color: '334155' }),
            ],
            spacing: { after: 80 },
          })
        );
      }

      if (resume.skills.soft?.length) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Core Capabilities: ', bold: true, size: 20, color: '0F172A' }),
              new TextRun({ text: resume.skills.soft.join(', '), size: 20, color: '334155' }),
            ],
            spacing: { after: 80 },
          })
        );
      }

      if (resume.skills.tools?.length) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Tools & Platforms: ', bold: true, size: 20, color: '0F172A' }),
              new TextRun({ text: resume.skills.tools.join(', '), size: 20, color: '334155' }),
            ],
            spacing: { after: 80 },
          })
        );
      }

      if (resume.skills.certifications?.length) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Certifications & Licenses: ', bold: true, size: 20, color: '0F172A' }),
              new TextRun({ text: resume.skills.certifications.join(', '), size: 20, color: '334155' }),
            ],
            spacing: { after: 80 },
          })
        );
      }
    }
  }

  // Professional Experience
  if (resume.experience && resume.experience.length > 0) {
    children.push(createSectionHeading('Professional Experience'));

    resume.experience.forEach((exp) => {
      // Role & Dates
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: exp.role || 'Role', bold: true, size: 21, color: '0F172A' }),
            new TextRun({ text: `   |   ${exp.company || 'Company'}`, bold: true, size: 20, color: '312E81' }),
            exp.location ? new TextRun({ text: ` (${exp.location})`, italics: true, size: 19, color: '64748B' }) : new TextRun({ text: '' }),
            exp.dates ? new TextRun({ text: `\t${exp.dates}`, bold: true, size: 19, color: '475569' }) : new TextRun({ text: '' }),
          ],
          spacing: { before: 120, after: 60 },
        })
      );

      // Bullets
      if (exp.bullets && exp.bullets.length > 0) {
        exp.bullets.forEach((bullet) => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: bullet,
                  size: 20,
                  color: '1E293B',
                }),
              ],
              bullet: { level: 0 },
              spacing: { after: 40 },
            })
          );
        });
      }
    });
  }

  // Key Projects
  if (resume.projects && resume.projects.length > 0) {
    children.push(createSectionHeading('Key Projects & Initiatives'));

    resume.projects.forEach((proj) => {
      const techText = proj.technologies?.length ? ` [${proj.technologies.join(', ')}]` : '';
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: proj.name || 'Project', bold: true, size: 21, color: '0F172A' }),
            techText ? new TextRun({ text: techText, size: 19, color: '475569', italics: true }) : new TextRun({ text: '' }),
          ],
          spacing: { before: 120, after: 40 },
        })
      );

      if (proj.description) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: proj.description, italics: true, size: 19, color: '334155' }),
            ],
            spacing: { after: 40 },
          })
        );
      }

      if (proj.bullets && proj.bullets.length > 0) {
        proj.bullets.forEach((bullet) => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: bullet, size: 20, color: '1E293B' }),
              ],
              bullet: { level: 0 },
              spacing: { after: 40 },
            })
          );
        });
      }
    });
  }

  // Education
  if (resume.education && resume.education.length > 0) {
    children.push(createSectionHeading('Education'));

    resume.education.forEach((ed) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: ed.degree || 'Degree', bold: true, size: 21, color: '0F172A' }),
            new TextRun({ text: ` — ${ed.institution || 'Institution'}`, size: 20, color: '334155' }),
            ed.location ? new TextRun({ text: ` (${ed.location})`, italics: true, size: 19, color: '64748B' }) : new TextRun({ text: '' }),
            ed.dates ? new TextRun({ text: `\t${ed.dates}`, bold: true, size: 19, color: '475569' }) : new TextRun({ text: '' }),
          ],
          spacing: { before: 120, after: 40 },
        })
      );

      if (ed.details) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: ed.details, size: 19, color: '475569' }),
            ],
            spacing: { after: 60 },
          })
        );
      }
    });
  }

  // Honors & Awards
  if (resume.awards && resume.awards.length > 0) {
    children.push(createSectionHeading('Honors & Awards'));
    resume.awards.forEach((award) => {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: award, size: 20, color: '1E293B' })],
          bullet: { level: 0 },
          spacing: { after: 40 },
        })
      );
    });
  }

  // Languages
  if (resume.languages && resume.languages.length > 0) {
    children.push(createSectionHeading('Languages'));
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: resume.languages.join(', '), size: 20, color: '1E293B' }),
        ],
        spacing: { after: 120 },
      })
    );
  }

  // Custom Sections
  if (resume.customSections && resume.customSections.length > 0) {
    resume.customSections.forEach((sec) => {
      if (sec.title) {
        children.push(createSectionHeading(sec.title));
        if (sec.items && sec.items.length > 0) {
          sec.items.forEach((item) => {
            children.push(
              new Paragraph({
                children: [new TextRun({ text: item, size: 20, color: '1E293B' })],
                bullet: { level: 0 },
                spacing: { after: 40 },
              })
            );
          });
        }
      }
    });
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1000,
              bottom: 1000,
              left: 1000,
              right: 1000,
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `${candidateName.replace(/\s+/g, '_')}_Tailored_CV.docx`;
  saveAs(blob, fileName);
};

export const exportCoverLetterToDocx = async (
  resume: ResumeData,
  jobTitle: string,
  coverLetterText: string,
  subjectLine?: string
) => {
  const candidateName = resume.contact?.name || 'Candidate';
  const portfolioLink = resume.contact?.portfolio || resume.contact?.website;

  const children: Paragraph[] = [];

  // Header Name
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: candidateName,
          bold: true,
          size: 32, // 16pt
          color: '0F172A',
        }),
      ],
      spacing: { after: 60 },
    })
  );

  // Title
  if (resume.title) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: resume.title,
            size: 22,
            color: '475569',
          }),
        ],
        spacing: { after: 100 },
      })
    );
  }

  // Contact info with hyperlinks
  const contactChildren: ParagraphChild[] = [];

  const addSeparator = () => {
    if (contactChildren.length > 0) {
      contactChildren.push(
        new TextRun({
          text: '   •   ',
          size: 19,
          color: '94A3B8',
        })
      );
    }
  };

  if (resume.contact?.email) {
    addSeparator();
    contactChildren.push(
      new ExternalHyperlink({
        link: formatMailto(resume.contact.email),
        children: [
          new TextRun({
            text: resume.contact.email,
            color: '2563EB',
            underline: {},
            size: 19,
          }),
        ],
      })
    );
  }

  if (resume.contact?.phone) {
    addSeparator();
    contactChildren.push(
      new TextRun({
        text: resume.contact.phone,
        size: 19,
        color: '64748B',
      })
    );
  }

  if (resume.contact?.location) {
    addSeparator();
    contactChildren.push(
      new TextRun({
        text: resume.contact.location,
        size: 19,
        color: '64748B',
      })
    );
  }

  if (portfolioLink) {
    addSeparator();
    contactChildren.push(
      new ExternalHyperlink({
        link: formatUrl(portfolioLink),
        children: [
          new TextRun({
            text: 'Portfolio',
            bold: true,
            color: '2563EB',
            underline: {},
            size: 19,
          }),
        ],
      })
    );
  }

  if (resume.contact?.linkedin) {
    addSeparator();
    contactChildren.push(
      new ExternalHyperlink({
        link: formatLinkedInUrl(resume.contact.linkedin),
        children: [
          new TextRun({
            text: 'LinkedIn',
            bold: true,
            color: '2563EB',
            underline: {},
            size: 19,
          }),
        ],
      })
    );
  }

  if (resume.contact?.github) {
    addSeparator();
    contactChildren.push(
      new ExternalHyperlink({
        link: formatGithubUrl(resume.contact.github),
        children: [
          new TextRun({
            text: 'GitHub',
            bold: true,
            color: '2563EB',
            underline: {},
            size: 19,
          }),
        ],
      })
    );
  }

  if (contactChildren.length > 0) {
    children.push(
      new Paragraph({
        children: contactChildren,
        spacing: { after: 200 },
        border: {
          bottom: {
            style: BorderStyle.SINGLE,
            size: 6,
            color: 'CBD5E1',
            space: 10,
          },
        },
      })
    );
  }

  // Date
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          size: 21,
          color: '334155',
        }),
      ],
      spacing: { after: 160 },
    })
  );

  // Subject line
  const subject = subjectLine || `Application for ${jobTitle || 'Position'} - ${candidateName}`;
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `RE: ${subject}`,
          bold: true,
          size: 22,
          color: '1E293B',
        }),
      ],
      spacing: { after: 240 },
    })
  );

  // Body paragraphs
  const paragraphs = coverLetterText.split('\n\n');
  paragraphs.forEach((p) => {
    const trimmed = p.trim();
    if (trimmed) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmed,
              size: 21, // 10.5pt
              color: '1E293B',
            }),
          ],
          spacing: { after: 200 },
        })
      );
    }
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1140,
              bottom: 1140,
              left: 1140,
              right: 1140,
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `${candidateName.replace(/\s+/g, '_')}_Cover_Letter.docx`;
  saveAs(blob, fileName);
};
