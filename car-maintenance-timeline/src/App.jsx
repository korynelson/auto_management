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
  const [expandedTabs, setExpandedTabs] = useState({
    oilChanges: false
  })

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
    setExpandedTabs({ oilChanges: false })
  }

  const toggleTab = (tabName) => {
    setExpandedTabs(prev => ({
      ...prev,
      [tabName]: !prev[tabName]
    }))
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
