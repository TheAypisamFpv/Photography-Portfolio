window.onload = function () {
    const elements = document.querySelectorAll('body > *:not(footer):not(script):not(header)');
    elements.forEach(element => {
        element.classList.add('animate');
        element.addEventListener('animationend', () => {
            element.classList.remove('animate');
        }, { once: true });
    });
};

document.addEventListener('DOMContentLoaded', function () {
    const currentYear = new Date().getFullYear();
    const footerCredits = document.querySelector('.footer_credits p');
    if (footerCredits) {
        footerCredits.textContent = `© ${currentYear} TheAypisamFpv`;
    }

    // Theme switcher
    const themeSwitcher = document.getElementById('theme-switcher');
    const moonIcon = document.querySelector('#moon-icon');
    const sunIcon = document.querySelector('#sun-icon');
    const body = document.body;

    if (themeSwitcher) {
        themeSwitcher.addEventListener('click', () => {
            if (body.classList.contains('dark-theme')) {
                body.classList.remove('dark-theme');
                body.classList.add('light-theme');
                moonIcon.classList.remove('shown');
                moonIcon.classList.add('hidden');
                sunIcon.classList.remove('hidden');
                sunIcon.classList.add('shown');
            } else {
                body.classList.remove('light-theme');
                body.classList.add('dark-theme');
                moonIcon.classList.remove('hidden');
                moonIcon.classList.add('shown');
                sunIcon.classList.remove('shown');
                sunIcon.classList.add('hidden');
            }
        });
    }

    // Header hide functionality
    const header = document.getElementById('header');
    let lastScrollTop = 0;
    if (header) {
        window.addEventListener('scroll', function () {
            let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            if (scrollTop > lastScrollTop && scrollTop > 50) {
                header.classList.add('header-hide');
            } else if (scrollTop < lastScrollTop) {
                header.classList.remove('header-hide');
            }
            lastScrollTop = scrollTop;
        });
    }
});

// Photography Portfolio Lightbox
let currentImages = [];
let currentIndex = 0;
let scale = 1;
let translateX = 0;
let translateY = 0;
let isDragging = false;
let startX, startY;
let maxScale = 1.5; // Default, will be updated per image

// Touch handling variables
let isPinching = false;
let initialDistance = 0;
let initialScale = 1;
let touchStartX = 0;
let touchStartY = 0;

// Swipe handling variables
let isSwiping = false;
let swipeStartX = 0;
let swipeDeltaX = 0;
let swipeContainer;
let swipeThreshold = 100; // Pixels to trigger navigation
let animationFrame;

// Wrapper references for performance
let prevWrapper, currentWrapper, nextWrapper;

// Flag to prevent loop in back button handling
let isClosingByBack = false;

const metadataCache = new Map();

function preloadImage(src) {
    const img = new Image();
    img.src = src;
}

function preloadMetadata(txtUrl) {
    if (!metadataCache.has(txtUrl)) {
        fetch(txtUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('File not found');
                }
                return response.text();
            })
            .then(text => {
                metadataCache.set(txtUrl, text.trim());
            })
            .catch(() => {
                metadataCache.set(txtUrl, 'EXIF not available');
            });
    }
}

function getDistance(touch1, touch2) {
    return Math.sqrt((touch1.clientX - touch2.clientX) ** 2 + (touch1.clientY - touch2.clientY) ** 2);
}

function handleTouchStart(e) {
    if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        swipeStartX = e.touches[0].clientX;
        isDragging = false;
        isSwiping = scale === 1;
    } else if (e.touches.length === 2) {
        isPinching = true;
        isSwiping = false;
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        initialDistance = getDistance(touch1, touch2);
        initialScale = scale;
        e.preventDefault();
    }
}

function handleTouchMove(e) {
    if (isPinching && e.touches.length === 2) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = getDistance(touch1, touch2);
        scale = initialScale * (distance / initialDistance);
        scale = Math.max(1, Math.min(maxScale, scale));
        if (scale === 1) {
            translateX = 0;
            translateY = 0;
        }
        updateImageTransform();
    } else if (e.touches.length === 1) {
        if (scale > 1) {
            if (!isDragging) {
                isDragging = true;
                startX = e.touches[0].clientX - translateX;
                startY = e.touches[0].clientY - translateY;
            }
            translateX = e.touches[0].clientX - startX;
            translateY = e.touches[0].clientY - startY;
            updateImageTransform();
        } else if (isSwiping) {
            e.preventDefault();
            swipeDeltaX = e.touches[0].clientX - swipeStartX;
            updateSwipePosition();
        }
    }
}

