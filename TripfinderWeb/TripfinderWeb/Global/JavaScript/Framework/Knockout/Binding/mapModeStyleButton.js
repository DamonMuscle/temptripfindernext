ko.bindingHandlers.mapModeStyleButton = {
	init: function(element, valueAccessor)
	{
		var $element = $(element);
		var mapPage = $element.closest(".map-page");
		var autoActive = valueAccessor && valueAccessor() ? (!!valueAccessor().autoActive) : true;
		$element.data("autoActive", autoActive);
		if (!mapPage.length)
		{
			const floatMenuCss = 'float-menu';
			var menu = $element.closest(`.${floatMenuCss}`);
			if (menu.length)
			{
				var menuId = menu.attr('id');
				const menuIdKey = "menu-id";
				var menuParent = $(`[${menuIdKey}=${menuId}]`);
				mapPage = menuParent.closest(".map-page");
			}
		}

		var nodeStyleButtons = mapPage.data("mapModeStyleButtons") || [];
		nodeStyleButtons.push($element);
		mapPage.data("mapModeStyleButtons", nodeStyleButtons);

		if (isDropDownMenu($element))
		{
			var dropDownButton = getDropDownDisplayButton($element);
			dropDownButton.data("originalClass", (dropDownButton.attr("class") || "").replace("disable", ""));
		}

		function clearAllButtonStatus(allNodeButtons)
		{
			allNodeButtons.forEach(function(node)
			{
				node.removeClass("active");
				if (!node.data("autoActive"))
				{
					return;
				}

				if (isDropDownMenu(node))
				{
					var dropDownButton = getDropDownDisplayButton(node);
					var isDisable = dropDownButton.hasClass("disable");
					dropDownButton.attr("class", dropDownButton.data("originalClass"));
					if (isDisable)
					{
						dropDownButton.addClass("disable");
					}
				}
			});
		}

		if (!mapPage.data("bindCancel"))
		{
			var viewModal = ko.dataFor(mapPage[0]);

			if (viewModal && viewModal.onModeChangeEvent)
			{
				// subscribe when finish draw
				viewModal.onModeChangeEvent.subscribe(function(e, mode)
				{
					if (mode.indexOf("Normal") >= 0)
					{
						clearAllButtonStatus(mapPage.data("mapModeStyleButtons"));
					}
				});
				mapPage.data("bindCancel", true);
			}
		}

		$element.on("click", function()
		{
			if ($element.hasClass("disable"))
			{
				return;
			}
			var $button = $(this);
			var allNodeButtons = mapPage.data("mapModeStyleButtons");

			// clear all active style
			clearAllButtonStatus(allNodeButtons);
			// if is drop down menu
			if (isDropDownMenu($button))
			{
				var type = $button.attr("class");
				var parentIconButton = getDropDownDisplayButton($button);
				const mapPinPoints = ["polygon", "rectangle", "draw", "circle"];
				const sketchType = $button.attr("sketch-type");
				const sketchPinPoints = ["point", "polyline", "polygon", "rectangle", "draw", "circle", "text"];
				if ((sketchType || type) && ((sketchPinPoints.includes(sketchType) || mapPinPoints.includes(type)) || !autoActive))
				{
					const className = sketchType ? "icon fixed-menu-btn add-sketch" : "icon fixed-menu-btn";
					parentIconButton.attr("class", className).addClass(sketchType || type);
				}
				if (autoActive)
				{
					parentIconButton.addClass("active");
				}
			} else
			{
				$button.addClass("active");
			}
		});

		function isDropDownMenu(button)
		{
			return button[0].nodeName.toLowerCase() == "li";
		}

		function getDropDownDisplayButton(button)
		{
			return button.closest(".print-setting-group").children(".icon");
		}

	}
};
