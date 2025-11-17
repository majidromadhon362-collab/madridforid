// global.js — PART 1/10
// MadridForID — Full final (IMGBB upload, admin, no firebase storage)

// ---------------- FIREBASE IMPORTS ----------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore, collection, getDocs, query, orderBy, limit,
  addDoc, doc, setDoc, deleteDoc, serverTimestamp, getDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// ---------------- CONFIG ----------------
// --- SET YOUR IMGBB API KEY HERE (if you want uploads from global.js)
export const IMGBB_KEY = "c438ddf1b0de692e084414e335436ec6";

// Firebase config (your project)
const firebaseConfig = {
  apiKey: "AIzaSyA18AEH3-hByOQ7g9i3OJCJLzt4HDIJbpc",
  authDomain: "madridforid-web.firebaseapp.com",
  projectId: "madridforid-web",
  storageBucket: "madridforid-web.appspot.com",
  messagingSenderId: "882098167537",
  appId: "1:882098167537:web:acf50819e9c81adaad1350"
};

// ---------------- INIT ----------------
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

// Admin UID(s)
export const ADMIN_UIDS = ["T9MBugPPYLQ4HVu6uLBV3kEck3C2"];

// global.js — PART 2/10
// HEADER loader (inject header.html and re-run scripts)
(async () => {
  try {
    const target = document.getElementById("include-header");
    if (!target) return;
    const res = await fetch("header.html?cb=" + Date.now());
    if (!res.ok) throw new Error("Failed load header.html");
    const html = await res.text();
    target.innerHTML = html;

    // Re-run inline scripts inside header
    const scripts = Array.from(target.querySelectorAll("script"));
    for (const old of scripts) {
      const s = document.createElement("script");
      if (old.type) s.type = old.type;
      if (old.src) s.src = old.src;
      else s.textContent = old.textContent;
      document.body.appendChild(s);
      old.remove();
    }

    // emit header-ready
    window.dispatchEvent(new Event("header-ready"));
    console.log("✅ header-ready dispatched");
  } catch (err) {
    console.error("header loader error:", err);
  }
})();

