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
                window.location.href = 'login.html';
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

    async function handleRegister(event) {
        event.preventDefault(); // Mencegah halaman refresh
        
        // Ambil nilai dari kotak input dan hilangkan spasi kosong di awal/akhir (.trim())
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        // CEK KEKOSONGAN (SATPAM FRONTEND)
        if (!email || !password) {
            showModal('Data Belum Lengkap', 'Email dan Password wajib diisi!', 'Mengerti');
            return; 
        }

        // CEK FORMAT GMAIL (SATPAM BARU)
        if (!email.endsWith('@gmail.com')) {
            showModal('Format Tidak Sesuai', 'Harus menggunakan email @gmail.com!', 'Mengerti');
            return;
        }

        try {
            // Kirim data ke backend Node.js
            const response = await fetch('http://localhost:3000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();

            // Cek apakah ada error (misal email sudah dipakai)
            if (!response.ok) {
                showModal('Registrasi Ditolak', data.message, 'Ganti Email');
            } else {
                showModal('Akun Berhasil Dibuat', data.message, 'Lanjut Sign In', true); 
            }
        } catch (error) {
            showModal('Server Error', 'Terjadi kesalahan pada server. Pastikan backend menyala!', 'Tutup');
        }
    }

    const formRegister = document.querySelector('form');
    formRegister.onsubmit = handleRegister;
