// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCfFYTNiilUlBKYA8egp2e3NTpW1SIW5kE",
  authDomain: "jnotes-3009.firebaseapp.com",
  projectId: "jnotes-3009",
  storageBucket: "jnotes-3009.appspot.com",
  messagingSenderId: "299051059009",
  appId: "1:299051059009:web:efa487af7f20899cb283c0",
  measurementId: "G-GP8QF79SYW",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Note categories with their respective images
const noteCategories = {
  grocery: {
    title: "Grocery List",
    image:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop",
    placeholder:
      "Add your grocery items here...\n\n• Milk\n• Bread\n• Eggs\n• Fruits",
    color: "#4CAF50",
  },
  meeting: {
    title: "Meeting Notes",
    image:
      "https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=400&fit=crop",
    placeholder:
      "Meeting agenda and notes...\n\nDate: \nAttendees: \nTopics: \nAction items: ",
    color: "#2196F3",
  },
  project: {
    title: "Project Ideas",
    image:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=400&fit=crop",
    placeholder:
      "Brainstorm your project ideas...\n\n1. Project name\n   - Description\n   - Timeline\n   - Resources needed",
    color: "#9C27B0",
  },
  travel: {
    title: "Travel Plans",
    image:
      "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=400&fit=crop",
    placeholder:
      "Plan your next adventure...\n\nDestination: \nDates: \nBudget: \nItinerary: \nPacking list: ",
    color: "#FF9800",
  },
  books: {
    title: "Book Recommendations",
    image:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=400&fit=crop",
    placeholder:
      "Keep track of books to read...\n\n📚 Currently Reading:\n📖 Want to Read:\n✅ Finished:",
    color: "#795548",
  },
  goals: {
    title: "Personal Goals",
    image:
      "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400&h=400&fit=crop",
    placeholder:
      "Set and track your goals...\n\n🎯 Short-term goals:\n🚀 Long-term goals:\n💪 Daily habits:",
    color: "#F44336",
  },
};

// Global variables
let currentNoteType = "";
let currentNoteId = "";
let isDarkMode = localStorage.getItem("darkMode") === "true";
let currentUser = null;
let notes = {};

// DOM elements
const noteModal = document.getElementById("noteModal");
const closeModalBtn = document.getElementById("closeModal");
const saveNoteBtn = document.getElementById("saveNote");
const noteTitleInput = document.getElementById("noteTitleInput");
const noteContentInput = document.getElementById("noteContentInput");
const noteImage = document.getElementById("noteImage");
const notesGrid = document.getElementById("notesGrid");
const featuredGrid = document.getElementById("featuredGrid");
const searchInputs = document.querySelectorAll(".search-input");
const menuBtn = document.querySelector(".menu-btn");
const profilePic = document.getElementById("profilePic");
const app = document.querySelector(".app");
const userNameElement = document.querySelector(".user-name");
const appLogo = document.querySelector(".app-logo");

// Initialize app
document.addEventListener("DOMContentLoaded", function () {
  // Check auth state
  auth.onAuthStateChanged((user) => {
    if (user) {
      currentUser = user;
      updateUserDisplay();
      setupEventListeners();
      setupUserMenu();
      updateProfilePic();
      applyTheme();
      loadNotes();
      setupSearch();
      setupFeaturedNotes();
      addAnimationStyles();
    } else {
      // Redirect to login if not authenticated
      window.location.href = "/start/intro_page.html";
    }
  });
});

// Update user display in header
function updateUserDisplay() {
  if (userNameElement) {
    userNameElement.textContent = currentUser.displayName || "User";
  }
  if (appLogo) {
    appLogo.textContent = getInitials(currentUser.displayName || "User");
    appLogo.style.backgroundColor = getRandomColor();
  }
}

// Load notes from Firestore
function loadNotes() {
  if (!currentUser) return;

  notesGrid.innerHTML = '<div class="loading-state">Loading notes...</div>';

  db.collection("users")
    .doc(currentUser.uid)
    .collection("notes")
    .orderBy("updatedAt", "desc")
    .onSnapshot(
      (snapshot) => {
        notes = {};
        snapshot.forEach((doc) => {
          // FIX: Store note with ID included
          notes[doc.id] = { ...doc.data(), id: doc.id };
        });
        renderNotes();
      },
      (error) => {
        console.error("Error loading notes:", error);
        showNotification("Error loading notes");
        renderNotes(); // Will show empty state
      }
    );
}

