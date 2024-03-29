﻿(function()
{
	createNamespace("TF.RoutingMap").BasePaletteViewModel = BasePaletteViewModel;

	function BasePaletteViewModel(mapCanvasPage, isOpen, routeState)
	{
		const self = this;
		self.panel = null;
		self.isOpen = false;
		self.needInit = true;
		self.arcgis = tf.map.ArcGIS;
		self.layers = [];
		self.mapCanvasPage = mapCanvasPage;
		self.routeState = routeState;
		self.type = "";
		self.title = "";
		self.templateName = "";
		self.className = "";
		self.dockLeft = null;
		self.obShow = ko.observable(false);
		self.obShowRefreshToast = ko.observable(false);
		self.showCount = 0;
		self.isEyeVisible = ko.observable(false);
		self.isShowMode = ko.observable(false);
		self.eyeTitle = ko.observable("");
		self.sections = [];

		Object.defineProperty(self, "_viewModal",
		{
			get()
			{
				console.log("This property is obsoleted, please use mapCanvasPage instead. it should be removed in future.(BasePaletteViewModel)")
				return self.mapCanvasPage;
			},
			enumerable: false,
		});
	}

	BasePaletteViewModel.prototype.getMap = function()
	{
		return this._viewModal.map || this._viewModal._map;
	};

	BasePaletteViewModel.prototype.getMapView = function()
	{
		return this._viewModal._mapView;
	};

	BasePaletteViewModel.prototype.addLayer = function(id)
	{
		var layer;
		if (id.id)
		{
			layer = id;
		} else
		{
			layer = new tf.map.ArcGIS.GraphicsLayer({
				id: id
			});
		}
		TF.Helper.MapHelper.addLayer(this.getMap(), layer);
		this.layers.push(id);
		return layer;
	};

	BasePaletteViewModel.prototype.changeShow = function(visible)
	{
		var self = this;
		if (self.editTool && self.editTool.isEditing)
		{
			self.editTool.stop();
			PubSub.publish("clear_ContextMenu_Operation");
		}
		var layers = this.getLayers();
		layers.forEach(function(layer)
		{
			layer.visible = visible;
		});
	};

	BasePaletteViewModel.prototype.getLayers = function()
	{
		var self = this;
		return self.layers.map(function(item)
		{
			if (item.id)
			{
				return item;
			}
			return TF.Helper.MapHelper.getLayer(self.getMap(), item);
		}).filter(function(c) { return c; });
	};

	BasePaletteViewModel.prototype.addShowCount = function()
	{
		this.showCount++;
	};

	BasePaletteViewModel.prototype.minusShowCount = function()
	{
		this.showCount--;
		if (this.showCount < 0)
		{
			this.showCount = 0;
		}
	};
	/**
	* To be called when the content is expanded or collapsed.
	* @returns {void} 
	*/
	BasePaletteViewModel.prototype.afterContentToggle = function()
	{
	};

	/**
	 * Fired after the panel's dock status is changed.
	 * @param {string} status The dock status of panel. value: "float" "dock-right" "dock-left".
	 * @returns {void} 
	 */
	BasePaletteViewModel.prototype.onDockStatusChanged = function()
	{

	};

	/**
	 * Fired after the size of panel is changed.
	 * @param {int} width The width of panel.
	 * @returns {void} 
	 */
	BasePaletteViewModel.prototype.onPanelSizeChanged = function()
	{

	};

	BasePaletteViewModel.prototype.afterRender = function() { };

	BasePaletteViewModel.prototype.toggleShow = function(data, event)
	{
		event.stopPropagation();
		var self = this;
		self.isShowMode(!self.isShowMode());
	};

	BasePaletteViewModel.prototype.unSaveCheck = function()
	{
		return Promise.resolve(true);
	};

	BasePaletteViewModel.prototype.checkWithLockConfirm = function()
	{
		return Promise.resolve(true);
	};

	BasePaletteViewModel.prototype._multiViewUnSaveCheck = function(openingName, viewModels, isRevert)
	{
		var self = this, lockConfirm = false;
		return Promise.all(viewModels.map(function(c)
		{
			lockConfirm = c.lockConfirm || lockConfirm;
			return c.unSaveCheck();
		})).then(function(isModifiedList)
		{
			var isModified = false;
			var pList = [];
			for (var i = 0; i < isModifiedList.length; i++)
			{
				if (isModifiedList[i])
				{
					isModified = true;
					pList.push(viewModels[i]);
				}
			}
			if (isModified)
			{
				//self._viewModal._map.navigationManager._panEnd();

				if (openingName)
				{
					openingName = "Would you like to save your changes prior to closing " + openingName + "? ";
				} else
				{
					openingName = "Would you like to save your changes?";
				}
				// fix pop up more than one confirm window.
				if (self.confirmWindowCount > 0)
				{
					return "break";
				}
				self.confirmWindowCount++;
				return (lockConfirm ? self.checkWithLockConfirm() : Promise.resolve(true)).then(confirmResult =>
				{
					return confirmResult ? tf.promiseBootbox.yesNo("You have unsaved changes.&nbsp;" + (openingName || ""), "Unsaved Changes") : Promise.resolve(confirmResult);
				})
					.then(function(result)
					{
						self.confirmWindowCount--;
						if (result == null)
						{
							return null;
						}
						if (result)
						{
							return Promise.all(pList.map(function(c)
							{
								return c.save();
							})).then(results =>
							{
								return !results.some(result => result == false);
							});
						} else if (result == false)
						{
							return Promise.all(pList.map(function(c)
							{
								if (isRevert)
								{
									return c.revert();
								}
								// else
								// {
								// 	return c.close();
								// }
							})).then(function()
							{
								return true;
							});
						}
						return result;
					});
			}
			return Promise.resolve(true);
		});
	};

	BasePaletteViewModel.prototype.show = function()
	{
	};
	BasePaletteViewModel.prototype.close = function()
	{
	};

	BasePaletteViewModel.prototype.dispose = function()
	{
	};
})();