document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file-input');
    const imageList = document.getElementById('image-preview-container');
    const cropperModal = document.getElementById('cropper-modal');
    const cropperImage = document.getElementById('cropper-image');
    const cropButton = document.getElementById('crop-btn');
    const cancelButton = document.getElementById('cancel-btn');
    let cropper;
    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB per image
    let imageArray = [];


    if (fileInput && imageList) {
        fileInput.addEventListener('change', (event) => {
            const files = Array.from(event.target.files);

            files.forEach(file => {
                if (file.size > MAX_FILE_SIZE) {
                    alert(`File "${file.name}" exceeds the 2MB size limit.`);
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
            });

            console.log(imageArray)
        });

        cropButton.addEventListener('click', (e) => {
            e.preventDefault();
            const canvas = cropper.getCroppedCanvas();
    
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                addImage(url, blob);
            });
            cropper.destroy();
            cropperModal.style.display = 'none';
        });
    
        cancelButton.addEventListener('click', (e) => {
            e.preventDefault();
            cropper.destroy();
            cropperModal.style.display = 'none';
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
    }
});