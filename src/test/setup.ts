import { afterEach } from 'vitest';
import { cleanupFixtures } from './fixture.js';

afterEach(() => {
  cleanupFixtures();
});
