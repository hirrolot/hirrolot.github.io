window.addEventListener("DOMContentLoaded", function (event) {
    genAuthorEmoji();
});

function genAuthorEmoji() {
    const emojis = ["💋", "💄", "💅", "❤️", "👄", "👅", "👠", "👗", "🌹", "🌺", "🪷", "🌷", "💐", "🫒", "🥀", "🌼", "🌱", "🌳", "🌴", "🍁", "🍄", "🌹", "🥩", "🍎", "🍒", "🍓", "🍇", "🍉", "🍌", "🍫", "🍰", "🍭", "🍬", "🍧", "🍝", "🎈", "💕", "💖", "💘", "💞", "💓", "💝", "💗", "❤️‍🔥", "🫀", "🎀", "🎁", "🌈", "🦄", "🔮", "🎑", "🧸", "🐬", "🦔", "🦇", "🦨", "🦬", "🐌", "🐞", "🦋", "🌀", "🎎", "🪆", "🚩", "🛕", "⛪", "🏰", "🐚", "👁️", "🎼", "🪽🪽🪽", "🕊️", "🗽", "🪐", "🎅", "🎄", "☃️", "🌌", "🏜️", "🌉", "🌃", "🌆", "🌇", "🏙", "🎆", "🎑", "🪴", "⛲", "🪅", "🎨", "🍹", "⛩️", "🎭", "🥘"];

    const randomEmoji = document.createElement("span");
    randomEmoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    randomEmoji.innerHTML += "&nbsp;";

    const blogLink = document.createElement("a");
    blogLink.href = "..";
    blogLink.textContent = "𝒽𝒾𝓇𝓇ℴ𝓁ℴ𝓉";

    const fancyAuthor = document.createElement("p");
    fancyAuthor.className = "author";
    fancyAuthor.appendChild(randomEmoji);
    fancyAuthor.appendChild(blogLink);

    const author = document.querySelector(".author");

    if (author) {
        author.replaceWith(fancyAuthor);
    }
}
