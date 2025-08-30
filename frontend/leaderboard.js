let currentPage = 1;
let totalPages = 1;

async function updateLeaderboard(page = 1) {
    try {
        const response = await fetch(`http://localhost:3000/leaderboard?page=${page}&limit=10`);
        const data = await response.json();
        
        const tbody = document.getElementById('leaderboardBody');
        tbody.innerHTML = '';
        
        data.data.forEach((item) => {
            const row = document.createElement('tr');
            
            const rankCell = document.createElement('td');
            rankCell.textContent = `#${item.rank}`;
            rankCell.className = 'rank-cell';
            
            const addressCell = document.createElement('td');
            const addressLink = document.createElement('a');
            addressLink.href = `https://testnet.monadexplorer.com/address/${item.full_address}`;
            addressLink.target = '_blank';
            addressLink.rel = 'noopener noreferrer';
            addressLink.textContent = item.address;
            addressLink.className = 'address-link';
            addressCell.appendChild(addressLink);
            
            const timeCell = document.createElement('td');
            timeCell.textContent = item.best_time.toFixed(2) + 's';
            timeCell.className = 'time-cell';
            
            row.appendChild(rankCell);
            row.appendChild(addressCell);
            row.appendChild(timeCell);
            
            tbody.appendChild(row);
        });
        
        // Update pagination
        currentPage = data.pagination.currentPage;
        totalPages = data.pagination.totalPages;
        updatePagination(data.pagination);
        
    } catch (error) {
        console.error('Error updating leaderboard:', error);
    }
}

async function updatePlayerStats() {
    try {
        const response = await fetch('http://localhost:3000/player/stats', {
            headers: auth.getAuthHeaders()
        });
        const data = await response.json();
        
        const rankElement = document.getElementById('playerRank');
        const timeElement = document.getElementById('playerBestTime');
        
        if (data.rank) {
            rankElement.textContent = `#${data.rank}`;
            document.getElementById('playerStats').style.display = 'flex';
        } else {
            document.getElementById('playerStats').style.display = 'none';
        }
        
        if (data.bestTime) {
            timeElement.textContent = `${data.bestTime.toFixed(2)}s`;
        }
    } catch (error) {
        console.error('Error updating player stats:', error);
    }
}

function updatePagination(pagination) {
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = '';
    
    if (pagination.totalPages <= 1) {
        return;
    }
    
    // Previous button
    if (pagination.hasPrev) {
        const prevBtn = document.createElement('button');
        prevBtn.textContent = '← Previous';
        prevBtn.addEventListener('click', () => updateLeaderboard(currentPage - 1));
        paginationContainer.appendChild(prevBtn);
    }
    
    // Page info
    const pageInfo = document.createElement('span');
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    pageInfo.className = 'page-info';
    paginationContainer.appendChild(pageInfo);
    
    // Next button
    if (pagination.hasNext) {
        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'Next →';
        nextBtn.addEventListener('click', () => updateLeaderboard(currentPage + 1));
        paginationContainer.appendChild(nextBtn);
    }
}

// Обновляем таблицу лидеров при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    updateLeaderboard();
    
    // Update player stats when wallet connects
    if (typeof auth !== 'undefined') {
        auth.onConnect = updatePlayerStats;
    }
});