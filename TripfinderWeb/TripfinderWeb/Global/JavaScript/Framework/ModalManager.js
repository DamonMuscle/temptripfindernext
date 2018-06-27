(function()
{
	createNamespace("TF.Modal").ModalManager = ModalManager;

	function ModalManager()
	{
		var self = this;

		self._$modalContainer = $('.tfmodal-container');
		self._showing = false;
		self.obBaseModalViewModels = ko.observableArray([]);
		self.obShowing = ko.observable(false);
		self.modalAdd = self.modalAdd.bind(self);
		ko.applyBindings(self, self._$modalContainer[0]);
		self._handlers = {};


		$("body").delegate("input,textarea,body,button,a", "focus.modal", function(e)
		{
			var focusList = ['<input class="k-color-value form-control">'];
			//if user click tab key in the keyboard and the focus is not in modal which is opened, the first input will be focused in the modal
			if (tf.modalManager.obBaseModalViewModels().length > 0)
			{
				var $target = tf.modalManager.obBaseModalViewModels()[tf.modalManager.obBaseModalViewModels().length - 1].$target;
				var $modalBody = $target ? $target.find(".modal-body") : undefined;
				if ($modalBody && $modalBody[0] && !$modalBody[0].contains(e.target) && focusList.indexOf(e.target.outerHTML) == -1)
				{
					//find the first input or textarea in modal which is opened
					var $inputs = $modalBody.find("input[tabindex!=-1]:visible:enabled:first,textarea[tabindex!=-1]:visible:enabled:first");
					if ($inputs.length > 0)
					{
						$($inputs[0]).focus();
					}
					else 
					{
						var focusHtml = "<input class='used-for-focus' />";
						$modalBody.append(focusHtml);
						$modalBody.find(".used-for-focus").focus();
						$modalBody.find(".used-for-focus").remove();
					}
					e.preventDefault();
				}
			}
		});

		self._$modalContainer.on('shown.bs.modal', function(e)
		{
			var $modal = $(e.target), baseModalViewModel = ko.dataFor($modal[0]),
				firstElement = $modal.find(':text,select,textarea,:checkbox,:password,:radio,:file').not(":disabled").eq(0);
			baseModalViewModel.containerLoaded(true);
			baseModalViewModel.$target = $modal;
			if (!TF.isMobileDevice)
			{
				if (firstElement[0] === document.activeElement)
				{
					return;
				}
				$(document.activeElement).blur();
				if (baseModalViewModel.focusInFirstElement)
				{
					firstElement.focus();
				}
			}
			else
			{
				if (!TF.isPhoneDevice)
				{
					var scrollElements = baseModalViewModel.$target.find(':visible').filter(function(index, element)
					{
						var overflow = $(element).css("overflow");
						return overflow == 'auto' || overflow == 'scroll';
					})

					for (var i = 0; i < scrollElements.length; i++)
					{
						new TF.TapHelper(scrollElements[i], {
							swipingUp: function(e)
							{
								e.stopPropagation();
								var target = e.currentTarget;
								if (target && target.scrollHeight - target.scrollTop <= target.clientHeight)
								{
									e.preventDefault();
								}
							},
							swipingDown: function(e)
							{
								e.stopPropagation();
								var target = e.currentTarget;
								if (target && target.scrollTop <= 0)
								{
									e.preventDefault();
								}
							}
						});
					}
				}
			}

			//these input is not focused when user click tab key in the keyboard
			var $inputs = $modal.find(".modal-body").find("input:button,input:image,input:file,input.notinput-required-message,button,input[data-tf-input-type='Select']");
			$inputs.attr("tabIndex", -1);

		});

		self._$modalContainer.on('hidden.bs.modal', function(e)
		{
			var $modal = $(e.target);
			var baseModalViewModel = ko.dataFor($modal[0]);
			//remove child hash key
			tf.shortCutKeys.removeChildKey(baseModalViewModel.shortCutKeyHashMapKeyName, baseModalViewModel.inheritChildrenShortCutKey);

			baseModalViewModel.dispose();
			$modal.data("bs.modal", null);
			self.obBaseModalViewModels.remove(baseModalViewModel);

			if (self._$modalContainer.find(".modal-fullscreen").length === 0)
			{
				$("body").removeClass('modal-fullscreen-open');
			}
		});
		var event = TF.isMobileDevice ? 'touchstart' : 'click';
		self._$modalContainer.delegate(".modal .modal-backdrop", event, function(e)
		{
			e.preventDefault();
			e.stopPropagation();
			var $modal = $(e.target);
			var baseModalViewModel = ko.dataFor($modal[0]);
			if (!baseModalViewModel.OutSizeClickEnable)
			{
				baseModalViewModel.closeClick(baseModalViewModel, e);
			}
		});

		$(window).resize(function(e)
		{
			setTimeout(function()
			{
				self.obBaseModalViewModels().map(function(modal)
				{
					var $dialog = modal.$target.find(".modal-dialog"),
						offset = $dialog.offset(),
						deltaY = ($(window).height() - $dialog.outerHeight(true)) / 2,
						deltaX = ($(window).width() - $dialog.outerWidth(true)) / 2,
						top, left;
					if (offset.top < 0)
					{
						$dialog.css("top", "-" + deltaY + "px");
					}
					else if (offset.top > deltaY * 2)
					{
						$dialog.css("top", deltaY + "px");
					}

					if (offset.left < 0)
					{
						$dialog.css("left", "-" + deltaX + "px");
					}
					else if (offset.left > deltaX * 2)
					{
						$dialog.css("left", deltaX + "px");
					}
				});
			});
		});
	};

	ModalManager.prototype = {
		hideModal: function(baseModalViewModel)
		{
			var $modal = null,
				$modals = this._$modalContainer.find(".tfmodal"),
				length = $modals.length;

			if (length === 0) { return; }

			for (var i = 0; i < $modals.length; i++)
			{
				if (ko.dataFor($modals[i]) == baseModalViewModel)
				{
					$modal = $($modals[i]);
				}
			}
			if ($modal)
			{
				$modal.find(".modal-header").off("click.inputblur");
				$modal.modal('hide');
			}

			//remove child hash key
			tf.shortCutKeys.removeChildKey(baseModalViewModel.shortCutKeyHashMapKeyName, baseModalViewModel.inheritChildrenShortCutKey);
		},

		showModal: function(baseModalViewModel, draggable)
		{
			if (!(baseModalViewModel instanceof TF.Modal.BaseModalViewModel))
			{
				throw "require a subclass of BaseModalViewModel";
			}
			var self = this;
			self.currentBaseModalViewModel = baseModalViewModel;
			baseModalViewModel.draggable = draggable == false ? false : true;
			self.obBaseModalViewModels.push(baseModalViewModel);

			//add the child hash key
			tf.shortCutKeys.addChildKey(baseModalViewModel.shortCutKeyHashMapKeyName);
			//Bind hot keys
			self.bindHotKeys(baseModalViewModel);
			return baseModalViewModel.getPromise();
		},

		hideAll: function()
		{
			var self = this;
			var openModals = this.obBaseModalViewModels();

			var cnt = openModals.length;
			for (var i = 0; i < cnt; i++)
			{
				var openModal = openModals.pop();
				self.hideModal(openModal);
			}
		}
	};

	/**
	 * Bind hot keys to modal;
	 * @param {object} baseModalViewModel the object of modal .
	 * @returns {void}
	 */
	ModalManager.prototype.bindHotKeys = function(baseModalViewModel)
	{
		var self = this;
		//If this modal has buttons.
		var buttonTemplateLocation = baseModalViewModel.buttonTemplate() ? baseModalViewModel.buttonTemplate().toLowerCase() : "";
		if (buttonTemplateLocation)
		{
			//If there are 'save' button and 'save & new' button both on this modal, only bind the 'save' button event with the hot key 's'.
			var usedFirstletter = [], underlineButtons = [];

			/**
			 * Get the first letter from the button's label, then bind the button event with the first letter and alt-firstletter.
			 * @param {string} label the button's label.
			 * @param {string} buttonClass find the button by button's class.
			 * @returns {boolean} Binding success or faild
			 */
			function bind(label, buttonClass)
			{
				var firstletter = label.length > 0 ? label.substr(0, 1).toLowerCase() : null;
				if (firstletter && usedFirstletter.indexOf(firstletter) === -1)
				{
					//The alt-firstletter was binded, when the focus in input, textarea or select, this hot key always is available.
					bindExtend("alt+" + firstletter, buttonClass, { permission: ["INPUT", "TEXTAREA", "SELECT"] });
					usedFirstletter.push(firstletter);
					return true;
				}
				return false;
			}

			/**
			 * Bind the hot keys.
			 * @param {string} bindKeysName the keys' name.
			 * @param {string} buttonClass find the button by button's class.
			 * @param {array} permission which element is focused, the hot key is still available.
			 * @returns {void}
			 */
			function bindExtend(bindKeysName, buttonClass, permission)
			{
				function buttonTrigger()
				{
					var $positive = baseModalViewModel.$target.find(buttonClass);
					if (!$positive.attr("disabled"))
					{
						$(document.activeElement).blur();
						$positive.trigger("click");
					}
					clearUnderline(underlineButtons);
				}

				tf.shortCutKeys.bind(bindKeysName, function()
				{
					baseModalViewModel.notDelayTrigger ? buttonTrigger() : setTimeout(buttonTrigger);
					return false;
				}, baseModalViewModel.shortCutKeyHashMapKeyName, undefined, permission);
			}

			/**
			 * Clear the buttons' underline.
			 * @param {array} buttons the array of button style's observable object.
			 * @returns {void}
			 */
			function clearUnderline(buttons)
			{
				buttons.forEach(function(item)
				{
					item.underlineClass("");
				});
			}

			/**
			 * Set the buttons' underline.
			 * @param {array} buttons the array of button style's observable object.
			 * @returns {void}
			 */
			function setUnderline(buttons)
			{
				buttons.forEach(function(item)
				{
					var $button = baseModalViewModel.$target.find(item.buttonClass);
					if (!$button.attr("disabled"))
					{
						item.underlineClass("underline");
					}
				});
			}

			//All modals have the positive button.
			var positiveLabel = baseModalViewModel.obPositiveButtonLabel().trim();
			if (bind(positiveLabel, ".modal-footer button.positive"))
			{
				underlineButtons.push({ underlineClass: baseModalViewModel.obPositiveUnderlineClass, buttonClass: ".modal-footer button.positive" });
			}
			//The "esc" should act like the close button.
			bindExtend("esc", ".modal-header button.close", { permission: ["INPUT", "TEXTAREA", "SELECT"] });
			//The "enter" should act like the positive button.
			bindExtend("enter", ".modal-footer button.positive", { permission: ["INPUT", "SELECT"] });

			//Not include the modal which only has one button.
			if (buttonTemplateLocation !== "modal/positive")
			{
				var negativeLabel = baseModalViewModel.obNegativeButtonLabel().trim();
				if (bind(negativeLabel, ".modal-footer button.negative"))
				{
					underlineButtons.push({ underlineClass: baseModalViewModel.obNegativeUnderlineClass, buttonClass: ".modal-footer button.negative" });
				}
				//The modal has three buttons.
				if (buttonTemplateLocation === "modal/positivenegativeextend")
				{
					var otherLabel = baseModalViewModel.obSaveAndNewButtonLabel().trim();
					if (bind(otherLabel, ".modal-footer button.other"))
					{
						underlineButtons.push({ underlineClass: baseModalViewModel.obSaveAndNewUnderlineClass, buttonClass: ".modal-footer button.other" });
					}
				}
				else if (buttonTemplateLocation === "modal/positivenegativeother")
				{
					var otherLabel = baseModalViewModel.obOtherButtonLabel().trim();
					if (bind(otherLabel, ".modal-footer button.other"))
					{
						underlineButtons.push({ underlineClass: baseModalViewModel.obOtherUnderlineClass, buttonClass: ".modal-footer button.other" });
					}
				}
			}

			var timeOut = null, time = 500;
			if (navigator.userAgent.indexOf('Firefox') >= 0)
			{
				tf.shortCutKeys.bind("alt", function()
				{
					if (!timeOut)
					{
						setUnderline(underlineButtons);
					}
					else
					{
						clearTimeout(timeOut);
					}
					timeOut = setTimeout(function()
					{
						clearUnderline(underlineButtons);
						timeOut = null;
						time = 500;
					}, time);
					time = 100;
					return false;
				}, baseModalViewModel.shortCutKeyHashMapKeyName, "keydown", { permission: ["INPUT", "TEXTAREA", "SELECT"] });
			}
			else
			{
				//VIEW-2408, Add the underlined letter corresponding to its hotkey when the 'Alt' key was pressed.
				tf.shortCutKeys.bind("alt", function()
				{
					setUnderline(underlineButtons);
					return false;
				}, baseModalViewModel.shortCutKeyHashMapKeyName, "keydown", { permission: ["INPUT", "TEXTAREA", "SELECT"] });
				tf.shortCutKeys.bind("alt", function()
				{
					clearUnderline(underlineButtons);
					return false;
				}, baseModalViewModel.shortCutKeyHashMapKeyName, "keyup", { permission: ["INPUT", "TEXTAREA", "SELECT"] });
			}
		}
	};

	ModalManager.prototype.modalAdd = function(el, modalViewModel)
	{
		var options = { backdrop: (this.currentBaseModalViewModel.obCloseable() ? true : "static"), keyboard: false },
			$el = $(el),
			tfModal = $el.closest('.tfmodal'),
			dialog = $el.closest('.modal-dialog');
		if (dialog.attr("class").indexOf("modal-fullscreen") === -1)
		{
			dialog.find('.modal-body').css("max-height", window.innerHeight - 28 - 41 - 46 - 5);
		}
		if (modalViewModel.draggable && !dialog.hasClass("modal-fullscreen"))
		{
			tf.promiseBootbox.modalDraggable(tfModal, dialog);
			tfModal.find(".modal-header").on("click.inputblur", function(e)
			{
				$(document.activeElement).blur();
			});
		}

		if (dialog.hasClass("modal-fullscreen") && TF.isPhoneDevice)
		{
			$("body").addClass('modal-fullscreen-open');
			dialog.find(".mobile-modal-grid-head").on("touchmove", function(e)
			{
				e.stopPropagation();
				e.preventDefault();
			});
			new TF.TapHelper(dialog[0], {
				swipingUp: function(e)
				{
					var modalBody = $(e.target).closest(".mobile-modal-content-body")[0];
					if (modalBody && modalBody.scrollHeight - modalBody.scrollTop <= $(modalBody).height())
					{
						e.stopPropagation();
						e.preventDefault();
					}
				},
				swipingDown: function(e)
				{
					var modalBody = $(e.target).closest(".mobile-modal-content-body")[0];
					if (modalBody && modalBody.scrollTop <= 0)
					{
						e.stopPropagation();
						e.preventDefault();
					}
				}
			});
		}
		tfModal.modal(options);
		this.currentBaseModalViewModel.obPageElement(tfModal);
	};
})();
