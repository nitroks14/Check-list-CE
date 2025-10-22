function syncUsageStats() {
    const uuid = localStorage.getItem('uuid');
    const technician = localStorage.getItem('technicianName');
    const timestamp = new Date().toISOString();
    const stats = { uuid, technician, timestamp };

    // Placeholder for GitHub sync logic
    console.log('Syncing stats to GitHub:', stats);
}

setInterval(syncUsageStats, 24 * 60 * 60 * 1000); // Daily sync
