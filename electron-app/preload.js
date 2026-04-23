window.addEventListener('DOMContentLoaded', () => {
  // Bypass the maintenance page — employees don't need to see it
  sessionStorage.setItem('level_maintenance_bypass', 'true')
})
