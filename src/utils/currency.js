const parse_currency = (input, decimal) => {
    const numericValue = String(input).replace(/[^0-9.]/g, "");
    const amount = parseFloat(numericValue);
    
    if (isNaN(amount)) {
        return "Invalid Amount";
    }

    return new Intl.NumberFormat('en-IN', {
        currency: 'INR',
        minimumFractionDigits: decimal,
        maximumFractionDigits: 2
    }).format(amount);
}

module.exports = { parse_currency };