(function()
{
	createNamespace("TF.Control").SingleInputViewModel = SingleInputViewModel;

	var DEFAULT_MAX_LENGTH = 100;
	var DEFAULT_MAX_TEXT_LINES = 10;
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
		self.maxTextLines = options.maxTextLines || DEFAULT_MAX_TEXT_LINES;
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
		this.getInputElement().on("focus input", function()
		{
			this.getErrorInfoElement().text("");
		}.bind(this));
		this.initAutoHeight();
	};

	SingleInputViewModel.prototype.initAutoHeight = function()
	{
		const self = this;
		const $textArea = this.getInputElement();
		if (!self.options.autoHeight || !$textArea.length || $textArea[0].type !== 'textarea')
		{
			return;
		}

		const $hiddenDiv = $("<div/>");
		$hiddenDiv.css({
			'position': 'absolute',
			'top': '-10000px',
			'left': '-10000px',
			'display': 'none',
			'white-space': 'pre-wrap',
			'word-break': 'break-word',
			'visibility': 'visible',
			'display': 'block',
		});
		$hiddenDiv.width($textArea.width());
		$textArea.after($hiddenDiv);

		$hiddenDiv[0].innerText = " ";
		const lineHeight = $hiddenDiv.height() || 20;

		$hiddenDiv.css({
			'visibility': 'hidden',
			'display': 'none',
		});

		const autoHeight = (content) =>
		{
			let text = content || " "; // atleast display one char
			if (text.endsWith("\n"))
			{
				text += " "; // add one char if the last line is empty
			}

			$hiddenDiv[0].innerText = text;
			$hiddenDiv.css({
				'visibility': 'visible',
				'display': 'block',
			});
			$textArea.height(Math.min($hiddenDiv.height(), self.maxTextLines * lineHeight));
			$hiddenDiv.css({
				'visibility': 'hidden',
				'display': 'none',
			});
		};

		autoHeight(self.obText());
		$textArea.on('input change', () =>
		{
			autoHeight($textArea.val());
		});
	}

	SingleInputViewModel.prototype.getInputElement = function()
	{
		return this.$element.find("input");
	}

	SingleInputViewModel.prototype.getErrorInfoElement = function()
	{
		return this.$element.find(".error-info");
	}

	SingleInputViewModel.prototype.check = function()
	{
		var self = this;

		var hasDuplicate = self.existingItems.some(function(item)
		{
			if (self.options.ignoreCaseWhenDetermineUnique)
			{
				return (item || "").toLowerCase() === (self.getText() || "").toLowerCase();
			}
			else
			{
				return item === self.getText();
			}
		});

		return hasDuplicate ? ERROR_MSG["UNIQUE"] : null;
	}

	SingleInputViewModel.prototype.save = function()
	{
		var self = this, errMsg = null,
			text = self.getText();

		if (!text)
		{
			errMsg = ERROR_MSG["REQUIRED"];
		}
		else
		{
			errMsg = self.check();
		}

		if (errMsg)
		{
			self.pageLevelViewModel.clearError();
			self.getErrorInfoElement().text(errMsg.inline);
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
		this.getInputElement().off();
		this.pageLevelViewModel.dispose();
	};
})();