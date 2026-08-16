# Live-Datenquellen

## Wetter

Open-Meteo stellt aktuelle Wetterwerte, Orts- und Zeitparameter sowie Vorhersagen bereit. Die Dokumentation nennt eine Nutzung ohne API-Schlüssel für nicht-kommerzielle Anwendungen unterhalb von 10.000 täglichen Abfragen. Für das Dashboard werden aktuelle Temperatur, Wettercode, Windgeschwindigkeit und die lokale Zeitzone über die Forecast- und Geocoding-Schnittstellen abgefragt.

Ein direkter Abruf für Berlin bestätigte die erwarteten Felder `temperature_2m`, `apparent_temperature`, `weather_code`, `wind_speed_10m`, `is_day` und `timezone`.

Quelle: https://open-meteo.com/en/docs

## Nachrichten

GDELT stellt neben seinen Datensätzen Echtzeit-JSON-Schnittstellen für Volltextsuche und aktuelle Meldungen bereit. Für das Dashboard wird die DOC-Schnittstelle genutzt und die Anzeige auf aktuelle, verlinkbare Schlagzeilen begrenzt. Die Quelle fordert höchstens eine Anfrage pro fünf Sekunden; die Umsetzung nutzt daher einen deutlich längeren zehnminütigen Aktualisierungszyklus und muss einen temporären Ratenlimit-Fehler sichtbar behandeln.

Quelle: https://www.gdeltproject.org/data.html

## Kalender

Google Calendar und Outlook Calendar sind im aktuellen Projektkontext vorhanden, aber nicht freigegeben. Die Verbindung muss vom Nutzer bestätigt und anschließend über eine geeignete OAuth- oder API-Anbindung im Webprojekt autorisiert werden. Bis dahin zeigt das Dashboard einen sicheren Verbindungsstatus statt erfundener Termine.

## Browser-Prüfung

Die Oberfläche zeigt Wetter-, Nachrichten- und Kalendermodule mit klaren Lade- und Berechtigungszuständen. In der Testumgebung wurde der Standortzugriff verweigert; das Wettermodul erklärt deshalb den erforderlichen Zugriff anstatt Schätzdaten zu zeigen. Die Nachrichtenabfrage wird asynchron geladen und muss nach dem serverseitigen Timeout einen sichtbaren Fehlerzustand liefern.

Ein Browserabruf bestätigte die CORS-Erreichbarkeit der Open-Meteo-Schnittstelle. Der aktuelle GDELT-DOC-Abruf wurde dagegen zeitlich begrenzt, während die Hacker-News-Algolia-Schnittstelle aktuelle, verlinkbare Meldungen zuverlässig im Browser zurücklieferte. Die Dashboard-Liveanzeige nutzt daher für die öffentliche, schlüssellose Anzeige browserseitige Abrufe mit manueller Aktualisierung und Fokus-Aktualisierung; eine serverseitige Langzeitsynchronisierung bleibt erst nach bestätigter Kalenderautorisierung und verlässlichem Serverzugang sinnvoll.

Der Kalenderdialog wurde im Browser geöffnet und die Auswahl von Google Calendar verifiziert. Die Auswahl stellt klar heraus, dass eine ausdrückliche Autorisierung erforderlich ist, bevor Termine abgerufen oder angezeigt werden. Outlook Calendar steht parallel als auswählbarer Anbieter zur Verfügung.
