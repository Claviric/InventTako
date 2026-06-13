lucide.createIcons();
        window.addEventListener('load', () => lucide.createIcons());

        // Cek apakah user sudah login atau belum
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Akses ditolak! Silakan login dulu.');
            window.location.href = 'login.html';
        }

        function handleLogout() {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        }

        function confirmLogout() {
            const modal = document.getElementById('logoutConfirmModal');
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }

        function cancelLogout() {
            const modal = document.getElementById('logoutConfirmModal');
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
        
        let allItems = [];
        let filteredItemsList = [];
        let currentPage = 1;
        const itemsPerPage = 5;

        async function fetchItems() {
            try {
                const response = await fetch('http://localhost:3000/api/items', {
                    headers: { 'Authorization': 'Bearer ' + token }
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        alert('Sesi kadaluarsa, silakan login kembali.');
                        handleLogout();
                    }
                    throw new Error('Gagal mengambil data barang');
                }

                const items = await response.json();
                allItems = items;
                filteredItemsList = items;
                currentPage = 1;
                renderItems();
            } catch (error) {
                console.error(error);
                document.getElementById('tableBody').innerHTML = '<tr><td colspan="7" class="text-center py-4 text-red-500">Gagal memuat data. Pastikan server menyala.</td></tr>';
            }
        }

        function formatRupiah(number) {
            return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
        }

        function renderPaginationControls(totalItems) {
            const controlsContainer = document.getElementById('paginationControls');
            controlsContainer.innerHTML = '';
            
            const totalPages = Math.ceil(totalItems / itemsPerPage);
            if (totalPages <= 1) {
                controlsContainer.innerHTML = `
                    <button disabled class="p-1 rounded text-slate-300 cursor-not-allowed">
                        <i data-lucide="chevron-left" class="w-4 h-4"></i>
                    </button>
                    <button disabled class="p-1 rounded text-slate-300 cursor-not-allowed">
                        <i data-lucide="chevron-right" class="w-4 h-4"></i>
                    </button>
                `;
                lucide.createIcons();
                return;
            }
            
            // Prev Button
            const prevDisabled = currentPage === 1;
            const prevBtn = document.createElement('button');
            prevBtn.className = `p-1 rounded ${prevDisabled ? 'text-slate-300 cursor-not-allowed' : 'hover:bg-slate-100 text-slate-800'}`;
            prevBtn.disabled = prevDisabled;
            prevBtn.innerHTML = `<i data-lucide="chevron-left" class="w-4 h-4"></i>`;
            if (!prevDisabled) {
                prevBtn.addEventListener('click', () => {
                    currentPage--;
                    renderItems();
                });
            }
            controlsContainer.appendChild(prevBtn);
            
            // Next Button
            const nextDisabled = currentPage === totalPages;
            const nextBtn = document.createElement('button');
            nextBtn.className = `p-1 rounded ${nextDisabled ? 'text-slate-300 cursor-not-allowed' : 'hover:bg-slate-100 text-slate-800'}`;
            nextBtn.disabled = nextDisabled;
            nextBtn.innerHTML = `<i data-lucide="chevron-right" class="w-4 h-4"></i>`;
            if (!nextDisabled) {
                nextBtn.addEventListener('click', () => {
                    currentPage++;
                    renderItems();
                });
            }
            controlsContainer.appendChild(nextBtn);
            
            lucide.createIcons();
        }

        function renderItems(items) {
            if (items !== undefined) {
                filteredItemsList = items;
                currentPage = 1;
            }

            const tableBody = document.getElementById('tableBody');
            tableBody.innerHTML = '';

            let totalValuation = 0;
            // Hitung aset & valuasi berdasarkan semua data yang terfilter
            filteredItemsList.forEach(item => {
                const harga = parseFloat(item.harga);
                totalValuation += (harga * item.stok);
            });
            let totalAssets = filteredItemsList.length;

            document.getElementById('totalAssets').textContent = totalAssets;
            document.getElementById('totalValuation').textContent = formatRupiah(totalValuation);

            if (filteredItemsList.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-slate-500">Belum ada barang yang ditambahkan.</td></tr>';
                document.getElementById('paginationText').textContent = 'Menampilkan 0 barang';
                renderPaginationControls(0);
                return;
            }

            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = Math.min(startIndex + itemsPerPage, filteredItemsList.length);
            const paginatedItems = filteredItemsList.slice(startIndex, endIndex);

            document.getElementById('paginationText').textContent = `Menampilkan ${startIndex + 1} - ${endIndex} dari ${filteredItemsList.length} barang`;

            paginatedItems.forEach(item => {
                const harga = parseFloat(item.harga);

                let statusBadge = '';
                if (item.stok > 5) {
                    statusBadge = '<span class="bg-[#22c55e] text-white px-3 py-1 rounded text-xs font-medium">Tersedia</span>';
                } else if (item.stok > 0) {
                    statusBadge = '<span class="bg-amber-500 text-white px-3 py-1 rounded text-xs font-medium">Menipis</span>';
                } else {
                    statusBadge = '<span class="bg-red-600 text-white px-3 py-1 rounded text-xs font-medium">Habis</span>';
                }

                const row = `
                    <tr class="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                        <td class="py-4 px-4 text-sm text-slate-800">${item.kode}</td>
                        <td class="py-4 px-4 text-sm text-slate-800">${item.nama}</td>
                        <td class="py-4 px-4 text-sm text-slate-800">${item.kategori}</td>
                        <td class="py-4 px-4 text-sm text-slate-800">${formatRupiah(harga)}</td>
                        <td class="py-4 px-4 text-sm text-slate-800">${item.stok}</td>
                        <td class="py-4 px-4 text-sm">${statusBadge}</td>
                        <td class="py-4 px-4 text-sm flex items-center gap-3">
                            <button onclick="window.location.href='edit-barang.html?id=${item.id}'" class="text-slate-700 hover:text-black"><i data-lucide="edit" class="w-4 h-4"></i></button>
                            <button onclick="showDeletePopup(${item.id})" class="text-red-500 hover:text-red-700"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                        </td>
                    </tr>
                `;
                tableBody.innerHTML += row;
            });
            lucide.createIcons();
            renderPaginationControls(filteredItemsList.length);
        }
        
        // Initialize
        fetchItems();

        document.getElementById('searchInput').addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            
            const filteredItems = allItems.filter(item => {
                return (
                    item.nama.toLowerCase().includes(searchTerm) ||
                    item.kode.toLowerCase().includes(searchTerm) ||
                    item.kategori.toLowerCase().includes(searchTerm)
                );
            });

            renderItems(filteredItems);
        });

        // Delete Logic
        let itemToDeleteId = null;

        function showDeletePopup(id) {
            itemToDeleteId = id;
            document.getElementById('deleteModal').classList.remove('hidden');
            document.getElementById('deleteModal').classList.add('flex');
        }

        function hideDeletePopup() {
            itemToDeleteId = null;
            document.getElementById('deleteModal').classList.add('hidden');
            document.getElementById('deleteModal').classList.remove('flex');
        }

        async function confirmDelete() {
            if (!itemToDeleteId) return;
            try {
                const response = await fetch(`http://localhost:3000/api/items/${itemToDeleteId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': 'Bearer ' + token }
                });

                if (response.ok) {
                    hideDeletePopup();
                    document.getElementById('searchInput').value = '';
                    fetchItems(); // Reload table
                } else {
                    const res = await response.json();
                    alert(res.message || 'Gagal menghapus barang.');
                }
            } catch (error) {
                console.error(error);
                alert('Terjadi kesalahan pada server saat menghapus barang.');
            }
        }
