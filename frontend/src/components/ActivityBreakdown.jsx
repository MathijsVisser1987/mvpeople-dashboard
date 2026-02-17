import { useState } from 'react';
import { Activity, ChevronDown, ChevronUp } from 'lucide-react';
import Avatar from './Avatar';
import { formatNumber } from '../utils/formatters';

const CATEGORY_ORDER = ['SALES_CONTACT', 'RECRUITMENT_CANDIDATE', 'PIPELINE_JOBS', 'DEALS_REVENUE'];

const ACTIVITY_TYPE_NAMES = {
  'COMMENT:CANDIDATE': 'Candidate Note',
  'COMMENT:CONTACT': 'Contact Note',
  'COMMENT:COMPANY': 'Company Note',
  'COMMENT:POSITION': 'Job Note',
  'COMMENT:APPLICATION': 'Application Note',
  'COMMENT:PLACEMENT': 'Placement Note',
  'EMAIL_SENT:CANDIDATE': 'Email to Candidate',
  'EMAIL_SENT:CONTACT': 'Email to Contact',
  'EMAIL_SENT:APPLICATION': 'Email (Application)',
  'EMAIL_RECEIVED:CANDIDATE': 'Email from Candidate',
  'EMAIL_RECEIVED:CONTACT': 'Email from Contact',
  'EMAIL_RECEIVED:APPLICATION': 'Email (Application)',
  'MEETING:CANDIDATE': 'Candidate Meeting',
  'MEETING:CONTACT': 'Client Meeting',
  'MEETING:COMPANY': 'Company Meeting',
  'MEETING:APPLICATION': 'Interview',
  'MEETING:PLACEMENT': 'Placement Meeting',
  'TASK:CANDIDATE': 'Candidate Task',
  'TASK:CONTACT': 'Contact Task',
  'TASK:COMPANY': 'Company Task',
  'TASK:POSITION': 'Job Task',
  'TASK:APPLICATION': 'Application Task',
  'TASK:PLACEMENT': 'Placement Task',
  'PHONE_CALL:CANDIDATE': 'Candidate Call',
  'PHONE_CALL:CONTACT': 'Client Call',
  'PHONE_CALL:COMPANY': 'Company Call',
};

function CategoryChip({ category }) {
  if (!category || category.count === 0) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-mvp-dark border border-mvp-border">
      <span>{category.emoji}</span>
      <span className="font-display font-semibold">{category.count}</span>
    </span>
  );
}

function TypeRow({ typeKey, count }) {
  return (
    <div className="flex items-center justify-between px-2 py-1 text-xs">
      <span className="text-white/60 font-body">{ACTIVITY_TYPE_NAMES[typeKey] || typeKey}</span>
      <span className="font-display font-semibold text-white/80">{count}</span>
    </div>
  );
}

function MemberActivities({ member }) {
  const [expanded, setExpanded] = useState(false);
  const activities = member.activities || {};
  const hasActivities = Object.values(activities).some(cat => cat.count > 0);

  if (!hasActivities) return null;

  return (
    <div className="bg-mvp-dark/50 rounded-lg border border-mvp-border overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 hover:bg-mvp-dark/80 transition-colors"
      >
        <Avatar member={member} size="w-8 h-8" textSize="text-xs" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-display font-semibold">{member.name}</span>
            <span className="text-[10px] text-white/30 font-display">
              {member.totalActivities} activities
            </span>
          </div>
          <div className="flex gap-1 mt-0.5">
            {CATEGORY_ORDER.map(catKey => (
              <CategoryChip key={catKey} category={activities[catKey]} />
            ))}
          </div>
        </div>
        <span className="text-sm font-bold text-mvp-gold font-display">
          {formatNumber(member.activityPoints)} pts
        </span>
        {expanded ? (
          <ChevronUp size={14} className="text-white/30" />
        ) : (
          <ChevronDown size={14} className="text-white/30" />
        )}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3">
          {CATEGORY_ORDER.map(catKey => {
            const cat = activities[catKey];
            if (!cat || cat.count === 0) return null;
            const typeEntries = Object.entries(cat.types || {}).sort((a, b) => b[1] - a[1]);
            return (
              <div key={catKey}>
                <div className="flex items-center gap-2 mb-1 px-2">
                  <span>{cat.emoji}</span>
                  <span className="text-xs font-display font-semibold text-white/50 uppercase tracking-wider">
                    {cat.label}
                  </span>
                  <span className="text-[10px] text-mvp-accent font-display">{cat.points} pts</span>
                </div>
                <div className="bg-mvp-dark rounded border border-mvp-border">
                  {typeEntries.map(([typeKey, count]) => (
                    <TypeRow key={typeKey} typeKey={typeKey} count={count} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ActivityBreakdown({ members }) {
  if (!members || members.length === 0) return null;

  const hasAnyActivities = members.some(m => m.totalActivities > 0);
  if (!hasAnyActivities) return null;

  const sorted = [...members].sort((a, b) => (b.totalActivities || 0) - (a.totalActivities || 0));

  return (
    <div className="bg-mvp-card rounded-xl border border-mvp-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={18} className="text-mvp-accent" />
        <h2 className="text-lg font-bold font-display">Activity Breakdown</h2>
        <span className="text-xs text-white/30 font-body ml-1">This Month</span>
      </div>

      <div className="space-y-2">
        {sorted.map(member => (
          <MemberActivities key={member.id} member={member} />
        ))}
      </div>
    </div>
  );
}
