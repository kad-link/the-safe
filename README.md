# vault-68: Sovereign Citizen Document Repository

**vault-68** is a secure, personal digital document vault designed to empower citizens with sovereign control, privacy, and instant access to their official legal credentials. Inspired by modern citizen locker systems, vault-68 allows users to store, view, verify, and export official government records—such as national identity cards, tax credentials, driver's licences, and academic certificates—all within an intuitive, privacy-first interface.

---

## What vault-68 Does (User Perspective & Functional Capabilities)

### 1. Dual-State Privacy: Public Glimpse vs. Authenticated Vault
* **Public Glimpse Mode**: When you first open vault-68 or when you are not logged in, sensitive document identifiers (such as your 12-digit Aadhaar number, PAN code, or driving licence number) are automatically concealed behind cryptographic masks. This prevents shoulder-surfing, data scraping, and accidental exposure in public environments.
* **Instant Decryption Upon Sign-In**: Once authenticated, the vault transitions into your private citizen repository, unmasking all personal identifiers and unlocking full export privileges.

### 2. Passwordless Email OTP Authentication
* **No Passwords to Remember or Leak**: vault-68 eliminates static passwords. You never have to create, remember, or reset complex passwords that could be vulnerable to data breaches.
* **Direct Inbox Verification**: Simply enter your registered email address. A confidential 6-digit verification code is dispatched straight to your private email inbox.
* **Zero-Leakage Privacy**: The sent verification code is strictly confidential and delivered only to your inbox—it is never shown on the screen or in preview banners, protecting your access from anyone looking over your shoulder.
* **Quick Sign-Up for New Citizens**: New citizens can register in seconds by providing their full legal name and email address.

### 3. Interactive Legal Credential Inspection
* **Comprehensive Credential Profiles**: Clicking **Inspect** on any document opens a dedicated examination modal displaying official issuing metadata.
* **Rich Verification Metadata**: Review document-specific data points such as:
  * Official Issuing Body (e.g., UIDAI, Income Tax Department, Ministry of Road Transport, CBSE)
  * Registered Holder Full Legal Name
  * Date of Birth (DOB) and Residential Records
  * Vehicle Authorisation Categories (e.g., MCWG, LMV-NT)
  * Examination Marks, Academic Percentiles, and Passing Status
* **Authenticity Indicators**: Clear visual indicators verify that the credential has been authenticated by the appropriate governmental authority.

### 4. Official Document Export
* **Downloadable Legal Records**: Citizens can instantly export and download standardized legal digital text copies of any credential with a single click.
* **Offline Readiness**: Exported documents contain the issuing body, holder information, verification status, and record timestamps—ready to be printed, attached to employment applications, or presented during official administrative procedures.

### 5. Document Ingestion (Seal New Documents into the Vault)
* **Custom Document Upload**: Citizens can add and secure additional legal documents beyond standard identity cards.
* **User-Defined Details**: Specify the document title (e.g., Passport, Property Deed, Health Insurance Policy), the issuing authority, and the registration or serial number.
* **Instant Protection**: Newly ingested documents are sealed immediately into your active vault session and can be inspected or exported like any pre-configured credential.

### 6. Real-Time Document Search and Filtering
* **Instant Keyword Filtering**: Quickly locate specific documents among dozens of stored credentials.
* **Multi-Field Search**: Filter seamlessly by document title (e.g., *"Driving License"*), short code (e.g., *"PAN"*), or issuing authority (e.g., *"Ministry of Road Transport"*).

### 7. Instant One-Click Vault Lock
* **Rapid Session Sealing**: When you finish viewing or exporting your documents, click **Lock Vault** to instantly re-seal your repository.
* **Zero Residual Exposure**: Locking the vault immediately re-applies the cryptographic masks over all document numbers and returns the screen to public glimpse mode.

---

## User Journey & Workflow Summary

```mermaid
flowchart TD
    A[Citizen visits vault-68] --> B[Public Glimpse Mode: Document Numbers Masked]
    B --> C{Action}
    C -->|Search / Explore| B
    C -->|Authenticate| D[Open Citizen Login / Sign-Up Modal]
    D --> E[Enter Registered Email Address]
    E --> F[6-Digit One-Time Code Dispatched to Private Inbox]
    F --> G[Citizen Enters 6-Digit Code in Vault Modal]
    G -->|Incorrect Code| H[Alert: Remaining Attempts Shown]
    H --> G
    G -->|Valid Code| I[Vault Unlocked: Unmasked Credentials]
    I --> J[Inspect Full Credential Details]
    I --> K[Export & Download Official Digital Copies]
    I --> L[Ingest New Government Documents]
    I --> M[Click 'Lock Vault'] --> B
```

---

## Key Privacy and Usability Guarantees

| Feature | Citizen Benefit |
| :--- | :--- |
| **Masked Public View** | Protects your personal data from prying eyes in public spaces, offices, or shared computers. |
| **Passwordless Login** | Eliminates weak, reused, or forgotten passwords; access is tied securely to your verified email. |
| **Confidential Code Delivery** | Verification codes are delivered directly to your inbox and never exposed in the browser interface. |
| **Instant Export** | Provides portable, offline-accessible digital credentials whenever official proof is required. |
| **One-Click Sealing** | Ensures you can leave your workstation without leaving sensitive identity documents unmasked. |
