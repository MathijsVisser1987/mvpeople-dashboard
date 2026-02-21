import { getAmsterdamNow } from './timezone.js';

// KPI Target profiles for MVPeople team members
// Each KPI maps to one or more Vincere activity_name values
// "Deals" KPI uses placement count, not activity_name

// KPI definitions: each KPI has a key, label, and the activity_name(s) it counts
export const KPI_DEFINITIONS = {
  candidateCalls: {
    key: 'candidateCalls',
    label: 'Candidate Calls',
    emoji: '📞',
    // All candidate phone calls (inbound + outbound)
    activityNames: [
      'PHONE_OUTBOUND_CONNECTED_WITH_CANDIDATE',
      'PHONE_OUTBOUND_NOT_CONNECTED_WITH_CANDIDATE',
      'PHONE_OUTBOUND_LEFT_MESSAGE_CANDIDATE',
      'PHONE_INBOUND_CONNECTED_WITH_CANDIDATE',
      'PHONE_INBOUND_NOT_CONNECTED_WITH_CANDIDATE',
      'PHONE_INBOUND_LEFT_MESSAGE_CANDIDATE',
    ],
  },
  headhuntCallMeeting: {
    key: 'headhuntCallMeeting',
    label: 'Headhunt Call / Meeting',
    emoji: '💎',
    // Goal 14: Outbound connected with candidate
    activityNames: ['PHONE_OUTBOUND_CONNECTED_WITH_CANDIDATE'],
  },
  callBackPlanned: {
    key: 'callBackPlanned',
    label: 'Call - Back Planned',
    emoji: '📅',
    // Goal 15: Outbound left message candidate
    activityNames: ['PHONE_OUTBOUND_LEFT_MESSAGE_CANDIDATE'],
  },
  headhuntCompleted: {
    key: 'headhuntCompleted',
    label: 'Headhunt Completed',
    emoji: '🎯',
    // Goal 16: Outbound not connected with candidate
    activityNames: ['PHONE_OUTBOUND_NOT_CONNECTED_WITH_CANDIDATE'],
  },
  linkedInMessage: {
    key: 'linkedInMessage',
    label: 'LinkedIn Message / InMail',
    emoji: '💬',
    // Goal 26: Meeting attended with candidate (existing)
    activityNames: ['MEETING_ATTENDED_WITH_CANDIDATE'],
  },
  jobs: {
    key: 'jobs',
    label: 'Jobs',
    emoji: '📋',
    // Goal 29: New Job created
    activityNames: ['NEW_JOB'],
  },
  jobLead: {
    key: 'jobLead',
    label: 'Job Lead',
    emoji: '💼',
    activityNames: ['JOB_LEAD_NEW', 'JOB_LEAD', 'NEW_JOB_LEAD'],
  },
  newCandidate: {
    key: 'newCandidate',
    label: 'New Candidate Added',
    emoji: '👤',
    activityNames: ['NEW_CANDIDATE'],
  },
  salesCalls: {
    key: 'salesCalls',
    label: 'Sales Calls',
    emoji: '🚀',
    // All outbound contact phone calls
    activityNames: [
      'PHONE_OUTBOUND_CONNECTED_WITH_CONTACT',
      'PHONE_OUTBOUND_NOT_CONNECTED_WITH_CONTACT',
      'PHONE_OUTBOUND_LEFT_MESSAGE_CONTACT',
    ],
  },
  cvSentJob: {
    key: 'cvSentJob',
    label: 'CV Sent - JOB',
    emoji: '📄',
    activityNames: ['MOVE_CANDIDATE_TO_SENT'],
  },
  firstInterview: {
    key: 'firstInterview',
    label: '1st Interview',
    emoji: '🤝',
    activityNames: ['MOVE_CANDIDATE_TO_1ST_INTERVIEW'],
  },
  clientMeeting: {
    key: 'clientMeeting',
    label: 'Client Meeting',
    emoji: '🏢',
    activityNames: ['MEETING_ARRANGED_WITH_CONTACT'],
  },
  deals: {
    key: 'deals',
    label: 'Deals',
    emoji: '💶',
    // Special: uses deal count from placement scan, not activity_name
    activityNames: [],
    source: 'deals',
  },
};

// Target profiles with monthly targets per KPI
export const TARGET_PROFILES = {
  starter: {
    id: 'starter',
    label: 'Starter',
    // Which KPIs are tracked and their monthly targets
    targets: {
      candidateCalls: 700,
      headhuntCallMeeting: 150,
      callBackPlanned: 150,
      headhuntCompleted: 100,
      linkedInMessage: 100,
      jobs: 5,
      jobLead: 3,
      newCandidate: 200,
    },
  },
  recruiter360: {
    id: 'recruiter360',
    label: '360 Recruiter',
    targets: {
      salesCalls: 200,
      candidateCalls: 500,
      headhuntCallMeeting: 100,
      cvSentJob: 50,
      firstInterview: 20,
      clientMeeting: 10,
      deals: 3,
      jobs: 10,
      jobLead: 5,
      newCandidate: 150,
    },
  },
};

// Calculate actual KPI values from activity data and deal count
export function calculateKPIActuals(activityByName, dealCount) {
  const actuals = {};

  for (const [kpiKey, kpiDef] of Object.entries(KPI_DEFINITIONS)) {
    if (kpiDef.source === 'deals') {
      actuals[kpiKey] = dealCount || 0;
    } else {
      let count = 0;
      for (const name of kpiDef.activityNames) {
        count += activityByName[name] || 0;
      }
      actuals[kpiKey] = count;
    }
  }

  return actuals;
}

// Calculate T/A/V for a member given their profile and actuals
// targetOverrides: optional object { profile?: string, overrides?: { kpiKey: number } }
export function calculateKPIStatus(profileId, actuals, targetOverrides) {
  // Allow profile override from settings
  const effectiveProfileId = targetOverrides?.profile || profileId;
  const profile = TARGET_PROFILES[effectiveProfileId];
  if (!profile) return [];

  // Merge profile defaults with any individual overrides
  const mergedTargets = { ...profile.targets, ...(targetOverrides?.overrides || {}) };

  // Pro-rate targets based on day of month (Amsterdam timezone)
  const ams = getAmsterdamNow();
  const dayOfMonth = ams.day;
  const daysInMonth = new Date(ams.year, ams.month + 1, 0).getDate();
  const monthProgress = dayOfMonth / daysInMonth;

  const kpis = [];
  for (const [kpiKey, target] of Object.entries(mergedTargets)) {
    const def = KPI_DEFINITIONS[kpiKey];
    if (!def) continue;

    const actual = actuals[kpiKey] || 0;
    const proRatedTarget = Math.round(target * monthProgress);
    const variance = actual - proRatedTarget;
    const pct = proRatedTarget > 0 ? Math.round((actual / proRatedTarget) * 100) : (actual > 0 ? 999 : 0);

    kpis.push({
      key: kpiKey,
      label: def.label,
      emoji: def.emoji,
      target,           // Full month target
      proRated: proRatedTarget, // Pro-rated target for today
      actual,
      variance,
      pct,              // Percentage of pro-rated target achieved
      onTrack: actual >= proRatedTarget,
    });
  }

  return kpis;
}
