window.onload = function () {
    const elements = document.querySelectorAll('body > *:not(footer):not(script):not(header)');
    elements.forEach(element => {
        element.classList.add('animate');
        element.addEventListener('animationend', () => {
            element.classList.remove('animate');
        }, { once: true });
    });
};

let lastScrollTop = 0;
const header = document.getElementById('header');

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

document.addEventListener('DOMContentLoaded', function() {
    const currentYear = new Date().getFullYear();
    const footerCredits = document.querySelector('.footer_credits p');
    footerCredits.textContent = `© ${currentYear} TheAypisamFpv`;

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
    if (header) {
        let lastScrollTop = 0;
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

// Cache for metadata to avoid repeated fetches
const metadataCache = new Map();

function preloadImage(src) {
    const img = new Image();
    img.src = src;
}

function getDistance(touch1, touch2) {
    return Math.sqrt((touch1.clientX - touch2.clientX) ** 2 + (touch1.clientY - touch2.clientY) ** 2);
}

function handleTouchStart(e) {
    if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        isDragging = false;
    } else if (e.touches.length === 2) {
        isPinching = true;
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        initialDistance = getDistance(touch1, touch2);
        initialScale = scale;
        e.preventDefault();
    }
}

function handleTouchMove(e) {
    const img = e.target;
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
        img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        img.style.cursor = scale > 1 ? 'grab' : 'default';
    } else if (e.touches.length === 1 && scale > 1) {
        if (!isDragging) {
            isDragging = true;
            startX = e.touches[0].clientX - translateX;
            startY = e.touches[0].clientY - translateY;
        }
        translateX = e.touches[0].clientX - startX;
        translateY = e.touches[0].clientY - startY;
        img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    }
}

function handleTouchEnd(e) {
    const img = e.target;
    if (isPinching) {
        isPinching = false;
    }
    if (isDragging) {
        isDragging = false;
        img.style.cursor = scale > 1 ? 'grab' : 'default';
    }
    if (e.changedTouches.length === 1 && !isPinching && scale === 1) {
        const touchEndX = e.changedTouches[0].clientX;
        const deltaX = touchEndX - touchStartX;
        const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY);
        if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > deltaY) {
            navigate(deltaX > 0 ? -1 : 1);
        }
    }
}

function loadMetadata(txtUrl, metadataDiv) {
    if (metadataCache.has(txtUrl)) {
        metadataDiv.textContent = metadataCache.get(txtUrl);
        return;
    }
    metadataDiv.textContent = 'Loading EXIF...';
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
            metadataDiv.textContent = 'EXIF not available';
        });
}

function openModal(clickedImg, imagesArray, index, sectionName) {
    currentImages = imagesArray;
    currentIndex = index;
    scale = 1; // Reset scale
    translateX = 0; // Reset position
    translateY = 0;
    isDragging = false;
    isPinching = false;
    document.body.style.overflow = 'hidden'; // Prevent background scrolling

    // Preload adjacent images
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : currentImages.length - 1;
    const nextIndex = currentIndex < currentImages.length - 1 ? currentIndex + 1 : 0;
    const prevImg = currentImages[prevIndex];
    const nextImg = currentImages[nextIndex];
    preloadImage(`imgs/${prevImg.dataset.folder}/${prevImg.alt}_signed.webp`);
    preloadImage(`imgs/${nextImg.dataset.folder}/${nextImg.alt}_signed.webp`);
    const modal = document.createElement('div');
    modal.id = 'image-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.padding = '10px 0 10px 0'
    modal.style.backgroundColor = 'rgba(0,0,0,0.9)';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'space-between';
    modal.style.zIndex = '1000';
    modal.style.cursor = 'default'; // Default cursor (arrow)

    const folder = clickedImg.dataset.folder;
    const base = clickedImg.alt;
    const signedSrc = `imgs/${folder}/${base}_signed.webp`;
    const txtSrc = `imgs/${folder}/${base}_signed.txt`;

    const img = document.createElement('img');
    img.src = signedSrc;
    img.style.opacity = '1';
    img.onload = () => {
        const displayedWidth = img.offsetWidth;
        const displayedHeight = img.offsetHeight;
        const scaleX = img.naturalWidth / displayedWidth;
        const scaleY = img.naturalHeight / displayedHeight;
        maxScale = Math.max(scaleX, scaleY) * 1.5;
    };
    img.style.width = 'auto';
    img.style.maxWidth = '90%';
    img.style.maxHeight = '90%'; // Leave space for metadata
    img.style.objectFit = 'contain';
    img.style.borderRadius = '5px'; // No rounded corners in view mode
    img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    img.style.transformOrigin = 'center';
    img.style.cursor = scale > 1 ? 'grab' : 'default';
    img.style.zIndex = '999';
    img.addEventListener('click', (e) => e.stopPropagation()); // Prevent closing when clicking on image
    img.addEventListener('wheel', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const delta = e.deltaY > 0 ? -0.05 : 0.05; // Less sensitive zoom
        scale = Math.max(1, Math.min(maxScale, scale + delta));
        if (scale === 1) {
            translateX = 0;
            translateY = 0;
        }
        img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        img.style.cursor = scale > 1 ? 'grab' : 'default';
    });
    img.addEventListener('dblclick', () => {
        scale = 1;
        translateX = 0;
        translateY = 0;
        img.style.transformOrigin = 'center';
        img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        img.style.cursor = 'default';
    });
    img.addEventListener('mousedown', (e) => {
        if (scale > 1) {
            isDragging = true;
            startX = e.clientX - translateX;
            startY = e.clientY - translateY;
            img.style.cursor = 'grabbing';
            e.preventDefault();
        }
    });

    // Touch event listeners for mobile
    img.addEventListener('touchstart', handleTouchStart, { passive: false });
    img.addEventListener('touchmove', handleTouchMove, { passive: false });
    img.addEventListener('touchend', handleTouchEnd, { passive: false });

    const titleDiv = document.createElement('div');
    titleDiv.textContent = sectionName;
    titleDiv.style.color = 'white';
    titleDiv.style.fontSize = '32px';
    titleDiv.style.textAlign = 'center';
    titleDiv.style.marginBottom = '10px';
    titleDiv.style.zIndex = '998';

    const metadataDiv = document.createElement('div');
    metadataDiv.id = 'image-exif';
    metadataDiv.style.marginTop = '10px';
    metadataDiv.style.color = 'white';
    metadataDiv.style.fontSize = '14px';
    metadataDiv.style.textAlign = 'center';
    metadataDiv.style.maxWidth = '90%';
    loadMetadata(txtSrc, metadataDiv);

    const handleMouseMove = (e) => {
        if (isDragging) {
            translateX = e.clientX - startX;
            translateY = e.clientY - startY;
            img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        }
    };

    const handleMouseUp = () => {
        if (isDragging) {
            isDragging = false;
            img.style.cursor = scale > 1 ? 'grab' : 'default';
        }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    const prevBtn = document.createElement('a');
    prevBtn.innerHTML = '&#10094;'; // Left arrow
    prevBtn.className = 'prev';
    prevBtn.addEventListener('click', (e) => { e.stopPropagation(); navigate(-1); });

    const nextBtn = document.createElement('a');
    nextBtn.innerHTML = '&#10095;'; // Right arrow
    nextBtn.className = 'next';
    nextBtn.addEventListener('click', (e) => { e.stopPropagation(); navigate(1); });

    modal.appendChild(prevBtn);
    modal.appendChild(titleDiv);
    modal.appendChild(img);
    modal.appendChild(metadataDiv);
    modal.appendChild(nextBtn);
    document.body.appendChild(modal);

    modal.addEventListener('click', () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        closeModal();
    });
}

