(async function() {
    const previewArea   = document.getElementById('preview');
    const idsArea       = document.getElementById('ids');
    const genBtn        = document.getElementById('genBtn');
    const exportBtn     = document.getElementById('exportBtn');
    const shareBtn      = document.getElementById('shareBtn');
    const mixBtn        = document.getElementById('mixBtn');
    const resultBox     = document.getElementById('result');
    const mixResultDiv  = document.getElementById('mixResult');
    const canvas        = document.getElementById('canvas');

    function getFaves() {
        return JSON.parse(localStorage.getItem('favourites') || '[]');
    }

    function saveFaves(arr) {
        localStorage.setItem('favourites', JSON.stringify(arr));
    }

    function syncState() {
        const ids = Array.from(canvas.children).map(el => el.getAttribute('data-id'));
        saveFaves(ids);
        renderPreview();
    }

    function renderPreview() {
        const favourites = getFaves();
        previewArea.innerHTML = favourites.map(id => `
            <span class="preview-item" data-id="${id}">
                ${id} <span class="remove">×</span>
            </span>
        `).join('');
        idsArea.value = favourites.join(',');

        document.querySelectorAll('.preview-item .remove').forEach(btn => {
            btn.addEventListener('click', e => {
                const parent = e.target.parentElement;
                const id     = parent.getAttribute('data-id');
                const newF   = getFaves().filter(x => x !== id);
                saveFaves(newF);
                renderPreview();
            });
        });
    }

    Sortable.create(canvas, {
        group: 'moodboard',
        animation: 150,
        onAdd:    () => syncState(),
        onUpdate: () => syncState()
    });

    window.addEventListener('focus', () => {
        const favourites = getFaves();
        canvas.innerHTML = favourites.map(id => `
            <span class="preview-item" data-id="${id}">
                ${id} <span class="remove">×</span>
            </span>
        `).join('');
        renderPreview();
    });

    // начальный рендер
    renderPreview();

    // 1) Генерация текстового описания
    genBtn.addEventListener('click', async () => {
        const ids = getFaves();
        if (!ids.length) {
            alert('Сначала выберите эмодзи в каталоге!');
            return;
        }
        try {
            const res  = await fetch('/api/moodboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids })
            });
            const data = await res.json();
            resultBox.textContent = data.description || data.error;
        } catch (e) {
            console.error('Ошибка при запросе описания:', e);
            resultBox.textContent = 'Ошибка при генерации описания.';
        }
    });

    // 2) Экспорт как PNG
    exportBtn.addEventListener('click', () => {
        html2canvas(canvas).then(canvasEl => {
            const link = document.createElement('a');
            link.download = 'moodboard.png';
            link.href = canvasEl.toDataURL();
            link.click();
        });
    });

    // 3) Web Share API
    shareBtn.addEventListener('click', async () => {
        const ids = getFaves();
        if (!ids.length) {
            alert('Сначала выберите эмодзи в каталоге!');
            return;
        }
        try {
            await navigator.share({
                title: 'My MoodBoard',
                text: ids.join(', '),
                url : `${window.location.origin}/moodboard.html?ids=${encodeURIComponent(ids.join(','))}`
            });
        } catch (err) {
            console.error('Share failed:', err);
        }
    });

    // 4) Mixed-Emoji (DALL·E)
    mixBtn.addEventListener('click', async () => {
        mixBtn.disabled = true;
        mixBtn.textContent = 'Mixing…';

        const ids = getFaves();
        if (!ids.length) {
            alert('Сначала выберите эмодзи в каталоге!');
            mixBtn.disabled = false;
            mixBtn.textContent = 'Mix';
            return;
        }

        try {
            const resp = await fetch('/api/mix', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids })
            });
            if (!resp.ok) throw new Error(resp.statusText);

            const { imageUrl } = await resp.json();
            mixResultDiv.innerHTML = `<img src="${imageUrl}" alt="Mixed emoji" />`;
        } catch (err) {
            console.error('Mix error:', err);
            alert('Ошибка при генерации микса эмодзи');
        } finally {
            mixBtn.disabled = false;
            mixBtn.textContent = 'Mix';
        }
    });

})();
