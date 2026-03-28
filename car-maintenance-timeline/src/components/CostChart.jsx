import { useState, useMemo } from 'react';

// Service cost mapping
const SERVICE_COSTS = {
  // Routine
  'Oil & filter change': 75,
  'Tire rotation': 45,
  'Multi-point inspection': 0,
  'Fluid level checks': 0,
  // Major
  'Cabin air filter': 35,
  'Front axle inspection': 60,
  'Engine air filter': 40,
  'Belt & hose inspection': 50,
  'Spark plug inspection': 80,
  'Brake fluid check': 30,
  'Transmission fluid check': 60,
  // Critical
  'Spark plugs replacement': 250,
  'Brake fluid flush': 120,
  'Engine coolant flush': 150,
  'Accessory drive belt inspect': 40,
  'Timing belt inspection': 100,
  'Timing belt replacement': 800,
  'Water pump inspection': 80,
  'Transmission fluid': 200,
  'Transfer case fluid': 120,
  'Axle lubricants': 90,
  'Accessory belt replace': 180
};

export function CostChart({ timeline }) {
  const [timeRange, setTimeRange] = useState('1year');
  const [selectedCategories, setSelectedCategories] = useState({
    all: true,
    gas: true,
    routine: true,
    major: true,
    critical: true
  });

  const { chartData, maxValue } = useMemo(() => {
    if (!timeline) return { chartData: [], maxValue: 0 };

    const today = new Date();
    let totalDays = 365;
    
    switch (timeRange) {
      case '1month': totalDays = 30; break;
      case '3months': totalDays = 90; break;
      case '6months': totalDays = 180; break;
      case '1year': totalDays = 365; break;
      case '2years': totalDays = 730; break;
      default: totalDays = 365;
    }

    // Build a map of day -> maintenance costs by type for that day
    const maintenanceByDay = new Map();
    
    if (timeline.serviceMilestones) {
      timeline.serviceMilestones.forEach(milestone => {
        // Skip events outside our time range
        if (milestone.daysUntil > totalDays) return;
        
        const day = milestone.daysUntil;
        const dayCosts = maintenanceByDay.get(day) || { routine: 0, major: 0, critical: 0, total: 0 };
        
        milestone.services.forEach(service => {
          const cost = SERVICE_COSTS[service.name] || 50;
          dayCosts[service.type] += cost;
          dayCosts.total += cost;
        });
        
        maintenanceByDay.set(day, dayCosts);
      });
    }

    // Generate daily data points - every day
    const dataPoints = [];
    const monthlyGasCost = timeline.monthlyGasCost || 0;
    const dailyGasCost = monthlyGasCost / 30;
    
    let cumulativeGas = 0;
    let cumulativeRoutine = 0;
    let cumulativeMajor = 0;
    let cumulativeCritical = 0;
    
    for (let day = 0; day <= totalDays; day++) {
      // Calculate gas cost for this day (with inflation)
      const inflationFactor = 1 + (day / 30) * 0.005;
      const dailyGas = dailyGasCost * inflationFactor;
      cumulativeGas += dailyGas;
      
      // Add maintenance costs if any occur on this day
      const dayMaint = maintenanceByDay.get(day) || { routine: 0, major: 0, critical: 0, total: 0 };
      cumulativeRoutine += dayMaint.routine;
      cumulativeMajor += dayMaint.major;
      cumulativeCritical += dayMaint.critical;
      
      const date = new Date(today);
      date.setDate(date.getDate() + day);
      
      dataPoints.push({
        dayOffset: day,
        date: date,
        gas: cumulativeGas,
        routine: cumulativeRoutine,
        major: cumulativeMajor,
        critical: cumulativeCritical,
        maintenance: cumulativeRoutine + cumulativeMajor + cumulativeCritical,
        total: cumulativeGas + cumulativeRoutine + cumulativeMajor + cumulativeCritical,
        dailyMaint: dayMaint.total
      });
    }

    const maxVal = Math.max(...dataPoints.map(d => d.total));

    return { chartData: dataPoints, maxValue: maxVal };
  }, [timeline, timeRange]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  if (chartData.length === 0) return null;

  const chartHeight = 200;
  const totalDays = chartData[chartData.length - 1]?.dayOffset || 365;

  return (
    <div className="cost-chart-container">
      <div className="chart-header">
        <h3>Estimated Costs Over Time</h3>
        <div className="time-range-selector">
          {[
            { key: '1month', label: '1M' },
            { key: '3months', label: '3M' },
            { key: '6months', label: '6M' },
            { key: '1year', label: '1Y' },
            { key: '2years', label: '2Y' }
          ].map(({ key, label }) => (
            <button
              key={key}
              className={`time-range-btn ${timeRange === key ? 'active' : ''}`}
              onClick={() => setTimeRange(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-legend">
        <button 
          className={`legend-btn ${selectedCategories.all ? 'active' : ''}`}
          onClick={() => {
            const newAll = !selectedCategories.all;
            setSelectedCategories({
              all: newAll,
              gas: newAll,
              routine: newAll,
              major: newAll,
              critical: newAll
            });
          }}
        >
          <span className="legend-color all"></span>
          <span>All</span>
        </button>
        <button 
          className={`legend-btn ${selectedCategories.gas ? 'active' : ''}`}
          onClick={() => setSelectedCategories(prev => ({ ...prev, gas: !prev.gas, all: false }))}
        >
          <span className="legend-color gas"></span>
          <span>Fuel</span>
        </button>
        <button 
          className={`legend-btn ${selectedCategories.routine ? 'active' : ''}`}
          onClick={() => setSelectedCategories(prev => ({ ...prev, routine: !prev.routine, all: false }))}
        >
          <span className="legend-color routine"></span>
          <span>Routine</span>
        </button>
        <button 
          className={`legend-btn ${selectedCategories.major ? 'active' : ''}`}
          onClick={() => setSelectedCategories(prev => ({ ...prev, major: !prev.major, all: false }))}
        >
          <span className="legend-color major"></span>
          <span>Major</span>
        </button>
        <button 
          className={`legend-btn ${selectedCategories.critical ? 'active' : ''}`}
          onClick={() => setSelectedCategories(prev => ({ ...prev, critical: !prev.critical, all: false }))}
        >
          <span className="legend-color critical"></span>
          <span>Critical</span>
        </button>
        <div className="legend-item total">
          <span>Total: {formatCurrency(
            (selectedCategories.gas ? chartData[chartData.length - 1]?.gas : 0) +
            (selectedCategories.routine ? chartData[chartData.length - 1]?.routine : 0) +
            (selectedCategories.major ? chartData[chartData.length - 1]?.major : 0) +
            (selectedCategories.critical ? chartData[chartData.length - 1]?.critical : 0)
          )}</span>
        </div>
      </div>

      <div className="bar-chart-wrapper">
        {/* Y-axis labels */}
        <div className="y-axis">
          {[...Array(5)].map((_, i) => {
            const value = maxValue * (1 - i / 4);
            return (
              <div key={i} className="y-axis-label">
                {formatCurrency(value)}
              </div>
            );
          })}
        </div>

        {/* Bar Chart */}
        <div className="bar-chart-area">
          {/* Grid lines */}
          <div className="grid-lines">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="grid-line" />
            ))}
          </div>

          {/* Bars */}
          <div className="bars-container">
            {chartData.filter((_, i) => i % Math.ceil(chartData.length / 50) === 0).map((d, i) => {
              // Calculate visible total for scaling
              const visibleTotal = 
                (selectedCategories.gas ? d.gas : 0) +
                (selectedCategories.routine ? d.routine : 0) +
                (selectedCategories.major ? d.major : 0) +
                (selectedCategories.critical ? d.critical : 0);
              
              // Calculate max visible total across all days for proper scaling
              const maxVisibleTotal = Math.max(...chartData.map(day => 
                (selectedCategories.gas ? day.gas : 0) +
                (selectedCategories.routine ? day.routine : 0) +
                (selectedCategories.major ? day.major : 0) +
                (selectedCategories.critical ? day.critical : 0)
              ));
              
              const scale = maxVisibleTotal > 0 ? 100 / maxVisibleTotal : 0;
              
              return (
                <div key={i} className="cost-bar">
                  {selectedCategories.gas && (
                    <div className="bar-segment gas" style={{ height: `${d.gas * scale}%` }} />
                  )}
                  {selectedCategories.routine && (
                    <div className="bar-segment routine" style={{ height: `${d.routine * scale}%` }} />
                  )}
                  {selectedCategories.major && (
                    <div className="bar-segment major" style={{ height: `${d.major * scale}%` }} />
                  )}
                  {selectedCategories.critical && (
                    <div className="bar-segment critical" style={{ height: `${d.critical * scale}%` }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="bar-chart-x-axis">
        {chartData
          .filter((d) => d.dayOffset % Math.ceil(totalDays / 6) === 0 || d.dayOffset === totalDays)
          .map((d, i) => (
            <div key={i} className="x-axis-label">
              {d.date.toLocaleDateString('en-US', { month: 'short' })}
            </div>
          ))}
      </div>
    </div>
  );
}
