const { User, signupSchema } = require("../../models/user");
const { RequestError, sendEmail } = require("../../utils");
const bcrypt = require("bcryptjs");
const gravatar = require("gravatar");
const { getAvatarImageFileName } = require("../../utils");
const fs = require("fs/promises");
const path = require("path");
const { getTempPath } = require("../../utils");
const { getAvatarsPath } = require("../../utils");
const { resizeByJimp } = require("../../utils");
const { nanoid } = require("nanoid");

const { BASE_URL } = process.env;

const signup = async (req, res, next) => {
	try {
		const { error } = signupSchema.validate(req.body);
		if (error) throw RequestError(400, error.message);
		const { email, password } = req.body;
		const user = await User.findOne({ email });
		if (user) throw RequestError(409, "Email in use");
		let avatarURL = req.file ? "temp" : gravatar.url(email);
		const hashPassword = await bcrypt.hash(password, 10);
		const verificationToken = nanoid();
		const result = await User.create({
			...req.body,
			password: hashPassword,
			avatarURL,
			verificationToken,
		});
		if (req.file) {
			await resizeByJimp(req);
			const fileName = getAvatarImageFileName(req, result._id);
			const tempPath = getTempPath(req);
			const avatarsPath = getAvatarsPath(fileName);
			await fs.rename(tempPath, avatarsPath);
			avatarURL = path.join("avatars", fileName);
			await User.findByIdAndUpdate(result._id, { avatarURL });
		}
		const mail = {
			to: result.email,
			subject: "Verify email",
			html: `<a href = "${BASE_URL}/api/users/verify/${verificationToken}">Click to verify email</a>`,
		};

		await sendEmail(mail);

		res.status(201).json({
			user: {
				email: result.email,
				subscription: result.subscription,
			},
		});
	} catch (error) {
		next(error);
	}
};

module.exports = signup;
