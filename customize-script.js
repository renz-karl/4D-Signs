// Note: running customization script directly (was previously wrapped in DOMContentLoaded)
    const dropdown = document.querySelector('.custom-select-dropdown');
    const shirtDropArea = document.getElementById('shirtDropArea');
    const designArea = document.querySelector('.design-area');
    const previewImage = document.getElementById('preview-image');
    const imageUploadInput = document.getElementById('image-upload');
    const uploadArea = document.getElementById('upload-area');
    
    // If we're editing an existing custom cart item, keep context here so we can update it on save
    let editingContext = null;

    // ====== LOAD EDITING DATA ======
    const editingItemData = localStorage.getItem('editingCustomItem');
    if (editingItemData) {
        try {
            const editData = JSON.parse(editingItemData);
            const itemToEdit = editData.item;
            editingContext = editData;
            console.log('Loading item for editing:', itemToEdit);

            const productTypeDropdown = document.getElementById('product-type');
            if (productTypeDropdown && itemToEdit.productType) {
                productTypeDropdown.value = itemToEdit.productType;
            }

            const customTextInput = document.getElementById('custom-text');
            if (customTextInput && itemToEdit.name) {
                customTextInput.value = typeof itemToEdit.name === 'string' ? itemToEdit.name.replace(/ - Size .*$/,'') : itemToEdit.name;
            }

            if (itemToEdit.designData) {
                if (itemToEdit.designData.images && itemToEdit.designData.images.length > 0) {
                    itemToEdit.designData.images.forEach(imgData => {
                        const designImage = document.createElement('img');
                        designImage.src = imgData.src;
                        designImage.className = 'resizable-image';
                        designImage.style.width = imgData.width;
                        designImage.style.height = imgData.height;
                        designImage.style.transform = imgData.transform || `translate(${imgData.x}, ${imgData.y})`;

                        const match = (imgData.transform || '').match(/translate\(([^,]+),\s*([^)]+)\)/);
                        const x = match ? parseFloat(match[1]) : parseFloat(imgData.x) || 0;
                        const y = match ? parseFloat(match[2]) : parseFloat(imgData.y) || 0;

                        designImage.dataset.x = x;
                        designImage.dataset.y = y;

                        shirtDropArea.insertBefore(designImage, designArea);
                        makeImageInteractive(designImage);
                    });
                }

                if (itemToEdit.designData.texts && itemToEdit.designData.texts.length > 0) {
                    itemToEdit.designData.texts.forEach(txtData => {
                        const designText = document.createElement('div');
                        designText.className = 'design-text';
                        designText.textContent = txtData.content;
                        designText.style.fontSize = txtData.fontSize || '24px';
                        designText.style.fontWeight = txtData.fontWeight || 'normal';
                        designText.style.color = txtData.color || '#FFD700';
                        designText.style.transform = txtData.transform || `translate(${txtData.x}, ${txtData.y})`;

                        const match = (txtData.transform || '').match(/translate\(([^,]+),\s*([^)]+)\)/);
                        const x = match ? parseFloat(match[1]) : parseFloat(txtData.x) || 0;
                        const y = match ? parseFloat(match[2]) : parseFloat(txtData.y) || 0;

                        designText.dataset.x = x;
                        designText.dataset.y = y;

                        shirtDropArea.appendChild(designText);
                        makeTextInteractive(designText);
                    });
                }

                updateContentClass();
            }

            console.log('Item loaded successfully for editing');
        } catch (e) {
            console.error('Error loading item for editing:', e);
        }
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
        
        if (typeof checkDesignContent === 'function') {
            checkDesignContent();
        }
    }

    // ====== IMAGE UPLOAD FUNCTIONALITY ======
    if (previewImage) {
        previewImage.addEventListener('load', function() {
            this.setAttribute('draggable', 'true');
        });

        previewImage.addEventListener('dragstart', function(e) {
            e.dataTransfer.setData('text/plain', 'dragged-image');
        });
    }

    // Add drag handlers to shirt-drop-area
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
        if (previewImage && previewImage.src) {
            const designImage = document.createElement('img');
            designImage.src = previewImage.src;
            designImage.className = 'resizable-image';
            designImage.style.position = 'absolute';
            designImage.style.width = '150px';
            designImage.style.height = 'auto';

            const rect = shirtDropArea.getBoundingClientRect();
            const dropX = e.clientX;
            const dropY = e.clientY;

            function placeImage() {
                const iw = designImage.getBoundingClientRect().width || 150;
                const ih = designImage.getBoundingClientRect().height || (iw * (designImage.naturalHeight / designImage.naturalWidth || 1));

                let x = dropX - rect.left - (iw / 2);
                let y = dropY - rect.top - (ih / 2);

                x = Math.max(0, Math.min(x, rect.width - iw));
                y = Math.max(0, Math.min(y, rect.height - ih));

                designImage.style.transform = `translate(${x}px, ${y}px)`;
                designImage.dataset.x = x;
                designImage.dataset.y = y;

                shirtDropArea.insertBefore(designImage, designArea);
                updateContentClass();
                makeImageInteractive(designImage);
                selectElement(designImage);
                saveState();
            }

            if (designImage.complete) {
                placeImage();
            } else {
                designImage.onload = placeImage;
            }
        }
    });

    function updateDropArea() {
        console.log('Dropdown value:', dropdown.value);
        // Hide all base product images and only show the selected product
        const allImages = document.querySelectorAll('.product-template-image');
        allImages.forEach(img => img.style.display = 'none');
        const imageMap = {
            'shirt': 'shirt-image',
            'mug': 'mug-image',
            'ecobag': 'ecobag-image',
            'key-chain': 'key-chain-image',
            'ref-magnet': 'ref-magnet-image',
            'sticker': 'sticker-image',
            'sign': 'sign-image'
        };
        const imageId = imageMap[dropdown.value];
        if (imageId) {
            const img = document.getElementById(imageId);
            if (img) img.style.display = 'block';
        }
        // Toggle the template overlay images to match selected product type
        const allTemplates = document.querySelectorAll('.template-img');
        allTemplates.forEach(t => t.style.display = 'none');
        const templateMap = {
            'shirt': 'shirt-template',
            'mug': 'mug-template',
            'sign': 'sign-template'
        };
        const templateId = templateMap[dropdown.value];
        if (templateId) {
            const tmpl = document.getElementById(templateId);
            if (tmpl) tmpl.style.display = 'block';
        }
        
        const existingDynamicImages = shirtDropArea.querySelectorAll('.shirt-img, .mug-img, .ecobag-img, .sign-img');
        existingDynamicImages.forEach(img => img.remove());
    }

    if (dropdown) {
        dropdown.addEventListener('change', updateDropArea);
        updateDropArea();
    }

    const customNameInput = document.getElementById('custom-text');
    let customNameText = null;

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

    // ====== CUSTOMIZATION TOOLS ======
    let selectedElement = null;
    let currentFilters = {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        blur: 0
    };

    let undoStack = [];
    let redoStack = [];
    const MAX_UNDO_STEPS = 20;

    function saveState() {
        const state = captureDesignData();
        undoStack.push(JSON.stringify(state));
        if (undoStack.length > MAX_UNDO_STEPS) {
            undoStack.shift();
        }
        redoStack = [];
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
        shirtDropArea.querySelectorAll('.resizable-image, .design-text, .draggable-custom-name').forEach(el => el.remove());
        
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

        if (selectedElement.classList.contains('resizable-image')) {
            const filterStr = selectedElement.style.filter || '';
            const brightnessMatch = filterStr.match(/brightness\((\d+)%\)/);
            const contrastMatch = filterStr.match(/contrast\((\d+)%\)/);
            const saturationMatch = filterStr.match(/saturate\((\d+)%\)/);
            const blurMatch = filterStr.match(/blur\((\d+)px\)/);

            if (brightnessMatch) {
                const val = brightnessMatch[1];
                const brightSlider = document.getElementById('brightness-slider');
                const brightValue = document.getElementById('brightness-value');
                if (brightSlider && brightValue) {
                    brightSlider.value = val;
                    brightValue.textContent = val + '%';
                    currentFilters.brightness = val;
                }
            }
            if (contrastMatch) {
                const val = contrastMatch[1];
                const contrastSlider = document.getElementById('contrast-slider');
                const contrastValue = document.getElementById('contrast-value');
                if (contrastSlider && contrastValue) {
                    contrastSlider.value = val;
                    contrastValue.textContent = val + '%';
                    currentFilters.contrast = val;
                }
            }
            if (saturationMatch) {
                const val = saturationMatch[1];
                const saturationSlider = document.getElementById('saturation-slider');
                const saturationValue = document.getElementById('saturation-value');
                if (saturationSlider && saturationValue) {
                    saturationSlider.value = val;
                    saturationValue.textContent = val + '%';
                    currentFilters.saturation = val;
                }
            }
            if (blurMatch) {
                const val = blurMatch[1];
                const blurSlider = document.getElementById('blur-slider');
                const blurValue = document.getElementById('blur-value');
                if (blurSlider && blurValue) {
                    blurSlider.value = val;
                    blurValue.textContent = val + 'px';
                    currentFilters.blur = val;
                }
            }
        }
    }

    function getRotationAngle(element) {
        const transform = element.style.transform || '';
        const match = transform.match(/rotate\((-?\d+)deg\)/);
        return match ? parseInt(match[1]) : 0;
    }

    shirtDropArea.addEventListener('click', function(e) {
        if (e.target.classList.contains('resizable-image') || e.target.classList.contains('design-text')) {
            e.stopPropagation();
            selectElement(e.target);
        } else if (e.target === shirtDropArea || e.target === designArea) {
            selectElement(null);
        }
    });

    function makeImageInteractive(img) {
        // Simplified without interact.js to avoid parse errors in environment
        if (img.id === 'sign-image' || img.id === 'shirt-image' || 
            img.id === 'mug-image' || img.id === 'ecobag-image' ||
            img.classList.contains('sign-preview') || 
            img.classList.contains('shirt-preview') ||
            img.classList.contains('mug-preview') || 
            img.classList.contains('ecobag-preview')) {
            return;
        }

        img.addEventListener('click', function(e) {
            e.stopPropagation();
            selectElement(img);
        });
    }

    function makeTextInteractive(txt) {
        // Put back drag & resize for text using interact.js
        try {
            interact(txt)
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
                        end: function() { saveState(); }
                    }
                })
                .resizable({
                    edges: { left: true, right: true, bottom: true, top: true },
                    preserveAspectRatio: false,
                    inertia: true,
                    modifiers: [
                        interact.modifiers.restrictEdges({ outer: shirtDropArea }),
                        interact.modifiers.restrictSize({ min: { width: 30, height: 20 } })
                    ],
                    listeners: {
                        move: resizeTextListener,
                        end: function() { saveState(); }
                    }
                });
        } catch (err) {
            // If Interact.js isn't available or throws, fall back to simple click handler
            txt.addEventListener('click', function(e) {
                e.stopPropagation();
                selectElement(txt);
            });
        }
    }

    function dragMoveListener(event) {
        const target = event.target;
        let x = parseFloat(target.dataset.x || 0) + event.dx;
        let y = parseFloat(target.dataset.y || 0) + event.dy;
        target.dataset.x = x;
        target.dataset.y = y;
        const rotation = (function() {
            const t = target.style.transform || '';
            const m = t.match(/rotate\((-?\d+)deg\)/);
            return m ? parseInt(m[1], 10) : 0;
        })();
        const scaleX = target.dataset.scaleX || 1;
        const scaleY = target.dataset.scaleY || 1;
        target.style.transform = `translate(${x}px, ${y}px) scale(${scaleX}, ${scaleY}) rotate(${rotation}deg)`;
    }

    function resizeListener(event) {
        const target = event.target;
        let x = parseFloat(target.dataset.x || 0) + event.deltaRect.left;
        let y = parseFloat(target.dataset.y || 0) + event.deltaRect.top;
        target.style.width = `${event.rect.width}px`;
        target.style.height = `${event.rect.height}px`;
        target.dataset.x = x;
        target.dataset.y = y;
        const rotation = (function() {
            const t = target.style.transform || '';
            const m = t.match(/rotate\((-?\d+)deg\)/);
            return m ? parseInt(m[1], 10) : 0;
        })();
        const scaleX = target.dataset.scaleX || 1;
        const scaleY = target.dataset.scaleY || 1;
        target.style.transform = `translate(${x}px, ${y}px) scale(${scaleX}, ${scaleY}) rotate(${rotation}deg)`;
    }

    function resizeTextListener(event) {
        const target = event.target;
        let x = parseFloat(target.dataset.x || 0) + (event.deltaRect ? event.deltaRect.left : 0);
        let y = parseFloat(target.dataset.y || 0) + (event.deltaRect ? event.deltaRect.top : 0);

        // Set font size based on rect height (ensure a minimum)
        const newHeight = event.rect ? event.rect.height : null;
        if (newHeight) {
            const newFontSize = Math.max(8, Math.round(newHeight * 0.6));
            target.style.fontSize = newFontSize + 'px';
        }

        target.dataset.x = x;
        target.dataset.y = y;

        const rotation = (function() {
            const t = target.style.transform || '';
            const m = t.match(/rotate\((-?\d+)deg\)/);
            return m ? parseInt(m[1], 10) : 0;
        })();
        const scaleX = target.dataset.scaleX || 1;
        const scaleY = target.dataset.scaleY || 1;
        target.style.transform = `translate(${x}px, ${y}px) scale(${scaleX}, ${scaleY}) rotate(${rotation}deg)`;
    }

    function duplicateElement() {
        if (!selectedElement) {
            alert('Please select an element to duplicate');
            return;
        }

        const clone = selectedElement.cloneNode(true);
        clone.classList.remove('selected');
        
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

    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            undo();
        }
        else if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') || 
                 ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
            e.preventDefault();
            redo();
        }
        else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            duplicateElement();
        }
        else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElement) {
            e.preventDefault();
            if (confirm('Delete selected element?')) {
                selectedElement.remove();
                selectedElement = null;
                updateContentClass();
                saveState();
            }
        }
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

            makeTextInteractive(textElement);

            textInput.value = '';
            selectElement(textElement);
            saveState();
        });
    }

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

    if (textFontSelect) {
        textFontSelect.addEventListener('change', function() {
            if (selectedElement && selectedElement.classList.contains('design-text')) {
                selectedElement.style.fontFamily = this.value;
                saveState();
            }
        });
    }

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
                shirtDropArea.querySelectorAll('.resizable-image, .design-text, .draggable-custom-name').forEach(el => el.remove());
                
                selectedElement = null;
                hideSelectionInfo();
                updateContentClass();
                
                undoStack = [];
                redoStack = [];
                
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

    // Icon library removed — no icon insertion UI

    // Logo upload removed — no UI for logo insertion

    // ====== DONE DESIGN BUTTON & SIZE MODAL FUNCTIONALITY ======
    const doneDesignBtn = document.getElementById('done-design-btn');
    const sizeModal = document.getElementById('size-qty-modal');
    const cancelSizeBtn = document.querySelector('.cancel-action');
    const confirmSizeBtn = document.querySelector('.confirm-action');

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

    checkDesignContent();

    function captureDesignData() {
        const designData = {
            images: [],
            texts: []
        };
        
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

    if (doneDesignBtn) {
        doneDesignBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (this.disabled) {
                return;
            }
            
            const designData = captureDesignData();
            if (designData.images.length === 0 && designData.texts.length === 0) {
                alert('Please add at least one image or text to your design.');
                return;
            }
            
            if (sizeModal) {
                sizeModal.classList.add('active');
            }
        });
    }

    // Enable/Disable size controls
    document.querySelectorAll('.size-enable').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const size = this.id.replace('enable-', '');
            const controls = document.getElementById(`${size}-controls`);
            
            if (this.checked) {
                if (controls) controls.classList.add('active');
                const qtyInput = document.getElementById(`qty-${size}`);
                if (qtyInput && qtyInput.value === '0') {
                    qtyInput.value = '1';
                }
            } else {
                if (controls) controls.classList.remove('active');
                const qtyInput = document.getElementById(`qty-${size}`);
                if (qtyInput) qtyInput.value = '0';
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

            if (qtyInput) qtyInput.value = currentQty;
        });
    });

    // Color picker label update
    document.querySelectorAll('.size-color-picker').forEach(picker => {
        picker.addEventListener('input', function() {
            const size = this.id.replace('color-', '');
            const label = document.getElementById(`color-${size}-label`);
            if (label) label.textContent = this.value.toUpperCase();
        });
    });

    // Image upload event listeners (moved inside DOMContentLoaded)
    if (imageUploadInput) {
        imageUploadInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(evt) {
                    if (previewImage) {
                        previewImage.src = evt.target.result;
                        previewImage.style.display = 'block';
                        document.querySelectorAll('.upload-icon, #drop-text, .or-text, .browse-btn').forEach(el => {
                            if (el.classList && el.classList.contains('upload-icon')) el.style.display = 'none';
                            if (el.id === 'drop-text') el.style.display = 'none';
                            if (el.classList && el.classList.contains('or-text')) el.style.display = 'none';
                            if (el.classList && el.classList.contains('browse-btn')) el.style.display = 'none';
                        });
                    }
                };
                reader.readAsDataURL(file);
            }
        });

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (uploadArea) uploadArea.classList.add('drag-over');
        });

        uploadArea.addEventListener('dragleave', () => {
            if (uploadArea) uploadArea.classList.remove('drag-over');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            if (uploadArea) uploadArea.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files[0]) {
                imageUploadInput.files = files;
                imageUploadInput.dispatchEvent(new Event('change'));
            }
        });
    }
// Removed duplicate image upload block (handlers already added inside DOMContentLoaded)