// Event listeners
function setupEventListeners() {
  // Note card clicks
  document.querySelectorAll(".note-card").forEach((card) => {
    card.addEventListener("click", function (e) {
      if (!e.target.closest(".save-btn-small")) {
        const noteType = this.getAttribute("data-note");
        openNoteModal(noteType);
      }
    });
  });

  // Modal controls
  closeModalBtn.addEventListener("click", closeNoteModal);
  saveNoteBtn.addEventListener("click", saveNote);

  // Close modal on overlay click
  noteModal.addEventListener("click", function (e) {
    if (e.target === noteModal) {
      closeNoteModal();
    }
  });

  // Close modal on Escape key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && noteModal.classList.contains("active")) {
      closeNoteModal();
    }

    // Delete key for deleting selected note
    if (e.key === "Delete" && currentNoteId) {
      deleteNote(currentNoteId);
    }
  });

  // Auto-save on input
  let saveTimeout;
  [noteTitleInput, noteContentInput].forEach((input) => {
    input.addEventListener("input", function () {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        if (
          currentNoteType &&
          (noteTitleInput.value.trim() || noteContentInput.value.trim())
        ) {
          saveNote(false); // Save without closing modal
        }
      }, 1000);
    });
  });

  // Ctrl+S or Cmd+S to save
  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      if (noteModal.classList.contains("active")) {
        saveNote();
      }
    }
  });
}

