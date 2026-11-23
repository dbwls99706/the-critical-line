export const hall = {x: 0, z: 7.1, aimX: 0, aimZ: -4};

export const stations = [
  {aimX: -8.15, aimZ: -10.6, color: 0x7bdce7, name: 'The Critical Line'},
  {aimX: 8.15, aimZ: -42.2, color: 0xf0948b, name: 'The Mirror'},
  {aimX: 0, aimZ: -50.5, color: 0xffc877, name: 'Proof Relay', width: 7.6},
  {aimX: 8.15, aimZ: -16.6, color: 0xe8ba76, name: 'The Prime Signal'},
  {aimX: -8.15, aimZ: -25.8, color: 0xc1a9ee, name: 'The Inert Primes'},
  {aimX: 8.15, aimZ: -31.8, color: 0x8bddbc, name: 'The Theta Chain'},
  {aimX: -8.15, aimZ: -41, color: 0xa4bcff, name: 'The Zero-Free Half'},
].map((station) => ({...station, x: station.aimX, z: station.aimZ + 4.5, wallZ: station.aimZ - 2.5}));

export const proofOrder = [0, 3, 4, 5, 6, 1, 2];
export const building = {left: -12.9, right: 12.9, entrance: 10.9, back: -56};
export const columnRows = [5.8, .55, -4.7, -9.95, -15.2, -20.45, -28.6, -34.75, -44, -52.5];
export const columnX = 5.6;
export const hallPiece = {x: 0, z: -4, width: 7.6, length: 6.25};

export const spine = [
  [0, 7.1], [0, 2.15], [-8.15, 2.15], [-8.15, stations[0].z],
  [-8.15, -7.2], [0, -7.2], [0, stations[3].z], [8.15, stations[3].z],
  [0, stations[3].z], [0, stations[4].z], [-8.15, stations[4].z],
  [0, stations[4].z], [0, stations[5].z], [8.15, stations[5].z],
  [0, stations[5].z], [0, stations[6].z], [-8.15, stations[6].z],
  [0, stations[6].z], [0, stations[1].z], [8.15, stations[1].z],
  [0, stations[1].z], [0, stations[2].z],
];

export const portals = [-20.1, -34.05];
