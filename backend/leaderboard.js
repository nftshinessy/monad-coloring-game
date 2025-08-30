const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'game.db');

const getLeaderboard = (req, res) => {
    const db = new sqlite3.Database(dbPath);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Получаем общее количество уникальных адресов
    db.get(
        "SELECT COUNT(DISTINCT address) as total FROM leaderboard",
        (err, countResult) => {
            if (err) {
                console.error('Database error:', err);
                res.status(500).json({ error: 'Internal server error' });
                db.close();
                return;
            }
            
            const totalPages = Math.ceil(countResult.total / limit);
            
            // Получаем данные для текущей страницы
            db.all(
                `SELECT address, full_address, MIN(time) as best_time, created_at 
                 FROM leaderboard 
                 GROUP BY address 
                 ORDER BY best_time ASC 
                 LIMIT ? OFFSET ?`,
                [limit, offset],
                (err, rows) => {
                    if (err) {
                        console.error('Database error:', err);
                        res.status(500).json({ error: 'Internal server error' });
                    } else {
                        // Добавляем ранги
                        const startRank = offset + 1;
                        rows.forEach((row, index) => {
                            row.rank = startRank + index;
                        });
                        
                        res.json({
                            data: rows,
                            pagination: {
                                currentPage: page,
                                totalPages: totalPages,
                                totalItems: countResult.total,
                                hasNext: page < totalPages,
                                hasPrev: page > 1
                            }
                        });
                    }
                    db.close();
                }
            );
        }
    );
};

const getPlayerStats = (address, callback) => {
    const db = new sqlite3.Database(dbPath);
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
    
    // Получаем ранг игрока
    db.get(
        `SELECT rank FROM (
            SELECT address, MIN(time) as best_time, 
                   ROW_NUMBER() OVER (ORDER BY MIN(time) ASC) as rank
            FROM leaderboard 
            GROUP BY address
        ) WHERE address = ?`,
        [shortAddress],
        (err, rankRow) => {
            if (err) {
                console.error('Error getting player rank:', err);
                callback({});
                db.close();
                return;
            }
            
            // Получаем лучшее время игрока
            db.get(
                "SELECT MIN(time) as best_time FROM leaderboard WHERE address = ?",
                [shortAddress],
                (err, timeRow) => {
                    if (err) {
                        console.error('Error getting player best time:', err);
                        callback({});
                    } else {
                        callback({
                            rank: rankRow ? rankRow.rank : null,
                            bestTime: timeRow ? timeRow.best_time : null
                        });
                    }
                    db.close();
                }
            );
        }
    );
};

const addResult = (address, time) => {
    const db = new sqlite3.Database(dbPath);
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
    
    // Сохраняем результат
    db.run(
        "INSERT INTO leaderboard (address, full_address, time) VALUES (?, ?, ?)",
        [shortAddress, address, time],
        (err) => {
            if (err) {
                console.error('Error saving result:', err);
            } else {
                console.log(`Result saved for ${shortAddress}: ${time}s`);
            }
            db.close();
        }
    );
};

module.exports = {
    getLeaderboard,
    getPlayerStats,
    addResult
};