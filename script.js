// Simple state / "backend" using localStorage
const STORAGE_KEY = "FBLA2025";
const ADMIN_KEY = "FBLA2025"; 

let items = []; // {id, title, category, location, date, description, finderName, finderContact, photoDataUrl|null, status}

const navbar = document.getElementById("mainNavbar");

// Navbar hide/reveal on scroll
let lastScrollTop = 0;
window.addEventListener("scroll", () => {
  const st = window.pageYOffset || document.documentElement.scrollTop;
  if (st > lastScrollTop && st > 80) {
    navbar.classList.add("navbar-hide");
    navbar.classList.remove("navbar-show");
  } else {
    navbar.classList.remove("navbar-hide");
    navbar.classList.add("navbar-show");
  }
  lastScrollTop = st <= 0 ? 0 : st;
});

// Smooth scroll for nav links and hero buttons
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener("click", e => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    // Active state
    document.querySelectorAll(".glass-btn").forEach(b => b.classList.remove("active"));
    if (link.classList.contains("glass-btn")) {
      link.classList.add("active");
      setTimeout(() => link.classList.remove("active"), 700);
    }
  });
});

window.addEventListener("DOMContentLoaded", () => {
  navbar.classList.add("navbar-show");
  document.getElementById("year").textContent = new Date().getFullYear();
  loadItems();
  updateStats();
  renderAll();
});

// Helpers

function loadItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) items = JSON.parse(raw);
    else items = [];
  } catch (err) {
    items = [];
  }
}

function saveItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function createItemId() {
  const base = "LF-";
  const random = Math.floor(Math.random() * 9000 + 1000); // 4 digits
  return base + random;
}

function updateStats() {
  const total = items.length;
  const pending = items.filter(i => i.status === "pending").length;
  const claimed = items.filter(i => i.status === "claimed").length;
  document.getElementById("statTotal").textContent = total;
  document.getElementById("statPending").textContent = pending;
  document.getElementById("statClaimed").textContent = claimed;
}

// Handle found item submission

const foundForm = document.getElementById("foundForm");
const foundPhotoInput = document.getElementById("foundPhoto");
let pendingPhotoDataUrl = null;

