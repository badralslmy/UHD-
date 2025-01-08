// استرجاع جميع المحتويات من IndexedDB
const getAllContentFromDB = async () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('ContentDatabase', 16);

        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction('content', 'readonly');
            const store = transaction.objectStore('content');
            const requestGetAll = store.getAll();

            requestGetAll.onsuccess = () => resolve(requestGetAll.result);
            requestGetAll.onerror = () => reject(requestGetAll.error);
        };

        request.onerror = () => reject(request.error);
    });
};

// تفعيل البحث والتصفية
const setupFilters = (series) => {
    // تفعيل البحث
    const searchInput = document.querySelector('.search-bar input');
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredSeries = series.filter(serie => serie.title.toLowerCase().includes(searchTerm));
        displaySeries(filteredSeries);
    });

    // تفعيل التصنيف
    const categoryFilter = document.querySelector('.category-filter');
    categoryFilter.addEventListener('change', () => {
        const selectedCategory = categoryFilter.value;
        const filteredSeries = selectedCategory === 'all' 
            ? series 
            : series.filter(serie => serie.categories.includes(selectedCategory));
        displaySeries(filteredSeries);
    });

    // تفعيل السنة
    const yearFilter = document.querySelector('.year-filter');
    yearFilter.addEventListener('change', () => {
        const selectedYear = yearFilter.value;
        const filteredSeries = selectedYear === 'all' 
            ? series 
            : series.filter(serie => serie.year === parseInt(selectedYear));
        displaySeries(filteredSeries);
    });

    // تفعيل التقييم
    const ratingFilter = document.querySelector('.rating-filter');
    ratingFilter.addEventListener('change', () => {
        const selectedRating = ratingFilter.value;
        const filteredSeries = selectedRating === 'all' 
            ? series 
            : series.filter(serie => serie.rating >= parseInt(selectedRating));
        displaySeries(filteredSeries);
    });
};

// عرض المسلسلات
function displaySeries(series) {
    const mediaGrid = document.querySelector('.media-grid');
    mediaGrid.innerHTML = series.map(serie => `
        <div class="media-card" onclick="window.location.href='series-details.html?id=${serie.id}'">
            <div class="media-poster" style="background-image: url('${serie.posterPortraitUrl}');">
                <h3 class="media-title">${serie.title}</h3>
            </div>
        </div>
    `).join('');
}

// تحميل المحتوى عند بدء الصفحة
document.addEventListener('DOMContentLoaded', async () => {
    const contentDatabase = await getAllContentFromDB();
    const series = contentDatabase.filter(item => item.type === 'series');
    displaySeries(series);
    setupFilters(series);
});