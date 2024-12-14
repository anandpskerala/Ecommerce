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