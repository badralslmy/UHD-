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
const setupFilters = (movies) => {
    // تفعيل البحث
    const searchInput = document.querySelector('.search-bar input');
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredMovies = movies.filter(movie => movie.title.toLowerCase().includes(searchTerm));
        displayMovies(filteredMovies);
    });

    // تفعيل التصنيف
    const categoryFilter = document.querySelector('.category-filter');
    categoryFilter.addEventListener('change', () => {
        const selectedCategory = categoryFilter.value;
        const filteredMovies = selectedCategory === 'all' 
            ? movies 
            : movies.filter(movie => movie.categories.includes(selectedCategory));
        displayMovies(filteredMovies);
    });

    // تفعيل السنة
    const yearFilter = document.querySelector('.year-filter');
    yearFilter.addEventListener('change', () => {
        const selectedYear = yearFilter.value;
        const filteredMovies = selectedYear === 'all' 
            ? movies 
            : movies.filter(movie => movie.year === parseInt(selectedYear));
        displayMovies(filteredMovies);
    });

    // تفعيل التقييم
    const ratingFilter = document.querySelector('.rating-filter');
    ratingFilter.addEventListener('change', () => {
        const selectedRating = ratingFilter.value;
        const filteredMovies = selectedRating === 'all' 
            ? movies 
            : movies.filter(movie => movie.rating >= parseInt(selectedRating));
        displayMovies(filteredMovies);
    });
};

// عرض الأفلام
function displayMovies(movies) {
    const mediaGrid = document.querySelector('.media-grid');
    mediaGrid.innerHTML = movies.map(movie => `
        <div class="media-card" onclick="window.location.href='movies-details.html?id=${movie.id}'">
            <div class="media-poster" style="background-image: url('${movie.posterPortraitUrl}');">
                <h3 class="media-title">${movie.title}</h3>
            </div>
        </div>
    `).join('');
}

// تحميل المحتوى عند بدء الصفحة
document.addEventListener('DOMContentLoaded', async () => {
    const contentDatabase = await getAllContentFromDB();
    const movies = contentDatabase.filter(item => item.type === 'movie');
    displayMovies(movies);
    setupFilters(movies);
});