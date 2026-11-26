/**
 * snake.js - Quản lý chuyển động, thân gradient neon mượt mà, mắt sinh động
 */
class Snake {
    constructor(config) {
        this.config = config;
        this.reset();
    }

    reset() {
        const startX = Math.floor(this.config.COLS / 2);
        const startY = Math.floor(this.config.ROWS / 2);

        this.segments = [
            { x: startX, y: startY },
            { x: startX - 1, y: startY },
            { x: startX - 2, y: startY }
        ];

        this.currentDirection = this.config.DIRECTIONS.RIGHT;
        this.directionQueue = [];
        this.shouldGrow = false;
    }

    changeDirection(newDir) {
        const lastDir = this.directionQueue.length > 0 
            ? this.directionQueue[this.directionQueue.length - 1] 
            : this.currentDirection;

        const isOpposite = (newDir.x === -lastDir.x && newDir.y === -lastDir.y);
        const isSame = (newDir.x === lastDir.x && newDir.y === lastDir.y);

        if (!isOpposite && !isSame && this.directionQueue.length < 2) {
            this.directionQueue.push(newDir);
        }
    }

    update() {
        if (this.directionQueue.length > 0) {
            this.currentDirection = this.directionQueue.shift();
        }

        const head = this.segments[0];
        const newHead = {
            x: head.x + this.currentDirection.x,
            y: head.y + this.currentDirection.y
        };

        this.segments.unshift(newHead);

        if (!this.shouldGrow) {
            this.segments.pop();
        } else {
            this.shouldGrow = false;
        }

        return newHead;
    }

    grow() {
        this.shouldGrow = true;
    }

    checkWallCollision() {
        const head = this.segments[0];
        return (
            head.x < 0 ||
            head.x >= this.config.COLS ||
            head.y < 0 ||
            head.y >= this.config.ROWS
        );
    }

    checkSelfCollision() {
        const head = this.segments[0];
        for (let i = 1; i < this.segments.length; i++) {
            if (head.x === this.segments[i].x && head.y === this.segments[i].y) {
                return true;
            }
        }
        return false;
    }

    /**
     * Vẽ con rắn với dải chuyển màu mượt mà từ đầu đến đuôi
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx) {
        const size = this.config.GRID_SIZE;
        const total = this.segments.length;
        const colors = this.config.COLORS;

        // Vẽ từ đuôi lên đầu để đầu rắn nằm đè lên trên cùng
        for (let index = total - 1; index >= 0; index--) {
            const segment = this.segments[index];
            const x = segment.x * size;
            const y = segment.y * size;

            ctx.save();

            if (index === 0) {
                // ĐẦU RẮN: Bo tròn nhiều hơn, phát sáng
                ctx.shadowColor = colors.snakeHead;
                ctx.shadowBlur = 8;
                ctx.fillStyle = colors.snakeHead;

                ctx.beginPath();
                ctx.roundRect(x + 1, y + 1, size - 2, size - 2, 7);
                ctx.fill();

                // Vẽ 2 mắt lanh lợi
                this.drawEyes(ctx, x, y, size, colors);
            } else {
                // THÂN RẮN: Thon dần về phía đuôi (từ 0 đến 1)
                const ratio = index / total;
                const shrink = ratio * 3.5; // Đuôi nhỏ hơn đầu một chút tạo hình thuôn thả
                const segSize = size - shrink;
                const offset = shrink / 2;

                // Màu chuyển nhẹ nhàng từ Start sang End
                ctx.fillStyle = this.interpolateColor(colors.snakeBodyStart, colors.snakeBodyEnd, ratio);

                ctx.beginPath();
                ctx.roundRect(x + offset, y + offset, segSize, segSize, 5);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    drawEyes(ctx, x, y, size, colors) {
        const dir = this.currentDirection.name;
        const eyeRadius = 3;
        const pupilRadius = 1.5;

        let eye1X, eye1Y, eye2X, eye2Y;

        if (dir === 'RIGHT') {
            eye1X = x + size * 0.72; eye1Y = y + size * 0.28;
            eye2X = x + size * 0.72; eye2Y = y + size * 0.72;
        } else if (dir === 'LEFT') {
            eye1X = x + size * 0.28; eye1Y = y + size * 0.28;
            eye2X = x + size * 0.28; eye2Y = y + size * 0.72;
        } else if (dir === 'UP') {
            eye1X = x + size * 0.28; eye1Y = y + size * 0.28;
            eye2X = x + size * 0.72; eye2Y = y + size * 0.28;
        } else { // DOWN
            eye1X = x + size * 0.28; eye1Y = y + size * 0.72;
            eye2X = x + size * 0.72; eye2Y = y + size * 0.72;
        }

        // Lòng trắng mắt
        ctx.fillStyle = colors.snakeEye;
        ctx.beginPath();
        ctx.arc(eye1X, eye1Y, eyeRadius, 0, Math.PI * 2);
        ctx.arc(eye2X, eye2Y, eyeRadius, 0, Math.PI * 2);
        ctx.fill();

        // Con ngươi mắt
        ctx.fillStyle = colors.snakePupil;
        ctx.beginPath();
        ctx.arc(eye1X, eye1Y, pupilRadius, 0, Math.PI * 2);
        ctx.arc(eye2X, eye2Y, pupilRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Hòa trộn màu sắc Hex RGB theo tỷ lệ
     */
    interpolateColor(hex1, hex2, factor) {
        const c1 = this.hexToRgb(hex1);
        const c2 = this.hexToRgb(hex2);
        if (!c1 || !c2) return hex1;

        const r = Math.round(c1.r + factor * (c2.r - c1.r));
        const g = Math.round(c1.g + factor * (c2.g - c1.g));
        const b = Math.round(c1.b + factor * (c2.b - c1.b));

        return `rgb(${r}, ${g}, ${b})`;
    }

    hexToRgb(hex) {
        let cleanHex = hex.replace('#', '');
        if (cleanHex.length === 3) {
            cleanHex = cleanHex.split('').map(c => c + c).join('');
        }
        const num = parseInt(cleanHex, 16);
        return {
            r: (num >> 16) & 255,
            g: (num >> 8) & 255,
            b: num & 255
        };
    }
}