function handleTouchEnd(e) {
    if (isPinching) {
        isPinching = false;
    }
    if (isDragging) {
        isDragging = false;
        updateCursor();
    }
    if (isSwiping) {
        isSwiping = false;
        handleSwipeEnd();
    }
}

function updateImageTransform() {
    const img = document.querySelector('#image-modal .current-img');
    if (img) {
        img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        updateCursor();
    }
}

function updateCursor() {
    const img = document.querySelector('#image-modal .current-img');
    if (img) {
        img.style.cursor = scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default';
    }
}

function updateSwipePosition() {
    if (swipeContainer) {
        cancelAnimationFrame(animationFrame);
        animationFrame = requestAnimationFrame(() => {
            swipeContainer.style.transition = 'none';
            swipeContainer.style.transform = `translateX(${-window.innerWidth + swipeDeltaX}px)`;
        });
    }
}

function handleSwipeEnd() {
    if (swipeContainer) {
        swipeContainer.style.transition = 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
        const viewportWidth = window.innerWidth;
        if (Math.abs(swipeDeltaX) > swipeThreshold) {
            const direction = swipeDeltaX < 0 ? 1 : -1; // Swipe left (negative) = next (+1), right (positive) = prev (-1)
            swipeContainer.style.transform = `translateX(${-window.innerWidth - direction * viewportWidth}px)`;
            setTimeout(() => {
                navigate(direction);
            }, 200);
        } else {
            swipeContainer.style.transform = `translateX(${-viewportWidth}px)`;
        }
        swipeDeltaX = 0;
    }
}

function loadMetadata(txtUrl, metadataDiv, isCurrent = false) {
    metadataDiv.textContent = isCurrent ? 'Loading EXIF...' : '';
    if (metadataCache.has(txtUrl)) {
        metadataDiv.textContent = metadataCache.get(txtUrl);
        return;
    }
    fetch(txtUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('File not found');
            }
            return response.text();
        })
        .then(text => {
            const trimmedText = text.trim();
            metadataCache.set(txtUrl, trimmedText);
            metadataDiv.textContent = trimmedText;
        })
        .catch(() => {
            metadataCache.set(txtUrl, 'EXIF not available');
            metadataDiv.textContent = isCurrent ? 'EXIF not available' : '';
        });
}

