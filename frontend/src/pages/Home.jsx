import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Shield, Edit3, Compass, Calendar, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const navigate = useNavigate();
  const { apiUrl } = useAuth();
  const [properties, setProperties] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [transactionType, setTransactionType] = useState('buy');

  useEffect(() => {
    // Fetch featured properties
    fetch(`${apiUrl}/properties`)
      .then(res => res.json())
      .then(data => setProperties(data.slice(0, 3)))
      .catch(err => console.error('Error fetching featured properties:', err));
  }, [apiUrl]);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/properties?query=${searchQuery}&propertyType=${propertyType}&type=${transactionType}`);
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content container animate-fade-in">
          <h1 className="hero-title">
            The Complete Property <span className="text-gradient">Ecosystem</span>
          </h1>
          <p className="hero-subtitle">
            Discover luxury spaces, schedule site visits, design interiors with IKEA-style hotspots, and draft/sign legal contracts entirely online.
          </p>

          {/* Quick Search Widget */}
          <form onSubmit={handleSearch} className="search-widget glass-panel">
            <div className="search-tab-row">
              <button 
                type="button" 
                className={`search-tab-btn ${transactionType === 'buy' ? 'active' : ''}`}
                onClick={() => setTransactionType('buy')}
              >
                Buy Properties
              </button>
              <button 
                type="button" 
                className={`search-tab-btn ${transactionType === 'rent' ? 'active' : ''}`}
                onClick={() => setTransactionType('rent')}
              >
                Rent Properties
              </button>
            </div>
            
            <div className="search-inputs-grid">
              <div className="search-input-field">
                <MapPin className="input-icon" size={20} />
                <input 
                  type="text" 
                  className="search-text-input" 
                  placeholder="Location or keywords..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="search-input-field">
                <select 
                  className="search-select-input" 
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                >
                  <option value="">Property Type (All)</option>
                  <option value="villa">Villa</option>
                  <option value="apartment">Apartment</option>
                  <option value="penthouse">Penthouse</option>
                  <option value="estate">Estate</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary search-submit-btn">
                <Search size={18} />
                Search
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Core Services Section */}
      <section className="services-section container">
        <h2 className="section-title text-center">Unifying the Property Journey</h2>
        <p className="section-subtitle text-center">We manage everything from search to keys, under one digital roof.</p>
        
        <div className="services-grid grid-4 mt-8">
          <div className="service-card glass-panel">
            <div className="service-icon-wrapper primary">
              <Search size={28} />
            </div>
            <h3>Discover Homes</h3>
            <p>Explore verified premium listings with interactive map location markers and virtual tours.</p>
          </div>

          <div className="service-card glass-panel">
            <div className="service-icon-wrapper secondary">
              <Calendar size={28} />
            </div>
            <h3>Book Visits</h3>
            <p>Coordinate virtual or physical site visits directly with agents using our calendar scheduler.</p>
          </div>

          <div className="service-card glass-panel">
            <div className="service-icon-wrapper accent">
              <Compass size={28} />
            </div>
            <h3>Interactive Design</h3>
            <p>Browse interior spaces with shoppable hotspots, select furniture details, and book designers.</p>
          </div>

          <div className="service-card glass-panel">
            <div className="service-icon-wrapper warning">
              <Edit3 size={28} />
            </div>
            <h3>Digital E-Signing</h3>
            <p>Draft binding lease/purchase contracts and sign instantly with our embedded touch signature pads.</p>
          </div>
        </div>
      </section>

      {/* Featured Properties Grid */}
      <section className="featured-section container">
        <div className="section-header">
          <div>
            <h2 className="section-title">Featured Listings</h2>
            <p className="section-subtitle">Stunning luxury spaces handpicked for you</p>
          </div>
          <Link to="/properties" className="btn btn-outline btn-sm">
            View All Properties <ArrowRight size={16} />
          </Link>
        </div>

        <div className="properties-grid grid-3 mt-8">
          {properties.map(p => (
            <div key={p.id} className="property-card glass-panel animate-fade-in">
              <div className="property-img-wrapper">
                <img src={p.image} alt={p.title} className="property-thumb" />
                <span className={`property-badge ${p.type}`}>
                  {p.type === 'buy' ? 'For Sale' : 'For Rent'}
                </span>
                {p.verified && (
                  <span className="verified-badge">
                    <Shield size={12} /> Verified
                  </span>
                )}
              </div>
              <div className="property-body">
                <h3 className="property-title">{p.title}</h3>
                <p className="property-loc">
                  <MapPin size={14} /> {p.location}
                </p>
                <div className="property-specs">
                  <span>{p.beds} Beds</span>
                  <span>•</span>
                  <span>{p.baths} Baths</span>
                  <span>•</span>
                  <span>{p.area} Sq Ft</span>
                </div>
                <div className="property-footer">
                  <span className="property-price">
                    ${p.price.toLocaleString()}{p.type === 'rent' ? '/mo' : ''}
                  </span>
                  <Link to={`/properties/${p.id}`} className="btn btn-primary btn-sm">
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Dynamic CTA for Design Hub */}
      <section className="design-cta-section container mt-16">
        <div className="design-cta-card glass-panel">
          <div className="cta-grid grid-2">
            <div className="cta-left">
              <span className="cta-badge">RK DESIGN LABS</span>
              <h2 className="cta-title">Explore Shoppable Interiors</h2>
              <p className="cta-desc">
                Walk through beautifully rendered virtual living rooms, bedrooms, and kitchens. Hover over items to check brand models, measurements, pricing, and book top-rated designers to construct your dream layout.
              </p>
              <Link to="/designs" className="btn btn-secondary mt-4">
                Explore Design Hub <Compass size={18} />
              </Link>
            </div>
            <div className="cta-right">
              <img 
                src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600" 
                alt="Interior Design Hub" 
                className="cta-showcase-image" 
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
