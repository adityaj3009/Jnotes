// Firebase configuration and initialization
const firebaseConfig = {
  //
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Header scroll effect
window.addEventListener("scroll", function () {
  const header = document.getElementById("header");
  if (window.scrollY > 50) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();

    const targetId = this.getAttribute("href");
    const targetElement = document.querySelector(targetId);

    if (targetElement) {
      window.scrollTo({
        top: targetElement.offsetTop - 80,
        behavior: "smooth",
      });
    }
  });
});

// Create auth modal
const authModal = document.createElement("div");
authModal.className = "auth-modal";
authModal.innerHTML = `
            <div class="auth-modal-content">
                <button class="close-auth-modal">&times;</button>
                <div class="auth-tabs">
                    <button class="auth-tab active" data-tab="login">Log In</button>
                    <button class="auth-tab" data-tab="signup">Sign Up</button>
                </div>
                <div class="auth-forms">
                    <form class="auth-form active" id="loginForm">
                        <div class="form-group">
                            <label for="loginEmail">Email</label>
                            <input type="email" id="loginEmail" required>
                        </div>
                        <div class="form-group">
                            <label for="loginPassword">Password</label>
                            <input type="password" id="loginPassword" required>
                        </div>
                        <button type="submit" class="btn btn-primary">Log In</button>
                        <div class="auth-footer">
                            <a href="#" class="forgot-password">Forgot password?</a>
                        </div>
                    </form>
                    <form class="auth-form" id="signupForm">
                        <div class="form-group">
                            <label for="signupName">Full Name</label>
                            <input type="text" id="signupName" required>
                        </div>
                        <div class="form-group">
                            <label for="signupEmail">Email</label>
                            <input type="email" id="signupEmail" required>
                        </div>
                        <div class="form-group">
                            <label for="signupPassword">Password</label>
                            <input type="password" id="signupPassword" required minlength="6">
                        </div>
                        <button type="submit" class="btn btn-primary">Create Account</button>
                        <div class="auth-footer">
                            By signing up, you agree to our <a href="#">Terms</a> and <a href="#">Privacy Policy</a>
                        </div>
                    </form>
                </div>
                <div class="social-auth">
                    <p>Or continue with</p>
                    <div class="social-buttons">
                        <button class="social-btn google" id="googleSignIn">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            Google
                        </button>
                        <button class="social-btn apple">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" fill="#999"/>
                            </svg>
                            Apple
                        </button>
                    </div>
                </div>
            </div>
        `;
document.body.appendChild(authModal);

// Show/hide modal functions
function showAuthModal(tab = "login") {
  authModal.style.display = "flex";
  document.body.style.overflow = "hidden";

  // Set active tab
  if (tab === "login") {
    document
      .querySelector('.auth-tab[data-tab="login"]')
      .classList.add("active");
    document
      .querySelector('.auth-tab[data-tab="signup"]')
      .classList.remove("active");
    document.getElementById("loginForm").classList.add("active");
    document.getElementById("signupForm").classList.remove("active");
  } else {
    document
      .querySelector('.auth-tab[data-tab="signup"]')
      .classList.add("active");
    document
      .querySelector('.auth-tab[data-tab="login"]')
      .classList.remove("active");
    document.getElementById("signupForm").classList.add("active");
    document.getElementById("loginForm").classList.remove("active");
  }
}

function hideAuthModal() {
  authModal.style.display = "none";
  document.body.style.overflow = "";
}

// Event listeners for auth modal
document.getElementById("loginBtn").addEventListener("click", (e) => {
  e.preventDefault();
  showAuthModal("login");
});

document.getElementById("signupBtn").addEventListener("click", (e) => {
  e.preventDefault();
  showAuthModal("signup");
});

// Add event listeners to all signup modal triggers
document.querySelectorAll(".signup-modal-trigger").forEach((button) => {
  button.addEventListener("click", (e) => {
    e.preventDefault();
    showAuthModal("signup");
  });
});

authModal.addEventListener("click", (e) => {
  if (
    e.target === authModal ||
    e.target.classList.contains("close-auth-modal")
  ) {
    hideAuthModal();
  }
});

// Tab switching
document.querySelectorAll(".auth-tab").forEach((tab) => {
  tab.addEventListener("click", function () {
    const tabName = this.getAttribute("data-tab");

    // Update active tab
    document
      .querySelectorAll(".auth-tab")
      .forEach((t) => t.classList.remove("active"));
    this.classList.add("active");

    // Update active form
    document
      .querySelectorAll(".auth-form")
      .forEach((form) => form.classList.remove("active"));
    document.getElementById(`${tabName}Form`).classList.add("active");
  });
});

