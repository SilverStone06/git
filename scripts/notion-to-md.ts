// scripts/notion-to-md.ts
// 노션에서 포스트 메타데이터를 가져와서 src/posts/*.md 로 저장/업데이트하는 스크립트
// 실행 예시: npx ts-node scripts/notion-to-md.ts

// @ts-nocheck

import fs from "fs"
import path from "path"
import matter from "gray-matter"

import { getPosts } from "src/apis/notion-client/getPosts"
import { TPosts, TPost } from "src/types"

const POSTS_DIR = path.join(process.cwd(), "src", "posts")

function ensurePostsDir() {
  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true })
  }
}

/**
 * 기존 md 파일이 있으면 삭제하고 새로 생성합니다.
 * Notion에서 체크박스로 선택한 포스트만 가져오므로,
 * 기존 파일을 삭제하고 새로 생성하는 것이 안전합니다.
 */
function deleteExistingMarkdownFiles() {
  if (!fs.existsSync(POSTS_DIR)) {
    return
  }

  const files = fs.readdirSync(POSTS_DIR)
  let deletedCount = 0

  for (const file of files) {
    if (file.endsWith(".md")) {
      const filePath = path.join(POSTS_DIR, file)
      fs.unlinkSync(filePath)
      deletedCount++
      console.log(`🗑️  Deleted: ${file}`)
    }
  }

  if (deletedCount > 0) {
    console.log(`✅ Deleted ${deletedCount} existing markdown file(s).`)
  }
}

/**
 * Notion 포스트에서 frontmatter를 생성합니다.
 * 항상 Notion 기준으로 새로 생성합니다.
 */
function buildFrontmatterFromPost(post: TPost) {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    date: post.date, // { start_date: string }
    createdTime: post.createdTime,
    status: post.status, // ["Public"] 등
    type: post.type, // ["Post"] 등
    tags: post.tags ?? [],
    category: post.category ?? [],
    summary: post.summary ?? "",
    thumbnail: post.thumbnail ?? null,
    author: post.author ?? [],
    fullWidth: post.fullWidth ?? false,
  }
}

async function syncNotionToMd() {
  ensurePostsDir()

  // 기존 md 파일 삭제
  console.log("🗑️  Deleting existing markdown files...")
  deleteExistingMarkdownFiles()

  console.log("📥 Fetching posts from Notion...")
  const posts: TPosts = await getPosts()

  console.log(`✅ Got ${posts.length} posts from Notion.`)

  for (const post of posts) {
    if (!post.slug) {
      console.warn(`⚠️  Skip post without slug (id: ${post.id})`)
      continue
    }

    const fileName = `${post.slug}.md`
    const filePath = path.join(POSTS_DIR, fileName)

    console.log(`📝 Processing: ${post.title} (${fileName})`)

    // Frontmatter 생성 (항상 Notion 기준으로 새로 생성)
    const frontmatter = buildFrontmatterFromPost(post)

    // TODO: 여기서 나중에 Notion recordMap → markdown(본문) 변환 붙이면 됨.
    // 예: const contentFromNotion = await convertRecordMapToMarkdown(post.id)
    //     const finalContent = contentFromNotion || ""

    const finalContent = ""

    const md = matter.stringify(finalContent.trim() + "\n", frontmatter)
    fs.writeFileSync(filePath, md, "utf8")
    console.log(`✅ Created: ${fileName}`)
  }

  console.log("🎉 Notion → MD sync finished.")
}

// 직접 실행
syncNotionToMd().catch((err) => {
  console.error("❌ Notion → MD sync failed:")
  console.error(err)
  process.exit(1)
})
