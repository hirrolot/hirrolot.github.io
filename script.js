window.addEventListener("load", function (event) {
    moveTocDown();
    createClickableHeaders();
    genAuthorEmoji();
    decorateToc();
    createCodeAnnotationContainers();
});

function moveTocDown() {
    const introduction = document.querySelector(".introduction");
    const toc = document.querySelector("#TOC");

    if (toc && introduction) {
        toc.parentNode.insertBefore(introduction, toc);

        // Previously it was "none". After we are done moving it, we make it visible.
        toc.style.display = "block";
    }
}

function createClickableHeaders() {
    const headers = document.querySelectorAll("h1:not(.blog-title), h2, h3");

    for (var i = headers.length - 1; i >= 0; i--) {
        const headerLink = document.createElement("a");
        headerLink.className = "header-link";
        headerLink.href = "#" + headers[i].id;
        headerLink.appendChild(headers[i].cloneNode(true));

        headers[i].replaceWith(headerLink);
    }
}

function genAuthorEmoji() {
    const emojis = [
        "💋",
        "💄",
        "💅",
        "❤️",
        "👄",
        "👅",
        "👠",
        "🌹",
        "🌺",
        "🌷",
        "💐",
        "🥀",
        "🍄",
        "🌹",
        "🍎",
        "🍒",
        "🍓",
        "🍇",
        "🍉",
        "🍌",
        "🍫",
        "🍭",
        "🍬",
        "🍧",
        "🍝",
        "🎈",
        "💕",
        "💖",
        "💘",
        "💞",
        "💓",
        "💝",
        "💗",
        "🎀",
        "🎁",
        "🌈",
        "🦄",
    ];

    const randomEmoji = document.createElement("span");
    randomEmoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    randomEmoji.innerHTML += "&nbsp;";

    const blogLink = document.createElement("a");
    blogLink.href = "..";
    blogLink.textContent = "hirrolot";

    const fancyAuthor = document.createElement("p");
    fancyAuthor.className = "author";
    fancyAuthor.appendChild(randomEmoji);
    fancyAuthor.appendChild(blogLink);

    const author = document.querySelector(".author");

    if (author) {
        author.replaceWith(fancyAuthor);
    }
}

function decorateToc() {
    const toc = document.querySelector("#TOC");

    const tocTitle = document.createElement("h4");
    tocTitle.className = "toc-title";
    tocTitle.textContent = "Table of Contents";

    if (toc) {
        toc.insertBefore(tocTitle, toc.firstChild);
    }
}

function createCodeAnnotationContainers() {
    const codeAnnotations = document.querySelectorAll(".code-annotation");

    for (var i = codeAnnotations.length - 1; i >= 0; i--) {
        const container = document.createElement("div");
        container.className = "code-annotation-container";

        codeAnnotations[i].parentNode.insertBefore(container, codeAnnotations[i]);
        container.appendChild(codeAnnotations[i]);
    }
}
