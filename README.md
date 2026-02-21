# 🔢 NumberGuessr 1v1

Un gioco di sfiga e strategia 1v1 dove devi indovinare il numero segreto del tuo avversario prima che lui indovini il tuo. Ma attenzione: puoi mentire una volta per partita!

Basato sullo stack tecnologico di **KosQuiz**.

## ✨ Caratteristiche

- **Multiplayer 1v1** in tempo reale con Socket.io.
- **Range Personalizzabile**: Imposta il range dei numeri (es. 1-100) nella lobby.
- **Sistema Cheat**: Possibilità di dire una bugia (Higher/Lower invertito) una sola volta per partita.
- **Design Premium**: UI moderna con Tailwind 4, Framer Motion e icone Lucide.
- **Responsive**: Giocabile da mobile e desktop.

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS 4, Framer Motion, Lucide React.
- **Backend**: Node.js, Express, Socket.io.

## 🚀 Installazione e Avvio

### Prerequisiti

- Node.js installato.

### Gateway (Server)

1. Vai nella cartella `server`: `cd server`
2. Installa le dipendenze: `npm install`
3. Avvia il server: `npm run dev` (Porta predefinita: 3001)

### Frontend (Client)

1. Vai nella cartella `client`: `cd client`
2. Installa le dipendenze: `npm install`
3. Avvia il client: `npm run dev` (Porta predefinita: 5173 o 5174)

## 🎮 Come Giocare

1. Inserisci il tuo nome e un codice Lobby.
2. Se crei la stanza, imposta il range minimo e massimo.
3. Condividi il codice Lobby con un amico.
4. Scegliete entrambi un numero segreto.
5. Indovinate a turno. Clicca sull'icona dello scudo 🛡️ per attivare il cheat prima di fare un tentativo (funziona solo una volta!).
