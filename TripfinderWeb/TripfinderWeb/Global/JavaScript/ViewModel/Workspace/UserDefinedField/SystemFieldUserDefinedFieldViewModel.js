(function()
{
	createNamespace("TF.UserDefinedField").SystemFieldUserDefinedFieldViewModel = SystemFieldUserDefinedFieldViewModel;

	function SystemFieldUserDefinedFieldViewModel(options)
	{
		this.entity = null;
		this.obShowReuqired = false;
		this.obTypeModalData = ko.observable(null);
		this.obMaxLength = ko.observable(null);
		this.obIsEnable = ko.observable(false);
		this.obSaveValueWithForm = ko.observable(false);
		this.obIsDisabled = ko.observable(options.isEdit);

		this.gridType = options.gridType;
		this.gridDefinition = options.gridDefinition;
		this.obSelectedFieldText = ko.observable();
		this.obSelectedField = ko.observable();

		this.obGridDefinitionColumns = ko.observableArray();
		this.initSelecetedFieldDropDownList();
	};

	SystemFieldUserDefinedFieldViewModel.prototype.constructor = SystemFieldUserDefinedFieldViewModel;

	SystemFieldUserDefinedFieldViewModel.prototype.init = function(vm, e)
	{
		this.$parent = $(e).closest(".Edit-UDF-Modal");
	};

	SystemFieldUserDefinedFieldViewModel.prototype.getTemplate = function()
	{
		return "modal/userdefinedfield/SystemFieldUserDefinedField";
	};

	SystemFieldUserDefinedFieldViewModel.prototype.getDefaultValueTemplate = function()
	{
		return "<div><!-- ko customInput:{type:'String',value:obDefaultValue,disable:isSystemDefined,attributes:{name:'defaultValue',class:'form-control',maxlength:'200',tabindex:'4'}} --><!-- /ko --></div>";
	};

	SystemFieldUserDefinedFieldViewModel.prototype.updateDefaultValue = function(entity, defaultValue)
	{
		entity["DefaultText"] = this.obSelectedField().Guid || this.obSelectedField().FieldName;
		entity["IsUDFSystemField"] = !!this.obSelectedField().Guid;
		entity["SystemFieldFormat"] = this.obSelectedField().format;
		entity["SystemFieldType"] = this.obSelectedField().type || this.obSelectedField().Type;
		entity["SaveValueWithForm"] = this.obSaveValueWithForm();
		if (this.obSelectedField().hasOwnProperty("AttributeFlag"))
		{
			entity["AttributeFlag"] = this.obSelectedField().AttributeFlag;
		}
	};

	SystemFieldUserDefinedFieldViewModel.prototype.getDefaultValue = function(entity)
	{
		return entity["DefaultText"];
	};

	SystemFieldUserDefinedFieldViewModel.prototype.isRequiredFieldVisable = function()
	{
		return false;
	};

	SystemFieldUserDefinedFieldViewModel.prototype.updateSpecialValue = function(entity)
	{
		if (!entity) return;
		this.entity = entity;
		this.obSaveValueWithForm(!!entity.SaveValueWithForm);
	};

	SystemFieldUserDefinedFieldViewModel.prototype.initSelecetedFieldDropDownList = function()
	{
		let self = this;
		tf.UDFDefinition.RetrieveByType(self.gridType).then(function(response)
		{
			let udfData = [];
			if (response.Items)
			{
				udfData = response.Items;
			};

			let gridColumnData = TF.Grid.FilterHelper.getGridDefinitionByType(self.gridType);
			let allColumns = gridColumnData.Columns.concat(gridColumnData.InvisibleUDFColumns).slice(0);

			let tmpColumns = TF.Helper.KendoListMoverHelper.removeOnlyForFilterColumn(allColumns);
			tmpColumns = excludeSpecialColumn(tmpColumns);
			tmpColumns = tmpColumns.concat(udfData);
			fillDisplayName(tmpColumns);
			tmpColumns = sortColumns(tmpColumns);
			self.obGridDefinitionColumns(tmpColumns);

			if (self.entity)
			{
				self.obGridDefinitionColumns().forEach((item) =>
				{
					if (self.entity.DefaultText === item.FieldName || self.entity.DefaultText === item.Guid)
					{
						self.obSelectedField(item);
						self.obSelectedFieldText(item.DisplayName);
					}
				});
			}
			else
			{
				let item = self.obGridDefinitionColumns()[0];
				self.obSelectedField(item);
				self.obSelectedFieldText(item.DisplayName);
			}
		});

		function excludeSpecialColumn(tmpColumns)
		{
			return tmpColumns.filter((column) =>
			{
				return column.FieldName !== 'Id' && !column.UDFGuid;
			});
		}

		function fillDisplayName(tmpColumns)
		{
			tmpColumns.forEach((c) =>
			{
				if (!c.DisplayName)
				{
					c.DisplayName = c.FieldName;
				}
			});
		}

		function sortColumns(columns)
		{
			return columns.sort(function(firstCol, secondCol)
			{
				let left = firstCol.DisplayName || '';
				let right = secondCol.DisplayName || '';
				return left.localeCompare(right);
			});
		};
	};
})();