(function()
{
	var namespace = window.createNamespace("TF.DataModel");
	namespace.GridFilterDataModel = function(gridFilterEntity)
	{
		namespace.BaseDataModel.call(this, gridFilterEntity);
	}

	namespace.GridFilterDataModel.prototype = Object.create(namespace.BaseDataModel.prototype);

	namespace.GridFilterDataModel.prototype.constructor = namespace.GridFilterDataModel;

	namespace.GridFilterDataModel.prototype.mapping = [
		{ from: "Comments", default: "" },
		{ from: "IsForQuickSearch", default: false },
		{ from: "Id", default: 0, required: true },
		{ from: "Name", default: "" },
		{ from: "DataTypeID", default: 0 },
		{ from: "DataType", default: null },
		{ from: "GridType", default: "" },
		{ from: "WhereClause", default: "" },
		{ from: "IsValid", default: 1 },
		{ from: "Type", default: 1 },
		{ from: "OmittedRecord", default: [] },
		{ from: "Reminders", default: [] },
		{ from: "ReminderName", default: 0 },
		{ from: "ReminderId", default: 0 },
		{ from: "ReminderUserId", default: 0 },
		{ from: "DBID", default: null }
	];
})();
