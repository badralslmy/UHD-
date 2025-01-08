const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('ContentDatabase', 16);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('content')) {
                db.createObjectStore('content', { keyPath: 'id' });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

const getAllContentFromDB = async () => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('content', 'readonly');
        const store = transaction.objectStore('content');
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

const updateFilesTable = async (searchQuery = '', showMissingOnly = false, typeFilter = 'all') => {
    try {
        const content = await getAllContentFromDB();
        const filesTableBody = document.querySelector('#filesTable tbody');

        let filteredContent = content;
        if (searchQuery) {
            filteredContent = content.filter(item =>
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.id.toString().includes(searchQuery)
            );
        }

        if (showMissingOnly) {
            filteredContent = filteredContent.filter(item => !item.videoUrl);
        }

        if (typeFilter !== 'all') {
            filteredContent = filteredContent.filter(item => item.type === typeFilter);
        }

        filesTableBody.innerHTML = filteredContent.map((item, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${item.title}</td>
                <td>
                    ${item.videoUrl ? `<a href="${item.videoUrl}" class="file-link" target="_blank">رابط الفيديو</a>` : '<span class="error">غير مرفق</span>'}
                </td>
                <td>
                    ${item.type === 'series' ? `<button class="attach-btn-series" onclick="showAttachments(${item.id})">الإرفاقات</button>` : `
                        <button class="attach-btn" onclick="attachFile(${item.id}, 'video')">إرفاق فيديو</button>
                    `}
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('حدث خطأ أثناء تحديث الجدول:', error);
    }
};

const showAttachments = async (id) => {
    const popup = document.getElementById('episodePopup');
    const popupTitle = document.getElementById('popupTitle');
    const episodeList = document.getElementById('episodeList');

    const content = await getAllContentFromDB();
    const selectedContent = content.find(item => item.id === id);

    if (selectedContent && selectedContent.type === 'series') {
        popupTitle.textContent = `إرفاقات الحلقات لـ ${selectedContent.title}`;
        episodeList.innerHTML = '';

        selectedContent.seasons.forEach(season => {
            season.episodes.forEach((episode, index) => {
                const videoAttached = season.videoLinks && season.videoLinks[index];

                let frameClass = '';
                if (videoAttached) {
                    frameClass = 'attached-video';
                }

                episodeList.innerHTML += `
                    <div class="episode-item ${frameClass}">
                        <label>الموسم ${season.seasonNumber} - الحلقة ${index + 1}</label>
                        <div class="episode-actions">
                            <button class="attach-btn ${videoAttached ? 'attached' : ''}" onclick="attachFile(${id}, 'video', ${season.seasonNumber}, ${index + 1})">إرفاق فيديو</button>
                        </div>
                    </div>
                `;
            });
        });
    }

    popup.style.display = 'flex';

    document.getElementById('closePopup').onclick = () => {
        popup.style.display = 'none';
    };
};

const attachFile = async (id, type, seasonNumber, episodeNumber) => {
    const link = prompt(`أدخل رابط الفيديو للحلقة ${episodeNumber} من الموسم ${seasonNumber}:`);
    if (link) {
        const content = await getAllContentFromDB();
        const selectedContent = content.find(item => item.id === id);

        if (selectedContent) {
            if (type === 'video') {
                if (seasonNumber && episodeNumber) {
                    if (!selectedContent.seasons[seasonNumber - 1].videoLinks) {
                        selectedContent.seasons[seasonNumber - 1].videoLinks = [];
                    }
                    selectedContent.seasons[seasonNumber - 1].videoLinks[episodeNumber - 1] = link;
                } else {
                    selectedContent.videoUrl = link;
                }
            }

            await updateContentInDB(selectedContent);
            await updateFilesTable();
            alert('تم إرفاق رابط الفيديو بنجاح!');
        }
    }
};

const updateContentInDB = async (content) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('content', 'readwrite');
        const store = transaction.objectStore('content');
        const request = store.put(content);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

document.getElementById('searchInput').addEventListener('input', () => {
    const searchQuery = document.getElementById('searchInput').value;
    updateFilesTable(searchQuery);
});

document.getElementById('filterMissingFiles').addEventListener('click', () => {
    const searchQuery = document.getElementById('searchInput').value;
    updateFilesTable(searchQuery, true);
});

document.getElementById('filterMovies').addEventListener('click', () => {
    const searchQuery = document.getElementById('searchInput').value;
    updateFilesTable(searchQuery, false, 'movie');
});

document.getElementById('filterSeries').addEventListener('click', () => {
    const searchQuery = document.getElementById('searchInput').value;
    updateFilesTable(searchQuery, false, 'series');
});

(async () => {
    await updateFilesTable();
})();