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

        const urlParams = new URLSearchParams(window.location.search);
        const itemId = urlParams.get('id');

        if (!itemId) {
            alert('Barang tidak ditemukan!');
            window.location.href = 'barang.html';
        }

        function showToast(title, message, isSuccess = true) {
            const toast = document.getElementById('toastNotification');
            const toastContent = document.getElementById('toastContent');
            const toastTitle = document.getElementById('toastTitle');
            const toastMessage = document.getElementById('toastMessage');
            const toastIcon = document.getElementById('toastIcon');

            toastTitle.textContent = title;
            toastMessage.textContent = message;

            if (isSuccess) {
                toastContent.className = "bg-white border-l-4 border-green-500 shadow-xl rounded-md p-4 flex items-start gap-3 w-80";
                toastIcon.setAttribute('data-lucide', 'check-circle');
                document.getElementById('toastIconContainer').className = "mt-0.5 text-green-500";
            } else {
                toastContent.className = "bg-white border-l-4 border-red-500 shadow-xl rounded-md p-4 flex items-start gap-3 w-80";
                toastIcon.setAttribute('data-lucide', 'x-circle');
                document.getElementById('toastIconContainer').className = "mt-0.5 text-red-500";
            }
            
            lucide.createIcons();

            toast.classList.remove('translate-x-[150%]');

            setTimeout(() => {
                toast.classList.add('translate-x-[150%]');
                if (isSuccess) {
                    setTimeout(() => {
                        window.location.href = 'barang.html';
                    }, 300);
                }
            }, 2000);
        }

        // Fetch data barang
        async function fetchItemDetails() {
            try {
                const response = await fetch(`http://localhost:3000/api/items/${itemId}`, {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                
                if (!response.ok) {
                    throw new Error('Gagal mengambil data barang');
                }
                
                const item = await response.json();
                document.getElementById('nama').value = item.nama;
                document.getElementById('kode').value = item.kode;
                document.getElementById('kategori').value = item.kategori;
                document.getElementById('harga').value = item.harga;
                document.getElementById('stok').value = item.stok;
                document.getElementById('deskripsi').value = item.deskripsi || '';
            } catch (error) {
                console.error(error);
                showToast('Gagal!', 'Gagal memuat data barang. Pastikan server berjalan.', false);
                window.location.href = 'barang.html';
            }
        }

        fetchItemDetails();

        // Logic simpan perubahan
        document.getElementById('formEditBarang').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Menyimpan...';
            submitBtn.disabled = true;

            const payload = {
                nama: document.getElementById('nama').value,
                kode: document.getElementById('kode').value,
                kategori: document.getElementById('kategori').value,
                harga: document.getElementById('harga').value,
                stok: document.getElementById('stok').value,
                deskripsi: document.getElementById('deskripsi').value
            };

            try {
                const response = await fetch(`http://localhost:3000/api/items/${itemId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify(payload)
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    showToast('Berhasil!', 'Barang berhasil diperbarui!');
                } else {
                    showToast('Gagal!', result.message || 'Gagal memperbarui barang.', false);
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }
            } catch (error) {
                console.error('Error:', error);
                showToast('Gagal!', 'Terjadi kesalahan pada server.', false);
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
