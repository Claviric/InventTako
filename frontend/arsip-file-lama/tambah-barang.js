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

        function showToast(title, message, isSuccess = true) {
            const toast = document.getElementById('toastNotification');
            const toastContent = document.getElementById('toastContent');
            const toastTitle = document.getElementById('toastTitle');
            const toastMessage = document.getElementById('toastMessage');
            const toastIcon = document.getElementById('toastIcon');

            // Ubah teks
            toastTitle.textContent = title;
            toastMessage.textContent = message;

            // Atur warna dan ikon berdasarkan sukses/gagal
            if (isSuccess) {
                toastContent.className = "bg-white border-l-4 border-green-500 shadow-xl rounded-md p-4 flex items-start gap-3 w-80";
                toastIcon.setAttribute('data-lucide', 'check-circle');
                document.getElementById('toastIconContainer').className = "mt-0.5 text-green-500";
            } else {
                toastContent.className = "bg-white border-l-4 border-red-500 shadow-xl rounded-md p-4 flex items-start gap-3 w-80";
                toastIcon.setAttribute('data-lucide', 'x-circle');
                document.getElementById('toastIconContainer').className = "mt-0.5 text-red-500";
            }
            
            lucide.createIcons(); // Render ulang ikon

            // Munculkan toast dengan menghapus class translate (geser ke dalam layar)
            toast.classList.remove('translate-x-[150%]');

            // Hilangkan toast setelah 2 detik
            setTimeout(() => {
                toast.classList.add('translate-x-[150%]');
                
                // Kalau sukses, otomatis pindah ke halaman barang setelah toast menghilang
                if (isSuccess) {
                    setTimeout(() => {
                        window.location.href = 'barang.html';
                    }, 300); // Jeda sedikit animasi keluar sebelum pindah halaman
                }
            }, 2000); // 2000 ms = 2 detik
        }

        // Logic simpan barang
        document.getElementById('formTambahBarang').addEventListener('submit', async (e) => {
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
                const response = await fetch('http://localhost:3000/api/items', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify(payload)
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    showToast('Berhasil!', 'Barang berhasil ditambahkan!');
                } else {
                    showToast('Gagal!', result.message || 'Gagal menambahkan barang.', false);
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
