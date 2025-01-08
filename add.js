// فتح قاعدة بيانات IndexedDB
const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('ContentDatabase', 16); // الإصدار 3

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
        const request = store.add(content); // استخدم add لإضافة محتوى جديد

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

// تحديث محتوى في IndexedDB
const updateContentInDB = async (content) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('content', 'readwrite');
        const store = transaction.objectStore('content');
        const request = store.put(content); // استخدم put لتحديث محتوى موجود

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

// استرجاع محتوى معين من IndexedDB
const getContentFromDB = async (id) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('content', 'readonly');
        const store = transaction.objectStore('content');
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// تحميل المحتوى المراد تعديله
const loadContentForEdit = async (id) => {
    try {
        const content = await getContentFromDB(id);

        if (content) {
            // تعبئة الحقول بالمحتوى المراد تعديله
            document.getElementById('title').value = content.title;
            document.querySelector(`input[name="type"][value="${content.type}"]`).checked = true;
            document.getElementById('description').value = content.description;
            document.getElementById('year').value = content.year;
            document.getElementById('rating').value = content.rating;

            // تحميل التصنيفات
            const categoriesSelect = document.getElementById('categoriesSelect');
            categoriesSelect.innerHTML = ''; // تفريغ القائمة قبل التحميل
            content.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categoriesSelect.appendChild(option);
            });

            // تحميل البوستر العمودي والأفقي
            document.getElementById('posterPortraitPreview').innerHTML = `<img src="${content.posterPortraitUrl}" alt="معاينة البوستر العمودي">`;
            document.getElementById('posterLandscapePreview').innerHTML = `<img src="${content.posterLandscapeUrl}" alt="معاينة البوستر الأفقي">`;

            // تحميل المواسم والحلقات (إذا كان نوع العمل مسلسل أو أنمي)
            if (content.type === 'series' || content.type === 'anime') {
                document.getElementById('seasonGroup').style.display = 'block';
                content.seasons.forEach(season => {
                    addSeason(season.seasonName);
                    season.episodes.forEach(episode => {
                        addEpisode(document.querySelector('.season:last-child .episodes'), episode);
                    });
                });
            }

            // تغيير نص زر الإضافة إلى "تحديث المحتوى"
            const submitBtn = document.querySelector('.submit-btn');
            submitBtn.textContent = 'تحديث المحتوى';
            submitBtn.onclick = async () => {
                const updatedContent = {
                    id: content.id,
                    title: document.getElementById('title').value,
                    type: document.querySelector('input[name="type"]:checked').value,
                    categories: Array.from(document.getElementById('categoriesSelect').selectedOptions).map(option => option.value),
                    description: document.getElementById('description').value,
                    year: document.getElementById('year').value,
                    rating: parseFloat(document.getElementById('rating').value),
                    posterPortraitUrl: content.posterPortraitUrl,
                    posterLandscapeUrl: content.posterLandscapeUrl,
                    seasons: content.type === 'series' || content.type === 'anime' ? getSeasonsData() : null,
                    dateAdded: content.dateAdded,
                    status: content.status
                };

                try {
                    await updateContentInDB(updatedContent);
                    alert('تم تعديل المحتوى بنجاح!');
                    window.location.href = 'edit.html';
                } catch (error) {
                    console.error('حدث خطأ أثناء التعديل:', error);
                    alert('حدث خطأ أثناء التعديل. يرجى المحاولة مرة أخرى.');
                }
            };
        }
    } catch (error) {
        console.error('حدث خطأ أثناء تحميل المحتوى:', error);
    }
};