if (foundPhotoInput) {
  foundPhotoInput.addEventListener("change", () => {
    const file = foundPhotoInput.files[0];
    if (!file) {
      pendingPhotoDataUrl = null;
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      pendingPhotoDataUrl = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

if (foundForm) {
  foundForm.addEventListener("submit", e => {
    e.preventDefault();
    const message = document.getElementById("foundMessage");

    const title = document.getElementById("foundTitle").value.trim();
    const category = document.getElementById("foundCategory").value;
    const location = document.getElementById("foundLocation").value.trim();
    const date = document.getElementById("foundDate").value;
    const description = document.getElementById("foundDescription").value.trim();
    const finderName = document.getElementById("foundFinderName").value.trim();
    const finderContact = document.getElementById("foundContact").value.trim();

    if (!title || !category || !location || !date || !description || !finderName || !finderContact) {
      message.textContent = "Please fill out all required fields.";
      message.style.color = "#ffb3c4";
      return;
    }

    const item = {
      id: createItemId(),
      title,
      category,
      location,
      date,
      description,
      finderName,
      finderContact,
      photoDataUrl: pendingPhotoDataUrl,
      status: "pending",
      createdAt: Date.now()
    };

    items.push(item);
    saveItems();
    updateStats();
    renderAll();

    foundForm.reset();
    pendingPhotoDataUrl = null;
    message.textContent = "Thank you! Your item has been submitted for review.";
    message.style.color = "#a6f7cf";

    setTimeout(() => {
      message.textContent = "";
    }, 3500);
  });
}

// Browse items rendering and filters

const itemsGrid = document.getElementById("itemsGrid");
const browseEmptyMessage = document.getElementById("browseEmptyMessage");

const searchQueryInput = document.getElementById("searchQuery");
const filterCategorySelect = document.getElementById("filterCategory");
const filterStatusSelect = document.getElementById("filterStatus");
const filterSortSelect = document.getElementById("filterSort");

[searchQueryInput, filterCategorySelect, filterStatusSelect, filterSortSelect].forEach(el => {
  if (!el) return;
  el.addEventListener("input", renderBrowseList);
  el.addEventListener("change", renderBrowseList);
});

function filterItemsForBrowse() {
  const query = searchQueryInput.value.trim().toLowerCase();
  const category = filterCategorySelect.value;
  const statusFilter = filterStatusSelect.value;
  const sortMode = filterSortSelect.value;

  let visible = items.slice();

  if (statusFilter === "approved") {
    visible = visible.filter(i => i.status !== "claimed" && i.status !== "pending");
  }

  if (category) {
    visible = visible.filter(i => i.category === category);
  }

  if (query) {
    visible = visible.filter(i => {
      return (
        i.title.toLowerCase().includes(query) ||
        i.description.toLowerCase().includes(query) ||
        i.location.toLowerCase().includes(query) ||
        i.id.toLowerCase().includes(query)
      );
    });
  }

  visible.sort((a, b) => {
    if (sortMode === "oldest") return a.createdAt - b.createdAt;
    return b.createdAt - a.createdAt;
  });

  return visible;
}

function renderBrowseList() {
  if (!itemsGrid) return;
  itemsGrid.innerHTML = "";

  const visible = filterItemsForBrowse();

  if (!visible.length) {
    browseEmptyMessage.style.display = "block";
    return;
  }
  browseEmptyMessage.style.display = "none";

  visible.forEach(item => {
    const card = document.createElement("article");
    card.className = "item-card";

    const photoWrapper = document.createElement("div");
    photoWrapper.className = "item-photo-wrapper";

    const img = document.createElement("img");
    img.className = "item-photo";

    if (item.photoDataUrl) {
      img.src = item.photoDataUrl;
    } else {
      img.src =
        "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240">
             <defs>
               <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
                 <stop offset="0" stop-color="#4f9cff"/>
                 <stop offset="1" stop-color="#151720"/>
               </linearGradient>
             </defs>
             <rect width="400" height="240" fill="url(#g)"/>
             <text x="50%" y="50%" text-anchor="middle" fill="#f5f6ff" font-size="18" font-family="system-ui" opacity="0.85">
               Item photo not provided
             </text>
           </svg>`
        );
    }

    const chip = document.createElement("div");
    chip.className = "item-chip";
    chip.textContent = item.category || "Item";

    const status = document.createElement("div");
    status.className = "item-status " + item.status;
    status.textContent = item.status;

    photoWrapper.appendChild(img);
    photoWrapper.appendChild(chip);
    photoWrapper.appendChild(status);

    const body = document.createElement("div");
    body.className = "item-body";

    const titleRow = document.createElement("div");
    titleRow.className = "item-title-row";

    const title = document.createElement("h3");
    title.className = "item-title";
    title.textContent = item.title;

    const id = document.createElement("span");
    id.className = "item-id";
    id.textContent = item.id;

    titleRow.appendChild(title);
    titleRow.appendChild(id);

    const meta = document.createElement("div");
    meta.className = "item-meta";
    meta.textContent = `${item.location} • Found on ${item.date}`;

    const desc = document.createElement("p");
    desc.className = "item-description";
    desc.textContent = item.description;

    const footer = document.createElement("div");
    footer.className = "item-footer";
    footer.innerHTML = `<span>Reported by ${item.finderName}</span><span>Use ID to claim</span>`;

    body.appendChild(titleRow);
    body.appendChild(meta);
    body.appendChild(desc);
    body.appendChild(footer);

    card.appendChild(photoWrapper);
    card.appendChild(body);

    itemsGrid.appendChild(card);
  });
}

// Claim form (basic UX only)

const claimForm = document.getElementById("claimForm");
if (claimForm) {
  claimForm.addEventListener("submit", e => {
    e.preventDefault();
    const message = document.getElementById("claimMessage");
    const itemId = document.getElementById("claimItemId").value.trim();
    const name = document.getElementById("claimName").value.trim();
    const email = document.getElementById("claimEmail").value.trim();
    const relation = document.getElementById("claimRelation").value;
    const details = document.getElementById("claimDetails").value.trim();
    const preferred = document.getElementById("claimPreferred").value.trim();

    if (!itemId || !name || !email || !relation || !details) {
      message.textContent = "Please fill in all required fields.";
      message.style.color = "#ffb3c4";
      return;
    }


    message.textContent =
      "Your claim has been submitted. Staff will review and contact you using the details provided.";
    message.style.color = "#a6f7cf";

    claimForm.reset();

    setTimeout(() => {
      message.textContent = "";
    }, 4000);
  });
}

// Admin panel

const adminPassInput = document.getElementById("adminPass");
const adminUnlockBtn = document.getElementById("adminUnlockBtn");
const adminAuthMessage = document.getElementById("adminAuthMessage");
const adminPanel = document.getElementById("adminPanel");

const adminPending = document.getElementById("adminPending");
const adminApproved = document.getElementById("adminApproved");
const adminClaimed = document.getElementById("adminClaimed");

if (adminUnlockBtn) {
  adminUnlockBtn.addEventListener("click", () => {
    const val = adminPassInput.value;
    if (val === ADMIN_KEY) {
      adminPanel.classList.remove("locked");
      adminAuthMessage.textContent = "Admin controls unlocked.";
      adminAuthMessage.style.color = "#a6f7cf";
    } else {
      adminAuthMessage.textContent = "Incorrect key. Please check with site administrator.";
      adminAuthMessage.style.color = "#ffb3c4";
    }
  });
}

// Admin tabs

document.querySelectorAll(".admin-tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".admin-tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const tab = btn.getAttribute("data-tab");

    document.querySelectorAll(".admin-list").forEach(list => list.classList.remove("active"));
    if (tab === "pending") adminPending.classList.add("active");
    if (tab === "approved") adminApproved.classList.add("active");
    if (tab === "claimed") adminClaimed.classList.add("active");
  });
});

function renderAdminLists() {
  if (!adminPending || !adminApproved || !adminClaimed) return;

  adminPending.innerHTML = "";
  adminApproved.innerHTML = "";
  adminClaimed.innerHTML = "";

  const pendingItems = items.filter(i => i.status === "pending");
  const approvedItems = items.filter(i => i.status === "approved");
  const claimedItems = items.filter(i => i.status === "claimed");

  const buildRow = item => {
    const row = document.createElement("div");
    row.className = "admin-item-row";

    const main = document.createElement("div");
    main.className = "admin-item-main";
    main.innerHTML = `<strong>${item.title}</strong><span>${item.id}</span>`;

    const meta = document.createElement("div");
    meta.className = "admin-item-meta";
    meta.innerHTML = `<span>${item.location}</span><span>Found ${item.date}</span><span>By ${item.finderName}</span>`;

    const actions = document.createElement("div");
    actions.className = "admin-item-actions";

    if (item.status === "pending") {
      const approveBtn = document.createElement("button");
      approveBtn.className = "btn-mini";
      approveBtn.textContent = "Approve";
      approveBtn.addEventListener("click", () => {
        item.status = "approved";
        saveItems();
        updateStats();
        renderAll();
      });
      actions.appendChild(approveBtn);
    }

    if (item.status === "approved") {
      const markClaimedBtn = document.createElement("button");
      markClaimedBtn.className = "btn-mini";
      markClaimedBtn.textContent = "Mark claimed";
      markClaimedBtn.addEventListener("click", () => {
        item.status = "claimed";
        saveItems();
        updateStats();
        renderAll();
      });
      actions.appendChild(markClaimedBtn);
    }

    // Common actions
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn-mini";
    deleteBtn.textContent = "Remove";
    deleteBtn.addEventListener("click", () => {
      if (!confirm("Remove this item from the system?")) return;
      items = items.filter(i => i.id !== item.id);
      saveItems();
      updateStats();
      renderAll();
    });

    actions.appendChild(deleteBtn);

    row.appendChild(main);
    row.appendChild(meta);
    row.appendChild(actions);
    return row;
  };

  pendingItems.forEach(i => adminPending.appendChild(buildRow(i)));
  approvedItems.forEach(i => adminApproved.appendChild(buildRow(i)));
  claimedItems.forEach(i => adminClaimed.appendChild(buildRow(i)));
}

// Global render

function renderAll() {
  renderBrowseList();
  renderAdminLists();
}
