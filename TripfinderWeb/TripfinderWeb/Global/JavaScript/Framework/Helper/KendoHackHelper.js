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

		var KendoFlatColorPickerPrototype = null, KendoColorPickerPrototype = null;

		window.kendo.widgets.map(function(widget, idx)
		{
			if (widget.name === 'kendoFlatColorPicker')
				KendoFlatColorPickerPrototype = widget.widget.prototype;
			if (widget.name === 'kendoColorPicker')
				KendoColorPickerPrototype = widget.widget.prototype;
			if (widget.name === "kendoScheduler")
				KendoSchedulerPrototype = widget.widget.prototype;
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
			'<div class="close-color-picker"></div>' +
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

		KendoSchedulerPrototype.refresh = KendoSchedulerPrototype.refresh.createSequence(function()
		{
			var self = this,
				selectedEventElement = self.element.find("[data-kendo-uid=" + self.selectEventUid + "]");

			if (self.selectEventElementIndexInList != null)
			{
				selectedEventElement = $(selectedEventElement[self.selectEventElementIndexInList]);
				if (self._selectedViewName === "List")
				{
					selectedEventElement = selectedEventElement.closest("td");
				}
			}

			selectedEventElement.addClass("selected");
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

		/**
		 * The event of color blocks which are in Swatch palette and Recent Colors palette click
		 * @return {void}
		 */
		KendoFlatColorPickerPrototype.paletteClick = function()
		{
		};

		kendo.ui.TreeView.prototype.toggle = kendo.ui.TreeView.prototype.toggle.createInterceptor(function(node, expand)
		{
			if ($(node[0]).attr('suspend') === 'true')
			{
				$(node[0]).attr('suspend', 'false');
				return false;
			}
			return true;
		});

		kendo.ui.TreeView.prototype.dataItem = kendo.ui.TreeView.prototype.dataItem.createSequence(function(node)
		{
			var self = this;
			if (!this.createdSequenceToSet)
			{
				var uid = $(node).closest('.k-item').attr(kendo.attr("uid")),
					dataSource = this.dataSource;
				var ds = dataSource && dataSource.getByUid(uid);
				if (uid && ds)
				{
					if (!ds.createdSequenceToSet)
					{
						if (ds.set)
						{
							ds.set = ds.set.createInterceptor(function()
							{
								var args = [].slice.call(arguments);
								args.splice(0, 0, self, ds);
								if (ds.onBeforeSetFieldValue) ds.onBeforeSetFieldValue.apply(ds, args);
							});
							ds.set = ds.set.createSequence(function()
							{
								var args = [].slice.call(arguments);
								args.splice(0, 0, self, ds);
								if (ds.onSetFieldValue) ds.onSetFieldValue.apply(ds, args);
							});
							ds.createdSequenceToSet = true;
						}
					}
				}
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
			var that = this,
				group = that.root;

			if (parentNode)
			{
				group = subGroup(parentNode);
			}

			return that._dataSourceMove(nodeData, group, parentNode, function(dataSource, model, loadModel)
			{
				var inserted;

				function add()
				{
					if (parentNode && expand)
					{
						that._expanded(parentNode, true);
					}

					var data = dataSource.data(),
						index = Math.max(data.length, 0);

					return that._insert(data, model, index);
				}

				loadModel.then(function()
				{
					inserted = add();
					success = success || $.noop;
					success(inserted);
				});

				return inserted || null;
			});
		}

		TF.override ? TF.override(kendo.data.HierarchicalDataSource,
			function()
			{
				var result = [];
				function getAllById(data, id, fn)
				{
					for (var i = 0; i < data.length; i++)
					{
						if (data[i].id == id && fn && fn(data[i]))
						{
							result.push(data[i]);
						}
						getAllById(data[i].children._data, id, fn);
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
	}
})();
