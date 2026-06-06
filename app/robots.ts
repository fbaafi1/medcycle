import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/profile', '/my-listings'],
      },
    ],
    sitemap: 'https://themedcycle.com/sitemap.xml',
  }
}
