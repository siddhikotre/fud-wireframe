import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);

  const handleGoogle = () => {
    if (!agreed) return;
    navigate('/');
  };

  return (
    <div className="auth-stage">
      <div className="auth-stage-bg" aria-hidden>
        <div className="auth-stage-orb auth-stage-orb--a" />
        <div className="auth-stage-orb auth-stage-orb--b" />
        <div className="auth-stage-grid" />
      </div>

      <div className="auth-card-lg">
        <div className="auth-card-mark">
          <img src="/fud-logo.png" alt="Fud" />
        </div>

        <div className="auth-card-heading">
          <span className="eyebrow">Welcome to Fud</span>
          <h1 className="auth-card-title">
            Take <em className="serif-italic">action</em> on your<br />
            small business <em className="serif-italic">today.</em>
          </h1>
          <p className="auth-card-sub">
            Discover events, earn Fud Coins, and apply to workshops in one click — powered by AI built for everyday entrepreneurs.
          </p>
        </div>

        <div className="auth-card-actions">
          <label className={`auth-consent ${agreed ? 'is-checked' : ''}`}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span className="auth-consent-box" aria-hidden>
              <Check size={14} strokeWidth={3} />
            </span>
            <span className="auth-consent-text">
              I agree to Fud's{' '}
              <a href="#" onClick={(e) => e.stopPropagation()}>Terms of Use</a>
              {' '}and{' '}
              <a href="#" onClick={(e) => e.stopPropagation()}>Privacy Policy</a>
            </span>
          </label>

          <button
            className="google-btn"
            onClick={handleGoogle}
            disabled={!agreed}
            aria-disabled={!agreed}
          >
            <GoogleMark />
            <span>Continue with Google</span>
          </button>

          <p className="auth-switch">
            New here? Signing in with Google creates your account automatically.
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}
