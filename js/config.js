/**
 * config.js - Các tham số cấu hình chung cho Game Con Rắn
 */
const GameConfig = {
    // Kích thước lưới
    GRID_SIZE: 20,       // Mỗi ô 20x20 pixel
    CANVAS_WIDTH: 400,
    CANVAS_HEIGHT: 400,

    get COLS() {
        return Math.floor(this.CANVAS_WIDTH / this.GRID_SIZE);
    },
    get ROWS() {
        return Math.floor(this.CANVAS_HEIGHT / this.GRID_SIZE);
    },

    // Tốc độ game nhạy và chuẩn arcade (ms/nhịp)
    INITIAL_SPEED: 85,
    MIN_SPEED: 45,
    SPEED_STEP: 3,

    // Chế độ hiển thị: true = Mượt 60 FPS (Smooth), false = Cổ điển (Classic Arcade)
    SMOOTH_MODE: true,

    // Cấu hình mồi đặc biệt (Quả táo vàng)
    GOLDEN_FOOD_INTERVAL: 5,   // Cứ ăn 5 mồi thường sẽ có cơ hội xuất hiện 1 mồi vàng
    GOLDEN_FOOD_LIFESPAN: 7000, // Tồn tại trong 7 giây
    GOLDEN_FOOD_SCORE: 3,      // Ăn mồi vàng được +3 điểm

    // Bộ sưu tập các chủ đề giao diện (Themes)
    THEMES: {
        cyberpunk: {
            name: 'Cyberpunk',
            canvasBg: '#0b1120',
            gridLine: 'rgba(30, 41, 59, 0.5)',
            snakeHead: '#10b981',
            snakeBodyStart: '#10b981',
            snakeBodyEnd: '#06b6d4',
            snakeEye: '#ffffff',
            snakePupil: '#0f172a',
            food: '#ef4444',
            foodGlow: 'rgba(239, 68, 68, 0.6)',
            foodStem: '#22c55e',
            goldenFood: '#f59e0b',
            goldenGlow: 'rgba(245, 158, 11, 0.7)'
        },
        synthwave: {
            name: 'Synthwave',
            canvasBg: '#180d2b',
            gridLine: 'rgba(112, 26, 117, 0.35)',
            snakeHead: '#ec4899',
            snakeBodyStart: '#ec4899',
            snakeBodyEnd: '#8b5cf6',
            snakeEye: '#ffffff',
            snakePupil: '#2e1065',
            food: '#06b6d4',
            foodGlow: 'rgba(6, 182, 212, 0.6)',
            foodStem: '#a855f7',
            goldenFood: '#facc15',
            goldenGlow: 'rgba(250, 204, 21, 0.8)'
        }
    },

    CURRENT_THEME: 'cyberpunk',

    get COLORS() {
        return this.THEMES[this.CURRENT_THEME] || this.THEMES.cyberpunk;
    },

    // Trạng thái game
    STATES: {
        READY: 'READY',
        RUNNING: 'RUNNING',
        PAUSED: 'PAUSED',
        GAME_OVER: 'GAME_OVER'
    },

    // Hướng di chuyển
    DIRECTIONS: {
        UP: { x: 0, y: -1, name: 'UP' },
        DOWN: { x: 0, y: 1, name: 'DOWN' },
        LEFT: { x: -1, y: 0, name: 'LEFT' },
        RIGHT: { x: 1, y: 0, name: 'RIGHT' }
    }
};
