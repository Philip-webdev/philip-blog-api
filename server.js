import express from 'express'
import cors from 'cors'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuid } from 'uuid'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

const DATA_DIR = join(__dirname, 'data')
const POSTS_FILE = join(DATA_DIR, 'posts.json')
const COMMENTS_FILE = join(DATA_DIR, 'comments.json')

if (!existsSync(DATA_DIR)) {
  const { mkdirSync } = await import('fs')
  mkdirSync(DATA_DIR, { recursive: true })
}

const load = (file, fallback = []) => {
  try { return JSON.parse(readFileSync(file, 'utf-8')) } catch { return fallback }
}
const save = (file, data) => writeFileSync(file, JSON.stringify(data, null, 2))

let posts = load(POSTS_FILE, [
  {
    id: '1',
    title: 'Building a RAG Pipeline from Scratch with Python and Pinecone',
    slug: 'building-rag-pipeline',
    category: 'AI & Engineering',
    excerpt: 'A practical guide to building retrieval-augmented generation systems — from document chunking and embeddings to semantic search and LLM grounding.',
    content: `## What is RAG?\n\nRetrieval-Augmented Generation (RAG) is a technique that combines the power of large language models with external knowledge retrieval. Instead of relying solely on the model's training data, RAG systems fetch relevant documents at query time and use them to ground the LLM's responses.\n\n## Why RAG Matters\n\nTraditional LLMs have a cutoff date and can hallucinate facts. RAG solves this by:\n\n- **Grounding responses in real data** — the model cites actual documents\n- **Reducing hallucinations** — answers are backed by retrieved context\n- **Keeping knowledge fresh** — no retraining needed for new documents\n- **Providing source attribution** — users can verify where answers come from\n\n## Architecture Overview\n\nA typical RAG pipeline consists of three stages:\n\n### 1. Document Ingestion\n\nWe load documents, split them into chunks, and generate embeddings for each chunk.\n\n### 2. Vector Storage\n\nEach chunk gets embedded using a model like OpenAI's text-embedding-3-small and stored in a vector database like Pinecone.\n\n### 3. Query & Generation\n\nAt query time, we embed the user's question, find the most similar chunks, and pass them as context to the LLM.\n\n## Key Design Decisions\n\nChunk quality matters more than quantity. Better chunking beats more chunks.\n\nMetadata filtering is powerful. Adding category/date filters before vector search improved relevance by 23%.\n\n## Conclusion\n\nRAG is not just a trend — it's the practical path to building AI systems that are grounded, verifiable, and useful.`,
    read_time: '12 min read',
    featured: true,
    created_at: '2026-08-28T10:00:00Z',
    updated_at: '2026-08-28T10:00:00Z',
  },
  {
    id: '2',
    title: 'Why Campus Fintech is the Next Big Thing in Africa',
    slug: 'campus-fintech-africa',
    category: 'FinTech',
    excerpt: 'The untapped potential of campus payment systems, student wallets, and micro-financial services across African universities.',
    content: `## The Campus Payment Gap\n\nAfrican universities process billions in transactions annually — tuition, meals, supplies, services — yet most of this happens in cash or through clunky, outdated systems.\n\n## The Opportunity\n\nStudents are digital natives who need:\n- Wallet-based payments for campus services\n- Micro-loans and credit facilities\n- Savings tools for financial discipline\n- Merchant integration for campus businesses\n\n## Why Now\n\nSmartphone penetration, mobile money adoption, and regulatory openness create the perfect conditions for campus fintech.\n\n## Conclusion\n\nThe campus is Africa's most concentrated market. Win there, and you build the financial habits of an entire generation.`,
    read_time: '8 min read',
    featured: false,
    created_at: '2026-08-14T10:00:00Z',
    updated_at: '2026-08-14T10:00:00Z',
  },
  {
    id: '3',
    title: "Lessons from Building kwestpay: A Developer's Retrospective",
    slug: 'building-kwestpay-retrospective',
    category: 'Engineering',
    excerpt: "What I learned building a campus fintech platform from zero — technical decisions, architecture trade-offs, and user adoption challenges.",
    content: `## Starting from Zero\n\nWhen I started kwestpay, I had a clear vision: make campus payments seamless. The reality was far more complex.\n\n## Technical Decisions\n\n### The Stack\n\nReact + Node.js + MongoDB. Not the flashiest, but the fastest to ship.\n\n### Payment Integration\n\nFlutterwave for card payments, bank transfer for larger amounts. The key was making both feel identical to the user.\n\n## What Worked\n\n- Building the MVP in 3 weeks\n- Onboarding 50 users in the first week\n- Getting campus vendor buy-in early\n\n## What Didn't\n\n- Over-engineering the wallet system\n- Not investing in fraud detection early enough\n- Ignoring offline scenarios\n\n## Lessons\n\nShip fast, learn fast. The best architecture is the one that gets you to the next user.`,
    read_time: '10 min read',
    featured: false,
    created_at: '2026-07-30T10:00:00Z',
    updated_at: '2026-07-30T10:00:00Z',
  },
  {
    id: '4',
    title: 'Food Credits and the Future of FoodTech in Nigeria',
    slug: 'foodtech-nigeria-future',
    category: 'FoodTech',
    excerpt: 'How credit-based food systems can bridge the gap between food vendors and consumers in emerging markets.',
    content: `## The Food Problem\n\nNigeria wastes 40% of its food production due to poor logistics, lack of credit, and disconnected supply chains.\n\n## Food Credits as a Solution\n\nA credit-based system lets consumers access food now and pay later, while vendors get guaranteed revenue and reduced waste.\n\n## How It Works\n\n1. Consumers get a credit limit based on verified identity\n2. Vendors accept credits with guaranteed settlement\n3. The platform handles reconciliation and fraud prevention\n\n## The Impact\n\nReduced food waste, increased vendor revenue, and better food access for consumers.\n\n## Conclusion\n\nFoodTech in Nigeria isn't about delivery apps — it's about rebuilding the food value chain from the ground up.`,
    read_time: '7 min read',
    featured: false,
    created_at: '2026-07-15T10:00:00Z',
    updated_at: '2026-07-15T10:00:00Z',
  },
])

