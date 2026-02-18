/**
 * Open Native Camera via File Input
 * 
 * CRITICAL: This function MUST be called synchronously from a direct user gesture.
 * Any async boundary will break iOS WebKit's trusted gesture chain.
 * 
 * This invokes the OS native camera on iOS/Android,
 * bypassing browser limitations and providing native camera UX.
 */

export function openNativeCamera(
  onFile: (file: File) => void,
  onCancel?: () => void
): void {
  console.log('[Camera] Invoking native camera');

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.capture = 'environment';

  input.style.position = 'fixed';
  input.style.left = '-9999px';
  input.style.top = '-9999px';
  input.style.opacity = '0';
  input.style.pointerEvents = 'none';

  document.body.appendChild(input);

  let handled = false;

  input.onchange = () => {
    handled = true;
    console.log('[Camera] File input changed');

    const file = input.files?.[0];

    // Clean up input element
    try {
      document.body.removeChild(input);
    } catch {
      // already removed
    }

    if (file) {
      console.log('[Camera] File received:', file.name, file.size, file.type);
      onFile(file);
    } else {
      console.log('[Camera] No file selected');
      onCancel?.();
    }
  };

  input.oncancel = () => {
    handled = true;
    console.log('[Camera] User cancelled camera');

    try {
      document.body.removeChild(input);
    } catch {
      // already removed
    }

    onCancel?.();
  };

  // Fallback: detect timeout (user cancelled on iOS sometimes triggers this)
  setTimeout(() => {
    if (!handled) {
      console.log('[Camera] Timeout - user likely cancelled');

      try {
        document.body.removeChild(input);
      } catch {
        // already removed
      }

      onCancel?.();
    }
  }, 1000);

  // CRITICAL: Synchronous invocation - NO async boundaries allowed
  console.log('[Camera] Clicking input element');
  input.click();
}
