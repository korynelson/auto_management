import { useState, useEffect } from 'react';

export function VehicleForm({ onSubmit, onCancel, vehicle }) {
  const isEditMode = !!vehicle;
  const [useVin, setUseVin] = useState(true);
  const [activeSection, setActiveSection] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    vin: '',
    model: '',
    current_mileage: '',
    daily_commute: '',
    zip_code: '',
    mpg: '25',
    // Engine maintenance
    last_oil_change: '',
    oil_change_interval: '5000',
    // Tires
    tire_rotation_interval: '7500',
    last_tire_rotation: '',
    tire_pressure_check: 'monthly'
  });

  useEffect(() => {
    if (vehicle) {
      setUseVin(!!vehicle.vin);
      setFormData({
        name: vehicle.name || '',
        vin: vehicle.vin || '',
        model: vehicle.model || '',
        current_mileage: vehicle.current_mileage?.toString() || '',
        daily_commute: vehicle.daily_commute?.toString() || '',
        zip_code: vehicle.zip_code || '',
        mpg: vehicle.mpg?.toString() || '25',
        last_oil_change: vehicle.last_oil_change || '',
        oil_change_interval: vehicle.oil_change_interval?.toString() || '5000',
        tire_rotation_interval: vehicle.tire_rotation_interval?.toString() || '7500',
        last_tire_rotation: vehicle.last_tire_rotation || '',
        tire_pressure_check: vehicle.tire_pressure_check || 'monthly'
      });
    }
  }, [vehicle]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Generate mock gas price
    const zipSum = formData.zip_code.split('').reduce((a, b) => a + parseInt(b), 0);
    const gasPrice = Math.round((2.80 + (zipSum % 17) * 0.10) * 100) / 100;

    const vehicleData = {
      name: formData.name,
      vin: useVin ? formData.vin : null,
      model: !useVin ? formData.model : null,
      current_mileage: parseInt(formData.current_mileage),
      daily_commute: parseInt(formData.daily_commute),
      zip_code: formData.zip_code,
      mpg: parseFloat(formData.mpg) || 25,
      gas_price: gasPrice,
      // Engine data
      last_oil_change: formData.last_oil_change || null,
      oil_change_interval: parseInt(formData.oil_change_interval) || 5000,
      // Tire data
      tire_rotation_interval: formData.last_tire_rotation ? parseInt(formData.tire_rotation_interval) || 7500 : null,
      last_tire_rotation: formData.last_tire_rotation || null,
      tire_pressure_check: formData.tire_pressure_check
    };

    if (isEditMode) {
      await onSubmit({ ...vehicleData, id: vehicle.id });
    } else {
      await onSubmit(vehicleData);
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const renderBasicSection = () => (
    <>
      <div className="input-group">
        <label>Vehicle Name *</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., My Honda Civic"
          required
        />
      </div>

      <div className="input-toggle">
        <button
          type="button"
          className={useVin ? 'active' : ''}
          onClick={() => setUseVin(true)}
        >
          Use VIN
        </button>
        <button
          type="button"
          className={!useVin ? 'active' : ''}
          onClick={() => setUseVin(false)}
        >
          Use Model
        </button>
      </div>

      {useVin ? (
        <div className="input-group">
          <label>VIN Number</label>
          <input
            type="text"
            name="vin"
            value={formData.vin}
            onChange={handleChange}
            placeholder="e.g., 1HGCM82633A123456"
            maxLength={17}
          />
        </div>
      ) : (
        <div className="input-group">
          <label>Car Model</label>
          <input
            type="text"
            name="model"
            value={formData.model}
            onChange={handleChange}
            placeholder="e.g., 2020 Toyota Camry"
          />
        </div>
      )}

      <div className="input-group">
        <label>Current Mileage *</label>
        <input
          type="number"
          name="current_mileage"
          value={formData.current_mileage}
          onChange={handleChange}
          placeholder="e.g., 45000"
          min="0"
          required
        />
      </div>

      <div className="input-group">
        <label>Daily Commute (one way) *</label>
        <input
          type="number"
          name="daily_commute"
          value={formData.daily_commute}
          onChange={handleChange}
          placeholder="e.g., 15"
          min="1"
          required
        />
        <small>miles (round trip calculated automatically)</small>
      </div>

      <div className="input-group">
        <label>ZIP Code *</label>
        <input
          type="text"
          name="zip_code"
          value={formData.zip_code}
          onChange={handleChange}
          placeholder="e.g., 90210"
          maxLength={10}
          required
        />
      </div>

      <div className="input-group">
        <label>MPG (optional)</label>
        <input
          type="number"
          name="mpg"
          value={formData.mpg}
          onChange={handleChange}
          placeholder="e.g., 28"
          min="1"
          step="0.1"
        />
      </div>
    </>
  );

  const renderEngineSection = () => (
    <>
      <div className="input-group">
        <label>Last Oil Change Date</label>
        <input
          type="date"
          name="last_oil_change"
          value={formData.last_oil_change}
          onChange={handleChange}
        />
        <small>Leave empty if unknown - we'll use current mileage</small>
      </div>

      <div className="input-group">
        <label>Oil Change Interval</label>
        <select
          name="oil_change_interval"
          value={formData.oil_change_interval}
          onChange={handleChange}
        >
          <option value="3000">3,000 miles (Standard)</option>
          <option value="5000">5,000 miles (Recommended)</option>
          <option value="7500">7,500 miles (Synthetic)</option>
          <option value="10000">10,000 miles (Full Synthetic)</option>
        </select>
      </div>
    </>
  );

  const renderTiresSection = () => (
    <>
      <div className="input-group">
        <label>Last Tire Rotation Date</label>
        <input
          type="date"
          name="last_tire_rotation"
          value={formData.last_tire_rotation}
          onChange={handleChange}
        />
        <small>Leave empty to skip tire rotation tracking</small>
      </div>

      {formData.last_tire_rotation && (
        <div className="input-group">
          <label>Tire Rotation Interval</label>
          <select
            name="tire_rotation_interval"
            value={formData.tire_rotation_interval}
            onChange={handleChange}
          >
            <option value="5000">5,000 miles</option>
            <option value="7500">7,500 miles (Standard)</option>
            <option value="10000">10,000 miles</option>
          </select>
        </div>
      )}

      <div className="input-group">
        <label>Tire Pressure Check Frequency</label>
        <select
          name="tire_pressure_check"
          value={formData.tire_pressure_check}
          onChange={handleChange}
        >
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
        </select>
      </div>
    </>
  );

  return (
    <div className="form-container">
      <h2>{isEditMode ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>
      
      <div className="form-section-tabs">
        <button
          type="button"
          className={activeSection === 'basic' ? 'active' : ''}
          onClick={() => setActiveSection('basic')}
        >
          Basic Info
        </button>
        <button
          type="button"
          className={activeSection === 'engine' ? 'active' : ''}
          onClick={() => setActiveSection('engine')}
        >
          Engine
        </button>
        <button
          type="button"
          className={activeSection === 'tires' ? 'active' : ''}
          onClick={() => setActiveSection('tires')}
        >
          Tires
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {activeSection === 'basic' && renderBasicSection()}
        {activeSection === 'engine' && renderEngineSection()}
        {activeSection === 'tires' && renderTiresSection()}

        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (isEditMode ? 'Saving...' : 'Adding...') : (isEditMode ? 'Save Changes' : 'Add Vehicle')}
          </button>
        </div>
      </form>
    </div>
  );
}
