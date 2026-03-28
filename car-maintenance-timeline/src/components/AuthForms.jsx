import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';

export function SignInForm({ onToggle }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(email, password);
    
    if (error) {
      setError(error.message || 'Invalid credentials');
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-form-container">
      <div className="auth-brand">
        <img src="/logo.png" alt="KARROS AI" className="auth-logo-image" />
      </div>
      <h2>Sign In</h2>
      {error && <div className="auth-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      <p className="auth-toggle">
        Don't have an account?{' '}
        <button className="link-btn" onClick={onToggle}>
          Sign Up
        </button>
      </p>
    </div>
  );
}

export function SignUpForm({ onToggle }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState('form'); // 'form' | 'verify'
  const [loading, setLoading] = useState(false);
  const { signUp, verifyEmail, resendVerificationEmail } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error } = await signUp(email, password, name);
    
    if (error) {
      setError(error.message || 'Failed to create account');
    } else if (data?.requireEmailVerification) {
      // Move to verification step
      setStep('verify');
    } else if (data?.accessToken) {
      // Auto signed in (verification not required)
      setStep('form');
    }
    
    setLoading(false);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error } = await verifyEmail(email, verificationCode);
    
    if (error) {
      setError(error.message || 'Invalid verification code');
    }
    // If successful, user will be signed in automatically by the auth hook
    
    setLoading(false);
  };

  const handleResendCode = async () => {
    setError('');
    const { error } = await resendVerificationEmail(email);
    if (error) {
      setError(error.message || 'Failed to resend code');
    }
  };

  if (step === 'verify') {
    return (
      <div className="auth-form-container">
        <div className="auth-brand">
          <img src="/logo.png" alt="KARROS AI" className="auth-logo-image" />
        </div>
        <h2>Verify Your Email</h2>
        <p className="auth-instructions">
          We've sent a 6-digit verification code to <strong>{email}</strong>.<br />
          Enter the code below to complete your registration.
        </p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleVerify}>
          <div className="input-group">
            <label>Verification Code</label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="123456"
              maxLength={6}
              required
            />
          </div>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>
        <div className="auth-links">
          <button className="link-btn" onClick={handleResendCode}>
            Resend Code
          </button>
          <span className="link-divider">•</span>
          <button className="link-btn" onClick={() => setStep('form')}>
            Back to Sign Up
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-form-container">
      <div className="auth-brand">
        <img src="/logo.png" alt="KARROS AI" className="auth-logo-image" />
      </div>
      <h2>Create Account</h2>
      {error && <div className="auth-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>
      <p className="auth-toggle">
        Already have an account?{' '}
        <button className="link-btn" onClick={onToggle}>
          Sign In
        </button>
      </p>
    </div>
  );
}
