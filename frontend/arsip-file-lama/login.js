// FUNGSI UNTUK MENGONTROL MODAL
    function showModal(title, message, buttonText = "Tutup", isSuccess = false) {
        document.getElementById('modalTitle').innerText = title;
        document.getElementById('modalMessage').innerText = message;
        document.getElementById('modalButton').innerText = buttonText;
        
        const modal = document.getElementById('customModal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');

        // Kalau sukses login, tombolnya akan memindahkan halaman
        if (isSuccess) {
            document.getElementById('modalButton').onclick = function() {
                window.location.href = 'dashboard.html';
            };
        } else {
            // Kalau error, tombolnya cuma menutup modal
            document.getElementById('modalButton').onclick = closeModal;
        }
    }

    function closeModal() {
        const modal = document.getElementById('customModal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }

    async function handleLogin(event) {
        event.preventDefault(); // Mencegah halaman refresh
        
        // Ambil nilai dari kotak input
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        // CEK KEKOSONGAN
        if (!email || !password) {
            showModal('Data Belum Lengkap', 'Email dan Password wajib diisi!', 'Mengerti');
            return;
        }

        try {
            // Kirim data ke backend Node.js
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();

            // Cek apakah error (email/password salah)
            if (!response.ok) {
                showModal('Gagal Masuk', data.message, 'Coba Lagi');
            } else {
                // Simpan "tiket masuk" (token) dan username di browser
                localStorage.setItem('token', data.token);
                localStorage.setItem('username', data.username);
                showModal('Akses Diberikan', data.message, 'Masuk Dashboard', true);
            }
        } catch (error) {
            showModal('Server Error', 'Terjadi kesalahan pada server. Pastikan backend menyala!', 'Tutup');
        }
    }

    // Sambungkan fungsi di atas ke tombol form
    const formLogin = document.querySelector('form');
    formLogin.onsubmit = handleLogin;