// Form submissions
document
  .getElementById("loginForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    try {
      const userCredential = await auth.signInWithEmailAndPassword(
        email,
        password
      );

      // Set displayName if missing
      if (!userCredential.user.displayName) {
        await userCredential.user.updateProfile({
          displayName: email.split("@")[0],
        });
      }

      // Store user data in localStorage
      const currentUser = {
        name: userCredential.user.displayName || email.split("@")[0],
        email: userCredential.user.email,
        profilePhoto: userCredential.user.photoURL || null,
      };
      localStorage.setItem("currentUser", JSON.stringify(currentUser));

      hideAuthModal();
      updateUI(userCredential.user);
      redirectToMainPage(userCredential.user);
    } catch (error) {
      alert(error.message);
    }
  });

document
  .getElementById("signupForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const name = document.getElementById("signupName").value;
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;

    try {
      // Create user with email and password
      const userCredential = await auth.createUserWithEmailAndPassword(
        email,
        password
      );

      // Add user data to Firestore
      await db.collection("users").doc(userCredential.user.uid).set({
        name: name,
        email: email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
      });

      // Update user profile with display name
      await userCredential.user.updateProfile({
        displayName: name,
      });

      // Store user data in localStorage
      const currentUser = {
        name: name,
        email: email,
        profilePhoto: null,
      };
      localStorage.setItem("currentUser", JSON.stringify(currentUser));

      hideAuthModal();
      updateUI(userCredential.user);
      redirectToMainPage(userCredential.user);
    } catch (error) {
      alert(error.message);
    }
  });

// Google Sign-In
document
  .getElementById("googleSignIn")
  .addEventListener("click", async function () {
    const provider = new firebase.auth.GoogleAuthProvider();

    try {
      const result = await auth.signInWithPopup(provider);
      const user = result.user;

      // Check if user is new
      if (result.additionalUserInfo.isNewUser) {
        // Add user data to Firestore
        await db.collection("users").doc(user.uid).set({
          name: user.displayName,
          email: user.email,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        // Update last login time for existing user
        await db.collection("users").doc(user.uid).update({
          lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
        });
      }

      // Store user data in localStorage
      const currentUser = {
        name: user.displayName,
        email: user.email,
        profilePhoto: user.photoURL,
      };
      localStorage.setItem("currentUser", JSON.stringify(currentUser));

      hideAuthModal();
      updateUI(user);
      redirectToMainPage(user);
    } catch (error) {
      alert(error.message);
    }
  });

// Forgot password
document
  .querySelector(".forgot-password")
  ?.addEventListener("click", async function (e) {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;

    if (!email) {
      alert("Please enter your email address first");
      return;
    }

    try {
      await auth.sendPasswordResetEmail(email);
      alert("Password reset email sent. Please check your inbox.");
    } catch (error) {
      alert(error.message);
    }
  });

// Update UI based on auth state
function updateUI(user) {
  const authContainer = document.getElementById("authContainer");

  if (user) {
    // User is signed in
    authContainer.innerHTML = `
                    <div class="auth-status">
                        <button class="btn btn-outline" id="userMenuBtn">
                            ${user.displayName || user.email}
                        </button>
                        <div class="user-menu">
                            <div class="user-menu-item" id="logoutBtn">Log Out</div>
                        </div>
                    </div>
                `;

    // Add event listeners for new elements
    document.getElementById("userMenuBtn")?.addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelector(".user-menu").classList.toggle("active");
      // Redirect to home page when clicking username
      redirectToMainPage(user);
    });

    document
      .getElementById("logoutBtn")
      ?.addEventListener("click", async () => {
        try {
          await auth.signOut();
          localStorage.removeItem("currentUser");
          updateUI(null);
        } catch (error) {
          alert(error.message);
        }
      });
  } else {
    // User is signed out
    authContainer.innerHTML = `
                    <a href="#" class="btn btn-outline" id="loginBtn">Log In</a>
                    <a href="#" class="btn btn-primary signup-modal-trigger" id="signupBtn">Sign Up</a>
                `;

    // Reattach event listeners
    document.getElementById("loginBtn")?.addEventListener("click", (e) => {
      e.preventDefault();
      showAuthModal("login");
    });

    document.getElementById("signupBtn")?.addEventListener("click", (e) => {
      e.preventDefault();
      showAuthModal("signup");
    });
  }
}

// Redirect to main page
function redirectToMainPage(user) {
  if (user) {
    window.location.href = "../home.html";
  }
}

// Auth state observer
auth.onAuthStateChanged((user) => {
  updateUI(user);

  // If user is logged in and on intro page, redirect to main page
  if (user && window.location.pathname.includes("intro_page.html")) {
    redirectToMainPage(user);
  }
});

// Close user menu when clicking outside
document.addEventListener("click", function (e) {
  const userMenu = document.querySelector(".user-menu");
  if (userMenu && !e.target.closest(".auth-status")) {
    userMenu.classList.remove("active");
  }
});
