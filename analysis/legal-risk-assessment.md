# Builders Quotient (BQ) -- Legal Risk Assessment

**Prepared for:** Austin Christian University (ACU)
**Subject:** Builders Quotient Psychometric Assessment Platform
**Date:** 2026-02-25
**Version:** 1.0

---

## 1. Executive Summary

Builders Quotient (BQ) is a psychometric assessment platform built for Austin Christian University that measures two domains -- intelligence (practical, creative, and analytical) and entrepreneur personality (9 dimensions). The platform collects webcam video and audio recordings from users, including high school prospective students ages 15--17, and processes those recordings through third-party AI services (OpenAI Whisper for speech-to-text, OpenAI GPT for scoring, and Google Gemini Studio for video analysis and transcript extraction). Processed data and raw video are stored in Supabase cloud databases hosted in the United States, with the frontend deployed on Vercel.

The key legal risks center on:

- **Biometric data laws** -- Texas Capture or Use of Biometric Identifier (CUBI) and Illinois Biometric Information Privacy Act (BIPA) are the most significant exposure areas. Video recordings inherently contain facial geometry, and audio recordings contain voiceprint data, both of which are classified as biometric identifiers under these statutes.
- **FTC Section 5 compliance** -- The platform must ensure that its privacy disclosures accurately and completely describe data collection, AI processing, and third-party sharing practices. Any gap between disclosed and actual practices constitutes a deceptive trade practice.
- **Data processing transparency** -- Users (and parents/guardians of minors) must understand that their video and audio will be transmitted to OpenAI and Google for AI analysis, that biometric-adjacent data is derived from these recordings, and how long all data is retained.

ACU's posture -- never selling, sharing, or monetizing student data, and processing solely for assessment comparison and scoring -- significantly reduces risk across several regulatory frameworks. However, the collection of biometric data from minors through AI-mediated processing creates compliance obligations that require affirmative action regardless of commercial intent.

---

## 2. Data Collection Inventory

### 2.1 Personal Identifiable Information (PII)

| Data Element | Collection Method | Storage Location | Retention Period |
|---|---|---|---|
| Full name | Intake form | Supabase `applicants` table | Indefinite (until deletion request) |
| Email address | Intake form | Supabase `applicants` table | Indefinite (until deletion request) |
| Phone number (optional) | Intake form | Supabase `applicants` table | Indefinite (until deletion request) |
| UTM parameters | URL query string (automatic) | Supabase `applicants` table | Indefinite |
| IP address (hashed) | Server-side capture | Supabase `applicants` table | Indefinite |
| Browser fingerprint | Client-side fingerprinting | Supabase `applicants` table | Indefinite |

### 2.2 Video and Audio Data

| Data Element | Collection Method | Storage Location | Retention Period | Third-Party Processing |
|---|---|---|---|---|
| Webcam video recordings | Browser MediaRecorder API | Supabase Storage (`responses` bucket) | 1 year after assessment completion | Google Gemini Studio (video analysis, personality assessment, transcript extraction) |
| Audio track (extracted from video) | Server-side extraction | Supabase Storage | 1 year after assessment completion | OpenAI Whisper (speech-to-text) |
| Transcribed text | AI-generated from audio | Supabase `student_responses` table | Indefinite | OpenAI Whisper (generation), OpenAI GPT (scoring) |

### 2.3 Biometric Derivatives

| Data Element | Source | Storage Location | Retention Period |
|---|---|---|---|
| Facial geometry (implicit in video) | Webcam video | Supabase Storage (as part of video file) | 1 year after assessment completion |
| Voiceprint (implicit in audio) | Audio track | Supabase Storage (as part of video file) | 1 year after assessment completion |

Note: BQ does not explicitly extract or store standalone biometric templates. However, the raw video and audio from which biometric identifiers can be derived are transmitted to third-party AI providers and stored for 1 year. Under statutes like IL BIPA and TX CUBI, the capture and transmission of data from which biometric identifiers can be extracted is sufficient to trigger compliance obligations.

