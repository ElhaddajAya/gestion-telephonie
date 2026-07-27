const nodemailer = require('nodemailer');

// Le transporteur ne se cree que si les variables SMTP sont renseignees dans .env.
// Tant qu'on attend les infos (Mme Fatima Zahra / M. Sebbar), il reste "null"
// et envoyerMail() ne fait rien de bloquant.
let transporteur = null;

if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
{
    transporteur = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465, // true pour le port 465, false pour 587/25...
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
}

// Envoie un email si le SMTP est configure ; sinon se contente d'un log (aucune erreur levee).
// Ne doit jamais faire planter l'appelant, meme si l'envoi echoue.
async function envoyerMail(destinataire, sujet, contenu)
{
    if (!transporteur)
    {
        console.log(`[mailer] SMTP non configuré, email non envoyé à ${destinataire} : "${sujet}"`);
        return;
    }

    try
    {
        await transporteur.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: destinataire,
            subject: sujet,
            text: contenu,
        });
    } catch (error)
    {
        console.error('Erreur envoi email :', error.message);
    }
}

module.exports = { envoyerMail };
