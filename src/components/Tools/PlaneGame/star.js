// 星星类 - 用于星空背景
class Star {
  constructor(x, y, canvasWidth, canvasHeight) {
    this.x = x;
    this.y = y;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.size = Math.random() * 2 + 0.5;
    this.speed = Math.random() * 0.5 + 0.1;
    this.color = this.getRandomColor();
    this.alpha = Math.random() * 0.8 + 0.2;
  }
  
  getRandomColor() {
    const colors = ['#ffffff', '#ffd700', '#00ffff', '#ff69b4', '#9370db'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  update() {
    this.y += this.speed;
    if (this.y > this.canvasHeight) {
      this.y = 0;
      this.x = Math.random() * this.canvasWidth;
      this.size = Math.random() * 2 + 0.5;
    }
  }
  
  draw(ctx) {
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    
    // 添加星星闪烁效果
    if (Math.random() > 0.95) {
      ctx.globalAlpha = this.alpha + 0.5;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }
}

export default Star;
