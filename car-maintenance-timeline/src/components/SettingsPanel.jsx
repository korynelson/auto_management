import { useAuth } from '../hooks/useAuth.jsx';

export function SettingsPanel() {
  const { user } = useAuth();

  return (
    <div className="settings-panel">
      <h2>Settings</h2>
      
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
          <li>Theme preferences</li>
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
