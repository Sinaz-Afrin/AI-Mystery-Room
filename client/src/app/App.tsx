import { FormEvent, useEffect, useRef, useState } from 'react'
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import type { Evidence, MysteryCase, Reveal, Suspect } from '../types'

const examples = [
  'At a remote lighthouse opening, the keeper’s brass signal lens disappears during a storm. Three guests claim they never left the dining room.',
  'A rare moonstone vanishes from a locked museum gallery during a crowded evening reception, and the display is found undamaged.',
  'The final page of an unfinished symphony disappears from a quiet conservatory shortly before its private performance.',
]

function Header() {
  return <header className="topbar"><Link to="/" className="brand"><span className="brand-mark">✳</span> MYSTERY ROOM</Link><nav><Link to="/cases">Case files</Link><a href="/" onClick={(event) => { if (location.pathname === '/') { event.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) } }}>New investigation</a></nav></header>
}

function Home() {
  const [premise, setPremise] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [tone, setTone] = useState('classic_detective')
  const [evidenceVolume, setEvidenceVolume] = useState('standard')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  async function submit(event: FormEvent) {
    event.preventDefault(); setError('')
    if (premise.trim().length < 50 || premise.trim().length > 1500) { setError('Write a scenario between 50 and 1,500 characters.'); return }
    setLoading(true)
    try { const { case: created } = await api.createCase({ premise: premise.trim(), difficulty, tone, evidenceVolume }); navigate(`/case/${created.id}`) }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Mystery creation failed. Please try again.') }
    finally { setLoading(false) }
  }
  return <>
    <section className="hero">
      <div className="hero-copy"><span className="eyebrow"><span className="live-dot" /> YOUR NEXT CASE AWAITS</span><h1>Every clue has<br /><em>a story.</em></h1><p>Turn a story idea into a fictional investigation. Follow the evidence, question the suspects, and decide what really happened.</p><a className="button button-quiet" href="#create">Create a case <span>↓</span></a></div>
      <div className="hero-art" aria-hidden="true"><div className="orb orb-a" /><div className="orb orb-b" /><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="compass">✳</div><span className="art-tag tag-top">CASE 047 · OPEN</span><span className="art-tag tag-bottom">THE OBSERVATORY FILE</span></div>
    </section>
    <section className="create-section" id="create"><div className="section-heading"><div><span className="eyebrow">01 / OPEN A NEW FILE</span><h2>Set the scene.</h2></div><p>Give us a premise. We’ll build the case around it.</p></div>
      <form className="create-card" onSubmit={submit}>
        <label className="field-label" htmlFor="premise">Your scenario <span>Required</span></label>
        <textarea id="premise" value={premise} onChange={(event) => setPremise(event.target.value)} maxLength={1500} minLength={50} placeholder="A rare artifact vanished from a locked gallery during a private event... What happened?" aria-describedby="premise-help premise-count" required />
        <div className="textarea-meta"><span id="premise-help">A few details give the investigation a richer start.</span><span id="premise-count" className={premise.length > 1500 ? 'danger-text' : ''}>{premise.length} / 1,500</span></div>
        <div className="examples"><span className="field-label">Need a starting point?</span>{examples.map((example, index) => <button type="button" className="example-chip" key={example} onClick={() => setPremise(example)}>+ IDEA 0{index + 1}</button>)}</div>
        <div className="settings-grid"><label>Difficulty<select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label><label>Atmosphere<select value={tone} onChange={(event) => setTone(event.target.value)}><option value="classic_detective">Classic detective</option><option value="suspense">Suspense</option><option value="lighthearted">Lighthearted</option></select></label><label>Evidence<select value={evidenceVolume} onChange={(event) => setEvidenceVolume(event.target.value)}><option value="compact">Compact</option><option value="standard">Standard</option><option value="detailed">Detailed</option></select></label></div>
        {error && <p className="error-box" role="alert">{error}</p>}
        <div className="form-footer"><p>All cases are fictional. No real people or private records are used.</p><button className="button button-primary" type="submit" disabled={loading || premise.trim().length < 50}>{loading ? <><span className="spinner" /> Writing your case…</> : <>Build my mystery <span>↗</span></>}</button></div>
      </form>
    </section>
    <section className="how-section"><span className="eyebrow">A LITTLE LOGIC. A LOT OF CURIOSITY.</span><div className="steps"><div><b>01</b><h3>Set the scene</h3><p>Start with any fictional mystery premise.</p></div><div><b>02</b><h3>Follow the evidence</h3><p>Review statements, records, objects, and timelines.</p></div><div><b>03</b><h3>Make your call</h3><p>Name a suspect and uncover the full story.</p></div></div></section>
  </>
}

