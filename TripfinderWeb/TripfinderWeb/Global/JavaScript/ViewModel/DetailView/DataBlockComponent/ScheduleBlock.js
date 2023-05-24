(function()
{
	createNamespace("TF.DetailView.DataBlockComponent").ScheduleBlock = ScheduleBlock;

	function ScheduleBlock(options, dataBlockStyles, currentWidth, detailView)
	{
		var self = this;

		TF.DetailView.DataBlockComponent.BaseDataBlock.call(self, detailView);

		var detailViewHelper = tf.helpers.detailViewHelper,
			editModeClass = self.isReadMode() ? "" : "temp-edit",
			uniqueClassName = options.uniqueClassName || detailViewHelper.generateUniqueClassName(),
			title = (options.customizedTitle || options.title),
			entity = detailView.recordEntity,
			isCreateGridNewRecord = detailView.isCreateGridNewRecord;
		self.gridType = detailView.gridType;
		self.$el = $("<div>\
							<div class='grid-stack-item-content schedule-stack-item' style='background:" + dataBlockStyles.backgroundColor + ";border-color:" + dataBlockStyles.borderColor + "'>\
								<input class='item-title' type='text' style='color:" + dataBlockStyles.titleColor + "' value='" + title + "' />\
								<div class='item-title' style='color:" + dataBlockStyles.titleColor + "'>" + title + "</div>\
								<div class='item-content schedule-item " + editModeClass + "'style='color:" + dataBlockStyles.contentColor + "'>\
								<div class='scheduleContain'></div></div>\
							</div>\
						</div>").addClass(uniqueClassName);

		self.uniqueClassName = uniqueClassName;

		switch (currentWidth)
		{
			case 1:
				options.minWidth = 1;
				break;
			case 2:
			case 3:
				options.minWidth = 2;
				break;
			case 4:
				options.minWidth = 3;
				break;
			default:
				break;
		}

		self.options = options;
		if (self.gridType === "student")
		{
			if (self.isReadMode() && !isCreateGridNewRecord)
			{
				var p0 = Promise.resolve(entity),
					p1 = tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), tf.dataTypeHelper.getEndpoint("trip") + "?@fields=Id&" + tf.dataTypeHelper.getIdsParamName("student") + "=" + entity.Id)).catch(function()
					{
						return null;
					}),
					p2 = tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "studentexceptions?id=" + entity.Id));

				Promise.all([p0, p1, p2]).then(function(data)
				{
					var modelEntity = data[0];
					modelEntity.Exceptions = data[2].Items;

					self.$el.find(".scheduleContain").append(self.setStudentScheduleContent(modelEntity));
					// self.gridstack.manageLayout();
				});
			}
			else
			{
				self.$el.find(".scheduleContain").append(self.setStudentScheduleContent());
			}
		}

		if (self.gridType === "staff" || self.gridType === "vehicle")
		{
			options.minHeight = 3;
			if (self.isReadMode() && !isCreateGridNewRecord)
			{
				var pList = [];
				var p0 = tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "trips"), {
					paramData: {
						vehicleId: entity.Id
					}
				});
				pList.push(p0);
				var p1 = tf.promiseAjax.get(pathCombine(tf.api.apiPrefix(), "schedresources"), {
					paramData: {
						resourceId: entity.Id,
						ResourceType: 3
					}
				});
				pList.push(p1);

				Promise.all(pList).then(function(data)
				{
					var tripEntity = data[0].Items,
						schedResourceEntity = data[1].Items,
						$scheduleDom = "";

					if (tripEntity)
					{
						tripEntity.forEach(function(item, index)
						{
							$scheduleDom += self.setVehicleOrStaffScheduleContent(item);
						})
					}
					if (schedResourceEntity)
					{
						schedResourceEntity.forEach(function(item, index)
						{
							$scheduleDom += self.setVehicleOrStaffScheduleContent(item, true);
						})
					}

					if (!tripEntity.length && !schedResourceEntity.length)
					{
						$scheduleDom += self.setVehicleOrStaffScheduleContent();
					}
					self.$el.find(".scheduleContain").append($scheduleDom);
					self.detailView.rootGridStack.manageLayout(); // call manageLayout to resize the Schedule DataBlock
				});
			}
			else
			{
				self.$el.find(".scheduleContain").append(self.setVehicleOrStaffScheduleContent());
			}
		}

	}

	ScheduleBlock.prototype = Object.create(TF.DetailView.DataBlockComponent.BaseDataBlock.prototype);

	ScheduleBlock.prototype.setStudentScheduleContent = function(modelEntity)
	{
		var self = this,
			pickUpTripStop, dropOffTripStop, pickUpAltsite, dropOffAltsite, firstForPickUp = true,
			firstForDropOff = true,
			count = 0,
			pickUpExceptionsItemDomString = "",
			dropOffExceptionsItemDomString = "",
			scheduleItemDomString = "",
			pickUpItemDomString = "",
			dropOffItemDomString = "",
			exceptions = [];
		if (modelEntity)
		{
			var pickUpSchedule = self._getFirstStudentScheduleBySession(modelEntity, TF.Helper.TripHelper.Sessions.ToSchool);
			var dropOffSchedule = self._getFirstStudentScheduleBySession(modelEntity, TF.Helper.TripHelper.Sessions.FromSchool);
			pickUpTripStop = pickUpSchedule && pickUpSchedule.PuTripStop;
			dropOffTripStop = dropOffSchedule && dropOffSchedule.DoTripStop;
			pickUpAltsite = pickUpSchedule && pickUpSchedule.StudentRequirement.AlternateSite;
			dropOffAltsite = dropOffSchedule && dropOffSchedule.StudentRequirement.AlternateSite;

			exceptions = self.getStudentException(modelEntity.Exceptions);
			exceptions.sort(function(a, b)
			{
				return a.sort > b.sort;
			}).forEach(function(item, index)
			{
				var weekString = self.options.value.weekString,
					tripStop = self.options.value.TripStop,
					dateString = self.options.value.dateString,
					isShowPickUpTitle = pickUpAltsite || pickUpTripStop,
					isShowDropOffTitle = dropOffAltsite || dropOffTripStop;

				if (!self.options.value.TripStop || self.options.value.TripStop.Id < 0)
				{
					count += 1;
				}
				else
				{
					if (self.options.action === 0)
					{
						pickUpExceptionsItemDomString += String.format("\
							<ul class='list'>\
								<li>\
									{0}\
									<div class='scheduleTitle'>Trip Assignment</div>\
									<div class='scheduleTitle'>Stop Name</div>\
								</li>\
								<li>\
									<div class='exceptionValue'>{1}</div>\
									<div class='scheduleValue'>{2}</div>\
									<div class='scheduleValue'>{3}</div>\
								</li>\
								<li>\
									<div class='exceptionValue'></div>\
									<div class='scheduleTitle'>Vehicle</div>\
									<div class='scheduleTitle'>Stop Time</div>\
								</li>\
								<li>\
									<div class='exceptionValue'></div>\
									<div class='scheduleValue'>{4}</div>\
									<div class='scheduleValue'>{5}</div>\
								</li>\
							</ul>",
							(isShowPickUpTitle ? ("<div class='exceptionValue'> " + weekString + "</div >") : (firstForPickUp ? "<div class='scheduleTitle'>Pickup</div>" : ("<div class='exceptionValue'> " + weekString + "</div >"))),
							(isShowPickUpTitle ? dateString : (firstForPickUp ? (weekString + "</br > " + dateString) : dateString)),
							(tripStop ? (tripStop.Trip ? tripStop.Trip.Name : "") : ""),
							(tripStop ? (tripStop.Street ? tripStop.Street : "") : ""),
							(tripStop ? (tripStop.Trip ? tripStop.Trip.Name : "") : ""),
							(tripStop ? moment(tripStop.StopTime).format("LT") : " "));
						firstForPickUp = false;
					}
					else
					{
						dropOffExceptionsItemDomString += String.format("\
							<ul class='list'>\
								<li>\
									{0}\
									<div class='scheduleTitle'>Trip Assignment</div>\
									<div class='scheduleTitle'>Stop Name</div>\
								</li>\
								<li>\
									<div class='exceptionValue'>{1}</div>\
									<div class='scheduleValue'>{2}</div>\
									<div class='scheduleValue'>{3}</div>\
								</li>\
								<li>\
									<div class='exceptionValue'></div>\
									<div class='scheduleTitle'>Vehicle</div>\
									<div class='scheduleTitle'>Stop Time</div>\
								</li>\
								<li>\
									<div class='exceptionValue'></div>\
									<div class='scheduleValue'>{4}</div>\
									<div class='scheduleValue'>{5}</div>\
								</li>\
							</ul>",
							(isShowDropOffTitle ? ("<div class='exceptionValue'> " + weekString + "</div >") : (firstForDropOff ? "<div class='scheduleTitle'>Dropoff</div>" : ("<div class='exceptionValue'> " + weekString + "</div >"))),
							(isShowDropOffTitle ? dateString : (firstForDropOff ? (weekString + "</br > " + dateString) : dateString)),
							(tripStop ? (tripStop.Trip ? tripStop.Trip.Name : " ") : " "),
							(tripStop ? (tripStop.Street ? tripStop.Street : " ") : " "),
							(tripStop ? (tripStop.Trip && tripStop.Trip.Vehicle ? tripStop.Trip.Vehicle.BusNum : " ") : " "),
							(tripStop ? moment(tripStop.StopTime).format("LT") : " "));
						firstForDropOff = false;
					}
				}
			});
		}

		if (!self.isReadMode() || pickUpTripStop)
		{
			pickUpItemDomString = String.format("\
				<ul class='list'>\
					<li>\
						<div class='scheduleTitle'>Pickup</div>\
						<div class='scheduleTitle'>Trip Assignment</div>\
						<div class='scheduleTitle'>Stop Name</div>\
					</li>\
					<li>\
						<div class='scheduleValue'>{0}</div>\
						<div class='scheduleValue'>{1}</div>\
						<div class='scheduleValue'>{2}</div>\
					</li>\
					<li>\
						<div class='scheduleTitle'></div>\
						<div class='scheduleTitle'>Vehicle</div>\
						<div class='scheduleTitle'>Stop Time</div>\
					</li>\
					<li>\
						<div class='scheduleValue'></div>\
						<div class='scheduleValue'>{3}</div>\
						<div class='scheduleValue'>{4}</div>\
					</li>\
				</ul>",
				(self.isReadMode() ? (pickUpAltsite ? pickUpAltsite.Name : "Home") : "Home"),
				(self.isReadMode() ? (pickUpSchedule ? (pickUpSchedule.Trip ? pickUpSchedule.Trip.Name : " ") : " ") : "25 AM Bayside"),
				(self.isReadMode() ? (pickUpTripStop ? (pickUpTripStop.Street ? pickUpTripStop.Street : " ") : " ") : "31 Spooner St"),
				(self.isReadMode() ? (pickUpSchedule ? (pickUpSchedule.Trip && pickUpSchedule.Trip.Vehicle ? pickUpSchedule.Trip.Vehicle.BusNum : " ") : " ") : "Ecto-1"),
				(self.isReadMode() ? (pickUpTripStop ? convertToMoment(pickUpTripStop.StopTime).format("LT") : " ") : "7:14:00 AM"));
		}
		if (!self.isReadMode() || dropOffTripStop)
		{
			dropOffItemDomString = String.format("\
				<ul class='list'>\
					<li>\
						<div class='scheduleTitle'>Dropoff</div>\
						<div class='scheduleTitle'>Trip Assignment</div>\
						<div class='scheduleTitle'>Stop Name</div>\
					</li>\
					<li>\
						<div class='scheduleValue'>{0}</div>\
						<div class='scheduleValue'>{1}</div>\
						<div class='scheduleValue'>{2}</div>\
					</li>\
					<li>\
						<div class='scheduleTitle'></div>\
						<div class='scheduleTitle'>Vehicle</div>\
						<div class='scheduleTitle'>Stop Time</div>\
					</li>\
					<li>\
						<div class='scheduleValue'></div>\
						<div class='scheduleValue'>{3}</div>\
						<div class='scheduleValue'>{4}</div>\
					</li>\
				</ul>",
				(self.isReadMode() ? (dropOffAltsite ? dropOffAltsite.Name : "Home") : "Home"),
				(self.isReadMode() ? (dropOffSchedule ? (dropOffSchedule.Trip ? dropOffSchedule.Trip.Name : " ") : " ") : "25 PM Bayside"),
				(self.isReadMode() ? (dropOffTripStop ? (dropOffTripStop.Street ? dropOffTripStop.Street : " ") : " ") : "31 Spooner St"),
				(self.isReadMode() ? (dropOffSchedule ? (dropOffSchedule.Trip && dropOffSchedule.Trip.Vehicle ? dropOffSchedule.Trip.Vehicle.BusNum : " ") : " ") : "Ecto-1"),
				(self.isReadMode() ? (dropOffTripStop ? convertToMoment(dropOffTripStop.StopTime).format("LT") : " ") : "3:50:00 PM"));
		}

		if (self.isReadMode())
		{
			if (!pickUpTripStop && !dropOffTripStop && !pickUpAltsite && !dropOffAltsite && count >= exceptions.length)
			{
				scheduleItemDomString = "<ul class='list no-data'>\
											<li>No schedule for this student</li>\
										</ul>";
				self.$el.find(".item-content.schedule-item").addClass("no-data");
				return scheduleItemDomString;
			}
			if (!pickUpAltsite && !pickUpTripStop)
			{
				pickUpItemDomString = "";
			}
			if (!dropOffAltsite && !dropOffTripStop)
			{
				dropOffItemDomString = "";
			}
			pickUpItemDomString += pickUpExceptionsItemDomString;
			dropOffItemDomString += dropOffExceptionsItemDomString;
			scheduleItemDomString += pickUpItemDomString + dropOffItemDomString;
			self.$el.find(".item-content.schedule-item").removeClass("no-data");
		}
		else
		{
			scheduleItemDomString += pickUpItemDomString + dropOffItemDomString;
		}
		return scheduleItemDomString;
	};

	ScheduleBlock.prototype._getFirstStudentScheduleBySession = function(modelEntity, sessionID)
	{
		if (modelEntity.StudentSchedules)
		{
			return Enumerable.From(modelEntity.StudentSchedules).FirstOrDefault(null, function(c) { return c.StudentRequirement.SessionID == sessionID; });
		}
	};

	ScheduleBlock.prototype.getStudentException = function(exceptions)
	{
		var dateString = "",
			returnData = [],
			weeks = ["Su", "M", "Tu", "W", "Th", "F", "Sa"];
		for (var i = 0; i < exceptions.length; i++)
		{
			var exception = exceptions[i];
			var weekString = "",
				weekSort = "";
			if (exception.Day1Flag)
			{
				weekString = weekString + weeks[0] + ",";
				weekSort += "1,";
			}
			if (exception.Day2Flag)
			{
				weekString = weekString + weeks[1] + ",";
				weekSort += "2,";
			}
			if (exception.Day3Flag)
			{
				weekString = weekString + weeks[2] + ",";
				weekSort += "3,";
			}
			if (exception.Day4Flag)
			{
				weekString = weekString + weeks[3] + ",";
				weekSort += "4,";
			}
			if (exception.Day5Flag)
			{
				weekString = weekString + weeks[4] + ",";
				weekSort += "5,";
			}
			if (exception.Day6Flag)
			{
				weekString = weekString + weeks[5] + ",";
				weekSort += "6,";
			}
			if (exception.Day7Flag)
			{
				weekString = weekString + weeks[6] + ",";
				weekSort += "7,";
			}
			weekString = weekString ? weekString.substr(0, weekString.length - 1) : "";
			weekSort = weekSort ? weekSort.substr(0, weekSort.length - 1) : "";
			var endString = "No End";
			if (exception.EndDate)
			{
				endString = moment(exception.EndDate).format('L');
			}
			dateString = moment(exception.StartDate).format('L') + ' - ' + endString;

			var exceptionObj = {
				"weekString": weekString,
				"dateString": dateString,
				"comment": exception.Comment,
				"TripStop": exception.TripStop,
				"ActionFlag": exception.ActionFlag
			};

			returnData.push({
				"action": exception.ActionFlag,
				"sort": weekSort,
				"value": exceptionObj
			});
		}
		return returnData;
	};

	ScheduleBlock.prototype.setVehicleOrStaffScheduleContent = function(entity, isResource)
	{
		var self = this,
			tripItemDomString = "",
			detailViewHelper = tf.helpers.detailViewHelper,
			weekDay, startTime, finishTime, description;
		if (entity)
		{
			weekDay = detailViewHelper.formatWeekDay(entity.Day);
			if (isResource)
			{
				description = entity.Description;
				startTime = entity.BeginTime;
				finishTime = entity.EndTime;
			}
			else
			{
				description = "Trip: " + entity.Name;
				startTime = entity.StartTime;
				finishTime = entity.FinishTime;
			}
		}

		tripItemDomString += String.format("\
			<ul class='list'>\
				<li>\
					<div class='scheduleTitle'>Week</div>\
					<div class='scheduleTitle'>StartTime</div>\
					<div class='scheduleTitle'>EndTime</div>\
				</li>\
				<li>\
					<div class='scheduleValue'>{0}</div>\
					<div class='scheduleValue'>{1}</div>\
					<div class='scheduleValue'>{2}</div>\
				</li>\
				<li>\
					<div class='scheduleTitle'></div>\
					<div class='scheduleTitle' style='flex-basis:67%'>Description</div>\
				</li>\
				<li>\
					<div class='scheduleValue'></div>\
					<div class='scheduleValue' style='flex-basis:67%'>{3}</div>\
				</li>\
			</ul>",
			(weekDay ? weekDay : (self.isReadMode() ? " " : "weekly")),
			(startTime ? convertToMoment(startTime).format("LT") : (self.isReadMode() ? " " : "07:23:00 AM")),
			(finishTime ? convertToMoment(finishTime).format("LT") : (self.isReadMode() ? " " : "07:32:00 PM")),
			(description ? description : (self.isReadMode() ? " " : "Trip: 110 AM IMS")));

		if (self.isReadMode())
		{
			if (!weekDay && !startTime && !finishTime && !description)
			{
				tripItemDomString = "<ul class='list no-data'><li>No schedule for this " + self.gridType + "</li></ul>";
				self.$el.find(".item-content.schedule-item").addClass("no-data");
			}
			else
			{
				self.$el.find(".item-content.schedule-item").removeClass("no-data");
			}
		}

		return tripItemDomString;
	};
})();