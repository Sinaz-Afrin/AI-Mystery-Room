import type { Evidence, MysteryCase, Reveal } from '../types'

const apiRoot = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '')
function localClientId() {
  let id = localStorage.getItem('ai-mystery-room-client-id')
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('ai-mystery-room-client-id', id) }
  return id
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${apiRoot}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', 'X-Client-Id': localClientId(), ...options.headers },
    })
  } catch {
    throw new Error('Could not reach the server. Check that the API is running and try again.')
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new Error(payload?.error?.message || 'The request could not be completed. Please try again.')
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const api = {
  createCase: (input: { premise: string; difficulty: string; tone: string; evidenceVolume: string }) => request<{ case: MysteryCase }>('/cases', { method: 'POST', body: JSON.stringify(input) }),
  listCases: () => request<{ cases: MysteryCase[] }>('/cases'),
  getCase: (id: string) => request<{ case: MysteryCase }>(`/cases/${encodeURIComponent(id)}`),
  markReviewed: (caseId: string, evidenceId: string) => request<{ reviewedEvidenceIds: string[] }>(`/cases/${encodeURIComponent(caseId)}/reviewed-evidence`, { method: 'POST', body: JSON.stringify({ evidenceId }) }),
  accuse: (caseId: string, suspectId: string, reasoningNote: string) => request<{ reveal: Reveal }>(`/cases/${encodeURIComponent(caseId)}/accusations`, { method: 'POST', body: JSON.stringify({ suspectId, reasoningNote }) }),
  getResult: (id: string) => request<{ reveal: Reveal }>(`/cases/${encodeURIComponent(id)}/result`),
  deleteCase: (id: string) => request<void>(`/cases/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  getEvidence: (caseId: string, evidenceId: string) => request<{ evidence: Evidence }>(`/cases/${encodeURIComponent(caseId)}/evidence/${encodeURIComponent(evidenceId)}`),
}
