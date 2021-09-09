(function()
{
	createNamespace("TF.Map").ExpandMapTool = ExpandMapTool;

	var STATUS = {
		expand: 0,
		restore: 1
	};

	/**
	* map expand tool
	* @constructor
	* @param {Object} map - The title of the book.
	* @param {Object} expandContainer - The expand container.
	*/
	function ExpandMapTool(map, expandContainer, routingMapTool)
	{
		this.map = map;
		this.expandContainer = expandContainer;
		this.status = STATUS.restore;
		this.originalContainer = $(map.mapView.container).parent();
		this.containerIsBody = this.expandContainer[0].tagName === "BODY";
		this.routingMapTool = routingMapTool;
		this._init();
	}

	ExpandMapTool.prototype._init = function()
	{
		var expandToolClass = TF.isMobileDevice ? 'map-expand-button is-mobile-device' : 'map-expand-button';
		this.button = $("<div title='expand' class='expand-button " + expandToolClass + "'></div>");
		this.button.on("click", this._toggleClick.bind(this));
		$(this.map.mapView.container).append(this.button);
	};

	ExpandMapTool.prototype._toggleClick = function()
	{
		var self = this;
		if (this.status == STATUS.restore)
		{
			if (TF.isMobileDevice)
			{
				self.map.mapView.navigation.browserTouchPanEnabled = true;
			}
			this._expand();
			this.status = STATUS.expand;
		} else
		{
			if (TF.isMobileDevice && this.routingMapTool && this.routingMapTool.locationMarkerTool)
			{
				this.routingMapTool.locationMarkerTool.endingDrawMarker();
			}
			if (TF.isMobileDevice)
			{
				self.map.mapView.navigation.browserTouchPanEnabled = false;
			}
			this._restore();
			this.status = STATUS.restore;
		}
		this.button.toggleClass("restore");
		[".dock-left", ".dock-right"].forEach(function(selector)
		{
			var panel = $(self.map.mapView.container).find(selector);
			if (panel.length > 0)
			{
				var routingMapPanelViewModel = ko.dataFor(panel[0]);
				routingMapPanelViewModel.routingMapDocumentViewModel.routingMapPanelManager.setDockPanelStyle(routingMapPanelViewModel.$panel, routingMapPanelViewModel.$mapPage);
			}
		});
	};

	ExpandMapTool.prototype._expand = function()
	{
		var mapElement = this._getMapElement();
		/*Formfinder: there's no element with class ".grid-stack-item" on form */
		if (mapElement.closest(".grid-stack-item").length > 0)
		{
			var uniqueClassName = TF.DetailView.DetailViewHelper.prototype.getDomUniqueClassName(mapElement.closest(".grid-stack-item"));
			mapElement.data("uniqueClassName", uniqueClassName);
		}
		if (!this.containerIsBody)
		{
			this.expandContainer.children().hide();
		}
		this.expandContainer.append(mapElement);
		this.expandContainer.css({ position: 'relative' });
		this.button.attr("title", "restore");
		mapElement.css({
			position: 'absolute',
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
			'z-index': this.containerIsBody ? 23990 : 500,
			'background-color': 'white'
		});
	};

	ExpandMapTool.prototype._restore = function()
	{
		var mapElement = this._getMapElement();
		if (!this.containerIsBody)
		{
			this.expandContainer.children().show();
		}
		this.originalContainer.append(mapElement);
		this.button.attr("title", "expand");
		mapElement.css({
			position: 'relative',
			'z-index': 0
		});
	};

	ExpandMapTool.prototype._getMapElement = function()
	{
		return $(this.map.mapView.container);
	};

	ExpandMapTool.prototype.dispose = function()
	{
		this.button.off("click");
		// ensure expandContainer not disposed in tfdispose.
		// expandContainer will be disposed when detail view closed.
		this.expandContainer = null;
		tfdispose(this);
	};
})();