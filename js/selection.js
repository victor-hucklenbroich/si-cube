export function createSelection(faces) {
    const selected = new Set();

    const has = (idx) => selected.has(idx);
    const indices = () => Array.from(selected);
    const isEmpty = () => selected.size === 0;
    const referenceIndex = () => (isEmpty() ? -1 : selected.values().next().value);

    function toggleFace(idx) {
        if (selected.has(idx)) selected.delete(idx);
        else selected.add(idx);
    }

    function toggleFamily(clickedIdx) {
        const family = faces[clickedIdx].family;
        const ids = faces.reduce((acc, face, i) => {
            if (face.family === family) acc.push(i);
            return acc;
        }, []);

        if (ids.every(has)) {
            ids.forEach((i) => selected.delete(i));
            return;
        }
        // Add the clicked face first so it becomes the reference plane
        selected.add(clickedIdx);
        ids.forEach((i) => selected.add(i));
    }

    function set(indices) {
        selected.clear();
        indices.forEach((idx) => selected.add(idx));
    }

    function clear() {
        selected.clear();
    }

    return {has, indices, isEmpty, referenceIndex, toggleFace, toggleFamily, set, clear};
}
