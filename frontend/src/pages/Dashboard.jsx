import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Calendar, FileText, Compass, AlertCircle, 
  Plus, Check, X, Shield, BarChart2, CheckCircle2, UserCheck, 
  MapPin, LogOut, Download, PenTool
} from 'lucide-react';

export default function Dashboard() {
  const { user, token, logout, apiUrl } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  
  // Data states
  const [properties, setProperties] = useState([]);
  const [visits, setVisits] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [verificationQueue, setVerificationQueue] = useState({ users: [], properties: [] });
  const [adminStats, setAdminStats] = useState(null);

  // E-Sign Modal States
  const [activeDocument, setActiveDocument] = useState(null);
  const [signModalOpen, setSignModalOpen] = useState(false);
  const [signatureTyped, setSignatureTyped] = useState('');
  const [signingMode, setSigningMode] = useState('draw'); // draw or type
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);

  // New Property Listing Form Modal States
  const [addPropertyModalOpen, setAddPropertyModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newType, setNewType] = useState('buy');
  const [newPropType, setNewPropType] = useState('apartment');
  const [newBeds, setNewBeds] = useState('2');
  const [newBaths, setNewBaths] = useState('2');
  const [newArea, setNewArea] = useState('1200');
  const [newLocation, setNewLocation] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newImage, setNewImage] = useState('');
  const [newFeatures, setNewFeatures] = useState('');

  // Fetch Dashboard Data based on role
  const fetchDashboardData = async () => {
    if (!token) return;

    try {
      // 1. Fetch Visits
      const visitsRes = await fetch(`${apiUrl}/visits`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (visitsRes.ok) {
        const data = await visitsRes.json();
        setVisits(data);
      }

      // 2. Fetch Documents
      const docsRes = await fetch(`${apiUrl}/documents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (docsRes.ok) {
        const data = await docsRes.json();
        setDocuments(data);
      }

      // 3. Fetch Bookings (Interior Design)
      const bookingsRes = await fetch(`${apiUrl}/designers/bookings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (bookingsRes.ok) {
        const data = await bookingsRes.json();
        setBookings(data);
      }

      // 4. Fetch Owner/Agent properties
      if (['owner', 'agent', 'admin'].includes(user?.role)) {
        const propRes = await fetch(`${apiUrl}/properties/my`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (propRes.ok) {
          const data = await propRes.json();
          setProperties(data);
        }
      }

      // 5. Fetch Admin specific queues
      if (user?.role === 'admin') {
        const verifyRes = await fetch(`${apiUrl}/users/verifications`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (verifyRes.ok) {
          const data = await verifyRes.json();
          setVerificationQueue(data);
        }

        const statsRes = await fetch(`${apiUrl}/users/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (statsRes.ok) {
          const data = await statsRes.json();
          setAdminStats(data);
        }
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchDashboardData();
  }, [user, token]);

  // Handle visit status updates (Confirm/Decline)
  const handleUpdateVisitStatus = async (visitId, newStatus) => {
    try {
      const res = await fetch(`${apiUrl}/visits/${visitId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchDashboardData();
      } else {
        alert('Failed to update status');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle booking status updates (Confirm/Decline)
  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      const res = await fetch(`${apiUrl}/designers/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchDashboardData();
      } else {
        alert('Failed to update booking status');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle User verification (Admin action)
  const handleVerifyUser = async (userId) => {
    try {
      const res = await fetch(`${apiUrl}/users/${userId}/verify`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Property verification (Admin action)
  const handleVerifyProperty = async (propertyId) => {
    try {
      const res = await fetch(`${apiUrl}/users/properties/${propertyId}/verify`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Adding New Property (Owner/Agent action)
  const handleAddPropertySubmit = async (e) => {
    e.preventDefault();
    try {
      const featuresArr = newFeatures.split(',').map(f => f.trim()).filter(Boolean);
      const res = await fetch(`${apiUrl}/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTitle,
          price: Number(newPrice),
          type: newType,
          propertyType: newPropType,
          beds: Number(newBeds),
          baths: Number(newBaths),
          area: Number(newArea),
          location: newLocation,
          address: newAddress,
          description: newDesc,
          image: newImage || undefined,
          features: featuresArr
        })
      });

      if (res.ok) {
        setAddPropertyModalOpen(false);
        // Reset form
        setNewTitle('');
        setNewPrice('');
        setNewLocation('');
        setNewAddress('');
        setNewDesc('');
        setNewImage('');
        setNewFeatures('');
        fetchDashboardData();
      } else {
        const errData = await res.json();
        alert(errData.message || 'Failed to list property');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // E-Sign Canvas drawing helper handlers
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // Support mouse and touch
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    isDrawingRef.current = true;
  };

  const draw = (e) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.strokeStyle = '#fff'; // White ink for dark pad theme
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Submit Signature
  const handleSignSubmit = async () => {
    let signatureData = '';
    if (signingMode === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      signatureData = canvas.toDataURL('image/png');
    } else {
      if (!signatureTyped.trim()) {
        alert('Please type your signature');
        return;
      }
      signatureData = signatureTyped;
    }

    try {
      const res = await fetch(`${apiUrl}/documents/${activeDocument.id}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ signatureData })
      });

      if (res.ok) {
        setSignModalOpen(false);
        setActiveDocument(null);
        setSignatureTyped('');
        fetchDashboardData();
      } else {
        const err = await res.json();
        alert(err.message || 'Signature failed');
      }
    } catch (error) {
      console.error(error);
      alert('Error signing document');
    }
  };

  const openSignModal = (doc) => {
    setActiveDocument(doc);
    setSignModalOpen(true);
    // Let DOM elements mount before canvas setup
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = 150;
      }
    }, 100);
  };

  return (
    <div className="dashboard-page container mt-8">
      {/* Header Profile card */}
      <header className="dashboard-header glass-panel">
        <div className="header-left">
          <img src={user?.avatar} alt={user?.name} className="profile-large-avatar" />
          <div className="profile-details">
            <div className="name-verify-row">
              <h2>Welcome, {user?.name}</h2>
              {user?.verified ? (
                <span className="badge-verified"><ShieldCheck size={16} /> Verified Profile</span>
              ) : (
                <span className="badge-pending"><AlertCircle size={16} /> Verification Pending</span>
              )}
            </div>
            <p className="role-sub">Access: {user?.role.toUpperCase()} Workspace</p>
            <p className="email-sub">{user?.email} • {user?.phone}</p>
          </div>
        </div>
        <div className="header-right-actions">
          {['owner', 'agent', 'admin'].includes(user?.role) && (
            <button className="btn btn-primary" onClick={() => setAddPropertyModalOpen(true)}>
              <Plus size={18} />
              List New Property
            </button>
          )}
        </div>
      </header>

      {/* Tabs Layout */}
      <div className="dashboard-workspace mt-8">
        
        {/* Sidebar Tabs selectors */}
        <aside className="workspace-tabs-sidebar glass-panel">
          <button 
            className={`tab-selector-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <BarChart2 size={18} />
            Workspace Overview
          </button>
          <button 
            className={`tab-selector-btn ${activeTab === 'visits' ? 'active' : ''}`}
            onClick={() => setActiveTab('visits')}
          >
            <Calendar size={18} />
            Site Visits ({visits.length})
          </button>
          <button 
            className={`tab-selector-btn ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            <FileText size={18} />
            Contracts & Deeds ({documents.length})
          </button>
          <button 
            className={`tab-selector-btn ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            <Compass size={18} />
            Design consultations ({bookings.length})
          </button>

          {user?.role === 'admin' && (
            <button 
              className={`tab-selector-btn ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              <Shield size={18} />
              Admin verification ({verificationQueue.users.length + verificationQueue.properties.length})
            </button>
          )}
        </aside>

        {/* Tab content workspace panels */}
        <main className="workspace-content-pane glass-panel">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="tab-pane-content animate-fade-in">
              <h3>Workspace Analytics</h3>
              <p className="tab-sub">Quick summaries of transactions, approvals, and schedules.</p>

              {/* Counts blocks */}
              <div className="stats-blocks-grid mt-6">
                <div className="stat-card glass-panel">
                  <h4>{visits.filter(v => v.status === 'pending').length}</h4>
                  <p>Pending Site Visits</p>
                </div>
                <div className="stat-card glass-panel">
                  <h4>{documents.filter(d => d.status !== 'fully_signed').length}</h4>
                  <p>Incomplete Agreements</p>
                </div>
                <div className="stat-card glass-panel">
                  <h4>{bookings.filter(b => b.status === 'pending').length}</h4>
                  <p>Pending Designs Booking</p>
                </div>
              </div>

              {/* Custom layouts depending on user role */}
              <div className="role-specific-overview mt-8">
                {user?.role === 'buyer' && (
                  <div>
                    <h4>Welcome to your Buyer workspace!</h4>
                    <p className="text-secondary mt-2">
                      Use the properties search panel to discover premium spaces. Schedule site visits, sign purchase deeds, or book an interior architect to construct custom furniture lists from our design hub hotspots.
                    </p>
                  </div>
                )}
                {user?.role === 'tenant' && (
                  <div>
                    <h4>Welcome to your Tenant workspace!</h4>
                    <p className="text-secondary mt-2">
                      Rent spaces online. Coordinate schedules with property owners, sign digital lease agreements, and complete paperwork transactions entirely in-app.
                    </p>
                  </div>
                )}
                {user?.role === 'owner' && (
                  <div>
                    <h4>Owner Management Dashboard</h4>
                    <div className="mt-4">
                      <h5>My Listed Properties ({properties.length})</h5>
                      <div className="property-dashboard-grid mt-2">
                        {properties.map(p => (
                          <div key={p.id} className="row-item-simple">
                            <img src={p.image} alt={p.title} />
                            <div>
                              <h6>{p.title}</h6>
                              <p>${p.price.toLocaleString()} • {p.status.toUpperCase()}</p>
                            </div>
                            <span className={`status-pill ${p.verified ? 'success' : 'warning'}`}>
                              {p.verified ? 'Verified' : 'Pending'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {user?.role === 'designer' && (
                  <div>
                    <h4>Interior Designer Hub</h4>
                    <p className="text-secondary mt-2">
                      View client consultation requests, review their room style choices, dimensions, and project design details. Confirm calendar bookings to lock consultation slots.
                    </p>
                  </div>
                )}
                {user?.role === 'admin' && adminStats && (
                  <div>
                    <h4>Platform Health Summary</h4>
                    <div className="stats-blocks-grid mt-4">
                      <div className="stat-card glass-panel">
                        <h4>{adminStats.counts.users}</h4>
                        <p>Total Registered Users</p>
                      </div>
                      <div className="stat-card glass-panel">
                        <h4>{adminStats.counts.properties}</h4>
                        <p>Total Listed Properties</p>
                      </div>
                      <div className="stat-card glass-panel">
                        <h4>{adminStats.counts.documents}</h4>
                        <p>Drafted Agreements</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: SITE VISITS */}
          {activeTab === 'visits' && (
            <div className="tab-pane-content animate-fade-in">
              <h3>Site Visit Appointments</h3>
              <p className="tab-sub">Review details for upcoming virtual and physical tours.</p>

              <div className="visits-table-list mt-6">
                {visits.length > 0 ? (
                  visits.map(v => (
                    <div key={v.id} className="visit-item-card glass-panel">
                      <div className="visit-left">
                        {v.property?.image && <img src={v.property.image} alt={v.property.title} />}
                        <div>
                          <h4>{v.property?.title || 'Unknown Property'}</h4>
                          <p className="loc-text"><MapPin size={12} /> {v.property?.location}</p>
                          <p className="date-text">{v.date} at {v.time} ({v.visitType.toUpperCase()})</p>
                          {['owner', 'agent', 'admin'].includes(user?.role) && v.client && (
                            <p className="client-text">Client: {v.client.name} ({v.client.phone})</p>
                          )}
                        </div>
                      </div>
                      <div className="visit-right">
                        <span className={`status-pill ${v.status}`}>
                          {v.status.toUpperCase()}
                        </span>

                        {v.status === 'pending' && ['owner', 'agent', 'admin'].includes(user?.role) && (
                          <div className="visit-actions mt-2">
                            <button 
                              className="btn btn-primary btn-sm btn-icon"
                              onClick={() => handleUpdateVisitStatus(v.id, 'confirmed')}
                            >
                              <Check size={14} /> Accept
                            </button>
                            <button 
                              className="btn btn-outline btn-sm btn-icon"
                              onClick={() => handleUpdateVisitStatus(v.id, 'declined')}
                            >
                              <X size={14} /> Decline
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="empty-text">No site visits scheduled.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CONTRACTS / DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="tab-pane-content animate-fade-in">
              <h3>Digital Agreements & Deeds</h3>
              <p className="tab-sub">Draft, review, and sign purchase contracts or leasing agreements.</p>

              <div className="docs-table-list mt-6">
                {documents.length > 0 ? (
                  documents.map(d => {
                    const isBuyer = d.buyerId === user?.id;
                    const isOwner = d.ownerId === user?.id;
                    const userSigned = (isBuyer && d.signatures?.buyer) || (isOwner && d.signatures?.owner);
                    
                    return (
                      <div key={d.id} className="doc-item-card glass-panel">
                        <div className="doc-left">
                          <h4>{d.title}</h4>
                          <p className="prop-text">Property: {d.property?.title || 'Unknown Property'}</p>
                          <p className="roles-text">
                            Owner: {d.owner?.name} | Buyer/Tenant: {d.buyer?.name}
                          </p>
                        </div>
                        <div className="doc-right">
                          <span className={`status-pill ${d.status}`}>
                            {d.status.replace('_', ' ').toUpperCase()}
                          </span>

                          {d.status !== 'fully_signed' && !userSigned && (isBuyer || isOwner) && (
                            <button 
                              className="btn btn-secondary btn-sm mt-2"
                              onClick={() => openSignModal(d)}
                            >
                              <PenTool size={14} /> E-Sign Contract
                            </button>
                          )}

                          {userSigned && (
                            <span className="signed-indicator mt-2">
                              <CheckCircle2 size={16} /> Signed by You
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="empty-text">No digital documentation contracts generated.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: DESIGN BOOKINGS */}
          {activeTab === 'bookings' && (
            <div className="tab-pane-content animate-fade-in">
              <h3>Interior Design Consultations</h3>
              <p className="tab-sub">Review slots booked for home layout updates.</p>

              <div className="bookings-table-list mt-6">
                {bookings.length > 0 ? (
                  bookings.map(b => (
                    <div key={b.id} className="booking-item-card glass-panel">
                      <div className="booking-left">
                        {b.designer?.avatar && <img src={b.designer.avatar} alt="Designer" />}
                        <div>
                          <h4>Style: {b.styleSelected}</h4>
                          <p className="time-text">Date: {b.date} at {b.time}</p>
                          <p className="notes-text">Notes: "{b.notes || 'None'}"</p>
                          {user?.role === 'designer' ? (
                            <p className="designer-sub">Client: {b.client?.name} ({b.client?.email})</p>
                          ) : (
                            <p className="designer-sub">Designer: {b.designer?.name} (${b.designer?.rate}/hr)</p>
                          )}
                        </div>
                      </div>
                      <div className="booking-right">
                        <span className={`status-pill ${b.status}`}>
                          {b.status.toUpperCase()}
                        </span>

                        {b.status === 'pending' && user?.role === 'designer' && (
                          <div className="visit-actions mt-2">
                            <button 
                              className="btn btn-primary btn-sm"
                              onClick={() => handleUpdateBookingStatus(b.id, 'confirmed')}
                            >
                              Confirm Appointment
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="empty-text">No design consultation bookings.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: ADMIN VERIFICATION QUEUES */}
          {activeTab === 'admin' && user?.role === 'admin' && (
            <div className="tab-pane-content animate-fade-in">
              <h3>System Approval Panel</h3>
              <p className="tab-sub">Review user KYC credentials and new property listings before publishing.</p>

              <div className="admin-queues mt-6">
                <h4>Pending Users KYC ({verificationQueue.users.length})</h4>
                <div className="queue-list mt-2">
                  {verificationQueue.users.length > 0 ? (
                    verificationQueue.users.map(u => (
                      <div key={u.id} className="queue-item glass-panel">
                        <div>
                          <strong>{u.name}</strong> ({u.email})
                          <p>Role: {u.role.toUpperCase()} • Phone: {u.phone}</p>
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={() => handleVerifyUser(u.id)}>
                          <UserCheck size={14} /> Approve KYC
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="empty-text">No users pending KYC verification.</p>
                  )}
                </div>

                <h4 className="mt-8">Pending Property Listings ({verificationQueue.properties.length})</h4>
                <div className="queue-list mt-2">
                  {verificationQueue.properties.length > 0 ? (
                    verificationQueue.properties.map(p => (
                      <div key={p.id} className="queue-item glass-panel">
                        <div>
                          <strong>{p.title}</strong> - {p.location}
                          <p>Owner: {p.owner?.name} | Price: ${p.price.toLocaleString()}</p>
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={() => handleVerifyProperty(p.id)}>
                          Verify Property
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="empty-text">No property listings pending approval.</p>
                  )}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* --- E-SIGN MODAL OVERLAY --- */}
      {signModalOpen && activeDocument && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-card glass-panel document-signer-modal">
            <div className="modal-header">
              <h3>E-Sign Agreement</h3>
              <button className="close-btn" onClick={() => setSignModalOpen(false)}><X size={20} /></button>
            </div>
            
            <div className="document-preview-body">
              <pre className="document-content-text">{activeDocument.content}</pre>
            </div>

            <div className="signature-input-area mt-4">
              <div className="sign-mode-tabs">
                <button 
                  className={`mode-tab ${signingMode === 'draw' ? 'active' : ''}`}
                  onClick={() => setSigningMode('draw')}
                >
                  Draw Signature
                </button>
                <button 
                  className={`mode-tab ${signingMode === 'type' ? 'active' : ''}`}
                  onClick={() => setSigningMode('type')}
                >
                  Type Signature
                </button>
              </div>

              {signingMode === 'draw' ? (
                <div className="draw-signature-wrapper mt-2">
                  <p className="signature-label">Draw your signature using mouse or finger touch below:</p>
                  <div className="signature-pad-container">
                    <canvas
                      ref={canvasRef}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="signature-canvas"
                    ></canvas>
                  </div>
                  <button type="button" className="btn btn-outline btn-sm mt-2" onClick={clearCanvas}>
                    Clear Drawing Pad
                  </button>
                </div>
              ) : (
                <div className="type-signature-wrapper mt-2">
                  <label className="form-label">Type your full legal name:</label>
                  <input
                    type="text"
                    className="form-input signature-type-input"
                    placeholder="e.g. Sarah Connor"
                    value={signatureTyped}
                    onChange={(e) => setSignatureTyped(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="modal-footer mt-6">
              <button className="btn btn-outline" onClick={() => setSignModalOpen(false)}>Cancel</button>
              <button className="btn btn-secondary" onClick={handleSignSubmit}>
                Confirm E-Signature
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD PROPERTY MODAL OVERLAY --- */}
      {addPropertyModalOpen && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-card glass-panel">
            <div className="modal-header">
              <h3>Create Property Listing</h3>
              <button className="close-btn" onClick={() => setAddPropertyModalOpen(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleAddPropertySubmit} className="add-property-form">
              <div className="form-group">
                <label className="form-label">Property Title</label>
                <input 
                  type="text" 
                  required 
                  className="form-input" 
                  placeholder="e.g. Skyline Obsidian Villa"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Price ($)</label>
                  <input 
                    type="number" 
                    required 
                    className="form-input" 
                    placeholder="Price value"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Listing For</label>
                  <select 
                    className="form-input" 
                    value={newType} 
                    onChange={(e) => setNewType(e.target.value)}
                  >
                    <option value="buy">Sale / Buyout</option>
                    <option value="rent">Rental / Renting</option>
                  </select>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Property Type</label>
                  <select 
                    className="form-input" 
                    value={newPropType} 
                    onChange={(e) => setNewPropType(e.target.value)}
                  >
                    <option value="apartment">Apartment</option>
                    <option value="villa">Villa</option>
                    <option value="penthouse">Penthouse</option>
                    <option value="estate">Estate</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">City/Region</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input" 
                    placeholder="e.g. Beverly Hills, CA"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid-3">
                <div className="form-group">
                  <label className="form-label">Beds</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={newBeds} 
                    onChange={(e) => setNewBeds(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Baths</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={newBaths} 
                    onChange={(e) => setNewBaths(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Sq Ft Area</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={newArea} 
                    onChange={(e) => setNewArea(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Full Street Address</label>
                <input 
                  type="text" 
                  required 
                  className="form-input" 
                  placeholder="e.g. 742 Evergreen Terrace, Beverly Hills"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Hero Image URL</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Paste Unsplash or custom image url"
                  value={newImage}
                  onChange={(e) => setNewImage(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Amenities (Comma separated list)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Pool, Smart Automation, Cinema, Rooftop"
                  value={newFeatures}
                  onChange={(e) => setNewFeatures(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Detailed Description</label>
                <textarea 
                  className="form-input" 
                  rows="3" 
                  placeholder="Tell buyers about this property layout..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                ></textarea>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setAddPropertyModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">List Property</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
