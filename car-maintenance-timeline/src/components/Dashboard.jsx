import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { insforge } from '../lib/insforge';
import { VehicleCard } from './VehicleCard';
import { VehicleForm } from './VehicleForm';
import { SettingsPanel } from './SettingsPanel';
import { RepairShops } from './RepairShops';

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
  const [expandedTabs, setExpandedTabs] = useState({ 
    engine: true,
    tires: false,
    gas: false
  });

  useEffect(() => {
    generateTimeline();
  }, [vehicle]);

  const generateTimeline = () => {
    const currentMileage = vehicle.current_mileage;
    const dailyMileage = vehicle.daily_commute * 2;
    const gasPrice = vehicle.gas_price || 3.50;
    const mpg = vehicle.mpg || 25;

    // Gas costs
    const dailyGasCost = (dailyMileage / mpg) * gasPrice;
    const yearlyGasCost = dailyGasCost * 365;
    const monthlyGasCost = yearlyGasCost / 12;

    // Engine - Oil Changes
    const oilChangeInterval = vehicle.oil_change_interval || 5000;
    const oilChanges = [];
    let nextOilChangeMileage = Math.ceil(currentMileage / oilChangeInterval) * oilChangeInterval;
    if (nextOilChangeMileage <= currentMileage) {
      nextOilChangeMileage += oilChangeInterval;
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

      nextOilChangeMileage += oilChangeInterval;
    }

    // Tires - Rotation Schedule
    const tireRotations = [];
    if (vehicle.tire_rotation_interval && vehicle.last_tire_rotation) {
      const rotationInterval = vehicle.tire_rotation_interval;
      const lastRotation = new Date(vehicle.last_tire_rotation);
      const milesSinceRotation = Math.floor((new Date() - lastRotation) / (1000 * 60 * 60 * 24)) * dailyMileage;
      const currentRotationMileage = currentMileage - milesSinceRotation;
      
      let nextRotationMileage = Math.ceil(currentMileage / rotationInterval) * rotationInterval;
      if (nextRotationMileage <= currentMileage) {
        nextRotationMileage += rotationInterval;
      }

      for (let i = 0; i < 4; i++) {
        const milesUntilRotation = nextRotationMileage - currentMileage;
        const daysUntilRotation = Math.ceil(milesUntilRotation / dailyMileage);
        const rotationDate = new Date();
        rotationDate.setDate(rotationDate.getDate() + daysUntilRotation);

        tireRotations.push({
          number: i + 1,
          mileage: nextRotationMileage,
          date: rotationDate.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }),
          daysUntil: daysUntilRotation
        });

        nextRotationMileage += rotationInterval;
      }
    }

    // Tire pressure check schedule
    const pressureChecks = [];
    const pressureFrequency = vehicle.tire_pressure_check || 'monthly';
    const daysBetweenChecks = pressureFrequency === 'weekly' ? 7 : pressureFrequency === 'monthly' ? 30 : 90;
    
    for (let i = 0; i < 6; i++) {
      const checkDate = new Date();
      checkDate.setDate(checkDate.getDate() + (i * daysBetweenChecks));
      pressureChecks.push({
        number: i + 1,
        date: checkDate.toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        daysUntil: i * daysBetweenChecks
      });
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
      oilChanges,
      tireRotations,
      pressureChecks,
      hasTireData: !!vehicle.tire_rotation_interval
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

        {/* Engine Tab */}
        <div className="maintenance-tabs">
          <button
            className={`tab-header ${expandedTabs.engine ? 'expanded' : ''}`}
            onClick={() => toggleTab('engine')}
          >
            <span className="tab-icon">🔧</span>
            <span className="tab-title">Engine Maintenance</span>
            <span className="tab-count">{timeline.oilChanges.length} oil changes</span>
            <span className="tab-arrow">{expandedTabs.engine ? '▼' : '▶'}</span>
          </button>

          {expandedTabs.engine && (
            <div className="tab-content">
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

        {/* Tires Tab - Only show if tire data exists */}
        {timeline.hasTireData && (
          <div className="maintenance-tabs">
            <button
              className={`tab-header ${expandedTabs.tires ? 'expanded' : ''}`}
              onClick={() => toggleTab('tires')}
            >
              <span className="tab-icon">🛞</span>
              <span className="tab-title">Tire Maintenance</span>
              <span className="tab-count">{timeline.tireRotations.length} rotations</span>
              <span className="tab-arrow">{expandedTabs.tires ? '▼' : '▶'}</span>
            </button>

            {expandedTabs.tires && (
              <div className="tab-content">
                <h4 className="subsection-title">Tire Rotations</h4>
                {timeline.tireRotations.map((rotation) => (
                  <div key={rotation.number} className="maintenance-item">
                    <div className="item-marker">{rotation.number}</div>
                    <div className="item-content">
                      <div className="item-title">Tire Rotation #{rotation.number}</div>
                      <div className="item-date">{rotation.date}</div>
                      <div className="item-details">
                        <span>{rotation.mileage.toLocaleString()} miles</span>
                        <span className="item-days">
                          {rotation.daysUntil === 0
                            ? 'Today!'
                            : rotation.daysUntil === 1
                              ? 'Tomorrow'
                              : `${rotation.daysUntil} days away`}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                
                <h4 className="subsection-title">Pressure Checks</h4>
                {timeline.pressureChecks.map((check) => (
                  <div key={check.number} className="maintenance-item pressure-check">
                    <div className="item-marker">💨</div>
                    <div className="item-content">
                      <div className="item-title">Pressure Check #{check.number}</div>
                      <div className="item-date">{check.date}</div>
                      <div className="item-details">
                        <span>Check tire pressure</span>
                        <span className="item-days">
                          {check.daysUntil === 0
                            ? 'Today!'
                            : check.daysUntil === 1
                              ? 'Tomorrow'
                              : `${check.daysUntil} days away`}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Gas Tab */}
        <div className="maintenance-tabs">
          <button
            className={`tab-header ${expandedTabs.gas ? 'expanded' : ''}`}
            onClick={() => toggleTab('gas')}
          >
            <span className="tab-icon">⛽</span>
            <span className="tab-title">Fuel Costs</span>
            <span className="tab-count">${timeline.yearlyGasCost.toFixed(0)}/year</span>
            <span className="tab-arrow">{expandedTabs.gas ? '▼' : '▶'}</span>
          </button>

          {expandedTabs.gas && (
            <div className="tab-content">
              <div className="cost-summary">
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
                  Based on {timeline.dailyMileage} miles/day @ {timeline.mpg} MPG @ ${timeline.gasPrice.toFixed(2)}/gal
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Repair Shops Tab */}
        <div className="maintenance-tabs">
          <button
            className={`tab-header ${expandedTabs.repairShops ? 'expanded' : ''}`}
            onClick={() => toggleTab('repairShops')}
          >
            <span className="tab-icon">🏪</span>
            <span className="tab-title">Auto Repair Shops Near Me</span>
            <span className="tab-count">AI Powered</span>
            <span className="tab-arrow">{expandedTabs.repairShops ? '▼' : '▶'}</span>
          </button>

          {expandedTabs.repairShops && (
            <div className="tab-content">
              <RepairShops zipCode={vehicle.zip_code} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
