import re

with open('game/scenes/BattleScene.ts', 'r') as f:
    content = f.read()

pattern = re.compile(r'    // Sparks & Particles using Phaser Particle System.*?this\.time\.delayedCall\(1000, \(\) => \{\n      if \(particles\) particles\.destroy\(\);\n    \}\);', re.DOTALL)

new_particles = """    // Sparks & Particles using Phaser Particle System
    const isPotato = this.gameState.settings?.lowPerformanceMode;
    const sparkCount = isPotato ? 3 : (isClash ? 35 : isBlock ? 10 : isSuperMode ? 30 : 15);
    const streakCount = isPotato ? 2 : (isClash ? 15 : isSuperMode ? 10 : 6);
    const sparkColor = isBlock ? 0x3498db : (isClash ? 0xfffc00 : color);

    // Round sparks
    const particles = this.add.particles(x, y, 'hit_spark', {
      speed: { min: isBlock ? 100 : 250, max: isClash ? 1000 : (isBlock ? 400 : 700) },
      angle: { min: 0, max: 360 },
      scale: { start: isClash ? 1.5 : 1, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: sparkColor,
      blendMode: Phaser.BlendModes.ADD,
      lifespan: { min: 300, max: isClash ? 700 : 500 },
      gravityY: isBlock ? 100 : 400,
      quantity: sparkCount,
      emitting: false
    });
    particles.setDepth(23);
    particles.explode(sparkCount);
    
    // Streaking sparks
    const streaks = this.add.particles(x, y, 'hit_spark_streak', {
      speed: { min: isBlock ? 150 : 300, max: isClash ? 1200 : (isBlock ? 500 : 900) },
      angle: { min: 0, max: 360 },
      scaleX: { start: isClash ? 2 : 1.5, end: 0 },
      scaleY: { start: 0.5, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: 0xffffff,
      blendMode: Phaser.BlendModes.ADD,
      lifespan: { min: 100, max: isClash ? 400 : 300 },
      gravityY: 0,
      quantity: streakCount,
      emitting: false,
      rotate: (particle: any, key: any, t: any) => {
        // Simple rotation alignment to velocity vector
        return Phaser.Math.RadToDeg(Math.atan2(particle.velocityY, particle.velocityX));
      }
    });
    streaks.setDepth(24);
    streaks.explode(streakCount);
        
    // Cleanup particle emitters
    this.time.delayedCall(1200, () => {
      if (particles) particles.destroy();
      if (streaks) streaks.destroy();
    });"""

if pattern.search(content):
    content = pattern.sub(new_particles, content)
    with open('game/scenes/BattleScene.ts', 'w') as f:
        f.write(content)
    print("Updated Impact effect")
else:
    print("Pattern not found!")

