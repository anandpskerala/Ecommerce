const offer = require('../../models/offer_model');
const timer = require('../../utils/time');

const create_offer = async (req, res) => {
    try {
        const { name } = req.body;
        const exists = await offer.findOne({name: {$regex: new RegExp(`^${name}$`, 'i')}});
        if (exists) {
            return res.status(400).json({success: false, message: "Offer already exists"});
        }
        
        const offers = new offer(req.body);
        await offers.save();
        return res.status(201).json({success: true, message: "Offer added successfully"});
    } catch (err) {
        console.error("Error in create offer:", err);
        return res.status(500).json({success: false, message: "An error occurred"});
    }
};

const load_offers = async (req, res) => {
    return res.render(
        "admin/offers", 
        {
            title: "Offers", 
            page: "Offers", 
        }
    );
};

const get_offers = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.body;
        const offers = await offer.find().sort({createdAt: -1}).skip((page - 1) * limit).limit(Number(limit));
        const total = await offer.countDocuments();
        return res.status(200).json(
            {
                success: true,
                offers,
                time: timer,
                totalPages: Math.ceil(total / limit),
                currentPage: Number(page),
            }
        );
    } catch (error) {
        console.log("Error in getting offers", error);
        return res.status(500).json({success: false, message: "An error occurred"});
    }
};

const delete_offer = async (req, res) => {
    const { id } = req.params;
    const exists = await offer.findOne({_id: id})
    if (!exists) {
        return res.status(400).json({success: false, message: "Invalid request"});
    }
    await offer.deleteOne({_id: id});
    return res.status(200).json({success: true, message: "Offer deleted successfully"});
};

module.exports = {
    create_offer,
    load_offers,
    delete_offer,
    get_offers
}