function openModal(clickedImg, imagesArray, index, sectionName) {
    currentImages = imagesArray;
    currentIndex = index;
    scale = 1;
    translateX = 0;
    translateY = 0;
    isDragging = false;
    isPinching = false;
    isSwiping = false;
    swipeDeltaX = 0;
    document.body.style.overflow = 'hidden';

    // Push history state for back button handling
    history.pushState({ modalOpen: true }, '');

    preloadAdjacentContent();

    const modal = document.createElement('div');
    modal.id = 'image-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.padding = '0';
    modal.style.margin = '0';
    modal.style.backgroundColor = 'rgba(0,0,0,0.9)';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'space-between';
    modal.style.zIndex = '1000';
    modal.style.transform = 'none';

    const titleDiv = document.createElement('div');
    titleDiv.textContent = sectionName;
    titleDiv.style.color = 'white';
    titleDiv.style.fontSize = '32px';
    titleDiv.style.textAlign = 'center';
    titleDiv.style.marginBottom = '10px';
    titleDiv.style.zIndex = '1001';

    swipeContainer = document.createElement('div');
    swipeContainer.style.position = 'absolute';
    swipeContainer.style.top = '0';
    swipeContainer.style.left = '0';
    swipeContainer.style.width = `${window.innerWidth * 3}px`; // Accommodate prev, current, next
    swipeContainer.style.height = '100%';
    swipeContainer.style.transform = `translateX(${-window.innerWidth}px)`; // Center current image
    swipeContainer.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    // swipeContainer.style.border = '2px solid yellow'; // Debugging

    const viewportWidth = window.innerWidth;
    prevWrapper = createImageWrapper(getImageData(currentIndex - 1), false, 0);
    currentWrapper = createImageWrapper(getImageData(currentIndex), true, viewportWidth);
    nextWrapper = createImageWrapper(getImageData(currentIndex + 1), false, viewportWidth * 2);

    swipeContainer.appendChild(prevWrapper);
    swipeContainer.appendChild(currentWrapper);
    swipeContainer.appendChild(nextWrapper);

    swipeContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
    swipeContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
    swipeContainer.addEventListener('touchend', handleTouchEnd, { passive: false });

    swipeContainer.addEventListener('wheel', handleWheel);
    swipeContainer.addEventListener('dblclick', handleDblClick);
    swipeContainer.addEventListener('mousedown', handleMouseDown);

    // Add click to close when tapping outside image on wrapper
    swipeContainer.addEventListener('click', (e) => {
        if (scale === 1 && e.target.tagName === 'DIV' && e.target.parentElement === swipeContainer && e.target.querySelector('.current-img')) {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            closeModal();
        }
    });

    const handleMouseMove = (e) => {
        if (isDragging && scale > 1) {
            translateX = e.clientX - startX;
            translateY = e.clientY - startY;
            updateImageTransform();
        }
    };

    const handleMouseUp = () => {
        if (isDragging) {
            isDragging = false;
            updateCursor();
        }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    const prevBtn = document.createElement('a');
    prevBtn.innerHTML = '&#10094;';
    prevBtn.className = 'prev';
    prevBtn.style.zIndex = '1001';
    prevBtn.style.position = 'absolute';
    prevBtn.style.left = '10px';
    prevBtn.style.top = '50%';
    prevBtn.style.transform = 'translateY(-50%)';
    prevBtn.style.color = 'white';
    prevBtn.style.fontSize = '40px';
    prevBtn.style.cursor = 'pointer';
    prevBtn.addEventListener('click', (e) => { e.stopPropagation(); navigate(-1); });

    const nextBtn = document.createElement('a');
    nextBtn.innerHTML = '&#10095;';
    nextBtn.className = 'next';
    nextBtn.style.zIndex = '1001';
    nextBtn.style.position = 'absolute';
    nextBtn.style.right = '10px';
    nextBtn.style.top = '50%';
    nextBtn.style.transform = 'translateY(-50%)';
    nextBtn.style.color = 'white';
    nextBtn.style.fontSize = '40px';
    nextBtn.style.cursor = 'pointer';
    nextBtn.addEventListener('click', (e) => { e.stopPropagation(); navigate(1); });

    modal.appendChild(prevBtn);
    modal.appendChild(titleDiv);
    modal.appendChild(swipeContainer);
    modal.appendChild(nextBtn);
    document.body.appendChild(modal);
}

function createImageWrapper(imageData, isCurrent = false, leftPixels = 0) {
    const wrapper = document.createElement('div');
    wrapper.style.position = 'absolute';
    wrapper.style.top = '0';
    wrapper.style.left = `${leftPixels}px`;
    wrapper.style.width = `${window.innerWidth}px`;
    wrapper.style.height = '100%';
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.alignItems = 'center';
    wrapper.style.justifyContent = 'center';
    wrapper.style.boxSizing = 'border-box';
    // wrapper.style.border = '2px solid red'; // Debugging

    const img = document.createElement('img');
    img.src = imageData.signedSrc;
    img.style.maxWidth = '90%';
    img.style.maxHeight = '80%';
    img.style.width = 'auto';
    img.style.height = 'auto';
    img.style.objectFit = 'contain';
    img.style.borderRadius = '5px';
    img.style.transform = `translate(0px, 0px) scale(1)`;
    img.style.transformOrigin = 'center';
    img.style.cursor = 'default';
    img.style.display = 'block';
    img.style.margin = '0 auto';
    img.style.opacity = '1';
    // img.style.border = '2px solid blue'; // Debugging

    const exifDiv = document.createElement('div');
    exifDiv.className = 'exif-text';
    exifDiv.style.color = 'white';
    exifDiv.style.fontSize = '14px';
    exifDiv.style.textAlign = 'center';
    exifDiv.style.maxWidth = '90%';
    exifDiv.style.marginTop = '10px';
    exifDiv.style.opacity = '1';
    // exifDiv.style.border = '2px solid green'; // Debugging
    loadMetadata(imageData.txtSrc, exifDiv, isCurrent);

    if (isCurrent) {
        img.classList.add('current-img');
        img.onload = () => {
            updateMaxScale(img);
        };
    }

    wrapper.appendChild(img);
    wrapper.appendChild(exifDiv);
    return wrapper;
}

function updateWrapper(wrapper, imageData, isCurrent, leftPixels) {
    const img = wrapper.querySelector('img');
    const exifDiv = wrapper.querySelector('.exif-text');
    
    img.src = imageData.signedSrc;
    img.classList.toggle('current-img', isCurrent);
    wrapper.style.left = `${leftPixels}px`;
    
    if (isCurrent) {
        img.onload = () => {
            updateMaxScale(img);
        };
    }
    
    loadMetadata(imageData.txtSrc, exifDiv, isCurrent);
}

function updateMaxScale(img) {
    const displayedWidth = img.offsetWidth;
    const displayedHeight = img.offsetHeight;
    const scaleX = img.naturalWidth / displayedWidth;
    const scaleY = img.naturalHeight / displayedHeight;
    maxScale = Math.max(scaleX, scaleY) * 1.5;
}

function handleWheel(e) {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    scale = Math.max(1, Math.min(maxScale, scale + delta));
    if (scale === 1) {
        translateX = 0;
        translateY = 0;
    }
    updateImageTransform();
}

function handleDblClick() {
    scale = 1;
    translateX = 0;
    translateY = 0;
    updateImageTransform();
}

function handleMouseDown(e) {
    if (scale > 1) {
        isDragging = true;
        startX = e.clientX - translateX;
        startY = e.clientY - translateY;
        updateCursor();
        e.preventDefault();
    }
}

function closeModal() {
    document.body.style.overflow = '';
    const modal = document.getElementById('image-modal');
    if (modal) modal.remove();
    swipeContainer = null;
    prevWrapper = null;
    currentWrapper = null;
    nextWrapper = null;
    // Pop the history state if not already handled by back button
    if (!isClosingByBack && history.state && history.state.modalOpen) {
        history.back();
    }
}

function navigate(direction) {
    currentIndex = (currentIndex + direction + currentImages.length) % currentImages.length;
    
    const viewportWidth = window.innerWidth;
    updateWrapper(prevWrapper, getImageData(currentIndex - 1), false, 0);
    updateWrapper(currentWrapper, getImageData(currentIndex), true, viewportWidth);
    updateWrapper(nextWrapper, getImageData(currentIndex + 1), false, viewportWidth * 2);

    swipeContainer.style.transition = 'none';
    swipeContainer.style.transform = `translateX(${-viewportWidth}px)`;

    scale = 1;
    translateX = 0;
    translateY = 0;
    updateImageTransform();
    updateCursor();

    preloadAdjacentContent();
}

function getImageData(index) {
    const adjustedIndex = (index + currentImages.length) % currentImages.length;
    const imgElem = currentImages[adjustedIndex];
    const folder = imgElem.dataset.folder;
    const base = imgElem.alt;
    return {
        signedSrc: `imgs/${folder}/${base}_signed.webp`,
        txtSrc: `imgs/${folder}/${base}_signed.txt`
    };
}

function preloadAdjacentContent() {
    const prevData = getImageData(currentIndex - 1);
    const nextData = getImageData(currentIndex + 1);
    const prevData2 = getImageData(currentIndex - 2);
    const nextData2 = getImageData(currentIndex + 2);
    preloadImage(prevData.signedSrc);
    preloadImage(nextData.signedSrc);
    preloadImage(prevData2.signedSrc);
    preloadImage(nextData2.signedSrc);
}

document.addEventListener('DOMContentLoaded', function () {
    const galleryContainer = document.getElementById('gallery-container');
    if (galleryContainer) {
        galleryContainer.addEventListener('click', function (e) {
            if (e.target.tagName === 'IMG') {
                const grid = e.target.closest('.photo-grid');
                const section = grid.closest('.photo-section');
                const sectionName = section.querySelector('h2').textContent;
                const imagesArray = Array.from(grid.querySelectorAll('img'));
                const index = imagesArray.indexOf(e.target);
                openModal(e.target, imagesArray, index, sectionName);
            }
        });
    }
});

document.addEventListener('keydown', (e) => {
    if (document.getElementById('image-modal')) {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            navigate(-1);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            navigate(1);
        } else if (e.key === 'Escape') {
            closeModal();
        }
    }
});

window.addEventListener('popstate', (e) => {
    if (document.getElementById('image-modal') && e.state && e.state.modalOpen) {
        isClosingByBack = true;
        closeModal();
        isClosingByBack = false;
    }
});