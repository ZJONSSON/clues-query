var Query = require('../index');

var data = [
  {'Country': 'France', 'Aspect': 'Cost_of_Living', 'Value': 55},
  {'Country': 'France', 'Aspect': 'Undefined', 'Value':'NOT NUMBER'},
  {'Country': 'France', 'Aspect': 'Leisure_&_Culture', 'Value': 81},
  {'Country': 'France', 'Aspect': 'Economy', 'Value': 69},
  {'Country': 'France', 'Aspect': 'Environment', 'Value': 72},
  {'Country': 'France', 'Aspect': 'Freedom', 'Value': 100},
  {'Country': 'France', 'Aspect': 'Health', 'Value': 100},
  {'Country': 'France', 'Aspect': 'Infrastructure', 'Value': 92},
  {'Country': 'France', 'Aspect': 'Risk_&_Safety', 'Value': 100},
  {'Country': 'France', 'Aspect': 'Climate', 'Value': 87},
  {'Country': 'France', 'Aspect': 'Final', 'Value': 82},
  {'Country': 'Australia', 'Aspect': 'Cost_of_Living', 'Value': 56},
  {'Country': 'Australia', 'Aspect': 'Leisure_&_Culture', 'Value': 82},
  {'Country': 'Australia', 'Aspect': 'Economy', 'Value': 71},
  {'Country': 'Australia', 'Aspect': 'Environment', 'Value': 76},
  {'Country': 'Australia', 'Aspect': 'Freedom', 'Value': 100},
  {'Country': 'Australia', 'Aspect': 'Health', 'Value': 87},
  {'Country': 'Australia', 'Aspect': 'Infrastructure', 'Value': 92},
  {'Country': 'Australia', 'Aspect': 'Risk_&_Safety', 'Value': 100},
  {'Country': 'Australia', 'Aspect': 'Climate', 'Value': 87},
  {'Country': 'Australia', 'Aspect': 'Final', 'Value': 81},
  {'Country': 'Switzerland', 'Aspect': 'Cost_of_Living', 'Value': 41},
  {'Country': 'Switzerland', 'Aspect': 'Leisure_&_Culture', 'Value': 86},
  {'Country': 'Switzerland', 'Aspect': 'Economy', 'Value': 79},
  {'Country': 'Switzerland', 'Aspect': 'Environment', 'Value': 78},
  {'Country': 'Switzerland', 'Aspect': 'Freedom', 'Value': 100},
  {'Country': 'Switzerland', 'Aspect': 'Health', 'Value': 95},
  {'Country': 'Switzerland', 'Aspect': 'Infrastructure', 'Value': 96},
  {'Country': 'Switzerland', 'Aspect': 'Risk_&_Safety', 'Value': 100},
  {'Country': 'Switzerland', 'Aspect': 'Climate', 'Value': 77},
  {'Country': 'Switzerland', 'Aspect': 'Final', 'Value': 81}
];

module.exports = Object.setPrototypeOf(data,Query);