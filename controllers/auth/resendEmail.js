const { User, emailSchema } = require("../../models/user");
const { RequestError, sendEmail } = require("../../utils");

const { BASE_URL } = process.env;

const resendEmail = async (req, res, next) => {
	try {
		const { error } = emailSchema.validate(req.body);
		if (error) throw RequestError(400, "missing required field email");
		const { email } = req.body;
		const user = await User.findOne({ email });
		if (!user) throw RequestError(404);
		if (user.verify)
			throw RequestError(400, "Verification has already been passed");

		const mail = {
			to: email,
			subject: "Verify email",
			html: `<a href = "${BASE_URL}/api/users/verify/${user.verificationToken}">Click to verify email</a>`,
		};

		await sendEmail(mail);

		res.status(200).json({
			massage: "Verification email sent",
		});
	} catch (error) {
		next(error);
	}
};

module.exports = resendEmail;