### 2.4 Assessment and Behavioral Data

| Data Element | Collection Method | Storage Location | Retention Period |
|---|---|---|---|
| Assessment session metadata | Server-side timing | Supabase `assessment_sessions` table | Indefinite |
| Vignette exposure records | Server-side tracking | Supabase `vignette_exposures` table | Indefinite |
| AI-generated scores | OpenAI GPT scoring | Supabase `student_responses` table | Indefinite |
| Personality quiz responses | Client-side interaction | Supabase `personality_responses` table | Indefinite |
| Personality dimension scores | Server-side calculation | Supabase `personality_scores` table | Indefinite |
| Server-side timing data | Automatic capture | Supabase (various timestamp columns) | Indefinite |

### 2.5 Third-Party Data Processors

| Provider | Data Received | Purpose | Data Residency |
|---|---|---|---|
| OpenAI | Audio recordings, transcribed text | Speech-to-text (Whisper), response scoring (GPT) | US (OpenAI infrastructure) |
| Google (Gemini Studio) | Video recordings | Video analysis for personality assessment, transcript extraction | US (Google Cloud) |
| Supabase | All data | Primary database and file storage | US (AWS us-east-1) |
| Vercel | Request metadata, cookies | Frontend hosting and edge functions | US (primary), global edge |

---

## 3. Applicable Laws & Compliance Status

### 3.1 Texas Capture or Use of Biometric Identifier (TX CUBI)

**Risk Level: HIGH**

**Statute:** Texas Business & Commerce Code, Chapter 503

**Applicability:** TX CUBI applies to any commercial purpose capture, collection, or use of biometric identifiers, defined to include retina/iris scans, fingerprints, voiceprints, hand/face geometry records, and similar data. Video recordings containing faces and audio recordings containing voices trigger the voiceprint and facial geometry provisions.

**Key Requirements:**
- Inform individuals before capturing biometric identifiers
- May not capture biometric identifiers for a commercial purpose unless the individual consents
- May not sell, lease, or disclose biometric identifiers unless specific exceptions apply
- Must store, transmit, and protect biometric identifiers using reasonable care (at least equal to other confidential information)
- Must destroy biometric identifiers within a reasonable time (no later than the 1st anniversary of the purpose expiration)

**Penalties:** Up to $25,000 per violation. Enforcement by the Texas Attorney General. No private right of action.

**Current Compliance Gaps:**
- No explicit biometric consent gate in the assessment flow
- No publicly posted biometric data retention policy
- No documented destruction schedule with verification
- Transmission of video/audio to third-party AI providers (OpenAI, Google) may constitute disclosure requiring consent

**Mitigation Plan:**
1. Implement a biometric consent gate before video recording begins -- explicit notice that facial geometry and voiceprint data will be captured and processed
2. Publish a public biometric data retention policy specifying the 1-year retention period
3. Implement and document an automated destruction schedule for video/audio data at 1 year post-assessment
4. Ensure consent language covers transmission to named third-party processors

### 3.2 Illinois Biometric Information Privacy Act (IL BIPA)

**Risk Level: HIGH**

**Statute:** 740 ILCS 14/

**Applicability:** IL BIPA applies to any private entity that collects, captures, purchases, receives through trade, or otherwise obtains biometric identifiers or biometric information from individuals in Illinois. Because BQ is a web application accessible to Illinois residents (including prospective ACU students), BIPA obligations attach when an Illinois resident uses the platform.

**Key Requirements:**
- Written informed consent required before collection
- Public retention policy and destruction guidelines
- Prohibition on selling, leasing, trading, or profiting from biometric data
- Duty to protect biometric data at the same or higher standard as other confidential information
- Written release must inform the subject of the specific purpose and length of collection/storage

**Penalties:** $1,000 per negligent violation; $5,000 per intentional or reckless violation. **Private right of action** -- individuals can sue directly, which has generated extensive class action litigation.

