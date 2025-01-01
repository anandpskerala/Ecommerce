const alert_error = (message) => {
    Swal.fire({
        icon: "error",
        title: "Oops...",
        text: message,
    }).then(async (res) => {
        if (res.isConfirmed) {
            window.location.reload();
        }
    });
}

const alert_success = (message) => {
    Swal.fire({
        icon: "success",
        title: "Success!",
        text: message,
    }).then(async (res) => {
        if (res.isConfirmed) {
            window.location.reload();
        }
    });
}

const alert_warning = (message) => {
    Swal.fire({
        icon: "warning",
        title: "Attention",
        text: message,
    }).then(async (res) => {
        if (res.isConfirmed) {
            window.location.reload();
        }
    });
}

const show_loading = (res) => {
    Swal.fire({
        title: 'Congratulations 🎉',
        html: 'Please wait while we get you a coupon.',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
            Swal.showLoading();
        },
        timer: 5000,
        timerProgressBar: true,
    }).then((result) => {
        if (result.dismiss === Swal.DismissReason.timer) {
            document.getElementById("better-luck-section").classList.add("hidden");
            document.getElementById("winner-section").classList.remove("hidden");
            if (res.coupons && res.coupons.length > 0) {
                const coupon = res.coupons[Math.floor(Math.random() * res.coupons.length)];
                document.getElementById("prize-amount").textContent = `${coupon.coupon_code}`;
            } else {
                document.getElementById("prize-amount").textContent = "$1,000,000";
            }
        }
    });
}