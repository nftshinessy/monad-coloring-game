const { Web3 } = require('web3');
const web3 = new Web3();
const crypto = require('crypto');

// Простая имитация аутентификации для демо
const activeSessions = {};
const nonceStore = {};

const generateNonce = (address) => {
  const nonce = crypto.randomBytes(16).toString('hex');
  nonceStore[address] = {
    nonce,
    timestamp: Date.now()
  };
  return nonce;
};

const validateSignature = (address, signature, nonce) => {
  try {
    if (!nonceStore[address] || Date.now() - nonceStore[address].timestamp > 300000) {
      return false; // Nonce expired or doesn't exist
    }
    
    const message = `Sign this message to authenticate with Monad Coloring Game. Nonce: ${nonce}`;
    const recoveredAddress = web3.eth.accounts.recover(message, signature);
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error('Signature validation error:', error);
    return false;
  }
};

const handleWalletAuth = (req, res) => {
  try {
    const { address, signature } = req.body;
    
    if (!address) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    // For demo purposes, we'll skip signature validation if not provided
    // This maintains backward compatibility with the current frontend
    if (signature) {
      const nonce = nonceStore[address]?.nonce;
      if (!nonce || !validateSignature(address, signature, nonce)) {
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const sessionToken = crypto.randomBytes(32).toString('hex');
    activeSessions[sessionToken] = {
      address,
      createdAt: Date.now()
    };
    
    // Generate new nonce for next request
    const newNonce = generateNonce(address);
    
    res.json({ 
      token: sessionToken, 
      address,
      nonce: newNonce 
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getNonce = (req, res) => {
  try {
    const { address } = req.query;
    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }
    
    const nonce = generateNonce(address);
    res.json({ nonce });
  } catch (error) {
    console.error('Nonce generation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token || !activeSessions[token]) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    const session = activeSessions[token];
    if (Date.now() - session.createdAt > 24 * 60 * 60 * 1000) {
      delete activeSessions[token];
      return res.status(401).json({ error: 'Session expired' });
    }
    
    req.user = session;
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Cleanup expired sessions every hour
setInterval(() => {
  const now = Date.now();
  Object.keys(activeSessions).forEach(token => {
    if (now - activeSessions[token].createdAt > 24 * 60 * 60 * 1000) {
      delete activeSessions[token];
    }
  });
  
  // Cleanup expired nonces
  Object.keys(nonceStore).forEach(address => {
    if (now - nonceStore[address].timestamp > 300000) {
      delete nonceStore[address];
    }
  });
}, 60 * 60 * 1000);

// Правильный экспорт функций
module.exports = {
  handleWalletAuth,
  authenticate,
  getNonce
};