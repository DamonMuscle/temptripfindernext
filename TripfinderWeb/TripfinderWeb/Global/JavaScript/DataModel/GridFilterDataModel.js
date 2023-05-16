(function()
{
	var namespace = window.createNamespace("TF.DataModel");
	namespace.GridFilterDataModel = function(gridFilterEntity)
	{
		namespace.BaseDataModel.call(this, gridFilterEntity);
		this.autoExportNames = ko.computed(function()
		{
			const autoExports = this.autoExports();
			if (!autoExports || !autoExports.length)
			{
				return "";
			}

			var names = autoExports.map(e => e.Name);
			if (names.length === 1)
			{
				return names[0];
			}

			var lastOne = names.pop();
			return `${names.join(", ")} and ${lastOne}`;
		}, this);
		this.reminderExists = ko.computed(function()
		{
			var reminders = this.reminders();
			return reminders && reminders.length > 0;
		}, this);
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
		{ from: "OmittedRecords", default: [] },
		{ from: "Reminders", default: [] },
		{ from: "ReminderName", default: 0 },
		{ from: "ReminderId", default: 0 },
		{ from: "ReminderUserId", default: 0 },
		{ from: "DBID", default: null },
		{ from: "IsStatic", default: null },
		{ from: "IsSystem", default: 0 },
		{ from: "UDGridId", default: null },
		{ from: "AutoExportExists", default: false },
		{ from: "AutoExports", default: [] },
	];
})();
