import express from 'express'
import cors from 'cors'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuid } from 'uuid'
import pg from 'pg'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

const DATA_DIR = join(__dirname, 'data')
const POSTS_FILE = join(DATA_DIR, 'posts.json')
const COMMENTS_FILE = join(DATA_DIR, 'comments.json')
const SEEDS_FILE = join(__dirname, 'seeds.json')

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })

const load = (file, fallback = []) => {
  try { return JSON.parse(readFileSync(file, 'utf-8')) } catch { return fallback }
}
const save = (file, data) => writeFileSync(file, JSON.stringify(data, null, 2))

const FALLBACK_SEEDS = [
  {
    id: '1',
    title: 'Building a RAG Pipeline from Scratch with Python and Pinecone',
    slug: 'building-rag-pipeline',
    category: 'AI & Engineering',
    excerpt: 'A practical guide to building retrieval-augmented generation systems — from document chunking and embeddings to semantic search and LLM grounding.',
    content: '## What is RAG?\n\nRetrieval-Augmented Generation (RAG) is a technique that combines the power of large language models with external knowledge retrieval. Instead of relying solely on the model\'s training data, RAG systems fetch relevant documents at query time and use them to ground the LLM\'s responses.\n\n## Why RAG Matters\n\nTraditional LLMs have a cutoff date and can hallucinate facts. RAG solves this by grounding responses in real data, reducing hallucinations, keeping knowledge fresh, and providing source attribution.\n\n## Architecture Overview\n\nA typical RAG pipeline consists of three stages: document ingestion, vector storage, and query-time generation.\n\n## Key Design Decisions\n\nChunk quality matters more than quantity. Better chunking beats more chunks.\n\nMetadata filtering is powerful. Adding category/date filters before vector search improved relevance by 23%.\n\n## Conclusion\n\nRAG is not just a trend — it\'s the practical path to building AI systems that are grounded, verifiable, and useful.',
    read_time: '12 min read',
    featured: true,
    cover_image: '',
    created_at: '2026-08-28T10:00:00Z',
    updated_at: '2026-08-28T10:00:00Z',
  },
  {
    id: '2',
    title: 'Why Campus Fintech is the Next Big Thing in Africa',
    slug: 'campus-fintech-africa',
    category: 'FinTech',
    excerpt: 'The untapped potential of campus payment systems, student wallets, and micro-financial services across African universities.',
    content: '## The Campus Payment Gap\n\nAfrican universities process billions in transactions annually — tuition, meals, supplies, services — yet most of this happens in cash or through clunky, outdated systems.\n\n## The Opportunity\n\nStudents are digital natives who need wallet-based payments, micro-loans, savings tools, and merchant integration for campus businesses.\n\n## Why Now\n\nSmartphone penetration, mobile money adoption, and regulatory openness create the perfect conditions for campus fintech.\n\n## Conclusion\n\nThe campus is Africa\'s most concentrated market. Win there, and you build the financial habits of an entire generation.',
    read_time: '8 min read',
    featured: false,
    cover_image: '',
    created_at: '2026-08-14T10:00:00Z',
    updated_at: '2026-08-14T10:00:00Z',
  },
  {
    id: '3',
    title: "Lessons from Building kwestpay: A Developer's Retrospective",
    slug: 'building-kwestpay-retrospective',
    category: 'Engineering',
    excerpt: "What I learned building a campus fintech platform from zero — technical decisions, architecture trade-offs, and user adoption challenges.",
    content: '## Starting from Zero\n\nWhen I started kwestpay, I had a clear vision: make campus payments seamless. The reality was far more complex.\n\n## Technical Decisions\n\n### The Stack\n\nReact + Node.js + MongoDB. Not the flashiest, but the fastest to ship.\n\n### Payment Integration\n\nFlutterwave for card payments, bank transfer for larger amounts. The key was making both feel identical to the user.\n\n## What Worked\n\n- Building the MVP in 3 weeks\n- Onboarding 50 users in the first week\n- Getting campus vendor buy-in early\n\n## What Did Not\n\n- Over-engineering the wallet system\n- Not investing in fraud detection early enough\n- Ignoring offline scenarios\n\n## Lessons\n\nShip fast, learn fast. The best architecture is the one that gets you to the next user.',
    read_time: '10 min read',
    featured: false,
    cover_image: '',
    created_at: '2026-07-30T10:00:00Z',
    updated_at: '2026-07-30T10:00:00Z',
  },
  {
    id: '4',
    title: 'Food Credits and the Future of FoodTech in Nigeria',
    slug: 'foodtech-nigeria-future',
    category: 'FoodTech',
    excerpt: 'How credit-based food systems can bridge the gap between food vendors and consumers in emerging markets.',
    content: '## The Food Problem\n\nNigeria wastes 40% of its food production due to poor logistics, lack of credit, and disconnected supply chains.\n\n## Food Credits as a Solution\n\nA credit-based system lets consumers access food now and pay later, while vendors get guaranteed revenue and reduced waste.\n\n## How It Works\n\n1. Consumers get a credit limit based on verified identity\n2. Vendors accept credits with guaranteed settlement\n3. The platform handles reconciliation and fraud prevention\n\n## The Impact\n\nReduced food waste, increased vendor revenue, and better food access for consumers.\n\n## Conclusion\n\nFoodTech in Nigeria is not about delivery apps — it is about rebuilding the food value chain from the ground up.',
    read_time: '7 min read',
    featured: false,
    cover_image: '',
    created_at: '2026-07-15T10:00:00Z',
    updated_at: '2026-07-15T10:00:00Z',
  },
]

