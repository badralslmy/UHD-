// وظيفة لفتح قاعدة بيانات IndexedDB
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

// وظيفة لاسترجاع جميع المحتويات من IndexedDB
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

// وظيفة لعرض الأفلام المنشورة فقط
const showPublishedContent = async (searchQuery = '') => {
    try {
        const content = await getAllContentFromDB();
        const publishedContent = content.filter(item => item.status === 'تم نشره');
        const filteredContent = publishedContent.filter(item =>
            item.title.toLowerCase().includes(searchQuery.toLowerCase())
        );

        const contentGrid = document.getElementById('contentGrid');
        contentGrid.innerHTML = filteredContent.map(item => `
            <div class="content-item">
                <img src="${item.posterPortraitUrl}" alt="${item.title}" class="content-poster">
                <div class="content-info">
                    <h3 class="content-title">${item.title}</h3>
                    <div class="content-actions">
                        <button class="edit-btn" onclick="openModal(${item.id})">
                            <i class="fas fa-eye"></i> عرض التفاصيل
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('حدث خطأ أثناء عرض المحتوى المنشور:', error);
    }
};

// وظيفة لترجمة النص باستخدام DeepSeek API
const translateText = async (text) => {
    const apiKey = 'sk-2fcc9f1c37d54c20aae0a276a8a4455e'; // مفتاح API الخاص بك
    const apiUrl = 'https://api.deepseek.com/v3/translate'; // رابط API (افتراضي)

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                text: text,
                target_lang: 'ar' // الترجمة إلى العربية
            })
        });

        const data = await response.json();
        if (data.translated_text) {
            return data.translated_text; // إرجاع النص المترجم
        } else {
            throw new Error('فشل في الترجمة');
        }
    } catch (error) {
        console.error('حدث خطأ أثناء الترجمة:', error);
        return null;
    }
};

// وظيفة لفتح النافذة المنبثقة وعرض التفاصيل
const openModal = async (id) => {
    const content = await getAllContentFromDB();
    const selectedContent = content.find(item => item.id === id);

    if (selectedContent) {
        document.getElementById('modalTitle').textContent = selectedContent.title;
        document.getElementById('modalPoster').src = selectedContent.posterPortraitUrl;
        document.getElementById('modalDescription').textContent = selectedContent.description || 'لا يوجد وصف';
        document.getElementById('modalStatus').textContent = selectedContent.status || 'غير محدد';
        document.getElementById('modalPublishDate').textContent = selectedContent.publishDate || 'غير محدد';
        document.getElementById('modalVideoUrl').textContent = selectedContent.videoUrl || 'غير متوفر';
        document.getElementById('modalSubtitleUrl').textContent = selectedContent.subtitleUrl || 'غير متوفر';

        const modal = document.getElementById('detailsModal');
        modal.style.display = 'block';

        // إغلاق النافذة عند النقر على زر الإغلاق
        document.querySelector('.close').onclick = () => {
            modal.style.display = 'none';
        };

        // إغلاق النافذة عند النقر خارجها
        window.onclick = (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };

        // زر الترجمة
        document.getElementById('translateButton').onclick = async () => {
            const description = document.getElementById('modalDescription').textContent;
            if (description && description !== 'لا يوجد وصف') {
                const translatedText = await translateText(description);
                if (translatedText) {
                    document.getElementById('modalDescription').textContent = translatedText;
                } else {
                    alert('فشل في ترجمة النص.');
                }
            } else {
                alert('لا يوجد وصف لترجمته.');
            }
        };
    }
};

// تفعيل البحث
document.getElementById('searchInput').addEventListener('input', (e) => {
    const searchQuery = e.target.value;
    showPublishedContent(searchQuery);
});

// تحميل المحتوى المنشور عند التحميل
document.addEventListener('DOMContentLoaded', () => showPublishedContent());