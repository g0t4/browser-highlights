const COLORS = {
    'p': '#ffb6c1',
    'g': '#98fb98',
    'b': '#87cefa',
    'y': '#ffff99'
};

console.log('loaded simple highlighter');

document.addEventListener('keydown', (e) => {

    if (e.altKey && Object.keys(COLORS).includes(e.key.toLowerCase())) {
        const color = COLORS[e.key.toLowerCase()];
        highlightSelection(color);
    }
});

// Function to highlight selected text
function highlightSelection(color) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.style.backgroundColor = color;
    span.className = 'highlighter-span';

    // Create a unique ID for this highlight
    span.dataset.highlightId = Date.now().toString();

    range.surroundContents(span);

    // Save the highlight
    saveHighlight({
        id: span.dataset.highlightId,
        color: color,
        text: span.textContent,
        xpath: getXPath(span),
        url: window.location.href
    });
}

// Function to get XPath of an element
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

// Save highlight to storage
function saveHighlight(highlight) {
    chrome.storage.local.get(['highlights'], (result) => {
        const highlights = result.highlights || {};
        if (!highlights[window.location.href]) {
            highlights[window.location.href] = [];
        }
        highlights[window.location.href].push(highlight);
        chrome.storage.local.set({highlights});
    });
}

// Load and apply highlights when page loads
function loadHighlights() {
    chrome.storage.local.get(['highlights'], (result) => {
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

// Load highlights when page is ready
document.addEventListener('DOMContentLoaded', loadHighlights);
