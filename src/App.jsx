import React, { useState } from 'react';
import './y2k.css';

const INITIAL_DOCUMENTS = [
  {
    id: "DOC-2000-01",
    title: "BIOMETRIC NATIONAL CITIZEN CARD",
    filename: "citizen_id_chip_v2.cyb",
    category: "IDENTITY",
    fileSize: "2.4 MB",
    uploadedAt: "2026-09-18",
    sha256: "0x89FA92019A88E1029",
    status: "ENCRYPTED",
    holder: "ALEXANDER VANCE // ID-9042",
    accentColor: "cyan",
    badgeLabel: "OFFICIAL CITIZEN ID",
    desc: "National digital identity chip record embedded with optical holographic verification seal and RSA-4096 signature."
  },
  {
    id: "DOC-2000-02",
    title: "CYBER-PASSPORT (ICAO-2000 SPEC)",
    filename: "passport_mrz_biometric.dat",
    category: "IDENTITY",
    fileSize: "3.9 MB",
    uploadedAt: "2026-09-14",
    sha256: "0x9110BBA4482019CEF",
    status: "SEALED",
    holder: "ALEXANDER VANCE // P-8829",
    accentColor: "pink",
    badgeLabel: "GLOBAL TRAVEL PASS",
    desc: "Machine Readable Zone (MRZ) optical biometric ledger credential signed by the Ministry of Foreign Affairs."
  },
  {
    id: "DOC-2000-03",
    title: "HOLOGRAM DEGREE CERTIFICATE",
    filename: "cybernetics_honors_degree.hologram",
    category: "EDUCATION",
    fileSize: "4.1 MB",
    uploadedAt: "2026-09-11",
    sha256: "0xBF41C099281DDA770",
    status: "VERIFIED",
    holder: "ALEX VANCE // B.SC CYBER",
    accentColor: "lime",
    badgeLabel: "HIGHER ACADEMIC",
    desc: "Bachelor of Science in Distributed Cryptography & Neural Systems. First Class Magna Cum Laude with tamper-proof seal."
  },
  {
    id: "DOC-2000-04",
    title: "VEHICLE CYBER-TITLE & REGISTRATION",
    filename: "transport_cadastral_deed.vin",
    category: "TRANSPORT",
    fileSize: "1.8 MB",
    uploadedAt: "2026-09-07",
    sha256: "0x330198DAA8192401C",
    status: "ACTIVE",
    holder: "VEHICLE REG-V2000-X",
    accentColor: "cyan",
    badgeLabel: "DEPT OF TRANSPORT",
    desc: "Electronic vehicular ownership registry token authenticated on the sovereign transportation ledger."
  },
  {
    id: "DOC-2000-05",
    title: "IMMUNIZATION & GENOME PROFILE",
    filename: "clinical_health_passport.bio",
    category: "HEALTH",
    fileSize: "5.2 MB",
    uploadedAt: "2026-09-02",
    sha256: "0xC188402AABB819240",
    status: "CONFIDENTIAL",
    holder: "VANCE, A. // MED-882",
    accentColor: "pink",
    badgeLabel: "HEALTH REGISTRY",
    desc: "Comprehensive genomic sequencing, blood panel antibodies, and authorized vaccination clearance attestations."
  },
  {
    id: "DOC-2000-06",
    title: "MUNICIPAL LAND DEED REGISTRY",
    filename: "cadastral_plot_boundary.geo",
    category: "PROPERTY",
    fileSize: "8.7 MB",
    uploadedAt: "2026-08-25",
    sha256: "0x4491CBA0182847A98",
    status: "IMMUTABLE",
    holder: "VANCE ESTATE TRUST",
    accentColor: "lime",
    badgeLabel: "LAND CADASTRE",
    desc: "Satellite boundary survey plot registered under municipal ordinance with notarized cryptographic timestamp."
  }
];