// إضافة موسم جديد
const addSeason = (seasonName = '') => {
    const seasonDiv = document.createElement('div');
    seasonDiv.className = 'season';

    // اسم الموسم
    const seasonNameInput = document.createElement('input');
    seasonNameInput.type = 'text';
    seasonNameInput.className = 'seasonName';
    seasonNameInput.value = seasonName;
    seasonNameInput.placeholder = 'اسم الموسم';
    seasonNameInput.disabled = true; // تعطيل التعديل بشكل افتراضي
    seasonDiv.appendChild(seasonNameInput);

    // زر تعديل الموسم
    const editSeasonBtn = document.createElement('button');
    editSeasonBtn.type = 'button';
    editSeasonBtn.className = 'editSeasonBtn';
    editSeasonBtn.textContent = 'تعديل الموسم';
    editSeasonBtn.onclick = () => {
        seasonNameInput.disabled = !seasonNameInput.disabled; // تفعيل/تعطيل تعديل اسم الموسم
        if (seasonNameInput.disabled) {
            // إذا تم تعطيل التعديل، يتم حفظ التغييرات
            saveSeason(seasonDiv);
        }
    };
    seasonDiv.appendChild(editSeasonBtn);

    // زر حذف الموسم
    const removeSeasonBtn = document.createElement('button');
    removeSeasonBtn.type = 'button';
    removeSeasonBtn.className = 'removeSeasonBtn';
    removeSeasonBtn.textContent = 'حذف الموسم';
    removeSeasonBtn.onclick = () => seasonDiv.remove();
    seasonDiv.appendChild(removeSeasonBtn);

    // زر حفظ الموسم
    const saveSeasonBtn = document.createElement('button');
    saveSeasonBtn.type = 'button';
    saveSeasonBtn.className = 'saveSeasonBtn';
    saveSeasonBtn.textContent = 'حفظ الموسم';
    saveSeasonBtn.onclick = () => saveSeason(seasonDiv);
    seasonDiv.appendChild(saveSeasonBtn);

    // قائمة الحلقات
    const episodesDiv = document.createElement('div');
    episodesDiv.className = 'episodes';
    seasonDiv.appendChild(episodesDiv);

    // زر إضافة حلقة
    const addEpisodeBtn = document.createElement('button');
    addEpisodeBtn.type = 'button';
    addEpisodeBtn.className = 'addEpisodeBtn';
    addEpisodeBtn.textContent = '+ إضافة حلقة';
    addEpisodeBtn.onclick = () => addEpisode(episodesDiv);
    seasonDiv.appendChild(addEpisodeBtn);

    // إضافة الموسم إلى القائمة
    document.getElementById('seasonsContainer').appendChild(seasonDiv);
};

// إضافة حلقة جديدة
const addEpisode = (episodesDiv, episodeUrl = '') => {
    const episodeDiv = document.createElement('div');
    episodeDiv.className = 'episode';

    const episodeInput = document.createElement('input');
    episodeInput.type = "text";
    episodeInput.className = "episodeUrl";
    episodeInput.placeholder = "رابط الحلقة أو اسم الحلقة";
    episodeInput.value = episodeUrl;
    episodeDiv.appendChild(episodeInput);

    // زر حذف الحلقة
    const removeEpisodeBtn = document.createElement('button');
    removeEpisodeBtn.type = 'button';
    removeEpisodeBtn.className = 'removeEpisodeBtn';
    removeEpisodeBtn.textContent = 'حذف الحلقة';
    removeEpisodeBtn.onclick = () => episodeDiv.remove();
    episodeDiv.appendChild(removeEpisodeBtn);

    episodesDiv.appendChild(episodeDiv);
};

// حفظ الموسم
const saveSeason = (seasonDiv) => {
    const seasonName = seasonDiv.querySelector('.seasonName').value;
    const episodes = Array.from(seasonDiv.querySelectorAll('.episodeUrl')).map(episode => episode.value);

    if (seasonName && episodes.length > 0) {
        alert('تم حفظ الموسم بنجاح!');
    } else {
        alert('يرجى إدخال اسم الموسم وحلقاته.');
    }
};

// جمع بيانات المواسم
const getSeasonsData = () => {
    const seasons = [];
    document.querySelectorAll('.season').forEach(season => {
        const seasonName = season.querySelector('.seasonName').value;
        const episodes = Array.from(season.querySelectorAll('.episodeUrl')).map(episode => episode.value);
        if (seasonName && episodes.length > 0) {
            seasons.push({ seasonName, episodes });
        }
    });
    return seasons;
};

// معاينة البوستر العمودي
document.getElementById('posterPortrait').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('posterPortraitPreview').innerHTML = `<img src="${e.target.result}" alt="معاينة البوستر العمودي">`;
        };
        reader.readAsDataURL(file);
    }
});

