let permissionGranted = false;
let scheduledTimers = new Map();

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('Bu tarayıcı bildirimleri desteklemiyor');
    return false;
  }
  if (Notification.permission === 'granted') {
    permissionGranted = true;
    return true;
  }
  if (Notification.permission === 'denied') {
    return false;
  }
  const permission = await Notification.requestPermission();
  permissionGranted = permission === 'granted';
  return permissionGranted;
}

export function isNotificationSupported() {
  return 'Notification' in window;
}

export function getNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

function showNotification(title, body, tag) {
  if (!permissionGranted && Notification.permission !== 'granted') return;
  
  try {
    // Try service worker notification first (works in background)
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, {
          body,
          tag,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          vibrate: [200, 100, 200],
          requireInteraction: true,
        });
      });
    } else {
      // Fallback to regular notification
      new Notification(title, {
        body,
        tag,
        icon: '/icon-192.png',
      });
    }
  } catch (err) {
    console.error('Bildirim gönderilemedi:', err);
  }
}

export function scheduleEventReminders(events, reminderMinutes = 15) {
  // Clear all existing timers
  scheduledTimers.forEach(timer => clearTimeout(timer));
  scheduledTimers.clear();

  const now = Date.now();

  events.forEach(event => {
    if (!event.date || !event.time) return;

    const eventTime = new Date(`${event.date}T${event.time}`).getTime();
    if (isNaN(eventTime)) return;

    // Schedule reminder before event
    const reminderTime = eventTime - reminderMinutes * 60 * 1000;
    const delay = reminderTime - now;

    if (delay > 0 && delay < 24 * 60 * 60 * 1000) { // Only schedule within 24h
      const timer = setTimeout(() => {
        showNotification(
          '📅 Hatırlatma',
          `"${event.title}" — ${reminderMinutes} dakika sonra başlıyor`,
          `event-${event.id}`
        );
      }, delay);
      scheduledTimers.set(`reminder-${event.id}`, timer);
    }

    // Schedule at event time
    const eventDelay = eventTime - now;
    if (eventDelay > 0 && eventDelay < 24 * 60 * 60 * 1000) {
      const timer = setTimeout(() => {
        showNotification(
          '🔔 Etkinlik Başladı',
          `"${event.title}" şimdi başlıyor!`,
          `event-start-${event.id}`
        );
      }, eventDelay);
      scheduledTimers.set(`start-${event.id}`, timer);
    }
  });

  return scheduledTimers.size;
}

export function scheduleTaskReminders(tasks) {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  tasks.forEach(task => {
    if (task.done || !task.dueDate) return;

    // Notify for tasks due today at 9 AM
    if (task.dueDate === todayStr) {
      const nineAM = new Date(todayStr + 'T09:00:00').getTime();
      const delay = nineAM - Date.now();

      if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
        const timer = setTimeout(() => {
          showNotification(
            '⏳ Görev Hatırlatması',
            `"${task.title}" bugün teslim edilmeli!`,
            `task-${task.id}`
          );
        }, delay);
        scheduledTimers.set(`task-${task.id}`, timer);
      }
    }

    // Notify for overdue tasks
    if (task.dueDate < todayStr) {
      // Show immediately if overdue
      const alreadyShown = scheduledTimers.has(`overdue-${task.id}`);
      if (!alreadyShown) {
        scheduledTimers.set(`overdue-${task.id}`, true);
        // Small delay to batch notifications
        setTimeout(() => {
          showNotification(
            '🚨 Gecikmiş Görev',
            `"${task.title}" — son tarih: ${task.dueDate}`,
            `overdue-${task.id}`
          );
        }, 3000);
      }
    }
  });
}

export function clearAllReminders() {
  scheduledTimers.forEach((timer, key) => {
    if (typeof timer === 'number') clearTimeout(timer);
  });
  scheduledTimers.clear();
}
