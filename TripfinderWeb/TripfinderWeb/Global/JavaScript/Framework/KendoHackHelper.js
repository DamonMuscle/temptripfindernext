(function()
{
	createNamespace("TF").KendoHackHelper = KendoHackHelper;

	function KendoHackHelper()
	{
		var KendoMobile = kendo.mobile;
		var BaseKendoMobileViewEngineAppend = KendoMobile.ViewEngine.prototype.append;
		KendoMobile.ViewEngine.prototype.append = function(html, url)
		{
			html = html.replace(/data-role/g, "data-" + kendo.ns + "role");
			return BaseKendoMobileViewEngineAppend.call(this, html, url);
		};

		var BaseKendoMobilePaneWarp = KendoMobile.ui.Pane.wrap;
		KendoMobile.ui.Pane.wrap = function(element)
		{
			if (!element.is(kendo.roleSelector("view")))
			{
				element = element.wrap('<div data-' + kendo.ns + 'role="view" data-' + kendo.ns + 'stretch="true"></div>').parent();
			}
			return BaseKendoMobilePaneWarp.call(this, element);
		}

		var KendoFlatColorPickerPrototype = null, KendoColorPickerPrototype = null, KendoDropDownListPrototype = null, KendoUploadPrototype = null;

		window.kendo.widgets.map(function(widget, idx)
		{
			if (widget.name === 'kendoFlatColorPicker')
				KendoFlatColorPickerPrototype = widget.widget.prototype;
			if (widget.name === 'kendoColorPicker')
				KendoColorPickerPrototype = widget.widget.prototype;
			if (widget.name === 'kendoDropDownList')
				KendoDropDownListPrototype = widget.widget.prototype;
			if (widget.name === 'kendoUpload')
				KendoUploadPrototype = widget.widget.prototype;
		});

		var Const = {
			recentTileWidth: TF.isPhoneDevice ? 46 : 24,
			recentTileHeight: TF.isPhoneDevice ? 46 : 24,
			recentWidth: 220,
			recentTileSpaceWidth: TF.isPhoneDevice ? 10 : 5,
			recentMaximumOfTileShow: 7,
			recentMaxColumns: 50,
			recentScrollStart: TF.isMobileDevice ? "touchstart" : "mousedown",
			recentScrollEnd: TF.isMobileDevice ? "touchend" : "mouseup"
		};

		KendoFlatColorPickerPrototype.setOptions({ extend: true, sticky: false, hack: true });

		KendoFlatColorPickerPrototype._template = TF.isPhoneDevice ? kendo.template(
			'# if(extend) { #' +
			'<div class="color-picker">' +
			'<div class="col-xs-24 row">' +
			'<div class="col-xs-22 palette-container"><div class="form-group">' +
			'<div class="palette"></div>' +
			'</div></div>' +
			'<div class="col-xs-22 hsv-container"><div class="form-group hsv">' +
			'<div class="k-hsv-rectangle"><div class="k-hsv-gradient"></div><div class="k-draghandle"></div></div>' +
			'<input class="k-hue-slider" />' +
			'# if (opacity) { #' +
			'<input class="k-transparency-slider" />' +
			'# } #' +
			'# if (buttons) { #' +
			'<div unselectable="on" class="k-controls"><button class="k-button k-primary apply">#: messages.apply #</button> <button class="k-button cancel">#: messages.cancel #</button></div>' +
			'# } #' +
			'</div></div></div>' +
			'<div class="col-xs-24 row">' +
			'<div class="col-xs-22"><div class="form-group recent-group">' +
			'<div class="color-header">Recent Colors</div>' +
			'<div class="image-button image-previous"></div><div class="recentPalette"></div><div class="image-button image-next"></div>' +
			'</div></div>' +
			'<div class="col-xs-22"><div class="form-group hex-group">' +
			'<div class="color-header">Hex Color</div>' +
			'# if (preview) { #' +
			'<div class="k-selected-color"><div class="k-selected-color-display"><input class="k-color-value form-control" #= !data.input ? \'style=\"visibility: hidden;\"\' : \"\" #></div></div>' +
			'# } #' +
			'</div></div></div></div>' +
			'# } else { #' +
			'# if (preview) { #' +
			'<div class="k-selected-color"><div class="k-selected-color-display"><input class="k-color-value" #= !data.input ? \'style=\"visibility: hidden;\"\' : \"\" #></div></div>' +
			'# } #' +
			'<div class="k-hsv-rectangle"><div class="k-hsv-gradient"></div><div class="k-draghandle"></div></div>' +
			'<input class="k-hue-slider" />' +
			'# if (opacity) { #' +
			'<input class="k-transparency-slider" />' +
			'# } #' +
			'# if (buttons) { #' +
			'<div unselectable="on" class="k-controls"><button class="k-button k-primary apply">#: messages.apply #</button> <button class="k-button cancel">#: messages.cancel #</button></div>' +
			'# } #' +
			'# } #'
		) : kendo.template(
			'# if(hack) {#' +
			'# if(extend) { #' +
			'<div class="close-color-picker">×</div>' +
			'<div class="color-picker">' +
			'<div class="col-xs-24 row">' +
			'<div class="col-xs-12"><div class="form-group color-selector">' +
			'<div class="color-header">Swatch</div>' +
			'<div class="palette"></div>' +
			'</div></div>' +
			'<div class="col-xs-12"><div class="form-group color-selector">' +
			'<div class="color-header">Color Picker</div>' +
			'<div class="k-hsv-rectangle"><div class="k-hsv-gradient"></div><div class="k-draghandle"></div></div>' +
			'<input class="k-hue-slider" />' +
			'# if (opacity) { #' +
			'<input class="k-transparency-slider" />' +
			'# } #' +
			'# if (buttons) { #' +
			'<div unselectable="on" class="k-controls"><button class="k-button k-primary apply">#: messages.apply #</button> <button class="k-button cancel">#: messages.cancel #</button></div>' +
			'# } #' +
			'</div></div></div>' +
			'<div class="col-xs-24 row">' +
			'<div class="col-xs-12"><div class="form-group color-display">' +
			'<div class="color-header">Recent Colors</div>' +
			'<div class="image-button image-previous"></div><div class="recentPalette"></div><div class="image-button image-next"></div>' +
			'</div></div>' +
			'<div class="col-xs-12"><div class="form-group color-display">' +
			'<div class="color-header hex-color">Hex Color</div>' +
			'# if (preview) { #' +
			'<div class="k-selected-color"><div class="k-selected-color-display"><input class="k-color-value form-control" #= !data.input ? \'style=\"visibility: hidden;\"\' : \"\" #></div></div>' +
			'# } #' +
			'</div></div></div></div>' +
			'# } else { #' +
			'# if (preview) { #' +
			'<div class="k-selected-color"><div class="k-selected-color-display"><input class="k-color-value" #= !data.input ? \'style=\"visibility: hidden;\"\' : \"\" #></div></div>' +
			'# } #' +
			'<div class="k-hsv-rectangle"><div class="k-hsv-gradient"></div><div class="k-draghandle"></div></div>' +
			'<input class="k-hue-slider" />' +
			'# if (opacity) { #' +
			'<input class="k-transparency-slider" />' +
			'# } #' +
			'# if (buttons) { #' +
			'<div unselectable="on" class="k-controls"><button class="k-button k-primary apply">#: messages.apply #</button> <button class="k-button cancel">#: messages.cancel #</button></div>' +
			'# } #' +
			'# } #' +
			'# } else { #' +
			'# if (preview) { #' +
			'<div class="k-selected-color"><div class="k-selected-color-display"><input class="k-color-value" #= !data.input ? \'style=\"visibility: hidden;\"\' : \"\" #></div></div>' +
			'# } #' +
			'<div class="k-hsv-rectangle"><div class="k-hsv-gradient"></div><div class="k-draghandle"></div></div>' +
			'<input class="k-hue-slider" />' +
			'# if (opacity) { #' +
			'<input class="k-transparency-slider" />' +
			'# } #' +
			'# if (buttons) { #' +
			'<div unselectable="on" class="k-controls"><button class="k-button k-primary apply">#: messages.apply #</button> <button class="k-button cancel">#: messages.cancel #</button></div>' +
			'# } #' +
			'# } #'
		);

		KendoFlatColorPickerPrototype.switchView = function(view)
		{
			if ((view === "palette" && this.element.find(".hsv-container").hasClass("hide")) ||
				(view === "hsv" && this.element.find(".palette-container").hasClass("hide")))
			{
				return;
			}
			this.element.find(".hsv-container").toggleClass("hide");
			this.element.find(".palette-container").toggleClass("hide");
		};

		KendoFlatColorPickerPrototype.hideView = function(selector)
		{
			$(selector).addClass("hide");
		};

		KendoFlatColorPickerPrototype._triggerSelect = KendoFlatColorPickerPrototype._triggerSelect.createInterceptor(function(color)
		{
			var self = this;
			if (this.options.hack == false)
			{
				return true;
			}
			if (!self.updateColorPicker)
			{
				return false;
			}
		});

		KendoFlatColorPickerPrototype._updateUI = KendoFlatColorPickerPrototype._updateUI.createSequence(function(color, dontChangeInput)
		{
			var self = this;
			if (self.options.hack == false)
			{
				return;
			}
			if (self.options.extend)
			{
				if (!self.options.hasAttachedEvent && self.options.treatWhiteAsTransparent)
				{
					self.options.hasAttachedEvent = true;
					self._colorAsText.on('input', function() { $(this).parent().removeClass('no-border') });
					self._colorAsText.on('keydown', function(evt)
					{
						if (self._colorAsText.val().toLowerCase() === 'none' && evt.keyCode == 13)
						{
							setTimeout(function()
							{
								self._colorAsText.parents('.k-selected-color-display').addClass('no-border').css('background-color', '#ffffff');
								$(".data-block-appearance-menu li.border").addClass('no-border');

								self._colorAsText.val('#fffffe');
								var color = kendo.parseColor('#fffffe', true);
								if (color)
								{
									self._updateUI(color, true);
									self.paletteClick();
								}
							}, 30);
						}
						else
						{
							setTimeout(function()
							{
								if (self._colorAsText.hasClass('k-state-error'))
								{
									self._colorAsText.addClass('display-error')
								}
							}, 30);
						}
					});
				}

				if (this._colorAsText.val().indexOf("#") >= 0)
				{
					this._colorAsText.val(this._colorAsText.val().substr(1));

					if (self.options.treatWhiteAsTransparent)
					{
						if (self._colorAsText.val() === 'fffffe')
						{
							self._colorAsText.val('None');
							self._colorAsText.parents('.k-selected-color-display').addClass('no-border');
							$(".data-block-appearance-menu li.border").addClass('no-border');
						}
						else
						{
							self._colorAsText.parents('.k-selected-color-display').removeClass('no-border');
							$(".data-block-appearance-menu li.border").removeClass('no-border');
						}
					}
				}

				if (self.isDargInColoPicker || self.updateColorPicker)
				{
					return;
				}

				if (self._recentPaletteColor && self.element.find(".recentPalette").data("kendoColorPalette") && !self.dontChangeRecent)
				{
					var rebuildRecentColors = self.isHidden && !self.options.sticky;
					if (rebuildRecentColors)
					{
						rebuildRecentColors = false;
						if ($.cookie(self.options.cookieName) && JSON.parse($.cookie(self.options.cookieName)).colorArray)
						{
							var colorArray = JSON.parse($.cookie(self.options.cookieName)).colorArray;
							if (self._recentPaletteColor.length != colorArray.length)
							{
								self._recentPaletteColor = colorArray;
								rebuildRecentColors = true;
							}
						}
					}
					var colorStr = self._getHSV().s < 256 ? self._getHSV().toCss() : self.value(),
						index = self._recentPaletteColor.indexOf(colorStr),
						recentCount = self._recentPaletteColor.length,
						$previous = self.element.find(".image-previous"),
						$next = self.element.find(".image-next");
					self.element.find(".palette").data("kendoColorPalette").value(colorStr);
					if (index == -1 || rebuildRecentColors)
					{
						if (recentCount != Const.recentMaxColumns || rebuildRecentColors)
						{
							if (!self._recentScroll && recentCount >= Const.recentMaximumOfTileShow)
							{
								$previous.css("display", "block");
								$next.css("display", "block");
								self._recentScroll = true;
							}

							if (!rebuildRecentColors)
								self._recentPaletteColor.push(colorStr);

							if (self.options.treatWhiteAsTransparent)
							{
								self._recentPaletteColor = handleRecentPaletteColors(self._recentPaletteColor);
							}

							self.element.find(".recentPalette").data("kendoColorPalette").destroy();
							self.element.find(".recentPalette").html('')
							self.element.find(".recentPalette").kendoColorPalette({
								tileSize: {
									width: Const.recentTileWidth,
									height: Const.recentTileHeight
								},
								palette: self._recentPaletteColor,
								columns: Const.recentMaxColumns,
								change: function(e)
								{
									setTimeout(function()
									{
										self.wrapper.find("input.k-color-value").val(e.value)
										var color = kendo.parseColor(e.value, true);
										if (color)
										{
											self.dontChangeRecent = true;
											self._updateUI(color, true);
											self.paletteClick();
										}
									}, 10);
								}
							});
							recentCount = self._recentPaletteColor.length;
							self.element.find(".recentPalette .k-palette").css("width", recentCount * (Const.recentTileHeight + Const.recentTileSpaceWidth) + Const.recentTileSpaceWidth);
							if (self.options.sticky)
							{

							}
						}
						else
						{
							self.element.find(".recentPalette .k-palette .k-item").removeClass("k-state-selected");
							if (!self.options.sticky)
							{
								if (!$.cookie(self.options.cookieName))
								{
									setColorCookie(self.options.cookieName, null, [colorStr]);
								}
							}
							self.isHidden = false;
							self.dontChangeRecent = false;
							return;
						}
					}
					index = index == -1 ? recentCount - 1 : index;
					self.element.find(".recentPalette .k-palette .k-item").removeClass("k-state-selected");
					$(self.element.find(".recentPalette .k-palette .k-item")[index]).addClass("k-state-selected");
					var recentPalette = self.element.find(".recentPalette")[0],
						length = (Const.recentTileHeight + Const.recentTileSpaceWidth) * index,
						maxLength = recentPalette.scrollWidth - Const.recentWidth;
					if (self.isHidden)
					{
						length = 0;
					}
					if (recentCount > Const.recentMaximumOfTileShow)
					{
						changeOpacity(length, maxLength, $previous, $next);
					}
					recentPalette.scrollLeft = length;
					if (!self.options.sticky)
					{
						setColorCookie(self.options.cookieName, null, self._recentPaletteColor);
					}
				}
				else if (self.dontChangeRecent)
				{
					var colorStr = self._getHSV().s < 256 ? self._getHSV().toCss() : self.value();
					self.element.find(".palette").data("kendoColorPalette").value(colorStr);
				}

				if (self.options.treatWhiteAsTransparent)
				{
					self.element.addClass('replace-white-with-transparent');
				}

				self.isHidden = false;
				self.dontChangeRecent = false;
			}
		});

		KendoFlatColorPickerPrototype._hsvArea = KendoFlatColorPickerPrototype._hsvArea.createSequence(function()
		{
			var self = this;
			if (self.options.hack == false)
			{
				return;
			}
			if (self.options.extend)
			{
				if (!TF.isMobileDevice)
				{
					self.element.find(".close-color-picker").on("click", function()
					{
						self.close();
					});
				}
				else
				{
					self.element.find(".close-color-picker").hide();
					$("body").off(Const.recentScrollEnd + ".ColorPicker").on(Const.recentScrollEnd + ".ColorPicker", function()
					{
						if (self.isDargInColoPicker)
						{
							self.isDargInColoPicker = false;
							self._updateUI(self._getHSV(), true);
						}
					});
				}

				if (TF.isPhoneDevice)
				{
					Const.recentWidth = self.element.find(".color-header").width();
					Const.recentMaximumOfTileShow = Math.floor(Const.recentWidth / (Const.recentTileHeight + Const.recentTileSpaceWidth));
				}

				var paletteColorArray = [
					"#ffffff", "#000000", "#d6ecff", "#4e5b6f", "#7fd13b", "#ea157a", "#feb80a", "#00addc", "#738ac8", "#1ab39f",
					"#f2f2f2", "#7f7f7f", "#a7d6ff", "#d9dde4", "#e5f5d7", "#fad0e4", "#fef0cd", "#c5f2ff", "#e2e7f4", "#c9f7f1",
					"#d8d8d8", "#595959", "#60b5ff", "#b3bcca", "#cbecb0", "#f6a1c9", "#fee29c", "#8be6ff", "#c7d0e9", "#94efe3",
					"#bfbfbf", "#3f3f3f", "#007dea", "#8d9baf", "#b2e389", "#f272af", "#fed46b", "#51d9ff", "#aab8de", "#5fe7d5",
					"#a5a5a5", "#262626", "#003e75", "#3a4453", "#5ea226", "#af0f5b", "#c58c00", "#0081a5", "#425ea9", "#138677",
					"#7f7f7f", "#0c0c0c", "#00192e", "#272d37", "#3f6c19", "#750a3d", "#835d00", "#00566e", "#2c3f71", "#0c594f"
				];

				if (self.options.treatWhiteAsTransparent)
				{
					paletteColorArray[0] = "#fffffe";
				}

				self.element.find(".palette").kendoColorPalette({
					tileSize: {
						width: 22,
						height: 22
					},
					palette: paletteColorArray,
					change: function(e)
					{
						setTimeout(function()
						{
							self._colorAsText.val(e.value)
							var color = kendo.parseColor(e.value, true);
							if (color)
							{
								self._updateUI(color, true);
								self.paletteClick();
							}
						}, 10);
					}
				});

				if (self.options.sticky)
				{
					self.options.stickyName = self.options.stickyName || "colorhistory";
					self._recentPaletteColor = [];
					var p1 = Promise.resolve();
				}
				else
				{
					self.options.cookieName = self.options.cookieName || "colorhistory";

					if ($.cookie(self.options.cookieName) && JSON.parse($.cookie(self.options.cookieName)).colorArray)
					{
						self._recentPaletteColor = JSON.parse($.cookie(self.options.cookieName)).colorArray;
						var p1 = Promise.resolve(true);
					}
					else
					{
						self._recentPaletteColor = [];
						var p1 = Promise.resolve(true);
					}
				}

				p1.then(function()
				{
					self._recentPaletteColor = self._recentPaletteColor || [self.value()];
					if (!TF.isMobileDevice)
					{
						self.isHidden = true;
					}
					var preRecentPaletteColor = [];
					var colorNotChangeByOtherWay = false;
					$.each(self._recentPaletteColor, function(index, item)
					{
						if (item.indexOf("#") < 0)
						{
							self._recentPaletteColor[index] = "#" + self._recentPaletteColor[index];
						}
					});
					if (self._recentPaletteColor.length < Const.recentMaxColumns)
					{
						self._recentPaletteColor.map(function(item)
						{
							if (item == "#" + self.wrapper.find("input.k-color-value").val())
							{
								colorNotChangeByOtherWay = true;
							}
						});
						if (!colorNotChangeByOtherWay)
						{
							for (var i = 0; i < self._recentPaletteColor.length; i++)
							{
								preRecentPaletteColor.push(self._recentPaletteColor[i]);
							}
							self._recentPaletteColor = preRecentPaletteColor.concat(["#" + self.wrapper.find("input.k-color-value").val()]);
							if (self.options.sticky)
							{
							}
							else
							{
								setColorCookie(self.options.cookieName, null, self._recentPaletteColor);
							}
						}
					}

					if (self.options.treatWhiteAsTransparent)
					{
						self._recentPaletteColor = handleRecentPaletteColors(self._recentPaletteColor);
					}

					self.element.find(".recentPalette").kendoColorPalette({
						tileSize: {
							width: Const.recentTileWidth,
							height: Const.recentTileHeight
						},
						palette: self._recentPaletteColor,
						columns: Const.recentMaxColumns,
						change: function(e)
						{
							setTimeout(function()
							{
								self._colorAsText.val(e.value)
								var color = kendo.parseColor(e.value, true);
								if (color)
								{
									self.dontChangeRecent = true;
									self._updateUI(color, true);
									self.paletteClick();
								}
							}, 10);
						}
					});

					var recentCount = self._recentPaletteColor.length;
					self.element.find(".recentPalette .k-palette").css("width", recentCount * (Const.recentTileHeight + Const.recentTileSpaceWidth) + Const.recentTileSpaceWidth);
					var recentPalette = self.element.find(".recentPalette")[0],
						$previous = self.element.find(".image-previous"),
						$next = self.element.find(".image-next");
					if (recentCount <= Const.recentMaximumOfTileShow)
					{
						$previous.css("display", "none");
						$next.css("display", "none");
					}
					else
					{
						self._recentScroll = true;
					}

					var previousInterval, nextInterval;
					$previous.on("click", function()
					{
						var length = recentPalette.scrollLeft - (Const.recentTileHeight + Const.recentTileSpaceWidth), maxLength = recentPalette.scrollWidth - Const.recentWidth;
						changeOpacity(length, maxLength, $previous, $next);
						recentPalette.scrollLeft = length;
					})
						.on(Const.recentScrollStart, function()
						{
							previousInterval = setInterval(function()
							{
								var length = recentPalette.scrollLeft - (Const.recentTileHeight + Const.recentTileSpaceWidth), maxLength = recentPalette.scrollWidth - Const.recentWidth;
								changeOpacity(length, maxLength, $previous, $next);
								recentPalette.scrollLeft = length;
							}, 100)
						})
						.on(Const.recentScrollEnd, function()
						{
							clearInterval(previousInterval);
						})
						.on("mouseout", function()
						{
							clearInterval(previousInterval);
						});
					$next.on("click", function()
					{
						var length = recentPalette.scrollLeft + (Const.recentTileHeight + Const.recentTileSpaceWidth), maxLength = recentPalette.scrollWidth - Const.recentWidth;
						if (length >= maxLength)
						{
							length = maxLength;
						}
						changeOpacity(length, maxLength, $previous, $next);
						recentPalette.scrollLeft = length;
					})
						.on(Const.recentScrollStart, function()
						{
							nextInterval = setInterval(function()
							{
								var length = recentPalette.scrollLeft + (Const.recentTileHeight + Const.recentTileSpaceWidth), maxLength = recentPalette.scrollWidth - Const.recentWidth;
								if (length >= maxLength)
								{
									length = maxLength;
								}
								changeOpacity(length, maxLength, $previous, $next);
								recentPalette.scrollLeft = length;
							}, 100)
						})
						.on(Const.recentScrollEnd, function()
						{
							clearInterval(nextInterval);
						})
						.on("mouseout", function()
						{
							clearInterval(nextInterval);
						});
					self._hsvEvents._events.press[0] = self._hsvEvents._events.press[0].createInterceptor(function()
					{
						self.isDargInColoPicker = true;
					});
					self._hueSlider._events.slide[0] = self._hueSlider._events.slide[0].createInterceptor(function()
					{
						self.isDargInColoPicker = true;
					});
					if (TF.isMobileDevice)
					{
						self.element.find(".recentPalette").data("kendoColorPalette").value(self.value());
						self.element.find(".palette").data("kendoColorPalette").value(self.value());
					}
				});
			}
		});

		function changeOpacity(length, maxLength, $previous, $next)
		{
			if (length <= 0 || maxLength <= 0)
			{
				$previous.css("opacity", "0.3")
			}
			else
			{
				$previous.css("opacity", "0.7")
			}
			if (length >= maxLength)
			{
				$next.css("opacity", "0.3")
			}
			else
			{
				$next.css("opacity", "0.7")
			}
		};

		function setColorCookie(cookieName, activeColor, colorArray)
		{
			var colorCookie = {};
			if ($.cookie(cookieName))
			{
				colorCookie = JSON.parse($.cookie(cookieName));;
			}
			if (activeColor)
			{
				colorCookie.activeColor = activeColor;
			}
			if (colorArray)
			{
				colorCookie.colorArray = colorArray
			}
			$.cookie(cookieName, JSON.stringify(colorCookie));
		};

		function handleRecentPaletteColors(colors)
		{
			colors = colors.map(function(color)
			{
				return color.toLowerCase() === "#none" ? "#fffffe" : color;
			});

			var recentPaletteColorArray = [];
			colors.forEach(function(color)
			{
				if (recentPaletteColorArray.indexOf(color) == -1)
				{
					recentPaletteColorArray.push(color);
				}
			});

			return recentPaletteColorArray;
		}

		KendoFlatColorPickerPrototype._selectOnHide = KendoFlatColorPickerPrototype._selectOnHide.createSequence(function()
		{
			var self = this;
			if (self.options.hack == false)
			{
				return;
			}
			$("body").off(Const.recentScrollEnd + ".ColorPicker");
			if (!TF.isMobileDevice)
			{
				self.isHidden = true;
				self.updateColorPicker = true;
				self._updateUI(self._getHSV(), true);
				self.updateColorPicker = false;
			}
			if (!self.options.sticky)
			{
				var colorStr = self._getHSV().s < 256 ? self._getHSV().toCss() : self.value();
				setColorCookie(self.options.cookieName, colorStr, null);
			}
		});

		KendoColorPickerPrototype._getPopup = KendoColorPickerPrototype._getPopup.createSequence(function()
		{
			if (this.options.hack == false)
			{
				return;
			}
			var self = this, colorPicker = self._popup.element.data("kendoColorPicker");
			if (colorPicker)
			{
				colorPicker.close = function()
				{
					self.close();
				};
				$("body").on(Const.recentScrollEnd + ".ColorPicker", function()
				{
					if (colorPicker.isDargInColoPicker)
					{
						colorPicker.isDargInColoPicker = false;
						colorPicker._updateUI(colorPicker._getHSV(), true);
					}
				});
			}
		});

		KendoDropDownListPrototype._keydown = KendoDropDownListPrototype._keydown.createSequence(function(e)
		{
			if (this.options.hack == false)
			{
				return;
			}

			e.stopPropagation();

			if (e.keyCode === $.ui.keyCode.LEFT ||
				e.keyCode === $.ui.keyCode.RIGHT ||
				e.keyCode === $.ui.keyCode.UP ||
				e.keyCode === $.ui.keyCode.DOWN)
			{
				this.listView.element.find('.k-state-hover').removeClass('k-state-hover');
			}
		});

		/**
		 * The event of color blocks which are in Swatch palette and Recent Colors palette click
		 * @return {void}
		 */
		KendoFlatColorPickerPrototype.paletteClick = function()
		{
		};

		KendoUploadPrototype._onInputChange = KendoUploadPrototype._onInputChange.createInterceptor(function()
		{
			this._module.postFormData = function(url, data, fileEntry, xhr)
			{
				var module = this;
				fileEntry.data('request', xhr);
				xhr.addEventListener('load', function(e)
				{
					module.onRequestSuccess.call(module, e, fileEntry);
				}, false);
				xhr.addEventListener('error', function(e)
				{
					module.onRequestError.call(module, e, fileEntry);
				}, false);
				xhr.upload.addEventListener('progress', function(e)
				{
					module.onRequestProgress.call(module, e, fileEntry);
				}, false);
				xhr.open('POST', url, true);
				xhr.withCredentials = this.upload.options.async.withCredentials;
				var accept = this.upload.options.async.accept;
				if (accept)
				{
					xhr.setRequestHeader('Accept', accept);
				}
				var token = this.upload.options.async.token;
				if (token)
				{
					xhr.setRequestHeader('Token', token);
				}
				xhr.send(data);
			}
		});

		kendo.ui.TreeView.prototype._keypress = kendo.ui.TreeView.prototype._keypress.createInterceptor(function(e)
		{
			var that = this;
			var delay = 300;
			var focusedNode = that.current().get(0);
			var matchToFocus;
			var key = e.key;
			var isPrintable = key.length === 1;
			if (!isPrintable)
			{
				return;
			}
			if (!that._match)
			{
				that._match = '';
			}
			that._match += key;
			clearTimeout(that._matchTimer);
			that._matchTimer = setTimeout(function()
			{
				that._match = '';
			}, delay);
			matchToFocus = focusedNode && that._matchNextByText(Array.prototype.indexOf.call(that.element.find('.k-item'), focusedNode), that._match);
			if (!matchToFocus.length)
			{
				matchToFocus = that._matchNextByText(-1, that._match);
			}
			if (matchToFocus.get(0))
			{
				that._trigger('navigate', matchToFocus);
				if (matchToFocus.get(0) !== focusedNode)
				{
					that.current(matchToFocus);
				}
			}
		});

		kendo.ui.TreeView.prototype.toggle = kendo.ui.TreeView.prototype.toggle.createInterceptor(function(node, expand)
		{
			if ($(node[0]).attr('suspend') === 'true')
			{
				$(node[0]).attr('suspend', 'false');
				return false;
			}
			return true;
		});


		kendo.effects.promise = kendo.effects.promise.createInterceptor(function(element, options)
		{
			if ($('#routingtreeview').length > 0 &&
				$('#routingtreeview').data('kendoTreeView') &&
				$('#routingtreeview').data('kendoTreeView').dataItem(element[0]) &&
				$('#routingtreeview').data('kendoTreeView').dataItem(element[0]).customData.isTrip)
			{
				options.completeCallback = options.completeCallback.createSequence(function()
				{
					if (options.effects.expand != undefined && options.effects.expand.direction === 'vertical' && options.reverse)
					{
						$($(element)[0]).css('overflow', 'auto');
					}
				});
			}
		});

		kendo.ui.TreeView.prototype.append = function(nodeData, parentNode, success, expand)
		{
			function subGroup(node)
			{
				var result = node.children(".k-animation-container");

				if (!result.length)
				{
					result = node;
				}

				return result.children('.k-group');
			};
			var that = this;
			var group = that.root;
			if (parentNode && nodeData instanceof jQuery && parentNode[0] === nodeData[0])
			{
				return;
			}
			parentNode = parentNode && parentNode.length ? parentNode : null;
			if (parentNode)
			{
				group = subGroup(parentNode);
			}
			return that._dataSourceMove(nodeData, group, parentNode, function(dataSource, model, loadModel)
			{
				var inserted;
				function add()
				{
					if (parentNode)
					{
						that._expanded(parentNode, true, true);
					}
					var data = dataSource.data(), index = Math.max(data.length, 0);
					return that._insert(data, model, index);
				}
				loadModel.done(function()
				{
					inserted = add();
					success = success || $.noop;
					success(inserted);
				});
				return inserted || null;
			});
		};

		kendo.ui.Popup.prototype._resize = kendo.ui.Popup.prototype._resize.createInterceptor(function(e)
		{
			if (this && this.element && this.element.length && this.element[0])
			{
				var kendoRole = this.element[0].getAttribute("data-kendo-role");
				if (kendoRole && kendoRole == "colorpicker") return false;
			}
			return true;
		});

		kendo.ui.FilterMenu.fn._createForm = kendo.ui.FilterMenu.fn._createForm.createInterceptor(function(role)
		{
			var that = this, options = that.options, operators = that.operators || {}, type;
			if (that.options && that.options.dataSource && that.options.dataSource.options && Array.isArray(that.options.dataSource.options.fields))
			{
				var field = that.options.dataSource.options.fields.find(i => i.FieldName == that.field);
				if (field)
				{
					type = field.type;
				}
			}

			type = type || that.type;
			operators = operators[type] || options.operators[type];
			if (type === "date") 
			{
				operators.wi = "Is Within";
			}
		});

		kendo.ui.FilterMenu.fn._createForm = kendo.ui.FilterMenu.fn._createForm.createSequence(function(role)
		{
			var that = this, options = that.options, operators = that.operators || {}, type;
			if (that.options && that.options.dataSource && that.options.dataSource.options && Array.isArray(that.options.dataSource.options.fields))
			{
				var field = that.options.dataSource.options.fields.find(i => i.FieldName == that.field);
				if (field)
				{
					type = field.type;
				}
			}

			type = type || that.type;
			operators = operators[type] || options.operators[type];
			if (type === "date") 
			{
				delete operators.wi;
			}

			that.form.attr("fieldName", that.field);
		});

		TF.override ? TF.override(kendo.data.HierarchicalDataSource,
			function()
			{
				var result = [];
				function getAllById(data, id, fn)
				{
					for (var i = 0; i < data.length; i++)
					{
						if (data[i].id == id && (!fn || fn(data[i])))
						{
							result.push(data[i]);
						}
						if (data[i].children &&
							data[i].children._data &&
							data[i].children._data.length > 0)
						{
							getAllById(data[i].children._data, id, fn);
						}
						if (data[i].children &&
							data[i].children.options &&
							data[i].children.options.data &&
							data[i].children.options.data.items)
						{
							getAllById(data[i].children.options.data.items, id, fn);
						}
						if (data[i].items &&
							data[i].items.length > 0)
						{
							getAllById(data[i].items, id, fn);
						}
					}
				}
				function getFirstById(data, id, fn)
				{
					var node = null;
					for (var i = 0; i < data.length; i++)
					{
						if (data[i].children._data)
						{
							if (node == null) node = getFirstById(data[i].children._data, id, fn);
						}
						if (data[i].id == id && (!fn || fn(data[i])))
						{
							node = data[i];
							break;
						}
					}
					return node;
				}
				return {
					getAll: function(id, fn)
					{
						result = [];
						getAllById(this._data, id, fn);
						return result;
					},
					getFirst: function(id, fn)
					{
						return getFirstById(this._data, id, fn);
					}
				}
			}()) : null;

		var oldKendoGrid = $.fn.kendoGrid;
		$.fn.kendoGrid = function(options)
		{
			if (options && options.columns)
			{
				options.columns.filter((c) => c.type === "string" && !c.parse).forEach(function(c)
				{
					c.parse = kendoStringTypeParser;
				});
			}

			var grid = oldKendoGrid.apply(this, arguments);
			if (options.hideScrollNotOverflow)
			{
				var $gridContent = $(this).find(".k-grid-content");
				$gridContent.css({
					"overflow-y": "auto"
				});

				if ($gridContent[0].clientHeight == $gridContent[0].scrollHeight)
				{
					$(this).find(".k-grid-header").css({
						"padding-right": 0
					});
				}
			}
			return grid;
		};

		kendo.ui.editor.InlineFormatter.prototype.consolidate = function(nodes)
		{
			var node, last;
			while (nodes.length > 1)
			{
				node = nodes.pop();
				last = nodes[nodes.length - 1];

				if (node.previousSibling && node.previousSibling.className == "k-marker")
				{
					last.appendChild(node.previousSibling);
				}

				if (node.tagName == last.tagName
					&& node.previousSibling == last
					&& node.style.cssText == last.style.cssText
					&& !node.hasAttribute("data-field")
					&& !last.hasAttribute("data-field")
					&& node.className === last.className)
				{
					while (node.firstChild)
					{
						last.appendChild(node.firstChild);
					}
					$(node).remove();
				}
			}
		};

		kendo.ui.editor.RestorePoint.prototype.index = function(node)
		{
			var result = 0;
			while (node = node.previousSibling)
			{
				result++;
			}

			return result;
		};

		kendo.ui.editor.RestorePoint.prototype.offset = function(node, value)
		{
			return value;
		};

		kendo.ui.editor.RestorePoint.prototype.toRangePoint = function(range, start, path, offset)
		{
			var node = this.rootNode,
				length = path.length;

			while (length-- && node)
			{
				node = node.childNodes[path[length]];
			}

			if (!node)
			{
				return;
			}

			if (node.nodeName == "#text")
			{
				offset = Math.min(offset, node.nodeValue.length);
			}

			if (offset >= 0)
			{
				range[start ? 'setStart' : 'setEnd'](node, offset);
			}
		};

		kendo.ui.editor.Serializer.toEditableHtml = function(html)
		{
			var br = '<br class="k-br">';

			html = html || "";

			return html
				.replace(/<!\[CDATA\[(.*)?\]\]>/g, "<!--[CDATA[$1]]-->")
				.replace(/<script([^>]*)>(.*)?<\/script>/ig, "<k:script$1>$2<\/k:script>")
				.replace(/^<(table|blockquote)/i, br + '<$1')
				.replace(/^[\s]*(&nbsp;|\u00a0)/i, '$1')
				.replace(/<\/(table|blockquote)>$/i, '</$1>' + br);
		};

		kendo.ui.editor.Serializer.htmlToDom = function(html, root, options)
		{
			var browser = kendo.support.browser;
			var msie = browser.msie;
			var o = options || {};
			var immutables = o.immutables;
			html = this.toEditableHtml(html);
			if (isFunction(o.custom))
			{
				html = o.custom(html) || html;
			}
			root.innerHTML = html;
			if (immutables)
			{
				immutables.deserialize(root);
			}
			if (msie)
			{
				kendo.ui.editor.Dom.normalize(root);
				this._resetOrderedLists(root);
			}
			this._fillEmptyElements(root);
			this._removeSystemElements(root);
			this._toEditableImmutables(root);
			$('table', root).addClass('k-table');
			return root;
		};

		kendo.ui.Upload.prototype.selectFiles = function(files)
		{
			var that = this;
			var droppedFiles = files;
			var guidfiles = assignGuidToFiles(getAllFileInfo(droppedFiles), that._isAsyncNonBatch());

			if (droppedFiles.length > 0 && !that.wrapper.hasClass("k-state-disabled"))
			{
				if (!that.multiple && guidfiles.length > 1)
				{
					guidfiles.splice(1, guidfiles.length - 1);
				}

				var prevented = that.trigger("select", { files: guidfiles });
				if (!prevented)
				{
					that._module.onSelect({ target: $(".k-dropzone", that.wrapper) }, guidfiles);
				}
			}
		};

		function getFileExtension(fileName)
		{
			var matches = fileName.match(/\.([^\.]+)$/);
			return matches ? matches[0] : "";
		}

		function getFileInfo(rawFile)
		{
			// Older Firefox versions (before 3.6) use fileName and fileSize
			var fileName = rawFile.name || rawFile.fileName;
			return {
				name: kendo.htmlEncode(fileName),
				extension: getFileExtension(fileName),
				size: rawFile.size || rawFile.fileSize,
				rawFile: rawFile
			};
		}

		function getAllFileInfo(rawFiles)
		{
			return $.map(rawFiles, function(file)
			{
				return getFileInfo(file);
			});
		}

		function assignGuidToFiles(files, unique)
		{
			var uid = kendo.guid();

			return $.map(files, function(file)
			{
				file.uid = unique ? kendo.guid() : uid;

				return file;
			});
		}


		var registerTool = kendo.ui.editor.EditorUtils.registerTool,
			registerFormat = kendo.ui.editor.EditorUtils.registerFormat;

		registerFormat("bold", [{ tags: ["span"], attr: { style: { fontWeight: "bold" } } }, { tags: ["strong", "b"] }]);
		registerTool("bold", new kendo.ui.editor.InlineFormatTool({ key: "B", ctrl: true, format: kendo.ui.Editor.fn.options.formats.bold, template: new kendo.ui.editor.ToolTemplate({ template: kendo.ui.editor.EditorUtils.buttonTemplate, title: "Bold" }) }));

		registerFormat("italic", [{ tags: ["span"], attr: { style: { fontStyle: "italic" } } }, { tags: ["em", "i"] }]);
		registerTool("italic", new kendo.ui.editor.InlineFormatTool({ key: "I", ctrl: true, format: kendo.ui.Editor.fn.options.formats.italic, template: new kendo.ui.editor.ToolTemplate({ template: kendo.ui.editor.EditorUtils.buttonTemplate, title: "Italic" }) }));

		function getContentEditbableAttr(element)
		{
			var value = $(element).attr("contenteditable");
			if (value === "" || value == null)
			{
				return null;
			}

			var value = value.toLowerCase();
			if (value === "true")
			{
				return true;
			}

			if (value === "false")
			{
				return false;
			}

			return null;
		}

		var handleBackspace = kendo.ui.editor.BackspaceHandler.prototype._handleBackspace;
		kendo.ui.editor.BackspaceHandler.prototype._handleBackspace = function(range)
		{
			if (!range.collapsed || range.startOffset !== 0)
			{
				return handleBackspace.call(this, range);
			}

			var node = $(range.startContainer);
			var removeUneditablePrev = function(node)
			{
				var prev = node.prev();
				if (prev.length)
				{
					if (getContentEditbableAttr(prev) !== false)
					{
						return false;
					}

					prev.remove();
					return true;
				}

				var parent = node.parent();
				if (!parent.length || node === parent)
				{
					return false;
				}

				return removeUneditablePrev(node.parent());
			};

			if (removeUneditablePrev(node))
			{
				return true;
			}

			return handleBackspace.call(this, range);
		};

		/* To fix RW-10007, prevent scroll when focus selected tab.
			Code is copied from kendo.all.js and add code to get preventScroll from options.
			For existing code, options.preventScroll is not set which means the default value is false, so this is not a breaking change.
			Changes:
				1. Add kendo.ui namespace to Widget.
				2. Add { preventScroll: options.preventScroll } to wr.focus();
		*/
		if (kendo.ui.TabStrip)
		{
			var tabStrip = (function()
			{
				return kendo.ui.TabStrip.extend({
					_itemClick: function(e)
					{
						var that = this, wr = that.wrapper[0];
						if (wr !== document.activeElement)
						{
							var msie = kendo.support.browser.msie,
								preventScroll = !!that.options.preventScroll;
							if (msie)
							{
								try
								{
									wr.setActive();
								} catch (j)
								{
									wr.focus({ preventScroll: preventScroll });
								}
							} else
							{
								wr.focus({ preventScroll: preventScroll });
							}
						}
						if (that._click($(e.currentTarget)))
						{
							e.preventDefault();
						}
					}
				});
			})();
			kendo.ui.plugin(tabStrip);
		}
	}

	TF.smartOverride(kendo.ui.VirtualList.prototype, "_prefetchByValue", function(origin)
	{
		arguments = Array.from(arguments);
		arguments.splice(0, 1);
		try
		{
			origin.apply(this, arguments);
		}
		catch (ex)
		{
			this._values = [];
			this._selectedIndexes = [];
			this._selectedDataItems = [];
			this.select([-1]);
		}
	});

	kendo.ui.Grid.prototype.reorderColumn = function(destIndex, column, before, isRunChild)
	{
		var that = this;
		if (!isRunChild)
		{
			if (!column)
			{
				return;
			}
			var childColumns = that.columns.filter(function(co, index)
			{
				return co.ParentField === column.FieldName;
			});
			if (childColumns && childColumns.length > 0)
			{
				return;
			}
		}

		// Check if the dest index inside parent and child field
		if (destIndex !== 1 && destIndex !== that.columns.filter(function(column) { return column.hidden === false }).length)
		{
			var sourceIndex = $.inArray(column, that.columns);
			if (sourceIndex > destIndex)
			{
				if (that.columns[destIndex] && !!that.columns[destIndex].ParentField && that.columns[destIndex].FieldName !== column.FieldName)
				{
					return;
				}
			}
			else
			{
				if (that.columns[destIndex + 1] && !!that.columns[destIndex + 1].ParentField && that.columns[destIndex + 1].FieldName !== column.FieldName)
				{
					return;
				}
			}
		}

		var parent = columnParent(column, that.columns), columns = parent ? parent.columns : that.columns, sourceIndex = $.inArray(column, columns), destColumn = columns[destIndex], lockChanged, isLocked = !!destColumn.locked, lockedCount = lockedColumns(that.columns).length, groupHeaderColumnTemplateColumns = $.grep(leafColumns(that.columns), function(column)
		{
			return column.groupHeaderColumnTemplate;
		});
		if (sourceIndex === destIndex)
		{
			return;
		}
		if (!column.locked && isLocked && nonLockedColumns(that.columns).length == 1)
		{
			return;
		}
		if (column.locked && !isLocked && lockedCount == 1)
		{
			return;
		}
		that._hideResizeHandle();
		if (before === undefined)
		{
			before = destIndex < sourceIndex;
		}
		var sourceColumns = [column];

		that._reorderHeader(sourceColumns, destColumn, before);
		if (that.lockedHeader)
		{
			removeEmptyRows(that.thead);
			removeEmptyRows(that.lockedHeader);
		}
		if (destColumn.columns)
		{
			destColumn = leafColumns(destColumn.columns);
			destColumn = destColumn[before ? 0 : destColumn.length - 1];
		}
		if (column.columns)
		{
			sourceColumns = leafColumns(column.columns);
		}
		that._reorderContent(sourceColumns, destColumn, before);
		lockChanged = !!column.locked;
		lockChanged = lockChanged != isLocked;
		column.locked = isLocked;
		columns.splice(before ? destIndex : destIndex + 1, 0, column);
		columns.splice(sourceIndex < destIndex ? sourceIndex : sourceIndex + 1, 1);
		that._updateLockedCols();
		that._updateCols();
		that._templates();
		that._updateColumnCellIndex();
		that._updateColumnSorters();
		if (groupHeaderColumnTemplateColumns.length > 0)
		{
			that._renderGroupRows();
		}
		that._updateTablesWidth();
		that._applyLockedContainersWidth();
		that._syncLockedHeaderHeight();
		that._syncLockedContentHeight();
		that._updateFirstColumnClass();
		if (!lockChanged)
		{
			return;
		}
		if (isLocked)
		{
			that.trigger("columnLock", { column: column });
		} else
		{
			that.trigger("columnUnlock", { column: column });
		}


		function columnParent(column, columns)
		{
			var parents = [];
			columnParents(column, columns, parents);
			return parents[parents.length - 1];
		}

		function columnParents(column, columns, parents)
		{
			parents = parents || [];
			for (var idx = 0; idx < columns.length; idx++)
			{
				if (column === columns[idx])
				{
					return true;
				} else if (columns[idx].columns)
				{
					var inserted = parents.length;
					parents.push(columns[idx]);
					if (!columnParents(column, columns[idx].columns, parents))
					{
						parents.splice(inserted, parents.length - inserted);
					} else
					{
						return true;
					}
				}
			}
			return false;
		}

		function nonLockedColumns(columns)
		{
			return $.grep(columns, function(column)
			{
				return !column.locked;
			});
		}

		function removeEmptyRows(container)
		{
			var rows = container.find('tr:not(.k-filter-row)');
			var emptyRowsCount = rows.filter(function()
			{
				return !$(this).children().length;
			}).remove().length;
			var cells = rows.find('th:not(.k-group-cell,.k-hierarchy-cell)');
			for (var idx = 0; idx < cells.length; idx++)
			{
				if (cells[idx].rowSpan > 1)
				{
					cells[idx].rowSpan -= emptyRowsCount;
				}
			}
			return rows.length - emptyRowsCount;
		}

		function leafColumns(columns)
		{
			var result = [];
			for (var idx = 0; idx < columns.length; idx++)
			{
				if (!columns[idx].columns)
				{
					result.push(columns[idx]);
					continue;
				}
				result = result.concat(leafColumns(columns[idx].columns));
			}
			return result;
		}

		function lockedColumns(columns)
		{
			return $.grep(columns, function(column)
			{
				return column.locked;
			});
		}
	};

	kendo.ui.Reorderable.prototype._dropTargetAllowed = function(dropTarget)
	{
		var inSameContainer = this.options.inSameContainer, dragOverContainers = this.options.dragOverContainers, draggable = this._draggable;
		if (draggable[0] === dropTarget[0])
		{
			return false;
		}
		if (!inSameContainer || !dragOverContainers)
		{
			return true;
		}
		var allColumns = this._elements.closest(".kendo-grid").data("kendoGrid").columns;
		var allChildColumns = allColumns.filter(function(column)
		{
			return !!column.ParentField;
		});
		var allParentColumns = [];
		if (allChildColumns && allChildColumns.length > 0)
		{
			allParentColumns = allChildColumns.map(function(column)
			{
				return column.ParentField;
			});
			allChildColumns = allChildColumns.map(function(column)
			{
				return column.FieldName;
			});
			var targetItemName = dropTarget[0].getAttribute('data-kendo-field'), sourceIndex = this._index(draggable), targetIndex = this._index(dropTarget);
			if (allParentColumns.indexOf(targetItemName) > -1 && sourceIndex < targetIndex)
			{
				return false;
			}
			if (allChildColumns.indexOf(targetItemName) > -1 && sourceIndex > targetIndex)
			{
				return false;
			}
		}
		if (inSameContainer({
			source: draggable,
			target: dropTarget,
			sourceIndex: this._index(draggable),
			targetIndex: this._index(dropTarget)
		}))
		{
			return true;
		}
		return dragOverContainers(this._index(draggable), this._index(dropTarget));
	};

	kendo.ui.VirtualScrollable.prototype.repaintScrollbar = function(shouldScrollWrapper)
	{
		var that = this,
			html = '',
			maxHeight = that.options.maxScrollHeight,
			dataSource = that.dataSource,
			scrollbar = !kendo.support.kineticScrollNeeded ? kendo.support.scrollbar() : 0,
			wrapperElement = that.wrapper[0],
			totalHeight, idx, itemHeight;
		var wasScrolledToBottom = that._isScrolledToBottom();
		itemHeight = that.itemHeight = that.options.itemHeight() || 0;
		var addScrollBarHeight = wrapperElement.scrollWidth > wrapperElement.offsetWidth ? scrollbar : 0;
		totalHeight = (dataSource._isGroupPaged() ? dataSource.groupsTotal(true) : dataSource.total()) * itemHeight + addScrollBarHeight;
		var lightKendoGrid = $(that.element).closest(".kendo-grid").data("lightKendoGrid");

		if (lightKendoGrid && lightKendoGrid.lightKendoGridDetail)
		{
			for (var key in lightKendoGrid.lightKendoGridDetail.detailDomMap)
			{
				totalHeight += lightKendoGrid.lightKendoGridDetail.detailDomMap[key].show ? lightKendoGrid.lightKendoGridDetail.detailDomMap[key].height : 0;
			}
		}

		for (idx = 0; idx < Math.floor(totalHeight / maxHeight); idx++)
		{
			html += '<div style="width:1px;height:' + maxHeight + 'px"></div>';
		}

		if (totalHeight % maxHeight)
		{
			html += '<div style="width:1px;height:' + totalHeight % maxHeight + 'px"></div>';
		}
		that.verticalScrollbar.html(html);

		if (wasScrolledToBottom && !that._isScrolledToBottom() && !that.dataSource._isGroupPaged())
		{
			that.scrollToBottom();
		}

		if (typeof that._scrollTop !== 'undefined' && !!shouldScrollWrapper)
		{
			wrapperElement.scrollTop = that._scrollTop;
			that._scrollWrapperOnColumnResize();
		}
	};

	kendo.ui.VirtualScrollable.prototype._scroll = function(e)
	{
		var that = this,
			delayLoading = !that.options.prefetch,
			scrollTop = e.currentTarget.scrollTop,
			dataSource = that.dataSource,
			rowHeight = that.itemHeight,
			skip = dataSource.skip() || 0,
			start = that._rangeStart || skip,
			height = that.element.innerHeight(),
			isScrollingUp = !!(that._scrollbarTop && that._scrollbarTop > scrollTop),
			firstItemIndex = Math.max(Math.floor(scrollTop / rowHeight), 0),
			lastItemOffset = isScrollingUp ? Math.ceil(height / rowHeight) : Math.floor(height / rowHeight),
			lastItemIndex = Math.max(firstItemIndex + lastItemOffset, 0),
			SCROLL = 'scroll';
		if (that._preventScroll)
		{
			that._preventScroll = false;
			return;
		}
		that._prevScrollTop = that._scrollTop;
		that._scrollTop = scrollTop - start * rowHeight;
		that._scrollbarTop = scrollTop;
		that._scrolling = delayLoading;

		var lightKendoGrid = $(that.element).closest(".kendo-grid").data("lightKendoGrid");
		if (lightKendoGrid && lightKendoGrid.lightKendoGridDetail)
		{
			var totalHeight = 0;
			firstItemIndex = -1;
			lastItemIndex = -1;
			var topHeight = 0;
			lightKendoGrid.obAllIds().forEach(function(id, index)
			{
				totalHeight += rowHeight;
				if (lightKendoGrid.lightKendoGridDetail.detailDomMap[id])
				{
					totalHeight += lightKendoGrid.lightKendoGridDetail.detailDomMap[id].show ? lightKendoGrid.lightKendoGridDetail.detailDomMap[id].height : 0;
				}
				if (totalHeight > scrollTop && firstItemIndex == -1)
				{
					firstItemIndex = index;

				}
				if (totalHeight > (scrollTop + height) && lastItemIndex == -1)
				{
					lastItemIndex = index;
				}
				if (index < start)
				{
					topHeight = totalHeight;
				}
			});
			firstItemIndex = Math.max(firstItemIndex, 0);
			lastItemIndex = Math.max(lastItemIndex, 0);
			that._scrollTop = scrollTop - topHeight;
		}

		if (!that._fetch(firstItemIndex, lastItemIndex, isScrollingUp))
		{
			that.wrapper[0].scrollTop = that._scrollTop;
		}
		that.trigger(SCROLL);
		if (delayLoading)
		{
			if (that._scrollingTimeout)
			{
				clearTimeout(that._scrollingTimeout);
			}
			that._scrollingTimeout = setTimeout(function()
			{
				that._scrolling = false;
				that._page(that._rangeStart, that.dataSource.take());
			}, 100);
		}

	};

	kendo.ui.VirtualScrollable.prototype._fetch = function(firstItemIndex, lastItemIndex, scrollingUp)
	{
		var that = this,
			dataSource = that.dataSource,
			itemHeight = that.itemHeight,
			take = dataSource.take(),
			rangeStart = that._rangeStart || dataSource.skip() || 0,
			currentSkip = Math.floor(firstItemIndex / take) * take,
			fetching = false,
			prefetchAt = 0.19; //adjust prefetch factor from 0.33 to 0.19.
		var scrollbar = that.verticalScrollbar;
		var webkitCorrection = kendo.support.browser.webkit ? 1 : 0;
		var total = dataSource._isGroupPaged() ? dataSource.groupsTotal(true) : dataSource.total();
		if (firstItemIndex < rangeStart)
		{
			fetching = true;
			rangeStart = Math.max(0, lastItemIndex - take);
			that._scrollTop = scrollbar.scrollTop() - rangeStart * itemHeight;
			that._page(rangeStart, take);
		} else if (lastItemIndex >= rangeStart + take && !scrollingUp)
		{
			fetching = true;
			rangeStart = Math.min(firstItemIndex, total - take);
			if (scrollbar.scrollTop() >= scrollbar[0].scrollHeight - scrollbar[0].offsetHeight - webkitCorrection)
			{
				that._scrollTop = that.wrapper[0].scrollHeight - that.wrapper[0].offsetHeight;
			} else if (that.dataSource._isGroupPaged() && firstItemIndex >= total - take)
			{
				that._scrollTop = that.wrapper[0].scrollHeight - that.wrapper[0].offsetHeight - (that._scrollTop - that._prevScrollTop);
			} else
			{
				that._scrollTop = itemHeight;
			}
			that._page(rangeStart, take);
		} else if (!that._fetching && that.options.prefetch)
		{
			if (firstItemIndex < currentSkip + take - take * prefetchAt && firstItemIndex > take)
			{
				dataSource.prefetch(currentSkip - take, take, $.noop, true);
			}
			if (lastItemIndex > currentSkip + take * prefetchAt)
			{
				dataSource.prefetch(currentSkip + take, take, $.noop, true);
			}
		}
		return fetching;
	};

	kendo.data.DataSource.prototype.prefetch = function(skip, take, callback, disableOverlay)
	{
		var that = this, size = Math.min(skip + take, that.total()), options = {
			take: take,
			skip: skip,
			page: skip / take + 1,
			pageSize: take,
			sort: that._sort,
			filter: that._filter,
			group: that._group,
			aggregate: that._aggregate,
			disableOverlay: disableOverlay
		};
		if (that._isGroupPaged() && !that._isServerGrouped() && that._groupRangeExists(skip, size))
		{
			if (callback)
			{
				callback();
			}
			return;
		}
		if (that._isServerGroupPaged() && !that._groupRangeExists(skip, size) || !that._rangeExists(skip, size))
		{
			clearTimeout(that._timeout);
			that._timeout = setTimeout(function()
			{
				that._queueRequest(options, function()
				{
					if (!that.trigger('requestStart', { type: 'read' }))
					{
						if (that._omitPrefetch)
						{
							that.trigger('progress');
						}
						that.transport.read({
							data: that._params(options),
							success: that._prefetchSuccessHandler(skip, size, callback),
							error: function()
							{
								var args = slice.call(arguments);
								that.error.apply(that, args);
							}
						});
					} else
					{
						that._dequeueRequest();
					}
				});
			}, 100);
		} else if (callback)
		{
			callback();
		}
	};

	$.fn.bootstrapValidator.validators.regexp.validate = function(validator, $field, options)
	{
		var value = $field.val();
		if (value === '')
		{
			return true;
		}

		var regexp = ('string' === typeof options.regexp) ? new RegExp(options.regexp) : options.regexp;
		return options.revertTest ? (!regexp.test(value)) : regexp.test(value);
	}
	kendo.ui.Grid.prototype._clipboard = function()
	{
		const NS = '.kendoGrid', NAVROW = 'tr:not(.k-footer-template):visible', NAVCELL = ':not(.k-group-cell):not(.k-detail-cell):not(.k-hierarchy-cell):visible', proxy = $.proxy;
		var options = this.options;
		var selectable = options.selectable;
		if (selectable && options.allowCopy)
		{
			var grid = this;
			if (!options.navigatable)
			{
				grid.table.add(grid.lockedTable).attr('tabindex', 0).on('mousedown' + NS + ' keydown' + NS, '.k-detail-cell', function(e)
				{
					if (e.target !== e.currentTarget)
					{
						e.stopImmediatePropagation();
					}
				}).on('mousedown' + NS, NAVROW + '>' + NAVCELL, proxy(tableClick, grid));
			}
			grid.copyHandler = proxy(grid.copySelection, grid);
			grid.updateClipBoardState = function()
			{
				if (grid.areaClipBoard)
				{
					grid.areaClipBoard.val(grid.getTSV()).focus().select();
				}
			};
			grid.bind('change', grid.updateClipBoardState);
			grid.wrapper.on('keydown', grid.copyHandler);
			grid.clearAreaHandler = proxy(grid.clearArea, grid);
			grid.wrapper.on('keyup', grid.clearAreaHandler);
		}
	}
	kendo.ui.NumericTextBox.prototype._inputHandler = function()
	{
		const POINT = '.', kendo = window.kendo, caret = kendo.caret;
		var that = this;
		var element = that.element;
		var value = element.val();
		var min = that.options.min;
		var numberFormat = that._format(that.options.format);
		var decimalSeparator = numberFormat[POINT];
		var minInvalid = (min !== null && min >= 0 && value.charAt(0) === '-');
		if (that._numPadDot && decimalSeparator !== POINT)
		{
			value = value.replace(POINT, decimalSeparator);
			that.element.val(value);
			that._numPadDot = false;
		}
		// error when past alpha, copy it from kendo source code v2013.1.716
		if (that._isPasted && that._parse(value))
		{
			value = that._parse(value).toString().replace(POINT, numberFormat[POINT]);
		}
		if (that._numericRegex(numberFormat).test(value) && !minInvalid)
		{
			that._oldText = value;
		} else
		{
			that._blinkInvalidState();
			that.element.val(that._oldText);
			if (that._cachedCaret)
			{
				caret(element, that._cachedCaret[0]);
				that._cachedCaret = null;
			}
		}
		that._isPasted = false;
	}

	function isInputElement(element)
	{
		return $(element).is(':button,a,:input,a>.k-icon,textarea,span.k-select,span.k-icon,span.k-link,label.k-checkbox-label,.k-input,.k-multiselect-wrap,.k-picker-wrap,.k-picker-wrap>.k-selected-color,.k-tool-icon,.k-dropdown');
	}

	function focusTable(table, direct)
	{
		if (direct === true)
		{
			table = $(table);
			var scrollLeft = kendo.scrollLeft(table.parent());
			kendo.focusElement(table);
			kendo.scrollLeft(table.parent(), scrollLeft);
		} else
		{
			$(table).one('focusin', function(e)
			{
				e.preventDefault();
			}).focus();
		}
	}

	function tableClick(e)
	{
		//#region copy from kendo.ui.Grid
		const CHECKBOX = 'k-checkbox', CHECKBOXINPUT = 'input[data-role=\'checkbox\'].' + CHECKBOX;
		var currentTarget = $(e.currentTarget), isHeader = currentTarget.is('th'), table = this.table.add(this.lockedTable), headerTable = this.thead.parent().add($('>table', this.lockedHeader)), isInput = isInputElement(e.target), preventScroll = $(e.target).is('.k-checkbox'), target = $(e.target), currentTable = currentTarget.closest('table')[0];
		if (isInput && currentTarget.find(kendo.roleSelector('filtercell')).length)
		{
			this._setCurrent(currentTarget);
			return;
		}
		if (currentTable !== table[0] && currentTable !== table[1] && currentTable !== headerTable[0] && currentTable !== headerTable[1])
		{
			return;
		}
		if (target.is('a.k-i-expand, a.k-i-collapse'))
		{
			return;
		}
		if (this.options.navigatable)
		{
			this._setCurrent(currentTarget, false, preventScroll);
		}
		if (isHeader || !isInput)
		{
			setTimeout(function()
			{
				if ($(kendo._activeElement()).hasClass('k-widget'))
				{
					return;
				}
				if ($(kendo._activeElement()).is(CHECKBOXINPUT) || !isInputElement(kendo._activeElement()) || !$.contains(currentTable, kendo._activeElement()))
				{
					focusTable(currentTable, true);
				}
			});
		}
		if (isHeader && !kendo.support.touch)
		{
			e.preventDefault();
		}
		//#endregion

		// focus out filter input once select a row
		_.find(this.element.find('span.k-widget.k-dropdown.k-dropdown-operator'), function(ele)
		{
			if ($(ele).children('span').hasClass('k-state-focused')) 
			{
				$(ele).blur();
			}
		});
	}
})();
