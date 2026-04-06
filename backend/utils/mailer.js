import sgMail from "@sendgrid/mail";

const getFromEmail = () =>
	process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_FROM || process.env.SENDGRID_EMAIL;

const ensureSendGridConfigured = () => {
	const apiKey = process.env.SENDGRID_API_KEY;
	const from = getFromEmail();
	if (!apiKey || !from) return null;

	sgMail.setApiKey(apiKey);
	return from;
};

export const sendEmail = async ({ to, subject, text, html }) => {
	const from = ensureSendGridConfigured();
	if (!from) {
		return { success: false, error: "SendGrid credentials not configured" };
	}

	try {
		await sgMail.send({ from, to, subject, text, html });
		return { success: true };
	} catch (error) {
		const statusCode = error?.code || error?.response?.statusCode;
		const providerErrors = error?.response?.body?.errors;
		const providerMessage = Array.isArray(providerErrors)
			? providerErrors.map((item) => item?.message).filter(Boolean).join("; ")
			: "";

		return {
			success: false,
			error:
				providerMessage ||
				error?.message ||
				"Failed to send email",
			statusCode,
		};
	}
};
