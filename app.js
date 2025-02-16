// Global array for our litter boxes.
window.boxes = [];

// When the DOM is loaded, initialize the boxes and render them.
document.addEventListener("DOMContentLoaded", () => {
  window.boxes = loadBoxes();
  renderBoxes(window.boxes);
});

// Load boxes from localStorage or create default boxes if none exist.
function loadBoxes() {
  const data = localStorage.getItem("litterBoxes");
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error("Error parsing stored data:", e);
    }
  }
  // Default box names.
  const defaultNames = [
    "My Bedroom Litter Box",
    "Living Room Litter Box",
    "Under Garbage Can Litter Box",
    "Undertable Litter Box",
    "Laundry Room Litter Box",
    "Parents' Bedroom Litter Box",
  ];
  const boxes = defaultNames.map((name, index) => ({
    id: index,
    name: name,
    events: []
  }));
  localStorage.setItem("litterBoxes", JSON.stringify(boxes));
  return boxes;
}

// Save the entire boxes array to localStorage.
function saveBoxes(boxes) {
  localStorage.setItem("litterBoxes", JSON.stringify(boxes));
}

// Render all boxes into the #boxes-container element.
function renderBoxes(boxes) {
  const container = document.getElementById("boxes-container");
  container.innerHTML = "";
  boxes.forEach((box) => {
    container.appendChild(createBoxElement(box));
  });
}

// Create a DOM element for a single box.
function createBoxElement(box) {
  const boxDiv = document.createElement("div");
  boxDiv.className = "box";
  boxDiv.dataset.boxId = box.id;

  // Header with editable title.
  const header = document.createElement("div");
  header.className = "box-header";
  const title = createTitleElement(box);
  header.appendChild(title);
  boxDiv.appendChild(header);

  // Summary of recent events and full log toggle.
  const summaryDiv = document.createElement("div");
  summaryDiv.className = "box-summary";
  
  // Recent events summary.
  const lastEvents = document.createElement("div");
  lastEvents.className = "last-events";
  updateEventSummary(box, lastEvents);
  summaryDiv.appendChild(lastEvents);
  
  // Toggle full log link.
  const toggleLink = document.createElement("button");
  toggleLink.className = "toggle-log";
  toggleLink.textContent = "Show Full Log";
  summaryDiv.appendChild(toggleLink);
  
  // Full log container (initially hidden).
  const fullLogDiv = document.createElement("div");
  fullLogDiv.className = "full-log hidden";
  updateFullLog(box, fullLogDiv);
  summaryDiv.appendChild(fullLogDiv);
  
  // Toggle functionality.
  toggleLink.addEventListener("click", () => {
    if (fullLogDiv.classList.contains("hidden")) {
      fullLogDiv.classList.remove("hidden");
      toggleLink.textContent = "Hide Full Log";
    } else {
      fullLogDiv.classList.add("hidden");
      toggleLink.textContent = "Show Full Log";
    }
  });
  
  boxDiv.appendChild(summaryDiv);

  // Controls for logging events.
  const controlsDiv = document.createElement("div");
  controlsDiv.className = "box-controls";
  
  const scoopedBtn = document.createElement("button");
  scoopedBtn.className = "btn scooped";
  scoopedBtn.textContent = "Scooped";
  scoopedBtn.addEventListener("click", () => {
    addEventToBox(box, "Scooped");
  });
  controlsDiv.appendChild(scoopedBtn);

  const cleanedBtn = document.createElement("button");
  cleanedBtn.className = "btn cleaned";
  cleanedBtn.textContent = "Cleaned";
  cleanedBtn.addEventListener("click", () => {
    // Clicking Cleaned logs both a cleaned event and a scooped event (same timestamp).
    addEventToBox(box, "Cleaned", true);
  });
  controlsDiv.appendChild(cleanedBtn);

  boxDiv.appendChild(controlsDiv);

  // Notification schedule display.
  const notificationsDiv = document.createElement("div");
  notificationsDiv.className = "notifications";
  updateNotificationsDiv(box, notificationsDiv);
  boxDiv.appendChild(notificationsDiv);

  return boxDiv;
}

// Create the title element that is editable on click.
function createTitleElement(box) {
  const title = document.createElement("h2");
  title.className = "box-title";
  title.textContent = box.name;
  title.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "text";
    input.value = box.name;
    input.addEventListener("blur", () => {
      box.name = input.value || box.name;
      saveAndUpdateBox(box);
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        input.blur();
      }
    });
    title.replaceWith(input);
    input.focus();
  });
  return title;
}

