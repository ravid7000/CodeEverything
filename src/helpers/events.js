window.mouseX = 0;
window.mouseY = 0;
window.mouseWheelDeltaX = 0;
window.mouseWheelDeltaY = 0;
window.mousePressed = false;
window.keyPressed = '';


function getMousePosFromEvent(event, i = 0) {
    const point = { clientX: 0, clientY: 0 };
    if (event.targetTouches) {
        const touched = event.targetTouches[i] || event.touches[i] || event.changedTouches[i];
        point.clientX = touched.clientX;
        point.clientY = touched.clientY;
    } else {
        point.clientX = event.clientX;
        point.clientY = event.clientY;
    }
    return point;
}

function mouseMove(e) {
    const globalThis = window || this;
    let executeDefault;
    const { clientX, clientY } = getMousePosFromEvent(e);
    globalThis.mouseX = clientX;
    globalThis.mouseY = clientY;

    if (!globalThis.mouseIsPressed) {
        if (typeof globalThis.mouseMoved === 'function') {
          executeDefault = globalThis.mouseMoved(e);
          if (executeDefault === false) {
            e.preventDefault();
          }
        }
    } else {
        if (typeof globalThis.mouseDragged === 'function') {
            executeDefault = globalThis.mouseDragged(e);
            if (executeDefault === false) {
                e.preventDefault();
            }
        } else if (typeof globalThis.touchMoved === 'function') {
            executeDefault = globalThis.touchMoved(e);
            if (executeDefault === false) {
                e.preventDefault();
            }
        }
    }
}

function mouseDown(e) {
    let executeDefault;
    const globalThis = window || this;
    globalThis.mousePressed = true;

    if (typeof globalThis.mousePressed === 'function') {
        executeDefault = globalThis.mousePressed(e);
        if (executeDefault === false) {
          e.preventDefault();
        }
    }
}

function mouseUp(e) {
    let executeDefault;
    const globalThis = window || this;
    globalThis.mousePressed = false;

    if (typeof globalThis.mouseReleased === 'function') {
        executeDefault = globalThis.mouseReleased(e);
        if (executeDefault === false) {
          e.preventDefault();
        }
    }
}

function mouseWheel(e) {
    let executeDefault;
    const globalThis = window || this;
    const { deltaX, deltaY } = e;
    const { clientX, clientY } = getMousePosFromEvent(e);
    globalThis.mouseX = clientX;
    globalThis.mouseY = clientY;
    globalThis.mouseWheelDeltaX = deltaX;
    globalThis.mouseWheelDeltaY = deltaY;

    if (typeof globalThis.mouseWheel === 'function') {
        executeDefault = globalThis.mouseWheel(e);
        if (executeDefault === false) {
          e.preventDefault();
        }
    }
}

export function initializeEventListener(elm) {
    const target = elm || document;
    /** 1. Mouse listener */
    target.addEventListener('mousemove', mouseMove);
    target.addEventListener('mousedown', mouseDown);
    target.addEventListener('mouseup', mouseUp);
    target.addEventListener('mousewheel', mouseWheel);
    console.log(target)
}
