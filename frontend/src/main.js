import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

import Toast from 'vue-toastification';
import 'vue-toastification/dist/index.css'; // Import the CSS or use your own!



import "animate.css";
// import './css/all.min.css'
import "@/css/main.css";
import '@/css/ajusting.css'
import '@/css/utilitaire.css'

//toast
import 'vue-toastification/dist/index.css';
import { getUserInfo, logout } from './utils/auth';
import { updateOnlineStatus } from './utils/professionnel';

const app = createApp(App);

app.use(Toast, {
  // You can set your default options here
  transition: "Vue-Toastification__fade",
  maxToasts: 5,
  newestOnTop: true
});

app.use(router)

app.mount("#app");

// Logique de déconnexion pour le navigateur
// window.addEventListener('beforeunload', () => {
//   const userInfo = getUserInfo();
//   if (userInfo && userInfo.id_professionnel) {
//     // On utilise keepalive: true pour s'assurer que la requête se termine même si la page est fermée
//     updateOnlineStatus(userInfo.id_professionnel, 'Offline', { keepalive: true });
//   }
//   logout(); // Vide les données d'authentification comme avant, sans toucher au reste (ex: thème)
// });

// Logique de déconnexion pour Electron
// if (window.electronAPI) {
//   window.electronAPI.onAppClosing(async () => {
//     console.log('Signal de fermeture de l\'application reçu du processus principal.');
//     const userInfo = getUserInfo();
//     if (userInfo && userInfo.id_professionnel) {
//       try {
//         await updateOnlineStatus(userInfo.id_professionnel, 'Offline');
//         console.log(`Statut de ${userInfo.id_professionnel} mis à jour en 'Offline'.`);
//       } catch (error) {
//         console.error("Erreur lors de la mise à jour du statut en ligne :", error);
//       }
//     }
//     logout();
//     console.log('Déconnexion effectuée.');
//     window.electronAPI.logoutComplete(); // Informer le processus principal que la déconnexion est terminée
//   });
// }
