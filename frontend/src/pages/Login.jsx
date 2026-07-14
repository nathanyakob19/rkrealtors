import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus } from 'lucide-react';

export default function Login() {
  const { login, register, authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('buyer'); // default role
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect path
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (isRegister) {
        await register(name, email, password, role, phone);
      } else {
        await login(email, password);
      }
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (quickEmail, quickRole) => {
    setEmail(quickEmail);
    setPassword('password123');
    setErrorMsg('');
    setLoading(true);
    try {
      await login(quickEmail, 'password123');
      navigate('/dashboard');
    } catch (err) {
      setErrorMsg(err.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card glass-panel animate-fade-in">
        <h2 className="login-title">
          {isRegister ? 'Create RK Account' : 'Welcome Back'}
        </h2>
        <p className="login-subtitle">
          {isRegister ? 'Join our luxury real estate & design ecosystem' : 'Access your premium property workspace'}
        </p>

        {errorMsg && <div className="auth-error">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {isRegister && (
            <>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. +1 (555) 012-3456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Register As</label>
                <select
                  className="form-input"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="buyer">Property Buyer</option>
                  <option value="tenant">Tenant</option>
                  <option value="owner">Property Owner / Seller</option>
                  <option value="agent">Real Estate Agent</option>
                  <option value="designer">Interior Designer</option>
                </select>
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              required
              className="form-input"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              required
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary w-full mt-4">
            {loading ? 'Authenticating...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="auth-toggle">
          <button 
            type="button" 
            className="toggle-link-btn"
            onClick={() => { setIsRegister(!isRegister); setErrorMsg(''); }}
          >
            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>

        {/* Quick Demo Access Panels */}
        <div className="demo-accounts">
          <h4 className="demo-title">Quick Demo Login</h4>
          <div className="demo-buttons">
            <button type="button" onClick={() => handleQuickLogin('buyer@rk.com', 'buyer')} className="demo-btn">
              Sarah (Buyer)
            </button>
            <button type="button" onClick={() => handleQuickLogin('tenant@rk.com', 'tenant')} className="demo-btn">
              John (Tenant)
            </button>
            <button type="button" onClick={() => handleQuickLogin('owner@rk.com', 'owner')} className="demo-btn">
              Robert (Owner)
            </button>
            <button type="button" onClick={() => handleQuickLogin('agent@rk.com', 'agent')} className="demo-btn">
              Emily (Agent)
            </button>
            <button type="button" onClick={() => handleQuickLogin('designer@rk.com', 'designer')} className="demo-btn">
              Liam (Designer)
            </button>
            <button type="button" onClick={() => handleQuickLogin('admin@rk.com', 'admin')} className="demo-btn">
              Alice (Admin)
            </button>
          </div>
          <p className="demo-note">* Uses password: <code>password123</code></p>
        </div>
      </div>
    </div>
  );
}
