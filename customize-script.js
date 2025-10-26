document.addEventListener('DOMContentLoaded', function() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const previewImage = document.getElementById('preview-image');
    const uploadContainer = document.querySelector('.upload-container');
    const uploadIcon = document.querySelector('.upload-icon');
    const dropText = document.getElementById('drop-text');
    const dropdown = document.querySelector('.custom-select-dropdown');
    const shirtDropArea = document.getElementById('shirtDropArea');
    const designArea = document.querySelector('.design-area');

    previewImage.addEventListener('load', function() {
        this.setAttribute('draggable', 'true');
    });

    previewImage.addEventListener('dragstart', function(e) {
        e.dataTransfer.setData('text/plain', 'dragged-image');
    });

    designArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('drag-over');
    });

    designArea.addEventListener('dragleave', function(e) {
        this.classList.remove('drag-over');
    });

    designArea.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('drag-over');

        if (previewImage.src) {
            const designImage = document.createElement('img');
            designImage.src = previewImage.src;
            designImage.className = 'resizable-image';
            
            // Set initial size
            designImage.style.width = '100px';
            designImage.style.height = '100px';
            
            // Calculate drop position relative to design area
            const rect = designArea.getBoundingClientRect();
            const x = e.clientX - rect.left - 50; // half of 100px
            const y = e.clientY - rect.top - 50;
            
            // Set initial position
            designImage.style.transform = `translate(${x}px, ${y}px)`;
            designImage.dataset.x = x;
            designImage.dataset.y = y;
            
            this.appendChild(designImage);
            
            // Make the image both resizable and draggable
            interact(designImage)
                .draggable({
                    inertia: true,
                    modifiers: [
                        interact.modifiers.restrictRect({
                            restriction: '.design-area',
                            endOnly: true
                        })
                    ],
                    listeners: {
                        move: dragMoveListener
                    }
                })
                .resizable({
                    edges: { left: true, right: true, bottom: true, top: true },
                    preserveAspectRatio: true,
                    inertia: true,
                    modifiers: [
                        interact.modifiers.restrictEdges({
                            outer: '.design-area'
                        })
                    ],
                    listeners: {
                        move: resizeListener
                    }
                });
        }
    });

    function dragMoveListener(event) {
        const target = event.target;
        const x = (parseFloat(target.dataset.x) || 0) + event.dx;
        const y = (parseFloat(target.dataset.y) || 0) + event.dy;

        target.style.transform = `translate(${x}px, ${y}px)`;
        target.dataset.x = x;
        target.dataset.y = y;
    }

    function resizeListener(event) {
        const target = event.target;
        let x = parseFloat(target.dataset.x) || 0;
        let y = parseFloat(target.dataset.y) || 0;

        // Update position based on resize
        x += event.deltaRect.left;
        y += event.deltaRect.top;

        Object.assign(target.style, {
            width: `${event.rect.width}px`,
            height: `${event.rect.height}px`,
            transform: `translate(${x}px, ${y}px)`
        });

        Object.assign(target.dataset, { x, y });
    }

    
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            handleFile(file);
        }
    });

    
    dropZone.addEventListener('dragover', function(e) {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', function(e) {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', function(e) {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file) {
            handleFile(file);
        }
    });

    
    function handleFile(file) {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();

            reader.onload = function(e) {
                previewImage.src = e.target.result;
                previewImage.style.display = 'block';
                uploadContainer.classList.add('has-image');

                
                if (uploadIcon) uploadIcon.style.display = 'none';
                if (dropText) dropText.style.display = 'none';

                
                const chooseAgainBtn = document.getElementById('choose-again');
                if (chooseAgainBtn) {
                    chooseAgainBtn.style.display = 'block';
                }
            };

            reader.onerror = function() {
                console.error('Error reading file');
                alert('Error uploading image. Please try again.');
            };

            reader.readAsDataURL(file);
        } else {
            alert('Please upload an image file');
        }
    }

    
    const chooseAgainBtn = document.getElementById('choose-again');
    if (chooseAgainBtn) {
        chooseAgainBtn.addEventListener('click', function() {
            
            previewImage.src = '';
            previewImage.style.display = 'none';
            uploadContainer.classList.remove('has-image');
            fileInput.value = '';

            
            if (uploadIcon) uploadIcon.style.display = 'block';
            if (dropText) dropText.style.display = 'block';

            
            this.style.display = 'none';
        });
    }

    function updateDropArea() {
        console.log('Dropdown value:', dropdown.value);

        const existingShirtImg = shirtDropArea.querySelector('.shirt-img');
        const existingMugImg = shirtDropArea.querySelector('.mug-img');
        const existingEcoBagImg = shirtDropArea.querySelector('.ecobag-img');
        const existingSignImg = shirtDropArea.querySelector('.sign-img');
        if (existingShirtImg) existingShirtImg.remove();
        if (existingMugImg) existingMugImg.remove();
        if (existingEcoBagImg) existingEcoBagImg.remove();
        if (existingSignImg) existingSignImg.remove();

        // Clear the design area
        designArea.innerHTML = '';

        if (dropdown.value === 'shirt') {
            const img = document.createElement('img');
            img.src = './images/shirt-outline.jpg'; 
            img.alt = 'Shirt Outline';
            img.className = 'shirt-img'; 
            img.style.width = '550px'; 
            img.style.height = 'auto';
            img.style.display = 'block';
            img.style.position = 'absolute';
            img.style.top = '50%';
            img.style.left = '50%';
            img.style.transform = 'translate(-50%, -50%)';
            img.style.zIndex = '0'; 

            img.onerror = function() {
                console.error('Error loading shirt image from:', this.src);
                this.src = 'shirt-outline.jpg';
            };

            shirtDropArea.insertBefore(img, designArea);
        } else if (dropdown.value === 'mug') {
            const img = document.createElement('img');
            img.src = './images/mug-outline.jpg'; 
            img.alt = 'Mug Outline';
            img.className = 'mug-img'; 
            img.style.width = '450px'; 
            img.style.height = 'auto';
            img.style.display = 'block';
            img.style.position = 'absolute';
            img.style.top = '50%';
            img.style.left = '67%';
            img.style.transform = 'translate(-50%, -50%)';
            img.style.zIndex = '0'; 

            img.onerror = function() {
                console.error('Error loading mug image from:', this.src);
                this.src = 'mug-outline.jpg';
            };

            shirtDropArea.insertBefore(img, designArea);
        } else if (dropdown.value === 'ecobag') {
            const img = document.createElement('img');
            img.src = './images/ecobag-outline.jpg'; 
            img.alt = 'Eco Bag Outline';
            img.className = 'ecobag-img'; 
            img.style.width = '310px';
            img.style.height = '390px';
            img.style.display = 'block';
            img.style.position = 'absolute';
            img.style.top = '50%';
            img.style.left = '50%';
            img.style.transform = 'translate(-50%, -50%)';
            img.style.zIndex = '0'; 

            img.onerror = function() {
                console.error('Error loading eco bag image from:', this.src);
                this.src = 'ecobag-outline.jpg';
            };

            shirtDropArea.insertBefore(img, designArea);
        } else if (dropdown.value === 'sign') {
            const img = document.createElement('img');
            img.src = './images/sign-outline.jpg'; 
            img.alt = 'Sign Outline';
            img.className = 'sign-img'; 
            img.style.width = '290px';
            img.style.height = 'auto';
            img.style.display = 'block';
            img.style.position = 'absolute';
            img.style.top = '55%';
            img.style.left = '50%';
            img.style.transform = 'translate(-50%, -50%)';
            img.style.zIndex = '0'; 

            img.onerror = function() {
                console.error('Error loading sign image from:', this.src);
                this.src = 'sign-outline.jpg';
            };

            shirtDropArea.insertBefore(img, designArea);
        }
    }

    dropdown.addEventListener('change', updateDropArea);

    updateDropArea();

    const customizeForm = document.querySelector('form.customize');
    if (customizeForm) {
        customizeForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const productType = dropdown.value;
            const customName = document.querySelector('.custom-name input').value;
            const customImage = previewImage.src;

            if (!customImage || customImage.endsWith('#')) {
                alert('Please upload an image for customization.');
                return;
            }

            const cartItem = {
                id: `custom-${Date.now()}`,
                name: `${productType} - ${customName || 'Custom'}`,
                qty: 1,
                isCustom: true,
                productType: productType,
                customName: customName,
                customImage: customImage
            };

            if (typeof getCartItems === 'function' && typeof setCartItems === 'function') {
                const items = getCartItems();
                items.push(cartItem);
                setCartItems(items);
                alert('Customized item added to cart!');
                window.location.href = 'cart.html';
            } else {
               
                let items = JSON.parse(localStorage.getItem('cartItems') || '[]');
                items.push(cartItem);
                localStorage.setItem('cartItems', JSON.stringify(items));
                alert('Customized item added to cart!');
                window.location.href = 'cart.html';
            }
        });
    }


    const customNameInput = document.querySelector('.custom-name input');
    let customNameText = null;

    function addCustomNameToDesignArea(name) {
        
        if (customNameText) customNameText.remove();

        customNameText = document.createElement('div');
        customNameText.textContent = name;
        customNameText.className = 'draggable-custom-name';
        customNameText.style.position = 'absolute';
        customNameText.style.top = '60%';
        customNameText.style.left = '50%';
        customNameText.style.transform = 'translate(-50%, -50%)';
        customNameText.style.fontSize = '2rem';
        customNameText.style.fontWeight = 'bold';
        customNameText.style.cursor = 'move';
        customNameText.style.zIndex = '2';

        designArea.appendChild(customNameText);

        
        interact(customNameText).draggable({
            listeners: {
                move (event) {
                    const target = event.target;
                    const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                    const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

                    target.style.transform = `translate(${x}px, ${y}px)`;
                    target.setAttribute('data-x', x);
                    target.setAttribute('data-y', y);
                }
            },
            inertia: true,
            modifiers: [
                interact.modifiers.restrictRect({
                    restriction: designArea,
                    endOnly: true
                })
            ]
        });
    }

    
    if (customNameInput) {
        customNameInput.addEventListener('input', function() {
            if (this.value.trim()) {
                addCustomNameToDesignArea(this.value.trim());
            } else if (customNameText) {
                customNameText.remove();
                customNameText = null;
            }
        });
    }
});


function getCartItems() {
  try { return JSON.parse(localStorage.getItem('cartItems') || '[]'); } catch(e){ return []; }
}

function setCartItems(items) {
  localStorage.setItem('cartItems', JSON.stringify(items));
  const count = items.reduce((s,it)=> s + (parseInt(it.qty,10) || 0), 0);
  localStorage.setItem('cartCount', String(count));
  window.dispatchEvent(new CustomEvent('cart:updated', { detail: { count, items } }));
}
