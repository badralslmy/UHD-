// API Keys
const TMDB_API_KEY = '20fd5728c4cc777d323ce53d34299c39';
const TMDB_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyMGZkNTcyOGM0Y2M3NzdkMzIzY2U1M2QzNDI5OWMzOSIsInN1YiI6IjY3NzU4YjM0MDliODBmOWJiMzEyODI1MyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.niUZYHKjlGkW-cQUdkwvaZtxYRm6a-K82t57bGkLOdU';
const FANART_API_KEY = '2adb3d3494a5992ebbaf2ada4c313189';

// فتح قاعدة بيانات IndexedDB
const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('ContentDatabase', 16); // زيادة الإصدار إلى 3

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

// إضافة محتوى إلى IndexedDB
const addContentToDB = async (content) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('content', 'readwrite');
        const store = transaction.objectStore('content');
        const request = store.add(content);

        request.onsuccess = () => resolve();
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

// وظيفة للبحث في TMDB
async function searchTMDB(query) {
    const url = `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${TMDB_ACCESS_TOKEN}`,
            'Accept': 'application/json'
        }
    });
    const data = await response.json();
    return data.results;
}

// عرض نتائج البحث من TMDB
async function displayTMDBResults(results) {
    const tmdbResults = document.getElementById('tmdbResults');
    tmdbResults.innerHTML = '';

    for (const result of results) {
        const fanartImages = await getFanartImages(result.id, result.media_type === 'movie' ? 'movies' : 'tv');
        const posterUrl = fanartImages.movieposter ? fanartImages.movieposter[0].url : `https://image.tmdb.org/t/p/w500${result.poster_path}`;
        const backdropUrl = fanartImages.moviebackground ? fanartImages.moviebackground[0].url : `https://image.tmdb.org/t/p/w500${result.backdrop_path}`;

        const tmdbItem = document.createElement('div');
        tmdbItem.className = 'tmdb-item';
        tmdbItem.innerHTML = `
            <img src="${posterUrl}" alt="${result.title || result.name}" class="tmdb-poster">
            <div class="tmdb-info">
                <h3 class="tmdb-title">${result.title || result.name}</h3>
                <p class="tmdb-type">${result.media_type === 'movie' ? 'فيلم' : 'مسلسل'}</p>
                <button class="add-tmdb-btn" onclick="addContentFromTMDB(${JSON.stringify(result).replace(/"/g, '&quot;')})">إضافة إلى المحتوى</button>
            </div>
        `;
        tmdbResults.appendChild(tmdbItem);
    }
}

// إضافة محتوى من TMDB إلى قاعدة البيانات المحلية
async function addContentFromTMDB(result) {
    try {
        const fanartImages = await getFanartImages(result.id, result.media_type === 'movie' ? 'movies' : 'tv');
        const posterPortraitUrl = fanartImages.movieposter ? fanartImages.movieposter[0].url : `https://image.tmdb.org/t/p/w500${result.poster_path}`;
        const posterLandscapeUrl = fanartImages.moviebackground ? fanartImages.moviebackground[0].url : `https://image.tmdb.org/t/p/w500${result.backdrop_path}`;

        // جلب التصنيفات من TMDB
        const genres = await getTMDBGenres(result.media_type === 'movie' ? 'movie' : 'tv');
        const categories = result.genre_ids.map(id => genres.find(genre => genre.id === id).name);

        // تحديد نوع المحتوى
        const type = result.media_type === 'movie' ? 'movie' : 'series';

        const content = {
            id: Date.now(), // إنشاء معرف فريد
            title: result.title || result.name,
            type: type, // تحديد النوع بناءً على media_type
            categories: categories, // إضافة التصنيفات
            description: result.overview,
            year: result.release_date ? new Date(result.release_date).getFullYear() : new Date(result.first_air_date).getFullYear(),
            rating: result.vote_average, // استخدام تقييم TMDB مباشرة
            posterPortraitUrl: posterPortraitUrl,
            posterLandscapeUrl: posterLandscapeUrl,
            seasons: type === 'series' ? [] : null, // يمكن إضافة المواسم يدويًا لاحقًا
            dateAdded: new Date()
        };

        // إضافة المحتوى إلى قاعدة البيانات المحلية
        await addContentToDB(content);

        // رسالة نجاح
        alert('تم إضافة المحتوى بنجاح!');
        window.location.href = 'edit.html';
    } catch (error) {
        console.error('حدث خطأ أثناء إضافة المحتوى:', error);
        alert('حدث خطأ أثناء إضافة المحتوى. يرجى المحاولة مرة أخرى.');
    }
}

// البحث في TMDB عند النقر على زر البحث
document.getElementById('tmdbSearchBtn').addEventListener('click', async () => {
    const query = document.getElementById('tmdbSearchInput').value;
    if (query) {
        try {
            const results = await searchTMDB(query);
            displayTMDBResults(results);
        } catch (error) {
            console.error('حدث خطأ أثناء البحث:', error);
        }
    } else {
        alert('يرجى إدخال كلمة بحث.');
    }
});

// وظيفة لجلب الصور من fanart.tv
async function getFanartImages(tmdbId, type) {
    const url = `https://webservice.fanart.tv/v3/${type}/${tmdbId}?api_key=${FANART_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
}

// وظيفة لجلب التصنيفات من TMDB
async function getTMDBGenres(type) {
    const url = `https://api.themoviedb.org/3/genre/${type}/list?api_key=${TMDB_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.genres;
}