const bcrypt = require('bcrypt');
const logger = require('./logger');

// Funzione per hashare la password
async function hashPassword(password) {
  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    logger.debug('Password hashata:', hashedPassword);
  } catch (error) {
    logger.error('Errore nella generazione dell\'hash:', error);
  }
}

// Passa la password che vuoi hashare come argomento
hashPassword('Pollone44?');