class MonadColoringGame {
    constructor() {
        this.isPlaying = false;
        this.startTime = 0;
        this.timerInterval = null;
        this.completionCheckInterval = null;
        this.canvas = document.getElementById('monadCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.brushSize = 50;
        this.completionThreshold = 0.995;
        this.isFinished = false;
        this.lastCompletionCheck = 0;
        
        // Загрузка логотипа
        this.logoImg = new Image();
        this.logoImg.onload = () => {
            console.log('Logo image loaded successfully');
            this.drawLogoOutline();
            this.createMask();
        };
        this.logoImg.onerror = (e) => {
            console.error('Failed to load logo image', e);
        };
        
        // Исходный SVG логотипа Monad (белый цвет)
        this.logoImg.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIiBmaWxsPSJub25lIj4gPHBhdGggZD0iTTE1LjkyMSAwQzExLjMyMzQgMCAwIDExLjM3OTIgMCAxNS45OTk5QzAgMjAuNjIwNiAxMS4zMjM0IDMyIDE1LjkyMSAzMkMyMC41MTg2IDMyIDMxLjg0MjIgMjAuNjIwNCAzMS44NDIyIDE1Ljk5OTlDMzEuODQyMiAxMS4zNzk0IDIwLjUxODggMCAxNS45MjEgMFpNMTMuNDQgMjUuMTQ5MkMxMS41MDEyIDI0LjYxODMgNi4yODY0IDE1LjQ1NSA2LjgxNzA0IDEzLjUwNjZDNy4zNDc2OCAxMS41NTgxIDE2LjQ2MzQgNi4zMTk3OSAxOC40MDIxIDYuODUwOEMyMC4zNDEgNy4zODE3MyAyNS41NTM1IDE2LjU0NDkgMjUuMDIzIDE4LjQ5MzRDMjQuNDkyNiAyMC40NDE4IDE1LjM3ODcgMjUuNjgwMiAxMy40NCAyNS4xNDkyWiIgZmlsbD0id2hpdGUiIC8+PC9zdmc+";
        
        // Добавляем обработчики для модального окна
        document.getElementById('continueButton').addEventListener('click', () => {
            this.hideResultModal();
        });
        
        this.setupEventListeners();
    }

    createMask() {
        // Создаем маску для ограничения рисования только внутри логотипа
        this.maskCanvas = document.createElement('canvas');
        this.maskCanvas.width = this.canvas.width;
        this.maskCanvas.height = this.canvas.height;
        this.maskCtx = this.maskCanvas.getContext('2d');
        
        // Рисуем логотип на маске
        this.maskCtx.drawImage(this.logoImg, 0, 0, this.maskCanvas.width, this.maskCanvas.height);
        
        // Получаем данные пикселей для проверки
        this.maskImageData = this.maskCtx.getImageData(0, 0, this.maskCanvas.width, this.maskCanvas.height);
        this.maskPixels = new Uint32Array(this.maskImageData.data.buffer);
        
        // Создаем упрощенную маску для быстрой проверки завершения
        this.createOptimizedMask();
    }

    createOptimizedMask() {
        // Создаем упрощенную маску для более быстрой проверки завершения
        this.optimizedMask = [];
        const sampleRate = 2; // Проверяем каждый 2-й пиксель для увеличения производительности
        
        for (let y = 0; y < this.maskImageData.height; y += sampleRate) {
            for (let x = 0; x < this.maskImageData.width; x += sampleRate) {
                const pixelIndex = y * this.maskImageData.width + x;
                if (this.maskPixels[pixelIndex] !== 0) {
                    this.optimizedMask.push({x, y});
                }
            }
        }
        
        console.log(`Optimized mask created with ${this.optimizedMask.length} sample points`);
    }

    isPointInLogo(x, y) {
        // Проверяем, находится ли точка внутри логотипа
        const pixelIndex = Math.floor(y) * this.maskImageData.width + Math.floor(x);
        return this.maskPixels[pixelIndex] !== 0;
    }

    drawLogoOutline() {
        // Очищаем canvas и сбрасываем composite operation
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Рисуем белый логотип
        this.ctx.drawImage(this.logoImg, 0, 0, this.canvas.width, this.canvas.height);
    }

    startGame() {
        console.log('Start game button clicked');
        if (!auth.isConnected) {
            alert('Please connect your wallet first!');
            return;
        }

        this.isPlaying = true;
        this.isFinished = false;
        this.startTime = Date.now();
        this.startTimer();
        
        // Очищаем canvas и рисуем только контур
        this.drawLogoOutline();
        
        // Переключаем видимость элементов
        document.getElementById('rules').style.display = 'none';
        document.getElementById('game-area').style.display = 'block';
        
        // Запускаем проверку завершения игры
        this.startCompletionCheck();
        
        // Отправляем запрос на начало игры
        fetch('http://localhost:3000/game/start', {
            method: 'POST',
            headers: auth.getAuthHeaders()
        })
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                console.error('Failed to start game:', data.error);
            }
        })
        .catch(error => {
            console.error('Error starting game:', error);
        });
    }

    showResultModal(time) {
        document.getElementById('resultTime').textContent = time.toFixed(2);
        
        // Формируем ссылку для твита
        const tweetText = `I just completed the Monad Coloring Challenge in ${time.toFixed(2)} seconds! Try it yourself at ${window.location.href}`;
        const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
        document.getElementById('tweetResult').href = tweetUrl;
        
        // Показываем модальное окно
        document.getElementById('resultModal').style.display = 'block';
    }

    hideResultModal() {
        document.getElementById('resultModal').style.display = 'none';
        this.resetGame();
    }

    finishGame(isCompleted = false) {
        if (!this.isPlaying || this.isFinished) return;
        
        this.isFinished = true;
        this.isPlaying = false;
        clearInterval(this.timerInterval);
        clearInterval(this.completionCheckInterval);
        const finishTime = (Date.now() - this.startTime) / 1000;
        
        if (isCompleted) {
            // Только при автоматическом завершении показываем модальное окно и сохраняем результат
            this.showResultModal(finishTime);
            
            // Отправляем результат на сервер
            fetch('http://localhost:3000/game/finish', {
                method: 'POST',
                headers: auth.getAuthHeaders(),
                body: JSON.stringify({ time: finishTime })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Обновляем таблицу лидеров
                    if (typeof updateLeaderboard === 'function') {
                        updateLeaderboard();
                    }
                    // Обновляем статистику игрока
                    if (typeof updatePlayerStats === 'function') {
                        updatePlayerStats();
                    }
                } else {
                    console.error('Failed to save result:', data.error);
                }
            })
            .catch(error => {
                console.error('Error finishing game:', error);
            });
        } else {
            // При ручном завершении просто сбрасываем игру
            this.resetGame();
        }
    }

    resetGame() {
        this.isPlaying = false;
        this.isFinished = false;
        clearInterval(this.timerInterval);
        clearInterval(this.completionCheckInterval);
        
        // Очищаем canvas и перерисовываем логотип
        this.drawLogoOutline();
        
        // Возвращаем к начальному экрану
        document.getElementById('rules').style.display = 'block';
        document.getElementById('game-area').style.display = 'none';
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            const elapsed = (Date.now() - this.startTime) / 1000;
            document.getElementById('time').textContent = elapsed.toFixed(1);
        }, 100);
    }

    startCompletionCheck() {
        this.completionCheckInterval = setInterval(() => {
            this.checkCompletion();
        }, 300); // Проверяем каждые 300ms
    }

    checkCompletion() {
        if (!this.isPlaying || this.isFinished) return;
        
        // Получаем данные текущего canvas
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data; // Получаем доступ к байтам данных
        
        let filledPixels = 0;
        let totalPixels = 0;
        
        // Используем оптимизированную маску для проверки
        for (const point of this.optimizedMask) {
            const pixelIndex = (point.y * this.maskImageData.width + point.x) * 4;
            
            // Проверяем только пиксели внутри маски
            if (this.maskPixels[point.y * this.maskImageData.width + point.x] !== 0) {
                totalPixels++;
                
                // Проверяем, что пиксель не белый (R=255, G=255, B=255)
                if (!(data[pixelIndex] === 255 && 
                      data[pixelIndex + 1] === 255 && 
                      data[pixelIndex + 2] === 255)) {
                    filledPixels++;
                }
            }
        }
        
        // Отладочная информация
        const percentage = totalPixels > 0 ? (filledPixels / totalPixels) : 0;
        
        if (Date.now() - this.lastCompletionCheck > 1000) {
            console.log(`Completion: ${(percentage * 100).toFixed(1)}% (${filledPixels}/${totalPixels})`);
            this.lastCompletionCheck = Date.now();
        }
        
        // Если заполнено достаточно логотипа, завершаем игру
        if (totalPixels > 0 && percentage > this.completionThreshold) {
            console.log("Game completed automatically!");
            this.finishGame(true);
        }
    }

    setupEventListeners() {
        // Кнопки управления игрой
        document.getElementById('startGame').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('finishGame').addEventListener('click', () => {
            this.finishGame(false); // Ручное завершение без сохранения
        });
        
        // Обработчики рисования
        this.canvas.addEventListener('mousedown', (e) => {
            if (this.isPlaying && !this.isFinished) {
                this.isDrawing = true;
                this.draw(e);
            }
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isPlaying && this.isDrawing && !this.isFinished) {
                this.draw(e);
            }
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.isDrawing = false;
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            this.isDrawing = false;
        });
    }

    draw(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        // Используем более точное определение границ
        this.ctx.globalCompositeOperation = 'source-atop';
        this.ctx.fillStyle = '#836EF9';
        
        // Рисуем с учетом границ логотипа
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.brushSize, 0, Math.PI * 2);
        
        // Создаем временный canvas для проверки границ
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Рисуем на временном canvas
        tempCtx.drawImage(this.canvas, 0, 0);
        tempCtx.globalCompositeOperation = 'source-atop';
        tempCtx.fillStyle = '#836EF9';
        tempCtx.beginPath();
        tempCtx.arc(x, y, this.brushSize, 0, Math.PI * 2);
        tempCtx.fill();
        
        // Получаем данные пикселей
        const tempImageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const tempPixels = new Uint32Array(tempImageData.data.buffer);
        
        // Проверяем, не вышли ли мы за границы
        let outOfBounds = false;
        for (let i = 0; i < tempPixels.length; i++) {
            if (tempPixels[i] === 0xff836ef9 && this.maskPixels[i] === 0) {
                outOfBounds = true;
                break;
            }
        }
        
        // Если не вышли за границы, рисуем на основном canvas
        if (!outOfBounds) {
            this.ctx.fill();
        }
        
        // Восстанавливаем composite operation
        this.ctx.globalCompositeOperation = 'source-over';
    }
}

// Инициализация игры после загрузки страницы
window.addEventListener('load', () => {
    window.game = new MonadColoringGame();
});