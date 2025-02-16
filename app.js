// Define six default boxes with pre‑names
const defaultBoxes = [
  { id: 1, defaultName: "My Bedroom Litter Box" },
  { id: 2, defaultName: "Living Room Litter Box" },
  { id: 3, defaultName: "Under Garbage Can Litter Box" },
  { id: 4, defaultName: "Undertable Litter Box" },
  { id: 5, defaultName: "Laundry Room Litter Box" },
  { id: 6, defaultName: "Parents' Bedroom Litter Box" }
];

document.addEventListener("DOMContentLoaded", () => {
  // Render the dashboard with all litter boxes
  renderDashboard();

  // --- NFC Deep-Link Simulation ---
  // Check URL parameters (e.g., ?box=3&activity=scooped)
  const params = new URLSearchParams(window.location.search);
  const boxParam = params.get("box");
  const activityParam = params.get("activity");
  if (boxParam && activityParam) {
    logEvent(parseInt(boxParam, 10), activityParam);
    // Clean the URL so the event isn’t re‑triggered on refresh
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // --- Push Notification Demo ---
  if ("Notification" in window) {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        // For demonstration: show a notification after 5 seconds
        setTimeout(() => {
          new Notification("Reminder: Check your litter boxes!");
        }, 5000);
      }
    });
  }

  // --- Register Service Worker for Offline Support ---
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("service-worker.js")
      .then(reg => {
        console.log("Service Worker Registered", reg);
      })
      .catch(error => {
        console.error("Service Worker registration failed:", error);
      });
  }
});

// Renders the dashboard with each litter box
function renderDashboard() {
  const dashboard = document.getElementById("dashboard");
  dashboard.innerHTML = ""; // Clear previous content

  defaultBoxes.forEach(box => {
    // Use a stored name if available; otherwise, the default name
    const storedName = localStorage.getItem("box-name-" + box.id);
    const boxName = storedName ? storedName : box.defaultName;

    // Create container for the box
    const boxDiv = document.createElement("div");
    boxDiv.className = "litter-box";
    boxDiv.setAttribute("data-box-id", box.id);

    // Create the title element (click to rename)
    const title = document.createElement("h2");
    title.textContent = boxName;
    title.title = "Click to rename";
    title.addEventListener("click", () => {
      // Replace title with an input field for renaming
      const input = document.createElement("input");
      input.type = "text";
      input.value = boxName;
      input.addEventListener("blur", () => {
        const newName = input.value.trim() || box.defaultName;
        localStorage.setItem("box-name-" + box.id, newName);
        renderDashboard(); // Re‑render to update the name
      });
      boxDiv.replaceChild(input, title);
      input.focus();
    });
    boxDiv.appendChild(title);

    // Create buttons to log "scooped" and "cleaned" events
    const scoopBtn = document.createElement("button");
    scoopBtn.textContent = "Scooped";
    scoopBtn.addEventListener("click", () => {
      logEvent(box.id, "scooped");
    });
    boxDiv.appendChild(scoopBtn);

    const cleanBtn = document.createElement("button");
    cleanBtn.textContent = "Cleaned";
    cleanBtn.addEventListener("click", () => {
      logEvent(box.id, "cleaned");
    });
    boxDiv.appendChild(cleanBtn);

    // Container to display logged events
    const eventsDiv = document.createElement("div");
    eventsDiv.className = "events";
    eventsDiv.id = "events-" + box.id;
    boxDiv.appendChild(eventsDiv);

    // Container to display next notification times
    const notifDiv = document.createElement("div");
    notifDiv.className = "notification-info";
    notifDiv.id = "notification-" + box.id;
    boxDiv.appendChild(notifDiv);

    dashboard.appendChild(boxDiv);
    // Update display for this box
    updateBox(box.id);
  });
}

// Log an event for a specific box
function logEvent(boxId, activity) {
  const now = new Date();
  const eventObj = {
    activity: activity,
    timestamp: now.toISOString()
  };

  // If the event is "cleaned", also create two auto "scooped" events for the next 48 hours
  let eventsToLog = [eventObj];
  if (activity === "cleaned") {
    for (let i = 1; i <= 2; i++) {
      const autoDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      eventsToLog.push({
        activity: "scooped (auto)",
        timestamp: autoDate.toISOString()
      });
    }
  }

  // Retrieve existing events from localStorage
  let stored = localStorage.getItem("box-events-" + boxId);
  let events = stored ? JSON.parse(stored) : [];
  events = events.concat(eventsToLog);
  localStorage.setItem("box-events-" + boxId, JSON.stringify(events));

  updateBox(boxId);
}

// Update the event list and notification info for a given box
function updateBox(boxId) {
  // Update events display
  const eventsDiv = document.getElementById("events-" + boxId);
  let stored = localStorage.getItem("box-events-" + boxId);
  let events = stored ? JSON.parse(stored) : [];
  events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  let html = "<ul>";
  events.forEach(ev => {
    html += `<li>${ev.activity} - ${new Date(ev.timestamp).toLocaleString()}</li>`;
  });
  html += "</ul>";
  eventsDiv.innerHTML = html;

  // Update notification info
  const notifDiv = document.getElementById("notification-" + boxId);
  const nextScooped = getNextNotificationTime(boxId, "scooped");
  const nextCleaned = getNextNotificationTime(boxId, "cleaned");
  notifDiv.innerHTML = `
    <p>Next scoop notification: ${nextScooped ? nextScooped.toLocaleString() : "Not scheduled"}</p>
    <p>Next cleaned notification: ${nextCleaned ? nextCleaned.toLocaleString() : "Not scheduled"}</p>
  `;
}

// Compute the next notification time for a given box and type
// "scooped": 48 hours after the last manual "scooped" event
// "cleaned": 21 days after the last "cleaned" event
function getNextNotificationTime(boxId, type) {
  let stored = localStorage.getItem("box-events-" + boxId);
  let events = stored ? JSON.parse(stored) : [];
  let lastEvent = null;

  if (type === "scooped") {
    events.filter(ev => ev.activity === "scooped").forEach(ev => {
      if (!lastEvent || new Date(ev.timestamp) > new Date(lastEvent.timestamp)) {
        lastEvent = ev;
      }
    });
    if (lastEvent) {
      return new Date(new Date(lastEvent.timestamp).getTime() + 48 * 60 * 60 * 1000);
    }
  } else if (type === "cleaned") {
    events.filter(ev => ev.activity === "cleaned").forEach(ev => {
      if (!lastEvent || new Date(ev.timestamp) > new Date(lastEvent.timestamp)) {
        lastEvent = ev;
      }
    });
    if (lastEvent) {
      return new Date(new Date(lastEvent.timestamp).getTime() + 21 * 24 * 60 * 60 * 1000);
    }
  }
  return null;
}
