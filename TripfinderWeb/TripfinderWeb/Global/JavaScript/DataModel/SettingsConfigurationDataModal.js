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
		{ from: "TimeZone", default: "" },
		{ from: "ClientId", default: "" },
		{ from: "Smtphost", default: "" },
		{ from: "Smtpport", default: 0 },
		{ from: "SmtpuserName", default: "" },
		{ from: "Smtppassword", default: "" },
		{ from: "Smtpssl", default: false },
		{ from: "EmailAddress", default: "" },
		{ from: "EmailName", default: "" },
		{ from: "MailToList", default: [] },
		{ from: "MailCcList", default: [] },
		{ from: "MailBccList", default: [] },
		{ from: "EmailSubject", default: "" },
		{ from: "EmailMessage", default: "" },
		{ from: "TransfinderDataFolder", default: "" },
		{ from: "InstallationLocation", default: "" },
		{ from: "DatabaseServer", default: "" },
		{ from: "DatabaseName", default: "" },
		{ from: "DatabaseLoginId", default: "" },
		{ from: "DatabasePassword", default: "" },
		{ from: "IsRespectDaylight", default: true }
	];

})();