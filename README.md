# HIJSON@CVDLab

## 3D server farm monitoring and navigation
In una server farm sono collocati in un unico ambiente numerosi server al fine di centralizzarne la gestione, la manutenzione e la sicurezza.

La tesi congiunta (2 laureandi) ha l'obiettivo di realizzare un ambiente web di monitoraggio 3D per una server farm.

Il gestore/controllore della server farm ha infatti la necessità di avere in un unico punto una panoramica sullo stato operativo dei sistemi ottenendo in tempo reale e in una modalità grafica di facile fruizione (un modello 3D dell'ambiente, adatta quindi anche a personale non tecnico ma con responsabilità sull'operatività dei sistemi) informazioni di eventuali malfunzionamenti, la possibilità di individuare la relazione tra macchina fisica e applicativi in esecuzione e, laddove la sicurezza fisica risulta importante, avere un tracciamento e localizzazione dei visitatori/operatori.

Il lavoro di tesi proposto deve rispondere a queste necessità studiando e realizzando un ambiente web *desktop* in cui sia possibile visualizzare e navigare un modello 3D interattivo di una server farm, e visualizzare in appositi pannelli le informazioni e le notifiche circa lo stato delle macchine in essa presenti.

Dualmente l'operatore ha la necessità di essere guidato negli interventi all'interno della server farm, la cui regolarità e ripetitività delle strutture rende complesso l'orientamento e la navigazione tra i rack.
Il lavoro di tesi proposto deve rispondere a queste necessità studiando e realizzando un ambiente web *mobile* in cui sia possibile visualizzare e navigare un modello interattivo 2D/2.5D di una server farm, e visualizzare e calcolare percorsi tra punti del modello, tracciando la posizione del visitatore grazie alle recenti tecnologie di localizzazione indoro.

Tra le tecnologie coinvolte figurano:

- visualizzazione 3D - HTML5 WebGL, Three.js

- comunicazione client-server realtime - HTML5 WebSocket, HTML5 ServerSentEvent

- client-side mvc - Backbone.js, Angular.js

- disegno su piattaforma mobile - HTML5 Canvas, Leaflet

***

# Istruzioni di deploy
0. installare node.js
1. clonare il repository e posizionarsi nella root della cartella
2. installare le dipendenze con il comando `npm install`
3. avviare il web framework con il comando `npm start`
4. Accedere al web framework dall'indirizzo http://localhost:3000

_HIJSON - CVDLab - Università degli Studi Roma Tre_
