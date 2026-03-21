/**
 * Stub handlers for all 7 analyzer modules.
 * These return placeholder data until Phase 2 builds out real logic.
 */

const stubs = {
  food: () => ({
    module: 'food',
    title: 'Food Calorie Counter',
    status: 'coming_soon',
    data: {
      items: [{ name: 'Detected food item', calories: null, protein: null, carbs: null, fat: null }],
      total_calories: null,
      message: 'Full nutritional analysis coming in Phase 2.'
    }
  }),

  plant: () => ({
    module: 'plant',
    title: 'Plant Health Detector',
    status: 'coming_soon',
    data: {
      species: null,
      health_status: null,
      issues: [],
      care_tips: [],
      message: 'Plant identification and health analysis coming in Phase 2.'
    }
  }),

  receipt: () => ({
    module: 'receipt',
    title: 'Receipt Scanner',
    status: 'coming_soon',
    data: {
      merchant: null,
      date: null,
      items: [],
      total: null,
      message: 'Receipt parsing and budget tracking coming in Phase 2.'
    }
  }),

  room: () => ({
    module: 'room',
    title: 'Room Interior Estimator',
    status: 'coming_soon',
    data: {
      room_type: null,
      estimated_renovation_cost: null,
      suggestions: [],
      message: 'Room analysis and cost estimation coming in Phase 2.'
    }
  }),

  math: () => ({
    module: 'math',
    title: 'Math Problem Solver',
    status: 'coming_soon',
    data: {
      problem: null,
      solution: null,
      steps: [],
      message: 'Step-by-step math solving coming in Phase 2.'
    }
  }),

  car_damage: () => ({
    module: 'car_damage',
    title: 'Car Damage Estimator',
    status: 'coming_soon',
    data: {
      damage_type: null,
      severity: null,
      estimated_repair_cost: null,
      message: 'Car damage detection and cost estimation coming in Phase 2.'
    }
  }),

  waste: () => ({
    module: 'waste',
    title: 'Waste Classifier',
    status: 'coming_soon',
    data: {
      waste_type: null,
      is_recyclable: null,
      disposal_method: null,
      message: 'Waste classification and recycling guide coming in Phase 2.'
    }
  })
};

/**
 * @param {string} category
 * @returns {object}
 */
function runStub(category) {
  const handler = stubs[category];
  if (!handler) {
    throw new Error(`No handler for category: ${category}`);
  }
  return handler();
}

module.exports = { runStub };
