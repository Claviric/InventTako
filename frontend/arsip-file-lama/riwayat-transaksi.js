lucide.createIcons();
        window.addEventListener('load', () => lucide.createIcons());

        // Cek login
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

        function formatRupiah(number) {
            return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
        }

        let allHistory = [];
        let currentPage = 1;
        const itemsPerPage = 5;
        const searchInput = document.getElementById('searchInput');
        const dateFilter = document.getElementById('dateFilter');

        function parseAmount(value) {
            const cleaned = (value ?? '0').toString().replace(/[^0-9.-]+/g, '');
            return Number(cleaned) || 0;
        }

        function getFilteredHistory() {
            const searchValue = searchInput.value.trim().toLowerCase();
            const selectedDate = dateFilter.value;

            return allHistory.filter(trx => {
                const matchesSearch = !searchValue || trx.no_nota.toLowerCase().includes(searchValue);
                const matchesDate = !selectedDate || new Date(trx.tanggal).toISOString().slice(0, 10) === selectedDate;
                return matchesSearch && matchesDate;
            });
        }

        function renderHistoryTable() {
            const tableBody = document.getElementById('historyTableBody');
            const paginationControls = document.getElementById('paginationControls');
            const pageInfo = document.getElementById('pageInfo');
            const btnPrev = document.getElementById('btnPrev');
            const btnNext = document.getElementById('btnNext');

            const filteredHistory = getFilteredHistory();
            const totalItems = filteredHistory.length;
            const totalPages = Math.ceil(totalItems / itemsPerPage);

            if (totalItems === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-10 text-slate-500">Tidak ada transaksi yang cocok.</td></tr>';
                paginationControls.classList.add('hidden');
                return;
            }

            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
            const pageItems = filteredHistory.slice(startIndex, endIndex);

            tableBody.innerHTML = pageItems.map(trx => {
                const dateObj = new Date(trx.tanggal);
                const formattedDate = dateObj.toLocaleDateString('id-ID') + ' ' + dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute:'2-digit' });

                return `
                    <tr class="border-b border-slate-100 hover:bg-slate-50">
                        <td class="py-3 px-4 text-sm text-slate-600">${trx.no_nota}</td>
                        <td class="py-3 px-4 text-sm text-black">${formattedDate}</td>
                        <td class="py-3 px-4 text-sm font-bold text-[#0044ff]">${formatRupiah(parseAmount(trx.total_belanja))}</td>
                        <td class="py-3 px-4 text-sm text-slate-600 text-center">${trx.status || 'Selesai'}</td>
                        <td class="py-3 px-4 text-sm text-center">
                            <button onclick="lihatDetail(${trx.id})" class="text-[#0044ff] hover:bg-blue-100 px-3 py-1.5 rounded text-xs font-semibold border border-blue-200 transition-colors">
                                Lihat Detail
                            </button>
                        </td>
                    </tr>`;
            }).join('');

            pageInfo.textContent = `Menampilkan ${startIndex + 1}-${endIndex} dari ${totalItems} transaksi`;
            paginationControls.classList.toggle('hidden', totalPages <= 1);
            btnPrev.disabled = currentPage === 1;
            btnNext.disabled = currentPage === totalPages;
        }

        function changePage(delta) {
            const totalPages = Math.ceil(getFilteredHistory().length / itemsPerPage);
            if (totalPages === 0) return;

            currentPage = Math.max(1, Math.min(totalPages, currentPage + delta));
            renderHistoryTable();
        }

        function handleFilterUpdate() {
            currentPage = 1;
            renderHistoryTable();
        }

        searchInput.addEventListener('input', handleFilterUpdate);
        dateFilter.addEventListener('change', handleFilterUpdate);

        //Fetch Riwayat Transaksi
        async function fetchHistory() {
            const tableBody = document.getElementById('historyTableBody');
            try {
                const response = await fetch('http://localhost:3000/api/transactions', {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                const data = await response.json();

                if (response.ok) {
                    allHistory = data;
                    const totalRevenue = allHistory.reduce((sum, trx) => sum + parseAmount(trx.total_belanja), 0);
                    const totalTransactions = allHistory.length;
                    document.getElementById('totalRevenue').textContent = formatRupiah(totalRevenue);
                    document.getElementById('totalTransactions').innerHTML = `${totalTransactions} <span class="text-sm font-medium text-slate-500">transaksi</span>`;
                    currentPage = 1;
                    renderHistoryTable();
                }
            } catch (error) {
                console.error(error);
                tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-10 text-red-500">Gagal memuat data dari server.</td></tr>';
            }
        }

        fetchHistory();

        //Fetch Detail Transaksi
        let currentNoNota = "";
        
        async function lihatDetail(idTransaksi) {
            try {
                const response = await fetch(`http://localhost:3000/api/transactions/${idTransaksi}`, {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                const data = await response.json();

                if (response.ok) {
                    currentNoNota = data.transaksi.no_nota;
                    tampilkanStruk(data.transaksi, data.details);
                } else {
                    alert('Gagal mengambil detail transaksi: ' + data.message);
                }
            } catch (error) {
                console.error(error);
                alert('Terjadi kesalahan pada server.');
            }
        }

        function tampilkanStruk(trx, details) {
            const btnDownload = document.getElementById('btnDownloadStruk');
            btnDownload.textContent = "Download PDF";
            btnDownload.disabled = false;

            const modal = document.getElementById('receiptModal');
            
            const namaUser = localStorage.getItem('username') || 'USER';
            document.getElementById('strukNamaToko').textContent = 'TOKO ' + namaUser.toUpperCase();

            document.getElementById('strukNoNota').textContent = trx.no_nota;
            
            const dateObj = new Date(trx.tanggal);
            const formattedDate = dateObj.toLocaleDateString('id-ID') + ', ' + dateObj.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'});
            document.getElementById('strukTanggal').textContent = formattedDate;

            const itemsContainer = document.getElementById('strukItems');
            itemsContainer.innerHTML = '';
            details.forEach(item => {
                itemsContainer.innerHTML += `
                    <div>
                        <div class="flex justify-between">
                            <span>${item.nama_barang}</span>
                            <span>${formatRupiah(item.subtotal)}</span>
                        </div>
                        <div class="text-slate-500 text-xs">${item.qty} x ${formatRupiah(item.harga_satuan)}</div>
                    </div>
                `;
            });

            document.getElementById('strukTotal').textContent = formatRupiah(trx.total_belanja);
            document.getElementById('strukBayar').textContent = formatRupiah(trx.uang_tunai);
            document.getElementById('strukKembalian').textContent = formatRupiah(trx.kembalian);

            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }

        //Download PDF Struk Transaksi
        document.getElementById('btnDownloadStruk').addEventListener('click', () => {
            const receiptArea = document.getElementById('receiptArea');
            const btnDownload = document.getElementById('btnDownloadStruk');
            
            btnDownload.textContent = "Menyusun PDF...";
            btnDownload.disabled = true;
            
            const modalBody = receiptArea.parentElement;
            const modalContainer = modalBody.parentElement;
            const originalOverflowBody = modalBody.style.overflow;
            const originalMaxHeight = modalContainer.style.maxHeight;
            
            modalBody.style.overflow = 'visible';
            modalContainer.style.maxHeight = 'none';

            html2canvas(receiptArea, {
                scale: 2, 
                backgroundColor: "#ffffff",
                scrollY: 0,
                windowHeight: receiptArea.scrollHeight
            }).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const { jsPDF } = window.jspdf;
                const pdfWidth = 80; 
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [pdfWidth, pdfHeight] });
                
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`Struk-Riwayat-${currentNoNota}.pdf`);
                
                modalBody.style.overflow = originalOverflowBody;
                modalContainer.style.maxHeight = originalMaxHeight;
                btnDownload.textContent = "Download PDF";
                btnDownload.disabled = false;
            }).catch(err => {
                console.error(err);
                modalBody.style.overflow = originalOverflowBody;
                modalContainer.style.maxHeight = originalMaxHeight;
                btnDownload.textContent = "Download PDF";
                btnDownload.disabled = false;
            });
        });
