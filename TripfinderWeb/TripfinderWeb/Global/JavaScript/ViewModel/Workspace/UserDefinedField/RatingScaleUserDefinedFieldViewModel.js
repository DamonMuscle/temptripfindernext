(function()
{
	createNamespace("TF.UserDefinedField").RatingScaleUserDefinedFieldViewModel = RatingScaleUserDefinedFieldViewModel;

	function RatingScaleUserDefinedFieldViewModel(options)
	{
		this.obIsEnable = ko.observable(true);
		var self = this;
		self.isEdit = options.dataEntity != null;
		self.dataEntity = options.dataEntity;
		self.SCALES = [3, 4, 5, 6, 7, 8, 9, 10];
		self.obScaleSource = ko.observableArray(self.SCALES);
		self.obSelectedScale = ko.observable(null);
		//self.obSelectedScale.subscribe(self.onScale)

		this.obLeftSideRatingLabel = ko.observable(null);
		this.obRightSideRatingLabel = ko.observable(null);
		this.obComponentLoaded = ko.observable(false);
	}

	RatingScaleUserDefinedFieldViewModel.prototype.constructor = RatingScaleUserDefinedFieldViewModel;

	RatingScaleUserDefinedFieldViewModel.prototype.init = function(vm, e)
	{
		this.$parent = $(e).closest(".Edit-UDF-Modal");
		this.obComponentLoaded(true);
	};

	RatingScaleUserDefinedFieldViewModel.prototype.getTemplate = function()
	{
		return "modal/userDefinedField/RatingScaleEditor";
	};

	RatingScaleUserDefinedFieldViewModel.prototype.getDefaultValueTemplate = function()
	{
		return null;
		//Commended for backup:"<div><!-- ko customInput:{type:'Integer',value:obDefaultValue,attributes:{class:'form-control',maxlength:'2', name:'defaultValue',tabindex:'4'}} --><!-- /ko --></div>";
	};

	RatingScaleUserDefinedFieldViewModel.prototype.updateDefaultValue = function(entity, defaultValue)
	{
		entity["DefaultRatingScale"] = defaultValue;
	};

	RatingScaleUserDefinedFieldViewModel.prototype.getDefaultValue = function(entity)
	{
		return entity["DefaultRatingScale"];
	};

	RatingScaleUserDefinedFieldViewModel.prototype.saveSpecialValue = function(entity)
	{
		entity["LeftSideRatingLabel"] = this.obLeftSideRatingLabel();
		entity["RightSideRatingLabel"] = this.obRightSideRatingLabel();
		entity["Scale"] = this.obSelectedScale();
	};

	RatingScaleUserDefinedFieldViewModel.prototype.updateSpecialValue = function(entity)
	{
		if (!entity) return;
		this.obLeftSideRatingLabel(entity.LeftSideRatingLabel);
		this.obRightSideRatingLabel(entity.RightSideRatingLabel);
		this.obSelectedScale(entity.Scale);
	};

	RatingScaleUserDefinedFieldViewModel.prototype.extendValidatorFields = function(validatorFields, $container)
	{
		if (!validatorFields || !$container)
		{
			return;
		}

		validatorFields.scale = {
			trigger: "blur change",
			container: $container.find("input[name='scale']").closest("div").parents()[1],
			validators: {
				notEmpty: {
					message: 'Scale is required'
				}
			}
		};

		validatorFields.leftSideRatingLabel = {
			trigger: "blur change",
			container: $container.find("input[name='leftSideRatingLabel']").closest("div"),
			validators: {
				notEmpty: {
					message: 'Left Side Rating Label is required'
				}
			}
		};

		validatorFields.rightSideRatingLabel = {
			trigger: "blur change",
			container: $container.find("input[name='rightSideRatingLabel']").closest("div"),
			validators: {
				notEmpty: {
					message: 'Right Side Rating Label is required'
				}
			}
		};
	};
})();