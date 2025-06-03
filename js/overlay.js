document.addEventListener('DOMContentLoaded', function() {
  const images = document.querySelectorAll('#yacht_image'); // Select all images with id 'yacht_image'
  let overlay; // Declare overlay variable in a broader scope
  let currentResizeHandler = null; // Variable to hold the current resize event handler

  let overlayState = {
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      isPanning: false,
      lastMouseX: 0,
      lastMouseY: 0,
      naturalWidth: 0,
      naturalHeight: 0,
      displayedWidth: 0,
      displayedHeight: 0
  };

  function applyTransform(imageElement) {
      if (imageElement) {
          imageElement.style.transform = `translate(${overlayState.offsetX}px, ${overlayState.offsetY}px) scale(${overlayState.scale})`;
      }
  }

  function clampOffsets(imageElement) {
    if (!imageElement || !imageElement.parentElement) return;

    const కంటెంట్ = imageElement.parentElement; // .overlay-content
    const contentWidth = కంటెంట్.clientWidth;
    const contentHeight = కంటెంట్.clientHeight;

    // Use overlayState.displayedWidth/Height which are the initial pixel dimensions set by JS
    const imgScaledWidth = overlayState.displayedWidth * overlayState.scale;
    const imgScaledHeight = overlayState.displayedHeight * overlayState.scale;

    let minX, maxX, minY, maxY;

    if (imgScaledWidth > contentWidth) {
        minX = contentWidth - imgScaledWidth;
        maxX = 0;
    } else {
        minX = (contentWidth - imgScaledWidth) / 2;
        maxX = minX; // Centered, so minX = maxX
    }

    if (imgScaledHeight > contentHeight) {
        minY = contentHeight - imgScaledHeight;
        maxY = 0;
    } else {
        minY = (contentHeight - imgScaledHeight) / 2;
        maxY = minY; // Centered
    }

    overlayState.offsetX = Math.max(minX, Math.min(overlayState.offsetX, maxX));
    overlayState.offsetY = Math.max(minY, Math.min(overlayState.offsetY, maxY));
  }

  // --- Helper function for resizing image ---
  function resizeAndUpdateOverlayImage(imageElement) {
    const naturalWidth = imageElement.naturalWidth;
    const naturalHeight = imageElement.naturalHeight;

    // This check should ideally be done before calling, but as a safeguard:
    if (naturalWidth === 0 || naturalHeight === 0) {
        console.error("resizeAndUpdateOverlayImage: Image has zero dimensions.", imageElement.src);
        // Optionally, set to a small default or hide, but handleImageLoad should prevent this.
        imageElement.style.width = '0px';
        imageElement.style.height = '0px';
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

    imageElement.style.width = displayWidth + 'px';
    imageElement.style.height = displayHeight + 'px';

    // Update overlayState with the actual displayed dimensions
    overlayState.displayedWidth = displayWidth;
    overlayState.displayedHeight = displayHeight;

    // Reset scale and offsets when image is resized (e.g., on window resize or initial load)
    overlayState.scale = 1;
    overlayState.offsetX = 0;
    overlayState.offsetY = 0;

    applyTransform(imageElement); // Apply the reset scale/offset
    clampOffsets(imageElement);    // Center if smaller than container, or clamp initial view
    applyTransform(imageElement); // Apply potentially clamped offsets
  }
  // --- End Helper function ---

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
    // overlayImage.style.transform = 'scale(1)'; // Will be handled by applyTransform via resizeAndUpdateOverlayImage

    // let scale = 1; // Remove local scale, use overlayState.scale

    const handleImageLoad = () => {
        overlayState.naturalWidth = overlayImage.naturalWidth;
        overlayState.naturalHeight = overlayImage.naturalHeight;

        if (overlayState.naturalWidth === 0 || overlayState.naturalHeight === 0) {
            console.error("Image failed to load or is not valid:", overlayImage.src);
            closeOverlay();
            return;
        }

        // Reset state for the new image
        overlayState.scale = 1;
        overlayState.offsetX = 0;
        overlayState.offsetY = 0;
        overlayState.isPanning = false;
        // Also store on dataset for convenience if any old code parts still use it, but overlayState is primary
        overlayImage.dataset.naturalWidth = overlayState.naturalWidth;
        overlayImage.dataset.naturalHeight = overlayState.naturalHeight;

        // This will calculate display size, update overlayState.displayedWidth/Height,
        // reset scale/offsets in overlayState, and call applyTransform.
        resizeAndUpdateOverlayImage(overlayImage);

        overlay.style.display = 'flex'; // Ensure overlay is visible
        const pageWrapper = document.getElementById('page-wrapper');
        if (pageWrapper) {
          pageWrapper.classList.add('blur-background');
        }

        // Add resize event listener
        if (currentResizeHandler) { // Remove any existing handler first
            window.removeEventListener('resize', currentResizeHandler);
        }

        const onWindowResize = () => {
            const activeOverlay = document.getElementById('imageOverlay'); // Check by ID
            // Ensure overlay is still the one we care about and is visible
            if (activeOverlay && activeOverlay.style.display === 'flex' && overlayImage && overlayImage.closest('#imageOverlay')) {
                 // Check if overlayImage is still part of the active overlay
                resizeAndUpdateOverlayImage(overlayImage);
                // Note: Zoom scale is preserved. If zoom needs reset/adjustment, add logic here.
            }
        };
        currentResizeHandler = onWindowResize;
        window.addEventListener('resize', currentResizeHandler);
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

    // Zoom and Pan functionality using overlayState
    // Panning Handlers to be added to document and removed
    let panMoveHandler = null;
    let panEndHandler = null;

    overlayImage.addEventListener('mousedown', function(e) {
        if (e.button !== 0) return; // Only left click
        e.preventDefault();

        const imageElement = this;
        const scaledWidth = overlayState.displayedWidth * overlayState.scale;
        const scaledHeight = overlayState.displayedHeight * overlayState.scale;
        const contentWidth = imageElement.parentElement.clientWidth;
        const contentHeight = imageElement.parentElement.clientHeight;

        if (scaledWidth > contentWidth || scaledHeight > contentHeight) {
            overlayState.isPanning = true;
            overlayState.lastMouseX = e.clientX;
            overlayState.lastMouseY = e.clientY;
            imageElement.style.cursor = 'grabbing';

            panMoveHandler = (moveEvent) => {
                if (!overlayState.isPanning) return;
                const dx = moveEvent.clientX - overlayState.lastMouseX;
                const dy = moveEvent.clientY - overlayState.lastMouseY;
                overlayState.offsetX += dx;
                overlayState.offsetY += dy;
                overlayState.lastMouseX = moveEvent.clientX;
                overlayState.lastMouseY = moveEvent.clientY;

                clampOffsets(imageElement);
                applyTransform(imageElement);
            };

            panEndHandler = (upEvent) => {
                if (upEvent.button !== 0 && upEvent.type !== 'mouseleave') return; // Ensure it's the left button or mouseleave
                if (overlayState.isPanning) {
                    overlayState.isPanning = false;
                    imageElement.style.cursor = 'grab';
                    document.removeEventListener('mousemove', panMoveHandler);
                    document.removeEventListener('mouseup', panEndHandler);
                    document.removeEventListener('mouseleave', panEndHandler); // Also remove mouseleave
                }
            };

            document.addEventListener('mousemove', panMoveHandler);
            document.addEventListener('mouseup', panEndHandler);
            // Add mouseleave to handle cases where mouse button is released outside the window
            document.addEventListener('mouseleave', panEndHandler);
        }
    });

    // Click event on overlayImage is fine, it might be used to close overlay if not panning.
    // No, e.stopPropagation() might be needed if it was part of a pan.
    // The current simple click listener that stops propagation if it was a pan is okay.
    // But with document level listeners for mouseup, the click might not even register if pan occurred.
    // Let's ensure click is only for non-panning interactions.
    overlayImage.addEventListener('click', function(e) {
        // This click listener on the image itself is primarily to stop propagation
        // to the overlay background click listener if the image is clicked.
        // If a pan just occurred, isPanning would be false here.
        // The previous `if (overlayState.isPanning)` check was in a general document click listener.
        // Here, on the image, it's mostly for stopPropagation.
        e.stopPropagation();
    });


    // Add wheel event for zooming
    overlayImage.addEventListener('wheel', function(e) {
        e.preventDefault();
        const imageElement = this; // or e.target
        const imgRect = imageElement.getBoundingClientRect();

        const mouseX = e.clientX - imgRect.left;
        const mouseY = e.clientY - imgRect.top;

        const oldScale = overlayState.scale;

        const zoomFactorPerTick = 0.05; // Reduced from ~0.1 (10%) to 0.05 (5%)
        const direction = e.deltaY > 0 ? -1 : 1; // -1 for zoom out (scroll down), 1 for zoom in (scroll up)
        let newScale = oldScale * (1 + direction * zoomFactorPerTick);

        // Calculate maxEffectiveScale based on natural vs displayed dimensions
        let maxEffectiveScale = 1; // Default if displayed dimensions are zero
        if (overlayState.displayedWidth > 0 && overlayState.displayedHeight > 0) {
            maxEffectiveScale = Math.min(
                overlayState.naturalWidth / overlayState.displayedWidth,
                overlayState.naturalHeight / overlayState.displayedHeight
            );
        }
        // Ensure maxEffectiveScale is at least 1 (i.e., can always zoom to natural size if image was scaled down)
        // and not less than current scale if current scale is already beyond natural (shouldn't happen with proper clamping)
        const actualMaxScale = Math.max(1, maxEffectiveScale);

        newScale = Math.max(0.5, Math.min(newScale, actualMaxScale));

        overlayState.scale = newScale;

        // Focal zoom: Adjust offsetX and offsetY
        // The mouse position (mouseX, mouseY) is relative to the image's unscaled, untranslated frame.
        // We want the point (mouseX / oldScale, mouseY / oldScale) in the *scaled* image content
        // to remain at the same position relative to the viewport.
        // Or, simpler: the point (mouseX, mouseY) on the *visual* image should stay under cursor.
        overlayState.offsetX = mouseX - (mouseX - overlayState.offsetX) * (newScale / oldScale);
        overlayState.offsetY = mouseY - (mouseY - overlayState.offsetY) * (newScale / oldScale);

        applyTransform(imageElement);
        clampOffsets(imageElement); // Clamp offsets after focal zoom might have shifted them
        applyTransform(imageElement); // Apply potentially clamped offsets
    });


  }

  function closeOverlay() {
    if (currentResizeHandler) {
        window.removeEventListener('resize', currentResizeHandler);
        currentResizeHandler = null;
    }

    if (overlay) {
      overlay.style.display = 'none';
      const pageWrapper = document.getElementById('page-wrapper');
      if (pageWrapper) {
        pageWrapper.classList.remove('blur-background');
      }

      const overlayImageElement = overlay.querySelector('#overlayImage');

      // Reset state
      overlayState.scale = 1;
      overlayState.offsetX = 0;
      overlayState.offsetY = 0;
      overlayState.isPanning = false;
      overlayState.naturalWidth = 0;
      overlayState.naturalHeight = 0;
      overlayState.displayedWidth = 0;
      overlayState.displayedHeight = 0;

      if (overlayImageElement) {
          applyTransform(overlayImageElement); // Apply reset transform
          // Clone and replace to remove specific event listeners.
          // This is important because openOverlay adds listeners to THIS specific overlayImage instance.
          const newImage = overlayImageElement.cloneNode(true);
          overlayImageElement.parentNode.replaceChild(newImage, overlayImageElement);
      }
    }
  }
});
