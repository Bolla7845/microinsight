document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('immagine');
    const uploadArea = document.querySelector('.upload-area');

    if (fileInput && uploadArea) {
        // Aggiorna il testo dell'area di upload quando un file viene selezionato
        fileInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                const fileName = this.files[0].name;
                uploadArea.querySelector('label').textContent = fileName;
                uploadArea.style.borderColor = '#3498db';
            } else {
                uploadArea.querySelector('label').textContent = 'Scegli un\'immagine o trascina qui';
                uploadArea.style.borderColor = '#ccc';
            }
        });

        // Supporto per il drag and drop
        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.style.borderColor = '#3498db';
        });

        uploadArea.addEventListener('dragleave', function() {
            this.style.borderColor = '#ccc';
        });

        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            this.style.borderColor = '#3498db';
            
            if (e.dataTransfer.files.length > 0) {
                fileInput.files = e.dataTransfer.files;
                
                // Attiva l'evento change per aggiornare l'interfaccia
                const changeEvent = new Event('change', { bubbles: true });
                fileInput.dispatchEvent(changeEvent);
            }
        });
    }

    // NUOVO CODICE: Toggle menu mobile
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    const nav = document.querySelector('.nav');
    
    if (mobileMenuButton && nav) {
        mobileMenuButton.addEventListener('click', function() {
            nav.classList.toggle('mobile-open');
        });
    }
    
    // NUOVO CODICE: Chiudi il menu mobile se si clicca su un link
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 640) {
                nav.classList.remove('mobile-open');
            }
        });
    });
});