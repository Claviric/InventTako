lucide.createIcons();
        window.addEventListener('load', () => lucide.createIcons());

        const token = localStorage.getItem('token');
        const username = localStorage.getItem('username') || 'USER';

        let allTransactions = [];
        let lineChartInstance = null;

        if (!token) {
            window.location.href = 'login.html';
        }

        document.getElementById('profileName').textContent = username;

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

        async function fetchAnalytics() {
            try {
                const response = await fetch('http://localhost:3000/api/transactions/analytics/data', {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                const data = await response.json();

                if (response.ok) {
                    renderCharts(data);
                }
            } catch (error) {
                console.error("Gagal memuat analitik:", error);
            }
        }

        function getWeekRange(date) {
            const d = new Date(date);
            const day = d.getDay(); 

            const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(d.setDate(diffToMonday));
            monday.setHours(0, 0, 0, 0);
            
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            sunday.setHours(23, 59, 59, 999);
            
            return { monday, sunday };
        }

        function formatDateRange(start, end) {
            const opt = { day: 'numeric', month: 'short' };
            const startStr = start.toLocaleDateString('id-ID', opt);
            const endStr = end.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
            return `${startStr} - ${endStr}`;
        }

        function getCurrentWeekRange() {
            return getWeekRange(new Date());
        }

        function getLastWeekRange() {
            const today = new Date();
            const lastWeekDate = new Date(today.setDate(today.getDate() - 7));
            return getWeekRange(lastWeekDate);
        }

        function populateWeekFilter(transactions) {
            const select = document.getElementById('weekFilter');
            select.innerHTML = `
                <option value="current">Minggu Ini</option>
                <option value="last">Minggu Lalu</option>
                <option value="all">Semua Waktu</option>
            `;
            
            const weeks = [];
            const seen = new Set();
            
            transactions.forEach(trx => {
                const d = new Date(trx.tanggal);
                const { monday, sunday } = getWeekRange(d);
                const key = monday.toISOString().split('T')[0];
                
                if (!seen.has(key)) {
                    seen.add(key);
                    weeks.push({
                        key: key,
                        monday: monday,
                        sunday: sunday,
                        label: formatDateRange(monday, sunday)
                    });
                }
            });
            
            weeks.sort((a, b) => b.monday - a.monday);
            
            if (weeks.length > 0) {
                const optgroup = document.createElement('optgroup');
                optgroup.label = "Pilih Minggu Spesifik";
                
                weeks.forEach(wk => {
                    const opt = document.createElement('option');
                    opt.value = wk.key;
                    opt.textContent = wk.label;
                    optgroup.appendChild(opt);
                });
                
                select.appendChild(optgroup);
            }
        }

        function updateLineChart() {
            const filterValue = document.getElementById('weekFilter').value;
            let labels = [];
            let chartData = [];
            
            if (filterValue === 'all') {
                const dailyTotals = {};
                allTransactions.forEach(trx => {
                    const d = new Date(trx.tanggal);
                    const dateStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                    if (!dailyTotals[dateStr]) dailyTotals[dateStr] = 0;
                    dailyTotals[dateStr] += parseFloat(trx.total_belanja);
                });
                labels = Object.keys(dailyTotals);
                chartData = Object.values(dailyTotals);
            } else {
                let monday, sunday;
                if (filterValue === 'current') {
                    const range = getCurrentWeekRange();
                    monday = range.monday;
                    sunday = range.sunday;
                } else if (filterValue === 'last') {
                    const range = getLastWeekRange();
                    monday = range.monday;
                    sunday = range.sunday;
                } else {
                    monday = new Date(filterValue);
                    monday.setHours(0,0,0,0);
                    sunday = new Date(monday);
                    sunday.setDate(monday.getDate() + 6);
                    sunday.setHours(23,59,59,999);
                }
                
                const days = [];
                for (let i = 0; i < 7; i++) {
                    const date = new Date(monday);
                    date.setDate(monday.getDate() + i);
                    const dateStr = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                    days.push({
                        dateStr: date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
                        label: dateStr,
                        total: 0
                    });
                }
                
                allTransactions.forEach(trx => {
                    const trxDate = new Date(trx.tanggal);
                    if (trxDate >= monday && trxDate <= sunday) {
                        const dateStr = trxDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                        const dayObj = days.find(d => d.dateStr === dateStr);
                        if (dayObj) {
                            dayObj.total += parseFloat(trx.total_belanja);
                        }
                    }
                });
                
                labels = days.map(d => d.label);
                chartData = days.map(d => d.total);
            }
            
            if (lineChartInstance) {
                lineChartInstance.destroy();
            }
            
            const lineCtx = document.getElementById('allTimeLineChart').getContext('2d');
            lineChartInstance = new Chart(lineCtx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Pendapatan (Rp)',
                        data: chartData,
                        borderColor: '#0044ff',
                        backgroundColor: 'rgba(0, 68, 255, 0.1)',
                        borderWidth: 3,
                        pointBackgroundColor: '#0044ff',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } }
                }
            });
        }

        function renderCharts(data) {
            allTransactions = data.transactions;
            
            //Pie Chart: Waktu Transaksi
            let pagi = 0, siang = 0, sore = 0, malam = 0;

            allTransactions.forEach(trx => {
                const d = new Date(trx.tanggal);
                
                // Group by Waktu (Jam)
                const hour = d.getHours();
                if (hour >= 5 && hour < 12) pagi++;        // 05:00 - 11:59
                else if (hour >= 12 && hour < 15) siang++; // 12:00 - 14:59
                else if (hour >= 15 && hour < 18) sore++;  // 15:00 - 17:59
                else malam++;                              // 18:00 - 04:59
            });

            populateWeekFilter(allTransactions);
            updateLineChart();

            const pieCtx = document.getElementById('timePieChart').getContext('2d');
            new Chart(pieCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Pagi (05-12)', 'Siang (12-15)', 'Sore (15-18)', 'Malam (18-05)'],
                    datasets: [{
                        data: [pagi, siang, sore, malam],
                        backgroundColor: ['#fcd34d', '#f97316', '#f43f5e', '#3b82f6'],
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                        legend: { position: 'bottom' }
                    }
                }
            });

            // Bar Chart: Top 5 Barang Terlaris
            const barLabels = data.topItems.map(item => item.nama_barang);
            const barData = data.topItems.map(item => item.total_qty);

            const barCtx = document.getElementById('topItemsBarChart').getContext('2d');
            new Chart(barCtx, {
                type: 'bar',
                data: {
                    labels: barLabels,
                    datasets: [{
                        label: 'Terjual (Pcs)',
                        data: barData,
                        backgroundColor: '#10b981',
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } }
                }
            });
        }

        // Panggil saat halaman dibuka
        fetchAnalytics();
