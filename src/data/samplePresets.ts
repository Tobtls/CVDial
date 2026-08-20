import { ResumeData, JobDescriptionData } from '../types';

export const SAMPLE_RESUMES: { id: string; name: string; role: string; data: ResumeData }[] = [
  {
    id: 'res-software-eng',
    name: 'Alex Rivera',
    role: 'Senior Full Stack Engineer',
    data: {
      title: 'Senior Full Stack Engineer',
      contact: {
        name: 'Alex Rivera',
        email: 'alex.rivera@example.com',
        phone: '+1 (555) 234-5678',
        location: 'San Francisco, CA',
        linkedin: 'linkedin.com/in/alex-rivera-tech',
        github: 'github.com/arivera-dev',
        website: 'alexrivera.dev',
      },
      summary: 'Passionate Full Stack Engineer with 6+ years of experience building scalable web applications using React, Node.js, and Cloud Infrastructure. Skilled in frontend performance optimization, microservices architecture, and team mentoring.',
      skills: {
        technical: ['React', 'TypeScript', 'Node.js', 'Express', 'GraphQL', 'PostgreSQL', 'Redis', 'Docker', 'REST APIs'],
        soft: ['Cross-functional Collaboration', 'Agile/Scrum', 'Technical Leadership', 'Code Review', 'Problem Solving'],
        tools: ['Git', 'Vite', 'AWS (EC2, S3)', 'Jest', 'Webpack', 'Tailwind CSS', 'CI/CD Pipelines'],
        certifications: ['AWS Certified Developer - Associate', 'Meta Certified Frontend Developer'],
      },
      experience: [
        {
          id: 'exp-1',
          company: 'CloudScale Tech',
          role: 'Senior Full Stack Engineer',
          location: 'San Francisco, CA',
          dates: '2022 - Present',
          bullets: [
            'Architected and deployed a distributed microservices dashboard serving 200,000+ daily active users using React, Express, and PostgreSQL.',
            'Reduced initial web page load latency by 42% through aggressive code-splitting, dynamic imports, and Redis query caching.',
            'Mentored 4 junior engineers and spearheaded weekly engineering architecture reviews to maintain 95%+ test coverage.',
            'Integrated Stripe payment gateway and automated webhook event handlers processing over $1.5M in monthly transactions.',
          ],
        },
        {
          id: 'exp-2',
          company: 'Nexus Software Studio',
          role: 'Full Stack Engineer',
          location: 'Oakland, CA',
          dates: '2019 - 2022',
          bullets: [
            'Built responsive client web portals using React and Redux, reducing user support tickets by 30%.',
            'Designed RESTful API endpoints in Node.js and TypeScript connected to MongoDB cluster.',
            'Collaborated with UI/UX designers to implement component design system using Tailwind CSS and Storybook.',
            'Set up GitHub Actions CI/CD pipeline reducing build and deployment cycles from 45 minutes to 8 minutes.',
          ],
        },
      ],
      projects: [
        {
          id: 'proj-1',
          name: 'AI Analytics Dashboard',
          description: 'Real-time telemetry dashboard visualizing server metrics and model inference times.',
          technologies: ['React', 'TypeScript', 'Tailwind CSS', 'Chart.js', 'Node.js'],
          bullets: [
            'Implemented WebSocket client for streaming live metric updates at 60 FPS.',
            'Designed customizable widget layout engine with drag-and-drop state persistence.',
          ],
        },
      ],
      education: [
        {
          id: 'edu-1',
          degree: 'B.S. in Computer Science',
          institution: 'University of California, Berkeley',
          location: 'Berkeley, CA',
          dates: '2015 - 2019',
          details: 'GPA 3.8 / 4.0, Dean’s Honors List',
        },
      ],
    },
  },
  {
    id: 'res-product-mgr',
    name: 'Sarah Chen',
    role: 'Lead Product Manager',
    data: {
      title: 'Senior Product Manager',
      contact: {
        name: 'Sarah Chen',
        email: 'sarah.chen@example.com',
        phone: '+1 (555) 987-6543',
        location: 'New York, NY',
        linkedin: 'linkedin.com/in/sarahchen-pm',
      },
      summary: 'Data-driven Senior Product Manager with 7+ years leading B2B SaaS product strategy, roadmap execution, and customer growth. Proven track record scaling revenue from $2M to $10M ARR.',
      skills: {
        technical: ['Product Strategy', 'Roadmapping', 'Data Analytics (Mixpanel, SQL)', 'User Research', 'A/B Testing'],
        soft: ['Stakeholder Management', 'Cross-Functional Leadership', 'Agile Development', 'Customer Discovery'],
        tools: ['Jira', 'Figma', 'Amplitude', 'Notion', 'Salesforce', 'Tableau'],
        certifications: ['Certified Scrum Product Owner (CSPO)', 'Pragmatic Institute Certified (PMC-III)'],
      },
      experience: [
        {
          id: 'exp-pm-1',
          company: 'Fintech Velocity',
          role: 'Lead Product Manager - Growth',
          location: 'New York, NY',
          dates: '2021 - Present',
          bullets: [
            'Led cross-functional squad of 12 engineers, designers, and marketers to launch new onboarding funnel, increasing conversion by 28%.',
            'Defined 3-year product roadmap for enterprise analytics tool, growing MRR by $350k within 12 months.',
            'Conducted 50+ customer interviews and synthesized user journey maps to prioritize high-value feature requests.',
          ],
        },
      ],
      projects: [],
      education: [
        {
          id: 'edu-pm-1',
          degree: 'B.A. in Economics & Business',
          institution: 'Columbia University',
          location: 'New York, NY',
          dates: '2013 - 2017',
        },
      ],
    },
  },
];

