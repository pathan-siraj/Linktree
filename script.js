document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    document.body.classList.remove('loading');
  }, 100);

  const shareIcons = document.querySelectorAll('.share-icon');
  shareIcons.forEach(icon => {
    icon.addEventListener('click', async (event) => {
      event.preventDefault();
      const title = icon.dataset.title;
      const url = icon.dataset.url;
      const text = icon.dataset.text;
      
      if (navigator.share) {
        try {
          await navigator.share({ title, url, text });
          console.log('Link shared successfully!');
        } catch (error) {
          console.error('Error sharing link:', error);
        }
      } else {
        alert(`Sharing for "${title}" is not supported on this browser. You can copy the link instead: ${url}`);
      }
    });
  });

  // --- Shake and Tilt Effects ---
  const linkButtons = document.querySelectorAll('.link-btn');
  let isShaken = false;
  let tiltEnabled = false;
  let taps = [];

  // Shake Detection
  let lastX, lastY, lastZ;
  const shakeThreshold = 15;
  const shakeDebounceTime = 500;
  let lastShakeTime = 0;

  if (window.DeviceMotionEvent) {
    window.addEventListener('devicemotion', event => {
      const currentTime = new Date().getTime();
      if (currentTime - lastShakeTime < shakeDebounceTime || tiltEnabled) {
        return;
      }

      const acceleration = event.accelerationIncludingGravity;

      if (lastX && lastY && lastZ) {
        let deltaX = Math.abs(acceleration.x - lastX);
        let deltaY = Math.abs(acceleration.y - lastY);
        let deltaZ = Math.abs(acceleration.z - lastZ);

        if ((deltaX > shakeThreshold && deltaY > shakeThreshold) ||
            (deltaX > shakeThreshold && deltaZ > shakeThreshold) ||
            (deltaY > shakeThreshold && deltaZ > shakeThreshold)) {
          
          if (!isShaken) {
            isShaken = true;
            linkButtons.forEach(btn => btn.classList.add('shaking'));
          }
          lastShakeTime = currentTime;
        }
      }

      lastX = acceleration.x;
      lastY = acceleration.y;
      lastZ = acceleration.z;
    });
  }

  // Tap Detection (Double-tap for Tilt, Triple-tap for Shake)
  const tapDelay = 300;
  let lastTapTime = 0;

  document.body.addEventListener('touchend', (event) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTapTime;

    if (tapLength < tapDelay && tapLength > 0) {
      taps.push(currentTime);
      if (taps.length === 2) {
        // Double Tap
        taps = [];
        tiltEnabled = !tiltEnabled;
        document.body.classList.toggle('tilt-active', tiltEnabled);
        
        if (tiltEnabled) {
          createStarAnimation(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
          if (isShaken) {
            isShaken = false;
            linkButtons.forEach(btn => btn.classList.remove('shaking'));
          }
        }
      } else if (taps.length === 3) {
        // Triple Tap
        taps = [];
        if (isShaken) {
          isShaken = false;
          linkButtons.forEach(btn => btn.classList.remove('shaking'));
        }
      }
    } else {
      taps = [currentTime];
    }
    lastTapTime = currentTime;
  });

  function createStarAnimation(x, y) {
    let starsContainer = document.querySelector('.stars-container');
    if (!starsContainer) {
      starsContainer = document.createElement('div');
      starsContainer.classList.add('stars-container');
      document.body.appendChild(starsContainer);
    }

    for (let i = 0; i < 10; i++) {
      const star = document.createElement('span');
      star.classList.add('star');
      
      const randX = x + (Math.random() - 0.5) * 100;
      const randY = y + (Math.random() - 0.5) * 100;

      star.style.left = `${randX}px`;
      star.style.top = `${randY}px`;
      star.style.animationDelay = `${i * 0.05}s`;
      starsContainer.appendChild(star);

      star.addEventListener('animationend', () => {
        star.remove();
        if (starsContainer.children.length === 0) {
          starsContainer.remove();
        }
      });
    }
  }

  // Tilt Detection
  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', event => {
      if (tiltEnabled) {
        const { beta, gamma } = event;

        linkButtons.forEach(btn => {
          const tiltX = gamma * 0.5;
          const tiltY = beta * 0.5;
          const tiltRotate = gamma * 0.1;

          btn.style.transform = `translate(${tiltX}px, ${tiltY}px) rotate(${tiltRotate}deg)`;
        });
      } else {
        linkButtons.forEach(btn => {
          btn.style.transform = '';
        });
      }
    });
  }

  // --- Crystal Image Rotation Logic ---
  const crystalImage = document.getElementById('crystal-image');
  let isCrystalDragging = false;
  let lastClientX = 0;
  let currentImageRotation = 0; // Stores the current Z rotation in degrees
  let animationFrameId;

  // Function to apply rotation and update transform
  function applyCrystalRotation() {
      // Get the current translateX value from the computed style
      const style = window.getComputedStyle(crystalImage);
      const transform = style.getPropertyValue('transform');
      let translateXMatch = transform.match(/translateX\(([^)]+)px\)/);
      let translateX = translateXMatch ? parseFloat(translateXMatch[1]) : -50; // Default to -50 if not found

      crystalImage.style.transform = `translateX(${translateX}%) rotateZ(${currentImageRotation}deg)`;
  }

  function startCrystalDrag(event) {
    event.preventDefault();
    isCrystalDragging = true;
    crystalImage.classList.add('grabbing');
    
    // Stop the CSS animation and capture current rotation
    const computedStyle = window.getComputedStyle(crystalImage);
    const transformValue = computedStyle.getPropertyValue('transform'); // e.g., matrix(0.9..., 0.1..., ...)
    const matrix = new DOMMatrixReadOnly(transformValue);
    
    // Extract rotation from matrix (only for Z-axis in 2D)
    // atan2(sin_angle, cos_angle) gives angle in radians
    const radians = Math.atan2(matrix.m12, matrix.m11);
    currentImageRotation = radians * (180 / Math.PI); // Convert to degrees

    crystalImage.style.animation = 'none'; // Stop CSS animation
    
    lastClientX = (event.touches ? event.touches[0].clientX : event.clientX);

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
  }

  function crystalDrag(event) {
    if (!isCrystalDragging) return;
    
    const clientX = (event.touches ? event.touches[0].clientX : event.clientX);
    const deltaX = clientX - lastClientX;
    
    currentImageRotation += deltaX * 0.5; // Adjust sensitivity
    applyCrystalRotation();

    lastClientX = clientX;
  }

  function endCrystalDrag() {
    isCrystalDragging = false;
    crystalImage.classList.remove('grabbing');
    
    // Re-apply the continuous rotation from the new current position
    // To seamlessly restart the animation, we need to set the starting point
    crystalImage.style.animation = 'none'; // Clear any temporary animation
    crystalImage.style.transform = `translateX(-50%) rotateZ(${currentImageRotation}deg)`;
    
    // For a seamless restart from the current position, a new animation is ideal.
    // However, simply re-applying the existing CSS animation will reset its starting point to 0deg.
    // A more advanced approach would involve calculating the remaining degrees and animation duration,
    // or using Web Animations API. For simplicity and to resume rotation, we'll re-apply it.
    // It will effectively jump to the next animation cycle from 0deg, or start from current if transform is sticky.
    // A simpler immediate restart is:
    setTimeout(() => {
        crystalImage.style.animation = 'rotateCrystalImage 15s linear infinite';
    }, 50); // Small delay to allow style update to register before animation restart
  }

  crystalImage.addEventListener('mousedown', startCrystalDrag);
  window.addEventListener('mousemove', crystalDrag);
  window.addEventListener('mouseup', endCrystalDrag);

  crystalImage.addEventListener('touchstart', startCrystalDrag);
  window.addEventListener('touchmove', crystalDrag);
  window.addEventListener('touchend', endCrystalDrag);
});
