// Prices, durations, and original (strikethrough) prices are transcribed
// directly from payment_1.svg. `id` values are stable strings your backend
// can use as plan identifiers once real checkout/order-creation exists.
export const plansByBatch = {
  foundation: [
    {
      id: 'foundation_videos',
      batchId: 'foundation',
      tier: 'videos',
      price: 999,
      originalPrice: 2000,
      duration: '3 months',
      features: 'Recorded Videos',
      includesLive: false,
    },
    {
      id: 'foundation_videos_live',
      batchId: 'foundation',
      tier: 'videos_live',
      price: 2999,
      originalPrice: 6000,
      duration: '3 months',
      features: 'Recorded Videos+ Live Class 15 Days',
      includesLive: true,
    },
  ],
  elevation: [
    {
      id: 'elevation_videos',
      batchId: 'elevation',
      tier: 'videos',
      price: 1999,
      originalPrice: 4000,
      duration: '3 months',
      features: 'Recorded Videos',
      includesLive: false,
    },
    {
      id: 'elevation_videos_live',
      batchId: 'elevation',
      tier: 'videos_live',
      price: 4999,
      originalPrice: 10000,
      duration: '3 months',
      features: 'Recorded Videos+ Live Class 15 Days',
      includesLive: true,
    },
  ],
  distinction: [
    {
      id: 'distinction_videos',
      batchId: 'distinction',
      tier: 'videos',
      price: 2999,
      originalPrice: 6000,
      duration: '3 months',
      features: 'Recorded Videos',
      includesLive: false,
    },
    {
      id: 'distinction_videos_live',
      batchId: 'distinction',
      tier: 'videos_live',
      price: 7999,
      originalPrice: 16000,
      duration: '3 months',
      features: 'Recorded Videos+ Live Class 15 Days',
      includesLive: true,
    },
  ],
};

export function getPlan(planId) {
  for (const plans of Object.values(plansByBatch)) {
    const found = plans.find((p) => p.id === planId);
    if (found) return found;
  }
  return null;
}

// A single coupon for now — replace with a real coupon-lookup API call once
// the backend exists. Kept here so Checkout has something real to validate against.
export const mockCoupons = {
  WELCOME500: { amountOff: 500 },
};
