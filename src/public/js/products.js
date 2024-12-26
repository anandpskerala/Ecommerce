document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file-input');
    const imageList = document.getElementById('image-preview-container');
    const cropperModal = document.getElementById('cropper-modal');
    const cropperImage = document.getElementById('cropper-image');
    const cropButton = document.getElementById('crop-btn');
    const cancelButton = document.getElementById('cancel-btn');
    const form = document.getElementById('product-form');
    const colors = document.querySelectorAll('.color-option');
    const colorElement = document.getElementById('colors');
    const selectedColors = new Set();
    let cropper;
    const MAX_FILE_SIZE = 2 * 1024 * 1024;
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
            let validForm = true;
            Array.from(form.elements).forEach((input) => {
                if (!handleValidation(input)) {
                    isValid = false;
                }
                if (input.type === "file" && input.value.trim() === "") {
                    validForm = false;
                    alert_error("Please select at least one image");
                }

                if (imageArray.length < 3) {
                    validForm = false;
                    alert_error("Please select at least 3 images");
                }
            })

            if (!validForm) return;
            const formData = removeFromFormData(new FormData(form), 'images');
            imageArray.forEach((imageData, index) => {
                formData.append('images', blobToFile(imageData.file, imageData.file.name || `cropped-${index}.jpg`));
            });


            fetch('/admin/add-product', {
                method: 'POST',
                body: formData,
            })
                .then((response) => {
                    if (response.ok) {
                        return response.json();
                    }
                    throw new Error('Failed to fetch');
                })
                .then((data) => {
                    if (data.success) {
                        alert_success(data.message);
                    } else {
                        alert_error(data.message);
                    }
                })
                .catch((error) => {
                    console.error('Fetch error:', error);
                });
        });
    }

    if (colors) {
        colors.forEach((colorElement) => {
            colorElement.addEventListener('click', () => {
                const color = colorElement.getAttribute('data-color');

                if (selectedColors.has(color)) {
                    selectedColors.delete(color);
                    colorElement.classList.remove('selected');
                } else {
                    selectedColors.add(color);
                    colorElement.classList.add('selected');
                }

                document.getElementById('colors').value = `${[...selectedColors]}`; 
            });
        });
    }



    $("#brand-form").on("submit", async (e) => {
        e.preventDefault();
        let isValid = true;
        let form = document.getElementById("brand-form");
        Array.from(form.elements).forEach((input) => {
            if (!handleValidation(input)) {
                isValid = false;
            }
        });
        if (!isValid) return;
        let formdata = new FormData(form);
        let req = await fetch("/admin/add-brand", {
            method: "POST",
            body: formdata,
        });
        if (!req.ok) return alert_error("An error has occurred. Please try again.");
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
        let validForm = true;
        Array.from(form.elements).forEach((input) => {
            if (!handleValidation(input)) {
                validForm = false;
            }
        });
        if (!validForm) return;
        let formdata = new FormData(form);
        let req = await fetch("/admin/add-category", {
            method: "POST",
            body: formdata,
        });
        if (!req.ok) return alert_error("An error has occurred. Please try again.");
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


    $("#offer-form").on("submit", async (e) => {
        e.preventDefault();
        let form = document.getElementById("offer-form");
        let formdata = new URLSearchParams();
        Array.from(form.elements).forEach((input) => {
            if (input.value.trim() == "" && input.type != "submit") {
                alert_error("Please fill out all required fields")
                return false;
            } else {
                console.log(input.type)
                if (input.id == "activation" || input.id == "expiry") {
                    let date = new Date(input.value).toISOString();
                    formdata.append(input.name, date);
                } else { 
                    formdata.append(input.name, input.value);
                }
            }
        });

        let req = await fetch("/admin/create-offer", {
            method: "POST",
            body: formdata,
        });
        if (!req.ok) return alert_error("An error has occurred. Please try again.");
        let res = await req.json();
        if (res.success) {
            alert_success(res.message)
            setTimeout(() => {
                window.location.href = "/admin/offers"
            }, 1000);
            
        } else {
            alert_error(res.message)
        }
    });

    $("#coupon-form").submit(async (e) => {
        e.preventDefault();
        let form = document.getElementById("coupon-form");
        let formdata = new URLSearchParams();
        let isValid = true;
        Array.from(form.elements).forEach((input) => {
            if (!handleValidation(input)) {
                isValid = false;
            } else {
                if (input.id == "expiry" || input.id == "activation") {
                    let date = new Date(input.value).toISOString();
                    formdata.append(input.name, date);
                } else { 
                    formdata.append(input.name, input.value);
                }
            }
        });

        if (!isValid) return;
        let req = await fetch("/admin/create-coupon", {
            method: "POST",
            body: formdata,
        });
        if (!req.ok) return alert_error("An error has occurred. Please try again.");
        let res = await req.json();
        if (res.success) {
            alert_success(res.message)
            setTimeout(() => {
                window.location.href = "/admin/coupons"
            }, 1000);
            
        } else {
            alert_error(res.message)
        }
    });

    $("#edit-coupon-form").submit(async (e) => {
        e.preventDefault();
        let form = document.getElementById("edit-coupon-form");
        let formdata = new URLSearchParams();
        let isValid = true;
        Array.from(form.elements).forEach((input) => {
            if (!handleValidation(input)) {
                isValid = false;
            } else {
                if (input.id == "expiry" || input.id == "activation") {
                    let date = new Date(input.value).toISOString();
                    formdata.append(input.name, date);
                } else { 
                    formdata.append(input.name, input.value);
                }
            }
        });

        if (!isValid) return;

        let req = await fetch("/admin/edit-coupon", {
            method: "POST",
            body: formdata,
        });
        if (!req.ok) return alert_error("An error has occurred. Please try again.");
        let res = await req.json();
        if (res.success) {
            alert_success(res.message)
            setTimeout(() => {
                window.location.href = "/admin/coupons"
            }, 1000);
            
        } else {
            alert_error(res.message)
        }
    })

    const variant_elements = document.querySelectorAll(".variant-option");
    variant_elements.forEach((element) => {
        element.addEventListener("click", async (e) => {
            e.preventDefault();
            let tbody = document.getElementById("variants");
            let data = tbody.value != "" ? JSON.parse(tbody.value): {};
            const { value: formValues } = await Swal.fire({
                title: "Add Variant",
                html: `
                <form id="variant-form" style="display: flex; flex-direction: column; width: 100%; align-items: center; gap: 20px;">
                    <div style="display: flex; flex-direction: column; width: 100%; align-items: center;">
                        <label for="name" class="form-label">Variant Name</label>
                        <input id="name" name="name" class="swal2-input" value="${e.target.title}" data-validate="required|min:2" disabled>
                    </div>
                    <div style="display: flex; flex-direction: column; width: 100%; align-items: center;">
                        <label for="price" class="form-label">Price</label>
                        <input id="price" type="number" name="price" class="swal2-input" value="${data[e.target.title]? data[e.target.title].price: ''}" data-validate="required|nonegative">
                        <span class="form-error"></span>
                    </div>
                    <div style="display: flex; flex-direction: column; width: 100%; align-items: center;">
                        <label for="quantity" class="form-label">Quantity</label>
                        <input id="quantity" type="number" name="quantity" class="swal2-input" value="${data[e.target.title]? data[e.target.title].quantity: ''}" data-validate="required|nonegative">
                        <span class="form-error"></span>
                    </div>
                </form>
                `,
                focusConfirm: false,
                showCancelButton: true,
                confirmButtonText: "Save",
                cancelButtonColor: 'Crimson',
                preConfirm: () => {
                    let form = document.getElementById('variant-form');
                    let res = {...data};
                    let isValid = true;

                    if (form) {
                        Array.from(form.elements).forEach((input) => {
                            if (!handleValidation(input)) {
                                isValid = false;
                            } else {
                                res[input.id] = input.value;
                            }
                        })
                    }
                    return isValid? res : false;
                }
            });

            if (formValues) {
                data[formValues.name] = {price: formValues.price, quantity: formValues.quantity};
                tbody.value = JSON.stringify(data)
            }
        })
    });
});