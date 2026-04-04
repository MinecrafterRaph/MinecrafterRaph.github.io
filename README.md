<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Retro Gazette – Schulzeitung</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: "Georgia", "Times New Roman", serif;
      background: #f5f0e6;
      color: #222;
    }

    .page {
      max-width: 900px;
      margin: 40px auto;
      padding: 40px;
      background: #fffdf6;
      border: 1px solid #333;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }

    .page + .page {
      margin-top: 20px;
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
      letter-spacing: 0.15em;
      text-transform: uppercase;
    }

    .masthead .meta {
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      margin-top: 5px;
    }

    h2 {
      font-size: 1.8rem;
      margin: 10px 0;
      text-transform: uppercase;
      border-bottom: 1px solid #000;
      padding-bottom: 5px;
    }

    h3 {
      font-size: 1.2rem;
      margin: 10px 0 5px;
      text-transform: uppercase;
    }

    .columns {
      display: flex;
      gap: 20px;
      margin-top: 10px;
    }

    .col {
      flex: 1;
      font-size: 0.95rem;
      line-height: 1.5;
      text-align: justify;
    }

    .small-meta {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 5px;
    }

    .nav {
      position: sticky;
      top: 0;
      background: #f5f0e6;
      border-bottom: 1px solid #aaa;
      padding: 8px 0;
      z-index: 10;
    }

    .nav-inner {
      max-width: 900px;
      margin: 0 auto;
      display: flex;
      gap: 15px;
      font-size: 0.9rem;
    }

    .nav a {
      text-decoration: none;
      color: #222;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .nav a:hover {
      text-decoration: underline;
    }

    .image-placeholder {
      border: 1px solid #555;
      background: #eee;
      height: 160px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      text-transform: uppercase;
      margin: 10px 0 15px;
    }

    .footer {
      text-align: center;
      font-size: 0.8rem;
      margin-top: 20px;
      border-top: 1px solid #000;
      padding-top: 10px;
    }

    @media (max-width: 700px) {
      .columns {
        flex-direction: column;
      }
      .masthead h1 {
        font-size: 2.2rem;
      }
    }
  </style>
</head>
<body>

  <!-- Navigation (wie „Seiten“) -->
  <div class="nav">
    <div class="nav-inner">
      <a href="#seite1">Titelseite</a>
      <a href="#seite2">Inhalt & Editorial</a>
      <a href="#seite3">Schulnews</a>
      <a href="#seite4">Interviews</a>
      <a href="#seite5">Projekte</a>
      <a href="#seite6">Kreativ & Rätsel</a>
    </div>
  </div>

  <!-- SEITE 1 – TITELSEITE -->
  <div class="page" id="seite1">
    <div class="masthead">
      <h1>Retro Gazette</h1>
      <div class="meta">Schulzeitung · Ausgabe Nr. 1 · 2026</div>
    </div>

    <h2>Neue Ideen verändern unsere Schule</h2>
    <div class="small-meta">Titelstory · Redaktion</div>

    <div class="image-placeholder">
      Titelbild / Foto der Schule
    </div>

    <div class="columns">
      <div class="col">
        Unsere Schule befindet sich im Wandel: Neue Projekte, digitale
        Werkzeuge und kreative AGs sorgen dafür, dass Lernen moderner,
        spannender und persönlicher wird. In dieser Ausgabe der Retro Gazette
        werfen wir einen Blick hinter die Kulissen dieser Veränderungen.
      </div>
      <div class="col">
        Von der Entwicklung einer eigenen Schul-App über Umweltprojekte bis hin
        zu künstlerischen Wettbewerben – überall entstehen Ideen, die den
        Schulalltag bereichern. Diese Zeitung wurde von Schülerinnen und
        Schülern gestaltet, um genau diese Vielfalt sichtbar zu machen.
      </div>
    </div>
  </div>

  <!-- SEITE 2 – INHALT & EDITORIAL -->
  <div class="page" id="seite2">
    <h2>Inhalt & Editorial</h2>

    <div class="columns">
      <div class="col">
        <h3>Inhalt</h3>
        <ul>
          <li>Titelseite – Neue Ideen verändern unsere Schule</li>
          <li>Editorial – Warum diese Zeitung entsteht</li>
          <li>Schulnews – Aktuelle Ereignisse</li>
          <li>Interviews – Stimmen aus der Schule</li>
          <li>Projekte & AGs – Was gerade läuft</li>
          <li>Kreative Ecke & Rätsel – Für zwischendurch</li>
        </ul>
      </div>
      <div class="col">
        <h3>Editorial</h3>
        <p>
          Liebe Leserinnen und Leser,<br>
          wir freuen uns, euch die erste Ausgabe unserer Retro Gazette
          präsentieren zu dürfen. Unser Ziel ist es, Informationen,
          Kreativität und ein wenig Nostalgie miteinander zu verbinden.
        </p>
        <p>
          Diese Zeitung ist ein Schulprojekt – gestaltet von Schülerinnen und
          Schülern, für die gesamte Schulgemeinschaft. Wenn ihr eigene Texte,
          Bilder oder Ideen einbringen wollt, meldet euch gerne bei der
          Redaktion.
        </p>
      </div>
    </div>
  </div>

  <!-- SEITE 3 – SCHULNEWS -->
  <div class="page" id="seite3">
    <h2>Schulnews</h2>
    <div class="columns">
      <div class="col">
        <h3>Neue Projekte starten</h3>
        <p>
          In diesem Schuljahr beginnen mehrere neue Projekte: Eine Umwelt-AG,
          ein Robotik-Team und ein Retro-Design-Workshop. Ziel ist es, den
          Schülerinnen und Schülern mehr Raum für eigene Ideen zu geben.
        </p>

        <h3>Digitalisierung im Klassenzimmer</h3>
        <p>
          Mehrere Klassenräume wurden mit digitalen Tafeln ausgestattet, und
          das WLAN-Netz wurde verbessert. So können digitale Lerninhalte
          einfacher im Unterricht genutzt werden.
        </p>
      </div>
      <div class="col">
        <h3>Termine</h3>
        <ul>
          <li>Projekttag: 12. Mai</li>
          <li>Sportfest: 3. Juni</li>
          <li>Sommerfest: 28. Juni</li>
        </ul>

        <h3>Kurznachrichten</h3>
        <p>
          Die Bibliothek hat neue Öffnungszeiten, eine neue Schülervertretung
          wurde gewählt, und im Musikraum steht jetzt ein E-Piano für
          Proben und Auftritte.
        </p>
      </div>
    </div>
  </div>

  <!-- SEITE 4 – INTERVIEWS -->
  <div class="page" id="seite4">
    <h2>Interviews</h2>
    <div class="columns">
      <div class="col">
        <h3>„Wir wollen mehr Raum für Kreativität“</h3>
        <div class="small-meta">Interview mit der Schulleitung</div>
        <p>
          Frage: Was ist das wichtigste Ziel für dieses Schuljahr?<br>
          Antwort: Wir möchten Kreativität fördern und gleichzeitig moderne
          Lernmethoden einführen. Projekte wie die Schul-App oder die
          Schülerzeitung sind dafür ein wichtiger Baustein.
        </p>
      </div>
      <div class="col">
        <h3>Stimmen aus der Schülerschaft</h3>
        <p>
          „Wir finden es cool, dass wir eigene Projekte starten können und
          ernst genommen werden.“<br><br>
          „Die Retro Gazette zeigt, was an der Schule alles passiert – das
          motiviert, selbst aktiv zu werden.“
        </p>
      </div>
    </div>
  </div>

  <!-- SEITE 5 – PROJEKTE & AGs -->
  <div class="page" id="seite5">
    <h2>Projekte & Arbeitsgemeinschaften</h2>
    <div class="columns">
      <div class="col">
        <h3>Robotik-AG</h3>
        <p>
          Die Robotik-AG baut kleine autonome Fahrzeuge und programmiert
          einfache Roboter. Ziel ist es, spielerisch in Technik und
          Programmierung einzusteigen.
        </p>

        <h3>Umwelt-AG</h3>
        <p>
          Die Umwelt-AG kümmert sich um Recycling, den Schulgarten und
          Aktionen zum Thema Nachhaltigkeit. Geplant sind u. a. ein
          „Müllfrei-Tag“ und ein Info-Stand beim Sommerfest.
        </p>
      </div>
      <div class="col">
        <h3>Retro-Design-Workshop</h3>
        <p>
          Im Retro-Design-Workshop entstehen Plakate, Logos und Layouts im
          Stil alter Zeitungen und Magazine. Diese Zeitung ist eines der
          Ergebnisse.
        </p>

        <h3>Schul-App-Projekt</h3>
        <p>
          Eine Gruppe von Schülerinnen und Schülern arbeitet an einer
          einfachen Schul-App, die Stundenplan, Termine und News bündelt –
          basierend auf dieser Webseite als WebView.
        </p>
      </div>
    </div>
  </div>

  <!-- SEITE 6 – KREATIV & RÄTSEL -->
  <div class="page" id="seite6">
    <h2>Kreative Ecke & Rätsel</h2>
    <div class="columns">
      <div class="col">
        <h3>Gedicht des Monats</h3>
        <p>
          Zwischen Kreide und Pixeln,<br>
          zwischen gestern und heut’,<br>
          entsteht eine Schule,<br>
          die Zukunft betreut.
        </p>

        <h3>Schülerkunst</h3>
        <div class="image-placeholder">
          Platz für Zeichnungen / Fotos
        </div>
      </div>
      <div class="col">
        <h3>Retro-Rätsel</h3>
        <p>
          Hier könnt ihr ein Kreuzworträtsel, ein Suchsel oder ein Quiz
          einfügen. Für den Anfang könnt ihr einfach Fragen zur Schule oder
          zur Geschichte der Zeitung stellen.
        </p>

        <h3>Wusstest du schon?</h3>
        <ul>
          <li>Die erste gedruckte Zeitung erschien 1605.</li>
          <li>Retro-Design orientiert sich oft an den 1920er–1980er Jahren.</li>
          <li>Mit einer einfachen WebView-App kann man jede Webseite zur App machen.</li>
        </ul>
      </div>
    </div>

    <div class="footer">
      © 2026 Retro Gazette – Schulprojekt. Diese Seite kann als WebView in einer Schul-App verwendet werden.
    </div>
  </div>

</body>
</html>