function CaseFiles() {
  const [cases, setCases] = useState<MysteryCase[] | null>(null)
  const [error, setError] = useState('')
  useEffect(() => { api.listCases().then(({ cases: saved }) => setCases(saved)).catch((err) => setError(err.message)) }, [])
  async function remove(id: string) { if (!window.confirm('Delete this case file? This cannot be undone.')) return; try { await api.deleteCase(id); setCases((items) => items?.filter((item) => item.id !== id) ?? []) } catch (err) { setError(err instanceof Error ? err.message : 'Could not delete case.') } }
  return <main className="page-wrap"><div className="page-title"><div><span className="eyebrow">YOUR INVESTIGATION DESK</span><h1>Case files</h1></div><Link className="button button-primary" to="/">+ New case</Link></div><p className="muted">These cases are saved on this browser profile. They are not private accounts or cross-device storage.</p>{error && <p className="error-box" role="alert">{error}</p>}{cases === null ? <p className="loading-line"><span className="spinner" /> Loading case files…</p> : cases.length === 0 ? <div className="empty-state"><span>✳</span><h2>No open files.</h2><p>Your investigations will be kept here.</p><Link className="text-link" to="/">Create your first case →</Link></div> : <div className="case-list">{cases.map((item, index) => <article className="case-row" key={item.id}><span className="case-number">{String(index + 1).padStart(2, '0')}</span><div className="case-row-copy"><span className="eyebrow">{item.status === 'accused' ? 'CLOSED FILE' : 'OPEN INVESTIGATION'} · {new Date(item.createdAt).toLocaleDateString()}</span><h2><Link to={`/case/${item.id}`}>{item.title}</Link></h2><p>{item.premise}</p></div><span className="status-pill">{item.status === 'accused' ? 'REVEALED' : `${item.evidence.length} CLUES`}</span><button className="icon-button" onClick={() => remove(item.id)} aria-label={`Delete ${item.title}`}>×</button></article>)}</div>}</main>
}

