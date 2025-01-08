// فتح قاعدة بيانات IndexedDB
const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('ContentDatabase', 16); // الإصدار 16

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('sections')) {
                db.createObjectStore('sections', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('categories')) {
                db.createObjectStore('categories', { keyPath: 'id' });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// إضافة قسم إلى IndexedDB
const addSectionToDB = async (section) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('sections', 'readwrite');
        const store = transaction.objectStore('sections');
        const request = store.add(section);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

// إضافة تصنيف إلى IndexedDB
const addCategoryToDB = async (category) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('categories', 'readwrite');
        const store = transaction.objectStore('categories');
        const request = store.add(category);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

// استرجاع جميع الأقسام من IndexedDB
const getAllSectionsFromDB = async () => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('sections', 'readonly');
        const store = transaction.objectStore('sections');
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// استرجاع جميع التصنيفات من IndexedDB
const getAllCategoriesFromDB = async () => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('categories', 'readonly');
        const store = transaction.objectStore('categories');
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// عرض الأقسام والتصنيفات
const updateItemsGrid = async () => {
    try {
        const sections = await getAllSectionsFromDB();
        const categories = await getAllCategoriesFromDB();
        const itemsGrid = document.getElementById('itemsGrid');
        const filter = document.getElementById('filterSelect').value;
        const searchText = document.getElementById('searchInput').value.toLowerCase();

        let items = [];

        if (filter === 'all' || filter === 'section') {
            items = items.concat(sections.map(section => ({ ...section, type: 'section' })));
        }
        if (filter === 'all' || filter === 'category') {
            items = items.concat(categories.map(category => ({ ...category, type: 'category' })));
        }

        // فلترة النتائج حسب البحث
        if (searchText) {
            items = items.filter(item => item.name.toLowerCase().includes(searchText));
        }

        itemsGrid.innerHTML = items.map(item => `
            <div class="item-card">
                <h3>${item.name}</h3>
                <p>${item.type === 'section' ? 'قسم' : 'تصنيف'}</p>
                <div class="item-actions">
                    <button class="edit-btn" onclick="editItem('${item.id}', '${item.type}')"><i class="fas fa-edit"></i> تعديل</button>
                    <button class="delete-btn" onclick="deleteItem('${item.id}', '${item.type}')"><i class="fas fa-trash"></i> حذف</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('حدث خطأ أثناء عرض الأقسام والتصنيفات:', error);
    }
};

// إضافة قسم جديد
const addSection = async () => {
    const sectionName = document.getElementById('sectionName').value;

    if (!sectionName) {
        alert('يرجى إدخال اسم القسم.');
        return;
    }

    const section = {
        id: uuid.v4(), // استخدام UUID من CDN
        name: sectionName
    };

    try {
        await addSectionToDB(section);
        await updateItemsGrid();
        document.getElementById('sectionName').value = ''; // مسح الحقل بعد الإضافة
        closeAddSectionModal(); // إغلاق النافذة المنبثقة بعد الإضافة
    } catch (error) {
        console.error('حدث خطأ أثناء إضافة القسم:', error);
        alert('حدث خطأ أثناء إضافة القسم. يرجى المحاولة مرة أخرى.');
    }
};

// إضافة تصنيف جديد
const addCategory = async () => {
    const categoryName = document.getElementById('categoryName').value;

    if (!categoryName) {
        alert('يرجى إدخال اسم التصنيف.');
        return;
    }

    const category = {
        id: uuid.v4(), // استخدام UUID من CDN
        name: categoryName
    };

    try {
        await addCategoryToDB(category);
        await updateItemsGrid();
        document.getElementById('categoryName').value = ''; // مسح الحقل بعد الإضافة
        closeAddCategoryModal(); // إغلاق النافذة المنبثقة بعد الإضافة
    } catch (error) {
        console.error('حدث خطأ أثناء إضافة التصنيف:', error);
        alert('حدث خطأ أثناء إضافة التصنيف. يرجى المحاولة مرة أخرى.');
    }
};

// التحميل الأولي للأقسام والتصنيفات
(async () => {
    await updateItemsGrid();
})();

// فتح وإغلاق النماذج
function openAddSectionModal() {
    document.getElementById('addSectionModal').style.display = 'flex';
}

function closeAddSectionModal() {
    document.getElementById('addSectionModal').style.display = 'none';
}

function openAddCategoryModal() {
    document.getElementById('addCategoryModal').style.display = 'flex';
}

function closeAddCategoryModal() {
    document.getElementById('addCategoryModal').style.display = 'none';
}

// فلترة الأقسام والتصنيفات
document.getElementById('searchInput').addEventListener('input', updateItemsGrid);
document.getElementById('filterSelect').addEventListener('change', updateItemsGrid);

// تعديل العنصر
function editItem(id, type) {
    if (type === 'section') {
        alert(`تعديل القسم ذو المعرف: ${id}`);
    } else if (type === 'category') {
        alert(`تعديل التصنيف ذو المعرف: ${id}`);
    }
}

// حذف العنصر
function deleteItem(id, type) {
    if (type === 'section') {
        if (confirm('هل أنت متأكد من حذف هذا القسم؟')) {
            deleteSectionFromDB(id).then(() => updateItemsGrid());
        }
    } else if (type === 'category') {
        if (confirm('هل أنت متأكد من حذف هذا التصنيف؟')) {
            deleteCategoryFromDB(id).then(() => updateItemsGrid());
        }
    }
}

// حذف قسم من IndexedDB
const deleteSectionFromDB = async (id) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('sections', 'readwrite');
        const store = transaction.objectStore('sections');
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

// حذف تصنيف من IndexedDB
const deleteCategoryFromDB = async (id) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('categories', 'readwrite');
        const store = transaction.objectStore('categories');
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

// إضافة أزرار فتح النوافذ المنبثقة
document.querySelector('.add-section-btn').addEventListener('click', openAddSectionModal);
document.querySelector('.add-category-btn').addEventListener('click', openAddCategoryModal);

// إضافة أزرار الإضافة داخل النوافذ المنبثقة
document.getElementById('sectionForm').addEventListener('submit', (e) => {
    e.preventDefault();
    addSection();
});

document.getElementById('categoryForm').addEventListener('submit', (e) => {
    e.preventDefault();
    addCategory();
});