**Current Compliance Gaps:**
- No written consent mechanism (checkbox + stored consent record) specific to biometric data
- No public-facing biometric data retention and destruction policy
- Third-party transmission to AI providers requires disclosure in consent

**Mitigation Plan:**
1. Implement a BIPA-compliant written consent flow: checkbox with explicit language, stored consent record (timestamp, IP, text of consent, version)
2. Publish a public biometric data retention and destruction policy
3. Consent text must name the specific biometric identifiers collected (facial geometry, voiceprint), the specific purpose (psychometric assessment scoring), the specific duration (1 year), and the third-party processors (OpenAI, Google)
4. Comply with the most restrictive interpretation -- BIPA effectively becomes the floor for all biometric compliance

### 3.3 Children's Online Privacy Protection Act (COPPA)

**Risk Level: LOW (with mitigation)**

**Statute:** 15 U.S.C. 6501--6506; 16 CFR Part 312

**Applicability:** COPPA applies to operators of commercial websites and online services directed to children under 13, or that have actual knowledge of collecting personal information from children under 13.

**Analysis:**
- BQ targets prospective college students (primarily ages 15--17 for early applicants, 18+ for traditional applicants)
- The Terms of Service require users to be 13 or older
- BQ does not collect date of birth, which avoids creating "actual knowledge" of a user's age
- The service is not "directed to children under 13" by design, content, or marketing
- The FTC's "actual knowledge" standard is narrow -- general awareness that some users might be under 13 is insufficient to trigger COPPA absent specific knowledge about a particular child

**Current Compliance Posture:**
- Terms of Service age floor of 13+ is in place
- No date of birth collection eliminates the primary "actual knowledge" trigger
- Service design and marketing target high school juniors/seniors and college applicants

**Mitigation Plan:**
1. Include a COPPA compliance statement in the privacy policy affirming the service is not directed at children under 13
2. Establish a protocol: if ACU discovers a user is under 13, immediately delete all associated data (video, PII, assessment data)
3. Maintain the 13+ age requirement in Terms of Service
4. Do not add age verification (DOB collection) unless legally required -- doing so could inadvertently create actual knowledge obligations

### 3.4 Family Educational Rights and Privacy Act (FERPA)

**Risk Level: MODERATE (future concern)**

**Statute:** 20 U.S.C. 1232g; 34 CFR Part 99

**Applicability:** FERPA applies to educational agencies and institutions that receive federal funding. It protects "education records" -- records directly related to a student and maintained by the educational agency or a party acting for the agency.

**Analysis:**
- BQ data collected from prospective students (pre-admission) is generally NOT covered by FERPA, as FERPA applies to students who are or have been in attendance
- However, once a BQ participant enrolls at ACU, their assessment data may become part of their education record
- The "school official" exception (34 CFR 99.31(a)(1)) could apply to AI processors if they perform institutional functions, but this requires specific contractual provisions
- The Department of Education has not issued clear guidance on AI-processed assessment data in the admissions context

**Current Compliance Posture:**
- Pre-enrollment data is outside FERPA scope
- No current mechanism to transition data governance upon matriculation

**Mitigation Plan:**
1. Plan a data governance transition protocol for when BQ participants enroll at ACU
2. Upon enrollment, BQ assessment data should be treated as education records subject to FERPA
3. Ensure DPAs with AI providers include "school official" language if data will be reprocessed post-enrollment
4. Consult with ACU's registrar and FERPA compliance officer on integration with existing student records systems

### 3.5 Texas Data Privacy and Security Act (TDPSA)

**Risk Level: LOW**

**Statute:** Texas Business & Commerce Code, Chapter 541 (effective July 1, 2024)

**Applicability:** TDPSA applies to persons conducting business in Texas that process personal data of Texas residents. However, it contains broad exemptions for institutions of higher education and entities subject to FERPA/GLBA.

**Analysis:**
- ACU, as an institution of higher education, is likely exempt from TDPSA
- Even if applicable, ACU does not sell personal data, which eliminates the highest-risk provisions
- The TDPSA's sensitive data provisions (which include biometric data) require opt-in consent, but TX CUBI already imposes stricter requirements

