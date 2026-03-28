import { useMemo, useState, useEffect } from 'react';

// Service cost mapping
const SERVICE_COSTS = {
  'Oil & filter change': 75,
  'Tire rotation': 45,
  'Multi-point inspection': 0,
  'Fluid level checks': 0,
  'Cabin air filter': 35,
  'Front axle inspection': 60,
  'Engine air filter': 40,
  'Belt & hose inspection': 50,
  'Spark plug inspection': 80,
  'Brake fluid check': 30,
  'Transmission fluid check': 60,
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

const TIME_FRAMES = {
  '1month': { weeks: 4, label: '1 Month' },
  '3months': { weeks: 13, label: '3 Months' },
  '6months': { weeks: 26, label: '6 Months' },
  '1year': { weeks: 52, label: '1 Year' }
};

export function MaintenanceSchedule({ vehicles, compact = false }) {
  const [timeFrame, setTimeFrame] = useState('3months');
  const [columnWidth, setColumnWidth] = useState(60);

  const scheduleData = useMemo(() => {
    if (!vehicles || vehicles.length === 0) return null;

    const today = new Date();
    const maxWeeks = TIME_FRAMES[timeFrame].weeks;
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + (maxWeeks * 7));

    // Generate weeks based on selected time frame
    const weeks = [];
    for (let i = 0; i < maxWeeks; i++) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() + (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weeks.push({
        weekNum: i + 1,
        start: weekStart,
        end: weekEnd,
        label: `${weekStart.toLocaleDateString('en-US', { month: 'short' })}`,
        dateRange: `${weekStart.getDate()}`
      });
    }

    // Calculate maintenance for each vehicle
    const allMaintenanceItems = [];
    
    vehicles.forEach(vehicle => {
      const currentMileage = vehicle.current_mileage;
      const dailyMileage = vehicle.daily_commute * 2;
      const oilInterval = vehicle.oil_change_interval || 5000;
      const tireInterval = vehicle.tire_rotation_interval || 7500;

      // Calculate when oil change is due
      const milesToOilChange = oilInterval - (currentMileage % oilInterval);
      const daysToOilChange = Math.ceil(milesToOilChange / dailyMileage);
      const oilChangeDate = new Date(today);
      oilChangeDate.setDate(today.getDate() + daysToOilChange);

      if (oilChangeDate <= endDate) {
        const weekIndex = Math.floor((oilChangeDate - today) / (7 * 24 * 60 * 60 * 1000));
        allMaintenanceItems.push({
          id: `${vehicle.id}-oil`,
          vehicleName: vehicle.name,
          vehicleId: vehicle.id,
          type: 'Oil & filter change',
          date: oilChangeDate,
          weekIndex: Math.min(weekIndex, maxWeeks - 1),
          cost: SERVICE_COSTS['Oil & filter change'] || 75,
          category: 'routine'
        });
      }

      // Calculate when tire rotation is due
      const milesToTireRotation = tireInterval - (currentMileage % tireInterval);
      const daysToTireRotation = Math.ceil(milesToTireRotation / dailyMileage);
      const tireRotationDate = new Date(today);
      tireRotationDate.setDate(today.getDate() + daysToTireRotation);

      if (tireRotationDate <= endDate) {
        const weekIndex = Math.floor((tireRotationDate - today) / (7 * 24 * 60 * 60 * 1000));
        allMaintenanceItems.push({
          id: `${vehicle.id}-tire`,
          vehicleName: vehicle.name,
          vehicleId: vehicle.id,
          type: 'Tire rotation',
          date: tireRotationDate,
          weekIndex: Math.min(weekIndex, maxWeeks - 1),
          cost: SERVICE_COSTS['Tire rotation'] || 45,
          category: 'routine'
        });
      }

      // Add other service milestones based on upcoming intervals
      const intervals = [10000, 20000, 30000, 40000, 50000, 60000];
      intervals.forEach(interval => {
        const nextServiceMileage = Math.ceil(currentMileage / interval) * interval;
        if (nextServiceMileage > currentMileage) {
          const milesToService = nextServiceMileage - currentMileage;
          const daysToService = Math.ceil(milesToService / dailyMileage);
          const serviceDate = new Date(today);
          serviceDate.setDate(today.getDate() + daysToService);

          if (serviceDate <= endDate) {
            const weekIndex = Math.floor((serviceDate - today) / (7 * 24 * 60 * 60 * 1000));
            const services = getServicesForMileage(nextServiceMileage);
            services.forEach((service, idx) => {
              allMaintenanceItems.push({
                id: `${vehicle.id}-service-${interval}-${idx}`,
                vehicleName: vehicle.name,
                vehicleId: vehicle.id,
                type: service,
                date: serviceDate,
                weekIndex: Math.min(weekIndex, maxWeeks - 1),
                cost: SERVICE_COSTS[service] || 50,
                category: getCategoryForService(service)
              });
            });
          }
        }
      });
    });

    const grandTotal = allMaintenanceItems.reduce((sum, item) => sum + item.cost, 0);

    return {
      weeks,
      items: allMaintenanceItems,
      grandTotal,
      timeFrameLabel: TIME_FRAMES[timeFrame].label
    };
  }, [vehicles, timeFrame]);

  if (!scheduleData) {
    if (compact) return null;
    return (
      <div className="maintenance-schedule">
        <h2>Maintenance Schedule</h2>
        <div className="empty-state">
          <p>Add vehicles to see your maintenance schedule</p>
        </div>
      </div>
    );
  }

  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState(['routine', 'major', 'critical']);

  // Update selected vehicles when schedule data changes (new vehicles added)
  useEffect(() => {
    const vehicleIds = [...new Set(scheduleData.items.map(item => item.vehicleId))];
    setSelectedVehicles(prev => {
      // Keep existing selections and add any new vehicles
      const newIds = vehicleIds.filter(id => !prev.includes(id));
      return [...prev, ...newIds];
    });
  }, [scheduleData.items]);

  const toggleVehicle = (vehicleId) => {
    setSelectedVehicles(prev => 
      prev.includes(vehicleId)
        ? prev.filter(id => id !== vehicleId)
        : [...prev, vehicleId]
    );
  };

  const toggleCategory = (category) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const filteredItems = scheduleData.items.filter(item => 
    selectedVehicles.includes(item.vehicleId) && 
    selectedCategories.includes(item.category)
  );

  // Get unique vehicles (one entry per vehicle)
  const vehicleList = [...new Map(scheduleData.items.map(item => [item.vehicleId, { 
    id: item.vehicleId, 
    name: item.vehicleName 
  }])).values()];

  return (
    <div className={`maintenance-schedule ${compact ? 'compact' : ''}`}>
      <div className="schedule-header">
        <h2>Maintenance Schedule</h2>
        <div className="schedule-controls">
          <div className="time-frame-selector">
            {Object.entries(TIME_FRAMES).map(([key, { label }]) => (
              <button
                key={key}
                className={`time-frame-btn ${timeFrame === key ? 'active' : ''}`}
                onClick={() => setTimeFrame(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="column-width-control">
            <span>Column:</span>
            <input
              type="range"
              min="40"
              max="120"
              value={columnWidth}
              onChange={(e) => setColumnWidth(parseInt(e.target.value))}
            />
            <span>{columnWidth}px</span>
          </div>
        </div>
        <div className="schedule-summary">
          <span className="total-cost">Total: ${scheduleData.grandTotal.toLocaleString()}</span>
          <span className="schedule-period">Next {scheduleData.timeFrameLabel}</span>
        </div>
      </div>

      {/* Vehicle Filter */}
      <div className="vehicle-filter">
        <span className="filter-label">Vehicles:</span>
        {vehicleList.map(v => (
          <button
            key={v.id}
            className={`vehicle-filter-btn ${selectedVehicles.includes(v.id) ? 'active' : ''}`}
            onClick={() => toggleVehicle(v.id)}
          >
            {v.name}
          </button>
        ))}
      </div>

      {/* Gantt Chart */}
      <div className="gantt-container">
        {/* Header Row with Weeks */}
        <div className="gantt-header">
          <div className="gantt-label-col">Vehicle</div>
          <div className="gantt-weeks">
            {scheduleData.weeks.map(week => (
              <div 
                key={week.weekNum} 
                className="gantt-week-col"
                style={{ width: `${columnWidth}px` }}
              >
                <div className="week-label">{week.label}</div>
                <div className="week-dates">{week.dateRange}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Gantt Rows - Grouped by Vehicle */}
        <div className="gantt-body">
          {filteredItems.length === 0 ? (
            <div className="gantt-empty">No maintenance scheduled for selected vehicles</div>
          ) : (
            vehicleList
              .filter(v => selectedVehicles.includes(v.id))
              .map(vehicle => {
                const vehicleItems = filteredItems.filter(item => item.vehicleId === vehicle.id);
                if (vehicleItems.length === 0) return null;
                
                return (
                  <div key={vehicle.id} className="gantt-row">
                    <div className="gantt-label-col">
                      <div className="row-vehicle">{vehicle.name}</div>
                    </div>
                    <div className="gantt-weeks">
                      {scheduleData.weeks.map(week => {
                        const weekItems = vehicleItems.filter(item => item.weekIndex === week.weekNum - 1);
                        const weekCost = weekItems.reduce((sum, item) => sum + item.cost, 0);
                        const hasCritical = weekItems.some(item => item.category === 'critical');
                        const hasMajor = weekItems.some(item => item.category === 'major');
                        const category = hasCritical ? 'critical' : hasMajor ? 'major' : 'routine';
                        
                        return (
                          <div 
                            key={week.weekNum} 
                            className={`gantt-week-col ${weekItems.length > 0 ? 'has-task' : ''}`}
                            style={{ width: `${columnWidth}px` }}
                            title={weekItems.map(i => `${i.type} ($${i.cost})`).join('\n')}
                          >
                            {weekItems.length > 0 && (
                              <div className={`gantt-bar ${category}`}>
                                <span className="bar-count">{weekItems.length}</span>
                                <span className="bar-cost">${weekCost}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* Category Filter */}
      <div className="category-filter">
        <span className="filter-label">Show:</span>
        {['routine', 'major', 'critical'].map(cat => (
          <button
            key={cat}
            className={`category-filter-btn ${selectedCategories.includes(cat) ? 'active' : ''} ${cat}`}
            onClick={() => toggleCategory(cat)}
          >
            <span className="filter-dot"></span>
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}

function getServicesForMileage(mileage) {
  const services = ['Multi-point inspection'];
  
  if (mileage % 10000 === 0) {
    services.push('Oil & filter change', 'Tire rotation');
  }
  if (mileage % 30000 === 0) {
    services.push('Engine air filter', 'Cabin air filter');
  }
  if (mileage % 60000 === 0) {
    services.push('Spark plugs replacement', 'Transmission fluid');
  }
  
  return services;
}

function getCategoryForService(service) {
  const routine = ['Oil & filter change', 'Tire rotation', 'Multi-point inspection', 'Fluid level checks'];
  const critical = ['Spark plugs replacement', 'Timing belt replacement', 'Transmission fluid'];
  
  if (routine.includes(service)) return 'routine';
  if (critical.includes(service)) return 'critical';
  return 'major';
}
