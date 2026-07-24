const jwt = require('jsonwebtoken');

// Ce middleware verifie que la requete contient un token JWT valide
// avant de laisser passer vers la route demandee
function verifyToken(req, res, next)
{
    const authHeader = req.headers.authorization; // format attendu : "Bearer <token>"

    if (!authHeader)
    {
        return res.status(401).json({ message: 'Non authentifié.' });
    }

    const token = authHeader.split(' ')[1];

    try
    {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // on rend les infos du token disponibles dans la suite de la requete
        next(); // on laisse passer vers la vraie route
    } catch (error)
    {
        return res.status(401).json({ message: 'Token invalide ou expiré.' });
    }
}

module.exports = verifyToken;