**Mitigation Plan:**
1. Confirm higher education exemption applies to ACU's specific use case
2. Maintain the practice of never selling personal data
3. TX CUBI compliance (Section 3.1) will satisfy any overlapping TDPSA biometric requirements

### 3.6 California Consumer Privacy Act / California Privacy Rights Act (CCPA/CPRA)

**Risk Level: MODERATE**

**Statute:** Cal. Civ. Code 1798.100--1798.199.100

**Applicability:** CCPA/CPRA applies to for-profit businesses meeting specific revenue or data volume thresholds that collect personal information of California residents. While ACU is a nonprofit educational institution (potentially exempt from CCPA), the analysis is included because:
- Exemption status may be contested if BQ serves a dual purpose (admissions + lead generation)
- California residents may use the public BQ product
- CCPA's minor protections (Cal. Civ. Code 1798.120(c)) require opt-in consent before selling or sharing personal information of consumers under 16

**Analysis:**
- ACU likely qualifies for the nonprofit exemption
- Even if applicable, ACU does not sell or share personal information as defined by CCPA/CPRA
- The "sharing" definition under CPRA includes cross-context behavioral advertising, which BQ does not engage in
- Minor protections are satisfied by the no-sale/no-share posture

**Mitigation Plan:**
1. Maintain the absolute prohibition on selling or sharing personal data
2. Document the nonprofit exemption basis
3. If BQ expands to serve non-ACU purposes, reassess CCPA applicability

### 3.7 FTC Act Section 5 -- Unfair or Deceptive Acts or Practices

**Risk Level: MODERATE**

**Statute:** 15 U.S.C. 45(a)

**Applicability:** FTC Section 5 applies broadly to all commercial entities (with limited exceptions). The FTC has increasingly focused on AI-related disclosures, biometric data practices, and children's privacy, issuing multiple enforcement actions and policy statements on these topics.

**Analysis:**
- The FTC evaluates whether privacy disclosures are materially misleading or whether data practices cause substantial consumer injury
- Key risk areas for BQ:
  - Privacy policy must accurately describe AI processing (OpenAI, Google Gemini)
  - Consent text must match actual data flows
  - Marketing claims about the assessment must not overstate scientific validity
  - Data security practices must match stated commitments
- The FTC has signaled heightened scrutiny of AI systems that process biometric data, particularly involving minors

**Current Compliance Gaps:**
- Privacy policy may not fully describe the AI processing pipeline
- Consent language needs to accurately reflect all third-party data transmissions

**Mitigation Plan:**
1. Audit privacy policy against actual data flows and ensure complete alignment
2. Ensure consent language accurately describes: (a) what data is collected, (b) how it is processed, (c) which third parties receive it, (d) for what purpose, (e) how long it is retained
3. Avoid overclaiming about assessment validity or AI capabilities
4. Document data security practices and ensure they match stated commitments

### 3.8 Multi-State Biometric Data Patchwork

**Risk Level: MODERATE (and growing)**

**Applicable Jurisdictions:** Beyond Texas and Illinois, multiple states have enacted or are enacting biometric data protections:

| State | Statute | Key Provision | Private Right of Action |
|---|---|---|---|
| Texas | TX CUBI | Consent + retention + destruction | No (AG only) |
| Illinois | IL BIPA | Written consent + retention policy | **Yes** |
| Washington | WA HB 1493 | Commercial purpose consent | No |
| Colorado | CPA (biometric provisions) | Opt-in consent for sensitive data | No |
| Connecticut | CTDPA (biometric provisions) | Consent for sensitive data processing | No |
| Montana | MCDPA (biometric provisions) | Consent for sensitive data processing | No |
| Oregon | OCPA (biometric provisions) | Consent for sensitive data processing | No |
| Virginia | VCDPA (biometric provisions) | Consent for sensitive data processing | No |

**Trend:** The direction of state legislation is toward more biometric protections, not fewer. Several states have pending bills modeled on IL BIPA with private rights of action.

