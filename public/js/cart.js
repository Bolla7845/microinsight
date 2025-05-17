// cart.js
document.addEventListener('DOMContentLoaded', function() {
    // Funzioni per gestire il carrello utilizzando il localStorage
    const cart = {
        items: [],
        
        // Inizializza il carrello
        init: function() {
            // Recupera gli elementi dal localStorage
            const savedCart = localStorage.getItem('microinsight_cart');
            if (savedCart) {
                this.items = JSON.parse(savedCart);
            }
            
            // Aggiorna UI
            this.updateUI();
            
            // Event listeners
            const emptyCartBtn = document.getElementById('empty-cart');
            if (emptyCartBtn) {
                emptyCartBtn.addEventListener('click', this.emptyCart.bind(this));
            }
            
            // Listener per rimuovere elementi
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('remove-item') || e.target.parentElement.classList.contains('remove-item')) {
                    const button = e.target.classList.contains('remove-item') ? e.target : e.target.parentElement;
                    const itemId = button.getAttribute('data-id');
                    this.removeItem(itemId);
                }
            });
        },
        
        // Aggiunge un elemento al carrello
        addItem: function(item) {
            // Controlla se l'elemento esiste già
            const existingItem = this.items.find(i => i.id === item.id);
            
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                this.items.push({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: 1,
                    type: item.type
                });
            }
            
            // Salva nel localStorage
            this.saveCart();
            
            // Aggiorna UI
            this.updateUI();
            
            // Mostra notifica
            this.showNotification(`${item.name} aggiunto al carrello`);
        },
        
        // Rimuove un elemento dal carrello
        removeItem: function(itemId) {
            this.items = this.items.filter(item => item.id !== itemId);
            
            // Salva nel localStorage
            this.saveCart();
            
            // Aggiorna UI
            this.updateUI();
        },
        
        // Svuota il carrello
        emptyCart: function() {
            this.items = [];
            
            // Salva nel localStorage
            this.saveCart();
            
            // Aggiorna UI
            this.updateUI();
        },
        
        // Salva il carrello nel localStorage
        saveCart: function() {
            localStorage.setItem('microinsight_cart', JSON.stringify(this.items));
        },
        
        // Aggiorna l'interfaccia utente
        updateUI: function() {
            // Aggiorna conteggio elementi nel nav
            const cartCountNav = document.getElementById('cart-count-nav');
            if (cartCountNav) {
                cartCountNav.textContent = this.getTotalItems();
            }
            
            // Nella pagina del carrello
            const cartItemsContainer = document.getElementById('cart-items-container');
            const cartEmpty = document.getElementById('cart-empty');
            const cartContent = document.getElementById('cart-content');
            
            if (cartItemsContainer && cartEmpty && cartContent) {
                if (this.items.length === 0) {
                    cartEmpty.style.display = 'block';
                    cartContent.style.display = 'none';
                } else {
                    cartEmpty.style.display = 'none';
                    cartContent.style.display = 'grid';
                    
                    // Genera HTML per gli elementi
                    cartItemsContainer.innerHTML = '';
                    
                    this.items.forEach(item => {
                        const itemElement = document.createElement('div');
                        itemElement.className = 'cart-item';
                        
                        // Scegli l'icona in base al tipo
                        let icon = 'fa-face-smile';
                        if (item.type === 'psicologica') icon = 'fa-brain';
                        if (item.type === 'profilo') icon = 'fa-user-gear';
                        if (item.type === 'evolutiva') icon = 'fa-chart-line';
                        if (item.type === 'armocromia') icon = 'fa-palette';
                        if (item.type === 'stile') icon = 'fa-shirt';
                        
                        itemElement.innerHTML = `
                            <div class="item-image">
                                <i class="fas ${icon}"></i>
                            </div>
                            <div class="item-details">
                                <div class="item-name">${item.name}</div>
                                <div class="item-description">Pacchetto di analisi</div>
                                <div class="item-price">€${parseFloat(item.price).toFixed(2)}</div>
                            </div>
                            <div class="item-actions">
                                <button class="remove-item" data-id="${item.id}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        `;
                        
                        cartItemsContainer.appendChild(itemElement);
                    });
                    
                    // Aggiorna totali
                    const subtotal = this.getSubtotal();
                    const tax = subtotal * 0.22; // IVA al 22%
                    const total = subtotal + tax;
                    
                    document.getElementById('cart-subtotal').textContent = `€${subtotal.toFixed(2)}`;
                    document.getElementById('cart-tax').textContent = `€${tax.toFixed(2)}`;
                    document.getElementById('cart-total').textContent = `€${total.toFixed(2)}`;
                }
            }
        },
        
        // Calcola il totale degli elementi
        getTotalItems: function() {
            return this.items.reduce((total, item) => total + item.quantity, 0);
        },
        
        // Calcola il subtotale
        getSubtotal: function() {
            return this.items.reduce((total, item) => total + (parseFloat(item.price) * item.quantity), 0);
        },
        
        // Mostra una notifica
        showNotification: function(message) {
            // Crea l'elemento notifica
            const notification = document.createElement('div');
            notification.className = 'cart-notification';
            notification.innerHTML = `
                <div class="notification-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="notification-message">${message}</div>
            `;
            
            // Aggiungi stili CSS in linea
            notification.style.position = 'fixed';
            notification.style.top = '20px';
            notification.style.right = '20px';
            notification.style.backgroundColor = 'white';
            notification.style.borderRadius = '8px';
            notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            notification.style.padding = '16px';
            notification.style.display = 'flex';
            notification.style.alignItems = 'center';
            notification.style.zIndex = '1000';
            notification.style.minWidth = '300px';
            notification.style.transform = 'translateX(120%)';
            notification.style.transition = 'transform 0.3s ease-out';
            
            // Stili per l'icona e il messaggio
            const icon = notification.querySelector('.notification-icon');
            icon.style.marginRight = '12px';
            icon.style.color = '#10b981'; // colore verde
            icon.style.fontSize = '24px';
            
            // Aggiungi la notifica al body
            document.body.appendChild(notification);
            
            // Anima l'entrata
            setTimeout(() => {
                notification.style.transform = 'translateX(0)';
            }, 10);
            
            // Rimuovi dopo 3 secondi
            setTimeout(() => {
                notification.style.transform = 'translateX(120%)';
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 300);
            }, 3000);
        }
    };
    
    // Inizializza il carrello
    cart.init();
    
    // Rendi il carrello disponibile globalmente
    window.cart = cart;
    
    // Gestisci pulsanti "Aggiungi al Carrello" per i pacchetti
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const item = {
                id: this.getAttribute('data-id'),
                name: this.getAttribute('data-name'),
                price: this.getAttribute('data-price'),
                type: this.getAttribute('data-type')
            };
            
            cart.addItem(item);
        });
    });
});