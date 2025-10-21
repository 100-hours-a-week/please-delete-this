import { api } from "/js/api.js"
import { dom } from "/js/dom.js"

let currentPost = null

async function loadPostDetail() {
  const postId = new URLSearchParams(window.location.search).get("postId")

  if (!postId) {
    showError("잘못된 접근입니다", "게시글 ID가 없습니다")
    return
  }

  const spinner = dom.showSpinner()

  try {
    currentPost = await api.getPostDetail(postId)

    renderPost(currentPost)
  } catch (error) {
    console.error("Failed to load post:", error)
    showError("게시글을 불러오는데 실패했습니다", "다시 시도해주세요")
  } finally {
    dom.hideSpinner(spinner)
  }
}

function renderPost(post) {
  // Title
  dom.qs("#post-title").textContent = post.title

  // Author info
  if (post.author) {
    dom.qs("#author-avatar").src = post.author.profileImageUrl || "/user-profile-illustration.png"
    dom.qs("#author-name").textContent = post.author.name
  }

  // Stats
  dom.qs("#post-views").textContent = `👁️ ${post.views}`
  dom.qs("#post-date").innerHTML =
    formatDate(post.createdAt) + (post.isUpdated ? ' <span class="edited-badge">수정됨</span>' : "")

  // Images
  const imagesContainer = dom.qs("#post-images")
  imagesContainer.innerHTML = ""
  if (post.imageUrls && post.imageUrls.length > 0) {
    post.imageUrls.forEach((url) => {
      const img = dom.create("img", {
        src: url,
        alt: "Post image",
        className: "post-image",
      })
      imagesContainer.appendChild(img)
    })
  }

  // Content
  dom.qs("#post-content").textContent = post.content

  // Like button
  const likeBtn = dom.qs("#like-btn")
  const likeIcon = dom.qs(".like-icon")
  const likeCount = dom.qs("#like-count")

  likeCount.textContent = post.likes
  likeIcon.textContent = post.amILiking ? "❤️" : "🤍"

  if (post.amILiking) {
    likeBtn.classList.add("liked")
  } else {
    likeBtn.classList.remove("liked")
  }

  // Like button click handler
  likeBtn.addEventListener("click", handleLikeToggle)
}

async function handleLikeToggle() {
  if (!currentPost) return

  const likeBtn = dom.qs("#like-btn")
  const likeIcon = dom.qs(".like-icon")
  const likeCount = dom.qs("#like-count")

  const wasLiked = currentPost.amILiking

  try {
    // Optimistic update
    currentPost.amILiking = !wasLiked
    currentPost.likes += currentPost.amILiking ? 1 : -1

    likeIcon.textContent = currentPost.amILiking ? "❤️" : "🤍"
    likeCount.textContent = currentPost.likes

    if (currentPost.amILiking) {
      likeBtn.classList.add("liked")
    } else {
      likeBtn.classList.remove("liked")
    }

    const postId = new URLSearchParams(window.location.search).get("postId")
    if (currentPost.amILiking) {
      await api.likePost(postId)
    } else {
      await api.unlikePost(postId)
    }
  } catch (error) {
    console.error("Failed to toggle like:", error)

    // Revert on error
    currentPost.amILiking = wasLiked
    currentPost.likes += wasLiked ? 1 : -1

    likeIcon.textContent = currentPost.amILiking ? "❤️" : "🤍"
    likeCount.textContent = currentPost.likes

    if (currentPost.amILiking) {
      likeBtn.classList.add("liked")
    } else {
      likeBtn.classList.remove("liked")
    }

    dom.showToast("좋아요 처리에 실패했습니다", "error")
  }
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function showError(title, message) {
  const container = dom.qs(".post-detail-container")
  container.innerHTML = `
    <div class="error-state">
      <h2>${title}</h2>
      <p>${message}</p>
      <button class="btn" onclick="window.history.back()">돌아가기</button>
    </div>
  `
}

// Initialize
loadPostDetail()
