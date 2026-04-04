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
    font-family: "Georgia", serif;
    background: var(--bg);
    color: var(--text);
    font-size: var(--fontSize);
  }

  header {
    background: #111;
    color: #f5f0e6;
    padding: 10px 20px;
  }

  header h1 {
    margin: 0;
    font-size: 1.4rem;
  }

  .top-menu {
    background: #222;
    color: #eee;
    padding: 8px 20px;
    display: flex;
    gap: 15px;
    font-size: 0.9rem;
  }

  .top-menu a {
    color: #eee;
    text-decoration: none;
    cursor: pointer;
  }

  .top-menu a:hover {
    text-decoration: underline;
  }

  .page {
    max-width: var(--width);
    margin: 30px auto;
    padding: 30px;
    background: #fffdf6;
    border: 1px solid #333;
  }

  .masthead {
    text-align: center;
    border-bottom: 3px double #000;
    padding-bottom: 10px;
    margin-bottom: 20px;
  }

  .masthead h2 {
    margin: 0;
    font-size: 2.4rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
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

  .issue {
    display: none;
  }

  .issue.active {
    display: block;
  }

  .editor-link {
    text-align: center;
    margin-bottom: 10px;
  }

  .editor-link a {
    color: #222;
    text-decoration: none;
    font-weight: bold;
  }
</style>

<script>
document.addEventListener("DOMContentLoaded", () => {
  // Styles laden
  const text = localStorage.getItem("textColor");
  const bg = localStorage.getItem("bgColor");
  const size = localStorage.getItem("fontSize");
  const width = localStorage.getItem("pageWidth");

  if (text) document.documentElement.style.setProperty("--text", text);
  if (bg) document.documentElement.style.setProperty("--bg", bg);
  if (size) document.documentElement.style.setProperty("--fontSize", size + "px");
  if (width) document.documentElement.style.setProperty("--width", width + "px");

  // Texte laden
  document.querySelectorAll("[data-id]").forEach(el => {
    const saved = localStorage.getItem(el.dataset.id);
    if (saved) el.innerText = saved;
  });

  // Bilder laden
  document.querySelectorAll("[data-img]").forEach(el => {
    const url = localStorage.getItem(el.dataset.img);
    if (url) {
      el.style.backgroundImage = `url(${url})`;
      el.style.backgroundSize = "cover";
      el.style.backgroundPosition = "center";
      el.innerText = "";
    }
  });

  // Ausgabe 1 als Standard
  showIssue('issue1');
});

function showIssue(id) {
  document.querySelectorAll(".issue").forEach(i => i.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}
</script>
</head>
<body>

<header>
  <h1>Retro Gazette – Schulzeitung</h1>
</header>

<div class="top-menu">
  <a onclick="showIssue('issue1')">Ausgabe 1</a>
  <a onclick="showIssue('issue2')">Ausgabe 2</a>
  <a href="editor.html">Editor</a>
</div>

<div class="editor-link">
  <a href="editor.html">→ Zum Editor (Code 13243)</a>
</div>

<!-- AUSGABE 1 -->
<div class="issue" id="issue1">
  <div class="page">
    <div class="masthead">
      <h2 data-id="a1_titel">Retro Gazette</h2>
      <p data-id="a1_untertitel">Ausgabe 1 – 2026</p>
    </div>

    <h3 data-id="a1_headline">Neue Ideen verändern unsere Schule</h3>
    <div class="image-placeholder" data-img="a1_titelbild">Titelbild</div>

    <div class="columns">
      <div class="col" data-id="a1_text1">
        Unsere Schule befindet sich im Wandel: Neue Projekte, digitale Werkzeuge
        und kreative AGs sorgen dafür, dass Lernen moderner wird.
      </div>
      <div class="col" data-id="a1_text2">
        Von der Entwicklung einer eigenen Schul-App bis hin zu Umweltprojekten –
        überall entstehen Ideen, die den Alltag verändern.
      </div>
    </div>
  </div>
</div>

<!-- AUSGABE 2 -->
<div class="issue" id="issue2">
  <div class="page">
    <div class="masthead">
      <h2 data-id="a2_titel">Retro Gazette – Spezial</h2>
      <p data-id="a2_untertitel">Ausgabe 2 – Projektwoche</p>
    </div>

    <h3 data-id="a2_headline">Projektwoche: Kreativität ohne Grenzen</h3>
    <div class="image-placeholder" data-img="a2_titelbild">Titelbild</div>

    <div class="columns">
      <div class="col" data-id="a2_text1">
        In der Projektwoche arbeiten Schülerinnen und Schüler an eigenen Ideen:
        Kunst, Technik, Musik, Theater und mehr.
      </div>
      <div class="col" data-id="a2_text2">
        Diese Ausgabe sammelt die spannendsten Projekte und zeigt, wie viel
        Kreativität in unserer Schule steckt.
      </div>
    </div>
  </div>
</div>

</body>
</html>

