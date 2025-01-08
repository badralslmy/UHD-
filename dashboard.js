// فتح قاعدة بيانات IndexedDB
const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('ContentDatabase', 16); // الإصدار 3

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('content')) {
                db.createObjectStore('content', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('sections')) {
                db.createObjectStore('sections', { keyPath: 'id' });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// استرجاع جميع المحتويات من IndexedDB
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

// تحديث إحصائيات المحتوى
const updateDashboardStats = async () => {
    try {
        const content = await getAllContentFromDB();
        const totalMovies = content.filter(item => item.type === 'movie').length;
        const totalSeries = content.filter(item => item.type === 'series').length;
        const totalAnime = content.filter(item => item.type === 'anime').length;

        if (document.getElementById('totalMovies')) {
            document.getElementById('totalMovies').textContent = totalMovies;
        }
        if (document.getElementById('totalSeries')) {
            document.getElementById('totalSeries').textContent = totalSeries;
        }
        if (document.getElementById('totalAnime')) {
            document.getElementById('totalAnime').textContent = totalAnime;
        }
    } catch (error) {
        console.error('حدث خطأ أثناء تحديث الإحصائيات:', error);
    }
};

// التحميل الأولي للإحصائيات
(async () => {
    await updateDashboardStats();
})();