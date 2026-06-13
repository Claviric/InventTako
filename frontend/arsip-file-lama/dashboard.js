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
            localStorage.removeItem('username');
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

        async function fetchDashboardItems() {
            try {
                const response = await fetch('http://localhost:3000/api/items', {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                
                if (!response.ok) throw new Error('Gagal mengambil data barang');
                
                const items = await response.json();
                renderDashboardItems(items);
            } catch (error) {
                console.error(error);
                document.getElementById('tableBodyDashboard').innerHTML = '<tr><td colspan="6" class="text-center py-4 text-red-500">Gagal memuat data.</td></tr>';
            }
        }

        function formatRupiah(number) {
            return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
        }

        function parseAmount(value) {
            const cleaned = (value ?? '0').toString().replace(/[^0-9.-]+/g, '');
            return Number(cleaned) || 0;
        }

        function renderDashboardItems(items) {
            const tableBody = document.getElementById('tableBodyDashboard');
            tableBody.innerHTML = '';
            
            let totalStok = 0;
            items.forEach(item => totalStok += item.stok);

            document.getElementById('totalBarangDashboard').textContent = items.length;
            document.getElementById('totalStokDashboard').textContent = totalStok;

            if (items.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-6 text-slate-500">Belum ada barang.</td></tr>';
            } else {
                // Tampilkan maksimal 5 barang terbaru di dashboard
                const recentItems = [...items].sort((a, b) => b.id - a.id).slice(0, 5);
                recentItems.forEach(item => {
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
                            <td class="py-3 px-4 text-sm text-slate-800">${item.kode}</td>
                            <td class="py-3 px-4 text-sm text-slate-800">${item.nama}</td>
                            <td class="py-3 px-4 text-sm text-slate-800">${item.kategori}</td>
                            <td class="py-3 px-4 text-sm text-slate-800">${formatRupiah(harga)}</td>
                            <td class="py-3 px-4 text-sm text-slate-800">${item.stok}</td>
                            <td class="py-3 px-4 text-sm">${statusBadge}</td>
                        </tr>
                    `;
                    tableBody.innerHTML += row;
                });
            }
        }

        async function fetchDashboardTransactions() {
            try {
                const response = await fetch('http://localhost:3000/api/transactions', {
                    headers: { 'Authorization': 'Bearer ' + token }
                });

                if (!response.ok) throw new Error('Gagal mengambil data transaksi');

                const transactions = await response.json();
                renderDashboardTransactions(transactions);
            } catch (error) {
                console.error(error);
                document.getElementById('latestTransactionsDashboardBody').innerHTML = '<tr><td colspan="4" class="text-center py-4 text-red-500">Gagal memuat transaksi.</td></tr>';
            }
        }

        function renderDashboardTransactions(transactions) {
            const today = new Date().toISOString().slice(0, 10);
            const todayTransactions = transactions.filter(trx => new Date(trx.tanggal).toISOString().slice(0, 10) === today);
            const todayRevenue = todayTransactions.reduce((sum, trx) => sum + parseAmount(trx.total_belanja), 0);

            document.getElementById('todayTransactionsDashboard').textContent = todayTransactions.length;
            document.getElementById('todayRevenueDashboard').textContent = formatRupiah(todayRevenue);

            const tableBody = document.getElementById('latestTransactionsDashboardBody');
            if (transactions.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="4" class="text-center py-6 text-slate-500">Belum ada transaksi.</td></tr>';
                return;
            }

            const recentTransactions = [...transactions]
                .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
                .slice(0, 5);

            tableBody.innerHTML = recentTransactions.map(trx => {
                const tanggal = new Date(trx.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
                const status = trx.status || 'Selesai';
                return `
                    <tr class="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                        <td class="py-3 px-4 text-sm text-slate-800">${trx.no_nota}</td>
                        <td class="py-3 px-4 text-sm text-slate-800">${tanggal}</td>
                        <td class="py-3 px-4 text-sm text-slate-800">${formatRupiah(parseAmount(trx.total_belanja))}</td>
                        <td class="py-3 px-4 text-sm text-slate-800">${status}</td>
                    </tr>`;
            }).join('');
        }

        // Initialize
        fetchDashboardItems();
        fetchDashboardTransactions();
