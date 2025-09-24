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
        
        // This is the key change
        createStarAnimation(event.changedTouches[0].clientX, event.changedTouches[0].clientY);

        if (isShaken) {
          isShaken = false;
          linkButtons.forEach(btn => btn.classList.remove('shaking'));
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

    // Clear existing stars before adding new ones
    starsContainer.innerHTML = ''; 

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

  // --- Page Flip Logic ---
  const flipBtn = document.getElementById('flip-btn');
  const flipContainer = document.getElementById('flip-container');

  flipBtn.addEventListener('click', () => {
    flipContainer.classList.toggle('flipped');
  });
});