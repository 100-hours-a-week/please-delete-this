import { api } from "/js/api.js"
import { dom } from "/js/dom.js"

let currentStrategy = "POPULAR"
let nextCursor = null
let hasNext = true
let isLoading = false
let searchQuery = ""

const postsList = dom.qs("#posts-list")
const loadingSentinel = dom.qs("#loading-sentinel")
const endMessage = dom.qs("#end-message")
const searchInput = dom.qs("#search-input")
const searchBtn = dom.qs("#search-btn")

// Tab switching
dom.qsa(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    // Update active tab
    dom.qsa(".tab-btn").forEach((b) => b.classList.remove("active"))
    btn.classList.add("active")

    currentStrategy = btn.dataset.tab === "popular" ? "POPULAR" : "RECENT"
    resetPosts()
    loadPosts()
  })
})

// Search
searchBtn.addEventListener("click", handleSearch)
searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    handleSearch()
  }
})

function handleSearch() {
  searchQuery = searchInput.value.trim()
  resetPosts()
  loadPosts()
}

// Reset posts list
function resetPosts() {
  nextCursor = null
  hasNext = true
  postsList.innerHTML = ""
  endMessage.style.display = "none"
  loadingSentinel.style.display = "flex"
}

async function loadPosts() {
  if (isLoading || !hasNext) return

  isLoading = true

  try {
    const response = await api.getPosts({
      strategy: nextCursor ? undefined : currentStrategy,
      cursor: nextCursor,
    })

    const { items, nextCursor: newCursor, hasNext: newHasNext } = response

    if (!items || items.length === 0) {
      hasNext = false
      loadingSentinel.style.display = "none"

      if (!nextCursor) {
        postsList.innerHTML = '<div class="empty-state">게시글이 없습니다</div>'
      } else {
        endMessage.style.display = "block"
      }
      return
    }

    items.forEach((post) => {
      postsList.appendChild(createPostCard(post))
    })

    nextCursor = newCursor
    hasNext = newHasNext

    // Check if there are more posts
    if (!hasNext) {
      loadingSentinel.style.display = "none"
      endMessage.style.display = "block"
    }
  } catch (error) {
    console.error("Failed to load posts:", error)
    dom.showToast("게시글을 불러오는데 실패했습니다", "error")
    hasNext = false
    loadingSentinel.style.display = "none"
  } finally {
    isLoading = false
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
    dom.create("span", { className: "post-meta-item" }, [`👁️ ${post.views}`]),
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

// Infinite scroll with IntersectionObserver
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && hasNext && !isLoading) {
        loadPosts()
      }
    })
  },
  {
    rootMargin: "100px",
  },
)

observer.observe(loadingSentinel)

// Initial load
loadPosts()
