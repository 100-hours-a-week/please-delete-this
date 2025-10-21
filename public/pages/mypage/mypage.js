import { api } from "/js/api.js"
import { storage } from "/js/storage.js"
import { dom } from "/js/dom.js"

// Redirect if not logged in
if (!storage.hasToken()) {
  window.location.href = "/login"
}

// DOM elements
const currentProfileImage = dom.qs("#current-profile-image")
const currentNickname = dom.qs("#current-nickname")
const currentEmail = dom.qs("#current-email")

const imageForm = dom.qs("#image-form")
const profileImageInput = dom.qs("#profile-image-input")
const selectImageBtn = dom.qs("#select-image-btn")
const previewImage = dom.qs("#preview-image")
const previewPlaceholder = dom.qs("#preview-placeholder")

const nicknameForm = dom.qs("#nickname-form")
const newNicknameInput = dom.qs("#new-nickname")

const passwordForm = dom.qs("#password-form")
const currentPasswordInput = dom.qs("#current-password")
const newPasswordInput = dom.qs("#new-password")
const newPasswordConfirmInput = dom.qs("#new-password-confirm")

let selectedFile = null

// Load user profile
async function loadProfile() {
  try {
    const profile = await api.getProfile()

    // Update display
    currentProfileImage.src = profile.profileImageObjectKey
      ? `${profile.profileImageObjectKey}`
      : "/user-profile-illustration.png"
    currentNickname.textContent = profile.name
    currentEmail.textContent = profile.email || "이메일 정보 없음"

    // Store user info
    storage.setUser(profile)
  } catch (error) {
    console.error("Failed to load profile:", error)
    dom.showToast("프로필을 불러오는데 실패했습니다", "error")
  }
}

// Image selection
selectImageBtn.addEventListener("click", () => {
  profileImageInput.click()
})

profileImageInput.addEventListener("change", (e) => {
  const file = e.target.files[0]
  if (!file) return

  // Validate file type
  if (!file.type.startsWith("image/")) {
    dom.showToast("이미지 파일만 업로드 가능합니다", "error")
    return
  }

  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    dom.showToast("파일 크기는 5MB 이하여야 합니다", "error")
    return
  }

  selectedFile = file

  // Show preview
  const reader = new FileReader()
  reader.onload = (e) => {
    previewImage.src = e.target.result
    previewImage.style.display = "block"
    previewPlaceholder.style.display = "none"
  }
  reader.readAsDataURL(file)
})

// Handle image form submission
imageForm.addEventListener("submit", async (e) => {
  e.preventDefault()

  if (!selectedFile) {
    dom.qs("#image-error").textContent = "이미지를 선택해주세요"
    return
  }

  const spinner = dom.showSpinner()

  try {
    const presignedData = await api.getProfilePresignedUrl(selectedFile.name, selectedFile.type)

    // Upload to S3
    await api.uploadToS3(selectedFile, presignedData.presignedUrl)

    await api.updateProfileImage(presignedData.objectKey)

    dom.showToast("프로필 이미지가 변경되었습니다")

    // Reload profile
    await loadProfile()

    // Reset form
    selectedFile = null
    profileImageInput.value = ""
    previewImage.style.display = "none"
    previewPlaceholder.style.display = "flex"
  } catch (error) {
    console.error("Image upload error:", error)
    dom.showToast(error.message || "이미지 변경에 실패했습니다", "error")
  } finally {
    dom.hideSpinner(spinner)
  }
})

// Handle nickname form submission
nicknameForm.addEventListener("submit", async (e) => {
  e.preventDefault()

  const newNickname = newNicknameInput.value.trim()

  // Clear errors
  dom.qs("#nickname-error").textContent = ""

  if (!newNickname) {
    dom.qs("#nickname-error").textContent = "닉네임을 입력해주세요"
    return
  }

  if (newNickname.length < 2 || newNickname.length > 20) {
    dom.qs("#nickname-error").textContent = "닉네임은 2-20자 사이여야 합니다"
    return
  }

  const spinner = dom.showSpinner()

  try {
    await api.updateName(newNickname)

    dom.showToast("닉네임이 변경되었습니다")

    // Reload profile
    await loadProfile()

    // Reset form
    newNicknameInput.value = ""
  } catch (error) {
    console.error("Nickname change error:", error)
    dom.showToast(error.message || "닉네임 변경에 실패했습니다", "error")
  } finally {
    dom.hideSpinner(spinner)
  }
})

// Handle password form submission
passwordForm.addEventListener("submit", async (e) => {
  e.preventDefault()

  const currentPassword = currentPasswordInput.value
  const newPassword = newPasswordInput.value
  const newPasswordConfirm = newPasswordConfirmInput.value

  // Clear errors
  dom.qs("#current-password-error").textContent = ""
  dom.qs("#new-password-error").textContent = ""
  dom.qs("#new-password-confirm-error").textContent = ""

  // Validation
  if (!currentPassword) {
    dom.qs("#current-password-error").textContent = "현재 비밀번호를 입력해주세요"
    return
  }

  if (!newPassword) {
    dom.qs("#new-password-error").textContent = "새 비밀번호를 입력해주세요"
    return
  }

  if (newPassword.length < 8) {
    dom.qs("#new-password-error").textContent = "비밀번호는 8자 이상이어야 합니다"
    return
  }

  if (newPassword !== newPasswordConfirm) {
    dom.qs("#new-password-confirm-error").textContent = "비밀번호가 일치하지 않습니다"
    return
  }

  const spinner = dom.showSpinner()

  try {
    await api.updatePassword(currentPassword, newPassword)

    dom.showToast("비밀번호가 변경되었습니다")

    // Reset form
    passwordForm.reset()
  } catch (error) {
    console.error("Password change error:", error)
    dom.showToast(error.message || "비밀번호 변경에 실패했습니다", "error")
  } finally {
    dom.hideSpinner(spinner)
  }
})

// Initialize
loadProfile()
