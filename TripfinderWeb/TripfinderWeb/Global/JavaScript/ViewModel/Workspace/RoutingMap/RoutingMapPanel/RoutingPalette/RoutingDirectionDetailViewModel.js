(function()
{
	createNamespace("TF.RoutingMap.RoutingPalette").RoutingDirectionDetailViewModel = RoutingDirectionDetailViewModel;

	function RoutingDirectionDetailViewModel(viewModel, readOnly)
	{
		this.viewModel = viewModel;
		this.readOnly = readOnly;
		this.routingDirectionHelper = new TF.RoutingMap.RoutingPalette.RoutingDirectionHelper();
		this.onStopChangeEvent = new TF.Events.Event();
		this.obDirectionDetails = ko.observableArray([]);
		this.onStopChangeEvent.subscribe(this.onStopChange.bind(this));
		this.tripStops;
		this.editSequence;
		this.currentDrivingDrections;
		this.$e;
	}

	RoutingDirectionDetailViewModel.prototype.init = function(viewModel, e)
	{
		let self = this;
		this.$e = $(e);
		this.$e.closest('.modal-body').on('click', (event) =>
		{
			if (self.$e.find('.edit-show').length === 0) return;
			if ($(event.target).closest('.edit-direction').length > 0) return;
			if (!!window.getSelection().toString()) return;
			self.updateDirection();
		});
		this.initTextArea();
	};

	RoutingDirectionDetailViewModel.prototype.initTextArea = function()
	{
		let self = this;

		/* 0-timeout to get the already changed text */
		var text = document.getElementById('edit-area');
		$('body').off().on('keydown', "textarea.edit-area.edit-direction", () =>
		{
			self.delayedResize();
		});
		if (text)
		{
			text.focus();
			text.select();
		}
		self.resize();
	}

	RoutingDirectionDetailViewModel.prototype.resize = function()
	{
		let $o = $(".directions-elementList").find('.edit-area.edit-show');
		if ($o.length > 0)
		{
			let text = $o[0];
			text.style.height = 'auto';
			text.style.height = text.scrollHeight + 'px';
		}
	}
	RoutingDirectionDetailViewModel.prototype.delayedResize = function()
	{
		window.setTimeout(this.resize, 0);
	}
	RoutingDirectionDetailViewModel.prototype.onStopChange = function(e, data)
	{
		if (data && data.tripStops && data.color)
		{
			this.tripStops = data.tripStops;
			this.refreshDirection(this.tripStops, data.color);
		}
	};

	RoutingDirectionDetailViewModel.prototype.refreshDirection = function(tripStops, color)
	{
		let directionDetails = this.routingDirectionHelper.getDirectionResult(tripStops, color);
		this.obDirectionDetails(directionDetails);
		this.totalDistance = this.routingDirectionHelper.getTotalDistance();
		this.totalTime = this.routingDirectionHelper.getTotalTime();
	};

	RoutingDirectionDetailViewModel.prototype.getTotalDistance = function()
	{
		return this.routingDirectionHelper.getTotalDistance();
	}

	RoutingDirectionDetailViewModel.prototype.getTotalTime = function()
	{
		return this.routingDirectionHelper.getTotalTime();
	}

	RoutingDirectionDetailViewModel.prototype.formatDistanceString = function(value)
	{
		return this.routingDirectionHelper.formatDistanceString(value);
	}

	RoutingDirectionDetailViewModel.prototype.formatTimeString = function(value)
	{
		return this.routingDirectionHelper.formatTimeString(value);
	}

	RoutingDirectionDetailViewModel.prototype.editDirectionClick = function(model, e)
	{
		if (this.readOnly)
		{
			return;
		}
		model.active(true);
		model.active.subscribe(function()
		{
			model.instruction(model.readOnlyArea() + model.editArea());
			let $inputText = $(e.currentTarget).find('.input-text');
			let $editText = $(e.currentTarget).find('.edit-text');
			if ($inputText.length > 0 && $editText.length > 0)
			{
				let editTextWidth = $editText.width();
				if (editTextWidth > 160 && editTextWidth < 400)
				{
					$inputText.width(editTextWidth + 4);
				}
				else if (editTextWidth > 400)
				{
					$inputText.width(400);
				}
			}
		});
	};

	RoutingDirectionDetailViewModel.prototype.applyDirection = function(tripStops)
	{
		let self = this;
		if (self.$e.find('.edit-show').length > 0)
		{
			// save editing direction
			self.updateDirection();
		}
		if (this.tripStops)
		{
			this.tripStops.map(function(tripStop)
			{
				let directions = self.obDirectionDetails(), length = directions.length, flag = false;
				for (let i = 0; i < length; i++)
				{
					let sequence = directions[i].sequence();
					if (sequence == tripStop.Sequence)
					{
						flag = true;
					}
					else if (sequence > tripStop.Sequence)
					{
						break;
					}

					if (flag)
					{
						if (tripStop.DrivingDirections != null)
						{
							if (directions[i].isCustomDirection())
							{
								tripStop.DrivingDirections = directions[i].editHtml();
								tripStop.IsCustomDirection = true;
							} else
							{
								tripStop.DrivingDirections = tripStop.DrivingDirections.replace(directions[i].text(), directions[i].instruction());
							}
						}
					}
				}
			});
		}
		if (tripStops)
		{
			tripStops.map(function(tripStop)
			{
				let length = self.tripStops.length;
				for (let i = 0; i < length; i++)
				{
					if (self.tripStops[i].id == tripStop.id)
					{
						tripStop.DrivingDirections = self.tripStops[i].DrivingDirections;
						tripStop.IsCustomDirection = self.tripStops[i].IsCustomDirection;
						break;
					}
				}
			});
		}
	};

	RoutingDirectionDetailViewModel.prototype.editTrip = function(model, data, e)
	{
		e.stopPropagation();
		let $o = $(e.target);
		if ($o.hasClass('disable'))
		{
			return;
		}
		model.$e.find('.edit-trip').removeClass('disable');
		if (model.$e.find('.edit-show').length > 0)
		{
			model.updateDirection();
		}

		$o.addClass('disable');
		data.showEditarea(true);
		model.editSequence = data.sequence();

		// set edit area content
		let $edit = model.$e.find('.edit-show');
		let tripStop = Enumerable.From(model.tripStops).Where(x => x.Sequence === model.editSequence).FirstOrDefault();
		model.currentStopDrivingDrections = tripStop && tripStop.DrivingDirections
		let isCustomDirection = tripStop && tripStop.IsCustomDirection;
		let html = !$edit.html() ? (isCustomDirection ? tf.measurementUnitConverter.unifyDirectionMeasurementUnit(tripStop.DrivingDirections, tf.measurementUnitConverter.isImperial()) : model.editArea()) : (isCustomDirection ? $edit.val() : model.editArea());
		$edit.val(html);
		model.hideDirections();
		model.resize();
		return false;
	}

	RoutingDirectionDetailViewModel.prototype.updateDirection = function()
	{
		let editValue = this.$e.find('.edit-show').val();
		let directions = this.obDirectionDetails();
		this.showDirections();
		this.$e.find('.edit-trip').removeClass('disable');
		if (editValue === this.editArea())
		{
			directions.forEach(item =>
			{
				item.showEditarea(false);
			});
			return;
		}

		let currentStopIndex = directions.findIndex(item => item.sequence() === this.editSequence);
		let nextStopIndex = directions.findIndex(item => item.sequence() === (this.editSequence + 1));
		let obj = new TF.DataModel.DirectionDetailDataModel();
		obj.showEditarea(false);
		obj.isCustomDirection(true);
		obj.editHtml(!!editValue ? editValue : '');
		obj.editareaHeight(`${this.$e.find('.edit-show').height()}px`);
		obj.sequence('');
		directions.splice(currentStopIndex + 1, nextStopIndex - currentStopIndex - 1, obj);
		directions.forEach(item =>
		{
			item.showEditarea(false);
		});
		this.obDirectionDetails(directions);
		this.updateStops(editValue);
		$("textarea.custom-text").off().on('keydown', () => false);
	}

	RoutingDirectionDetailViewModel.prototype.updateStops = function(editValue)
	{
		this.tripStops.forEach(tripstop =>
		{
			if (tripstop.Sequence === this.editSequence)
			{
				tripstop.IsCustomDirection = true;
				tripstop.DrivingDirections = editValue;
			}
		});
	}

	RoutingDirectionDetailViewModel.prototype.editArea = function()
	{
		let directions = this.obDirectionDetails();
		let currentStopIndex = directions.findIndex(item => item.sequence() === this.editSequence);
		let nextStopIndex = directions.findIndex(item => item.sequence() === (this.editSequence + 1));
		let edit = directions.slice(currentStopIndex + 1, nextStopIndex);
		if (edit.length > 0)
		{
			return edit.reduce((prev, item) => prev.concat(!item.distance() ? `${item.readOnlyArea()} ${item.editArea()}` : `${item.readOnlyArea()} ${item.editArea()}\n${item.distance()}`), []).join('\n');
		}
		return '';
	}

	RoutingDirectionDetailViewModel.prototype.hideDirections = function()
	{
		let directions = this.obDirectionDetails();
		let currentStopIndex = directions.findIndex(item => item.sequence() === this.editSequence);
		let nextStopIndex = directions.findIndex(item => item.sequence() === (this.editSequence + 1));
		this.$e.find('.directions-element').each((index, item) =>
		{
			if (index > currentStopIndex && index < nextStopIndex)
			{
				$(item).hide();
			}
		});
	}

	RoutingDirectionDetailViewModel.prototype.showDirections = function()
	{
		let directions = this.obDirectionDetails();
		let currentStopIndex = directions.findIndex(item => item.sequence() === this.editSequence);
		let nextStopIndex = directions.findIndex(item => item.sequence() === (this.editSequence + 1));
		this.$e.find('.directions-element').each((index, item) =>
		{
			if (index > currentStopIndex && index < nextStopIndex)
			{
				$(item).show();
			}
		});
	}

})();