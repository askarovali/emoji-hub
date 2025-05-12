(async function() {
    const res = await fetch('/api/emoji');
    const emojis = await res.json();

    const grid           = document.getElementById('grid');
    const searchInput    = document.getElementById('search');
    const categorySelect = document.getElementById('category');
    const sortSelect     = document.getElementById('sort');

    function getFaves() {
        return JSON.parse(localStorage.getItem('favourites') || '[]');
    }
    function saveFaves(arr) {
        localStorage.setItem('favourites', JSON.stringify(arr));
    }

    const categories = Array.from(new Set(emojis.map(e => e.category))).sort();
    categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        categorySelect.append(opt);
    });

    function render(list) {
        const faves = getFaves();
        grid.innerHTML = list.map(e => `
            <div class="card ${faves.includes(e.name) ? 'selected' : ''}" data-id="${e.name}">
                <div class="symbol">${e.htmlCode[0]}</div>
                <div class="name">${e.name}</div>
            </div>
        `).join('');

        document.querySelectorAll('.card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.getAttribute('data-id');
                let f = getFaves();
                if (f.includes(id)) {
                    f = f.filter(x => x !== id);
                    card.classList.remove('selected');
                } else {
                    f.push(id);
                    card.classList.add('selected');
                }
                saveFaves(f);
                console.log('Favourites now:', f);
                alert(`Вы ${f.includes(id) ? 'добавили' : 'убрали'} «${id}» ${f.includes(id) ? 'в' : 'из'} moodboard`);
            });
        });
    }

    function update() {
        let list = [...emojis];
        const term = searchInput.value.toLowerCase();
        if (term) list = list.filter(e => e.name.toLowerCase().includes(term));
        const cat = categorySelect.value;
        if (cat)   list = list.filter(e => e.category === cat);
        const sort = sortSelect.value;
        if (sort === 'name-asc')  list.sort((a, b) => a.name.localeCompare(b.name));
        if (sort === 'name-desc') list.sort((a, b) => b.name.localeCompare(a.name));
        render(list);
    }

    update();
    searchInput.addEventListener('input', update);
    categorySelect.addEventListener('change', update);
    sortSelect.addEventListener('change', update);
})();