**Mitigation Strategy:**
- Comply with the most restrictive applicable statute (IL BIPA)
- BIPA-compliant consent and retention practices will satisfy all current state biometric laws
- Monitor legislative developments quarterly

---

## 4. Risk Matrix

| Law / Regulation | Applies to BQ? | Severity (per violation) | Likelihood of Enforcement | Mitigation Status |
|---|---|---|---|---|
| TX CUBI | **Yes** -- video/audio = biometric identifiers | High ($25K/violation, AG) | Moderate -- AG has been active | **Not yet mitigated** -- needs consent gate + retention policy |
| IL BIPA | **Yes** -- if any IL resident uses BQ | Critical ($1K-$5K/person, private action) | High -- active class action bar | **Not yet mitigated** -- needs written consent + retention policy |
| COPPA | **No** (with current design) | High ($50K+/violation, FTC) | Low -- no actual knowledge trigger | **Partially mitigated** -- T&C age floor in place; needs privacy policy statement |
| FERPA | **Not yet** -- applies post-enrollment | Moderate (loss of federal funding) | Low (current), Moderate (future) | **Not yet mitigated** -- needs governance transition plan |
| TX TDPSA | **Likely exempt** (higher ed) | Moderate ($7.5K/violation, AG) | Low | **Low priority** -- exemption + no-sale posture |
| CCPA/CPRA | **Likely exempt** (nonprofit) | Moderate ($2.5K-$7.5K/violation) | Low | **Low priority** -- exemption + no-sale posture |
| FTC Section 5 | **Yes** | High (varies, injunctive + fines) | Moderate -- AI enforcement increasing | **Partially mitigated** -- needs privacy policy audit |
| Multi-state biometric | **Yes** (web-accessible) | Varies by state | Growing | **Not yet mitigated** -- BIPA compliance covers all |

---

## 5. Third-Party AI Processing Risks

### 5.1 Data Processing Agreements (DPAs)

Each AI service provider that receives BQ user data must have an executed Data Processing Agreement that addresses:

- **Purpose limitation:** Data may only be used for the specific processing purpose (transcription, scoring, video analysis) and not for model training, product improvement, or any other purpose
- **No-training clauses:** Explicit contractual prohibition on using BQ data to train, fine-tune, or improve the provider's models
- **Data retention by processor:** Provider must delete data within a specified period after processing (ideally immediately upon returning results)
- **Sub-processor disclosure:** Provider must disclose any sub-processors and obtain ACU's consent before engaging new ones
- **Audit rights:** ACU must have the right to audit provider's compliance with the DPA
- **Breach notification:** Provider must notify ACU within a specified timeframe (e.g., 72 hours) of any data breach affecting BQ data
- **Data return/deletion:** Upon termination, provider must return or destroy all BQ data and certify destruction

**Provider-Specific Considerations:**

| Provider | DPA Available? | No-Training Default? | Notes |
|---|---|---|---|
| OpenAI (API) | Yes (standard DPA) | Yes -- API data not used for training by default (since March 2023) | Must use API (not ChatGPT consumer). Verify DPA covers Whisper + GPT endpoints. |
| Google Gemini Studio | Yes (Google Cloud DPA) | Depends on tier/agreement | Must confirm Gemini Studio API terms vs. consumer Gemini terms. Enterprise/API tier should include no-training provisions. |
| Supabase | Yes (standard DPA) | N/A (storage, not AI processing) | Standard cloud DPA. Confirm data residency. |

### 5.2 Data Residency and Cross-Border Transfer

- All current providers store and process data in the United States
- If any provider routes data through non-US infrastructure, additional transfer mechanism requirements may apply (e.g., Standard Contractual Clauses for EU data, though EU residents are not a primary user base)
- Monitor provider infrastructure changes that could affect data residency

### 5.3 AI-Specific Risks

