// 加成包类
class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.size = 15;
    // 添加速度分量，支持反弹
    this.vx = 0; // 水平速度
    this.vy = 2; // 垂直速度
    this.color = this.getTypeColor();
    this.symbol = this.getTypeSymbol();
  }
  
  getTypeColor() {
    switch(this.type) {
      case 'health': return '#4ecdc4'; // 青色
      case 'attack': return '#ff6b6b'; // 红色
      case 'invincible': return '#45b7d1'; // 蓝色
      case 'upgrade': return '#ff9f43'; // 橙色
      default: return '#95e1d3'; // 浅绿色
    }
  }
  
  getTypeSymbol() {
    switch(this.type) {
      case 'health': return '❤️';
      case 'attack': return '⚡';
      case 'invincible': return '✨';
      case 'upgrade': return '📈';
      default: return '🎁';
    }
  }
  
  update(canvasWidth, canvasHeight) {
    // 更新位置
    this.x += this.vx;
    this.y += this.vy;
    
    // 边界检测和反弹
    // 左右边界
    if (this.x - this.size <= 0 || this.x + this.size >= canvasWidth) {
      this.vx = -this.vx * 0.8; // 反弹并衰减
      // 确保不会卡在边界外
      this.x = Math.max(this.size, Math.min(canvasWidth - this.size, this.x));
    }
    
    // 上下边界
    if (this.y - this.size <= 0 || this.y + this.size >= canvasHeight) {
      this.vy = -this.vy * 0.8; // 反弹并衰减
      // 确保不会卡在边界外
      this.y = Math.max(this.size, Math.min(canvasHeight - this.size, this.y));
    }
  }
  
  draw(ctx) {
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    
    // 绘制加成包
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // 绘制符号
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(this.symbol, this.x, this.y + 5);
    
    ctx.restore();
  }
  
  isOutOfBounds(canvasWidth, canvasHeight) {
    // 加成包不再出界，始终在地图内反弹
    return false;
  }
}

export default PowerUp;
