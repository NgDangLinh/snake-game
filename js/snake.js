/**
 * snake.js - Quản lý chuyển động, thân gradient neon mượt mà, mắt sinh động
 * Hỗ trợ phản hồi tức thì 0ms (Instant Pivot) và chuyển đổi mượt / cổ điển
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

        this.prevSegments = this.segments.map(s => ({ x: s.x, y: s.y }));

        this.currentDirection = this.config.DIRECTIONS.RIGHT;
        // Hướng nhìn tức thì của mắt (xoay ngay lập tức khi bấm phím, 0ms lag)
        this.facingDirection = this.currentDirection;
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
            // Xoay hướng nhìn của mắt ngay lập tức để người chơi nhận phản hồi thị giác tức thì
            this.facingDirection = newDir;
        }
    }

    update() {
        this.prevSegments = this.segments.map(s => ({ x: s.x, y: s.y }));

        if (this.directionQueue.length > 0) {
            this.currentDirection = this.directionQueue.shift();
        }
        this.facingDirection = this.currentDirection;

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
     * Vẽ con rắn: Tự động phát hiện vẽ ở chế độ mượt (Smooth) hay cổ điển (Classic)
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} progress 
     */
    draw(ctx, progress = 1) {
        const size = this.config.GRID_SIZE;
        const total = this.segments.length;
        const colors = this.config.COLORS;
        const isSmooth = this.config.SMOOTH_MODE;
        const t = isSmooth ? Math.max(0, Math.min(1, progress)) : 1;

        for (let index = total - 1; index >= 0; index--) {
            const curr = this.segments[index];
            const prev = (isSmooth && this.prevSegments && this.prevSegments[index]) 
                ? this.prevSegments[index] 
                : (this.prevSegments ? this.prevSegments[this.prevSegments.length - 1] : curr);

            // Nội suy tọa độ nếu ở chế độ Smooth, ngược lại vẽ đúng ô lưới (Classic)
            const interpX = isSmooth ? (prev.x + (curr.x - prev.x) * t) : curr.x;
            const interpY = isSmooth ? (prev.y + (curr.y - prev.y) * t) : curr.y;

            const pixelX = interpX * size;
            const pixelY = interpY * size;

            ctx.save();

            if (index === 0) {
                ctx.shadowColor = colors.snakeHead;
                ctx.shadowBlur = 8;
                ctx.fillStyle = colors.snakeHead;

                ctx.beginPath();
                ctx.roundRect(pixelX + 1, pixelY + 1, size - 2, size - 2, 7);
                ctx.fill();

                // Vẽ mắt theo hướng nhìn tức thì (facingDirection)
                this.drawEyes(ctx, pixelX, pixelY, size, colors);
            } else {
                const ratio = index / total;
                const shrink = ratio * 3.5;
                const segSize = size - shrink;
                const offset = shrink / 2;

                ctx.fillStyle = this.interpolateColor(colors.snakeBodyStart, colors.snakeBodyEnd, ratio);

                ctx.beginPath();
                ctx.roundRect(pixelX + offset, pixelY + offset, segSize, segSize, 5);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    drawEyes(ctx, x, y, size, colors) {
        const dir = this.facingDirection ? this.facingDirection.name : this.currentDirection.name;
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

        ctx.fillStyle = colors.snakeEye;
        ctx.beginPath();
        ctx.arc(eye1X, eye1Y, eyeRadius, 0, Math.PI * 2);
        ctx.arc(eye2X, eye2Y, eyeRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = colors.snakePupil;
        ctx.beginPath();
        ctx.arc(eye1X, eye1Y, pupilRadius, 0, Math.PI * 2);
        ctx.arc(eye2X, eye2Y, pupilRadius, 0, Math.PI * 2);
        ctx.fill();
    }

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
