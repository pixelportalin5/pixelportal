export const ORBIT_SPEED = 0.05;

export const SUN = { name: 'Sun', radius: 42, model: '/models/sun.glb', scale: 1.26 };

export const PLANETS = [
  { id: 0, name: 'Mercury', distance: 150, radius: 2.6, speed: 1.60, model: '/models/mercury.glb', scale: 1.0, facts: { Distance: '57.9M km', Period: '88 days' } },
  { id: 1, name: 'Venus', distance: 230, radius: 5.4, speed: 1.17, model: '/models/venus.glb', scale: 1.0, facts: { Distance: '108.2M km', Period: '225 days' } },
  { id: 2, name: 'Earth', distance: 310, radius: 5.7, speed: 1.0, model: '/models/earth.glb', scale: 1.0, facts: { Distance: '149.6M km', Period: '365 days' } },
  { id: 3, name: 'Mars', distance: 390, radius: 3.0, speed: 0.8, model: '/models/mars.glb', scale: 1.0, facts: { Distance: '227.9M km', Period: '687 days' } },
  { id: 4, name: 'Jupiter', distance: 520, radius: 10.0, speed: 0.43, model: '/models/jupiter.glb', scale: 1.0, facts: { Distance: '778.6M km', Period: '11.9 years' } },
  { id: 5, name: 'Saturn', distance: 660, radius: 8.5, speed: 0.32, model: '/models/saturn.glb', scale: 1.0, facts: { Distance: '1.43B km', Period: '29.5 years' } },
  { id: 6, name: 'Uranus', distance: 800, radius: 4.0, speed: 0.23, model: '/models/uranus.glb', scale: 1.0, facts: { Distance: '2.87B km', Period: '84 years' } },
  { id: 7, name: 'Neptune', distance: 940, radius: 3.9, speed: 0.18, model: '/models/neptune.glb', scale: 1.0, facts: { Distance: '4.50B km', Period: '165 years' } },
];