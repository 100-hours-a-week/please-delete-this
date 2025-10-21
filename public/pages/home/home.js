import { api } from "/js/api.js"
import { dom } from "/js/dom.js"

async function loadPopularPosts() {
  const container = dom.qs("#popular-posts")

  try {
    const response = await api.getPosts({ strategy: "POPULAR" })
    const posts = response.items.slice(0, 4)

    if (!posts || posts.length === 0) {
      container.innerHTML = '<div class="empty-state">아직 게시글이 없습니다</div>'
      return
    }

    container.innerHTML = ""
    posts.forEach((post) => {
      container.appendChild(createPostCard(post))
    })
  } catch (error) {
    console.error("Failed to load popular posts:", error)
    container.innerHTML = '<div class="empty-state">게시글을 불러오는데 실패했습니다</div>'
  }
}

async function loadRecentPosts() {
  const container = dom.qs("#recent-posts")

  try {
    const response = await api.getPosts({ strategy: "RECENT" })
    const posts = response.items.slice(0, 4)

    if (!posts || posts.length === 0) {
      container.innerHTML = '<div class="empty-state">아직 게시글이 없습니다</div>'
      return
    }

    container.innerHTML = ""
    posts.forEach((post) => {
      container.appendChild(createPostCard(post))
    })
  } catch (error) {
    console.error("Failed to load recent posts:", error)
    container.innerHTML = '<div class="empty-state">게시글을 불러오는데 실패했습니다</div>'
  }
}

function createPostCard(post) {
  const card = dom.create("article", { className: "card post-card" })

  // Author info
  const authorSection = dom.create("div", { className: "post-author" }, [
    dom.create("img", {
      src: post.author.profileImageUrl || "/user-profile-illustration.png",
      alt: post.author.name,
      className: "author-avatar",
    }),
    dom.create("span", { className: "author-name" }, [post.author.name]),
  ])
  card.appendChild(authorSection)

  // Title
  const title = dom.create("h3", { className: "post-title" }, [post.title])
  card.appendChild(title)

  // Meta info
  const meta = dom.create("div", { className: "post-meta" }, [
    dom.create("span", { className: "post-meta-item" }, [`❤️ ${post.like.count}`]),
    dom.create("span", { className: "post-meta-item" }, [formatDate(post.createdAt)]),
  ])
  card.appendChild(meta)

  // Click handler
  card.addEventListener("click", () => {
    window.location.href = `/pages/board/postDetail.html?postId=${post.postId}`
  })

  return card
}

// Format date helper
function formatDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 7) {
    return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" })
  } else if (days > 0) {
    return `${days}일 전`
  } else if (hours > 0) {
    return `${hours}시간 전`
  } else if (minutes > 0) {
    return `${minutes}분 전`
  } else {
    return "방금 전"
  }
}

// Initialize
loadPopularPosts()
loadRecentPosts()
