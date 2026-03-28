import { useAuth } from '../hooks/useAuth.jsx';
import { useTheme } from '../hooks/useTheme.jsx';

export function SettingsPanel() {
  const { user } = useAuth();
  const { currentTheme, themes, setTheme } = useTheme();

  return (
    <div className="settings-panel">
      <h2>Settings</h2>
      
      <div className="settings-section">
        <h3>Appearance</h3>
        <div className="theme-selector">
          <label className="theme-label">Choose Theme</label>
          <div className="theme-options">
            {Object.entries(themes).map(([key, theme]) => (
              <button
                key={key}
                className={`theme-option ${currentTheme === key ? 'active' : ''}`}
                onClick={() => setTheme(key)}
                title={theme.name}
              >
                <div 
                  className="theme-preview" 
                  style={{ background: theme.gradient }}
                />
                <span className="theme-name">{theme.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="settings-section">
        <h3>Account Information</h3>
        <div className="settings-item">
          <label>Email</label>
          <div className="settings-value">{user?.email}</div>
        </div>
        <div className="settings-item">
          <label>Name</label>
          <div className="settings-value">{user?.profile?.name || 'Not set'}</div>
        </div>
      </div>

      <div className="settings-section">
        <h3>Preferences</h3>
        <p className="settings-placeholder">
          More settings coming soon! You'll be able to customize:
        </p>
        <ul className="settings-list">
          <li>Default oil change interval</li>
          <li>Notification preferences</li>
          <li>Maintenance reminders</li>
          <li>Gas price alerts</li>
        </ul>
      </div>

      <div className="settings-section">
        <h3>About</h3>
        <p className="settings-info">
          Car Maintenance Timeline v1.0<br />
          Track your vehicle maintenance and fuel costs.
        </p>
      </div>
    </div>
  );
}
