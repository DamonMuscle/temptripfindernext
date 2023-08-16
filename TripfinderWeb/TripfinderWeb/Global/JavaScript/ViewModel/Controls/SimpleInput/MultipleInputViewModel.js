(function()
{
	createNamespace("TF.Control").MultipleInputViewModel = MultipleInputViewModel;

	var ERROR_MSG = {
		DUPLICATE: {
			inline: "duplicate item",
			pageLevel: " has duplicate item"
		},
		DUPLICATE_WITH_EXISTING: {
			inline: "there is a duplicate item within existing lines",
			pageLevel: " has a duplicate item within existing lines"
		},
		MAXLENGTH: {
			inline: "line should not be greater than {0} characters",
			pageLevel: " line should not be greater than {0} characters"
		}
	};

	function MultipleInputViewModel(options)
	{
		TF.Control.SingleInputViewModel.call(this, options);
	}
	MultipleInputViewModel.prototype = Object.create(TF.Control.SingleInputViewModel.prototype);
	MultipleInputViewModel.prototype.constructor = MultipleInputViewModel;

	MultipleInputViewModel.prototype.getInputElement = function()
	{
		return this.$element.find("textarea");
	}

	MultipleInputViewModel.prototype.getText = function()
	{
		var text = (this.obText() || "").trim();
		var items = text.split("\n").map(t => t.trim()).filter(t => t.length > 0);
		return items.join("\n");
	}

	MultipleInputViewModel.prototype.check = function()
	{
		var self = this,
			text = self.getText();

		var items = text.split("\n");
		var exceedMaxLength = items.some(t => t.length > self.maxLength);
		if (exceedMaxLength)
		{
			return {
				inline: String.format(ERROR_MSG["MAXLENGTH"].inline, self.maxLength),
				pageLevel: String.format(ERROR_MSG["MAXLENGTH"].pageLevel, self.maxLength)
			};
		}

		if (self.hasDuplicateInArray(items))
		{
			return ERROR_MSG["DUPLICATE_WITH_EXISTING"];
		}

		if (self.hasDuplicateBetweenArrays(items, self.existingItems) || self.hasDuplicateInArray(self.existingItems))
		{
			return ERROR_MSG["DUPLICATE"];
		}

		return null;
	};

	MultipleInputViewModel.prototype.hasDuplicateInArray= function(items)
	{
		var ignoreCase = this.options.ignoreCaseWhenDetermineUnique;
		var temp = [];
		return items.some(t => {
			t = t || "";
			if (ignoreCase)
			{
				t = (t || "").toLowerCase();
			}

			if (temp.indexOf(t) !== -1)
			{
				return true;
			}

			temp.push(t);
			return false;
		});
	};

	MultipleInputViewModel.prototype.hasDuplicateBetweenArrays = function(items1, items2)
	{
		if (this.options.ignoreCaseWhenDetermineUnique)
		{
			items1 = items1.map( t => (t || "").toLowerCase());
			items2 = items2.map( t => (t || "").toLowerCase());
		}

		return items1.some(t => items2.indexOf(t || "") !== -1);
	}
})();
