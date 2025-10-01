// gallery-loader.js - Dynamically loads and sorts gallery images from GitHub repo

const owner = 'TheAypisamFpv';
const repo = 'Photography-Portfolio';
const baseApiUrl = `https://api.github.com/repos/${owner}/${repo}/contents`;
const baseImgUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/imgs`;

async function loadGallery() {
  try {
    // Fetch the contents of the imgs directory
    const response = await fetch(`${baseApiUrl}/imgs`);
    if (!response.ok) throw new Error('Failed to fetch imgs directory');
    const items = await response.json();

    // Filter for directories (folders)
    const folders = items.filter(item => item.type === 'dir');

    // Sort folders alphabetically
    folders.sort((a, b) => a.name.localeCompare(b.name));

    const container = document.getElementById('gallery-container');
    if (!container) return;
    container.innerHTML = '';

    for (const folder of folders) {
      const folderName = folder.name;
      const sectionId = folderName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      // Fetch contents of the folder
      const folderResponse = await fetch(`${baseApiUrl}/imgs/${folderName}`);
      if (!folderResponse.ok) continue; // Skip if can't fetch
      const files = await folderResponse.json();

      // Filter for preview images
      const previewFiles = files.filter(file => file.name.endsWith('_preview.webp'));

      if (previewFiles.length === 0) continue;

      const section = document.createElement('section');
      section.className = 'photo-section animate';
      section.id = sectionId;
      section.addEventListener('animationend', () => {
        section.classList.remove('animate');
      }, { once: true });

      const h2 = document.createElement('h2');
      h2.textContent = folderName;
      section.appendChild(h2);

      const grid = document.createElement('div');
      grid.className = 'photo-grid animate';
      grid.addEventListener('animationend', () => {
        grid.classList.remove('animate');
      }, { once: true });

      section.appendChild(grid);
      container.appendChild(section);

      const images = [];

      for (const file of previewFiles) {
        const base = file.name.replace('_preview.webp', '');
        const imgUrl = `${baseImgUrl}/${folderName}/${file.name}`;
        getImageDate(imgUrl).then(date => {
          const wrapper = document.createElement('div');
          wrapper.className = 'photo-item';

          const img = document.createElement('img');
          img.src = imgUrl;
          img.alt = base;
          img.classList.add('animate');
          img.addEventListener('animationend', () => {
            img.classList.remove('animate');
          }, { once: true });

          wrapper.appendChild(img);
          grid.appendChild(wrapper);

          images.push({ date, element: wrapper });

          // When all images for this section are loaded, sort them
          if (images.length === previewFiles.length) {
            images.sort((a, b) => b.date - a.date);
            images.forEach(item => grid.appendChild(item.element));
          }
        });
      }
    }
  } catch (error) {
    console.error('Error loading gallery:', error);
  }
}async function getImageDate(imgUrl) {
  try {
    const txtUrl = imgUrl.replace('_preview.webp', '_signed.txt');
    const response = await fetch(txtUrl);
    if (!response.ok) return new Date(0);
    const text = await response.text();
    // Parse date in format DD/MM/YYYY HH:MM
    const match = text.match(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})/);
    if (match) {
      const [, day, month, year, hour, minute] = match;
      return new Date(`${year}-${month}-${day}T${hour}:${minute}:00`);
    }
    return new Date(0);
  } catch {
    return new Date(0);
  }
}

// Load gallery when DOM is ready
document.addEventListener('DOMContentLoaded', loadGallery);