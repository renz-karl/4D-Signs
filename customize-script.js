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

    // Helper function to update has-content class
    function updateContentClass() {
        const hasImages = shirtDropArea.querySelectorAll('.resizable-image').length > 0;
        const hasText = shirtDropArea.querySelectorAll('.design-text, .draggable-custom-name').length > 0;
        
        if (hasImages || hasText) {
            shirtDropArea.classList.add('has-content');
        } else {
            shirtDropArea.classList.remove('has-content');
        }
    }

    previewImage.addEventListener('load', function() {
        this.setAttribute('draggable', 'true');
    });

    previewImage.addEventListener('dragstart', function(e) {
        e.dataTransfer.setData('text/plain', 'dragged-image');
    });

    // Add drag handlers to shirt-drop-area since design-area has pointer-events: none
    shirtDropArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('drag-over');
    });

    shirtDropArea.addEventListener('dragleave', function(e) {
        this.classList.remove('drag-over');
    });

    shirtDropArea.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('drag-over');

        if (previewImage.src) {
            const designImage = document.createElement('img');
            designImage.src = previewImage.src;
            designImage.className = 'resizable-image';
            
            // Set initial size
            designImage.style.width = '150px';
            designImage.style.height = 'auto';
            
            // Calculate drop position relative to shirt drop area
            const rect = shirtDropArea.getBoundingClientRect();
            const x = e.clientX - rect.left - 75; // half of 150px
            const y = e.clientY - rect.top - 75;
            
            // Set initial position
            designImage.style.transform = `translate(${x}px, ${y}px)`;
            designImage.dataset.x = x;
            designImage.dataset.y = y;
            
            shirtDropArea.insertBefore(designImage, designArea);
            updateContentClass();
            
            // Make the image both resizable and draggable
            interact(designImage)
                .draggable({
                    inertia: true,
                    modifiers: [
                        interact.modifiers.restrictRect({
                            restriction: shirtDropArea,
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
                            outer: shirtDropArea
                        }),
                        interact.modifiers.restrictSize({
                            min: { width: 50, height: 50 }
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

        shirtDropArea.insertBefore(customNameText, designArea);
        updateContentClass();

        
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
                    restriction: shirtDropArea,
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

    // ====== NEW CUSTOMIZATION TOOLS ======
    
    let selectedElement = null;
    let currentFilters = {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        blur: 0
    };

    // Function to select an element
    function selectElement(element) {
        if (selectedElement) {
            selectedElement.classList.remove('selected');
        }
        selectedElement = element;
        if (selectedElement) {
            selectedElement.classList.add('selected');
            updateToolValues();
        }
    }

    // Update tool values based on selected element
    function updateToolValues() {
        if (!selectedElement) return;
        
        const rotation = getRotationAngle(selectedElement);
        const rotationSlider = document.getElementById('rotation-slider');
        const rotationValue = document.getElementById('rotation-value');
        if (rotationSlider) {
            rotationSlider.value = rotation;
            rotationValue.textContent = rotation + '°';
        }

        const opacity = parseFloat(selectedElement.style.opacity || 1) * 100;
        const opacitySlider = document.getElementById('opacity-slider');
        const opacityValue = document.getElementById('opacity-value');
        if (opacitySlider) {
            opacitySlider.value = opacity;
            opacityValue.textContent = Math.round(opacity) + '%';
        }
    }

    // Get rotation angle from transform
    function getRotationAngle(element) {
        const transform = element.style.transform || '';
        const match = transform.match(/rotate\((-?\d+)deg\)/);
        return match ? parseInt(match[1]) : 0;
    }

    // Click on design area elements to select them
    designArea.addEventListener('click', function(e) {
        if (e.target.classList.contains('resizable-image') || e.target.classList.contains('design-text')) {
            selectElement(e.target);
        } else if (e.target === designArea) {
            selectElement(null);
        }
    });

    // Add Text Tool
    const addTextBtn = document.getElementById('add-text-btn');
    const textInput = document.getElementById('text-input');
    const textSizeSlider = document.getElementById('text-size');
    const textSizeValue = document.getElementById('text-size-value');
    const textColorPicker = document.getElementById('text-color');
    const textFontSelect = document.getElementById('text-font');
    const textWeightSelect = document.getElementById('text-weight');

    if (addTextBtn && textInput) {
        addTextBtn.addEventListener('click', function() {
            const text = textInput.value.trim();
            if (!text) {
                alert('Please enter some text!');
                return;
            }

            const textElement = document.createElement('div');
            textElement.className = 'design-text';
            textElement.textContent = text;
            textElement.style.position = 'absolute';
            textElement.style.fontSize = (textSizeSlider?.value || 24) + 'px';
            textElement.style.color = textColorPicker?.value || '#FFD700';
            textElement.style.fontFamily = textFontSelect?.value || 'Poppins';
            textElement.style.fontWeight = textWeightSelect?.value || '700';
            textElement.style.left = '50px';
            textElement.style.top = '50px';
            textElement.dataset.x = 50;
            textElement.dataset.y = 50;

            shirtDropArea.insertBefore(textElement, designArea);
            updateContentClass();

            // Make text draggable
            interact(textElement).draggable({
                listeners: { move: dragMoveListener },
                inertia: true,
                modifiers: [
                    interact.modifiers.restrictRect({
                        restriction: shirtDropArea,
                        endOnly: true
                    })
                ]
            });

            textInput.value = '';
            selectElement(textElement);
        });
    }

    // Text size slider
    if (textSizeSlider && textSizeValue) {
        textSizeSlider.addEventListener('input', function() {
            textSizeValue.textContent = this.value + 'px';
            if (selectedElement && selectedElement.classList.contains('design-text')) {
                selectedElement.style.fontSize = this.value + 'px';
            }
        });
    }

    // Text color picker
    if (textColorPicker) {
        textColorPicker.addEventListener('input', function() {
            if (selectedElement && selectedElement.classList.contains('design-text')) {
                selectedElement.style.color = this.value;
            }
        });
    }

    // Text font selector
    if (textFontSelect) {
        textFontSelect.addEventListener('change', function() {
            if (selectedElement && selectedElement.classList.contains('design-text')) {
                selectedElement.style.fontFamily = this.value;
            }
        });
    }

    // Text weight selector
    if (textWeightSelect) {
        textWeightSelect.addEventListener('change', function() {
            if (selectedElement && selectedElement.classList.contains('design-text')) {
                selectedElement.style.fontWeight = this.value;
            }
        });
    }

    // Rotation Tool
    const rotationSlider = document.getElementById('rotation-slider');
    const rotationValue = document.getElementById('rotation-value');
    const resetRotationBtn = document.getElementById('reset-rotation');

    if (rotationSlider && rotationValue) {
        rotationSlider.addEventListener('input', function() {
            rotationValue.textContent = this.value + '°';
            if (selectedElement) {
                applyRotation(selectedElement, this.value);
            }
        });
    }

    if (resetRotationBtn) {
        resetRotationBtn.addEventListener('click', function() {
            if (rotationSlider) rotationSlider.value = 0;
            if (rotationValue) rotationValue.textContent = '0°';
            if (selectedElement) {
                applyRotation(selectedElement, 0);
            }
        });
    }

    function applyRotation(element, angle) {
        const x = parseFloat(element.dataset.x) || 0;
        const y = parseFloat(element.dataset.y) || 0;
        element.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
    }

    // Opacity Tool
    const opacitySlider = document.getElementById('opacity-slider');
    const opacityValue = document.getElementById('opacity-value');

    if (opacitySlider && opacityValue) {
        opacitySlider.addEventListener('input', function() {
            opacityValue.textContent = this.value + '%';
            if (selectedElement) {
                selectedElement.style.opacity = this.value / 100;
            }
        });
    }

    // Filter Tools
    const brightnessSlider = document.getElementById('brightness-slider');
    const brightnessValue = document.getElementById('brightness-value');
    const contrastSlider = document.getElementById('contrast-slider');
    const contrastValue = document.getElementById('contrast-value');
    const saturationSlider = document.getElementById('saturation-slider');
    const saturationValue = document.getElementById('saturation-value');
    const blurSlider = document.getElementById('blur-slider');
    const blurValue = document.getElementById('blur-value');
    const resetFiltersBtn = document.getElementById('reset-filters');

    function applyFilters() {
        if (selectedElement && selectedElement.classList.contains('resizable-image')) {
            const filterString = `brightness(${currentFilters.brightness}%) contrast(${currentFilters.contrast}%) saturate(${currentFilters.saturation}%) blur(${currentFilters.blur}px)`;
            selectedElement.style.filter = filterString;
        }
    }

    if (brightnessSlider && brightnessValue) {
        brightnessSlider.addEventListener('input', function() {
            brightnessValue.textContent = this.value + '%';
            currentFilters.brightness = this.value;
            applyFilters();
        });
    }

    if (contrastSlider && contrastValue) {
        contrastSlider.addEventListener('input', function() {
            contrastValue.textContent = this.value + '%';
            currentFilters.contrast = this.value;
            applyFilters();
        });
    }

    if (saturationSlider && saturationValue) {
        saturationSlider.addEventListener('input', function() {
            saturationValue.textContent = this.value + '%';
            currentFilters.saturation = this.value;
            applyFilters();
        });
    }

    if (blurSlider && blurValue) {
        blurSlider.addEventListener('input', function() {
            blurValue.textContent = this.value + 'px';
            currentFilters.blur = this.value;
            applyFilters();
        });
    }

    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', function() {
            currentFilters = { brightness: 100, contrast: 100, saturation: 100, blur: 0 };
            if (brightnessSlider) brightnessSlider.value = 100;
            if (brightnessValue) brightnessValue.textContent = '100%';
            if (contrastSlider) contrastSlider.value = 100;
            if (contrastValue) contrastValue.textContent = '100%';
            if (saturationSlider) saturationSlider.value = 100;
            if (saturationValue) saturationValue.textContent = '100%';
            if (blurSlider) blurSlider.value = 0;
            if (blurValue) blurValue.textContent = '0px';
            if (selectedElement) {
                selectedElement.style.filter = 'none';
            }
        });
    }

    // Layer Controls
    const bringForwardBtn = document.getElementById('bring-forward');
    const sendBackwardBtn = document.getElementById('send-backward');
    const deleteSelectedBtn = document.getElementById('delete-selected');

    if (bringForwardBtn) {
        bringForwardBtn.addEventListener('click', function() {
            if (selectedElement) {
                const currentZ = parseInt(selectedElement.style.zIndex || 1);
                selectedElement.style.zIndex = currentZ + 1;
            }
        });
    }

    if (sendBackwardBtn) {
        sendBackwardBtn.addEventListener('click', function() {
            if (selectedElement) {
                const currentZ = parseInt(selectedElement.style.zIndex || 1);
                selectedElement.style.zIndex = Math.max(1, currentZ - 1);
            }
        });
    }

    if (deleteSelectedBtn) {
        deleteSelectedBtn.addEventListener('click', function() {
            if (selectedElement && confirm('Are you sure you want to delete this element?')) {
                selectedElement.remove();
                selectedElement = null;
                updateContentClass();
            }
        });
    }

    // Flip & Mirror Tools
    const flipHorizontalBtn = document.getElementById('flip-horizontal');
    const flipVerticalBtn = document.getElementById('flip-vertical');

    if (flipHorizontalBtn) {
        flipHorizontalBtn.addEventListener('click', function() {
            if (selectedElement) {
                const currentScaleX = selectedElement.dataset.scaleX || 1;
                const newScaleX = currentScaleX == 1 ? -1 : 1;
                selectedElement.dataset.scaleX = newScaleX;
                applyFlip(selectedElement);
            }
        });
    }

    if (flipVerticalBtn) {
        flipVerticalBtn.addEventListener('click', function() {
            if (selectedElement) {
                const currentScaleY = selectedElement.dataset.scaleY || 1;
                const newScaleY = currentScaleY == 1 ? -1 : 1;
                selectedElement.dataset.scaleY = newScaleY;
                applyFlip(selectedElement);
            }
        });
    }

    function applyFlip(element) {
        const x = parseFloat(element.dataset.x) || 0;
        const y = parseFloat(element.dataset.y) || 0;
        const scaleX = element.dataset.scaleX || 1;
        const scaleY = element.dataset.scaleY || 1;
        const rotation = getRotationAngle(element);
        element.style.transform = `translate(${x}px, ${y}px) scale(${scaleX}, ${scaleY}) rotate(${rotation}deg)`;
    }

    // ====== END NEW TOOLS ======

    // ====== DONE DESIGN BUTTON ======
    const doneDesignBtn = document.getElementById('done-design-btn');
    if (doneDesignBtn) {
        doneDesignBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Collect design data
            const designData = {
                images: [],
                texts: []
            };
            
            // Get all resizable images from shirtDropArea
            const images = shirtDropArea.querySelectorAll('.resizable-image');
            images.forEach(img => {
                const transform = img.style.transform || '';
                const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
                const x = match ? match[1] : '0px';
                const y = match ? match[2] : '0px';
                
                designData.images.push({
                    src: img.src,
                    width: img.style.width || img.width + 'px',
                    height: img.style.height || img.height + 'px',
                    x: x,
                    y: y,
                    transform: transform
                });
            });
            
            // Get all text elements from shirtDropArea (including both .design-text and .draggable-custom-name)
            const texts = shirtDropArea.querySelectorAll('.design-text, .draggable-custom-name');
            texts.forEach(txt => {
                const transform = txt.style.transform || '';
                const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
                const x = match ? match[1] : '0px';
                const y = match ? match[2] : '0px';
                
                designData.texts.push({
                    content: txt.textContent,
                    fontSize: txt.style.fontSize || '24px',
                    fontWeight: txt.style.fontWeight || 'normal',
                    color: txt.style.color || '#000000',
                    x: x,
                    y: y,
                    transform: transform
                });
            });
            
            // Check if we have any customizations
            if (designData.images.length === 0 && designData.texts.length === 0) {
                alert('Please add at least one image or text to your design.');
                return;
            }
            
            // Get product info from dropdown
            const productTypeDropdown = document.getElementById('product-type');
            const productType = productTypeDropdown ? productTypeDropdown.value : 'sign';
            const productName = productTypeDropdown ? productTypeDropdown.options[productTypeDropdown.selectedIndex].text : 'Custom Sign';
            const productPrice = 99.99; // Default price for custom sign
            
            // Get first uploaded image as thumbnail, or use default
            const thumbnailImage = designData.images.length > 0 ? designData.images[0].src : 'images/custom-sign.jpg';
            
            // Create cart item
            const cartItem = {
                id: Date.now().toString(),
                name: productName,
                price: productPrice,
                qty: 1,
                image: thumbnailImage,
                isCustom: true,
                productType: productType,
                designData: designData
            };
            
            console.log('Adding cart item:', cartItem);
            
            // Check if we're editing an existing item
            const editingItem = localStorage.getItem('editingCustomItem');
            if (editingItem) {
                try {
                    const editData = JSON.parse(editingItem);
                    cartItem.id = editData.id; // Keep the same ID
                    console.log('Editing existing item with ID:', editData.id);
                } catch(e) {
                    console.error('Error parsing editing item:', e);
                }
            }
            
            // Get current cart
            const cartItems = getCartItems();
            console.log('Current cart items:', cartItems);
            
            // Remove old item if editing
            const existingIndex = cartItems.findIndex(item => item.id === cartItem.id);
            if (existingIndex >= 0) {
                cartItems[existingIndex] = cartItem;
                console.log('Updated existing item at index:', existingIndex);
            } else {
                cartItems.push(cartItem);
                console.log('Added new item to cart');
            }
            
            // Save to cart
            setCartItems(cartItems);
            console.log('Cart saved. Total items:', cartItems.length);
            
            // Clear editing flag
            localStorage.removeItem('editingCustomItem');
            
            // Show success message and redirect
            alert('Design added to cart successfully!');
            window.location.href = 'cart.html';
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
