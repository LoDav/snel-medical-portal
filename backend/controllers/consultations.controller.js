/**
 * code by : lorddavid alias @ôkami
 * date : 20/07/2025
 * version : 1.0
 * description : controller for consultations 
 */

const ShortUniqueId = require('short-unique-id');
const Consultations = require('../models/consultations.model');

const uid = new ShortUniqueId({ length: 12 });

module.exports = {
    create: async (req, res) => {
        //console.log("Executing create consultation");
        try {
            const {
                id_patient, id_professionnel, id_centre,
                date_consultation, heure_consultation, motif_consultation,
                anamnese, examen_clinique, diagnostic_principal,
                diagnostic_cim10, plan_traitement, evolution, statut_consultation
            } = req.body;

            const newConsultation = {
                id_consultation: uid.rnd(),
                id_patient,
                id_professionnel: id_professionnel ?? null, // Gérer id_professionnel comme null s'il est undefined
                id_centre,
                date_consultation,
                heure_consultation,
                motif_consultation: motif_consultation ?? null, // Gérer motif_consultation comme null s'il est undefined ou vide
                anamnese,
                examen_clinique,
                diagnostic_principal,
                diagnostic_cim10,
                plan_traitement,
                evolution,
                statut_consultation
            };

            await Consultations.create(newConsultation);
            res.status(201).json({ message: "Consultation créée avec succès", id_consultation: newConsultation.id_consultation });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    initConsultation: async (req, res) => {
        //console.log("Executing initConsultation");
        try {
            const { id_patient, id_centre, type_consultation, id_rendez_vous } = req.body;

            if (!id_patient || !id_centre) {
                return res.status(400).json({ message: "Les champs id_patient et id_centre sont requis." });
            }

            const newConsultation = {
                id_consultation: uid.rnd(),
                id_patient,
                id_centre,
                type_consultation: type_consultation ?? 'Première visite',
                id_rendez_vous: id_rendez_vous ?? null
            };

            await Consultations.init(newConsultation);
            res.status(201).json({ message: "Consultation initialisée avec succès", id_consultation: newConsultation.id_consultation });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getAll: async (req, res) => {
        //console.log("Executing getAll");
        try {
            const consultations = await Consultations.getAll();
            res.json(consultations);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getAllWithDetails: async (req, res) => {
        try {
            const consultations = await Consultations.getAllWithDetails();
            res.json(consultations);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getTodayConsultations: async (req, res) => {
        try {
            const consultations = await Consultations.getTodayConsultations();
            res.json(consultations);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getById: async (req, res) => {
        //console.log("Executing getById");
        try {
            const consultation = await Consultations.findById(req.params.id);
            if (!consultation) return res.status(404).json({ message: "Consultation introuvable" });
            res.json(consultation);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    update: async (req, res) => {
        //console.log("Executing update");
        try {
            const {
                id_patient, id_professionnel, id_centre,
                date_consultation, heure_consultation, motif_consultation,
                anamnese, examen_clinique, diagnostic_principal, hypotheses_diagnostiques,
                diagnostic_cim10, plan_traitement, evolution, statut_consultation
            } = req.body;


            const updatedConsultationData = {
                id_patient: id_patient ?? null,
                id_professionnel: id_professionnel ?? null,
                id_centre: id_centre ?? null,
                date_consultation: date_consultation ?? null,
                heure_consultation: heure_consultation ?? null,
                motif_consultation: motif_consultation ?? null,
                anamnese: anamnese ?? null,
                examen_clinique: examen_clinique ?? null,
                hypotheses_diagnostiques: hypotheses_diagnostiques ?? null,
                diagnostic_principal: diagnostic_principal ?? null,
                diagnostic_cim10: diagnostic_cim10 ?? null,
                plan_traitement: plan_traitement ?? null,
                evolution: evolution ?? null,
                statut_consultation: statut_consultation ?? 'Terminée'
            };



            const result = await Consultations.update(req.params.id, updatedConsultationData);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Consultation introuvable" });
            }
            res.json({ message: "Consultation mise à jour avec succès" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    delete: async (req, res) => {
        //console.log("Executing delete");
        try {
            const result = await Consultations.delete(req.params.id);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Consultation introuvable" });
            }
            res.json({ message: "Consultation supprimée avec succès" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getFull: async (req, res) => {
        //console.log("Executing getFull");
        try {
            const consultationData = await Consultations.getFullById(req.params.id);
            if (!consultationData) {
                return res.status(404).json({ message: "Consultation introuvable" });
            }
            //res.json(JSON.parse(consultationData));
            res.json(consultationData)
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getConsultationsByPatientId: async (req, res) => {
        //console.log("Executing getConsultationsByPatientId");
        try {
            const { idPatient } = req.params;
            const consultations = await Consultations.findByPatientId(idPatient);
            res.json(consultations || []);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getConsultationsByProfessionnelId: async (req, res) => {
        //console.log("Executing getConsultationsByProfessionnelId");
        try {
            const { idProfessionnel } = req.params;
            const consultations = await Consultations.findByProfessionnelId(idProfessionnel);
            res.json(consultations || []);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getConsultationsEnAttentePriseConstantes: async (req, res) => {
        //console.log("Executing getConsultationsEnAttentePriseConstantes");
        try {
            const consultations = await Consultations.getConsultationsEnAttentePriseConstantes();
            res.json(consultations || []);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    updateConsultationStatus: async (req, res) => {
        //console.log("Executing updateConsultationStatus");
        try {
            const { id } = req.params;
            const { statut_consultation } = req.body;

            if (!statut_consultation) {
                return res.status(400).json({ message: "Le statut de la consultation est requis." });
            }

            const result = await Consultations.updateStatus(id, statut_consultation);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Consultation introuvable" });
            }
            res.json({ message: "Statut de la consultation mis à jour avec succès" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    countConsultationsEnAttentePriseConstantes: async (req, res) => {
        //console.log("Executing countConsultationsEnAttentePriseConstantes");
        try {
            const count = await Consultations.countConsultationsEnAttentePriseConstantes();
            res.json({ count });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    countConsultationsEnAttenteConsultationToday: async (req, res) => {
        try {
            const count = await Consultations.countConsultationsEnAttenteConsultationToday();
            res.json({ count });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getConsultationsEnAttenteConsultation: async (req, res) => {
        // console.log("Executing getConsultationsEnAttenteConsultation");
        try {
            const consultations = await Consultations.getConsultationsEnAttenteConsultation();
            res.json(consultations || []);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getConsultationsByProfessionnelIdAndStatutEnAttenteConsultation: async (req, res) => {
        // console.log("Executing getConsultationsByProfessionnelIdAndStatutEnAttenteConsultation");
        try {
            const { idProfessionnel } = req.params;
            const consultations = await Consultations.getConsultationsByProfessionnelIdAndStatutEnAttenteConsultation(idProfessionnel);
            if (!consultations || consultations.length === 0) {
                return res.status(404).json({ message: "Aucune consultation en attente trouvée pour ce professionnel" });
            }
            res.json(consultations);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    countConsultationsByProfessionnelIdAndStatutEnAttenteConsultation: async (req, res) => {
        // console.log("Executing countConsultationsByProfessionnelIdAndStatutEnAttenteConsultation");
        try {
            const { idProfessionnel } = req.params;
            const count = await Consultations.countConsultationsByProfessionnelIdAndStatutEnAttenteConsultation(idProfessionnel);
            res.json({ count });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    countConsultationsEnAttenteConsultation: async (req, res) => {
        // console.log("Executing countConsultationsEnAttenteConsultation");
        try {
            const count = await Consultations.countConsultationsEnAttenteConsultation();
            res.json({ count });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getConsultationsForPatientToday: async (req, res) => {
        // console.log("Executing getConsultationsForPatientToday");
        try {
            const { idPatient } = req.params;
            const consultations = await Consultations.getConsultationsForPatientToday(idPatient);
            if (!consultations || consultations.length === 0) {
                return res.status(404).json({ message: "Aucune consultation trouvée pour ce patient aujourd'hui." });
            }
            res.json(consultations);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    // NOTE: Le champ 'degre_urgence' doit être ajouté à la table 'consultations' dans la base de données.
    // ALTER TABLE consultations ADD COLUMN degre_urgence VARCHAR(50) DEFAULT NULL;
    updateTriageConsultation: async (req, res) => {
        // console.log("Executing updateTriageConsultation");
        try {
            const { id } = req.params;
            let { id_professionnel, id_medecin, heure_consultation, id_centre, degre_urgence, statut_consultation, motif_consultation } = req.body;

            // Mapper id_medecin vers id_professionnel si nécessaire
            id_professionnel = id_professionnel || id_medecin;

            if (!id_professionnel || !statut_consultation) {
                return res.status(400).json({ message: "Les domaines id_professionnel (ou id_medecin) et statut_consultation sont requis." });
            }

            // Si id_centre ou heure_consultation sont manquants, on récupère les valeurs actuelles
            if (!id_centre || !heure_consultation) {
                const currentConsultation = await Consultations.findById(id);
                if (!currentConsultation) {
                    return res.status(404).json({ message: "Consultation introuvable" });
                }
                id_centre = id_centre || currentConsultation.id_centre;
                heure_consultation = heure_consultation || currentConsultation.heure_consultation;
                motif_consultation = motif_consultation || currentConsultation.motif_consultation;
            }

            const result = await Consultations.updateTriageConsultation(id, {
                id_professionnel,
                heure_consultation,
                id_centre,
                degre_urgence: degre_urgence ?? null,
                statut_consultation,
                motif_consultation
            });

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Consultation introuvable" });
            }
            res.json({ message: "Consultation mise à jour pour le triage avec succès" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    // GET /api/consultations/professionnel/:id_professionnel  
    // GET /api/consultations/professionnel/:id_professionnel?statut=En cours
    getConsultationsByStatut: async (req, res) => {
        // console.log("Executing getConsultationsByStatut");
        try {
            const { id_professionnel } = req.params;
            const { statut } = req.query;

            if (!id_professionnel) {
                return res.status(400).json({
                    success: false,
                    message: 'ID professionnel requis'
                });
            }

            // Définir les statuts par défaut si non spécifiés
            let statuts = ['En cours', 'Terminée'];
            if (statut) {
                statuts = Array.isArray(statut) ? statut : [statut];
            }

            const consultations = await Consultations.getConsultationsWithDetails(id_professionnel, statuts);

            res.json({
                success: true,
                data: consultations,
                count: consultations.length
            });

        } catch (error) {
            console.error('Erreur contrôleur consultations:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // GET /api/consultations/professionnel/:id_professionnel/en-cours
    getConsultationsEnCours: async (req, res) => {
        // console.log("Executing getConsultationsEnCours");
        try {
            const { idProfessionnel } = req.params;
            // console.log('id_professionnel: ahhhhhhhhhhhhhhhhhhhhhh', req.params);

            const consultations = await Consultations.getConsultationsWithDetails(
                idProfessionnel,
                ['En cours']
                // ['En cours', 'En attente de prise des constantes', 'En attente de consultation'] peut etre utilisé si besoin
            );

            res.json({
                success: true,
                data: consultations,
                count: consultations.length
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    getConsultationsTerminees: async (req, res) => {
        //console.log("Executing getConsultationsTerminees");
        try {
            const { idProfessionnel } = req.params;

            const consultations = await Consultations.getConsultationsWithDetails(
                idProfessionnel,
                ['Terminée']
            );

            res.json({
                success: true,
                data: consultations,
                count: consultations.length
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    getStatsConsultations: async (req, res) => {
        // console.log("Executing getStatsConsultations");
        try {
            const { id_professionnel } = req.params;

            const stats = await Consultations.getStatsConsultationsProfessionnel(id_professionnel);

            res.json({
                success: true,
                data: stats
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    getConsultationsByProfessionnelIdAndStatutEnAttenteConsultationToday: async (req, res) => {
        // console.log("Executing getConsultationsByProfessionnelIdAndStatutEnAttenteConsultationToday");
        try {
            const { idProfessionnel } = req.params;
            const consultations = await Consultations.getConsultationsByProfessionnelIdAndStatutEnAttenteConsultationToday(idProfessionnel);
            res.json(consultations || []);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getConsultationsEnAttentePriseConstantesToday: async (req, res) => {
        // console.log("Executing getConsultationsEnAttentePriseConstantesToday");
        try {
            const consultations = await Consultations.getConsultationsEnAttentePriseConstantesToday();
            res.json(consultations || []);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    countConsultationsToday: async (req, res) => {
        // console.log("Executing countConsultationsToday");
        try {
            const count = await Consultations.countConsultationsToday();
            res.json({ count });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    countDistinctPatientsTodayByProfessionnelId: async (req, res) => {
        // console.log("Executing countDistinctPatientsTodayByProfessionnelId");
        try {
            const { idProfessionnel } = req.params;
            const count = await Consultations.countDistinctPatientsTodayByProfessionnelId(idProfessionnel);
            res.json({ count });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    countConsultationsEnCours: async (req, res) => {
        // console.log("Executing countConsultationsEnCours");
        try {
            const { idProfessionnel } = req.params;

            const count = await Consultations.countConsultationsEnCours(idProfessionnel);
            res.json({ count });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getRecentConsultations: async (req, res) => {
        // console.log("Executing getRecentConsultations");
        try {
            const consultations = await Consultations.getRecentConsultations();
            res.json(consultations || []);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getLastConsultationByPatientId: async (req, res) => {
        // console.log("Executing getLastConsultationByPatientId");
        try {
            const { idPatient } = req.params;
            const consultation = await Consultations.findLastByPatientId(idPatient);
            if (!consultation) {
                return res.status(404).json({ message: "Aucune dernière consultation trouvée pour ce patient." });
            }
            res.json(consultation);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    getConsultationsTermineesByPatientId: async (req, res) => {
        // console.log("Executing getConsultationsTermineesByPatientId");
        try {
            const { idPatient } = req.params;
            const consultations = await Consultations.getConsultationsTermineesByPatientId(idPatient);
            res.json(consultations || []);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    updatePreviousConsultation: async (req, res) => {
        // console.log("Executing updatePreviousConsultation");
        try {
            const { id } = req.params;
            const { id_consultation_precedente } = req.body;

            if (!id_consultation_precedente) {
                return res.status(400).json({ message: "L'ID de la consultation précédente est requis." });
            }

            const result = await Consultations.updatePreviousConsultation(id, id_consultation_precedente);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Consultation introuvable" });
            }
            res.json({ message: "Consultation précédente mise à jour avec succès" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    updateTypeConsultation: async (req, res) => {
        // console.log("Executing updateTypeConsultation");
        try {
            const { id } = req.params;
            const { type_consultation } = req.body;

            if (!type_consultation) {
                return res.status(400).json({ message: "Le type de consultation est requis." });
            }

            const result = await Consultations.updateTypeConsultation(id, type_consultation);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Consultation introuvable" });
            }
            res.json({ message: "Type de consultation mis à jour avec succès" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },

    initConsultationRdv: async (req, res) => {
        //console.log("Executing initConsultationRdv");
        try {
            const { id_patient, id_centre, id_rendez_vous, id_professionnel, statut_consultation } = req.body;

            if (!id_patient || !id_centre) {
                return res.status(400).json({ message: "Les champs id_patient et id_centre sont requis." });
            }

            const newConsultation = {
                id_consultation: uid.rnd(),
                id_patient,
                id_centre,
                id_professionnel: id_professionnel ?? null,
                statut_consultation: statut_consultation ?? 'En attente de prise des constantes',
                type_consultation: 'Rendez-vous',
                id_rendez_vous: id_rendez_vous ?? null
            };

            await Consultations.init(newConsultation);
            res.status(201).json({ message: "Consultation initialisée avec succès", id_consultation: newConsultation.id_consultation });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },
    getWeeklyCompletedConsultationsStats: async (req, res) => {
        //console.log("Executing getWeeklyCompletedConsultationsStats");
        try {
            const { idProfessionnel } = req.params;
            if (!idProfessionnel) {
                return res.status(400).json({ message: "ID professionnel requis" });
            }
            const stats = await Consultations.getWeeklyCompletedConsultationsStats(idProfessionnel);
            res.json({ success: true, data: stats });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    }
};