export const SAMPLE_JOB_DESCRIPTIONS: JobDescriptionData[] = [
  {
    id: 'jd-lead-ai-fullstack',
    title: 'Lead AI Full Stack Engineer',
    company: 'NextGen AI Technologies',
    location: 'San Francisco, CA (Hybrid)',
    rawText: `About NextGen AI Technologies:
We are building the future of enterprise decision intelligence powered by Large Language Models and real-time AI agents.

Role Overview:
We are seeking a Lead AI Full Stack Engineer to drive the architecture and development of our core web platform. You will build high-throughput AI chat interfaces, workflow automation canvases, and robust cloud APIs integrating Gemini and OpenAI LLMs.

Key Responsibilities:
- Architect and build scalable web applications using React, TypeScript, Next.js or Express, and Tailwind CSS.
- Integrate LLMs and generative AI capabilities (Gemini API, function calling, vector databases, RAG) into customer-facing products.
- Optimize frontend rendering, streaming responses (Server-Sent Events / WebSockets), and state management.
- Implement security best practices, server-side API proxying, and OAuth authentication.
- Lead code reviews, system design sessions, and mentor engineers across frontend and backend disciplines.
- Collaborate with Product Managers and AI Researchers to convert complex requirements into intuitive user experiences.

Qualifications & Requirements:
- 5+ years of experience in Full Stack Software Engineering.
- Strong proficiency in React, TypeScript, Node.js, Express, and Modern CSS (Tailwind).
- Experience with AI APIs (Google Gemini, OpenAI), Prompt Engineering, and RAG architectures.
- Experience with Cloud Infrastructure (GCP, AWS, Docker) and relational databases (PostgreSQL).
- Proven track record of performance optimization and scaling applications to 100k+ MAU.
- Excellent communication and cross-functional collaboration skills.
`,
  },
  {
    id: 'jd-staff-pm-growth',
    title: 'Staff Product Manager - AI & SaaS Growth',
    company: 'SaaSify Inc.',
    location: 'Remote',
    rawText: `SaaSify is looking for a Staff Product Manager to lead our Core Platform and AI Growth team.

Responsibilities:
- Own the product lifecycle for AI-powered feature adoption, monetization, and self-serve user retention.
- Partner with engineering, UX design, and data science to execute product experiments and A/B tests.
- Utilize SQL, Mixpanel, and Amplitude to analyze product analytics, user cohorts, and conversion funnel bottlenecks.
- Define OKRs, launch go-to-market strategies, and present roadmap initiatives to C-level executives.

Requirements:
- 6+ years in SaaS product management.
- Deep expertise in user acquisition, PLG (Product-Led Growth), and monetization pricing tier strategies.
- Strong quantitative background with fluent SQL and product analytics tools.
- Demonstrated success introducing generative AI capabilities into SaaS workflows.
`,
  },
];