let comments = load(COMMENTS_FILE, [
  { id: '1', post_slug: 'building-rag-pipeline', name: 'Ade T.', email: 'ade@example.com', content: 'Great article! The chunking strategy comparison was really helpful.', created_at: '2026-08-29T10:00:00Z' },
  { id: '2', post_slug: 'building-rag-pipeline', name: 'Sarah M.', email: 'sarah@example.com', content: 'I implemented this for my project and it works beautifully. Thanks for sharing.', created_at: '2026-08-30T10:00:00Z' },
])

// === POSTS ===

app.get('/api/posts', (req, res) => {
  const { category } = req.query
  let result = posts
  if (category) result = result.filter(p => p.category === category)
  result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  res.json(result)
})

app.get('/api/posts/:id', (req, res) => {
  const post = posts.find(p => p.id === req.params.id)
  if (!post) return res.status(404).json({ error: 'Post not found' })
  res.json(post)
})

app.get('/api/posts/slug/:slug', (req, res) => {
  const post = posts.find(p => p.slug === req.params.slug)
  if (!post) return res.status(404).json({ error: 'Post not found' })
  res.json(post)
})

app.post('/api/posts', (req, res) => {
  const { title, slug, category, excerpt, content, read_time, featured, cover_image } = req.body
  if (!title || !slug || !content) return res.status(400).json({ error: 'Title, slug, and content are required' })

  const exists = posts.find(p => p.slug === slug)
  if (exists) return res.status(409).json({ error: 'Slug already exists' })

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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  posts.push(post)
  save(POSTS_FILE, posts)
  res.status(201).json(post)
})

app.put('/api/posts/:id', (req, res) => {
  const idx = posts.findIndex(p => p.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Post not found' })

  const { title, slug, category, excerpt, content, read_time, featured, cover_image } = req.body
  if (slug && slug !== posts[idx].slug) {
    const dup = posts.find(p => p.slug === slug && p.id !== req.params.id)
    if (dup) return res.status(409).json({ error: 'Slug already exists' })
  }

  posts[idx] = {
    ...posts[idx],
    ...(title && { title }),
    ...(slug && { slug }),
    ...(category && { category }),
    ...(excerpt !== undefined && { excerpt }),
    ...(content && { content }),
    ...(read_time && { read_time }),
    ...(featured !== undefined && { featured }),
    ...(cover_image !== undefined && { cover_image }),
    updated_at: new Date().toISOString(),
  }
  save(POSTS_FILE, posts)
  res.json(posts[idx])
})

app.delete('/api/posts/:id', (req, res) => {
  const idx = posts.findIndex(p => p.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Post not found' })
  posts.splice(idx, 1)
  save(POSTS_FILE, posts)
  comments = comments.filter(c => c.post_slug !== posts[idx]?.slug)
  save(COMMENTS_FILE, comments)
  res.json({ ok: true })
})

// === COMMENTS ===

app.get('/api/comments/:postSlug', (req, res) => {
  const postComments = comments
    .filter(c => c.post_slug === req.params.postSlug)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  res.json(postComments)
})

app.post('/api/comments', (req, res) => {
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
  comments.push(comment)
  save(COMMENTS_FILE, comments)
  res.status(201).json(comment)
})

app.delete('/api/comments/:id', (req, res) => {
  const idx = comments.findIndex(c => c.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Comment not found' })
  comments.splice(idx, 1)
  save(COMMENTS_FILE, comments)
  res.json({ ok: true })
})

app.listen(PORT, () => {
  console.log(`Blog API running on http://localhost:${PORT}`)
})
