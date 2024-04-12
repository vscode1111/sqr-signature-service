let tick = 0;

export function boom(limit = 0) {
  if (tick >= limit) {
    // throw 'Boom!';
    throw new Error('Boom');
  }

  tick++;
}
