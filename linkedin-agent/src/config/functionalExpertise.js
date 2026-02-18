/**
 * Functional Expertise & Sub Functional Expertise
 *
 * These are the fixed values configured in Vincere.
 * The AI uses this list to classify candidates on profile analysis.
 * The selected values are set directly on the candidate record.
 *
 * To update: edit this file when Vincere configuration changes.
 */

export const FUNCTIONAL_EXPERTISE = {
  'Accounting & Finance': [
    'Accountancy',
    'Audit',
    'Bookkeeping',
    'Business Analysis',
    'Compliance',
    'Controlling',
    'Corporate Finance',
    'Credit Management',
    'Financial Analysis',
    'Financial Planning',
    'Fund Management',
    'Management Accounting',
    'Payroll',
    'Risk Management',
    'Tax',
    'Treasury',
  ],
  'Administration & Office Support': [
    'Administration',
    'Customer Service',
    'Data Entry',
    'Executive Assistant',
    'Facilities Management',
    'Office Management',
    'Personal Assistant',
    'Reception',
    'Secretarial',
  ],
  'Banking & Financial Services': [
    'Asset Management',
    'Banking Operations',
    'Commercial Banking',
    'Corporate Banking',
    'Financial Advisory',
    'Insurance',
    'Investment Banking',
    'Mortgage',
    'Private Banking',
    'Retail Banking',
    'Wealth Management',
  ],
  'Construction & Engineering': [
    'Architecture',
    'Building Services',
    'Civil Engineering',
    'Construction Management',
    'Electrical Engineering',
    'Environmental Engineering',
    'Mechanical Engineering',
    'Project Management',
    'Quantity Surveying',
    'Structural Engineering',
  ],
  'Consulting & Strategy': [
    'Business Consulting',
    'Change Management',
    'IT Consulting',
    'Management Consulting',
    'Strategy Consulting',
    'Transformation',
  ],
  'Customer Service': [
    'Call Centre',
    'Client Relations',
    'Customer Experience',
    'Customer Support',
    'Help Desk',
    'Service Delivery',
    'Technical Support',
  ],
  'Education & Training': [
    'Corporate Training',
    'Curriculum Development',
    'E-Learning',
    'Education Management',
    'Learning & Development',
    'Teaching',
    'Training Delivery',
  ],
  'Executive Management': [
    'Board Level',
    'C-Suite',
    'General Management',
    'Managing Director',
    'Operations Director',
  ],
  'Healthcare & Medical': [
    'Allied Health',
    'Clinical Research',
    'General Practice',
    'Health Management',
    'Medical Devices',
    'Nursing',
    'Pharmaceutical',
    'Public Health',
    'Specialist Medicine',
  ],
  'Hospitality & Tourism': [
    'Events Management',
    'Food & Beverage',
    'Hotel Management',
    'Restaurant Management',
    'Tourism',
    'Travel',
  ],
  'Human Resources': [
    'Compensation & Benefits',
    'Employee Relations',
    'HR Administration',
    'HR Business Partner',
    'HR Management',
    'Industrial Relations',
    'Learning & Development',
    'Organisational Development',
    'Recruitment',
    'Talent Acquisition',
    'Talent Management',
    'Workforce Planning',
  ],
  'Information Technology': [
    'AI & Machine Learning',
    'Application Development',
    'Business Intelligence',
    'Cloud & DevOps',
    'Cyber Security',
    'Data Engineering',
    'Data Science',
    'Database Administration',
    'ERP & CRM',
    'Infrastructure',
    'IT Management',
    'IT Support',
    'Network Engineering',
    'Product Management',
    'Project Management',
    'QA & Testing',
    'Software Development',
    'Solutions Architecture',
    'Systems Administration',
    'UX/UI Design',
    'Web Development',
  ],
  'Legal': [
    'Commercial Law',
    'Compliance',
    'Contract Management',
    'Corporate Law',
    'Employment Law',
    'In-House Counsel',
    'Intellectual Property',
    'Litigation',
    'Paralegal',
    'Privacy & Data Protection',
    'Regulatory',
  ],
  'Logistics & Supply Chain': [
    'Distribution',
    'Fleet Management',
    'Import/Export',
    'Inventory Management',
    'Logistics Management',
    'Procurement',
    'Purchasing',
    'Supply Chain Management',
    'Transport',
    'Warehouse Management',
  ],
  'Manufacturing & Production': [
    'Continuous Improvement',
    'Lean Manufacturing',
    'Maintenance',
    'Manufacturing Engineering',
    'Operations Management',
    'Process Engineering',
    'Production Management',
    'Quality Assurance',
    'Quality Management',
    'R&D',
  ],
  'Marketing & Communications': [
    'Brand Management',
    'Communications',
    'Content Marketing',
    'Corporate Communications',
    'CRM Marketing',
    'Digital Marketing',
    'Event Marketing',
    'Market Research',
    'Marketing Analytics',
    'Marketing Management',
    'Performance Marketing',
    'Product Marketing',
    'Public Relations',
    'SEO/SEM',
    'Social Media',
  ],
  'Media & Creative': [
    'Advertising',
    'Animation',
    'Copywriting',
    'Creative Direction',
    'Film & Video',
    'Graphic Design',
    'Journalism',
    'Media Planning',
    'Photography',
    'Publishing',
  ],
  'Real Estate & Property': [
    'Commercial Property',
    'Facilities Management',
    'Property Development',
    'Property Management',
    'Residential Property',
    'Valuation',
  ],
  'Retail & Consumer': [
    'Buying',
    'Category Management',
    'E-Commerce',
    'Merchandising',
    'Retail Management',
    'Store Management',
    'Visual Merchandising',
  ],
  'Sales & Business Development': [
    'Account Management',
    'Business Development',
    'Channel Sales',
    'Enterprise Sales',
    'Inside Sales',
    'Key Account Management',
    'New Business',
    'Pre-Sales',
    'Sales Management',
    'Technical Sales',
    'Telesales',
  ],
  'Science & Research': [
    'Biotechnology',
    'Chemistry',
    'Clinical Research',
    'Environmental Science',
    'Food Science',
    'Laboratory',
    'Life Sciences',
    'Physics',
    'Research & Development',
  ],
  'Trades & Services': [
    'Automotive',
    'Building & Construction',
    'Electrical',
    'HVAC',
    'Landscaping',
    'Maintenance',
    'Plumbing',
  ],
  'Transport & Automotive': [
    'Automotive Engineering',
    'Aviation',
    'Fleet Management',
    'Logistics',
    'Maritime',
    'Rail',
    'Transport Management',
  ],
};

/**
 * Get flat list of all functional expertise names
 */
export function getFunctionalExpertiseList() {
  return Object.keys(FUNCTIONAL_EXPERTISE);
}

/**
 * Get sub functional expertise for a given functional expertise
 */
export function getSubExpertise(functionalExpertise) {
  return FUNCTIONAL_EXPERTISE[functionalExpertise] || [];
}

/**
 * Build the prompt text for the AI with all expertise options
 */
export function buildExpertisePrompt() {
  let prompt = 'FUNCTIONAL EXPERTISE (kies één of meerdere):\n';
  prompt += getFunctionalExpertiseList().join(' | ');
  prompt += '\n\nSUB FUNCTIONAL EXPERTISE per categorie:\n';

  for (const [func, subs] of Object.entries(FUNCTIONAL_EXPERTISE)) {
    prompt += `${func}: ${subs.join(' | ')}\n`;
  }

  return prompt;
}
