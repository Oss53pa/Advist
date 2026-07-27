import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { checkoutService } from './checkout';

// ---------------------------------------------------------------------------
// Depuis l'harmonisation Atlas Studio, le checkout est « REDIRECT ONLY » :
// les paiements et abonnements sont gérés exclusivement sur le portail Atlas
// Studio. Le service se contente donc de fournir les URLs et de rediriger.
// ---------------------------------------------------------------------------

const ATLAS_STUDIO_PRICING = 'https://atlas-studio.org/applications/advist';
const ATLAS_STUDIO_PORTAL = 'https://atlas-studio.org/portal';

describe('checkoutService (redirect-only)', () => {
  let originalLocation: Location;

  beforeEach(() => {
    originalLocation = window.location;
    // window.location.href n'est pas assignable par défaut sous jsdom : on le
    // remplace par un objet dont href est un simple champ inscriptible.
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { href: '' } as Location,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: originalLocation,
    });
  });

  describe('getPricingUrl', () => {
    it('returns the Atlas Studio pricing URL', () => {
      expect(checkoutService.getPricingUrl()).toBe(ATLAS_STUDIO_PRICING);
    });
  });

  describe('getPortalUrl', () => {
    it('returns the Atlas Studio portal URL', () => {
      expect(checkoutService.getPortalUrl()).toBe(ATLAS_STUDIO_PORTAL);
    });
  });

  describe('redirectToAtlasStudio', () => {
    it('navigates to the Atlas Studio pricing page', () => {
      checkoutService.redirectToAtlasStudio();
      expect(window.location.href).toBe(ATLAS_STUDIO_PRICING);
    });
  });

  describe('redirectToPortal', () => {
    it('navigates to the Atlas Studio portal', () => {
      checkoutService.redirectToPortal();
      expect(window.location.href).toBe(ATLAS_STUDIO_PORTAL);
    });
  });
});
