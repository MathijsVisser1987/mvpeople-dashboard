// Vincere Activity categories and points system
// Based on the Vincere Goal Library structure
//
// Real Vincere API fields: category, entity_type, activity_name, created_by_id
// activity_name encodes direction + status (e.g. PHONE_OUTBOUND_CONNECTED_WITH_CANDIDATE)
// EMAIL_RECEIVED has created_by_id -20/-21 (system) — won't match team members

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

// Map category:entity_type → dashboard category
export const ACTIVITY_CLASSIFICATION = {
  // Sales / Contact
  'COMMENT:CONTACT': 'SALES_CONTACT',
  'COMMENT:COMPANY': 'SALES_CONTACT',
  'EMAIL_SENT:CONTACT': 'SALES_CONTACT',
  'EMAIL_RECEIVED:CONTACT': 'SALES_CONTACT',
  'MEETING:CONTACT': 'SALES_CONTACT',
  'MEETING:COMPANY': 'SALES_CONTACT',
  'NEW_RECORD:CONTACT': 'SALES_CONTACT',
  'NEW_RECORD:COMPANY': 'SALES_CONTACT',
  'SMS:CONTACT': 'SALES_CONTACT',

  // Recruitment / Candidate
  'COMMENT:CANDIDATE': 'RECRUITMENT_CANDIDATE',
  'EMAIL_SENT:CANDIDATE': 'RECRUITMENT_CANDIDATE',
  'EMAIL_RECEIVED:CANDIDATE': 'RECRUITMENT_CANDIDATE',
  'MEETING:CANDIDATE': 'RECRUITMENT_CANDIDATE',
  'NEW_RECORD:CANDIDATE': 'RECRUITMENT_CANDIDATE',
  'SMS:CANDIDATE': 'RECRUITMENT_CANDIDATE',

  // Pipeline / Jobs
  'APPLICATION:CANDIDATE': 'PIPELINE_JOBS',
  'NEW_RECORD:JOB': 'PIPELINE_JOBS',

  // Deals / Revenue
  'PLACEMENT_UPDATE:CANDIDATE': 'DEALS_REVENUE',
};

