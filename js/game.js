/**
 * game.js - Bộ điều khiển trung tâm (Game Engine & State Management)
 * Sử dụng requestAnimationFrame 60 FPS kết hợp Sub-grid Smooth Interpolation
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

        this.animationFrameId = null;
        this.lastTickTime = 0;
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
            this.render(1);
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

        this.render(1);
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
        this.render(1);
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

    /**
     * Khởi chạy vòng lặp đồ họa 60 FPS siêu mượt
     */
    startLoop() {
        this.stopLoop();
        this.lastTickTime = performance.now();

        const loop = (timestamp) => {
            if (this.state === this.config.STATES.RUNNING) {
                const now = timestamp || performance.now();
                const delta = now - this.lastTickTime;

                // Khi đủ khoảng thời gian nhịp tick (ví dụ: 100ms), kích hoạt di chuyển logic
                if (delta >= this.currentSpeed) {
                    this.tick();
                    this.lastTickTime = now;
                }

                // Cập nhật các hạt ánh sáng ở 60 FPS
                this.particleSystem.update();

                // Kiểm tra mồi vàng hết hạn thời gian
                if (this.food.isExpired()) {
                    this.food.spawn(this.snake.segments, false);
                }

                // Tính toán tỷ lệ tiến độ nội suy từ 0.0 đến 1.0 giữa 2 nhịp tick
                const progress = Math.min(1, (now - this.lastTickTime) / this.currentSpeed);
                this.render(progress);

                this.animationFrameId = requestAnimationFrame(loop);
            }
        };

        this.animationFrameId = requestAnimationFrame(loop);
    }

    stopLoop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    /**
     * Nhịp cập nhật logic game (Grid logic)
     */
    tick() {
        if (this.state !== this.config.STATES.RUNNING) return;

        // Cập nhật vị trí logic của rắn
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
    }

    handleEatFood() {
        const size = this.config.GRID_SIZE;
        const foodPixelX = this.food.x * size + size / 2;
        const foodPixelY = this.food.y * size + size / 2;

        this.snake.grow();

        if (this.food.isGolden) {
            this.score += this.config.GOLDEN_FOOD_SCORE;
            this.soundManager.playGoldenEatSound();
            this.particleSystem.burst(foodPixelX, foodPixelY, this.config.COLORS.goldenFood, 24);
            this.food.spawn(this.snake.segments, false);
        } else {
            this.score += 1;
            this.normalFoodEatenCount++;
            this.soundManager.playEatSound();
            this.particleSystem.burst(foodPixelX, foodPixelY, this.config.COLORS.food, 14);

            if (this.normalFoodEatenCount % this.config.GOLDEN_FOOD_INTERVAL === 0) {
                this.food.spawn(this.snake.segments, true);
            } else {
                this.food.spawn(this.snake.segments, false);
            }
        }

        // Cập nhật Cấp độ (Level)
        this.level = Math.floor(this.score / 5) + 1;

        if (this.score > this.highScore) {
            this.saveHighScore();
        }

        this.uiCallbacks.onScoreChange(this.score, this.highScore, this.level);

        // Tăng tốc độ game theo cấp độ
        if (this.score % 2 === 0 && this.currentSpeed > this.config.MIN_SPEED) {
            this.currentSpeed = Math.max(
                this.config.MIN_SPEED,
                this.config.INITIAL_SPEED - (this.level - 1) * this.config.SPEED_STEP
            );
        }
    }

    handleGameOver() {
        this.state = this.config.STATES.GAME_OVER;
        this.stopLoop();
        this.soundManager.playGameOverSound();

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
        this.render(1);
    }

    handleDirectionInput(direction) {
        if (this.state === this.config.STATES.READY) {
            this.start();
        }
        if (this.state === this.config.STATES.RUNNING) {
            this.snake.changeDirection(direction);
        }
    }

    render(progress = 1) {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const colors = this.config.COLORS;

        ctx.fillStyle = colors.canvasBg;
        ctx.fillRect(0, 0, width, height);

        this.drawGrid();
        this.food.draw(ctx);
        this.snake.draw(ctx, progress);
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
