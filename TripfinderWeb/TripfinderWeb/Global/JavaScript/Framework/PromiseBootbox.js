(function()
{
	createNamespace("TF.Modal").PromiseBootbox = PromiseBootbox;

	function PromiseBootbox()
	{
		var self = this;
		bootbox.setDefaults({
			backdrop: true,
			closeButton: false
		})
		self._obCounter = ko.observable(0);
		self._dialogJustShown = null;
		self.obIsShowing = ko.pureComputed(function()
		{
			return self._obCounter() != 0;
		}, self);

		//Which buttons would be binded for Short cut keys "enter" on the modal.
		self.positiveButton = { "yes": true, "ok": true, "save": true, "success": true };
	}

	/**
	 * The alert modal.
	 * @param {string|object} arg the string of message or the object of modal options.
	 * @param {string} title the title of modal.
	 * @param {number} layerLevel the z-index of the modal.
	 * @return {promise} after the modal was closed.
	 */
	PromiseBootbox.prototype.alert = function(arg, title, layerLevel)
	{
		var self = this;
		if ($.type(arg) === "string")
		{
			arg = {
				message: arg,
				animate: false,
				className: TF.isPhoneDevice ? "mobile-alert" : "tfmodal",
				title: title || "Alert",
				buttons: {
					success: {
						label: "OK",
						className: TF.isPhoneDevice ? "btn-mobile-confirm" : "tf-btn-black"
					}
				}
			};
		}
		else
		{
			arg = {
				message: arg.message,
				animate: false,
				className: (TF.isPhoneDevice ? "mobile-alert" : "") + (arg.className || "tfmodal"),
				title: arg.title || "Alert",
				buttons: arg.buttons || {
					success: {
						label: "OK",
						className: TF.isPhoneDevice ? "btn-mobile-confirm" : "tf-btn-black",
						callback: arg.callback
					}
				}
			};
		}
		return self.dialog(arg, layerLevel).then(function()
		{
			return;
		});
	};

	PromiseBootbox.prototype.prompt = function(arg)
	{
		var self = this;
		this._obCounter(this._obCounter() + 1);
		if ($.type(arg) === "string")
		{
			return new Promise(function(resolve, reject)
			{
				try
				{
					bootbox.prompt(arg, function(result)
					{
						self._obCounter(self._obCounter() - 1);
						resolve(result);
					});
					$(".bootbox").delegate(".modal-backdrop", "click", function(e)
					{
						bootbox.hideAll();
					}.bind(this));
				}
				catch (e)
				{
					reject(e);
				}
			});
		}
		else
		{
			return new Promise(function(resolve, reject)
			{
				arg.callback = function(result)
				{
					self._obCounter(self._obCounter() - 1);
					resolve(result);
				}
				try
				{
					bootbox.prompt(arg);
				}
				catch (e)
				{
					reject(e);
				}
			});
		}
	};

	/**
	 * Base of the promise boot box.
	 * @param {object} arg the string of message or the object of modal options.
	 * @param {number} layerLevel the z-index of the modal.
	 * @return {promise} after the modal was closed.
	 */
	PromiseBootbox.prototype.dialog = function(arg, layerLevel)
	{
		// disable arcgis identity manager click hook
		tf.map.ArcGIS.IdentityManager.dialog?._focusTrap?.pause();

		var self = this;
		if (arg.message != null && $.type(arg.message) === "string")
		{
			arg.message = "<pre class='titleNotify'>" + arg.message + "</pre>";
		}
		self._obCounter(self._obCounter() + 1);
		return new Promise(function(resolve, reject)
		{
			arg.onEscape = function()
			{
				self._obCounter(self._obCounter() - 1);
				resolve(null);
			}
			var buttons = arg.buttons, index = 0;
			for (var key in buttons)
			{
				(function()
				{
					var copyKey = key;
					if ($.isPlainObject(buttons[copyKey]))
					{
						var callback = buttons[copyKey].callback;
						buttons[copyKey].callback = function(e)
						{
							self._obCounter(self._obCounter() - 1);
							resolve(copyKey);
							if (callback)
							{
								callback();
							}
						};
					}
					else
					{
						buttons[copyKey] = function()
						{
							self._obCounter(self._obCounter() - 1);
							resolve(copyKey);
						}
					}
					//VIEW-2408, Add the underlined letter corresponding to its hotkey when the 'Alt' key was pressed.
					buttons[copyKey].text = buttons[copyKey].label;
					buttons[copyKey].label = "<p data-index='" + index + "'>" + buttons[copyKey].label + "</p>";
					buttons[copyKey].index = index;
					index++;
				})();
			}
			try
			{
				arg.animate = false;
				arg.backdrop = "static";
				self._dialogJustShown = true;
				bootbox.dialog(arg);
				setTimeout(() => self._dialogJustShown = false, 500);

				if (layerLevel) //fix VIEW-1369
				{
					$(".bootbox").css('z-index', layerLevel);
				}

				$(".bootbox").on("shown.bs.modal", function()
				{
					self.centerDialog();
				});

				self.modalDraggable($(".bootbox"), $(".bootbox").find(".modal-dialog"), undefined, undefined, true);
				self.modalEvent($(".bootbox"));
				self.bindShortCutKeys($(".bootbox"), buttons, resolve);

				$(".bootbox").delegate(".modal-backdrop", TF.isMobileDevice ? 'touchstart' : 'click', function(e)
				{
					self._obCounter(self._obCounter() - 1);
					resolve(null);
				});
			}
			catch (e)
			{
				reject(e);
			}
		});
	};

	PromiseBootbox.prototype.threeStateConfirm = function(arg)
	{
		var self = this;
		var option = {};
		if ($.type(arg) === "string")
		{
			option.message = arg;
		}
		else
		{
			option = arg;
		}
		if (!option.buttons)
		{
			option.buttons = {
				yes: {
					label: "Yes",
					className: "btn-primary btn-sm btn-primary-black"
				},
				no: {
					label: "No",
					className: "btn-default btn-sm btn-default-link"
				},
				cancel: {
					label: "Cancel",
					className: "btn-default btn-sm btn-default-link pull-right"
				}
			}
		}

		return new Promise(function(resolve, reject)
		{
			self.dialog(option)
				.then(function(result)
				{
					if (result == "yes")
					{
						resolve(true);
					}
					if (result == "no")
					{
						resolve(false);
					}
					if (result == "cancel")
					{
						resolve(null);
					}
					if (result == null)
					{
						resolve(null);
					}
				})
		});
	};

	PromiseBootbox.prototype.yesNo = function(arg, title)
	{
		var self = this;
		var option = {};

		if ($.type(arg) === "string")
		{
			option.message = arg;
		}
		else
		{
			option = arg;
		}
		if (typeof (option.closeButton) == "undefined")
		{
			option.closeButton = true;
		}
		option.className = TF.isPhoneDevice ? "unsave-mobile" : null;
		if (!option.buttons)
		{
			option.buttons = TF.isPhoneDevice ? {
				yes: {
					label: "Yes",
					className: "btn-yes-mobile"
				},
				no: {
					label: "No",
					className: "btn-no-mobile"
				}
			} : {
					yes: {
						label: "Yes",
						className: "btn-primary btn-sm btn-primary-black"
					},
					no: {
						label: "No",
						className: "btn-default btn-sm btn-default-link"
					}
				}
		}
		if (title)
		{
			option.title = title;
		}

		return new Promise(function(resolve, reject)
		{
			self.dialog(option)
				.then(function(result)
				{
					if (result == "yes")
					{
						resolve(true);
					}
					if (result == "no")
					{
						resolve(false);
					}
					if (result == null)
					{
						resolve(null);
					}
				})
		});
	};

	PromiseBootbox.prototype.confirm = function(arg)
	{
		// Changed the confirm style of ticket Application paging
		var self = this;
		var option = {};

		option.className = TF.isPhoneDevice ? "unsave-mobile" : null;

		option.buttons = TF.isPhoneDevice ? {
			OK: {
				label: "OK",
				className: "btn-yes-mobile"
			},
			Cancel: {
				label: "Cancel",
				className: "btn-no-mobile"
			}
		} : {
				OK: {
					label: "OK",
					className: "btn-primary btn-sm btn-primary-black"
				},
				Cancel: {
					label: "Cancel",
					className: "btn-default btn-sm btn-default-link"
				}
			}
		if ($.type(arg) === "string")
		{
			option.message = arg;
		}
		else
		{
			option = $.extend(true, option, arg);
		}

		return new Promise(function(resolve, reject)
		{
			self.dialog(option)
				.then(function(result)
				{
					if (result == "OK")
					{
						resolve(true);
					}
					if (result == "Cancel")
					{
						resolve(false);
					}
					if (result == null)
					{
						resolve(null);
					}
				})
		});
	};

	PromiseBootbox.prototype.okRetry = function(arg)
	{
		// Changed the confirm style of ticket Application paging
		var self = this;
		var option = { className: TF.isPhoneDevice ? "unsave-mobile" : "tfmodal" };
		option.buttons = {
			OK: {
				label: "OK",
				className: TF.isPhoneDevice ? "btn-yes-mobile" : "tf-btn-black"
			},
			Cancel: {
				label: "Retry",
				className: TF.isPhoneDevice ? "btn-no-mobile" : "btn-default btn-sm btn-default-link"
			}
		}
		if ($.type(arg) === "string")
		{
			option.message = arg;
		}
		else
		{
			option.message = arg.message;
			option.title = arg.title;
		}

		return new Promise(function(resolve, reject)
		{
			self.dialog(option)
				.then(function(result)
				{
					if (result == "OK")
					{
						resolve(true);
					}
					if (result == "Cancel")
					{
						resolve(false);
					}
					if (result == null)
					{
						resolve(null);
					}
				})
		});
	};

	PromiseBootbox.prototype.modalDraggable = function(tfModal, dialog, handle, containment, isbootbox)
	{

		dialog.draggable({
			handle: handle == undefined ? ".modal-header" : handle,
			cursor: 'move',
			refreshPositions: false,
			containment: containment == undefined ? "body" : containment,
			scroll: false,
			start: function(e)
			{
				$(e.currentTarget).css("transform", "none");
				$(".typeahead.dropdown-menu").hide();
			}
		});

		if (isbootbox)
		{
			function centerModal()
			{
				dialog.each(function(i, d)
				{
					if (d)
					{
						d = $(d);
						var top = (window.innerHeight - d.outerHeight(true)) / 2;
						var left = (window.innerWidth - d.outerWidth(true)) / 2;
						d.css('top', top);
						d.css('left', left);
					}
				});
			}

			$(window).resize(function(e)
			{
				setTimeout(function()
				{
					centerModal();
				});
			});

			var top = (window.innerHeight - dialog.outerHeight(true)) / 2,
				left = (window.innerWidth - dialog.outerWidth(true)) / 2;
			if (top <= 28)
			{
				top = 0;
			}
			dialog.css(
				{
					'top': top,
					'left': left,
					"transform": "translate(0,0)"
				});
		}
	};

	PromiseBootbox.prototype.modalEvent = function(tfModal)
	{
		var self = this;
		var count = this._obCounter();
		tf.modalHelper.pushBootbox(tfModal);
		var event = TF.isMobileDevice ? 'touchstart' : 'click';

		tf.shortCutKeys.addChildKey("PromiseBootbox" + count);
		tfModal.data("isShow", true);

		tfModal.delegate(".modal-backdrop", event, function(e)
		{
			e.preventDefault();
			e.stopPropagation();

			if (!self._dialogJustShown)
			{
				bootbox.hideAll();
			}
		}).on('hidden.bs.modal', function(e)
		{
			tf.shortCutKeys.removeChildKey("PromiseBootbox" + count, true);

			if (this.tfModal.data("isShow"))
			{
				tf.modalHelper.removeBootbox(this.tfModal);
			}
		}.bind({ tfModal: tfModal, count: count }));
	};


	/**
	 * Bind the short cut keys for buttons on the modal.
	 * @param {object} tfModal the jquery object of the modal.
	 * @param {object} buttons all buttons on the modal.
	 * @param {promise} resolve return the result.
	 * @return {void}
	 */
	PromiseBootbox.prototype.bindShortCutKeys = function(tfModal, buttons, resolve)
	{
		var self = this, count = this._obCounter(), key, usedFirstletter = [], isEnterBinded = false;
		//Unbind the default keyup.
		tfModal.off("keyup");

		/**
		 * Get the first letter from the button's label, then bind the button event with the first letter and alt-firstletter.
		 * @param {string} label the button's label.
		 * @param {string} keyName the button's key name.
		 * @returns {boolean} Binding success or faild
		 */
		function bind(label, keyName, callback)
		{
			var firstletter = label.length > 0 ? label.substr(0, 1).toLowerCase() : null;
			if (firstletter && usedFirstletter.indexOf(firstletter) === -1)
			{
				//The alt-firstletter was binded, when the focus in input, textarea or select, this hot key always is available.
				bindExtend("alt+" + firstletter, keyName, { permission: ["INPUT", "TEXTAREA", "SELECT"] }, callback);
				usedFirstletter.push(firstletter);
				return true;
			}
			return false;
		}

		/**
		 * Bind the hot keys.
		 * @param {string} bindKeysName the keys' name.
		 * @param {string} keyName the button's key name.
		 * @param {array} permission which element is focused, the hot key is still available.
		 * @returns {void}
		 */
		function bindExtend(bindKeysName, keyName, permission, callback)
		{
			tf.shortCutKeys.bind(bindKeysName, function()
			{
				setTimeout(function()
				{
					if (callback)
					{
						callback();
					}
					else
					{
						self._obCounter(self._obCounter() - 1);
					}
					bootbox.hideAll();
					resolve(keyName);
				});
				return false;
			}, "PromiseBootbox" + count, undefined, permission);
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
				item.removeClass("underline")
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
				item.addClass("underline")
			});
		}

		//The "esc" should act like the close button.
		bindExtend("esc", null, { permission: ["INPUT", "TEXTAREA", "SELECT"] });

		var underlineButtons = [], $modalFooter = tfModal.find(".modal-footer");

		//Bind all buttons.
		for (var i in buttons)
		{
			if (self.positiveButton[i.toLowerCase()] && !isEnterBinded)
			{
				//The "esc" should act like the close button.
				bindExtend("enter", i, { permission: ["INPUT", "SELECT"] }, buttons[i].callback);
			}
			key = buttons[i].text ? buttons[i].text.toLowerCase() : i.toLowerCase();
			if (bind(key, i, buttons[i].callback))
			{
				underlineButtons.push($modalFooter.find("[data-index=" + buttons[i].index + "]"));
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
			}, "PromiseBootbox" + count, "keydown", { permission: ["INPUT", "TEXTAREA", "SELECT"] });
		}
		else
		{
			//VIEW-2408, Add the underlined letter corresponding to its hotkey when the 'Alt' key was pressed.
			tf.shortCutKeys.bind("alt", function()
			{
				setUnderline(underlineButtons);
				return false;
			}, "PromiseBootbox" + count, "keydown", { permission: ["INPUT", "TEXTAREA", "SELECT"] });
			tf.shortCutKeys.bind("alt", function()
			{
				clearUnderline(underlineButtons);
				return false;
			}, "PromiseBootbox" + count, "keyup", { permission: ["INPUT", "TEXTAREA", "SELECT"] });
		}

		//The focus don't on the buttons.
		tfModal.find("button").attr("onfocus", "blur()");
		tfModal.find("button").blur();
	};

	PromiseBootbox.prototype.centerDialog = function()
	{
		var $dialog = $(".bootbox").find(".modal-dialog"),
			deltaY = (($(window).height() - $dialog.outerHeight(true)) / 2) + "px",
			deltaX = (($(window).width() - 2 - $dialog.outerWidth(true)) / 2) + "px";

		$dialog.css({
			"top": deltaY,
			"bottom": deltaY,
			"left": deltaX,
			"right": deltaX,
		});
	};

	PromiseBootbox.prototype.hideAllBox = function()
	{
		var $bootbox = null,
			$bootboxs = $(".bootbox"),
			length = $bootboxs.length;

		if (length === 0) { return; }
		for (var i = 0; i < $bootboxs.length; i++)
		{
			$bootbox = $($bootboxs[i]);
			$bootbox.modal('hide');
		}

	}

	createNamespace("tf").promiseBootbox = new PromiseBootbox();
})();
