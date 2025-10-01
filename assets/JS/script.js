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

// Cache for metadata to avoid repeated fetches
const metadataCache = new Map();

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
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    const modal = document.createElement('div');
    modal.id = 'image-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.9)';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '1000';
    modal.style.cursor = 'default'; // Default cursor (arrow)

    const img = document.createElement('img');
    img.src = clickedImg.src.replace('_preview.webp', '_signed.webp');
    img.onload = () => {
        const displayedWidth = img.offsetWidth;
        const displayedHeight = img.offsetHeight;
        const scaleX = img.naturalWidth / displayedWidth;
        const scaleY = img.naturalHeight / displayedHeight;
        maxScale = Math.max(scaleX, scaleY) * 1.5;
    };
    img.style.maxWidth = '90%';
    img.style.maxHeight = '80%'; // Leave space for metadata
    img.style.objectFit = 'contain';
    img.style.borderRadius = '0'; // No rounded corners in view mode
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
    loadMetadata(clickedImg.src.replace('_preview.webp', '_signed.txt'), metadataDiv);

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
    console.log('Navigate called with direction', direction);
    currentIndex += direction;
    if (currentIndex < 0) currentIndex = currentImages.length - 1;
    if (currentIndex >= currentImages.length) currentIndex = 0;
    console.log('New currentIndex', currentIndex);
    const modalImg = document.querySelector('#image-modal img');
    const metadataDiv = document.querySelector('#image-exif');
    if (modalImg) {
        modalImg.style.display = 'none';
        metadataDiv.textContent = 'Loading next image...';
        console.log('Setting src to', currentImages[currentIndex].src.replace('_preview.webp', '_signed.webp'));
        modalImg.src = currentImages[currentIndex].src.replace('_preview.webp', '_signed.webp');
        modalImg.onload = () => {
            modalImg.style.display = 'block';
            const displayedWidth = modalImg.offsetWidth;
            const displayedHeight = modalImg.offsetHeight;
            const scaleX = modalImg.naturalWidth / displayedWidth;
            const scaleY = modalImg.naturalHeight / displayedHeight;
            maxScale = Math.max(scaleX, scaleY) * 1.5;
            loadMetadata(currentImages[currentIndex].src.replace('_preview.webp', '_signed.txt'), metadataDiv);
        };
        scale = 1;
        translateX = 0;
        translateY = 0;
        modalImg.style.transformOrigin = 'center';
        modalImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        modalImg.style.cursor = 'default';
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