const SEED_POSTS = load(SEEDS_FILE, FALLBACK_SEEDS)

const SEED_COMMENTS = [
  { id: '1', post_slug: 'building-rag-pipeline', post_id: '1', name: 'Ade T.', email: 'ade@example.com', content: 'Great article! The chunking strategy comparison was really helpful.', created_at: '2026-08-29T10:00:00Z' },
  { id: '2', post_slug: 'building-rag-pipeline', post_id: '1', name: 'Sarah M.', email: 'sarah@example.com', content: 'I implemented this for my project and it works beautifully. Thanks for sharing.', created_at: '2026-08-30T10:00:00Z' },
]

// === STORAGE ===
// Postgres when DATABASE_URL is set (production), JSON files otherwise (local dev).

const USE_DB = !!process.env.DATABASE_URL
let pool = null
let posts = []
let comments = []

const stripPost = (r) => r ? ({
  id: r.id,
  title: r.title,
  slug: r.slug,
  category: r.category,
  excerpt: r.excerpt,
  content: r.content,
  read_time: r.read_time,
  featured: r.featured === true || r.featured === 't' || r.featured === 'true',
  cover_image: r.cover_image || '',
  created_at: r.created_at,
  updated_at: r.updated_at,
}) : null

const stripComment = (r) => r ? ({
  id: r.id,
  post_slug: r.post_slug,
  post_id: r.post_id,
  name: r.name,
  email: r.email,
  content: r.content,
  created_at: r.created_at,
}) : null

const byNewest = (a, b) => new Date(b.created_at) - new Date(a.created_at)

