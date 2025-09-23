// script.js - No changes needed, remains as provided previously
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
  const linksContainer = document.querySelector('.links');
  let isShaken = false;
  let tiltEnabled = false;
  let lastTapTime = 0;

  // Shake Detection
  let lastX, lastY, lastZ;
  const shakeThreshold = 15;
  const shakeDebounceTime = 500;
  let lastShakeTime = 0;

  if (window.DeviceMotionEvent) {
    window.addEventListener('devicemotion', event => {
      const currentTime = new Date().getTime();
      if (currentTime - lastShakeTime < shakeDebounceTime) {
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
          
          isShaken = !isShaken;
          document.body.classList.toggle('shaken', isShaken);
          lastShakeTime = currentTime;

          if (isShaken) {
            linksContainer.style.height = `${linkButtons.length * 55 + 30}px`;
            linkButtons.forEach((btn, index) => {
              const bottomPosition = linksContainer.offsetHeight - (index + 1) * 55;
              btn.style.top = `${bottomPosition}px`;
              btn.style.left = '0';
              btn.style.transform = 'translate(0px, 0px) rotate(0deg)';
            });
            tiltEnabled = false;
            document.body.classList.remove('tilt-active');
          } else {
            linkButtons.forEach((btn) => {
              btn.style.top = '';
              btn.style.left = '';
              btn.style.transform = '';
            });
            linksContainer.style.height = '';
          }
        }
      }

      lastX = acceleration.x;
      lastY = acceleration.y;
      lastZ = acceleration.z;
    });
  }

  // Double-tap and Star Animation
  const doubleTapDelay = 300;

  document.body.addEventListener('touchend', (event) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTapTime;

    if (tapLength < doubleTapDelay && tapLength > 0) {
      tiltEnabled = !tiltEnabled;
      document.body.classList.toggle('tilt-active', tiltEnabled);

      if (tiltEnabled) {
        createStarAnimation(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
        if (isShaken) {
          isShaken = false;
          document.body.classList.remove('shaken');
          linkButtons.forEach((btn) => {
            btn.style.top = '';
            btn.style.left = '';
            btn.style.transform = '';
          });
          linksContainer.style.height = '';
        }
      }
      lastTapTime = 0;
    } else {
      lastTapTime = currentTime;
    }
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
      star.innerHTML = '⭐';
      
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

  // Tilt Detection (now conditional on tiltEnabled)
  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', event => {
      if (tiltEnabled && !isShaken) {
        const { beta, gamma } = event;

        linkButtons.forEach(btn => {
          const tiltX = gamma * 0.5;
          const tiltY = beta * 0.5;
          const tiltRotate = gamma * 0.1;

          btn.style.transform = `translate(${tiltX}px, ${tiltY}px) rotate(${tiltRotate}deg)`;
        });
      } else if (!tiltEnabled && !isShaken) {
        linkButtons.forEach(btn => {
          btn.style.transform = '';
        });
      }
    });
  }
});
