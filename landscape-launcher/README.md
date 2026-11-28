# Landscape Launcher (Statische GitHub-Pages-Version)

Dieser Ordner enthält eine komplett statische Version nur mit **HTML, CSS und JavaScript** (`index.html`, `style.css`, `app.js`) – ganz ohne Build-Schritt oder Node.js-Server, damit auf GitHub Pages kein Whitescreen entsteht.

## So lädst du es auf GitHub hoch

1. Entpacke die heruntergeladene ZIP-Datei.
2. Erstelle ein neues Repository auf GitHub und lade alle Dateien aus diesem Ordner direkt ins Hauptverzeichnis hoch (`index.html`, `style.css`, `app.js`).
3. Öffne im Repository **Settings → Pages**.
4. Wähle unter **Build and deployment → Source** den Punkt **Deploy from a branch**, wähle deinen Branch (`main`) und den Ordner `/ (root)` und klicke auf **Save**.
5. Nach ca. 1 Minute ist deine Webseite unter `https://DEIN-NAME.github.io/DEIN-REPO/` erreichbar.

## Hinweis

Da GitHub Pages reinen statischen Webspace ohne eigenen Proxy-Server bietet, lädt diese Version Webseiten direkt per Iframe. Seiten, die das Einbetten per `X-Frame-Options` oder `CSP` blockieren, lassen sich auf reinem GitHub Pages technisch bedingt nicht über einen eigenen Proxy nachladen.
