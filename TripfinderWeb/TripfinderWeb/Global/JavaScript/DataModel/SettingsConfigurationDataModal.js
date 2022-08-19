(function()
{
	var namespace = window.createNamespace("TF.DataModel");
	namespace.SettingsConfigurationDataModal = function(settingsConfigurationEntity)
	{
		namespace.BaseDataModel.call(this, settingsConfigurationEntity);
	};

	namespace.SettingsConfigurationDataModal.prototype = Object.create(namespace.BaseDataModel.prototype);

	namespace.SettingsConfigurationDataModal.prototype.constructor = namespace.SettingsConfigurationDataModal;

	namespace.SettingsConfigurationDataModal.prototype.mapping = [
		{ from: "ClientId", default: "" },
		{ from: "SMTPHost", default: "" },
		{ from: "SMTPPort", default: 0 },
		{ from: "SMTPUserName", default: "" },
		{ from: "SMTPPassword", default: "" },
		{ from: "SMTPSSL", default: false },
		{ from: "EmailAddress", default: "" },
		{ from: "EmailName", default: "" },
		{ from: "MailToList", default: [] },
		{ from: "MailCcList", default: [] },
		{ from: "MailBccList", default: [] },
		{ from: "EmailSubject", default: "" },
		{ from: "EmailMessage", default: "" },
		{ from: "UnitOfMeasure", default: 0 }
	];

})();