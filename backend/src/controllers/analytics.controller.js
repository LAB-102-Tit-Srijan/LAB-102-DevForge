import Analytics from '../models/Analytics.js';

export async function getAnalytics(req, res) {
  try {
    const analytics = await Analytics.getInstance();
    const avgResponseTime = analytics.totalQueries > 0
      ? Math.round(analytics.totalResponseTime / analytics.totalQueries)
      : 0;
    const cacheHitRate = analytics.totalQueries > 0
      ? Math.round((analytics.cacheHits / analytics.totalQueries) * 100)
      : 0;

    res.json({
      totalVideos: analytics.videosProcessed,
      totalQueries: analytics.totalQueries,
      cacheHitRate,
      avgResponseTime,
      cacheHits: analytics.cacheHits,
    });
  } catch (err) {
    res.json({ totalVideos: 0, totalQueries: 0, cacheHitRate: 0, avgResponseTime: 0 });
  }
}
