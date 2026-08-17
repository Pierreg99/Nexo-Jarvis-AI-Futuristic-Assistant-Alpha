# Plan: Maximale immersive 3D-Nexo-Core-Erweiterung

## Ziel

Der bestehende CSS-basierte Nexo-Kern wird zu einer **maximal immersiven, interaktiven 3D-Szene** ausgebaut. Das Dashboard soll seinen „Orbital Instrumentation“-Charakter bewahren, aber der Kern erhält eine eigene Fokusansicht mit echter räumlicher Navigation, physisch wirkenden Materialien, dynamischen Licht- und Partikelsystemen sowie klaren Reaktionen auf Sprach- und Befehlszustände.

Die Umsetzung erweitert nur die Core-Visualisierung und ihre direkten Interaktionen. Wetter, Nachrichten, lokale Befehle und der nicht verbundene Kalenderstatus bleiben funktional unverändert.

## Ausgangslage

Der aktuelle Kern besitzt bereits CSS-Perspektive, Pointer-Neigung, mehrere Tiefenringe, Lens-, Glare- und Partikel-Ebenen sowie Zustände für Idle, Listening, Thinking und Speaking. Diese Architektur bildet einen guten visuellen Fallback, erreicht jedoch nicht die Materialtiefe, Kameraführung und interaktive Kontrolle einer dedizierten 3D-Szene.

| Aspekt | Aktueller Stand | Zielzustand |
| --- | --- | --- |
| Rendering | CSS-3D mit Bild-Asset und Tiefenebenen | Hardwarebeschleunigte Canvas-/WebGL-Szene mit prozeduralen Geometrien und Licht |
| Interaktion | Pointer-Parallax | Drag-to-orbit, Zoom, Reset, Fullscreen-Fokus und Touch-gesten |
| Realismus | Gradient-Linsen, Leuchten, CSS-Schatten | Mehrschichtige Materialien, volumetrischer Schein, reflektierende Ringe und Tiefenstaffelung |
| Systemzustände | CSS-Keyframes | Szenengesteuerte Licht-, Partikel-, Kameraund Ringreaktionen |
| Zugänglichkeit | Globaler Reduced-Motion-Fallback | Statische/vereinfachte Alternative, steuerbarer Bewegungsgrad und Canvas-Fallback |

## Architekturentscheidung

Die maximale Ausbaustufe verwendet einen **lazy geladenen WebGL-Core** auf Basis von `three`, `@react-three/fiber` und gezielt eingesetzten Hilfen aus `@react-three/drei`. Die Szene wird als eigenständige React-Komponente implementiert, damit sie vom bestehenden Dashboard entkoppelt bleibt und nur bei Sichtbarkeit beziehungsweise Aktivierung GPU-Ressourcen nutzt.

Der aktuelle CSS-Kern bleibt als belastbarer Fallback erhalten. Er wird angezeigt, wenn WebGL nicht verfügbar ist, die Nutzerbewegung reduziert werden soll oder ein leistungsschwaches Gerät erkannt wird. Damit bleibt die Command-Bay bedienbar und visuell konsistent, ohne eine harte Abhängigkeit von 3D-Hardware zu schaffen.

## Umsetzungsschritte

### 1. 3D-Rendering-Grundlage einrichten

Die notwendigen Rendering-Abhängigkeiten werden installiert. Anschließend entsteht unter `client/src/components/` eine gekapselte Komponente `NexoCore3D.tsx` samt zugehörigen Typen und Hilfsfunktionen. `Home.tsx` übergibt ausschließlich den aktuellen Assistentenzustand, den Fokusstatus und Nutzerinteraktionsereignisse an diese Komponente.

Der Canvas wird per dynamischem Import geladen. Die Bildrate wird auf einem vernünftigen Geräte-Pixel-Verhältnis begrenzt und bei verstecktem Browser-Tab, deaktivierter Szene oder inaktivem Fokus angehalten beziehungsweise gedrosselt.

### 2. Prozedurale Nexo-Szene gestalten

Die Szene erhält einen dunklen, leicht nebligen Raum mit fünf miteinander abgestimmten Ebenen: einen reflektierenden Außenkäfig, gegenläufige Metallringe, eine emissive cyanfarbene Energiekammer, einen warmen Amber-Kern und ein Partikelfeld mit klarer räumlicher Parallaxe.

Die Materialpalette bleibt bei Graphit, Nexo Cyan und Amber. Metallische und transparente Flächen erhalten Roughness-, Fresnel- und Bloom-Effekte, ohne die Lesbarkeit der Telemetrie zu überdecken. Die aktuelle Nexo-Core-Bildsprache wird als gestalterische Referenz weiterverwendet; neue generierte Bilder werden nur genutzt, wenn sie als texturfreie Atmosphären- oder Environment-Map tatsächlich einen sichtbaren Mehrwert bieten.

