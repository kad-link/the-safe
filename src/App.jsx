import React, { useState, useEffect, useRef } from 'react';
import './y2k.css';

// Flagship Government Documents Dataset
const GOVT_DOCUMENTS = [
  {
    id: "GOV-IN-UIDAI-01",
    title: "AADHAAR CARD (UIDAI)",
    shortCode: "AADHAAR",
    issuer: "Unique Identification Authority of India (UIDAI)",
    docType: "National Citizen Identity",
    maskedNumber: "XXXX XXXX 9042",
    unmaskedNumber: "4819 8842 9042",
    holder: "ALEXANDER VANCE",
    dob: "1998-05-14",
    gender: "MALE",
    address: "24 Cybernetics Boulevard, Sector 4, New Delhi 110001",
    status: "UIDAI VERIFIED",
    colorTheme: "cyan",
    desc: "12-digit biometric identity card with tamper-proof holographic QR and encrypted demographic payload."
  },
  {
    id: "GOV-IN-ITD-02",
    title: "PAN CARD (PERMANENT ACCOUNT NUMBER)",
    shortCode: "PAN",
    issuer: "Income Tax Department, Govt of India",
    docType: "Financial & Tax Identity",
    maskedNumber: "ABCDE****F",
    unmaskedNumber: "ABCDE1234F",
    holder: "ALEXANDER VANCE",
    dob: "1998-05-14",
    fatherName: "VICTOR VANCE",
    status: "ITD VALIDATED",
    colorTheme: "pink",
    desc: "Official laminated permanent account identifier issued by the Income Tax Department for sovereign compliance."
  },
  {
    id: "GOV-IN-MORTH-03",
    title: "MOTOR DRIVING LICENSE (DL)",
    shortCode: "DRIVING LICENCE",
    issuer: "Ministry of Road Transport & Highways (MoRTH)",
    docType: "Motor Vehicle Operation Authority",
    maskedNumber: "DL-14-2020-XXXXXXX",
    unmaskedNumber: "DL-14-2020-8812941",
    holder: "ALEXANDER VANCE",
    vehicleClass: "MCWG / LMV (PRIVATE)",
    validity: "2040-05-13",
    status: "MoRTH ACTIVE",
    colorTheme: "lime",
    desc: "Digital smart card driving licence compliant with Sarathi 4.0 database and biometric chip parameters."
  },
  {
    id: "GOV-IN-VAHAN-04",
    title: "VEHICLE REGISTRATION CERTIFICATE (RC)",
    shortCode: "VEHICLE RC",
    issuer: "Central Vehicle Repository: MoRTH",
    docType: "Registration Certificate (RC)",
    maskedNumber: "DL-01-XXXX-9901",
    unmaskedNumber: "DL-01-CYBER-2026",
    holder: "Alexander Vance",
    vehicleModel: "TESLA CYBERTRUCK: BEV AESTHETIC",
    chassis: "MA1XX88492019488",
    status: "RC ACTIVE",
    colorTheme: "cyan",
    desc: "Digital Certificate of Registration issued under Central Motor Vehicles Rules 1989 with cryptographic endorsement."
  },
  {
    id: "GOV-IN-CBSE-05",
    title: "CLASS XII SENIOR SECONDARY MARKSHEET",
    shortCode: "EDUCATION",
    issuer: "Central Board of Secondary Education (CBSE)",
    docType: "Academic Credential",
    maskedNumber: "2020-CBSE-XXXX98",
    unmaskedNumber: "2020-CBSE-884998",
    holder: "ALEXANDER VANCE",
    score: "94.6% AGGREGATE (DISTINCTION)",
    status: "CBSE SIGNED",
    colorTheme: "lime",
    desc: "Tamper-evident senior school certificate examination marksheet verified through CBSE Parinam Manjusha ledger."
  }
];

