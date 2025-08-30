class GameLogic {
    constructor() {
        this.activeGames = {};
    }

    startGame(req, res) {
        try {
            const { address } = req.user;
            
            this.activeGames[address] = {
                startTime: Date.now(),
                completed: false
            };
            
            res.json({ success: true, message: 'Game started' });
        } catch (error) {
            console.error('Start game error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    finishGame(req, res) {
        try {
            const { address } = req.user;
            const { time } = req.body;
            
            console.log(`Finishing game for address: ${address}, time: ${time}`);
            
            // Добавляем результат в лидерборд
            const leaderboard = require('./leaderboard');
            leaderboard.addResult(address, time);
            
            // Удаляем игру из активных
            delete this.activeGames[address];
            
            res.json({ 
                success: true, 
                time: time,
                message: 'Game completed successfully'
            });
        } catch (error) {
            console.error('Finish game error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

// Экспортируем экземпляр класса
module.exports = new GameLogic();