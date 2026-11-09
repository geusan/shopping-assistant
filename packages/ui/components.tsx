import { useState, type ReactNode } from 'react';
import { AlertCircle, Check, X, ChevronDown } from 'lucide-react';
import { fitSummary, type AnalysisRecord, type Criterion } from '@fits/core';
import brand from './assets/imgIcon.svg';
import assistant from './assets/imgFitsAssistant.svg';
import edit from './assets/imgIconEdit.svg';
import external from './assets/imgIconExternal.svg';
import send from './assets/imgIconSend.svg';
import check from './assets/imgIconCheck.svg';
import panelBrand from './assets/panel-imgIcon.svg';
import panelClose from './assets/panel-imgIcon1.svg';
import panelEdit from './assets/panel-imgIcon2.svg';
import panelInfo from './assets/panel-imgIcon3.svg';
import panelCheck from './assets/panel-imgIcon4.svg';
import panelChevron from './assets/panel-imgIcon5.svg';
import panelExternal from './assets/panel-imgIcon6.svg';
import './styles.css';

const icons = {
  brand: { src: brand, w: 25.6, h: 25.6 }, assistant: { src: assistant, w: 26, h: 26 },
  edit: { src: edit, w: 18, h: 18 }, external: { src: external, w: 16, h: 16 },
  send: { src: send, w: 20, h: 20 }, check: { src: check, w: 15, h: 15 },
  panelBrand: { src: panelBrand, w: 25, h: 25 }, panelClose: { src: panelClose, w: 17, h: 22 },
  panelEdit: { src: panelEdit, w: 18, h: 22 }, panelInfo: { src: panelInfo, w: 15, h: 22 },
  panelCheck: { src: panelCheck, w: 13, h: 13 }, panelChevron: { src: panelChevron, w: 12, h: 22 },
  panelExternal: { src: panelExternal, w: 16, h: 22 },
};
export function DesignIcon({ name }: { name: keyof typeof icons }) {
  const icon = icons[name];
  return <img className="design-icon" src={icon.src} width={icon.w} height={icon.h} alt="" aria-hidden="true" />;
}
export function Logo({ panel = false }: { panel?: boolean }) {
  return <span className={`logo${panel ? ' logo-panel' : ''}`} aria-label="fits"><DesignIcon name={panel ? 'panelBrand' : 'brand'} /><span>fits</span></span>;
}
export function AssistantMark() { return <span className="assistant-mark"><DesignIcon name="assistant" /></span>; }
export function LoadingDots() { return <span className="loading-dots" role="status" aria-label="fits is thinking"><i /><i /><i /></span>; }
export function EmptyState({ icon, title, children, action }: { icon: ReactNode; title: string; children: ReactNode; action?: ReactNode }) {
  return <section className="empty-state"><div className="empty-symbol">{icon}</div><h2>{title}</h2><div className="empty-description">{children}</div>{action && <div className="empty-action">{action}</div>}</section>;
}
export function criterionValue(c: Criterion): string {
  if (c.kind === 'boolean') return c.target.toLowerCase() === 'yes' ? 'Yes' : c.target.toLowerCase()==='no'?'No':c.target;
  if (c.kind === 'budget' && /^(any|no limit|unlimited)$/i.test(c.target.trim())) return 'No price limit';
  const prefix = c.comparison === 'at_most' ? '≤ ' : c.comparison === 'at_least' ? '≥ ' : '';
  return c.kind === 'budget' ? `${prefix}${c.unit || 'USD'} ${c.target}` : `${prefix}${c.target}${c.unit ? ` ${c.unit}` : ''}`;
}
export function PriorityBadge({criterion,onChange}:{criterion:Criterion;onChange?:(id:string,priority:Criterion['priority'])=>void}){
  const label=criterion.priority==='mandatory'?'Mandatory':'Optional';
  return onChange?<button type="button" className={`priority-badge ${criterion.priority}`} title="Click to change priority" aria-label={`Set ${criterion.label} as ${criterion.priority==='mandatory'?'optional':'mandatory'}`} onClick={()=>onChange(criterion.id,criterion.priority==='mandatory'?'optional':'mandatory')}>{label}</button>:<span className={`priority-badge ${criterion.priority}`}>{label}</span>;
}
export function CriteriaList({ criteria,onPriorityChange }: { criteria: Criterion[];onPriorityChange?:(id:string,priority:Criterion['priority'])=>void }) {
  return <ol className="criteria-list">{criteria.map((criterion, i) => <li key={criterion.id}><span className="criterion-number">{i + 1}</span><span className="criterion-main"><span>{criterion.label}</span><PriorityBadge criterion={criterion} onChange={onPriorityChange}/></span><strong>{criterionValue(criterion)}</strong></li>)}</ol>;
}
export function ResultSummary({ record }: { record: AnalysisRecord }) {
  const matched = record.findings.filter(f => f.status === 'match').length;
  const unknown = record.findings.filter(f => f.status === 'unknown').length;
  const allUnknown = unknown === record.findings.length;
  const fit=fitSummary(record),legacy=record.scoringMethod!=='priority-v2';
  const heading=legacy?'Saved comparison':allUnknown?'More information needed':fit.level==='not_fit'?'A must-have is not met':fit.level==='verify_mandatory'?'Verify your must-haves':fit.level==='all_met'?'All your criteria met':fit.level==='must_haves_met'?'Your must-haves are met':'Some preferences match';
  const tone=fit.level==='not_fit'?'score-failed':fit.rank===2?'score-good':'score-caution';
  return <section className={`score-block ${tone}`} aria-label="Match result">
    <div className="score-label"><span>Product fit</span><span title="Mandatory criteria count twice; optional criteria count once. Any failed mandatory criterion means the product is not a fit."><DesignIcon name="panelInfo" /></span></div>
    <div className="score-number" data-testid="match-score">{allUnknown ? '—' : record.score}{!allUnknown && <span>%</span>}</div>
    <div className="score-bars" aria-hidden="true">{record.findings.map(f => <i key={f.criterionId} className={f.status} />)}</div>
    <h2>{heading}</h2>{legacy?<p>Earlier scoring method · {matched} of {record.findings.length} matched</p>:<><p><strong>{fit.mandatoryMatched}/{fit.mandatoryTotal} mandatory</strong> · {fit.optionalMatched}/{fit.optionalTotal} optional</p>{fit.mandatoryFailed>0&&<p className="mandatory-alert">This product does not meet your requirements.</p>}{fit.mandatoryUnknown>0&&<p className="mandatory-alert">{fit.mandatoryUnknown} must-have {fit.mandatoryUnknown===1?'needs':'need'} verification.</p>}{unknown>0&&fit.mandatoryUnknown===0&&<p>{unknown} optional {unknown===1?'criterion is':'criteria are'} unverified.</p>}</>}
  </section>;
}
export function EvidenceList({ record }: { record: AnalysisRecord }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  return <div className="evidence-list">{record.findings.map(f => {
    const criterion = record.session.criteria.find(c => c.id === f.criterionId);
    const open = expanded === f.criterionId;
    return <section className={`evidence-row ${f.status}`} key={f.criterionId}>
      <button className="evidence-toggle" onClick={() => setExpanded(open ? null : f.criterionId)} aria-expanded={open}>
        <span className="finding-icon">{f.status === 'match' ? <DesignIcon name="panelCheck" /> : f.status === 'not_match' ? <X size={13} /> : <AlertCircle size={13} />}</span>
        <span className="finding-copy"><span className="finding-title"><strong>{criterion?.label || f.criterionId}</strong>{criterion&&record.scoringMethod==='priority-v2'&&<PriorityBadge criterion={criterion}/>}</span><span>{f.observed || 'Not found on this page'}</span></span>
        <span className="finding-status">{f.status === 'match' ? 'Match' : f.status === 'not_match' ? 'Not met' : 'Unknown'}</span><ChevronDown size={14} className={open ? 'rotate' : ''} />
      </button>
      {open && <div className="evidence-detail">{criterion&&<p>Your target: <strong>{criterionValue(criterion)}</strong></p>}<p>{f.reason}</p>{f.evidenceQuote ? <blockquote>{f.evidenceQuote}</blockquote> : <p className="muted">No supporting information was found on the page.</p>}<span className="evidence-source">Source: product page · {new Date(record.checkedAt).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}</span></div>}
    </section>;
  })}</div>;
}
export function ResultFootnote({record}:{record:AnalysisRecord}) { return <p className="result-footnote">{record.scoringMethod==='priority-v2'?<>Mandatory ×2 · Optional ×1.<br/>Unverified information doesn’t count as a match.</>:<>This saved check used an earlier scoring method.<br/>Recheck the product with your current criteria.</>}</p>; }
export function FitLine({record}:{record:AnalysisRecord}){const f=fitSummary(record);return <p className={`fit-line ${f.level}`}>{record.scoringMethod!=='priority-v2'?'Earlier criteria & scoring':f.mandatoryFailed?`${f.mandatoryFailed} mandatory ${f.mandatoryFailed===1?'criterion':'criteria'} not met`:f.mandatoryUnknown?`${f.mandatoryUnknown} mandatory ${f.mandatoryUnknown===1?'criterion':'criteria'} unverified`:`${f.mandatoryMatched}/${f.mandatoryTotal} mandatory · ${f.optionalMatched}/${f.optionalTotal} optional`}</p>;}
export function StatusMini({ record }: { record: AnalysisRecord }) {
  return <div className="status-mini" aria-label={record.findings.map(f => f.status.replace('_', ' ')).join(', ')}>{record.findings.map(f => <span key={f.criterionId} className={f.status} title={record.session.criteria.find(c => c.id === f.criterionId)?.label}>{f.status === 'match' ? <Check size={12} /> : f.status === 'not_match' ? <X size={12} /> : <AlertCircle size={12} />}</span>)}</div>;
}
