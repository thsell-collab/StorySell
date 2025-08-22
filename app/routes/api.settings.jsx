// API route for fetching and caching shop settings with Redis
import { json } from '@remix-run/node';
import { shopQuery } from "../utils/graphql-queries";
import { authenticate } from '../shopify.server';
import { redis } from '../utils/redis-server'; // Assuming you have a Redis utility set up

// Action: Fetch settings with Redis caching
export const action = async ({ request }) => {
  const { admin, session } = await authenticate.public.appProxy(request);
  const body = await request.json();
  const shop = session.shop;
  
  // Redis cache key
  const cacheKey = `shop_settings:${shop}`;
  const cacheExpiry = 300; // 5 minutes

  try {
    // Try to get from Redis first
    const cachedData = await redis.get(cacheKey);
    
    if (cachedData) {
      console.log('Returning cached settings for:', shop, cachedData);
      return json({ settings: JSON.parse(cachedData), fromCache: true });
    }

    // If not in cache, fetch from Shopify
    console.log('Fetching fresh settings from Shopify for:', shop);
    const res = await admin.graphql(shopQuery).then(res => res.json());
    
    const metafield = res?.data?.shop?.plan_status;
    const settings = metafield ? { plan_status: metafield.value } : { plan_status: null };
    
    // Cache the result in Redis
    await redis.setex(cacheKey, cacheExpiry, JSON.stringify(settings));
    console.log('Cached settings for:', shop);
    
    return json({ settings, fromCache: false });
    
  } catch (error) {
    console.error('Redis/API error:', error);
    
    // Fallback: fetch directly from Shopify if Redis fails
    const res = await admin.graphql(shopQuery).then(res => res.json());
    const metafield = res?.data?.shop?.plan_status;
    const settings = metafield ? { plan_status: metafield.value } : { plan_status: null };
    
    return json({ settings, fromCache: false, error: 'Cache unavailable' });
  }
};
