(function()
{
	createNamespace("TF").AutomationHelper = {

		/**
		* get automation setting
		*/
		getSetting: function()
		{
			return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), "userprofiles") + "?dbid=" + tf.datasourceManager.databaseId + "&@relationships=UserSetting").then(function(setting)
			{
				setting = setting.Items[0];
				return {
					geocodeAltSite: setting.GeocodeAltSite,
					geocodeGeoRegion: setting.GeocodeGeoRegion,
					geocodeSchool: setting.GeocodeSchool,
					geocodeStudent: setting.GeocodeStudent,
					findDistanceforStudent: setting.FindDistanceforStudent,
					findScheduleforStudent: setting.FindScheduleforStudent,
					schoolOfResidence: setting.SchoolOfResidence,
					schOfResRedistIds: setting.SchOfResRedistIds,
					createDoorToDoor: TF.convertToBoolean(tf.storageManager.get("automation-CreateDoorToDoor")),
					useStopPool: TF.convertToBoolean(tf.storageManager.get("automation-UseStopPool")),
					selectedStopPoolCategoryId: tf.storageManager.get("automation-SelectedStopPoolCategoryId")
				};
			});
		},
		/**
		* auto find residence school and find distance for student by setting
		*/
		autoFind: function(student, setting)
		{
			var self = this;

			var promise = Promise.resolve();
			if (setting.schoolOfResidence && !student.ResidSchool)
			{
				promise = self.findSchoolResidence(student, setting.schOfResRedistIds);
			}

			return promise.then(function()
			{
				if (setting.findDistanceforStudent)
				{
					return self.findDistance(student, true);
				}
			});
		},

		/**
		* auto geo code 
		*/
		autoGeoCode: function(entity, originalEntity, type, setting)
		{
			var self = this;
			var autoGeoCode = false;
			switch (type)
			{
				case "school":
					autoGeoCode = setting.geocodeSchool;
					break;
				case "altsite":
					autoGeoCode = setting.geocodeAltSite;
					break;
				case "georegion":
					autoGeoCode = setting.geocodeGeoRegion;
					break;
				case "student":
					autoGeoCode = setting.geocodeStudent;
					break;
			}
			if (autoGeoCode && (
				!entity.Xcoord ||
				(originalEntity.Xcoord == entity.Xcoord &&
					(originalEntity.GeoStreet != entity.GeoStreet || originalEntity.GeoZip != entity.GeoZip))
			))
			{
				return this.findGeoCode(entity).then(function(success)
				{
					if (success)
					{
						return;
					}
					return self.findGeoCode(entity, "Address point").then(function(result)
					{
						if (!result)
						{
							entity.Xcoord = 0;
							entity.Ycoord = 0;
						}
					});
				});
			}
			return Promise.resolve();
		},

		findDistance: function(student, forceChange, dbid)
		{
			var promises = [];
			if (!dbid)
			{
				dbid = tf.datasourceManager.databaseId;
			}
			if (!student.DistanceFromSchl || forceChange)
			{
				promises.push(
					this.findMiDistanceFromSchool(student, student.SchoolCode, dbid).then(function(distance)
					{
						if (distance)
						{
							student.DistanceFromSchl = distance;
							return true;
						}
						return false;
					}));
			}
			if (!student.DistanceFromResidSch || forceChange)
			{
				promises.push(
					this.findMiDistanceFromSchool(student, student.ResidSchool, dbid).then(function(distance)
					{
						if (distance)
						{
							student.DistanceFromResidSch = distance;
							return true;
						}
						return false;
					}));
			}
			return Promise.all(promises).then(function(data)
			{
				if (data.length == 0)
				{
					return false;
				}
				return Enumerable.From(data).Any(function(c) { return c; });
			});
		},

		findSchedule: function(studentIds, isUseStopPool, selectedStopPoolCategoryId, isCreateDoorToDoor, dbid, progress)
		{
			return TF.Control.FindScheduleForStudentViewModel.prototype.autoSchedule(studentIds, isCreateDoorToDoor, isUseStopPool, selectedStopPoolCategoryId, dbid, progress);
		},

		findMiDistanceFromSchool: function(studentEntity, schoolCode, dbid)
		{
			if (!dbid)
			{
				dbid = tf.datasourceManager.databaseId;
			}
			return calculateDistance(studentEntity, schoolCode, dbid);
		},

		findSchoolResidence: function(student, schOfResRedistIds, dbid)
		{
			var self = this;
			if (!student.Xcoord)
			{
				return Promise.resolve();
			}

			if (!dbid)
			{
				dbid = tf.datasourceManager.databaseId;
			}

			return queryRedistSchool(schOfResRedistIds, dbid).then(function(residenceSchools)
			{
				self.findSchoolResidenceByResidenceSchools(student, residenceSchools);
			});
		},

		findSchoolResidenceByResidenceSchools: function(student, residenceSchools)
		{
			if (!student.Xcoord)
			{
				return Promise.resolve(false);
			}

			var point = TF.xyToGeometry(student.Xcoord, student.Ycoord);
			var intersectResidenceSchools = [];
			residenceSchools.forEach(function(redist)
			{
				if (tf.map.ArcGIS.geometryEngine.intersects(point, redist.geometry) && redist.GradeIds.indexOf(student.GradeId) >= 0)
				{
					intersectResidenceSchools.push(redist);
				}
			});
			intersectResidenceSchools = Enumerable.From(intersectResidenceSchools).Distinct(function(c) { return c.School; }).ToArray();
			if (intersectResidenceSchools.length == 1)
			{
				student.ResidSchool = intersectResidenceSchools[0].School;
				return Promise.resolve(true);
			}
			return Promise.resolve(false);
		},

		findGeoCode: function(entity, sourceType)
		{
			if (!entity.GeoStreet)
			{
				return Promise.resolve(false);
			}
			return TF.Grid.GeocodeTool.geocodeAddresses(sourceType, [entity]).then(function(result)
			{
				if (result.length == 1 && result[0])
				{
					entity.Xcoord = result[0].Xcoord;
					entity.Ycoord = result[0].Ycoord;
					return true;
				}
				return false;
			});
		},

		queryRedistSchool: function(schOfResRedistIds, dbid)
		{
			return queryRedistSchool(schOfResRedistIds, dbid);
		}
	};

	function calculateDistance(student, schoolCode, dbid)
	{
		if (!student.Xcoord || !student.Ycoord || !schoolCode)
		{
			return Promise.resolve(null);
		}
		return findSchool(schoolCode, dbid).then(function(school)
		{
			if (!school || !school['Xcoord'])
			{
				return null;
			}
			return TF.calculateDistance(student.Xcoord, student.Ycoord, school.Xcoord, school.Ycoord).then(function(distance)
			{
				return TF.roundOff(TF.localizationDistance(distance), 3);
			}).catch(function()
			{
				return 0;
			});
		});
	}

	var schoolCache = {}, cacheTimeout;
	function findSchool(schoolCode, dbid)
	{
		clearTimeout(cacheTimeout);
		cacheTimeout = setTimeout(function()
		{
			schoolCache = {};
		}, 10000);
		if (!dbid)
		{
			dbid = tf.datasourceManager.databaseId;
		}
		if (schoolCache[dbid + "_" + schoolCode])
		{
			return Promise.resolve(schoolCache[dbid + "_" + schoolCode]);
		}

		return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), dbid, tf.dataTypeHelper.getEndpoint("school")), {
			paramData: {
				"@fields": "Xcoord,Ycoord",
				"SchoolCode": schoolCode
			}
		}).then(function(response)
		{
			schoolCache[dbid + "_" + schoolCode] = response.Items[0];
			return response.Items[0];
		});
	}

	function queryRedistSchool(schOfResRedistIds, dbid)
	{
		var where = "";
		if (schOfResRedistIds)
		{
			where += " and ReDist_ID in (" + schOfResRedistIds + ")";
		}

		var query = new tf.map.ArcGIS.Query();
		query.returnGeometry = true;
		query.outFields = ["*"];
		query.outSpatialReference = new tf.map.ArcGIS.SpatialReference({ wkid: 102100 });
		query.where = "DBID=" + dbid + where;
		var url = arcgisUrls.MapEditingOneService + "/33";
		return new tf.map.ArcGIS.FeatureLayer(url, {
			objectIdField: "OBJECTID"
		}).queryFeatures(query).then(function(featureSet)
		{
			var schools = featureSet.features.map(function(feature)
			{
				var attributes = feature.attributes;
				attributes.geometry = feature.geometry;
				return attributes;
			});
			return tf.promiseAjax.get(pathCombine(tf.api.apiPrefixWithoutDatabase(), dbid, tf.dataTypeHelper.getEndpoint("school")), {
				paramData: {
					"@fields": "Id,GradeIds,SchoolCode",
					"@relationships": "Grade",
					"@filter": "in(SchoolCode," + schools.map(function(s) { return s.School; }).join(",") + ")"
				}
			}).then(function(response)
			{
				schools.forEach(function(school)
				{
					school.GradeIds = Enumerable.From(response.Items).FirstOrDefault({ GradeIds: [] }, function(c) { return c.SchoolCode == school.School; }).GradeIds;
				});
				return schools;
			});
		});
	}
})();