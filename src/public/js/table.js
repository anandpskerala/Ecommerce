document.addEventListener("DOMContentLoaded", () => {
    const userSearchElement = document.getElementById("user-search");
    if (userSearchElement) {
        userSearchElement.addEventListener("keyup", async (event) => {
            if (event.keyCode === 13) {
                const searchTerm = event.target.value.trim();
                if (searchTerm.length > 0) {
                    window.location.href = `/admin/customers?email=${searchTerm}`;
                } else {
                    window.location.href = `/admin/customers`;
                }
            }
        });
    }

    const productSearchElement = document.getElementById("product-search");
    if (productSearchElement) {
        productSearchElement.addEventListener("keyup", async (event) => {
            if (event.keyCode === 13) {
                const searchTerm = event.target.value.trim();
                if (searchTerm.length > 0) {
                    window.location.href = `/admin/products?product=${searchTerm}`;
                } else {
                    window.location.href = `/admin/products`;
                }
            }
        });
    }
});

const edit_user = async (data) => {
    const user = JSON.parse(data);
    const current = (is_blocked) => {
        return is_blocked? "Blocked" : "Active";
    }
    const { value: formValues } = await Swal.fire({
        title: "Edit User",
        html: `
        <form id="user-form" style="display: flex; flex-direction: column; width: 100%; align-items: center; gap: 20px;">
            <div style="display: flex; flex-direction: column; width: 100%; align-items: center;">
                <label for="first_name" class="form-label">First Name</label>
                <input id="first_name" class="swal2-input" value="${user.first_name || ""}" data-validate="required|min:2">
            </div>
            <div style="display: flex; flex-direction: column; width: 100%; align-items: center;">
                <label for="last_name" class="form-label">Last Name</label>
                <input id="last_name" class="swal2-input" value="${user.last_name || ""}" data-validate="required|min:2">
            </div>
            <div style="display: flex; flex-direction: column; width: 100%; align-items: center;">
                <label for="email" class="form-label">Email</label>
                <input id="email" class="swal2-input" value="${user.email || ""}" data-validate="required|email">
            </div>
            <div style="display: flex; flex-direction: column; width: 100%; align-items: center;">
                <label for="phone_number" class="form-label">Phone Number</label>
                <input id="phone_number" class="swal2-input" value="${user.phone_number || ""}" data-validate="phonenumber">
            </div>
            <div style="display: flex; flex-direction: column; width: 100%; align-items: center; gap:10px">
                <label for="is_blocked" class="form-label">Status &nbsp;</label>
                <select id="is_blocked" class="swal2-input" style="width: 65%;">
                    <option value="true" ${user.status ? "selected" : ""}>Active</option>
                    <option value="false" ${!user.status ? "selected" : ""}>Block</option>
                </select>
            </div>
          </form>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: "Save",
        cancelButtonColor: 'Crimson',
        preConfirm: () => {
            let form = document.getElementById('user-form');
            let res = {email: user.email};
            let isValid = true;

            if (form) {
                Array.from(form.elements).forEach((input) => {
                    if (!handleValidation(input)) {
                        isValid = false;
                    } else {
                        if (input.id == "email") {
                            res['newemail'] = input.value;                            
                        } else {
                            res[input.id] = input.value;
                        }
                    }
                })
            }
            return isValid? res : false;
        }
      });
      if (formValues) {
        const req = await fetch("/admin/edit-user", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(formValues),
        })
        if (!req.ok) return alert_error("An error has occurred. Please try again.");
        const res = await req.json();
        if (res.success) {
            alert_success(res.message);
        } else {
            alert_error(res.message);
        }
      }
}

const delete_user = async (id) => {
    Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!"
      }).then(async (result) => {
        if (result.isConfirmed) {
            const req = await fetch("/admin/delete-user", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({id}),
            })
            if (!req.ok) return alert_error("An error has occurred. Please try again.");
            const res = await req.json();
            if (res.success) {
                alert_success(res.message);
            } else {
                alert_error(res.message);
            }
        }
    });
}


const edit_brand = async (data) => {
    const brand = JSON.parse(data);
    const current = (is_blocked) => {
        return is_blocked? "Blocked" : "Active";
    }
    const { value: formValues } = await Swal.fire({
        title: "Edit Brand",
        html: `
        <form id="brand-edit-form" style="display: flex; flex-direction: column; width: 100%; align-items: center; gap: 20px;" enctype="multipart/form-data">
            <div style="display: flex; flex-direction: column; width: 100%; align-items: center;">
                <label for="name" class="form-label">Brand Name</label>
                <input id="name" name="name" class="swal2-input" value="${brand.name || ""}" data-validate="required|min:2">
            </div>
            <div style="display: flex; flex-direction: column; width: 100%; align-items: center;">
                <label for="description" class="form-label">Description</label>
                <input id="description" name="description" class="swal2-input" value="${brand.description || ""}" data-validate="required|min:2">
            </div>
            <div style="display: flex; flex-direction: column; width: 100%; align-items: center;">
                <label for="image" class="form-label">Image</label>
                <input type="file" id="image" name="image" style="width: 300px; background-color: var(--input-bg); padding: 10px 10px; border-radius: 6px; margin-top: 10px;" accept="image/*">
            </div>
            <div style="display: flex; flex-direction: column; width: 100%; align-items: center; gap:10px">
                <label for="status" class="form-label">Status &nbsp;</label>
                <select id="status" name="status" class="swal2-input" style="width: 65%;">
                    <option value="true" ${brand.status ? "selected" : ""}>Active</option>
                    <option value="false" ${!brand.status ? "selected" : ""}>Block</option>
                </select>
            </div>
          </form>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: "Save",
        cancelButtonColor: 'Crimson',
        preConfirm: () => {
            let form = document.getElementById('brand-edit-form');
            console.log(form);
            let res = new FormData(form);
            res.append("id", brand._id)
            let isValid = true;

            if (form) {
                Array.from(form.elements).forEach((input) => {
                    if (!handleValidation(input)) {
                        isValid = false;
                    }
                })
            }
            return isValid? res : false;
        }
      });
      if (formValues) {
        const req = await fetch("/admin/edit-brand", {
            method: 'POST',
            body: formValues,
        })
        if (!req.ok) return alert_error("An error has occurred. Please try again.");
        const res = await req.json();
        if (res.success) {
            alert_success(res.message);
        } else {
            alert_error(res.message);
        }
      }
}


