import { useEffect } from 'react';

/**
 * Sends the user into the "Choose Plan" paywall screen, remembering where they
 * were trying to go so PaymentSuccessScreen can send them right back.
 * batchId is optional — omit it for gates that accept purchase of ANY batch
 * (Stroke / Speech / Vocabulary); pass it for gates tied to one specific batch
 * (Video, Quiz, Live Class).
 */
export function redirectToPaywall(navigation, route, batchId) {
  navigation.replace('PaywallChoosePlan', {
    batchId,
    returnTo: { name: route.name, params: route.params },
  });
}

/**
 * Gates an entire screen: call at the top of a screen component. If hasAccess
 * is false when the screen mounts, immediately redirects to the paywall
 * instead of rendering the screen's real content.
 */
export function useAccessGate(navigation, route, hasAccess, batchId) {
  useEffect(() => {
    if (!hasAccess) {
      redirectToPaywall(navigation, route, batchId);
    }
    // Intentionally only re-checks on mount/route change, not on every
    // hasAccess reference change, so a successful purchase elsewhere doesn't
    // retroactively bounce a screen the user is already using.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.batchId]);
}
