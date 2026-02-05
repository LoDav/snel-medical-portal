export function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Gère les erreurs de type "Failed to fetch" lors des requêtes fetch.
 * Affiche une alerte utilisateur en cas d'erreur de connexion au serveur.
 */
export function handleFetchError(error, message) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
        // Gérer l'erreur de type "Failed to fetch"
        console.error("Erreur de connexion au serveur :", error);
        alert("Impossible de se connecter au serveur. Veuillez vérifier votre connexion réseau et réessayer.");
    }
}

/**
 * Formatte une date en chaîne de caractères lisible par l'utilisateur.
 * Prend en paramètre une chaîne de date au format ISO 8601.
 * Retourne une date au format "JJ/MM/AAAA" si la chaîne de date est valide.
 * Retourne "N/A" si la chaîne de date est vide ou non valide.
 * @param {string} dateString - La chaîne de date à formater.
 * @returns {string} La date formatée ou "N/A" si la chaîne est vide.
 */

export const formatDate = (dateString) => {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    // Get the timezone offset in minutes
    const timezoneOffset = date.getTimezoneOffset();

    // Adjust the date by adding the offset in milliseconds
    const adjustedDate = new Date(date.getTime() + timezoneOffset * 60 * 1000);

    const day = adjustedDate.getUTCDate();
    const month = adjustedDate.toLocaleString('fr-FR', { timeZone: 'UTC', month: 'long' });
    const year = adjustedDate.getUTCFullYear();
    const weekday = adjustedDate.toLocaleString('fr-FR', { timeZone: 'UTC', weekday: 'long' });

    // return `${weekday} ${day} ${month} ${year}`;
    return new Date(dateString).toLocaleDateString();
};

export const correctDateFormat = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};