// Activity name-based classification (checked FIRST, more specific than category:entity_type)
export const ACTIVITY_NAME_CLASSIFICATION = {
  // --- PHONE CALLS: CONTACT (Sales 🚀) ---
  // Goals 2-4: Inbound Contact
  'PHONE_INBOUND_CONNECTED_WITH_CONTACT': 'SALES_CONTACT',
  'PHONE_INBOUND_LEFT_MESSAGE_CONTACT': 'SALES_CONTACT',
  'PHONE_INBOUND_NOT_CONNECTED_WITH_CONTACT': 'SALES_CONTACT',
  // Goals 6-8: Outbound Contact
  'PHONE_OUTBOUND_CONNECTED_WITH_CONTACT': 'SALES_CONTACT',
  'PHONE_OUTBOUND_LEFT_MESSAGE_CONTACT': 'SALES_CONTACT',
  'PHONE_OUTBOUND_NOT_CONNECTED_WITH_CONTACT': 'SALES_CONTACT',

  // --- PHONE CALLS: CANDIDATE (Recruitment 💎) ---
  // Goals 10-12: Inbound Candidate
  'PHONE_INBOUND_CONNECTED_WITH_CANDIDATE': 'RECRUITMENT_CANDIDATE',
  'PHONE_INBOUND_LEFT_MESSAGE_CANDIDATE': 'RECRUITMENT_CANDIDATE',
  'PHONE_INBOUND_NOT_CONNECTED_WITH_CANDIDATE': 'RECRUITMENT_CANDIDATE',
  // Goals 14-16: Outbound Candidate
  'PHONE_OUTBOUND_CONNECTED_WITH_CANDIDATE': 'RECRUITMENT_CANDIDATE',
  'PHONE_OUTBOUND_LEFT_MESSAGE_CANDIDATE': 'RECRUITMENT_CANDIDATE',
  'PHONE_OUTBOUND_NOT_CONNECTED_WITH_CANDIDATE': 'RECRUITMENT_CANDIDATE',

  // --- EMAILS ---
  'EMAIL_SENT_TO_CONTACT': 'SALES_CONTACT',
  'EMAIL_RECEIVED_FROM_CONTACT': 'SALES_CONTACT',
  'EMAIL_SENT_TO_CANDIDATE': 'RECRUITMENT_CANDIDATE',
  'EMAIL_RECEIVED_FROM_CANDIDATE': 'RECRUITMENT_CANDIDATE',

  // --- MEETINGS ---
  'MEETING_ARRANGED_WITH_CONTACT': 'SALES_CONTACT',    // Goal 19: Client Meeting 🚀
  'MEETING_ATTENDED_WITH_CONTACT': 'SALES_CONTACT',     // Goal 20: LinkedIn Message 🚀
  'MEETING_ARRANGED_WITH_CANDIDATE': 'RECRUITMENT_CANDIDATE',  // Goal 21-23
  'MEETING_ATTENDED_WITH_CANDIDATE': 'RECRUITMENT_CANDIDATE',  // Goal 24-26

  // --- SYSTEM ACTIONS ---
  'NEW_COMPANY': 'SALES_CONTACT',        // Goal 27: New client added 🚀
  'NEW_CONTACT': 'SALES_CONTACT',        // Goal 28: New hiring manager added 🚀
  'NEW_JOB': 'PIPELINE_JOBS',            // Goal 29: Job 💼
  'NEW_CANDIDATE': 'RECRUITMENT_CANDIDATE', // Goal 30: New Candidate added 💎

  // --- CV / APPLICATION ---
  'APPLIED': 'RECRUITMENT_CANDIDATE',     // Goal 31: CV Applied 💎
  'FLOATED': 'PIPELINE_JOBS',            // Goal 32: CV Sent - SPEC 💼
  'SHORTLISTED': 'PIPELINE_JOBS',        // Goal 33: Shortlisted
  'MOVE_CANDIDATE_TO_SENT': 'PIPELINE_JOBS', // Goal 34: CV Sent - JOB 💼
  'MOVE_APPLICATION_STAGE': 'PIPELINE_JOBS',

  // --- INTERVIEWS ---
  'MOVE_CANDIDATE_TO_1ST_INTERVIEW': 'PIPELINE_JOBS', // Goal 35: 1st Interview 💼
  'MOVE_CANDIDATE_TO_2ND_INTERVIEW': 'PIPELINE_JOBS', // Goal 36
  'MOVE_CANDIDATE_TO_3RD_INTERVIEW': 'PIPELINE_JOBS', // Goal 37
  'MOVE_CANDIDATE_TO_4TH_INTERVIEW': 'PIPELINE_JOBS', // Goal 38
  'OFFER': 'PIPELINE_JOBS',              // Goal 39

  // --- PLACEMENTS ---
  'PLACEMENT_UPDATE_PLACEMENT': 'DEALS_REVENUE', // Goals 40-42
  'PLACEMENT_PERMANENT': 'DEALS_REVENUE',
  'PLACEMENT_CONTRACT': 'DEALS_REVENUE',

  // --- JOB LEADS ---
  'JOB_LEAD_NEW': 'PIPELINE_JOBS',       // Goal 48: Job Lead 💼
  'JOB_LEAD_CONVERTED': 'PIPELINE_JOBS', // Goal 49: Job Lead Converted 💼
  'NEW_JOB_LEAD': 'PIPELINE_JOBS',
  'JOB_LEAD': 'PIPELINE_JOBS',

  // --- SMS ---
  'SMS_SENT_TO_CONTACT': 'SALES_CONTACT',
  'SMS_SENT_TO_CANDIDATE': 'RECRUITMENT_CANDIDATE',
};

