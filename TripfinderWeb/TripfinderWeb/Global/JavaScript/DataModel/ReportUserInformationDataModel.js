(function()
{
	var namespace = window.createNamespace("TF.DataModel");

	namespace.ReportUserInformationDataModel = function(entity)
	{
		namespace.BaseDataModel.call(this, entity);
	};

	namespace.ReportUserInformationDataModel.prototype = Object.create(namespace.BaseDataModel.prototype);

	namespace.ReportUserInformationDataModel.prototype.constructor = namespace.ReportUserInformationDataModel;

	namespace.ReportUserInformationDataModel.prototype.mapping = [
		{ from: "City", default: "" },
		{ from: "CompanyId", default: "" },
		{ from: "CompanyName", default: "" },
		{ from: "County", default: "" },
		{ from: "Dba", default: "" },
		{ from: "Hours", default: "" },
		{ from: "OfficeName", default: "" },
		{ from: "Person2Name", default: "" },
		{ from: "Person2Title", default: "" },
		{ from: "PersonName", default: "" },
		{ from: "PersonTitle", default: "" },
		{ from: "Phone", default: "" },
		{ from: "Phone2", default: "" },
		{ from: "State", default: "" },
		{ from: "Street1", default: "" },
		{ from: "Street2", default: "" },
		{ from: "User1", default: "" },
		{ from: "User10", default: "" },
		{ from: "User11", default: "" },
		{ from: "User12", default: "" },
		{ from: "User13", default: "" },
		{ from: "User14", default: "" },
		{ from: "User15", default: "" },
		{ from: "User16", default: "" },
		{ from: "User2", default: "" },
		{ from: "User3", default: "" },
		{ from: "User4", default: "" },
		{ from: "User5", default: "" },
		{ from: "User6", default: "" },
		{ from: "User7", default: "" },
		{ from: "User8", default: "" },
		{ from: "User9", default: "" },
		{ from: "Zip", default: "" }
	];
})();