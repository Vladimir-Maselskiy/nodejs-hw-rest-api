const { User } = require("../../models/user");
const { RequestError } = require("../../utils");

const verify = async (req, res, next) => {
	try {
		const { verificationToken } = req.params;
		const user = await User.findOne({ verificationToken });
		if (!user) throw RequestError(404);
		console.log("user", user);
		const result = await User.findByIdAndUpdate(user._id, {
			verificationToken: null,
			verify: true,
		});
		console.log("result", result);
		res.status(200).json({ message: "Verification successful" });
	} catch (error) {
		next(error);
	}
};

module.exports = verify;
