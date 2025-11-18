-- Seed data: Top 50 Medical Device Companies to track
-- This is a starter list - expand to 500+ based on client requirements

INSERT INTO companies (name, website, industry_vertical, headquarters_location, description) VALUES

-- Top 10 Large Cap Med-Tech Companies
('Medtronic', 'https://www.medtronic.com', 'Cardiovascular', 'Dublin, Ireland', 'Global leader in medical technology, services and solutions'),
('Abbott Laboratories', 'https://www.abbott.com', 'Diagnostics', 'Abbott Park, IL', 'Healthcare products including diagnostics, medical devices, nutrition, and branded generic medicines'),
('Boston Scientific', 'https://www.bostonscientific.com', 'Interventional Medicine', 'Marlborough, MA', 'Medical devices for interventional medicine'),
('Becton Dickinson (BD)', 'https://www.bd.com', 'Diagnostics', 'Franklin Lakes, NJ', 'Medical technology company serving healthcare institutions, life science researchers, clinical labs'),
('Stryker Corporation', 'https://www.stryker.com', 'Orthopedics', 'Kalamazoo, MI', 'Medical technologies including orthopedics, medical and surgical, neurotechnology and spine'),
('Baxter International', 'https://www.baxter.com', 'Renal Care', 'Deerfield, IL', 'Medical products and therapies for people with chronic and acute medical conditions'),
('Zimmer Biomet', 'https://www.zimmerbiomet.com', 'Orthopedics', 'Warsaw, IN', 'Musculoskeletal healthcare with products and solutions for joint reconstruction, spine, sports medicine'),
('Edwards Lifesciences', 'https://www.edwards.com', 'Cardiovascular', 'Irvine, CA', 'Patient-focused innovations for structural heart disease and critical care monitoring'),
('Intuitive Surgical', 'https://www.intuitive.com', 'Surgical Robotics', 'Sunnyvale, CA', 'Pioneer in robotic-assisted surgery with the da Vinci Surgical System'),
('Dexcom', 'https://www.dexcom.com', 'Diabetes Care', 'San Diego, CA', 'Continuous glucose monitoring systems for diabetes management'),

-- High-Growth Mid-Cap Companies
('Penumbra Inc', 'https://www.penumbrainc.com', 'Neurovascular', 'Alameda, CA', 'Innovative therapies for vascular and neurovascular diseases'),
('Tandem Diabetes Care', 'https://www.tandemdiabetes.com', 'Diabetes Care', 'San Diego, CA', 'Insulin delivery systems and diabetes management technology'),
('Globus Medical', 'https://www.globusmedical.com', 'Spine', 'Audubon, PA', 'Musculoskeletal solutions with focus on spine surgery'),
('Insulet Corporation', 'https://www.insulet.com', 'Diabetes Care', 'Acton, MA', 'Tubeless insulin pump technology (Omnipod)'),
('NuVasive', 'https://www.nuvasive.com', 'Spine', 'San Diego, CA', 'Minimally disruptive surgical products and procedurally integrated solutions for spine'),
('iRhythm Technologies', 'https://www.irhythmtech.com', 'Cardiac Monitoring', 'San Francisco, CA', 'Digital healthcare solutions for cardiac arrhythmia detection'),
('Axonics', 'https://www.axonics.com', 'Urology', 'Irvine, CA', 'Sacral neuromodulation systems for bladder and bowel dysfunction'),
('Shockwave Medical', 'https://www.shockwavemedical.com', 'Cardiovascular', 'Santa Clara, CA', 'Intravascular lithotripsy for treating calcified cardiovascular disease'),
('Silk Road Medical', 'https://www.silkroadmed.com', 'Neurovascular', 'Sunnyvale, CA', 'Transcarotid artery revascularization (TCAR) for stroke prevention'),
('Inari Medical', 'https://www.inarimedical.com', 'Vascular', 'Irvine, CA', 'Minimally invasive treatment for venous thromboembolism'),

-- Emerging Growth Companies
('Procept Biorobotics', 'https://www.procept-biorobotics.com', 'Urology', 'Redwood City, CA', 'Surgical robotics for benign prostatic hyperplasia treatment'),
('Cardiovascular Systems', 'https://www.csi360.com', 'Cardiovascular', 'St. Paul, MN', 'Orbital atherectomy systems for treating arterial disease'),
('TransMedics Group', 'https://www.transmedics.com', 'Organ Transplant', 'Andover, MA', 'Portable extracorporeal warm perfusion for donor organs'),
('Nevro Corp', 'https://www.nevro.com', 'Pain Management', 'Redwood City, CA', 'High-frequency spinal cord stimulation for chronic pain'),
('ViewRay', 'https://www.viewray.com', 'Radiation Therapy', 'Oakwood Village, OH', 'MRI-guided radiation therapy systems'),
('Abiomed', 'https://www.abiomed.com', 'Cardiovascular', 'Danvers, MA', 'Heart recovery and support technologies including Impella'),
('Inspire Medical Systems', 'https://www.inspiresleep.com', 'Sleep Apnea', 'Golden Valley, MN', 'Implantable neurostimulation for obstructive sleep apnea'),
('AtriCure', 'https://www.atricure.com', 'Cardiac Surgery', 'Mason, OH', 'Surgical devices for atrial fibrillation treatment'),
('Merit Medical Systems', 'https://www.merit.com', 'Interventional', 'South Jordan, UT', 'Disposable medical devices for interventional and diagnostic procedures'),
('Enovis', 'https://www.enovis.com', 'Orthopedics', 'Wilmington, DE', 'Medical technology company focused on orthopedic solutions'),

