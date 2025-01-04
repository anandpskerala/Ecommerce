const search_element = document.getElementById('product-search');
const cart_minus_buttons = document.querySelectorAll('.cart-minus');
const cart_plus_buttons = document.querySelectorAll('.cart-plus');

if (search_element) {
    search_element.addEventListener('keyup', (event) => {
        if (event.keyCode === 13) {
            const search_term = event.target.value.trim();
            const current_path = window.location.pathname;
            const search_query = `?search=${encodeURIComponent(search_term)}`;

            if (current_path.split("?")[0] != `/products`) {
                window.location.href = `/products${search_query}`;
            } else {
                window.history.pushState({}, "", search_query);
                fetch_data_from_server();
            }
        }
    });
}

const open_cart_menu = (session) => {
    session = JSON.parse(session);
    if (!session.user) {
        window.location.href = "/login";
        return;
    }
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

function formatDate(date) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = new Date(date).getDate();
    const month = months[new Date(date).getMonth()];
    const year = new Date(date).getFullYear();

    return `${day} ${month} ${year}`;
}

cart_minus_buttons.forEach((minus_element, index) => {
    minus_element.addEventListener('click', () => {
        const cart_quantity = document.getElementById(`cart-quantity-${index}`);
        let current_quantity = parseInt(cart_quantity.value);
        const min = parseInt(cart_quantity.min);
        if (current_quantity > min) {
            cart_quantity.value = --current_quantity;
        }
        update_cart_buttons(index, current_quantity);
        update_cart_quantity(index, current_quantity);
    });
});

cart_plus_buttons.forEach((plus_element, index) => {
    plus_element.addEventListener('click', () => {
        const cart_quantity = document.getElementById(`cart-quantity-${index}`);
        let current_quantity = parseInt(cart_quantity.value);
        const max = parseInt(cart_quantity.max);
        if (current_quantity < max) {
            cart_quantity.value = ++current_quantity;
        }
        update_cart_buttons(index, current_quantity);
        update_cart_quantity(index, current_quantity);
    });
});

const update_cart_buttons = (index, value) => {
    const cart_quantity = document.getElementById(`cart-quantity-${index}`);
    const minus_button = document.getElementById(`cart-minus-${index}`);
    const plus_button = document.getElementById(`cart-plus-${index}`);
    const min = parseInt(cart_quantity.min);
    const max = parseInt(cart_quantity.max);
    minus_button.disabled = value <= min;
    plus_button.disabled = value >= max;
};

const debounce_request = (func, delay) => {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => func(...args), delay);
    };
};


const update_cart_quantity = debounce_request(async (index, quantity) => {
    const cart_quantity = document.getElementById(`cart-quantity-${index}`);
    const cart_id = cart_quantity.dataset.value;
    const req = await fetch(`/user/update-cart`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            cart_id,
            quantity,
        }),
    });
    if (!req.ok) {
        return alert_error("An error occurred while updating the cart quantity. Please try again.");
    }
    const res = await req.json();
    if (!res.success) {
        alert_error(res.message);
    } else {
        if (window.location.pathname == '/user/carts') {
            window.location.reload();
        }
    }
}, 1000);


function formatCurrency(value) {
    if (value >= 1e7) {
        return `₹${(value / 1e7).toFixed(2)} Cr`;
    } else if (value >= 1e5) {
        return `₹${(value / 1e5).toFixed(2)} L`;
    } else if (value >= 1e3) {
        return `₹${(value / 1e3).toFixed(2)} K`;
    } else {
        return `₹${value.toFixed(2)}`;
    }
}
