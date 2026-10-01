export type Scholarship = {
  id: string;
  name: string;
  provider: string;
  portal_url: string;
  category: string;
  benefits: {
    tuition_support: string;
    maintenance_allowance: string;
    other_benefits?: string;
    duration?: string;
  };
  deadlines: { application_open: string; application_close: string };
  documents_required: string[];
  priority_for_jk: boolean;
  eligibility?: Record<string, unknown>;
  match_score?: number;
  match_reasons?: string[];
  missing_info?: string[];
};

export const FALLBACK_SCHOLARSHIPS: Scholarship[] = [
  {
    "id": "pmsss",
    "name": "PM Special Scholarship Scheme (PMSSS)",
    "provider": "AICTE / MoE",
    "portal_url": "https://www.aicte-india.org/bureaus/jk",
    "category": "scholarship",
    "benefits": {
      "tuition_support": "Up to ₹1.25L (Eng) / ₹3L (Medical) / ₹30k (General)",
      "maintenance_allowance": "₹1,00,000/year DBT",
      "other_benefits": "Hostel and Book allowance included in maintenance",
      "duration": "Full course duration"
    },
    "deadlines": {
      "application_open": "May",
      "application_close": "July"
    },
    "documents_required": [
      "Domicile Certificate",
      "Class 12th Marksheet",
      "Income Certificate",
      "Aadhaar Card",
      "Bank Passbook",
      "Caste Certificate (if applicable)"
    ],
    "priority_for_jk": true,
    "eligibility": {
      "domicile": "J&K",
      "class_12_min_percent": 0,
      "family_income_max": 800000,
      "streams": [
        "All"
      ],
      "categories": [
        "All"
      ],
      "gender": "all",
      "disability": false,
      "min_age": 0,
      "max_age": 0
    }
  },
  {
    "id": "post_matric_nsp",
    "name": "Post-Matric Scholarship for Minorities (NSP)",
    "provider": "Ministry of Minority Affairs",
    "portal_url": "https://scholarships.gov.in/",
    "category": "scholarship",
    "benefits": {
      "tuition_support": "Actual fee or up to ₹10,000/year",
      "maintenance_allowance": "₹1200/month (Hosteller), ₹550/month (Day Scholar)",
      "other_benefits": "None",
      "duration": "Duration of the course"
    },
    "deadlines": {
      "application_open": "August",
      "application_close": "October"
    },
    "documents_required": [
      "Previous Year Marksheet",
      "Income Certificate",
      "Minority Certificate / Self Declaration",
      "Aadhaar Card",
      "Bank Passbook",
      "Fee Receipt"
    ],
    "priority_for_jk": false,
    "eligibility": {
      "domicile": "India",
      "class_12_min_percent": 50,
      "family_income_max": 250000,
      "streams": [
        "All"
      ],
      "categories": [
        "Minority"
      ],
      "gender": "all",
      "disability": false,
      "min_age": 0,
      "max_age": 0
    }
  },
  {
    "id": "samarthan_jk",
    "name": "SAMARTHAN Scheme for Orphans/PwD",
    "provider": "J&K Higher Education Dept",
    "portal_url": "https://jkeducation.gov.in/",
    "category": "scholarship",
    "benefits": {
      "tuition_support": "Full fee waiver",
      "maintenance_allowance": "Monthly stipend",
      "other_benefits": "Free boarding/lodging in state hostels",
      "duration": "Full course duration"
    },
    "deadlines": {
      "application_open": "July",
      "application_close": "September"
    },
    "documents_required": [
      "Domicile Certificate",
      "Disability Certificate / Orphan Certificate",
      "Previous Year Marksheet",
      "Aadhaar Card",
      "Bank Passbook"
    ],
    "priority_for_jk": true,
    "eligibility": {
      "domicile": "J&K",
      "class_12_min_percent": 0,
      "family_income_max": 0,
      "streams": [
        "All"
      ],
      "categories": [
        "All"
      ],
      "gender": "all",
      "disability": true,
      "min_age": 0,
      "max_age": 0
    }
  },
  {
    "id": "jk_mcm",
    "name": "J&K Merit-cum-Means Scholarship",
    "provider": "Department of Social Welfare, J&K",
    "portal_url": "https://jk.gov.in/jammukashmir/",
    "category": "scholarship",
    "benefits": {
      "tuition_support": "Up to ₹30,000/year",
      "maintenance_allowance": "₹10,000/year",
      "other_benefits": "None",
      "duration": "Annual renewal"
    },
    "deadlines": {
      "application_open": "September",
      "application_close": "November"
    },
    "documents_required": [
      "Domicile Certificate",
      "Income Certificate",
      "Previous Year Marksheet",
      "Aadhaar Card",
      "Bank Passbook"
    ],
    "priority_for_jk": true,
    "eligibility": {
      "domicile": "J&K",
      "class_12_min_percent": 60,
      "family_income_max": 250000,
      "streams": [
        "All"
      ],
      "categories": [
        "All"
      ],
      "gender": "all",
      "disability": false,
      "min_age": 0,
      "max_age": 0
    }
  },
  {
    "id": "pms_tribal",
    "name": "Post Matric Scholarship for ST Students",
    "provider": "Ministry of Tribal Affairs",
    "portal_url": "https://tribal.nic.in/Scholarships.aspx",
    "category": "scholarship",
    "benefits": {
      "tuition_support": "Full tuition fee reimbursement",
      "maintenance_allowance": "₹1200/month (Hosteller)",
      "other_benefits": "Study tour charges, thesis typing charges",
      "duration": "Full course duration"
    },
    "deadlines": {
      "application_open": "August",
      "application_close": "October"
    },
    "documents_required": [
      "ST Certificate",
      "Income Certificate",
      "Previous Year Marksheet",
      "Aadhaar Card",
      "Bank Passbook",
      "Fee Receipt"
    ],
    "priority_for_jk": true,
    "eligibility": {
      "domicile": "India",
      "class_12_min_percent": 0,
      "family_income_max": 250000,
      "streams": [
        "All"
      ],
      "categories": [
        "ST"
      ],
      "gender": "all",
      "disability": false,
      "min_age": 0,
      "max_age": 0
    }
  },
  {
    "id": "inspire",
    "name": "INSPIRE Scholarship for Higher Education (SHE)",
    "provider": "Department of Science & Technology (DST)",
    "portal_url": "https://online-inspire.gov.in/",
    "category": "scholarship",
    "benefits": {
      "tuition_support": "₹60,000/year in cash",
      "maintenance_allowance": "None",
      "other_benefits": "Summertime attachment fee of ₹20,000/year",
      "duration": "Maximum 5 years (B.Sc/M.Sc)"
    },
    "deadlines": {
      "application_open": "September",
      "application_close": "December"
    },
    "documents_required": [
      "Class 12th Marksheet",
      "Endorsement Certificate from Principal/Director",
      "Aadhaar Card",
      "Bank Passbook"
    ],
    "priority_for_jk": false,
    "eligibility": {
      "domicile": "India",
      "class_12_min_percent": 90,
      "family_income_max": 0,
      "streams": [
        "PCM",
        "PCB"
      ],
      "categories": [
        "All"
      ],
      "gender": "all",
      "disability": false,
      "min_age": 17,
      "max_age": 22
    }
  },
  {
    "id": "csss",
    "name": "Central Sector Scheme of Scholarships (CSSS)",
    "provider": "MoE / MHRD",
    "portal_url": "https://scholarships.gov.in/",
    "category": "scholarship",
    "benefits": {
      "tuition_support": "None",
      "maintenance_allowance": "₹12,000/year (Graduation), ₹20,000/year (PG)",
      "other_benefits": "None",
      "duration": "Up to 5 years"
    },
    "deadlines": {
      "application_open": "August",
      "application_close": "October"
    },
    "documents_required": [
      "Class 12th Marksheet",
      "Income Certificate",
      "Aadhaar Card",
      "Bank Passbook",
      "College ID"
    ],
    "priority_for_jk": false,
    "eligibility": {
      "domicile": "India",
      "class_12_min_percent": 80,
      "family_income_max": 450000,
      "streams": [
        "All"
      ],
      "categories": [
        "All"
      ],
      "gender": "all",
      "disability": false,
      "min_age": 18,
      "max_age": 25
    }
  },
  {
    "id": "minority_mcm",
    "name": "Merit-cum-Means Scholarship for Professional and Technical Courses CS",
    "provider": "Ministry of Minority Affairs",
    "portal_url": "https://scholarships.gov.in/",
    "category": "scholarship",
    "benefits": {
      "tuition_support": "Up to ₹20,000/year",
      "maintenance_allowance": "₹1,000/month (Hosteller), ₹500/month (Day Scholar)",
      "other_benefits": "None",
      "duration": "Course duration"
    },
    "deadlines": {
      "application_open": "August",
      "application_close": "October"
    },
    "documents_required": [
      "Previous Year Marksheet",
      "Income Certificate",
      "Minority Certificate",
      "Aadhaar Card",
      "Bank Passbook",
      "Fee Receipt"
    ],
    "priority_for_jk": false,
    "eligibility": {
      "domicile": "India",
      "class_12_min_percent": 50,
      "family_income_max": 250000,
      "streams": [
        "All"
      ],
      "categories": [
        "Minority"
      ],
      "gender": "all",
      "disability": false,
      "min_age": 0,
      "max_age": 0
    }
  },
  {
    "id": "aicte_pragati",
    "name": "AICTE Pragati Scholarship for Girls",
    "provider": "AICTE",
    "portal_url": "https://www.aicte-india.org/schemes/students-development-schemes/Pragati",
    "category": "scholarship",
    "benefits": {
      "tuition_support": "None",
      "maintenance_allowance": "₹50,000/year",
      "other_benefits": "None",
      "duration": "Course duration"
    },
    "deadlines": {
      "application_open": "September",
      "application_close": "November"
    },
    "documents_required": [
      "Previous Year Marksheet",
      "Income Certificate",
      "Aadhaar Card",
      "Bank Passbook",
      "Admission Letter (Technical Degree/Diploma)"
    ],
    "priority_for_jk": false,
    "eligibility": {
      "domicile": "India",
      "class_12_min_percent": 0,
      "family_income_max": 800000,
      "streams": [
        "All"
      ],
      "categories": [
        "All"
      ],
      "gender": "female",
      "disability": false,
      "min_age": 0,
      "max_age": 0
    }
  },
  {
    "id": "aicte_saksham",
    "name": "AICTE Saksham Scholarship for Specially-abled Students",
    "provider": "AICTE",
    "portal_url": "https://www.aicte-india.org/schemes/students-development-schemes/Saksham",
    "category": "scholarship",
    "benefits": {
      "tuition_support": "None",
      "maintenance_allowance": "₹50,000/year",
      "other_benefits": "None",
      "duration": "Course duration"
    },
    "deadlines": {
      "application_open": "September",
      "application_close": "November"
    },
    "documents_required": [
      "Disability Certificate (min 40%)",
      "Previous Year Marksheet",
      "Income Certificate",
      "Aadhaar Card",
      "Bank Passbook"
    ],
    "priority_for_jk": false,
    "eligibility": {
      "domicile": "India",
      "class_12_min_percent": 0,
      "family_income_max": 800000,
      "streams": [
        "All"
      ],
      "categories": [
        "All"
      ],
      "gender": "all",
      "disability": true,
      "min_age": 0,
      "max_age": 0
    }
  },
  {
    "id": "manf",
    "name": "Maulana Azad National Fellowship (MANF)",
    "provider": "UGC / Ministry of Minority Affairs",
    "portal_url": "https://ugc.ac.in/ugc_schemes/",
    "category": "fellowship",
    "benefits": {
      "tuition_support": "None",
      "maintenance_allowance": "₹31,000/month (JRF) / ₹35,000/month (SRF)",
      "other_benefits": "Contingency Grant up to ₹25,000/year",
      "duration": "5 years (MPhil/PhD)"
    },
    "deadlines": {
      "application_open": "June",
      "application_close": "July"
    },
    "documents_required": [
      "Minority Certificate",
      "PG Marksheet",
      "Registration/Admission in PhD/MPhil",
      "Income Certificate"
    ],
    "priority_for_jk": false,
    "eligibility": {
      "domicile": "India",
      "class_12_min_percent": 55,
      "family_income_max": 600000,
      "streams": [
        "All"
      ],
      "categories": [
        "Minority"
      ],
      "gender": "all",
      "disability": false,
      "min_age": 0,
      "max_age": 0
    }
  },
  {
    "id": "gate_scholarship",
    "name": "GATE Scholarship",
    "provider": "AICTE",
    "portal_url": "https://pgscholarship.aicte-india.org/",
    "category": "fellowship",
    "benefits": {
      "tuition_support": "None",
      "maintenance_allowance": "₹12,400/month",
      "other_benefits": "None",
      "duration": "24 months or course duration"
    },
    "deadlines": {
      "application_open": "August",
      "application_close": "October"
    },
    "documents_required": [
      "Valid GATE Scorecard",
      "Aadhaar Card",
      "Bank Passbook",
      "Admission Proof in M.E/M.Tech"
    ],
    "priority_for_jk": false,
    "eligibility": {
      "domicile": "India",
      "class_12_min_percent": 0,
      "family_income_max": 0,
      "streams": [
        "All"
      ],
      "categories": [
        "All"
      ],
      "gender": "all",
      "disability": false,
      "min_age": 0,
      "max_age": 0
    }
  },
  {
    "id": "ugc_net_jrf",
    "name": "UGC NET Junior Research Fellowship (JRF)",
    "provider": "UGC",
    "portal_url": "https://ugcnet.nta.nic.in/",
    "category": "fellowship",
    "benefits": {
      "tuition_support": "None",
      "maintenance_allowance": "₹37,000/month",
      "other_benefits": "HRA as per rules, Contingency grant",
      "duration": "5 years"
    },
    "deadlines": {
      "application_open": "March",
      "application_close": "May"
    },
    "documents_required": [
      "UGC NET Award Letter",
      "Joining Report",
      "PG Marksheet",
      "Aadhaar Card",
      "Bank Passbook"
    ],
    "priority_for_jk": false,
    "eligibility": {
      "domicile": "India",
      "class_12_min_percent": 0,
      "family_income_max": 0,
      "streams": [
        "All"
      ],
      "categories": [
        "All"
      ],
      "gender": "all",
      "disability": false,
      "min_age": 0,
      "max_age": 30
    }
  },
  {
    "id": "vidyalakshmi_loan",
    "name": "Vidyalakshmi Education Loan",
    "provider": "Ministry of Finance / NSDL",
    "portal_url": "https://www.vidyalakshmi.co.in/",
    "category": "loan",
    "benefits": {
      "tuition_support": "Up to full course fee as loan",
      "maintenance_allowance": "Living expenses included in loan",
      "other_benefits": "Interest subsidy for EWS (CSIS scheme)",
      "duration": "Repayment starts 1 year after course completion"
    },
    "deadlines": {
      "application_open": "January",
      "application_close": "December"
    },
    "documents_required": [
      "Admission Proof",
      "Fee Structure",
      "Aadhaar Card",
      "PAN Card",
      "Income Proof of Co-borrower"
    ],
    "priority_for_jk": false,
    "eligibility": {
      "domicile": "India",
      "class_12_min_percent": 0,
      "family_income_max": 0,
      "streams": [
        "All"
      ],
      "categories": [
        "All"
      ],
      "gender": "all",
      "disability": false,
      "min_age": 0,
      "max_age": 0
    }
  },
  {
    "id": "nmdfc_loan",
    "name": "NMDFC Education Loan Scheme",
    "provider": "National Minorities Development & Finance Corporation",
    "portal_url": "https://www.nmdfc.org/",
    "category": "loan",
    "benefits": {
      "tuition_support": "Up to ₹20 Lakhs (Domestic) / ₹30 Lakhs (Abroad)",
      "maintenance_allowance": "None",
      "other_benefits": "Concessional interest rate of 3% p.a.",
      "duration": "Max 5 years for repayment"
    },
    "deadlines": {
      "application_open": "April",
      "application_close": "October"
    },
    "documents_required": [
      "Minority Certificate",
      "Income Certificate",
      "Admission Proof",
      "Fee Structure",
      "Aadhaar Card",
      "Guarantor Details"
    ],
    "priority_for_jk": false,
    "eligibility": {
      "domicile": "India",
      "class_12_min_percent": 0,
      "family_income_max": 120000,
      "streams": [
        "All"
      ],
      "categories": [
        "Minority"
      ],
      "gender": "all",
      "disability": false,
      "min_age": 16,
      "max_age": 32
    }
  }
];