// Points per category:entity_type (base points, overridden by activity_name)
export const ACTIVITY_POINTS_MAP = {
  // Sales
  'MEETING:CONTACT': 75,
  'MEETING:COMPANY': 75,
  'NEW_RECORD:CONTACT': 15,
  'NEW_RECORD:COMPANY': 15,
  'COMMENT:CONTACT': 5,
  'COMMENT:COMPANY': 5,
  'EMAIL_SENT:CONTACT': 5,
  'EMAIL_RECEIVED:CONTACT': 3,
  'SMS:CONTACT': 3,

  // Recruitment
  'MEETING:CANDIDATE': 20,
  'NEW_RECORD:CANDIDATE': 10,
  'COMMENT:CANDIDATE': 5,
  'EMAIL_SENT:CANDIDATE': 5,
  'EMAIL_RECEIVED:CANDIDATE': 3,
  'SMS:CANDIDATE': 3,

  // Pipeline
  'APPLICATION:CANDIDATE': 15,
  'NEW_RECORD:JOB': 20,

  // Deals
  'PLACEMENT_UPDATE:CANDIDATE': 10,
};

// Points by activity_name (takes precedence over ACTIVITY_POINTS_MAP)
export const ACTIVITY_NAME_POINTS = {
  // Phone calls - Contact (Sales)
  'PHONE_OUTBOUND_CONNECTED_WITH_CONTACT': 10,     // Goal 6: Sales Call - Cold/Follow-up 🚀
  'PHONE_OUTBOUND_LEFT_MESSAGE_CONTACT': 15,        // Goal 7: Sales Call - Job Intake 🚀🚀🚀
  'PHONE_OUTBOUND_NOT_CONNECTED_WITH_CONTACT': 10,  // Goal 8: Sales Call - Reference Check 🚀🚀
  'PHONE_INBOUND_CONNECTED_WITH_CONTACT': 5,        // Goal 2: Contact - Inbound
  'PHONE_INBOUND_LEFT_MESSAGE_CONTACT': 3,          // Goal 3: Left Voicemail
  'PHONE_INBOUND_NOT_CONNECTED_WITH_CONTACT': 3,    // Goal 4: Whatsapp BD

  // Phone calls - Candidate (Recruitment)
  'PHONE_OUTBOUND_CONNECTED_WITH_CANDIDATE': 30,    // Goal 14: Headhunt Call / Meeting 💎💎💎
  'PHONE_OUTBOUND_LEFT_MESSAGE_CANDIDATE': 20,      // Goal 15: Call - Back Planned 💎💎
  'PHONE_OUTBOUND_NOT_CONNECTED_WITH_CANDIDATE': 40, // Goal 16: Headhunt Completed 💎💎💎💎
  'PHONE_INBOUND_CONNECTED_WITH_CANDIDATE': 10,     // Goal 10: Contractor Monitoring Call
  'PHONE_INBOUND_LEFT_MESSAGE_CANDIDATE': 5,        // Goal 11: Left Voicemail 💎
  'PHONE_INBOUND_NOT_CONNECTED_WITH_CANDIDATE': 5,  // Goal 12: Candidate Call 💎

  // Emails
  'EMAIL_SENT_TO_CONTACT': 5,      // Goal 17
  'EMAIL_SENT_TO_CANDIDATE': 5,    // Goal 18

  // Meetings - Contact
  'MEETING_ARRANGED_WITH_CONTACT': 75,   // Goal 19: Client Meeting 🚀
  'MEETING_ATTENDED_WITH_CONTACT': 10,   // Goal 20: LinkedIn Message 🚀

  // Meetings - Candidate
  'MEETING_ARRANGED_WITH_CANDIDATE': 20, // Goal 21-23
  'MEETING_ATTENDED_WITH_CANDIDATE': 10, // Goal 25: Introduction Meeting 💎 / Goal 26: LinkedIn InMail 💎

  // System actions
  'NEW_COMPANY': 15,     // Goal 27: New client added 🚀
  'NEW_CONTACT': 15,     // Goal 28: New hiring manager added 🚀
  'NEW_JOB': 20,         // Goal 29: Job 💼
  'NEW_CANDIDATE': 10,   // Goal 30: New Candidate added 💎

  // CV / Application
  'APPLIED': 10,                          // Goal 31: CV Applied 💎
  'FLOATED': 25,                          // Goal 32: CV Sent - SPEC 💼
  'SHORTLISTED': 15,                      // Goal 33
  'MOVE_CANDIDATE_TO_SENT': 25,           // Goal 34: CV Sent - JOB 💼
  'MOVE_APPLICATION_STAGE': 10,

  // Interviews
  'MOVE_CANDIDATE_TO_1ST_INTERVIEW': 50,  // Goal 35: 1st Interview 💼
  'MOVE_CANDIDATE_TO_2ND_INTERVIEW': 40,  // Goal 36
  'MOVE_CANDIDATE_TO_3RD_INTERVIEW': 30,  // Goal 37
  'MOVE_CANDIDATE_TO_4TH_INTERVIEW': 25,  // Goal 38
  'OFFER': 50,                            // Goal 39

  // Placements
  'PLACEMENT_UPDATE_PLACEMENT': 10,       // Goals 40-42
  'PLACEMENT_PERMANENT': 500,
  'PLACEMENT_CONTRACT': 500,

  // Job Leads
  'JOB_LEAD_NEW': 20,           // Goal 48: Job Lead 💼
  'JOB_LEAD': 20,
  'NEW_JOB_LEAD': 20,
  'JOB_LEAD_CONVERTED': 50,     // Goal 49: Job Lead Converted 💼

  // SMS
  'SMS_SENT_TO_CONTACT': 3,     // Goal 50
  'SMS_SENT_TO_CANDIDATE': 3,   // Goal 51
};

