import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync, writeFileSync } from 'fs'

// Load environment variables (supports .env and process.env)
let env = { ...process.env }
if (existsSync('.env')) {
    const dotenv = Object.fromEntries(
        readFileSync('.env', 'utf8')
            .split('\n')
            .filter(line => line.includes('='))
            .map(line => line.split('=').map(s => s.trim()))
    )
    env = { ...env, ...dotenv }
}

const SITE = 'https://localpoint.it'
const supabase = createClient(env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY)

const { data: experiences, error } = await supabase
    .from('experiences')
    .select('slug_id, category, created_at')
    .eq('is_active', true)

if (error) {
    console.error('Errore Supabase:', error.message)
    process.exit(1)
}

const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'weekly' },
    { url: '/tourist-services.html', priority: '0.9', changefreq: 'weekly' },
    { url: '/become-partner.html', priority: '0.6', changefreq: 'monthly' },
]

const expPages = (experiences || []).map(exp => ({
    url: `/service-details.html?cat=${exp.category}&id=${exp.slug_id}`,
    priority: '0.8',
    changefreq: 'monthly',
    lastmod: exp.created_at?.split('T')[0],
}))

const allPages = [...staticPages, ...expPages]

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(p => `  <url>
    <loc>${SITE}${p.url}</loc>
    ${p.lastmod ? `<lastmod>${p.lastmod}</lastmod>` : ''}
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
</urlset>`

writeFileSync('public/sitemap.xml', xml)
console.log(`✅ Sitemap generata: ${allPages.length} URL (${expPages.length} esperienze)`)
