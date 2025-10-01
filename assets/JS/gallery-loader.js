// gallery-loader.js - Dynamically loads and sorts gallery images from GitHub repo

const owner = 'TheAypisamFpv';
const repo = 'Photography-Portfolio';
const baseApiUrl = `https://api.github.com/repos/${owner}/${repo}/contents`;
const baseImgUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/imgs`;

const sectionMap = {
  'Animals': 'animals',
  'Monochrome': 'monochrome',
  'Nature': 'nature',
  'Street & Architecture': 'street-architecture'
};

async function loadGallery() {
  // For local development, hardcode the images since GitHub API has CORS issues locally
  const imageBases = {
    'Animals': ['_DSF1058', '_DSF1066-01', '_DSF1144-01'],
    'Monochrome': [],
    'Nature': [],
    'Street & Architecture': ['_DSF0339-01', '_DSF1013', 'IMG_20250922_233432']
  };

  const sectionsData = [];

  for (const folder of Object.keys(imageBases)) {
    const sectionId = sectionMap[folder];
    if (!sectionId) continue;

    const images = imageBases[folder].map(base => ({ base, date: new Date(0) }));

    sectionsData.push({ folder, sectionId, images });
  }

  // Sort sections alphabetically
  sectionsData.sort((a, b) => a.folder.localeCompare(b.folder));

  populateGallery(sectionsData);
}async function getImageDate(imgUrl) {
  try {
    const tags = await exifr.parse(imgUrl);
    const dateTag = tags.DateTimeOriginal || tags.DateTime;
    const date = dateTag ? new Date(dateTag.replace(/:/g, '-').replace(' ', 'T')) : new Date(0);
    return date;
  } catch {
    return new Date(0);
  }
}

function populateGallery(sectionsData) {
  const container = document.getElementById('gallery-container');
  if (!container) return;
  container.innerHTML = '';

  for (const { folder, sectionId, images } of sectionsData) {
    if (images.length === 0) continue;

    const section = document.createElement('section');
    section.className = 'photo-section animate';
    section.id = sectionId;

    const h2 = document.createElement('h2');
    h2.textContent = folder;
    section.appendChild(h2);

    const grid = document.createElement('div');
    grid.className = 'photo-grid animate';

    for (const { base } of images) {
      const img = document.createElement('img');
      img.src = `${baseImgUrl}/${folder}/${base}_preview.webp`;
      img.alt = base;
      img.loading = 'lazy';
      img.classList.add('animate');
      grid.appendChild(img);
    }

    section.appendChild(grid);
    container.appendChild(section);
  }
}

// Load gallery when DOM is ready
document.addEventListener('DOMContentLoaded', loadGallery);