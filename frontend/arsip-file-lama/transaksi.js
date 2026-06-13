lucide.createIcons();
        window.addEventListener('load', () => lucide.createIcons());
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

        function showSimpanTransaksiConfirm() {
            const modal = document.getElementById('simpanTransaksiConfirmModal');
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }

        function cancelSimpanTransaksi() {
            const modal = document.getElementById('simpanTransaksiConfirmModal');
            modal.classList.add('hidden');
            modal.classList.remove('flex');
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
            }, 2500);
        }

        function formatRupiah(number) {
            return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
        }

        let allItems = []; // Simpan semua data dari database
        let cart = [];     // Simpan barang yang masuk keranjang belanja
        let grandTotal = 0;

        // Ambil data barang dari backend saat halaman dimuat
        async function fetchItems() {
            try {
                const response = await fetch('http://localhost:3000/api/items', {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                if (response.ok) {
                    allItems = await response.json();
                }
            } catch (error) {
                console.error('Gagal mengambil data barang:', error);
                showToast('Error', 'Gagal memuat database barang.', false);
            }
        }
        fetchItems();

        //Menambahkan barang ke keranjang
        function tambahKeKeranjang() {
            const inputElement = document.getElementById('inputKode');
            const kodeDicari = inputElement.value.trim().toLowerCase();
            
            if (!kodeDicari) return;

            // Cari barang di allItems berdasarkan kode
            const barangDitemukan = allItems.find(item => item.kode.toLowerCase() === kodeDicari);

            if (!barangDitemukan) {
                showToast('Tidak Ditemukan', `Kode ${inputElement.value} tidak ada di database!`, false);
                inputElement.value = '';
                return;
            }

            if (barangDitemukan.stok <= 0) {
                showToast('Stok Habis', `${barangDitemukan.nama} sedang kosong!`, false);
                inputElement.value = '';
                return;
            }

            // Cek apakah barang sudah ada di keranjang
            const indexDiKeranjang = cart.findIndex(item => item.id === barangDitemukan.id);

            if (indexDiKeranjang > -1) {
                // Kalau sudah ada, tambah jumlah (qty)
                if (cart[indexDiKeranjang].qty < barangDitemukan.stok) {
                    cart[indexDiKeranjang].qty += 1;
                    cart[indexDiKeranjang].subtotal = cart[indexDiKeranjang].qty * parseFloat(cart[indexDiKeranjang].harga);
                } else {
                    showToast('Batas Stok', `Hanya tersisa ${barangDitemukan.stok} unit untuk ${barangDitemukan.nama}.`, false);
                }
            } else {
                // Kalau belum ada, masukkan barang baru ke array keranjang
                cart.push({
                    id: barangDitemukan.id,
                    kode: barangDitemukan.kode,
                    nama: barangDitemukan.nama,
                    harga: parseFloat(barangDitemukan.harga),
                    qty: 1,
                    subtotal: parseFloat(barangDitemukan.harga),
                    stokMaksimal: barangDitemukan.stok
                });
            }

            // Bersihkan input dan render ulang tabel
            inputElement.value = '';
            renderKeranjang();
        }

        // Event listener saat tombol "+ Tambah" diklik atau tombol Enter ditekan
        document.getElementById('btnTambah').addEventListener('click', tambahKeKeranjang);
        document.getElementById('inputKode').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') tambahKeKeranjang();
        });

        //Tabel dan Total Transaksi
        function updateQty(index, perubahan) {
            const item = cart[index];
            const stokBaru = item.qty + perubahan;

            if (stokBaru > 0 && stokBaru <= item.stokMaksimal) {
                item.qty = stokBaru;
                item.subtotal = item.qty * item.harga;
                renderKeranjang();
            } else if (stokBaru > item.stokMaksimal) {
                showToast('Batas Stok', `Maksimal stok adalah ${item.stokMaksimal}`, false);
            }
        }

        function hapusDariKeranjang(index) {
            cart.splice(index, 1);
            renderKeranjang();
        }

        function renderKeranjang() {
            const tableBody = document.getElementById('cartTableBody');
            tableBody.innerHTML = '';
            grandTotal = 0;
            let totalItemQty = 0;

            if (cart.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-10 text-slate-500">Keranjang masih kosong. Masukkan kode barang.</td></tr>';
            } else {
                cart.forEach((item, index) => {
                    grandTotal += item.subtotal;
                    totalItemQty += item.qty;

                    const row = `
                        <tr class="border-b border-slate-100 hover:bg-slate-50">
                            <td class="py-3 px-4 text-sm font-medium text-slate-800">
                                ${item.nama}<br><span class="text-xs text-slate-500">${item.kode}</span>
                            </td>
                            <td class="py-3 px-4 text-sm">${formatRupiah(item.harga)}</td>
                            <td class="py-3 px-4 text-sm">
                                <div class="flex items-center justify-center gap-2">
                                    <button onclick="updateQty(${index}, -1)" class="w-6 h-6 rounded bg-slate-200 text-slate-600 hover:bg-slate-300 flex items-center justify-center font-bold">-</button>
                                    <span class="w-6 text-center font-medium">${item.qty}</span>
                                    <button onclick="updateQty(${index}, 1)" class="w-6 h-6 rounded bg-slate-200 text-slate-600 hover:bg-slate-300 flex items-center justify-center font-bold">+</button>
                                </div>
                            </td>
                            <td class="py-3 px-4 text-sm font-semibold text-black">${formatRupiah(item.subtotal)}</td>
                            <td class="py-3 px-4 text-sm text-center">
                                <button onclick="hapusDariKeranjang(${index})" class="text-red-500 hover:text-red-700 p-1"><i data-lucide="trash-2" class="w-4 h-4 mx-auto"></i></button>
                            </td>
                        </tr>
                    `;
                    tableBody.innerHTML += row;
                });
                lucide.createIcons();
            }

            // Update UI Ringkasan
            document.getElementById('jumlahItem').textContent = totalItemQty;
            document.getElementById('totalBelanjaSummary').textContent = formatRupiah(grandTotal);
            
            // Panggil hitung kembalian untuk memperbarui uang kembalian otomatis jika ada perubahan qty
            hitungKembalian();
        }

        //Kalkulator Kembalian
        const inputUang = document.getElementById('inputUang');
        const teksKembalian = document.getElementById('kembalian');

        function hitungKembalian() {
            const uangDiterima = parseFloat(inputUang.value) || 0;
            const kembalian = uangDiterima - grandTotal;

            if (cart.length === 0) {
                teksKembalian.textContent = 'Rp 0';
                teksKembalian.className = "text-lg font-bold text-black";
                return;
            }

            if (kembalian < 0 && uangDiterima > 0) {
                // Uang kurang
                teksKembalian.textContent = 'Uang Kurang!';
                teksKembalian.className = "text-lg font-bold text-red-500";
            } else {
                // Uang pas atau lebih
                teksKembalian.textContent = formatRupiah(kembalian > 0 ? kembalian : 0);
                teksKembalian.className = "text-lg font-bold text-green-600";
            }
        }

        // Hitung otomatis saat kasir mengetik angka
        inputUang.addEventListener('input', hitungKembalian);

        //Batal Transaksi
        function batalkanTransaksi() {
            if (cart.length === 0 && inputUang.value === '') return;
            cart = [];
            inputUang.value = '';
            document.getElementById('inputKode').value = '';
            renderKeranjang();
            showToast('Dibatalkan', 'Transaksi telah di-reset.', true);
        }

        document.getElementById('btnBatal').addEventListener('click', batalkanTransaksi);

        // Simpan Struk
        let currentNoNota = ""; 

        document.getElementById('btnSimpan').addEventListener('click', () => {
            const uangDiterima = parseFloat(inputUang.value) || 0;
            
            if (cart.length === 0) {
                showToast('Peringatan', 'Keranjang masih kosong!', false);
                return;
            }
            if (uangDiterima < grandTotal) {
                showToast('Pembayaran Gagal', 'Uang yang diterima kurang dari total belanja!', false);
                return;
            }

            showSimpanTransaksiConfirm();
        });

        async function submitTransaksi() {
            cancelSimpanTransaksi();

            const uangDiterima = parseFloat(inputUang.value) || 0;
            const kembalianValue = uangDiterima - grandTotal;

            const btnSimpan = document.getElementById('btnSimpan');
            const originalBtnContent = btnSimpan.innerHTML;
            btnSimpan.innerHTML = 'Memproses...';
            btnSimpan.disabled = true;

            const payload = {
                cart: cart,
                totalBelanja: grandTotal,
                uangTunai: uangDiterima,
                kembalian: kembalianValue
            };

            try {
                const response = await fetch('http://localhost:3000/api/transactions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                if (response.ok) {
                    showToast('Transaksi Berhasil!', `Nota: ${result.no_nota}`);
                    currentNoNota = result.no_nota;
                    tampilkanStruk(currentNoNota, grandTotal, uangDiterima, kembalianValue, cart);
                } else {
                    showToast('Gagal!', result.message || 'Gagal menyimpan transaksi.', false);
                }
            } catch (error) {
                console.error(error);
                showToast('Gagal!', 'Terjadi kesalahan pada server.', false);
            } finally {
                btnSimpan.innerHTML = originalBtnContent;
                btnSimpan.disabled = false;
            }
        }

        function tampilkanStruk(noNota, total, bayar, kembali, keranjang) {
            const modal = document.getElementById('receiptModal');
            
            const namaUser = localStorage.getItem('username') || 'USER';
            document.getElementById('strukNamaToko').textContent = 'TOKO ' + namaUser.toUpperCase();

            document.getElementById('strukNoNota').textContent = noNota;
            
            const dateObj = new Date();
            const formattedDate = dateObj.toLocaleDateString('id-ID') + ', ' + dateObj.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'});
            document.getElementById('strukTanggal').textContent = formattedDate;

            const itemsContainer = document.getElementById('strukItems');
            itemsContainer.innerHTML = '';
            keranjang.forEach(item => {
                itemsContainer.innerHTML += `
                    <div>
                        <div class="flex justify-between">
                            <span>${item.nama}</span>
                            <span>${formatRupiah(item.subtotal)}</span>
                        </div>
                        <div class="text-slate-500 text-xs">${item.qty} x ${formatRupiah(item.harga)}</div>
                    </div>
                `;
            });

            document.getElementById('strukTotal').textContent = formatRupiah(total);
            document.getElementById('strukBayar').textContent = formatRupiah(bayar);
            document.getElementById('strukKembalian').textContent = formatRupiah(kembali);

            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }

        document.getElementById('btnTutupStruk').addEventListener('click', () => {
            document.getElementById('receiptModal').classList.add('hidden');
            document.getElementById('receiptModal').classList.remove('flex');
            
            cart = [];
            inputUang.value = '';
            document.getElementById('inputKode').value = '';
            renderKeranjang();
            fetchItems();
        });

        //Download Struk
        document.getElementById('btnDownloadStruk').addEventListener('click', () => {
            const receiptArea = document.getElementById('receiptArea');
            const btnDownload = document.getElementById('btnDownloadStruk');
            const originalText = btnDownload.textContent;
            
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
                windowHeight: receiptArea.scrollHeight // Beritahu kamera tinggi aslinya
            }).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                
                const { jsPDF } = window.jspdf;
                const pdfWidth = 80; 
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: [pdfWidth, pdfHeight]
                });
                
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`Struk-${currentNoNota}.pdf`);
                
                modalBody.style.overflow = originalOverflowBody;
                modalContainer.style.maxHeight = originalMaxHeight;

                btnDownload.textContent = originalText;
                btnDownload.disabled = false;
            }).catch(err => {
                console.error("Gagal buat PDF:", err);
                showToast("Error", "Gagal mendownload struk PDF.", false);
                
                modalBody.style.overflow = originalOverflowBody;
                modalContainer.style.maxHeight = originalMaxHeight;
                btnDownload.textContent = originalText;
                btnDownload.disabled = false;
            });
        });
