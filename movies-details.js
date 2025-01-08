document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get('id');

    if (movieId) {
        loadMovieDetails(movieId);
    } else {
        console.error('لم يتم العثور على معرف الفيلم.');
    }

    let isScrolled = false;
    let isAnimationPlayed = false; // متغير لتتبع ما إذا كان الأنيميشن قد تم تشغيله

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50 && !isScrolled) {
            document.body.classList.add('scrolled');
            isScrolled = true; // التأثير يحدث مرة واحدة فقط
        }

        // التحقق من وصول المستخدم إلى قسم الاقتراحات
        const suggestionsSection = document.querySelector('.related-suggestions');
        const suggestionsPosition = suggestionsSection.getBoundingClientRect().top;

        if (suggestionsPosition < window.innerHeight * 0.8 && !isAnimationPlayed) { // عندما يصل المستخدم إلى 80% من ارتفاع الشاشة ولم يتم تشغيل الأنيميشن بعد
            suggestionsSection.classList.add('visible'); // إظهار القسم مع أنيميشن
            isAnimationPlayed = true; // تم تشغيل الأنيميشن، ولن يتكرر
            showTab('suggestions');
            document.querySelector('.tab-button[data-tab="suggestions"]').classList.add('active');
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

    // إخفاء قسم الأعمال المتعلقة بشكل افتراضي
    document.getElementById('relatedWorks').style.display = 'none';
});

const loadMovieDetails = async (id) => {
    const db = await openDB();
    const transaction = db.transaction('content', 'readonly');
    const store = transaction.objectStore('content');
    const request = store.get(parseInt(id));

    request.onsuccess = () => {
        const movie = request.result;
        if (movie) {
            document.getElementById('bannerPoster').style.backgroundImage = `url('${movie.posterLandscapeUrl}')`;
            document.getElementById('verticalPoster').style.backgroundImage = `url('${movie.posterPortraitUrl}')`;
            document.getElementById('movieTitle').textContent = movie.title;
            document.getElementById('movieDescription').textContent = movie.description;
            document.getElementById('movieYear').textContent = `السنة: ${movie.year}`;
            document.getElementById('movieRating').textContent = `التقييم: ${movie.rating}/10`;
            document.getElementById('movieCategories').textContent = `التصنيفات: ${movie.categories.join(', ')}`;

            // إضافة زر المشاهدة
            const watchButton = document.getElementById('watchButton');
            watchButton.onclick = () => {
                window.location.href = `player.html?id=${movie.id}&type=movie`;
            };

            // تحميل الاقتراحات
            loadSuggestions(movie.id);
        }
    };

    request.onerror = () => {
        console.error('حدث خطأ أثناء جلب بيانات الفيلم.');
    };
};

const loadSuggestions = async (currentMovieId) => {
    const db = await openDB();
    const transaction = db.transaction('content', 'readonly');
    const store = transaction.objectStore('content');
    const request = store.getAll();

    request.onsuccess = () => {
        const suggestions = request.result
            .filter(work => work.id !== currentMovieId) // تجنب عرض الفيلم الحالي
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

const showTab = (tab) => {
    const relatedWorks = document.getElementById('relatedWorks');
    const suggestions = document.getElementById('suggestions');

    if (tab === 'relatedWorks') {
        relatedWorks.style.display = 'grid'; // إظهار قسم الأعمال المتعلقة
        suggestions.style.display = 'none'; // إخفاء قسم الاقتراحات
    } else if (tab === 'suggestions') {
        relatedWorks.style.display = 'none'; // إخفاء قسم الأعمال المتعلقة
        suggestions.style.display = 'grid'; // إظهار قسم الاقتراحات
    }
};

const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('ContentDatabase', 16);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};