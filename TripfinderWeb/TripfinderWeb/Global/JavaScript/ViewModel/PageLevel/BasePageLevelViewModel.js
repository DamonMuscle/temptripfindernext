(function()
{
	createNamespace('TF.PageLevel').BasePageLevelViewModel = BasePageLevelViewModel;

	function BasePageLevelViewModel()
	{
		var self = this;
		self._validator = null;

		self.defaultSuccessMessage = "This record has been successfully saved.";

		self.obErrorMessageDivIsShow = ko.observable(false);
		self.obSuccessMessageDivIsShow = ko.observable(false);
		self.obValidationErrors = ko.observableArray([]);
		self.obValidationErrorsSpecifed = ko.observableArray([]);
		self.obErrorMessageTitle = ko.observable("Error Occurred");
		self.obErrorMessageDescription = ko.observable("The following error occurred.");
		self.obSuccessMessage = ko.observable(self.defaultSuccessMessage);
		self.obPageLevelCss = ko.observable("");

		self.obSuccessMessageSpecifedDivIsShow = ko.observable(false);
		self.obSuccessMessageSpecifed = ko.observableArray([]);
		self.validationMessage = null;
		self.autoFocus = true;
	}

	BasePageLevelViewModel.prototype.constructor = BasePageLevelViewModel;

	BasePageLevelViewModel.prototype.templateName = "workspace/pagelevel/base";

	BasePageLevelViewModel.prototype.load = function(validator)
	{
		this._validator = validator;
	}

	BasePageLevelViewModel.prototype.initialized = function(viewModel, el)
	{
		var self = this, $pageLevel = $(el);
		if ($pageLevel.closest(".tfmodal-container").length > 0)
		{
			self.validationMessage = $pageLevel.closest(".tfmodal-container").find(".page-level-message-container");
			self.validationMessage.css("z-index", $pageLevel.closest(".tfmodal.modal").css("z-index"));
			$("body").append(self.validationMessage);
		}

		self.$pageLevel = $pageLevel;
	}

	BasePageLevelViewModel.prototype.getErrorsCount = function()
	{
		var self = this;
		return self.obValidationErrors().length + self.obValidationErrorsSpecifed().length;
	};

	BasePageLevelViewModel.prototype.saveValidate = function($field)
	{
		var self = this;
		if (!self._validator) return Promise.resolve();
		if ($field)
		{
			var isContainingField = false;
			$.each(self.obValidationErrors().concat(self.obValidationErrorsSpecifed()), function(index, item)
			{
				if (item.field && $field[0] === item.field[0])
				{
					isContainingField = true;
					return Promise.resolve(false);
				}
			});
			if (!isContainingField)
			{
				return Promise.resolve();
			}
		}
		self.obValidationErrors.removeAll();
		self.obErrorMessageDivIsShow(false);
		self.obSuccessMessageDivIsShow(false);
		return self._validator.validate()
			.then(function(valid)
			{
				self.obValidationErrors(self.getValidationErrors(valid));
				self.obValidationErrorsSpecifed(self.getValidationErrorsSpecifed());
				return self.getValidationErrorsSpecifedPromise()
					.then(function()
					{
						var errorLength = self.obValidationErrors().length + self.obValidationErrorsSpecifed().length;
						if (errorLength >= 1)
						{
							self.obSuccessMessageDivIsShow(false);
							self.obErrorMessageTitle("Error Occurred");
							self.obErrorMessageDescription("The following " + (errorLength > 1 ? "errors" : "error") + " occurred.");
							self.obErrorMessageDivIsShow(true);
							return false;
						}
						else
						{
							return true;
						}
					});
			});
	};

	BasePageLevelViewModel.prototype.saveValidateExtend = function($field)
	{
		var self = this;
		if (!self._validator) return Promise.resolve();
		if ($field)
		{
			var isContainingField = false;
			$.each(self.obValidationErrors().concat(self.obValidationErrorsSpecifed()), function(index, item)
			{
				if (item.field && $field[0] === item.field[0])
				{
					isContainingField = true;
					return Promise.resolve(false);
				}
			});
			if (!isContainingField)
			{
				return Promise.resolve();
			}
		}

		self.obSuccessMessageDivIsShow(false);
		return self._validator.validate()
			.then(function(valid)
			{
				self.obValidationErrors(self.getValidationErrors(valid));
				self.obValidationErrorsSpecifed(self.getValidationErrorsSpecifed());
				return self.getValidationErrorsSpecifedPromise()
					.then(function()
					{
						var errorLength = self.obValidationErrors().length + self.obValidationErrorsSpecifed().length;
						if (errorLength >= 1)
						{
							self.obSuccessMessageDivIsShow(false);
							self.obErrorMessageTitle("Error Occurred");
							self.obErrorMessageDescription("The following " + (errorLength > 1 ? "errors" : "error") + " occurred.");
							self.obErrorMessageDivIsShow(true);
							return false;
						}
						else
						{
							self.obErrorMessageDivIsShow(false);
							return true;
						}
					});
			})
			.catch(function()
			{
				self.obValidationErrors.removeAll();
				self.obErrorMessageDivIsShow(false);
			});
	};

	BasePageLevelViewModel.prototype.clearError = function()
	{
		var self = this;
		self.obValidationErrors.removeAll();
		self.obErrorMessageDivIsShow(false);
		self.obSuccessMessageDivIsShow(false);
	};

	BasePageLevelViewModel.prototype.popupErrorMessage = function(errorMessage)
	{
		var self = this;
		self.obValidationErrors.removeAll();
		self.obErrorMessageDivIsShow(false);
		self.obSuccessMessageDivIsShow(false);

		self.obValidationErrorsSpecifed.push({ message: errorMessage });
		return self.getValidationErrorsSpecifedPromise()
			.then(function()
			{
				var errorLength = self.obValidationErrors().length + self.obValidationErrorsSpecifed().length;
				if (errorLength >= 1)
				{
					self.obErrorMessageTitle("Error Occurred");
					self.obErrorMessageDescription("The following " + (errorLength > 1 ? "errors" : "error") + " occurred.");
					self.obErrorMessageDivIsShow(true);
					return false;
				}
				else
				{
					return true;
				}
			});
	};

	BasePageLevelViewModel.prototype.updateErrorMessages = function(messages)
	{
		var self = this;
		self.obValidationErrors.removeAll();
		self.obErrorMessageDivIsShow(false);
		self.obSuccessMessageDivIsShow(false);

		self.obValidationErrorsSpecifed(messages.map(function(msg) { return { message: msg } }));
		return self.getValidationErrorsSpecifedPromise()
			.then(function()
			{
				var errorLength = self.obValidationErrors().length + self.obValidationErrorsSpecifed().length;
				if (errorLength >= 1)
				{
					self.obErrorMessageTitle("Error Occurred");
					self.obErrorMessageDescription("The following " + (errorLength > 1 ? "errors" : "error") + " occurred.");
					self.obErrorMessageDivIsShow(true);
					return false;
				}
				else
				{
					return true;
				}
			});
	};

	BasePageLevelViewModel.prototype.getValidationErrors = function(valid)
	{
		var self = this, validationErrors = [];
		if (!valid)
		{
			var messages = self._validator.getMessages(self._validator.getInvalidFields()),
				$fields = self._validator.getInvalidFields();
			$fields.each(function(i, fielddata)
			{
				if (i == 0)
				{
					if (self.autoFocus)
					{
						$(fielddata).focus();
					}
					if ($(fielddata).get(0).scrollIntoView)
						$(fielddata).get(0).scrollIntoView();
				}
				var error = { name: "", leftMessage: "", rightMessage: "", field: null },
					message = self.getMessage(messages[i]);
				message = self.getMessageExpand(fielddata, message, error);

				error.name = ($(fielddata).attr('data-bv-error-name') ? $(fielddata).attr('data-bv-error-name') : $($(fielddata).closest("div.form-group").find("label")[0]).text());
				error.rightMessage = message;
				error.field = $(fielddata);

				validationErrors.push(error);
			});
		}
		return validationErrors;
	}

	BasePageLevelViewModel.prototype.getValidationErrorsSpecifed = function()
	{
		var validationErrors = [];

		return validationErrors;
	}

	BasePageLevelViewModel.prototype.getValidationErrorsSpecifedPromise = function()
	{
		return Promise.resolve();
	}

	BasePageLevelViewModel.prototype.setValidationErrors = function(validationErrors, validationErrorsSpecifed)
	{
		var self = this;
		if (validationErrors && validationErrors.length > 0)
			self.obValidationErrors(validationErrors);
		if (validationErrorsSpecifed && validationErrorsSpecifed.length > 0)
			self.obValidationErrorsSpecifed(validationErrorsSpecifed);
		if (self.obValidationErrors().length + self.obValidationErrorsSpecifed().length > 0)
			self.obErrorMessageDivIsShow(true);
	}

	BasePageLevelViewModel.prototype.getMessage = function(message)
	{
		message = message.replace('&lt;', '<').replace('&gt;', '>');
		message = message.trim();
		switch (message)
		{
			case "required":
				message = " is required";
				break;
			case "invalid date":
				message = " is an invalid date";
				break;
			case "Invalid Syntax":
				message = " syntax is invalid";
				break;
			case "invalid Zip Code":
				message = " is an invalid Zip Code";
				break;
			case "invalid City Name":
				message = " is an invalid City Name";
				break;
			case "invalid email":
				message = " is not a valid email.";
				break;
			default:
				message = " " + message;
				break;
		}
		if (message.indexOf("must be <=") != -1)
		{
			message = message.replace("must be <=", "must be less than or equal to");
		}
		else if (message.indexOf("must be >=") != -1)
		{
			message = message.replace("must be >=", "must be greater than or equal to");
		}
		else if (message.indexOf("is not a valid email") != -1)
		{
			message = " is not a valid email.";
		}

		return message;
	}

	BasePageLevelViewModel.prototype.getMessageExpand = function(fielddata, messages, error)
	{
		if (fielddata.name == "mailToList" && messages.indexOf("emails are invalid") != -1)
		{
			error.leftMessage = (isNaN(messages.trim().split(" ")[0]) ? "Multiple" : messages.trim().split(" ")[0]) + " ";
			messages = " email addresses are invalid.";
		}
		return messages;
	}

	BasePageLevelViewModel.prototype.successMessageShow = function()
	{
		this.obSuccessMessageDivIsShow(true);
	}

	/**
	 * Display the page-level success message.
	 * @param {string} message The message to be displayed
	 * @param {number} duration After which the success message would disapper, 0 = no auto-close
	 * @return {void}
	 */
	BasePageLevelViewModel.prototype.popupSuccessMessage = function(message, duration)
	{
		var self = this,
			duration = $.isNumeric(duration) ? duration : 4000,
			message = message || self.defaultSuccessMessage;

		clearTimeout(self.autoCloseSuccessMsg);
		self.$pageLevel.find(".edit-success.single-success").stop().css("opacity", 1);
		self.obSuccessMessage(message);
		self.obSuccessMessageDivIsShow(true);

		self.autoCloseSuccessMsg = setTimeout(function()
		{
			self.closeSingleSuccessMessage(true);
		}, duration);
	};

	/**
	 * Close the single success message box.
	 * @param {boolean} fadeEffect Whether the success meessage should be closed with animation. 
	 */
	BasePageLevelViewModel.prototype.closeSingleSuccessMessage = function(fadeEffect)
	{
		var self = this;
		if (fadeEffect)
		{
			self.$pageLevel.find(".edit-success.single-success").fadeOut("slow", function()
			{
				self.obSuccessMessageDivIsShow(false);
			});
		}
		else
		{
			self.obSuccessMessageDivIsShow(false);
		}
	};

	BasePageLevelViewModel.prototype.closeMessageBox = function(viewModel, e)
	{
		var self = this,
			messageBox = $(e.target).parent();
		if (messageBox.hasClass("edit-success"))
		{
			self.obSuccessMessageDivIsShow(false);
		}
		else
		{
			self.isClosed = true;
			messageBox.remove();
		}
	}

	BasePageLevelViewModel.prototype.focusField = function(viewModel, e)
	{
		if (viewModel.field)
		{
			$(viewModel.field).focus();
		}
	}

	BasePageLevelViewModel.prototype.dispose = function()
	{
		var self = this;
		if (self.validationMessage && self.validationMessage.length > 0)
		{
			self.validationMessage.remove();
		}
	}
})();

