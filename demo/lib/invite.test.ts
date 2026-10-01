import { afterEach, describe, expect, it, vi } from 'vitest';
import { markInviteSeen, readInviteSeen, resetInviteForTests, shouldInvite } from './invite.js';

afterEach(() => {
  resetInviteForTests();
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('the Customise invitation', () => {
  it('shows on a first visit to the docs, at desktop width', () => {
    expect(shouldInvite({ hash: '#/', width: 1280, seen: false })).toBe(true);
    expect(shouldInvite({ hash: '#/components/kt-button', width: 1280, seen: false })).toBe(true);
  });

  it('never shows once seen, in an app, or on a phone', () => {
    expect(shouldInvite({ hash: '#/', width: 1280, seen: true })).toBe(false);
    expect(shouldInvite({ hash: '#/app/console/home', width: 1280, seen: false })).toBe(false);
    expect(shouldInvite({ hash: '#/', width: 599, seen: false })).toBe(false);
  });

  it('is remembered as seen', () => {
    expect(readInviteSeen()).toBe(false);
    markInviteSeen();
    expect(readInviteSeen()).toBe(true);
  });

  it('counts as seen for the page when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(readInviteSeen()).toBe(false);
    expect(() => markInviteSeen()).not.toThrow();
    expect(readInviteSeen()).toBe(true);
  });
});
