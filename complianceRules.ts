// complianceRules.ts

// A simulated NMPB database of rules for different plants.
// NOTE: Months are 0-indexed (Jan=0, Sep=8)
const RULES_DATABASE = {
    'Ashwagandha': {
        // Current month (Sept) is IN season
        harvestSeason: { startMonth: 8, endMonth: 11 }, // Sep-Dec
    },
    'Tulsi': {
        // Current month (Sept) is OUT of season
        harvestSeason: { startMonth: 2, endMonth: 4 }, // Mar-May
    },
    'Brahmi': {
        // Current month (Sept) is OUT of season
        harvestSeason: { startMonth: 5, endMonth: 7 }, // Jun-Aug
        // A simulated protected wetland area in Thane
        protectedZone: {
            minLat: 19.25, maxLat: 19.30,
            minLon: 73.00, maxLon: 73.05,
        }
    },
    'Shatavari': {
        // Current month (Sept) is IN season
        harvestSeason: { startMonth: 8, endMonth: 10 }, // Sep-Nov
    }
};

type PlantName = keyof typeof RULES_DATABASE;

// This function is our "Live Compliance Engine"
export const checkCompliance = (plantName: PlantName, location: { latitude: number; longitude: number; }) => {
    const rules = RULES_DATABASE[plantName];
    if (!rules) {
        return { isCompliant: false, status: 'NO_RULES', message: 'Compliance rules not found for this plant.', color: '#6c757d' };
    }

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();

    // 1. Check Geo-fence if it exists for the plant
    if ('protectedZone' in rules && rules.protectedZone) {
        const { minLat, maxLat, minLon, maxLon } = rules.protectedZone;
        if (
            location.latitude > minLat && location.latitude < maxLat &&
            location.longitude > minLon && location.longitude < maxLon
        ) {
            return {
                isCompliant: false,
                status: 'PROTECTED_ZONE',
                message: `WARNING: You are in a Protected Bio-Reserve for ${plantName}. Harvesting is Prohibited.`,
                color: '#d90429' // Red
            };
        }
    }

    // 2. Check Harvest Season
    const { startMonth, endMonth } = rules.harvestSeason;
    if (currentMonth < startMonth || currentMonth > endMonth) {
         return {
            isCompliant: false,
            status: 'OUT_OF_SEASON',
            message: `Halted: ${plantName} is out of its harvest season (Current: ${currentDate.toLocaleString('default', { month: 'long' })}). Please consult NMPB guidelines.`,
            color: '#fb8500' // Orange
        };
    }

    // 3. If all checks pass
    return {
        isCompliant: true,
        status: 'COMPLIANT',
        message: `NMPB Compliant Zone for ${plantName}. Ready to commit to the ledger.`,
        color: '#2a9d8f' // Green
    };
};

// Helper function to get the list of plants for the UI
export const getAvailablePlants = (): PlantName[] => Object.keys(RULES_DATABASE) as PlantName[];