function closeModal() {
    document.body.style.overflow = ''; // Restore scrolling
    const modal = document.getElementById('image-modal');
    if (modal) modal.remove();
}

function navigate(direction) {
    // console.log('Navigate called with direction', direction);
    currentIndex += direction;
    if (currentIndex < 0) currentIndex = currentImages.length - 1;
    if (currentIndex >= currentImages.length) currentIndex = 0;
    // console.log('New currentIndex', currentIndex);
    const modalImg = document.querySelector('#image-modal img');
    const metadataDiv = document.querySelector('#image-exif');
    if (modalImg) {
        // Smooth transition
        modalImg.style.transition = 'opacity 0.3s ease';
        modalImg.style.opacity = '0';
        metadataDiv.textContent = 'Loading next image...';
        setTimeout(() => {
            const nextImg = currentImages[currentIndex];
            const folder = nextImg.dataset.folder;
            const base = nextImg.alt;
            const signedSrc = `imgs/${folder}/${base}_signed.webp`;
            const txtSrc = `imgs/${folder}/${base}_signed.txt`;
            // console.log('Setting src to', signedSrc);
            modalImg.src = signedSrc;
            modalImg.onload = () => {
                modalImg.style.opacity = '1';
                setTimeout(() => {
                    modalImg.style.transition = '';
                }, 300);
                const displayedWidth = modalImg.offsetWidth;
                const displayedHeight = modalImg.offsetHeight;
                const scaleX = modalImg.naturalWidth / displayedWidth;
                const scaleY = modalImg.naturalHeight / displayedHeight;
                maxScale = Math.max(scaleX, scaleY) * 1.5;
                loadMetadata(txtSrc, metadataDiv);
            };
            scale = 1;
            translateX = 0;
            translateY = 0;
            modalImg.style.transformOrigin = 'center';
            modalImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
            modalImg.style.cursor = 'default';

            // Preload new adjacent
            const prevIndex = currentIndex > 0 ? currentIndex - 1 : currentImages.length - 1;
            const nextIndex2 = currentIndex < currentImages.length - 1 ? currentIndex + 1 : 0;
            const prevImg = currentImages[prevIndex];
            const nextImg2 = currentImages[nextIndex2];
            preloadImage(`imgs/${prevImg.dataset.folder}/${prevImg.alt}_signed.webp`);
            preloadImage(`imgs/${nextImg2.dataset.folder}/${nextImg2.alt}_signed.webp`);
        }, 150);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const galleryContainer = document.getElementById('gallery-container');
    if (galleryContainer) {
        galleryContainer.addEventListener('click', function(e) {
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