// Core Platform Services Dataset
const PLATFORM_SERVICES = [
  {
    id: "SRV-01",
    title: "GOV-LINKED INGESTION",
    tag: "DIRECT API SYNC",
    accent: "#00E5FF",
    desc: "One-click synchronization with UIDAI (Aadhaar), Income Tax Dept (PAN), MoRTH (Driving Licence), and CBSE for legal digital originals."
  },
  {
    id: "SRV-02",
    title: "ZERO-KNOWLEDGE VAULT",
    tag: "AIR-GAPPED CIPHER",
    accent: "#FF1493",
    desc: "Military-grade AES-256-GCM client-side encryption. Neither server admins nor third parties can decrypt your credentials."
  },
  {
    id: "SRV-03",
    title: "TAMPER-PROOF QR VERIFY",
    tag: "INSTANT LEGAL PROOF",
    accent: "#AAFF00",
    desc: "Generate offline-verifiable cryptographically signed QR codes for instant verification at airports, traffic stops, and banks."
  },
  {
    id: "SRV-04",
    title: "EXPIRING SECURE SHARE",
    tag: "CONTROLLED DISCLOSURE",
    accent: "#00E5FF",
    desc: "Share encrypted, time-limited download links with employers or institutions with automatic expiration and revoke controls."
  }
];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [citizenProfile, setCitizenProfile] = useState({
    name: "ALEXANDER VANCE",
    email: "alexander.vance@vault-68.gov"
  });
  const [documents, setDocuments] = useState(GOVT_DOCUMENTS);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);

  // Authentication State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [authStep, setAuthStep] = useState('email'); // 'email' | 'otp' | 'verifying' | 'success'
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [userOtp, setUserOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendDebugInfo, setResendDebugInfo] = useState(null);

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newIssuer, setNewIssuer] = useState('Ministry of Electronics & IT');
  const [newNumber, setNewNumber] = useState('');

  // Refs for 6-box OTP inputs
  const otpInputRefs = useRef([]);

  // Countdown timer effect
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Trigger OTP Send via FastAPI + Resend email endpoint
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = emailInput.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setOtpError('PLEASE ENTER A VALID CITIZEN EMAIL ADDRESS.');
      return;
    }
    if (authMode === 'signup' && !nameInput.trim()) {
      setOtpError('PLEASE ENTER YOUR FULL LEGAL NAME FOR REGISTRATION.');
      return;
    }

    setOtpError('');
    setIsSubmitting(true);

    try {
      // Call real Python FastAPI backend with Resend integration
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          name: authMode === 'signup' ? nameInput.trim() : undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setOtpError(data.detail || 'RESEND GATEWAY ERROR: Could not dispatch OTP.');
        setIsSubmitting(false);
        return;
      }

      // Move to OTP step - code is dispatched to user's email via Resend
      // THE FRONTEND DOES NOT DISPLAY OR STORE THE SENT OTP
      setUserOtp(['', '', '', '', '', '']);
      setResendTimer(data.expires_in || 300);
      setAuthStep('otp');

      showToast(`✦ VERIFICATION EMAIL DISPATCHED TO ${cleanEmail} [CHECK INBOX] ✦`);

      // Auto-focus first input
      setTimeout(() => {
        if (otpInputRefs.current[0]) {
          otpInputRefs.current[0].focus();
        }
      }, 100);
    } catch (err) {
      setOtpError('NETWORK ERROR: Unable to contact OTP authentication server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle OTP digit change and auto-advance
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...userOtp];
    newOtp[index] = value.slice(-1);
    setUserOtp(newOtp);
    setOtpError('');

    // Advance to next box if digit entered
    if (value && index < 5 && otpInputRefs.current[index + 1]) {
      otpInputRefs.current[index + 1].focus();
    }
  };

  // Handle backspace navigation in OTP boxes
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !userOtp[index] && index > 0 && otpInputRefs.current[index - 1]) {
      otpInputRefs.current[index - 1].focus();
    }
  };

  // Verify OTP submission via FastAPI + Resend endpoint
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const enteredCode = userOtp.join('').trim();

    if (enteredCode.length < 6) {
      setOtpError('PLEASE ENTER ALL 6 DIGITS OF THE VERIFICATION CODE.');
      return;
    }

    setOtpError('');
    setAuthStep('verifying');
    const cleanEmail = emailInput.trim().toLowerCase();

    try {
      // Call real Python FastAPI backend with verification
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          otp: enteredCode
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setAuthStep('otp');
        setOtpError(data.detail || 'INVALID OR EXPIRED VERIFICATION CODE. PLEASE RETRY.');
        return;
      }

      // Successful verification
      setAuthStep('success');
      setTimeout(() => {
        const citizen = {
          name: data.citizen?.name || (authMode === 'signup' ? nameInput.toUpperCase() : "ALEXANDER VANCE"),
          email: cleanEmail || "alexander.vance@vault-68.gov"
        };
        setCitizenProfile(citizen);
        setIsAuthenticated(true);
        setIsAuthModalOpen(false);
        setAuthStep('email');
        setUserOtp(['', '', '', '', '', '']);
        setEmailInput('');
        setNameInput('');
        showToast(`✦ AUTHENTICATED: WELCOME ${citizen.name} ✦`);
      }, 700);
    } catch (err) {
      setAuthStep('otp');
      setOtpError('NETWORK ERROR: Unable to verify OTP with server.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    showToast('✦ VAULT SEALED: YOU ARE NOW IN PUBLIC PREVIEW MODE ✦');
  };

  const handleUploadDoc = (e) => {
    e.preventDefault();
    if (!newTitle) return;

    const newDoc = {
      id: `GOV-USER-${documents.length + 1}`,
      title: newTitle.toUpperCase(),
      shortCode: "CITIZEN DOC",
      issuer: newIssuer,
      docType: "Citizen Verified Upload",
      maskedNumber: "XXXX-USER-REC",
      unmaskedNumber: newNumber || "CITIZEN-9912-REC",
      holder: citizenProfile.name,
      status: "AUTHENTICATED",
      colorTheme: "cyan",
      desc: "User-submitted citizen document sealed onto sovereign storage."
    };

    setDocuments([newDoc, ...documents]);
    setIsUploadOpen(false);
    setNewTitle('');
    setNewNumber('');
    showToast(`✦ "${newDoc.title}" SECURED IN VAULT-68 ✦`);
  };

  const handleExport = (doc) => {
    showToast(`✦ EXPORTING DIGITAL LEGAL COPY: ${doc.title} ✦`);
    const element = document.createElement('a');
    const file = new Blob([
      `=== VAULT-68: OFFICIAL CITIZEN DIGITAL CREDENTIAL ===\n` +
      `ISSUING BODY: ${doc.issuer}\n` +
      `DOCUMENT: ${doc.title}\n` +
      `RECORD NUMBER: ${isAuthenticated ? doc.unmaskedNumber : doc.maskedNumber}\n` +
      `HOLDER: ${doc.holder}\n` +
      `VALIDATION: ${doc.status}\n` +
      `CIPHER: AES-256-GCM / RESEND OTP AUTHENTICATED\n`
    ], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${doc.shortCode.toLowerCase()}_vault_68.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const filteredDocuments = documents.filter(doc => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return doc.title.toLowerCase().includes(q) ||
           doc.issuer.toLowerCase().includes(q) ||
           doc.shortCode.toLowerCase().includes(q);
  });

  return (
    <div style={{ backgroundColor: '#0A0A0A', minHeight: '100vh', position: 'relative' }}>
      {/* Scattered CSS ✦ Sparkles */}
      <div className="sparkle-container">
        <span className="sparkle-star sparkle-cyan" style={{ top: '35px', left: '5%' }}>✦</span>
        <span className="sparkle-star sparkle-pink" style={{ top: '110px', left: '14%', fontSize: '24px', animationDelay: '0.8s' }}>✦</span>
        <span className="sparkle-star sparkle-lime" style={{ top: '170px', right: '12%', fontSize: '18px', animationDelay: '1.4s' }}>✦</span>
        <span className="sparkle-star sparkle-cyan" style={{ top: '480px', left: '8%', fontSize: '22px', animationDelay: '2.1s' }}>✦</span>
        <span className="sparkle-star sparkle-pink" style={{ top: '750px', right: '7%', fontSize: '20px', animationDelay: '1.2s' }}>✦</span>
        <span className="sparkle-star sparkle-lime" style={{ top: '1050px', left: '16%', fontSize: '26px', animationDelay: '1.7s' }}>✦</span>
      </div>





      {/* =====================================================================
          HEADER / NAVBAR: BRAND "vault-68"
          ===================================================================== */}
      <header style={{
        padding: '20px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        position: 'relative',
        zIndex: 10,
        background: 'rgba(10, 10, 10, 0.9)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(0, 229, 255, 0.25)'
      }}>
        {/* Brand Name: vault-68 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #FF1493, #00E5FF)',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: '22px',
            color: '#0A0A0A',
            boxShadow: '0 0 18px rgba(0, 229, 255, 0.8)'
          }}>
            ✦
          </div>
          <div>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '36px',
              letterSpacing: '2px',
              color: '#FFFFFF'
            }}>
              vault-68
            </span>
            <div style={{ fontSize: '10px', letterSpacing: '2px', color: '#00E5FF', fontWeight: 700 }}>
              CITIZEN DOCUMENT STORAGE: RESEND SECURED
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          <a href="#services" className="neon-nav-link">
            SERVICES
          </a>
          <a href="#documents" className="neon-nav-link">
            GOVT DOCUMENTS
          </a>
          <a href="#security" className="neon-nav-link">
            SECURITY SPEC
          </a>
        </nav>

        {/* Authentication Button / User Profile */}
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="y2k-badge badge-lime" style={{ fontSize: '12px', padding: '6px 12px' }}>
                ● CITIZEN: {citizenProfile.name}
              </span>
              <button
                onClick={handleLogout}
                className="y2k-btn y2k-btn-pink"
                style={{ fontSize: '16px', padding: '8px 16px' }}
              >
                LOCK VAULT
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => { setAuthMode('login'); setAuthStep('email'); setIsAuthModalOpen(true); }}
                className="y2k-btn y2k-btn-pink"
                style={{ fontWeight: 800, fontSize: '17px' }}
              >
                ✦ CITIZEN LOGIN
              </button>
              <button
                onClick={() => { setAuthMode('signup'); setAuthStep('email'); setIsAuthModalOpen(true); }}
                className="y2k-btn"
                style={{ fontWeight: 800, fontSize: '17px' }}
              >
                SIGN UP
              </button>
            </div>
          )}
        </div>
      </header>

      {/* =====================================================================
          HERO SECTION: VAULT-68
          ===================================================================== */}
      <section style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '50px 24px 20px 24px',
        position: 'relative',
        zIndex: 5,
        textAlign: 'center'
      }}>
        <div style={{ display: 'inline-flex', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
          <span className="y2k-badge badge-cyan">✦ VAULT-68 OFFICIAL PROTOCOL</span>
          <span className="y2k-badge badge-lime">RESEND EMAIL OTP ACTIVE</span>
          <span className="y2k-badge badge-pink">DIGILOCKER COMPLIANT</span>
        </div>

        {/* Chrome Metallic Gradient Headline */}
        <h1 className="chrome-headline" style={{ margin: '0 auto 16px auto' }}>
          VAULT-68: OFFICIAL CITIZEN VAULT
        </h1>

        <p style={{
          fontSize: '16px',
          color: '#CBD5E1',
          maxWidth: '760px',
          margin: '0 auto 28px auto',
          lineHeight: '1.7'
        }}>
          A single sovereign vault to store, verify, and present official citizen credentials.
          Unless authenticated via <strong>Resend</strong> email verification, sensitive document identifiers remain masked and air-gapped from public exposure.
        </p>

        {/* Hero Actions */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '32px' }}>
          {isAuthenticated ? (
            <button
              onClick={() => setIsUploadOpen(true)}
              className="y2k-btn y2k-btn-lime"
              style={{ fontSize: '18px', padding: '12px 28px', fontWeight: 800 }}
            >
              + INGEST NEW CITIZEN DOCUMENT
            </button>
          ) : (
            <button
              onClick={() => { setAuthMode('login'); setAuthStep('email'); setIsAuthModalOpen(true); }}
              className="y2k-btn y2k-btn-pink"
              style={{ fontSize: '18px', padding: '12px 28px', fontWeight: 800 }}
            >
              ✦ LOGIN VIA EMAIL OTP TO UNLOCK
            </button>
          )}
          <a
            href="#documents"
            className="y2k-btn"
            style={{ fontSize: '18px', padding: '12px 28px' }}
          >
            VIEW GOVT DOCUMENTS GLIMPSE ↓
          </a>
        </div>
      </section>

      {/* Bright Gradient Divider */}
      <div className="gradient-divider" style={{ maxWidth: '1240px', margin: '30px auto' }}></div>

      {/* =====================================================================
          SERVICES GLIMPSE SECTION
          ===================================================================== */}
      <section id="services" style={{ maxWidth: '1240px', margin: '0 auto', padding: '20px 24px 40px 24px', position: 'relative', zIndex: 5 }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <span className="y2k-badge badge-lime" style={{ marginBottom: '10px' }}>CORE PLATFORM SERVICES</span>
          <h2 style={{ fontSize: '42px', color: '#FFFFFF', letterSpacing: '1.5px' }}>
            WHAT VAULT-68 OFFERS CITIZENS
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '14px', maxWidth: '620px', margin: '8px auto 0 auto' }}>
            Explore the sovereign document storage and verification services available on vault-68 platform.
          </p>
        </div>

        {/* 4 Service Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '20px'
        }}>
          {PLATFORM_SERVICES.map(srv => (
            <div key={srv.id} className="service-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '11px', color: srv.accent, fontWeight: 700, letterSpacing: '1px' }}>
                  ✦ {srv.tag}
                </span>
                <span style={{ fontSize: '12px', color: '#64748B', fontFamily: 'var(--font-heading)' }}>
                  {srv.id}
                </span>
              </div>
              <h3 style={{ fontSize: '24px', color: '#FFFFFF', marginBottom: '10px', letterSpacing: '1px' }}>
                {srv.title}
              </h3>
              <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.6' }}>
                {srv.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Bright Gradient Divider */}
      <div className="gradient-divider" style={{ maxWidth: '1240px', margin: '40px auto' }}></div>

      {/* =====================================================================
          GOVERNMENT DOCUMENTS SECTION: SHOWING FEW GOVT DOCUMENTS UNLESS AUTHENTICATED
          ===================================================================== */}
      <section id="documents" style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 24px 60px 24px', position: 'relative', zIndex: 5 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px'
        }}>
          <div>
            <span className="y2k-badge badge-cyan" style={{ marginBottom: '8px' }}>
              {isAuthenticated ? 'AUTHENTICATED CITIZEN VAULT' : 'PREVIEW GLIMPSE MODE'}
            </span>
            <h2 style={{ fontSize: '38px', color: '#FFFFFF', letterSpacing: '1.5px' }}>
              GOVERNMENT CITIZEN DOCUMENTS
            </h2>
            <p style={{ fontSize: '13px', color: '#94A3B8' }}>
              {isAuthenticated 
                ? `Credentials unmasked for citizen ${citizenProfile.name}. Full export & verification privileges active.` 
                : 'Showing representative government documents (Driving License, PAN Card, Aadhaar Card). Authenticate via Resend email OTP to decrypt your personal originals.'}
            </p>
          </div>

          {/* Quick Filter Search */}
          <div style={{ minWidth: '280px', flex: '1', maxWidth: '380px' }}>
            <input
              type="text"
              className="y2k-input"
              placeholder="SEARCH BY DOCUMENT OR ISSUING BODY..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Warning Banner if Unauthenticated */}
        {!isAuthenticated && (
          <div className="lock-banner">
            <div>
              <div style={{ fontWeight: 800, color: '#FF1493', fontSize: '13px', textTransform: 'uppercase' }}>
                [!] PUBLIC GLIMPSE: CITIZEN NOT AUTHENTICATED
              </div>
              <div style={{ fontSize: '12px', color: '#E2E8F0', marginTop: '2px' }}>
                Aadhaar, PAN, and Driving License numbers are masked with SHA-256 locks. Log in or Sign up with your email to unlock your verified credentials via Resend.
              </div>
            </div>
            <button
              onClick={() => { setAuthMode('login'); setAuthStep('email'); setIsAuthModalOpen(true); }}
              className="y2k-btn y2k-btn-pink"
              style={{ fontSize: '15px', padding: '6px 16px', flexShrink: 0 }}
            >
              LOGIN WITH EMAIL OTP
            </button>
          </div>
        )}

        {/* Grid of Government Document Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '24px'
        }}>
          {filteredDocuments.map(doc => {
            const badgeClass = doc.colorTheme === 'pink' ? 'badge-pink' : doc.colorTheme === 'lime' ? 'badge-lime' : 'badge-cyan';
            const btnClass = doc.colorTheme === 'pink' ? 'y2k-btn-pink' : doc.colorTheme === 'lime' ? 'y2k-btn-lime' : '';

            return (
              <div key={doc.id} className="y2k-card">
                <div>
                  {/* Top Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span className={`y2k-badge ${badgeClass}`}>✦ {doc.shortCode}</span>
                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>{doc.status}</span>
                  </div>

                  {/* Document Title */}
                  <h3 style={{ fontSize: '24px', color: '#FFFFFF', marginBottom: '6px', letterSpacing: '1px' }}>
                    {doc.title}
                  </h3>
                  <div style={{ fontSize: '11px', color: '#00E5FF', marginBottom: '14px', fontWeight: 700 }}>
                    ISSUER: {doc.issuer}
                  </div>

                  {/* Document Number Display (Masked vs Unmasked) */}
                  <div style={{
                    background: isAuthenticated ? 'rgba(0, 229, 255, 0.08)' : 'rgba(255, 20, 147, 0.08)',
                    border: `1px solid ${isAuthenticated ? '#00E5FF' : '#FF1493'}`,
                    padding: '12px',
                    borderRadius: '6px',
                    marginBottom: '14px',
                    fontFamily: 'var(--font-body)',
                    fontSize: '13px'
                  }}>
                    <div style={{ fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase' }}>
                      {doc.docType} NUMBER:
                    </div>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: isAuthenticated ? '#AAFF00' : '#FFFFFF',
                      letterSpacing: '1px',
                      marginTop: '4px'
                    }}>
                      {isAuthenticated ? doc.unmaskedNumber : doc.maskedNumber}
                    </div>
                    {!isAuthenticated && (
                      <div style={{ fontSize: '10px', color: '#FF1493', marginTop: '4px' }}>
                        🔒 ENCRYPTED • LOGIN VIA EMAIL OTP TO UNMASK
                      </div>
                    )}
                  </div>

                  {/* Citizen Metadata */}
                  <div style={{ fontSize: '12px', color: '#CBD5E1', marginBottom: '14px', lineHeight: '1.6' }}>
                    <div><strong>REGISTERED CITIZEN:</strong> {isAuthenticated ? citizenProfile.name : doc.holder}</div>
                    {doc.dob && <div><strong>DOB:</strong> {doc.dob}</div>}
                    {doc.vehicleClass && <div><strong>VEHICLE CLASS:</strong> {doc.vehicleClass}</div>}
                    {doc.score && <div><strong>RESULT:</strong> {doc.score}</div>}
                  </div>

                  <p style={{ fontSize: '12px', color: '#94A3B8', lineHeight: '1.5', marginBottom: '18px' }}>
                    {doc.desc}
                  </p>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  {isAuthenticated ? (
                    <>
                      <button
                        onClick={() => setSelectedDoc(doc)}
                        className={`y2k-btn ${btnClass}`}
                        style={{ flex: '1', fontSize: '16px', padding: '8px 12px' }}
                      >
                        ✦ INSPECT
                      </button>
                      <button
                        onClick={() => handleExport(doc)}
                        className="y2k-btn"
                        style={{ fontSize: '16px', padding: '8px 14px' }}
                        title="Download Legal Document"
                      >
                        EXPORT
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => { setAuthMode('login'); setAuthStep('email'); setIsAuthModalOpen(true); }}
                      className="y2k-btn y2k-btn-pink"
                      style={{ width: '100%', fontSize: '16px', padding: '10px 14px' }}
                    >
                      ✦ AUTHENTICATE TO UNLOCK
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bright Gradient Divider */}
      <div className="gradient-divider" style={{ maxWidth: '1240px', margin: '40px auto' }}></div>

      {/* =====================================================================
          FOOTER: vault-68
          ===================================================================== */}
      <footer style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '0 24px 50px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        fontSize: '12px',
        color: '#94A3B8'
      }}>
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', color: '#FFFFFF', letterSpacing: '1.5px' }}>
            vault-68: CITIZEN REPOSITORY GATEWAY
          </div>
          <div>Citizen OTP authentication powered by Resend email verification service.</div>
        </div>
        <div style={{ display: 'flex', gap: '16px', color: '#00E5FF', fontWeight: 700 }}>
          <span>✦ AADHAAR</span>
          <span>✦ PAN</span>
          <span>✦ DRIVING LICENCE</span>
          <span>✦ RESEND</span>
        </div>
      </footer>

      {/* =====================================================================
          EMAIL AUTHENTICATION MODAL (POWERED BY RESEND)
          ===================================================================== */}
      {isAuthModalOpen && (
        <div className="y2k-modal-overlay" onClick={() => setIsAuthModalOpen(false)}>
          <div className="y2k-modal" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(90deg, #FF1493, #00E5FF)',
              padding: '14px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: '#0A0A0A'
            }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', letterSpacing: '1px', fontWeight: 900 }}>
                ✦ {authMode === 'login' ? 'CITIZEN LOGIN' : 'NEW CITIZEN SIGN UP'}: vault-68
              </span>
              <button
                onClick={() => setIsAuthModalOpen(false)}
                style={{
                  background: '#0A0A0A',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '4px 10px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  borderRadius: '3px'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Tab Switcher between Login & Sign Up (when in email step) */}
              {authStep === 'email' && (
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.15)', paddingBottom: '12px', gap: '12px' }}>
                  <button
                    onClick={() => { setAuthMode('login'); setOtpError(''); }}
                    className={`y2k-btn ${authMode === 'login' ? 'y2k-btn-pink' : ''}`}
                    style={{ flex: 1, fontSize: '16px', padding: '8px 12px' }}
                  >
                    LOGIN (EXISTING)
                  </button>
                  <button
                    onClick={() => { setAuthMode('signup'); setOtpError(''); }}
                    className={`y2k-btn ${authMode === 'signup' ? 'y2k-btn-pink' : ''}`}
                    style={{ flex: 1, fontSize: '16px', padding: '8px 12px' }}
                  >
                    SIGN UP (NEW CITIZEN)
                  </button>
                </div>
              )}

              {/* STEP 1: EMAIL INPUT */}
              {authStep === 'email' && (
                <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className="y2k-badge badge-lime">RESEND POWERED</span>
                      <span className="y2k-badge badge-cyan">EMAIL OTP GATEWAY</span>
                    </div>
                    <h3 style={{ fontSize: '26px', color: '#FFFFFF', marginTop: '6px' }}>
                      {authMode === 'login' ? 'ENTER REGISTERED EMAIL ADDRESS' : 'CREATE CITIZEN VAULT ACCOUNT'}
                    </h3>
                    <p style={{ fontSize: '13px', color: '#CBD5E1', marginTop: '4px' }}>
                      A 6-digit cryptographic verification code will be dispatched to your inbox via Resend.
                    </p>
                  </div>

                  {authMode === 'signup' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#AAFF00', fontWeight: 700, marginBottom: '6px' }}>
                        FULL LEGAL CITIZEN NAME *
                      </label>
                      <input
                        type="text"
                        required
                        className="y2k-input"
                        placeholder="E.G. ALEXANDER VANCE"
                        value={nameInput}
                        onChange={e => setNameInput(e.target.value)}
                      />
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#00E5FF', fontWeight: 700, marginBottom: '6px' }}>
                      CITIZEN EMAIL ADDRESS *
                    </label>
                    <input
                      type="email"
                      required
                      className="y2k-input"
                      placeholder="alexander.vance@vault-68.gov"
                      value={emailInput}
                      onChange={e => setEmailInput(e.target.value)}
                    />
                  </div>


                  {otpError && (
                    <div style={{ color: '#FF1493', fontSize: '12px', fontWeight: 700, background: 'rgba(255, 20, 147, 0.1)', padding: '8px 12px', borderRadius: '4px', border: '1px solid #FF1493' }}>
                      [!] {otpError}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setIsAuthModalOpen(false)}
                      className="y2k-btn"
                      style={{ fontSize: '16px' }}
                    >
                      CANCEL
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="y2k-btn y2k-btn-pink"
                      style={{ fontSize: '16px', fontWeight: 800 }}
                    >
                      {isSubmitting ? 'DISPATCHING EMAIL...' : '✦ DISPATCH VERIFICATION CODE'}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2: 6-DIGIT OTP VERIFICATION */}
              {authStep === 'otp' && (
                <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <span className="y2k-badge badge-lime">OTP DISPATCHED VIA RESEND</span>
                    <h3 style={{ fontSize: '26px', color: '#FFFFFF', marginTop: '6px' }}>
                      VERIFY CITIZEN EMAIL ({emailInput})
                    </h3>
                    <p style={{ fontSize: '13px', color: '#CBD5E1', marginTop: '4px' }}>
                      Enter the 6-digit verification code delivered to your email inbox.
                    </p>
                  </div>

                  {/* 6 Box OTP Inputs */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', margin: '14px 0' }}>
                    {userOtp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={el => otpInputRefs.current[idx] = el}
                        type="text"
                        maxLength={1}
                        className="otp-input-box"
                        value={digit}
                        onChange={e => handleOtpChange(idx, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(idx, e)}
                      />
                    ))}
                  </div>

                  {/* Secure Email Delivery Notice - FRONTEND NEVER SHOWS THE CODE */}
                  <div style={{
                    background: 'rgba(0, 229, 255, 0.06)',
                    border: '1px solid rgba(0, 229, 255, 0.25)',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    lineHeight: '1.6',
                    color: '#CBD5E1'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00E5FF', fontWeight: 700, marginBottom: '4px' }}>
                      <span style={{ fontSize: '16px' }}>📧</span>
                      <span>CODE DELIVERED TO CITIZEN EMAIL: {emailInput}</span>
                    </div>
                    <div>
                      A 6-digit one-time password has been sent to your email inbox via Resend. Check your inbox (and spam folder) and enter the code to authenticate.
                    </div>
                  </div>

                  {/* Resend Timer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#94A3B8' }}>
                    <button
                      type="button"
                      onClick={() => setAuthStep('email')}
                      style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      ← Change Email Address
                    </button>

                    {resendTimer > 0 ? (
                      <span>Code expires in <strong style={{ color: '#00E5FF' }}>{resendTimer}s</strong></span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#FF1493',
                          fontWeight: 700,
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        ✦ RESEND NEW CODE
                      </button>
                    )}
                  </div>

                  {otpError && (
                    <div style={{ color: '#FF1493', fontSize: '12px', fontWeight: 700, background: 'rgba(255, 20, 147, 0.1)', padding: '8px 12px', borderRadius: '4px', border: '1px solid #FF1493' }}>
                      [!] {otpError}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setAuthStep('email')}
                      className="y2k-btn"
                      style={{ fontSize: '16px' }}
                    >
                      BACK
                    </button>
                    <button
                      type="submit"
                      className="y2k-btn y2k-btn-pink"
                      style={{ fontSize: '16px', fontWeight: 800 }}
                    >
                      ✦ VERIFY CODE & UNLOCK
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: VERIFYING ANIMATION */}
              {authStep === 'verifying' && (
                <div style={{ textAlign: 'center', padding: '36px 20px' }}>
                  <div style={{ fontSize: '36px', color: '#00E5FF', marginBottom: '14px' }}>✦ ✦ ✦</div>
                  <h4 style={{ fontSize: '26px', color: '#FFFFFF', marginBottom: '8px' }}>
                    VALIDATING WITH RESEND AUTH ENGINE...
                  </h4>
                  <p style={{ fontSize: '12px', color: '#AAFF00' }}>
                    Verifying 6-digit code against secure session...
                  </p>
                </div>
              )}

              {/* STEP 4: SUCCESS CONFIRMATION */}
              {authStep === 'success' && (
                <div style={{ textAlign: 'center', padding: '36px 20px' }}>
                  <div style={{ fontSize: '40px', color: '#AAFF00', marginBottom: '12px' }}>✓</div>
                  <h4 style={{ fontSize: '28px', color: '#FFFFFF', marginBottom: '6px' }}>
                    EMAIL AUTHENTICATION SUCCESSFUL
                  </h4>
                  <p style={{ fontSize: '13px', color: '#CBD5E1' }}>
                    Welcome to <strong>vault-68</strong>. All your official government documents are now unmasked.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          DOCUMENT INSPECTION MODAL (FOR AUTHENTICATED USERS)
          ===================================================================== */}
      {selectedDoc && (
        <div className="y2k-modal-overlay" onClick={() => setSelectedDoc(null)}>
          <div className="y2k-modal" onClick={e => e.stopPropagation()}>
            <div style={{
              background: 'linear-gradient(90deg, #00E5FF, #AAFF00)',
              padding: '12px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: '#0A0A0A'
            }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', letterSpacing: '1px', fontWeight: 900 }}>
                ✦ LEGAL CREDENTIAL INSPECTION: {selectedDoc.shortCode}
              </span>
              <button
                onClick={() => setSelectedDoc(null)}
                style={{
                  background: '#0A0A0A',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '4px 10px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  borderRadius: '3px'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <span className="y2k-badge badge-cyan">{selectedDoc.issuer}</span>
                <h3 style={{ fontSize: '30px', color: '#FFFFFF', marginTop: '6px' }}>{selectedDoc.title}</h3>
                <div style={{ fontSize: '13px', color: '#AAFF00' }}>
                  REGISTERED HOLDER: {isAuthenticated ? citizenProfile.name : selectedDoc.holder}
                </div>
              </div>

              <div style={{
                background: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(0, 229, 255, 0.4)',
                padding: '16px',
                borderRadius: '6px',
                fontSize: '13px',
                lineHeight: '1.7'
              }}>
                <div><strong>OFFICIAL NUMBER:</strong> <span style={{ color: '#AAFF00', fontWeight: 700 }}>{selectedDoc.unmaskedNumber}</span></div>
                <div><strong>DOC TYPE:</strong> {selectedDoc.docType}</div>
                <div><strong>ISSUING AUTHORITY:</strong> {selectedDoc.issuer}</div>
                <div><strong>VALIDATION STATUS:</strong> {selectedDoc.status}</div>
                {selectedDoc.dob && <div><strong>DATE OF BIRTH:</strong> {selectedDoc.dob}</div>}
                {selectedDoc.vehicleClass && <div><strong>VEHICLE ENDORSEMENTS:</strong> {selectedDoc.vehicleClass}</div>}
              </div>

              <p style={{ fontSize: '13px', color: '#CBD5E1', lineHeight: '1.6' }}>
                {selectedDoc.desc}
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px' }}>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="y2k-btn"
                  style={{ fontSize: '16px' }}
                >
                  CLOSE
                </button>
                <button
                  onClick={() => { handleExport(selectedDoc); setSelectedDoc(null); }}
                  className="y2k-btn y2k-btn-pink"
                  style={{ fontSize: '16px' }}
                >
                  ✦ EXPORT LEGAL COPY
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          UPLOAD MODAL
          ===================================================================== */}
      {isUploadOpen && (
        <div className="y2k-modal-overlay" onClick={() => setIsUploadOpen(false)}>
          <div className="y2k-modal" onClick={e => e.stopPropagation()}>
            <div style={{
              background: 'linear-gradient(90deg, #FF1493, #00E5FF)',
              padding: '12px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: '#0A0A0A'
            }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', letterSpacing: '1px', fontWeight: 900 }}>
                ✦ INGEST NEW CITIZEN DOCUMENT: vault-68
              </span>
              <button
                onClick={() => setIsUploadOpen(false)}
                style={{
                  background: '#0A0A0A',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '4px 10px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  borderRadius: '3px'
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadDoc} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#00E5FF', fontWeight: 700, marginBottom: '6px' }}>
                  DOCUMENT TITLE *
                </label>
                <input
                  type="text"
                  required
                  className="y2k-input"
                  placeholder="E.G. PASSPORT, PROPERTY DEED, INCOME CERTIFICATE"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#FF1493', fontWeight: 700, marginBottom: '6px' }}>
                  ISSUING AUTHORITY
                </label>
                <input
                  type="text"
                  className="y2k-input"
                  value={newIssuer}
                  onChange={e => setNewIssuer(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#AAFF00', fontWeight: 700, marginBottom: '6px' }}>
                  REGISTRATION / SERIAL NUMBER
                </label>
                <input
                  type="text"
                  className="y2k-input"
                  placeholder="E.G. REC-9941-88"
                  value={newNumber}
                  onChange={e => setNewNumber(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="y2k-btn"
                  style={{ fontSize: '16px' }}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="y2k-btn y2k-btn-pink"
                  style={{ fontSize: '16px', fontWeight: 800 }}
                >
                  ✦ SEAL INTO VAULT-68
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Dispatch */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: '#0D0D14',
          border: '2px solid #00E5FF',
          boxShadow: '0 0 25px rgba(0, 229, 255, 0.7)',
          padding: '14px 20px',
          borderRadius: '6px',
          color: '#FFFFFF',
          fontSize: '13px',
          fontWeight: 700,
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ color: '#FF1493', fontSize: '16px' }}>✦</span>
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
