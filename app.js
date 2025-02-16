document.addEventListener('DOMContentLoaded', function () {
  // --- NFC Deep-Link Simulation ---
  // Check if the URL has parameters like ?box=1&activity=scooped
  const params = new URLSearchParams(window.location.search);
  const box = params.get('box');
  const activity = params.get('activity');
  if (box && activity) {
    // Convert box parameter to a number and log the event
    logEvent(parseInt(box, 10), activity);
    // Clean URL so the event isn’t logged repeatedly on refresh
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // --- Update the UI for all boxes ---
  updateAllBoxes();

  // --- Push Notification Demo ---
  if ("Notification" in window) {
    Notification.requestPermission().then(function (permission) {
      if (permission === "granted") {
        // For demonstration: show a notification after 5 seconds
        setTimeout(function () {
          new Notification("Reminder: Check your litter boxes!");
        }, 5000);
      }
    });
  }

  // --- Register Service Worker for Offline Support ---
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('service-worker.js')
      .then(function (reg) {
        console.log('Service Worker Registered', reg);
      })
      .catch(function (error) {
        console.error('Service Worker registration failed:', error);
      });
  }
});

// Log an event for a specific box
function logEvent(boxId, activity) {
  const now = new Date();
  // Create the event object
  const event = {
    activity: activity,
    timestamp: now.toISOString(),
  };

  // If "cleaned" is logged, also create two auto "scooped" events for the next 48 hours
  let eventsToLog = [event];
  if (activity === 'cleaned') {
    for (let i = 1; i <= 2; i++) {
      const autoDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      eventsToLog.push({
        activity: 'scooped (auto)',
        timestamp: autoDate.toISOString(),
      });
    }
  }

  // Retrieve any existing events from localStorage
  let stored = localStorage.getItem('box-events-' + boxId);
  let events = stored ? JSON.parse(stored) : [];
  events = events.concat(eventsToLog);
  localStorage.setItem('box-events-' + boxId, JSON.stringify(events));

  // Update the UI for the specific box
  updateBox(boxId);
}

// Update the event list display for a given box
function updateBox(boxId) {
  const eventsDiv = document.getElementById('events-' + boxId);
  let stored = localStorage.getItem('box-events-' + boxId);
  let events = stored ? JSON.parse(stored) : [];
  // Sort events by timestamp (oldest first)
  events.sort(function (a, b) {
    return new Date(a.timestamp) - new Date(b.timestamp);
  });
  let html = '<ul>';
  events.forEach(function (ev) {
    html += `<li>${ev.activity} - ${new Date(ev.timestamp).toLocaleString()}</li>`;
  });
  html += '</ul>';
  eventsDiv.innerHTML = html;
}

// Update the UI for all boxes (here, boxes 1 and 2)
function updateAllBoxes() {
  updateBox(1);
  updateBox(2);
}
