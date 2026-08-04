const ExcelJS = require('exceljs');
const express = require('express');
const db = require('../../db');
const verifyToken = require('../../middleware/auth');
const multer = require('multer');
const XLSX = require('xlsx');

// Stocke le fichier uploade en memoire (pas sur le disque), suffisant pour un import ponctuel
// Limite a 5 Mo (largement suffisant pour 216 agences) pour eviter qu'un fichier enorme sature le serveur
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
});

const TYPES_EXCEL_ACCEPTES = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
];

const router = express.Router();

// Convertit un texte en cle technique : minuscules, sans accents, espaces -> underscore
// Permet d'accepter des en-tetes Excel ecrits naturellement (ex: "Code agence", "Téléphone fixe")
function normaliserCle(texte)
{
    return texte
        .toString()
        .trim()
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // enleve les accents
        .replace(/\s+/g, '_'); // remplace les espaces par des underscores
}

// Convertit une ligne Excel (cles variees) vers nos noms de champs attendus
function normaliserLigne(ligne)
{
    const resultat = {};
    for (const [cle, valeur] of Object.entries(ligne))
    {
        const cleNorm = normaliserCle(cle);
        resultat[cleNorm] = valeur;
    }
    return resultat;
}

// GET /api/agences
router.get('/', verifyToken, async (req, res) =>
{
    const { recherche, succursale, plateforme } = req.query;

    try
    {
        let sql = 'SELECT * FROM agence WHERE 1=1';
        const params = [];

        if (recherche)
        {
            sql += ' AND (nom LIKE ? OR code_agence LIKE ?)';
            params.push(`%${recherche}%`, `%${recherche}%`);
        }
        if (succursale)
        {
            sql += ' AND succursale = ?';
            params.push(succursale);
        }
        if (plateforme)
        {
            sql += ' AND plateforme_telephonie = ?';
            params.push(plateforme);
        }

        sql += ' ORDER BY nom ASC';

        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (error)
    {
        res.status(500).json({ message: 'Erreur serveur', erreur: error.message });
    }
});

// GET /api/agences/export
router.get('/export', verifyToken, async (req, res) =>
{
    const { recherche, succursale, plateforme } = req.query;

    try
    {
        let sql = 'SELECT * FROM agence WHERE 1=1';
        const params = [];

        if (recherche)
        {
            sql += ' AND (nom LIKE ? OR code_agence LIKE ?)';
            params.push(`%${recherche}%`, `%${recherche}%`);
        }
        if (succursale)
        {
            sql += ' AND succursale = ?';
            params.push(succursale);
        }
        if (plateforme)
        {
            sql += ' AND plateforme_telephonie = ?';
            params.push(plateforme);
        }
        // Triees par succursale d'abord, pour pouvoir regrouper les lignes d'une meme succursale
        sql += ' ORDER BY succursale ASC, nom ASC';

        const [agences] = await db.query(sql, params);

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Agences');

        sheet.columns = [
            { header: 'Succursale', key: 'succursale', width: 22 },
            { header: 'Code agence', key: 'code_agence', width: 14 },
            { header: 'Nom', key: 'nom', width: 28 },
            { header: 'Adresse', key: 'adresse', width: 30 },
            { header: 'Téléphone fixe', key: 'telephone', width: 16 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Plateforme', key: 'plateforme_telephonie', width: 16 },
        ];

        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF14355E' } };

        agences.forEach((a) => sheet.addRow(a));

        // Fusionne la colonne "Succursale" (1ere colonne) pour les lignes consecutives d'une meme succursale
        // La ligne 1 est l'en-tete, les donnees commencent donc a la ligne 2
        let debutGroupe = 2;
        agences.forEach((a, index) =>
        {
            const ligneActuelle = index + 2;
            const estDerniere = index === agences.length - 1;
            const succursaleSuivante = estDerniere ? null : agences[index + 1].succursale;

            if (estDerniere || a.succursale !== succursaleSuivante)
            {
                if (ligneActuelle > debutGroupe)
                {
                    sheet.mergeCells(debutGroupe, 1, ligneActuelle, 1);
                    sheet.getCell(debutGroupe, 1).alignment = { vertical: 'middle' };
                }
                debutGroupe = ligneActuelle + 1;
            }
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=agences.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error)
    {
        res.status(500).json({ message: 'Erreur serveur', erreur: error.message });
    }
});

// GET /api/agences/modele-import
// Renvoie un fichier Excel vierge avec les colonnes attendues pour l'import, plus une ligne d'exemple
router.get('/modele-import', verifyToken, async (req, res) =>
{
    try
    {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Modèle import');

        sheet.columns = [
            { header: 'Code agence', key: 'code_agence', width: 14 },
            { header: 'Nom agence', key: 'nom_agence', width: 28 },
            { header: 'Succursale', key: 'succursale', width: 22 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Téléphone fixe', key: 'telephone_fixe', width: 16 },
            { header: 'Plateforme téléphonie', key: 'plateforme_telephonie', width: 20 },
        ];

        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF14355E' } };

        sheet.addRow({
            code_agence: '8225',
            nom_agence: 'DAR GUEDDARI',
            succursale: 'KENITRA',
            email: 'Digitalys8225@cpm.co.ma',
            telephone_fixe: '0537123456',
            plateforme_telephonie: 'Avaya',
        });

        sheet.addRow({});
        const noteRow = sheet.addRow({
            code_agence: 'Note : "Code agence" et "Nom agence" sont obligatoires. "Plateforme téléphonie" vaut "Avaya" par défaut si laissé vide. Les noms de colonnes peuvent être écrits librement (accents, espaces, majuscules).',
        });
        noteRow.font = { italic: true, color: { argb: 'FF8A887E' } };
        sheet.mergeCells(noteRow.number, 1, noteRow.number, 6);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=modele_import_agences.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error)
    {
        res.status(500).json({ message: 'Erreur serveur', erreur: error.message });
    }
});

// POST /api/agences/import
// Accepte : Code agence, Nom agence, Succursale, Email, Telephone fixe, Plateforme telephonie
router.post('/import', verifyToken, upload.single('fichier'), async (req, res) =>
{
    if (!req.file)
    {
        return res.status(400).json({ message: 'Aucun fichier reçu.' });
    }
    if (!TYPES_EXCEL_ACCEPTES.includes(req.file.mimetype))
    {
        return res.status(400).json({ message: 'Format invalide : seuls les fichiers Excel (.xlsx, .xls) sont acceptés.' });
    }

    try
    {
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const lignes = XLSX.utils.sheet_to_json(sheet);

        let creees = 0;
        let misesAJour = 0;
        const erreurs = [];

        for (const ligneOriginale of lignes)
        {
            const ligne = normaliserLigne(ligneOriginale);
            const { code_agence, nom_agence, succursale, email, telephone_fixe, plateforme_telephonie } = ligne; // on prends juste les champs qui nous interessent, les autres sont ignores

            if (!code_agence || !nom_agence)
            {
                erreurs.push(`Ligne ignorée (code ou nom manquant) : ${JSON.stringify(ligneOriginale)}`);
                continue;
            }

            const plateforme = plateforme_telephonie || 'Avaya';

            const [existe] = await db.query('SELECT code_agence FROM agence WHERE code_agence = ?', [code_agence]);

            if (existe.length > 0)
            {
                await db.query(
                    `UPDATE agence SET nom = ?, succursale = ?, email = ?, telephone = ?, plateforme_telephonie = ? WHERE code_agence = ?`,
                    [nom_agence, succursale || null, email || null, telephone_fixe || null, plateforme, code_agence]
                );
                misesAJour++;
            } else
            {
                await db.query(
                    `INSERT INTO agence (code_agence, nom, succursale, email, telephone, plateforme_telephonie) VALUES (?, ?, ?, ?, ?, ?)`,
                    [code_agence, nom_agence, succursale || null, email || null, telephone_fixe || null, plateforme]
                );
                creees++;
            }
        }

        res.json({
            message: 'Import terminé.',
            agences_creees: creees,
            agences_mises_a_jour: misesAJour,
            erreurs,
        });
    } catch (error)
    {
        res.status(500).json({ message: 'Erreur serveur', erreur: error.message });
    }
});

// GET /api/agences/:code/historique
// Statistiques d'une agence precise : total, repartition par etat, temps moyen de
// resolution (compare a la moyenne du reseau) — utilise par la page "Historique de l'agence"
router.get('/:code/historique', verifyToken, async (req, res) =>
{
    const { code } = req.params;

    try
    {
        const [agences] = await db.query('SELECT code_agence, nom, succursale FROM agence WHERE code_agence = ?', [code]);
        if (agences.length === 0)
        {
            return res.status(404).json({ message: 'Agence introuvable.' });
        }

        const [[{ total }]] = await db.query('SELECT COUNT(*) AS total FROM incident WHERE code_agence = ?', [code]);

        const [parEtat] = await db.query(
            'SELECT etat, COUNT(*) AS total FROM incident WHERE code_agence = ? GROUP BY etat',
            [code]
        );

        const [[tempsAgence]] = await db.query(
            `SELECT AVG(TIMESTAMPDIFF(MINUTE, date_creation, date_resolution)) AS minutes_moyennes
            FROM incident WHERE code_agence = ? AND etat = 'resolu' AND date_resolution IS NOT NULL`,
            [code]
        );
        const [[tempsReseau]] = await db.query(
            `SELECT AVG(TIMESTAMPDIFF(MINUTE, date_creation, date_resolution)) AS minutes_moyennes
            FROM incident WHERE etat = 'resolu' AND date_resolution IS NOT NULL`
        );

        res.json({
            agence: agences[0],
            total,
            par_etat: parEtat,
            temps_resolution_minutes: tempsAgence.minutes_moyennes,
            temps_resolution_reseau_minutes: tempsReseau.minutes_moyennes,
        });
    } catch (error)
    {
        res.status(500).json({ message: 'Erreur serveur', erreur: error.message });
    }
});

// GET /api/agences/:code
router.get('/:code', verifyToken, async (req, res) =>
{
    const { code } = req.params;

    try
    {
        const [rows] = await db.query('SELECT * FROM agence WHERE code_agence = ?', [code]);

        if (rows.length === 0)
        {
            return res.status(404).json({ message: 'Agence introuvable.' });
        }

        res.json(rows[0]);
    } catch (error)
    {
        res.status(500).json({ message: 'Erreur serveur', erreur: error.message });
    }
});

// PUT /api/agences/:code
router.put('/:code', verifyToken, async (req, res) =>
{
    const { code } = req.params;
    const { nom, succursale, email, telephone, plateforme_telephonie } = req.body;

    try
    {
        const champs = [];
        const valeurs = [];

        if (nom !== undefined) { champs.push('nom = ?'); valeurs.push(nom); }
        if (succursale !== undefined) { champs.push('succursale = ?'); valeurs.push(succursale); }
        if (email !== undefined) { champs.push('email = ?'); valeurs.push(email); }
        if (telephone !== undefined) { champs.push('telephone = ?'); valeurs.push(telephone); }
        if (plateforme_telephonie !== undefined) { champs.push('plateforme_telephonie = ?'); valeurs.push(plateforme_telephonie); }

        if (champs.length === 0)
        {
            return res.status(400).json({ message: 'Aucun champ à modifier fourni.' });
        }

        valeurs.push(code);

        const [result] = await db.query(
            `UPDATE agence SET ${champs.join(', ')} WHERE code_agence = ?`,
            valeurs
        );

        if (result.affectedRows === 0)
        {
            return res.status(404).json({ message: 'Agence introuvable.' });
        }

        res.json({ message: 'Agence mise à jour avec succès.' });
    } catch (error)
    {
        res.status(500).json({ message: 'Erreur serveur', erreur: error.message });
    }
});

module.exports = router;