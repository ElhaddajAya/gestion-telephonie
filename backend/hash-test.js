const bcrypt = require('bcrypt');

const motDePasse = '1234'; // le mot de passe à veux tester
bcrypt.hash(motDePasse, 10).then((hash) =>
{
    console.log('Mot de passe hache :', hash);
});