export const DEFAULT_ACTIVITY_POINTS = 3;

// Display names for category:entity_type
export const ACTIVITY_TYPE_NAMES = {
  'COMMENT:CANDIDATE': 'Candidate Note',
  'COMMENT:CONTACT': 'Contact Note',
  'COMMENT:COMPANY': 'Company Note',
  'APPLICATION:CANDIDATE': 'Application Update',
  'EMAIL_SENT:CANDIDATE': 'Email to Candidate',
  'EMAIL_SENT:CONTACT': 'Email to Contact',
  'EMAIL_RECEIVED:CANDIDATE': 'Email from Candidate',
  'EMAIL_RECEIVED:CONTACT': 'Email from Contact',
  'MEETING:CANDIDATE': 'Candidate Meeting',
  'MEETING:CONTACT': 'Client Meeting',
  'MEETING:COMPANY': 'Company Meeting',
  'NEW_RECORD:CANDIDATE': 'New Candidate',
  'NEW_RECORD:CONTACT': 'New Contact',
  'NEW_RECORD:COMPANY': 'New Company',
  'NEW_RECORD:JOB': 'New Job',
  'PLACEMENT_UPDATE:CANDIDATE': 'Placement Update',
  'SMS:CONTACT': 'SMS to Contact',
  'SMS:CANDIDATE': 'SMS to Candidate',
};

