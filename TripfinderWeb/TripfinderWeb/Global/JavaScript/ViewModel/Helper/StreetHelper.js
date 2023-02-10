(function()
{
	var sde = {
		allStreet: [],
		isFetching: false,
		streetLastChangeDate: null,
		dbStorageHelper: null
	};

	var file = {
		allStreet: [],
		isFetching: false,
		streetLastChangeDate: null,
		dbStorageHelper: null
	};

	function getDataByType(type)
	{
		return type == "file" ? file : sde;
	}

	function getClientKey()
	{
		return tf.authManager.clientKey.replace(/[^\w]/g, "");
	}

	function getDBStorageHelper(type)
	{
		var data = getDataByType(type);
		if (!data.dbStorageHelper)
		{
			data.dbStorageHelper = new TF.DBStorageHelper("Street_" + getClientKey() + (type == "file" ? "_file" : ""), [
				"OBJECTID",
				"Cfcc",
				"City",
				"FromElevation",
				"Fromleft",
				"Fromright",
				"GroupID",
				"HeightClearance",
				"LeftMunicipalName",
				"LeftPostalCode",
				"LocalId",
				"Lock",
				"Oneway",
				"PostedLeft",
				"PostedRight",
				"ProhibitCrosser",
				"RightMunicipalName",
				"RightPostalCode",
				"Speedleft",
				"Speedright",
				"StreetType",
				"RoadClass",
				"State",
				"Street",
				"Style",
				"ToElevation",
				"Toleft",
				"Toright",
				"TraversableByVehicle",
				"TraversableByWalkers",
				"WeightLimit",
				"geometry"]);
		}
		return data.dbStorageHelper;
	}

	function getUrl(type)
	{
		var url = type != "file" ? (arcgisUrls.MapEditingOneService + "/43") : (arcgisUrls.MapEditingOneServiceFile + "/26");
		return url;
	}

	function getQueryTask(type)
	{
		return new tf.map.ArcGIS.QueryTask({ url: getUrl(type) });
	}

	function queryAll(type)
	{
		var queryTask = getQueryTask(type);
		var pageSize = 10000;
		function query(index)
		{
			var from = index * pageSize + 1;
			var to = index * pageSize + pageSize;
			var query = new tf.map.ArcGIS.Query();
			query.outFields = ["*"];
			query.returnGeometry = true;
			query.where = " OBJECTID>=" + from + " and OBJECTID<=" + to;
			return queryTask.execute(query).then(function(featureSet)
			{
				return featureSet.features.map(function(feature)
				{
					var attributes = feature.attributes;
					attributes.geometry = feature.geometry;
					return attributes;
				});
			}).catch(function()
			{
				tf.loadingIndicator.hideWhenError();
			});
		}

		return new Promise(function(resolve)
		{
			var all = [];
			var pageIndex = 0;

			function queryPaging(pageIndex)
			{
				return query(pageIndex).then(function(streets)
				{
					if (streets.length > 0)
					{
						all = all.concat(streets);
						pageIndex++;
						return queryPaging(pageIndex);
					} else
					{
						return all;
					}
				});
			}

			queryPaging(pageIndex).then(function()
			{
				resolve(all);
			});

		});
	}

	function queryInLocalDB(type)
	{
		return getDBStorageHelper(type).fetch();
	}

	function clearAllData(type)
	{
		var storageHelper = getDBStorageHelper(type);
		return storageHelper.drop();
	}

	function setLocalLastChangeDate(type)
	{
		tf.storageManager.save(getStorageKey(type), formatDate(getNow()), true);
	}

	function setServerLastChangeDate(type)
	{
		var data = getDataByType(type);
		data.streetLastChangeDate = formatDate(getNow());
		var key = type == "file" ? "StreetFileLastChangeDate" : "StreetLastChangeDate";
		return tf.promiseAjax.put(pathCombine(tf.api.apiPrefixWithoutDatabase(), "tfsysinfo", key), {
			data: {
				InfoID: key,
				InfoValue: "UTC" + data.streetLastChangeDate
			}
		});
	}

	function getStorageKey(type)
	{
		var key = type ? "file_" : "";
		return "streetLastChangeDate_" + key + getClientKey();
	}

	function getNow()
	{
		return moment().utc();
	}

	function formatDate(d)
	{
		return d.format("YYYY-MM-DDTHH:mm:ss+00:00");
	}

	function needRefresh(type)
	{
		var data = getDataByType(type);
		var now = getNow();
		var localChangeDate = tf.storageManager.get(getStorageKey(type), true);
		if (!localChangeDate)
		{
			return true;
		}
		localChangeDate = localChangeDate ? moment(localChangeDate) : now;
		var serverChangeDate = data.streetLastChangeDate ? moment(data.streetLastChangeDate) : now;
		return serverChangeDate.diff(localChangeDate) > 0;
	}

	function getFileLastChangeDate(type)
	{
		if (type == "file")
		{
			return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "tfsysinfo"), {
				paramData: {
					"@filter": "eq(InfoID,StreetFileLastChangeDate)"
				}
			}, { overlay: false })
				.then(function(response)
				{
					TF.StreetHelper.setStreetLastChangeDate(response.Items[0].InfoValue, "file");
				});
		} else
		{
			return Promise.resolve();
		}
	}

	function addOtherInfo(streets)
	{
		return bindExitName(streets).then(function()
		{
			streets.forEach(function(s)
			{
				s.id = s.OBJECTID;
				s.type = "mystreets";
				s.maneuverInfo = {};
			});
			return streets;
		});
	}

	var signPostFeatureLayer = function()
	{
		return new tf.map.ArcGIS.FeatureLayer(arcgisUrls.MapEditingOneService + "/46", {
			objectIdField: "OBJECTID"
		});
	};

	var signPostStreetFeatureLayer = function()
	{
		return new tf.map.ArcGIS.FeatureLayer(arcgisUrls.signpostTable, {
			objectIdField: "OBJECTID"
		});
	};

	function bindExitName(streets)
	{
		return Promise.resolve();
		// var signPost = signPostFeatureLayer().queryFeatures().then(function(response)
		// {
		// 	return response.features.map(function(c)
		// 	{
		// 		return c.attributes;
		// 	});
		// });

		// var signPostStreet = signPostStreetFeatureLayer().queryFeatures().then(function(response)
		// {
		// 	return response.features.map(function(c)
		// 	{
		// 		return c.attributes;
		// 	});
		// });

		// return Promise.all([signPost, signPostStreet]).then(function(data)
		// {
		// 	var signPostStreets = getSignPostStreetsMapping(data[0], data[1]);
		// 	streets.forEach(function(street)
		// 	{
		// 		street.ExitName = (signPostStreets[street.OBJECTID] || []).filter(c => c.signpost && c.signpost.ExitName && $.trim(c.signpost.ExitName)).map(c => c.signpost.ExitName).join(",");
		// 	});
		// });
	}

	function getSignPostStreetsMapping(signPosts, signPostStreets)
	{
		var signPostsMapping = _.keyBy(signPosts, 'OBJECTID'),
			signPostStreetsMapping = {};
		signPostStreets.forEach(function(item)
		{
			if (!signPostStreetsMapping[item.EdgeFID])
			{
				signPostStreetsMapping[item.EdgeFID] = [];
			}
			signPostStreetsMapping[item.EdgeFID].push(item);
			if (signPostsMapping[item.SignpostID])
			{
				item.signpost = signPostsMapping[item.SignpostID];
			}
		});
		return signPostStreetsMapping;
	}

	var StreetHelper = {
		getStreet: function(type)
		{
			type = type || "sde";
			var data = getDataByType(type);
			return getFileLastChangeDate(type).then(function()
			{
				return new Promise(function(resolve)
				{
					if (type == "file" && needRefresh(type))
					{
						file.allStreet = [];
					}
					// if in local memory, use this
					if (data.allStreet.length > 0)
					{
						return resolve(data.allStreet);
					}
					// if is fetching street, wait util return
					if (data.isFetching)
					{
						var interval = setInterval(function()
						{
							if (data.isFetching == false)
							{
								clearInterval(interval);
								resolve(data.allStreet);
							}
						}, 1000);
						return;
					}

					// start to query in web sql
					data.isFetching = true;
					var refreshPromise = Promise.resolve();
					if (needRefresh(type))
					{
						refreshPromise = clearAllData(type);
					}
					refreshPromise.then(function()
					{
						queryInLocalDB(type).then(function(streets)
						{
							StreetHelper.getStreetCount(type).then(function(count)
							{
								// if in local db, use local db records
								if (streets.length > 0 && streets.length == count)
								{
									addOtherInfo(streets).then(function()
									{
										data.allStreet = streets;
										resolve(streets);
										data.isFetching = false;
									});
								} else
								{
									// query data from remote server
									queryAll(type).then(function(streets)
									{
										addOtherInfo(streets).then(function()
										{
											data.allStreet = streets;
											resolve(streets);
											data.isFetching = false;
											// save it to local database
											return clearAllData(type).then(function()
											{
												return getDBStorageHelper(type).add(streets);
											});
										}).then(function()
										{
											setLocalLastChangeDate(type);
										});
									});
								}
							});
						});
					});
				});
			});
		},
		getStreetExtent: function(type = "sde")
		{
			var query = new tf.map.ArcGIS.Query();
			query.outFields = ["*"];
			query.returnGeometry = true;
			query.where = "1=1";
			if (this.extent)
			{
				return Promise.resolve(this.extent);
			}
			return getQueryTask(type).executeForExtent(query).then((response) =>
			{
				this.extent = response.extent;
				return this.extent;
			}).catch(function()
			{
				tf.loadingIndicator.hideWhenError();
			});
		},
		getStreetInExtent: function(geometries, type = "sde")
		{
			var query = new tf.map.ArcGIS.Query();
			query.outFields = ["*"];
			query.returnGeometry = true;
			query.where = "1=1";

			if (!$.isArray(geometries))
			{
				geometries = [geometries];
			}
			geometries = geometries.filter((c) => { return c; });
			if (geometries.length == 0)
			{
				return Promise.resolve([]);
			}
			var geos = geometries.map(function(geometry)
			{
				if (geometry.type == "polygon" || geometry.type == "extent")
				{
					return tf.map.ArcGIS.geometryEngine.simplify(geometry);
				} else
				{
					return tf.map.ArcGIS.geometryEngine.simplify(tf.map.ArcGIS.geometryEngine.buffer(geometry, 500, "meters"));
				}
			});
			query.geometry = tf.map.ArcGIS.geometryEngine.union(geos);

			return getQueryTask(type).execute(query).then(function(featureSet)
			{
				var streets = featureSet.features.map(function(feature)
				{
					var attributes = feature.attributes;
					attributes.geometry = feature.geometry;

					return attributes;
				});

				return addOtherInfo(streets);
			}).catch(function()
			{
				tf.loadingIndicator.hideWhenError();
				return [];
			});
		},
		getStreetCount: function(type = "sde")
		{
			var query = new tf.map.ArcGIS.Query();
			query.outFields = ["*"];
			query.where = "1=1";

			return getQueryTask(type).executeForCount(query);
		},
		getStreetBlocks: function(point)
		{
			return new Promise(function(resolve)
			{
				var queryTask = new tf.map.ArcGIS.QueryTask({ url: arcgisUrls.MapEditingOneServiceFile + "/28" })
				var query = new tf.map.ArcGIS.Query();
				query.outFields = ["*"];
				query.returnGeometry = true;
				query.geometry = point;
				query.where = "1=1";

				queryTask.execute(query).then(function(featureSet)
				{
					resolve(featureSet.features);
				}).catch(function()
				{
					tf.loadingIndicator.hideWhenError();
				});
			});
		},
		getRailroadCrossPoint: function(extent)
		{
			var query = new tf.map.ArcGIS.Query();
			query.returnGeometry = true;
			query.where = "1=1";
			query.geometry = extent;
			return new tf.map.ArcGIS.QueryTask({ url: arcgisUrls.CrossRailroadPointUrl }).execute(query).then((featureSet) =>
			{
				return Enumerable.From(featureSet.features.map((feature) =>
				{
					return feature.geometry;
				})).Distinct((c) => { return c.points[0][0] + '' + c.points[0][1] }).ToArray();;
			}).catch(function()
			{
				tf.loadingIndicator.hideWhenError();
			});
		},
		color: "#0090c0",
		getDataModel: function()
		{
			return {
				OBJECTID: 0,
				id: 0,
				Cfcc: "",
				City: "",
				FromElevation: 0,
				Fromleft: 0,
				Fromright: 0,
				GroupID: 0,
				HeightClearance: 0,
				LeftMunicipalName: "",
				LeftPostalCode: "",
				LocalId: "",
				Lock: "",
				Oneway: " ",
				PostedLeft: 25,
				PostedRight: 25,
				ProhibitCrosser: 0,
				RightMunicipalName: "",
				RightPostalCode: "",
				Speedleft: 25,
				Speedright: 25,
				StreetType: "A20",
				RC: 1,
				ExitName: "",
				State: "NY",
				Street: "",
				ToElevation: 0,
				Toleft: 0,
				Toright: 0,
				TraversableByVehicle: "T",
				TraversableByWalkers: "T",
				WeightLimit: 0,
				geometry: null,
				width: 1,
				pattern: "2",
				opacity: 1,
				color: StreetHelper.color,
				styleValue: "2:" + TF.Map.MapLineStyle.colors.indexOf(StreetHelper.color),
				type: "mystreets",
				maneuverInfo: {},
				RoadClass: 1,
				Style: "[{ \"Pen\": { \"Width\": \"1\", \"Pattern\": \"2\", \"Color\": \"15774720\", \"Opacity\": \"1\" } }]"
			};
		},
		setStreetLastChangeDate: function(date, type)
		{
			var data = getDataByType(type);
			if (!date)
			{
				setServerLastChangeDate(type);
				data.streetLastChangeDate = formatDate(getNow());
			} else
			{
				data.streetLastChangeDate = formatDate(moment(date.replace("UTC", "")).utc());
			}
		},
		getStreetsByIds: (ids, type = "sde") =>
		{
			var queryTask = getQueryTask(type);
			var query = new tf.map.ArcGIS.Query();
			query.outFields = ["*"];
			query.returnGeometry = true;
			query.where = " OBJECTID in (" + ids.join(",") + ")";
			return queryTask.execute(query).then(function(featureSet)
			{
				return featureSet.features.map(function(feature)
				{
					var attributes = feature.attributes;
					attributes.geometry = feature.geometry;
					return attributes;
				});
			}).catch(function()
			{
				tf.loadingIndicator.hideWhenError();
			});
		}
	};

	createNamespace("TF").StreetHelper = StreetHelper;
})();