// Setup user menu
function setupUserMenu() {
  const userMenu = document.createElement("div");
  userMenu.className = "user-menu";
  userMenu.innerHTML = `
    <div class="user-info">
        <div class="user-avatar">${getInitials(
          currentUser.displayName || "User"
        )}</div>
        <div class="user-details">
            <h4>${currentUser.displayName || "User"}</h4>
            <p>${currentUser.email}</p>
        </div>
    </div>
    <div class="menu-items">
        <button class="menu-item" id="settingsBtn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
            Settings
        </button>
        <button class="menu-item" id="themeToggleBtn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
            ${isDarkMode ? "Light Mode" : "Dark Mode"}
        </button>
        <button class="menu-item" id="logoutBtn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Logout
        </button>
    </div>
  `;

  document.body.appendChild(userMenu);

  profilePic.addEventListener("click", function (e) {
    e.stopPropagation();
    userMenu.classList.toggle("show");
  });

  // Close menu when clicking outside
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".profile-pic") && !e.target.closest(".user-menu")) {
      userMenu.classList.remove("show");
    }
  });

  // Theme toggle in user menu
  document
    .getElementById("themeToggleBtn")
    .addEventListener("click", function () {
      isDarkMode = !isDarkMode;
      localStorage.setItem("darkMode", isDarkMode);
      applyTheme();
      this.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
      ${isDarkMode ? "Light Mode" : "Dark Mode"}
    `;
    });

  // Settings button
  // In setupUserMenu function, replace the settingsBtn with this:
  document.getElementById("settingsBtn").addEventListener("click", function () {
    window.location.href = "settings.html";
    userMenu.classList.remove("show");
  });

  // Logout button
  document.getElementById("logoutBtn").addEventListener("click", function () {
    logoutUser();
  });
}

// Open settings modal
function openSettingsModal() {
  const settingsModal = document.createElement("div");
  settingsModal.className = "modal active";
  settingsModal.innerHTML = `
    <div class="modal-content settings-modal">
      <div class="modal-header">
        <h3>Profile Settings</h3>
        <button class="close-btn">&times;</button>
      </div>
      <div class="modal-body">
        <div class="settings-avatar">
          <div class="avatar-preview" id="avatarPreview" style="background-color: ${getRandomColor()}; ${
    currentUser.photoURL
      ? `background-image: url('${currentUser.photoURL}')`
      : ""
  }">
            ${
              currentUser.photoURL
                ? ""
                : getInitials(currentUser.displayName || "User")
            }
          </div>
          <button class="upload-btn" id="uploadPhotoBtn">Change Photo</button>
          <input type="file" id="photoUpload" accept="image/*" style="display: none;">
        </div>
        <div class="form-group">
          <label for="userNameInput">Name</label>
          <input type="text" id="userNameInput" value="${
            currentUser.displayName || ""
          }">
        </div>
        <div class="form-group">
          <label for="userEmailInput">Email</label>
          <input type="email" id="userEmailInput" value="${
            currentUser.email
          }" disabled>
        </div>
        <div class="form-actions">
          <button class="cancel-btn">Cancel</button>
          <button class="save-btn" id="saveProfileBtn">Save Changes</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(settingsModal);
  document.body.style.overflow = "hidden";

  // Event listeners for settings modal
  const closeBtn = settingsModal.querySelector(".close-btn");
  const cancelBtn = settingsModal.querySelector(".cancel-btn");
  const saveBtn = settingsModal.querySelector("#saveProfileBtn");
  const uploadBtn = settingsModal.querySelector("#uploadPhotoBtn");
  const photoUpload = settingsModal.querySelector("#photoUpload");
  const avatarPreview = settingsModal.querySelector("#avatarPreview");

  function closeSettingsModal() {
    settingsModal.remove();
    document.body.style.overflow = "";
  }

  closeBtn.addEventListener("click", closeSettingsModal);
  cancelBtn.addEventListener("click", closeSettingsModal);

  // Close modal on overlay click
  settingsModal.addEventListener("click", function (e) {
    if (e.target === settingsModal) {
      closeSettingsModal();
    }
  });

  // Save profile changes
  saveBtn.addEventListener("click", function () {
    const newName = document.getElementById("userNameInput").value.trim();

    if (!newName) {
      alert("Please enter your name");
      return;
    }

    // Update profile in Firebase
    currentUser
      .updateProfile({
        displayName: newName,
      })
      .then(() => {
        currentUser = auth.currentUser; // Refresh current user
        updateUserDisplay();
        updateProfilePic();
        closeSettingsModal();
        showNotification("Profile updated successfully!");
      })
      .catch((error) => {
        console.error("Error updating profile:", error);
        showNotification("Error updating profile");
      });
  });

  // Photo upload
  uploadBtn.addEventListener("click", function () {
    photoUpload.click();
  });

  photoUpload.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (event) {
        // In a real app, you would upload this to Firebase Storage
        // For simplicity, we'll just update the local display
        currentUser
          .updateProfile({
            photoURL: event.target.result,
          })
          .then(() => {
            currentUser = auth.currentUser; // Refresh current user
            avatarPreview.style.backgroundImage = `url('${event.target.result}')`;
            avatarPreview.textContent = "";
            updateProfilePic();
            updateUserDisplay();
          })
          .catch((error) => {
            console.error("Error updating profile photo:", error);
            showNotification("Error updating profile photo");
          });
      };
      reader.readAsDataURL(file);
    }
  });
}

// Logout user
function logoutUser() {
  if (confirm("Are you sure you want to logout?")) {
    auth
      .signOut()
      .then(() => {
        window.location.href = "/start/intro_page.html";
      })
      .catch((error) => {
        console.error("Logout error:", error);
        showNotification("Error logging out");
      });
  }
}

// Update profile picture
function updateProfilePic() {
  if (currentUser.photoURL) {
    profilePic.style.backgroundImage = `url('${currentUser.photoURL}')`;
    profilePic.textContent = "";
  } else {
    profilePic.style.backgroundImage = "none";
    profilePic.style.backgroundColor = getRandomColor();
    profilePic.textContent = getInitials(currentUser.displayName || "User");
  }
}

// Get user initials for avatar
function getInitials(name) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