const store = {
  async init() {
    if (USE_DB) {
      const dbUrl = process.env.DATABASE_URL
      const localHost = /@(localhost|127\.0\.0\.1|\[::1\]|\[::ffff:127\.0\.0\.1\])/.test(dbUrl)
      const sslMode = (dbUrl.match(/sslmode=(\w+)/) || [])[1]
      const ssl = sslMode === 'disable' ? false
        : sslMode === 'require' || sslMode === 'verify-full' ? { rejectUnauthorized: false }
        : localHost ? false
        : { rejectUnauthorized: false }

      pool = new pg.Pool({
        connectionString: dbUrl,
        ssl,
        max: 5,
      })
      await pool.query(`
        CREATE TABLE IF NOT EXISTS posts (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          category TEXT DEFAULT '',
          excerpt TEXT DEFAULT '',
          content TEXT NOT NULL,
          read_time TEXT DEFAULT '5 min read',
          featured BOOLEAN NOT NULL DEFAULT FALSE,
          cover_image TEXT DEFAULT '',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS comments (
          id TEXT PRIMARY KEY,
          post_slug TEXT NOT NULL,
          post_id TEXT,
          name TEXT NOT NULL,
          email TEXT DEFAULT '',
          content TEXT NOT NULL,
          created_at TEXT NOT NULL
        )
      `)
      const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM posts')
      if (rows[0].n === 0) {
        for (const p of SEED_POSTS) await store.insertPost(p)
        for (const c of SEED_COMMENTS) await store.insertComment(c)
        console.log('Seeded empty database with starter posts')
      }
      console.log('Storage: Postgres')
    } else {
      posts = load(POSTS_FILE, SEED_POSTS)
      comments = load(COMMENTS_FILE, SEED_COMMENTS)
      console.log('Storage: local JSON (set DATABASE_URL to use Postgres)')
    }
  },

  async listPosts(category) {
    if (USE_DB) {
      const { rows } = category
        ? await pool.query('SELECT * FROM posts WHERE category = $1', [category])
        : await pool.query('SELECT * FROM posts')
      return rows.map(stripPost).sort(byNewest)
    }
    let result = posts
    if (category) result = result.filter(p => p.category === category)
    return [...result].sort(byNewest)
  },

  async getPost(id) {
    if (USE_DB) {
      const { rows } = await pool.query('SELECT * FROM posts WHERE id = $1', [id])
      return stripPost(rows[0])
    }
    return posts.find(p => p.id === id) || null
  },

  async getPostBySlug(slug) {
    if (USE_DB) {
      const { rows } = await pool.query('SELECT * FROM posts WHERE slug = $1', [slug])
      return stripPost(rows[0])
    }
    return posts.find(p => p.slug === slug) || null
  },

  async slugExists(slug, exceptId) {
    if (USE_DB) {
      const { rows } = await pool.query('SELECT id FROM posts WHERE slug = $1 AND id <> $2', [slug, exceptId || ''])
      return rows.length > 0
    }
    return posts.some(p => p.slug === slug && p.id !== exceptId)
  },

  async insertPost(post) {
    if (USE_DB) {
      await pool.query(
        `INSERT INTO posts (id, title, slug, category, excerpt, content, read_time, featured, cover_image, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, excerpt = EXCLUDED.excerpt, content = EXCLUDED.content,
           category = EXCLUDED.category, cover_image = EXCLUDED.cover_image, featured = EXCLUDED.featured,
           read_time = EXCLUDED.read_time, updated_at = EXCLUDED.updated_at`,
        [post.id, post.title, post.slug, post.category, post.excerpt, post.content, post.read_time,
         !!post.featured, post.cover_image, post.created_at, post.updated_at]
      )
      return stripPost(post)
    }
    posts.push(post)
    save(POSTS_FILE, posts)
    return post
  },

  async updatePost(id, patch) {
    if (USE_DB) {
      const current = await store.getPost(id)
      if (!current) return null
      const next = { ...current, ...patch, updated_at: new Date().toISOString() }
      await pool.query(
        `UPDATE posts SET title=$1, slug=$2, category=$3, excerpt=$4, content=$5, read_time=$6,
           featured=$7, cover_image=$8, updated_at=$9 WHERE id=$10`,
        [next.title, next.slug, next.category, next.excerpt, next.content, next.read_time,
         !!next.featured, next.cover_image, next.updated_at, id]
      )
      return next
    }
    const idx = posts.findIndex(p => p.id === id)
    if (idx === -1) return null
    posts[idx] = { ...posts[idx], ...patch, updated_at: new Date().toISOString() }
    save(POSTS_FILE, posts)
    return posts[idx]
  },

  async deletePost(id) {
    if (USE_DB) {
      const post = await store.getPost(id)
      if (!post) return null
      await pool.query('DELETE FROM comments WHERE post_slug = $1', [post.slug])
      await pool.query('DELETE FROM posts WHERE id = $1', [id])
      return post
    }
    const idx = posts.findIndex(p => p.id === id)
    if (idx === -1) return null
    const [removed] = posts.splice(idx, 1)
    save(POSTS_FILE, posts)
    comments = comments.filter(c => c.post_slug !== removed.slug)
    save(COMMENTS_FILE, comments)
    return removed
  },

  async listComments(slug) {
    if (USE_DB) {
      const { rows } = await pool.query('SELECT * FROM comments WHERE post_slug = $1', [slug])
      return rows.map(stripComment).sort(byNewest)
    }
    return comments.filter(c => c.post_slug === slug).sort(byNewest)
  },

  async insertComment(comment) {
    if (USE_DB) {
      await pool.query(
        `INSERT INTO comments (id, post_slug, post_id, name, email, content, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [comment.id, comment.post_slug, comment.post_id, comment.name, comment.email, comment.content, comment.created_at]
      )
      return comment
    }
    comments.push(comment)
    save(COMMENTS_FILE, comments)
    return comment
  },

  async deleteComment(id) {
    if (USE_DB) {
      const { rowCount } = await pool.query('DELETE FROM comments WHERE id = $1', [id])
      return rowCount > 0
    }
    const idx = comments.findIndex(c => c.id === id)
    if (idx === -1) return false
    comments.splice(idx, 1)
    save(COMMENTS_FILE, comments)
    return true
  },
}

const fail = (res, err) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
}

// === POSTS ===

app.get('/api/posts', async (req, res) => {
  try { res.json(await store.listPosts(req.query.category)) } catch (err) { fail(res, err) }
})

app.get('/api/posts/slug/:slug', async (req, res) => {
  try {
    const post = await store.getPostBySlug(req.params.slug)
    if (!post) return res.status(404).json({ error: 'Post not found' })
    res.json(post)
  } catch (err) { fail(res, err) }
})

app.get('/api/posts/:id', async (req, res) => {
  try {
    const post = await store.getPost(req.params.id)
    if (!post) return res.status(404).json({ error: 'Post not found' })
    res.json(post)
  } catch (err) { fail(res, err) }
})

app.post('/api/posts', async (req, res) => {
  try {
    const { title, slug, category, excerpt, content, read_time, featured, cover_image } = req.body
    if (!title || !slug || !content) return res.status(400).json({ error: 'Title, slug, and content are required' })
    if (await store.slugExists(slug)) return res.status(409).json({ error: 'Slug already exists' })

    const now = new Date().toISOString()
    const post = {
      id: uuid(),
      title,
      slug,
      category: category || 'Uncategorized',
      excerpt: excerpt || '',
      content,
      read_time: read_time || '5 min read',
      featured: featured || false,
      cover_image: cover_image || '',
      created_at: now,
      updated_at: now,
    }
    res.status(201).json(await store.insertPost(post))
  } catch (err) { fail(res, err) }
})

app.put('/api/posts/:id', async (req, res) => {
  try {
    const existing = await store.getPost(req.params.id)
    if (!existing) return res.status(404).json({ error: 'Post not found' })

    const { title, slug, category, excerpt, content, read_time, featured, cover_image } = req.body
    if (slug && slug !== existing.slug && await store.slugExists(slug, req.params.id)) {
      return res.status(409).json({ error: 'Slug already exists' })
    }

    const patch = {
      ...(title && { title }),
      ...(slug && { slug }),
      ...(category && { category }),
      ...(excerpt !== undefined && { excerpt }),
      ...(content && { content }),
      ...(read_time && { read_time }),
      ...(featured !== undefined && { featured }),
      ...(cover_image !== undefined && { cover_image }),
    }
    res.json(await store.updatePost(req.params.id, patch))
  } catch (err) { fail(res, err) }
})

app.delete('/api/posts/:id', async (req, res) => {
  try {
    const removed = await store.deletePost(req.params.id)
    if (!removed) return res.status(404).json({ error: 'Post not found' })
    res.json({ ok: true })
  } catch (err) { fail(res, err) }
})

// === COMMENTS ===

app.get('/api/comments/:postSlug', async (req, res) => {
  try { res.json(await store.listComments(req.params.postSlug)) } catch (err) { fail(res, err) }
})

app.post('/api/comments', async (req, res) => {
  try {
    const { name, email, content, post_slug, post_id } = req.body
    if (!name || !content || !post_slug) return res.status(400).json({ error: 'Name, content, and post_slug are required' })

    const comment = {
      id: uuid(),
      post_slug,
      post_id: post_id || null,
      name,
      email: email || '',
      content,
      created_at: new Date().toISOString(),
    }
    res.status(201).json(await store.insertComment(comment))
  } catch (err) { fail(res, err) }
})

app.delete('/api/comments/:id', async (req, res) => {
  try {
    const ok = await store.deleteComment(req.params.id)
    if (!ok) return res.status(404).json({ error: 'Comment not found' })
    res.json({ ok: true })
  } catch (err) { fail(res, err) }
})

app.get('/api/health', async (_req, res) => {
  res.json({ ok: true, storage: USE_DB ? 'postgres' : 'json' })
})

try {
  await store.init()
  app.listen(PORT, () => console.log(`Blog API running on http://localhost:${PORT}`))
} catch (err) {
  console.error('Failed to start:', err)
  process.exit(1)
}
