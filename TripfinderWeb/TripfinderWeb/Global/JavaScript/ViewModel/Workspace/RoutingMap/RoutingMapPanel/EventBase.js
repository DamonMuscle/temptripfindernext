(function()
{
	createNamespace("TF.RoutingMap").EventBase = EventBase;

	function EventBase(menu, dataModel, ignoreBinding)
	{
		this.menu = menu;
		this.dataModel = dataModel;
		this.dTool = null;
		this.pdTool = null;
		this.eTool = null;
		this.peTool = null;
		this.arcMap = null;
		this.arcgis = null;

		if (ignoreBinding)
		{
			return;
		}
		this._attachEvent();
		this.copyFromObject = ko.computed(this.getCopyFrom.bind(this));
	}

	EventBase.prototype = function()
	{
		return {
			constructor: EventBase,
			_attachEvent: function()
			{
				for (var key in this.menu)
				{
					if (key.endsWith("Event"))
					{
						var eventName = key.replace("Event", "");
						if (this[eventName])
						{
							this.menu[key].subscribe(this[eventName].bind(this));
						}
					}
				}
			},
			attachMapTools2EventInstance: function(map, arcgis, drawTool, drawPopulationTool)
			{
				var self = this;
				self.setArcGis(arcgis);
				self.setMap(map);
				self.setMapTool(drawTool, drawPopulationTool);
			},
			getCopyFrom: function() { },
			getCopyFromArray: function(copyFrom)
			{
				for (var i = 0; i < copyFrom.length; i++)
				{
					if (copyFrom[i])
					{
						var copyObject = copyFrom[i].getData();
						return copyObject;
					}
				}
				return null;
			},
			setMapTool: function(drawTool, drawPopulationTool)
			{
				this.dTool = drawTool;
				this.pdTool = drawPopulationTool;
				this.onMapToolInitialized();
			},
			getDrawTool: function()
			{
				return this.dTool;
			},
			getDrawPTool: function()
			{
				return this.pdTool;
			},
			// getEditTool: function()
			// {
			// 	return this.eTool;
			// },
			// getEditPTool: function()
			// {
			// 	return this.peTool;
			// },
			onMapToolInitialized: function() { },

			setMap: function(map)
			{
				this.arcMap = map;
				this.onMapInitialized();
			},
			getMap: function()
			{
				return this.arcMap;
			},
			onMapInitialized: function() { },
			setArcGis: function(arcgis)
			{
				this.arcgis = arcgis;
			},
			getArcGis: function()
			{
				return this.arcgis;
			},
			changeMenuButtonStyle: function(mode)
			{
				if (this.viewModel.$element)
				{
					var menuContainer = this.viewModel.$element.find(".parcelpoint-tool");
					this.changeButtonActiveStyle(menuContainer, mode);
				}
			},
			changeButtonActiveStyle: function(menuContainer, mode)
			{
				menuContainer.find(".icon").removeClass("active");
				menuContainer.find("[mode]").removeClass("active");
				var node = menuContainer.find("[mode='" + mode + "']").addClass("active");
				node.closest(".print-setting-group").children(".icon").addClass("active");
			},
			changeSelectAreaOptionStyle: function(e, type)
			{
				var target = e.target ? $(e.target).closest(".print-setting-group") : e.find(".print-setting-group.create-dropdown-list");
				target.children(".icon").attr("class", "icon fixed-menu-btn").addClass(type);
				PubSub.publish("clear_ContextMenu_Operation");
			}
		};
	}();

})();