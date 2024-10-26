const COLORS = {
    'p': '#ffb6c1',
    'g': '#98fb98',
    'b': '#87cefa',
    'y': '#ffff99'
};

console.log('loaded simple highlighter');

document.addEventListener('keydown', (e) => {
    if (Object.keys(COLORS).includes(e.key.toLowerCase())) {
        console.log('highlighting', e.key.toLowerCase());
        const color = COLORS[e.key.toLowerCase()];
        highlightSelection(color);
    }
});

function highlightSelection(color) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.style.backgroundColor = color;
    span.className = 'highlighter-span';

    span.dataset.highlightId = Date.now().toString();

    range.surroundContents(span);

    saveHighlight({
        id: span.dataset.highlightId,
        color: color,
        text: span.textContent,
        xpath: getXPath(span),
        url: window.location.href
    });
}

function getXPath(element) {
    if (element.id !== '') {
        return `//*[@id="${element.id}"]`;
    }
    if (element === document.body) {
        return '/html/body';
    }

    let ix = 0;
    const siblings = element.parentNode.childNodes;

    for (let sibling of siblings) {
        if (sibling === element) {
            const path = getXPath(element.parentNode);
            const tag = element.tagName.toLowerCase();
            return `${path}/${tag}[${ix + 1}]`;
        }
        if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
            ix++;
        }
    }
}

function loadHighlights() {
    console.log('loading highlights');
    chrome.storage.local.get(['highlights'], (result) => {
        console.log('loaded highlights:', result.highlights);
        const urlHighlights = result.highlights?.[window.location.href] || [];

        urlHighlights.forEach(highlight => {
            try {
                const element = document.evaluate(
                    highlight.xpath,
                    document,
                    null,
                    XPathResult.FIRST_ORDERED_NODE_TYPE,
                    null
                ).singleNodeValue;

                if (element) {
                    const span = document.createElement('span');
                    span.style.backgroundColor = highlight.color;
                    span.className = 'highlighter-span';
                    span.dataset.highlightId = highlight.id;
                    span.textContent = highlight.text;

                    element.parentNode.replaceChild(span, element);
                }
            } catch (e) {
                console.error('Error applying highlight:', e);
            }
        });
    });
}

window.highs = {
  loadHighlights,
  highlightSelection,
  COLORS
};

document.addEventListener('DOMContentLoaded', loadHighlights);
