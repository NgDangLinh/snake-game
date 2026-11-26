/**
 * main.js - Điểm khởi động ứng dụng và liên kết sự kiện UI
 */
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const scoreVal = document.getElementById('scoreVal');
    const highScoreVal = document.getElementById('highScoreVal');
    const levelVal = document.getElementById('levelVal');

    const overlay = document.getElementById('gameOverlay');
    const overlayTitle = document.getElementById('overlayTitle');
    const overlayMessage = document.getElementById('overlayMessage');

    const btnStart = document.getElementById('btnStart');
    const btnPause = document.getElementById('btnPause');
    const btnRestart = document.getElementById('btnRestart');
    const btnOverlayAction = document.getElementById('btnOverlayAction');
    const btnSound = document.getElementById('btnSound');
    const themeSelect = document.getElementById('themeSelect');
    const gameContainer = document.querySelector('.game-container');

    // Cập nhật trạng thái hiển thị của nút âm thanh
    function updateSoundButton(isMuted) {
        if (btnSound) {
            btnSound.innerHTML = isMuted ? '🔇' : '🔊';
            btnSound.title = isMuted ? 'Bật âm thanh' : 'Tắt âm thanh';
        }
    }

    // Hiệu ứng số điểm nảy lên khi ăn mồi
    function animateScorePop(element) {
        element.classList.remove('score-pop');
        // Kích hoạt lại reflow để lặp lại animation
        void element.offsetWidth;
        element.classList.add('score-pop');
    }

    // UI Callbacks
    const uiCallbacks = {
        onScoreChange: (score, highScore, level) => {
            if (scoreVal.textContent !== score.toString()) {
                animateScorePop(scoreVal);
            }
            scoreVal.textContent = score;
            highScoreVal.textContent = highScore;
            if (levelVal) {
                levelVal.textContent = level;
            }
        },
        onStateChange: (state, extraData) => {
            if (state === GameConfig.STATES.RUNNING) {
                overlay.classList.add('hidden');
                btnStart.classList.add('hidden');
                btnPause.classList.remove('hidden');
                btnPause.innerHTML = '⏸ Tạm dừng';
            } else if (state === GameConfig.STATES.PAUSED) {
                overlay.classList.remove('hidden');
                overlayTitle.className = 'overlay-title paused';
                overlayTitle.textContent = 'ĐÃ TẠM DỪNG';
                overlayMessage.textContent = 'Nhấn phím Cách (Space) hoặc bấm Tiếp tục để chơi tiếp';
                btnOverlayAction.textContent = '▶ Tiếp tục chơi';
                btnPause.innerHTML = '▶ Tiếp tục';
            } else if (state === GameConfig.STATES.GAME_OVER) {
                overlay.classList.remove('hidden');
                overlayTitle.className = 'overlay-title game-over';
                overlayTitle.textContent = 'TRÒ CHƠI KẾT THÚC';
                overlayMessage.innerHTML = `Điểm số: <strong style="color:#10b981">${extraData.score}</strong> | Cấp độ: <strong>${extraData.level}</strong><br>Kỷ lục: <strong style="color:#f59e0b">${extraData.highScore}</strong>`;
                btnOverlayAction.textContent = '🔄 Chơi lại';
                btnStart.classList.add('hidden');
                btnPause.classList.add('hidden');
            } else if (state === GameConfig.STATES.READY) {
                overlay.classList.add('hidden');
                btnStart.classList.remove('hidden');
                btnPause.classList.add('hidden');
            }
        }
    };

    // Khởi tạo Game Engine
    const game = new GameEngine(canvas, uiCallbacks);

    // Cài đặt ban đầu cho nút âm thanh
    updateSoundButton(game.soundManager.isMuted);

    // Xử lý bật/tắt âm thanh
    if (btnSound) {
        btnSound.addEventListener('click', () => {
            const isMuted = game.soundManager.toggleMute();
            updateSoundButton(isMuted);
        });
    }

    // Xử lý đổi Theme
    if (themeSelect) {
        themeSelect.addEventListener('change', (e) => {
            const theme = e.target.value;
            game.setTheme(theme);
            // Cập nhật class trên container
            gameContainer.classList.remove('theme-cyberpunk', 'theme-synthwave');
            gameContainer.classList.add(`theme-${theme}`);
        });
    }

    // Xử lý phím bàn phím
    document.addEventListener('keydown', (e) => {
        const key = e.code;

        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(key)) {
            e.preventDefault();
        }

        switch (key) {
            case 'ArrowUp':
            case 'KeyW':
                game.handleDirectionInput(GameConfig.DIRECTIONS.UP);
                break;
            case 'ArrowDown':
            case 'KeyS':
                game.handleDirectionInput(GameConfig.DIRECTIONS.DOWN);
                break;
            case 'ArrowLeft':
            case 'KeyA':
                game.handleDirectionInput(GameConfig.DIRECTIONS.LEFT);
                break;
            case 'ArrowRight':
            case 'KeyD':
                game.handleDirectionInput(GameConfig.DIRECTIONS.RIGHT);
                break;
            case 'Space':
                game.togglePause();
                break;
            case 'KeyR':
                game.restart();
                break;
            case 'KeyM':
                const isMuted = game.soundManager.toggleMute();
                updateSoundButton(isMuted);
                break;
        }
    });

    // Các nút bấm chính
    btnStart.addEventListener('click', () => game.start());
    btnPause.addEventListener('click', () => game.togglePause());
    btnRestart.addEventListener('click', () => game.restart());
    btnOverlayAction.addEventListener('click', () => {
        if (game.state === GameConfig.STATES.PAUSED) {
            game.resume();
        } else if (game.state === GameConfig.STATES.GAME_OVER) {
            game.restart();
        }
    });
});
