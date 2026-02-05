const multer = require('multer');
const path = require('path');

const fs = require('fs');

// Configuration du stockage pour Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = 'files/uploads/examens';
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath); // Les fichiers seront stockés dans 'files/uploads/examens'
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Nom de fichier unique
    }
});

// Filtre pour les types de fichiers (optionnel)
const fileFilter = (req, file, cb) => {
    const allowedExtensions = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());

    // Accepter tous les types MIME commençant par "image/" ou les documents spécifiques
    const isImage = file.mimetype.startsWith('image/');
    const isDoc = /pdf|msword|officedocument/.test(file.mimetype);

    if ((isImage || isDoc) && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Type de fichier non supporté. Seuls les fichiers images, PDF, DOC, DOCX sont autorisés.'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 }, // Limite de taille de fichier à 5MB
    fileFilter: fileFilter
});

module.exports = upload;