function EvidenceDialog({ evidence, onClose }: { evidence: Evidence; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  useEffect(() => { const dialog = dialogRef.current; if (!dialog) return; if (!dialog.open) dialog.showModal(); return () => { if (dialog.open) dialog.close() } }, [])
  return <dialog ref={dialogRef} className="evidence-dialog" onClose={onClose} onClick={(event) => { if (event.target === dialogRef.current) dialogRef.current?.close() }}><div className="dialog-head"><div><span className="eyebrow">FICTIONAL {evidence.type.toUpperCase()} · {evidence.timestamp || 'UNDATED'}</span><h2>{evidence.title}</h2></div><button className="icon-button" onClick={() => dialogRef.current?.close()} aria-label="Close evidence">×</button></div><p className="dialog-description">{evidence.description}</p>{evidence.type === 'image' && <div className="image-placeholder"><span>✳</span><p>{evidence.image?.alt || evidence.description}</p><small>AI-GENERATED FICTIONAL EVIDENCE</small></div>}<div className="artifact-content">{evidence.content}</div><div className="related"><b>Related people</b>{evidence.relatedSuspectIds.length ? evidence.relatedSuspectIds.join(' · ') : 'No direct references'}</div><p className="fiction-label">FICTIONAL EVIDENCE · CREATED FOR THIS MYSTERY</p></dialog>
}

function RevealView({ data, onNew }: { data: Reveal; onNew: () => void }) {
  return <section className="reveal"><span className="eyebrow">CASE REVEALED</span><div className={`result-banner ${data.correct ? 'correct' : 'incorrect'}`}><span className="result-symbol">{data.correct ? '✓' : '!'}</span><div><h2>{data.correct ? 'You found the truth.' : 'The trail led elsewhere.'}</h2><p>You accused {data.selectedSuspect?.name}. The culprit was <strong>{data.culprit?.name}</strong>, {data.culprit?.role?.toLowerCase()}.</p></div></div><div className="reveal-grid"><article className="panel"><span className="eyebrow">HOW THE CLUES CONNECT</span><h3>The reasoning</h3><p>{data.reasoning}</p><h3>What happened</h3><p>{data.finalNarrative}</p></article><article className="panel"><span className="eyebrow">DECISIVE EVIDENCE</span>{data.decisiveEvidence.map((item) => <div className="reveal-clue" key={item.id}><b>{item.title}</b><p>{item.description}</p></div>)}</article></div>{data.redHerringExplanations.length > 0 && <article className="panel red-herring-panel"><span className="eyebrow">THE RED HERRING</span>{data.redHerringExplanations.map((item) => <p key={item.evidenceId}><b>{item.evidence?.title}: </b>{item.explanation}</p>)}</article>}<details className="timeline-reveal"><summary>Review the full case timeline</summary><Timeline events={data.timeline} /></details><button className="button button-primary" onClick={onNew}>Investigate another case <span>↗</span></button></section>
}

function Timeline({ events }: { events: MysteryCase['timeline'] }) {
  return <ol className="timeline">{events.map((event) => <li key={event.id}><time>{event.timestamp}</time><p>{event.event}</p></li>)}</ol>
}

function Investigation() {
  const { caseId = '' } = useParams()
  const navigate = useNavigate()
  const [caseFile, setCaseFile] = useState<MysteryCase | null>(null)
  const [reveal, setReveal] = useState<Reveal | null>(null)
  const [selected, setSelected] = useState<Suspect | null>(null)
  const [reasoning, setReasoning] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterSuspect, setFilterSuspect] = useState('all')
  const [sort, setSort] = useState('default')
  const [activeEvidence, setActiveEvidence] = useState<Evidence | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const confirmRef = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    let active = true
    async function load() {
      try {
        const { case: found } = await api.getCase(caseId)
        if (!active) return
        setCaseFile(found)
        if (found.status === 'accused') { const { reveal: result } = await api.getResult(caseId); if (active) setReveal(result) }
      } catch (err) { if (active) setError(err instanceof Error ? err.message : 'Could not load this case.') }
      finally { if (active) setLoading(false) }
    }
    void load(); return () => { active = false }
  }, [caseId])
  useEffect(() => { const dialog = confirmRef.current; if (!dialog) return; if (confirming && !dialog.open) dialog.showModal(); if (!confirming && dialog.open) dialog.close() }, [confirming])
  async function openEvidence(evidence: Evidence) {
    try { const { evidence: full } = await api.getEvidence(caseId, evidence.id); setActiveEvidence(full); const { reviewedEvidenceIds } = await api.markReviewed(caseId, evidence.id); setCaseFile((current) => current ? { ...current, playerState: { reviewedEvidenceIds } } : current) }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not open that evidence.') }
  }
  async function submitAccusation() {
    if (!selected) return
    setBusy(true); setError('')
    try { const { reveal: result } = await api.accuse(caseId, selected.id, reasoning); setReveal(result); setConfirming(false); setCaseFile((current) => current ? { ...current, status: 'accused' } : current) }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not submit accusation.') }
    finally { setBusy(false) }
  }
  const filteredEvidence = (caseFile?.evidence ?? []).filter((item) => (filterType === 'all' || item.type === filterType) && (filterSuspect === 'all' || item.relatedSuspectIds.includes(filterSuspect))).sort((a, b) => sort === 'time' ? (a.timestamp ?? '').localeCompare(b.timestamp ?? '') : 0)
  if (loading) return <main className="page-wrap"><p className="loading-line"><span className="spinner" /> Opening the case file…</p></main>
  if (error && !caseFile) return <main className="page-wrap"><p className="error-box" role="alert">{error}</p><Link className="text-link" to="/cases">Back to case files</Link></main>
  if (!caseFile) return null
  return <main className="investigation-wrap"><div className="case-topline"><Link to="/cases" className="back-link">← CASE FILES</Link><span className="fiction-badge">✳ FICTIONAL CASE</span></div><header className="case-heading"><div><span className="eyebrow">CASE {caseFile.id.slice(-6).toUpperCase()} · {caseFile.difficulty.toUpperCase()} · {caseFile.tone.replace('_', ' ').toUpperCase()}</span><h1>{caseFile.title}</h1></div><span className="case-open"><i /> {reveal ? 'REVEALED' : 'INVESTIGATING'}</span></header>
    {error && <p className="error-box" role="alert">{error}<button className="dismiss-error" onClick={() => setError('')}>Dismiss</button></p>}
    {reveal ? <RevealView data={reveal} onNew={() => navigate('/')} /> : <>
      <section className="briefing"><span className="eyebrow">THE BRIEFING</span><p>{caseFile.briefing}</p></section>
      <div className="investigation-grid"><section className="evidence-section"><div className="section-bar"><div><span className="eyebrow">02 / THE EVIDENCE</span><h2>Evidence board <span className="count">{caseFile.playerState.reviewedEvidenceIds.length}/{caseFile.evidence.length} reviewed</span></h2></div></div>
        <div className="filter-bar"><label>Type<select value={filterType} onChange={(event) => setFilterType(event.target.value)}><option value="all">All evidence</option>{['chat', 'image', 'cctv', 'statement', 'document', 'timeline', 'physical'].map((type) => <option key={type}>{type}</option>)}</select></label><label>Person<select value={filterSuspect} onChange={(event) => setFilterSuspect(event.target.value)}><option value="all">Everyone</option>{caseFile.suspects.map((suspect) => <option key={suspect.id} value={suspect.id}>{suspect.name}</option>)}</select></label><label>Sort<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="default">Case order</option><option value="time">By timestamp</option></select></label></div>
        <div className="evidence-grid">{filteredEvidence.map((item, index) => <button className={`evidence-card ${caseFile.playerState.reviewedEvidenceIds.includes(item.id) ? 'reviewed' : ''}`} key={item.id} onClick={() => openEvidence(item)}><span className="evidence-card-top"><span className="evidence-index">{String(index + 1).padStart(2, '0')}</span><span className="evidence-type">{item.type}</span></span><h3>{item.title}</h3><p>{item.description}</p><span className="evidence-card-bottom">{item.timestamp || 'NO TIMESTAMP'} <span>↗</span></span></button>)}</div>
        {filteredEvidence.length === 0 && <p className="empty-filter">No evidence matches those filters.</p>}
      </section>
        <aside className="side-column"><section className="suspects-section"><span className="eyebrow">03 / PEOPLE OF INTEREST</span><h2>Suspects</h2><div className="suspect-list">{caseFile.suspects.map((suspect) => <button className={`suspect-card ${selected?.id === suspect.id ? 'selected' : ''}`} key={suspect.id} onClick={() => setSelected(suspect)}><span className="suspect-avatar">{suspect.name.split(' ').map((part) => part[0]).join('')}</span><span className="suspect-copy"><b>{suspect.name}</b><small>{suspect.role}</small><span>{suspect.profile}</span>{selected?.id === suspect.id && <span className={'suspect-facts'}><b>Motive</b>{suspect.motive}<b>Opportunity</b>{suspect.opportunity}<b>Alibi</b>{suspect.alibi}</span>}</span><span className="radio-indicator" aria-hidden="true" /></button>)}</div><div className="accuse-box"><span className="eyebrow">YOUR ACCUSATION</span><p>{selected ? `You are preparing to accuse ${selected.name}.` : 'Select a suspect when you are ready to make your call.'}</p>{selected && <button className="button button-primary accuse-button" onClick={() => setConfirming(true)}>Accuse {selected.name.split(' ')[0]} <span>↗</span></button>}</div></section>
          <section className="timeline-section"><span className="eyebrow">04 / SEQUENCE OF EVENTS</span><h2>Timeline</h2><Timeline events={caseFile.timeline} /></section></aside></div>
      <dialog ref={confirmRef} className="confirm-dialog" onCancel={() => setConfirming(false)}><form method="dialog" onSubmit={(event) => { event.preventDefault(); void submitAccusation() }}><div className="dialog-head"><div><span className="eyebrow">FINAL DECISION</span><h2>Accuse {selected?.name}?</h2></div><button type="button" className="icon-button" onClick={() => setConfirming(false)} aria-label="Cancel accusation">×</button></div><p>You can submit one final accusation for this case. The full solution will be revealed right after.</p><label className="field-label" htmlFor="reasoning-note">Your reasoning <span>Optional</span></label><textarea id="reasoning-note" value={reasoning} onChange={(event) => setReasoning(event.target.value)} maxLength={500} placeholder="Which clues led you here?" /><div className="dialog-actions"><button type="button" className="button button-quiet" onClick={() => setConfirming(false)}>Keep investigating</button><button className="button button-primary" disabled={busy}>{busy ? 'Submitting…' : 'Confirm accusation'}</button></div></form></dialog>
      {activeEvidence && <EvidenceDialog evidence={activeEvidence} onClose={() => setActiveEvidence(null)} />}
    </>}
  </main>
}

function NotFound() { return <main className="page-wrap"><span className="eyebrow">404 / FILE NOT FOUND</span><h1>This page isn’t in the case file.</h1><Link className="text-link" to="/">Return to the desk →</Link></main> }

export default function App() {
  return <><Header /><Routes><Route path="/" element={<Home />} /><Route path="/cases" element={<CaseFiles />} /><Route path="/case/:caseId" element={<Investigation />} /><Route path="*" element={<NotFound />} /></Routes><footer className="site-footer"><span>AI MYSTERY ROOM</span><p>All cases are fictional. Every clue belongs to the story.</p><Link to="/cases">Saved files</Link></footer></>
}
