class Auth {
    constructor() {
        this.isConnected = false;
        this.userAddress = null;
        this.authToken = null;
        this.onConnect = null;
        this.nonce = null;
        
        // Восстанавливаем состояние из localStorage
        this.loadFromStorage();
        
        document.getElementById('connectWallet').addEventListener('click', () => {
            this.connectWallet();
        });

        document.getElementById('disconnectWallet').addEventListener('click', () => {
            this.disconnectWallet();
        });
        
        this.updateUI();
    }

    loadFromStorage() {
        const savedAuth = localStorage.getItem('monadWalletAuth');
        if (savedAuth) {
            try {
                const authData = JSON.parse(savedAuth);
                this.isConnected = authData.isConnected;
                this.userAddress = authData.userAddress;
                this.authToken = authData.authToken;
            } catch (e) {
                console.error('Error loading auth state:', e);
                this.clearStorage();
            }
        }
    }

    saveToStorage() {
        const authData = {
            isConnected: this.isConnected,
            userAddress: this.userAddress,
            authToken: this.authToken
        };
        localStorage.setItem('monadWalletAuth', JSON.stringify(authData));
    }

    clearStorage() {
        localStorage.removeItem('monadWalletAuth');
        this.isConnected = false;
        this.userAddress = null;
        this.authToken = null;
    }

    updateUI() {
        if (this.isConnected && this.userAddress) {
            document.getElementById('walletAddress').textContent = 
                `${this.userAddress.slice(0, 6)}...${this.userAddress.slice(-4)}`;
            document.getElementById('connectWallet').style.display = 'none';
            document.getElementById('disconnectWallet').style.display = 'inline-block';
            
            if (this.onConnect) {
                this.onConnect();
            }
        } else {
            document.getElementById('walletAddress').textContent = '';
            document.getElementById('connectWallet').style.display = 'inline-block';
            document.getElementById('disconnectWallet').style.display = 'none';
            document.getElementById('playerStats').style.display = 'none';
        }
    }

    async getNonce(address) {
        try {
            const response = await fetch(`http://localhost:3000/auth/nonce?address=${address}`);
            const data = await response.json();
            return data.nonce;
        } catch (error) {
            console.error('Error getting nonce:', error);
            return null;
        }
    }

    async connectWallet() {
        try {
            if (typeof window.ethereum !== 'undefined') {
                const accounts = await window.ethereum.request({ 
                    method: 'eth_requestAccounts' 
                });
                
                this.userAddress = accounts[0];
                
                // Try to get nonce and sign message for enhanced security
                try {
                    this.nonce = await this.getNonce(this.userAddress);
                    if (this.nonce) {
                        const message = `Sign this message to authenticate with Monad Coloring Game. Nonce: ${this.nonce}`;
                        const signature = await window.ethereum.request({
                            method: 'personal_sign',
                            params: [message, this.userAddress],
                        });
                        
                        const response = await fetch('http://localhost:3000/auth/wallet', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ 
                                address: this.userAddress,
                                signature: signature
                            })
                        });
                        
                        const data = await response.json();
                        
                        if (data.token) {
                            this.authToken = data.token;
                            this.isConnected = true;
                            this.saveToStorage();
                            this.updateUI();
                            return;
                        }
                    }
                } catch (signError) {
                    console.warn('Signature authentication failed, falling back to basic auth:', signError);
                    // Fall through to basic authentication
                }
                
                // Fallback to basic authentication (original behavior)
                this.isConnected = true;
                this.saveToStorage();
                this.updateUI();
                
                const response = await fetch('http://localhost:3000/auth/wallet', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ address: this.userAddress })
                });
                
                const data = await response.json();
                
                if (data.token) {
                    this.authToken = data.token;
                    this.saveToStorage();
                }
            } else {
                alert('Please install MetaMask or another Web3 wallet!');
            }
        } catch (error) {
            console.error('Wallet connection failed:', error);
            alert('Wallet connection failed. Please try again.');
        }
    }

    disconnectWallet() {
        this.clearStorage();
        this.updateUI();
    }

    getAuthHeaders() {
        if (!this.authToken) {
            return {
                'Content-Type': 'application/json'
            };
        }
        
        return {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
        };
    }
}

const auth = new Auth();