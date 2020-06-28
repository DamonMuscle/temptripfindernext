(function()
{
	createNamespace("TF.Control").SingleInputViewModel = SingleInputViewModel;

	var DEFAULT_MAX_LENGTH = 100;
	var ERROR_MSG = {
		UNIQUE: {
			inline: "must be unique",
			pageLevel: " must be unique"
		},
		REQUIRED: {
			inline: "required",
			pageLevel: " is required"
		}
	};

	function SingleInputViewModel(options)
	{
		var self = this;
		self.options = options;
		self.field = options.field;
		self.text = options.text;
		self.maxLength = options.maxLength || DEFAULT_MAX_LENGTH;
		self.obText = ko.observable(self.text);

		self.pageLevelViewModel = new TF.PageLevel.BasePageLevelViewModel();

		var existingItems = options.existingItems || [];
		if (options.text)
		{
			existingItems = existingItems.filter(function(item)
			{
				return item != options.text;
			});
		}
		self.existingItems = existingItems;
	}

	SingleInputViewModel.prototype.init = function(viewModel, element)
	{
		this.$element = $(element);
		this.$element.find("input").on("focus input", function()
		{
			this.$element.find(".error-info").remove();
		}.bind(this));
	};

	SingleInputViewModel.prototype.check = function()
	{
		var self = this;

		return self.existingItems.every(function(item)
		{
			if (self.options.ignoreCaseWhenDetermineUnique)
			{
				return (item || "").toLowerCase() !== (self.getText() || "").toLowerCase();
			}
			else
			{
				return item !== self.getText();
			}
		});
	}

	SingleInputViewModel.prototype.save = function()
	{
		var self = this, errMsg = null,
			text = self.getText();

		if (!text)
		{
			errMsg = ERROR_MSG["REQUIRED"];
		}
		else if (!self.check()) 
		{
			errMsg = ERROR_MSG["UNIQUE"];
		}

		if (errMsg)
		{
			self.$element.find(".error-info").remove();

			$(String.format("<label class=\"error-info\" style=\"color:#ff0000;font-size:11px;\">{0}</label>", errMsg.inline)).insertAfter(self.$element.find("input"));

			self.pageLevelViewModel.popupErrorMessage(self.field + errMsg.pageLevel);

			return Promise.resolve(false);
		}

		return Promise.resolve(text);
	};

	SingleInputViewModel.prototype.getText = function()
	{
		return (this.obText() || "").trim();
	}

	SingleInputViewModel.prototype.dispose = function()
	{
		this.obText = null;
		this.$element.find("input").off();
		this.pageLevelViewModel.dispose();
	};
})();