-- Digital Health & Wearables
('Livongo Health', 'https://www.livongo.com', 'Digital Health', 'Mountain View, CA', 'Applied Health Signals for chronic condition management'),
('Bionik Laboratories', 'https://www.bioniklabs.com', 'Rehabilitation', 'Toronto, Canada', 'Robotic systems for rehabilitation and recovery'),
('Masimo Corporation', 'https://www.masimo.com', 'Patient Monitoring', 'Irvine, CA', 'Noninvasive patient monitoring technologies'),
('ResMed', 'https://www.resmed.com', 'Sleep & Respiratory', 'San Diego, CA', 'Cloud-connected medical devices for sleep apnea, COPD, and other chronic diseases'),
('Tactile Medical', 'https://www.tactilemedical.com', 'Lymphedema', 'Minneapolis, MN', 'Medical devices for lymphedema and chronic swelling treatment'),

-- Diagnostics & Monitoring
('Guardant Health', 'https://www.guardanthealth.com', 'Oncology Diagnostics', 'Redwood City, CA', 'Precision oncology through blood tests and genomic sequencing'),
('Natera', 'https://www.natera.com', 'Genetic Testing', 'Austin, TX', 'Cell-free DNA testing for reproductive health and oncology'),
('Exact Sciences', 'https://www.exactsciences.com', 'Cancer Screening', 'Madison, WI', 'Cancer screening and diagnostic tests including Cologuard'),
('Foundation Medicine', 'https://www.foundationmedicine.com', 'Genomic Profiling', 'Cambridge, MA', 'Molecular information to guide cancer treatment'),
('10x Genomics', 'https://www.10xgenomics.com', 'Genomics', 'Pleasanton, CA', 'Products to analyze biological systems at unprecedented resolution'),

-- Imaging & Visualization
('Hologic', 'https://www.hologic.com', 'Women''s Health', 'Marlborough, MA', 'Medical imaging and diagnostics focused on women''s health'),
('Canon Medical Systems', 'https://us.medical.canon', 'Medical Imaging', 'Tustin, CA', 'Diagnostic imaging and healthcare IT solutions'),
('Butterfly Network', 'https://www.butterflynetwork.com', 'Ultrasound', 'Guilford, CT', 'Portable whole-body ultrasound system using semiconductor technology'),
('Nanox', 'https://www.nanox.vision', 'Medical Imaging', 'Neve Ilan, Israel', 'Digital X-ray technology for accessible medical imaging'),
('HeartFlow', 'https://www.heartflow.com', 'Cardiovascular Imaging', 'Mountain View, CA', 'Non-invasive cardiac imaging and analysis using AI'),

-- Surgical & Robotic Systems
('Corindus Vascular Robotics', 'https://www.corindus.com', 'Robotic Surgery', 'Waltham, MA', 'Robotic-assisted vascular intervention'),
('Verb Surgical', 'https://www.verbsurgical.com', 'Robotic Surgery', 'Santa Clara, CA', 'Digital surgery platform combining robotics, visualization, advanced instrumentation'),
('CMR Surgical', 'https://www.cmrsurgical.com', 'Robotic Surgery', 'Cambridge, UK', 'Next-generation surgical robot Versius for minimal access surgery'),
('Auris Health', 'https://www.aurishealth.com', 'Robotic Surgery', 'Redwood City, CA', 'Robotic technologies for lung cancer diagnosis and treatment'),
('Titan Medical', 'https://www.titanmedicalinc.com', 'Robotic Surgery', 'Toronto, Canada', 'Single-access robotic surgical technologies');

-- Initialize scraper state for these companies
INSERT INTO scraper_state (scraper_name, last_run_at, state_data)
VALUES
    ('fda_510k_scraper', NULL, '{"total_companies": 50, "last_page": 0}'),
    ('fda_pma_scraper', NULL, '{"total_companies": 50, "last_page": 0}'),
    ('clinicaltrials_monitor', NULL, '{"companies_to_monitor": 50}'),
    ('crunchbase_funding', NULL, '{"companies_synced": 0}'),
    ('pubmed_research', NULL, '{"last_sync": null}'),
    ('company_rss_monitor', NULL, '{"active_feeds": 0}')
ON CONFLICT (scraper_name) DO NOTHING;

COMMIT;