// Get random color for avatar background
function getRandomColor() {
  const colors = [
    "#4CAF50",
    "#2196F3",
    "#9C27B0",
    "#FF9800",
    "#F44336",
    "#795548",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Apply theme
function applyTheme() {
  if (isDarkMode) {
    app.classList.add("dark-mode");
  } else {
    app.classList.remove("dark-mode");
  }
}

// Setup featured notes
function setupFeaturedNotes() {
  const featuredNotes = document.querySelectorAll("#featuredGrid .note-card");
  featuredNotes.forEach((note) => {
    note.addEventListener("click", function () {
      const noteType = this.getAttribute("data-note");
      openNoteModal(noteType);
    });
  });
}

// Open note modal
function openNoteModal(noteType, noteId = null) {
  currentNoteType = noteType;
  currentNoteId = noteId || generateNoteId();

  const category = noteCategories[noteType];
  if (!category) return;

  // Set modal content
  noteImage.style.backgroundImage = `url('${category.image}')`;
  saveNoteBtn.style.backgroundColor = category.color;

  if (noteId && notes[noteId]) {
    // Editing existing note
    const note = notes[noteId];
    noteTitleInput.value = note.title;
    noteContentInput.value = note.content;
  } else {
    // Creating new note
    noteTitleInput.value = category.title;
    noteContentInput.value = "";
    noteContentInput.placeholder = category.placeholder;
  }

  // Show modal
  noteModal.classList.add("active");
  document.body.style.overflow = "hidden";

  // Focus on content input
  setTimeout(() => noteContentInput.focus(), 300);
}

// Close note modal
function closeNoteModal() {
  noteModal.classList.remove("active");
  document.body.style.overflow = "";

  // Reset form
  currentNoteType = "";
  currentNoteId = "";
  noteTitleInput.value = "";
  noteContentInput.value = "";
  noteContentInput.placeholder = "Take a note...";
  saveNoteBtn.style.backgroundColor = "";
}

// Save note to Firestore
function saveNote(closeModal = true) {
  const title = noteTitleInput.value.trim();
  const content = noteContentInput.value.trim();

  if (!title && !content) {
    if (closeModal) closeNoteModal();
    return;
  }

  const noteData = {
    type: currentNoteType,
    title: title || noteCategories[currentNoteType].title,
    content: content,
    image: noteCategories[currentNoteType].image,
    color: noteCategories[currentNoteType].color,
    createdAt: notes[currentNoteId]?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Save to Firestore
  const noteRef = db
    .collection("users")
    .doc(currentUser.uid)
    .collection("notes")
    .doc(currentNoteId);

  noteRef
    .set(noteData)
    .then(() => {
      if (closeModal) {
        closeNoteModal();
        showNotification("Note saved successfully!");
      } else {
        // Pulse animation for the saved note
        const savedNote = document.querySelector(
          `.note-card[data-note-id="${currentNoteId}"]`
        );
        if (savedNote) {
          savedNote.classList.add("pulse");
          setTimeout(() => savedNote.classList.remove("pulse"), 300);
        }
      }
    })
    .catch((error) => {
      console.error("Error saving note:", error);
      showNotification("Error saving note");
    });
}

// Generate unique note ID
function generateNoteId() {
  return (
    currentNoteType +
    "_" +
    Date.now() +
    "_" +
    Math.random().toString(36).substr(2, 9)
  );
}

// Render saved notes
function renderNotes() {
  const savedNotes = Object.entries(notes).map(([id, note]) => ({ id, ...note }))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  notesGrid.innerHTML = "";

  if (savedNotes.length === 0) {
    notesGrid.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <h3>No notes yet</h3>
        <p>Click on a note type to create your first note</p>
      </div>
    `;
    return;
  }

   savedNotes.forEach((note) => {
    const noteCard = document.createElement("div");
    noteCard.className = "note-card";
    // FIX: Store note ID in dataset
    noteCard.dataset.noteId = note.id;
    noteCard.style.borderLeft = `4px solid ${note.color || "#ddd"}`;

  noteCard.innerHTML = `
      <div class="note-bg" style="background-image: url('${note.image}')"></div>
      <p class="note-title">${note.title}</p>
      <p class="note-preview">${getNotePreview(note.content)}</p>
      <div class="note-date">${formatDate(note.updatedAt)}</div>
      <button class="save-btn-small" data-note-id="${note.id}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
          <polyline points="17 21 17 13 7 13 7 21"></polyline>
          <polyline points="7 3 7 8 15 8"></polyline>
        </svg>
      </button>
    `;

    noteCard.addEventListener("click", function (e) {
      if (!e.target.closest(".save-btn-small")) {
        openNoteModal(note.type, note.id || currentNoteId);
      }
    });

    // Add save button functionality
    const saveBtn = noteCard.querySelector(".save-btn-small");
    saveBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      currentNoteId = this.getAttribute("data-note-id");
      saveNote();
    });

    // Add context menu for delete option
    noteCard.addEventListener("contextmenu", function (e) {
      e.preventDefault();
      showContextMenu(e, note.id || currentNoteId);
    });

    notesGrid.appendChild(noteCard);
  });
}

// Get note preview text
function getNotePreview(content) {
  if (!content) return "";
  const text = content.replace(/\n/g, " ").trim();
  return text.length > 50 ? text.substring(0, 50) + "..." : text;
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return "Today";
  } else if (diffInDays === 1) {
    return "Yesterday";
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  }
}

// Context menu for delete
function showContextMenu(e, noteId) {
  const existingMenu = document.querySelector(".context-menu");
  if (existingMenu) {
    existingMenu.remove();
  }

  const contextMenu = document.createElement("div");
  contextMenu.className = "context-menu";
  contextMenu.style.top = `${e.clientY}px`;
  contextMenu.style.left = `${e.clientX}px`;

  const deleteBtn = document.createElement("button");
  deleteBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M3 6h18"></path>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
    Delete
  `;

  deleteBtn.addEventListener("click", function () {
    deleteNote(noteId);
    contextMenu.remove();
  });

  contextMenu.appendChild(deleteBtn);
  document.body.appendChild(contextMenu);

  // Remove context menu on click outside
  setTimeout(() => {
    document.addEventListener("click", function removeMenu() {
      contextMenu.remove();
      document.removeEventListener("click", removeMenu);
    });
  }, 0);
}

// Delete note from Firestore
function deleteNote(noteId) {
  if (confirm("Are you sure you want to delete this note?")) {
    db.collection("users")
      .doc(currentUser.uid)
      .collection("notes")
      .doc(noteId)
      .delete()
      .then(() => {
        showNotification("Note deleted successfully!");
      })
      .catch((error) => {
        console.error("Error deleting note:", error);
        showNotification("Error deleting note");
      });
  }
}

// Search functionality
function setupSearch() {
  searchInputs.forEach((input) => {
    input.addEventListener("input", function () {
      const query = this.value.toLowerCase().trim();
      filterNotes(query);
    });
  });
}

function filterNotes(query) {
  const noteCards = document.querySelectorAll("#notesGrid .note-card");

  if (!query) {
    noteCards.forEach((card) => (card.style.display = "block"));
    return;
  }

  noteCards.forEach((card) => {
    // FIX: Use dataset to get note ID
    const noteId = card.dataset.noteId;
    const note = notes[noteId];

    if (!note) {
      card.style.display = "none";
      return;
    }

    const matchesSearch =
      (note.title && note.title.toLowerCase().includes(query)) ||
      (note.content && note.content.toLowerCase().includes(query)) ||
      (note.type && note.type.toLowerCase().includes(query));

    card.style.display = matchesSearch ? "block" : "none";
  });
}

// Show notification
function showNotification(message) {
  const notification = document.createElement("div");
  notification.className = "toast";
  notification.textContent = message;
  document.body.appendChild(notification);

  // Show notification
  setTimeout(() => {
    notification.classList.add("show");
  }, 10);

  // Remove notification after 3 seconds
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function addAnimationStyles() {
  const style = document.createElement("style");
  style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .note-card {
            animation: fadeIn 0.3s ease-out;
        }
        .user-menu {
            animation: fadeIn 0.2s ease-out;
        }
        
        /* Improved font styles */
        body {
            font-family: 'Noto Sans', sans-serif;
            -webkit-font-smoothing: antialiased;
        }
        .note-title {
            font-weight: 600;
            letter-spacing: 0.2px;
        }
        .note-content-input {
            font-family: 'Noto Sans', sans-serif;
            line-height: 1.6;
        }
        .section-title {
            font-weight: 700;
            letter-spacing: 0.5px;
        }
        
        /* Empty state */
        .empty-state {
            grid-column: 1 / -1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
            text-align: center;
        }
        
        .empty-state svg {
            margin-bottom: 16px;
            color: #6b7280;
        }
        
        .empty-state h3 {
            font-size: 18px;
            margin-bottom: 8px;
            color: #141414;
        }
        
        .empty-state p {
            font-size: 14px;
            color: #6b7280;
        }
        
        .dark-mode .empty-state h3 {
            color: #f5f5f5;
        }
        
        .dark-mode .empty-state p {
            color: #aaa;
        }
        .toast {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            background-color: #333;
            color: white;
            padding: 12px 24px;
            border-radius: 4px;
            z-index: 1000;
            opacity: 0;
            transition: all 0.3s ease;
            max-width: 90%;
            box-sizing: border-box;
            text-align: center;
        }
        
        .toast.show {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
        
        /* Context menu */
        .context-menu {
            position: fixed;
            background: white;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 1000;
            overflow: hidden;
            min-width: 160px;
        }
        
        .context-menu button {
            display: flex;
            align-items: center;
            gap: 8px;
            width: 100%;
            padding: 8px 16px;
            background: none;
            border: none;
            text-align: left;
            cursor: pointer;
            white-space: nowrap;
        }
        
        .context-menu button:hover {
            background: #f5f5f5;
        }
        
        .dark-mode .context-menu {
            background: #333;
        }
        
        .dark-mode .context-menu button:hover {
            background: #444;
        }
        
        /* Settings Modal */
        .settings-modal {
            max-width: 500px;
            width: 90%;
        }
        
        .settings-avatar {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .avatar-preview {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background-size: cover;
            background-position: center;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            color: white;
            margin-bottom: 10px;
        }
        
        .upload-btn {
            background: none;
            border: 1px solid #ddd;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        
        .form-group {
            margin-bottom: 15px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
        }
        
        .form-group input {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            box-sizing: border-box;
        }
        
        .form-actions {
            display: flex;
            justify-content: flex-end;
            margin-top: 20px;
            gap: 10px;
        }
        
        .cancel-btn {
            background: #f5f5f5;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
        }
        
        .dark-mode .cancel-btn {
            background: #333;
            color: #fff;
        }
        
        /* User menu styles - FIXED */
        .user-menu {
            position: absolute;
            top: 70px;
            right: 20px;
            width: min(280px, 90vw); /* Responsive width */
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            padding: 16px;
            z-index: 100;
            opacity: 0;
            visibility: hidden;
            transform: translateY(-10px);
            transition: all 0.2s ease;
            box-sizing: border-box;
        }
        
        .user-menu.show {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
        }
        
        .user-info {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 16px;
            padding-bottom: 16px;
            border-bottom: 1px solid #eee;
            width: 100%;
            min-width: 0; /* Fix for flex overflow */
        }
        
        .user-avatar {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background-color: ${getRandomColor()};
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: white;
            font-size: 18px;
            flex-shrink: 0;
        }
        
        .user-details {
            flex: 1;
            min-width: 0; /* Crucial for text truncation */
            overflow: hidden;
        }
        
        .user-details h4 {
            margin: 0;
            font-size: 16px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .user-details p {
            margin: 4px 0 0;
            font-size: 14px;
            color: #666;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .menu-items {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        
        .menu-item {
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
            padding: 10px 12px;
            border-radius: 6px;
            background: none;
            border: none;
            text-align: left;
            cursor: pointer;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .menu-item:hover {
            background: #f5f5f5;
        }
        
        .dark-mode .user-menu {
            background: #333;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        
        .dark-mode .user-details p {
            color: #aaa;
        }
        
        .dark-mode .menu-item:hover {
            background: #444;
        }
        
        /* App logo in header */
        .app-logo {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: white;
            margin-right: 10px;
            flex-shrink: 0;
        }
    `;
  document.head.appendChild(style);
}
