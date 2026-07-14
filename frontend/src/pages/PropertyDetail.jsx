import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapPin, Shield, Calendar, User, Phone, Check, Eye, PenTool } from 'lucide-react';

export default function PropertyDetail() {
  const { id } = useParams();
  const { user, token, apiUrl } = useAuth();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active Image index
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  // Visit Scheduling States
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('10:00');
  const [visitType, setVisitType] = useState('physical');
  const [scheduleSuccess, setScheduleSuccess] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // E-Sign/Agreement drafting states
  const [draftSuccess, setDraftSuccess] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);

  useEffect(() => {
    fetch(`${apiUrl}/properties/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Property not found');
        return res.json();
      })
      .then(data => {
        setProperty(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  const handleScheduleVisit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    setScheduleLoading(true);
    try {
      const res = await fetch(`${apiUrl}/visits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          propertyId: id,
          date: visitDate,
          time: visitTime,
          visitType
        })
      });

      if (res.ok) {
        setScheduleSuccess(true);
      } else {
        const errData = await res.json();
        alert(errData.message || 'Failed to schedule visit');
      }
    } catch (err) {
      console.error(err);
      alert('Error scheduling visit');
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleCreateDraft = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setDraftLoading(true);
    try {
      const contractTitle = property.type === 'rent' 
        ? `Lease Agreement - ${property.title}` 
        : `Sale Deed contract - ${property.title}`;
      
      const contractType = property.type === 'rent' ? 'lease' : 'purchase';

      const contractContent = `${contractTitle.toUpperCase()}

This contract is drafted on ${new Date().toISOString().split('T')[0]} in relation to the property located at:
${property.address}

PARTIES:
1. Owner / Vendor: ${property.owner?.name || 'Owner'}
2. Buyer / Tenant: ${user.name}

TERMS:
1. Transaction Type: ${property.type === 'rent' ? 'Rental / Lease' : 'Outright Purchase'}
2. Value/Rate: $${property.price.toLocaleString()} ${property.type === 'rent' ? 'per month' : 'total sale price'}
3. Target hand-over date: 30 days from mutual signing.
4. Both parties agree to abide by all local property rules, maintenance frameworks, and transfer dues.`;

      const res = await fetch(`${apiUrl}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: contractTitle,
          type: contractType,
          propertyId: property.id,
          buyerEmail: user.email,
          content: contractContent
        })
      });

      if (res.ok) {
        setDraftSuccess(true);
        setTimeout(() => navigate('/dashboard'), 1500); // Redirect to sign it
      } else {
        const errData = await res.json();
        alert(errData.message || 'Drafting failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating draft');
    } finally {
      setDraftLoading(false);
    }
  };

  if (loading) return <div className="text-center py-24"><h3>Loading Property Details...</h3></div>;
  if (error) return <div className="text-center py-24"><h3 className="text-danger">{error}</h3><Link to="/properties" className="btn btn-outline mt-4">Back to Properties</Link></div>;

  return (
    <div className="property-detail-page container mt-8">
      {/* Detail Grid */}
      <div className="detail-layout">
        
        {/* Main Details column */}
        <main className="detail-main">
          {/* Header Row */}
          <div className="detail-header-card glass-panel">
            <div className="header-badge-row">
              <span className={`property-badge ${property.type}`}>{property.type === 'buy' ? 'For Sale' : 'For Rent'}</span>
              {property.verified && <span className="verified-badge"><Shield size={14} /> Verified listing</span>}
            </div>
            <h1 className="detail-title">{property.title}</h1>
            <p className="detail-address"><MapPin size={18} /> {property.address}</p>
          </div>

          {/* Media Slider */}
          <div className="detail-media-gallery glass-panel mt-6">
            <div className="active-img-container">
              <img src={property.images[activeImgIndex] || property.image} alt={property.title} className="active-img" />
            </div>
            <div className="gallery-thumbs">
              {(property.images.length > 0 ? property.images : [property.image]).map((img, idx) => (
                <button 
                  key={idx} 
                  className={`thumb-btn ${idx === activeImgIndex ? 'active' : ''}`}
                  onClick={() => setActiveImgIndex(idx)}
                >
                  <img src={img} alt="Thumbnail" />
                </button>
              ))}
            </div>
          </div>

          {/* Details Tabs / Info */}
          <div className="detail-info-card glass-panel mt-6">
            <h3 className="card-title">Property Highlights</h3>
            <div className="highlights-grid mt-4">
              <div className="highlight-item">
                <span className="highlight-val">${property.price.toLocaleString()}{property.type === 'rent' ? '/mo' : ''}</span>
                <span className="highlight-label">Asking Price</span>
              </div>
              <div className="highlight-item">
                <span className="highlight-val">{property.beds}</span>
                <span className="highlight-label">Bedrooms</span>
              </div>
              <div className="highlight-item">
                <span className="highlight-val">{property.baths}</span>
                <span className="highlight-label">Bathrooms</span>
              </div>
              <div className="highlight-item">
                <span className="highlight-val">{property.area.toLocaleString()}</span>
                <span className="highlight-label">Square Feet</span>
              </div>
            </div>

            <hr className="divider" />

            <h3 className="card-title mt-4">Description</h3>
            <p className="description-text mt-2">{property.description}</p>

            <h3 className="card-title mt-6">Amenity Checklist</h3>
            <ul className="features-list mt-2">
              {property.features.map((feat, idx) => (
                <li key={idx} className="feat-item"><Check size={16} /> {feat}</li>
              ))}
            </ul>
          </div>

          {/* Virtual 3D Tour Frame */}
          <div className="virtual-tour-card glass-panel mt-6">
            <div className="card-title-row">
              <Eye size={20} />
              <h3>Virtual 3D Walkthrough</h3>
            </div>
            <p className="card-subtitle mt-1">Explore this home from the comfort of your screen.</p>
            
            <div className="iframe-tour-wrapper mt-4">
              {property.virtualTourUrl ? (
                <iframe 
                  title="3D Virtual Walkthrough"
                  src={property.virtualTourUrl}
                  className="virtual-tour-iframe"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="mock-tour-placeholder">
                  <p>3D Navigation Space Loading...</p>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Sidebar Interactions column */}
        <aside className="detail-sidebar">
          {/* Agent Card */}
          {property.agent && (
            <div className="agent-card glass-panel">
              <h3>Listing Representative</h3>
              <div className="agent-profile mt-4">
                <img src={property.agent.avatar} alt={property.agent.name} className="agent-avatar" />
                <div>
                  <h4>{property.agent.name}</h4>
                  <p className="agent-title">Licensed RK Agent</p>
                </div>
              </div>
              <div className="agent-details mt-4">
                <p><Phone size={14} /> {property.agent.phone}</p>
                <p><User size={14} /> {property.agent.email}</p>
              </div>
            </div>
          )}

          {/* Scheduler Widget */}
          <div className="scheduler-card glass-panel mt-6">
            <h3>Schedule Site Visit</h3>
            <p className="card-subtitle">Choose a timing window for a virtual tour or physical walkthrough.</p>
            
            {scheduleSuccess ? (
              <div className="schedule-success-box mt-4">
                <Check size={36} />
                <p>Site Visit Requested Successfully!</p>
                <span className="success-sub">Owner/Agent will review and update your dashboard.</span>
              </div>
            ) : (
              <form onSubmit={handleScheduleVisit} className="scheduler-form mt-4">
                <div className="form-group">
                  <label className="form-label">Preferred Date</label>
                  <input 
                    type="date" 
                    required 
                    className="form-input" 
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Preferred Time Slot</label>
                  <select 
                    className="form-input" 
                    value={visitTime}
                    onChange={(e) => setVisitTime(e.target.value)}
                  >
                    <option value="09:00">09:00 AM - 11:00 AM</option>
                    <option value="11:00">11:00 AM - 01:00 PM</option>
                    <option value="14:00">02:00 PM - 04:00 PM</option>
                    <option value="16:00">04:00 PM - 06:00 PM</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Visit Platform</label>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input 
                        type="radio" 
                        name="visitType" 
                        value="physical" 
                        checked={visitType === 'physical'}
                        onChange={() => setVisitType('physical')}
                      />
                      Physical Walkthrough
                    </label>
                    <label className="radio-label">
                      <input 
                        type="radio" 
                        name="visitType" 
                        value="virtual"
                        checked={visitType === 'virtual'}
                        onChange={() => setVisitType('virtual')}
                      />
                      Virtual (Video Call)
                    </label>
                  </div>
                </div>

                <button type="submit" disabled={scheduleLoading} className="btn btn-primary w-full mt-4">
                  {scheduleLoading ? 'Submitting...' : 'Request Visit Appointment'}
                </button>
              </form>
            )}
          </div>

          {/* Digital E-Sign Starter Card */}
          <div className="document-starter-card glass-panel mt-6">
            <div className="card-title-row">
              <PenTool size={20} />
              <h3>Digital Paperwork</h3>
            </div>
            <p className="card-subtitle">Generate a legally binding digital contract (Lease/Purchase Deed) for e-signing.</p>
            
            {draftSuccess ? (
              <div className="schedule-success-box mt-4">
                <Check size={24} />
                <p>Contract Draft Created!</p>
                <span className="success-sub">Redirecting you to sign...</span>
              </div>
            ) : (
              <button 
                onClick={handleCreateDraft} 
                disabled={draftLoading} 
                className="btn btn-secondary w-full mt-4"
              >
                {draftLoading ? 'Generating Contract...' : 'Draft Contract Agreement'}
              </button>
            )}
          </div>

        </aside>
      </div>
    </div>
  );
}