### 3. Maximale Interaktion ergänzen

Die eingebettete Core-Bühne erhält Drag-to-orbit, Mausrad-/Pinch-Zoom innerhalb sicherer Grenzen und einen Reset-Button. Ein klarer „Focus Core“-Auslöser öffnet eine immersive Fullscreen-Ansicht mit größerem Canvas, erklärenden Kurzbefehlen und einem eindeutigen Rückweg zur Command-Bay.

| Eingabe | Verhalten |
| --- | --- |
| Maus/Toucheingabe ziehen | Orbit-Kamera um den Kern drehen |
| Mausrad oder Pinch | Kamera innerhalb einer begrenzten Distanz zoomen |
| Doppelklick oder Reset | Kamera auf die kalibrierte Ausgangsperspektive zurücksetzen |
| Focus-Core-Schalter | Immersive Vollbild-/Overlay-Szene öffnen oder schließen |
| Reduced Motion | Statische Kameraposition, geringere Partikeldichte und keine kontinuierliche Kamerafahrt |

### 4. Systemzustände mit der Szene verbinden

Die vorhandenen Zustände werden in konkrete Szene-Reaktionen übersetzt. **Idle** zeigt eine langsame, ruhige Rotation. **Listening** verstärkt cyanfarbene Schallwellen und reagiert auf die Sprachaktivierung. **Thinking** erhöht kontrolliert die Ringgeschwindigkeit und verschiebt den Kern sparsam nach Amber. **Speaking** moduliert Licht und Partikelfluss mit einer sicheren, aus dem Sprachausgabe-Zustand abgeleiteten Hüllkurve.

Die Reaktionen werden über Props und zeitbasierte Interpolation umgesetzt; sie dürfen keine dauerhafte Audiodatenaufzeichnung benötigen. Das bestehende Verhalten von Sprachsteuerung und Chat bleibt unverändert.

### 5. Dashboard-Hierarchie anpassen

Der Kern erhält im normalen Dashboard mehr räumliche Dominanz. Die Telemetrie bleibt kompakt an den Seiten, während die Conversation Stream- und Eingabebereiche bewusst sekundär bleiben. In der Fokusansicht sind Wetter, Nachrichten und Kalender nicht entfernt, sondern als dezente Telemetrie am Szenenrand erreichbar.

Die aktuelle CSS-3D-Version wird als Fallback-Komponente und als Darstellung für reduzierte Bewegung weitergeführt. Redundante CSS-Ebenen der aktuellen eingebetteten Core-Szene werden nach der WebGL-Integration gezielt bereinigt, damit sich Effekte nicht doppeln.

### 6. Qualität, Sicherheit und Performance prüfen

Die WebGL-Verfügbarkeit, die Fallback-Umschaltung, das Verhalten bei `prefers-reduced-motion`, die Fokusansicht und alle Zustandswechsel werden getestet. Zusätzlich werden Desktop-, Tablet- und Mobilansichten geprüft, einschließlich Touch-Interaktion und fehlender horizontaler Überläufe.

`pnpm check`, `pnpm test` und `pnpm build` werden erneut ausgeführt. Neue Unit-Tests validieren den Zustands-zu-Szenen-Mapping-Vertrag und die Fallback-Entscheidung. Sichtbare Browserprüfungen decken die 3D-Navigation, den Reset und den Fullscreen-Rückweg ab.

## Akzeptanzkriterien

Die Erweiterung gilt als abgeschlossen, wenn der Nexo-Kern in unterstützten Browsern als interaktive WebGL-Szene erscheint, alle vier Assistentenzustände sichtbar unterscheiden kann und die Kamera über Maus sowie Touch bedienbar ist. Die Fokusansicht muss jederzeit wieder zur Command-Bay führen. Auf Geräten ohne WebGL oder mit reduzierter Bewegung muss die Oberfläche weiterhin stabil über den CSS-Fallback funktionieren.

## Annahmen und Risiken

Es wird angenommen, dass der Nutzer mit einer größeren Client-Bundle-Größe für eine optionale, lazy geladene 3D-Szene einverstanden ist. Die aktuelle Anwendung läuft in modernen Chromium-basierten Browsern; die Umsetzung wird dennoch auf verfügbare WebGL-Funktionen prüfen.

Das Hauptrisiko liegt in GPU- und Akkubelastung auf Mobilgeräten. Dieses Risiko wird durch dynamisches Laden, begrenztes DPR, pausiertes Rendering bei Hintergrund-Tabs, adaptive Partikeldichte, eine klare Fallback-Strategie und `prefers-reduced-motion` begrenzt. Externe Kalender- oder personenbezogene Integrationen sind nicht Bestandteil dieser Ausbaustufe.
