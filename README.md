<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<title>Retro Gazette – Schulzeitung</title>
<meta name="viewport" content="width=device-width, initial-scale=1">

<style>
    :root {
        --bg: #f5f0e6;
        --text: #222;
        --fontSize: 16px;
        --width: 900px;
    }

    body {
        margin: 0;
        padding: 0;
        font-family: "Georgia", serif;
        background: var(--bg);
        color: var(--text);
        font-size: var(--fontSize);
    }

    .page {
        max-width: var(--width);
        margin: 40px auto;
        padding: 40px;
        background: #fffdf6;
        border: 1px solid #333;
    }

    .masthead {
        text-align: center;
        border-bottom: 3px double #000;
        padding-bottom: 10px;
        margin-bottom: 20px;
    }

    .masthead h1 {
        margin: 0;
        font-size: 3rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
    }

    .nav {
        position: sticky;
        top: 0;
        background: #ddd;
        padding: 10px;
        border-bottom: 1px solid #aaa;
    }

    .nav a {
        margin-right: 15px;
        text-decoration: none;
        color: #000;
        font-weight: bold;
    }

    .columns {
        display: flex;
        gap: 20px;
    }

    .col {
        flex: 1;
        text-align: justify;
    }

    .image-placeholder {
        background: #eee;
        border: 1px solid #555;
        height: 150px;
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 15px 0;
    }
</style>

<script>
// Texte laden
document.addEventListener("DOMContentLoaded", () => {
    const ids = document.querySelectorAll("[data-id]");
    ids.forEach(el => {
        const saved = localStorage.getItem(el.dataset.id);
        if (saved) el.innerText = saved;
    });

    // Editor-Einstellungen laden
    const text = localStorage.getItem("textColor");
    const bg = localStorage.getItem("bgColor");
    const size = localStorage.getItem("fontSize");
    const width = localStorage.getItem("pageWidth");
