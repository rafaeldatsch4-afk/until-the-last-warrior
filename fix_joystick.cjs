const fs = require('fs');

let file = fs.readFileSync('game/scenes/BattleScene.ts', 'utf8');

file = file.replace(/\/\/ \-\-\- Virtual Joystick \-\-\-[\s\S]*?\/\/ \-\-\- End Virtual Joystick \-\-\-/g,
`// --- Virtual Joystick ---
    const joyBaseX = 140;
    const joyBaseY = 440;
    const joyBase = this.add.circle(joyBaseX, joyBaseY, 70, 0x000000, 0.4);
    const joyThumb = this.add.circle(joyBaseX, joyBaseY, 35, 0xffffff, 0.6);
    this.mobileControls.push(joyBase, joyThumb);
    
    if (this.uiContainer) {
        this.uiContainer.add(joyBase);
        this.uiContainer.add(joyThumb);
    } else {
        joyBase.setScrollFactor(0).setDepth(100);
        joyThumb.setScrollFactor(0).setDepth(101);
    }

    joyBase.setInteractive();
    
    let joyRootX = joyBaseX;
    let joyRootY = joyBaseY;

    // Use camera-relative coordinates if inside uiContainer to match screen
    const getLocalPnt = (pointer) => {
        if (!this.uiContainer) return { x: pointer.x, y: pointer.y };
        return {
           x: (pointer.x - this.uiContainer.x) / this.uiContainer.scaleX,
           y: (pointer.y - this.uiContainer.y) / this.uiContainer.scaleY
        };
    };

    const handleJoystickMove = (pointer) => {
        if (this.mobileJoystickPointerId === pointer.id) {
            const loc = getLocalPnt(pointer);
            let dx = loc.x - joyRootX;
            let dy = loc.y - joyRootY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxDist = 45;
            if (dist > maxDist) {
                dx = (dx / dist) * maxDist;
                dy = (dy / dist) * maxDist;
            }
            joyThumb.setPosition(joyRootX + dx, joyRootY + dy);
            this.mobileJoystickVector = { x: dx / maxDist, y: dy / maxDist };
            
            // Allow jumping using joystick (push up)
            if (this.mobileJoystickVector.y < -0.6) {
                this.keys.p1_up.isDown = true;
            } else {
                this.keys.p1_up.isDown = false;
            }
        }
    };

    this.input.on('pointerdown', (pointer) => {
        // Activate joystick anywhere on the left side of the screen
        if (pointer.x < 480 && pointer.y > 100 && this.mobileJoystickPointerId === null) {
            this.mobileJoystickPointerId = pointer.id;
            joyBase.setAlpha(0.6);
            
            const loc = getLocalPnt(pointer);
            joyRootX = loc.x;
            joyRootY = loc.y;
            joyBase.setPosition(joyRootX, joyRootY);
            joyThumb.setPosition(joyRootX, joyRootY);
            
            handleJoystickMove(pointer);
        }
    });

    this.input.on('pointermove', handleJoystickMove);

    const releaseJoystick = (pointer) => {
        if (this.mobileJoystickPointerId === pointer.id) {
            this.mobileJoystickPointerId = null;
            joyBase.setAlpha(0.4);
            joyRootX = joyBaseX;
            joyRootY = joyBaseY;
            joyBase.setPosition(joyRootX, joyRootY);
            joyThumb.setPosition(joyRootX, joyRootY);
            this.mobileJoystickVector = { x: 0, y: 0 };
            this.keys.p1_up.isDown = false;
        }
    };

    this.input.on('pointerup', releaseJoystick);
    this.input.on('pointerout', releaseJoystick);
    // --- End Virtual Joystick ---`);

fs.writeFileSync('game/scenes/BattleScene.ts', file);
console.log("Joystick updated to be floating and smoother.");
