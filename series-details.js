document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const seriesId = urlParams.get('id');

    if (seriesId) {
        loadSeriesDetails(seriesId);
    } else {
        console.error('لم يتم العثور على معرف المسلسل.');
    }

    let isScrolled = false;
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50 && !isScrolled) {
            document.body.classList.add('scrolled');
            isScrolled = true;
        }
    });

    // إضافة حدث لتبديل الأقسام
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tab = button.getAttribute('data-tab');
            showTab(tab);
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });
});

const loadSeriesDetails = async (id) => {
    const db = await openDB();
    const transaction = db.transaction('content', 'readonly');
    const store = transaction.objectStore('content');
    const request = store.get(parseInt(id));

    request.onsuccess = () => {
        const series = request.result;
        if (series) {
            const bannerPosterUrl = series.posterLandscapeUrl; // صورة البوستر الأفقي
            document.getElementById('bannerPoster').style.backgroundImage = `url('${bannerPosterUrl}')`;
            document.getElementById('verticalPoster').style.backgroundImage = `url('${series.posterPortraitUrl}')`;
            document.getElementById('seriesTitle').textContent = series.title;
            document.getElementById('seriesDescription').textContent = series.description;
            document.getElementById('seriesYear').textContent = `السنة: ${series.year}`;
            document.getElementById('seriesRating').textContent = `التقييم: ${series.rating}/10`;
            document.getElementById('seriesCategories').textContent = `التصنيفات: ${series.categories.join(', ')}`;

            displaySeasons(series.seasons, series.id, bannerPosterUrl); // تمرير صورة البوستر الأفقي
            loadRelatedWorks(series.categories, series.id);
            loadSuggestions(series.id);

            // عرض المواسم بشكل افتراضي
            showTab('seasons');
        }
    };

    request.onerror = () => {
        console.error('حدث خطأ أثناء جلب بيانات المسلسل.');
    };
};

const displaySeasons = (seasons, seriesId, bannerPosterUrl) => {
    const seasonDropdown = document.getElementById('seasonDropdown');
    const episodesContainer = document.getElementById('episodesContainer');

    // إضافة المواسم إلى القائمة المنسدلة
    seasons.forEach(season => {
        const option = document.createElement('option');
        option.value = season.seasonNumber;
        option.textContent = `الموسم ${season.seasonNumber}`;
        seasonDropdown.appendChild(option);
    });

    // إضافة حدث لتغيير الموسم
    seasonDropdown.addEventListener('change', (event) => {
        const selectedSeasonNumber = event.target.value;
        if (selectedSeasonNumber) {
            const selectedSeason = seasons.find(season => season.seasonNumber == selectedSeasonNumber);
            displayEpisodes(selectedSeason.episodes, seriesId, selectedSeasonNumber, bannerPosterUrl); // تمرير صورة البوستر الأفقي
        } else {
            episodesContainer.innerHTML = ''; // إفراغ الحلقات إذا لم يتم اختيار موسم
        }
    });
};

const displayEpisodes = (episodes, seriesId, seasonNumber, bannerPosterUrl) => {
    const episodesContainer = document.getElementById('episodesContainer');
    episodesContainer.innerHTML = episodes.map((episode, index) => {
        return `
            <div class="episode" onclick="playEpisode(${seriesId}, ${seasonNumber}, ${index + 1})">
                <img src="${bannerPosterUrl}" alt="${episode.title}">
                <span>الحلقة ${index + 1}</span>
                <h3>${episode.title}</h3>
            </div>
        `;
    }).join('');
};

const loadRelatedWorks = async (categories, currentSeriesId) => {
    const db = await openDB();
    const transaction = db.transaction('content', 'readonly');
    const store = transaction.objectStore('content');
    const request = store.getAll();

    request.onsuccess = () => {
        const relatedWorks = request.result.filter(series => 
            series.categories.some(cat => categories.includes(cat)) && series.id !== currentSeriesId
        ).slice(0, 8); // عرض أول 8 أعمال متعلقه

        const relatedWorksContainer = document.getElementById('relatedWorks');
        relatedWorksContainer.innerHTML = ''; // مسح المحتوى القديم

        relatedWorks.forEach(work => {
            const workElement = document.createElement('div');
            workElement.classList.add('movie-item');

            const img = document.createElement('img');
            img.src = work.posterPortraitUrl;
            img.alt = work.title;

            // إضافة حدث النقر لنقل المستخدم إلى صفحة التفاصيل المناسبة
            workElement.addEventListener('click', () => {
                if (work.type === 'series') {
                    window.location.href = `series-details.html?id=${work.id}`;
                } else if (work.type === 'movie') {
                    window.location.href = `movies-details.html?id=${work.id}`;
                }
            });

            workElement.appendChild(img);
            relatedWorksContainer.appendChild(workElement);
        });
    };
};

const loadSuggestions = async (currentSeriesId) => {
    const db = await openDB();
    const transaction = db.transaction('content', 'readonly');
    const store = transaction.objectStore('content');
    const request = store.getAll();

    request.onsuccess = () => {
        const suggestions = request.result
            .filter(series => series.id !== currentSeriesId) // تجنب عرض المسلسل الحالي
            .sort(() => 0.5 - Math.random()) // ترتيب عشوائي
            .slice(0, 8); // عرض أول 8 اقتراحات

        const suggestionsContainer = document.getElementById('suggestions');
        suggestionsContainer.innerHTML = ''; // مسح المحتوى القديم

        suggestions.forEach(work => {
            const workElement = document.createElement('div');
            workElement.classList.add('movie-item');

            const img = document.createElement('img');
            img.src = work.posterPortraitUrl;
            img.alt = work.title;

            // إضافة حدث النقر لنقل المستخدم إلى صفحة التفاصيل المناسبة
            workElement.addEventListener('click', () => {
                if (work.type === 'series') {
                    window.location.href = `series-details.html?id=${work.id}`;
                } else if (work.type === 'movie') {
                    window.location.href = `movies-details.html?id=${work.id}`;
                }
            });

            workElement.appendChild(img);
            suggestionsContainer.appendChild(workElement);
        });
    };
};

const playEpisode = (seriesId, seasonNumber, episodeNumber) => {
    window.location.href = `player.html?id=${seriesId}&type=episode&season=${seasonNumber}&episode=${episodeNumber}`;
};

const showTab = (tab) => {
    const relatedWorks = document.getElementById('relatedWorks');
    const suggestions = document.getElementById('suggestions');
    const seasonsContainer = document.getElementById('seasonsContainer');

    if (tab === 'relatedWorks') {
        relatedWorks.style.display = 'grid';
        suggestions.style.display = 'none';
        seasonsContainer.style.display = 'none';
    } else if (tab === 'suggestions') {
        relatedWorks.style.display = 'none';
        suggestions.style.display = 'grid';
        seasonsContainer.style.display = 'none';
    } else if (tab === 'seasons') {
        relatedWorks.style.display = 'none';
        suggestions.style.display = 'none';
        seasonsContainer.style.display = 'block';
    }
};

const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('ContentDatabase', 16);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

document.getElementById('seriesDescription').textContent = movie.description;
document.getElementById('seriesDescription').classList.add('bold-text'); // إضافة كلاس