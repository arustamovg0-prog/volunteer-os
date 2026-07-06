'use client';

export function getPrivilegedHeaders(revealSecret = false): HeadersInit {
  const headers: Record<string, string> = {};

  const apiKey = localStorage.getItem('volunteerOsApiKey');
  if (apiKey) {
    headers['x-volunteer-os-api-key'] = apiKey;
  }

  if (revealSecret) {
    headers['x-volunteer-os-reveal-secret'] = 'true';
  }

  return headers;
}
