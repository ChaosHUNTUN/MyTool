import React, { useEffect, useRef } from 'react';

const ParticleEffect = ({ isDarkMode }) => {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef(null);

  // 粒子类
  class Particle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.size = Math.random() * 2 + 0.5;
      this.speedX = Math.random() * 2 - 1;
      this.speedY = Math.random() * 2 - 1;
      
      // 丰富的颜色选项
      const colors = isDarkMode ? 
        [
          `rgba(24, 144, 255, ${Math.random() * 0.8 + 0.2})`,
          `rgba(52, 211, 153, ${Math.random() * 0.8 + 0.2})`,
          `rgba(247, 112, 148, ${Math.random() * 0.8 + 0.2})`,
          `rgba(250, 204, 21, ${Math.random() * 0.8 + 0.2})`,
          `rgba(165, 180, 252, ${Math.random() * 0.8 + 0.2})`
        ] : 
        [
          `rgba(24, 144, 255, ${Math.random() * 0.6 + 0.4})`,
          `rgba(52, 211, 153, ${Math.random() * 0.6 + 0.4})`,
          `rgba(247, 112, 148, ${Math.random() * 0.6 + 0.4})`,
          `rgba(250, 204, 21, ${Math.random() * 0.6 + 0.4})`,
          `rgba(165, 180, 252, ${Math.random() * 0.6 + 0.4})`
        ];
      
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.life = 1;
      this.decay = Math.random() * 0.03 + 0.01;
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.life -= this.decay;
      this.size *= 0.98;
    }

    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = this.life;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    isDead() {
      return this.life <= 0 || this.size <= 0.1;
    }
  }

  // 初始化Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // 设置Canvas大小
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 鼠标移动事件 - 使用节流优化，减少生成频率
    let lastMouseMove = 0;
    const handleMouseMove = (e) => {
      const now = Date.now();
      if (now - lastMouseMove < 16) return; // 约60fps
      
      lastMouseMove = now;
      mouseRef.current = {
        x: e.clientX,
        y: e.clientY
      };
      
      // 每次移动生成2个粒子，减少绘制压力
      for (let i = 0; i < 2; i++) {
        particlesRef.current.push(new Particle(e.clientX, e.clientY));
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    // 动画循环 - 优化性能
    const animate = () => {
      // 使用requestAnimationFrame确保帧率稳定
      animationRef.current = requestAnimationFrame(animate);
      
      // 清空画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 更新和绘制粒子
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const particle = particlesRef.current[i];
        particle.update();
        
        if (particle.isDead()) {
          particlesRef.current.splice(i, 1);
          continue;
        }
        
        particle.draw(ctx);
      }
      
      // 更严格地限制粒子数量，提高性能
      if (particlesRef.current.length > 60) {
        particlesRef.current = particlesRef.current.slice(-60);
      }
    };

    animate();

    // 清理函数
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isDarkMode]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
};

export default ParticleEffect;