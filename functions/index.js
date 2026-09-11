```js
const { onValueCreated } = require("firebase-functions/v2/database");
const { initializeApp } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");

initializeApp();

const PUNTI = {
  quiz: 10,
  pronostico: 10,
  foto_challenge: 15,
  sfida_invitati: 10
};

// ======================================================
// ASSEGNA AUTOMATICAMENTE I PUNTI DEI GIOCHI
// ======================================================

exports.assegnaPuntiGioco = onValueCreated(
  "/giochi/{giocoId}",
  async (event) => {
    const gioco = event.data.val();
    const giocoId = event.params.giocoId;

    if (!gioco) return;

    const squadra = gioco.squadra;
    const tipo = gioco.tipo;

    if (!squadra || !tipo) return;

    const punti = PUNTI[tipo];

    if (typeof punti !== "number") return;

    const db = getDatabase();

    // Evita che lo stesso gioco assegni i punti due volte
    const elaboratoRef = db.ref("giochiElaborati/" + giocoId);

    const risultato = await elaboratoRef.transaction((valore) => {
      if (valore === true) {
        return;
      }

      return true;
    });

    if (!risultato.committed) return;

    // Aggiunge i punti alla squadra
    const squadraRef = db.ref("squadre/" + squadra);

    await squadraRef.transaction((s) => {
      if (!s) return s;

      s.punti = Number(s.punti || 0) + punti;

      return s;
    });

    // Registra l'operazione
    await db.ref("azioni").push({
      squadra: squadra,
      punti: punti,
      tipo: tipo,
      giocoId: giocoId,
      giocatore: gioco.giocatore || "Invitato",
      automatica: true,
      data: Date.now()
    });
  }
);


// ======================================================
// MODIFICA MANUALE DEL PUNTEGGIO DA PARTE DELL'ORGANIZZATRICE
// ======================================================

exports.modificaPunteggioAdmin = onValueCreated(
  "/adminActions/{actionId}",
  async (event) => {
    const action = event.data.val();

    if (!action) return;

    const email = action.email;

    // ==================================================
    // IMPORTANTE:
    // SOSTITUISCI QUESTA EMAIL CON QUELLA USATA
    // PER CREARE L'UTENTE ORGANIZZATORE IN FIREBASE
    // ==================================================

    const EMAIL_ADMIN = valesmirko@gmail.com";

    if (!email || email !== EMAIL_ADMIN) {
      console.log("Operazione rifiutata: utente non autorizzato.");
      return;
    }

    const squadra = action.squadra;
    const punti = Number(action.punti);

    if (!squadra || !Number.isFinite(punti)) {
      console.log("Operazione non valida.");
      return;
    }

    const db = getDatabase();

    // Modifica il punteggio
    await db.ref("squadre/" + squadra).transaction((s) => {
      if (!s) return s;

      s.punti = Number(s.punti || 0) + punti;

      // Evita che il punteggio diventi negativo
      if (s.punti < 0) {
        s.punti = 0;
      }

      return s;
    });

    // Registra la modifica dell'organizzatrice
    await db.ref("azioni").push({
      squadra: squadra,
      punti: punti,
      descrizione: action.de
```
