/**
 * game.js - Bộ điều khiển trung tâm (Game Engine & State Management)
 */
class GameEngine {
    constructor(canvas, uiCallbacks) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.config = GameConfig;
        this.uiCallbacks = uiCallbacks;

        this.soundManager = new SoundManager();
        this.particleSystem = new ParticleSystem();

        this.snake = new Snake(this.config);
        this.food = new Food(this.config);

        this.state = this.config.STATES.READY;
        this.score = 0;
        this.level = 1;
        this.highScore = this.loadHighScore();

        this.loopTimer = null;
        this.currentSpeed = this.config.INITIAL_SPEED;
        this.normalFoodEatenCount = 0;

        this.resetGame();
    }

    loadHighScore() {
        try {
            const saved = localStorage.getItem('snake_game_high_score');
            return saved ? parseInt(saved, 10) : 0;
        } catch (e) {
            return 0;
        }
    }

    saveHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            try {
                localStorage.setItem('snake_game_high_score', this.highScore.toString());
            } catch (e) {}
        }
    }

    setTheme(themeName) {
        if (this.config.THEMES[themeName]) {
            this.config.CURRENT_THEME = themeName;
            this.render();
        }
    }

    resetGame() {
        this.stopLoop();
        this.state = this.config.STATES.READY;
        this.score = 0;
        this.level = 1;
        this.normalFoodEatenCount = 0;
        this.currentSpeed = this.config.INITIAL_SPEED;

        this.particleSystem.clear();
        this.snake.reset();
        this.food.spawn(this.snake.segments, false);

        this.render();
        this.uiCallbacks.onScoreChange(this.score, this.highScore, this.level);
    }

    start() {
        if (this.state === this.config.STATES.RUNNING) return;

        this.soundManager.initContext();
        this.state = this.config.STATES.RUNNING;
        this.uiCallbacks.onStateChange(this.state);
        this.startLoop();
    }

    pause() {
        if (this.state !== this.config.STATES.RUNNING) return;

        this.state = this.config.STATES.PAUSED;
        this.stopLoop();
        this.uiCallbacks.onStateChange(this.state);
    }

    resume() {
        if (this.state !== this.config.STATES.PAUSED) return;

        this.state = this.config.STATES.RUNNING;
        this.uiCallbacks.onStateChange(this.state);
        this.startLoop();
    }

    togglePause() {
        if (this.state === this.config.STATES.RUNNING) {
            this.pause();
        } else if (this.state === this.config.STATES.PAUSED) {
            this.resume();
        } else if (this.state === this.config.STATES.READY) {
            this.start();
        }
    }

    restart() {
        this.resetGame();
        this.start();
    }

    startLoop() {
        this.stopLoop();
        this.loopTimer = setInterval(() => this.tick(), this.currentSpeed);
    }

    stopLoop() {
        if (this.loopTimer) {
            clearInterval(this.loopTimer);
            this.loopTimer = null;
        }
    }

    tick() {
        if (this.state !== this.config.STATES.RUNNING) return;

        // Cập nhật các hạt ánh sáng
        this.particleSystem.update();

        // Kiểm tra mồi vàng hết hạn thời gian
        if (this.food.isExpired()) {
            this.food.spawn(this.snake.segments, false);
        }

        // Cập nhật vị trí rắn
        const newHead = this.snake.update();

        // 1. Kiểm tra va chạm biên hoặc thân
        if (this.snake.checkWallCollision() || this.snake.checkSelfCollision()) {
            this.handleGameOver();
            return;
        }

        // 2. Kiểm tra ăn mồi
        if (newHead.x === this.food.x && newHead.y === this.food.y) {
            this.handleEatFood();
        }

        // 3. Vẽ lại khung hình
        this.render();
    }

    handleEatFood() {
        const size = this.config.GRID_SIZE;
        const foodPixelX = this.food.x * size + size / 2;
        const foodPixelY = this.food.y * size + size / 2;

        this.snake.grow();

        if (this.food.isGolden) {
            // Ăn mồi vàng: +3 điểm, âm thanh đặc biệt, hạt nổ vàng rực rỡ
            this.score += this.config.GOLDEN_FOOD_SCORE;
            this.soundManager.playGoldenEatSound();
            this.particleSystem.burst(foodPixelX, foodPixelY, this.config.COLORS.goldenFood, 24);
            // Quay lại sinh mồi thường
            this.food.spawn(this.snake.segments, false);
        } else {
            // Ăn mồi thường: +1 điểm, âm bloop, hạt nổ
            this.score += 1;
            this.normalFoodEatenCount++;
            this.soundManager.playEatSound();
            this.particleSystem.burst(foodPixelX, foodPixelY, this.config.COLORS.food, 14);

            // Kiểm tra kích hoạt mồi vàng
            if (this.normalFoodEatenCount % this.config.GOLDEN_FOOD_INTERVAL === 0) {
                this.food.spawn(this.snake.segments, true);
            } else {
                this.food.spawn(this.snake.segments, false);
            }
        }

        // Cập nhật cấp độ (Level)
        this.level = Math.floor(this.score / 5) + 1;

        if (this.score > this.highScore) {
            this.saveHighScore();
        }

        this.uiCallbacks.onScoreChange(this.score, this.highScore, this.level);

        // Tăng tốc dần theo điểm
        if (this.score % 2 === 0 && this.currentSpeed > this.config.MIN_SPEED) {
            this.currentSpeed = Math.max(
                this.config.MIN_SPEED,
                this.config.INITIAL_SPEED - (this.level - 1) * this.config.SPEED_STEP
            );
            this.startLoop();
        }
    }

    handleGameOver() {
        this.state = this.config.STATES.GAME_OVER;
        this.stopLoop();
        this.soundManager.playGameOverSound();

        // Tạo hiệu ứng nổ tại đầu rắn khi đâm
        const head = this.snake.segments[0];
        const size = this.config.GRID_SIZE;
        this.particleSystem.burst(head.x * size + size / 2, head.y * size + size / 2, '#ef4444', 28);

        this.saveHighScore();
        this.uiCallbacks.onScoreChange(this.score, this.highScore, this.level);
        this.uiCallbacks.onStateChange(this.state, {
            score: this.score,
            highScore: this.highScore,
            level: this.level
        });
        this.render();
    }

    handleDirectionInput(direction) {
        if (this.state === this.config.STATES.READY) {
            this.start();
        }
        if (this.state === this.config.STATES.RUNNING) {
            this.snake.changeDirection(direction);
        }
    }

    render() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const colors = this.config.COLORS;

        // Xóa màn hình với màu nền Theme
        ctx.fillStyle = colors.canvasBg;
        ctx.fillRect(0, 0, width, height);

        // Vẽ lưới mờ
        this.drawGrid();

        // Vẽ thức ăn
        this.food.draw(ctx);

        // Vẽ con rắn
        this.snake.draw(ctx);

        // Vẽ các tia hạt ánh sáng
        this.particleSystem.draw(ctx);
    }

    drawGrid() {
        const ctx = this.ctx;
        const size = this.config.GRID_SIZE;
        const cols = this.config.COLS;
        const rows = this.config.ROWS;

        ctx.save();
        ctx.strokeStyle = this.config.COLORS.gridLine;
        ctx.lineWidth = 0.5;
        ctx.beginPath();

        for (let c = 0; c <= cols; c++) {
            ctx.moveTo(c * size, 0);
            ctx.lineTo(c * size, this.canvas.height);
        }
        for (let r = 0; r <= rows; r++) {
            ctx.moveTo(0, r * size);
            ctx.lineTo(this.canvas.width, r * size);
        }

        ctx.stroke();
        ctx.restore();
    }
}
