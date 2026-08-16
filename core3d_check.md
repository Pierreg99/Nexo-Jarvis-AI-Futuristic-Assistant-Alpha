# 3D-Core-Prüfung

Der Nexo-Kern reagiert über `onPointerMove` auf Bewegungen innerhalb der Core-Bühne. Die normalisierten Koordinaten werden auf eine begrenzte Neigung von sieben Grad abgebildet und als `rotateX` beziehungsweise `rotateY` auf die geschichtete `.core-depth`-Ebene angewendet. `onPointerLeave` setzt die Perspektive weich auf die neutrale Position zurück.

Die Desktop- und Mobilansichten wurden nach der 3D-Integration geprüft. Der Kern bleibt innerhalb der Command-Bay, die Peripheriemodule bleiben lesbar und es entsteht kein horizontaler Seitenüberlauf. Die 3D-Tiefenschicht nutzt `perspective`, `translateZ`, Glasreflexe, Partikel und getrennte Rotationsbewegungen für ein räumlicheres Materialgefühl.

Die globale `@media (prefers-reduced-motion: reduce)`-Regel setzt Animationsdauer und Wiederholungen auf ein Minimum. Der Regressionstest `server/core3d.styles.test.ts` prüft das Vorhandensein der Perspektiv-, Tiefen- und Reduced-Motion-Regeln. `pnpm check`, `pnpm test` und `pnpm build` waren erfolgreich.
