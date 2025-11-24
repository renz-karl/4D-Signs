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

    // ====== LOAD EDITING DATA ======
    // Check if we're editing an existing item
    const editingItemData = localStorage.getItem('editingCustomItem');
    if (editingItemData) {
        try {
            const editData = JSON.parse(editingItemData);
            const itemToEdit = editData.item;
            
            console.log('Loading item for editing:', itemToEdit);
            
            // Set product type if available
            const productTypeDropdown = document.getElementById('product-type');
            if (productTypeDropdown && itemToEdit.productType) {
                productTypeDropdown.value = itemToEdit.productType;
            }
            
            // Set product name if available
            const customTextInput = document.getElementById('custom-text');
            if (customTextInput && itemToEdit.name) {
                customTextInput.value = itemToEdit.name;
            }
            
            // Load design data if available
            if (itemToEdit.designData) {
                // Load images
                if (itemToEdit.designData.images && itemToEdit.designData.images.length > 0) {
                    itemToEdit.designData.images.forEach(imgData => {
                        const designImage = document.createElement('img');
                        designImage.src = imgData.src;
                        designImage.className = 'resizable-image';
                        designImage.style.width = imgData.width;
                        designImage.style.height = imgData.height;
                        designImage.style.transform = imgData.transform || `translate(${imgData.x}, ${imgData.y})`;
                        
                        // Extract x and y from transform or use provided values
                        const match = (imgData.transform || '').match(/translate\(([^,]+),\s*([^)]+)\)/);
                        const x = match ? parseFloat(match[1]) : parseFloat(imgData.x);
                        const y = match ? parseFloat(match[2]) : parseFloat(imgData.y);
                        
                        designImage.dataset.x = x;
                        designImage.dataset.y = y;
                        
                        shirtDropArea.insertBefore(designImage, designArea);
                        
                        // Make interactive
                        makeImageInteractive(designImage);
                    });
                }
                
                // Load texts
                if (itemToEdit.designData.texts && itemToEdit.designData.texts.length > 0) {
                    itemToEdit.designData.texts.forEach(txtData => {
                        const designText = document.createElement('div');
                        designText.className = 'design-text';
                        designText.textContent = txtData.content;
                        designText.style.fontSize = txtData.fontSize || '24px';
                        designText.style.fontWeight = txtData.fontWeight || 'normal';
                        designText.style.color = txtData.color || '#FFD700';
                        designText.style.transform = txtData.transform || `translate(${txtData.x}, ${txtData.y})`;
                        
                        // Extract x and y from transform or use provided values
                        const match = (txtData.transform || '').match(/translate\(([^,]+),\s*([^)]+)\)/);
                        const x = match ? parseFloat(match[1]) : parseFloat(txtData.x);
                        const y = match ? parseFloat(match[2]) : parseFloat(txtData.y);
                        
                        designText.dataset.x = x;
                        designText.dataset.y = y;
                        
                        shirtDropArea.appendChild(designText);
                        
                        // Make interactive
                        makeTextInteractive(designText);
                    });
                }
                
                updateContentClass();
            }
            
            console.log('Item loaded successfully for editing');
        } catch (e) {
            console.error('Error loading item for editing:', e);
        }
        
        // Clear the editing data after loading to prevent it from persisting
        localStorage.removeItem('editingCustomItem');
    }
    // ====== END LOAD EDITING DATA ======

    // Helper function to update has-content class
    function updateContentClass() {
        const hasImages = shirtDropArea.querySelectorAll('.resizable-image').length > 0;
        const hasText = shirtDropArea.querySelectorAll('.design-text, .draggable-custom-name').length > 0;
        
        if (hasImages || hasText) {
            shirtDropArea.classList.add('has-content');
        } else {
            shirtDropArea.classList.remove('has-content');
        }
        
        // Update Done Design button state
        if (typeof checkDesignContent === 'function') {
            checkDesignContent();
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
            makeImageInteractive(designImage);
            selectElement(designImage);
            saveState();
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
        console.log('File selected:', file);
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
        console.log('File dropped:', file);
        if (file) {
            handleFile(file);
        }
    });

    
    function handleFile(file) {
        console.log('handleFile called with:', file);
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();

            reader.onload = function(e) {
                console.log('File loaded successfully');
                previewImage.src = e.target.result;
                previewImage.style.display = 'block';
                previewImage.style.maxWidth = '100%';
                previewImage.style.maxHeight = '200px';
                uploadContainer.classList.add('has-image');

                
                if (uploadIcon) uploadIcon.style.display = 'none';
                if (dropText) dropText.style.display = 'none';
                
                // Hide the or-text
                const orText = document.querySelector('.or-text');
                if (orText) orText.style.display = 'none';
                
                // Hide browse button
                const browseBtn = document.querySelector('.browse-btn-custom');
                if (browseBtn) browseBtn.style.display = 'none';

                
                const chooseAgainBtn = document.getElementById('choose-again');
                if (chooseAgainBtn) {
                    chooseAgainBtn.style.display = 'block';
                }
                
                console.log('Preview image set:', previewImage.src.substring(0, 50));
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
            
            // Show or-text and browse button
            const orText = document.querySelector('.or-text');
            if (orText) orText.style.display = 'block';
            
            const browseBtn = document.querySelector('.browse-btn-custom');
            if (browseBtn) browseBtn.style.display = 'block';

            
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
            img.src = './LogoProducts/shirt-outline.jpg'; 
            img.alt = 'Shirt Outline';
            img.className = 'shirt-img'; 
            img.style.width = '500px'; 
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
            img.src = './LogoProducts/mug-outline.jpg'; 
            img.alt = 'Mug Outline';
            img.className = 'mug-img'; 
            img.style.width = '550px'; 
            img.style.height = 'auto';
            img.style.display = 'block';
            img.style.position = 'absolute';
            img.style.top = '50%';
            img.style.left = '50%';
            img.style.transform = 'translate(-50%, -50%)';
            img.style.zIndex = '0'; 

            img.onerror = function() {
                console.error('Error loading mug image from:', this.src);
                this.src = 'mug-outline.jpg';
            };

            shirtDropArea.insertBefore(img, designArea);
        } else if (dropdown.value === 'ecobag') {
            const img = document.createElement('img');
            img.src = './LogoProducts/ecobag-outline.jpg'; 
            img.alt = 'Eco Bag Outline';
            img.className = 'ecobag-img'; 
            img.style.width = '310px';
            img.style.height = '400px';
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
            img.src = './LogoProducts/sign-outline.jpg'; 
            img.alt = 'Sign Outline';
            img.className = 'sign-img'; 
            img.style.width = '450px';
            img.style.height = '445px';
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

    // Clear the custom name input on page load (prevent cached values)
    if (customNameInput) {
        customNameInput.value = '';
    }

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

        // Make draggable
        makeTextInteractive(customNameText);
        saveState();
    }

    
    if (customNameInput) {
        customNameInput.addEventListener('input', function() {
            if (this.value.trim()) {
                addCustomNameToDesignArea(this.value.trim());
            } else if (customNameText) {
                customNameText.remove();
                customNameText = null;
                updateContentClass();
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

    // Undo/Redo functionality
    let undoStack = [];
    let redoStack = [];
    const MAX_UNDO_STEPS = 20;

    function saveState() {
        const state = captureDesignData();
        undoStack.push(JSON.stringify(state));
        if (undoStack.length > MAX_UNDO_STEPS) {
            undoStack.shift();
        }
        redoStack = []; // Clear redo stack when new action is performed
    }

    function undo() {
        if (undoStack.length > 0) {
            const currentState = captureDesignData();
            redoStack.push(JSON.stringify(currentState));
            const previousState = undoStack.pop();
            restoreState(JSON.parse(previousState));
        }
    }

    function redo() {
        if (redoStack.length > 0) {
            const currentState = captureDesignData();
            undoStack.push(JSON.stringify(currentState));
            const nextState = redoStack.pop();
            restoreState(JSON.parse(nextState));
        }
    }

    function restoreState(state) {
        // Clear current design
        shirtDropArea.querySelectorAll('.resizable-image, .design-text, .draggable-custom-name').forEach(el => el.remove());
        
        // Restore images
        if (state.images) {
            state.images.forEach(imgData => {
                const designImage = document.createElement('img');
                designImage.src = imgData.src;
                designImage.className = 'resizable-image';
                designImage.style.width = imgData.width;
                designImage.style.height = imgData.height;
                designImage.style.transform = imgData.transform || `translate(${imgData.x}, ${imgData.y})`;
                designImage.style.filter = imgData.filter || '';
                designImage.style.opacity = imgData.opacity || '1';
                designImage.style.zIndex = imgData.zIndex || '1';
                
                const match = (imgData.transform || '').match(/translate\(([^,]+),\s*([^)]+)\)/);
                const x = match ? parseFloat(match[1]) : parseFloat(imgData.x);
                const y = match ? parseFloat(match[2]) : parseFloat(imgData.y);
                
                designImage.dataset.x = x;
                designImage.dataset.y = y;
                
                shirtDropArea.insertBefore(designImage, designArea);
                makeImageInteractive(designImage);
            });
        }
        
        // Restore texts
        if (state.texts) {
            state.texts.forEach(txtData => {
                const designText = document.createElement('div');
                designText.className = 'design-text';
                designText.textContent = txtData.content;
                designText.style.fontSize = txtData.fontSize || '24px';
                designText.style.fontWeight = txtData.fontWeight || 'normal';
                designText.style.fontFamily = txtData.fontFamily || 'Poppins';
                designText.style.color = txtData.color || '#FFD700';
                designText.style.transform = txtData.transform || `translate(${txtData.x}, ${txtData.y})`;
                designText.style.opacity = txtData.opacity || '1';
                designText.style.zIndex = txtData.zIndex || '10';
                
                const match = (txtData.transform || '').match(/translate\(([^,]+),\s*([^)]+)\)/);
                const x = match ? parseFloat(match[1]) : parseFloat(txtData.x);
                const y = match ? parseFloat(match[2]) : parseFloat(txtData.y);
                
                designText.dataset.x = x;
                designText.dataset.y = y;
                
                shirtDropArea.appendChild(designText);
                makeTextInteractive(designText);
            });
        }
        
        updateContentClass();
    }

    // Function to select an element
    function selectElement(element) {
        if (selectedElement) {
            selectedElement.classList.remove('selected');
        }
        selectedElement = element;
        if (selectedElement) {
            selectedElement.classList.add('selected');
            updateToolValues();
            showSelectionInfo();
        } else {
            hideSelectionInfo();
        }
    }

    // Show selection info
    function showSelectionInfo() {
        const info = document.getElementById('selection-info');
        if (info && selectedElement) {
            const type = selectedElement.classList.contains('resizable-image') ? 'Image' : 'Text';
            info.innerHTML = `<i class="fas fa-check-circle"></i> Selected: ${type}`;
            info.style.display = 'block';
        }
    }

    function hideSelectionInfo() {
        const info = document.getElementById('selection-info');
        if (info) {
            info.style.display = 'none';
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

        // Update filter values if image is selected
        if (selectedElement.classList.contains('resizable-image')) {
            const filterStr = selectedElement.style.filter || '';
            const brightnessMatch = filterStr.match(/brightness\((\d+)%\)/);
            const contrastMatch = filterStr.match(/contrast\((\d+)%\)/);
            const saturationMatch = filterStr.match(/saturate\((\d+)%\)/);
            const blurMatch = filterStr.match(/blur\((\d+)px\)/);

            if (brightnessMatch) {
                const val = brightnessMatch[1];
                document.getElementById('brightness-slider').value = val;
                document.getElementById('brightness-value').textContent = val + '%';
                currentFilters.brightness = val;
            }
            if (contrastMatch) {
                const val = contrastMatch[1];
                document.getElementById('contrast-slider').value = val;
                document.getElementById('contrast-value').textContent = val + '%';
                currentFilters.contrast = val;
            }
            if (saturationMatch) {
                const val = saturationMatch[1];
                document.getElementById('saturation-slider').value = val;
                document.getElementById('saturation-value').textContent = val + '%';
                currentFilters.saturation = val;
            }
            if (blurMatch) {
                const val = blurMatch[1];
                document.getElementById('blur-slider').value = val;
                document.getElementById('blur-value').textContent = val + 'px';
                currentFilters.blur = val;
            }
        }
    }

    // Get rotation angle from transform
    function getRotationAngle(element) {
        const transform = element.style.transform || '';
        const match = transform.match(/rotate\((-?\d+)deg\)/);
        return match ? parseInt(match[1]) : 0;
    }

    // Click on design area elements to select them
    shirtDropArea.addEventListener('click', function(e) {
        if (e.target.classList.contains('resizable-image') || e.target.classList.contains('design-text')) {
            e.stopPropagation();
            selectElement(e.target);
        } else if (e.target === shirtDropArea || e.target === designArea) {
            selectElement(null);
        }
    });

    // Helper functions to make elements interactive
    function makeImageInteractive(img) {
        interact(img)
            .draggable({
                inertia: true,
                modifiers: [
                    interact.modifiers.restrictRect({
                        restriction: shirtDropArea,
                        endOnly: true
                    })
                ],
                listeners: {
                    move: dragMoveListener,
                    end: () => saveState()
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
                    move: resizeListener,
                    end: () => saveState()
                }
            });

        // Click to select
        img.addEventListener('click', (e) => {
            e.stopPropagation();
            selectElement(img);
        });
    }

    function makeTextInteractive(txt) {
        interact(txt).draggable({
            listeners: { 
                move: dragMoveListener,
                end: () => saveState()
            },
            inertia: true,
            modifiers: [
                interact.modifiers.restrictRect({
                    restriction: shirtDropArea,
                    endOnly: true
                })
            ]
        });

        // Click to select
        txt.addEventListener('click', (e) => {
            e.stopPropagation();
            selectElement(txt);
        });
    }

    // Duplicate selected element
    function duplicateElement() {
        if (!selectedElement) {
            alert('Please select an element to duplicate');
            return;
        }

        const clone = selectedElement.cloneNode(true);
        clone.classList.remove('selected');
        
        // Offset the duplicate slightly
        const x = parseFloat(selectedElement.dataset.x || 0) + 20;
        const y = parseFloat(selectedElement.dataset.y || 0) + 20;
        clone.dataset.x = x;
        clone.dataset.y = y;
        
        if (clone.classList.contains('resizable-image')) {
            const rotation = getRotationAngle(selectedElement);
            clone.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
            shirtDropArea.insertBefore(clone, designArea);
            makeImageInteractive(clone);
        } else if (clone.classList.contains('design-text')) {
            const rotation = getRotationAngle(selectedElement);
            clone.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
            shirtDropArea.appendChild(clone);
            makeTextInteractive(clone);
        }

        updateContentClass();
        saveState();
        selectElement(clone);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + Z = Undo
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            undo();
        }
        // Ctrl/Cmd + Shift + Z = Redo OR Ctrl/Cmd + Y = Redo
        else if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') || 
                 ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
            e.preventDefault();
            redo();
        }
        // Ctrl/Cmd + D = Duplicate
        else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            duplicateElement();
        }
        // Delete/Backspace = Delete selected
        else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElement) {
            e.preventDefault();
            if (confirm('Delete selected element?')) {
                selectedElement.remove();
                selectedElement = null;
                updateContentClass();
                saveState();
            }
        }
        // Arrow keys = Move selected element
        else if (selectedElement && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
            const shift = e.shiftKey ? 10 : 1;
            const x = parseFloat(selectedElement.dataset.x || 0);
            const y = parseFloat(selectedElement.dataset.y || 0);
            
            switch(e.key) {
                case 'ArrowUp':
                    selectedElement.dataset.y = y - shift;
                    break;
                case 'ArrowDown':
                    selectedElement.dataset.y = y + shift;
                    break;
                case 'ArrowLeft':
                    selectedElement.dataset.x = x - shift;
                    break;
                case 'ArrowRight':
                    selectedElement.dataset.x = x + shift;
                    break;
            }
            
            const newX = parseFloat(selectedElement.dataset.x);
            const newY = parseFloat(selectedElement.dataset.y);
            const rotation = getRotationAngle(selectedElement);
            const scaleX = selectedElement.dataset.scaleX || 1;
            const scaleY = selectedElement.dataset.scaleY || 1;
            selectedElement.style.transform = `translate(${newX}px, ${newY}px) scale(${scaleX}, ${scaleY}) rotate(${rotation}deg)`;
        }
    });

    // Show helpful notification on first load
    const hasSeenTutorial = localStorage.getItem('customizeTutorialSeen');
    if (!hasSeenTutorial) {
        setTimeout(() => {
            alert('💡 Quick Tips:\n\n• Upload an image or add text to get started\n• Click elements to select them\n• Use keyboard shortcuts: Ctrl+Z (Undo), Ctrl+D (Duplicate)\n• Drag elements to position them\n• Use the sidebar tools to customize further!');
            localStorage.setItem('customizeTutorialSeen', 'true');
        }, 1000);
    }


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
            makeTextInteractive(textElement);

            textInput.value = '';
            selectElement(textElement);
            saveState();
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
        
        textSizeSlider.addEventListener('change', function() {
            if (selectedElement && selectedElement.classList.contains('design-text')) {
                saveState();
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
        
        textColorPicker.addEventListener('change', function() {
            if (selectedElement && selectedElement.classList.contains('design-text')) {
                saveState();
            }
        });
    }

    // Text font selector
    if (textFontSelect) {
        textFontSelect.addEventListener('change', function() {
            if (selectedElement && selectedElement.classList.contains('design-text')) {
                selectedElement.style.fontFamily = this.value;
                saveState();
            }
        });
    }

    // Text weight selector
    if (textWeightSelect) {
        textWeightSelect.addEventListener('change', function() {
            if (selectedElement && selectedElement.classList.contains('design-text')) {
                selectedElement.style.fontWeight = this.value;
                saveState();
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
        
        rotationSlider.addEventListener('change', function() {
            saveState();
        });
    }

    if (resetRotationBtn) {
        resetRotationBtn.addEventListener('click', function() {
            if (!selectedElement) {
                alert('Please select an element first');
                return;
            }
            if (rotationSlider) rotationSlider.value = 0;
            if (rotationValue) rotationValue.textContent = '0°';
            if (selectedElement) {
                applyRotation(selectedElement, 0);
                saveState();
            }
        });
    }

    function applyRotation(element, angle) {
        const x = parseFloat(element.dataset.x) || 0;
        const y = parseFloat(element.dataset.y) || 0;
        const scaleX = element.dataset.scaleX || 1;
        const scaleY = element.dataset.scaleY || 1;
        element.style.transform = `translate(${x}px, ${y}px) scale(${scaleX}, ${scaleY}) rotate(${angle}deg)`;
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
        
        opacitySlider.addEventListener('change', function() {
            saveState();
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
            if (!selectedElement || !selectedElement.classList.contains('resizable-image')) {
                alert('Please select an image to apply filters');
                return;
            }
            brightnessValue.textContent = this.value + '%';
            currentFilters.brightness = this.value;
            applyFilters();
        });
        
        brightnessSlider.addEventListener('change', function() {
            saveState();
        });
    }

    if (contrastSlider && contrastValue) {
        contrastSlider.addEventListener('input', function() {
            if (!selectedElement || !selectedElement.classList.contains('resizable-image')) {
                alert('Please select an image to apply filters');
                return;
            }
            contrastValue.textContent = this.value + '%';
            currentFilters.contrast = this.value;
            applyFilters();
        });
        
        contrastSlider.addEventListener('change', function() {
            saveState();
        });
    }

    if (saturationSlider && saturationValue) {
        saturationSlider.addEventListener('input', function() {
            if (!selectedElement || !selectedElement.classList.contains('resizable-image')) {
                alert('Please select an image to apply filters');
                return;
            }
            saturationValue.textContent = this.value + '%';
            currentFilters.saturation = this.value;
            applyFilters();
        });
        
        saturationSlider.addEventListener('change', function() {
            saveState();
        });
    }

    if (blurSlider && blurValue) {
        blurSlider.addEventListener('input', function() {
            if (!selectedElement || !selectedElement.classList.contains('resizable-image')) {
                alert('Please select an image to apply filters');
                return;
            }
            blurValue.textContent = this.value + 'px';
            currentFilters.blur = this.value;
            applyFilters();
        });
        
        blurSlider.addEventListener('change', function() {
            saveState();
        });
    }

    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', function() {
            if (!selectedElement || !selectedElement.classList.contains('resizable-image')) {
                alert('Please select an image to reset filters');
                return;
            }
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
                saveState();
            }
        });
    }

    // Layer Controls
    const bringForwardBtn = document.getElementById('bring-forward');
    const sendBackwardBtn = document.getElementById('send-backward');
    const deleteSelectedBtn = document.getElementById('delete-selected');
    const duplicateBtn = document.getElementById('duplicate-btn');

    if (bringForwardBtn) {
        bringForwardBtn.addEventListener('click', function() {
            if (!selectedElement) {
                alert('Please select an element first');
                return;
            }
            const currentZ = parseInt(selectedElement.style.zIndex || 1);
            selectedElement.style.zIndex = currentZ + 1;
            saveState();
        });
    }

    if (sendBackwardBtn) {
        sendBackwardBtn.addEventListener('click', function() {
            if (!selectedElement) {
                alert('Please select an element first');
                return;
            }
            const currentZ = parseInt(selectedElement.style.zIndex || 1);
            selectedElement.style.zIndex = Math.max(1, currentZ - 1);
            saveState();
        });
    }

    if (deleteSelectedBtn) {
        deleteSelectedBtn.addEventListener('click', function() {
            if (!selectedElement) {
                alert('Please select an element first');
                return;
            }
            if (confirm('Are you sure you want to delete this element?')) {
                selectedElement.remove();
                selectedElement = null;
                updateContentClass();
                saveState();
            }
        });
    }

    if (duplicateBtn) {
        duplicateBtn.addEventListener('click', function() {
            duplicateElement();
        });
    }

    // Undo/Redo Buttons
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');

    if (undoBtn) {
        undoBtn.addEventListener('click', function() {
            undo();
        });
    }

    if (redoBtn) {
        redoBtn.addEventListener('click', function() {
            redo();
        });
    }

    // Clear All Button
    const clearAllBtn = document.getElementById('clear-all-btn');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to clear all elements? This cannot be undone.')) {
                // Clear all design elements
                shirtDropArea.querySelectorAll('.resizable-image, .design-text, .draggable-custom-name').forEach(el => el.remove());
                
                // Reset selection
                selectedElement = null;
                hideSelectionInfo();
                
                // Update content class
                updateContentClass();
                
                // Clear undo/redo stacks
                undoStack = [];
                redoStack = [];
                
                // Show success message
                alert('All elements have been cleared!');
            }
        });
    }

    // Flip & Mirror Tools
    const flipHorizontalBtn = document.getElementById('flip-horizontal');
    const flipVerticalBtn = document.getElementById('flip-vertical');

    if (flipHorizontalBtn) {
        flipHorizontalBtn.addEventListener('click', function() {
            if (!selectedElement) {
                alert('Please select an element first');
                return;
            }
            const currentScaleX = selectedElement.dataset.scaleX || 1;
            const newScaleX = currentScaleX == 1 ? -1 : 1;
            selectedElement.dataset.scaleX = newScaleX;
            applyFlip(selectedElement);
            saveState();
        });
    }

    if (flipVerticalBtn) {
        flipVerticalBtn.addEventListener('click', function() {
            if (!selectedElement) {
                alert('Please select an element first');
                return;
            }
            const currentScaleY = selectedElement.dataset.scaleY || 1;
            const newScaleY = currentScaleY == 1 ? -1 : 1;
            selectedElement.dataset.scaleY = newScaleY;
            applyFlip(selectedElement);
            saveState();
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

    // ====== DONE DESIGN BUTTON & SIZE MODAL FUNCTIONALITY ======
    const doneDesignBtn = document.getElementById('done-design-btn');
    const sizeModal = document.getElementById('size-modal');
    const closeSizeModal = document.getElementById('close-size-modal');
    const cancelSizeBtn = document.getElementById('cancel-size-btn');
    const confirmSizeBtn = document.getElementById('confirm-size-btn');

    // Function to check if design has content
    function checkDesignContent() {
        const images = shirtDropArea.querySelectorAll('.resizable-image');
        const texts = shirtDropArea.querySelectorAll('.design-text, .draggable-custom-name');
        const hasContent = images.length > 0 || texts.length > 0;
        
        if (doneDesignBtn) {
            if (hasContent) {
                doneDesignBtn.disabled = false;
                doneDesignBtn.style.opacity = '1';
                doneDesignBtn.style.cursor = 'pointer';
                doneDesignBtn.title = 'Complete your design';
            } else {
                doneDesignBtn.disabled = true;
                doneDesignBtn.style.opacity = '0.5';
                doneDesignBtn.style.cursor = 'not-allowed';
                doneDesignBtn.title = 'Add at least one image or text to continue';
            }
        }
    }

    // Initial check on page load
    checkDesignContent();

    // Function to capture design data
    function captureDesignData() {
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
                transform: transform,
                filter: img.style.filter || '',
                opacity: img.style.opacity || '1',
                zIndex: img.style.zIndex || '1'
            });
        });
        
        // Get all text elements from shirtDropArea
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
                fontFamily: txt.style.fontFamily || 'Poppins',
                color: txt.style.color || '#000000',
                x: x,
                y: y,
                transform: transform,
                opacity: txt.style.opacity || '1',
                zIndex: txt.style.zIndex || '10'
            });
        });
        
        return designData;
    }

    // Open modal on Done Design click
    if (doneDesignBtn) {
        doneDesignBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Check if button is disabled
            if (this.disabled) {
                return;
            }
            
            // Validate that design has content
            const designData = captureDesignData();
            if (designData.images.length === 0 && designData.texts.length === 0) {
                alert('Please add at least one image or text to your design.');
                return;
            }
            
            // Open the size modal
            sizeModal.classList.add('active');
        });
    }

    // Enable/Disable size controls
    document.querySelectorAll('.size-enable').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const size = this.id.replace('enable-', '');
            const controls = document.getElementById(`${size}-controls`);
            
            if (this.checked) {
                controls.classList.add('active');
                // Set default quantity to 1 when enabled
                const qtyInput = document.getElementById(`qty-${size}`);
                if (qtyInput.value === '0') {
                    qtyInput.value = '1';
                }
            } else {
                controls.classList.remove('active');
                // Reset quantity to 0 when disabled
                document.getElementById(`qty-${size}`).value = '0';
            }
        });
    });

    // Quantity buttons
    document.querySelectorAll('.qty-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const size = this.dataset.size;
            const qtyInput = document.getElementById(`qty-${size}`);
            const enableCheckbox = document.getElementById(`enable-${size}`);
            let currentQty = parseInt(qtyInput.value) || 0;

            if (this.classList.contains('plus')) {
                currentQty++;
                if (!enableCheckbox.checked && currentQty > 0) {
                    enableCheckbox.checked = true;
                    enableCheckbox.dispatchEvent(new Event('change'));
                }
            } else if (this.classList.contains('minus') && currentQty > 0) {
                currentQty--;
            }

            qtyInput.value = currentQty;
        });
    });

    // Color picker label update
    document.querySelectorAll('.size-color-picker').forEach(picker => {
        picker.addEventListener('input', function() {
            const size = this.id.replace('color-', '');
            const label = document.getElementById(`color-${size}-label`);
            label.textContent = this.value.toUpperCase();
        });
    });

    // Open modal on Done Design click
    if (doneDesignBtn) {
        doneDesignBtn.addEventListener('click', function() {
            sizeModal.classList.add('active');
        });
    }

    // Close modal functions
    function closeSizeModalFunc() {
        sizeModal.classList.remove('active');
        // Reset all values
        document.querySelectorAll('.size-enable').forEach(checkbox => {
            checkbox.checked = false;
            checkbox.dispatchEvent(new Event('change'));
        });
        document.querySelectorAll('.qty-input').forEach(input => {
            input.value = '0';
        });
        document.querySelectorAll('.size-color-picker').forEach(picker => {
            picker.value = '#ffffff';
            const size = picker.id.replace('color-', '');
            document.getElementById(`color-${size}-label`).textContent = '#FFFFFF';
        });
    }

    if (closeSizeModal) {
        closeSizeModal.addEventListener('click', closeSizeModalFunc);
    }

    if (cancelSizeBtn) {
        cancelSizeBtn.addEventListener('click', closeSizeModalFunc);
    }

    // Close modal when clicking outside
    if (sizeModal) {
        sizeModal.addEventListener('click', function(e) {
            if (e.target === sizeModal) {
                closeSizeModalFunc();
            }
        });
    }

    // Confirm and add to cart
    if (confirmSizeBtn) {
        confirmSizeBtn.addEventListener('click', function() {
            // Collect size data
            const sizeData = [];
            const sizes = ['small', 'medium', 'large'];
            
            sizes.forEach(size => {
                const enabled = document.getElementById(`enable-${size}`).checked;
                const qty = parseInt(document.getElementById(`qty-${size}`).value) || 0;
                const color = document.getElementById(`color-${size}`).value;
                
                if (enabled && qty > 0) {
                    sizeData.push({
                        size: size.charAt(0).toUpperCase() + size.slice(1),
                        quantity: qty,
                        color: color
                    });
                }
            });

            if (sizeData.length === 0) {
                alert('Please select at least one size with quantity greater than 0');
                return;
            }

            // Get design data
            const designData = captureDesignData();
            const productType = document.getElementById('product-type').value;
            const productName = document.getElementById('custom-text').value || 'Custom Product';
            
            // Get thumbnail image - use first uploaded image or default
            const thumbnailImage = designData.images.length > 0 
                ? designData.images[0].src 
                : 'BGDS.jpg';

            // Add each size as a separate cart item
            const cartItems = getCartItems();
            
            sizeData.forEach(sizeInfo => {
                const item = {
                    id: Date.now() + Math.random(),
                    name: `${productName} - Size ${sizeInfo.size}`,
                    productType: productType,
                    qty: sizeInfo.quantity,
                    price: 25.00, // Base price
                    size: sizeInfo.size,
                    color: sizeInfo.color,
                    image: thumbnailImage,  // Add thumbnail image
                    designData: designData,
                    isCustom: true,
                    customized: true
                };
                cartItems.push(item);
                console.log('Added item to cart:', item);
            });

            setCartItems(cartItems);
            console.log('Cart updated. Total items:', cartItems.length);
            
            // Close modal and show success
            closeSizeModalFunc();
            alert(`Successfully added ${sizeData.length} item(s) to cart!`);
            
            // Optional: redirect to cart
            setTimeout(() => {
                window.location.href = 'cart.html';
            }, 500);
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

