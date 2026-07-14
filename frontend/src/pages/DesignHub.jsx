import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Star, Calendar, MessageSquare, Info, ChevronRight, Check } from 'lucide-react';

export default function DesignHub() {
  const { user, token, apiUrl } = useAuth();
  const navigate = useNavigate();

  const [designers, setDesigners] = useState([]);
  const [activePortfolioItem, setActivePortfolioItem] = useState(null);
  const [selectedHotspot, setSelectedHotspot] = useState(null);

  // Booking states
  const [selectedDesigner, setSelectedDesigner] = useState('');
  const [bookingStyle, setBookingStyle] = useState('Obsidian Glass');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('11:00');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    // Fetch Designers
    fetch(`${apiUrl}/designers`)
      .then(res => res.json())
      .then(data => {
        setDesigners(data);
        if (data.length > 0 && data[0].portfolio.length > 0) {
          setActivePortfolioItem(data[0].portfolio[0]);
          setSelectedDesigner(data[0].id.toString());
        }
      })
      .catch(err => console.error('Error fetching designers:', err));
  }, []);

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    setBookingLoading(true);
    try {
      const res = await fetch(`${apiUrl}/designers/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          designerId: selectedDesigner,
          styleSelected: bookingStyle,
          date: bookingDate,
          time: bookingTime,
          notes: bookingNotes
        })
      });

      if (res.ok) {
        setBookingSuccess(true);
        setBookingNotes('');
        setBookingDate('');
      } else {
        const errData = await res.json();
        alert(errData.message || 'Consultation booking failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error booking consultation');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="design-hub-page container mt-8">
      
      {/* Upper Grid: Shoppable Hotspots Previewer */}
      <section className="hub-preview-section">
        <h2 className="section-title">Design Lab & Hotspot Explorer</h2>
        <p className="section-subtitle">Hover or click glowing nodes on the designer layout to inspect catalog furniture and textures.</p>

        <div className="hotspot-explorer-layout mt-6">
          
          {/* Left: The Hotspot Image container */}
          <div className="hotspot-image-container glass-panel">
            {activePortfolioItem ? (
              <div className="relative-hotspot-wrapper">
                <img 
                  src={activePortfolioItem.image} 
                  alt={activePortfolioItem.title} 
                  className="hotspot-main-image"
                />
                
                {/* Hotspot triggers */}
                {activePortfolioItem.hotspots.map(spot => (
                  <button
                    key={spot.id}
                    className={`hotspot-trigger ${selectedHotspot?.id === spot.id ? 'active' : ''}`}
                    style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                    onClick={() => setSelectedHotspot(spot)}
                    onMouseEnter={() => setSelectedHotspot(spot)}
                  >
                    +
                  </button>
                ))}

                {/* Tooltip Overlay */}
                {selectedHotspot && (
                  <div 
                    className="hotspot-tooltip glass-panel animate-fade-in"
                    style={{ 
                      left: `${selectedHotspot.x}%`, 
                      top: `${selectedHotspot.y + 6}%`,
                      transform: 'translateX(-50%)'
                    }}
                  >
                    <div className="tooltip-header">
                      <h5>{selectedHotspot.title}</h5>
                      <span className="tooltip-price">{selectedHotspot.price}</span>
                    </div>
                    <p className="tooltip-desc">{selectedHotspot.description}</p>
                    <button className="tooltip-action-btn">Add to Wishlist</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-hotspots-loader">
                <p>Loading designer space assets...</p>
              </div>
            )}
          </div>

          {/* Right: Space Styles switcher */}
          <div className="portfolio-selector-panel glass-panel">
            <h4>Style Portfolios</h4>
            <p className="panel-sub">Select spaces to preview interactive layouts.</p>

            <div className="spaces-list mt-4">
              {designers.flatMap(d => d.portfolio.map(item => ({ ...item, designerName: d.name }))).map((space, idx) => (
                <button
                  key={idx}
                  className={`space-select-row ${activePortfolioItem?.title === space.title ? 'active' : ''}`}
                  onClick={() => {
                    setActivePortfolioItem(space);
                    setSelectedHotspot(null);
                  }}
                >
                  <img src={space.image} alt={space.title} />
                  <div className="space-select-info">
                    <h5>{space.title}</h5>
                    <p>Style: {space.style} • By {space.designerName}</p>
                  </div>
                  <ChevronRight size={16} />
                </button>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* Middle Grid: Designers Profiles list */}
      <section className="designers-directory mt-16">
        <h2 className="section-title">Verified Interior Architects</h2>
        <p className="section-subtitle">Partner with experienced specialists to adapt obsidian, scandinavian, and smart layouts for your home.</p>

        <div className="designers-grid grid-3 mt-8">
          {designers.map(d => (
            <div key={d.id} className="designer-card glass-panel animate-fade-in">
              <div className="designer-profile-header">
                <img src={d.avatar} alt={d.name} className="designer-avatar" />
                <div>
                  <h4>{d.name}</h4>
                  <div className="rating-row">
                    <Star size={14} className="star-icon fill-warning" />
                    <span>{d.rating} ({d.experience} exp)</span>
                  </div>
                </div>
              </div>
              <p className="designer-bio mt-4">{d.bio}</p>
              
              <div className="designer-tags mt-4">
                {d.styles.map((st, idx) => (
                  <span key={idx} className="style-tag">{st}</span>
                ))}
              </div>

              <div className="designer-footer mt-6">
                <div>
                  <span className="rate-num">${d.rate}</span>
                  <span className="rate-label">/hr consultation</span>
                </div>
                <button 
                  onClick={() => {
                    setSelectedDesigner(d.id.toString());
                    const consultForm = document.getElementById('consultation-booking-form');
                    if (consultForm) consultForm.scrollIntoView({ behavior: 'smooth' });
                  }} 
                  className="btn btn-secondary btn-sm"
                >
                  Book Slot
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Lower Section: Booking Form */}
      <section id="consultation-booking-form" className="booking-form-section mt-16">
        <div className="booking-form-card glass-panel">
          <div className="booking-grid grid-2">
            
            <div className="booking-info-left">
              <span className="booking-badge">RESERVE CONSULTATION</span>
              <h2>Collaborate with a Designer</h2>
              <p className="booking-desc mt-4">
                Schedule a 1-on-1 virtual design session. Specify your property dimensions, share your preferred furniture catalog elements, and receive mood boards and layout blueprints.
              </p>
              
              <ul className="booking-bullets mt-6">
                <li><Check size={18} /> Direct video feedback on lighting and acoustics.</li>
                <li><Check size={18} /> Integrated product links tailored to your budget.</li>
                <li><Check size={18} /> Blueprint drafting compatible with smart homes.</li>
              </ul>
            </div>

            <div className="booking-form-right">
              {bookingSuccess ? (
                <div className="booking-success-box text-center">
                  <Check size={48} className="success-check-icon" />
                  <h4>Consultation Slot Booked!</h4>
                  <p className="mt-2 text-secondary">The designer will review your notes and confirm the calendar schedule on your user dashboard.</p>
                  <button onClick={() => setBookingSuccess(false)} className="btn btn-outline btn-sm mt-6">Book Another Slot</button>
                </div>
              ) : (
                <form onSubmit={handleBooking}>
                  <div className="form-group">
                    <label className="form-label">Select Designer</label>
                    <select 
                      className="form-input"
                      value={selectedDesigner}
                      onChange={(e) => setSelectedDesigner(e.target.value)}
                    >
                      {designers.map(d => (
                        <option key={d.id} value={d.id}>{d.name} (${d.rate}/hr)</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Preferred Style</label>
                      <select 
                        className="form-input"
                        value={bookingStyle}
                        onChange={(e) => setBookingStyle(e.target.value)}
                      >
                        <option value="Obsidian Glass">Obsidian Glass</option>
                        <option value="Minimalist">Scandinavian Minimalist</option>
                        <option value="Industrial">Urban Industrial</option>
                        <option value="Smart Home">Automation Smart Home</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Preferred Date</label>
                      <input 
                        type="date"
                        required
                        className="form-input"
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Preferred Time Window</label>
                    <select 
                      className="form-input"
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                    >
                      <option value="09:00">09:00 AM - 10:00 AM</option>
                      <option value="11:00">11:00 AM - 12:00 PM</option>
                      <option value="14:00">02:00 PM - 03:00 PM</option>
                      <option value="16:00">04:00 PM - 05:00 PM</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Project Details / Style preferences</label>
                    <textarea 
                      className="form-input"
                      rows="3"
                      placeholder="Specify room types, color ideas, or existing issues..."
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                    ></textarea>
                  </div>

                  <button type="submit" disabled={bookingLoading} className="btn btn-secondary w-full mt-4">
                    {bookingLoading ? 'Requesting Appointment...' : 'Schedule Design Consultation'}
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