- **Model output liability:** AI-generated scores influence admissions decisions. If scoring is biased or inaccurate, ACU bears responsibility for reliance on those scores, not the AI provider.
- **Prompt injection / adversarial inputs:** Video or audio could be crafted to manipulate AI scoring. This is an integrity risk, not a legal risk per se, but could create liability if it produces discriminatory outcomes.
- **Provider discontinuation:** If OpenAI or Google discontinues the specific API or changes terms, BQ must have a migration path that includes data portability and deletion at the prior provider.

---

## 6. Recommendations for ACU

### 6.1 Immediate (Before Public Launch)

1. **Engage a Texas education and privacy attorney** to review all consent language, the privacy policy, and Terms of Service. The attorney should have specific experience with TX CUBI and IL BIPA compliance in the education technology context.

2. **Execute Data Processing Agreements** with all AI service providers (OpenAI, Google) that include explicit no-training clauses, purpose limitation, breach notification, and audit rights. Do not launch with default API terms alone.

3. **Implement biometric consent flow** in the application -- a standalone consent gate before any video recording begins, with:
   - Clear disclosure of biometric identifiers collected (facial geometry, voiceprint)
   - Named third-party processors (OpenAI, Google)
   - Specific purpose (psychometric assessment scoring)
   - Retention period (1 year)
   - Stored consent record (timestamp, IP, consent text version, user identifier)

4. **Publish a biometric data retention and destruction policy** on the public website, accessible from the privacy policy, specifying:
   - What biometric data is collected
   - Purpose of collection
   - Retention period (1 year after assessment completion)
   - Destruction method and schedule
   - How to request early deletion

### 6.2 Near-Term (Within 6 Months of Launch)

5. **Plan FERPA data governance transition** for BQ participants who matriculate at ACU. Coordinate with the registrar's office to define when and how BQ assessment data is reclassified as education records.

6. **Establish a data breach incident response plan** specifically covering biometric data. This should include:
   - Breach detection and classification procedures
   - Notification timelines (TX CUBI has no specific timeline, but best practice is 60 days; IL BIPA litigation suggests prompt notification)
   - Notification recipients (affected individuals, TX AG if applicable, other state regulators)
   - Remediation steps

7. **Conduct a privacy policy audit** to ensure all disclosures match actual data flows, AI processing, and third-party transmissions. The FTC evaluates the gap between stated and actual practices.

### 6.3 Ongoing

8. **Establish an annual compliance review cadence** that includes:
   - Review of all DPAs for continued adequacy
   - Audit of data retention and destruction practices
   - Review of state biometric legislation changes
   - Assessment of AI provider terms and policy changes
   - Verification that consent text matches current data practices

9. **Consider cyber insurance** that specifically covers biometric data claims. Standard cyber policies may exclude biometric data liability. Obtain a policy that explicitly covers:
   - IL BIPA class action defense and settlement costs
   - TX CUBI enforcement action defense
   - Regulatory investigation costs
   - Data breach notification and remediation costs

10. **Monitor the regulatory landscape** for:
    - New state biometric laws (especially those with private rights of action)
    - FTC rulemaking on AI and biometric data
    - Department of Education guidance on AI in admissions
    - Evolving case law on what constitutes "biometric information" in the context of AI video processing

---

## 7. Disclaimer

This document is a **compliance engineering assessment** prepared to identify legal risk areas and inform technical and operational decision-making for the Builders Quotient platform. It is **not legal advice** and does not establish an attorney-client relationship.

ACU should engage qualified legal counsel -- specifically a Texas-licensed attorney with experience in education law, data privacy, and biometric data compliance -- to review this assessment, validate its conclusions, and draft legally binding consent language, privacy policies, and data processing agreements.

The legal landscape for biometric data, AI processing, and education technology is evolving rapidly. Statutes, regulations, enforcement priorities, and case law may change in ways that alter the risk analysis presented here. This document reflects the regulatory environment as of February 2026 and should be updated at least annually or whenever a material change occurs in BQ's data practices, applicable law, or regulatory guidance.

---

*Document version 1.0 -- 2026-02-25*
