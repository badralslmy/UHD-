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

document.addEventListener('DOMContentLoaded', async () => {
    const contentDatabase = await getAllContentFromDB();

    if (contentDatabase.length > 0) {
        // عرض 5 أعمال عشوائية في البانر
        const bannerContents = getRandomContents(contentDatabase, 5);
        displayBanner(bannerContents);

        // عرض أحدث الأفلام (15 فيلمًا)
        const latestMovies = contentDatabase
            .filter(item => item.type === 'movie')
            .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))
            .slice(0, 15); // عرض 15 فيلمًا
        displayMovies(latestMovies, 'latest-movies-grid');

        // عرض أشهر الأفلام (15 فيلمًا)
        const popularMovies = contentDatabase
            .filter(item => item.type === 'movie')
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 15); // عرض 15 فيلمًا
        displayMovies(popularMovies, 'popular-movies-grid');

        // عرض أحدث المسلسلات (15 مسلسلًا)
        const latestSeries = contentDatabase
            .filter(item => item.type === 'series')
            .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))
            .slice(0, 15); // عرض 15 مسلسلًا
        displaySeries(latestSeries, 'latest-series-grid');

        // عرض أشهر المسلسلات (15 مسلسلًا)
        const popularSeries = contentDatabase
            .filter(item => item.type === 'series')
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 15); // عرض 15 مسلسلًا
        displaySeries(popularSeries, 'popular-series-grid');
    }
});

// الحصول على أعمال عشوائية
function getRandomContents(contents, count) {
    const shuffled = contents.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// عرض البانر مع 5 أعمال (بدون وصف العمل)
function displayBanner(contents) {
    const bannerSlider = document.getElementById('bannerSlider');
    if (bannerSlider) {
        bannerSlider.innerHTML = contents.map((content, index) => `
            <div class="slide ${index === 0 ? 'active' : ''}">
                <img src="${content.posterLandscapeUrl}" alt="${content.title}">
                <div class="slide-content">
                    <h2>${content.title}</h2>
                    <div class="categories">
                        ${content.categories.map(category => `
                            <span class="category-tag">${category}</span>
                        `).join('')}
                    </div>
                    <div class="content-rating">
                        <span>التقييم: </span>
                        ${content.rating}/10
                    </div>
                    <button class="watch-btn" onclick="window.location.href='movies-details.html?id=${content.id}'">مشاهدة الآن</button>
                </div>
            </div>
        `).join('');

        // تفعيل تحريك البانر
        let currentSlide = 0;
        const slides = document.querySelectorAll('.slide');
        setInterval(() => {
            slides[currentSlide].classList.remove('active');
            currentSlide = (currentSlide + 1) % slides.length;
            slides[currentSlide].classList.add('active');
        }, 5000); // تحريك البانر كل 5 ثوانٍ
    }
}

// عرض الأفلام
function displayMovies(movies, gridId) {
    const grid = document.getElementById(gridId);
    if (grid) {
        grid.innerHTML = movies.map(movie => `
            <div class="movie-card" onclick="window.location.href='movies-details.html?id=${movie.id}'">
                <img src="${movie.posterPortraitUrl}" alt="${movie.title}" class="movie-poster">
                <h3>${movie.title}</h3>
            </div>
        `).join('');
    }
}

// عرض المسلسلات
function displaySeries(series, gridId) {
    const grid = document.getElementById(gridId);
    if (grid) {
        grid.innerHTML = series.map(serie => `
            <div class="movie-card" onclick="window.location.href='series-details.html?id=${serie.id}'">
                <img src="${serie.posterPortraitUrl}" alt="${serie.title}" class="movie-poster">
                <h3>${serie.title}</h3>
            </div>
        `).join('');
    }
}