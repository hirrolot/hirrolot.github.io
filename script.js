window.addEventListener("load", function(event) {
    createClickableHeaders();
    createPopupNotes();
    genAuthorEmoji();
});

function createClickableHeaders() {
    var headers = document.querySelectorAll("h1, h2, h3");

    for (var i = headers.length - 1; i >= 0; i--) {
        var headerLink = document.createElement("a");
        headerLink.className = "header-link";
        headerLink.href = "#" + headers[i].id;
        headerLink.appendChild(headers[i].cloneNode(true));

        headers[i].replaceWith(headerLink);
    }
}

function createPopupNotes() {
    var notes = document.getElementsByClassName("footnote-ref");

    for (var i = notes.length - 1; i >= 0; i--) {
        var sup = document.createElement("sup");
        sup.className = "note-sup";
        sup.textContent = "[^]";

        var fnId = notes[i].href.slice(notes[i].href.lastIndexOf("#") + 1);
        var fnContent = document.getElementById(fnId).firstChild;
        fnContent.querySelector(".footnote-back").remove();

        var noteText = document.createElement("span");
        noteText.className = "note-text";
        noteText.innerHTML = fnContent.innerHTML;

        var noteContainer = document.createElement("span");
        noteContainer.className = "note-container";
        noteContainer.appendChild(sup);
        noteContainer.appendChild(noteText);

        noteContainer.addEventListener("mouseover", function() {
            this.getElementsByClassName("note-text")[0].classList.toggle("show-note");
        });

        noteContainer.addEventListener("mouseout", function() {
            this.getElementsByClassName("note-text")[0].classList.remove("show-note");
        });

        notes[i].replaceWith(noteContainer);
    }

    var footnotes = document.querySelector(".footnotes");
    if (footnotes) {
        footnotes.remove();
    }
}

function genAuthorEmoji() {
    var emojis = [
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

    var randomEmoji = document.createElement("span");
    randomEmoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    randomEmoji.innerHTML += "&nbsp;";

    var blogLink = document.createElement("a");
    blogLink.href = "..";
    blogLink.textContent = "hirrolot";

    var fancyAuthor = document.createElement("p");
    fancyAuthor.className = "author";
    fancyAuthor.appendChild(randomEmoji);
    fancyAuthor.appendChild(blogLink);

    var author = document.querySelector(".author");

    if (author) {
        author.replaceWith(fancyAuthor);
    }
}