const edit_category = async (data) => {
    const category = JSON.parse(data);
    const current = (is_blocked) => {
        return is_blocked? "Blocked" : "Active";
    }
    const { value: formValues } = await Swal.fire({
        title: "Edit Brand",
        html: `
        <form id="category-edit-form" style="display: flex; flex-direction: column; width: 100%; align-items: center; gap: 20px;" enctype="multipart/form-data">
            <div style="display: flex; flex-direction: column; width: 100%; align-items: center;">
                <label for="name" class="form-label">Brand Name</label>
                <input id="name" name="name" class="swal2-input" value="${category.name || ""}" data-validate="required|min:2">
            </div>
            <div style="display: flex; flex-direction: column; width: 100%; align-items: center;">
                <label for="description" class="form-label">Description</label>
                <input id="description" name="description" class="swal2-input" value="${category.description || ""}" data-validate="required|min:2">
            </div>
            <div style="display: flex; flex-direction: column; width: 100%; align-items: center;">
                <label for="image" class="form-label">Image</label>
                <input type="file" id="image" name="image" style="width: 300px; background-color: var(--input-bg); padding: 10px 10px; border-radius: 6px; margin-top: 10px;" accept="image/*">
            </div>
            <div style="display: flex; flex-direction: column; width: 100%; align-items: center; gap:10px">
                <label for="status" class="form-label">Status &nbsp;</label>
                <select id="status" name="status" class="swal2-input" style="width: 65%;">
                    <option value="true" ${category.status ? "selected" : ""}>Active</option>
                    <option value="false" ${!category.status ? "selected" : ""}>Block</option>
                </select>
            </div>
          </form>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: "Save",
        cancelButtonColor: 'Crimson',
        preConfirm: () => {
            let form = document.getElementById('category-edit-form');
            let res = new FormData(form);
            res.append("id", category._id)
            let isValid = true;

            if (form) {
                Array.from(form.elements).forEach((input) => {
                    if (!handleValidation(input)) {
                        isValid = false;
                    }
                })
            }
            return isValid? res : false;
        }
      });
      if (formValues) {
        const req = await fetch("/admin/edit-category", {
            method: 'POST',
            body: formValues,
        })
        if (!req.ok) return alert_error("An error has occurred. Please try again.");
        
        const res = await req.json();
        if (res.success) {
            alert_success(res.message);
        } else {
            alert_error(res.message);
        }
      }
}

const delete_brand = (id) => {
    Swal.fire({
        title: "Delete Brand",
        text: "Are you sure you want to delete this brand?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Delete",
        preConfirm: () => {
            return fetch(`/admin/delete-brand/${id}`, {
                method: 'DELETE',
            })
           .then(response => response.json())
           .then(data => {
                if (data.success) {
                    alert_success(data.message);
                } else {
                    alert_error(data.message);
                }
            });
        }
    });
}

const delete_category = (id) => {
    Swal.fire({
        title: "Delete Category",
        text: "Are you sure you want to delete this category?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Delete",
        preConfirm: () => {
            return fetch(`/admin/delete-category/${id}`, {
                method: 'DELETE',
            })
           .then(response => response.json())
           .then(data => {
                if (data.success) {
                    alert_success(data.message);
                } else {
                    alert_error(data.message);
                }
            });
        }
    });
}

const delete_offer = (id) => {
    Swal.fire({
        title: "Delete Offer",
        text: "Are you sure you want to delete this offer?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Delete",
        preConfirm: () => {
            return fetch(`/admin/delete-offer/${id}`, {
                method: 'DELETE',
            })
           .then(response => response.json())
           .then(data => {
                if (data.success) {
                    alert_success(data.message);
                } else {
                    alert_error(data.message);
                }
            });
        }
    }
);
}

const delete_product = async (id) => {
    Swal.fire({
        title: "Delete Product",
        text: "Are you sure you want to delete this product?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Delete",
        preConfirm: () => {
            return fetch(`/admin/delete-product/${id}`, {
                method: 'DELETE',
            })
           .then(response => response.json())
           .then(data => {
                if (data.success) {
                    alert_success(data.message);
                } else {
                    alert_error(data.message);
                }
            });
        }
    });
}