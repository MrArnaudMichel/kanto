import { afterEach, vi } from 'vitest';
import { cleanupFixtures } from './fixture.js';

/**
 * No test reaches the network.
 *
 * The docs shell asks GitHub for the release list on the release route, so
 * mounting it in a test would fire a real request — slow, flaky, and rate-
 * limited against whoever happens to be running the suite. Anything that wants
 * a specific response stubs this itself.
 */
vi.stubGlobal(
  'fetch',
  vi.fn(() => Promise.reject(new TypeError('Network requests are disabled in tests'))),
);

afterEach(() => {
  cleanupFixtures();
});
