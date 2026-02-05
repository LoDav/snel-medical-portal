const ShortUniqueId = require('short-unique-id');
const PrescriptionExamen = require('../models/prescriptionsExamens.model');
// const db = require('../config/db'); // Plus besoin d'accéder directement à db ici

const uid = new ShortUniqueId({ length: 12 });

exports.createPrescriptionExamen = async (req, res) => {
    try {
        const newPrescriptionExamen = {
            id_prescription_examen: uid.rnd(),
            ...req.body,
            date_demande: new Date(),
        };
        await PrescriptionExamen.create(newPrescriptionExamen);
        res.status(201).json({ message: 'Prescription d\'examen créée avec succès', data: newPrescriptionExamen });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllPrescriptionsExamens = async (req, res) => {
    try {
        const prescriptionsExamens = await PrescriptionExamen.findAll();
        res.status(200).json(prescriptionsExamens);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getPrescriptionExamenById = async (req, res) => {
    try {
        const prescriptionExamen = await PrescriptionExamen.findById(req.params.id);
        if (prescriptionExamen) {
            res.status(200).json(prescriptionExamen);
        } else {
            res.status(404).json({ message: 'Prescription d\'examen non trouvée' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updatePrescriptionExamen = async (req, res) => {
    try {
        const updatedPrescriptionExamen = {
            ...req.body,
            date_derniere_maj: new Date(), // Assuming there's a date_derniere_maj field in the table
        };
        const result = await PrescriptionExamen.update(req.params.id, updatedPrescriptionExamen);
        if (result.affectedRows > 0) {
            res.status(200).json({ message: 'Prescription d\'examen mise à jour avec succès' });
        } else {
            res.status(404).json({ message: 'Prescription d\'examen non trouvée' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deletePrescriptionExamen = async (req, res) => {
    try {
        const result = await PrescriptionExamen.delete(req.params.id);
        if (result.affectedRows > 0) {
            res.status(200).json({ message: 'Prescription d\'examen supprimée avec succès' });
        } else {
            res.status(404).json({ message: 'Prescription d\'examen non trouvée' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getDetailedPrescriptionsExamens = async (req, res) => {
    try {
        const detailedPrescriptionsExamens = await PrescriptionExamen.getDetailedPrescriptionsExamens();
        res.status(200).json(detailedPrescriptionsExamens);
    } catch (error) {
        console.error('Erreur lors de la récupération des prescriptions d\'examens détaillées:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des prescriptions d\'examens détaillées', error: error.message });
    }
};

exports.getPrescriptionsWithExamsByConsultationId = async (req, res) => {
    try {
        const { id_consultation } = req.params;
        const prescriptionsWithExams = await PrescriptionExamen.getPrescriptionsWithExamsByConsultationId(id_consultation);
        res.status(200).json(prescriptionsWithExams);
    } catch (error) {
        console.error('Erreur lors de la récupération des prescriptions d\'examens par ID de consultation:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des prescriptions d\'examens par ID de consultation', error: error.message });
    }
};

exports.changeStatutExamen = async (req, res) => {

    //console.log('Changement de statut d\'examen');
    try {
        const { id } = req.params;
        const { statut_examen } = req.body;

        if (!statut_examen) {
            return res.status(400).json({ message: 'Le statut d\'examen est requis' });
        }

        const result = await PrescriptionExamen.changeStatutExamen(id, statut_examen);

        if (result.affectedRows > 0) {
            res.status(200).json({
                message: 'Statut d\'examen mis à jour avec succès',
                data: {
                    id_prescription_examen: id,
                    statut_examen: statut_examen,
                    date_derniere_maj: new Date()
                }
            });
        } else {
            res.status(404).json({ message: 'Prescription d\'examen non trouvée' });
        }
    } catch (error) {
        console.error('Erreur lors du changement de statut d\'examen:', error);

        if (error.message.includes('Statut invalide')) {
            res.status(400).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Erreur lors du changement de statut d\'examen', error: error.message });
        }
    }
};

exports.getCountDemandesAujourdhui = async (req, res) => {
    try {
        const result = await PrescriptionExamen.countDemandesAujourdhui();
        res.status(200).json(result);
    } catch (error) {
        console.error('Erreur lors du comptage des demandes d\'examens du jour:', error);
        res.status(500).json({ message: 'Erreur lors du comptage des demandes d\'examens du jour', error: error.message });
    }
};

exports.getCountRealisesAujourdhui = async (req, res) => {
    try {
        const result = await PrescriptionExamen.countRealisesAujourdhui();
        res.status(200).json(result);
    } catch (error) {
        console.error('Erreur lors du comptage des examens réalisés du jour:', error);
        res.status(500).json({ message: 'Erreur lors du comptage des examens réalisés du jour', error: error.message });
    }
};

exports.getRecentPrescriptionsExamens = async (req, res) => {
    try {
        const recentPrescriptionsExamens = await PrescriptionExamen.getRecentPrescriptionsExamens();
        res.status(200).json(recentPrescriptionsExamens);
    } catch (error) {
        console.error('Erreur lors de la récupération des prescriptions d\'examens récentes:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des prescriptions d\'examens récentes', error: error.message });
    }
};
