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

    // Reset any previous styles that might affect natural dimension reading or display
    overlayImage.style.width = 'auto';
    overlayImage.style.height = 'auto';
    overlayImage.style.maxWidth = 'none';
    overlayImage.style.maxHeight = 'none';
    overlayImage.style.transform = 'scale(1)'; // Reset zoom

    let scale = 1; // Reset scale variable for the new image

    const handleImageLoad = () => {
        const naturalWidth = overlayImage.naturalWidth;
        const naturalHeight = overlayImage.naturalHeight;

        if (naturalWidth === 0 || naturalHeight === 0) {
            // Image failed to load or is not a valid image
            console.error("Image failed to load or is not valid:", overlayImage.src);
            closeOverlay(); // Close overlay if image is bad
            return;
        }

        const viewportWidth = window.innerWidth * 0.9;
        const viewportHeight = window.innerHeight * 0.9;
        const imageAspectRatio = naturalWidth / naturalHeight;

        let displayWidth = naturalWidth;
        let displayHeight = naturalHeight;

        // Scale down to fit viewport if necessary
        if (displayWidth > viewportWidth) {
            displayWidth = viewportWidth;
            displayHeight = displayWidth / imageAspectRatio;
        }
        if (displayHeight > viewportHeight) {
            displayHeight = viewportHeight;
            displayWidth = displayHeight * imageAspectRatio;
        }

        // Ensure it doesn't exceed natural dimensions (it shouldn't with above logic, but as a safeguard)
        displayWidth = Math.min(displayWidth, naturalWidth);
        displayHeight = Math.min(displayHeight, naturalHeight);

        overlayImage.style.width = displayWidth + 'px';
        overlayImage.style.height = displayHeight + 'px';

        // Store natural dimensions for zoom limiting, perhaps on data attributes
        overlayImage.dataset.naturalWidth = naturalWidth;
        overlayImage.dataset.naturalHeight = naturalHeight;

        overlay.style.display = 'flex'; // Ensure overlay is visible
        const pageWrapper = document.getElementById('page-wrapper');
        if (pageWrapper) {
          pageWrapper.classList.add('blur-background');
        }
    };

    overlayImage.onload = handleImageLoad;
    overlayImage.onerror = () => {
        console.error("Error loading image:", overlayImage.src);
        closeOverlay(); // Close overlay if image fails to load
    };

    overlayImage.src = imageSrc;

    if (overlayImage.complete && overlayImage.naturalWidth > 0) { // Check if already loaded (e.g. from cache) and valid
        handleImageLoad();
    }

    // Zoom functionality
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

        const naturalWidth = parseFloat(overlayImage.dataset.naturalWidth);
        const naturalHeight = parseFloat(overlayImage.dataset.naturalHeight);
        const displayedWidth = parseFloat(overlayImage.style.width);
        const displayedHeight = parseFloat(overlayImage.style.height);

        let maxScale = 1;
        if (displayedWidth > 0 && displayedHeight > 0 && naturalWidth > 0 && naturalHeight > 0) {
            const maxScaleW = naturalWidth / displayedWidth;
            const maxScaleH = naturalHeight / displayedHeight;
            maxScale = Math.min(maxScaleW, maxScaleH);
        }
        maxScale = Math.max(maxScale, 0.5); // Ensure maxScale is at least min zoom

        scale = Math.max(0.5, Math.min(scale, maxScale));
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

        const naturalWidth = parseFloat(overlayImage.dataset.naturalWidth);
        const naturalHeight = parseFloat(overlayImage.dataset.naturalHeight);
        const displayedWidth = parseFloat(overlayImage.style.width);
        const displayedHeight = parseFloat(overlayImage.style.height);

        let maxScale = 1;
        if (displayedWidth > 0 && displayedHeight > 0 && naturalWidth > 0 && naturalHeight > 0) {
            const maxScaleW = naturalWidth / displayedWidth;
            const maxScaleH = naturalHeight / displayedHeight;
            maxScale = Math.min(maxScaleW, maxScaleH);
        }
        maxScale = Math.max(maxScale, 0.5); // Ensure maxScale is at least min zoom

        scale = Math.max(0.5, Math.min(scale, maxScale));
        overlayImage.style.transform = `scale(${scale})`;
    });


  }

  function closeOverlay() {
    if (overlay) {
      overlay.style.display = 'none';
      const pageWrapper = document.getElementById('page-wrapper');
      if (pageWrapper) {
        pageWrapper.classList.remove('blur-background');
      }
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
