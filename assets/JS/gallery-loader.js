// gallery-loader.js - Loads preview images from local JSON file and swaps to signed images on click, with EXIF data from _signed.txt files

async function loadGallery() {
  try {
    // Load the local JSON file
    const jsonPath = 'imgs/image_paths.json';
    const response = await new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', jsonPath, true);
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
          resolve({ ok: true, json: () => JSON.parse(xhr.responseText) });
        } else if (xhr.readyState === 4) {
          resolve({ ok: false });
        }
      };
      xhr.send();
    });

    if (!response.ok) throw new Error('Failed to load image_paths.json');
    const data = await response.json();

    // Sort folder names alphabetically
    const folders = Object.keys(data).sort((a, b) => a.localeCompare(b));

    const container = document.getElementById('gallery-container');
    if (!container) return;
    container.innerHTML = '';

    for (const folderName of folders) {
      const sectionId = folderName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const signedFiles = data[folderName]; // Contains _signed.webp entries

      // Derive preview filenames from signed ones
      const previewFiles = signedFiles.map(file => file.replace('_signed.webp', '_preview.webp'));

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

      for (let i = 0; i < previewFiles.length; i++) {
        const previewFile = previewFiles[i];
        const signedFile = signedFiles[i];
        const previewPath = `imgs/${folderName}/${previewFile}`;
        const txtPath = `imgs/${folderName}/${signedFile.replace('_signed.webp', '_signed.txt')}`;

        getImageDate(txtPath).then(date => {
          // console.log(`Date loaded for ${txtPath}:`, date);
          const wrapper = document.createElement('div');
          wrapper.className = 'photo-item';

          const img = document.createElement('img');
          img.src = previewPath;
          img.alt = previewFile.replace('_preview.webp', '');
          img.dataset.folder = folderName;
          img.classList.add('animate');
          img.addEventListener('animationend', () => {
            img.classList.remove('animate');
          }, { once: true });

          wrapper.appendChild(img);
          grid.appendChild(wrapper);

          images.push({ date, element: wrapper });

          // Sort when all images for this section are loaded
          if (images.length === previewFiles.length) {
            images.sort((a, b) => b.date - a.date);
            images.forEach(item => grid.appendChild(item.element));
          }
        }).catch(error => {
          console.error(`Error processing ${txtPath}:`, error);
          // Fallback to default date to ensure image is still displayed
          const wrapper = document.createElement('div');
          wrapper.className = 'photo-item';

          const img = document.createElement('img');
          img.src = previewPath;
          img.alt = previewFile.replace('_preview.webp', '');
          img.dataset.folder = folderName;
          img.classList.add('animate');
          img.addEventListener('animationend', () => {
            img.classList.remove('animate');
          }, { once: true });

          wrapper.appendChild(img);
          grid.appendChild(wrapper);

          images.push({ date: new Date(0), element: wrapper });

          if (images.length === previewFiles.length) {
            images.sort((a, b) => b.date - a.date);
            images.forEach(item => grid.appendChild(item.element));
          }
        });
      }
    }

    // Create table of contents
    createTOC(folders);
  } catch (error) {
    console.error('Error loading gallery:', error);
  }
}

async function getImageDate(txtUrl) {
  // console.log(`Starting to load EXIF data from: ${txtUrl}`);
  try {
    const response = await new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', txtUrl, true);
      xhr.responseType = 'text'; // Explicitly set response type to text
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          // console.log(`XHR readyState 4 for ${txtUrl}, status: ${xhr.status}`);
          if (xhr.status === 200) {
            resolve({ ok: true, text: () => xhr.responseText });
          } else {
            resolve({ ok: false, status: xhr.status });
          }
        }
      };
      xhr.send();
    });

    if (!response.ok) {
      console.error(`Failed to load ${txtUrl}: HTTP ${response.status}`);
      return new Date(0);
    }

    const text = await response.text();
    // console.log(`Loaded text from ${txtUrl}: "${text}"`);
    // Parse date in format DD/MM/YYYY HH:MM
    const match = text.match(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})/);
    // console.log(`Date match for ${txtUrl}:`, match);
    if (match) {
      const [, day, month, year, hour, minute] = match;
      const dateStr = `${year}-${month}-${day}T${hour}:${minute}:00`;
      // console.log(`Parsed date string: ${dateStr}`);
      const date = new Date(dateStr);
      // console.log(`Parsed Date object:`, date);
      return date;
    } else {
      // console.error(`Invalid date f ormat in ${txtUrl}:`, text);
      return new Date(0);
    }
  } catch (error) {
    console.error(`Error fetching ${txtUrl}:`, error);
    return new Date(0);
  }
}

// Function to create gallery sections list
function createTOC(folders) {
  const toc = document.getElementById('toc');
  if (!toc) return;
  toc.innerHTML = ''; // Clear existing content

  const h2 = document.createElement('h2');
  h2.textContent = 'Gallery Sections';
  toc.appendChild(h2);

  const ul = document.createElement('ul');
  toc.appendChild(ul);

  folders.forEach(folder => {
    const id = folder.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `#${id}`;
    a.setAttribute('data-target', id);
    a.textContent = folder;
    li.appendChild(a);
    ul.appendChild(li);
  });

  // Add smooth scroll to links
  toc.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('data-target');
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        const elementTop = targetElement.offsetTop;
        const viewportHeight = window.innerHeight;
        const offset = viewportHeight * 0.02; // 2% of viewport height
        const scrollTo = Math.max(0, elementTop - offset); // Ensure not negative
        window.scrollTo({ top: scrollTo, behavior: 'smooth' });
      }
    });
  });
}

// Load gallery when DOM is ready
document.addEventListener('DOMContentLoaded', loadGallery);