export default function App() {
  const [documents, setDocuments] = useState(INITIAL_DOCUMENTS);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('VAULT');
  const [toast, setToast] = useState(null);

  // Upload state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('IDENTITY');
  const [newHolder, setNewHolder] = useState('ALEXANDER VANCE');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleUpload = (e) => {
    e.preventDefault();
    if (!newTitle) return;

    const colors = ['cyan', 'pink', 'lime'];
    const chosenColor = colors[Math.floor(Math.random() * colors.length)];

    const createdDoc = {
      id: `DOC-2000-0${documents.length + 1}`,
      title: newTitle.toUpperCase(),
      filename: `${newTitle.toLowerCase().replace(/\s+/g, '_')}.dat`,
      category: newCategory,
      fileSize: "3.5 MB",
      uploadedAt: new Date().toISOString().split('T')[0],
      sha256: `0x${Array.from({length: 16}, () => Math.floor(Math.random()*16).toString(16)).join('').toUpperCase()}`,
      status: "SEALED",
      holder: newHolder.toUpperCase(),
      accentColor: chosenColor,
      badgeLabel: `GOV ${newCategory}`,
      desc: "Citizen uploaded document archive cryptographically sealed onto sovereign storage."
    };

    setDocuments([createdDoc, ...documents]);
    setIsUploadOpen(false);
    setNewTitle('');
    showToast(`✦ SUCCESS: "${createdDoc.title}" INGESTED & SEALED! ✦`);
  };

  const handleDelete = (id) => {
    setDocuments(documents.filter(d => d.id !== id));
    showToast(`✦ RECORD PURGED FROM ACTIVE REPOSITORY ✦`);
  };

  const handleDownload = (doc) => {
    showToast(`✦ EXPORTING ENCRYPTED FILE: ${doc.filename} ✦`);
    const element = document.createElement('a');
    const file = new Blob([
      `=== CYBER-LOCKER 2000 // OFFICIAL CITIZEN RECORD ===\n` +
      `ID: ${doc.id}\n` +
      `TITLE: ${doc.title}\n` +
      `HOLDER: ${doc.holder}\n` +
      `SHA-256: ${doc.sha256}\n` +
      `STATUS: AUTHENTICATED\n`
    ], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${doc.filename}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const filteredDocs = documents.filter(doc => {
    const matchesCat = activeCategory === 'ALL' || doc.category === activeCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = !q ||
      doc.title.toLowerCase().includes(q) ||
      doc.holder.toLowerCase().includes(q) ||
      doc.category.toLowerCase().includes(q) ||
      doc.id.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  return (
    <div style={{ backgroundColor: '#0A0A0A', minHeight: '100vh', position: 'relative' }}>
      {/* =====================================================================
          SCATTERED CSS ✦ SPARKLE/STAR DECORATIONS
          ===================================================================== */}
      <div className="sparkle-container">
        {/* Top left sparkle cluster */}
        <span className="sparkle-star sparkle-cyan" style={{ top: '35px', left: '4%' }}>✦</span>
        <span className="sparkle-star sparkle-pink" style={{ top: '90px', left: '12%', fontSize: '24px', animationDelay: '0.8s' }}>✦</span>
        <span className="sparkle-star sparkle-lime" style={{ top: '160px', left: '7%', fontSize: '14px', animationDelay: '1.4s' }}>✦</span>

        {/* Hero title sparkles */}
        <span className="sparkle-star sparkle-cyan" style={{ top: '180px', right: '15%', fontSize: '26px', animationDelay: '0.4s' }}>✦</span>
        <span className="sparkle-star sparkle-pink" style={{ top: '260px', left: '22%', fontSize: '20px', animationDelay: '1.2s' }}>✦</span>
        <span className="sparkle-star sparkle-lime" style={{ top: '290px', right: '8%', fontSize: '22px', animationDelay: '2.1s' }}>✦</span>

        {/* Mid-page sparkles */}
        <span className="sparkle-star sparkle-pink" style={{ top: '520px', left: '5%', fontSize: '22px', animationDelay: '1.7s' }}>✦</span>
        <span className="sparkle-star sparkle-cyan" style={{ top: '640px', right: '6%', fontSize: '18px', animationDelay: '0.9s' }}>✦</span>
        <span className="sparkle-star sparkle-lime" style={{ top: '780px', left: '18%', fontSize: '20px', animationDelay: '1.5s' }}>✦</span>
        <span className="sparkle-star sparkle-cyan" style={{ top: '920px', right: '14%', fontSize: '24px', animationDelay: '0.6s' }}>✦</span>

        {/* Lower sparkles */}
        <span className="sparkle-star sparkle-pink" style={{ top: '1150px', left: '8%', fontSize: '20px', animationDelay: '1.9s' }}>✦</span>
        <span className="sparkle-star sparkle-lime" style={{ top: '1300px', right: '10%', fontSize: '22px', animationDelay: '1.1s' }}>✦</span>
      </div>

      {/* Cybernetic Ticker */}
      <div style={{
        background: '#0D0D14',
        borderBottom: '1px solid rgba(0, 229, 255, 0.3)',
        padding: '6px 20px',
        fontSize: '11px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: '#94A3B8',
        letterSpacing: '1px',
        overflowX: 'auto',
        whiteSpace: 'nowrap'
      }}>
        <div>
          <span style={{ color: '#FF1493', fontWeight: 700 }}>[GOV.NET 2000]</span> OFFICIAL CITIZEN DIGITAL REPOSITORY ARCHIVE
          <span style={{ margin: '0 12px', color: '#00E5FF' }}>///</span>
          AIR-GAPPED CIPHER: <span style={{ color: '#AAFF00', fontWeight: 700 }}>SHA-256 + 4096-BIT RSA</span>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>NODE: <strong style={{ color: '#00E5FF' }}>CYBER-VAULT-PRIMARY</strong></span>
          <span>CITIZEN ID: <strong style={{ color: '#FF1493' }}>AV-9042-88</strong></span>
        </div>
      </div>

      {/* =====================================================================
          Y2K NAVIGATION: BOLD UPPERCASE WITH NEON HOVER UNDERLINE EFFECT
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
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(255, 20, 147, 0.2)'
      }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            background: 'linear-gradient(135deg, #FF1493, #00E5FF)',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: '20px',
            color: '#0A0A0A',
            boxShadow: '0 0 15px rgba(0, 229, 255, 0.8)'
          }}>
            ✦
          </div>
          <div>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '32px',
              letterSpacing: '2px',
              color: '#FFFFFF'
            }}>
              CYBER-LOCKER <span style={{ color: '#00E5FF', textShadow: '0 0 10px #00E5FF' }}>2000</span>
            </span>
            <div style={{ fontSize: '10px', letterSpacing: '2px', color: '#FF1493', fontWeight: 700 }}>
              FEDERAL CITIZEN DOCUMENT VAULT
            </div>
          </div>
        </div>

        {/* Navigation Links in bold uppercase with neon hover underline effect */}
        <nav style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          <button
            onClick={() => setActiveNav('VAULT')}
            className={`neon-nav-link ${activeNav === 'VAULT' ? 'active-link' : ''}`}
          >
            DOCUMENT VAULT
          </button>
          <button
            onClick={() => setActiveNav('IDENTITY')}
            className={`neon-nav-link ${activeNav === 'IDENTITY' ? 'active-link' : ''}`}
          >
            NATIONAL IDENTITY
          </button>
          <button
            onClick={() => setActiveNav('CERTIFICATES')}
            className={`neon-nav-link ${activeNav === 'CERTIFICATES' ? 'active-link' : ''}`}
          >
            HOLOGRAM CERTS
          </button>
          <button
            onClick={() => setActiveNav('SECURITY')}
            className={`neon-nav-link ${activeNav === 'SECURITY' ? 'active-link' : ''}`}
          >
            CYBER SECURITY
          </button>
        </nav>

        {/* Action Button */}
        <div>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="y2k-btn y2k-btn-pink"
            style={{ fontWeight: 800 }}
          >
            + UPLOAD RECORD
          </button>
        </div>
      </header>

      {/* =====================================================================
          HERO SECTION: CHROME METALLIC GRADIENT (SILVER TO WHITE)
          ===================================================================== */}
      <section style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '60px 24px 20px 24px',
        position: 'relative',
        zIndex: 5,
        textAlign: 'center'
      }}>
        <div style={{ display: 'inline-flex', gap: '8px', marginBottom: '18px', alignItems: 'center' }}>
          <span className="y2k-badge badge-cyan">✦ MILLENNIUM DIRECTIVE 2000</span>
          <span className="y2k-badge badge-pink">SOVEREIGN STORAGE PROTOCOL</span>
          <span className="y2k-badge badge-lime">AES-256 ZERO-LEAK</span>
        </div>

        {/* Chrome metallic gradient text (silver to white) */}
        <h1 className="chrome-headline">
          SOVEREIGN CITIZEN<br />
          DOCUMENT VAULT
        </h1>

        <p style={{
          fontSize: '15px',
          color: '#CBD5E1',
          maxWidth: '720px',
          margin: '20px auto 32px auto',
          lineHeight: '1.7',
          letterSpacing: '0.5px'
        }}>
          Federal encrypted repository for biometric citizen cards, machine-readable cyber passports,
          holographic degrees, and cadastral land deeds. Authenticated by sovereign cryptosystems.
        </p>

        {/* Quick Cyber Metric Pills */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '20px',
          flexWrap: 'wrap',
          marginBottom: '20px'
        }}>
          <div style={{
            background: 'rgba(18, 18, 24, 0.9)',
            border: '1px solid #00E5FF',
            boxShadow: '0 0 15px rgba(0, 229, 255, 0.25)',
            padding: '12px 24px',
            borderRadius: '6px'
          }}>
            <div style={{ fontSize: '11px', color: '#00E5FF', fontWeight: 700 }}>STORED RECORDS</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', color: '#FFFFFF' }}>
              {documents.length} <span style={{ fontSize: '16px', color: '#00E5FF' }}>ACTIVE</span>
            </div>
          </div>

          <div style={{
            background: 'rgba(18, 18, 24, 0.9)',
            border: '1px solid #FF1493',
            boxShadow: '0 0 15px rgba(255, 20, 147, 0.25)',
            padding: '12px 24px',
            borderRadius: '6px'
          }}>
            <div style={{ fontSize: '11px', color: '#FF1493', fontWeight: 700 }}>CRYPTOGRAPHIC INTEGRITY</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', color: '#FFFFFF' }}>
              100% <span style={{ fontSize: '16px', color: '#FF1493' }}>VALID</span>
            </div>
          </div>

          <div style={{
            background: 'rgba(18, 18, 24, 0.9)',
            border: '1px solid #AAFF00',
            boxShadow: '0 0 15px rgba(170, 255, 0, 0.25)',
            padding: '12px 24px',
            borderRadius: '6px'
          }}>
            <div style={{ fontSize: '11px', color: '#AAFF00', fontWeight: 700 }}>SOVEREIGN NETWORK</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', color: '#FFFFFF' }}>
              ONLINE <span style={{ fontSize: '16px', color: '#AAFF00' }}>[AIRTIGHT]</span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          BRIGHT GRADIENT SECTION DIVIDER
          ===================================================================== */}
      <div className="gradient-divider" style={{ maxWidth: '1240px', margin: '40px auto' }}></div>

      {/* =====================================================================
          DOCUMENT EXPLORER SECTION: FILTER TABS & SEARCH
          ===================================================================== */}
      <section style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 24px 60px 24px', position: 'relative', zIndex: 5 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px'
        }}>
          <div>
            <h2 style={{ fontSize: '36px', color: '#FFFFFF', letterSpacing: '1.5px' }}>
              CITIZEN ARCHIVE LEDGER <span style={{ color: '#00E5FF' }}>[2000-SERIES]</span>
            </h2>
            <div style={{ fontSize: '12px', color: '#94A3B8' }}>
              SHOWING {filteredDocs.length} AUTHENTICATED SOVEREIGN RECORDS
            </div>
          </div>

          {/* Search Input with Cyan Neon Border */}
          <div style={{ minWidth: '300px', flex: '1', maxWidth: '420px' }}>
            <input
              type="text"
              className="y2k-input"
              placeholder="SEARCH BY TITLE, CITIZEN HOLDER, OR SHA256..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '32px' }}>
          {['ALL', 'IDENTITY', 'EDUCATION', 'TRANSPORT', 'HEALTH', 'PROPERTY'].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="y2k-btn"
              style={{
                fontSize: '16px',
                padding: '6px 18px',
                borderColor: activeCategory === cat ? '#00E5FF' : 'rgba(255,255,255,0.15)',
                background: activeCategory === cat ? 'rgba(0, 229, 255, 0.2)' : '#0D0D14',
                color: activeCategory === cat ? '#00E5FF' : '#CBD5E1',
                boxShadow: activeCategory === cat ? '0 0 15px rgba(0, 229, 255, 0.5)' : 'none'
              }}
            >
              ✦ {cat}
            </button>
          ))}
        </div>

        {/* Document Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '24px'
        }}>
          {filteredDocs.map(doc => {
            const badgeBorder = doc.accentColor === 'pink' ? 'badge-pink' : doc.accentColor === 'lime' ? 'badge-lime' : 'badge-cyan';
            const btnClass = doc.accentColor === 'pink' ? 'y2k-btn-pink' : doc.accentColor === 'lime' ? 'y2k-btn-lime' : '';

            return (
              <div key={doc.id} className="y2k-card">
                <div>
                  {/* Card Header Strip */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span className={`y2k-badge ${badgeBorder}`}>✦ {doc.badgeLabel}</span>
                    <span style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'var(--font-body)' }}>{doc.fileSize}</span>
                  </div>

                  {/* Title in Bebas Neue */}
                  <h3 style={{
                    fontSize: '24px',
                    letterSpacing: '1px',
                    color: '#FFFFFF',
                    marginBottom: '8px',
                    lineHeight: '1.15'
                  }}>
                    {doc.title}
                  </h3>

                  {/* Metadata */}
                  <div style={{ fontSize: '12px', color: '#CBD5E1', marginBottom: '12px' }}>
                    <div><strong>HOLDER:</strong> {doc.holder}</div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>FILE: {doc.filename}</div>
                  </div>

                  {/* Description */}
                  <p style={{ fontSize: '12px', color: '#94A3B8', lineHeight: '1.6', marginBottom: '18px' }}>
                    {doc.desc}
                  </p>

                  {/* Technical Seal Strip */}
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontFamily: 'var(--font-body)',
                    marginBottom: '18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>HASH: <code>{doc.sha256}</code></span>
                    <span style={{
                      color: doc.accentColor === 'pink' ? '#FF1493' : doc.accentColor === 'lime' ? '#AAFF00' : '#00E5FF',
                      fontWeight: 700
                    }}>
                      [{doc.status}]
                    </span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setSelectedDoc(doc)}
                    className={`y2k-btn ${btnClass}`}
                    style={{ flex: '1', fontSize: '16px', padding: '8px 12px' }}
                  >
                    ✦ INSPECT
                  </button>
                  <button
                    onClick={() => handleDownload(doc)}
                    className="y2k-btn"
                    style={{ fontSize: '16px', padding: '8px 14px' }}
                    title="Download Record"
                  >
                    EXPORT
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="y2k-btn y2k-btn-pink"
                    style={{ fontSize: '16px', padding: '8px 12px' }}
                    title="Purge Record"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          BRIGHT GRADIENT SECTION DIVIDER BEFORE FOOTER
          ===================================================================== */}
      <div className="gradient-divider" style={{ maxWidth: '1240px', margin: '40px auto' }}></div>

      {/* =====================================================================
          Y2K FOOTER
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
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', color: '#FFFFFF', letterSpacing: '1px' }}>
            CYBER-LOCKER 2000 // DEPT OF DIGITAL CITIZEN REGISTRY
          </div>
          <div>All records cryptographically signed with RSA-4096 and SHA-256 integrity seal.</div>
        </div>
        <div style={{ display: 'flex', gap: '16px', color: '#00E5FF', fontWeight: 700 }}>
          <span>✦ HOT PINK #FF1493</span>
          <span>✦ ELECTRIC CYAN #00E5FF</span>
          <span>✦ NEON LIME #AAFF00</span>
        </div>
      </footer>

      {/* =====================================================================
          INSPECTION MODAL
          ===================================================================== */}
      {selectedDoc && (
        <div className="y2k-modal-overlay" onClick={() => setSelectedDoc(null)}>
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
                ✦ CITIZEN RECORD INSPECTION // {selectedDoc.id}
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

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <span className="y2k-badge badge-cyan">VERIFIED CITIZEN CREDENTIAL</span>
                <h3 style={{ fontSize: '32px', color: '#FFFFFF', marginTop: '6px' }}>{selectedDoc.title}</h3>
                <div style={{ fontSize: '13px', color: '#AAFF00' }}>REGISTERED CITIZEN: {selectedDoc.holder}</div>
              </div>

              <div style={{
                background: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(0, 229, 255, 0.4)',
                padding: '16px',
                borderRadius: '6px',
                fontSize: '12px',
                lineHeight: '1.7'
              }}>
                <div><strong>CATEGORY:</strong> {selectedDoc.category}</div>
                <div><strong>RAW FILENAME:</strong> {selectedDoc.filename}</div>
                <div><strong>STORAGE SIZE:</strong> {selectedDoc.fileSize}</div>
                <div><strong>TIMESTAMP:</strong> {selectedDoc.uploadedAt}</div>
                <div style={{ wordBreak: 'break-all', marginTop: '6px' }}>
                  <strong>SHA-256 HASH:</strong> <code style={{ color: '#00E5FF' }}>{selectedDoc.sha256}FF992140A884</code>
                </div>
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
                  onClick={() => { handleDownload(selectedDoc); setSelectedDoc(null); }}
                  className="y2k-btn y2k-btn-pink"
                  style={{ fontSize: '16px' }}
                >
                  ✦ EXPORT CREDENTIAL
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
              background: 'linear-gradient(90deg, #00E5FF, #AAFF00)',
              padding: '12px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: '#0A0A0A'
            }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', letterSpacing: '1px', fontWeight: 900 }}>
                ✦ INGEST NEW CITIZEN RECORD
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

            <form onSubmit={handleUpload} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#00E5FF', fontWeight: 700, marginBottom: '6px' }}>
                  RECORD TITLE *
                </label>
                <input
                  type="text"
                  required
                  className="y2k-input"
                  placeholder="E.G. MOTORCYCLE LICENSE ENDORSEMENT"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#FF1493', fontWeight: 700, marginBottom: '6px' }}>
                    CATEGORY CLASSIFICATION
                  </label>
                  <select
                    className="y2k-input"
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="IDENTITY">IDENTITY</option>
                    <option value="EDUCATION">EDUCATION</option>
                    <option value="TRANSPORT">TRANSPORT</option>
                    <option value="HEALTH">HEALTH</option>
                    <option value="PROPERTY">PROPERTY</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#AAFF00', fontWeight: 700, marginBottom: '6px' }}>
                    HOLDER / ENTITY NAME
                  </label>
                  <input
                    type="text"
                    className="y2k-input"
                    value={newHolder}
                    onChange={e => setNewHolder(e.target.value)}
                  />
                </div>
              </div>

              {/* Holographic Drop Zone */}
              <div style={{
                border: '2px dashed #00E5FF',
                borderRadius: '6px',
                padding: '24px',
                textAlign: 'center',
                background: 'rgba(0, 229, 255, 0.05)',
                cursor: 'pointer'
              }}>
                <div style={{ fontSize: '24px', color: '#FF1493', marginBottom: '6px' }}>✦ ✦ ✦</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', color: '#FFFFFF' }}>
                  DRAG CITIZEN RAW PAYLOAD HERE
                </div>
                <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>
                  SUPPORTS .DAT, .BIO, .VIN, .CYB, .PDF (UP TO 50MB)
                </div>
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
                  ✦ SEAL & STORE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          TOAST ALERT BANNER
          ===================================================================== */}
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