// Display names for specific activity_name values (Vincere Goal Library names)
export const ACTIVITY_NAME_LABELS = {
  // Phone - Contact
  'PHONE_INBOUND_CONNECTED_WITH_CONTACT': 'Contact - Inbound',
  'PHONE_INBOUND_LEFT_MESSAGE_CONTACT': 'Left Voicemail (Contact)',
  'PHONE_INBOUND_NOT_CONNECTED_WITH_CONTACT': 'Whatsapp BD',
  'PHONE_OUTBOUND_CONNECTED_WITH_CONTACT': 'Sales Call - Cold/Follow-up \uD83D\uDE80',
  'PHONE_OUTBOUND_LEFT_MESSAGE_CONTACT': 'Sales Call - Job Intake \uD83D\uDE80\uD83D\uDE80\uD83D\uDE80',
  'PHONE_OUTBOUND_NOT_CONNECTED_WITH_CONTACT': 'Sales Call - Ref Check \uD83D\uDE80\uD83D\uDE80',

  // Phone - Candidate
  'PHONE_INBOUND_CONNECTED_WITH_CANDIDATE': 'Contractor Monitoring Call',
  'PHONE_INBOUND_LEFT_MESSAGE_CANDIDATE': 'Left Voicemail \uD83D\uDC8E',
  'PHONE_INBOUND_NOT_CONNECTED_WITH_CANDIDATE': 'Candidate Call \uD83D\uDC8E',
  'PHONE_OUTBOUND_CONNECTED_WITH_CANDIDATE': 'Headhunt Call / Meeting \uD83D\uDC8E\uD83D\uDC8E\uD83D\uDC8E',
  'PHONE_OUTBOUND_LEFT_MESSAGE_CANDIDATE': 'Call - Back Planned \uD83D\uDC8E\uD83D\uDC8E',
  'PHONE_OUTBOUND_NOT_CONNECTED_WITH_CANDIDATE': 'Headhunt Completed \uD83D\uDC8E\uD83D\uDC8E\uD83D\uDC8E\uD83D\uDC8E',

  // Emails
  'EMAIL_SENT_TO_CONTACT': 'Email Sent (Contact)',
  'EMAIL_SENT_TO_CANDIDATE': 'Email Sent (Candidate)',
  'EMAIL_RECEIVED_FROM_CONTACT': 'Email Received (Contact)',
  'EMAIL_RECEIVED_FROM_CANDIDATE': 'Email Received (Candidate)',

  // Meetings
  'MEETING_ARRANGED_WITH_CONTACT': 'Client Meeting \uD83D\uDE80',
  'MEETING_ATTENDED_WITH_CONTACT': 'LinkedIn Message \uD83D\uDE80',
  'MEETING_ARRANGED_WITH_CANDIDATE': 'Meeting Arranged (Candidate)',
  'MEETING_ATTENDED_WITH_CANDIDATE': 'Introduction Meeting \uD83D\uDC8E',

  // System
  'NEW_COMPANY': 'New Client Added \uD83D\uDE80',
  'NEW_CONTACT': 'New Hiring Manager \uD83D\uDE80',
  'NEW_JOB': 'Job \uD83D\uDCBC',
  'NEW_CANDIDATE': 'New Candidate Added \uD83D\uDC8E',

  // CV / Application
  'APPLIED': 'CV Applied \uD83D\uDC8E',
  'FLOATED': 'CV Sent - SPEC \uD83D\uDCBC',
  'SHORTLISTED': 'Shortlisted',
  'MOVE_CANDIDATE_TO_SENT': 'CV Sent - JOB \uD83D\uDCBC',
  'MOVE_APPLICATION_STAGE': 'Stage Move',

  // Interviews
  'MOVE_CANDIDATE_TO_1ST_INTERVIEW': '1st Interview \uD83D\uDCBC',
  'MOVE_CANDIDATE_TO_2ND_INTERVIEW': '2nd Interview',
  'MOVE_CANDIDATE_TO_3RD_INTERVIEW': '3rd Interview',
  'MOVE_CANDIDATE_TO_4TH_INTERVIEW': '4th+ Interview',
  'OFFER': 'Offer',

  // Placements
  'PLACEMENT_UPDATE_PLACEMENT': 'Placement Update',
  'PLACEMENT_PERMANENT': 'Placement (Permanent)',
  'PLACEMENT_CONTRACT': 'Placement (Contract)',

  // Job Leads
  'JOB_LEAD_NEW': 'Job Lead \uD83D\uDCBC',
  'JOB_LEAD': 'Job Lead \uD83D\uDCBC',
  'NEW_JOB_LEAD': 'Job Lead \uD83D\uDCBC',
  'JOB_LEAD_CONVERTED': 'Job Lead Converted \uD83D\uDCBC',

  // SMS
  'SMS_SENT_TO_CONTACT': 'SMS (Contact)',
  'SMS_SENT_TO_CANDIDATE': 'SMS (Candidate)',
};
