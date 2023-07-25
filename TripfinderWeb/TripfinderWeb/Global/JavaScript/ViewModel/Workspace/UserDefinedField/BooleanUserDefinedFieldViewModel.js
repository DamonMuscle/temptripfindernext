(function()
{
	createNamespace("TF.UserDefinedField").BooleanUserDefinedFieldViewModel = BooleanUserDefinedFieldViewModel;

	function BooleanUserDefinedFieldViewModel()
	{
		this.obIsEnable = ko.observable(true);
		this.obTrueDisplay = ko.observable(null);
		this.obFalseDisplay = ko.observable(null);
	};

	BooleanUserDefinedFieldViewModel.prototype.constructor = BooleanUserDefinedFieldViewModel;

	BooleanUserDefinedFieldViewModel.prototype.getTemplate = function()
	{
		return "modal/userdefinedfield/BooleanUserDefinedField";
	};

	BooleanUserDefinedFieldViewModel.prototype.getDefaultValueTemplate = function()
	{
		return "<div class=\"input-group\" tabindex=\"4\">\
					<div data-bind=\"typeahead:{source:obDefaultValueSource,drowDownShow:true,notSort:true,selectedValue:obDefaultValue}\">\
						<!-- ko customInput:{type:\"Select\",value:obDefaultValue,attributes:{class:\"form-control\",name:\"defaultValue\"}} --><!-- /ko -->\
					</div>\
					<div class=\"input-group-btn\">\
						<button type=\"button\" class=\"btn btn-default btn-sharp\">\
							<span class=\"caret\"></span>\
						</button>\
					</div>\
				</div>";
	};

	BooleanUserDefinedFieldViewModel.prototype.getDefaultValueSource = function()
	{
		return ["(None)", "True", "False"];
	};

	BooleanUserDefinedFieldViewModel.prototype.getDefaultValue = function(entity)
	{
		var defaultBoolean = entity["DefaultBoolean"];

		if (defaultBoolean == null) return "(None)";

		return defaultBoolean ? "True" : "False";
	};

	BooleanUserDefinedFieldViewModel.prototype.updateDefaultValue = function(entity, defaultValue)
	{
		entity["DefaultBoolean"] = defaultValue == null || defaultValue === "(None)" ? null : (defaultValue === "True" ? true : false);
	};

	BooleanUserDefinedFieldViewModel.prototype.saveSpecialValue = function(entity)
	{
		entity["TrueDisplayName"] = this.obTrueDisplay();
		entity["FalseDisplayName"] = this.obFalseDisplay();
	};

	BooleanUserDefinedFieldViewModel.prototype.updateSpecialValue = function(entity)
	{
		if (!entity) return;
		this.obTrueDisplay(entity.TrueDisplayName);
		this.obFalseDisplay(entity.FalseDisplayName);
	};
})();