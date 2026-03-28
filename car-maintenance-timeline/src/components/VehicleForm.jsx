import { useState } from 'react';

export function VehicleForm({ onSubmit, onCancel }) {
  const [useVin, setUseVin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    vin: '',
    model: '',
    current_mileage: '',
    daily_commute: '',
    zip_code: '',
    mpg: '25'
  });

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
      gas_price: gasPrice
    };

    await onSubmit(vehicleData);
    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="form-container">
      <h2>Add New Vehicle</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Vehicle Name</label>
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
              required={useVin}
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
              required={!useVin}
            />
          </div>
        )}

        <div className="input-group">
          <label>Current Mileage</label>
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
          <label>Daily Commute (one way)</label>
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
          <label>ZIP Code</label>
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

        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Adding...' : 'Add Vehicle'}
          </button>
        </div>
      </form>
    </div>
  );
}
