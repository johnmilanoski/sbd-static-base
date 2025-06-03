document.addEventListener('DOMContentLoaded', function() {
  const images = document.querySelectorAll('#yacht_image'); // Select all images with id 'yacht_image'
  let overlay; // Declare overlay variable in a broader scope

  images.forEach(image => {
    image.addEventListener('click', function() {
      openOverlay(this.src);
    });
  });

  function openOverlay(imageSrc) {
    // Create overlay elements if they don't exist
    if (!document.getElementById('imageOverlay')) {
      overlay = document.createElement('div');
      overlay.id = 'imageOverlay';
      overlay.className = 'overlay';
      overlay.innerHTML = `
        <span class="close-button">&times;</span>
        <div class="overlay-content">
          <img src="" alt="Overlay Image" id="overlayImage">
        </div>
      `;
      document.body.appendChild(overlay);

      // Add event listener for closing when clicking on the background
      overlay.addEventListener('click', function(event) {
        if (event.target === overlay) {
          closeOverlay();
        }
      });

      // Add event listener for the close button
      overlay.querySelector('.close-button').addEventListener('click', closeOverlay);
    } else {
      overlay = document.getElementById('imageOverlay');
    }

    const overlayImage = overlay.querySelector('#overlayImage');
    overlayImage.src = imageSrc;
    overlay.style.display = 'flex'; // Use flex for centering
    document.body.classList.add('blur-background'); // Blur the background

    // Zoom functionality
    let scale = 1;
    let isZooming = false;
    let startX, startY, initialScale;

    overlayImage.addEventListener('mousedown', function(e) {
        if (e.button !== 0) return; // Only left click
        isZooming = true;
        startX = e.clientX;
        startY = e.clientY;
        initialScale = scale;
        overlayImage.classList.add('zooming');
        e.preventDefault(); // Prevent image dragging
    });

    document.addEventListener('mousemove', function(e) {
        if (!isZooming) return;

        // Calculate distance moved
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        // Adjust scale based on mouse movement (simple zoom for now)
        // A more sophisticated zoom would use pinch gestures on touch or scroll wheel
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (deltaY < 0) { // Moving mouse up to zoom in
            scale = initialScale + (distance / 100);
        } else if (deltaY > 0) { // Moving mouse down to zoom out
            scale = initialScale - (distance / 100);
        }

        scale = Math.max(0.5, Math.min(scale, 3)); // Clamp scale between 0.5x and 3x
        overlayImage.style.transform = `scale(${scale})`;
    });

    document.addEventListener('mouseup', function(e) {
        if (isZooming && e.button === 0) {
            isZooming = false;
            overlayImage.classList.remove('zooming');
        }
    });

    // Prevent zoom reset when clicking on image if not intending to zoom out by releasing mouse outside
    overlayImage.addEventListener('click', function(e){
        e.stopPropagation(); // Prevent overlay click event from firing
    });


    // Add wheel event for zooming
    overlayImage.addEventListener('wheel', function(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1; // Zoom out for scroll down, in for scroll up
        scale += delta;
        scale = Math.max(0.5, Math.min(scale, 3)); // Clamp scale
        overlayImage.style.transform = `scale(${scale})`;
    });


  }

  function closeOverlay() {
    if (overlay) {
      overlay.style.display = 'none';
      document.body.classList.remove('blur-background'); // Remove blur from background
      // Reset zoom
      const overlayImage = overlay.querySelector('#overlayImage');
      if (overlayImage) {
          overlayImage.style.transform = 'scale(1)';
          // Remove existing event listeners to prevent accumulation if overlay is reused
          // Note: A more robust approach for removing specific listeners might be needed
          // if listeners were anonymous or more complex.
          const newImage = overlayImage.cloneNode(true);
          overlayImage.parentNode.replaceChild(newImage, overlayImage);
      }
    }
  }
});
