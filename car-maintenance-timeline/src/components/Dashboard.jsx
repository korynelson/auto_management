import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { insforge } from '../lib/insforge';
import { VehicleCard } from './VehicleCard';
import { VehicleForm } from './VehicleForm';
import { SettingsPanel } from './SettingsPanel';
import { RepairShops } from './RepairShops';
import { CostChart } from './CostChart';
import { MaintenanceSchedule } from './MaintenanceSchedule';

export function Dashboard() {
  const { user, signOut } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState('vehicles');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [editingVehicle, setEditingVehicle] = useState(null);

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
    console.log('Adding vehicle:', vehicleData);
    // Remove gas_price_source as it's not in the database schema
    const { gas_price_source, ...dataToInsert } = vehicleData;
    const { data, error } = await insforge.database
      .from('vehicles')
      .insert([{ ...dataToInsert, user_id: user.id }])
      .select();
    
    if (error) {
      console.error('Error adding vehicle:', error);
      alert('Error adding vehicle: ' + error.message);
      return { data, error };
    }
    
    if (data) {
      console.log('Vehicle added:', data);
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

  const handleEditVehicle = async (vehicleData) => {
    const { data, error } = await insforge.database
      .from('vehicles')
      .update({
        name: vehicleData.name,
        vin: vehicleData.vin,
        model: vehicleData.model,
        current_mileage: vehicleData.current_mileage,
        daily_commute: vehicleData.daily_commute,
        zip_code: vehicleData.zip_code,
        mpg: vehicleData.mpg,
        gas_price: vehicleData.gas_price,
        last_oil_change: vehicleData.last_oil_change,
        oil_change_interval: vehicleData.oil_change_interval,
        tire_rotation_interval: vehicleData.tire_rotation_interval,
        last_tire_rotation: vehicleData.last_tire_rotation,
        tire_pressure_check: vehicleData.tire_pressure_check
      })
      .eq('id', vehicleData.id)
      .select();
    
    if (!error && data) {
      setVehicles(vehicles.map(v => v.id === vehicleData.id ? data[0] : v));
      setEditingVehicle(null);
    }
    return { data, error };
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
          <div className="brand-logo">
            <img src="/logo.png" alt="KARROS AI" className="logo-image" />
          </div>
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
            className={activeTab === 'maintenance' ? 'active' : ''}
            onClick={() => setActiveTab('maintenance')}
          >
            Maintenance Schedule
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
            {showAddForm || editingVehicle ? (
              <VehicleForm 
                onSubmit={editingVehicle ? handleEditVehicle : handleAddVehicle}
                onCancel={() => {
                  setShowAddForm(false);
                  setEditingVehicle(null);
                }}
                vehicle={editingVehicle}
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
                    <img src="/logo.png" alt="KARROS AI" className="empty-logo" />
                    <h3>Welcome to KARROS AI</h3>
                    <p>Add your first vehicle to start tracking maintenance with AI-powered insights</p>
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
                        onEdit={() => setEditingVehicle(vehicle)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {activeTab === 'maintenance' && <MaintenanceSchedule vehicles={vehicles} />}

        {activeTab === 'settings' && <SettingsPanel />}
      </main>
    </div>
  );
}

function VehicleDetail({ vehicle, onBack }) {
  const [timeline, setTimeline] = useState(null);
  const [serviceFilter, setServiceFilter] = useState('all');

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

    // Generate service milestones by mileage
    const serviceMilestones = generateServiceMilestones(currentMileage, dailyMileage, vehicle);

    setTimeline({
      vehicle: vehicle.name,
      currentMileage,
      dailyMileage,
      gasPrice,
      gasPriceSource: vehicle.gas_price_source || 'estimate',
      mpg,
      dailyGasCost,
      monthlyGasCost,
      yearlyGasCost,
      serviceMilestones
    });
  };

  const generateServiceMilestones = (currentMileage, dailyMileage, vehicle) => {
    const milestones = [];
    const oilInterval = vehicle.oil_change_interval || 5000;
    
    // Define service intervals (in miles)
    const intervals = [10000, 20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000, 120000, 150000];
    
    intervals.forEach(mileage => {
      if (mileage <= currentMileage) return;
      
      const milesUntil = mileage - currentMileage;
      const daysUntil = Math.ceil(milesUntil / dailyMileage);
      const serviceDate = new Date();
      serviceDate.setDate(serviceDate.getDate() + daysUntil);
      
      const services = [];
      
      // Routine services (every oil change interval)
      if (mileage % oilInterval === 0 || mileage % 10000 === 0) {
        services.push({ name: 'Oil & filter change', type: 'routine' });
        services.push({ name: 'Tire rotation', type: 'routine' });
        services.push({ name: 'Multi-point inspection', type: 'routine' });
        services.push({ name: 'Fluid level checks', type: 'routine' });
      }
      
      // Major services (every 20k-30k)
      if (mileage === 20000) {
        services.push({ name: 'Cabin air filter', type: 'major' });
        services.push({ name: 'Front axle inspection', type: 'major' });
      }
      if (mileage === 30000) {
        services.push({ name: 'Engine air filter', type: 'major' });
        services.push({ name: 'Belt & hose inspection', type: 'major' });
      }
      if (mileage === 40000) {
        services.push({ name: 'Spark plug inspection', type: 'major' });
        services.push({ name: 'Brake fluid check', type: 'major' });
      }
      
      // Critical intervals (60k, 100k, 150k)
      if (mileage === 60000) {
        services.push({ name: 'Spark plugs replacement', type: 'critical' });
        services.push({ name: 'Brake fluid flush', type: 'critical' });
        services.push({ name: 'Transmission fluid check', type: 'major' });
      }
      if (mileage === 100000) {
        services.push({ name: 'Engine coolant flush', type: 'critical' });
        services.push({ name: 'Accessory drive belt inspect', type: 'critical' });
        services.push({ name: 'Timing belt inspection', type: 'critical' });
      }
      if (mileage === 120000) {
        services.push({ name: 'Timing belt replacement', type: 'critical' });
        services.push({ name: 'Water pump inspection', type: 'critical' });
      }
      if (mileage === 150000) {
        services.push({ name: 'Transmission fluid', type: 'critical' });
        services.push({ name: 'Transfer case fluid', type: 'critical' });
        services.push({ name: 'Axle lubricants', type: 'critical' });
        services.push({ name: 'Accessory belt replace', type: 'critical' });
      }
      
      if (services.length > 0) {
        milestones.push({
          mileage,
          milesUntil,
          daysUntil,
          date: serviceDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }),
          services
        });
      }
    });
    
    return milestones;
  };

  const filterMilestones = (milestones) => {
    if (serviceFilter === 'all') return milestones;
    return milestones.map(m => ({
      ...m,
      services: m.services.filter(s => s.type === serviceFilter)
    })).filter(m => m.services.length > 0);
  };

  if (!timeline) return <div className="loading">Generating timeline...</div>;

  const filteredMilestones = filterMilestones(timeline.serviceMilestones);

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
            <span className="gas-price-with-badge">
              ${timeline.gasPrice.toFixed(2)}/gal
              {timeline.gasPriceSource && (
                <span className={`price-badge ${timeline.gasPriceSource}`}>
                  {timeline.gasPriceSource === 'api' && '✓ Real-time'}
                  {timeline.gasPriceSource === 'regional_estimate' && 'Regional average'}
                  {timeline.gasPriceSource === 'estimate' && 'Regional average'}
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Cost Chart */}
        <CostChart timeline={timeline} />

        {/* Service Milestones Table */}
        <div className="service-milestones">
          <div className="milestones-header">
            <h3>Service Milestones</h3>
            <div className="service-filter-tabs">
              <button 
                className={serviceFilter === 'all' ? 'active' : ''}
                onClick={() => setServiceFilter('all')}
              >
                <span className="filter-dot all"></span>
                All
              </button>
              <button 
                className={serviceFilter === 'routine' ? 'active' : ''}
                onClick={() => setServiceFilter('routine')}
              >
                <span className="filter-dot routine"></span>
                Routine
              </button>
              <button 
                className={serviceFilter === 'major' ? 'active' : ''}
                onClick={() => setServiceFilter('major')}
              >
                <span className="filter-dot major"></span>
                Major
              </button>
              <button 
                className={serviceFilter === 'critical' ? 'active' : ''}
                onClick={() => setServiceFilter('critical')}
              >
                <span className="filter-dot critical"></span>
                Critical
              </button>
            </div>
          </div>

          <div className="milestones-table">
            {filteredMilestones.length === 0 ? (
              <div className="no-milestones">No {serviceFilter} services scheduled</div>
            ) : (
              filteredMilestones.map((milestone) => (
                <div key={milestone.mileage} className="milestone-row">
                  <div className="milestone-mileage">
                    {milestone.mileage.toLocaleString()} mi
                    <span className="milestone-eta">{milestone.daysUntil} days</span>
                  </div>
                  <div className="milestone-services">
                    {milestone.services.map((service, idx) => (
                      <span 
                        key={idx} 
                        className={`service-tag ${service.type}`}
                      >
                        {service.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Gas Costs Summary */}
        <div className="maintenance-tabs">
          <div className="tab-header expanded">
            <span className="tab-icon">⛽</span>
            <span className="tab-title">Fuel Costs</span>
            <span className="tab-count">${timeline.yearlyGasCost.toFixed(0)}/year</span>
          </div>

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
        </div>

        {/* Repair Shops */}
        <div className="maintenance-tabs">
          <button
            className="tab-header"
            onClick={() => {}}
          >
            <span className="tab-icon">🏪</span>
            <span className="tab-title">Auto Repair Shops Near Me</span>
            <span className="tab-count">AI Powered</span>
            <span className="tab-arrow">▶</span>
          </button>
          <div className="tab-content">
            <RepairShops zipCode={vehicle.zip_code} />
          </div>
        </div>
      </div>
    </div>
  );
}
