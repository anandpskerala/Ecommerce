const search_element = document.getElementById('product-search');

if (search_element) {
    search_element.addEventListener('keyup', (event) => {
        if (event.keyCode === 13) {
            const search_term = event.target.value.trim();
            if (search_term.length > 0) {
                window.location.href = `/products?search=${search_term}`;
            } else {
                window.location.href = '/products';
            }
        }
    });
 
}

const open_cart_menu = () => {
    const cart_menu = document.getElementById("cart-menu");
    cart_menu.style.display = "flex";
};

const close_cart_menu = () => {
    const cart_menu = document.getElementById("cart-menu");
    cart_menu.style.display = "none";
};

const remove_from_cart = async (product_id) => {
    const req = await fetch(`/user/cart/${product_id}`, {
        method: 'DELETE',
    });

    if (!req.ok) {
        return alert_error("An error occurred while removing the product from the cart. Please try again.");
    }

    const res = await req.json();
    if (res.success) {
        alert_success(res.message);
    } else {
        alert_error(res.message);
    }
}