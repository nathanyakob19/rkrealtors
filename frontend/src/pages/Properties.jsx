import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, MapPin, SlidersHorizontal, Shield, Map } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Properties() {
  const [searchParams] = useSearchParams();
  const { apiUrl } = useAuth();
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState(searchParams.get('query') || '');
  const [type, setType] = useState(searchParams.get('type') || '');
  const [propertyType, setPropertyType] = useState(searchParams.get('propertyType') || '');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [beds, setBeds] = useState('');

  // Map Active Marker
  const [hoveredPropertyId, setHoveredPropertyId] = useState(null);

  useEffect(() => {
    fetch(`${apiUrl}/properties`)
      .then(res => res.json())
      .then(data => {
        setProperties(data);
        setFilteredProperties(data);
      })
      .catch(err => console.error('Error fetching properties:', err));
  }, []);

  useEffect(() => {
    let result = properties;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.location.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }
    if (type) {
      result = result.filter(p => p.type === type);
    }
    if (propertyType) {
      result = result.filter(p => p.propertyType === propertyType);
    }
    if (minPrice) {
      result = result.filter(p => p.price >= Number(minPrice));
    }
    if (maxPrice) {
      result = result.filter(p => p.price <= Number(maxPrice));
    }
    if (beds) {
      result = result.filter(p => p.beds >= Number(beds));
    }

    setFilteredProperties(result);
  }, [searchQuery, type, propertyType, minPrice, maxPrice, beds, properties]);

  // Mock geographical positions on map for listings
  const getMockCoordinates = (id) => {
    const coords = {
      1: { x: 45, y: 35, label: '$2.45M' }, // Beverly Hills
      2: { x: 70, y: 60, label: '$8.5K/mo' }, // Manhattan
      3: { x: 25, y: 50, label: '$2.8K/mo' }, // Seattle
      4: { x: 60, y: 75, label: '$4.95M' } // Miami
    };
    return coords[id] || { x: 50, y: 50, label: 'POA' };
  };

  return (
    <div className="properties-page container mt-8">
      <div className="properties-layout">
        
        {/* Left Side: Filter Form */}
        <aside className="filters-sidebar glass-panel">
          <div className="sidebar-header">
            <SlidersHorizontal size={20} />
            <h3>Search Filters</h3>
          </div>

          <div className="filter-form mt-4">
            <div className="form-group">
              <label className="form-label">Search Keywords</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="City, complex, features..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Transaction Type</label>
              <select className="form-input" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">All Transactions</option>
                <option value="buy">For Sale</option>
                <option value="rent">For Rent</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Property Type</label>
              <select className="form-input" value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
                <option value="">All Types</option>
                <option value="villa">Villa</option>
                <option value="apartment">Apartment</option>
                <option value="penthouse">Penthouse</option>
                <option value="estate">Estate</option>
              </select>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Min Price</label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="Min" 
                  value={minPrice} 
                  onChange={(e) => setMinPrice(e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Max Price</label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="Max" 
                  value={maxPrice} 
                  onChange={(e) => setMaxPrice(e.target.value)} 
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Minimum Bedrooms</label>
              <select className="form-input" value={beds} onChange={(e) => setBeds(e.target.value)}>
                <option value="">Any</option>
                <option value="1">1+ Beds</option>
                <option value="2">2+ Beds</option>
                <option value="3">3+ Beds</option>
                <option value="4">4+ Beds</option>
                <option value="5">5+ Beds</option>
              </select>
            </div>
          </div>
        </aside>

        {/* Middle Content: Property List */}
        <main className="properties-results">
          <div className="results-header">
            <h3>{filteredProperties.length} Properties Found</h3>
          </div>

          <div className="properties-list mt-4">
            {filteredProperties.length > 0 ? (
              filteredProperties.map(p => (
                <div 
                  key={p.id} 
                  className={`property-row-card glass-panel ${hoveredPropertyId === p.id ? 'highlight-border' : ''}`}
                  onMouseEnter={() => setHoveredPropertyId(p.id)}
                  onMouseLeave={() => setHoveredPropertyId(null)}
                >
                  <div className="row-card-img">
                    <img src={p.image} alt={p.title} />
                    <span className={`property-badge ${p.type}`}>{p.type === 'buy' ? 'Buy' : 'Rent'}</span>
                  </div>
                  <div className="row-card-content">
                    <div className="row-card-title-row">
                      <h4>{p.title}</h4>
                      {p.verified && <span className="verified-badge"><Shield size={12} /> Verified</span>}
                    </div>
                    <p className="row-card-loc"><MapPin size={14} /> {p.location}</p>
                    <p className="row-card-desc">{p.description.substring(0, 110)}...</p>
                    <div className="row-card-specs">
                      <span>{p.beds} beds</span>
                      <span>•</span>
                      <span>{p.baths} baths</span>
                      <span>•</span>
                      <span>{p.area} sqft</span>
                    </div>
                    <div className="row-card-footer">
                      <span className="row-card-price">${p.price.toLocaleString()}{p.type === 'rent' ? '/mo' : ''}</span>
                      <Link to={`/properties/${p.id}`} className="btn btn-primary btn-sm">View details</Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-results glass-panel text-center py-12">
                <p>No properties match your filter selections.</p>
                <button 
                  onClick={() => { setSearchQuery(''); setType(''); setPropertyType(''); setMinPrice(''); setMaxPrice(''); setBeds(''); }} 
                  className="btn btn-outline btn-sm mt-4"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        </main>

        {/* Right Side: Map HUD */}
        <section className="map-container glass-panel">
          <div className="map-header">
            <Map size={18} />
            <h3>Market Hotspots Map</h3>
          </div>
          
          <div className="interactive-map-area">
            {/* Custom Interactive SVG/Grid map representing cities layout */}
            <svg viewBox="0 0 100 100" className="svg-map">
              {/* Map background grids/roads */}
              <rect x="0" y="0" width="100" height="100" fill="#0c0d12" rx="8" />
              <path d="M 10 50 Q 50 20 90 50 T 90 90" stroke="rgba(255,255,255,0.03)" strokeWidth="4" fill="none" />
              <path d="M 30 10 Q 70 50 30 90" stroke="rgba(255,255,255,0.03)" strokeWidth="2" fill="none" />
              
              {/* Plot markers */}
              {filteredProperties.map(p => {
                const coord = getMockCoordinates(p.id);
                const isHovered = hoveredPropertyId === p.id;
                return (
                  <g 
                    key={p.id}
                    className="map-marker-group"
                    onMouseEnter={() => setHoveredPropertyId(p.id)}
                    onMouseLeave={() => setHoveredPropertyId(null)}
                  >
                    {/* Ripple animation on hovered marker */}
                    {isHovered && (
                      <circle 
                        cx={coord.x} 
                        cy={coord.y} 
                        r="8" 
                        fill="none" 
                        stroke={p.type === 'buy' ? 'var(--primary)' : 'var(--secondary)'} 
                        strokeWidth="1"
                        className="map-marker-ripple"
                      />
                    )}
                    
                    <circle 
                      cx={coord.x} 
                      cy={coord.y} 
                      r="4" 
                      fill={isHovered ? '#fff' : (p.type === 'buy' ? 'var(--primary)' : 'var(--secondary)')}
                      stroke="#000"
                      strokeWidth="1"
                      className="map-marker-dot"
                    />
                    
                    {/* Price tag tooltip */}
                    <g transform={`translate(${coord.x}, ${coord.y - 8})`}>
                      <rect 
                        x="-20" 
                        y="-8" 
                        width="40" 
                        height="12" 
                        rx="3" 
                        fill={isHovered ? 'rgba(255,255,255,0.95)' : 'rgba(18, 18, 24, 0.85)'}
                        stroke={isHovered ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}
                        strokeWidth="0.5"
                      />
                      <text 
                        y="0" 
                        fontSize="5" 
                        textAnchor="middle" 
                        fill={isHovered ? '#000' : '#fff'}
                        fontWeight="bold"
                      >
                        {coord.label}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>
            <div className="map-legend">
              <span className="legend-item"><span className="legend-dot sale"></span> Sale</span>
              <span className="legend-item"><span className="legend-dot rent"></span> Rent</span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