// معاينة البوستر الأفقي
document.getElementById('posterLandscape').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('posterLandscapePreview').innerHTML = `<img src="${e.target.result}" alt="معاينة البوستر الأفقي">`;
        };
        reader.readAsDataURL(file);
    }
});

// إظهار/إخفاء قسم المواسم عند اختيار مسلسل أو أنمي
document.querySelectorAll('input[name="type"]').forEach(input => {
    input.addEventListener('change', () => {
        if (input.value === 'series' || input.value === 'anime') {
            document.getElementById('seasonGroup').style.display = 'block';
        } else {
            document.getElementById('seasonGroup').style.display = 'none';
        }
    });
});

// إضافة موسم افتراضي عند الضغط على زر إضافة موسم
document.querySelector('.addSeasonBtn').addEventListener('click', () => addSeason());

// قائمة التصنيفات الافتراضية
const defaultCategories = ["أكشن", "دراما", "كوميدي", "رومانسي", "خيال علمي", "رعب"];

// تحميل التصنيفات في القائمة المنسدلة
const loadCategories = () => {
    const categoriesSelect = document.getElementById('categoriesSelect');
    defaultCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoriesSelect.appendChild(option);
    });
};

// إضافة تصنيف جديد
document.getElementById('addCategoryBtn').addEventListener('click', () => {
    const newCategoryInput = document.getElementById('newCategory');
    const newCategory = newCategoryInput.value.trim();

    if (newCategory) {
        const categoriesSelect = document.getElementById('categoriesSelect');
        const option = document.createElement('option');
        option.value = newCategory;
        option.textContent = newCategory;
        categoriesSelect.appendChild(option);

        // تفريغ حقل الإدخال بعد الإضافة
        newCategoryInput.value = '';
    } else {
        alert('يرجى إدخال اسم تصنيف صحيح.');
    }
});

// تحميل التصنيفات عند بدء التشغيل
window.addEventListener('load', () => {
    loadCategories();
});

// تحميل المحتوى المراد تعديله عند فتح الصفحة
const urlParams = new URLSearchParams(window.location.search);
const editId = urlParams.get('edit');
if (editId) {
    loadContentForEdit(parseInt(editId));
}

// إضافة محتوى جديد أو تحديث محتوى موجود
document.getElementById('contentForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('title').value;
    const type = document.querySelector('input[name="type"]:checked').value;
    const categories = Array.from(document.getElementById('categoriesSelect').selectedOptions).map(option => option.value);
    const description = document.getElementById('description').value;
    const year = document.getElementById('year').value;
    const rating = document.getElementById('rating').value;
    const posterPortraitFile = document.getElementById('posterPortrait').files[0];
    const posterLandscapeFile = document.getElementById('posterLandscape').files[0];

    if (!title || !type || !description || !year || !rating || !posterPortraitFile || !posterLandscapeFile) {
        alert('يرجى ملء جميع الحقول المطلوبة.');
        return;
    }

    const readerPortrait = new FileReader();
    const readerLandscape = new FileReader();

    readerPortrait.onload = async (e) => {
        readerLandscape.onload = async (e2) => {
            const newContent = {
                id: editId ? parseInt(editId) : Date.now(), // إذا كان هناك editId، استخدمه، وإلا استخدم تاريخ جديد
                title,
                type,
                categories,
                description,
                year,
                rating: parseFloat(rating),
                posterPortraitUrl: e.target.result,
                posterLandscapeUrl: e2.target.result,
                seasons: type === 'series' || type === 'anime' ? getSeasonsData() : null,
                dateAdded: new Date(),
                status: 'لم يتم نشره'
            };

            try {
                if (editId) {
                    await updateContentInDB(newContent);
                    alert('تم تعديل المحتوى بنجاح!');
                } else {
                    await addContentToDB(newContent);
                    alert('تم إضافة المحتوى بنجاح!');
                }
                window.location.href = 'edit.html';
            } catch (error) {
                console.error('حدث خطأ أثناء إضافة/تعديل المحتوى:', error);
                alert('حدث خطأ أثناء إضافة/تعديل المحتوى. يرجى المحاولة مرة أخرى.');
            }
        };
        readerLandscape.readAsDataURL(posterLandscapeFile);
    };
    readerPortrait.readAsDataURL(posterPortraitFile);
});