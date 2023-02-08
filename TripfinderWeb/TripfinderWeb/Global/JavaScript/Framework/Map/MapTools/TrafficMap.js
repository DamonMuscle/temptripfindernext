(function()
{
	createNamespace("TF.Map").TrafficMap = TrafficMap;

	TrafficMap.RefreshInterval = 5 //refresh the layer every 5 minutes
	function TrafficMap(map, routingMapTool)
	{
		this.showTraffic = false;
		this.routingMapTool = routingMapTool;
		this.map = map;
		this.type = "trafficIncidents";
		this.gridMapPopup = new TF.Grid.GridMapPopup(this, {
			isDetailView: false,
			gridType: this.type,
			map: this.map,
			canShowDetailView: false
		});
	}

	TrafficMap.prototype.toggleTrafficMap = function(callback)
	{
		if (!this.showTraffic)
		{
			this.showTraffic = true;
			this.registerToken().then(() =>
			{
				this.createTrafficLayer();
				this.map.add(this.trafficLayer, 1);
				callback && callback();
			});
		} else
		{
			this.showTraffic = false;
			this.trafficLayer && this.map.remove(this.trafficLayer);
			callback && callback();
		}
	};

	TrafficMap.prototype.createTrafficLayer = function()
	{
		if (!this.trafficLayer)
		{
			this.trafficLayer = new tf.map.ArcGIS.MapImageLayer({
				url: "http://traffic.arcgis.com/arcgis/rest/services/World/Traffic/MapServer",
				imageFormat: "png32",
				refreshInterval: TrafficMap.RefreshInterval,
				useViewTime: false
			});
			this.addClickEvent();
		}
	};

	TrafficMap.prototype.addClickEvent = function()
	{
		this.map.mapView.popup.actions = [];

		this.map.mapView.on("click", (event) =>
		{
			if (this.routingMapTool && this.routingMapTool.measurementTool && this.routingMapTool.measurementTool.isActive)
			{
				return;
			}

			if (this.viewModel && this.viewModel.RoutingMapTool && this.viewModel.RoutingMapTool.googleStreetTool && this.viewModel.RoutingMapTool.googleStreetTool.isActive)
			{
				return;
			}

			if (this.map.mapView.pining || !this.showTraffic)
			{
				return;
			}

			this.map.mapView.popup.close();
			this.gridMapPopup._clearOutSideCss();
			this.queryTraffic(event).then((dataModels) =>
			{
				if (dataModels && dataModels.length > 0)
				{
					$(this.map.mapView.popup.container).closest(".esri-view-root").addClass("resizable-doc small");
					this.map.mapView.popup.close();
					this.gridMapPopup._showPopup(dataModels, event, {
						options: { type: this.type },
						generatePopupContent: (dataModel) =>
						{
							return {
								title: `${dataModel.attributes.incidenttype.replace('_', ' ')}`,
								contentMain: `<div>
										<div class="ellipsis">${dataModel.attributes.location}</div>
										<div class="ellipsis">${dataModel.attributes.fulldescription}</div>
										<div class="ellipsis" style='margin-top:10px;'>Started: ${moment(new Date(dataModel.attributes.start_localtime)).format('L LT')}</div>
										<div class="ellipsis">Expected to end: ${moment(new Date(dataModel.attributes.end_localtime)).format('L LT')}</div>
										<div class="ellipsis">Last updated: ${moment(new Date(dataModel.attributes.lastupdated_localtime)).format('L LT')}</div>
								</div>`
							};
						}
					});

					var watch = tf.map.ArcGIS.watchUtils.whenFalse(this.map.mapView.popup, "visible", () =>
					{
						$(this.map.mapView.popup.container).closest(".esri-view-root").removeClass("resizable-doc small");
						watch.remove();
					});
				}
			});
		});
	};

	TrafficMap.prototype.registerToken = function()
	{
		if (tf.trafficToken)
		{
			return Promise.resolve(tf.trafficToken);
		}

		var formdata = new FormData();
		formdata.append("client_id", "pcfGGrW4UZ2KocgK");
		formdata.append("client_secret", "d0a1b3f99cbb4fd8ac2110c7dd19219d");
		formdata.append("grant_type", "client_credentials");

		var requestOptions = {
			method: "POST",
			body: formdata,
			redirect: "follow"
		};

		return fetch("https://www.arcgis.com/sharing/rest/oauth2/token", requestOptions)
			.then(response => response.text())
			.then(result =>
			{
				result = JSON.parse(result);
				tf.map.ArcGIS.IdentityManager.registerToken({
					exires: result.expires_in,
					server: "http://traffic.arcgis.com/arcgis/rest/services/World/Traffic/MapServer",
					ssl: false,
					token: result.access_token
				});
				tf.trafficToken = result;
				return result;
			});
	};

	TrafficMap.prototype.queryTraffic = function(e)
	{
		if (this.showTraffic && this.trafficLayer)
		{
			var extent = TF.Helper.MapHelper.getPointExtent(this.map, e.mapPoint);
			var query = new tf.map.ArcGIS.Query();
			query.returnGeometry = true;
			query.where = "1=1";
			query.geometry = extent;
			query.token = tf.trafficToken;
			query.outFields = ["objectid", "severity", "incidenttype", "location", "description", "fulldescription", "start_localtime", "end_localtime", "lastupdated_localtime", "start_utctime", "end_utctime", "lastupdated_utctime"];
			return Promise.all([4, 12].map((i) =>
			{
				return new tf.map.ArcGIS.QueryTask({ url: "https://traffic.arcgis.com/arcgis/rest/services/World/Traffic/MapServer/" + i })
					.execute(query).then((featureSet) =>
					{
						return featureSet.features;
					}).catch(function()
					{
					});
			})).then((data) =>
			{
				return _.flatten(data);
			});
		}
		return Promise.resolve([]);
	};
})();