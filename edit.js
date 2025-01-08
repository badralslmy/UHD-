let contentGridData = [];

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

        request.onsuccess = () => {
            const content = request.result;
            content.forEach(item => {
                if (!item.videoUrl) item.videoUrl = '';
                if (!item.subtitleUrl) item.subtitleUrl = '';
            });
            resolve(content);
        };
        request.onerror = () => reject(request.error);
    });
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

const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
};

const getCompletionStatus = (content) => {
    if (content.videoUrl && content.subtitleUrl) {
        return "مكتمل";
    } else if (!content.videoUrl && !content.subtitleUrl) {
        return "غير مكتمل";
    } else {
        return "مكتمل جزئيا";
    }
};

const updateContentGrid = async (filter = 'all', searchQuery = '', completionFilter = 'all', statusFilter = 'all') => {
    try {
        const content = await getAllContentFromDB();
        contentGridData = content;
        const contentGrid = document.getElementById('contentGrid');

        let filteredContent = content;
        if (filter !== 'all') {
            filteredContent = content.filter(item => item.type === filter);
        }

        if (searchQuery) {
            filteredContent = filteredContent.filter(item =>
                item.title.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (completionFilter !== 'all') {
            filteredContent = filteredContent.filter(item => getCompletionStatus(item) === completionFilter);
        }

        if (statusFilter !== 'all') {
            filteredContent = filteredContent.filter(item => item.status === statusFilter);
        }

        contentGrid.innerHTML = filteredContent.map(item => `
            <div class="content-item">
                <img src="${item.posterPortraitUrl}" alt="${item.title}" class="content-poster">
                <div class="content-info">
                    <h3 class="content-title">${item.title}</h3>
                    <div class="content-actions">
                        <button class="edit-btn" onclick="editContent(${item.id})"><i class="fas fa-edit"></i> تعديل</button>
                        <button class="delete-btn" onclick="confirmDelete(${item.id})"><i class="fas fa-trash"></i> حذف</button>
                        <select class="status-select" onchange="changeStatus(${item.id}, this.value)">
                            <option value="تم نشره" ${item.status === 'تم نشره' ? 'selected' : ''}>تم نشره</option>
                            <option value="لم يتم نشره" ${item.status === 'لم يتم نشره' ? 'selected' : ''}>لم يتم نشره</option>
                            <option value="معلق" ${item.status === 'معلق' ? 'selected' : ''}>معلق</option>
                            <option value="مرفوض" ${item.status === 'مرفوض' ? 'selected' : ''}>مرفوض</option>
                        </select>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('حدث خطأ أثناء عرض المحتوى:', error);
    }
};

const openModal = (content) => {
    const modal = document.getElementById('editModal');
    modal.style.display = 'block';

    document.getElementById('editTitle').value = content.title;
    document.getElementById('editDescription').value = content.description;
    document.getElementById('editRating').value = content.rating;
    document.getElementById('editYear').value = content.year;

    if (content.type === 'series') {
        document.getElementById('seasonsContainer').style.display = 'block';
        document.getElementById('seasonsList').innerHTML = '';
        content.seasons.forEach((season, index) => {
            addSeason(season);
        });
    } else {
        document.getElementById('seasonsContainer').style.display = 'none';
    }

    document.getElementById('editForm').onsubmit = async (e) => {
        e.preventDefault();
        try {
            content.title = document.getElementById('editTitle').value || content.title;
            content.description = document.getElementById('editDescription').value || content.description;
            content.rating = parseFloat(document.getElementById('editRating').value) || content.rating;
            content.year = parseInt(document.getElementById('editYear').value) || content.year;

            const posterPortraitFile = document.getElementById('editPosterPortrait').files[0];
            const posterLandscapeFile = document.getElementById('editPosterLandscape').files[0];

            if (posterPortraitFile) {
                content.posterPortraitUrl = await fileToBase64(posterPortraitFile);
            }
            if (posterLandscapeFile) {
                content.posterLandscapeUrl = await fileToBase64(posterLandscapeFile);
            }

            if (content.type === 'series') {
                content.seasons = [];
                const seasonInputs = document.querySelectorAll('.season-input');
                seasonInputs.forEach(input => {
                    const episodes = Array.from(input.querySelectorAll('.episode-input')).map(episode => ({
                        episodeNumber: parseInt(episode.querySelector('input').value),
                        title: episode.querySelector('input').value,
                        videoUrl: '',
                        subtitleUrl: ''
                    }));
                    content.seasons.push({
                        seasonNumber: parseInt(input.dataset.seasonNumber),
                        episodes: episodes
                    });
                });
            }

            await updateContentInDB(content);
            await updateContentGrid();
            closeModal();
            alert('تم حفظ التعديلات بنجاح!');
        } catch (error) {
            console.error('حدث خطأ أثناء حفظ التعديلات:', error);
            alert('حدث خطأ أثناء حفظ التعديلات. يرجى المحاولة مرة أخرى.');
        }
    };
};

const closeModal = () => {
    const modal = document.getElementById('editModal');
    modal.style.display = 'none';
};

const editContent = (id) => {
    const content = contentGridData.find(item => item.id === id);
    if (content) {
        openModal(content);
    }
};

const addSeason = (season = { seasonNumber: null, episodes: [] }) => {
    const seasonsList = document.getElementById('seasonsList');
    const nextSeasonNumber = season.seasonNumber || (seasonsList.children.length + 1);
    const seasonDiv = document.createElement('div');
    seasonDiv.className = 'season-input';
    seasonDiv.dataset.seasonNumber = nextSeasonNumber;
    seasonDiv.innerHTML = `
        <label for="season${nextSeasonNumber}">الموسم ${nextSeasonNumber}:</label>
        <button type="button" onclick="addEpisode(${nextSeasonNumber})">إضافة حلقة</button>
        <button type="button" onclick="deleteSeason(${nextSeasonNumber})">حذف الموسم</button>
        <div class="episodes-list" id="episodesList${nextSeasonNumber}"></div>
    `;
    seasonsList.appendChild(seasonDiv);

    season.episodes.forEach((episode, index) => {
        addEpisode(nextSeasonNumber, episode);
    });
};

const addEpisode = (seasonNumber, episode = {}) => {
    const episodesList = document.querySelector(`#episodesList${seasonNumber}`);
    if (episodesList) {
        const nextEpisodeNumber = episode.episodeNumber || (episodesList.children.length + 1);
        const episodeDiv = document.createElement('div');
        episodeDiv.className = 'episode-input';
        episodeDiv.innerHTML = `
            <label for="episode${seasonNumber}-${nextEpisodeNumber}">الحلقة ${nextEpisodeNumber}:</label>
            <input type="text" id="episode${seasonNumber}-${nextEpisodeNumber}" value="${episode.title || ''}" placeholder="عنوان الحلقة" required>
            <button type="button" onclick="deleteEpisode(${seasonNumber}, ${nextEpisodeNumber})">حذف الحلقة</button>
        `;
        episodesList.appendChild(episodeDiv);
    }
};

const deleteSeason = (seasonNumber) => {
    const seasonInput = document.querySelector(`.season-input[data-season-number="${seasonNumber}"]`);
    if (seasonInput) {
        seasonInput.remove();
    }
};

const deleteEpisode = (seasonNumber, episodeNumber) => {
    const episodeInput = document.querySelector(`#episodesList${seasonNumber} .episode-input:nth-child(${episodeNumber})`);
    if (episodeInput) {
        episodeInput.remove();
    }
};

document.getElementById('typeFilter').addEventListener('change', () => {
    const filter = document.getElementById('typeFilter').value;
    updateContentGrid(filter);
});

document.getElementById('searchInput').addEventListener('input', () => {
    const searchQuery = document.getElementById('searchInput').value;
    updateContentGrid('all', searchQuery);
});

document.getElementById('completionFilter').addEventListener('change', () => {
    const completionFilter = document.getElementById('completionFilter').value;
    updateContentGrid('all', '', completionFilter);
});

document.getElementById('statusFilter').addEventListener('change', () => {
    const statusFilter = document.getElementById('statusFilter').value;
    updateContentGrid('all', '', 'all', statusFilter);
});

(async () => {
    await updateContentGrid();
})();

const confirmDelete = (id) => {
    const confirmDelete = confirm('هل أنت متأكد من أنك تريد حذف هذا العنصر؟');
    if (confirmDelete) {
        deleteContent(id);
    }
};

const deleteContent = async (id) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('content', 'readwrite');
        const store = transaction.objectStore('content');
        const request = store.delete(id);

        request.onsuccess = () => {
            alert('تم حذف العنصر بنجاح!');
            updateContentGrid();
            resolve();
        };
        request.onerror = () => {
            alert('حدث خطأ أثناء حذف العنصر. يرجى المحاولة مرة أخرى.');
            reject(request.error);
        };
    });
};

const changeStatus = async (id, newStatus) => {
    const content = contentGridData.find(item => item.id === id);
    if (content) {
        content.status = newStatus;
        try {
            await updateContentInDB(content);
            alert('تم تغيير حالة النشر بنجاح!');
            updateContentGrid();
        } catch (error) {
            console.error('حدث خطأ أثناء تغيير حالة النشر:', error);
            alert('حدث خطأ أثناء تغيير حالة النشر. يرجى المحاولة مرة أخرى.');
        }
    }
};