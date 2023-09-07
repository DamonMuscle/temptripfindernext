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
		self.obCurrentErrorIndex = ko.observable(0);

		self.obSuccessMessageArrayDivIsShow = ko.observable(false);
		self.obSuccessMessageArray = ko.observableArray([]);
		self.obWarningMessageArrayDivIsShow = ko.observable(false);
		self.obWarningMessageArray = ko.observableArray([]);
		self.toPreError = self.toPreError.bind(self);
		self.toNextError = self.toNextError.bind(self);
		self.validationMessage = null;
		self.autoFocus = true;

		self.closeMessageBox = self.closeMessageBox.bind(self);
	}

	BasePageLevelViewModel.prototype.constructor = BasePageLevelViewModel;

	BasePageLevelViewModel.prototype.templateName = "workspace/pagelevel/base";

	BasePageLevelViewModel.prototype.load = function(validator)
	{
		this._validator = validator;
	};

	BasePageLevelViewModel.prototype.initialized = function(viewModel, el)
	{
		var self = this, $pageLevel = $(el);
		if ($pageLevel.closest(".tfmodal-container").length > 0)
		{
			self.validationMessage = $pageLevel.closest(".tfmodal-container").find(".page-level-message-container");
			self.validationMessage.css("z-index", $pageLevel.closest(".tfmodal.modal").css("z-index"));
			$("body").append(self.validationMessage);
		}

		ko.computed(function()
		{
			var totalCount = self.obValidationErrors().length + self.obValidationErrorsSpecifed().length;
			if (totalCount > 0)
			{
				// wait for the dom in html is changed.
				setTimeout(function()
				{
					self.displayError();
				});
			}
		});

		self.$pageLevel = $pageLevel;
	};

	BasePageLevelViewModel.prototype.toPreError = function()
	{
		this.navigateError(false);
	};

	BasePageLevelViewModel.prototype.navigateError = function(toNext)
	{
		var self = this, totalCount, currentIndex = self.obCurrentErrorIndex();
		totalCount = self.getErrorsCount();

		if (totalCount <= 1)
		{
			return;
		}

		if (currentIndex + 1 >= totalCount && toNext)
		{
			self.obCurrentErrorIndex(0);
		}
		else if (currentIndex <= 0 && !toNext)
		{
			self.obCurrentErrorIndex(totalCount - 1);
		}
		else
		{
			self.obCurrentErrorIndex(toNext ? currentIndex + 1 : currentIndex - 1);
		}

		self.displayError();
	};

	BasePageLevelViewModel.prototype.displayError = function()
	{
		var self = this, totalCount = self.getErrorsCount();

		if (totalCount === 0)
		{
			self.$pageLevel.find(".error-description").removeClass("hide");
			return;
		}

		if (totalCount < self.obCurrentErrorIndex() + 1)
		{
			self.obCurrentErrorIndex(totalCount - 1);
		}
		self.$pageLevel.find(".error-description").addClass("hide");
		self.$pageLevel.find(".error-description").eq(self.obCurrentErrorIndex()).removeClass("hide");
	};

	BasePageLevelViewModel.prototype.toNextError = function()
	{
		this.navigateError(true);
	};

	BasePageLevelViewModel.prototype.getErrorsCount = function()
	{
		var self = this;
		return self.obValidationErrors().length + self.obValidationErrorsSpecifed().length;
	};

	BasePageLevelViewModel.prototype.getSuccessCount = function()
	{
		var self = this;
		return self.obSuccessMessage().length + self.obSuccessMessageArray().length;
	};

	BasePageLevelViewModel.prototype.saveValidate = function($field, validationOption)
	{
		var self = this;
		if (!self._validator)
		{
			return Promise.resolve(true);
		}
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

		self.obCurrentErrorIndex(0);
		self.obValidationErrors.removeAll();
		self.obErrorMessageDivIsShow(false);
		self.obSuccessMessageDivIsShow(false);
		self.obSuccessMessageArrayDivIsShow(false);
		self.obWarningMessageArrayDivIsShow(false);
		return self._validator.validate()
			.then(function(valid)
			{
				if (validationOption && validationOption.hideToast)//If it is not needed to show toast message at top right corner
				{
					return valid;
				}

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
		if (!self._validator)
		{
			return Promise.resolve(true)
		};
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

		self.obCurrentErrorIndex(0);
		self.obSuccessMessageDivIsShow(false);
		self.obSuccessMessageArrayDivIsShow(false);
		self.obWarningMessageArrayDivIsShow(false);
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
		self.obValidationErrorsSpecifed.removeAll();
		self.obErrorMessageDivIsShow(false);
		self.obSuccessMessageDivIsShow(false);
		self.obSuccessMessageArrayDivIsShow(false);
		self.obWarningMessageArrayDivIsShow(false);
		self.obCurrentErrorIndex(0);
	};

	BasePageLevelViewModel.prototype.popupErrorMessage = function(errorMessage)
	{
		var self = this;
		self.obValidationErrors.removeAll();
		self.obErrorMessageDivIsShow(false);
		self.obSuccessMessageDivIsShow(false);
		self.obSuccessMessageArrayDivIsShow(false);
		self.obWarningMessageArrayDivIsShow(false);

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
		self.obSuccessMessageArrayDivIsShow(false);
		self.obWarningMessageArrayDivIsShow(false);

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
			var $fields = self.getInvalidFields(),
				messages = self._validator.getMessages($fields);

			$fields.each(function(i, el)
			{
				var $el = $(el);
				if ($el.hasClass("data-bv-excluded") || self._validator._isExcluded($el))
				{
					return;
				}

				if (i == 0)
				{
					if (self.autoFocus)
					{
						$el.focus();
					}
				}
				var error = { name: "", leftMessage: "", rightMessage: "", field: null },
					message = self.getMessage(messages[i]);
				message = self.getMessageExpand(el, message, error);

				error.name = $el.attr('data-bv-error-name') || $el.closest("div.form-group").find("label").eq(0).text();
				error.rightMessage = message;
				if (message.toLowerCase().indexOf(error.name.toLowerCase()) != -1)
				{
					error.name = "";
				}
				error.field = $el;

				validationErrors.push(error);
			});
		}
		return validationErrors;
	};

	BasePageLevelViewModel.prototype.getInvalidFields = function()
	{
		return this._validator.getInvalidFields();
	};

	BasePageLevelViewModel.prototype.getValidationErrorsSpecifed = function()
	{
		var validationErrors = [];

		return validationErrors;
	};

	BasePageLevelViewModel.prototype.getValidationErrorsSpecifedPromise = function()
	{
		return Promise.resolve();
	};

	BasePageLevelViewModel.prototype.setValidationErrors = function(validationErrors, validationErrorsSpecifed)
	{
		var self = this;
		if (validationErrors && validationErrors.length > 0)
			self.obValidationErrors(validationErrors);
		if (validationErrorsSpecifed && validationErrorsSpecifed.length > 0)
			self.obValidationErrorsSpecifed(validationErrorsSpecifed);
		if (self.obValidationErrors().length + self.obValidationErrorsSpecifed().length > 0)
			self.obErrorMessageDivIsShow(true);
	};

	BasePageLevelViewModel.prototype.getMessage = function(message)
	{
		message = message.replace('&lt;', '<').replace('&gt;', '>');
		message = message.trim();
		switch (message)
		{
			case "required":
				message = " is required";
				break;
			case "invalid name":
				message = " is invalid";
				break;
			case "invalid date":
				message = " is an invalid date";
				break;
			case "Invalid Syntax":
				message = " syntax is invalid";
				break;
			case "invalid Zip Code":
				message = " is an invalid Postal Code";
				break;
			case "invalid City Name":
				message = " is an invalid City Name";
				break;
			case "invalid email":
				message = " is not a valid email.";
				break;
			case "invalid phone number":
				message = " is not a valid phone number.";
				break;
			case "invalid fax number":
				message = " is not a valid fax number.";
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
		else if (message.indexOf("Please remove special character(s)") != -1)
		{
			message = message.replace('<', '&lt;').replace('>', '&gt;');
		}

		return message;
	};

	BasePageLevelViewModel.prototype.getMessageExpand = function(fielddata, messages, error)
	{
		if (fielddata.name == "mailToList" && messages.indexOf("emails are invalid") != -1)
		{
			error.leftMessage = (isNaN(messages.trim().split(" ")[0]) ? "Multiple" : messages.trim().split(" ")[0]) + " ";
			messages = " email addresses are invalid.";
		}
		return messages;
	};

	BasePageLevelViewModel.prototype.successMessageShow = function()
	{
		this.obSuccessMessageDivIsShow(true);
		this.obSuccessMessageArrayDivIsShow(true);
	};

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
		self.obSuccessMessage(message);
		self.obSuccessMessageDivIsShow(true);
		!tf.isViewfinder && $(".edit-success.single-success:visible").not(self.$pageLevel.find(".edit-success.single-success")).hide();
		self.$pageLevel.find(".edit-success.single-success").stop().css("opacity", 1).show();
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

	BasePageLevelViewModel.prototype.updateSuccessMessages = function(messages, duration)
	{
		var self = this,
			duration = $.isNumeric(duration) ? duration : 4000;

		clearTimeout(self.autoCloseSuccessArrayMsg);

		self.obSuccessMessageArray(messages.map(function(msg) { return { message: msg } }));
		self.obSuccessMessageArrayDivIsShow(true);

		self.$pageLevel.find(".edit-success.mutiple-success").stop().css("opacity", 1).show();
		self.autoCloseSuccessArrayMsg = setTimeout(function()
		{
			self.closeMutipleSuccessMessage(true);
		}, duration);
	};

	/**
	 * Close the mutiple success message box.
	 * @param {boolean} fadeEffect Whether the success meessage should be closed with animation. 
	 */
	BasePageLevelViewModel.prototype.closeMutipleSuccessMessage = function(fadeEffect)
	{
		var self = this;
		if (fadeEffect)
		{
			self.$pageLevel.find(".edit-success.mutiple-success").fadeOut("slow", function()
			{
				self.obSuccessMessageArrayDivIsShow(false);
				self.obSuccessMessageArray.removeAll();
			});
		}
		else
		{
			self.obSuccessMessageArrayDivIsShow(false);
			self.obSuccessMessageArray.removeAll();
		}
	};

	BasePageLevelViewModel.prototype.updateWarningMessages = function(messages, duration)
	{
		var self = this,
			duration = $.isNumeric(duration) ? duration : 10000;

		clearTimeout(self.autoCloseWarningArrayMsg);

		self.obWarningMessageArray(messages.map(function(msg) { return { message: msg } }));
		self.obWarningMessageArrayDivIsShow(true);

		self.$pageLevel.find(".edit-warning").stop().css("opacity", 1).show();
		self.autoCloseWarningArrayMsg = setTimeout(function()
		{
			self.closeWarningMessage(true);
		}, duration);
	};

	/**
	 * Close the warning message box.
	 * @param {boolean} fadeEffect Whether the warning meessage should be closed with animation.
	 */
	BasePageLevelViewModel.prototype.closeWarningMessage = function(fadeEffect)
	{
		var self = this;
		if (fadeEffect)
		{
			self.$pageLevel.find(".edit-warning").fadeOut("slow", function()
			{
				self.obWarningMessageArrayDivIsShow(false);
				self.obWarningMessageArray.removeAll();
			});
		}
		else
		{
			self.obWarningMessageArrayDivIsShow(false);
			self.obWarningMessageArray.removeAll();
		}
	};

	BasePageLevelViewModel.prototype.closeMessageBox = function(viewModel, e)
	{
		var self = this,
			messageBox = $(e.target).parent();
		if (messageBox.hasClass("edit-success"))
		{
			if (messageBox.hasClass("single-success"))
			{
				self.obSuccessMessageDivIsShow(false);
			}
			else
			{
				self.obSuccessMessageArrayDivIsShow(false);
				self.obSuccessMessageArray.removeAll();
			}
		}
		else if (messageBox.hasClass("edit-warning"))
		{
			self.obWarningMessageArrayDivIsShow(false);
			self.obSuccessMessageArray.removeAll();
		}
		else
		{
			self.isClosed = true;
			self.obValidationErrors.removeAll();
			self.obValidationErrorsSpecifed.removeAll();
			self.obCurrentErrorIndex(0);
		}
	};

	BasePageLevelViewModel.prototype.focusField = function(viewModel, e)
	{
		if (viewModel.field)
		{
			$(viewModel.field).focus();
		}
	};

	BasePageLevelViewModel.prototype.dispose = function()
	{
		var self = this;
		self.clearError();
		if (self.validationMessage && self.validationMessage.length > 0)
		{
			self.validationMessage.remove();
		}
	};
})();