// ---------------- HELPERS ----------------
export function toDate(v) {
  if (!v) return null;
  if (typeof v.toDate === "function") return v.toDate();
  if (v && typeof v.seconds === "number") return new Date(v.seconds * 1000);
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

export function timeAgo(v) {
  try {
    const d = toDate(v);
    if (!d) return "just now";
    const s = Math.floor((Date.now() - d.getTime()) / 1000);
    const days = Math.floor(s / 86400);
    if (days > 0) return `${days} day${days>1?"s":""} ago`;
    const hrs = Math.floor(s / 3600);
    if (hrs > 0) return `${hrs} hour${hrs>1?"s":""} ago`;
    const mins = Math.floor(s / 60);
    if (mins > 0) return `${mins} minute${mins>1?"s":""} ago`;
    return "just now";
  } catch (e) {
    return "just now";
  }
}

// global.js — PART 3/10
// ---------------- RENDER: NEWS ----------------
export function renderNews(snap) {
  try {
    const wrap = document.getElementById("newsScroll");
    if (!wrap) return;
    wrap.innerHTML = "";
    snap.forEach(docSnap => {
      const d = docSnap.data();
      const img = d.imageUrl || d.image || "https://i.postimg.cc/PrV4N35r/user.png";
      wrap.innerHTML += `
        <div class="card">
          <img src="${img}" alt="thumb" loading="lazy" onerror="this.src='https://i.postimg.cc/PrV4N35r/user.png'">
          <small>⏰ ${timeAgo(d.createdAt)}</small>
          <h4>${(d.title||"Untitled").replace(/</g,'&lt;')}</h4>
          <a href="news-detail.html?id=${docSnap.id}" class="btn-readmore">Read More</a>
        </div>
      `;
    });
  } catch (e) {
    console.error("renderNews error:", e);
  }
}

// ---------------- RENDER: GALLERY ----------------
export function renderGallery(snap) {
  try {
    const wrap = document.getElementById("galleryGrid");
    if (!wrap) return;
    wrap.innerHTML = "";
    snap.forEach(docSnap => {
      const d = docSnap.data();
      const img = d.imageUrl || d.url || '';
      if (!img) return;
      wrap.innerHTML += `
        <div class="card">
          <img src="${img}" alt="gallery" loading="lazy" onerror="this.src='https://i.postimg.cc/PrV4N35r/user.png'">
        </div>
      `;
    });
  } catch (e) {
    console.error("renderGallery error:", e);
  }
}

// global.js — PART 4/10
// ---------------- MATCH UTIL & RENDER ----------------
export function getMatchStatus(dt) {
  const d = toDate(dt);
  if (!d) return "UNKNOWN";
  const now = Date.now();
  const start = d.getTime();
  const end = start + 2 * 60 * 60 * 1000; // 2 hours
  if (now < start) return "UPCOMING";
  if (now >= start && now <= end) return "LIVE";
  return "FINISHED";
}

function formatCountdown(ms) {
  if (ms <= 0) return "0D 0H 0M";
  let totalM = Math.floor(ms / 60000);
  const days = Math.floor(totalM / (60*24));
  totalM -= days * 60 * 24;
  const hours = Math.floor(totalM / 60);
  const minutes = totalM % 60;
  return `${days}D ${hours}H ${minutes}M`;
}

// Recent results (finished >2h)
export function renderResultsSafe(snap) {
  try {
    const wrap = document.getElementById("resultScroll");
    if (!wrap) return;

    wrap.innerHTML = "";
    const now = Date.now();
    const finished = [];

    snap.forEach(docSnap => {
      const d = docSnap.data();
      const dt = toDate(d.datetime);
      if (!dt) return;

      const end = dt.getTime() + 2 * 60 * 60 * 1000; // match selesai 2 jam
      if (now > end) finished.push({ id: docSnap.id, ...d, dt });
    });

    if (!finished.length) {
      wrap.innerHTML = "<p style='opacity:.7'>No recent matches</p>";
      return;
    }

    // urut dari terbaru
    finished.sort((a, b) => b.dt - a.dt);

    // render card
    finished.forEach(f => {
      wrap.innerHTML += `
        <div class="card" style="position:relative;">
          <h4>${f.match}</h4>
          <small>${f.dt.toLocaleString('id-ID')}</small>
          <div style="font-weight:700;color:var(--gold);margin:8px 0">
            ${f.score || '– : –'}
          </div>
          <button class="editScoreBtn" data-id="${f.id}" style="display:none">Edit</button>
        </div>
      `;
    });

    // ⭐ FIX PENTING: tampilkan tombol kalau admin
    setTimeout(() => {
      const isAdmin = currentUser && ADMIN_UIDS.includes(currentUser.uid);
      document.querySelectorAll(".editScoreBtn").forEach(btn => {
        btn.style.display = isAdmin ? "inline-block" : "none";
      });
    }, 300);

  } catch (e) {
    console.error("renderResultsSafe error:", e);
  }
}

// ================== RENDER UPCOMING (HOME) ===================
export function renderUpcomingSafe(snap) {
  try {
    const wrap = document.getElementById("upcomingScroll");
    if (!wrap) return;

    wrap.innerHTML = "";

    const now = Date.now();
    const upcoming = [];

    snap.forEach(docSnap => {
      const d = docSnap.data();
      if (!d.datetime) return;

      const dt = new Date(d.datetime).getTime();
      if (dt <= now) return; // hanya upcoming

      upcoming.push({
        id: docSnap.id,
        ...d,
        dt
      });
    });

    if (!upcoming.length) {
      wrap.innerHTML = "<p style='opacity:.7'>No upcoming matches</p>";
      return;
    }

    // urutkan terdekat dulu
    upcoming.sort((a, b) => a.dt - b.dt);

    upcoming.forEach(m => {
      const diff = m.dt - now;
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const countdown = `${days}D ${hours}H ${mins}M`;

      wrap.innerHTML += `
        <div class="card" style="position:relative;">
          <div style="font-size:0.75rem;font-weight:700;color:#FFD700;margin-bottom:6px;">
            UPCOMING
          </div>

          <div style="font-size:1rem;font-weight:700;margin-bottom:6px;">
            ${m.match}
          </div>

          <div style="font-size:0.9rem;opacity:0.9;margin-bottom:4px;">
            ${new Date(m.datetime).toLocaleDateString("id-ID", { day:"2-digit", month:"2-digit", year:"numeric" })} 
            • 
            ${new Date(m.datetime).toLocaleTimeString("id-ID", { hour:"2-digit", minute:"2-digit" })}
          </div>

          <div style="font-size:0.9rem;opacity:0.9;margin-bottom:6px;">
            🏟 ${m.stadium || "-"}
          </div>

          <div style="font-size:0.9rem;font-weight:600;margin-bottom:12px;">
            ⏳ ${countdown}
          </div>

          <a href="schedule-detail.html?id=${m.id}" 
             class="btn-readmore" 
             style="
               background:#FFD700;
               color:#000;
               padding:7px 12px;
               border-radius:7px;
               font-weight:700;
               text-decoration:none;
               display:inline-block;
               margin-top:4px;
             ">
             Read More
          </a>
        </div>
      `;
    });

  } catch (e) {
    console.error("renderUpcomingSafe error:", e);
  }
}

// global.js — PART 5/10
// ---------------- LOAD HOME DATA ----------------
import { query as fbQuery } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

export async function loadAllSafe(dbRef) {
  try {
    const [newsSnap, schedSnap, galSnap] = await Promise.all([
      getDocs(fbQuery(collection(dbRef,"news"), orderBy("createdAt","desc"), limit(10))),
      getDocs(fbQuery(collection(dbRef,"schedule"), orderBy("datetime","desc"), limit(30))),
      getDocs(fbQuery(collection(dbRef,"gallery"), orderBy("createdAt","desc"), limit(10))),
    ]);
    renderNews(newsSnap);
    renderGallery(galSnap);
    renderResultsSafe(schedSnap);
    renderUpcomingSafe(schedSnap);
  } catch (err) {
    console.error("loadAllSafe error:", err);
    // graceful fallback
    const newsEl = document.getElementById("newsScroll");
    if (newsEl) newsEl.innerHTML = "<p style='color:#f66'>Failed to load data</p>";
  }
}

// global.js — PART 6/10
// ---------------- HERO LOADER (read realUrl || url) ----------------
export async function loadHeroSafe(db) {
  try {
    const wrap = document.getElementById("heroSlideshow");
    wrap.innerHTML = `
      <button id="editHeroBtn" class="edit-hero-btn">✎ Edit Hero</button>
    `;

    const urls = [];

    for (let i = 1; i <= 3; i++) {
      const snap = await getDoc(doc(db, "home_hero", `slide${i}`));
      if (snap.exists() && snap.data().url)
        urls.push(snap.data().url);
    }

    if (!urls.length) {
      wrap.innerHTML += `<p style="color:#bbb;text-align:center;">No slides found</p>`;
      return;
    }

    urls.forEach(url => {
      const img = document.createElement("img");
      img.className = "hero-img";
      img.src = url;
      wrap.appendChild(img);
    });

    // slideshow
    const slides = wrap.querySelectorAll(".hero-img");
    let index = 0;
    slides[index].classList.add("active");

    if (window._slideLoop) clearInterval(window._slideLoop);

    window._slideLoop = setInterval(() => {
      slides[index].classList.remove("active");
      index = (index + 1) % slides.length;
      slides[index].classList.add("active");
    }, 3500);

  } catch (err) {
    console.error("Hero load error:", err);
  }
}

document.addEventListener("click", async (e) => {
  if (e.target.id === "saveHeroBtn") {
    const files = [
      document.getElementById("hero1").files[0],
      document.getElementById("hero2").files[0],
      document.getElementById("hero3").files[0]
    ];

    for (let i = 0; i < 3; i++) {
      if (files[i]) {
        const upload = await uploadToImgbb(files[i]);
        await setDoc(doc(db, "home_hero", `slide${i+1}`), {
          url: upload.url,
          updatedAt: serverTimestamp()
        });
      }
    }

    alert("Slides updated!");
    document.getElementById("heroModal").style.display = "none";
    loadHeroSafe(db);
  }
});

document.addEventListener("click", (e) => {
  if (e.target.id === "editHeroBtn") {
    document.getElementById("heroModal").style.display = "flex";
  }
});

// global.js — PART 7/10
// ---------------- IMGBB UPLOAD HELPER ----------------
export async function uploadToImgbb(file, apiKey = IMGBB_KEY) {
  if (!file) throw new Error("No file provided");
  if (!apiKey) throw new Error("IMGBB API key not set (IMGBB_KEY)");

  // convert to base64
  const base64 = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(",")[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

  const form = new FormData();
  form.append("key", apiKey);
  form.append("image", base64);

  const res = await fetch("https://api.imgbb.com/1/upload", {
    method: "POST",
    body: form
  });
  const j = await res.json();
  if (!j || !j.success) {
    throw new Error(j?.error?.message || "IMGBB upload failed");
  }
  // choose display_url or url; display_url is safe for web
  return {
    url: j.data.display_url || j.data.url,
    thumb: j.data.thumb?.thumb || j.data.thumb?.display || ''
  };
}

// ---------------- HERO MODAL BINDINGS (if exists in page) ----------------
(function bindHeroModal() {
  try {
    const heroModal = document.getElementById("heroModal");
    const heroFile = document.getElementById("heroFile");
    const heroPreview = document.getElementById("heroPreview");
    const heroUploadBtn = document.getElementById("heroUploadBtn");
    const heroCloseBtn = document.getElementById("heroCloseBtn");
    const editHeroBtn = document.getElementById("editHeroBtn");

    if (!heroFile || !heroUploadBtn) return;

    // preview
    heroFile.addEventListener("change", () => {
      const f = heroFile.files?.[0];
      if (!f) return;
      heroPreview.src = URL.createObjectURL(f);
      heroPreview.style.display = "block";
    });

    // upload (crop is handled by page via Cropper if present; here we accept raw file)
    heroUploadBtn.addEventListener("click", async () => {
      if (!heroFile.files?.[0]) return alert("Pilih gambar dulu bro");
      heroUploadBtn.disabled = true;
      const old = heroUploadBtn.textContent;
      heroUploadBtn.textContent = "Uploading...";

      try {
        // if the page uses Cropper and replaced heroPreview with cropped blob, handle both cases
        let fileToSend = heroFile.files[0];

        // if heroPreview is <img> and has dataset blob (some flows set a blob), skip
        // upload to imgbb
        const result = await uploadToImgbb(fileToSend);
        // save to Firestore
        await addDoc(collection(db, "home_slides"), {
          url: result.url,
          realUrl: result.url,
          createdAt: serverTimestamp()
        });
        alert("Slide uploaded");
        heroModal.style.display = "none";
        heroPreview.style.display = "none";
        heroFile.value = "";
        // reload hero
        loadHeroSafe(db);
      } catch (err) {
        console.error("hero upload error", err);
        alert("Upload failed: " + err.message);
      } finally {
        heroUploadBtn.disabled = false;
        heroUploadBtn.textContent = old;
      }
    });

    // close
    heroCloseBtn?.addEventListener("click", () => {
      heroModal.style.display = "none";
      heroPreview.style.display = "none";
      heroFile.value = "";
    });

    // open modal (editHeroBtn is shown for admin by auth listener)
    document.addEventListener("click", (e) => {
      if (e.target && e.target.id === "editHeroBtn") {
        if (heroModal) heroModal.style.display = "flex";
      }
    });

  } catch (e) {
    console.warn("bindHeroModal warning", e);
  }
})();

// global.js — PART 8/10 (SIMPLE – NO CROP & 100% FIX)
// ---------------- SCHEDULE FLYER UPLOAD & ADD MATCH ----------------
(function bindScheduleUploadAndAdd() {
  try {
    // ELEMENTS
    const schedFile = document.getElementById("fmFlyerFile");
    const schedPreview = document.getElementById("matchPreview");
    const saveMatchBtn = document.getElementById("saveMatchBtn");

    const fmMatch = document.getElementById("fmMatch");
    const fmDatetime = document.getElementById("fmDatetime");
    const fmStadium = document.getElementById("fmStadium");
    const fmCategory = document.getElementById("fmCategory");
    const fmArticle = document.getElementById("fmArticle");

    let flyerFile = null;

    // ================= PREVIEW =================
    if (schedFile) {
      schedFile.addEventListener("change", () => {
        flyerFile = schedFile.files?.[0] || null;
        if (!flyerFile) return;

        schedPreview.src = URL.createObjectURL(flyerFile);
        schedPreview.style.display = "block";
        schedPreview.style.width = "100%";
        schedPreview.style.borderRadius = "10px";
        schedPreview.style.marginTop = "8px";
      });
    }

    // ================= SAVE MATCH =================
    if (saveMatchBtn) {
      saveMatchBtn.addEventListener("click", async () => {

        // VALIDATION
        if (!fmMatch.value.trim()) return alert("Nama match wajib diisi");
        if (!fmDatetime.value.trim()) return alert("Datetime wajib diisi");

        saveMatchBtn.disabled = true;
        const prev = saveMatchBtn.innerHTML;
        saveMatchBtn.innerHTML = `<span class="spinner"></span> Saving...`;

        try {
          let flyerUrl = null;

          // ===== UPLOAD TO IMGBB =====
          if (flyerFile) {
            const res = await uploadToImgbb(flyerFile);
            flyerUrl = res.url;
          }

          // ===== FORMAT DATETIME =====
          const datetimeISO = new Date(fmDatetime.value).toISOString();

          // ===== BUILD PAYLOAD =====
          const payload = {
            match: fmMatch.value.trim(),
            datetime: datetimeISO,
            stadium: fmStadium?.value || "",
            category: fmCategory?.value || "laliga",
            article: fmArticle?.value?.trim() || "",
            createdAt: serverTimestamp()
          };

          if (flyerUrl) {
            payload.flyerUrl = flyerUrl;
          }

          // ===== SAVE FIRESTORE =====
          await addDoc(collection(db, "schedule"), payload);

          alert("Match added!");

          // ===== RESET FORM =====
          schedFile.value = "";
          flyerFile = null;
          schedPreview.style.display = "none";

          fmMatch.value = "";
          fmDatetime.value = "";
          fmStadium.value = "";
          fmCategory.value = "laliga";
          if (fmArticle) fmArticle.value = "";

          // ===== RELOAD LISTS =====
          if (typeof loadAllSafe === "function") loadAllSafe(db);

        } catch (err) {
          console.error("save match error:", err);
          alert("Failed: " + err.message);
        }

        saveMatchBtn.disabled = false;
        saveMatchBtn.innerHTML = prev;
      });
    }

  } catch (e) {
    console.warn("bindScheduleUploadAndAdd error", e);
  }
})();

// global.js — PART 9/10
// ---------------- DELETE HANDLERS & EDIT SCORE & AUTH ----------------

// delete slide or schedule (delegated)
document.addEventListener("click", (e) => {
  const t = e.target;
  // delete slide
  if (t.classList && t.classList.contains("slide-delete-btn")) {
    if (!confirm("Hapus slide ini?")) return;
    const docId = t.dataset.docid;
    (async () => {
      try {
        await deleteDoc(doc(db, "home_slides", docId));
        alert("Slide deleted");
        loadHeroSafe(db);
      } catch (err) {
        console.error("delete slide err", err);
        alert("Failed to delete: " + err.message);
      }
    })();
  }

  // delete match (if delete button exists with class deleteMatchBtn and data-id)
  if (t.classList && t.classList.contains("deleteMatchBtn")) {
    if (!confirm("Hapus match ini?")) return;
    const id = t.dataset.id;
    (async () => {
      try {
        await deleteDoc(doc(db, "schedule", id));
        alert("Match deleted");
        if (typeof loadAllSafe === "function") loadAllSafe(db);
      } catch (err) {
        console.error("delete match err", err);
        alert("Failed to delete: " + err.message);
      }
    })();
  }
});

// EDIT SCORE (admin only) — delegated
document.addEventListener("click", (e) => {
  const t = e.target;
  if (!(t.classList && t.classList.contains("editScoreBtn"))) return;
  // check admin
  if (!currentUser || !ADMIN_UIDS.includes(currentUser.uid)) return alert("Admin only");
  const id = t.dataset.id;
  const newScore = prompt("Input score (format: 2-1):");
  if (!newScore) return;
  (async () => {
    try {
      await setDoc(doc(db, "schedule", id), { score: newScore }, { merge: true });
      alert("Score updated");
      if (typeof loadAllSafe === "function") loadAllSafe(db);
      if (typeof loadHeroSafe === "function") loadHeroSafe(db);
    } catch (err) {
      console.error("edit score err", err);
      alert("Failed to update score: " + err.message);
    }
  })();
});

// ---------------- AUTH CONTROL ----------------
let currentUser = null;
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  // broadcast event for pages
  window.dispatchEvent(new CustomEvent("auth-updated", { detail: { user } }));

  // show/hide admin UI
  const isAdmin = !!(user && ADMIN_UIDS.includes(user.uid));

  // edit hero btn
  const editHeroBtn = document.getElementById("editHeroBtn");
  if (editHeroBtn) editHeroBtn.style.display = isAdmin ? "block" : "none";

  // delete slide buttons
  document.querySelectorAll(".slide-delete-btn").forEach(b => {
    b.style.display = isAdmin ? "block" : "none";
  });

  // edit score buttons on page
  document.querySelectorAll(".editScoreBtn").forEach(b => {
    b.style.display = isAdmin ? "inline-block" : "none";
    // set data-id if not present (ensure)
    if (!b.dataset.id) {
      const parent = b.closest(".card");
      if (parent && parent.querySelector("a[href*='schedule-detail.html']")) {
        // skip; it's just a fallback
      }
    }
  });

  // header sign-in/out toggles (if header exposes signText or signBtn)
  try {
    const signText = document.getElementById("signText");
    const avatarImg = document.getElementById("avatarImg");
    if (user) {
      if (signText) signText.textContent = "Logout";
      if (avatarImg) { avatarImg.src = user.photoURL || ""; avatarImg.style.display = "block"; }
    } else {
      if (signText) signText.textContent = "Sign In";
      if (avatarImg) avatarImg.style.display = "none";
    }
  } catch {}
});

// global.js — PART 10/10
// ---------------- EXPORTS & AUTO LOAD ----------------
export default {
  app, db, auth, provider,
  loadAllSafe, loadHeroSafe,
  renderNews, renderGallery, renderResultsSafe, renderUpcomingSafe,
  uploadToImgbb, getMatchStatus
};

// auto-load on header-ready or DOMContentLoaded
window.addEventListener("header-ready", () => {
  try { loadHeroSafe(db); } catch (e) { console.error(e); }
  try { loadAllSafe(db); } catch (e) { console.error(e); }
});

// fallback
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    try {
      if (!document.querySelector("#heroSlideshow img")) loadHeroSafe(db);
    } catch {}
    try {
      if (!document.getElementById("newsScroll")?.children.length) loadAllSafe(db);
    } catch {}
  }, 900);
});

console.log("%cGLOBAL.JS (IMGBB) — LOADED", "color:#00eaff;font-weight:700");