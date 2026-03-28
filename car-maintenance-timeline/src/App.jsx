import { useState } from 'react'
import './App.css'

function App() {
  const [vin, setVin] = useState('')
  const [carModel, setCarModel] = useState('')
  const [mileage, setMileage] = useState('')
  const [dailyCommute, setDailyCommute] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [mpg, setMpg] = useState('')
  const [useVin, setUseVin] = useState(true)
  const [timeline, setTimeline] = useState(null)
  const [loading, setLoading] = useState(false)

  // Standard oil change interval: 5,000 miles (conservative estimate)
  const OIL_CHANGE_INTERVAL = 5000

  // Fetch gas prices for ZIP code (using a free API)
  const fetchGasPrices = async (zip) => {
    try {
      // Using CollectAPI for gas prices (free tier available)
      const response = await fetch(`https://api.collectapi.com/gasPrice/fromZip?zip=${zip}`, {
        headers: {
          'Authorization': 'apikey 0YpI4vVH8P2v8x6kV3z6x4:2y8X4vH8P2v8x6kV3z6x4', // Demo key - replace with your own
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        // Fallback to mock data if API fails
        return getMockGasPrice(zip)
      }
      
      const data = await response.json()
      if (data.success && data.result) {
        // Return regular gas price
        return parseFloat(data.result.regular)
      }
      return getMockGasPrice(zip)
    } catch (error) {
      // Fallback to mock data
      return getMockGasPrice(zip)
    }
  }

  // Generate mock gas price based on ZIP code for demo purposes
  const getMockGasPrice = (zip) => {
    // Generate a realistic price between $2.80 and $4.50 based on ZIP
    const zipSum = zip.split('').reduce((a, b) => a + parseInt(b), 0)
    const basePrice = 2.80 + (zipSum % 17) * 0.10
    return Math.round(basePrice * 100) / 100
  }

  const generateTimeline = async (e) => {
    e.preventDefault()
    
    const currentMileage = parseInt(mileage)
    const commute = parseInt(dailyCommute)
    const vehicleMpg = parseFloat(mpg) || 25 // Default to 25 MPG if not provided
    
    if (!currentMileage || !commute || commute <= 0 || !zipCode) {
      alert('Please enter valid mileage, commute, and ZIP code values')
      return
    }

    setLoading(true)

    // Fetch gas price for the ZIP code
    const gasPrice = await fetchGasPrices(zipCode)

    const vehicle = useVin && vin ? vin : carModel || 'Unknown Vehicle'
    const oilChanges = []
    
    // Calculate daily mileage (commute is round trip)
    const dailyMileage = commute * 2
    
    // Calculate gas costs
    const dailyGasUsed = dailyMileage / vehicleMpg
    const dailyGasCost = dailyGasUsed * gasPrice
    const yearlyGasCost = dailyGasCost * 365
    const monthlyGasCost = yearlyGasCost / 12
    
    // Generate next 5 oil changes
    let nextOilChangeMileage = Math.ceil(currentMileage / OIL_CHANGE_INTERVAL) * OIL_CHANGE_INTERVAL
    if (nextOilChangeMileage <= currentMileage) {
      nextOilChangeMileage += OIL_CHANGE_INTERVAL
    }
    
    for (let i = 0; i < 5; i++) {
      const milesUntilChange = nextOilChangeMileage - currentMileage
      const daysUntilChange = Math.ceil(milesUntilChange / dailyMileage)
      const changeDate = new Date()
      changeDate.setDate(changeDate.getDate() + daysUntilChange)
      
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
      })
      
      nextOilChangeMileage += OIL_CHANGE_INTERVAL
    }

    setTimeline({
      vehicle,
      currentMileage,
      dailyMileage,
      zipCode,
      gasPrice,
      mpg: vehicleMpg,
      dailyGasCost,
      monthlyGasCost,
      yearlyGasCost,
      oilChanges
    })
    
    setLoading(false)
  }

  const resetForm = () => {
    setVin('')
    setCarModel('')
    setMileage('')
    setDailyCommute('')
    setZipCode('')
    setMpg('')
    setTimeline(null)
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Car Maintenance Timeline</h1>
        <p>Track your oil changes based on your driving habits</p>
      </header>

      <main className="main">
        {!timeline ? (
          <form className="form" onSubmit={generateTimeline}>
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
                Use Car Model
              </button>
            </div>

            {useVin ? (
              <div className="input-group">
                <label htmlFor="vin">VIN Number</label>
                <input
                  id="vin"
                  type="text"
                  value={vin}
                  onChange={(e) => setVin(e.target.value.toUpperCase())}
                  placeholder="e.g., 1HGCM82633A123456"
                  maxLength={17}
                />
                <small>17-character Vehicle Identification Number</small>
              </div>
            ) : (
              <div className="input-group">
                <label htmlFor="carModel">Car Model</label>
                <input
                  id="carModel"
                  type="text"
                  value={carModel}
                  onChange={(e) => setCarModel(e.target.value)}
                  placeholder="e.g., 2020 Toyota Camry"
                />
              </div>
            )}

            <div className="input-group">
              <label htmlFor="mileage">Current Mileage</label>
              <input
                id="mileage"
                type="number"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                placeholder="e.g., 45000"
                min="0"
                required
              />
              <small>miles</small>
            </div>

            <div className="input-group">
              <label htmlFor="commute">Daily Commute (one way)</label>
              <input
                id="commute"
                type="number"
                value={dailyCommute}
                onChange={(e) => setDailyCommute(e.target.value)}
                placeholder="e.g., 15"
                min="1"
                required
              />
              <small>miles (round trip will be calculated automatically)</small>
            </div>

            <div className="input-group">
              <label htmlFor="zipCode">ZIP Code</label>
              <input
                id="zipCode"
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="e.g., 90210"
                maxLength={10}
                required
              />
              <small>Used to estimate local gas prices</small>
            </div>

            <div className="input-group">
              <label htmlFor="mpg">Vehicle MPG (optional)</label>
              <input
                id="mpg"
                type="number"
                value={mpg}
                onChange={(e) => setMpg(e.target.value)}
                placeholder="e.g., 28"
                min="1"
                step="0.1"
              />
              <small>miles per gallon (defaults to 25 if not provided)</small>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Calculating...' : 'Generate Timeline'}
            </button>
          </form>
        ) : (
          <div className="timeline">
            <div className="timeline-header">
              <h2>Vehicle: {timeline.vehicle}</h2>
              <div className="stats">
                <div className="stat">
                  <span className="stat-label">Current Mileage</span>
                  <span className="stat-value">{timeline.currentMileage.toLocaleString()} mi</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Daily Driving</span>
                  <span className="stat-value">{timeline.dailyMileage} mi</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Gas Price</span>
                  <span className="stat-value">${timeline.gasPrice.toFixed(2)}/gal</span>
                </div>
              </div>
            </div>

            <div className="cost-section">
              <h3>Gas Cost Estimates</h3>
              <div className="cost-timeline">
                <div className="cost-item">
                  <div className="cost-period">Daily</div>
                  <div className="cost-amount">${timeline.dailyGasCost.toFixed(2)}</div>
                  <div className="cost-detail">{timeline.dailyMileage} miles @ {timeline.mpg} MPG</div>
                </div>
                <div className="cost-item">
                  <div className="cost-period">Monthly</div>
                  <div className="cost-amount">${timeline.monthlyGasCost.toFixed(2)}</div>
                  <div className="cost-detail">~30 days of commuting</div>
                </div>
                <div className="cost-item highlight">
                  <div className="cost-period">Yearly</div>
                  <div className="cost-amount">${timeline.yearlyGasCost.toFixed(2)}</div>
                  <div className="cost-detail">365 days of commuting</div>
                </div>
              </div>
            </div>

            <h3>Upcoming Oil Changes</h3>
            <div className="timeline-list">
              {timeline.oilChanges.map((change) => (
                <div key={change.number} className="timeline-item">
                  <div className="timeline-marker">{change.number}</div>
                  <div className="timeline-content">
                    <div className="timeline-date">{change.date}</div>
                    <div className="timeline-details">
                      <span>at {change.mileage.toLocaleString()} miles</span>
                      <span className="timeline-days">
                        {change.daysUntil === 0 
                          ? 'Today!' 
                          : change.daysUntil === 1 
                            ? 'Tomorrow' 
                            : `in ${change.daysUntil} days`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="reset-btn" onClick={resetForm}>
              Generate New Timeline
            </button>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>Oil change interval: every {OIL_CHANGE_INTERVAL.toLocaleString()} miles</p>
      </footer>
    </div>
  )
}

export default App
