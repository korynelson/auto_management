import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { insforge } from '../lib/insforge';
import { VehicleCard } from './VehicleCard';
import { VehicleForm } from './VehicleForm';
import { SettingsPanel } from './SettingsPanel';

export function Dashboard() {
  const { user, signOut } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState('vehicles');
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    setLoading(true);
    const { data, error } = await insforge.database
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setVehicles(data);
    }
    setLoading(false);
  };

  const handleAddVehicle = async (vehicleData) => {
    const { data, error } = await insforge.database
      .from('vehicles')
      .insert([{ ...vehicleData, user_id: user.id }])
      .select();
    
    if (!error && data) {
      setVehicles([data[0], ...vehicles]);
      setShowAddForm(false);
    }
    return { data, error };
  };

  const handleDeleteVehicle = async (vehicleId) => {
    const { error } = await insforge.database
      .from('vehicles')
      .delete()
      .eq('id', vehicleId);
    
    if (!error) {
      setVehicles(vehicles.filter(v => v.id !== vehicleId));
    }
  };

  if (selectedVehicle) {
    return (
      <VehicleDetail 
        vehicle={selectedVehicle} 
        onBack={() => setSelectedVehicle(null)}
      />
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>My Garage</h1>
          <div className="user-menu">
            <span className="user-name">{user?.profile?.name || user?.email}</span>
            <button className="signout-btn" onClick={signOut}>Sign Out</button>
          </div>
        </div>
        <nav className="dashboard-nav">
          <button 
            className={activeTab === 'vehicles' ? 'active' : ''}
            onClick={() => setActiveTab('vehicles')}
          >
            My Vehicles
          </button>
          <button 
            className={activeTab === 'settings' ? 'active' : ''}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </nav>
      </header>

      <main className="dashboard-content">
        {activeTab === 'vehicles' && (
          <>
            {showAddForm ? (
              <VehicleForm 
                onSubmit={handleAddVehicle}
                onCancel={() => setShowAddForm(false)}
              />
            ) : (
              <>
                <div className="dashboard-actions">
                  <button className="add-vehicle-btn" onClick={() => setShowAddForm(true)}>
                    + Add Vehicle
                  </button>
                </div>

                {loading ? (
                  <div className="loading">Loading your vehicles...</div>
                ) : vehicles.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🚗</div>
                    <h3>No vehicles yet</h3>
                    <p>Add your first vehicle to start tracking maintenance</p>
                    <button className="submit-btn" onClick={() => setShowAddForm(true)}>
                      Add Your First Vehicle
                    </button>
                  </div>
                ) : (
                  <div className="vehicles-grid">
                    {vehicles.map(vehicle => (
                      <VehicleCard 
                        key={vehicle.id}
                        vehicle={vehicle}
                        onClick={() => setSelectedVehicle(vehicle)}
                        onDelete={() => handleDeleteVehicle(vehicle.id)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {activeTab === 'settings' && <SettingsPanel />}
      </main>
    </div>
  );
}

function VehicleDetail({ vehicle, onBack }) {
  const [timeline, setTimeline] = useState(null);
  const [expandedTabs, setExpandedTabs] = useState({ oilChanges: true });

  useEffect(() => {
    generateTimeline();
  }, [vehicle]);

  const generateTimeline = () => {
    const OIL_CHANGE_INTERVAL = 5000;
    const currentMileage = vehicle.current_mileage;
    const dailyMileage = vehicle.daily_commute * 2;
    const gasPrice = vehicle.gas_price || 3.50;
    const mpg = vehicle.mpg || 25;

    const dailyGasCost = (dailyMileage / mpg) * gasPrice;
    const yearlyGasCost = dailyGasCost * 365;
    const monthlyGasCost = yearlyGasCost / 12;

    const oilChanges = [];
    let nextOilChangeMileage = Math.ceil(currentMileage / OIL_CHANGE_INTERVAL) * OIL_CHANGE_INTERVAL;
    if (nextOilChangeMileage <= currentMileage) {
      nextOilChangeMileage += OIL_CHANGE_INTERVAL;
    }

    for (let i = 0; i < 5; i++) {
      const milesUntilChange = nextOilChangeMileage - currentMileage;
      const daysUntilChange = Math.ceil(milesUntilChange / dailyMileage);
      const changeDate = new Date();
      changeDate.setDate(changeDate.getDate() + daysUntilChange);

      oilChanges.push({
        number: i + 1,
        mileage: nextOilChangeMileage,
        date: changeDate.toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        daysUntil: daysUntilChange
      });

      nextOilChangeMileage += OIL_CHANGE_INTERVAL;
    }

    setTimeline({
      vehicle: vehicle.name,
      currentMileage,
      dailyMileage,
      gasPrice,
      mpg,
      dailyGasCost,
      monthlyGasCost,
      yearlyGasCost,
      oilChanges
    });
  };

  const toggleTab = (tabName) => {
    setExpandedTabs(prev => ({ ...prev, [tabName]: !prev[tabName] }));
  };

  if (!timeline) return <div className="loading">Generating timeline...</div>;

  return (
    <div className="vehicle-detail">
      <button className="back-btn" onClick={onBack}>← Back to Dashboard</button>
      
      <div className="timeline-results">
        <div className="timeline-header">
          <h2>{timeline.vehicle}</h2>
          <div className="vehicle-info">
            <span>{timeline.currentMileage.toLocaleString()} miles</span>
            <span className="divider">•</span>
            <span>{timeline.dailyMileage} mi/day</span>
            <span className="divider">•</span>
            <span>${timeline.gasPrice.toFixed(2)}/gal</span>
          </div>
        </div>

        <div className="visual-timeline">
          <div className="timeline-line">
            <div className="timeline-track">
              {timeline.oilChanges.map((change, index) => (
                <div
                  key={change.number}
                  className="timeline-point"
                  style={{ left: `${(index / (timeline.oilChanges.length - 1)) * 100}%` }}
                >
                  <div className="point-marker"></div>
                  <div className="point-label">
                    <div className="point-date">{change.date.split(',')[1]?.trim() || change.date}</div>
                    <div className="point-mileage">{change.mileage.toLocaleString()} mi</div>
                    <div className="point-days">{change.daysUntil} days</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="timeline-ticks">
              {timeline.oilChanges.map((change, index) => (
                <div
                  key={`tick-${change.number}`}
                  className="tick-mark"
                  style={{ left: `${(index / (timeline.oilChanges.length - 1)) * 100}%` }}
                >
                  <div className="tick-line"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="maintenance-tabs">
          <button
            className={`tab-header ${expandedTabs.oilChanges ? 'expanded' : ''}`}
            onClick={() => toggleTab('oilChanges')}
          >
            <span className="tab-icon">🔧</span>
            <span className="tab-title">Oil Changes</span>
            <span className="tab-count">{timeline.oilChanges.length} scheduled</span>
            <span className="tab-arrow">{expandedTabs.oilChanges ? '▼' : '▶'}</span>
          </button>

          {expandedTabs.oilChanges && (
            <div className="tab-content">
              {timeline.oilChanges.map((change) => (
                <div key={change.number} className="maintenance-item">
                  <div className="item-marker">{change.number}</div>
                  <div className="item-content">
                    <div className="item-title">Oil Change #{change.number}</div>
                    <div className="item-date">{change.date}</div>
                    <div className="item-details">
                      <span>{change.mileage.toLocaleString()} miles</span>
                      <span className="item-days">
                        {change.daysUntil === 0
                          ? 'Today!'
                          : change.daysUntil === 1
                            ? 'Tomorrow'
                            : `${change.daysUntil} days away`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="cost-summary">
          <h3>Cost Summary</h3>
          <div className="cost-grid">
            <div className="cost-box">
              <div className="cost-label">Daily</div>
              <div className="cost-value">${timeline.dailyGasCost.toFixed(2)}</div>
            </div>
            <div className="cost-box">
              <div className="cost-label">Monthly</div>
              <div className="cost-value">${timeline.monthlyGasCost.toFixed(2)}</div>
            </div>
            <div className="cost-box highlight">
              <div className="cost-label">Yearly</div>
              <div className="cost-value">${timeline.yearlyGasCost.toFixed(2)}</div>
            </div>
          </div>
          <div className="cost-note">
            Based on {timeline.dailyMileage} miles/day @ {timeline.mpg} MPG
          </div>
        </div>
      </div>
    </div>
  );
}
