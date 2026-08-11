const LONG_PRESS_MS = 500;
const MOUSE_SLOP_SQ = 25;
const TOUCH_SLOP_SQ = 144;

export function createInput(element, {onSelect, onModeChange}) {
    let touchInput = window.matchMedia('(pointer: coarse)').matches;
    let gesture = null;

    document.body.classList.toggle('input-touch', touchInput);

    function setInputMode(touch) {
        if (touch === touchInput) return;
        touchInput = touch;
        document.body.classList.toggle('input-touch', touch);
        onModeChange?.();
    }

    function endGesture() {
        if (gesture?.timer) clearTimeout(gesture.timer);
        gesture = null;
    }

    function onPointerDown(e) {
        const touch = e.pointerType !== 'mouse';
        setInputMode(touch);

        if (gesture) {
            endGesture();
            return;
        }
        if (!touch && e.button !== 2) return;

        gesture = {id: e.pointerId, x: e.clientX, y: e.clientY, touch, longPress: false, timer: null};

        if (touch) {
            gesture.timer = setTimeout(() => {
                if (!gesture) return;
                gesture.longPress = true;
                navigator.vibrate?.(15);
                onSelect(gesture.x, gesture.y, true);
            }, LONG_PRESS_MS);
        }
    }

    function onPointerMove(e) {
        if (gesture?.id !== e.pointerId) return;
        const dx = e.clientX - gesture.x;
        const dy = e.clientY - gesture.y;
        if (dx * dx + dy * dy > (gesture.touch ? TOUCH_SLOP_SQ : MOUSE_SLOP_SQ)) endGesture();
    }

    function onPointerUp(e) {
        if (gesture?.id !== e.pointerId) return;
        const {longPress, touch} = gesture;
        endGesture();
        if (longPress) return;  // already handled when the timer fired
        onSelect(e.clientX, e.clientY, !touch && e.shiftKey);
    }

    element.addEventListener('pointerdown', onPointerDown);
    element.addEventListener('pointermove', onPointerMove);
    element.addEventListener('pointerup', onPointerUp);
    element.addEventListener('pointercancel', endGesture);
    element.addEventListener('contextmenu', (e) => e.preventDefault());

    return {isTouchInput: () => touchInput};
}
