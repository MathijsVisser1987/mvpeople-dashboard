// Vincere Activity categories and points system
// Activities from the Vincere API have: category, activity_name, entity_type, created_by_id
// We classify activities based on category + activity_name + entity_type

export const ACTIVITY_CATEGORIES = {
  SALES_CONTACT: {
    id: 'sales_contact',
    label: 'Sales / Contact',
    emoji: '\uD83D\uDE80',
  },
  RECRUITMENT_CANDIDATE: {
    id: 'recruitment_candidate',
    label: 'Recruitment / Candidate',
    emoji: '\uD83D\uDC8E',
  },
  PIPELINE_JOBS: {
    id: 'pipeline_jobs',
    label: 'Pipeline / Jobs',
    emoji: '\uD83D\uDCBC',
  },
  DEALS_REVENUE: {
    id: 'deals_revenue',
    label: 'Deals & Revenue',
    emoji: '\uD83D\uDCB6',
  },
};

// Map activity_name / category to our classification
// Activities from Vincere have: category (EMAIL_SENT, EMAIL_RECEIVED, COMMENT, MEETING, TASK, etc.)
// and activity_name (more specific like EMAIL_SENT_TO_CANDIDATE, etc.)
// and entity_type (CANDIDATE, CONTACT, COMPANY, POSITION, APPLICATION, etc.)

export const ACTIVITY_CLASSIFICATION = {
  // Sales / Contact activities
  'COMMENT:CONTACT': 'SALES_CONTACT',
  'COMMENT:COMPANY': 'SALES_CONTACT',
  'MEETING:CONTACT': 'SALES_CONTACT',
  'MEETING:COMPANY': 'SALES_CONTACT',
  'TASK:CONTACT': 'SALES_CONTACT',
  'TASK:COMPANY': 'SALES_CONTACT',
  'EMAIL_SENT:CONTACT': 'SALES_CONTACT',
  'EMAIL_RECEIVED:CONTACT': 'SALES_CONTACT',
  'PHONE_CALL:CONTACT': 'SALES_CONTACT',
  'PHONE_CALL:COMPANY': 'SALES_CONTACT',

  // Recruitment / Candidate activities
  'COMMENT:CANDIDATE': 'RECRUITMENT_CANDIDATE',
  'MEETING:CANDIDATE': 'RECRUITMENT_CANDIDATE',
  'TASK:CANDIDATE': 'RECRUITMENT_CANDIDATE',
  'EMAIL_SENT:CANDIDATE': 'RECRUITMENT_CANDIDATE',
  'EMAIL_RECEIVED:CANDIDATE': 'RECRUITMENT_CANDIDATE',
  'PHONE_CALL:CANDIDATE': 'RECRUITMENT_CANDIDATE',

  // Pipeline / Jobs activities
  'COMMENT:POSITION': 'PIPELINE_JOBS',
  'COMMENT:APPLICATION': 'PIPELINE_JOBS',
  'MEETING:APPLICATION': 'PIPELINE_JOBS',
  'TASK:POSITION': 'PIPELINE_JOBS',
  'TASK:APPLICATION': 'PIPELINE_JOBS',
  'EMAIL_SENT:APPLICATION': 'PIPELINE_JOBS',
  'EMAIL_RECEIVED:APPLICATION': 'PIPELINE_JOBS',

  // Deal / Revenue activities
  'COMMENT:PLACEMENT': 'DEALS_REVENUE',
  'TASK:PLACEMENT': 'DEALS_REVENUE',
  'MEETING:PLACEMENT': 'DEALS_REVENUE',
};

// Activity name-based classification (more specific)
export const ACTIVITY_NAME_CLASSIFICATION = {
  'EMAIL_SENT_TO_CANDIDATE': 'RECRUITMENT_CANDIDATE',
  'EMAIL_RECEIVED_FROM_CANDIDATE': 'RECRUITMENT_CANDIDATE',
  'EMAIL_SENT_TO_CONTACT': 'SALES_CONTACT',
  'EMAIL_RECEIVED_FROM_CONTACT': 'SALES_CONTACT',
};

// Points per activity type (by category:entity_type or activity_name)
export const ACTIVITY_POINTS_MAP = {
  // Sales / Contact
  'MEETING:CONTACT': 75,    // Client Meeting
  'MEETING:COMPANY': 75,    // Client Meeting
  'PHONE_CALL:CONTACT': 10, // Sales Call
  'PHONE_CALL:COMPANY': 10, // Sales Call
  'COMMENT:CONTACT': 5,
  'COMMENT:COMPANY': 5,
  'TASK:CONTACT': 10,
  'TASK:COMPANY': 10,
  'EMAIL_SENT:CONTACT': 5,

  // Recruitment / Candidate
  'MEETING:CANDIDATE': 20,   // Introduction Meeting
  'PHONE_CALL:CANDIDATE': 10, // Candidate Call
  'COMMENT:CANDIDATE': 5,
  'TASK:CANDIDATE': 10,
  'EMAIL_SENT:CANDIDATE': 5,

  // Pipeline / Jobs
  'COMMENT:APPLICATION': 25,  // CV Sent / Interview / Pipeline action
  'MEETING:APPLICATION': 50,  // Interview arranged
  'TASK:APPLICATION': 15,
  'COMMENT:POSITION': 10,
  'TASK:POSITION': 10,

  // Deals
  'COMMENT:PLACEMENT': 10,
  'TASK:PLACEMENT': 10,
  'MEETING:PLACEMENT': 20,
};

export const DEFAULT_ACTIVITY_POINTS = 3;

// Display names for activity type keys
export const ACTIVITY_TYPE_NAMES = {
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
