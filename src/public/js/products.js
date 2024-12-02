document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file-input');
    const imageList = document.getElementById('image-preview-container');
    const cropperModal = document.getElementById('cropper-modal');
    const cropperImage = document.getElementById('cropper-image');
    const cropButton = document.getElementById('crop-btn');
    const cancelButton = document.getElementById('cancel-btn');
    const form = document.getElementById('product-form');
    const colors = document.querySelectorAll('.color-option');
    const selectedColors = new Set();
    let cropper;
    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB per image
    const imageArray = [];
    let currentFileIndex = 0;
    let currentFiles = [];

    if (fileInput && imageList) {
        fileInput.addEventListener('change', (event) => {
            currentFiles = Array.from(event.target.files);

            processNextFile();
        });

        function processNextFile() {
            if (currentFileIndex >= currentFiles.length) {
                currentFileIndex = 0;
                return;
            }

            const file = currentFiles[currentFileIndex];

            // Validate file size
            if (file.size > MAX_FILE_SIZE) {
                alert_error(`File "${file.name}" exceeds the 2MB size limit.`);
                currentFileIndex++;
                processNextFile();
                return;
            }

            const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                alert_error(`File "${file.name}" is not a valid image type.`);
                currentFileIndex++;
                processNextFile(); 
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                cropperImage.src = e.target.result;
                cropperModal.style.display = 'flex';

                cropper = new Cropper(cropperImage, {
                    aspectRatio: 1,
                    viewMode: 1,
                });
            };

            reader.readAsDataURL(file);
        }

        cropButton.addEventListener('click', (e) => {
            e.preventDefault();
            const canvas = cropper.getCroppedCanvas();

            if (!canvas) {
                alert_error('Please crop the image properly.');
                return;
            }


            canvas.toBlob((blob) => {
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    addImage(url, blob);
                }

                currentFileIndex++;
                processNextFile(); 
            });

            cropper.destroy();
            cropperModal.style.display = 'none';
        });

        cancelButton.addEventListener('click', (e) => {
            e.preventDefault();

            cropper.destroy();
            cropperModal.style.display = 'none';

            currentFileIndex++;
            processNextFile(); 
        });

        function addImage(imageUrl, file) {
            imageArray.push({ imageUrl, file });
            renderImages();
        }

        function renderImages() {
            imageList.innerHTML = '';
            imageArray.forEach((imageData, index) => {
                const imageItem = document.createElement('div');
                imageItem.classList.add('image-item');

                const imgElement = document.createElement('img');
                imgElement.src = imageData.imageUrl;
                imgElement.alt = 'Uploaded image';
                imageItem.appendChild(imgElement);

                const removeButton = document.createElement('button');
                removeButton.classList.add('remove-btn');
                removeButton.innerHTML = 'X';
                removeButton.addEventListener('click', () => removeImage(index));
                imageItem.appendChild(removeButton);

                imageList.appendChild(imageItem);
            });
        }

        function removeImage(index) {
            imageArray.splice(index, 1);
            renderImages();
        }

        function removeFromFormData(formData, keyToRemove) {
            const newFormData = new FormData();
        
            for (let [key, value] of formData.entries()) {
                if (key !== keyToRemove) {
                    newFormData.append(key, value);
                }
            }
        
            return newFormData;
        }

        function blobToFile(blob, fileName) {
            return new File([blob], fileName, { type: blob.type });
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = removeFromFormData(new FormData(form), 'images');

            imageArray.forEach((imageData, index) => {
                formData.append(`images`, blobToFile(imageData.file, imageData.file.name || `cropped-${index}.jpg`)); // Add the Blob object
            });


            fetch('/admin/add-product', {
                method: 'POST',
                body: formData,
            })
                .then((response) => {
                    if (response.ok) {
                        alert_success('Product added successfully!');
                        window.location.reload();
                    } else {
                        alert_success('Failed to add product.');
                    }
                })
                .catch((error) => {
                    console.error('Error:', error);
                });
        });
    }

    if (colors) {
        colors.forEach((colorElement) => {
            colorElement.addEventListener('click', () => {
                const color = colorElement.getAttribute('data-color');

                if (selectedColors.has(color)) {
                    selectedColors.delete(color); // Remove from selected colors
                    colorElement.classList.remove('selected');
                } else {
                    selectedColors.add(color); // Add to selected colors
                    colorElement.classList.add('selected');
                }

                console.log([...selectedColors]); // Log selected colors for debugging
            });
        });
    }



    $("#brand-form").on("submit", async (e) => {
        e.preventDefault();
        let form = document.getElementById("brand-form");
        Array.from(form.elements).forEach((input) => {
            if (input.type == "file" && input.value.trim() == "") {
                alert_error("Please select a file")
                return false;
            }
            console.log(input.file)
            
            if (input.value.trim() == "" && input.type != "submit") {
                alert_error("Please fill out all required fields")
                return false;
            }
        });
        let formdata = new FormData(form);
        let req = await fetch("/admin/add-brand", {
            method: "POST",
            body: formdata,
        });
        let res = await req.json();
        if (res.success) {
            alert_success(res.message)
            window.location.href = "/admin/brands"
        } else {
            alert_error(res.message)
        }
    });


    $("#category-form").on("submit", async (e) => {
        e.preventDefault();
        let form = document.getElementById("category-form");
        Array.from(form.elements).forEach((input) => {
            if (input.type == "file" && input.value.trim() == "") {
                alert_error("Please select a file")
                return false;
            }
            console.log(input.file)
            
            if (input.value.trim() == "" && input.type != "submit") {
                alert_error("Please fill out all required fields")
                return false;
            }
        });
        let formdata = new FormData(form);
        let req = await fetch("/admin/add-category", {
            method: "POST",
            body: formdata,
        });
        let res = await req.json();
        if (res.success) {
            alert_success(res.message)
            setTimeout(() => {
                window.location.href = "/admin/categories"
            }, 1000);
            
        } else {
            alert_error(res.message)
        }
    });
});
