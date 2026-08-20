/**
 * Formats and normalizes various link inputs for hyperlinks
 */

export const formatUrl = (url?: string): string => {
  if (!url) return '';
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

export const formatLinkedInUrl = (linkedin?: string): string => {
  if (!linkedin) return '';
  const trimmed = linkedin.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.toLowerCase().startsWith('linkedin.com')) {
    return `https://${trimmed}`;
  }
  if (trimmed.toLowerCase().startsWith('in/')) {
    return `https://www.linkedin.com/${trimmed}`;
  }
  return `https://www.linkedin.com/in/${trimmed}`;
};

export const formatGithubUrl = (github?: string): string => {
  if (!github) return '';
  const trimmed = github.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.toLowerCase().startsWith('github.com')) {
    return `https://${trimmed}`;
  }
  return `https://github.com/${trimmed}`;
};

export const formatMailto = (email?: string): string => {
  if (!email) return '';
  const trimmed = email.trim();
  return trimmed.toLowerCase().startsWith('mailto:') ? trimmed : `mailto:${trimmed}`;
};

export const formatTel = (phone?: string): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/[^\d+]/g, '');
  return `tel:${cleaned}`;
};
