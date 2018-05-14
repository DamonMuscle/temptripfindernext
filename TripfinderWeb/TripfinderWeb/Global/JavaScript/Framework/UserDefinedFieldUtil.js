(function()
{
	createNamespace("TF").UserDefinedFieldUtil = UserDefinedFieldUtil;

	//UserDefinedFieldUtil.USER_DEFINED_FIELDS_COLUMN_LABELS = {
	//	0: "User_Char1", 1: "User_Char2", 2: "User_Char3", 3: "User_Char4",
	//	4: "User_Num1", 5: "User_Num2", 6: "User_Num3", 7: "User_Num4",
	//	8: "User_Date1", 9: "User_Date2", 10: "User_Date3", 11: "User_Date4",
	//	12: "User_Char5", 13: "User_Char6", 14: "User_Char7", 15: "User_Char8",
	//	16: "User_Date5", 17: "User_Date6", 18: "User_Date7", 19: "User_Date8"
	//}

	UserDefinedFieldUtil.USER_DEFINED_FIELDS_COLUMN_LABELS = {
		0: { DisplayLabel: "User_Char1", Status: true }, 1: { DisplayLabel: "User_Char2", Status: true }, 2: { DisplayLabel: "User_Char3", Status: true }, 3: { DisplayLabel: "User_Char4", Status: true },
		4: { DisplayLabel: "User_Num1", Status: true }, 5: { DisplayLabel: "User_Num2", Status: true }, 6: { DisplayLabel: "User_Num3", Status: true }, 7: { DisplayLabel: "User_Num4", Status: true },
		8: { DisplayLabel: "User_Date1", Status: true }, 9: { DisplayLabel: "User_Date2", Status: true }, 10: { DisplayLabel: "User_Date3", Status: true }, 11: { DisplayLabel: "User_Date4", Status: true },
		12: { DisplayLabel: "User_Char5", Status: true }, 13: { DisplayLabel: "User_Char6", Status: true }, 14: { DisplayLabel: "User_Char7", Status: true }, 15: { DisplayLabel: "User_Char8", Status: true },
		16: { DisplayLabel: "User_Date5", Status: true }, 17: { DisplayLabel: "User_Date6", Status: true }, 18: { DisplayLabel: "User_Date7", Status: true }, 19: { DisplayLabel: "User_Date8", Status: true }
	}

	UserDefinedFieldUtil.USER_DEFINED_FIELDS_COLUMN_ENTITY_NAMES = {
		0: "userChar1", 1: "userChar2", 2: "userChar3", 3: "userChar4",
		4: "userNum1", 5: "userNum2", 6: "userNum3", 7: "userNum4",
		8: "userDate1", 9: "userDate2", 10: "userDate3", 11: "userDate4",
		12: "userChar5", 13: "userChar6", 14: "userChar7", 15: "userChar8",
		16: "userDate5", 17: "userDate6", 18: "userDate7", 19: "userDate8"
	}

	//Object.defineProperty(
	//	UserDefinedFieldUtil, "USER_DEFINED_FIELDS_COLUMN_LABELS",
	//	{
	//		varlue: {
	//			0: "User_Char1", 1: "User_Char2", 2: "User_Char3", 3: "User_Char4",
	//			4: "User_Num1", 5: "User_Num2", 6: "User_Num3", 7: "User_Num4",
	//			8: "User_Date1", 9: "User_Date2", 10: "User_Date3", 11: "User_Date4",
	//			12: "User_Char5", 13: "User_Char6", 14: "User_Char7", 15: "User_Char8",
	//			16: "User_Date5", 17: "User_Date6", 18: "User_Date7", 19: "User_Date8"
	//		},
	//		writable: false
	//	});

	UserDefinedFieldUtil.USER_DEFINED_FIELDS_COLUMN_INFO = [
		{ FieldTypeID: 0, FieldLabel: "User Defined Char 1", FieldType: "Character", DisplayLabel: "User_Char1", Status: true },
		{ FieldTypeID: 1, FieldLabel: "User Defined Char 2", FieldType: "Character", DisplayLabel: "User_Char2", Status: true },
		{ FieldTypeID: 2, FieldLabel: "User Defined Char 3", FieldType: "Character", DisplayLabel: "User_Char3", Status: true },
		{ FieldTypeID: 3, FieldLabel: "User Defined Char 4", FieldType: "Character", DisplayLabel: "User_Char4", Status: true },
		{ FieldTypeID: 4, FieldLabel: "User Defined Num 1", FieldType: "Number", DisplayLabel: "User_Num1", Status: true },
		{ FieldTypeID: 5, FieldLabel: "User Defined Num 2", FieldType: "Number", DisplayLabel: "User_Num2", Status: true },
		{ FieldTypeID: 6, FieldLabel: "User Defined Num 3", FieldType: "Number", DisplayLabel: "User_Num3", Status: true },
		{ FieldTypeID: 7, FieldLabel: "User Defined Num 4", FieldType: "Number", DisplayLabel: "User_Num4", Status: true },
		{ FieldTypeID: 8, FieldLabel: "User Defined Date 1", FieldType: "Date", DisplayLabel: "User_Date1", Status: true },
		{ FieldTypeID: 9, FieldLabel: "User Defined Date 2", FieldType: "Date", DisplayLabel: "User_Date2", Status: true },
		{ FieldTypeID: 10, FieldLabel: "User Defined Date 3", FieldType: "Date", DisplayLabel: "User_Date3", Status: true },
		{ FieldTypeID: 11, FieldLabel: "User Defined Date 4", FieldType: "Date", DisplayLabel: "User_Date4", Status: true },
		{ FieldTypeID: 12, FieldLabel: "User Defined Char 5", FieldType: "Character", DisplayLabel: "User_Char5", Status: true },
		{ FieldTypeID: 13, FieldLabel: "User Defined Char 6", FieldType: "Character", DisplayLabel: "User_Char6", Status: true },
		{ FieldTypeID: 14, FieldLabel: "User Defined Char 7", FieldType: "Character", DisplayLabel: "User_Char7", Status: true },
		{ FieldTypeID: 15, FieldLabel: "User Defined Char 8", FieldType: "Character", DisplayLabel: "User_Char8", Status: true },
		{ FieldTypeID: 16, FieldLabel: "User Defined Date 5", FieldType: "Date", DisplayLabel: "User_Date5", Status: true },
		{ FieldTypeID: 17, FieldLabel: "User Defined Date 6", FieldType: "Date", DisplayLabel: "User_Date6", Status: true },
		{ FieldTypeID: 18, FieldLabel: "User Defined Date 7", FieldType: "Date", DisplayLabel: "User_Date7", Status: true },
		{ FieldTypeID: 19, FieldLabel: "User Defined Date 8", FieldType: "Date", DisplayLabel: "User_Date8", Status: true }
	]

	Object.defineProperty(
		UserDefinedFieldUtil, "USER_DEFINED_FIELDS_COLUMN_KEYS",
		{
			value: {
				"User_Char1": 0, "User_Char2": 1, "User_Char3": 2, "User_Char4": 3,
				"User_Num1": 4, "User_Num2": 5, "User_Num3": 6, "User_Num4": 7,
				"User_Date1": 8, "User_Date2": 9, "User_Date3": 10, "User_Date4": 11,
				"User_Char5": 12, "User_Char6": 13, "User_Char7": 14, "User_Char8": 15,
				"User_Date5": 16, "User_Date6": 17, "User_Date7": 18, "User_Date8": 19,
			},
			writable: false
		});

	Object.defineProperty(
		UserDefinedFieldUtil, "USER_DEFINED_FIELDS_DBNAME_KEYS",
		{
			value: {
				"user_char1": 0, "user_char2": 1, "user_char3": 2, "user_char4": 3,
				"user_num1": 4, "user_num2": 5, "user_num3": 6, "user_num4": 7,
				"user_date1": 8, "user_date2": 9, "user_date3": 10, "user_date4": 11,
				"user_char5": 12, "user_char6": 13, "user_char7": 14, "user_char8": 15,
				"user_date5": 16, "user_date6": 17, "user_date7": 18, "user_date8": 19,
			},
			writable: false
		});

	Object.defineProperty(
		UserDefinedFieldUtil, "USER_DEFINED_FIELDS_COLUMN_NAMES",
		{
			value: [
				"userChar1", "userChar2", "userChar3", "userChar4",
				"userNum1", "userNum2", "userNum3", "userNum4",
				"userDate1", "userDate2", "userDate3", "userDate4",
				 "userChar5", "userChar6", "userChar7", "userChar8",
				 "userDate5", "userDate6", "userDate7", "userDate8"],
			writable: false
		});

	function UserDefinedFieldUtil(gridType)
	{
		this._userDefinedLabels = null;
		this._gridType = gridType;
	}

	UserDefinedFieldUtil.prototype.loadUserDefinedLabel = function(type)
	{
		var gridType = type ? type : this._gridType;
		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "userdefinedlabel", gridType))
		.then(function(apiResponse)
		{
			this._userDefinedLabels = apiResponse.Items[0];
		}.bind(this))
		.catch(function(apiResponse)
		{
			
		});
	};

	UserDefinedFieldUtil.prototype.mergeUserDefinedLabel = function(columns, option)
	{
		if (this._userDefinedLabels === null)
		{
			$.each(columns, function(index, column)
			{
				column.Status = true;
			}.bind(this));
			return columns;
		}

		var option = option || {};

		if (option.mergeByColumnName)
		{
			$.each(columns, function(columns, index, columnName)
			{
				var columnKey = UserDefinedFieldUtil.USER_DEFINED_FIELDS_COLUMN_KEYS[columnName];
				if (columnKey !== undefined && this._userDefinedLabels[columnKey] != undefined)
				{
					columns[index] = this._userDefinedLabels[columnKey].DisplayLabel;
					columns[index].Status = this._userDefinedLabels[columnKey].Status;
				}
				else
				{
					columns[index].Status = true;
				}
			}.bind(this, columns));
		}
		else
		{
			$.each(columns, function(index, column)
			{
				var columnKey = UserDefinedFieldUtil.USER_DEFINED_FIELDS_COLUMN_KEYS[column.DisplayName];
				if (columnKey === undefined && column.DBName !== undefined)
					columnKey = UserDefinedFieldUtil.USER_DEFINED_FIELDS_DBNAME_KEYS[column.DBName];

				if (columnKey !== undefined && this._userDefinedLabels[columnKey] != undefined)
				{
					column.DisplayName = this._userDefinedLabels[columnKey].DisplayLabel;
					column.Status = this._userDefinedLabels[columnKey].Status;
				}
				else
				{
					column.Status = true;
				}
			}.bind(this));
		}

		return columns;
	};
})();
