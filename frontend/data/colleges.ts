export type Branch = { name: string; total_seats: number; cutoff_info?: string; seats_om?: number; seats_sc?: number; seats_st?: number; seats_rba?: number };
export type College = {
  id: string;
  name: string;
  district: string;
  type: string;
  affiliation: string;
  fees_per_sem: string;
  hostel: boolean;
  website: string;
  admission_through: string;
  naac_grade?: string;
  established?: number;
  branches: Branch[];
};

export const FALLBACK_COLLEGES: College[] = [
  {
    "id": "nit_srinagar",
    "name": "National Institute of Technology Srinagar",
    "district": "Srinagar",
    "type": "engineering",
    "affiliation": "Central Govt (MoE)",
    "fees_per_sem": "Rs. 62,500 (Gen/OBC) - Variable for SC/ST",
    "hostel": true,
    "website": "https://nitsri.ac.in",
    "admission_through": "JoSAA (JEE Main)",
    "naac_grade": "A",
    "established": 1960,
    "branches": [
      {
        "name": "Computer Science and Engineering",
        "seats_om": 38,
        "seats_sc": 11,
        "seats_st": 6,
        "seats_rba": 0,
        "total_seats": 77,
        "cutoff_info": "JEE Main ~22000 CRL (OM)"
      },
      {
        "name": "Electronics and Communication Engineering",
        "seats_om": 38,
        "seats_sc": 11,
        "seats_st": 6,
        "seats_rba": 0,
        "total_seats": 77,
        "cutoff_info": "JEE Main ~30000 CRL (OM)"
      },
      {
        "name": "Electrical Engineering",
        "seats_om": 45,
        "seats_sc": 13,
        "seats_st": 7,
        "seats_rba": 0,
        "total_seats": 92,
        "cutoff_info": "JEE Main ~38000 CRL (OM)"
      },
      {
        "name": "Mechanical Engineering",
        "seats_om": 45,
        "seats_sc": 13,
        "seats_st": 7,
        "seats_rba": 0,
        "total_seats": 92,
        "cutoff_info": "JEE Main ~45000 CRL (OM)"
      },
      {
        "name": "Civil Engineering",
        "seats_om": 50,
        "seats_sc": 15,
        "seats_st": 8,
        "seats_rba": 0,
        "total_seats": 102,
        "cutoff_info": "JEE Main ~50000 CRL (OM)"
      },
      {
        "name": "Information Technology",
        "seats_om": 35,
        "seats_sc": 10,
        "seats_st": 5,
        "seats_rba": 0,
        "total_seats": 72,
        "cutoff_info": "JEE Main ~25000 CRL (OM)"
      },
      {
        "name": "Chemical Engineering",
        "seats_om": 30,
        "seats_sc": 9,
        "seats_st": 5,
        "seats_rba": 0,
        "total_seats": 62,
        "cutoff_info": "JEE Main ~55000 CRL (OM)"
      },
      {
        "name": "Metallurgical and Materials Engineering",
        "seats_om": 30,
        "seats_sc": 9,
        "seats_st": 5,
        "seats_rba": 0,
        "total_seats": 62,
        "cutoff_info": "JEE Main ~65000 CRL (OM)"
      }
    ]
  },
  {
    "id": "iust_awantipora",
    "name": "Islamic University of Science & Technology (IUST)",
    "district": "Pulwama",
    "type": "engineering",
    "affiliation": "UT Govt J&K",
    "fees_per_sem": "Rs. 30,000 - 45,000",
    "hostel": true,
    "website": "https://iust.ac.in",
    "admission_through": "JKCET/JEE",
    "naac_grade": "B",
    "established": 2005,
    "branches": [
      {
        "name": "Computer Science and Engineering",
        "seats_om": 30,
        "seats_sc": 5,
        "seats_st": 5,
        "seats_rba": 10,
        "total_seats": 60,
        "cutoff_info": "JKCET Top 1000 / JEE Main"
      },
      {
        "name": "Civil Engineering",
        "seats_om": 30,
        "seats_sc": 5,
        "seats_st": 5,
        "seats_rba": 10,
        "total_seats": 60,
        "cutoff_info": "JKCET Top 2000"
      },
      {
        "name": "Electrical Engineering",
        "seats_om": 30,
        "seats_sc": 5,
        "seats_st": 5,
        "seats_rba": 10,
        "total_seats": 60,
        "cutoff_info": "JKCET Top 2500"
      },
      {
        "name": "Electronics & Communication",
        "seats_om": 30,
        "seats_sc": 5,
        "seats_st": 5,
        "seats_rba": 10,
        "total_seats": 60,
        "cutoff_info": "JKCET Top 3000"
      },
      {
        "name": "Food Technology",
        "seats_om": 30,
        "seats_sc": 5,
        "seats_st": 5,
        "seats_rba": 10,
        "total_seats": 60,
        "cutoff_info": "JKCET Top 4000"
      }
    ]
  },
  {
    "id": "ssm_parihaspora",
    "name": "SSM College of Engineering",
    "district": "Baramulla",
    "type": "engineering",
    "affiliation": "University of Kashmir",
    "fees_per_sem": "Rs. 40,000 - 50,000",
    "hostel": true,
    "website": "https://ssmengg.edu.in",
    "admission_through": "JKCET",
    "naac_grade": "",
    "established": 1988,
    "branches": [
      {
        "name": "Computer Science and Engineering",
        "seats_om": 60,
        "seats_sc": 0,
        "seats_st": 0,
        "seats_rba": 0,
        "total_seats": 120,
        "cutoff_info": "JKCET/Management Quota"
      },
      {
        "name": "Civil Engineering",
        "seats_om": 60,
        "seats_sc": 0,
        "seats_st": 0,
        "seats_rba": 0,
        "total_seats": 120,
        "cutoff_info": "JKCET/Management"
      }
    ]
  },
  {
    "id": "miet_jammu",
    "name": "Model Institute of Engineering and Technology",
    "district": "Jammu",
    "type": "engineering",
    "affiliation": "University of Jammu",
    "fees_per_sem": "Rs. 50,000 - 65,000",
    "hostel": true,
    "website": "https://mietjammu.in",
    "admission_through": "JKCET",
    "naac_grade": "A",
    "established": 1999,
    "branches": [
      {
        "name": "Computer Science and Engineering",
        "seats_om": 90,
        "seats_sc": 15,
        "seats_st": 10,
        "seats_rba": 5,
        "total_seats": 180,
        "cutoff_info": "JKCET/JEE Main"
      },
      {
        "name": "Electronics & Communication",
        "seats_om": 45,
        "seats_sc": 10,
        "seats_st": 5,
        "seats_rba": 0,
        "total_seats": 90,
        "cutoff_info": "JKCET/JEE Main"
      }
    ]
  },
  {
    "id": "gec_jammu",
    "name": "Government College of Engineering and Technology, Jammu",
    "district": "Jammu",
    "type": "engineering",
    "affiliation": "UT Govt J&K",
    "fees_per_sem": "Rs. 15,000 - 20,000",
    "hostel": true,
    "website": "https://gcetjammu.org.in",
    "admission_through": "JKCET",
    "naac_grade": "",
    "established": 1994,
    "branches": [
      {
        "name": "Computer Science",
        "seats_om": 30,
        "seats_sc": 5,
        "seats_st": 5,
        "seats_rba": 10,
        "total_seats": 60,
        "cutoff_info": "JKCET Top 500"
      },
      {
        "name": "Civil Engineering",
        "seats_om": 30,
        "seats_sc": 5,
        "seats_st": 5,
        "seats_rba": 10,
        "total_seats": 60,
        "cutoff_info": "JKCET Top 1500"
      }
    ]
  },
  {
    "id": "gcet_safapora",
    "name": "Government College of Engineering and Technology Safapora",
    "district": "Ganderbal",
    "type": "engineering",
    "affiliation": "UT Govt J&K",
    "fees_per_sem": "Rs. 15,000",
    "hostel": false,
    "website": "https://gcetkashmir.ac.in",
    "admission_through": "JKCET",
    "naac_grade": "",
    "established": 2017,
    "branches": [
      {
        "name": "Computer Science",
        "seats_om": 30,
        "seats_sc": 5,
        "seats_st": 5,
        "seats_rba": 10,
        "total_seats": 60,
        "cutoff_info": "JKCET"
      },
      {
        "name": "Civil Engineering",
        "seats_om": 30,
        "seats_sc": 5,
        "seats_st": 5,
        "seats_rba": 10,
        "total_seats": 60,
        "cutoff_info": "JKCET"
      }
    ]
  },
  {
    "id": "bgsbu_rajouri",
    "name": "Baba Ghulam Shah Badshah University",
    "district": "Rajouri",
    "type": "engineering",
    "affiliation": "UT Govt J&K",
    "fees_per_sem": "Rs. 35,000",
    "hostel": true,
    "website": "https://bgsbu.ac.in",
    "admission_through": "JKCET",
    "naac_grade": "B++",
    "established": 2002,
    "branches": [
      {
        "name": "Computer Science and Engineering",
        "seats_om": 30,
        "seats_sc": 5,
        "seats_st": 5,
        "seats_rba": 10,
        "total_seats": 60,
        "cutoff_info": "JKCET/JEE"
      },
      {
        "name": "Information Technology",
        "seats_om": 30,
        "seats_sc": 5,
        "seats_st": 5,
        "seats_rba": 10,
        "total_seats": 60,
        "cutoff_info": "JKCET/JEE"
      }
    ]
  },
  {
    "id": "govt_poly_srinagar",
    "name": "Government Polytechnic College Srinagar",
    "district": "Srinagar",
    "type": "engineering",
    "affiliation": "JKBOTE",
    "fees_per_sem": "Rs. 3,000",
    "hostel": true,
    "website": "https://kashmirpolytechnic.com",
    "admission_through": "BOPEE Polytechnic",
    "naac_grade": "",
    "established": 1958,
    "branches": [
      {
        "name": "Civil Engineering Diploma",
        "seats_om": 30,
        "seats_sc": 5,
        "seats_st": 5,
        "seats_rba": 10,
        "total_seats": 60,
        "cutoff_info": "Merit based (10th/12th)"
      }
    ]
  },
  {
    "id": "gmc_srinagar",
    "name": "Government Medical College (SMHS), Srinagar",
    "district": "Srinagar",
    "type": "medical",
    "affiliation": "University of Kashmir",
    "fees_per_sem": "Rs. 15,000 (Annual)",
    "hostel": true,
    "website": "https://gmcs.edu.in",
    "admission_through": "BOPEE (NEET)",
    "naac_grade": "A",
    "established": 1959,
    "branches": [
      {
        "name": "MBBS",
        "seats_om": 90,
        "seats_sc": 16,
        "seats_st": 20,
        "seats_rba": 20,
        "total_seats": 200,
        "cutoff_info": "NEET ~590-625 (OM)"
      }
    ]
  },
  {
    "id": "gmc_jammu",
    "name": "Government Medical College, Jammu",
    "district": "Jammu",
    "type": "medical",
    "affiliation": "University of Jammu",
    "fees_per_sem": "Rs. 15,000 (Annual)",
    "hostel": true,
    "website": "https://gmcjammu.nic.in",
    "admission_through": "BOPEE (NEET)",
    "naac_grade": "A",
    "established": 1973,
    "branches": [
      {
        "name": "MBBS",
        "seats_om": 90,
        "seats_sc": 16,
        "seats_st": 20,
        "seats_rba": 20,
        "total_seats": 200,
        "cutoff_info": "NEET ~580-610 (OM)"
      }
    ]
  },
  {
    "id": "gmc_doda",
    "name": "Government Medical College, Doda",
    "district": "Doda",
    "type": "medical",
    "affiliation": "University of Jammu",
    "fees_per_sem": "Rs. 15,000 (Annual)",
    "hostel": true,
    "website": "https://gmcdoda.in",
    "admission_through": "BOPEE (NEET)",
    "naac_grade": "",
    "established": 2020,
    "branches": [
      {
        "name": "MBBS",
        "seats_om": 45,
        "seats_sc": 8,
        "seats_st": 10,
        "seats_rba": 10,
        "total_seats": 100,
        "cutoff_info": "NEET ~540-560 (OM)"
      }
    ]
  },
  {
    "id": "gmc_rajouri",
    "name": "Government Medical College, Rajouri",
    "district": "Rajouri",
    "type": "medical",
    "affiliation": "University of Jammu",
    "fees_per_sem": "Rs. 15,000 (Annual)",
    "hostel": true,
    "website": "https://gmcrajouri.in",
    "admission_through": "BOPEE (NEET)",
    "naac_grade": "",
    "established": 2019,
    "branches": [
      {
        "name": "MBBS",
        "seats_om": 45,
        "seats_sc": 8,
        "seats_st": 10,
        "seats_rba": 10,
        "total_seats": 100,
        "cutoff_info": "NEET ~530-550 (OM)"
      }
    ]
  },
  {
    "id": "gmc_anantnag",
    "name": "Government Medical College, Anantnag",
    "district": "Anantnag",
    "type": "medical",
    "affiliation": "University of Kashmir",
    "fees_per_sem": "Rs. 15,000 (Annual)",
    "hostel": true,
    "website": "https://gmcanantnag.net",
    "admission_through": "BOPEE (NEET)",
    "naac_grade": "",
    "established": 2019,
    "branches": [
      {
        "name": "MBBS",
        "seats_om": 45,
        "seats_sc": 8,
        "seats_st": 10,
        "seats_rba": 10,
        "total_seats": 100,
        "cutoff_info": "NEET ~550-570 (OM)"
      }
    ]
  },
  {
    "id": "gmc_kathua",
    "name": "Government Medical College, Kathua",
    "district": "Kathua",
    "type": "medical",
    "affiliation": "University of Jammu",
    "fees_per_sem": "Rs. 15,000 (Annual)",
    "hostel": true,
    "website": "https://gmckathua.in",
    "admission_through": "BOPEE (NEET)",
    "naac_grade": "",
    "established": 2019,
    "branches": [
      {
        "name": "MBBS",
        "seats_om": 45,
        "seats_sc": 8,
        "seats_st": 10,
        "seats_rba": 10,
        "total_seats": 100,
        "cutoff_info": "NEET ~540-560 (OM)"
      }
    ]
  },
  {
    "id": "gmc_baramulla",
    "name": "Government Medical College, Baramulla",
    "district": "Baramulla",
    "type": "medical",
    "affiliation": "University of Kashmir",
    "fees_per_sem": "Rs. 15,000 (Annual)",
    "hostel": true,
    "website": "https://gmcbaramulla.com",
    "admission_through": "BOPEE (NEET)",
    "naac_grade": "",
    "established": 2019,
    "branches": [
      {
        "name": "MBBS",
        "seats_om": 45,
        "seats_sc": 8,
        "seats_st": 10,
        "seats_rba": 10,
        "total_seats": 100,
        "cutoff_info": "NEET ~550-570 (OM)"
      }
    ]
  },
  {
    "id": "skims_soura",
    "name": "SKIMS Soura",
    "district": "Srinagar",
    "type": "medical",
    "affiliation": "Deemed University",
    "fees_per_sem": "Rs. 25,000 (Annual)",
    "hostel": true,
    "website": "https://skims.ac.in",
    "admission_through": "BOPEE (NEET)",
    "naac_grade": "A+",
    "established": 1982,
    "branches": [
      {
        "name": "MBBS",
        "seats_om": 45,
        "seats_sc": 8,
        "seats_st": 10,
        "seats_rba": 10,
        "total_seats": 100,
        "cutoff_info": "NEET ~600-640 (OM)"
      }
    ]
  },
  {
    "id": "skims_bemina",
    "name": "SKIMS Medical College, Bemina",
    "district": "Srinagar",
    "type": "medical",
    "affiliation": "Deemed University",
    "fees_per_sem": "Rs. 20,000 (Annual)",
    "hostel": true,
    "website": "https://skimsbemina.edu.in",
    "admission_through": "BOPEE (NEET)",
    "naac_grade": "A",
    "established": 1989,
    "branches": [
      {
        "name": "MBBS",
        "seats_om": 45,
        "seats_sc": 8,
        "seats_st": 10,
        "seats_rba": 10,
        "total_seats": 100,
        "cutoff_info": "NEET ~570-590 (OM)"
      }
    ]
  },
  {
    "id": "gamc_akhnoor",
    "name": "Government Ayurvedic Medical College, Akhnoor",
    "district": "Jammu",
    "type": "medical",
    "affiliation": "University of Jammu",
    "fees_per_sem": "Rs. 10,000 (Annual)",
    "hostel": true,
    "website": "https://gamcjammu.org",
    "admission_through": "BOPEE (NEET)",
    "naac_grade": "",
    "established": 2017,
    "branches": [
      {
        "name": "BAMS",
        "seats_om": 25,
        "seats_sc": 5,
        "seats_st": 6,
        "seats_rba": 6,
        "total_seats": 60,
        "cutoff_info": "NEET ~400 (OM)"
      }
    ]
  },
  {
    "id": "gumc_ganderbal",
    "name": "Government Unani Medical College, Ganderbal",
    "district": "Ganderbal",
    "type": "medical",
    "affiliation": "University of Kashmir",
    "fees_per_sem": "Rs. 10,000 (Annual)",
    "hostel": true,
    "website": "https://gumck.in",
    "admission_through": "BOPEE (NEET)",
    "naac_grade": "",
    "established": 2020,
    "branches": [
      {
        "name": "BUMS",
        "seats_om": 25,
        "seats_sc": 5,
        "seats_st": 6,
        "seats_rba": 6,
        "total_seats": 60,
        "cutoff_info": "NEET ~400 (OM)"
      }
    ]
  },
  {
    "id": "ku_srinagar",
    "name": "University of Kashmir",
    "district": "Srinagar",
    "type": "university",
    "affiliation": "UT Govt J&K",
    "fees_per_sem": "Rs. 5,000 - 15,000",
    "hostel": true,
    "website": "https://kashmiruniversity.net",
    "admission_through": "CUET / KUET",
    "naac_grade": "A+",
    "established": 1948,
    "branches": [
      {
        "name": "BA/BSc/BCom",
        "seats_om": 500,
        "seats_sc": 80,
        "seats_st": 100,
        "seats_rba": 100,
        "total_seats": 1000,
        "cutoff_info": "CUET / Merit"
      },
      {
        "name": "LLB",
        "seats_om": 25,
        "seats_sc": 5,
        "seats_st": 5,
        "seats_rba": 5,
        "total_seats": 50,
        "cutoff_info": "KUET Entrance"
      }
    ]
  },
  {
    "id": "ju_jammu",
    "name": "University of Jammu",
    "district": "Jammu",
    "type": "university",
    "affiliation": "UT Govt J&K",
    "fees_per_sem": "Rs. 5,000 - 15,000",
    "hostel": true,
    "website": "https://jammuuniversity.ac.in",
    "admission_through": "CUET / JUET",
    "naac_grade": "A+",
    "established": 1969,
    "branches": [
      {
        "name": "BA/BSc/BCom",
        "seats_om": 500,
        "seats_sc": 80,
        "seats_st": 100,
        "seats_rba": 100,
        "total_seats": 1000,
        "cutoff_info": "CUET / Merit"
      },
      {
        "name": "BBA",
        "seats_om": 40,
        "seats_sc": 5,
        "seats_st": 5,
        "seats_rba": 5,
        "total_seats": 60,
        "cutoff_info": "JUET Entrance"
      }
    ]
  },
  {
    "id": "cuk_ganderbal",
    "name": "Central University of Kashmir",
    "district": "Ganderbal",
    "type": "university",
    "affiliation": "Central Govt",
    "fees_per_sem": "Rs. 8,000 - 20,000",
    "hostel": true,
    "website": "https://cukashmir.ac.in",
    "admission_through": "CUET",
    "naac_grade": "B++",
    "established": 2009,
    "branches": [
      {
        "name": "Integrated BSc-MSc Physics",
        "seats_om": 20,
        "seats_sc": 5,
        "seats_st": 3,
        "seats_rba": 0,
        "total_seats": 40,
        "cutoff_info": "CUET"
      },
      {
        "name": "BA LLB",
        "seats_om": 25,
        "seats_sc": 5,
        "seats_st": 5,
        "seats_rba": 0,
        "total_seats": 50,
        "cutoff_info": "CUET"
      }
    ]
  },
  {
    "id": "cuj_samba",
    "name": "Central University of Jammu",
    "district": "Samba",
    "type": "university",
    "affiliation": "Central Govt",
    "fees_per_sem": "Rs. 8,000 - 20,000",
    "hostel": true,
    "website": "https://cujammu.ac.in",
    "admission_through": "CUET",
    "naac_grade": "B++",
    "established": 2011,
    "branches": [
      {
        "name": "Integrated Science",
        "seats_om": 20,
        "seats_sc": 5,
        "seats_st": 3,
        "seats_rba": 0,
        "total_seats": 40,
        "cutoff_info": "CUET"
      }
    ]
  },
  {
    "id": "skuast_kashmir",
    "name": "SKUAST-Kashmir",
    "district": "Srinagar",
    "type": "agriculture",
    "affiliation": "UT Govt J&K",
    "fees_per_sem": "Rs. 15,000 - 25,000",
    "hostel": true,
    "website": "https://skuastkashmir.ac.in",
    "admission_through": "UET",
    "naac_grade": "A",
    "established": 1982,
    "branches": [
      {
        "name": "B.Sc Agriculture",
        "seats_om": 45,
        "seats_sc": 8,
        "seats_st": 10,
        "seats_rba": 10,
        "total_seats": 100,
        "cutoff_info": "SKUAST Entrance"
      },
      {
        "name": "BVSc & AH",
        "seats_om": 30,
        "seats_sc": 5,
        "seats_st": 5,
        "seats_rba": 8,
        "total_seats": 60,
        "cutoff_info": "SKUAST Entrance"
      },
      {
        "name": "B.Tech Food Technology",
        "seats_om": 20,
        "seats_sc": 3,
        "seats_st": 3,
        "seats_rba": 4,
        "total_seats": 40,
        "cutoff_info": "SKUAST Entrance"
      }
    ]
  },
  {
    "id": "skuast_jammu",
    "name": "SKUAST-Jammu",
    "district": "Jammu",
    "type": "agriculture",
    "affiliation": "UT Govt J&K",
    "fees_per_sem": "Rs. 15,000 - 25,000",
    "hostel": true,
    "website": "https://skuast.org",
    "admission_through": "CET",
    "naac_grade": "A",
    "established": 1999,
    "branches": [
      {
        "name": "B.Sc Agriculture",
        "seats_om": 45,
        "seats_sc": 8,
        "seats_st": 10,
        "seats_rba": 10,
        "total_seats": 100,
        "cutoff_info": "SKUAST Entrance"
      },
      {
        "name": "BVSc & AH",
        "seats_om": 30,
        "seats_sc": 5,
        "seats_st": 5,
        "seats_rba": 8,
        "total_seats": 60,
        "cutoff_info": "SKUAST Entrance"
      }
    ]
  },
  {
    "id": "gdc_law_srinagar",
    "name": "Government Law College, Srinagar",
    "district": "Srinagar",
    "type": "professional",
    "affiliation": "University of Kashmir",
    "fees_per_sem": "Rs. 10,000",
    "hostel": false,
    "website": "https://kashmiruniversity.net",
    "admission_through": "Entrance",
    "naac_grade": "",
    "established": 1980,
    "branches": [
      {
        "name": "LLB",
        "seats_om": 30,
        "seats_sc": 5,
        "seats_st": 5,
        "seats_rba": 10,
        "total_seats": 60,
        "cutoff_info": "Entrance / Merit"
      }
    ]
  }
];

export const FALLBACK_DISTRICTS: string[] = [
  "Anantnag",
  "Baramulla",
  "Doda",
  "Ganderbal",
  "Jammu",
  "Kathua",
  "Pulwama",
  "Rajouri",
  "Samba",
  "Srinagar"
];

export const FALLBACK_TYPES: string[] = [
  "agriculture",
  "engineering",
  "medical",
  "professional",
  "university"
];