// Save changes (such as renaming) and update the title element.
function saveAndUpdateBox(box) {
  const boxDiv = document.querySelector(`.box[data-box-id="${box.id}"]`);
  if (!boxDiv) return;
  const existingInput = boxDiv.querySelector("input");
  if (existingInput) {
    const newTitle = createTitleElement(box);
    boxDiv.querySelector(".box-header").replaceChild(newTitle, existingInput);
  }
  updateLocalStorageForBox(box);
}

// Add an event to a box. If "Cleaned" is clicked with addExtraScooped=true,
// then log both a "Cleaned" event and a "Scooped" event (with the same timestamp).
function addEventToBox(box, eventType, addExtraScooped = false) {
  const timestamp = new Date().toISOString();
  if (eventType === "Cleaned" && addExtraScooped) {
    box.events.push({ type: "Cleaned", timestamp });
    box.events.push({ type: "Scooped", timestamp });
  } else {
    box.events.push({ type: eventType, timestamp });
  }
  updateBoxUI(box);
  updateLocalStorageForBox(box);
}

// Update the events and notifications parts of a box’s UI.
function updateBoxUI(box) {
  const boxDiv = document.querySelector(`.box[data-box-id="${box.id}"]`);
  if (!boxDiv) return;
  
  // Update event summary and full log.
  const lastEvents = boxDiv.querySelector(".last-events");
  updateEventSummary(box, lastEvents);
  const fullLogDiv = boxDiv.querySelector(".full-log");
  updateFullLog(box, fullLogDiv);
  
  // Update notifications.
  const notificationsDiv = boxDiv.querySelector(".notifications");
  updateNotificationsDiv(box, notificationsDiv);
}

// Update the summary area to show the last scooped and cleaned events.
function updateEventSummary(box, summaryDiv) {
  // Find the most recent scooped and cleaned events.
  const scoopedEvents = box.events.filter(e => e.type === "Scooped");
  const cleanedEvents = box.events.filter(e => e.type === "Cleaned");

  const lastScooped = scoopedEvents.length > 0 ? 
    new Date(scoopedEvents[scoopedEvents.length - 1].timestamp).toLocaleString() : "N/A";
  const lastCleaned = cleanedEvents.length > 0 ? 
    new Date(cleanedEvents[cleanedEvents.length - 1].timestamp).toLocaleString() : "N/A";
  
  summaryDiv.innerHTML = `
    <div><strong>Last Scooped:</strong> ${lastScooped}</div>
    <div><strong>Last Cleaned:</strong> ${lastCleaned}</div>
  `;
}

// Update the full event log display (all events in reverse chronological order).
function updateFullLog(box, fullLogDiv) {
  fullLogDiv.innerHTML = "";
  if (box.events.length === 0) {
    fullLogDiv.textContent = "No events logged yet.";
    return;
  }
  // Create a list of events (most recent first).
  box.events.slice().reverse().forEach(event => {
    const eventDiv = document.createElement("div");
    eventDiv.textContent = `${event.type} at ${new Date(event.timestamp).toLocaleString()}`;
    fullLogDiv.appendChild(eventDiv);
  });
}

// Update the notification schedule display for a given box.
function updateNotificationsDiv(box, notificationsDiv) {
  // Determine the last scooped and cleaned events (if any).
  const scoopEvents = box.events.filter(e => e.type === "Scooped");
  const cleanedEvents = box.events.filter(e => e.type === "Cleaned");

  let nextScoopedTime = "N/A";
  let nextCleanedTime = "N/A";

  if (scoopEvents.length > 0) {
    const lastScooped = new Date(scoopEvents[scoopEvents.length - 1].timestamp);
    const nextScooped = new Date(lastScooped.getTime() + 48 * 60 * 60 * 1000);
    nextScoopedTime = nextScooped.toLocaleString();
  }
  if (cleanedEvents.length > 0) {
    const lastCleaned = new Date(cleanedEvents[cleanedEvents.length - 1].timestamp);
    const nextCleaned = new Date(lastCleaned.getTime() + 21 * 24 * 60 * 60 * 1000);
    nextCleanedTime = nextCleaned.toLocaleString();
  }

  notificationsDiv.innerHTML = `
    <div><strong>Next scoop notification:</strong> ${nextScoopedTime}</div>
    <div><strong>Next cleaned notification:</strong> ${nextCleanedTime}</div>
  `;
}

// Update localStorage for the modified box by saving the entire boxes array.
function updateLocalStorageForBox(box) {
  const index = window.boxes.findIndex(b => b.id === box.id);
  if (index !== -1) {
    window.boxes[index] = box;
    saveBoxes(window.boxes);
  }
}
