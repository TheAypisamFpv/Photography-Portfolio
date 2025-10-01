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
  try {
    // Fetch folders in imgs/
    const imgsRes = await fetch(`${baseApiUrl}/imgs`);
    if (!imgsRes.ok) throw new Error('Failed to fetch imgs directory');
    const imgsData = await imgsRes.json();
    const folders = imgsData.filter(item => item.type === 'dir').map(item => item.name);

    const sectionsData = [];

    // Process each folder
    for (const folder of folders) {
      const sectionId = sectionMap[folder];
      if (!sectionId) continue;

      // Fetch files in folder
      const folderRes = await fetch(`${baseApiUrl}/imgs/${folder}`);
      if (!folderRes.ok) continue;
      const folderData = await folderRes.json();

      // Filter _signed.webp files
      const signedFiles = folderData.filter(item => item.name.endsWith('_signed.webp'));

      const images = [];

      // Load each image to get EXIF date
      for (const file of signedFiles) {
        const base = file.name.replace('_signed.webp', '');
        const imgUrl = `${baseImgUrl}/${folder}/${file.name}`;

        const date = await getImageDate(imgUrl);
        images.push({ base, date });
      }

      // Sort images by date descending
      images.sort((a, b) => b.date - a.date);

      sectionsData.push({ folder, sectionId, images });
    }

    // Sort sections by newest image date, then alphabetical
    sectionsData.sort((a, b) => {
      const maxA = a.images.length ? Math.max(...a.images.map(i => i.date)) : 0;
      const maxB = b.images.length ? Math.max(...b.images.map(i => i.date)) : 0;
      if (maxA > maxB) return -1;
      if (maxA < maxB) return 1;
      return a.folder.localeCompare(b.folder);
    });

    // Populate DOM
    populateGallery(sectionsData);

  } catch (error) {
    console.error('Error loading gallery:', error);
  }
}

async function getImageDate(imgUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      EXIF.getData(img, function() {
        const dateTag = EXIF.getTag(this, 'DateTimeOriginal') || EXIF.getTag(this, 'DateTime');
        const date = dateTag ? new Date(dateTag.replace(/:/g, '-').replace(' ', 'T')) : new Date(0);
        resolve(date);
      });
    };
    img.onerror = () => resolve(new Date(0));
    img.src = imgUrl;
  });
}

function populateGallery(sectionsData) {
  const container = document.getElementById('gallery-container');
  if (!container) return;
  container.innerHTML = '';

  for (const { folder, sectionId, images } of sectionsData) {
    if (images.length === 0) continue;

    const section = document.createElement('section');
    section.className = 'photo-section';
    section.id = sectionId;

    const h2 = document.createElement('h2');
    h2.textContent = folder;
    section.appendChild(h2);

    const grid = document.createElement('div');
    grid.className = 'photo-grid';

    for (const { base } of images) {
      const img = document.createElement('img');
      img.src = `imgs/${folder}/${base}_preview.webp`;
      img.alt = base;
      img.loading = 'lazy';
      grid.appendChild(img);
    }

    section.appendChild(grid);
    container.appendChild(section);
  }
}

// Load gallery when DOM is ready
document.addEventListener('DOMContentLoaded', loadGallery);