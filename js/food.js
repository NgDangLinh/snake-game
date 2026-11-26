/**
 * food.js - Quản lý sinh tọa độ và vẽ mồi thường và mồi vàng đặc biệt
 */
class Food {
    constructor(config) {
        this.config = config;
        this.x = 0;
        this.y = 0;
        this.isGolden = false;
        this.goldenExpiresAt = 0;
    }

    /**
     * Sinh tọa độ mồi mới, đảm bảo KHÔNG trùng với bất kỳ đốt nào của thân rắn
     * @param {Array<{x: number, y: number}>} snakeSegments 
     * @param {boolean} isGolden 
     */
    spawn(snakeSegments, isGolden = false) {
        const cols = this.config.COLS;
        const rows = this.config.ROWS;
        let valid = false;

        while (!valid) {
            this.x = Math.floor(Math.random() * cols);
            this.y = Math.floor(Math.random() * rows);

            const collidesWithSnake = snakeSegments.some(
                segment => segment.x === this.x && segment.y === this.y
            );

            if (!collidesWithSnake) {
                valid = true;
            }
        }

        this.isGolden = isGolden;
        if (isGolden) {
            this.goldenExpiresAt = Date.now() + this.config.GOLDEN_FOOD_LIFESPAN;
        } else {
            this.goldenExpiresAt = 0;
        }
    }

    isExpired() {
        return this.isGolden && Date.now() > this.goldenExpiresAt;
    }

    /**
     * Vẽ mồi lên canvas (tự động phát hiện loại thường hay vàng)
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx) {
        const size = this.config.GRID_SIZE;
        const centerX = this.x * size + size / 2;
        const centerY = this.y * size + size / 2;
        const colors = this.config.COLORS;

        ctx.save();

        if (this.isGolden) {
            // Mồi vàng đặc biệt: Hiệu ứng nhịp đập & vòng xoay đếm ngược
            const remaining = Math.max(0, this.goldenExpiresAt - Date.now());
            const progress = remaining / this.config.GOLDEN_FOOD_LIFESPAN;
            const pulse = 1 + Math.sin(Date.now() / 150) * 0.12;

            const radius = (size * 0.44) * pulse;

            // Vòng hào quang phát sáng
            ctx.shadowColor = colors.goldenGlow;
            ctx.shadowBlur = 15;

            // Vòng tiến trình tròn bao quanh đếm ngược thời gian
            ctx.strokeStyle = colors.goldenFood;
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.arc(centerX, centerY, size * 0.48, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
            ctx.stroke();

            // Thân quả táo vàng
            ctx.fillStyle = colors.goldenFood;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fill();

            // Điểm sáng kim cương bên trong
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(centerX - radius * 0.35, centerY - radius * 0.35, radius * 0.28, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Mồi đỏ bình thường
            const radius = size * 0.42;

            ctx.shadowColor = colors.foodGlow;
            ctx.shadowBlur = 10;

            ctx.fillStyle = colors.food;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fill();

            // Cuống lá nhỏ xinh
            ctx.shadowBlur = 0;
            ctx.fillStyle = colors.foodStem;
            ctx.beginPath();
            ctx.ellipse(centerX + 2, centerY - radius + 1, 3, 1.5, Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();

            // Đốm sáng tạo độ bóng 3D
            ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.beginPath();
            ctx.arc(centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.25, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}
