/**
 * PWA Service Worker Registration
 */

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registered:', registration.scope);

          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000); // Check every hour

          // Handle updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker available
                  console.log('[PWA] New version available! Please refresh.');
                  
                  // Optionally show update notification to user
                  if (confirm('New version available! Reload to update?')) {
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error);
        });

      // Handle controller change (new service worker activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[PWA] New service worker activated');
      });
    });
  } else {
    console.log('[PWA] Service Worker not supported in this browser');
  }
}

/**
 * Check if app is running as PWA (installed)
 */
export function isPWA(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Prompt user to install PWA
 */
export function setupInstallPrompt() {
  let deferredPrompt: any = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    
    console.log('[PWA] Install prompt available');
    
    // Optionally show custom install button
    showInstallButton(deferredPrompt);
  });

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed successfully');
    deferredPrompt = null;
    hideInstallButton();
  });
}

function showInstallButton(deferredPrompt: any) {
  // Check if install button already exists
  let installButton = document.getElementById('pwa-install-button');
  
  if (!installButton) {
    // Create install button
    installButton = document.createElement('button');
    installButton.id = 'pwa-install-button';
    installButton.textContent = '📱 Install App';
    installButton.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 24px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
      z-index: 1000;
      transition: transform 0.2s, box-shadow 0.2s;
    `;
    
    installButton.addEventListener('mouseenter', () => {
      installButton!.style.transform = 'translateY(-2px)';
      installButton!.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.5)';
    });
    
    installButton.addEventListener('mouseleave', () => {
      installButton!.style.transform = 'translateY(0)';
      installButton!.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
    });
    
    installButton.addEventListener('click', async () => {
      if (deferredPrompt) {
        // Show the install prompt
        deferredPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`[PWA] User response: ${outcome}`);
        
        // Clear the deferredPrompt
        deferredPrompt = null;
        hideInstallButton();
      }
    });
    
    document.body.appendChild(installButton);
  }
}

function hideInstallButton() {
  const installButton = document.getElementById('pwa-install-button');
  if (installButton) {
    installButton.remove();
  }
}

/**
 * Initialize PWA features
 */
export function initPWA() {
  registerServiceWorker();
  setupInstallPrompt();
  
  // Log PWA status
  if (isPWA()) {
    console.log('[PWA] Running as installed app');
  } else {
    console.log('[PWA] Running in browser');
  }
}
